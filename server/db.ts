import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool: mysql.Pool | null = null;
let isConnected = false;
let lastError: string | null = null;

export function getDbConfig() {
  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'masuma_erp_production',
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20', 10),
    queueLimit: 0,
    connectTimeout: 5000,
    multipleStatements: true,
  };
}

export async function getDbPool(): Promise<mysql.Pool | null> {
  if (pool) return pool;

  const config = getDbConfig();
  try {
    pool = mysql.createPool(config);
    // Test connection with a ping
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    isConnected = true;
    lastError = null;
    console.log(`[MySQL] Successfully connected to ${config.database}@${config.host}:${config.port}`);
    return pool;
  } catch (err: any) {
    isConnected = false;
    lastError = err.message || 'Failed to connect to MySQL';
    console.warn(`[MySQL] Connection standby/offline: ${lastError}`);
    pool = null;
    return null;
  }
}

export async function checkDbStatus() {
  const config = getDbConfig();
  try {
    const currentPool = await getDbPool();
    if (!currentPool) {
      return {
        connected: false,
        host: config.host,
        port: config.port,
        database: config.database,
        user: config.user,
        error: lastError || 'Could not establish connection to MySQL server',
      };
    }

    const [rows]: any = await currentPool.query('SHOW TABLES');
    const tableNames = rows.map((r: any) => Object.values(r)[0]);

    return {
      connected: true,
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      tablesCount: tableNames.length,
      tables: tableNames,
      error: null,
    };
  } catch (err: any) {
    return {
      connected: false,
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      error: err.message,
    };
  }
}
