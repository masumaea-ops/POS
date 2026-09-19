import React from 'react';
import { 
  Wrench, 
  Cpu, 
  FileCheck2, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Lock, 
  Activity, 
  Layers, 
  FileText, 
  Star, 
  Car,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGarage } from '../../contexts/GarageContext';
import { useSettings } from '../../contexts/SettingsContext';

export const WorkshopOperationsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { jobCards, diagnosticReports, bays, customerFeedback } = useGarage();
  const { formatPrice } = useSettings();

  const inProgressJobs = jobCards.filter(j => j.status === 'IN_PROGRESS' || j.status === 'DIAGNOSTICS');
  const awaitingPartsJobs = jobCards.filter(j => j.status === 'PARTS_PENDING');
  const readyJobs = jobCards.filter(j => j.status === 'READY_FOR_PICKUP' || j.status === 'COMPLETED');

  // Average CSAT
  const avgRating = customerFeedback.length > 0 
    ? (customerFeedback.reduce((acc, f) => acc + f.rating, 0) / customerFeedback.length).toFixed(1)
    : '4.8';

  const occupiedBaysCount = bays.filter(b => b.isOccupied).length;
  const totalBays = bays.length || 8;
  const occupancyPercentage = Math.round((occupiedBaysCount / totalBays) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* WORKSHOP LEAD COMMAND HEADER */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                Garage & Diagnostics Command
              </span>
              <span className="text-xs text-slate-400 font-medium">Industrial Area Main Workshop • 8 Hydraulic Bays</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Workshop Operations Desk
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Real-time lift bay occupancy, computerized ECU scans, mechanic shift allocations, and active job cards.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => navigate('/garage?tab=job_cards')}
              className="px-4 py-2 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Manage Job Cards ({jobCards.length})</span>
            </button>
          </div>
        </div>

        {/* WORKSHOP STATUS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-700/60 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Active Lift Bay Load</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{occupiedBaysCount} of {totalBays} Bays</span>
            <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium ml-1">({occupancyPercentage}%)</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Vehicles Under Repair</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{inProgressJobs.length} In Progress</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Parts Pending Gate</span>
            <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">{awaitingPartsJobs.length} Requisitions</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Ready for Handover</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{readyJobs.length} Vehicles</span>
          </div>
        </div>
      </div>

      {/* WORKSHOP LIVE METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Lift Bay Occupancy */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Lift Bay Utilization</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {occupiedBaysCount} / {totalBays}
            </span>
            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">Bays Operating</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Occupancy Rate</span>
            <span className="text-cyan-600 dark:text-cyan-400 font-bold">{occupancyPercentage}% Load</span>
          </div>
        </div>

        {/* Metric 2: In-Progress Jobs */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Service Jobs</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 tracking-tight">
              {inProgressJobs.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">Vehicles in Bay</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">Awaiting Parts: {awaitingPartsJobs.length}</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">On Schedule</span>
          </div>
        </div>

        {/* Metric 3: Diagnostic Reports */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Diagnostic Scans (OBD-II)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {diagnosticReports.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">ECU Health Logs</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">PDF Reports Active</span>
            <span className="text-indigo-600 dark:text-indigo-400 font-bold">Scanner Online</span>
          </div>
        </div>

        {/* Metric 4: Customer Satisfaction */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-slate-300 dark:hover:border-slate-600 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Workshop CSAT Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{avgRating}</span>
            <span className="text-xs font-semibold text-slate-500">/ 5.0 Rating</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-slate-500 text-[11px]">{customerFeedback.length} Verified Reviews</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Top Tier</span>
          </div>
        </div>
      </div>

      {/* QUICK WORKSHOP ACTIONS */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Workshop Operations Launchpad
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/garage?tab=job_cards')}
            className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-50/20 dark:bg-cyan-950/20 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/30 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-cyan-600 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Wrench className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Active Job Cards</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Intake vehicles, assign technicians, allocate spare parts, and advance repair stages.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/garage?tab=diagnostics')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Cpu className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">ECU Diagnostic Scanner</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Read DTC fault codes, generate vehicle health certificates, and upload scan PDFs.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/garage?tab=scheduling')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Calendar className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Mechanic Bay Board</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">View technician shift allocations, hydraulic lift occupancy, and bay schedules.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/garage?tab=customer_satisfaction')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-750/40 text-left transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Star className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">CSAT Quality Ratings</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Inspect post-service vehicle owner ratings, mechanic commendations, and feedback.</p>
          </button>
        </div>
      </div>

      {/* LIFT BAY STATUS & ROLE SCOPE CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* BAY STATUS GRID */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Lift Bays Status</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Live hydraulic hoist and diagnostic bay occupancy in Industrial Area.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/garage?tab=scheduling')}
              className="text-xs text-brand-orange font-semibold hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>View Full Bay Schedule</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {bays.slice(0, 6).map(bay => (
              <div 
                key={bay.id} 
                className={`p-4 rounded-xl border transition ${
                  bay.isOccupied 
                    ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/40 dark:bg-cyan-950/20' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-750/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">{bay.name}</span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    bay.isOccupied 
                      ? 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {bay.isOccupied ? 'In Service' : 'Available'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-medium">
                  <Car className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{bay.isOccupied ? bay.currentVehiclePlate || 'Vehicle In Bay' : 'Ready for Vehicle Intake'}</span>
                </div>
                {bay.isOccupied && (
                  <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                    Lead Tech: <span className="font-semibold text-slate-700 dark:text-slate-300">{bay.assignedMechanicName || 'Assigned Mechanic'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* WORKSHOP LEAD SECURITY BOUNDARY */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-bold text-sm tracking-wide">Governance & Authorization Scope</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Your account has full operational authority over vehicle repairs, diagnostics, and lift bays. Financial accounting and cash registers are strictly restricted:
            </p>

            <ul className="mt-4 space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>POS Cash Register & Cash Drawer Tender</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Commercial Wholesale Sales & Pricing Tiers</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Supplier Purchase Order Authorization</span>
              </li>
              <li className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>General Ledger, Banking & KRA eTIMS Tax</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopOperationsDashboard;
