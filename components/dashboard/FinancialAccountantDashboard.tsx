import React from 'react';
import { 
  Coins, 
  FileText, 
  BarChart2, 
  Building2, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  Download,
  Landmark,
  CreditCard,
  Percent
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

interface FinancialAccountantDashboardProps {
  onOpenRbacMatrix: () => void;
}

export const FinancialAccountantDashboard: React.FC<FinancialAccountantDashboardProps> = ({ onOpenRbacMatrix }) => {
  const navigate = useNavigate();
  const { settings, formatPrice } = useSettings();

  const arAging = [
    { bracket: 'Current (0-30 Days)', amount: 642000, percentage: 68, risk: 'Low' },
    { bracket: 'Overdue (31-60 Days)', amount: 186000, percentage: 20, risk: 'Medium' },
    { bracket: 'Overdue (61-90 Days)', amount: 78000, percentage: 8, risk: 'High' },
    { bracket: 'Default Risk (90+ Days)', amount: 38500, percentage: 4, risk: 'Critical' }
  ];

  const totalAR = arAging.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Accountant Scope Banner */}
      <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-slate-900 border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-purple-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Corporate Finance & Audit Hub
              </span>
              <span className="text-xs text-slate-400 font-mono">KRA eTIMS Validated • Fiscal Year 2026</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Financial Accounting & Tax Console
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              General ledger audits, aged accounts receivable, KRA VAT liability, and bank reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRbacMatrix}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Inspect My Permissions</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/accounting')}
              className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Landmark className="w-4 h-4" />
              <span>General Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Financial High-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Outstanding AR */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Outstanding AR</span>
            <Coins className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatPrice(totalAR)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Aged Debtor Balance</span>
            <span className="text-purple-500 font-bold">18 Accounts</span>
          </div>
        </div>

        {/* KRA eTIMS VAT Liability */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">KRA 16% VAT Accrued</span>
            <Receipt className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatPrice(146800)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>eTIMS OSCU Sync</span>
            <span className="text-emerald-500 font-bold">100% Fiscalized</span>
          </div>
        </div>

        {/* Supplier AP Pending */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Accounts Payable (AP)</span>
            <Building2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatPrice(540000)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>3-Way Match Verified</span>
            <span className="text-blue-500 font-bold">Due in 15d</span>
          </div>
        </div>

        {/* Cash Flow Today */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Cash Flow Collected Today</span>
            <CreditCard className="w-4 h-4 text-brand-orange" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-brand-orange font-mono">
              {formatPrice(1143500)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Across All Gateways</span>
            <span className="text-brand-orange font-bold">Reconciled</span>
          </div>
        </div>
      </div>

      {/* Aged Accounts Receivable Matrix */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Aged Debtors & Accounts Receivable Breakdown</h3>
            <p className="text-xs text-slate-400">Aging schedule of commercial wholesale and corporate fleet accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="text-xs text-brand-orange font-bold hover:underline"
          >
            Manage Invoices & Dunning →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {arAging.map(item => (
            <div 
              key={item.bracket} 
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{item.bracket}</span>
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                  item.risk === 'Low' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : item.risk === 'Medium'
                      ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : item.risk === 'High'
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {item.risk} Risk
                </span>
              </div>
              <div className="mt-2 text-xl font-black font-mono text-slate-900 dark:text-white">
                {formatPrice(item.amount)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                <span>Share: {item.percentage}%</span>
              </div>
              <div className="mt-1 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${item.risk === 'Critical' ? 'bg-rose-500' : item.risk === 'High' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Launchpad & Role Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Accountant Launchpad */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
            Finance & Tax Action Launchpad
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10 text-left transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">Tax Invoices & eTIMS</h4>
              <p className="text-xs text-slate-500 mt-1">Review fiscal signatures, verify invoice QR codes, and trigger customer dunning SMS.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/accounting')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Landmark className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">General Ledger & COA</h4>
              <p className="text-xs text-slate-500 mt-1">Post journal adjustments, examine chart of accounts, and audit double-entry ledger.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <BarChart2 className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">P&L & Financial Reports</h4>
              <p className="text-xs text-slate-500 mt-1">Export executive balance sheets, income statements, and KRA VAT return filings.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/purchasing')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Building2 className="w-5 h-5" />
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-sm">3-Way Match PO Approvals</h4>
              <p className="text-xs text-slate-500 mt-1">Compare Supplier Invoices with Purchase Orders and Goods Received Notes (GRN).</p>
            </button>
          </div>
        </div>

        {/* Accountant Security Boundary */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-wider">Role Boundary: Accountant</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your account has unrestricted financial auditing, ledger posting, and tax authority. Storefront retail cash registers and workshop diagnostics are restricted:
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>POS Counter Physical Checkout (Audit-Only)</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Garage Lift Bay Scheduling & ECU Diagnostics</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Developer API Gateways & Webhooks</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Full Access to Invoices, Accounting, Ledgers & Tax</span>
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

export default FinancialAccountantDashboard;
