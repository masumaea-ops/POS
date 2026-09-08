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
  Smartphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

interface CashierCounterDashboardProps {
  onOpenRbacMatrix: () => void;
}

export const CashierCounterDashboard: React.FC<CashierCounterDashboardProps> = ({ onOpenRbacMatrix }) => {
  const navigate = useNavigate();
  const { settings, formatPrice } = useSettings();

  // Mock held carts for quick recovery
  const [heldCarts] = useState([
    { id: 'CART-9021', customer: 'Walk-in Customer (Boda Boda)', itemsCount: 3, total: 4200, time: '10 mins ago' },
    { id: 'CART-9022', customer: 'John Kamau (Toyota Fielder)', itemsCount: 5, total: 18500, time: '22 mins ago' },
    { id: 'CART-9024', customer: 'Amina Fleet Driver', itemsCount: 2, total: 7800, time: '35 mins ago' }
  ]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Cashier Welcome & Security Scope Banner */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-emerald-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Front-Desk Counter POS
              </span>
              <span className="text-xs text-slate-400 font-mono">Terminal #01 • Shift: Active (08:00 - 18:00)</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Cashier Operations Cockpit
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Rapid checkout register, drawer float reconciliation, customer quotes, and walk-in receipts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRbacMatrix}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Inspect My Permissions</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/pos')}
              className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch POS Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cash Drawer & Daily Counter Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cash in Drawer */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash in Drawer (Float Included)</span>
            <Coins className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatPrice(246000)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Float: {formatPrice(10000)}</span>
            <span className="text-emerald-500 font-bold">Verified Balanced</span>
          </div>
        </div>

        {/* M-Pesa Till Total */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">M-Pesa STK & Buy Goods</span>
            <Smartphone className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatPrice(520000)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Till #882199</span>
            <span className="text-slate-400">94 Transactions</span>
          </div>
        </div>

        {/* Counter Sales Count */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Today's Counter Tickets</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">142</span>
            <span className="text-xs font-bold text-slate-400">receipts</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Avg Ticket: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatPrice(5728)}</strong></span>
            <span className="text-blue-500 font-bold">Peak: 14:00</span>
          </div>
        </div>

        {/* Held Carts */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Held / Suspended Carts</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-500 font-mono">{heldCarts.length}</span>
            <span className="text-xs font-bold text-slate-400">pending</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Awaiting customer / M-Pesa</span>
            <span className="text-amber-500 font-bold">Resume Anytime</span>
          </div>
        </div>
      </div>

      {/* Quick Cashier Launchpad */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span>Front-Desk Counter Quick Actions</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/pos')}
            className="p-4 rounded-xl border border-brand-orange/30 bg-brand-orange/5 hover:bg-brand-orange/10 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-orange text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">New Walk-In Sale</h4>
            <p className="text-xs text-slate-500 mt-1">Scan barcodes or search autoparts to bill customer immediately.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/inventory')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Boxes className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">Parts Price & Bin Lookup</h4>
            <p className="text-xs text-slate-500 mt-1">Check current stock on shelves, shelf bins, and retail pricing.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/quotations')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">Draft Customer Quotation</h4>
            <p className="text-xs text-slate-500 mt-1">Generate a formal proforma quote for corporate or retail walk-in.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Receipt className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">Today's Invoices & Receipts</h4>
            <p className="text-xs text-slate-500 mt-1">Reprint customer receipt, check eTIMS signature, or review payments.</p>
          </button>
        </div>
      </div>

      {/* Held Carts Table & RBAC Boundary Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Held Carts */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Active Held Carts</h3>
              <p className="text-xs text-slate-400">Suspended registers waiting for customer payment or parts fetch.</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded">
              {heldCarts.length} Active
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {heldCarts.map(cart => (
              <div key={cart.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-brand-orange">{cart.id}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{cart.customer}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-3">
                    <span>{cart.itemsCount} autopart items</span>
                    <span>•</span>
                    <span>Held {cart.time}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-black text-slate-900 dark:text-white">
                    {formatPrice(cart.total)}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/pos')}
                    className="px-3 py-1.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <span>Resume</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Explicit Role Security Scope Card */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-wider">Role Boundary: Cashier</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your account is configured for high-speed front-desk counter retail. To maintain corporate audit integrity, certain modules are restricted:
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
                <span>Garage Lift Bay & ECU OBD-II Diagnostics</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>KRA eTIMS General Ledger & Tax Filing</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-slate-800 pt-4 mt-6">
            <button
              type="button"
              onClick={onOpenRbacMatrix}
              className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>View Full System Security Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierCounterDashboard;
