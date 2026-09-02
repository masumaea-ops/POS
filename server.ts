import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import apiRoutes from "./server/routes";
import { migrateAndSeedDatabase } from "./server/seeder";
import { getDbPool } from "./server/db";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes mounted FIRST
  app.use("/api", apiRoutes);

  // Background DB init & seed check on server boot
  setTimeout(async () => {
    try {
      const pool = await getDbPool();
      if (pool) {
        console.log("[Server] Checking and auto-migrating/seeding MySQL tables...");
        await migrateAndSeedDatabase();
      } else {
        console.log("[Server] Standalone / client-ready mode active. (MySQL server unconfigured or offline)");
      }
    } catch (e: any) {
      console.warn("[Server] DB auto-seed status:", e.message);
    }
  }, 1000);

  // Vite middleware for development vs static production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
