import React from 'react';
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
  BarChart2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../contexts/SettingsContext';

interface RegionalManagerDashboardProps {
  onOpenRbacMatrix: () => void;
}

export const RegionalManagerDashboard: React.FC<RegionalManagerDashboardProps> = ({ onOpenRbacMatrix }) => {
  const navigate = useNavigate();
  const { settings, formatPrice } = useSettings();

  const branches = [
    { name: 'Nairobi Flagship & Central', revenue: 620000, target: 700000, baysActive: 7, baysTotal: 8, fillRate: 98, status: 'On Track' },
    { name: 'Mombasa Coastal Hub', revenue: 210000, target: 250000, baysActive: 5, baysTotal: 6, fillRate: 94, status: 'Normal' },
    { name: 'Nakuru Express Outlet', revenue: 145000, target: 160000, baysActive: 3, baysTotal: 4, fillRate: 91, status: 'Normal' },
    { name: 'Kisumu Lake Basin Branch', revenue: 98000, target: 120000, baysActive: 3, baysTotal: 4, fillRate: 89, status: 'Attention' }
  ];

  const pendingApprovals = [
    { id: 'APP-101', type: 'Credit Limit Override', target: 'Simba Fleet Logistics', detail: 'Requesting credit extension to KES 1,500,000 (Current: KES 1,000,000)', urgency: 'High' },
    { id: 'APP-102', type: 'Bulk Discount Approval', target: 'Nairobi Safari Tours', detail: '18% discount requested on 40x Heavy Duty Shock Absorbers', urgency: 'Medium' },
    { id: 'APP-103', type: 'High-Value Parts Requisition', target: 'Bay 03 (Engine Overhaul)', detail: 'OEM Cylinder Head Assembly (KES 142,000) for Land Cruiser', urgency: 'High' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Regional Scope Banner */}
      <div className="bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-amber-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                Regional Multi-Branch Operations
              </span>
              <span className="text-xs text-slate-400 font-mono">East Africa Region • 4 Active Outlets</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Regional Operations Center
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Cross-branch benchmarking, manager authorizations, inventory rebalancing, and fleet fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRbacMatrix}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Inspect My Permissions</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/purchasing')}
              className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <FileCheck className="w-4 h-4" />
              <span>Pending Approvals ({pendingApprovals.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Regional High-Level KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Aggregated Regional Revenue */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Regional Day Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {formatPrice(1073000)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Target: {formatPrice(1230000)}</span>
            <span className="text-emerald-500 font-bold">87.2% Pace</span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Pending Approvals Queue</span>
            <AlertCircle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-500 font-mono">
              {pendingApprovals.length}
            </span>
            <span className="text-xs font-bold text-slate-400">requests</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Overrides & Requisitions</span>
            <span className="text-amber-500 font-bold">Action Needed</span>
          </div>
        </div>

        {/* Active Lift Bays Across Region */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Lift Bays In Service</span>
            <Building2 className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              18 / 22
            </span>
            <span className="text-xs font-bold text-cyan-500">Bays</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Regional Bay Load</span>
            <span className="text-cyan-500 font-bold">81.8% Utilized</span>
          </div>
        </div>

        {/* Regional Dispatch & Logistics */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Inter-Branch Dispatches</span>
            <Truck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">6</span>
            <span className="text-xs font-bold text-slate-400">In Transit</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Fargo & Wells Fargo Couriers</span>
            <span className="text-indigo-500 font-bold">ETA Today</span>
          </div>
        </div>
      </div>

      {/* Multi-Branch Benchmarking Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Regional Outlets Benchmarking</h3>
            <p className="text-xs text-slate-400">Real-time performance metrics across branches in Kenya.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="text-xs text-brand-orange font-bold hover:underline"
          >
            Export Regional Summary →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-wider text-slate-400">
                <th className="pb-3">Branch Location</th>
                <th className="pb-3">Today Revenue</th>
                <th className="pb-3">Target Progress</th>
                <th className="pb-3">Lift Bay Status</th>
                <th className="pb-3">Inventory Fill-Rate</th>
                <th className="pb-3 text-right">Operational Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700 font-medium">
              {branches.map(b => {
                const percent = Math.round((b.revenue / b.target) * 100);
                return (
                  <tr key={b.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                    <td className="py-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-orange" />
                      <span>{b.name}</span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                      {formatPrice(b.revenue)}
                    </td>
                    <td className="py-3.5">
                      <div className="w-32">
                        <div className="flex justify-between text-[10px] mb-1 font-mono text-slate-400">
                          <span>{percent}%</span>
                          <span>{formatPrice(b.target)}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${percent >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">
                      {b.baysActive}/{b.baysTotal} Active Bays
                    </td>
                    <td className="py-3.5">
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {b.fillRate}%
                      </span>
                    </td>
                    <td className="py-3.5 text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        b.status === 'On Track' 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : b.status === 'Attention'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
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

      {/* Approvals Queue & Manager Role Scope */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Approvals Queue */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Pending Manager Approvals</h3>
              <p className="text-xs text-slate-400">Credit extensions, high-value parts requisitions, and price overrides.</p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingApprovals.map(app => (
              <div key={app.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
                      {app.type}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{app.target}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {app.detail}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => alert(`Approved ${app.id}`)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Authorize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => alert(`Rejected ${app.id}`)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manager Role Security Scope */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-wider">Role Boundary: Regional Manager</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your account possesses multi-branch operational control and commercial approval authority across all branches. Technical API management and root configs remain strictly restricted:
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
                <span>Full Operational CRUD across Sales, POS, Garage & Shipping</span>
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

export default RegionalManagerDashboard;
