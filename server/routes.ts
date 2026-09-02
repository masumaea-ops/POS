import { Router } from 'express';
import { checkDbStatus, getDbPool } from './db';
import { migrateAndSeedDatabase } from './seeder';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Database status check
router.get('/db/status', async (req, res) => {
  try {
    const status = await checkDbStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ connected: false, error: err.message });
  }
});

// Manually trigger DB migration & seeding
router.post('/db/seed', async (req, res) => {
  try {
    const result = await migrateAndSeedDatabase();
    if (result.success) {
      const status = await checkDbStatus();
      res.json({ success: true, message: result.message, status });
    } else {
      res.status(400).json({ success: false, message: result.message });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch products from MySQL (with fallback if DB offline)
router.get('/products', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'Database offline / unconfigured' });
    }
    const [rows] = await pool.query('SELECT * FROM products WHERE is_active = TRUE ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch customers from MySQL
router.get('/customers', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'Database offline / unconfigured' });
    }
    const [rows] = await pool.query('SELECT * FROM customers WHERE is_active = TRUE ORDER BY id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch chart of accounts
router.get('/accounting/accounts', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'Database offline / unconfigured' });
    }
    const [rows] = await pool.query('SELECT * FROM chart_of_accounts ORDER BY account_code ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch garage branches
router.get('/garage/branches', async (req, res) => {
  try {
    const pool = await getDbPool();
    if (!pool) {
      return res.status(503).json({ error: 'Database offline / unconfigured' });
    }
    const [rows] = await pool.query('SELECT * FROM garage_branches ORDER BY branch_id ASC');
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
