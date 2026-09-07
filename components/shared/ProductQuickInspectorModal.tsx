import React, { useState } from 'react';
import type { Product } from '../../types';
import { X, Package, Tag, Layers, MapPin, AlertTriangle, CheckCircle2, TrendingUp, Printer, Save, Plus, Minus, LineChart } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { generateQRCodeDataURL } from '../../utils/qrCodeGenerator';
import { ProductPriceTrendSection } from '../inventory/ProductPriceTrendSection';

interface ProductQuickInspectorModalProps {
  product: Product;
  onClose: () => void;
  onUpdateStock: (productId: number, newStock: number, reason: string) => void;
  onViewHistory?: (product: Product) => void;
}

export const ProductQuickInspectorModal: React.FC<ProductQuickInspectorModalProps> = ({
  product,
  onClose,
  onUpdateStock,
  onViewHistory
}) => {
  const { settings, formatPrice } = useSystemSettings();
  const [activeTab, setActiveTab] = useState<'audit' | 'trends'>('audit');
  const [stockLevel, setStockLevel] = useState<number>(product.stock);
  const [adjustReason, setAdjustReason] = useState<string>('Physical Stock Count / Audit');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  const minStock = product.minStockLevel || 10;
  const isOutOfStock = stockLevel === 0;
  const isLowStock = stockLevel <= minStock && !isOutOfStock;

  const handleStockChange = (delta: number) => {
    setStockLevel(prev => Math.max(0, prev + delta));
    setIsSaved(false);
  };

  const handleSave = () => {
    onUpdateStock(product.id, stockLevel, adjustReason);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const qrPayload = `MASUMA:SKU:${product.sku}|OEM:${product.oemCode || 'N/A'}|BIN:${product.binLocation || 'W1-A1'}|PRICE:${product.price}`;
  const qrDataUrl = generateQRCodeDataURL(qrPayload, { size: 150, margin: 2 });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <header className="p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 text-brand-orange flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-slate-900 text-white dark:bg-brand-orange px-2 py-0.5 rounded">
                  {product.brand}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${
                  isOutOfStock
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                    : isLowStock
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                }`}>
                  {isOutOfStock ? 'Depleted (Zero Stock)' : isLowStock ? 'Low Stock Alert' : 'Stock Optimal'}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate max-w-md mt-0.5">
                {product.name}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* NAVIGATION TABS */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-850 px-5 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock Audit & QR Tag</span>
          </button>
          
          <button
            onClick={() => setActiveTab('trends')}
            className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'trends'
                ? 'border-brand-orange text-brand-orange'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LineChart className="w-3.5 h-3.5" />
            <span>Cost & Price Trends</span>
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {activeTab === 'trends' ? (
            <ProductPriceTrendSection product={product} compact={false} />
          ) : (
            <>
              {/* PRODUCT CARD HERO */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Image Thumbnail */}
            <div className="relative aspect-square sm:aspect-auto rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Spec details */}
            <div className="sm:col-span-2 space-y-2.5">
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Catalog SKU</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">{product.sku}</strong>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">OEM Part Number</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">{product.oemCode || 'N/A'}</strong>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Bin / Shelf Slot</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-brand-orange shrink-0" /><span>{product.binLocation || 'Rack A1'}</span></span></strong>
                </div>

                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Category</span>
                  <strong className="text-slate-800 dark:text-slate-200 text-xs">{product.category || 'General Spares'}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-brand-orange/5 border border-brand-orange/20 rounded-xl">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Unit Selling Price</span>
                  <strong className="text-base font-black text-brand-orange font-mono">
                    {formatPrice(product.price)}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Holding Asset Value</span>
                  <strong className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {formatPrice(product.price * stockLevel)}
                  </strong>
                </div>
              </div>
            </div>

          </div>

          {/* STOCK ADJUSTMENT CONTROL HUD */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Physical Stock Count & Quick Adjustment
                </h3>
                <p className="text-[10px] text-slate-400 font-mono">
                  Minimum Safety Reorder Threshold: {minStock} units
                </p>
              </div>

              {/* Status indicator */}
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-500 block">Current Level:</span>
                <span className={`text-base font-mono font-black ${
                  isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {stockLevel} Units
                </span>
              </div>
            </div>

            {/* Stepper buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleStockChange(-10)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => handleStockChange(-1)}
                className="p-1.5 px-3 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
              >
                <Minus className="w-3.5 h-3.5" /> 1
              </button>
              
              <input
                type="number"
                min="0"
                value={stockLevel}
                onChange={(e) => {
                  setStockLevel(Math.max(0, parseInt(e.target.value) || 0));
                  setIsSaved(false);
                }}
                className="w-20 text-center p-1.5 bg-white dark:bg-slate-900 border font-mono font-black text-sm rounded-lg focus:ring-2 focus:ring-brand-orange"
              />

              <button
                type="button"
                onClick={() => handleStockChange(1)}
                className="p-1.5 px-3 bg-white dark:bg-slate-800 border rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> 1
              </button>
              <button
                type="button"
                onClick={() => handleStockChange(10)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                +10
              </button>
              <button
                type="button"
                onClick={() => handleStockChange(25)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                +25
              </button>
            </div>

            {/* Adjustment reason selector */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700/80">
              <select
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="flex-1 p-2 bg-white dark:bg-slate-800 border text-xs rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="Physical Stock Count / Audit">Physical Stock Count / Audit</option>
                <option value="Inbound Shipment Arrival">Inbound Shipment Arrival</option>
                <option value="Warehouse Return Restocked">Warehouse Return Restocked</option>
                <option value="Damaged / Scrapped Component">Damaged / Scrapped Component</option>
                <option value="Branch Transfer Issue">Branch Transfer Issue</option>
              </select>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 bg-brand-orange hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-1.5 transition shadow"
              >
                <Save className="w-4 h-4" />
                <span>{isSaved ? '✓ Saved!' : 'Save Stock Count'}</span>
              </button>
            </div>
          </div>

          {/* SHELF QR & BARCODE LABEL BADGE PREVIEW */}
          <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-sm shrink-0">
                <img src={qrDataUrl} alt="Product QR" className="w-20 h-20" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Printable Shelf Bin QR Tag
                </span>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {product.name}
                </h4>
                <p className="text-[11px] font-mono text-slate-500">
                  SKU: <strong className="text-slate-800 dark:text-slate-200">{product.sku}</strong> • Bin: {product.binLocation || 'W1-A1'}
                </p>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shrink-0"
              title="Print standard barcode shelf sticker"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Sticker</span>
            </button>
          </div>
            </>
          )}

        </div>

        {/* FOOTER */}
        <footer className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-150 dark:border-slate-800 flex items-center justify-between shrink-0">
          {onViewHistory && (
            <button
              onClick={() => {
                onViewHistory(product);
                onClose();
              }}
              className="px-3 py-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <TrendingUp className="w-4 h-4" />
              <span>View B2B Sales Ledger</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="ml-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition"
          >
            Done
          </button>
        </footer>

      </div>
    </div>
  );
};
