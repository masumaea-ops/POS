import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS } from '../data/mockData';
import PageHeader from '../components/shared/PageHeader';
import Table from '../components/shared/Table';
import type { Product } from '../types';
import { SearchIcon, PlusIcon, XIcon } from '../components/shared/Icons';
import { useSystemSettings } from '../contexts/SettingsContext';

const Inventory: React.FC = () => {
  const { settings, formatPrice } = useSystemSettings();
  
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
    if (product.stock === 0) return <span className="px-2.5 py-1 text-xs font-bold text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900/50 rounded-full">🚫 Depleted</span>;
    if (product.stock <= minLevel) return <span className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/50 rounded-full">⚠️ Reorder ({product.stock})</span>;
    return <span className="px-2.5 py-1 text-xs font-bold text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/50 rounded-full">✅ Normal ({product.stock})</span>;
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
  // SEAMLESS & ACCURATE EXPORT: Safe Blob trigger
  // ----------------------------------------------------------------------
  const handleExportToCSV = () => {
    const headers = [
      'SKU', 'Name', 'Brand', 'Category', 'Price', 'Stock', 
      'Min Stock Level', 'OEM Code', 'Bin Location', 'Image URL'
    ];

    const rows = products.map(p => [
      p.sku,
      p.name,
      p.brand,
      p.category || 'Uncategorized',
      p.price.toString(),
      p.stock.toString(),
      (p.minStockLevel || 10).toString(),
      p.oemCode || '',
      p.binLocation || '',
      p.imageUrl || ''
    ]);

    const csvContent = "\uFEFF" 
      + [headers.join(","), ...rows.map(row => row.map(cell => {
          const stringVal = String(cell).replace(/"/g, '""');
          return stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"') 
            ? `"${stringVal}"` 
            : stringVal;
        }).join(","))].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `masuma_inventory_catalog_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  const columns = [
    { 
      header: 'Component Details', 
      accessor: (item: Product) => (
        <div className="flex items-center gap-3">
          <img src={item.imageUrl} alt={item.name} className="w-10 h-10 object-cover rounded border border-slate-200 dark:border-slate-700 bg-slate-50" referrerPolicy="no-referrer" />
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{item.name}</div>
            <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
              <span>Brand: <strong className="text-slate-700 dark:text-slate-300">{item.brand}</strong></span>
              <span>•</span>
              <span>SKU: <strong className="font-mono">{item.sku}</strong></span>
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
               🔗 {item.oemCode}
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
          📍 {item.binLocation || 'UN-SLOTTED'}
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
        <div className="flex gap-2 text-xs">
          <button 
             onClick={() => handleEditProductClick(item)}
             className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded font-bold transition-all"
          >
             Modify
          </button>
          {item.stock <= (item.minStockLevel || 10) && (
            <button 
               onClick={() => triggerDraftPO(item)}
               className="px-2 py-1 bg-brand-orange hover:bg-brand-orange/90 text-white rounded font-bold hover:scale-105 transition-all text-[11px]"
            >
               ⚡ Auto-PO
            </button>
          )}
        </div>
      ) 
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 pb-12">
      <PageHeader
        title="Automotive Parts Catalog"
        primaryAction={{ label: "Add Product Spec", onClick: handleAddProductClick }}
        secondaryActions={[
          { label: "📤 Export CSV", onClick: handleExportToCSV },
          { label: "📥 Import CSV (Bulk)", onClick: () => setIsImportModalOpen(true) }
        ]}
      />

      {/* QUICK INVENTORY ACTIONS HUD */}
      <div className="px-4 md:px-8 mt-4 grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Total SKUs Registered</span>
            <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block font-mono">{products.length} Items</span>
          </div>
          <span className="text-2xl">📦</span>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Low Level Breaches</span>
            <span className="text-xl font-black text-amber-600 mt-1 block font-mono">{products.filter(p => p.stock <= (p.minStockLevel || 10) && p.stock > 0).length} Parts</span>
          </div>
          <span className="text-2xl text-amber-500">⚠️</span>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Total Catalog Wealth</span>
            <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block font-mono">
              {formatPrice(products.reduce((acc, p) => acc + (p.price * p.stock), 0))}
            </span>
          </div>
          <span className="text-2xl text-indigo-500">💰</span>
        </div>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase block tracking-wider">Bulk Utilities Feed</span>
            <div className="mt-1 flex gap-2">
              <button 
                onClick={handleExportToCSV}
                className="text-[11px] font-black uppercase text-brand-orange hover:underline"
              >
                Export CSV
              </button>
              <span className="text-slate-300">|</span>
              <button 
                onClick={() => setIsImportModalOpen(true)}
                className="text-[11px] font-black uppercase text-indigo-600 dark:text-indigo-405 hover:underline"
              >
                Import CSV
              </button>
            </div>
          </div>
          <span className="text-2xl">⚡</span>
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

           {/* Search query box */}
           <div className="relative w-full md:max-w-xs shrink-0">
             <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
               <SearchIcon className="w-4 h-4"/>
             </span>
             <input 
               type="text"
               placeholder="OEM, Name or Brand..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-xs focus:ring-2 focus:ring-brand-orange focus:outline-none text-slate-800 dark:text-slate-100 font-bold"
             />
           </div>
      </div>

      <div className="p-4 md:p-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <Table columns={columns} data={filteredProducts} />
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
                  <XIcon className="w-5 h-5" />
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
                <h3 className="text-lg font-black text-slate-950 dark:text-white uppercase tracking-wider">📥 Seamless Parts Catalog CSV Importer</h3>
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
                <XIcon className="w-5 h-5" />
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
                  📥 Get Sample CSV
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
                <span className="text-4xl mb-2">📁</span>
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
                  <span className="font-black text-slate-800 dark:text-white uppercase tracking-wider text-[10px] block">⚔️ SKU Duplication Conflict Policy:</span>
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
                  <span className="font-extrabold uppercase text-slate-450 tracking-wider text-[10px] block">👁️ Snapshot dry run preview (First 5 Rows):</span>
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

    </div>
  );
};

export default Inventory;
