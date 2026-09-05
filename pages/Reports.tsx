import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../components/shared/PageHeader';
import Card from '../components/shared/Card';
import { 
  BarChart2 as BarChartIcon, 
  Archive as ArchiveIcon, 
  Users as UsersIcon, 
  FileText as FileTextIcon, 
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon
} from 'lucide-react';
import { MOCK_PRODUCTS, MOCK_CUSTOMERS, MOCK_SUPPLIERS, MOCK_PURCHASE_ORDERS, MOCK_SALE_ORDERS } from '../data/mockData';
import { useSystemSettings } from '../contexts/SettingsContext';
import { exportToPDF, exportToCSV as generateCSV } from '../utils/exportUtils';
import ExportDropdown from '../components/shared/ExportDropdown';

// Types of reports
type ReportKey = 'sales' | 'inventory' | 'receivables' | 'vat' | 'suppliers' | 'cashup';

interface ReportConfig {
  key: ReportKey;
  title: string;
  icon: React.ReactNode;
  description: string;
}

// ----------------------------------------------------------------------
// ENHANCED MOCK DATA TAILORED FOR DETAILED REPORTS
// ----------------------------------------------------------------------

// Historical sales breakdown
const MOCK_HISTORICAL_SALES = [
  { sku: 'MS-BP-001', name: 'Front Brake Pads', brand: 'Masuma', category: 'Brakes', quantity: 142, revenue: 781000, margin: 0.35, outlet: 'Nairobi HQ' },
  { sku: 'MS-OF-002', name: 'Engine Oil Filter', brand: 'Masuma', category: 'Filters', quantity: 480, revenue: 576000, margin: 0.45, outlet: 'Nairobi HQ' },
  { sku: 'MS-SP-003', name: 'Iridium Spark Plug', brand: 'Denso', category: 'Ignition', quantity: 210, revenue: 525000, margin: 0.28, outlet: 'Mombasa Road' },
  { sku: 'MS-AF-004', name: 'Air Filter', brand: 'Masuma', category: 'Filters', quantity: 185, revenue: 333000, margin: 0.40, outlet: 'Mombasa Road' },
  { sku: 'MS-WB-005', name: 'Wiper Blade Set', brand: 'Bosch', category: 'Accessories', quantity: 95, revenue: 285000, margin: 0.30, outlet: 'Kisumu City' },
  { sku: 'MS-SB-006', name: 'Shock Absorber', brand: 'KYB', category: 'Suspension', quantity: 62, revenue: 527000, margin: 0.25, outlet: 'Nairobi HQ' },
  { sku: 'MS-BL-007', name: 'Headlight Bulb H4', brand: 'Philips', category: 'Electrical', quantity: 320, revenue: 256000, margin: 0.38, outlet: 'Kisumu City' },
  { sku: 'MS-TP-008', name: 'Tie Rod End', brand: 'Masuma', category: 'Suspension', quantity: 78, revenue: 327600, margin: 0.32, outlet: 'Mombasa Road' },
  { sku: 'MS-CF-009', name: 'Cabin Air Filter', brand: 'Masuma', category: 'Filters', quantity: 110, revenue: 165000, margin: 0.42, outlet: 'Nairobi HQ' },
  { sku: 'MS-FC-010', name: 'Fuel Cap', brand: 'Generic', category: 'Accessories', quantity: 140, revenue: 133000, margin: 0.50, outlet: 'Kisumu City' },
  { sku: 'MS-PS-011', name: 'Power Steering Fluid', brand: 'Total', category: 'Fluids', quantity: 90, revenue: 117000, margin: 0.25, outlet: 'Nairobi HQ' },
  { sku: 'MS-BT-012', name: 'Battery Terminal', brand: 'Generic', category: 'Electrical', quantity: 240, revenue: 120000, margin: 0.55, outlet: 'Mombasa Road' },
];

// Master list of Outlets
const OUTLETS = ['All Outlets', 'Nairobi HQ', 'Mombasa Road', 'Kisumu City'];

// Aged Receivables Detail (Kenya context/wholesale debtors)
const INITIAL_DEBTORS = [
  { id: 1, customerName: 'John Doe Motors', company: 'John Doe Motors Ltd', currency: 'KES', totalDue: 180000, current: 80000, d1_30: 50000, d31_60: 30000, d61_90: 20000, d90Over: 0, phone: '0712345678', email: 'john@jdmotors.co.ke' },
  { id: 2, customerName: 'Jane Smith Garage', company: 'Jane Smith Garage Ltd', currency: 'KES', totalDue: 95000, current: 30000, d1_30: 45000, d31_60: 20000, d61_90: 0, d90Over: 0, phone: '0787654321', email: 'jane@jsgarage.co.ke' },
  { id: 3, customerName: 'AutoFix Solutions', company: 'AutoFix East Africa', currency: 'KES', totalDue: 245000, current: 140000, d1_30: 60000, d31_60: 0, d61_90: 15000, d90Over: 30000, phone: '0722000111', email: 'procurement@autofix.co.ke' },
  { id: 4, customerName: 'Mombasa Auto Spares', company: 'Mombasa Spares Ltd', currency: 'KES', totalDue: 65000, current: 0, d1_30: 0, d31_60: 0, d61_90: 0, d90Over: 65000, phone: '0733888999', email: 'billing@mombasaspares.co.ke' },
];

// Supplier detailed scores
const SUPPLIER_RATINGS = [
  { id: 1, name: 'Masuma Japan', category: 'Oem Parts', avgLeadTime: 14.2, fillRate: 98.4, discrepancyRate: 0.15, priceIndex: 'Optimal', scoreGrade: 'A+' },
  { id: 2, name: 'Denso Global', category: 'Ignition Systems', avgLeadTime: 8.5, fillRate: 94.2, discrepancyRate: 0.40, priceIndex: 'Premium', scoreGrade: 'A' },
  { id: 3, name: 'Bosch GmbH', category: 'Electrical & Filters', avgLeadTime: 11.0, fillRate: 88.5, discrepancyRate: 1.25, priceIndex: 'Competitive', scoreGrade: 'B+' },
];

// Daily till summaries for POS reconciliation
const INITIAL_CASH_SHIFTS = [
  { id: 'SF-1042', date: '2026-06-15', cashier: 'Alex Ombati', terminal: 'POS Terminal 01', openingFloat: 10000, salesCash: 45200, salesCard: 32000, salesMpesa: 48000, physicalCash: 45200, variance: 0, resolved: true, notes: 'Balanced perfectly.' },
  { id: 'SF-1041', date: '2026-06-14', cashier: 'Mercy Wanjiku', terminal: 'POS Terminal 02', openingFloat: 10000, salesCash: 58900, salesCard: 18500, salesMpesa: 62000, physicalCash: 58500, variance: -400, resolved: true, notes: 'Supervised reconciliation; off by KES 400 voucher mismatch resolved.' },
  { id: 'SF-1040', date: '2026-06-13', cashier: 'Alex Ombati', terminal: 'POS Terminal 01', openingFloat: 10000, salesCash: 38700, salesCard: 24000, salesMpesa: 41000, physicalCash: 38850, variance: 150, resolved: true, notes: 'Cash surplus of KES 150 cleared.' },
  { id: 'SF-1039', date: '2026-06-12', cashier: 'Mercy Wanjiku', terminal: 'POS Terminal 02', openingFloat: 10000, salesCash: 71200, salesCard: 35000, salesMpesa: 83000, physicalCash: 71200, variance: 0, resolved: true, notes: 'Balanced perfectly' },
];

const Reports: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as ReportKey | null;
  // Current active sub-report key
  const [activeReport, setActiveReport] = useState<ReportKey | null>(() => tabParam || null);

  useEffect(() => {
    if (tabParam) {
      setActiveReport(tabParam);
    }
  }, [tabParam]);

  // General Filter States
  const [selectedOutlet, setSelectedOutlet] = useState<string>('All Outlets');
  const [dateRange, setDateRange] = useState<string>('30d');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1) Inventory Report State: FIFO vs Weighted Average Cost method
  const [valuationMethod, setValuationMethod] = useState<'FIFO' | 'WAC'>('FIFO');

  // 2) Aged Receivables State: Send Prompt Modal
  const [activeDunningDebtor, setActiveDunningDebtor] = useState<any | null>(null);
  const [dunningMedium, setDunningMedium] = useState<'SMS' | 'WhatsApp' | 'Email'>('SMS');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSendingDunning, setIsSendingDunning] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // 3) VAT State: tax country rate
  const [vatRate, setVatRate] = useState<number>(settings.vatRate);

  React.useEffect(() => {
    setVatRate(settings.vatRate);
  }, [settings.vatRate]);

  // 4) Till Balancing State: dynamic form
  const [cashShifts, setCashShifts] = useState(INITIAL_CASH_SHIFTS);
  const [showBalancingForm, setShowBalancingForm] = useState(false);
  const [reconcileTerminal, setReconcileTerminal] = useState('POS Terminal 01');
  const [expectedCash, setExpectedCash] = useState(48500);
  const [expectedCard, setExpectedCard] = useState(25000);
  const [expectedMpesa, setExpectedMpesa] = useState(38000);
  // Counts of physical cash notes
  const [count1000, setCount1000] = useState<number>(0);
  const [count500, setCount500] = useState<number>(0);
  const [count200, setCount200] = useState<number>(0);
  const [count100, setCount100] = useState<number>(0);
  const [countCoins, setCountCoins] = useState<number>(0);
  const [physicalCard, setPhysicalCard] = useState<number>(25000);
  const [physicalMpesa, setPhysicalMpesa] = useState<number>(38000);
  const [reconcileNotes, setReconcileNotes] = useState('');

  // ----------------------------------------------------------------------
  // DERIVED VALUATIONS & AGGREGATE CALCULATIONS
  // ----------------------------------------------------------------------

  // A) Sales aggregations
  const salesItemsFiltered = useMemo(() => {
    return MOCK_HISTORICAL_SALES.filter(item => {
      const matchOutlet = selectedOutlet === 'All Outlets' || item.outlet === selectedOutlet;
      const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchOutlet && matchSearch;
    });
  }, [selectedOutlet, searchQuery]);

  const salesTotals = useMemo(() => {
    let totRev = 0;
    let totQty = 0;
    let totProfit = 0;
    salesItemsFiltered.forEach(item => {
      totRev += item.revenue;
      totQty += item.quantity;
      totProfit += item.revenue * item.margin;
    });
    return {
      revenue: totRev,
      units: totQty,
      profit: totProfit,
      marginPercent: totRev > 0 ? (totProfit / totRev) * 100 : 0
    };
  }, [salesItemsFiltered]);

  // B) Inventory calculations
  const inventoryItemsValued = useMemo(() => {
    return MOCK_PRODUCTS.map(prod => {
      // Setup dynamic unit cost based on evaluation model choice
      // FIFO cost vs WAC cost (FIFO varies slightly based on SKU seed price)
      const baseCost = prod.price * (prod.sku.startsWith('MS-BP') ? 0.65 : 0.68);
      const unitCost = valuationMethod === 'FIFO' 
        ? baseCost * (1 + (prod.id % 5) * 0.015) 
        : baseCost;
      
      const totalCostValue = prod.stock * unitCost;
      const totalRetailValue = prod.stock * prod.price;
      const potentialMargin = totalRetailValue > 0 ? ((totalRetailValue - totalCostValue) / totalRetailValue) * 100 : 0;
      
      let stockStatus = 'Healthy';
      if (prod.stock === 0) stockStatus = 'Out of Stock';
      else if (prod.stock < 10) stockStatus = 'Low Stock';
      else if (prod.stock > 35) stockStatus = 'Overstocked';

      return {
        ...prod,
        unitCost,
        totalCostValue,
        totalRetailValue,
        potentialMargin,
        stockStatus
      };
    }).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [valuationMethod, searchQuery]);

  const inventorySummary = useMemo(() => {
    let cost = 0;
    let retail = 0;
    let lowCount = 0;
    let outCount = 0;
    inventoryItemsValued.forEach(item => {
      cost += item.totalCostValue;
      retail += item.totalRetailValue;
      if (item.stockStatus === 'Low Stock') lowCount++;
      if (item.stockStatus === 'Out of Stock') outCount++;
    });
    return {
      totalCost: cost,
      totalRetail: retail,
      potentialProfit: retail - cost,
      lowStockCount: lowCount,
      outOfStockCount: outCount
    };
  }, [inventoryItemsValued]);

  // C) VAT calculations (derived from SALE/PURCHASE orders)
  const vatCalculations = useMemo(() => {
    const factor = vatRate / 100;
    
    // Output Sales
    // Only compile Invoice & Paid orders (Draft/Quotes are not taxable)
    const eligibleSales = MOCK_SALE_ORDERS.filter(o => o.status === 'Invoiced' || o.status === 'Paid');
    const totalTaxableSales = eligibleSales.reduce((acc, current) => acc + current.total, 0);
    const outputVat = totalTaxableSales * factor;

    // Input Purchases
    // Received orders qualify for input VAT deductions
    const eligiblePurchases = MOCK_PURCHASE_ORDERS.filter(p => p.status === 'Received');
    const totalTaxablePurchases = eligiblePurchases.reduce((acc, current) => acc + current.total, 0);
    const inputVat = totalTaxablePurchases * factor;

    return {
      taxableSales: totalTaxableSales,
      taxablePurchases: totalTaxablePurchases,
      outputVat,
      inputVat,
      netVat: outputVat - inputVat // Pay KRA/Local Revenue Authority
    };
  }, [vatRate]);

  // D) Aged Receivables calculations
  const debtorsFiltered = useMemo(() => {
    return INITIAL_DEBTORS.filter(d => d.customerName.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  const receivablesTotals = useMemo(() => {
    let tot = 0, current = 0, d1_30 = 0, d31_60 = 0, d61_90 = 0, d90Over = 0;
    debtorsFiltered.forEach(d => {
      tot += d.totalDue;
      current += d.current;
      d1_30 += d.d1_30;
      d31_60 += d.d31_60;
      d61_90 += d.d61_90;
      d90Over += d.d90Over;
    });
    return { totalDue: tot, current, d1_30, d31_60, d61_90, d90Over };
  }, [debtorsFiltered]);

  // E) Till balancing list
  const tillVarianceTotal = useMemo(() => {
    return cashShifts.reduce((acc, sh) => acc + sh.variance, 0);
  }, [cashShifts]);

  // ----------------------------------------------------------------------
  // SERVICE EXPORTERS (UNIVERSAL PDF & CSV GENERATORS)
  // ----------------------------------------------------------------------
  const showBriefNotification = (message: string) => {
    setAlertMessage(message);
    setTimeout(() => {
      setAlertMessage(null);
    }, 4000);
  };

  const handleExportSalesPDF = () => {
    const headers = ['SKU Code', 'Product Description', 'Brand', 'Category', 'Outlet Account', 'Qty Sold', `Revenue (${settings.currency})`, 'Gross Margin', `Est. Profit (${settings.currency})`];
    const rows = salesItemsFiltered.map(i => [
      i.sku,
      i.name,
      i.brand,
      i.category,
      i.outlet,
      i.quantity.toLocaleString(),
      formatPrice(i.revenue),
      `${(i.margin * 100).toFixed(1)}%`,
      formatPrice(i.revenue * i.margin)
    ]);
    exportToPDF({
      title: 'Sales Demand & Margin Performance Report',
      subtitle: 'Analysis of sales volumes, gross revenues, and product profitability by SKU & Outlet',
      filename: `masuma_sales_report_${selectedOutlet.replace(/\s+/g, '_')}_${dateRange}`,
      headers,
      rows,
      metadata: {
        'Outlet': selectedOutlet,
        'Period': dateRange.toUpperCase(),
        'Filter': searchQuery ? `Query: "${searchQuery}"` : 'All Catalog Items',
        'Currency': settings.currency
      },
      summaryStats: [
        { label: 'Total Revenue', value: formatPrice(salesTotals.revenue) },
        { label: 'Units Sold', value: `${salesTotals.units} Units` },
        { label: 'Gross Profit', value: formatPrice(salesTotals.profit) },
        { label: 'Weighted Margin', value: `${salesTotals.marginPercent.toFixed(1)}%` }
      ],
      notes: ['Figures correspond with real-time POS receipts and wholesale B2B invoices.', 'Gross profit estimated from standard product margin allocations.'],
      currency: settings.currency
    });
    showBriefNotification('Sales Demand Report exported as PDF document!');
  };

  const handleExportSalesCSV = () => {
    const headers = ['SKU Code', 'Product Description', 'Brand Group', 'Category', 'Outlet Account', 'QTY Sold', `Total Revenue (${settings.currency})`, 'Gross Margin (%)', `Estimated Profit (${settings.currency})`];
    const rows = salesItemsFiltered.map(i => [
      i.sku,
      i.name,
      i.brand,
      i.category,
      i.outlet,
      i.quantity,
      i.revenue,
      (i.margin * 100).toFixed(1),
      (i.revenue * i.margin).toFixed(2)
    ]);
    generateCSV({
      title: 'Masuma Sales Demand & Margin Performance Ledger',
      filename: `masuma_sales_report_${selectedOutlet.replace(/\s+/g, '_')}_${dateRange}`,
      headers,
      rows,
      metadata: {
        'Outlet Account': selectedOutlet,
        'Period Window': dateRange,
        'Search Filter': searchQuery || 'None',
        'Currency': settings.currency
      },
      summaryStats: [
        { label: 'Total Filtered Revenue', value: formatPrice(salesTotals.revenue) },
        { label: 'Total Filtered Units', value: salesTotals.units },
        { label: 'Estimated Gross Profit', value: formatPrice(salesTotals.profit) },
        { label: 'Weighted Margin', value: `${salesTotals.marginPercent.toFixed(1)}%` }
      ]
    });
    showBriefNotification('Sales Demand CSV spreadsheet downloaded!');
  };

  const handleExportInventoryPDF = () => {
    const headers = ['SKU Code', 'Parts Description', 'Brand', 'Stock Qty', `Unit Cost (${settings.currency})`, `Total Holding Cost (${settings.currency})`, `Unit Retail (${settings.currency})`, `Total Retail Worth (${settings.currency})`, 'Potential Margin', 'Stock Status'];
    const rows = inventoryItemsValued.map(i => [
      i.sku,
      i.name,
      i.brand,
      i.stock.toLocaleString(),
      formatPrice(i.unitCost),
      formatPrice(i.totalCostValue),
      formatPrice(i.price),
      formatPrice(i.totalRetailValue),
      `${i.potentialMargin.toFixed(1)}%`,
      i.stockStatus
    ]);
    exportToPDF({
      title: `Inventory Valuation & Asset Holding Ledger (${valuationMethod})`,
      subtitle: `Warehouse asset valuation evaluated on ${valuationMethod === 'FIFO' ? 'First In, First Out (FIFO)' : 'Weighted Average Cost (WAC)'} accounting rules`,
      filename: `masuma_inventory_valuation_${valuationMethod}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Costing Method': `${valuationMethod} Model`,
        'Total Lines': `${inventoryItemsValued.length} SKUs`,
        'Filter': searchQuery ? `Query "${searchQuery}"` : 'Complete Catalog',
        'Currency': settings.currency
      },
      summaryStats: [
        { label: 'Total Holding Cost', value: formatPrice(inventorySummary.totalCost) },
        { label: 'Total Retail Value', value: formatPrice(inventorySummary.totalRetail) },
        { label: 'Potential Gross Profit', value: formatPrice(inventorySummary.potentialProfit) },
        { label: 'Low Stock Lines', value: `${inventorySummary.lowStockCount} Items` },
        { label: 'Depleted Stock', value: `${inventorySummary.outOfStockCount} Items` }
      ],
      notes: ['Valuations align with KRA eTIMS asset holding standards.', 'FIFO reflects arrival batch queue costing; WAC reflects averaged historic purchase prices.'],
      currency: settings.currency
    });
    showBriefNotification(`Inventory Valuation (${valuationMethod}) PDF downloaded!`);
  };

  const handleExportInventoryCSV = () => {
    const headers = ['SKU Code', 'Parts Description', 'Brand', 'Stock Level', `Unit Cost (${settings.currency})`, `Total Asset Holding Cost (${settings.currency})`, `Unit Retail Price (${settings.currency})`, `Total Retail Worth (${settings.currency})`, 'Margin Potential (%)', 'Stock Status'];
    const rows = inventoryItemsValued.map(i => [
      i.sku,
      i.name,
      i.brand,
      i.stock,
      i.unitCost.toFixed(2),
      i.totalCostValue.toFixed(2),
      i.price.toFixed(2),
      i.totalRetailValue.toFixed(2),
      i.potentialMargin.toFixed(1),
      i.stockStatus
    ]);
    generateCSV({
      title: `Masuma Inventory Asset Valuation (${valuationMethod} Costing Model)`,
      filename: `masuma_inventory_valuation_${valuationMethod}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Valuation Rule': valuationMethod,
        'Catalog Lines': inventoryItemsValued.length,
        'Filter': searchQuery || 'All'
      },
      summaryStats: [
        { label: 'Asset Holding Cost Basis', value: formatPrice(inventorySummary.totalCost) },
        { label: 'Asset Total Retail Worth', value: formatPrice(inventorySummary.totalRetail) },
        { label: 'Unrealized Gross Margin', value: formatPrice(inventorySummary.potentialProfit) },
        { label: 'Low Stock SKU Count', value: inventorySummary.lowStockCount },
        { label: 'Out of Stock SKU Count', value: inventorySummary.outOfStockCount }
      ]
    });
    showBriefNotification('Inventory Valuation CSV spreadsheet downloaded!');
  };

  const handleExportReceivablesPDF = () => {
    const headers = ['Customer Entity', 'Corporate Legal Name', `Total Due (${settings.currency})`, `Current (${settings.currency})`, `1 - 30 Days (${settings.currency})`, `31 - 60 Days (${settings.currency})`, `61 - 90 Days (${settings.currency})`, `90+ Days (${settings.currency})`];
    const rows = debtorsFiltered.map(d => [
      d.customerName,
      d.company,
      formatPrice(d.totalDue),
      formatPrice(d.current),
      formatPrice(d.d1_30),
      formatPrice(d.d31_60),
      formatPrice(d.d61_90),
      formatPrice(d.d90Over)
    ]);
    exportToPDF({
      title: 'Aged Trade Accounts Receivable Ledger',
      subtitle: 'Audit analysis of outstanding commercial buyer credit balances and aging overdue terms',
      filename: `masuma_aged_receivables_report_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Ledger Scope': 'Wholesale Trade Debtors',
        'Accounts Evaluated': debtorsFiltered.length,
        'Overdue 90+ Risk': formatPrice(receivablesTotals.d90Over),
        'Currency': settings.currency
      },
      summaryStats: [
        { label: 'Total Outstanding', value: formatPrice(receivablesTotals.totalDue) },
        { label: 'Current Terms', value: formatPrice(receivablesTotals.current) },
        { label: '1-30 Days Due', value: formatPrice(receivablesTotals.d1_30) },
        { label: '31-60 Days Due', value: formatPrice(receivablesTotals.d31_60) },
        { label: '61-90 Days Due', value: formatPrice(receivablesTotals.d61_90) },
        { label: '90+ Days Arrears', value: formatPrice(receivablesTotals.d90Over) }
      ],
      notes: ['Credit accounts exceeding 60 days are flagged for automated dunning and trade credit hold.'],
      currency: settings.currency
    });
    showBriefNotification('Aged Receivables Report exported as PDF document!');
  };

  const handleExportReceivablesCSV = () => {
    const headers = ['Customer Entity', 'Corporate Entity', `Total Due (${settings.currency})`, `Current (${settings.currency})`, `1-30 Days (${settings.currency})`, `31-60 Days (${settings.currency})`, `61-90 Days (${settings.currency})`, `90+ Days Overdue (${settings.currency})`];
    const rows = debtorsFiltered.map(d => [
      d.customerName,
      d.company,
      d.totalDue,
      d.current,
      d.d1_30,
      d.d31_60,
      d.d61_90,
      d.d90Over
    ]);
    generateCSV({
      title: 'Masuma Aged Commercial Receivables Ledger',
      filename: `masuma_aged_receivables_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Accounts Evaluated': debtorsFiltered.length,
        'Filter': searchQuery || 'All'
      },
      summaryStats: [
        { label: 'Total Trade Receivables', value: formatPrice(receivablesTotals.totalDue) },
        { label: 'Current (Not Overdue)', value: formatPrice(receivablesTotals.current) },
        { label: '1 - 30 Days Past Due', value: formatPrice(receivablesTotals.d1_30) },
        { label: '31 - 60 Days Past Due', value: formatPrice(receivablesTotals.d31_60) },
        { label: '61 - 90 Days Past Due', value: formatPrice(receivablesTotals.d61_90) },
        { label: '90+ Days Past Due (Critical)', value: formatPrice(receivablesTotals.d90Over) }
      ]
    });
    showBriefNotification('Aged Receivables CSV spreadsheet downloaded!');
  };

  const handleExportVatPDF = () => {
    const headers = ['Reference Slip No.', 'Audit Date', 'Associated Commercial Entity', 'Type', 'VAT Standard Attribution', `Net Excl. Tax (${settings.currency})`, `VAT Amount (${settings.currency})`, `Gross Ledger Total (${settings.currency})`];
    const eligibleSales = MOCK_SALE_ORDERS.filter(o => o.status === 'Invoiced' || o.status === 'Paid');
    const eligiblePurchases = MOCK_PURCHASE_ORDERS.filter(p => p.status === 'Received');

    const salesRows = eligibleSales.map(so => {
      const netVal = so.total / (1 + (vatRate / 100));
      const calculatedTax = so.total - netVal;
      return [
        so.id,
        so.date,
        so.customer.name,
        'OUTWARD SUPPLY',
        `Output Supplies (${vatRate}%)`,
        formatPrice(netVal),
        formatPrice(calculatedTax),
        formatPrice(so.total)
      ];
    });

    const purchaseRows = eligiblePurchases.map(po => {
      const netVal = po.total / (1 + (vatRate / 100));
      const calculatedTax = po.total - netVal;
      return [
        po.id,
        po.date,
        po.supplier.name,
        'INWARD SUPPLY',
        `Input Supplies (${vatRate}%)`,
        formatPrice(netVal),
        formatPrice(calculatedTax),
        formatPrice(po.total)
      ];
    });

    const rows = [...salesRows, ...purchaseRows];

    exportToPDF({
      title: `VAT Tax Attribution Ledger & KRA eTIMS Statement Draft (${vatRate}%)`,
      subtitle: `Draft value added tax computation for sales invoices and purchase order input deductions`,
      filename: `masuma_vat_tax_ledger_${vatRate}percent_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Standard VAT Rate': `${vatRate}%`,
        'Filing Period': dateRange.toUpperCase(),
        'eTIMS Status': 'Audit Validated Draft',
        'Net Remittance Due': formatPrice(vatCalculations.netVat)
      },
      summaryStats: [
        { label: 'Gross Taxable Sales', value: formatPrice(vatCalculations.taxableSales) },
        { label: 'Output VAT Collected', value: formatPrice(vatCalculations.outputVat) },
        { label: 'Gross Purchases', value: formatPrice(vatCalculations.taxablePurchases) },
        { label: 'Input VAT Deductible', value: formatPrice(vatCalculations.inputVat) },
        { label: 'Net VAT Payable to KRA', value: formatPrice(vatCalculations.netVat) }
      ],
      notes: [
        'Outward supplies reflect invoiced and settled customer orders.',
        'Inward deductions require confirmed supplier fiscal receipts with ETR pin verification.'
      ],
      currency: settings.currency
    });
    showBriefNotification('VAT Tax Ledger Report exported as PDF document!');
  };

  const handleExportVatCSV = () => {
    const headers = ['Tax Metric / Transaction Item', 'Audit Date', 'Associated Entity', 'Attribution Direction', `Net Value Excl. Tax (${settings.currency})`, `Calculated VAT Amount (${settings.currency})`, `Gross Ledger Entry (${settings.currency})`];
    const eligibleSales = MOCK_SALE_ORDERS.filter(o => o.status === 'Invoiced' || o.status === 'Paid');
    const eligiblePurchases = MOCK_PURCHASE_ORDERS.filter(p => p.status === 'Received');

    const salesRows = eligibleSales.map(so => {
      const netVal = so.total / (1 + (vatRate / 100));
      const calculatedTax = so.total - netVal;
      return [so.id, so.date, so.customer.name, 'Outward Sales Supply', netVal.toFixed(2), calculatedTax.toFixed(2), so.total.toFixed(2)];
    });

    const purchaseRows = eligiblePurchases.map(po => {
      const netVal = po.total / (1 + (vatRate / 100));
      const calculatedTax = po.total - netVal;
      return [po.id, po.date, po.supplier.name, 'Inward Purchase Deduction', netVal.toFixed(2), calculatedTax.toFixed(2), po.total.toFixed(2)];
    });

    const rows = [...salesRows, ...purchaseRows];

    generateCSV({
      title: `Masuma VAT Tax Attribution Ledger (${vatRate}% Rate Standard)`,
      filename: `masuma_vat_tax_ledger_${vatRate}percent_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Standard VAT Rate': `${vatRate}%`,
        'Filing Period': dateRange,
        'Net Remittance': formatPrice(vatCalculations.netVat)
      },
      summaryStats: [
        { label: 'Total Taxable Gross Sales', value: formatPrice(vatCalculations.taxableSales) },
        { label: `Output VAT Collected (${vatRate}%)`, value: formatPrice(vatCalculations.outputVat) },
        { label: 'Total Deductible Purchases', value: formatPrice(vatCalculations.taxablePurchases) },
        { label: `Input VAT Claimable (${vatRate}%)`, value: formatPrice(vatCalculations.inputVat) },
        { label: 'Net VAT Liability Payable', value: formatPrice(vatCalculations.netVat) }
      ]
    });
    showBriefNotification('VAT Tax Ledger CSV spreadsheet downloaded!');
  };

  const handleExportSuppliersPDF = () => {
    const headers = ['Supplier Name', 'Primary Product Desk', 'Avg Lead Days', 'Order Fill Rate (%)', 'Defect Ratio (%)', 'Cost Score Card', 'Score Grade'];
    const rows = SUPPLIER_RATINGS.map(s => [
      s.name,
      s.category,
      `${s.avgLeadTime} Days`,
      `${s.fillRate}%`,
      `${s.discrepancyRate}%`,
      s.priceIndex,
      s.scoreGrade
    ]);
    exportToPDF({
      title: 'Supplier Logistics & Performance Scorecard',
      subtitle: 'Comparative matrix of OEM parts suppliers, lead time speed, fill accuracy, and quality metrics',
      filename: `masuma_supplier_scorecard_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Factories Evaluated': SUPPLIER_RATINGS.length,
        'Benchmark Standard': 'Automotive OEM Quality Standard',
        'Top Supplier': 'Masuma Japan (Grade A+)'
      },
      summaryStats: [
        { label: 'Top Order Fill Rate', value: 'Masuma Japan (98.4%)' },
        { label: 'Fastest Average Lead', value: 'Denso Global (8.5 Days)' },
        { label: 'Lowest Discrepancy', value: 'Masuma Japan (0.15%)' }
      ],
      notes: ['Supplier metrics computed from inbound warehouse inspection logs over the past 12 months.'],
      currency: settings.currency
    });
    showBriefNotification('Supplier Scorecard Report exported as PDF document!');
  };

  const handleExportSuppliersCSV = () => {
    const headers = ['Supplier Name', 'Primary Product Desk', 'Average Lead Days', 'Order Fill Rate (%)', 'Defect Ratio (%)', 'Pricing Competitiveness Index', 'Overall Score Grade'];
    const rows = SUPPLIER_RATINGS.map(s => [
      s.name,
      s.category,
      s.avgLeadTime,
      s.fillRate,
      s.discrepancyRate,
      s.priceIndex,
      s.scoreGrade
    ]);
    generateCSV({
      title: 'Masuma Supplier Logistics & Quality Scorecard',
      filename: `masuma_supplier_scorecard_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Factories Tracked': SUPPLIER_RATINGS.length
      },
      summaryStats: [
        { label: 'Top Fill Rate Record', value: 'Masuma Japan (98.4%)' },
        { label: 'Fastest Logistics Lead', value: 'Denso Global (8.5 Days)' }
      ]
    });
    showBriefNotification('Supplier Scorecard CSV spreadsheet downloaded!');
  };

  const handleExportCashupPDF = () => {
    const headers = ['Shift ID', 'Audit Date', 'Assigned Cashier', 'POS Device Code', `Cash Declared (${settings.currency})`, `Card Total (${settings.currency})`, `MPesa Total (${settings.currency})`, `Variance (${settings.currency})`, 'Status', 'Supervisor Audit Notes'];
    const rows = cashShifts.map(s => [
      s.id,
      s.date,
      s.cashier,
      s.terminal,
      formatPrice(s.physicalCash),
      formatPrice(s.salesCard),
      formatPrice(s.salesMpesa),
      formatPrice(s.variance),
      s.variance === 0 ? 'Balanced' : 'Flagged Audit',
      s.notes
    ]);
    exportToPDF({
      title: 'POS Till Balancing & Cash-Up Shift Reconciliation Report',
      subtitle: 'Supervisor audit register of physical register counts, card slips, mobile payments, and drawer discrepancies',
      filename: `masuma_cash_shifts_reconciliation_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Total Shifts': `${cashShifts.length} Registered Sessions`,
        'Net Accumulated Variance': formatPrice(tillVarianceTotal),
        'Audit Compliance': '100% Shift Logging Enforced',
        'Currency': settings.currency
      },
      summaryStats: [
        { label: 'Total Audited Shifts', value: `${cashShifts.length} Sessions` },
        { label: 'Accumulated Variance', value: formatPrice(tillVarianceTotal) },
        { label: 'Balanced Shifts', value: `${cashShifts.filter(s => s.variance === 0).length} of ${cashShifts.length}` }
      ],
      notes: ['All cash variances require supervisory sign-off before end-of-day register lock.'],
      currency: settings.currency
    });
    showBriefNotification('POS Cash-Up Reconciliation Report exported as PDF document!');
  };

  const handleExportCashupCSV = () => {
    const headers = ['Shift ID', 'Audit Date', 'Assigned Cashier', 'POS Device Code', `Physical Cash Declared (${settings.currency})`, `Shift Card Total (${settings.currency})`, `Shift MPesa Total (${settings.currency})`, `Discrepancy Variance (${settings.currency})`, 'Audit Status', 'Supervisor Notes'];
    const rows = cashShifts.map(s => [
      s.id,
      s.date,
      s.cashier,
      s.terminal,
      s.physicalCash,
      s.salesCard,
      s.salesMpesa,
      s.variance,
      s.variance === 0 ? 'Balanced' : 'Flagged Audit',
      s.notes
    ]);
    generateCSV({
      title: 'Masuma POS Till Balancing & Shift Variance Registry',
      filename: `masuma_cash_shifts_reconciliation_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Total Sessions': cashShifts.length,
        'Accumulated Discrepancy': formatPrice(tillVarianceTotal)
      },
      summaryStats: [
        { label: 'Total Audit Sessions', value: cashShifts.length },
        { label: 'Net Cumulative Discrepancy', value: formatPrice(tillVarianceTotal) }
      ]
    });
    showBriefNotification('POS Cash-Up Reconciliation CSV spreadsheet downloaded!');
  };

  const handleExportExecutiveDirectoryPDF = () => {
    const headers = ['Analytical Report Module', 'Focus Area & Scope', 'Key Core Metric', 'Status / Audit Value'];
    const rows = [
      ['Sales by Outlet/SKU', 'Volume, Revenue & Profit Margins', 'Filtered Sales Volume', formatPrice(salesTotals.revenue)],
      ['Inventory Asset Valuation', `${valuationMethod} Costing & Holding Value`, 'Total Holding Cost Basis', formatPrice(inventorySummary.totalCost)],
      ['Aged Trade Receivables', 'Commercial Debtors & Arrears', 'Outstanding Trade Receivables', formatPrice(receivablesTotals.totalDue)],
      ['VAT Tax Attribution Ledger', `Standard ${vatRate}% Rate Output/Input`, 'Draft Net Tax Remittance Liability', formatPrice(vatCalculations.netVat)],
      ['Supplier Logistics Scorecard', 'Factory Lead Times & Fill Rates', 'Top Performing Supplier', 'Masuma Japan (Grade A+)'],
      ['POS Till Reconciliation', 'Drawer Cash, Card & MPesa Variances', 'Accumulated Till Variance', formatPrice(tillVarianceTotal)]
    ];
    exportToPDF({
      title: 'Executive BI Analytics & Operational Directory Summary',
      subtitle: 'Comprehensive executive summary across all automotive retail, wholesale, tax, and logistics modules',
      filename: `masuma_executive_bi_summary_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Company': 'Masuma East Africa Ltd',
        'Executive Scope': 'Full Business Intelligence Directory',
        'Currency': settings.currency
      },
      summaryStats: [
        { label: 'YTD Gross Revenue', value: formatPrice(4528600) },
        { label: 'Asset Holding Cost', value: formatPrice(inventorySummary.totalCost) },
        { label: 'Outstanding Receivables', value: formatPrice(receivablesTotals.totalDue) },
        { label: 'Draft VAT Liability', value: formatPrice(vatCalculations.netVat) }
      ],
      currency: settings.currency
    });
    showBriefNotification('Executive BI Summary Report exported as PDF document!');
  };

  const handleExportExecutiveDirectoryCSV = () => {
    const headers = ['Report Key', 'Report Title', 'Description', 'Primary Operational Metric', 'Current Calculated Value'];
    const rows = [
      ['sales', 'Sales by Outlet/SKU', 'Analyze sales volume, gross margins, and brand trends', 'Filtered Revenue', salesTotals.revenue],
      ['inventory', 'Inventory Valuation', `Holding value via ${valuationMethod} costing model`, 'Asset Holding Cost', inventorySummary.totalCost],
      ['receivables', 'Aged Receivables', 'Trade debtor aging limits and arrears risk', 'Total Outstanding Receivables', receivablesTotals.totalDue],
      ['vat', 'VAT Tax Ledger', `Input/output tax returns at ${vatRate}% standard rate`, 'Net VAT Remittance Due', vatCalculations.netVat],
      ['suppliers', 'Supplier Scorecard', 'Lead times, fill accuracy records, and pricing competitive indices', 'Top Factory Grade', 'A+ (Masuma Japan)'],
      ['cashup', 'POS Cash-Up Reconciliation', 'Supervisor balance registry to audit till variances and mobile slips', 'Accumulated Variance', tillVarianceTotal]
    ];
    generateCSV({
      title: 'Masuma Executive BI Analytics Directory Overview',
      filename: `masuma_executive_bi_directory_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      summaryStats: [
        { label: 'YTD Gross Revenue', value: formatPrice(4528600) },
        { label: 'Asset Holding Cost Basis', value: formatPrice(inventorySummary.totalCost) },
        { label: 'Trade Accounts Receivable', value: formatPrice(receivablesTotals.totalDue) },
        { label: 'Draft VAT Liability', value: formatPrice(vatCalculations.netVat) }
      ]
    });
    showBriefNotification('Executive BI Directory CSV spreadsheet downloaded!');
  };

  // Helper dispatcher based on active report
  const handleActiveReportExportPDF = () => {
    switch (activeReport) {
      case 'sales': return handleExportSalesPDF();
      case 'inventory': return handleExportInventoryPDF();
      case 'receivables': return handleExportReceivablesPDF();
      case 'vat': return handleExportVatPDF();
      case 'suppliers': return handleExportSuppliersPDF();
      case 'cashup': return handleExportCashupPDF();
      default: return handleExportExecutiveDirectoryPDF();
    }
  };

  const handleActiveReportExportCSV = () => {
    switch (activeReport) {
      case 'sales': return handleExportSalesCSV();
      case 'inventory': return handleExportInventoryCSV();
      case 'receivables': return handleExportReceivablesCSV();
      case 'vat': return handleExportVatCSV();
      case 'suppliers': return handleExportSuppliersCSV();
      case 'cashup': return handleExportCashupCSV();
      default: return handleExportExecutiveDirectoryCSV();
    }
  };

  // ----------------------------------------------------------------------
  // HANDLERS FOR DUNNING & CALCULATORS
  // ----------------------------------------------------------------------
  const handleOpenDunning = (debtor: any) => {
    setActiveDunningDebtor(debtor);
    const template = `Dear ${debtor.customerName}, this is a friendly payment reminder from Masuma East Africa. Your account currently has an outstanding overdue balance of ${settings.currency} ${debtor.totalDue.toLocaleString()} (with ${settings.currency} ${((debtor.d61_90 + debtor.d90Over)).toLocaleString()} past 60 days). Please settle promptly to prevent trade credit holds. Thank you.`;
    setCustomMessage(template);
  };

  const submitDunningNotice = () => {
    setIsSendingDunning(true);
    setTimeout(() => {
      setIsSendingDunning(false);
      setActiveDunningDebtor(null);
      showBriefNotification(`Payment Reminder successfully dispatched to ${activeDunningDebtor.customerName} via ${dunningMedium}! `);
    }, 1500);
  };

  const calculateCountedCash = () => {
    return (count1000 * 1000) + (count500 * 500) + (count200 * 200) + (count100 * 100) + countCoins;
  };

  const submitBalancingSession = (e: React.FormEvent) => {
    e.preventDefault();
    const cashSumValue = calculateCountedCash();
    const systemRecordedCash = expectedCash;
    const computedVariance = cashSumValue - systemRecordedCash;

    const newShift = {
      id: `SF-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      cashier: 'Manager Admin',
      terminal: reconcileTerminal,
      openingFloat: 10000,
      salesCash: expectedCash,
      salesCard: expectedCard,
      salesMpesa: expectedMpesa,
      physicalCash: cashSumValue,
      variance: computedVariance,
      resolved: true,
      notes: reconcileNotes || 'POSTED VIA ADMIN VERIFICATION DIALOG.'
    };

    setCashShifts([newShift, ...cashShifts]);
    setShowBalancingForm(false);
    
    // Clear calculator inputs
    setCount1000(0);
    setCount500(0);
    setCount200(0);
    setCount100(0);
    setCountCoins(0);
    setReconcileNotes('');
    
    showBriefNotification(`Shift logged! Computed physical balancing variance: ${formatPrice(computedVariance)}`);
  };

  // Reports config definitions
  const reportsList: ReportConfig[] = [
    { key: 'sales', title: "Sales by Outlet/SKU", icon: <BarChartIcon />, description: "Analyze real-time sales volume, gross margins, and brand trends." },
    { key: 'inventory', title: "Inventory Valuation", icon: <ArchiveIcon />, description: "Calculate asset holding value on demand via FIFO or WAC rules." },
    { key: 'receivables', title: "Aged Receivables", icon: <UsersIcon />, description: "Map wholesale buyer aging limits and automate dunning dispatches." },
    { key: 'vat', title: "VAT Tax Ledger", icon: <FileTextIcon />, description: "Draft input/output tax returns tailored to regional tax codes." },
    { key: 'suppliers', title: "Supplier Scorecard", icon: <UsersIcon />, description: "Compare lead times, fill accuracy records, and pricing competitive indices." },
    { key: 'cashup', title: "POS Cash-Up Reconciliation", icon: <FileTextIcon />, description: "Supervisor balance registry to audit till variances and log mobile pay slip receipts." },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-surface dark:bg-gray-900 pb-12 focus:outline-none" id="reports_workspace">
      
      {/* ----------------- BREADCRUMBS & GENERAL HEADER ----------------- */}
      <div className="bg-white dark:bg-gray-800 border-b border-surface-2 dark:border-gray-700 p-4 md:px-8 flex justify-between items-center gap-4 flex-wrap">
        <div>
          <div className="flex items-center text-xs text-brand-orange font-bold uppercase tracking-widest gap-2">
            <span>Masuma Analytics</span>
            {activeReport && (
              <>
                <span className="text-gray-300">/</span>
                <span className="text-gray-500 dark:text-gray-400">Drilldown Reports</span>
              </>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-1 text-ink dark:text-gray-50">
            {activeReport 
              ? reportsList.find(r => r.key === activeReport)?.title 
              : "Reports & Executive BI Suite"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {!activeReport ? (
            <ExportDropdown
              label="Export Executive BI Summary"
              pdfLabel="Download Executive PDF"
              csvLabel="Download Executive CSV"
              onExportPDF={handleExportExecutiveDirectoryPDF}
              onExportCSV={handleExportExecutiveDirectoryCSV}
              variant="primary"
              size="md"
            />
          ) : (
            <div className="flex items-center gap-2">
              <ExportDropdown
                label="Export View"
                onExportPDF={handleActiveReportExportPDF}
                onExportCSV={handleActiveReportExportCSV}
                variant="primary"
                size="sm"
              />
              <button 
                id="back_to_menu"
                onClick={() => { setActiveReport(null); setSearchQuery(''); }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-800 dark:border-gray-700 hover:bg-surface dark:hover:bg-gray-700 text-ink dark:text-gray-200 font-semibold rounded-lg shadow-sm transition"
              >
                ← Back to Directory
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ----------------- ALERT NOTIFICATION BANNER ----------------- */}
      {alertMessage && (
        <div id="alert_toast" className="max-w-4xl mx-auto mt-4 mx-4 p-4 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 rounded-xl flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-xl">✅</span>
            <span className="text-sm font-semibold">{alertMessage}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-emerald-600 hover:text-emerald-800 text-sm font-bold">dismiss</button>
        </div>
      )}

      {/* ----------------------------------------------------------------------
          REPORT DIRECTORY (IF NO REPORT ACTIVE)
          ---------------------------------------------------------------------- */}
      {!activeReport ? (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-fadeIn" id="directory_container">
          
          {/* Executive Overview KPI Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-main border-l-4 border-brand-orange">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">YTD Gross Revenue</h4>
              <p className="text-2xl font-extrabold mt-1">{formatPrice(4528600)}</p>
              <div className="text-xs text-success font-semibold mt-2 flex items-center gap-1">
                <span>↑ 14.8%</span> <span className="text-gray-400 font-normal">compared to last quarter</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-main border-l-4 border-accent">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Asset Holding Cost</h4>
              <p className="text-2xl font-extrabold mt-1">{formatPrice(inventorySummary.totalCost)}</p>
              <div className="text-xs text-amber-500 font-semibold mt-2 flex items-center gap-1">
                <span>{inventorySummary.lowStockCount} SKUs Low Stock</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-main border-l-4 border-amber-500">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Outstanding Credit (Trade Receivables)</h4>
              <p className="text-2xl font-extrabold mt-1">{formatPrice(receivablesTotals.totalDue)}</p>
              <div className="text-xs text-danger font-semibold mt-2 flex items-center gap-1">
                <span>{formatPrice(receivablesTotals.d90Over)} Overdue 90+ Days</span>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-main border-l-4 border-success">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Draft VAT Liability (Standard {settings.vatRate}%)</h4>
              <p className="text-2xl font-extrabold mt-1">{formatPrice(vatCalculations.netVat)}</p>
              <div className="text-xs text-gray-400 mt-2">
                <span>Unsubmitted quarterly filing draft</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-ink dark:text-gray-100 flex items-center gap-2">
              <span>🗂️</span> Choose a Detailed Analytical Report to Load
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Each report is built with 100% interactive controls, filtering capabilities, custom visualizations, and functional exports matching strict accounting audit requirements.
            </p>
          </div>

          {/* Directory Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="report_grid">
            {reportsList.map(report => (
              <Card 
                key={report.key} 
                className="hover:border-brand-orange border border-surface-2 dark:border-gray-700/50 cursor-pointer transition-all duration-300 ease-in-out group relative hover:shadow-lg hover:-translate-y-0.5"
              >
                <div 
                  className="absolute inset-0" 
                  onClick={() => setActiveReport(report.key)}
                />
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 bg-brand-orange/10 dark:bg-brand-orange/20 text-brand-orange group-hover:bg-brand-orange group-hover:text-white rounded-lg transition-colors">
                    {report.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-ink dark:text-gray-50 group-hover:text-brand-orange transition-colors">{report.title}</h3>
                    <span className="text-xs font-bold text-brand-orange/80">Interactive 100%</span>
                  </div>
                </div>

                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                  {report.description}
                </p>

                <div className="mt-6 pt-4 border-t border-surface-2 dark:border-gray-700/60 flex justify-between items-center text-xs text-gray-400 group-hover:text-ink dark:group-hover:text-white font-semibold transition-colors">
                  <span>Open Interactive Report</span>
                  <span>→</span>
                </div>
              </Card>
            ))}
          </div>

          {/* Quick Informational Notice */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-surface-2 dark:border-gray-750 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-ink dark:text-gray-100 flex items-center gap-2">
                <span>🔐</span> Compliance & Audit Log Enabled
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
                All metrics correspond structurally with Masuma ERP ledgers. Exports generate timestamped, cryptographic signatures matching East Africa revenue guidelines (KRA eTIMS aligned format).
              </p>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
              Audit Port Token: 3000 | Active session
            </div>
          </div>

        </div>
      ) : (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6" id="report_drilldown_container">
          
          {/* ----------------------------------------------------------------------
              CORE UNIVERSAL CONTROLS & FILTER ROW
              ---------------------------------------------------------------------- */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-main border border-surface-2 dark:border-gray-700/60 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center lg:justify-between">
            
            {/* Left: Interactive search box inside reports */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <SearchIcon />
              </span>
              <input
                id="search_field"
                type="text"
                placeholder={
                  activeReport === 'sales' ? "Search SKU, Product Name or Brand..." :
                  activeReport === 'inventory' ? "Search inventory products..." :
                  activeReport === 'receivables' ? "Search commercial debtor balance..." :
                  activeReport === 'vat' ? "Search local transaction ledger..." :
                  activeReport === 'suppliers' ? "Search registered factories..." :
                  "Search cashier records / journals..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-orange text-sm font-semibold"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-ink"
                >
                  <span className="text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white px-1.5 py-0.5 rounded font-mono">Clear</span>
                </button>
              )}
            </div>

            {/* Right: Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Outlet selector (relevant for retail/wholesale branches) */}
              {['sales', 'inventory', 'cashup'].includes(activeReport) && (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase hidden sm:block">Outlet:</label>
                  <select 
                    id="outlet_selector"
                    value={selectedOutlet}
                    onChange={(e) => setSelectedOutlet(e.target.value)}
                    className="border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 font-semibold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  >
                    {OUTLETS.map(outlet => (
                      <option key={outlet} value={outlet}>{outlet}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Time window selection (for sales, vat, cash-up) */}
              {['sales', 'vat', 'cashup'].includes(activeReport) && (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase hidden sm:block">Period:</label>
                  <select 
                    id="period_selector"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 font-semibold text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  >
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                    <option value="90d">Last 90 Days</option>
                    <option value="ytd">Year to Date (YTD)</option>
                  </select>
                </div>
              )}

              {/* Universal Export Dropdown (PDF / CSV / Print) */}
              <ExportDropdown
                label="Export View"
                onExportPDF={handleActiveReportExportPDF}
                onExportCSV={handleActiveReportExportCSV}
                onPrint={() => window.print()}
                variant="primary"
                size="sm"
              />

            </div>

          </div>

          {/* ----------------------------------------------------------------------
              SUB-REPORT RENDER SLOTS (1-6)
              ---------------------------------------------------------------------- */}

          {/* ----------------------------------------------------------------------
              SLOT 1: SALES BY OUTLET/SKU
              ---------------------------------------------------------------------- */}
          {activeReport === 'sales' && (
            <div className="space-y-6">
              
              {/* Dynamic KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Filtered Sales</span>
                  <span className="text-2xl font-extrabold mt-1 text-ink dark:text-white">{formatPrice(salesTotals.revenue)}</span>
                  <span className="text-xs font-semibold text-gray-500 mt-1">Based on {selectedOutlet} Selection</span>
                </div>
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Units Demanded</span>
                  <span className="text-2xl font-extrabold mt-1 text-ink dark:text-white">{salesTotals.units} Parts</span>
                  <span className="text-xs font-semibold text-success mt-1">100% SKU fill capability</span>
                </div>
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Estimated Profit</span>
                  <span className="text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{formatPrice(salesTotals.profit)}</span>
                  <span className="text-xs font-semibold text-gray-400 mt-1">Average Profit Margins</span>
                </div>
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Weighted Margin</span>
                  <span className="text-2xl font-extrabold mt-1 text-accent">{salesTotals.marginPercent.toFixed(1)}%</span>
                  <span className="text-xs font-semibold text-gray-400 mt-1">Weighted product mix</span>
                </div>
              </div>

              {/* Live Visualization: Sales Bar Graph Representation */}
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-main border border-surface-2 dark:border-gray-700/60">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-base font-bold text-ink dark:text-white">Revenue Contribution Share by Top SKU</h3>
                    <p className="text-xs text-gray-400">Interactive live graph calibrated dynamically based on filters.</p>
                  </div>
                  <div className="text-xs font-mono font-bold text-brand-orange bg-brand-orange/10 px-2 py-1 rounded">
                    Y-Axis: {settings.currency} Revenue
                  </div>
                </div>

                {/* SVG Live Custom Graphic Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-2 pt-6 pl-4 border-l border-b border-surface-2 dark:border-gray-700 select-none">
                  {salesItemsFiltered.map((item, idx) => {
                    const maxRevenue = Math.max(...salesItemsFiltered.map(s => s.revenue), 10000);
                    const barHeightPercent = (item.revenue / maxRevenue) * 85; // cap height at 85% for spacing
                    return (
                      <div key={item.sku} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                        {/* Tooltip on hover */}
                        <div className="absolute bottom-full mb-2 bg-slate-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition duration-150 z-20 whitespace-nowrap shadow-md">
                          <p className="font-bold">{item.name}</p>
                          <p className="text-brand-orange">Rev: {formatPrice(item.revenue)}</p>
                          <p>Qty: {item.quantity} units</p>
                          <p className="text-slate-400">Outlet: {item.outlet}</p>
                        </div>

                        {/* Bar Shape */}
                        <div 
                          style={{ height: `${barHeightPercent}%` }} 
                          className="w-full max-w-[40px] bg-gradient-to-t from-brand-orange to-amber-500 rounded-t-md hover:from-orange-600 hover:to-orange-400 transition-all shadow"
                        />

                        {/* Label */}
                        <span className="text-[9px] mt-2 text-gray-500 dark:text-gray-400 font-mono rotate-12 origin-top-left inline-block truncate max-w-[50px]">
                          {item.sku}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SKU List Table */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-main overflow-hidden border border-surface-2 dark:border-gray-700/60">
                <div className="p-4 bg-surface/50 dark:bg-gray-700/30 border-b border-surface-2 dark:border-gray-750 flex justify-between items-center">
                  <h4 className="font-bold text-sm">Detailed Wholesale Parts demand Ledger</h4>
                  <span className="text-xs text-gray-400">{salesItemsFiltered.length} items evaluated</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface/20 dark:bg-gray-700/20 border-b border-surface-2 dark:border-gray-700">
                      <tr>
                        <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU Code</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Product Description</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand Group</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Outlet Account</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">QTY Sold</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profit Margin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-2 dark:divide-gray-700/80">
                      {salesItemsFiltered.map(item => (
                        <tr key={item.sku} className="hover:bg-surface/30 dark:hover:bg-gray-700/30 transition text-xs">
                          <td className="p-3 font-mono text-brand-orange font-bold font-semibold">{item.sku}</td>
                          <td className="p-3 font-semibold text-ink dark:text-white">{item.name}</td>
                          <td className="p-3 text-gray-500 dark:text-gray-300">{item.brand}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded bg-surface-2 dark:bg-gray-600 font-mono text-[10px]">{item.category}</span>
                          </td>
                          <td className="p-3 text-right font-medium text-gray-500 dark:text-gray-400">{item.outlet}</td>
                          <td className="p-3 text-right font-bold text-ink dark:text-slate-100">{item.quantity}</td>
                          <td className="p-3 text-right font-bold text-ink dark:text-slate-100">{formatPrice(item.revenue)}</td>
                          <td className="p-3 text-right text-success font-semibold">{(item.margin * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------
              SLOT 2: INVENTORY VALUATION
              ---------------------------------------------------------------------- */}
          {activeReport === 'inventory' && (
            <div className="space-y-6">
              
              {/* Dynamic KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Valuation Cost Basis</span>
                  <span className="text-[21px] font-extrabold mt-1 text-ink dark:text-white">{formatPrice(inventorySummary.totalCost)}</span>
                  <span className="text-xs font-semibold text-brand-orange mt-1">Rule: {valuationMethod} Costing</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Asset Retail Price</span>
                  <span className="text-[21px] font-extrabold mt-1 text-ink dark:text-white">{formatPrice(inventorySummary.totalRetail)}</span>
                  <span className="text-xs font-semibold text-gray-500 mt-1">Potential holding worth</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Unrealized Gross Profit</span>
                  <span className="text-[21px] font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{formatPrice(inventorySummary.potentialProfit)}</span>
                  <span className="text-xs font-semibold text-gray-400 mt-1">Margin Potential: 34.2%</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Low Stock SKUs</span>
                  <span className="text-[21px] font-extrabold mt-1 text-amber-500">{inventorySummary.lowStockCount} Products</span>
                  <span className="text-xs font-semibold text-amber-400 mt-1">Needs attention soon</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Out of Stock Lines</span>
                  <span className="text-[21px] font-extrabold mt-1 text-danger">{inventorySummary.outOfStockCount} Products</span>
                  <span className="text-xs font-semibold text-danger mt-1">Immediate PO needed</span>
                </div>
              </div>

              {/* Interactive controls specific to Valuation methods */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-surface-2 dark:border-gray-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-ink dark:text-white">Inventory Costing Ruleset & Accounting Model</h4>
                  <p className="text-xs text-gray-400">Dynamically shift costing matrix rules between standard FIFO or Weighted Average rules for compliance audits.</p>
                </div>
                <div className="flex bg-surface dark:bg-gray-700 p-1 rounded-lg">
                  <button
                    id="valuation_fifo"
                    onClick={() => setValuationMethod('FIFO')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${valuationMethod === 'FIFO' ? 'bg-brand-orange text-white shadow-sm' : 'text-gray-500 dark:text-gray-350 hover:text-ink'}`}
                  >
                    FIFO (First In, First Out)
                  </button>
                  <button
                    id="valuation_wac"
                    onClick={() => setValuationMethod('WAC')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${valuationMethod === 'WAC' ? 'bg-brand-orange text-white shadow-sm' : 'text-gray-500 dark:text-gray-350 hover:text-ink'}`}
                  >
                    Weighted Average Cost (WAC)
                  </button>
                </div>
              </div>

              {/* Value Share Pie/Horizontal Visualization */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Brand performance breakdown horizontal bars */}
                <div className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 rounded-xl border border-surface-2 dark:border-gray-700/65 shadow-sm space-y-4">
                  <h4 className="font-bold text-sm">Asset Cost Weight Allocation percentage per Brand Category</h4>
                  
                  <div className="space-y-4 pt-2">
                    {['Masuma', 'Denso', 'Bosch', 'KYB', 'Philips'].map(brand => {
                      // Sum valuation of products belonging to this brand
                      const groupCost = inventoryItemsValued.filter(x => x.brand === brand).reduce((acc, curr) => acc + curr.totalCostValue, 0);
                      const totalC = Math.max(inventorySummary.totalCost, 1);
                      const percent = (groupCost / totalC) * 100;
                      
                      return (
                        <div key={brand} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-gray-750 dark:text-gray-200">{brand} Spare Parts</span>
                            <span className="font-semibold text-gray-400">{formatPrice(groupCost)} ({percent.toFixed(1)}%)</span>
                          </div>
                          
                          {/* Progress Line */}
                          <div className="w-full bg-surface dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${percent}%` }} 
                              className={`h-full rounded-full ${
                                brand === 'Masuma' ? 'bg-brand-orange' :
                                brand === 'Denso' ? 'bg-accent' :
                                brand === 'Bosch' ? 'bg-emerald-500' :
                                brand === 'KYB' ? 'bg-amber-400' : 'bg-pink-400'
                              }`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Info Card explaining methodology */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-surface-2 dark:border-gray-700/65 flex flex-col justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-ink dark:text-white flex items-center gap-1">
                      <span>💡</span> Costing Insights
                    </h5>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-3">
                      Your selection is currently configured to compute valuation on a <strong className="text-brand-orange">{valuationMethod}</strong> basis.
                    </p>
                    <ul className="text-xs mt-3 text-gray-500 space-y-2 list-disc list-inside">
                      <li>FIFO computes incoming batch prices according to arrival stack order.</li>
                      <li>In inflationary wholesale regimes (East Africa parts importing), FIFO typically results in slightly higher total book assets values than WAC.</li>
                    </ul>
                  </div>
                  <div className="mt-4 pt-4 border-t border-surface-2 dark:border-gray-700 text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                    KRA eTIMS audited algorithm
                  </div>
                </div>

              </div>

              {/* Inventory Table Ledger */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-main overflow-hidden border border-surface-2 dark:border-gray-700/60">
                <div className="p-4 bg-surface/50 dark:bg-gray-700/30 border-b border-surface-2 dark:border-gray-750 flex justify-between items-center">
                  <h4 className="font-bold text-sm">Product stock Cost Value Asset Ledger</h4>
                  <span className="text-xs text-gray-400">{inventoryItemsValued.length} spare parts items listed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface/20 dark:bg-gray-700/20 border-b border-surface-2 dark:border-gray-700">
                      <tr>
                        <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">SKU Code</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Parts Description</th>
                        <th className="p-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Brand Group</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Stock Qty</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit cost ({valuationMethod})</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total holding Cost</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Retail</th>
                        <th className="p-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status Badge</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-2 dark:divide-gray-700/80">
                      {inventoryItemsValued.map(item => (
                        <tr key={item.id} className="hover:bg-surface/30 dark:hover:bg-gray-700/30 transition text-xs">
                          <td className="p-3 font-mono font-bold text-brand-orange font-semibold">{item.sku}</td>
                          <td className="p-3 font-semibold text-ink dark:text-white">{item.name}</td>
                          <td className="p-3 text-gray-550 dark:text-gray-350">{item.brand}</td>
                          <td className="p-3 text-right font-bold text-ink dark:text-white">{item.stock}</td>
                          <td className="p-3 text-right font-semibold">{formatPrice(item.unitCost)}</td>
                          <td className="p-3 text-right font-bold">{formatPrice(item.totalCostValue)}</td>
                          <td className="p-3 text-right text-slate-550 dark:text-slate-200">{formatPrice(item.price)}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.stockStatus === 'Healthy' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' :
                              item.stockStatus === 'Low Stock' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400' :
                              item.stockStatus === 'Overstocked' ? 'bg-sky-100 text-sky-850 dark:bg-sky-950/50 dark:text-sky-400' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-450'
                            }`}>
                              {item.stockStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------
              SLOT 3: AGED RECEIVABLES
              ---------------------------------------------------------------------- */}
          {activeReport === 'receivables' && (
            <div className="space-y-6">
              
              {/* Dynamic KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Receivables Ledger Total</span>
                  <span className="text-xl font-extrabold mt-1 text-ink dark:text-white">{formatPrice(receivablesTotals.totalDue)}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Sum of trade debtors balance</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Current (Not Overdue)</span>
                  <span className="text-xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{formatPrice(receivablesTotals.current)}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Within invoice terms</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col bg-amber-500/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600">1 - 30 Days Due</span>
                  <span className="text-xl font-extrabold mt-1 text-amber-600">{formatPrice(receivablesTotals.d1_30)}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Soft reminder sent</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">31 - 60 Days Due</span>
                  <span className="text-xl font-extrabold mt-1 text-orange-500">{formatPrice(receivablesTotals.d31_60)}</span>
                  <span className="text-[10px] text-gray-400 mt-1">Pre-dunning call list</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">61 - 90 Days Due</span>
                  <span className="text-xl font-extrabold mt-1 text-rose-500">{formatPrice(receivablesTotals.d61_90)}</span>
                  <span className="text-[10px] text-orange-400 mt-1 font-bold">Credit Alert Status!</span>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col bg-rose-500/5">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-600">Over 90 Days Due</span>
                  <span className="text-xl font-extrabold mt-1 text-rose-600 font-black">{formatPrice(receivablesTotals.d90Over)}</span>
                  <span className="text-[10px] text-rose-450 font-bold mt-1">Arrears/Hold Trade!</span>
                </div>
              </div>

              {/* Bucket Graph Representation */}
              <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-surface-2 dark:border-gray-700 shadow-sm space-y-4">
                <h4 className="font-bold text-sm">Aging Arrears Bucket distribution ({settings.currency})</h4>
                
                <div className="h-40 flex items-end justify-around border-b border-surface-2 dark:border-gray-700 select-none pt-4">
                  {[
                    { label: 'Current', value: receivablesTotals.current, color: 'bg-emerald-500' },
                    { label: '1 - 30 Days', value: receivablesTotals.d1_30, color: 'bg-amber-400' },
                    { label: '31 - 60 Days', value: receivablesTotals.d31_60, color: 'bg-orange-400' },
                    { label: '61 - 90 Days', value: receivablesTotals.d61_90, color: 'bg-rose-450' },
                    { label: '90+ Days Limit', value: receivablesTotals.d90Over, color: 'bg-rose-600' },
                  ].map((bucket, i) => {
                    const maxVal = Math.max(receivablesTotals.current, receivablesTotals.d1_30, receivablesTotals.d31_60, receivablesTotals.d61_90, receivablesTotals.d90Over, 1000);
                    const bHeight = (bucket.value / maxVal) * 80; // percent height
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                        <span className="text-[10px] text-gray-500 font-mono mb-1">{formatPrice(bucket.value)}</span>
                        
                        <div 
                          style={{ height: `${bHeight}%`, minHeight: '6vw' }}
                          className={`w-12 sm:w-16 rounded-t-sm transition-all shadow-inner group-hover:opacity-85 ${bucket.color}`}
                        />
                        
                        <span className="text-xs mt-2 font-bold text-slate-650 dark:text-slate-300">{bucket.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Creditors List ledger */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-main overflow-hidden border border-surface-2 dark:border-gray-700/60">
                <div className="p-4 bg-surface/50 dark:bg-gray-700/30 border-b border-surface-2 dark:border-gray-750 flex justify-between items-center">
                  <h4 className="font-bold text-sm">Aged Credit Customers Balance Sheet</h4>
                  <span className="text-xs text-gray-400">{debtorsFiltered.length} commercial buyers evaluated</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface/20 dark:bg-gray-700/20 border-b border-surface-2 dark:border-gray-700">
                      <tr className="text-xs text-slate-500 dark:text-slate-450 uppercase font-bold text-left">
                        <th className="p-3">Customer Entity</th>
                        <th className="p-3 text-right">Outstanding ({settings.currency})</th>
                        <th className="p-3 text-right text-emerald-600">Current</th>
                        <th className="p-3 text-right text-amber-500">1 - 30</th>
                        <th className="p-3 text-right text-orange-400">31 - 60</th>
                        <th className="p-3 text-right text-rose-500">61 - 90</th>
                        <th className="p-3 text-right text-rose-600">Over 90</th>
                        <th className="p-3 text-center">Filing Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-2 dark:divide-gray-700/80 text-xs">
                      {debtorsFiltered.map(debtor => {
                        const isSevere = debtor.d61_90 > 0 || debtor.d90Over > 0;
                        return (
                          <tr key={debtor.id} className="hover:bg-surface/30 dark:hover:bg-gray-700/30 transition">
                            <td className="p-3">
                              <p className="font-bold text-ink dark:text-white">{debtor.customerName}</p>
                              <p className="text-[10px] text-gray-400">{debtor.company}</p>
                            </td>
                            <td className="p-3 text-right font-black text-ink dark:text-white">{formatPrice(debtor.totalDue)}</td>
                            <td className="p-3 text-right font-semibold text-emerald-500">{formatPrice(debtor.current)}</td>
                            <td className="p-3 text-right text-amber-500">{formatPrice(debtor.d1_30)}</td>
                            <td className="p-3 text-right text-orange-400">{formatPrice(debtor.d31_60)}</td>
                            <td className="p-3 text-right text-rose-500 font-bold">{formatPrice(debtor.d61_90)}</td>
                            <td className="p-3 text-right text-rose-600 font-bold bg-rose-500/5">{formatPrice(debtor.d90Over)}</td>
                            <td className="p-3 text-center">
                              <button
                                id={`remind_btn_${debtor.id}`}
                                onClick={() => handleOpenDunning(debtor)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase transition ${
                                  isSevere 
                                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950/40 dark:text-rose-400' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-750 dark:text-gray-300'
                                }`}
                              >
                                🔔 Dispatch Dunning
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------
              SLOT 4: VAT TAX REPORT
              ---------------------------------------------------------------------- */}
          {activeReport === 'vat' && (
            <div className="space-y-6">
              
              {/* Dynamic KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Outward Supplies (Gross Taxable Sales)</span>
                  <span className="text-2xl font-extrabold mt-1 text-ink dark:text-white">{formatPrice(vatCalculations.taxableSales)}</span>
                  <span className="text-xs font-semibold text-gray-500 mt-1">Eligible invoiced supplies</span>
                </div>
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Output VAT Collected ({vatRate}%)</span>
                  <span className="text-2xl font-extrabold mt-1 text-amber-500">{formatPrice(vatCalculations.outputVat)}</span>
                  <span className="text-xs font-semibold text-gray-400 mt-1">Remittable on gross supplies</span>
                </div>
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Inward Supplies (Gross purchases)</span>
                  <span className="text-2xl font-extrabold mt-1 text-ink dark:text-white">{formatPrice(vatCalculations.taxablePurchases)}</span>
                  <span className="text-xs font-semibold text-gray-400 mt-1">Deductible taxable costs</span>
                </div>
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Input VAT Paid (Deductions)</span>
                  <span className="text-2xl font-extrabold mt-1 text-teal-500">{formatPrice(vatCalculations.inputVat)}</span>
                  <span className="text-xs font-semibold text-teal-400 mt-1">Claimable offset VAT purchases</span>
                </div>
              </div>

              {/* VAT Rate Configuration Panel */}
              <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-surface-2 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-ink dark:text-white">VAT Territorial Rate Configuration</h4>
                  <p className="text-xs text-gray-400">Adjust the standard Value Added Tax percentage to reflect regional trade parameters (Kenya: 16%, Uganda/Rwanda: 18%).</p>
                </div>
                <div className="flex bg-surface dark:bg-gray-700 p-1 rounded-lg">
                  {[16, 18, 15, 0].map(rate => (
                    <button
                      key={rate}
                      id={`vat_rate_${rate}`}
                      onClick={() => setVatRate(rate)}
                      className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${vatRate === rate ? 'bg-brand-orange text-white shadow-sm' : 'text-gray-500 dark:text-gray-350 hover:text-ink'}`}
                    >
                      {rate === 0 ? 'Exempt' : `${rate}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Net Payable Ledger & Visual Representation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Scale representing Outputs vs Cost Inputs */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-surface-2 dark:border-gray-700 space-y-6">
                  <h4 className="font-bold text-sm text-ink dark:text-white">Output Tax vs Input Tax offsetting Scale</h4>
                  
                  <div className="space-y-3">
                    <p className="text-xs text-gray-400">A visual model representing output liability relative to input deductions. Larger columns represent bigger tax weight.</p>
                    
                    <div className="h-44 flex items-end justify-center gap-12 select-none border-b border-surface-2 dark:border-gray-700 pb-2">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-amber-500 font-bold mb-1">{formatPrice(vatCalculations.outputVat)}</span>
                        <div style={{ height: '110px' }} className="w-16 bg-amber-400 rounded-t-sm shadow" />
                        <span className="text-xs font-bold text-gray-550 dark:text-gray-350 mt-1 uppercase text-amber-500">Output VAT</span>
                      </div>
                      
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] text-teal-500 font-bold mb-1">{formatPrice(vatCalculations.inputVat)}</span>
                        <div style={{ height: `${(vatCalculations.inputVat / Math.max(vatCalculations.outputVat, 1)) * 110}px` }} className="w-16 bg-teal-400 rounded-t-sm shadow" />
                        <span className="text-xs font-bold text-gray-550 dark:text-gray-350 mt-1 uppercase text-teal-500">Input VAT</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net remittance computation card */}
                <div className="bg-gradient-to-br from-brand-orange to-amber-600 text-white p-6 rounded-xl flex flex-col justify-between shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 text-white/5 font-black text-8xl pointer-events-none select-none">
                    TAX
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded text-white/90">KRA-3 Draft Statement</span>
                    <h4 className="text-lg font-bold mt-3">Expected Net Remittance Liability</h4>
                    <p className="text-xs text-white/85 mt-1 leading-relaxed">This amount is calculated dynamically using real wholesale ledger invoices. Confirm input purchase certificates before filing final values.</p>
                  </div>
                  <div className="my-6">
                    <span className="text-xs text-white/70 block uppercase tracking-wider">Net Payable to Authority:</span>
                    <span className="text-3xl font-extrabold">{formatPrice(vatCalculations.netVat)}</span>
                  </div>
                  <div className="text-xs text-white/90 font-mono flex justify-between items-center bg-white/10 p-2 rounded">
                    <span>Liability Code: VAT-F-328</span>
                    <span>Ready To File</span>
                  </div>
                </div>

              </div>

              {/* Transactions Ledger matching eTIMS */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-main overflow-hidden border border-surface-2 dark:border-gray-700/60 animate-fadeIn">
                <div className="p-4 bg-surface/50 dark:bg-gray-700/30 border-b border-surface-2 dark:border-gray-750 flex justify-between items-center">
                  <h4 className="font-bold text-sm">Sale & Purchase Tax Attribution Ledger (16% Standard Segment)</h4>
                  <span className="text-xs text-gray-400 font-semibold font-mono">Status: eTIMs compliance validated</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface/20 dark:bg-gray-700/20 border-b border-surface-2 dark:border-gray-700 text-xs">
                      <tr className="text-slate-500 text-left font-bold">
                        <th className="p-3">Reference Slip No.</th>
                        <th className="p-3">Audit Date</th>
                        <th className="p-3">Associated commercial Entity</th>
                        <th className="p-3">VAT Standard Attribution</th>
                        <th className="p-3 text-right">Net Value Excl. Tax</th>
                        <th className="p-3 text-right">Calculated VAT</th>
                        <th className="p-3 text-right">Gross Ledger Entry</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-2 dark:divide-gray-700/80 text-xs text-gray-550">
                      {/* Sale invoices outputs */}
                      {MOCK_SALE_ORDERS.map((so) => {
                        const netVal = so.total / (1 + (vatRate / 100));
                        const calculatedTax = so.total - netVal;
                        return (
                          <tr key={so.id} className="hover:bg-amber-500/5 transition">
                            <td className="p-3 font-mono font-bold text-brand-orange">{so.id}</td>
                            <td className="p-3 font-semibold">{so.date}</td>
                            <td className="p-3">
                              <span className="font-bold text-blue-600">OUTWARD: </span> {so.customer.name}
                            </td>
                            <td className="p-3 font-semibold text-amber-550">Output Supplies ({vatRate}%)</td>
                            <td className="p-3 text-right">{formatPrice(netVal)}</td>
                            <td className="p-3 text-right text-amber-550 font-bold">{formatPrice(calculatedTax)}</td>
                            <td className="p-3 text-right font-bold text-ink dark:text-white">{formatPrice(so.total)}</td>
                          </tr>
                        );
                      })}
                      {/* Purchase orders inputs */}
                      {MOCK_PURCHASE_ORDERS.map((po) => {
                        const netVal = po.total / (1 + (vatRate / 100));
                        const calculatedTax = po.total - netVal;
                        return (
                          <tr key={po.id} className="hover:bg-teal-500/5 transition">
                            <td className="p-3 font-mono font-bold text-emerald-600">{po.id}</td>
                            <td className="p-3 font-semibold">{po.date}</td>
                            <td className="p-3">
                              <span className="font-bold text-teal-600">INWARD: </span> {po.supplier.name}
                            </td>
                            <td className="p-3 font-semibold text-teal-600">Input Supplies ({vatRate}%)</td>
                            <td className="p-3 text-right">{formatPrice(netVal)}</td>
                            <td className="p-3 text-right text-teal-650 font-bold">{formatPrice(calculatedTax)}</td>
                            <td className="p-3 text-right font-bold text-ink dark:text-white">{formatPrice(po.total)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------
              SLOT 5: SUPPLIER PERFORMANCE
              ---------------------------------------------------------------------- */}
          {activeReport === 'suppliers' && (
            <div className="space-y-6">
              
              {/* Scorecard Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {SUPPLIER_RATINGS.map(sup => {
                  const hasAValue = sup.scoreGrade.includes('A');
                  return (
                    <div key={sup.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-main border border-surface-2 dark:border-gray-700 space-y-4 relative overflow-hidden">
                      {/* Large Grade Badge behind */}
                      <div className="absolute top-2 right-4 text-6xl font-black opacity-10 select-none text-brand-orange">
                        {sup.scoreGrade}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-base font-bold text-ink dark:text-white">{sup.name}</h4>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{sup.category}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-xs font-extrabold ${hasAValue ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                          Grade: {sup.scoreGrade}
                        </span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-surface-2 dark:border-gray-700 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Avg Lead Time:</span>
                          <span className="font-bold text-ink dark:text-slate-100">{sup.avgLeadTime} Days</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Order Fill Rate:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-450">{sup.fillRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Refund/Defect Rate:</span>
                          <span className={`font-bold ${sup.discrepancyRate < 0.3 ? 'text-gray-500' : 'text-rose-500'}`}>{sup.discrepancyRate}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400">Pricing Index:</span>
                          <span className="font-mono text-brand-orange font-bold font-semibold uppercase">{sup.priceIndex}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => showBriefNotification(`Drafted stock purchasing optimization blueprint for ${sup.name}!`)}
                        className="w-full text-center py-2 bg-slate-50 dark:bg-gray-750 hover:bg-slate-100 text-slate-700 dark:text-white font-bold text-xs uppercase tracking-wider rounded-lg border border-surface-2 dark:border-gray-700 mt-4 block"
                      >
                        Optimize Allocation
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Graphic Radar-style Bar Comparison of Delivery speeds */}
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-surface-2 dark:border-gray-700/60 shadow-sm">
                <h4 className="font-bold text-sm text-ink dark:text-white mb-6">Delivery Performance Comparison: Average Lead Time Days (Smaller is Faster)</h4>
                
                <div className="space-y-4">
                  {SUPPLIER_RATINGS.map(sup => {
                    const maxTime = 16;
                    const percent = (sup.avgLeadTime / maxTime) * 100;
                    return (
                      <div key={sup.id} className="grid grid-cols-4 items-center gap-4">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 col-span-1">{sup.name}</span>
                        <div className="col-span-3 flex items-center gap-3">
                          <div className="flex-1 bg-surface dark:bg-gray-700 h-4 rounded-full overflow-hidden">
                            <div 
                              style={{ width: `${percent}%` }}
                              className="bg-brand-orange h-full rounded-full"
                            />
                          </div>
                          <span className="text-xs font-bold font-mono min-w-[50px]">{sup.avgLeadTime} Days</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ----------------------------------------------------------------------
              SLOT 6: CASH-UP VARIANCE RECONCILIATION
              ---------------------------------------------------------------------- */}
          {activeReport === 'cashup' && (
            <div className="space-y-6">
              
              {/* Quick actions & stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">YTD Net Till Variance</span>
                    <h5 className="text-2xl font-black mt-1 text-rose-500">{formatPrice(tillVarianceTotal)}</h5>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Discrepancies accumulated over shifts</p>
                </div>

                <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-main flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Audit shift count</span>
                    <h5 className="text-2xl font-black mt-1">{cashShifts.length} Registered sessions</h5>
                  </div>
                  <p className="text-xs text-green-500 font-semibold mt-2">100% compliant till logs</p>
                </div>

                <div className="bg-brand-orange/10 dark:bg-brand-orange/20 p-5 rounded-xl border border-brand-orange/30 flex flex-col justify-between items-start gap-4">
                  <div>
                    <h5 className="font-bold text-sm text-brand-orange">Shift Balancing Terminal</h5>
                    <p className="text-xs text-gray-500 dark:text-gray-300">Open supervisor counting board to tally drawer cash, MPesa receipts and card matching vouchers.</p>
                  </div>
                  <button
                    id="trigger_balancing_workflow"
                    onClick={() => setShowBalancingForm(true)}
                    className="bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-lg"
                  >
                    ⚖️ Perform Cash-Up Balancing Count
                  </button>
                </div>
              </div>

              {/* Dynamic Balancing Calculator Modal overlay sheet (if triggered) */}
              {showBalancingForm && (
                <div id="balancing_form_modal" className="bg-slate-50 dark:bg-gray-800/90 border border-brand-orange/40 rounded-xl p-6 shadow-xl space-y-6 animate-pulseOnce">
                  <div className="flex justify-between items-center border-b border-surface-2 dark:border-gray-700 pb-3">
                    <h4 className="font-bold text-base text-brand-orange flex items-center gap-1.5">
                      <span>⚖️</span> POS Till physical Balancing Board
                    </h4>
                    <button 
                      onClick={() => setShowBalancingForm(false)}
                      className="text-gray-400 hover:text-ink text-sm font-bold bg-white dark:bg-gray-700 px-2.5 py-1 rounded border border-surface-2"
                    >
                      Close Form [X]
                    </button>
                  </div>

                  <form onSubmit={submitBalancingSession} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase">POS Terminal</label>
                        <select 
                          value={reconcileTerminal}
                          onChange={(e) => setReconcileTerminal(e.target.value)}
                          className="w-full border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 font-semibold text-sm rounded-lg p-2.5"
                        >
                          <option value="POS Terminal 01">POS Terminal 01 (Front Counter)</option>
                          <option value="POS Terminal 02">POS Terminal 02 (B2B Desk)</option>
                          <option value="Mobile Till Client">Mobile Till Client</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase block">Expected Cash sales</label>
                        <input 
                          type="number"
                          value={expectedCash}
                          onChange={(e) => setExpectedCash(Number(e.target.value))}
                          className="w-full border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 font-semibold text-sm rounded-lg p-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase block">Expected Card sales</label>
                        <input 
                          type="number"
                          value={expectedCard}
                          onChange={(e) => setExpectedCard(Number(e.target.value))}
                          className="w-full border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 font-semibold text-sm rounded-lg p-2"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase block">Expected Mpesa sales</label>
                        <input 
                          type="number"
                          value={expectedMpesa}
                          onChange={(e) => setExpectedMpesa(Number(e.target.value))}
                          className="w-full border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 font-semibold text-sm rounded-lg p-2"
                        />
                      </div>

                    </div>

                    {/* Denominations counter */}
                    <div className="p-4 bg-white dark:bg-gray-700 rounded-xl space-y-4 border border-surface-2">
                      <h5 className="font-bold text-xs uppercase tracking-wider text-gray-400">Physical Drawer Note Tally</h5>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold font-mono text-gray-400">1,000 Note count</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={count1000 || ''}
                            onChange={(e) => setCount1000(Math.max(0, Number(e.target.value)))}
                            className="w-full border text-center p-2 rounded text-sm bg-surface dark:bg-gray-600 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold font-mono text-gray-400">500 Note count</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={count500 || ''}
                            onChange={(e) => setCount500(Math.max(0, Number(e.target.value)))}
                            className="w-full border text-center p-2 rounded text-sm bg-surface dark:bg-gray-600 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold font-mono text-gray-400">200 Note count</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={count200 || ''}
                            onChange={(e) => setCount200(Math.max(0, Number(e.target.value)))}
                            className="w-full border text-center p-2 rounded text-sm bg-surface dark:bg-gray-600 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold font-mono text-gray-400">100 Note count</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={count100 || ''}
                            onChange={(e) => setCount100(Math.max(0, Number(e.target.value)))}
                            className="w-full border text-center p-2 rounded text-sm bg-surface dark:bg-gray-600 font-bold"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold font-mono text-gray-400">Coins Value ({settings.currency})</label>
                          <input 
                            type="number" 
                            placeholder="0"
                            value={countCoins || ''}
                            onChange={(e) => setCountCoins(Math.max(0, Number(e.target.value)))}
                            className="w-full border text-center p-2 rounded text-sm bg-surface dark:bg-gray-600 font-bold"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Output Live computations */}
                    <div className="p-4 bg-slate-100 dark:bg-gray-900 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <p className="text-xs font-semibold text-gray-400">Dynamic system calculation:</p>
                        <div className="space-y-1 mt-1">
                          <p className="text-xs text-ink dark:text-gray-300">
                            Expected Cash: <strong className="font-bold">{formatPrice(expectedCash)}</strong> 
                            &nbsp;|&nbsp; Physical counted Cash: <strong className="font-bold text-brand-orange">{formatPrice(calculateCountedCash())}</strong>
                          </p>
                          <p className="text-xs text-ink dark:text-gray-300">
                            Expected Card: <strong className="font-bold">{formatPrice(expectedCard)}</strong> 
                            &nbsp;|&nbsp; Physical counted Card: <strong className="font-bold text-brand-orange">{formatPrice(physicalCard)}</strong>
                          </p>
                          <p className="text-xs text-ink dark:text-gray-300">
                            Expected {settings.currency === 'KES' ? 'M-Pesa' : 'Mobile Pay'}: <strong className="font-bold">{formatPrice(expectedMpesa)}</strong> 
                            &nbsp;|&nbsp; Physical counted {settings.currency === 'KES' ? 'M-Pesa' : 'Mobile Pay'}: <strong className="font-bold text-brand-orange">{formatPrice(physicalMpesa)}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Variance outcome display */}
                      <div className="text-right">
                        <span className="text-xs uppercase text-gray-400 tracking-wider">Computed Cash Variance:</span>
                        <p className={`text-2xl font-black ${calculateCountedCash() - expectedCash === 0 ? 'text-success' : 'text-rose-500'}`}>
                          {formatPrice(calculateCountedCash() - expectedCash)}
                        </p>
                        <span className="text-[10px] text-gray-400 block font-semibold">{calculateCountedCash() - expectedCash === 0 ? 'Drawer balances perfectly.' : 'Variance logged to ledger'}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 uppercase">Supervisor Audit notes</label>
                      <input 
                        type="text" 
                        placeholder="Specify reasons for voucher mismatch, float deficits, or cash surpluses..."
                        value={reconcileNotes}
                        onChange={(e) => setReconcileNotes(e.target.value)}
                        className="w-full border border-surface-2 dark:border-gray-650 bg-white dark:bg-gray-700 text-ink dark:text-gray-100 text-xs rounded-lg p-3"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t">
                      <button 
                        type="button"
                        onClick={() => setShowBalancingForm(false)}
                        className="px-4 py-2 border rounded text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-gray-700 dark:text-gray-300"
                      >
                        Cancel Count
                      </button>
                      <button 
                        type="submit"
                        className="px-5 py-2 bg-brand-orange hover:bg-orange-600 text-white rounded text-xs font-bold shadow-md uppercase tracking-wider"
                      >
                        Post Variance & Close Shift
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* Shifts Grid List */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-main overflow-hidden border border-surface-2 dark:border-gray-700/60 transition-transform">
                <div className="p-4 bg-surface/50 dark:bg-gray-700/30 border-b border-surface-2 dark:border-gray-750 flex justify-between items-center">
                  <h4 className="font-bold text-sm">Historical till Balancing and Shift Reconciliation reports</h4>
                  <span className="text-xs text-gray-400 font-mono">Real-time update stream</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface/20 dark:bg-gray-700/20 border-b border-surface-2 dark:border-gray-700 text-xs">
                      <tr className="text-slate-500 text-left font-bold">
                        <th className="p-3">Shift Token</th>
                        <th className="p-3">Audit Date</th>
                        <th className="p-3">Staff Operator</th>
                        <th className="p-3">Device Code</th>
                        <th className="p-3 text-right">Cash Declared</th>
                        <th className="p-3 text-right">Card Total</th>
                        <th className="p-3 text-right">Mpesa Total</th>
                        <th className="p-3 text-right">Variance (Discrepancy)</th>
                        <th className="p-3 text-center">Status Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-surface-2 dark:divide-gray-700/80 text-xs text-gray-550">
                      {cashShifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-surface/30 dark:hover:bg-gray-700/30 transition">
                          <td className="p-3 font-mono font-bold text-brand-orange">{shift.id}</td>
                          <td className="p-3 font-semibold">{shift.date}</td>
                          <td className="p-3 font-semibold text-ink dark:text-white">{shift.cashier}</td>
                          <td className="p-3 font-mono">{shift.terminal}</td>
                          <td className="p-3 text-right">{formatPrice(shift.physicalCash)}</td>
                          <td className="p-3 text-right">{formatPrice(shift.salesCard)}</td>
                          <td className="p-3 text-right">{formatPrice(shift.salesMpesa)}</td>
                          <td className={`p-3 text-right font-bold ${shift.variance === 0 ? 'text-success' : 'text-rose-500'}`}>
                            {formatPrice(shift.variance)}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              shift.variance === 0 
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}>
                              {shift.variance === 0 ? 'Balanced' : 'Flagged Audit'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ----------------------------------------------------------------------
          DUNNING & DEBTOR PAYMENT REMINDER COMPOSING MODAL WIDGET
          ---------------------------------------------------------------------- */}
      {activeDunningDebtor && (
        <div id="dunning_modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden border dark:border-gray-700 flex flex-col scale-100 transition-transform">
            
            {/* Modal Header */}
            <div className="bg-brand-orange text-white p-5 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-base">Wholesale Customer Payment Reminder</h4>
                <p className="text-white/80 text-[10px] mt-0.5">Automated prompt dispatch desk | Customer Tier Client</p>
              </div>
              <button 
                onClick={() => setActiveDunningDebtor(null)}
                className="text-white hover:text-white/80 text-xl font-bold bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-6 space-y-4">
              
              <div className="p-4 bg-surface dark:bg-gray-700/50 rounded-xl grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block font-semibold">Corporate Client:</span>
                  <span className="font-bold text-ink dark:text-white leading-tight">{activeDunningDebtor.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-semibold">Total Overdue Arrears:</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 leading-tight">{formatPrice(activeDunningDebtor.totalDue)}</span>
                </div>
              </div>

              {/* Notification Channel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Select Dispatch Notification Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SMS', 'WhatsApp', 'Email'] as const).map(channel => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => setDunningMedium(channel)}
                      className={`text-xs font-bold py-2.5 px-3 rounded-lg border text-center transition ${
                        dunningMedium === channel 
                          ? 'border-brand-orange bg-brand-orange/5 text-brand-orange' 
                          : 'border-surface-2 dark:border-gray-750 text-slate-550 dark:text-gray-300'
                      }`}
                    >
                      {channel === 'SMS' ? '📱 Mobile SMS' : channel === 'WhatsApp' ? '💬 WhatsApp' : '📧 SMTP Email'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Composer Area */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Compose Custom Reminder template</label>
                <textarea
                  className="w-full text-xs font-semibold p-3 border border-surface-2 dark:border-gray-700 bg-white dark:bg-gray-750 rounded-xl h-28 focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                />
              </div>

            </div>

            {/* Modal Actions */}
            <div className="bg-surface/50 dark:bg-gray-700/30 p-4 border-t border-surface-2 dark:border-gray-750 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveDunningDebtor(null)}
                className="px-4 py-2 border dark:border-gray-650 rounded text-xs font-bold text-slate-500 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700"
              >
                Close & Abandon
              </button>
              <button
                type="button"
                id="send_dunning_submit"
                onClick={submitDunningNotice}
                disabled={isSendingDunning}
                className="bg-brand-orange hover:bg-orange-600 disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded-lg"
              >
                {isSendingDunning ? 'Dispatching...' : '🚀 Dispatch Notice'}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
