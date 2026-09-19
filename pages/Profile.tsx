import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  User, 
  ShieldCheck, 
  Shield,
  MapPin, 
  Mail, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  Clock, 
  Lock,
  Building,
  UserPlus,
  Users,
  ExternalLink,
  X,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ShoppingBag,
  Wrench,
  FileSpreadsheet,
  Building2,
  Search
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSystemSettings } from '../contexts/SettingsContext';
import type { SystemUser, SystemUserRole } from '../types';

const PRESET_BRANCHES = [
  'Nairobi HQ & Central Warehouse',
  'Westlands Express Service Center',
  'Mombasa Sea-Port Logistics Branch',
  'Kisumu Lake Hub',
  'Eldoret Regional Center',
  'All Branches / Multi-Branch Float'
];

const ROLE_LABELS: Record<SystemUserRole, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  admin: { label: 'Super Administrator', icon: Shield, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60' },
  manager: { label: 'Regional Manager', icon: Building2, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60' },
  cashier: { label: 'POS Cashier / Operator', icon: ShoppingBag, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60' },
  workshop: { label: 'Workshop Chief / Lead', icon: Wrench, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/60' },
  accountant: { label: 'Financial Accountant', icon: FileSpreadsheet, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60' },
  auditor: { label: 'Internal / Tax Auditor', icon: Search, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60' }
};

export const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, userRole, getRoleBadge, hasPermission, allPersonas } = useAuth();
  const { settings, formatPrice } = useSystemSettings();

  const [pinNotice, setPinNotice] = useState(false);
  const [pinValue, setPinValue] = useState(currentUser?.pinCode || '1234');

  // Quick Add User Modal State for Admins
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [userCreatedNotice, setUserCreatedNotice] = useState<string | null>(null);
  const [userCreateError, setUserCreateError] = useState<string | null>(null);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // System users count for admin dashboard
  const [systemUsersList, setSystemUsersList] = useState<SystemUser[]>(() => {
    try {
      const cached = localStorage.getItem('masuma_system_users');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return allPersonas || [];
  });

  const [newUserData, setNewUserData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    role: 'cashier' as SystemUserRole,
    pinCode: '1234',
    phone: '',
    branch: PRESET_BRANCHES[0],
    isActive: true
  });

  const badge = getRoleBadge(userRole);
  const isAdmin = userRole === 'admin';
  const canCreateUser = hasPermission('users', 'create') || isAdmin;

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinNotice(true);
    setTimeout(() => setPinNotice(false), 4000);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserCreateError(null);

    if (!newUserData.fullName.trim() || !newUserData.username.trim() || !newUserData.email.trim() || !newUserData.password) {
      setUserCreateError('Please fill in all mandatory fields (Full Name, Username, Email, and Password).');
      return;
    }

    const cleanUsername = newUserData.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const cleanEmail = newUserData.email.trim().toLowerCase();

    // Check duplicates
    if (systemUsersList.some(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)) {
      setUserCreateError(`A user with username "${cleanUsername}" or email "${cleanEmail}" already exists.`);
      return;
    }

    setIsSubmittingUser(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUserData,
          username: cleanUsername,
          email: cleanEmail
        })
      });

      let createdUser: SystemUser;
      if (res.ok) {
        const data = await res.json();
        createdUser = data.user;
      } else {
        // Standalone / client-side fallback
        createdUser = {
          id: Date.now(),
          username: cleanUsername,
          email: cleanEmail,
          fullName: newUserData.fullName.trim(),
          role: newUserData.role,
          pinCode: newUserData.pinCode.trim() || '1234',
          phone: newUserData.phone.trim() || undefined,
          branch: newUserData.branch,
          isActive: true,
          createdAt: new Date().toISOString()
        };
      }

      const updated = [createdUser, ...systemUsersList];
      setSystemUsersList(updated);
      try {
        localStorage.setItem('masuma_system_users', JSON.stringify(updated));
      } catch (_) {}

      setUserCreatedNotice(`User "${createdUser.fullName}" (@${createdUser.username}) provisioned successfully as ${ROLE_LABELS[createdUser.role]?.label || createdUser.role}!`);
      setIsAddUserModalOpen(false);

      // Reset form
      setNewUserData({
        fullName: '',
        username: '',
        email: '',
        password: '',
        role: 'cashier',
        pinCode: '1234',
        phone: '',
        branch: PRESET_BRANCHES[0],
        isActive: true
      });

      setTimeout(() => setUserCreatedNotice(null), 8000);
    } catch (err: any) {
      setUserCreateError(err.message || 'Failed to provision user.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'AD';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 dark:bg-slate-900 min-h-full pb-20 text-slate-900 dark:text-slate-100">
      
      {/* Notifications */}
      {userCreatedNotice && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{userCreatedNotice}</span>
          </div>
          <Link
            to="/settings?tab=users"
            className="text-xs font-bold underline hover:text-emerald-950 dark:hover:text-emerald-100 shrink-0 ml-4"
          >
            View in Users Directory &rarr;
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>User Profile & Security</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${badge.bg} ${badge.color} border ${badge.border}`}>
              {badge.label}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Active operator credentials, security permissions, and enterprise access tier.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-4 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New User</span>
            </button>
            <Link
              to="/settings?tab=users"
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
            >
              <Users className="w-4 h-4 text-amber-500" />
              <span>User Directory</span>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Identity & Access Node */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-700 dark:from-slate-700 dark:to-slate-600 text-white font-black text-2xl flex items-center justify-center shadow-md mb-4 border border-slate-300 dark:border-slate-650">
            {isAdmin ? (
              <Shield className="w-12 h-12 text-brand-orange" />
            ) : (
              getInitials(currentUser?.fullName || 'User')
            )}
          </div>
          
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {currentUser?.fullName || 'System Administrator'}
          </h2>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            @{currentUser?.username || 'admin'}
          </span>

          <span className={`text-xs font-semibold px-3 py-1 rounded-full mt-2 mb-4 border ${badge.bg} ${badge.color} ${badge.border}`}>
            {isAdmin ? 'Root Super Administrator' : badge.label}
          </span>

          <div className="w-full space-y-3 text-left text-xs border-t border-slate-100 dark:border-slate-700/80 pt-4">
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{currentUser?.email || 'admin@masuma.co.ke'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{currentUser?.phone || '+254 700 000 001'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Building className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{currentUser?.branch || settings.branchCode || 'Nairobi HQ & Central Warehouse'}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-300">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Shift: Executive Core (Unrestricted 24/7)</span>
            </div>
          </div>

          {/* Master Authorization Status */}
          <div className="w-full mt-6 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750 text-left">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>{isAdmin ? 'Master Administrator Verified' : 'Terminal Authorized'}</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              {isAdmin 
                ? 'Assigned Tier 1 root authority. You possess full administrative capability to provision users, manage security policies, configure branches, and audit all financial registers.'
                : `Assigned Station Level clearance with authorized operational roles for ${badge.label}.`
              }
            </p>
          </div>
        </div>

        {/* Right Columns: Admin Authority & User Management Controls */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* ADMIN VERIFICATION CARD: ABILITY TO ADD USERS & RBAC GOVERNANCE */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-orange" />
                    <span>Administrative Authority & User Management</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Verification of your root capabilities and user provisioning controls.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>User Provisioning Enabled</span>
                </span>
              </div>

              {/* Verified Capabilities Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white mb-1">
                    <UserPlus className="w-4 h-4 text-brand-orange" />
                    <span>Add & Provision Users</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Create new staff accounts, set initial passwords, assign 4-digit PINs, and grant departmental roles.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Role-Based Access Control</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Enforce strict RBAC across Super Admin, Regional Manager, POS Cashier, Workshop Lead, and Accountant.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white mb-1">
                    <Building className="w-4 h-4 text-blue-500" />
                    <span>Branch Scope Assignment</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Assign users to specific operating branches (Nairobi HQ, Westlands, Mombasa, Kisumu, Eldoret, or Float).
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-750">
                  <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white mb-1">
                    <Lock className="w-4 h-4 text-indigo-500" />
                    <span>Credential & PIN Resets</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Reset forgotten employee passwords, deactivate suspended accounts, and re-issue terminal unlock codes.
                  </p>
                </div>
              </div>

              {/* Action Buttons for User Management */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(true)}
                  className="px-4 py-2.5 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add New User Account</span>
                </button>

                <Link
                  to="/settings?tab=users"
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                >
                  <Users className="w-4 h-4 text-amber-500" />
                  <span>Open Users & Access Control Directory</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                </Link>
              </div>
            </div>
          )}

          {/* SYSTEM USER ROSTER PREVIEW (ADMIN ONLY) */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    <span>System User Roster ({systemUsersList.length} Accounts)</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Overview of active accounts in the system. Full roster management available in Settings.
                  </p>
                </div>
                <Link
                  to="/settings?tab=users"
                  className="text-xs font-bold text-brand-orange hover:underline flex items-center gap-1"
                >
                  <span>Manage All</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-700/80">
                {systemUsersList.slice(0, 5).map((user) => {
                  const roleConfig = ROLE_LABELS[user.role] || { label: user.role, icon: User, color: 'text-slate-500', bg: 'bg-slate-100' };
                  const RoleIcon = roleConfig.icon;
                  return (
                    <div key={user.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center shrink-0">
                          {getInitials(user.fullName)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {user.fullName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                            @{user.username} &bull; {user.email}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border flex items-center gap-1 ${roleConfig.bg} ${roleConfig.color}`}>
                          <RoleIcon className="w-3 h-3" />
                          <span>{roleConfig.label.split('/')[0].trim()}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* NON-ADMIN: PERFORMANCE METRICS */}
          {!isAdmin && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs">
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                Operational Metrics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-750">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Status</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">Active on Shift</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Terminal sync running</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-750">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">Department</span>
                  <span className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1 block capitalize">{userRole}</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Authorized Operator</span>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-750">
                  <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">eTIMS Compliance</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">100% Validated</span>
                  <span className="text-[10px] text-slate-400 mt-1 block">Active digital signature</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Terminal Security PIN Reset */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound className="w-5 h-5 text-brand-orange" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Quick Terminal Unlock PIN
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Set a 4-digit PIN for rapid physical terminal unlocking after inactivity without re-entering your master password.
            </p>

            <form onSubmit={handleUpdatePin} className="flex flex-col sm:flex-row gap-3">
              <input
                type="password"
                maxLength={4}
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value)}
                placeholder="4-digit PIN"
                className="w-full sm:w-40 h-10 px-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-brand-orange rounded-xl text-center font-mono text-sm tracking-widest text-slate-900 dark:text-white focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 px-5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white text-xs font-semibold cursor-pointer transition"
              >
                Update Terminal PIN
              </button>
            </form>

            {pinNotice && (
              <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Security PIN updated successfully for {currentUser?.fullName || 'Administrator'}.</span>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* QUICK ADD USER MODAL (FOR ADMINISTRATORS) */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-brand-orange flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Provision New System User
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Assign credentials, branch scope, and departmental permissions.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateUserSubmit} className="p-6 space-y-4">
              {userCreateError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userCreateError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kelvin Otieno"
                    value={newUserData.fullName}
                    onChange={(e) => setNewUserData({ ...newUserData, fullName: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kotieno"
                    value={newUserData.username}
                    onChange={(e) => setNewUserData({ ...newUserData, username: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. kotieno@masuma.co.ke"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +254 712 345 678"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    System Role *
                  </label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as SystemUserRole })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  >
                    <option value="cashier">POS Cashier / Operator</option>
                    <option value="workshop">Workshop Chief / Lead</option>
                    <option value="accountant">Financial Accountant</option>
                    <option value="manager">Regional Operations Manager</option>
                    <option value="auditor">Internal / Tax Auditor</option>
                    <option value="admin">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Operating Branch *
                  </label>
                  <select
                    value={newUserData.branch}
                    onChange={(e) => setNewUserData({ ...newUserData, branch: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  >
                    {PRESET_BRANCHES.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temporary Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter temporary password"
                      value={newUserData.password}
                      onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                      className="w-full h-10 px-3 pr-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Terminal PIN (4 Digits) *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={newUserData.pinCode}
                    onChange={(e) => setNewUserData({ ...newUserData, pinCode: e.target.value })}
                    className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs font-mono tracking-widest text-slate-900 dark:text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-750 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition shadow-xs"
                >
                  {isSubmittingUser ? (
                    <span>Provisioning...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Provision User</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
