import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS, MOCK_SALE_ORDERS } from '../data/mockData';
import PageHeader from '../components/shared/PageHeader';
import Table, { TableRowAction } from '../components/shared/Table';
import type { Product, SaleOrder } from '../types';
import { Search, X, Package, AlertTriangle, Coins, Zap, BarChart2, Download, FileText, Printer, Scan, Camera, ShieldCheck, CheckCircle2, Eye, Edit3, Trash2, Copy, TrendingUp, ShieldAlert, Lock, Link2, MapPin, Upload, FolderArchive } from 'lucide-react';
import { useSystemSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { exportToPDF, exportToCSV as generateCSV } from '../utils/exportUtils';
import ExportDropdown from '../components/shared/ExportDropdown';
import { QRScannerModal } from '../components/shared/QRScannerModal';
import { ProductQuickInspectorModal } from '../components/shared/ProductQuickInspectorModal';
import { OrderVerificationModal } from '../components/shared/OrderVerificationModal';
import { ProductPriceTrendSection } from '../components/inventory/ProductPriceTrendSection';

const Inventory: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  const { hasPermission, userRole, getRoleBadge } = useAuth();

  const canCreate = hasPermission('inventory', 'create');
  const canUpdate = hasPermission('inventory', 'update');
  const canDelete = hasPermission('inventory', 'delete');
  const canExport = hasPermission('inventory', 'export');
  const canPO = hasPermission('purchasing', 'create');
  
  // State for active sales history view & active hub tab
  const [selectedProductHistory, setSelectedProductHistory] = useState<Product | null>(null);
  const [hubTab, setHubTab] = useState<'trends' | 'sales' | 'specs'>('trends');

  // Scanner & Modal states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [verifiedOrder, setVerifiedOrder] = useState<SaleOrder | null>(null);
  const [scannerToast, setScannerToast] = useState<{ message: string; isError?: boolean } | null>(null);

  const triggerToast = (message: string, isError = false) => {
    setScannerToast({ message, isError });
    setTimeout(() => setScannerToast(null), 3500);
  };

  const getProductSalesHistory = (product: Product) => {
    const history: Array<{
      orderId: string;
      customerName: string;
      date: string;
      status: SaleOrder['status'];
      quantity: number;
      price: number;
    }> = [];

    const ordersToSearch = salesOrdersList;
    ordersToSearch.forEach(order => {
      order.items?.forEach(item => {
        if (item.productName.toLowerCase() === product.name.toLowerCase()) {
          history.push({
            orderId: order.id,
            customerName: order.customer.name,
            date: order.date,
            status: order.status,
            quantity: item.quantity,
            price: item.price
          });
        }
      });
    });

    return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };
  
  // Persistent Inventory state
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('masuma_products');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading products from local storage', e);
      }
    }
    return MOCK_PRODUCTS;
  });

  // Persistent Sales Orders state for Order Verification
  const [salesOrdersList, setSalesOrdersList] = useState<SaleOrder[]>(() => {
    const saved = localStorage.getItem('masuma_sales_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading sales orders in Inventory', e);
      }
    }
    return MOCK_SALE_ORDERS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'low' | 'out'>('all');
  
  // Edit & Add Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Custom CSV Import Modal states
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [importFeedback, setImportFeedback] = useState<{
    status: 'idle' | 'success' | 'error';
    message: string;
    itemsCount?: number;
  }>({ status: 'idle', message: '' });
  const [importPreview, setImportPreview] = useState<Product[]>([]);
  const [duplicateMode, setDuplicateMode] = useState<'overwrite' | 'skip' | 'make-unique'>('overwrite');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    oemCode: '',
    brand: '',
    category: '',
    price: 1500,
    stock: 50,
    minStockLevel: 10,
    binLocation: 'W1-A4',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200'
  });

  // Sync to database
  useEffect(() => {
    localStorage.setItem('masuma_products', JSON.stringify(products));
  }, [products]);

  const getStatus = (product: Product) => {
    const minLevel = product.minStockLevel || 10;
    if (product.stock === 0) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-red-800 bg-red-100 dark:text-red-350 dark:bg-red-950/40 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Depleted</span>;
    if (product.stock <= minLevel) return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-950/40 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Reorder ({product.stock})</span>;
    return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-950/40 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Normal ({product.stock})</span>;
  };

  const handleAddProductClick = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `MSM-${Math.floor(100000 + Math.random() * 900000)}`,
      oemCode: '',
      brand: '',
      category: 'Uncategorized',
      price: 2500,
      stock: 35,
      minStockLevel: 8,
      binLocation: `W${Math.floor(1 + Math.random() * 4)}-Row${Math.floor(1 + Math.random() * 8)}`,
      imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200'
    });
    setIsModalOpen(true);
  };

  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      oemCode: prod.oemCode || '',
      brand: prod.brand,
      category: prod.category || 'Uncategorized',
      price: prod.price,
      stock: prod.stock,
      minStockLevel: prod.minStockLevel || 10,
      binLocation: prod.binLocation || 'W1-A1',
      imageUrl: prod.imageUrl
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.brand) {
      alert('⚠️ Name and Brand fields reflect required core configurations!');
      return;
    }

    if (editingProduct) {
      setProducts(prev => prev.map(p => p.id === editingProduct.id ? {
        ...p,
        name: formData.name,
        brand: formData.brand,
        oemCode: formData.oemCode,
        sku: formData.sku,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        minStockLevel: Number(formData.minStockLevel),
        binLocation: formData.binLocation
      } : p));
    } else {
      const newProduct: Product = {
        id: Date.now(),
        name: formData.name,
        brand: formData.brand,
        oemCode: formData.oemCode,
        sku: formData.sku,
        category: formData.category,
        price: Number(formData.price),
        stock: Number(formData.stock),
        minStockLevel: Number(formData.minStockLevel),
        binLocation: formData.binLocation,
        imageUrl: formData.imageUrl
      };
      setProducts(prev => [newProduct, ...prev]);
    }
    setIsModalOpen(false);
  };

  const triggerDraftPO = (product: Product) => {
    const qtyToOrder = (product.minStockLevel || 10) * 3 - product.stock;
    alert(`⚡ Purchasing Order Draft Prefilled!\nMerchant: Masuma Global Supply LLC\nItem: ${product.name}\nQuantity Target: ${qtyToOrder} Parts\nWarehouse Slot: ${product.binLocation || 'Unassigned'}\n\nReview & dispatch in the "Purchasing" system tab.`);
  };

  // Filter application
  const filteredProducts = products.filter(p => {
    const matchesQuery = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.oemCode && p.oemCode.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesQuery) return false;

    const minimum = p.minStockLevel || 10;
    if (filterTab === 'low') {
      return p.stock <= minimum && p.stock > 0;
    }
    if (filterTab === 'out') {
      return p.stock === 0;
    }
    return true;
  });

  // ----------------------------------------------------------------------
  // SEAMLESS & ACCURATE EXPORT: Comprehensive PDF & CSV Generation
  // ----------------------------------------------------------------------
  const handleExportInventoryPDF = () => {
    const totalWealth = filteredProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const lowCount = filteredProducts.filter(p => p.stock <= (p.minStockLevel || 10) && p.stock > 0).length;
    const outCount = filteredProducts.filter(p => p.stock === 0).length;

    const headers = [
      'SKU Code', 'Component Name', 'Brand', 'Category', 'OEM Code', 'Bin Loc', 'Stock Qty', 'Min Level', `Unit Price (${settings.currency})`, `Valuation (${settings.currency})`
    ];

    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.brand,
      p.category || 'Uncategorized',
      p.oemCode || 'N/A',
      p.binLocation || 'W1-A1',
      p.stock.toString(),
      (p.minStockLevel || 10).toString(),
      formatPrice(p.price),
      formatPrice(p.price * p.stock)
    ]);

    exportToPDF({
      title: 'Masuma Automotive Parts & Inventory Catalog',
      subtitle: 'Complete SKU inventory ledger, bin location mapping, and holding valuation',
      filename: `masuma_inventory_catalog_${filterTab}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'Catalog Scope': filterTab === 'all' ? 'All Registered SKUs' : filterTab === 'low' ? 'Low Stock Warning Items' : 'Depleted Stock Items',
        'Search Filter': searchTerm || 'None (All Records)',
        'Active SKUs Displayed': filteredProducts.length,
        'Base Valuation Mode': 'Physical FIFO / Standard Cost'
      },
      summaryStats: [
        { label: 'Total Catalog Value', value: formatPrice(totalWealth) },
        { label: 'SKU Count in View', value: `${filteredProducts.length} Items` },
        { label: 'Low Stock Warnings', value: `${lowCount} Parts` },
        { label: 'Depleted / Out-of-Stock', value: `${outCount} Parts` }
      ],
      notes: [
        'Physical count verification conducted regularly.',
        'Ensure automatic PO trigger parameters align with procurement SLA policies.'
      ],
      currency: settings.currency
    });
  };

  const handleExportInventoryCSV = () => {
    const totalWealth = filteredProducts.reduce((acc, p) => acc + (p.price * p.stock), 0);
    const headers = [
      'SKU Code', 'Product Name', 'Brand', 'Category', 'Price', 'Physical Stock', 
      'Min Safety Stock', 'OEM Code', 'Bin Location', 'Asset Valuation', 'Image URL'
    ];

    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.brand,
      p.category || 'Uncategorized',
      p.price,
      p.stock,
      p.minStockLevel || 10,
      p.oemCode || '',
      p.binLocation || '',
      p.price * p.stock,
      p.imageUrl || ''
    ]);

    generateCSV({
      title: 'Masuma Automotive Parts Inventory Catalog',
      filename: `masuma_inventory_catalog_${filterTab}_${new Date().toISOString().slice(0, 10)}`,
      headers,
      rows,
      metadata: {
        'View Tab': filterTab.toUpperCase(),
        'Search Keyword': searchTerm || 'ALL',
        'Total Lines': filteredProducts.length,
        'Holding Asset Wealth': formatPrice(totalWealth)
      },
      summaryStats: [
        { label: 'Total Stock Valuation', value: formatPrice(totalWealth) },
        { label: 'Total SKUs Exported', value: `${filteredProducts.length} items` }
      ]
    });
  };

  const handleExportToCSV = handleExportInventoryCSV;

  // ----------------------------------------------------------------------
  // DRAFT TEMPLATE EXPORTER
  // ----------------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const headers = [
      'SKU', 'Name', 'Brand', 'Category', 'Price', 'Stock', 'Min Stock Level', 'OEM Code', 'Bin Location'
    ];
    const sampleRow = [
      'MS-BP-999', 'Premium Disc Brake Pads Toyota', 'Masuma', 'Brake Systems', '4500', '40', '15', '04465-30340', 'W3-B4-S2'
    ];
    const csvContent = "\uFEFF" + [headers.join(","), sampleRow.join(",")].join("\n");
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `masuma_inventory_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ----------------------------------------------------------------------
  // SEAMLESS & ACCURATE PARSING SUITE (RFC 4180 COMPLIANT)
  // ----------------------------------------------------------------------
  const parseCSVText = (text: string): string[][] => {
    const lines: string[][] = [];
    let row: string[] = [];
    let inQuotes = false;
    let currentCell = '';

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        row.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') {
          i++;
        }
        row.push(currentCell.trim());
        lines.push(row);
        row = [];
        currentCell = '';
      } else {
        currentCell += char;
      }
    }
    if (currentCell || row.length > 0) {
      row.push(currentCell.trim());
      lines.push(row);
    }
    return lines.filter(r => r.length > 0 && r.some(cell => cell !== ''));
  };

  const handleFileUpload = (content: string) => {
    try {
      const parsedRows = parseCSVText(content);
      if (parsedRows.length < 2) {
        setImportFeedback({ status: 'error', message: '⚠️ CSV file appears empty or missing header definitions.' });
        return;
      }

      const rawHeaders = parsedRows[0];
      const dataRows = parsedRows.slice(1);

      // Map lowercased normalized index
      const headerIndexes: Record<string, number> = {};
      rawHeaders.forEach((header, index) => {
        const key = header.toLowerCase().replace(/[^a-z0-9]/g, '');
        headerIndexes[key] = index;
      });

      // Alias checker
      const getVal = (row: string[], aliases: string[]) => {
        for (const alias of aliases) {
          const normalized = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          const idx = headerIndexes[normalized];
          if (idx !== undefined && row[idx] !== undefined) {
            return row[idx];
          }
        }
        return '';
      };

      const mappedProducts: Product[] = dataRows.map((row, rIdx) => {
        const name = getVal(row, ['name', 'title', 'component', 'item', 'product']);
        const brand = getVal(row, ['brand', 'manufacturer', 'make']) || 'Masuma';
        const rawSku = getVal(row, ['sku', 'partnumber', 'skuid', 'b2bskuid', 'code']);
        const sku = rawSku ? rawSku.toUpperCase() : `MSM-${Math.floor(100000 + Math.random() * 900000)}`;
        const oemCode = getVal(row, ['oem', 'oemcode', 'oemreference', 'reference', 'interchange']).toUpperCase();
        const category = getVal(row, ['category', 'group', 'class']) || 'Uncategorized';
        
        const rawPrice = getVal(row, ['price', 'salesprice', 'retailprice', 'pricekes', 'cost', 'baseprice']);
        const price = Math.max(1, parseFloat(rawPrice.replace(/[^0-9.]/g, '')) || 1500);

        const rawStock = getVal(row, ['stock', 'inventory', 'quantity', 'qty', 'count', 'physicalstock']);
        const stock = Math.max(0, parseInt(rawStock.replace(/[^0-9]/g, ''), 10) || 12);

        const rawMin = getVal(row, ['minstock', 'safetylevel', 'reorderlevel', 'minstocklevel', 'safetyqty']);
        const minStockLevel = Math.max(1, parseInt(rawMin.replace(/[^0-9]/g, ''), 10) || 8);

        const binLocation = getVal(row, ['binlocation', 'bin', 'shelf', 'location', 'storageslot']).toUpperCase() || 'W1-A4';
        const imageUrl = getVal(row, ['image', 'imageurl', 'photo', 'url']) || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200';

        return {
          id: Date.now() + rIdx,
          sku,
          name: name || `Autopart ${sku}`,
          brand,
          category,
          price,
          stock,
          minStockLevel,
          binLocation,
          imageUrl
        };
      });

      setImportPreview(mappedProducts);
      setImportFeedback({
        status: 'success',
        message: `Successfully parsed ${mappedProducts.length} entries. Review mapped schema, choose conflict resolution preferences, and lock save!`,
        itemsCount: mappedProducts.length
      });
    } catch (err: any) {
      setImportFeedback({ status: 'error', message: `⚠️ Internal parsing error at catalog compilation: ${err.message}` });
    }
  };

  const executeBulkCommit = () => {
    if (importPreview.length === 0) return;

    let updatedList = [...products];

    importPreview.forEach(newP => {
      const matchIdx = updatedList.findIndex(x => x.sku.toUpperCase() === newP.sku.toUpperCase());

      if (matchIdx > -1) {
        if (duplicateMode === 'overwrite') {
          // Keep identical ID, overwrite matching fields
          updatedList[matchIdx] = {
            ...updatedList[matchIdx],
            name: newP.name,
            brand: newP.brand,
            category: newP.category,
            price: newP.price,
            stock: newP.stock,
            minStockLevel: newP.minStockLevel,
            binLocation: newP.binLocation,
            imageUrl: newP.imageUrl
          };
        } else if (duplicateMode === 'make-unique') {
          // Add suffix to SKU
          const cloned = { ...newP, sku: `${newP.sku}-DUP-${Math.floor(10 + Math.random() * 89)}`, id: Date.now() + Math.random() };
          updatedList.unshift(cloned);
        }
        // If "skip", do nothing
      } else {
        // No conflict, insert directly
        updatedList.unshift(newP);
      }
    });

    setProducts(updatedList);
    setIsImportModalOpen(false);
    setImportPreview([]);
    setImportFeedback({ status: 'idle', message: '' });
    alert(`👏 BULK INTEGRATION SECURED: Catalog database updated matching selected policies.`);
  };

  // Drag and drop events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleFileUpload(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          handleFileUpload(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleStockCorrection = (productId: number, newStock: number, reason: string) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    if (inspectedProduct && inspectedProduct.id === productId) {
      setInspectedProduct(prev => prev ? { ...prev, stock: newStock } : null);
    }
    triggerToast(`✓ Stock count adjusted to ${newStock} units (${reason})`);
  };

  const columns = [
    { 
      header: 'Component Details', 
      accessor: (item: Product) => (
        <div 
          onClick={() => setSelectedProductHistory(item)}
          className="flex items-center gap-3 cursor-pointer group"
          title="Click to view full specs & Sales History"
        >
          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded border border-slate-200 dark:border-slate-700 bg-slate-50 group-hover:opacity-85 transition-opacity" referrerPolicy="no-referrer" />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-brand-orange group-hover:underline transition-all">{item.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Brand: <strong className="text-slate-700 dark:text-slate-300 group-hover:text-slate-950 dark:group-hover:text-white transition-colors">{item.brand}</strong></span>
              <span>•</span>
              <span>SKU: <strong className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{item.sku}</strong></span>
            </div>
          </div>
        </div>
      )
    },
    { 
      header: 'OEM / Interchange Code', 
      accessor: (item: Product) => (
        <div className="font-mono text-xs">
          {item.oemCode ? (
             <span className="bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 px-2 py-1 rounded font-bold border border-slate-200 dark:border-slate-600">
               <span className="inline-flex items-center gap-1.5"><Link2 className="w-3 h-3 text-slate-400 shrink-0" /><span>{item.oemCode}</span></span>
             </span>
          ) : (
             <span className="text-slate-450 italic">- None -</span>
          )}
        </div>
      ) 
    },
    { 
      header: 'Distribution Slot (Shelf Bin)', 
      accessor: (item: Product) => (
        <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded text-xs border border-indigo-100 dark:border-indigo-900/30">
          <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-indigo-500 shrink-0" /><span>{item.binLocation || 'UN-SLOTTED'}</span></span>
        </span>
      ) 
    },
    { 
      header: 'Audit Stock', 
      accessor: (item: Product) => (
        <div className="text-xs">
          <div className="font-black text-sm text-slate-800 dark:text-gray-100">{item.stock} Units</div>
          <div className="text-slate-450 mt-0.5">Safety Level: {item.minStockLevel || 10}</div>
        </div>
      )
    },
    { header: 'Base Margin Price', accessor: (item: Product) => <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatPrice(item.price)}</span> },
    { header: 'Status Grid', accessor: (item: Product) => getStatus(item) },
    { 
      header: 'Operations', 
      accessor: (item: Product) => (
        <div className="flex gap-2 items-center text-xs">
          {canUpdate && (
            <button 
               onClick={() => setInspectedProduct(item)}
               className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded font-bold transition-all flex items-center gap-1 border border-amber-200 dark:border-amber-800/40 cursor-pointer"
               title="Quick physical stock count adjustment & print shelf QR tag"
            >
               <Scan className="w-3.5 h-3.5" />
               <span>Audit / QR</span>
            </button>
          )}
          <button 
             onClick={() => {
               setSelectedProductHistory(item);
               setHubTab('trends');
             }}
             className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded font-bold transition-all flex items-center gap-1 border border-indigo-200 dark:border-indigo-800/40 cursor-pointer"
             title="View Price Trends, Gross Margin & Procurement Analytics"
          >
             <BarChart2 className="w-3.5 h-3.5" />
             <span>Trends & Sales</span>
          </button>
          {canUpdate && (
            <button 
               onClick={() => handleEditProductClick(item)}
               className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded font-bold transition-all cursor-pointer"
            >
               Modify
            </button>
          )}
          {canPO && item.stock <= (item.minStockLevel || 10) && (
            <button 
               onClick={() => triggerDraftPO(item)}
               className="px-2 py-1 bg-brand-orange hover:bg-brand-orange/90 text-white rounded font-bold hover:scale-105 transition-all text-[11px] flex items-center gap-1 cursor-pointer"
            >
               <Zap className="w-3 h-3 fill-current" />
               <span>Auto-PO</span>
            </button>
          )}
        </div>
      ) 
    },
  ];

  const productRowActions: TableRowAction<Product>[] = [
    {
      label: 'Inspect Specifications',
      icon: Eye,
      onClick: (p) => setInspectedProduct(p),
    },
    ...(canUpdate ? [{
      label: 'Modify Product & Stock',
      icon: Edit3,
      onClick: (p: Product) => handleEditProductClick(p),
    }] : []),
    {
      label: 'Sales Trends & History',
      icon: TrendingUp,
      onClick: (p) => {
        setSelectedProductHistory(p);
        setHubTab('trends');
      },
    },
    {
      label: 'Copy Part SKU / Code',
      icon: Copy,
      onClick: (p) => {
        navigator.clipboard?.writeText(p.sku || p.name);
      },
    },
    ...(canDelete ? [{
      label: 'Delete Product',
      icon: Trash2,
      variant: 'danger' as const,
      onClick: (p: Product) => {
        if (window.confirm(`Are you sure you want to remove "${p.name}" from inventory?`)) {
          setProducts(prev => prev.filter(item => item.id !== p.id));
        }
      },
    }] : []),
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-12">
      <PageHeader
        title="Automotive Parts Catalog"
        primaryAction={canCreate ? { label: "Add Product Spec", onClick: handleAddProductClick } : undefined}
        secondaryActions={[
          { label: "QR Scanner", onClick: () => setIsScannerOpen(true) },
          ...(canExport ? [
            { label: "Export PDF", onClick: handleExportInventoryPDF },
            { label: "Export CSV", onClick: handleExportInventoryCSV },
          ] : []),
          ...(canCreate ? [
            { label: "Import CSV (Bulk)", onClick: () => setIsImportModalOpen(true) }
          ] : [])
        ]}
      />

      {/* Role Access Notice for Staff */}
      {!canCreate && (
        <div className="mx-4 md:mx-8 mt-2 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Catalog operates in <strong className="text-white">Read-Only Search Mode</strong> for your role (<strong className="text-amber-400 capitalize">{userRole}</strong>). Specification additions and deletions are restricted.
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-700 text-slate-400 font-mono">
            RBAC Enforced
          </span>
        </div>
      )}

      {/* QUICK INVENTORY ACTIONS HUD */}
      <div className="px-4 md:px-8 mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Total SKUs Registered</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block font-mono">{products.length} Items</span>
          </div>
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Low Level Breaches</span>
            <span className="text-xl font-black text-amber-600 mt-1 block font-mono">{products.filter(p => p.stock <= (p.minStockLevel || 10) && p.stock > 0).length} Parts</span>
          </div>
          <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Total Catalog Wealth</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block font-mono">
              {formatPrice(products.reduce((acc, p) => acc + (p.price * p.stock), 0))}
            </span>
          </div>
          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Universal Export</span>
            <div className="mt-1 flex items-center gap-2">
              <button 
                onClick={handleExportInventoryPDF}
                className="text-[11px] font-black uppercase text-brand-orange hover:underline flex items-center gap-0.5"
              >
                PDF
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={handleExportInventoryCSV}
                className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
              >
                CSV
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="text-[11px] font-black uppercase text-slate-600 dark:text-slate-300 hover:underline"
              >
                Import
              </button>
            </div>
          </div>
          <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/40 text-brand-orange rounded-lg flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* FILTER & STATS HUD RAIL */}
      <div className="px-4 md:px-8 mt-5 flex flex-col md:flex-row gap-4 items-center justify-between">
           
           {/* Tab Filters */}
           <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 self-start md:self-auto">
             <button 
               onClick={() => setFilterTab('all')}
               className={`px-4 py-2 rounded ${filterTab === 'all' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-orange' : 'text-slate-600 dark:text-slate-300'}`}
             >
               All Parts ({products.length})
             </button>
             <button 
               onClick={() => setFilterTab('low')}
               className={`px-4 py-2 rounded ${filterTab === 'low' ? 'bg-white dark:bg-slate-700 shadow-sm text-amber-600' : 'text-slate-600 dark:text-slate-300'}`}
             >
               Low Stock Warning ({products.filter(p => p.stock <= (p.minStockLevel || 10) && p.stock > 0).length})
             </button>
             <button 
               onClick={() => setFilterTab('out')}
               className={`px-4 py-2 rounded ${filterTab === 'out' ? 'bg-white dark:bg-slate-700 shadow-sm text-red-600' : 'text-slate-600 dark:text-slate-300'}`}
             >
               Depleted Stock ({products.filter(p => p.stock === 0).length})
             </button>
           </div>

           {/* Search query box, Camera Scanner, and Export Dropdown */}
           <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
             <div className="relative w-full md:w-56 shrink-0">
               <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                 <Search className="w-4 h-4"/>
               </span>
               <input 
                 type="text"
                 placeholder="OEM, Name or Brand..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:ring-2 focus:ring-brand-orange focus:outline-none text-slate-800 dark:text-slate-100 font-bold"
               />
             </div>

             <button
               onClick={() => setIsScannerOpen(true)}
               className="px-3.5 py-2 bg-brand-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shrink-0 select-none shadow-sm shadow-brand-orange/20"
               title="Launch device camera QR & barcode scanner"
             >
               <Scan className="w-4 h-4" />
               <span>Scan</span>
             </button>

             <ExportDropdown
               label="Export Catalog"
               pdfLabel="Download PDF Ledger"
               csvLabel="Download CSV Sheet"
               onExportPDF={handleExportInventoryPDF}
               onExportCSV={handleExportInventoryCSV}
               onPrint={() => window.print()}
               variant="primary"
               size="md"
             />
           </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
          <Table 
            columns={columns} 
            data={filteredProducts} 
            onRowClick={(p) => setInspectedProduct(p)}
            rowActions={productRowActions}
          />
        </div>
      </div>

      {/* EDIT/ADD PRODUCT OVERLAY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
               <h3 className="text-lg font-black text-slate-900 dark:text-white">
                 {editingProduct ? '👨‍🔧 Modify Autopart Parameters' : '🆕 Add Autopart Configuration'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
               </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Autopart Name *</label>
                  <input 
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="Brake Pads Toyota Hilux"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Brand Manufacturer *</label>
                  <input 
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="Masuma, OEM  Denso"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Manufacturer OEM Reference Code</label>
                  <input 
                    type="text"
                    value={formData.oemCode}
                    onChange={(e) => setFormData({...formData, oemCode: e.target.value.toUpperCase()})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="e.g. 04465-0K150"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">B2B SKU ID Number</label>
                  <input 
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({...formData, sku: e.target.value.toUpperCase()})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                    placeholder="e.g. MSM-5928K"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Sales Price ({settings.currency})</label>
                  <input 
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Physical Stock Count</label>
                  <input 
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({...formData, stock: Number(e.target.value)})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Reorder Safety Level</label>
                  <input 
                    type="number"
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({...formData, minStockLevel: Number(e.target.value)})}
                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Warehouse Storage Location (Bin / Shelf Slot)</label>
                <input 
                  type="text"
                  value={formData.binLocation}
                  onChange={(e) => setFormData({...formData, binLocation: e.target.value.toUpperCase()})}
                  className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-sm font-mono text-slate-900 dark:text-slate-100 focus:ring-1 focus:ring-brand-orange"
                  placeholder="e.g. W3-BAY4-SHELF2"
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-700">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 font-bold text-xs border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 font-bold text-xs bg-brand-orange hover:bg-brand-orange/90 text-white rounded text-center shadow-md uppercase"
                >
                  {editingProduct ? 'Save Corrections' : 'Commit to Warehouse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SEAMLESS BULK CSV IMPORT OVERLAY MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 dark:border-gray-700 font-sans text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2"><Upload className="w-5 h-5 text-brand-orange shrink-0" /><span>Seamless Parts Catalog CSV Importer</span></h3>
                <p className="text-[11px] text-slate-400 mt-1">Ingest physical inventory catalogs, map columns dynamically, and resolve duplicate records with absolute accuracy.</p>
              </div>
              <button 
                onClick={() => {
                  setIsImportModalOpen(false); 
                  setImportPreview([]); 
                  setImportFeedback({ status: 'idle', message: '' });
                }} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              
              {/* Template Guidelines and download */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl gap-2 font-mono text-[10.5px]">
                <div>
                  <span className="font-extrabold uppercase text-indigo-600 dark:text-indigo-405 block">Schema Requirements:</span>
                  <p className="text-slate-450 mt-0.5">Supports custom mapping. Expected variables: <code className="text-brand-orange">SKU, Name, Brand, Price, Stock, OEM Code, Bin Location</code></p>
                </div>
                <button 
                  onClick={handleDownloadTemplate}
                  className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold rounded border border-indigo-100 dark:border-indigo-900/30 whitespace-nowrap text-[10px]"
                >
                  Get Sample CSV
                </button>
              </div>

              {/* Drag and Drop Zone */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${dragActive ? 'border-brand-orange bg-orange-50/10' : 'border-slate-300 dark:border-slate-700 hover:border-slate-450'}`}
              >
                <FolderArchive className="w-10 h-10 text-slate-400 mb-2" />
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">Drag and drop your parts CSV catalog here</span>
                <span className="text-slate-400 mt-1 block">or manually select from local disk systems</span>

                <label className="mt-4 py-2 px-6 bg-slate-900 hover:bg-slate-850 dark:bg-slate-750 dark:hover:bg-slate-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg cursor-pointer shadow-md transition-colors selection:bg-brand-orange/30">
                  Select CSV File
                  <input 
                    type="file" 
                    accept=".csv"
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </label>
              </div>

              {/* Feedback Alert banners */}
              {importFeedback.status === 'error' && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-900/30 rounded-xl font-bold">
                  ⚠️ {importFeedback.message}
                </div>
              )}

              {importFeedback.status === 'success' && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30 rounded-xl font-bold">
                  ✓ {importFeedback.message}
                </div>
              )}

              {/* Duplicate conflict resolution strategy toggle */}
              {importPreview.length > 0 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3 font-sans">
                  <span className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px] block">SKU Duplication Conflict Policy:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className={`p-2.5 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition ${duplicateMode === 'overwrite' ? 'border-brand-orange bg-orange-500/5 text-bold' : 'border-slate-200 dark:border-slate-800'}`}>
                      <input 
                        type="radio" 
                        name="dup_policy" 
                        value="overwrite"
                        checked={duplicateMode === 'overwrite'}
                        onChange={() => setDuplicateMode('overwrite')}
                        className="accent-brand-orange"
                      />
                      <div>
                        <span className="block font-black text-slate-900 dark:text-white">Overwrite existing</span>
                        <span className="text-[9px] text-slate-400">Update match parameters</span>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition ${duplicateMode === 'skip' ? 'border-brand-orange bg-orange-500/5 text-bold' : 'border-slate-200 dark:border-slate-800'}`}>
                      <input 
                        type="radio" 
                        name="dup_policy" 
                        value="skip"
                        checked={duplicateMode === 'skip'}
                        onChange={() => setDuplicateMode('skip')}
                        className="accent-brand-orange"
                      />
                      <div>
                        <span className="block font-black text-slate-900 dark:text-white">Skip conflicts</span>
                        <span className="text-[9px] text-slate-400">Keep old SKU details</span>
                      </div>
                    </label>

                    <label className={`p-2.5 rounded-lg border-2 flex items-center gap-2 cursor-pointer transition ${duplicateMode === 'make-unique' ? 'border-brand-orange bg-orange-500/5 text-bold' : 'border-slate-200 dark:border-slate-800'}`}>
                      <input 
                        type="radio" 
                        name="dup_policy" 
                        value="make-unique"
                        checked={duplicateMode === 'make-unique'}
                        onChange={() => setDuplicateMode('make-unique')}
                        className="accent-brand-orange"
                      />
                      <div>
                        <span className="block font-black text-slate-900 dark:text-white">Generate unique SKU</span>
                        <span className="text-[9px] text-slate-400">Append unique suffix key</span>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Data Rows Preview Box */}
              {importPreview.length > 0 && (
                <div className="space-y-2">
                  <span className="font-extrabold uppercase text-slate-450 tracking-wider text-[10px] block">Snapshot dry run preview (First 5 Rows):</span>
                  <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto max-h-48">
                    <table className="w-full text-left font-sans text-[11px]">
                      <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 font-extrabold">
                        <tr>
                          <th className="p-2.5">SKU ID</th>
                          <th className="p-2.5">Name</th>
                          <th className="p-2.5">Brand</th>
                          <th className="p-2.5 font-mono text-right">Price</th>
                          <th className="p-2.5 text-right">Stock</th>
                          <th className="p-2.5">Bin Code</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-850 bg-white dark:bg-slate-800 dark:text-slate-200">
                        {importPreview.slice(0, 5).map((item, index) => (
                          <tr key={index}>
                            <td className="p-2.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{item.sku}</td>
                            <td className="p-2.5 font-bold">{item.name}</td>
                            <td className="p-2.5">{item.brand}</td>
                            <td className="p-2.5 font-mono text-bold text-right">{formatPrice(item.price)}</td>
                            <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-450">{item.stock} qty</td>
                            <td className="p-2.5 font-mono">{item.binLocation}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 5 && (
                    <span className="text-slate-400 text-[10px] inline-block font-mono">and {importPreview.length - 5} more entries...</span>
                  )}
                </div>
              )}

            </div>

            <div className="p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-between gap-3">
              <button 
                type="button" 
                onClick={() => {
                  setIsImportModalOpen(false); 
                  setImportPreview([]); 
                  setImportFeedback({ status: 'idle', message: '' });
                }}
                className="py-2.5 px-6 font-bold text-xs border border-slate-300 dark:border-slate-600 dark:text-slate-300 rounded-lg text-center"
              >
                Cancel
              </button>
              
              <button 
                type="button"
                disabled={importPreview.length === 0}
                onClick={executeBulkCommit}
                className="py-2.5 px-8 bg-brand-orange hover:bg-brand-orange/95 disabled:bg-gray-400/50 dark:disabled:bg-slate-850 disabled:text-gray-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95"
              >
                🚀 Confirm & Merge {importPreview.length} items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCT SPECIFICATIONS, PRICE TRENDS & SALES HISTORY MODAL DRAWER */}
      {selectedProductHistory && (() => {
         const productSales = getProductSalesHistory(selectedProductHistory);
         const totalQtySold = productSales.reduce((sum, item) => sum + item.quantity, 0);
         const totalRevSold = productSales.reduce((sum, item) => sum + (item.quantity * item.price), 0);
         const avgPrice = totalQtySold > 0 ? Math.round(totalRevSold / totalQtySold) : 0;
         const orderCount = productSales.length;

         return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end z-50 animate-fade-in">
                <div className="w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-slide-left text-xs">
                    <div>
                        <div className="flex justify-between items-start border-b border-slate-150 dark:border-slate-800 pb-4 mb-4">
                             <div>
                                 <div className="flex items-center gap-2">
                                   <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange font-bold">
                                     Procurement & Inventory Hub
                                   </span>
                                   <span className="text-[10px] font-mono text-slate-400">
                                     SKU: {selectedProductHistory.sku}
                                   </span>
                                 </div>
                                 <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                                   {selectedProductHistory.name}
                                 </h3>
                                 <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                   {selectedProductHistory.brand} • {selectedProductHistory.category || 'Automotive Component'} • Bin: <strong className="text-slate-800 dark:text-slate-200">{selectedProductHistory.binLocation || 'W1-A1'}</strong>
                                 </p>
                             </div>
                             <button 
                               onClick={() => setSelectedProductHistory(null)} 
                               className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                             >
                                 <X className="w-5 h-5"/>
                             </button>
                        </div>

                        {/* TAB CONTROLS */}
                        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 mb-5">
                          <button
                            onClick={() => setHubTab('trends')}
                            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                              hubTab === 'trends'
                                ? 'border-brand-orange text-brand-orange'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>Cost & Price Trends</span>
                          </button>

                          <button
                            onClick={() => setHubTab('sales')}
                            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                              hubTab === 'sales'
                                ? 'border-brand-orange text-brand-orange'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Sales Ledger ({productSales.length})</span>
                          </button>

                          <button
                            onClick={() => setHubTab('specs')}
                            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
                              hubTab === 'specs'
                                ? 'border-brand-orange text-brand-orange'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            <Package className="w-3.5 h-3.5" />
                            <span>Specs & QR Bin Tag</span>
                          </button>
                        </div>

                        {/* TAB 1: PRICE & COST TRENDS */}
                        {hubTab === 'trends' && (
                          <div className="space-y-4">
                            <ProductPriceTrendSection
                              product={selectedProductHistory}
                              onOpenCreatePO={(prod, suggestedCost, suggestedQty) => {
                                setSelectedProductHistory(null);
                                triggerDraftPO(prod);
                              }}
                            />
                          </div>
                        )}

                        {/* TAB 2: SALES HISTORY */}
                        {hubTab === 'sales' && (
                          <div className="space-y-5">
                            {/* Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-emerald-500/5 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/10 text-center">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Revenue</span>
                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">{formatPrice(totalRevSold)}</span>
                                </div>
                                <div className="bg-indigo-500/5 dark:bg-indigo-950/20 p-3 rounded-xl border border-indigo-500/10 text-center">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Units Sold</span>
                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">{totalQtySold} pcs</span>
                                </div>
                                <div className="bg-amber-500/5 dark:bg-amber-955/20 p-3 rounded-xl border border-amber-500/10 text-center">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-widest">Orders</span>
                                    <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono mt-1 block">{orderCount} Bills</span>
                                </div>
                            </div>

                            {/* History Table Header with Export */}
                            <div className="flex justify-between items-center">
                              <h4 className="text-xs uppercase font-extrabold tracking-wider text-slate-500">B2B Order Transactions</h4>
                              {productSales.length > 0 && (
                                <ExportDropdown
                                  label="Export Transactions"
                                  pdfLabel="Download History PDF"
                                  csvLabel="Download History CSV"
                                  onExportPDF={() => {
                                    const headers = ['Order Ref', 'Date Logged', 'Client Merchant', 'Status', 'Qty Sold', `Unit Price (${settings.currency})`, `Extended Total (${settings.currency})`];
                                    const rows = productSales.map(item => [
                                      item.orderId,
                                      item.date,
                                      item.customerName,
                                      item.status.toUpperCase(),
                                      item.quantity.toString(),
                                      formatPrice(item.price),
                                      formatPrice(item.price * item.quantity)
                                    ]);
                                    exportToPDF({
                                      title: `Product Sales History: ${selectedProductHistory.name}`,
                                      subtitle: `Detailed transaction ledger for SKU: ${selectedProductHistory.sku}`,
                                      filename: `sales_history_${selectedProductHistory.sku}_${new Date().toISOString().slice(0, 10)}`,
                                      headers,
                                      rows,
                                      metadata: {
                                        'Product Name': selectedProductHistory.name,
                                        'SKU Code': selectedProductHistory.sku,
                                        'Brand': selectedProductHistory.brand,
                                        'OEM Ref': selectedProductHistory.oemCode || 'N/A',
                                        'Bin Slot': selectedProductHistory.binLocation || 'W1-A1',
                                        'Current Physical Stock': `${selectedProductHistory.stock} Units`
                                      },
                                      summaryStats: [
                                        { label: 'Total Revenue Generated', value: formatPrice(totalRevSold) },
                                        { label: 'Total Units Sold', value: `${totalQtySold} pcs` },
                                        { label: 'Total Orders Processed', value: `${orderCount} bills` }
                                      ],
                                      currency: settings.currency
                                    });
                                  }}
                                  onExportCSV={() => {
                                    const headers = ['Order Ref', 'Date Logged', 'Client Merchant', 'Status', 'Qty Sold', 'Unit Price', 'Extended Total'];
                                    const rows = productSales.map(item => [
                                      item.orderId,
                                      item.date,
                                      item.customerName,
                                      item.status,
                                      item.quantity,
                                      item.price,
                                      item.price * item.quantity
                                    ]);
                                    generateCSV({
                                      title: `Masuma Product Sales History - ${selectedProductHistory.sku}`,
                                      filename: `sales_history_${selectedProductHistory.sku}_${new Date().toISOString().slice(0, 10)}`,
                                      headers,
                                      rows,
                                      metadata: {
                                        'Part Name': selectedProductHistory.name,
                                        'SKU': selectedProductHistory.sku,
                                        'Brand': selectedProductHistory.brand,
                                        'Total Revenue': formatPrice(totalRevSold)
                                      },
                                      summaryStats: [
                                        { label: 'Total Revenue', value: formatPrice(totalRevSold) },
                                        { label: 'Total Qty Sold', value: `${totalQtySold} pcs` }
                                      ]
                                    });
                                  }}
                                  onPrint={() => window.print()}
                                  variant="outline"
                                  size="sm"
                                />
                              )}
                            </div>

                            {productSales.length > 0 ? (
                               <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden text-xs">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 dark:bg-slate-750 text-slate-600 dark:text-slate-300 font-bold">
                                            <tr>
                                                <th className="p-3">Ref Code / Date</th>
                                                <th className="p-3">Client Merchant</th>
                                                <th className="p-3 text-center">Qty</th>
                                                <th className="p-3 text-right">Sold At</th>
                                                <th className="p-3 text-right">Extended Value</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-150 dark:divide-slate-700">
                                             {productSales.map((item, id) => (
                                                 <tr key={id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-zinc-100 font-mono text-[11px]">
                                                     <td className="p-3">
                                                         <span className="font-bold text-brand-orange block">{item.orderId}</span>
                                                         <span className="text-[9px] text-slate-400 block font-sans">{item.date}</span>
                                                     </td>
                                                     <td className="p-3 font-sans font-semibold text-slate-900 dark:text-white">
                                                         {item.customerName}
                                                         <span className="block text-[9px] text-slate-400 uppercase font-sans font-bold">{item.status}</span>
                                                     </td>
                                                     <td className="p-3 text-center font-bold text-slate-750 dark:text-slate-250">{item.quantity}</td>
                                                     <td className="p-3 text-right text-slate-600 dark:text-slate-400">{formatPrice(item.price)}</td>
                                                     <td className="p-3 text-right font-black text-slate-900 dark:text-white">{formatPrice(item.price * item.quantity)}</td>
                                                 </tr>
                                             ))}
                                        </tbody>
                                    </table>
                               </div>
                            ) : (
                               <div className="p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-450 font-mono">
                                  ⚠️ No active sales transactions registered for this component in the current ledger cycle.
                                </div>
                            )}
                          </div>
                        )}

                        {/* TAB 3: SPECS & BIN LOCATION */}
                        {hubTab === 'specs' && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <img 
                                      src={selectedProductHistory.imageUrl} 
                                      alt={selectedProductHistory.name} 
                                      className="w-16 h-16 object-cover rounded-lg border border-slate-200 dark:border-slate-750" 
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="space-y-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-black block">Catalog ID</span>
                                        <span className="font-mono font-bold text-slate-800 dark:text-white">{selectedProductHistory.sku}</span>
                                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1"><MapPin className="w-3 h-3 shrink-0" /><span>{selectedProductHistory.binLocation || 'W1-A1'}</span></span>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Base Retail Price:</span>
                                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatPrice(selectedProductHistory.price)}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Physical Stock:</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{selectedProductHistory.stock} Units</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-1 border-t dark:border-slate-700 pt-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-bold">Safety Limit:</span>
                                        <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">{selectedProductHistory.minStockLevel || 10} qty</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                              <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                                Technical Specifications & Cross-References
                              </span>
                              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                <div>
                                  <span className="text-slate-400 text-[10px] block">OEM Code:</span>
                                  <span className="font-bold">{selectedProductHistory.oemCode || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block">Brand Manufacturer:</span>
                                  <span className="font-bold">{selectedProductHistory.brand}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block">Primary Category:</span>
                                  <span className="font-bold">{selectedProductHistory.category || 'General'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 text-[10px] block">Total Valuation (Asset):</span>
                                  <span className="font-bold text-brand-orange">{formatPrice(selectedProductHistory.price * selectedProductHistory.stock)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Modal bottom action button */}
                    <div className="pt-4 border-t border-slate-150 dark:border-slate-800 mt-6 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setInspectedProduct(selectedProductHistory);
                            setSelectedProductHistory(null);
                          }}
                          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition"
                        >
                          <Scan className="w-3.5 h-3.5" />
                          <span>Open Physical Stock Auditor</span>
                        </button>

                        <button 
                          onClick={() => setSelectedProductHistory(null)}
                          className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl transition-all focus:outline-none shadow-sm"
                        >
                          Close Hub
                        </button>
                    </div>
                </div>
            </div>
         );
      })()}

      {/* FLOATING ACTION NOTIFICATION TOAST */}
      {scannerToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-bold animate-slide-up backdrop-blur-md ${
          scannerToast.isError 
            ? 'bg-rose-950/90 text-rose-200 border-rose-800 shadow-rose-950/40' 
            : 'bg-emerald-950/90 text-emerald-200 border-emerald-800 shadow-emerald-950/40'
        }`}>
          {scannerToast.isError ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
          <span>{scannerToast.message}</span>
        </div>
      )}

      {/* UNIFIED DEVICE QR & BARCODE SCANNER MODAL */}
      {isScannerOpen && (
        <QRScannerModal
          products={products}
          salesOrders={salesOrdersList}
          onScanProduct={(product) => {
            setIsScannerOpen(false);
            setInspectedProduct(product);
            triggerToast(`🎯 Product Identified: ${product.name} [SKU: ${product.sku}]`);
          }}
          onScanOrder={(order) => {
            setIsScannerOpen(false);
            setVerifiedOrder(order);
            triggerToast(`📋 Sales Order Identified: ${order.id} (${order.customer.name})`);
          }}
          onClose={() => setIsScannerOpen(false)}
          title="Inventory Rapid Scanner"
          subtitle="Scan shelf tags, bin labels, packaging QR, or packing slips"
        />
      )}

      {/* PRODUCT QUICK STOCK INSPECTOR & QR LABEL MODAL */}
      {inspectedProduct && (
        <ProductQuickInspectorModal
          product={inspectedProduct}
          onClose={() => setInspectedProduct(null)}
          onUpdateStock={handleStockCorrection}
          onViewFullHistory={(prod) => {
            setInspectedProduct(null);
            setSelectedProductHistory(prod);
          }}
        />
      )}

      {/* ORDER PICK & DISPATCH VERIFICATION MODAL */}
      {verifiedOrder && (
        <OrderVerificationModal
          order={verifiedOrder}
          onClose={() => setVerifiedOrder(null)}
          onUpdateOrderStatus={(orderId, newStatus) => {
            setSalesOrdersList(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
            triggerToast(`✓ Order ${orderId} status set to ${newStatus}`);
          }}
        />
      )}

    </div>
  );
};

export default Inventory;
