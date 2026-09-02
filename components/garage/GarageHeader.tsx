import React from 'react';
import { useGarage } from '../../contexts/GarageContext';
import { useSystemSettings } from '../../contexts/SettingsContext';
import type { GarageRoleType } from '../../types';
import { 
  Building2, 
  ShieldCheck, 
  Wrench, 
  Cpu, 
  Car, 
  UserCheck, 
  Key, 
  Layers,
  RotateCcw,
  MapPin,
  Lock,
  User
} from 'lucide-react';

export const GarageHeader: React.FC = () => {
  const { 
    activeRole, 
    setActiveRole, 
    activeBranchId, 
    setActiveBranchId, 
    branches, 
    roles, 
    jobCards, 
    hasPermission,
    resetGarageData 
  } = useGarage();
  const { formatPrice } = useSystemSettings();

  const currentRoleDef = roles.find(r => r.key === activeRole);
  const activeBranch = branches.find(b => b.id === activeBranchId);

  const canSwitchLocation = hasPermission('switch_location') || hasPermission('view_all_branches');

  // Filter job cards by active location
  const filteredJobCards = activeBranchId === 'ALL' 
    ? jobCards 
    : jobCards.filter(jc => jc.branchId === activeBranchId);

  const activeJobsCount = filteredJobCards.filter(jc => jc.status !== 'Completed' && jc.status !== 'Invoiced').length;
  const diagnosticScansCount = filteredJobCards.filter(jc => jc.diagnosticReport).length;
  const totalLiftsCount = activeBranchId === 'ALL'
    ? branches.reduce((acc, b) => acc + b.totalLiftsBays, 0)
    : (activeBranch?.totalLiftsBays || 0);

  const totalEstimatedRevenue = filteredJobCards.reduce((acc, jc) => acc + jc.totalEstimate, 0);

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-slate-700 p-4 lg:p-6 space-y-4">
      {/* Top Title & Quick Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
              Multi-Garage Chain & Diagnostics Engine
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">v3.2 PRO</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Wrench className="w-7 h-7 text-brand-orange shrink-0" />
            <span>Garage Operations & Diagnostic Hub</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Computerized ECU diagnostics, vehicle job cards, parts requisitions & multi-branch RBAC.
          </p>
        </div>

        {/* Location & Role Selector Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-gray-900/80 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
          {/* Reset Demo Data Button */}
          <button
            onClick={() => {
              if (confirm('Reset garage data to default industry sample records?')) {
                resetGarageData();
              }
            }}
            title="Reset to default sample data"
            className="px-2.5 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 hover:border-brand-orange hover:text-brand-orange rounded-lg font-mono transition-all flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-orange shrink-0" />
            <span>Reset Data</span>
          </button>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
          {/* Location Selector */}
          <div className="flex items-center gap-1.5 min-w-[210px] relative">
            <Building2 className={`w-4 h-4 shrink-0 ${canSwitchLocation ? 'text-brand-orange' : 'text-slate-400'}`} />
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block font-mono flex items-center justify-between">
                <span>Active Location:</span>
                {!canSwitchLocation && (
                  <span className="text-[9px] text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 inline" /> RBAC Locked
                  </span>
                )}
              </label>
              <select
                value={activeBranchId}
                disabled={!canSwitchLocation}
                onChange={(e) => canSwitchLocation && setActiveBranchId(e.target.value)}
                className={`w-full text-xs font-bold bg-transparent py-0.5 focus:outline-none ${
                  canSwitchLocation 
                    ? 'text-slate-900 dark:text-white cursor-pointer' 
                    : 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}
                title={!canSwitchLocation ? `Location switching is restricted for role: ${currentRoleDef?.name}. Contact admin.` : 'Select active garage location'}
              >
                <option value="ALL">All Garage Outlets ({branches.length})</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>

          {/* RBAC Active Role Switcher */}
          <div className="flex items-center gap-1.5 min-w-[210px]">
            <Key className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase text-slate-400 block font-mono flex items-center justify-between">
                <span>Active User Role (RBAC):</span>
                <span className="text-[9px] text-purple-600 dark:text-purple-400 font-extrabold">Simulate</span>
              </label>
              <select
                value={activeRole}
                onChange={(e) => setActiveRole(e.target.value as GarageRoleType)}
                className="w-full text-xs font-bold bg-transparent text-slate-900 dark:text-white focus:outline-none cursor-pointer py-0.5"
              >
                {roles.map(r => (
                  <option key={r.key} value={r.key}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Active Role Permissions Indicator Bar */}
      <div className="p-2.5 rounded-lg bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/50 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span className="font-bold text-slate-800 dark:text-slate-200">
            Active RBAC Persona:
          </span>
          <span className={`px-2 py-0.5 rounded text-[11px] font-extrabold uppercase ${currentRoleDef?.badgeColor || 'bg-slate-200 text-slate-800'}`}>
            {currentRoleDef?.name}
          </span>
          <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden md:inline">
            — {currentRoleDef?.description}
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-slate-500 dark:text-slate-400">Permissions Granted:</span>
          <span className="font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded">
            {currentRoleDef?.permissions.length || 0} / 13 Actions
          </span>
        </div>
      </div>

      {/* Quick Metrics Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Active Job Cards
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
              {activeJobsCount} Jobs
            </span>
          </div>
          <div className="w-9 h-9 bg-brand-orange/10 text-brand-orange rounded-lg flex items-center justify-center">
            <Car className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Service Lifts / Bays
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
              {activeJobsCount} / {totalLiftsCount} In Use
            </span>
          </div>
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              ECU Diagnostics
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
              {diagnosticScansCount} Scans Done
            </span>
          </div>
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
              Branch Estimate Revenue
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5 block font-mono">
              {formatPrice(totalEstimatedRevenue)}
            </span>
          </div>
          <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};
