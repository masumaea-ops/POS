import React, { useState } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import type { GarageBranch, GarageStaffUser, GarageRoleType, GaragePermission } from '../../types';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Wrench, 
  Cpu, 
  Plus, 
  CheckCircle2, 
  AlertTriangle,
  Layers,
  ChevronRight,
  ShieldAlert,
  Edit2,
  Trash2,
  Users,
  Key,
  Search,
  ShieldCheck,
  Check,
  X,
  Globe,
  Lock,
  Unlock,
  ArrowRightLeft
} from 'lucide-react';

export const OutletsTab: React.FC = () => {
  const { 
    branches, 
    addBranch, 
    updateBranch, 
    deleteBranch,
    setActiveBranchId, 
    activeBranchId, 
    hasPermission,
    staffUsers,
    updateStaffUser,
    roles,
    updateRolePermissions,
    activeRole
  } = useGarage();

  const [activeSubView, setActiveSubView] = useState<'outlets' | 'staff_assignments' | 'rbac_policies'>('outlets');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<GarageBranch | null>(null);
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffBranchFilter, setStaffBranchFilter] = useState('ALL');

  // Form state for creating / editing branch
  const [formData, setFormData] = useState({
    name: '',
    city: 'Nairobi',
    address: '',
    phone: '',
    managerName: '',
    totalLiftsBays: 6,
    status: 'Active' as GarageBranch['status'],
    diagnosticEquipment: 'Masuma ECU Pro-Diag X900, Autel MaxiSys'
  });

  const canManageBranches = hasPermission('manage_branches');
  const canSwitchLocation = hasPermission('switch_location') || hasPermission('view_all_branches');
  const canManageRbac = hasPermission('manage_rbac_roles');

  const handleOpenAddModal = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      city: 'Nairobi',
      address: '',
      phone: '+254 700 000 000',
      managerName: 'Branch Supervisor',
      totalLiftsBays: 6,
      status: 'Active',
      diagnosticEquipment: 'Masuma ECU Pro-Diag X900, Autel MaxiSys'
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (branch: GarageBranch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      city: branch.city,
      address: branch.address,
      phone: branch.phone,
      managerName: branch.managerName,
      totalLiftsBays: branch.totalLiftsBays,
      status: branch.status,
      diagnosticEquipment: branch.diagnosticEquipment.join(', ')
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address) return;

    if (editingBranch) {
      updateBranch(editingBranch.id, {
        name: formData.name,
        city: formData.city,
        address: formData.address,
        phone: formData.phone,
        managerName: formData.managerName,
        totalLiftsBays: Number(formData.totalLiftsBays) || 4,
        status: formData.status,
        diagnosticEquipment: formData.diagnosticEquipment.split(',').map(s => s.trim()).filter(Boolean)
      });
    } else {
      const newBranch: GarageBranch = {
        id: `GAR-${formData.city.substring(0, 3).toUpperCase()}-0${branches.length + 1}`,
        name: formData.name,
        city: formData.city,
        address: formData.address,
        phone: formData.phone || '+254 700 000 000',
        managerName: formData.managerName || 'Branch Supervisor',
        totalLiftsBays: Number(formData.totalLiftsBays) || 4,
        activeJobsCount: 0,
        status: formData.status,
        diagnosticEquipment: formData.diagnosticEquipment.split(',').map(s => s.trim()).filter(Boolean)
      };
      addBranch(newBranch);
    }

    setIsAddModalOpen(false);
  };

  const handleDeleteBranchClick = (branchId: string, branchName: string) => {
    if (!canManageBranches) {
      alert('RBAC Restriction: Only Admins with branch management permission can delete locations.');
      return;
    }
    if (confirm(`Are you sure you want to remove ${branchName} (${branchId})? This action cannot be undone.`)) {
      deleteBranch(branchId);
      if (activeBranchId === branchId) {
        setActiveBranchId('ALL');
      }
    }
  };

  const handleToggleBranchStatus = (branch: GarageBranch) => {
    if (!canManageBranches) return;
    const nextStatusMap: Record<GarageBranch['status'], GarageBranch['status']> = {
      'Active': 'Full Capacity',
      'Full Capacity': 'Maintenance',
      'Maintenance': 'Active'
    };
    updateBranch(branch.id, { status: nextStatusMap[branch.status] });
  };

  const handleReassignStaffBranch = (staffId: string, newBranchId: string) => {
    updateStaffUser(staffId, { assignedBranchId: newBranchId });
  };

  const handleToggleRoleLocationSwitch = (roleKey: GarageRoleType) => {
    if (!canManageRbac) {
      alert('RBAC Restriction: Only Super Admins can update location access permissions.');
      return;
    }
    const roleDef = roles.find(r => r.key === roleKey);
    if (!roleDef) return;

    const hasLoc = roleDef.permissions.includes('switch_location');
    const updatedPerms = hasLoc 
      ? roleDef.permissions.filter(p => p !== 'switch_location')
      : [...roleDef.permissions, 'switch_location' as GaragePermission];

    updateRolePermissions(roleKey, updatedPerms);
  };

  // Staff list filtered by search query and branch
  const filteredStaff = staffUsers.filter(staff => {
    const matchesQuery = staff.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      staff.role.toLowerCase().includes(staffSearchQuery.toLowerCase()) ||
      staff.email.toLowerCase().includes(staffSearchQuery.toLowerCase());
    const matchesBranch = staffBranchFilter === 'ALL' || staff.assignedBranchId === staffBranchFilter;
    return matchesQuery && matchesBranch;
  });

  const totalBays = branches.reduce((acc, b) => acc + b.totalLiftsBays, 0);
  const totalActiveJobs = branches.reduce((acc, b) => acc + b.activeJobsCount, 0);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Location Management Sub-Header & Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-brand-orange/10 text-brand-orange border border-brand-orange/20">
              Enterprise Multi-Branch Engine
            </span>
            <span className="text-xs text-slate-400 font-mono">RBAC Location Security</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-orange" />
            <span>Location Management & Branch RBAC Settings</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Define garage branches, configure hydraulic lift bay capacities, assign staff workshop locations, and set RBAC location switching permissions.
          </p>
        </div>

        {/* Action Button */}
        {canManageBranches ? (
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2.5 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 font-mono uppercase tracking-wider transition-all self-start md:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Garage Branch</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800 self-start md:self-auto shrink-0">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
            <span>Branch Creation Restricted</span>
          </div>
        )}
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Total Outlets</span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white">{branches.length} Branches</span>
          </div>
          <div className="w-9 h-9 bg-brand-orange/10 text-brand-orange rounded-lg flex items-center justify-center">
            <Building2 className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Total Lift Bays</span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white">{totalBays} Bays</span>
          </div>
          <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Active Jobs</span>
            <span className="text-lg font-black font-mono text-brand-orange">{totalActiveJobs} Vehicles</span>
          </div>
          <div className="w-9 h-9 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">Assigned Staff</span>
            <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400">{staffUsers.length} Staff</span>
          </div>
          <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-lg flex items-center justify-center">
            <Users className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Section Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveSubView('outlets')}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeSubView === 'outlets'
              ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Branch Outlets & Bay Facilities ({branches.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView('staff_assignments')}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeSubView === 'staff_assignments'
              ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Location Assignments & Access Control</span>
        </button>

        <button
          onClick={() => setActiveSubView('rbac_policies')}
          className={`px-4 py-2.5 text-xs font-bold font-mono transition-all border-b-2 flex items-center gap-2 ${
            activeSubView === 'rbac_policies'
              ? 'border-brand-orange text-brand-orange bg-brand-orange/5'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Location Switcher RBAC Permissions</span>
        </button>
      </div>

      {/* SUB-VIEW 1: Garage Outlets Directory */}
      {activeSubView === 'outlets' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {branches.map((branch) => {
              const isSelected = activeBranchId === branch.id;
              const branchStaffCount = staffUsers.filter(s => s.assignedBranchId === branch.id || s.assignedBranchId === 'ALL').length;

              return (
                <div
                  key={branch.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                    isSelected 
                      ? 'border-brand-orange ring-2 ring-brand-orange/20 dark:ring-brand-orange/30' 
                      : 'border-slate-200 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div>
                    {/* Card Top Bar */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {branch.id}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-300 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-blue-500" />
                            <span>{branch.city}</span>
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Active Context</span>
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5">
                          {branch.name}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleBranchStatus(branch)}
                          title="Click to toggle status"
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase font-mono transition-all ${
                            branch.status === 'Active' 
                              ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800' 
                              : branch.status === 'Full Capacity'
                              ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {branch.status}
                        </button>

                        {canManageBranches && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(branch)}
                              title="Edit branch details"
                              className="p-1.5 text-slate-400 hover:text-brand-orange hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteBranchClick(branch.id, branch.name)}
                              title="Delete branch"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Branch Details */}
                    <div className="py-3 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        <span>{branch.address}</span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono">{branch.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Manager: <strong className="text-slate-800 dark:text-slate-200">{branch.managerName}</strong></span>
                        </div>
                      </div>

                      {/* Lifts & Active Jobs metrics */}
                      <div className="grid grid-cols-3 gap-2 pt-2">
                        <div className="p-2.5 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                            Service Lifts
                          </span>
                          <span className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5 block flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-blue-500" />
                            <span>{branch.totalLiftsBays} Bays</span>
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                            Active Jobs
                          </span>
                          <span className="text-sm font-black font-mono text-brand-orange mt-0.5 block flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5" />
                            <span>{branch.activeJobsCount} Cars</span>
                          </span>
                        </div>

                        <div className="p-2.5 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block">
                            Staff On Site
                          </span>
                          <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            <span>{branchStaffCount} Staff</span>
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic Scanners */}
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-1">
                          Allocated ECU Diagnostic Scanners:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {branch.diagnosticEquipment.map((eq, i) => (
                            <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold rounded border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <Cpu className="w-3 h-3 text-emerald-600" />
                              <span>{eq}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => canSwitchLocation && setActiveBranchId(branch.id)}
                      disabled={!canSwitchLocation}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/30'
                          : canSwitchLocation
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed dark:bg-slate-800'
                      }`}
                    >
                      {!canSwitchLocation && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{isSelected ? 'Currently Selected' : canSwitchLocation ? 'Switch View Context' : 'Switch Restricted'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                      {branch.activeJobsCount >= branch.totalLiftsBays ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Capacity Full</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Lifts Ready</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: Staff Location Assignments & Access Control */}
      {activeSubView === 'staff_assignments' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-orange" />
                <span>Staff Branch Assignment Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Assign garage mechanics, diagnostic specialists, and service advisors to primary garage outlets.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff name or role..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-brand-orange w-48 sm:w-60"
                />
              </div>

              <select
                value={staffBranchFilter}
                onChange={(e) => setStaffBranchFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">All Outlets</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Staff Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-gray-900/60 text-slate-400 font-mono font-bold uppercase border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">Staff Member</th>
                  <th className="p-3">RBAC Role Persona</th>
                  <th className="p-3">Primary Assigned Branch</th>
                  <th className="p-3">Location Access Scope</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredStaff.map((staff) => {
                  const assignedBranch = branches.find(b => b.id === staff.assignedBranchId);
                  const isFloating = staff.assignedBranchId === 'ALL';
                  const roleDef = roles.find(r => r.key === staff.role);

                  return (
                    <tr key={staff.id} className="hover:bg-slate-50/80 dark:hover:bg-gray-900/40">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-orange/10 text-brand-orange font-black flex items-center justify-center text-xs">
                            {staff.name.charAt(0)}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {staff.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{staff.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase ${roleDef?.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                          {roleDef?.name || staff.role}
                        </span>
                      </td>

                      <td className="p-3">
                        <select
                          value={staff.assignedBranchId}
                          onChange={(e) => handleReassignStaffBranch(staff.id, e.target.value)}
                          disabled={!canManageBranches}
                          className="px-2.5 py-1 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-brand-orange"
                        >
                          <option value="ALL">All Outlets (Chain Floating Staff)</option>
                          {branches.map(b => (
                            <option key={b.id} value={b.id}>
                              {b.name} ({b.city})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3">
                        {isFloating ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 font-mono font-extrabold text-[10px]">
                            <Globe className="w-3 h-3" />
                            <span>Chain Floating Scope</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-mono font-bold text-[10px]">
                            <Building2 className="w-3 h-3" />
                            <span>Fixed to {assignedBranch?.city || 'Branch'}</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleReassignStaffBranch(staff.id, staff.assignedBranchId === 'ALL' ? branches[0]?.id || 'GAR-NRB-01' : 'ALL')}
                          className="text-[11px] font-mono font-bold text-brand-orange hover:underline"
                        >
                          {isFloating ? 'Restrict to Single Branch' : 'Grant Chain Floating Access'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: Location Switcher RBAC Permissions */}
      {activeSubView === 'rbac_policies' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Location Switching RBAC Access Control</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure which RBAC staff roles are permitted to switch their active location context in the system header.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {roles.map((roleDef) => {
              const canSwitch = roleDef.permissions.includes('switch_location') || roleDef.permissions.includes('view_all_branches');
              const isSuperAdminRole = roleDef.key === 'SUPER_ADMIN';

              return (
                <div
                  key={roleDef.key}
                  className={`p-4 rounded-xl border transition-all ${
                    canSwitch 
                      ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800' 
                      : 'bg-slate-50 dark:bg-gray-900/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${roleDef.badgeColor}`}>
                        {roleDef.name}
                      </span>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                        {roleDef.description}
                      </p>
                    </div>

                    {canSwitch ? (
                      <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        <Unlock className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-700/60 mt-3">
                    <span className="text-[11px] font-mono font-bold text-slate-600 dark:text-slate-300">
                      Location Switcher:
                    </span>

                    {isSuperAdminRole ? (
                      <span className="text-[10px] font-mono font-black text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded">
                        ALWAYS ALLOWED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleRoleLocationSwitch(roleDef.key)}
                        disabled={!canManageRbac}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                          canSwitch
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300'
                        }`}
                      >
                        {canSwitch ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        <span>{canSwitch ? 'Allowed' : 'Locked'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-brand-orange" />
                <span>{editingBranch ? `Edit Branch: ${editingBranch.name}` : 'Register New Garage Branch Outlet'}</span>
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBranch} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Branch Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eldoret Highland QuickFix Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange font-medium"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">City / Region</label>
                  <select
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange font-bold"
                  >
                    <option value="Nairobi">Nairobi</option>
                    <option value="Mombasa">Mombasa</option>
                    <option value="Nakuru">Nakuru</option>
                    <option value="Kisumu">Kisumu</option>
                    <option value="Eldoret">Eldoret</option>
                    <option value="Thika">Thika</option>
                    <option value="Malindi">Malindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Lifts / Bays</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.totalLiftsBays}
                    onChange={(e) => setFormData({ ...formData, totalLiftsBays: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as GarageBranch['status'] })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange font-bold"
                  >
                    <option value="Active">Active</option>
                    <option value="Full Capacity">Full Capacity</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Physical Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Uganda Road, Next to Total Energies Station"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Branch Phone Number</label>
                  <input
                    type="text"
                    placeholder="+254 711 000 111"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Branch Manager Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Samuel Rotich"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-bold mb-1">Diagnostic Equipment Scanners</label>
                <input
                  type="text"
                  placeholder="Comma separated e.g. Masuma Pro-Diag X900, Bosch KTS 590"
                  value={formData.diagnosticEquipment}
                  onChange={(e) => setFormData({ ...formData, diagnosticEquipment: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-orange text-white font-bold rounded-xl shadow-md uppercase font-mono tracking-wider"
                >
                  {editingBranch ? 'Save Changes' : 'Create Branch Outlet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
