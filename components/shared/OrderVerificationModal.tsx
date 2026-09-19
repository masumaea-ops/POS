import React, { useState, useEffect } from 'react';
import type { SaleOrder, CartItem } from '../../types';
import { X, CheckCircle2, AlertCircle, Printer, ShoppingCart, Truck, ShieldCheck, Box, PackageCheck, MapPin, Check, CheckCheck } from 'lucide-react';
import { useSystemSettings } from '../../contexts/SettingsContext';
import { generateQRCodeDataURL } from '../../utils/qrCodeGenerator';

interface OrderVerificationModalProps {
  order: SaleOrder;
  onClose: () => void;
  onUpdateOrderStatus?: (orderId: string, newStatus: SaleOrder['status']) => void;
  onLoadIntoCart?: (items: CartItem[]) => void;
}

export const OrderVerificationModal: React.FC<OrderVerificationModalProps> = ({
  order,
  onClose,
  onUpdateOrderStatus,
  onLoadIntoCart
}) => {
  const { settings, formatPrice } = useSystemSettings();
  const [currentOrder, setCurrentOrder] = useState<SaleOrder>(order);
  
  // Verification Checklist State (tracks whether each line item is physically verified)
  const [verifiedItems, setVerifiedItems] = useState<Record<number, boolean>>({});
  const [isDispatched, setIsDispatched] = useState<boolean>(currentOrder.status === 'Paid' || currentOrder.status === 'Invoiced');
  const [inspectorName, setInspectorName] = useState<string>('Masuma Warehouse QA');

  const items = currentOrder.items || [
    { productName: 'Standard Automotive Component Line', quantity: 1, price: currentOrder.total }
  ];

  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const verifiedCount = items.filter((_, idx) => verifiedItems[idx]).length;
  const isAllVerified = items.length > 0 && verifiedCount === items.length;

  const toggleItemVerification = (index: number) => {
    setVerifiedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const handleVerifyAll = () => {
    const allChecked: Record<number, boolean> = {};
    items.forEach((_, idx) => {
      allChecked[idx] = true;
    });
    setVerifiedItems(allChecked);
  };

  const handleConfirmDispatch = () => {
    const nextStatus: SaleOrder['status'] = 'Paid';
    const updated = { ...currentOrder, status: nextStatus };
    setCurrentOrder(updated);
    setIsDispatched(true);
    
    // Save to localStorage
    const savedOrdersStr = localStorage.getItem('masuma_sales_orders');
    if (savedOrdersStr) {
      try {
        const parsed: SaleOrder[] = JSON.parse(savedOrdersStr);
        const nextList = parsed.map(o => o.id === order.id ? updated : o);
        localStorage.setItem('masuma_sales_orders', JSON.stringify(nextList));
      } catch (e) {
        console.error(e);
      }
    }

    if (onUpdateOrderStatus) {
      onUpdateOrderStatus(order.id, nextStatus);
    }
  };

  const qrPayload = `MASUMA:ORDER:${currentOrder.id}|CUSTOMER:${currentOrder.customer.name}|TOTAL:${currentOrder.total}`;
  const qrDataUrl = generateQRCodeDataURL(qrPayload, { size: 140, margin: 2 });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <header className="p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-850 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Order Verification & Dispatch Pass
                </h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wide ${
                  currentOrder.status === 'Paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : currentOrder.status === 'Invoiced'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                    : currentOrder.status === 'Order'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                  {currentOrder.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Order Ref: <span className="font-bold text-slate-800 dark:text-slate-200">{currentOrder.id}</span> • Issued: {currentOrder.date}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* BODY */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          
          {/* TOP SUMMARY CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Customer info card */}
            <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Customer Merchant Profile</span>
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {currentOrder.customer.name}
                  </h4>
                  {currentOrder.customer.companyName && (
                    <p className="text-xs text-slate-500 font-semibold">{currentOrder.customer.companyName}</p>
                  )}
                  <p className="text-[11px] text-slate-400 font-mono mt-1">
                    Tier: <strong className="text-brand-orange">{currentOrder.customer.tier}</strong> • {currentOrder.customer.type} Account
                  </p>
                  {currentOrder.customer.phone && (
                    <p className="text-[11px] text-slate-400 font-mono">Phone: {currentOrder.customer.phone}</p>
                  )}
                  {currentOrder.customer.kraPin && (
                    <p className="text-[11px] text-slate-400 font-mono">KRA PIN: {currentOrder.customer.kraPin}</p>
                  )}
                  {currentOrder.customer.shippingAddress && (
                    <p className="text-[11px] text-slate-500 mt-1 italic"><span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /><span>{currentOrder.customer.shippingAddress}</span></span></p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-mono uppercase block">Order Total Value</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    {formatPrice(currentOrder.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Verification badge */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80 flex flex-col items-center justify-center text-center">
              <div className="p-1 bg-white rounded-lg shadow-sm border border-slate-200">
                <img src={qrDataUrl} alt="Order QR Code" className="w-24 h-24" />
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase font-bold">
                Scan Pass for Mobile Dispatch
              </span>
            </div>

          </div>

          {/* PICK & PACK AUDIT CHECKLIST */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <PackageCheck className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Pick-and-Pack Audit Checklist
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  {verifiedCount} of {items.length} product lines physically confirmed ({totalItemCount} total pieces)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerifyAll}
                  className="px-3 py-1 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-bold transition flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Check All Items</span>
                </button>
              </div>
            </div>

            {/* PROGRESS BAR */}
            <div className="w-full bg-slate-150 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  isAllVerified ? 'bg-emerald-500' : 'bg-brand-orange'
                }`}
                style={{ width: `${items.length > 0 ? (verifiedCount / items.length) * 100 : 0}%` }}
              />
            </div>

            {/* ITEMS LIST */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-150 dark:divide-slate-800 bg-white dark:bg-slate-800/40">
              {items.map((item, idx) => {
                const isChecked = !!verifiedItems[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => toggleItemVerification(idx)}
                    className={`p-3.5 flex items-center justify-between cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemVerification(idx);
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition border ${
                          isChecked
                            ? 'bg-emerald-500 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                      <div>
                        <h4 className={`text-xs font-bold ${isChecked ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-900 dark:text-white'}`}>
                          {item.productName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Quantity to dispatch: <strong className="text-slate-700 dark:text-slate-300">{item.quantity} units</strong> @ {formatPrice(item.price)} each
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                      <span className={`block text-[9px] uppercase font-bold tracking-wider ${
                        isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      }`}>
                        {isChecked ? 'Verified in Bin' : 'Pending Check'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <footer className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-150 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span>Inspector:</span>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              className="px-2 py-0.5 bg-white dark:bg-slate-800 border rounded text-[11px] font-bold text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition"
              title="Print official gate pass"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Gate Pass</span>
            </button>

            {onLoadIntoCart && (
              <button
                onClick={() => {
                  // Map order items to cart
                  onLoadIntoCart(items.map((i, idx) => ({
                    id: Date.now() + idx,
                    sku: `ORD-${currentOrder.id}-${idx}`,
                    name: i.productName,
                    brand: 'Masuma',
                    price: i.price,
                    stock: 99,
                    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=200',
                    quantity: i.quantity
                  })));
                  onClose();
                }}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition shadow"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Load to POS</span>
              </button>
            )}

            <button
              onClick={handleConfirmDispatch}
              className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm ${
                isAllVerified
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-brand-orange hover:bg-amber-600 text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>{isAllVerified ? 'Authorize & Dispatch' : 'Mark Dispatched'}</span>
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
