import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getDefaultRoleHome } from '../contexts/AuthContext';
import { useSystemSettings } from '../contexts/SettingsContext';
import { ShieldCheck, UserCheck, RefreshCw, Eye, Sparkles } from 'lucide-react';
import type { SystemUserRole } from '../types';

// Sub-dashboards
import ExecutiveAdminDashboard from '../components/dashboard/ExecutiveAdminDashboard';
import RegionalManagerDashboard from '../components/dashboard/RegionalManagerDashboard';
import RolePermissionsMatrixModal from '../components/shared/RolePermissionsMatrixModal';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, switchRole, getRoleBadge } = useAuth();
  const { settings } = useSystemSettings();
  const [showMatrixModal, setShowMatrixModal] = useState<boolean>(false);

  // Dashboards are strictly reserved for management only
  useEffect(() => {
    if (userRole !== 'admin' && userRole !== 'manager') {
      navigate(getDefaultRoleHome(userRole), { replace: true });
    }
  }, [userRole, navigate]);

  const testRoles: Array<{ key: SystemUserRole; label: string; icon: string }> = [
    { key: 'admin', label: 'Super Admin', icon: '👑' },
    { key: 'manager', label: 'Regional Manager', icon: '🏢' },
    { key: 'cashier', label: 'POS Cashier', icon: '💳' },
    { key: 'workshop', label: 'Garage Workshop', icon: '🔧' },
    { key: 'accountant', label: 'Financial Accountant', icon: '📊' }
  ];

  const renderRoleDashboard = () => {
    if (userRole === 'manager') {
      return <RegionalManagerDashboard onOpenRbacMatrix={() => setShowMatrixModal(true)} />;
    }
    return <ExecutiveAdminDashboard onOpenRbacMatrix={() => setShowMatrixModal(true)} />;
  };

  const badge = getRoleBadge(userRole);

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-full pb-20">
      
      {/* PERSISTENT TOP INTERACTIVE ROLE SWITCHER & RBAC INSPECTOR BAR */}
      <div className="mb-6 p-4 rounded-2xl bg-white dark:bg-gray-800 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Active Role Indicator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/20 flex items-center justify-center text-brand-orange font-black shrink-0">
            {userRole === 'admin' ? 'SA' : userRole === 'manager' ? 'RM' : userRole === 'cashier' ? 'CS' : userRole === 'workshop' ? 'WS' : 'AC'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Active Operating User:</span>
              <span className="text-xs font-black text-slate-900 dark:text-white">
                {currentUser?.fullName || 'Active User'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${badge.bg} ${badge.color} border ${badge.border}`}>
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Branch Node: <strong className="text-slate-600 dark:text-slate-300 font-medium">{currentUser?.branch || settings.branchCode}</strong> • Dashboards, Sidebars & CRUD Permissions adapt dynamically to this role.
            </p>
          </div>
        </div>

        {/* Live Simulation Switcher & Matrix Button - Strictly Super Admin Only */}
        {userRole === 'admin' && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 hidden sm:flex">
              <UserCheck className="w-3.5 h-3.5 text-brand-orange" />
              <span>Test Role Views:</span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              {testRoles.map(r => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => {
                    switchRole(r.key);
                    if (r.key !== 'admin' && r.key !== 'manager') {
                      navigate(getDefaultRoleHome(r.key));
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    userRole === r.key
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-700/60 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                  title={`Switch to ${r.label}`}
                >
                  <span>{r.icon}</span>
                  <span>{r.label}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowMatrixModal(true)}
              className="px-3 py-1.5 bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white border border-brand-orange/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>RBAC Matrix</span>
            </button>
          </div>
        )}
      </div>

      {/* RENDER ACTIVE ROLE-TAILORED COCKPIT */}
      {renderRoleDashboard()}

      {/* RBAC MATRIX MODAL */}
      <RolePermissionsMatrixModal
        isOpen={showMatrixModal}
        onClose={() => setShowMatrixModal(false)}
      />
    </div>
  );
};

export default Dashboard;
