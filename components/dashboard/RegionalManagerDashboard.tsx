import React, { useState } from 'react';
import { 
  Building2, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Truck, 
  Boxes, 
  FileCheck,
  Check,
  X,
  MapPin,
  BarChart2,
  ChevronRight,
  Sparkles,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

export const RegionalManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { settings, formatPrice } = useSettings();

  const branches = [
    { name: 'Nairobi Flagship & Central', revenue: 620000, target: 700000, baysActive: 7, baysTotal: 8, fillRate: 98, status: 'On Track' },
    { name: 'Mombasa Coastal Hub', revenue: 210000, target: 250000, baysActive: 5, baysTotal: 6, fillRate: 94, status: 'Normal' },
    { name: 'Nakuru Express Outlet', revenue: 145000, target: 160000, baysActive: 3, baysTotal: 4, fillRate: 91, status: 'Normal' },
    { name: 'Kisumu Lake Basin Branch', revenue: 98000, target: 120000, baysActive: 3, baysTotal: 4, fillRate: 89, status: 'Attention' }
  ];

  const [approvals, setApprovals] = useState([
    { id: 'APP-101', type: 'Credit Limit Override', target: 'Simba Fleet Logistics', detail: 'Requesting credit extension to KES 1,500,000 (Current: KES 1,000,000)', urgency: 'High', status: 'pending' },
    { id: 'APP-102', type: 'Bulk Discount Approval', target: 'Nairobi Safari Tours', detail: '18% discount requested on 40x Heavy Duty Shock Absorbers', urgency: 'Medium', status: 'pending' },
    { id: 'APP-103', type: 'High-Value Parts Requisition', target: 'Bay 03 (Engine Overhaul)', detail: 'OEM Cylinder Head Assembly (KES 142,000) for Land Cruiser', urgency: 'High', status: 'pending' }
  ]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleAuthorize = (id: string, target: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'authorized' } : a));
    setToastMessage(`Authorized request ${id} for ${target}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleReject = (id: string, target: string) => {
    setApprovals(prev => prev.map(a => a.id === id ? { ...a, status: 'declined' } : a));
    setToastMessage(`Declined request ${id} for ${target}`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* IN-APP TOAST NOTIFICATION */}
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

      {/* REGIONAL COMMAND HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Multi-Branch Regional Command
              </span>
              <span className="text-xs text-slate-400 font-medium">East Africa Region • 4 Active Outlets</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Regional Operations Cockpit
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Cross-branch operational benchmarking, managerial authorizations, inventory rebalancing, and fleet fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/purchasing')}
              className="px-3.5 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Pending Authorizations ({pendingCount})</span>
            </button>
          </div>
        </div>

        {/* QUICK REGIONAL STATUS HIGHLIGHTS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Primary Outlets Online</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">4 / 4 Branches</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-1">100% Active</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Consolidated Revenue Today</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{formatPrice(1073000)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Regional Target Pace</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">87.2% Pace</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Active Lift Bays</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">18 / 22 Operating</span>
          </div>
        </div>
      </div>

      {/* REGIONAL HIGH-LEVEL KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Aggregated Regional Revenue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Regional Day Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {formatPrice(1073000)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Target: {formatPrice(1230000)}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">87.2% Pace</span>
          </div>
        </div>

        {/* Metric 2: Pending Approvals */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Manager Authorization Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {pendingCount}
            </span>
            <span className="text-xs font-semibold text-slate-500">Items Requiring Review</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Overrides & Requisitions</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">Action Needed</span>
          </div>
        </div>

        {/* Metric 3: Active Lift Bays Across Region */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lift Bays In Service</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              18 / 22
            </span>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Bays Operating</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Regional Bay Load</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">81.8% Utilized</span>
          </div>
        </div>

        {/* Metric 4: Regional Dispatch & Logistics */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Inter-Branch Logistics</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              6
            </span>
            <span className="text-xs font-semibold text-slate-500">Transfers In Transit</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Wells Fargo & Regional</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">ETA Today</span>
          </div>
        </div>
      </div>

      {/* MULTI-BRANCH BENCHMARKING TABLE */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Regional Outlets Benchmarking</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time performance metrics across branches in Kenya.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="text-xs text-brand-orange font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Export Regional Summary</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <th className="pb-3 font-semibold">Branch Location</th>
                <th className="pb-3 font-semibold">Today Revenue</th>
                <th className="pb-3 font-semibold">Target Progress</th>
                <th className="pb-3 font-semibold">Lift Bay Status</th>
                <th className="pb-3 font-semibold">Inventory Fill-Rate</th>
                <th className="pb-3 text-right font-semibold">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 font-medium">
              {branches.map(b => {
                const percent = Math.round((b.revenue / b.target) * 100);
                return (
                  <tr key={b.name} className="hover:bg-slate-50/70 dark:hover:bg-slate-750 transition-colors">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange shrink-0" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                      {formatPrice(b.revenue)}
                    </td>
                    <td className="py-3.5">
                      <div className="w-36">
                        <div className="flex justify-between text-[10px] mb-1 font-semibold text-slate-500">
                          <span>{percent}%</span>
                          <span>{formatPrice(b.target)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${percent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300">
                      {b.baysActive}/{b.baysTotal} Active Bays
                    </td>
                    <td className="py-3.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {b.fillRate}%
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        b.status === 'On Track' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : b.status === 'Attention'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* APPROVALS QUEUE & MANAGER ROLE SCOPE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* APPROVALS QUEUE */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Pending Manager Approvals</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Commercial credit overrides, volume concessions, and high-value parts requisitions.</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              {pendingCount} Pending
            </span>
          </div>

          <div className="space-y-3">
            {approvals.map(app => (
              <div 
                key={app.id} 
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-750/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                      {app.type}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{app.target}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {app.detail}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {app.status === 'authorized' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorized</span>
                    </span>
                  ) : app.status === 'declined' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3 py-1.5 rounded-lg border border-rose-500/30">
                      <X className="w-3.5 h-3.5" />
                      <span>Declined</span>
                    </span>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleAuthorize(app.id, app.target)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Authorize</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(app.id, app.target)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
                      >
                        Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MANAGER ROLE SECURITY SCOPE */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wide">Governance & Authorization Scope</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Regional Managers possess multi-branch operational control and commercial approval authority across all branches. Technical API management and root configs remain strictly restricted:
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Developer API Gateways & Webhook Secrets</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Deletion of System Users & Root Admin Credentials</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Inventory Master Record Deletion (Write/Approve Only)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Full Operational Control: Sales, POS, Garage & Shipping</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalManagerDashboard;
