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
  Percent,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

export const FinancialAccountantDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { settings, formatPrice } = useSettings();

  const arAging = [
    { bracket: 'Current (0–30 Days)', amount: 642000, percentage: 68, risk: 'Low' },
    { bracket: 'Overdue (31–60 Days)', amount: 186000, percentage: 20, risk: 'Medium' },
    { bracket: 'Overdue (61–90 Days)', amount: 78000, percentage: 8, risk: 'High' },
    { bracket: 'Default Risk (90+ Days)', amount: 38500, percentage: 4, risk: 'Critical' }
  ];

  const totalAR = arAging.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* ACCOUNTANT COMMAND HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                Corporate Finance & Audit Console
              </span>
              <span className="text-xs text-slate-400 font-medium">KRA eTIMS Validated • Fiscal Year 2026</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Financial Accounting & Tax Console
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              General ledger audits, aged accounts receivable, KRA VAT liability, and multi-channel bank reconciliations.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/accounting')}
              className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Landmark className="w-4 h-4" />
              <span>General Ledger</span>
            </button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY STATUS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">KRA eTIMS Compliance</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">100% Fiscalized</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Pending Vendor Bills (AP)</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(540000)} Matched</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Total Outstanding AR</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(totalAR)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Audit Lock Status</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">Balanced & Reconciled</span>
          </div>
        </div>
      </div>

      {/* FINANCIAL HIGH-LEVEL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Outstanding AR */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Outstanding AR</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatPrice(totalAR)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Aged Debtor Balance</span>
            <span className="text-purple-600 dark:text-purple-400 font-bold">18 Accounts</span>
          </div>
        </div>

        {/* Metric 2: KRA eTIMS VAT Liability */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">KRA 16% VAT Accrued</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatPrice(146800)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">eTIMS OSCU Integration</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Fiscalized</span>
          </div>
        </div>

        {/* Metric 3: Supplier AP Pending */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Accounts Payable (AP)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatPrice(540000)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">3-Way Match Verified</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Due in 15d</span>
          </div>
        </div>

        {/* Metric 4: Cash Flow Collected Today */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Daily Cash Collections</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-brand-orange flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-brand-orange tracking-tight">
              {formatPrice(1143500)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">All Payment Gateways</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Reconciled</span>
          </div>
        </div>
      </div>

      {/* AGED ACCOUNTS RECEIVABLE MATRIX */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Aged Debtors & Accounts Receivable Breakdown</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Aging schedule of commercial wholesale and corporate fleet accounts.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="text-xs text-brand-orange font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
          >
            <span>Manage Invoices & Dunning</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {arAging.map(item => (
            <div 
              key={item.bracket} 
              className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-750 bg-slate-50/50 dark:bg-slate-750/30"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{item.bracket}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  item.risk === 'Low' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : item.risk === 'Medium'
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      : item.risk === 'High'
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                }`}>
                  {item.risk} Risk
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                {formatPrice(item.amount)}
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Distribution: {item.percentage}%</span>
              </div>
              <div className="mt-1.5 w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${item.risk === 'Critical' ? 'bg-rose-500' : item.risk === 'High' ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* QUICK LAUNCHPAD & ROLE SCOPE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ACCOUNTANT LAUNCHPAD */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
            Finance & Tax Action Launchpad
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate('/invoices')}
              className="p-4 rounded-xl border border-purple-200/80 dark:border-purple-800/60 bg-purple-50/20 dark:bg-purple-950/20 hover:bg-purple-50/40 dark:hover:bg-purple-950/30 text-left transition group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <FileText className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tax Invoices & eTIMS</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Review fiscal signatures, verify invoice QR codes, and trigger customer dunning alerts.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/accounting')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Landmark className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">General Ledger & COA</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Post journal adjustments, examine chart of accounts, and audit double-entry ledger.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/reports')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <BarChart2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">P&L & Financial Reports</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Export executive balance sheets, income statements, and KRA VAT return filings.</p>
            </button>

            <button
              type="button"
              onClick={() => navigate('/purchasing')}
              className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
                <Building2 className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">3-Way Match PO Approvals</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Compare Supplier Invoices with Purchase Orders and Goods Received Notes (GRN).</p>
            </button>
          </div>
        </div>

        {/* ACCOUNTANT SECURITY BOUNDARY */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wide">Governance & Authorization Scope</h3>
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
        </div>
      </div>
    </div>
  );
};

export default FinancialAccountantDashboard;
