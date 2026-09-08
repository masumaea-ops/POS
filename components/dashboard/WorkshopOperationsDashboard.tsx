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
  Car
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGarage } from '../../contexts/GarageContext';
import { useSettings } from '../../contexts/SettingsContext';

interface WorkshopOperationsDashboardProps {
  onOpenRbacMatrix: () => void;
}

export const WorkshopOperationsDashboard: React.FC<WorkshopOperationsDashboardProps> = ({ onOpenRbacMatrix }) => {
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Workshop Lead Scope Banner */}
      <div className="bg-gradient-to-r from-cyan-950/60 via-slate-900 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-cyan-500/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Garage & Diagnostics Command
              </span>
              <span className="text-xs text-slate-400 font-mono">Industrial Area Lift Bays • 8 Hydraulic Bays</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Workshop Operations Cockpit
            </h1>
            <p className="text-xs text-slate-300 mt-0.5">
              Live bay occupancy, computerized ECU scans, mechanic shift allocations, and active job cards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenRbacMatrix}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Inspect My Permissions</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/garage?tab=job_cards')}
              className="px-5 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white text-xs font-black rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Manage Job Cards</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workshop Live Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Lift Bay Occupancy */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Lift Bay Utilization</span>
            <Activity className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {bays.filter(b => b.isOccupied).length} / {bays.length || 8}
            </span>
            <span className="text-xs font-bold text-cyan-500">Bays Active</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between font-mono">
            <span>Occupancy Rate</span>
            <span className="text-slate-700 dark:text-slate-300 font-bold">75% Load</span>
          </div>
        </div>

        {/* In-Progress Job Cards */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Jobs Under Repair</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-500 font-mono">
              {inProgressJobs.length}
            </span>
            <span className="text-xs font-bold text-slate-400">vehicles</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Awaiting Parts: <strong className="text-rose-500 font-mono">{awaitingPartsJobs.length}</strong></span>
            <span className="text-amber-500 font-bold">On Schedule</span>
          </div>
        </div>

        {/* ECU Scans & Diagnostics */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diagnostic Scans (OBD-II)</span>
            <Cpu className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {diagnosticReports.length}
            </span>
            <span className="text-xs font-bold text-slate-400">ECU Reports</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>PDF Uploads Available</span>
            <span className="text-indigo-400 font-bold">OBD-II Online</span>
          </div>
        </div>

        {/* Customer Satisfaction Score */}
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workshop CSAT Rating</span>
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-emerald-500 font-mono">{avgRating}</span>
            <span className="text-xs font-bold text-slate-400">/ 5.0 Stars</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
            <span>{customerFeedback.length} Verified Reviews</span>
            <span className="text-emerald-500 font-bold">Top Tier</span>
          </div>
        </div>
      </div>

      {/* Quick Workshop Actions */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-4">
          Workshop Operations Quick Launchpad
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/garage?tab=job_cards')}
            className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 hover:bg-cyan-500/10 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-cyan-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Wrench className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">Active Job Cards</h4>
            <p className="text-xs text-slate-500 mt-1">Intake vehicles, assign technicians, allocate spare parts, and advance repair stages.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/garage?tab=diagnostics')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Cpu className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">ECU Diagnostic Scanner</h4>
            <p className="text-xs text-slate-500 mt-1">Read DTC fault codes, generate vehicle health certificates, and upload scan PDFs.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/garage?tab=scheduling')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Calendar className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">Mechanic Bay Board</h4>
            <p className="text-xs text-slate-500 mt-1">View technician shift allocations, hydraulic lift occupancy, and bay schedules.</p>
          </button>

          <button
            type="button"
            onClick={() => navigate('/garage?tab=customer_satisfaction')}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30 text-left transition group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-500 text-white flex items-center justify-center mb-3 group-hover:scale-105 transition">
              <Star className="w-5 h-5" />
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm">CSAT Quality Ratings</h4>
            <p className="text-xs text-slate-500 mt-1">Inspect post-service vehicle owner ratings, mechanic commendations, and feedback.</p>
          </button>
        </div>
      </div>

      {/* Lift Bay Status & Role Scope Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bay Status Grid */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Active Lift Bays Status</h3>
              <p className="text-xs text-slate-400">Live hydraulic hoist and diagnostic bay occupancy in Industrial Area.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/garage?tab=scheduling')}
              className="text-xs text-brand-orange font-bold hover:underline"
            >
              View Full Bay Schedule →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bays.slice(0, 6).map(bay => (
              <div 
                key={bay.id} 
                className={`p-3.5 rounded-xl border transition ${
                  bay.isOccupied 
                    ? 'border-cyan-500/30 bg-cyan-50/30 dark:bg-cyan-950/20' 
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-900/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-slate-900 dark:text-white">{bay.name}</span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    bay.isOccupied 
                      ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30' 
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}>
                    {bay.isOccupied ? 'Occupied' : 'Available'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-400" />
                  <span>{bay.isOccupied ? bay.currentVehiclePlate || 'Active Vehicle' : 'Ready for Intake'}</span>
                </div>
                {bay.isOccupied && (
                  <div className="mt-1 text-[11px] text-slate-400 font-mono">
                    Assigned: {bay.assignedMechanicName || 'Lead Tech'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Workshop Lead Security Boundary */}
        <div className="lg:col-span-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="font-black text-sm uppercase tracking-wider">Role Boundary: Garage Workshop</h3>
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

export default WorkshopOperationsDashboard;
