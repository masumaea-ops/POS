export interface Product {
  id: number;
  sku: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  imageUrl: string;
  oemCode?: string;       // OEM & Interchange Part Number Cross-overs
  binLocation?: string;   // Warehouse Bin & Shelf Locations
  minStockLevel?: number; // For low stock alert and PO triggers
}

export interface Customer {
  id: number;
  name: string;
  type: 'Cash' | 'Credit';
  tier: 'Retail' | 'Wholesale A' | 'Wholesale B';
  companyName?: string;
  email?: string;
  phone?: string;
  creditLimit?: number;   // In KES
  outstandingBalance?: number; // In KES
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
}

export interface PurchaseOrder {
  id: string;
  supplier: Supplier;
  date: string;
  status: 'Draft' | 'Sent' | 'Received' | 'Cancelled';
  total: number;
  itemCount: number;
  items?: Array<{ productName: string; quantity: number; cost: number }>;
}

export interface SaleOrder {
  id: string;
  customer: Customer;
  date: string;
  status: 'Quote' | 'Order' | 'Invoiced' | 'Paid';
  total: number;
  items?: Array<{ productName: string; quantity: number; price: number }>;
}

export interface CartItem extends Product {
  quantity: number;
}

