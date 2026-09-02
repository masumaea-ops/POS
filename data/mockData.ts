import type { Product, Customer, Supplier, PurchaseOrder, SaleOrder } from '../types';

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, sku: 'MS-BP-001', name: 'Front Brake Pads', brand: 'Masuma', price: 5500, stock: 12, imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200', oemCode: '04465-0K150', binLocation: 'WH1-A3-Shelf2', minStockLevel: 15 },
  { id: 2, sku: 'MS-OF-002', name: 'Engine Oil Filter', brand: 'Masuma', price: 1200, stock: 35, imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200', oemCode: '90915-YZZD2', binLocation: 'WH1-B1-Shelf1', minStockLevel: 20 },
  { id: 3, sku: 'MS-SP-003', name: 'Iridium Spark Plug', brand: 'Denso', price: 2500, stock: 50, imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200', oemCode: '90919-01247', binLocation: 'WH1-A1-Shelf3', minStockLevel: 10 },
  { id: 4, sku: 'MS-AF-004', name: 'Air Filter', brand: 'Masuma', price: 1800, stock: 0, imageUrl: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=200', oemCode: '17801-0C010', binLocation: 'WH1-C2-Shelf4', minStockLevel: 10 },
  { id: 5, sku: 'MS-WB-005', name: 'Wiper Blade Set', brand: 'Bosch', price: 3000, stock: 15, imageUrl: 'https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=200', oemCode: 'A297S-BOSCH', binLocation: 'WH2-A2-Shelf1', minStockLevel: 8 },
  { id: 6, sku: 'MS-SB-006', name: 'Shock Absorber', brand: 'KYB', price: 8500, stock: 5, imageUrl: 'https://images.unsplash.com/photo-1625467130907-be1a2a39c36c?auto=format&fit=crop&q=80&w=200', oemCode: '48510-09L20', binLocation: 'WH2-C1-Shelf2', minStockLevel: 8 },
  { id: 7, sku: 'MS-BL-007', name: 'Headlight Bulb H4', brand: 'Philips', price: 800, stock: 40, imageUrl: 'https://images.unsplash.com/photo-1552656967-7a0991a13906?auto=format&fit=crop&q=80&w=200', oemCode: '90981-13043', binLocation: 'WH1-B2-Shelf3', minStockLevel: 15 },
  { id: 8, sku: 'MS-TP-008', name: 'Tie Rod End', brand: 'Masuma', price: 4200, stock: 18, imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=200', oemCode: '45046-09250', binLocation: 'WH1-D4-Shelf1', minStockLevel: 10 },
  { id: 9, sku: 'MS-CF-009', name: 'Cabin Air Filter', brand: 'Masuma', price: 1500, stock: 3, imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200', oemCode: '87139-30040', binLocation: 'WH1-C1-Shelf3', minStockLevel: 12 },
  { id: 10, sku: 'MS-FC-010', name: 'Fuel Cap', brand: 'Generic', price: 950, stock: 25, imageUrl: 'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=200', oemCode: '77300-33070', binLocation: 'WH1-B4-Shelf5', minStockLevel: 5 },
  { id: 11, sku: 'MS-PS-011', name: 'Power Steering Fluid', brand: 'Total', price: 1300, stock: 19, imageUrl: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=200', oemCode: 'TOTAL-PS-1L', binLocation: 'WH2-A4-Shelf3', minStockLevel: 10 },
  { id: 12, sku: 'MS-BT-012', name: 'Battery Terminal', brand: 'Generic', price: 500, stock: 60, imageUrl: 'https://images.unsplash.com/photo-1552656967-7a0991a13906?auto=format&fit=crop&q=80&w=200', oemCode: 'BT-GEN-01', binLocation: 'WH1-E1-Shelf1', minStockLevel: 20 },
];

export const MOCK_CUSTOMERS: Customer[] = [
    { id: 1, name: 'Walk-in Customer', type: 'Cash', tier: 'Retail', creditLimit: 0, outstandingBalance: 0, kraPin: 'P051234567A', shippingAddress: 'Nairobi CBD Counter Pickup' },
    { id: 2, name: 'John Doe', type: 'Credit', companyName: 'John Doe Motors (JDM)', email: 'john@jdmotors.co.ke', phone: '0712345678', tier: 'Wholesale A', creditLimit: 250000, outstandingBalance: 145000, kraPin: 'P001928374B', shippingAddress: 'Workshop No. 4, Baricho Road, Industrial Area, Nairobi' },
    { id: 3, name: 'Jane Smith', type: 'Credit', companyName: 'Jane Smith Garage', email: 'jane@jsgarage.co.ke', phone: '0787654321', tier: 'Wholesale B', creditLimit: 120000, outstandingBalance: 88000, kraPin: 'P011223344C', shippingAddress: 'Ngong Road, Opp. Junction Mall, Nairobi' },
    { id: 4, name: 'AutoFix Solutions', type: 'Credit', companyName: 'AutoFix Solutions Ltd', email: 'procurement@autofix.co.ke', phone: '0722000111', tier: 'Wholesale A', creditLimit: 500000, outstandingBalance: 310000, kraPin: 'A009988776Z', shippingAddress: 'Enterprise Road, Plot 12, Industrial Area, Nairobi' },
];

export const MOCK_SUPPLIERS: Supplier[] = [
    { id: 1, name: 'Masuma Japan', contactPerson: 'Yuki Tanaka', email: 'y.tanaka@masuma.jp', phone: '+81 3-1234-5678' },
    { id: 2, name: 'Denso Global', contactPerson: 'Mike Johnson', email: 'mike.j@denso.com', phone: '+1 248-350-7500' },
    { id: 3, name: 'Bosch GmbH', contactPerson: 'Klaus Schmidt', email: 'k.schmidt@bosch.de', phone: '+49 711 811-0' },
];

export const MOCK_PURCHASE_ORDERS: PurchaseOrder[] = [
    { 
      id: 'PO-2024-001', 
      supplier: MOCK_SUPPLIERS[0], 
      date: '2024-07-15', 
      status: 'Received', 
      total: 1250000, 
      itemCount: 15,
      items: [
        { productName: 'Front Brake Pads', quantity: 200, cost: 4000 },
        { productName: 'Engine Oil Filter', quantity: 375, cost: 1200 }
      ]
    },
    { 
      id: 'PO-2024-002', 
      supplier: MOCK_SUPPLIERS[1], 
      date: '2024-07-22', 
      status: 'Sent', 
      total: 780000, 
      itemCount: 8,
      items: [
        { productName: 'Iridium Spark Plug', quantity: 312, cost: 2500 }
      ]
    },
    { 
      id: 'PO-2024-003', 
      supplier: MOCK_SUPPLIERS[0], 
      date: '2024-07-28', 
      status: 'Draft', 
      total: 210000, 
      itemCount: 4,
      items: [
        { productName: 'Air Filter', quantity: 116, cost: 1800 }
      ]
    },
    { 
      id: 'PO-2024-004', 
      supplier: MOCK_SUPPLIERS[2], 
      date: '2024-06-10', 
      status: 'Received', 
      total: 950000, 
      itemCount: 22,
      items: [
        { productName: 'Wiper Blade Set', quantity: 316, cost: 3000 }
      ]
    },
];

export const MOCK_SALE_ORDERS: SaleOrder[] = [
    { 
      id: 'QT-2024-101', 
      customer: MOCK_CUSTOMERS[1], 
      date: '2024-07-28', 
      status: 'Quote', 
      total: 88000,
      items: [
        { productName: 'Front Brake Pads', quantity: 10, price: 4400 },
        { productName: 'Shock Absorber', quantity: 5, price: 6800 }
      ]
    },
    { 
      id: 'SO-2024-115', 
      customer: MOCK_CUSTOMERS[2], 
      date: '2024-07-25', 
      status: 'Order', 
      total: 152000,
      items: [
        { productName: 'Wiper Blade Set', quantity: 30, price: 2640 },
        { productName: 'Shock Absorber', quantity: 10, price: 7280 }
      ]
    },
    { 
      id: 'INV-2024-098', 
      customer: MOCK_CUSTOMERS[3], 
      date: '2024-07-20', 
      status: 'Invoiced', 
      total: 45000,
      items: [
        { productName: 'Engine Oil Filter', quantity: 45, price: 960 }
      ]
    },
    { 
      id: 'INV-2024-097', 
      customer: MOCK_CUSTOMERS[1], 
      date: '2024-07-19', 
      status: 'Paid', 
      total: 120000,
      items: [
        { productName: 'Tie Rod End', quantity: 30, price: 3360 },
        { productName: 'Cabin Air Filter', quantity: 13, price: 1200 }
      ]
    },
];

