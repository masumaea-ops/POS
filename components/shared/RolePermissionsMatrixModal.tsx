import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  Check, 
  Lock, 
  Eye, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  CheckCircle2, 
  Search, 
  UserCheck,
  Building2,
  ShoppingCart,
  Boxes,
  BarChart2,
  FileText,
  Truck,
  Users,
  Coins,
  Wrench,
  Code2,
  Settings,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth, ROLE_PERMISSIONS, AppResource, CrudAction } from '../../contexts/AuthContext';
import type { SystemUserRole } from '../../types';

interface RolePermissionsMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ResourceMeta {
  key: AppResource;
  name: string;
  category: 'Commercial' | 'Operations' | 'Finance' | 'Workshop' | 'Administration';
  description: string;
  icon: React.ElementType;
}

const RESOURCES_METADATA: ResourceMeta[] = [
  {
    key: 'dashboard',
    name: 'Executive & Role Dashboard',
    category: 'Commercial',
    description: 'Dynamic cockpit tailored to role (Cashier shift, Workshop bays, Financial ledger, or Chain executive)',
    icon: BarChart2
  },
  {
    key: 'pos',
    name: 'Point of Sale (POS) Counter',
    category: 'Commercial',
    description: 'Front-desk register checkout, barcode scanning, M-Pesa STK push, and counter cash drawers',
    icon: ShoppingCart
  },
  {
    key: 'inventory',
    name: 'Automotive Parts Inventory',
    category: 'Operations',
    description: 'OEM/interchange cross-overs, stock bin locations, reorder safety thresholds, and CSV import',
    icon: Boxes
  },
  {
    key: 'sales',
    name: 'Wholesale & B2B Sales',
    category: 'Commercial',
    description: 'Corporate customer orders, pricing tiers (Retail/Wholesale A/B), and order dispatch tracking',
    icon: BarChart2
  },
  {
    key: 'quotations',
    name: 'Price Quotations & Proformas',
    category: 'Commercial',
    description: 'Drafting commercial estimates, formal quotation PDFs, and customer approval tracking',
    icon: FileText
  },
  {
    key: 'invoices',
    name: 'Customer Invoices & eTIMS',
    category: 'Finance',
    description: 'KRA eTIMS fiscal signatures, sales receipts, invoice printing, and payment allocations',
    icon: FileText
  },
  {
    key: 'purchasing',
    name: 'Purchasing & Supplier POs',
    category: 'Operations',
    description: 'Supplier purchase orders, inbound consignment receiving (GRN), and 3-way match validation',
    icon: Building2
  },
  {
    key: 'shipping',
    name: 'Dispatch & Fleet Logistics',
    category: 'Operations',
    description: 'Courier assignment, parcel dispatching, milestone tracking, and customer SMS tracking link',
    icon: Truck
  },
  {
    key: 'contacts',
    name: 'Customers & Suppliers CRM',
    category: 'Commercial',
    description: 'Customer credit limits, aged account histories, vehicle ownership files, and supplier database',
    icon: Users
  },
  {
    key: 'garage',
    name: 'Garage Chain & OBD-II Diag',
    category: 'Workshop',
    description: 'Job cards, computerized ECU scanner reports (PDF), lift bay allocations, and CSAT ratings',
    icon: Wrench
  },
  {
    key: 'accounting',
    name: 'General Ledger & Banking',
    category: 'Finance',
    description: 'Chart of Accounts, journal vouchers, bank & M-Pesa reconciliations, and P&L financial statements',
    icon: Coins
  },
  {
    key: 'reports',
    name: 'Executive Intelligence & Tax',
    category: 'Finance',
    description: 'Sales velocity, gross margin calculations, VAT return summaries, and exportable financial reports',
    icon: BarChart2
  },
  {
    key: 'integrations',
    name: 'API Gateways & Webhooks',
    category: 'Administration',
    description: 'KRA eTIMS OSCU keys, M-Pesa Daraja B2C credentials, REST endpoints, and sandbox logs',
    icon: Code2
  },
  {
    key: 'settings',
    name: 'Enterprise System Config',
    category: 'Administration',
    description: 'Branch outlet codes, base currencies (KES/USD), tax percentages (16% VAT), and system branding',
    icon: Settings
  },
  {
    key: 'users',
    name: 'User RBAC & Staff Administration',
    category: 'Administration',
    description: 'Staff account provisioning, role credential management, terminal PIN resets, and audit logs',
    icon: ShieldCheck
  }
];

export const RolePermissionsMatrixModal: React.FC<RolePermissionsMatrixModalProps> = ({
  isOpen,
  onClose
}) => {
  const { userRole, switchRole, allPersonas, getRoleBadge } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTabRole, setActiveTabRole] = useState<SystemUserRole | 'all'>('all');

  if (!isOpen) return null;

  const rolesList: Array<{ key: SystemUserRole; title: string; subtitle: string }> = [
    { key: 'admin', title: 'Super Admin', subtitle: 'Executive Chain Controller' },
    { key: 'manager', title: 'Regional Manager', subtitle: 'Operations & Approvals' },
    { key: 'cashier', title: 'POS Cashier', subtitle: 'Front-Desk Counter Checkout' },
    { key: 'workshop', title: 'Garage Workshop Lead', subtitle: 'ECU Diagnostics & Bay Hub' },
    { key: 'accountant', title: 'Financial Accountant', subtitle: 'GL, eTIMS & Tax Audit' },
    { key: 'auditor', title: 'Internal / External Auditor', subtitle: 'Read-Only Audit & Tax Verification' },
  ];

  const filteredResources = RESOURCES_METADATA.filter(res => {
    const matchesSearch = 
      res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.key.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || res.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getPermissionBadge = (role: SystemUserRole, resource: AppResource) => {
    const permissions = ROLE_PERMISSIONS[role]?.[resource] || [];

    if (permissions.length === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <Lock className="w-3 h-3" />
          <span>Restricted</span>
        </span>
      );
    }

    if (permissions.includes('admin') || permissions.includes('delete')) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
            <CheckCircle2 className="w-3 h-3 text-indigo-400" />
            <span>Full CRUD + Admin</span>
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {permissions.join(', ')}
          </span>
        </div>
      );
    }

    if (permissions.includes('create') || permissions.includes('update')) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <Check className="w-3 h-3 text-emerald-400" />
            <span>Operational Read/Write</span>
          </span>
          <span className="text-[9px] text-slate-400 font-mono">
            {permissions.join(', ')}
          </span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <Eye className="w-3 h-3 text-amber-400" />
          <span>Read-Only Lookup</span>
        </span>
        <span className="text-[9px] text-slate-400 font-mono">
          {permissions.join(', ')}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-7xl max-h-[92vh] bg-[#0c1427] border border-slate-750 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 bg-[#0f1a33] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">
                  Granular Role-Based Access Control (RBAC) Matrix
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-orange/20 text-brand-orange border border-brand-orange/30">
                  Live Enterprise Policy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Meticulously segregated views, URL route guards, and action-level permissions across all roles.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Live Persona Switcher Toolbar */}
        <div className="p-4 bg-[#0a1020] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Search & Category Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter system modules..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-orange"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              {['all', 'Commercial', 'Operations', 'Finance', 'Workshop', 'Administration'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-slate-750 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Categories' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Simulation Indicator */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Currently Active Persona:</span>
            <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${getRoleBadge(userRole).bg} ${getRoleBadge(userRole).color} border ${getRoleBadge(userRole).border}`}>
              {getRoleBadge(userRole).label}
            </span>
          </div>
        </div>

        {/* Live Simulation Banner Cards */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto shrink-0">
          <div className="flex items-center gap-3 min-w-max">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1 shrink-0">
              <UserCheck className="w-3.5 h-3.5 text-brand-orange" />
              <span>1-Click Live Test:</span>
            </span>
            {rolesList.map((r) => {
              const isCurrent = userRole === r.key;
              const badge = getRoleBadge(r.key);
              return (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => switchRole(r.key)}
                  className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-brand-orange/20 border-brand-orange text-white shadow-md font-bold'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-brand-orange animate-ping' : 'bg-slate-600'}`} />
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold leading-tight">{r.title}</span>
                    <span className="text-[9px] text-slate-400 leading-none">{r.subtitle}</span>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-brand-orange text-white font-black uppercase ml-1">
                      Active
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Matrix Table View */}
        <div className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0e172e] border-b border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-300">
                  <th className="p-4 min-w-[280px]">System Module & Scope</th>
                  {rolesList.map(r => (
                    <th key={r.key} className={`p-4 min-w-[190px] ${userRole === r.key ? 'bg-brand-orange/10 border-x border-brand-orange/30' : ''}`}>
                      <div className="flex items-center justify-between">
                        <span className={userRole === r.key ? 'text-brand-orange font-black' : 'text-slate-200'}>
                          {r.title}
                        </span>
                        {userRole === r.key && (
                          <span className="text-[8px] bg-brand-orange text-white px-1.5 py-0.5 rounded font-black">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] font-normal text-slate-400 block normal-case font-sans">
                        {r.subtitle}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredResources.map((res) => {
                  const Icon = res.icon;
                  return (
                    <tr key={res.key} className="hover:bg-slate-850/50 transition-colors">
                      {/* Module Info */}
                      <td className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-orange shrink-0 mt-0.5">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{res.name}</span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                {res.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                              {res.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Columns */}
                      {rolesList.map((r) => {
                        const isCurrent = userRole === r.key;
                        return (
                          <td 
                            key={r.key} 
                            className={`p-4 align-top ${isCurrent ? 'bg-brand-orange/5 border-x border-brand-orange/20' : ''}`}
                          >
                            {getPermissionBadge(r.key, res.key)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Security Architecture Summary Footer */}
        <div className="px-6 py-4 bg-[#0a1020] border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs shrink-0">
          <div className="flex items-center gap-3 text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
              <span>Full Admin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>Operational Read/Write</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span>Read-Only</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span>Strictly Denied</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Enforcement Levels:</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              1. URL RouteGuards
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              2. Navigation Sidebar Filter
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
              3. Button Action Gates
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default RolePermissionsMatrixModal;
