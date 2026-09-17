export const CREATE_TABLES_SQL = `
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

-- 2. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  salt VARCHAR(100) NOT NULL,
  pin_code VARCHAR(50),
  full_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'cashier',
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

-- 4. CUSTOMERS & FLEETS
CREATE TABLE IF NOT EXISTS customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  company_name VARCHAR(200),
  customer_type ENUM('Cash', 'Credit') NOT NULL DEFAULT 'Cash',
  tier ENUM('Retail', 'Wholesale A', 'Wholesale B') NOT NULL DEFAULT 'Retail',
  phone VARCHAR(50),
  email VARCHAR(100),
  kra_pin VARCHAR(50),
  credit_limit DECIMAL(12,2) DEFAULT 0.00,
  outstanding_balance DECIMAL(12,2) DEFAULT 0.00,
  shipping_address TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_customer_tier (tier),
  INDEX idx_customer_kra (kra_pin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  contact_person VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(50),
  country VARCHAR(100) DEFAULT 'Japan',
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. CHART OF ACCOUNTS (DOUBLE-ENTRY GL)
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  account_code VARCHAR(20) PRIMARY KEY,
  account_name VARCHAR(150) NOT NULL,
  account_type ENUM('Asset', 'Liability', 'Equity', 'Revenue', 'Expense') NOT NULL,
  description VARCHAR(255),
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. GARAGE BRANCHES
CREATE TABLE IF NOT EXISTS garage_branches (
  branch_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  city VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(50),
  manager_name VARCHAR(100),
  total_bays INT DEFAULT 6,
  active_jobs INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. GARAGE SERVICE WORK ORDERS (JOB CARDS)
CREATE TABLE IF NOT EXISTS job_cards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  job_number VARCHAR(50) NOT NULL UNIQUE,
  branch_id VARCHAR(50) NOT NULL,
  vehicle_reg VARCHAR(30) NOT NULL,
  make_model VARCHAR(100) NOT NULL,
  customer_name VARCHAR(150) NOT NULL,
  customer_phone VARCHAR(50),
  status ENUM('pending', 'in_progress', 'awaiting_parts', 'qc_testing', 'completed', 'invoiced') DEFAULT 'pending',
  assigned_technician VARCHAR(100),
  bay_number INT DEFAULT 1,
  mileage INT DEFAULT 0,
  obd_fault_codes JSON,
  notes TEXT,
  total_parts_cost DECIMAL(12,2) DEFAULT 0.00,
  total_labor_cost DECIMAL(12,2) DEFAULT 0.00,
  grand_total DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_job_branch (branch_id),
  INDEX idx_job_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. SALES INVOICES (POS & B2B)
CREATE TABLE IF NOT EXISTS sales_invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  customer_id INT NULL,
  customer_name VARCHAR(150) NOT NULL,
  tender_type ENUM('Cash', 'M-Pesa', 'Card', 'Bank Transfer', 'Credit Account') NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL,
  vat_amount DECIMAL(12,2) NOT NULL,
  discount_amount DECIMAL(12,2) DEFAULT 0.00,
  grand_total DECIMAL(12,2) NOT NULL,
  etims_signature VARCHAR(255),
  etims_qr_url TEXT,
  cashier_username VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_inv_number (invoice_number),
  INDEX idx_inv_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. SALES INVOICE ITEMS
CREATE TABLE IF NOT EXISTS sales_invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  cost_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (invoice_id) REFERENCES sales_invoices(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. AUDIT TRAIL / SECURITY LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_username VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;
