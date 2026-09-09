import React from 'react';
import { useAuth, AppResource, CrudAction, getDefaultRoleHome } from '../../contexts/AuthContext';
import { ShieldAlert, ArrowLeft, UserCheck, Lock, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RoleGuardProps {
  resource: AppResource;
  action?: CrudAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  resource,
  action = 'read',
  children,
  fallback
}) => {
  const { hasPermission, currentUser, primaryUser, userRole, isSimulating, exitSimulation, getRoleBadge, switchRole, allPersonas } = useAuth();
  const navigate = useNavigate();

  const isAllowed = hasPermission(resource, (action || 'read') as CrudAction);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const badge = getRoleBadge(userRole);

  return (
    <div className="flex-1 p-6 md:p-12 flex items-center justify-center min-h-[70vh]">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center justify-center mx-auto text-red-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Granular Access Restriction
          </h2>
          <p className="text-sm text-slate-400">
            You do not have the required <span className="font-mono text-amber-400 font-bold">[{action.toUpperCase()}]</span> authorization for the <span className="font-mono text-cyan-400 font-bold">{resource.toUpperCase()}</span> system module.
          </p>
        </div>

        {/* Current Active Persona Details */}
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/60 text-left space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Current Logged-in Staff:</span>
            <span className="font-bold text-white">{currentUser.fullName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Operating Role:</span>
            <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${badge.bg} ${badge.color} border ${badge.border}`}>
              {badge.label}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Active Outlet:</span>
            <span className="font-mono text-slate-300">{currentUser.branch || 'Masuma Central'}</span>
          </div>
        </div>

        {/* Role Simulation Controls strictly for Super Administrator */}
        {primaryUser?.role === 'admin' && (
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-left space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-brand-orange" />
                <span>Super Admin Role Simulation</span>
              </span>
              {isSimulating && (
                <button
                  type="button"
                  onClick={() => {
                    exitSimulation();
                    navigate('/');
                  }}
                  className="px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold transition cursor-pointer"
                >
                  Exit Simulation
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {allPersonas.map(persona => {
                const isCurrent = persona.role === userRole;
                return (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => {
                      switchRole(persona.role);
                      navigate(getDefaultRoleHome(persona.role));
                    }}
                    className={`p-2 rounded-lg text-left border transition cursor-pointer flex flex-col justify-between ${
                      isCurrent
                        ? 'bg-brand-orange/20 border-brand-orange text-brand-orange font-bold'
                        : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <span className="font-bold text-[11px] truncate">{persona.fullName.split(' ')[0]}</span>
                    <span className="text-[9px] uppercase tracking-wider opacity-75">{persona.role}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          
          <button
            type="button"
            onClick={() => navigate(getDefaultRoleHome(userRole))}
            className="flex-1 py-2.5 px-4 bg-[#ff5000] hover:bg-[#ff5000]/90 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
          >
            {userRole === 'admin' || userRole === 'manager' ? 'Return to Management Dashboard' : 'Return to My Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PermissionGateProps {
  resource: AppResource;
  action: CrudAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  resource,
  action,
  children,
  fallback = null
}) => {
  const { hasPermission } = useAuth();
  if (!hasPermission(resource, action)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
};
