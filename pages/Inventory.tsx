import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '../data/mockData';
import PageHeader from '../components/shared/PageHeader';
import Table from '../components/shared/Table';
import type { Product } from '../types';
import { SearchIcon, PlusIcon, XIcon } from '../components/shared/Icons';

const Inventory: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'low' | 'out'>('all');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // New Product form fields
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    oemCode: '',
    brand: '',
    category: '',
    price: 1500,
    stock: 50,
    minStockLevel: 10,
    binLocation: 'W1-A1',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=200'
  });

  const getStatus = (product: Product) => {
    const minLevel = product.minStockLevel || 10;
    if (product.stock === 0) return <span className="px-2.5 py-1 text-xs font-bold text-red-800 bg-red-100 dark:text-red-300 dark:bg-red-900/50 rounded-full">🚫 Depleted</span>;
    if (product.stock <= minLevel) return <span className="px-2.5 py-1 text-xs font-bold text-amber-800 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/50 rounded-full">⚠️ Reorder ({product.stock})</span>;
    return <span className="px-2.5 py-1 text-xs font-bold text-green-800 bg-green-100 dark:text-green-300 dark:bg-green-900/50 rounded-full">✅ Normal ({product.stock})</span>;
  };

  // Open modal for new product
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

  // Open modal for editing product
  const handleEditProductClick = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      sku: prod.sku,
      oemCode: prod.oemCode || '',
      brand: prod.brand,
      category: prod.category || 'Filters',
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
      // Edit mode
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
      // Create mode
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
    // 1. Text Query (Search across Brand, Name, original SKU, or OEM Part crossovers)
    const matchesQuery = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.oemCode && p.oemCode.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesQuery) return false;

    // 2. Tab Filter
    const minimum = p.minStockLevel || 10;
    if (filterTab === 'low') {
      return p.stock <= minimum && p.stock > 0;
    }
    if (filterTab === 'out') {
      return p.stock === 0;
    }
    return true;
  });

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
    { header: 'Base Margin Price', accessor: (item: Product) => <span className="font-mono font-bold text-slate-900 dark:text-slate-100">KES {item.price.toLocaleString()}</span> },
    { header: 'Status Grid', accessor: (item: Product) => getStatus(item) },
    { 
      header: 'Operations', 
      accessor: (item: Product) => (
        <div className="flex gap-2 text-xs">
          <button 
             onClick={() => handleEditProductClick(item)}
             className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-250 text-slate-700 dark:text-slate-200 rounded font-bold transition-all"
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
      />

      {/* FILTER & STATS HUD RAIL */}
      <div className="px-4 md:px-8 mt-5 flex flex-col md:flex-row gap-4 items-center justify-between">
           
           {/* Tab Filters */}
           <div className="flex p-1 bg-slate-250 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0 self-start md:self-auto">
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
                    placeholder="Masuma, OEM, Denso"
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
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Sales Price (KES)</label>
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
    </div>
  );
};

export default Inventory;
