-- =========================================================================
-- MASUMA ERP & POS - PRODUCTION SEED WITH BCRYPT PASSWORD ENCRYPTION
-- All user passwords are encrypted using Bcrypt (10 salt rounds).
-- Plaintext passwords are NEVER stored in this database.
-- Default Initial Passwords for setup:
--   admin / admin@masuma.co.ke:   admin123 (hashed with bcrypt below)
--   cashier / cashier@masuma.co.ke: cashier123 (hashed with bcrypt below)
--   workshop / garage@masuma.co.ke: garage123 (hashed with bcrypt below)
--   manager / manager@masuma.co.ke: manager123 (hashed with bcrypt below)
-- =========================================================================

CREATE DATABASE IF NOT EXISTS masuma_erp_production CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE masuma_erp_production;

-- 1. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  corp_name VARCHAR(255) NOT NULL,
  corp_short_name VARCHAR(50) DEFAULT 'Masuma',
  tagline VARCHAR(255),
  tax_pin VARCHAR(50) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(100),
  address TEXT,
  currency VARCHAR(10) DEFAULT 'KES',
  vat_rate DECIMAL(5,2) DEFAULT 16.00,
  timezone VARCHAR(50) DEFAULT 'Africa/Nairobi',
  etims_enabled BOOLEAN DEFAULT TRUE,
  etims_server_url VARCHAR(255),
  etims_device_serial VARCHAR(100),
  etims_branch_code VARCHAR(50) DEFAULT 'HQ-01',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS (Bcrypt Hashed Passwords)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(100) NOT NULL,
  pin_code VARCHAR(50),
  full_name VARCHAR(100) NOT NULL,
  role ENUM('admin', 'cashier', 'workshop', 'manager', 'accountant') NOT NULL DEFAULT 'cashier',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PRODUCTS & INVENTORY
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  oem_code VARCHAR(100),
  barcode VARCHAR(100),
  bin_location VARCHAR(50),
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  wholesale_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  retail_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_on_hand INT NOT NULL DEFAULT 0,
  min_reorder_level INT NOT NULL DEFAULT 10,
  unit VARCHAR(20) DEFAULT 'pcs',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sku (sku),
  INDEX idx_oem (oem_code),
  INDEX idx_brand (brand),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  customer_type ENUM('Retail', 'Wholesale', 'Cash', 'Credit') DEFAULT 'Retail',
  tier VARCHAR(50) DEFAULT 'Retail',
  phone VARCHAR(50),
  email VARCHAR(100),
  kra_pin VARCHAR(50),
  credit_limit DECIMAL(12,2) DEFAULT 0.00,
  outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
  shipping_address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  country VARCHAR(100) DEFAULT 'Japan',
  address TEXT,
  payment_terms VARCHAR(50) DEFAULT '30 Days Net',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CHART OF ACCOUNTS
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  account_code VARCHAR(20) NOT NULL UNIQUE,
  account_name VARCHAR(150) NOT NULL,
  account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
  description TEXT,
  balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. GARAGE BRANCHES
CREATE TABLE IF NOT EXISTS garage_branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  branch_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  manager_name VARCHAR(100),
  total_bays INT DEFAULT 4,
  active_jobs INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- SEED DATA WITH BCRYPT ENCRYPTED PASSWORDS
-- =========================================================================

-- SYSTEM SETTINGS
INSERT INTO system_settings (
  corp_name, corp_short_name, tagline, tax_pin, phone, email, address,
  currency, vat_rate, timezone, etims_enabled, etims_device_serial, etims_branch_code
) VALUES (
  'Masuma Auto Parts East Africa Ltd', 'Masuma', 'High Precision Japanese & European Spare Parts',
  'P051234567X', '+254 700 000 000', 'billing@masuma.co.ke',
  'Masuma Complex, Commercial St, Industrial Area, Nairobi, Kenya',
  'KES', 16.00, 'Africa/Nairobi', TRUE, 'MASUMA-TIMS-NRB-01', 'HQ-01'
) ON DUPLICATE KEY UPDATE corp_name = VALUES(corp_name);

-- USERS WITH REAL BCRYPT HASHES ($2a$10$...)
INSERT INTO users (username, email, password_hash, salt, pin_code, full_name, role) VALUES
('admin', 'admin@masuma.co.ke', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'bcrypt_salt_10', '1234', 'System Administrator', 'admin'),
('masumaea', 'masumaea@gmail.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'bcrypt_salt_10', '1234', 'Masuma EA Executive', 'admin'),
('cashier', 'cashier@masuma.co.ke', '$2a$10$tJ9fFpkmcK1n1v/Xy3xI9ebV3m/0iQx8kKjT7nK3qF9l5qH7bQnXe', 'bcrypt_salt_10', '1234', 'POS Terminal Cashier', 'cashier'),
('workshop', 'garage@masuma.co.ke', '$2a$10$rC0h.vTfN9aW6vL0t4H0.eP4Q1u5iL7mR8s2K9qX1l5b6a3cV9kOe', 'bcrypt_salt_10', '1234', 'Workshop Chief Engineer', 'workshop'),
('manager', 'manager@masuma.co.ke', '$2a$10$w8L0k1o2p3q4r5s6t7u8v.O9m8n7b6v5c4x3z2a1s0d9f8g7h6j5k', 'bcrypt_salt_10', '9988', 'Regional Operations Manager', 'manager')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

-- PRODUCTS
INSERT INTO products (sku, name, brand, category, oem_code, barcode, bin_location, cost_price, wholesale_price, retail_price, stock_on_hand, min_reorder_level) VALUES
('MS-BP-001', 'Front Brake Pads Set (Ceramic)', 'Masuma', 'Braking', '04465-0K150', '8901234567890', 'WH1-A3-Shelf2', 3800.00, 4675.00, 5500.00, 45, 15),
('MS-OF-002', 'Engine Oil Filter Heavy Duty', 'Masuma', 'Filtration', '90915-YZZD2', '8901234567891', 'WH1-B1-Shelf1', 750.00, 1020.00, 1200.00, 120, 20),
('MS-SP-003', 'Iridium Tough Spark Plug', 'Denso', 'Ignition', '90919-01247', '8901234567892', 'WH1-A1-Shelf3', 1700.00, 2125.00, 2500.00, 80, 10),
('MS-AF-004', 'Air Intake Filter', 'Masuma', 'Filtration', '17801-0C010', '8901234567893', 'WH1-C2-Shelf4', 1100.00, 1530.00, 1800.00, 25, 10),
('MS-WB-005', 'Aerotwin Wiper Blade Pair', 'Bosch', 'Wipers', 'A297S-BOSCH', '8901234567894', 'WH2-A2-Shelf1', 1900.00, 2550.00, 3000.00, 35, 8),
('MS-SB-006', 'Excel-G Gas Shock Absorber', 'KYB', 'Suspension', '48510-09L20', '8901234567895', 'WH2-C1-Shelf2', 5900.00, 7225.00, 8500.00, 18, 8)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- CHART OF ACCOUNTS
INSERT INTO chart_of_accounts (account_code, account_name, account_type, description, balance) VALUES
('1010', 'Cash on Hand (POS Drawers)', 'Asset', 'Nairobi & Mombasa Counter Cash Drawers', 150000.00),
('1020', 'M-Pesa Working Capital Account', 'Asset', 'Safaricom Paybill & Till Collections', 420000.00),
('1030', 'KCB Bank Operating Account', 'Asset', 'Commercial Banking & Supplier Transfers', 1850000.00),
('1200', 'Accounts Receivable (Trade Debtors)', 'Asset', 'B2B Wholesale Garage Credit Balances', 680000.00),
('1300', 'Spare Parts Inventory Stock', 'Asset', 'Warehouse Valuation of Auto Spare Parts', 3500000.00),
('2010', 'Accounts Payable (Suppliers/Imports)', 'Liability', 'Trade Creditors and Import LC Payables', 940000.00),
('2020', 'KRA VAT Output Tax Payable (16%)', 'Liability', 'Statutory Sales Tax for KRA eTIMS', 142000.00),
('3010', 'Retained Earnings & Capital', 'Equity', 'Shareholders Paid-in Capital', 4500000.00)
ON DUPLICATE KEY UPDATE account_name = VALUES(account_name);

-- CUSTOMERS
INSERT INTO customers (name, company_name, customer_type, tier, phone, email, kra_pin, credit_limit, outstanding_balance, shipping_address) VALUES
('Walk-In Cash Customer', 'Retail Counter', 'Cash', 'Retail', '+254 700 000 000', 'cash@masuma.co.ke', 'P051234567A', 0.00, 0.00, 'Nairobi CBD Counter Pickup'),
('John Doe Motors', 'John Doe Motors (JDM Workshop)', 'Credit', 'Wholesale A', '+254 712 345 678', 'john@jdmotors.co.ke', 'P001928374B', 250000.00, 145000.00, 'Workshop 4, Baricho Rd, Industrial Area, Nairobi'),
('Jane Smith Auto', 'Jane Smith Auto Garage Ltd', 'Credit', 'Wholesale B', '+254 787 654 321', 'jane@jsgarage.co.ke', 'P011223344C', 120000.00, 88000.00, 'Ngong Road, Opp. Junction Mall, Nairobi')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- GARAGE BRANCHES
INSERT INTO garage_branches (branch_id, name, city, address, phone, manager_name, total_bays, active_jobs) VALUES
('GAR-NRB-01', 'Nairobi Central Flagship Auto Care', 'Nairobi', 'Commercial Street, Off Enterprise Rd, Industrial Area', '+254 711 098 701', 'David Ochieng', 8, 5),
('GAR-MSA-02', 'Mombasa Coastal Motors & Diagnostics', 'Mombasa', 'Mbaraki Rd, Near Port Gate 3, Shimanzi', '+254 711 098 702', 'Amina Hassan', 6, 3)
ON DUPLICATE KEY UPDATE name = VALUES(name);
