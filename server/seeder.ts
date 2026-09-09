import bcrypt from 'bcryptjs';
import { getDbPool } from './db';
import { CREATE_TABLES_SQL } from './schema';

export async function migrateAndSeedDatabase() {
  const pool = await getDbPool();
  if (!pool) {
    console.warn('[Seeder] Skipping DB migration: MySQL is not connected or reachable.');
    return { success: false, message: 'MySQL is not connected' };
  }

  const connection = await pool.getConnection();
  try {
    console.log('[Seeder] Initializing database schema & tables...');
    
    // 1. Execute DDL statements
    const statements = CREATE_TABLES_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      await connection.query(stmt);
    }
    console.log('[Seeder] All MySQL tables verified / created successfully.');

    // 2. Seed System Settings if not present
    const [settingsCount]: any = await connection.query('SELECT COUNT(*) as count FROM system_settings');
    if (settingsCount[0].count === 0) {
      console.log('[Seeder] Seeding default system settings...');
      await connection.query(`
        INSERT INTO system_settings (
          corp_name, corp_short_name, tagline, tax_pin, phone, email, address,
          currency, vat_rate, timezone, etims_enabled, etims_device_serial, etims_branch_code
        ) VALUES (
          'Masuma Auto Parts East Africa Ltd',
          'Masuma',
          'High Precision Japanese & European Spare Parts',
          'P051234567X',
          '+254 700 000 000',
          'billing@masuma.co.ke',
          'Masuma Complex, Commercial St, Industrial Area, Nairobi, Kenya',
          'KES',
          16.00,
          'Africa/Nairobi',
          TRUE,
          'MASUMA-TIMS-NRB-01',
          'HQ-01'
        )
      `);
    }

    // 3. Seed Users with Bcrypt Cryptographic Hashes
    const [usersCount]: any = await connection.query('SELECT COUNT(*) as count FROM users');
    if (usersCount[0].count === 0) {
      console.log('[Seeder] Seeding default user accounts with Bcrypt encryption...');
      
      const adminHash = bcrypt.hashSync('admin123', 10);
      const cashierHash = bcrypt.hashSync('cashier123', 10);
      const workshopHash = bcrypt.hashSync('garage123', 10);
      const managerHash = bcrypt.hashSync('manager123', 10);
      const accountantHash = bcrypt.hashSync('accountant123', 10);
      const auditorHash = bcrypt.hashSync('auditor123', 10);

      await connection.query(`
        INSERT INTO users (username, email, password_hash, salt, pin_code, full_name, role) VALUES
        ('admin', 'admin@masuma.co.ke', ?, 'bcrypt_salt_10', '1234', 'System Administrator', 'admin'),
        ('masumaea', 'masumaea@gmail.com', ?, 'bcrypt_salt_10', '1111', 'Masuma EA Executive', 'admin'),
        ('cashier', 'cashier@masuma.co.ke', ?, 'bcrypt_salt_10', '0000', 'POS Terminal Cashier', 'cashier'),
        ('workshop', 'garage@masuma.co.ke', ?, 'bcrypt_salt_10', '9999', 'Workshop Chief Engineer', 'workshop'),
        ('manager', 'manager@masuma.co.ke', ?, 'bcrypt_salt_10', '5555', 'Regional Operations Manager', 'manager'),
        ('accountant', 'accountant@masuma.co.ke', ?, 'bcrypt_salt_10', '4444', 'Grace Muthoni (Head Accountant)', 'accountant'),
        ('auditor', 'auditor@masuma.co.ke', ?, 'bcrypt_salt_10', '7777', 'Bernard Kilonzo (Internal Auditor)', 'auditor')
      `, [adminHash, adminHash, cashierHash, workshopHash, managerHash, accountantHash, auditorHash]);
    } else {
      // Automatic Upgrade: If users exist but passwords are unencrypted (e.g., from earlier seeds), encrypt them with bcrypt immediately
      const [existingUsers]: any = await connection.query('SELECT id, username, email, password_hash FROM users');
      for (const u of existingUsers) {
        if (!u.password_hash || (!u.password_hash.startsWith('$2a$') && !u.password_hash.startsWith('$2b$'))) {
          console.log(`[Seeder] Upgrading unencrypted password for user "${u.username}" to secure Bcrypt hash...`);
          const upgradedHash = bcrypt.hashSync(u.password_hash || 'admin123', 10);
          await connection.query('UPDATE users SET password_hash = ? WHERE id = ?', [upgradedHash, u.id]);
        }
      }

      // Check if user's admin email masumaea@gmail.com exists, otherwise insert or link
      const [userEmailCheck]: any = await connection.query('SELECT id FROM users WHERE email = ? OR username = ?', ['masumaea@gmail.com', 'masumaea']);
      if (userEmailCheck.length === 0) {
        const adminHash = bcrypt.hashSync('admin123', 10);
        await connection.query(`
          INSERT INTO users (username, email, password_hash, salt, pin_code, full_name, role) VALUES
          ('masumaea', 'masumaea@gmail.com', ?, 'bcrypt_salt_10', '1234', 'Masuma EA Executive', 'admin')
        `, [adminHash]);
      }
    }

    // 4. Seed Products if empty
    const [prodCount]: any = await connection.query('SELECT COUNT(*) as count FROM products');
    if (prodCount[0].count === 0) {
      console.log('[Seeder] Seeding autoparts catalog...');
      await connection.query(`
        INSERT INTO products (sku, name, brand, category, oem_code, barcode, bin_location, cost_price, wholesale_price, retail_price, stock_on_hand, min_reorder_level) VALUES
        ('MS-BP-001', 'Front Brake Pads Set (Ceramic)', 'Masuma', 'Braking', '04465-0K150', '8901234567890', 'WH1-A3-Shelf2', 3800.00, 4675.00, 5500.00, 45, 15),
        ('MS-OF-002', 'Engine Oil Filter Heavy Duty', 'Masuma', 'Filtration', '90915-YZZD2', '8901234567891', 'WH1-B1-Shelf1', 750.00, 1020.00, 1200.00, 120, 20),
        ('MS-SP-003', 'Iridium Tough Spark Plug', 'Denso', 'Ignition', '90919-01247', '8901234567892', 'WH1-A1-Shelf3', 1700.00, 2125.00, 2500.00, 80, 10),
        ('MS-AF-004', 'Air Intake Filter', 'Masuma', 'Filtration', '17801-0C010', '8901234567893', 'WH1-C2-Shelf4', 1100.00, 1530.00, 1800.00, 25, 10),
        ('MS-WB-005', 'Aerotwin Wiper Blade Pair', 'Bosch', 'Wipers', 'A297S-BOSCH', '8901234567894', 'WH2-A2-Shelf1', 1900.00, 2550.00, 3000.00, 35, 8),
        ('MS-SB-006', 'Excel-G Gas Shock Absorber', 'KYB', 'Suspension', '48510-09L20', '8901234567895', 'WH2-C1-Shelf2', 5900.00, 7225.00, 8500.00, 18, 8),
        ('MS-BL-007', 'X-tremeVision Pro150 Bulb H4', 'Philips', 'Lighting', '90981-13043', '8901234567896', 'WH1-B2-Shelf3', 450.00, 680.00, 800.00, 60, 15),
        ('MS-TP-008', 'Precision Steering Tie Rod End', 'Masuma', 'Steering', '45046-09250', '8901234567897', 'WH1-D4-Shelf1', 2800.00, 3570.00, 4200.00, 30, 10),
        ('MS-CF-009', 'Active Carbon Cabin Air Filter', 'Masuma', 'Filtration', '87139-30040', '8901234567898', 'WH1-C1-Shelf3', 950.00, 1275.00, 1500.00, 40, 12),
        ('MS-BT-012', 'Heavy Duty Lead Battery Terminal', 'Generic', 'Electrical', 'BT-GEN-01', '8901234567899', 'WH1-E1-Shelf1', 250.00, 425.00, 500.00, 150, 20)
      `);
    }

    // 5. Seed Chart of Accounts if empty
    const [coaCount]: any = await connection.query('SELECT COUNT(*) as count FROM chart_of_accounts');
    if (coaCount[0].count === 0) {
      console.log('[Seeder] Seeding Chart of Accounts ledger...');
      await connection.query(`
        INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, balance) VALUES
        ('1010', 'Cash on Hand (POS Drawers)', 'Asset', 'Nairobi & Mombasa Counter Cash Drawers', 150000.00),
        ('1020', 'M-Pesa Working Capital Account', 'Asset', 'Safaricom Paybill & Till Collections', 420000.00),
        ('1030', 'KCB Bank Operating Account', 'Asset', 'Commercial Banking & Supplier Transfers', 1850000.00),
        ('1200', 'Accounts Receivable (Trade Debtors)', 'Asset', 'B2B Wholesale Garage Credit Balances', 680000.00),
        ('1300', 'Spare Parts Inventory Stock', 'Asset', 'Warehouse Valuation of Auto Spare Parts', 3500000.00),
        ('2010', 'Accounts Payable (Suppliers/Imports)', 'Liability', 'Trade Creditors and Import LC Payables', 940000.00),
        ('2020', 'KRA VAT Output Tax Payable (16%)', 'Liability', 'Statutory Sales Tax for KRA eTIMS', 142000.00),
        ('3010', 'Retained Earnings & Capital', 'Equity', 'Shareholders Paid-in Capital', 4500000.00),
        ('4010', 'Parts Counter Sales Revenue', 'Revenue', 'Direct B2C & B2B Parts Sales', 0.00),
        ('4020', 'Garage Diagnostic & Labor Revenue', 'Revenue', 'Workshop Repair & Service Revenue', 0.00),
        ('5010', 'Cost of Goods Sold (COGS)', 'Expense', 'Cost of Auto Parts Sold', 0.00),
        ('5020', 'Workshop Consumables & Freight', 'Expense', 'Garage Operational Expenses', 0.00)
      `);
    }

    // 6. Seed Customers if empty
    const [custCount]: any = await connection.query('SELECT COUNT(*) as count FROM customers');
    if (custCount[0].count === 0) {
      console.log('[Seeder] Seeding B2B customers and retail defaults...');
      await connection.query(`
        INSERT INTO customers (name, company_name, customer_type, tier, phone, email, kra_pin, credit_limit, outstanding_balance, shipping_address) VALUES
        ('Walk-In Cash Customer', 'Retail Counter', 'Cash', 'Retail', '+254 700 000 000', 'cash@masuma.co.ke', 'P051234567A', 0.00, 0.00, 'Nairobi CBD Counter Pickup'),
        ('John Doe', 'John Doe Motors (JDM Workshop)', 'Credit', 'Wholesale A', '+254 712 345 678', 'john@jdmotors.co.ke', 'P001928374B', 250000.00, 145000.00, 'Workshop 4, Baricho Rd, Industrial Area, Nairobi'),
        ('Jane Smith', 'Jane Smith Auto Garage Ltd', 'Credit', 'Wholesale B', '+254 787 654 321', 'jane@jsgarage.co.ke', 'P011223344C', 120000.00, 88000.00, 'Ngong Road, Opp. Junction Mall, Nairobi'),
        ('AutoFix Solutions Ltd', 'AutoFix Fleet & Diagnostics', 'Credit', 'Wholesale A', '+254 722 000 111', 'procurement@autofix.co.ke', 'A009988776Z', 500000.00, 310000.00, 'Enterprise Road, Plot 12, Industrial Area, Nairobi')
      `);
    }

    // 7. Seed Garage Branches if empty
    const [branchCount]: any = await connection.query('SELECT COUNT(*) as count FROM garage_branches');
    if (branchCount[0].count === 0) {
      console.log('[Seeder] Seeding garage branches network...');
      await connection.query(`
        INSERT INTO garage_branches (branch_id, name, city, address, phone, manager_name, total_bays, active_jobs) VALUES
        ('GAR-NRB-01', 'Nairobi Central Flagship Auto Care', 'Nairobi', 'Commercial Street, Off Enterprise Rd, Industrial Area', '+254 711 098 701', 'David Ochieng', 8, 5),
        ('GAR-MSA-02', 'Mombasa Coastal Motors & Diagnostics', 'Mombasa', 'Mbaraki Rd, Near Port Gate 3, Shimanzi', '+254 711 098 702', 'Amina Hassan', 6, 3),
        ('GAR-NKR-03', 'Nakuru Highway Express Bay', 'Nakuru', 'Nakuru-Eldoret Highway, Opp. Westside Mall', '+254 711 098 703', 'Peter Kamau', 4, 2),
        ('GAR-KSM-04', 'Kisumu Lake Basin Auto Hub', 'Kisumu', 'Oginga Odinga Rd, Near Central Bus Park', '+254 711 098 704', 'Otieno Owino', 5, 1)
      `);
    }

    // 8. Seed Suppliers if empty
    const [suppCount]: any = await connection.query('SELECT COUNT(*) as count FROM suppliers');
    if (suppCount[0].count === 0) {
      console.log('[Seeder] Seeding autoparts suppliers...');
      await connection.query(`
        INSERT INTO suppliers (name, contact_person, email, phone, country, address) VALUES
        ('Masuma Auto Spare Parts Co. Japan', 'Yuki Tanaka', 'y.tanaka@masuma.jp', '+81 3-1234-5678', 'Japan', 'Tokyo Chuo-ku Ginza 1-1'),
        ('Denso Global Aftermarket Division', 'Mike Johnson', 'mike.j@denso.com', '+1 248-350-7500', 'Japan / USA', 'Southfield, Michigan'),
        ('Bosch Automotive Aftermarket GmbH', 'Klaus Schmidt', 'k.schmidt@bosch.de', '+49 711 811-0', 'Germany', 'Gerlingen-Schillerhöhe')
      `);
    }

    console.log('[Seeder] Database migration and seeding completed successfully!');
    return { success: true, message: 'All tables verified and seeded successfully' };
  } catch (error: any) {
    console.error('[Seeder] Migration/Seeding error:', error);
    return { success: false, message: error.message || 'Error executing seed' };
  } finally {
    connection.release();
  }
}
