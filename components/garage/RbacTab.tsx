import React, { useState } from 'react';
import { useGarage } from '../../contexts/GarageContext';
import type { GarageRoleType, GaragePermission } from '../../types';
import { 
  ShieldCheck, 
  Key, 
  UserCheck, 
  Check, 
  X, 
  Info, 
  AlertCircle, 
  Users, 
  Building2, 
  RotateCcw,
  Sparkles
} from 'lucide-react';

const ALL_PERMISSIONS: Array<{ key: GaragePermission; label: string; group: string; description: string }> = [
  { key: 'view_all_branches', label: 'View All Multi-Garage Outlets', group: 'Branch Management', description: 'Access financial and operational data across all chain outlets' },
  { key: 'manage_branches', label: 'Create & Edit Garage Branches', group: 'Branch Management', description: 'Register new physical garage branches and allocate lifts' },
  { key: 'switch_location', label: 'Switch Active Garage Location', group: 'Branch Management', description: 'Permission for staff to switch active location context view across multi-garage outlets' },
  
  { key: 'create_job_card', label: 'Create Vehicle Job Cards', group: 'Job Cards & Services', description: 'Book customer vehicles and open new work order job cards' },
  { key: 'edit_job_card', label: 'Edit Job Card Technical Details', group: 'Job Cards & Services', description: 'Modify complaints, mileage, vehicle specifications' },
  { key: 'delete_job_card', label: 'Delete / Cancel Job Cards', group: 'Job Cards & Services', description: 'Cancel active job cards and remove records' },
  { key: 'update_job_status', label: 'Advance Job Stage Status', group: 'Job Cards & Services', description: 'Transition jobs from Booked -> Diagnostic -> Repair -> Invoice' },

  { key: 'run_diagnostics', label: 'Run Computerized ECU Scans', group: 'Diagnostics Engine', description: 'Connect OBD-II scanners, execute CAN-Bus ECU interrogation' },
  { key: 'create_diagnostic_report', label: 'Issue Official Diagnostic Reports', group: 'Diagnostics Engine', description: 'Generate certified diagnostic inspection reports for owners' },

  { key: 'request_parts', label: 'Request Parts From Store', group: 'Store Inventory', description: 'Requisition spare parts from central warehouse for lift jobs' },
  { key: 'approve_parts_issue', label: 'Approve & Issue Parts to Lifts', group: 'Store Inventory', description: 'Authorize store inventory release and deduct stock' },

  { key: 'manage_technicians', label: 'Manage Mechanics & Lifts', group: 'Staff & Operations', description: 'Assign technicians to hydraulic lifts and monitor workload' },
  { key: 'view_financial_reports', label: 'View Chain Financial Reports', group: 'Analytics', description: 'Access group revenue, margins, and branch P&L' },
  { key: 'manage_rbac_roles', label: 'Configure RBAC Matrix & Roles', group: 'Security', description: 'Modify role permission assignments and user access' }
];

export const RbacTab: React.FC = () => {
  const { roles, staffUsers, updateRolePermissions, activeRole, setActiveRole, hasPermission } = useGarage();
  const [selectedPermissionToTest, setSelectedPermissionToTest] = useState<GaragePermission>('run_diagnostics');

  const canManageRbac = hasPermission('manage_rbac_roles');

  const handleTogglePermission = (roleKey: GarageRoleType, permKey: GaragePermission) => {
    if (!canManageRbac) {
      alert('RBAC Restriction: Only Chain Super Admin can modify the RBAC Permissions Matrix.');
      return;
    }

    const roleDef = roles.find(r => r.key === roleKey);
    if (!roleDef) return;

    let updatedPerms: GaragePermission[];
    if (roleDef.permissions.includes(permKey)) {
      updatedPerms = roleDef.permissions.filter(p => p !== permKey);
    } else {
      updatedPerms = [...roleDef.permissions, permKey];
    }

    updateRolePermissions(roleKey, updatedPerms);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Tab Header */}
      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Flexible Role-Based Access Control (RBAC) Matrix</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enforce strict operational boundaries for Super Admins, Branch Managers, Diagnostic Specialists, Mechanics, Parts Clerks, and Receptionists.
        </p>
      </div>

      {/* Interactive Permission Test Simulator Box */}
      <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              RBAC Live Permission Test Simulator
            </h3>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-slate-500">Current Role Persona:</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as GarageRoleType)}
              className="px-2.5 py-1 bg-white dark:bg-gray-800 border border-purple-300 rounded-lg font-bold font-mono text-purple-700 dark:text-purple-300"
            >
              {roles.map(r => (
                <option key={r.key} value={r.key}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Select Action Permission to Check:
            </label>
            <select
              value={selectedPermissionToTest}
              onChange={(e) => setSelectedPermissionToTest(e.target.value as GaragePermission)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold"
            >
              {ALL_PERMISSIONS.map(p => (
                <option key={p.key} value={p.key}>
                  [{p.group}] — {p.label}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block">
                Verification Result:
              </span>
              <div className="flex items-center gap-2 mt-1">
                {hasPermission(selectedPermissionToTest) ? (
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    <span>ALLOWED — Permission Granted for {roles.find(r => r.key === activeRole)?.name}</span>
                  </span>
                ) : (
                  <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <X className="w-4 h-4" />
                    <span>DENIED — Restricted for {roles.find(r => r.key === activeRole)?.name}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Permission Matrix Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 font-mono uppercase">
            <Key className="w-4 h-4 text-brand-orange" />
            <span>Role-Based Permission Matrix Configuration</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {canManageRbac ? 'Click checkboxes to toggle permissions' : 'View Only Mode'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 dark:bg-gray-900/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-mono font-black uppercase">
                <th className="p-3.5 min-w-[240px]">Action & Permission Scope</th>
                {roles.map(r => (
                  <th key={r.key} className="p-3.5 text-center min-w-[120px]">
                    <div className="font-extrabold text-slate-900 dark:text-white text-[11px]">{r.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {ALL_PERMISSIONS.map(perm => (
                <tr key={perm.key} className="hover:bg-slate-50/80 dark:hover:bg-gray-750">
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 dark:text-white">{perm.label}</div>
                    <div className="text-[10px] text-slate-400">{perm.description}</div>
                  </td>

                  {roles.map(r => {
                    const isGranted = r.permissions.includes(perm.key);
                    return (
                      <td key={r.key} className="p-3.5 text-center">
                        <button
                          onClick={() => handleTogglePermission(r.key, perm.key)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            isGranted
                              ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                          }`}
                        >
                          {isGranted ? <Check className="w-4 h-4 stroke-[3]" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Role Assignments List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-orange" />
          <span>Active Staff Account Role & Branch Scopes</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staffUsers.map(user => {
            const roleDef = roles.find(r => r.key === user.role);
            return (
              <div
                key={user.id}
                className="p-4 bg-slate-50 dark:bg-gray-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{user.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${roleDef?.badgeColor || 'bg-slate-200'}`}>
                    {roleDef?.name}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <div><strong>Email:</strong> {user.email}</div>
                  <div><strong>Location Scope:</strong> <span className="font-mono font-bold text-brand-orange">{user.assignedBranchId}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
