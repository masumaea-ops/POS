# Masuma ERP & POS Database Seeding & Data Injection Reference

This document details the database seeding architecture, relational tables, initial corporate master data, and SQL injection scripts for production migrations (e.g. PostgreSQL, MySQL, SQLite, or Firestore).

---

## 1. Relational Database Schema & Seeding Sequence

When deploying with a backend database (PostgreSQL/MySQL), execute seeds in this order to satisfy foreign key constraints:

1. **`system_settings`**: Corporate profile, KRA tax PIN, fiscal device serials, currency.
2. **`users_and_roles`**: Staff users, roles, cryptographic salt hashes, PINs.
3. **`categories_and_brands`**: Masuma, Denso, Bosch, KYB, NGK, Philips.
4. **`products_catalog`**: SKUs, OEM cross-references, bin locations, cost/wholesale/retail prices.
5. **`suppliers`**: Japanese/European parts factories and importers.
6. **`customers_and_fleets`**: Retail, Wholesale A, Wholesale B accounts, credit caps.
7. **`garage_branches_and_bays`**: Flagship hubs (Nairobi, Mombasa, Nakuru, Kisumu).
8. **`chart_of_accounts`**: Assets (1000s), Liabilities (2000s), Equity (3000s), Revenue (4000s), Expenses (5000s).
9. **`initial_stock_movements`**: Opening balance ledger entries.

---

## 2. Production SQL Seeding Script (PostgreSQL / MySQL compatible)

```sql
-- =============================================================
-- 1. SYSTEM SETTINGS & COMPANY PROFILE
-- =============================================================
INSERT INTO system_settings (
    corp_name, corp_short_name, tax_pin, hotline, email, 
    currency, vat_rate, timezone, etims_device_serial
) VALUES (
    'Masuma Auto Parts East Africa Ltd',
    'Masuma',
    'P051234567X',
    '+254 700 000 000',
    'billing@masuma.co.ke',
    'KES',
    16.00,
    'Africa/Nairobi',
    'MASUMA-TIMS-NRB-01'
) ON CONFLICT DO NOTHING;

-- =============================================================
-- 2. CHART OF ACCOUNTS (DOUBLE-ENTRY GENERAL LEDGER)
-- =============================================================
INSERT INTO chart_of_accounts (account_code, account_name, account_type, balance) VALUES
('1010', 'Cash on Hand (POS Drawers)', 'Asset', 150000.00),
('1020', 'M-Pesa Working Capital Account', 'Asset', 420000.00),
('1030', 'KCB Bank Operating Account', 'Asset', 1850000.00),
('1200', 'Accounts Receivable (Trade Debtors)', 'Asset', 680000.00),
('1300', 'Spare Parts Inventory Stock', 'Asset', 3500000.00),
('2010', 'Accounts Payable (Suppliers/Imports)', 'Liability', 940000.00),
('2020', 'KRA VAT Output Tax Payable (16%)', 'Liability', 142000.00),
('3010', 'Retained Earnings & Capital', 'Equity', 4500000.00),
('4010', 'Parts Counter Sales Revenue', 'Revenue', 0.00),
('4020', 'Garage Diagnostic & Labor Revenue', 'Revenue', 0.00),
('5010', 'Cost of Goods Sold (COGS)', 'Expense', 0.00),
('5020', 'Workshop Consumables & Freight', 'Expense', 0.00)
ON CONFLICT (account_code) DO NOTHING;

-- =============================================================
-- 3. CORE AUTOPARTS CATALOG SEED
-- =============================================================
INSERT INTO products (sku, name, brand, oem_code, bin_location, cost_price, wholesale_price, retail_price, stock_on_hand, min_reorder_level) VALUES
('MS-BP-001', 'Front Brake Pads Set (Ceramic)', 'Masuma', '04465-0K150', 'WH1-A3-Shelf2', 3800.00, 4675.00, 5500.00, 45, 15),
('MS-OF-002', 'Engine Oil Filter Heavy Duty', 'Masuma', '90915-YZZD2', 'WH1-B1-Shelf1', 750.00, 1020.00, 1200.00, 120, 20),
('MS-SP-003', 'Iridium Tough Spark Plug', 'Denso', '90919-01247', 'WH1-A1-Shelf3', 1700.00, 2125.00, 2500.00, 80, 10),
('MS-AF-004', 'Air Intake Filter', 'Masuma', '17801-0C010', 'WH1-C2-Shelf4', 1100.00, 1530.00, 1800.00, 25, 10),
('MS-WB-005', 'Aerotwin Wiper Blade Pair', 'Bosch', 'A297S-BOSCH', 'WH2-A2-Shelf1', 1900.00, 2550.00, 3000.00, 35, 8),
('MS-SB-006', 'Excel-G Gas Shock Absorber', 'KYB', '48510-09L20', 'WH2-C1-Shelf2', 5900.00, 7225.00, 8500.00, 18, 8),
('MS-BL-007', 'X-tremeVision Pro150 Bulb H4', 'Philips', '90981-13043', 'WH1-B2-Shelf3', 450.00, 680.00, 800.00, 60, 15),
('MS-TP-008', 'Precision Steering Tie Rod End', 'Masuma', '45046-09250', 'WH1-D4-Shelf1', 2800.00, 3570.00, 4200.00, 30, 10),
('MS-CF-009', 'Active Carbon Cabin Air Filter', 'Masuma', '87139-30040', 'WH1-C1-Shelf3', 950.00, 1275.00, 1500.00, 40, 12),
('MS-BT-012', 'Heavy Duty Lead Battery Terminal', 'Generic', 'BT-GEN-01', 'WH1-E1-Shelf1', 250.00, 425.00, 500.00, 150, 20)
ON CONFLICT (sku) DO NOTHING;

-- =============================================================
-- 4. B2B WHOLESALE CUSTOMERS & GARAGES SEED
-- =============================================================
INSERT INTO customers (name, company_name, customer_type, tier, phone, email, kra_pin, credit_limit, outstanding_balance, shipping_address) VALUES
('Walk-In Cash Customer', 'Retail Counter', 'Cash', 'Retail', '+254 700 000 000', 'cash@masuma.co.ke', 'P051234567A', 0, 0, 'Nairobi CBD Counter Pickup'),
('John Doe', 'John Doe Motors (JDM Workshop)', 'Credit', 'Wholesale A', '+254 712 345 678', 'john@jdmotors.co.ke', 'P001928374B', 250000.00, 145000.00, 'Workshop 4, Baricho Rd, Industrial Area, Nairobi'),
('Jane Smith', 'Jane Smith Auto Garage Ltd', 'Credit', 'Wholesale B', '+254 787 654 321', 'jane@jsgarage.co.ke', 'P011223344C', 120000.00, 88000.00, 'Ngong Road, Opp. Junction Mall, Nairobi'),
('AutoFix Solutions Ltd', 'AutoFix Fleet & Diagnostics', 'Credit', 'Wholesale A', '+254 722 000 111', 'procurement@autofix.co.ke', 'A009988776Z', 500000.00, 310000.00, 'Enterprise Road, Plot 12, Industrial Area, Nairobi')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 5. SUPPLIERS & PARTS IMPORTERS SEED
-- =============================================================
INSERT INTO suppliers (name, contact_person, email, phone, country) VALUES
('Masuma Auto Spare Parts Co. Japan', 'Yuki Tanaka', 'y.tanaka@masuma.jp', '+81 3-1234-5678', 'Japan'),
('Denso Global Aftermarket Division', 'Mike Johnson', 'mike.j@denso.com', '+1 248-350-7500', 'Japan / USA'),
('Bosch Automotive Aftermarket GmbH', 'Klaus Schmidt', 'k.schmidt@bosch.de', '+49 711 811-0', 'Germany')
ON CONFLICT DO NOTHING;

-- =============================================================
-- 6. GARAGE SERVICE BRANCHES SEED
-- =============================================================
INSERT INTO garage_branches (branch_id, name, city, address, phone, manager_name, total_bays, active_jobs) VALUES
('GAR-NRB-01', 'Nairobi Central Flagship Auto Care', 'Nairobi', 'Commercial Street, Off Enterprise Rd, Industrial Area', '+254 711 098 701', 'David Ochieng', 8, 5),
('GAR-MSA-02', 'Mombasa Coastal Motors & Diagnostics', 'Mombasa', 'Mbaraki Rd, Near Port Gate 3, Shimanzi', '+254 711 098 702', 'Amina Hassan', 6, 3),
('GAR-NKR-03', 'Nakuru Highway Express Bay', 'Nakuru', 'Nakuru-Eldoret Highway, Opp. Westside Mall', '+254 711 098 703', 'Peter Kamau', 4, 2),
('GAR-KSM-04', 'Kisumu Lake Basin Auto Hub', 'Kisumu', 'Oginga Odinga Rd, Near Central Bus Park', '+254 711 098 704', 'Otieno Owino', 5, 1)
ON CONFLICT (branch_id) DO NOTHING;
```

---

## 3. Client-Side Persistent LocalStorage Seeding

In standalone/offline environments, the client application seeds and persists state automatically in the browser storage:

- **`masuma_settings_v3`**: Stores corporate PIN, branding, KRA eTIMS status, and current VAT rate.
- **`masuma_language`**: Current active language (`en` or `sw`).
- **`masuma_garage_branches`**: Multi-branch garage network.
- **`masuma_active_job_cards`**: Work orders, OBD-II diagnostic fault logs, and digital signatures.
