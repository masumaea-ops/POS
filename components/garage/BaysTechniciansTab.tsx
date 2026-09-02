import React from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { 
  Layers, 
  User, 
  Wrench, 
  CheckCircle2, 
  AlertCircle, 
  Car, 
  ShieldCheck, 
  Phone, 
  Mail, 
  Award,
  ChevronRight
} from 'lucide-react';

export const BaysTechniciansTab: React.FC = () => {
  const { branches, staffUsers, jobCards, activeBranchId, hasPermission } = useGarage();

  const currentBranch = branches.find(b => b.id === activeBranchId) || branches[0];

  // Filter job cards for the active branch
  const branchJobCards = activeBranchId === 'ALL'
    ? jobCards
    : jobCards.filter(j => j.branchId === activeBranchId);

  // Generate lift bays array based on branch totalLiftsBays count
  const baysList = Array.from({ length: currentBranch?.totalLiftsBays || 6 }, (_, i) => {
    const bayNum = `Bay 0${i + 1}`;
    // Find active job assigned to this bay
    const activeJob = branchJobCards.find(j => j.assignedLiftBay.toLowerCase().includes(`bay 0${i + 1}`) || j.assignedLiftBay.toLowerCase().includes(`bay ${i + 1}`));
    return {
      bayNumber: bayNum,
      bayName: i === 0 ? `${bayNum} (Computerized Diagnostic Bay)` : i === 1 ? `${bayNum} (Heavy 4-Post Lift)` : `${bayNum} (Hydraulic 2-Post Lift)`,
      isOccupied: !!activeJob,
      jobCard: activeJob
    };
  });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-6 h-6 text-brand-orange" />
          <span>Workshop Lift Bays & Technician Allocation</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Monitor hydraulic lift occupancy, diagnostic bay status, and master technician workload across {currentBranch?.name}.
        </p>
      </div>

      {/* Hydraulic Lift Bays Map Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <span>Hydraulic Lift & Service Bay Layout ({currentBranch?.name})</span>
          </h3>
          <span className="text-xs font-mono font-bold text-slate-500">
            {baysList.filter(b => b.isOccupied).length} / {baysList.length} Bays Occupied
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {baysList.map((bay, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all shadow-sm ${
                bay.isOccupied
                  ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                  : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {bay.bayNumber}
                  </span>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                    {bay.bayName}
                  </span>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono flex items-center gap-1 ${
                  bay.isOccupied
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300'
                }`}>
                  {bay.isOccupied ? (
                    <>
                      <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>In Use</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Available</span>
                    </>
                  )}
                </span>
              </div>

              {bay.isOccupied && bay.jobCard ? (
                <div className="pt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-brand-orange text-sm">
                      {bay.jobCard.vehicle.plateNumber}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {bay.jobCard.id}
                    </span>
                  </div>

                  <div className="text-slate-800 dark:text-slate-200 font-semibold">
                    {bay.jobCard.vehicle.make} {bay.jobCard.vehicle.model} ({bay.jobCard.vehicle.year})
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Tech: <strong className="text-slate-900 dark:text-white">{bay.jobCard.assignedTechnicianName}</strong></span>
                  </div>

                  <div className="flex items-center justify-between pt-2 text-[11px] font-mono border-t border-slate-200 dark:border-slate-700/60">
                    <span className="text-slate-500">Stage: {bay.jobCard.status}</span>
                    <span className="text-emerald-600 font-bold">Estimated: {bay.jobCard.estimatedCompletion}</span>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 italic">
                  Lift is currently empty and ready for incoming vehicle booking.
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Technicians & Mechanics Roster */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Award className="w-5 h-5 text-brand-orange" />
          <span>Garage Staff & Certified Technicians Roster</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffUsers.map(staff => {
            const activeJobs = jobCards.filter(j => j.assignedTechnicianId === staff.id && j.status !== 'Completed');
            return (
              <div
                key={staff.id}
                className="p-4 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange font-black flex items-center justify-center text-sm font-mono">
                      {staff.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 dark:text-white text-xs">
                        {staff.name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-slate-400 block">
                        ID: {staff.id}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase font-mono bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                    {staff.role}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Specialty: <strong className="text-slate-800 dark:text-slate-200">{staff.specialty || 'General Service'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">Active Workload:</span>
                  <span className="font-black text-brand-orange bg-brand-orange/10 px-2 py-0.5 rounded">
                    {activeJobs.length} Assigned Jobs
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
