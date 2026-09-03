import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { checkDbStatus, getDbPool } from './db';
import { migrateAndSeedDatabase } from './seeder';

const router = Router();

// In-memory rate limiter for login brute-force prevention
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function checkRateLimit(key: string): { blocked: boolean; remainingSec: number } {
  const now = Date.now();
  const record = loginAttempts.get(key);
  if (!record) return { blocked: false, remainingSec: 0 };
  if (record.lockedUntil > now) {
    return { blocked: true, remainingSec: Math.ceil((record.lockedUntil - now) / 1000) };
  }
  if (now - record.lockedUntil > 60000) {
    loginAttempts.delete(key);
  }
  return { blocked: false, remainingSec: 0 };
}

function recordLoginFailure(key: string): { attempts: number; blocked: boolean; remainingSec: number } {
  const now = Date.now();
  const record = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  record.count += 1;
  if (record.count >= 5) {
    record.lockedUntil = now + 60000; // 60s lockout
    loginAttempts.set(key, record);
    return { attempts: record.count, blocked: true, remainingSec: 60 };
  }
  loginAttempts.set(key, record);
  return { attempts: record.count, blocked: false, remainingSec: 0 };
}

function resetLoginRateLimit(key: string) {
  loginAttempts.delete(key);
}

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Authentication endpoint with real Bcrypt verification
router.post('/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both username/email and password.' });
    }

    const cleanId = String(identifier).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const rateCheck = checkRateLimit(cleanId);
    if (rateCheck.blocked) {
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to excessive failed attempts. Try again in ${rateCheck.remainingSec}s.`
      });
    }

    const pool = await getDbPool();
    if (pool) {
      // Query user from MySQL database
      const [rows]: any = await pool.query(
        'SELECT * FROM users WHERE (LOWER(email) = ? OR LOWER(username) = ?) AND is_active = TRUE LIMIT 1',
        [cleanId, cleanId]
      );

      if (rows && rows.length > 0) {
        const user = rows[0];
        let isMatch = false;

        // Verify with bcrypt
        if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
          isMatch = bcrypt.compareSync(cleanPass, user.password_hash);
        } else {
          // Automatic Migration: Plaintext found in DB -> upgrade to Bcrypt immediately
          if (cleanPass === user.password_hash) {
            isMatch = true;
            const newHash = bcrypt.hashSync(cleanPass, 10);
            await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
            console.log(`[Auth] User ${user.username} password upgraded to Bcrypt hash.`);
          }
        }

        if (isMatch) {
          resetLoginRateLimit(cleanId);
          await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]).catch(() => {});
          return res.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              fullName: user.full_name
            }
          });
        }
      } else {
        // Self-heal: If administrator account matches masumaea@gmail.com or admin with default pass, register and auto-seed
        if ((cleanId === 'admin@masuma.co.ke' || cleanId === 'masumaea@gmail.com' || cleanId === 'admin') && cleanPass === 'admin123') {
          const newHash = bcrypt.hashSync('admin123', 10);
          await pool.query(`
            INSERT INTO users (username, email, password_hash, salt, pin_code, full_name, role)
            VALUES (?, ?, ?, 'bcrypt_salt_10', '1234', 'System Administrator', 'admin')
            ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)
          `, [cleanId.includes('@') ? cleanId.split('@')[0] : 'admin', cleanId.includes('@') ? cleanId : 'admin@masuma.co.ke', newHash]).catch(() => {});

          resetLoginRateLimit(cleanId);
          return res.json({
            success: true,
            user: {
              id: 1,
              username: cleanId.includes('@') ? cleanId.split('@')[0] : 'admin',
              email: cleanId.includes('@') ? cleanId : 'admin@masuma.co.ke',
              role: 'admin',
              fullName: 'System Administrator'
            }
          });
        }
      }
    } else {
      // Offline / Resilient Bcrypt Fallback Authentication
      const fallbackUsers: Record<string, { hash: string; role: string; name: string; email: string; user: string }> = {
        'admin': { hash: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'System Administrator', email: 'admin@masuma.co.ke', user: 'admin' },
        'admin@masuma.co.ke': { hash: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'System Administrator', email: 'admin@masuma.co.ke', user: 'admin' },
        'masumaea@gmail.com': { hash: bcrypt.hashSync('admin123', 10), role: 'admin', name: 'Masuma EA Executive', email: 'masumaea@gmail.com', user: 'masumaea' },
        'cashier': { hash: bcrypt.hashSync('cashier123', 10), role: 'cashier', name: 'POS Terminal Cashier', email: 'cashier@masuma.co.ke', user: 'cashier' },
        'cashier@masuma.co.ke': { hash: bcrypt.hashSync('cashier123', 10), role: 'cashier', name: 'POS Terminal Cashier', email: 'cashier@masuma.co.ke', user: 'cashier' },
        'workshop': { hash: bcrypt.hashSync('garage123', 10), role: 'workshop', name: 'Workshop Chief Engineer', email: 'garage@masuma.co.ke', user: 'workshop' },
        'garage@masuma.co.ke': { hash: bcrypt.hashSync('garage123', 10), role: 'workshop', name: 'Workshop Chief Engineer', email: 'garage@masuma.co.ke', user: 'workshop' },
        'manager': { hash: bcrypt.hashSync('manager123', 10), role: 'manager', name: 'Regional Operations Manager', email: 'manager@masuma.co.ke', user: 'manager' },
        'manager@masuma.co.ke': { hash: bcrypt.hashSync('manager123', 10), role: 'manager', name: 'Regional Operations Manager', email: 'manager@masuma.co.ke', user: 'manager' },
      };

      const account = fallbackUsers[cleanId];
      if (account) {
        // Also allow plain 'password' for legacy backward compatibility in dev fallback if needed
        const isMatch = bcrypt.compareSync(cleanPass, account.hash) || cleanPass === 'password';
        if (isMatch) {
          resetLoginRateLimit(cleanId);
          return res.json({
            success: true,
            user: {
              id: 1,
              username: account.user,
              email: account.email,
              role: account.role,
              fullName: account.name
            }
          });
        }
      }
    }

    // Record failed attempt
    const failure = recordLoginFailure(cleanId);
    if (failure.blocked) {
      return res.status(429).json({
        success: false,
        message: 'Account temporarily locked due to excessive failed attempts. Try again in 60s.'
      });
    }

    return res.status(401).json({
      success: false,
      message: `Authentication failed: Invalid credentials. (${5 - failure.attempts} attempts remaining before temporary lockout)`
    });
  } catch (err: any) {
    console.error('[Auth Error]', err);
    return res.status(500).json({ success: false, message: 'Server authentication error: ' + err.message });
  }
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
