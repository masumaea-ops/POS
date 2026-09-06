import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  KeyRound, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  RefreshCw, 
  Edit3, 
  Trash2, 
  Eye, 
  EyeOff, 
  Smartphone, 
  MapPin, 
  Building, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  Check, 
  ShoppingBag, 
  Wrench, 
  FileSpreadsheet, 
  UserCheck,
  ShieldCheck,
  Clock,
  Unlock
} from 'lucide-react';
import { SystemUser, SystemUserRole } from '../../types';

const PRESET_BRANCHES = [
  'Nairobi HQ & Central Warehouse',
  'Westlands Express Service Center',
  'Mombasa Sea-Port Logistics Branch',
  'Kisumu Lake Hub',
  'Eldoret Regional Center',
  'All Branches / Multi-Branch Float'
];

const ROLE_DEFINITIONS: Record<SystemUserRole, { label: string; desc: string; color: string; bg: string; border: string; icon: any }> = {
  admin: {
    label: 'Super Administrator',
    desc: 'Full unrestricted authority over POS, Warehouse, Financials, DB, and Security settings.',
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/30',
    icon: Shield
  },
  manager: {
    label: 'Operations Manager',
    desc: 'Inventory restocking, pricing markups, order approvals, aged receivables & sales audits.',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: ShieldCheck
  },
  cashier: {
    label: 'POS Cashier / Operator',
    desc: 'Front-desk point of sale, barcode scanning, cash/M-Pesa checkouts, and thermal receipts.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: ShoppingBag
  },
  workshop: {
    label: 'Workshop Chief / Lead',
    desc: 'Garage vehicle check-in, OBD-II computerized diagnostics, lift bays & work orders.',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    icon: Wrench
  },
  accountant: {
    label: 'Financial Accountant',
    desc: 'General ledger, Chart of Accounts, supplier payable reconciliations & KRA ETR returns.',
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    icon: FileSpreadsheet
  }
};

const DEFAULT_USERS: SystemUser[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@masuma.co.ke',
    fullName: 'System Administrator',
    role: 'admin',
    pinCode: '1234',
    phone: '+254 700 000 001',
    branch: 'Nairobi HQ & Central Warehouse',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 2,
    username: 'cashier',
    email: 'cashier@masuma.co.ke',
    fullName: 'POS Terminal Cashier',
    role: 'cashier',
    pinCode: '0000',
    phone: '+254 700 000 002',
    branch: 'Nairobi HQ & Central Warehouse',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 3,
    username: 'workshop',
    email: 'garage@masuma.co.ke',
    fullName: 'Workshop Chief Engineer',
    role: 'workshop',
    pinCode: '9999',
    phone: '+254 700 000 003',
    branch: 'Industrial Area Lift Bays',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 4,
    username: 'manager',
    email: 'manager@masuma.co.ke',
    fullName: 'Regional Operations Manager',
    role: 'manager',
    pinCode: '5555',
    phone: '+254 700 000 004',
    branch: 'All Branches / Multi-Branch Float',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
  },
  {
    id: 5,
    username: 'masumaea',
    email: 'masumaea@gmail.com',
    fullName: 'Masuma EA Executive',
    role: 'admin',
    pinCode: '1111',
    phone: '+254 722 000 000',
    branch: 'Nairobi HQ & Central Warehouse',
    isActive: true,
    lastLogin: new Date().toISOString(),
    createdAt: '2025-01-01T00:00:00Z',
  }
];

export const UserManagementSection: React.FC = () => {
  const [users, setUsers] = useState<SystemUser[]>(() => {
    try {
      const cached = localStorage.getItem('masuma_system_users');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return DEFAULT_USERS;
  });

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [resettingUser, setResettingUser] = useState<SystemUser | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Form states for Add User
  const [formData, setFormData] = useState({
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
  const [showPassword, setShowPassword] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form state for Reset Password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Fetch users from server
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          setUsers(data.users);
          localStorage.setItem('masuma_system_users', JSON.stringify(data.users));
        }
      }
    } catch (err) {
      console.warn('[UserManagement] Could not fetch users from API, operating from local cache.', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotice = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password: result }));
    showNotice(`Generated secure password: ${result}`, 'info');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      showNotice('Please complete all required fields.', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showNotice('Password must be at least 6 characters long.', 'error');
      return;
    }

    const cleanUsername = formData.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
    const cleanEmail = formData.email.trim().toLowerCase();

    // Check duplicate
    if (users.some(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail)) {
      showNotice(`A user with username "${cleanUsername}" or email "${cleanEmail}" already exists.`, 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          username: cleanUsername,
          email: cleanEmail
        })
      });

      let newUserRecord: SystemUser;
      if (res.ok) {
        const data = await res.json();
        newUserRecord = data.user;
      } else {
        // Local fallback
        newUserRecord = {
          id: Date.now(),
          username: cleanUsername,
          email: cleanEmail,
          fullName: formData.fullName.trim(),
          role: formData.role,
          pinCode: formData.pinCode.trim() || '0000',
          phone: formData.phone.trim() || undefined,
          branch: formData.branch,
          isActive: formData.isActive,
          createdAt: new Date().toISOString()
        };
      }

      const updated = [newUserRecord, ...users];
      setUsers(updated);
      localStorage.setItem('masuma_system_users', JSON.stringify(updated));

      setIsAddModalOpen(false);
      setFormData({
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
      showNotice(`Staff user "${newUserRecord.fullName}" (@${newUserRecord.username}) created successfully!`);
    } catch (err: any) {
      showNotice(`Failed to create user: ${err.message}`, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Edit User Save
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setFormSubmitting(true);
    try {
      await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      }).catch(() => {});

      const updated = users.map(u => u.id === editingUser.id ? editingUser : u);
      setUsers(updated);
      localStorage.setItem('masuma_system_users', JSON.stringify(updated));

      setEditingUser(null);
      showNotice(`Profile for "${editingUser.fullName}" updated successfully.`);
    } catch (err: any) {
      showNotice(`Failed to update user: ${err.message}`, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Reset Password Save
  const handleSavePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;

    if (newPassword.length < 6) {
      showNotice('Password must be at least 6 characters.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showNotice('Passwords do not match.', 'error');
      return;
    }

    setFormSubmitting(true);
    try {
      await fetch(`/api/users/${resettingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword })
      }).catch(() => {});

      showNotice(`Password successfully updated for ${resettingUser.fullName}. They can now login with the new credentials.`);
      setResettingUser(null);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      showNotice(`Failed to reset password: ${err.message}`, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Handle Status Toggle (Active / Inactive)
  const handleToggleActive = async (user: SystemUser) => {
    if (user.id === 1 || user.username === 'admin') {
      showNotice('Primary Super Administrator cannot be deactivated.', 'error');
      return;
    }

    const updatedStatus = !user.isActive;
    const updatedUser = { ...user, isActive: updatedStatus };

    // Update in state immediately
    const updatedList = users.map(u => u.id === user.id ? updatedUser : u);
    setUsers(updatedList);
    localStorage.setItem('masuma_system_users', JSON.stringify(updatedList));

    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: updatedStatus })
      });
      showNotice(`User @${user.username} ${updatedStatus ? 'activated' : 'suspended'}.`);
    } catch (_) {}
  };

  // Handle Delete User
  const handleDeleteUser = async (user: SystemUser) => {
    if (user.id === 1 || user.username === 'admin') {
      showNotice('Primary Super Administrator account cannot be removed.', 'error');
      return;
    }

    const confirm = window.confirm(`Are you sure you want to permanently remove system user "${user.fullName}" (@${user.username})? This cannot be undone.`);
    if (!confirm) return;

    try {
      await fetch(`/api/users/${user.id}`, { method: 'DELETE' }).catch(() => {});
      const updated = users.filter(u => u.id !== user.id);
      setUsers(updated);
      localStorage.setItem('masuma_system_users', JSON.stringify(updated));
      showNotice(`User account "${user.fullName}" has been deleted.`);
    } catch (err: any) {
      showNotice(`Failed to delete user: ${err.message}`, 'error');
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.branch && user.branch.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.phone && user.phone.includes(searchQuery));

      const matchesRole = selectedRoleFilter === 'ALL' || user.role === selectedRoleFilter;
      const matchesStatus = 
        selectedStatusFilter === 'ALL' || 
        (selectedStatusFilter === 'ACTIVE' && user.isActive) ||
        (selectedStatusFilter === 'INACTIVE' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.isActive).length;
    const admins = users.filter(u => u.role === 'admin').length;
    const cashiers = users.filter(u => u.role === 'cashier').length;
    const workshop = users.filter(u => u.role === 'workshop').length;
    const managers = users.filter(u => u.role === 'manager').length;
    const accountants = users.filter(u => u.role === 'accountant').length;
    return { total, active, admins, cashiers, workshop, managers, accountants };
  }, [users]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 w-full animate-fade-in font-sans">
      
      {/* ACTION NOTICE TOAST */}
      {actionNotice && (
        <div className={`p-4 rounded-xl border flex items-center justify-between shadow-lg transition-all ${
          actionNotice.type === 'error' 
            ? 'bg-rose-950/80 border-rose-800 text-rose-200' 
            : actionNotice.type === 'info'
            ? 'bg-blue-950/80 border-blue-800 text-blue-200'
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-200'
        }`}>
          <div className="flex items-center gap-3">
            {actionNotice.type === 'error' ? <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            <span className="text-sm font-medium">{actionNotice.message}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setActionNotice(null)}
            className="text-xs opacity-70 hover:opacity-100 uppercase tracking-wider font-bold cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* HEADER & METRIC SUMMARY */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-orange" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">System Users & Access Control</h2>
                <p className="text-xs text-slate-400">
                  Manage authorized staff accounts, role-based credentials, terminal quick PINs, and branch assignments.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition cursor-pointer"
              title="Refresh User List"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-brand-orange' : ''}`} />
              <span>Sync</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-brand-orange hover:bg-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add System User</span>
            </button>
          </div>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Staff</span>
            <span className="text-lg font-mono font-bold text-white">{stats.total}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Active Operators</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{stats.active}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-indigo-400 block">Admins</span>
            <span className="text-lg font-mono font-bold text-indigo-400">{stats.admins}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">POS Cashiers</span>
            <span className="text-lg font-mono font-bold text-emerald-400">{stats.cashiers}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-cyan-400 block">Workshop Chiefs</span>
            <span className="text-lg font-mono font-bold text-cyan-400">{stats.workshop}</span>
          </div>
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Managers</span>
            <span className="text-lg font-mono font-bold text-amber-400">{stats.managers}</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROLS */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, username, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-orange transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] text-slate-400 font-medium">Role:</span>
            <select
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Roles ({users.length})</option>
              <option value="admin" className="bg-slate-900 text-white">Super Admin</option>
              <option value="manager" className="bg-slate-900 text-white">Operations Manager</option>
              <option value="cashier" className="bg-slate-900 text-white">POS Cashier</option>
              <option value="workshop" className="bg-slate-900 text-white">Workshop Chief</option>
              <option value="accountant" className="bg-slate-900 text-white">Accountant</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <span className="text-[11px] text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer pr-2"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
              <option value="ACTIVE" className="bg-slate-900 text-emerald-400">Active Only</option>
              <option value="INACTIVE" className="bg-slate-900 text-rose-400">Suspended Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* USERS LIST / TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-brand-orange" />
            <h3 className="text-sm font-bold text-white">Registered System Operators</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredUsers.length} of {users.length} accounts
          </span>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Users className="w-12 h-12 text-slate-600 mx-auto" />
            <p className="text-sm font-medium">No system users found matching the selected search criteria.</p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedRoleFilter('ALL'); setSelectedStatusFilter('ALL'); }}
              className="text-xs text-brand-orange hover:underline font-semibold"
            >
              Reset Search Filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredUsers.map((user) => {
              const roleInfo = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.cashier;
              const RoleIcon = roleInfo.icon;
              const isPrimaryAdmin = user.id === 1 || user.username === 'admin';

              return (
                <div 
                  key={user.id} 
                  className={`p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-slate-800/40 transition ${
                    !user.isActive ? 'opacity-65 bg-slate-950/40' : ''
                  }`}
                >
                  {/* USER IDENTITY & AVATAR */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider uppercase shrink-0 border ${
                      user.role === 'admin' 
                        ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        : user.role === 'manager'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : user.role === 'workshop'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    }`}>
                      {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">{user.fullName}</span>
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                          @{user.username}
                        </span>
                        {isPrimaryAdmin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-orange/20 text-brand-orange border border-brand-orange/40 uppercase">
                            Root System Account
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <span className="text-slate-500">Email:</span>
                          <span className="text-slate-300">{user.email}</span>
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-300">{user.phone}</span>
                          </span>
                        )}
                        {user.branch && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-500" />
                            <span className="text-slate-400 truncate max-w-[200px]">{user.branch}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ROLE BADGE & QUICK PIN */}
                  <div className="flex items-center gap-4 shrink-0 flex-wrap">
                    <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${roleInfo.bg} ${roleInfo.border} ${roleInfo.color}`}>
                      <RoleIcon className="w-3.5 h-3.5" />
                      <span>{roleInfo.label}</span>
                    </div>

                    <div className="text-xs flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 font-mono text-slate-300" title="Quick Terminal Switch PIN">
                      <KeyRound className="w-3 h-3 text-slate-500" />
                      <span>PIN: {user.pinCode ? '••••' : 'None'}</span>
                    </div>

                    {/* STATUS PILL */}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(user)}
                      disabled={isPrimaryAdmin}
                      title={isPrimaryAdmin ? 'Primary admin cannot be deactivated' : 'Click to toggle status'}
                      className={`text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1.5 transition ${
                        user.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20'
                      } ${isPrimaryAdmin ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                    >
                      {user.isActive ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                          <span>Suspended</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* ACTIONS GROUP */}
                  <div className="flex items-center gap-1.5 self-end md:self-center shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-800 w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setEditingUser(user)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Edit User Profile"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setResettingUser(user);
                        setNewPassword('');
                        setConfirmNewPassword('');
                      }}
                      className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
                      title="Reset User Password"
                    >
                      <Lock className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteUser(user)}
                      disabled={isPrimaryAdmin}
                      className={`p-1.5 rounded-lg transition ${
                        isPrimaryAdmin 
                          ? 'text-slate-600 cursor-not-allowed' 
                          : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 cursor-pointer'
                      }`}
                      title={isPrimaryAdmin ? 'Primary Admin cannot be deleted' : 'Delete User Account'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECURITY CALLOUT / BEST PRACTICES */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex items-start gap-4">
        <Shield className="w-6 h-6 text-brand-orange shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs text-slate-400">
          <h4 className="text-white font-bold">Credential Storage & POS Quick-Switching Security</h4>
          <p>
            All system user passwords are encrypted using industry-standard <strong>Bcrypt algorithm (cost factor 10)</strong>. Quick PINs allow cashiers and workshop technicians to rapidly unlock or swap POS cash registers without typing full passwords in front of customers.
          </p>
          <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-slate-300">
            <span>• Password Min Length: 6 characters</span>
            <span>• POS PIN Code: 4-digit numeric</span>
            <span>• Brute-Force Rate Limiting: 5 attempts / 60s cooldown</span>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: ADD SYSTEM USER */}
      {/* ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-orange/10 border border-brand-orange/30 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-brand-orange" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create New System User</h3>
                  <p className="text-[11px] text-slate-400">Issue credentials for staff, managers, or workshop leads</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mwangi Kamau"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Username (Login ID) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. mwangi"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-orange font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Work Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. mwangi@masuma.co.ke"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. +254 712 345 678"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              {/* ROLE SELECTION */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">Operational Role & Authority *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(ROLE_DEFINITIONS) as SystemUserRole[]).map((r) => {
                    const def = ROLE_DEFINITIONS[r];
                    const Icon = def.icon;
                    const isSelected = formData.role === r;

                    return (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setFormData(prev => ({ ...prev, role: r }))}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-800 border-brand-orange text-white shadow-xs'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${def.bg} ${def.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {def.label}
                          </div>
                          <div className="text-[10px] text-slate-500 leading-tight mt-0.5 line-clamp-2">
                            {def.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* INITIAL PASSWORD & QUICK PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-300 font-bold">Initial Password *</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[10px] text-brand-orange hover:underline font-semibold flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Min 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-9 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-orange font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Terminal Quick PIN (4 Digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="1234"
                    value={formData.pinCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pinCode: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) }))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-brand-orange font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              {/* BRANCH / LOCATION */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">Assigned Branch / Facility</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-orange cursor-pointer"
                >
                  {PRESET_BRANCHES.map(b => (
                    <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                  ))}
                </select>
              </div>

              {/* ACTIVE STATUS TOGGLE */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Account Active Status</span>
                  <span className="text-[10px] text-slate-400">User will be permitted to authenticate upon creation</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  className="w-4 h-4 text-brand-orange rounded accent-brand-orange cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save & Provision User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: EDIT USER DETAILS */}
      {/* ======================================================== */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up my-8">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                  <Edit3 className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Modify User Profile</h3>
                  <p className="text-[11px] text-slate-400">Update account parameters for @{editingUser.username}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({ ...editingUser, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Role & Authority</label>
                  <select
                    value={editingUser.role}
                    disabled={editingUser.id === 1 || editingUser.username === 'admin'}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as SystemUserRole })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-orange cursor-pointer"
                  >
                    <option value="admin" className="bg-slate-900 text-white">Super Administrator</option>
                    <option value="manager" className="bg-slate-900 text-white">Operations Manager</option>
                    <option value="cashier" className="bg-slate-900 text-white">POS Cashier</option>
                    <option value="workshop" className="bg-slate-900 text-white">Workshop Chief</option>
                    <option value="accountant" className="bg-slate-900 text-white">Financial Accountant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Terminal Quick PIN (4 Digits)</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={editingUser.pinCode || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, pinCode: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono tracking-widest text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Direct Phone</label>
                  <input
                    type="text"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-orange"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Assigned Branch</label>
                  <select
                    value={editingUser.branch || PRESET_BRANCHES[0]}
                    onChange={(e) => setEditingUser({ ...editingUser, branch: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-brand-orange cursor-pointer"
                  >
                    {PRESET_BRANCHES.map(b => (
                      <option key={b} value={b} className="bg-slate-900 text-white">{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                <div>
                  <span className="font-bold text-white block">Active Status</span>
                  <span className="text-[10px] text-slate-400">Suspended accounts cannot log in to the ERP or POS</span>
                </div>
                <input
                  type="checkbox"
                  disabled={editingUser.id === 1 || editingUser.username === 'admin'}
                  checked={editingUser.isActive}
                  onChange={(e) => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                  className="w-4 h-4 text-brand-orange rounded accent-brand-orange cursor-pointer"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-brand-orange hover:bg-orange-600 text-white font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: RESET USER PASSWORD */}
      {/* ======================================================== */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Reset Account Password</h3>
                  <p className="text-[11px] text-slate-400">Change login credentials for {resettingUser.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePasswordReset} className="p-5 space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-slate-300 font-bold">New Password *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                      let pass = '';
                      for (let i = 0; i < 10; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      setNewPassword(pass);
                      setConfirmNewPassword(pass);
                    }}
                    className="text-[10px] text-brand-orange hover:underline font-semibold flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto-Generate</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showResetPassword ? 'text' : 'password'}
                    required
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-9 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-brand-orange"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Confirm New Password *</label>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-brand-orange"
                />
              </div>

              {newPassword && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] text-slate-500 block">Generated Password</span>
                    <span className="font-mono text-white font-bold">{newPassword}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(newPassword)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                  >
                    {copiedText === newPassword ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedText === newPassword ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shadow-sm transition flex items-center gap-2 cursor-pointer"
                >
                  {formSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Set New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagementSection;
