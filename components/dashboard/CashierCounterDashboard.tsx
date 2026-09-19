import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Coins, 
  Receipt, 
  Search, 
  Clock, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  FileText,
  User,
  CheckCircle2,
  Lock,
  Boxes,
  Percent,
  Smartphone,
  ChevronRight,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

export const CashierCounterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { settings, formatPrice } = useSettings();

  const [heldCarts, setHeldCarts] = useState([
    { id: 'CART-9021', customer: 'Walk-in Customer (Boda Boda)', itemsCount: 3, total: 4200, time: '10 mins ago' },
    { id: 'CART-9022', customer: 'John Kamau (Toyota Fielder)', itemsCount: 5, total: 18500, time: '22 mins ago' },
    { id: 'CART-9024', customer: 'Amina Fleet Driver', itemsCount: 2, total: 7800, time: '35 mins ago' }
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleResumeCart = (cartId: string) => {
    navigate('/pos');
  };

  const handleDiscardCart = (cartId: string) => {
    setHeldCarts(prev => prev.filter(c => c.id !== cartId));
    setToastMessage(`Cart ${cartId} released`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* IN-APP TOAST */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-slate-900 text-white shadow-xl border border-slate-800 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-200 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-white">{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white text-xs cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* CASHIER WELCOME & TERMINAL BANNER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Front-Desk POS Counter
              </span>
              <span className="text-xs text-slate-400 font-medium">Terminal #01 • Shift Active (08:00 – 18:00)</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Cashier Operations Desk
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Rapid retail checkout, drawer float reconciliation, customer quotations, and walk-in receipts.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Register</span>
            </button>
          </div>
        </div>

        {/* TERMINAL STATUS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Hardware Peripherals</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Online (Thermal & Scanner)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Register Float</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(10000)} Verified</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Active Session</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">5h 42m Connected</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pending Carts</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{heldCarts.length} Suspended</span>
          </div>
        </div>
      </div>

      {/* CASH DRAWER & DAILY COUNTER METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Cash in Drawer */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cash in Physical Drawer</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatPrice(246000)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Float: {formatPrice(10000)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Verified Balanced</span>
          </div>
        </div>

        {/* Metric 2: M-Pesa Till Total */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">M-Pesa STK & Buy Goods</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatPrice(520000)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Till #882199</span>
            <span className="text-slate-500 font-semibold">94 Transactions</span>
          </div>
        </div>

        {/* Metric 3: Counter Sales Count */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Today's Counter Tickets</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">142</span>
            <span className="text-xs font-semibold text-slate-500">Receipts</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Avg: {formatPrice(5728)}</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Peak: 14:00</span>
          </div>
        </div>

        {/* Metric 4: Held Carts */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Suspended / Held Carts</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">{heldCarts.length}</span>
            <span className="text-xs font-semibold text-slate-500">Active</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Awaiting M-Pesa / Parts</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Resume Fast</span>
          </div>
        </div>
      </div>

      {/* QUICK CASHIER LAUNCHPAD */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Front-Desk Quick Actions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="p-4 rounded-xl border border-brand-orange/30 bg-brand-orange/5 hover:bg-brand-orange/10 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-orange text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">New Counter Sale</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Scan barcodes or search autoparts to bill customer immediately.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Boxes className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Parts & Bin Lookup</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Check current stock on shelves, shelf bins, and retail pricing.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <FileText className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Draft Quotation</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Generate a formal proforma quote for corporate or retail walk-in.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Receipt className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Today's Invoices</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Reprint customer receipt, check eTIMS signature, or review payments.</p>
          </button>
        </div>
      </div>

      {/* HELD CARTS & SECURITY SCOPE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* HELD CARTS TABLE */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Suspended Carts</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Suspended registers waiting for customer payment or parts fetch.</p>
            </div>
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-lg">
              {heldCarts.length} Suspended
            </span>
          </div>

          {heldCarts.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No suspended carts in this register.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {heldCarts.map(cart => (
                <div key={cart.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-brand-orange">{cart.id}</span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cart.customer}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                      <span>{cart.itemsCount} autopart items</span>
                      <span>•</span>
                      <span>Held {cart.time}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {formatPrice(cart.total)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResumeCart(cart.id)}
                      className="px-3 py-1.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Resume</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDiscardCart(cart.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition cursor-pointer"
                      title="Discard Cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CASHIER ROLE GOVERNANCE */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wide">Governance & Authorization Scope</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your account is configured for high-speed front-desk counter retail. To maintain corporate audit integrity, sensitive operations are restricted:
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Executive P&L & Wholesale Cost Margins</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Supplier Purchase Orders & AP Ledgers</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Garage Lift Bay & ECU Diagnostics</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>KRA eTIMS General Ledger & Tax Adjustments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierCounterDashboard;
