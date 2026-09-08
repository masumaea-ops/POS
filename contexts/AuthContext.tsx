import React, { createContext, useContext, useState, useEffect } from 'react';
import type { SystemUser, SystemUserRole } from '../types';

export type CrudAction = 'read' | 'create' | 'update' | 'delete' | 'export' | 'approve' | 'admin';

export type AppResource = 
  | 'dashboard'
  | 'pos'
  | 'inventory'
  | 'sales'
  | 'quotations'
  | 'invoices'
  | 'purchasing'
  | 'shipping'
  | 'contacts'
  | 'reports'
  | 'accounting'
  | 'garage'
  | 'integrations'
  | 'settings'
  | 'users';

// Pre-seeded standard system personas matching enterprise roles
export const SYSTEM_PERSONAS: SystemUser[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@masuma.co.ke',
    fullName: 'System Administrator',
    role: 'admin',
    phone: '+254 700 000 001',
    branch: 'Nairobi HQ & Central Warehouse',
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 2,
    username: 'manager',
    email: 'manager@masuma.co.ke',
    fullName: 'David Kibet (Operations Manager)',
    role: 'manager',
    phone: '+254 700 000 004',
    branch: 'All Branches / Multi-Branch Float',
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 3,
    username: 'cashier',
    email: 'cashier@masuma.co.ke',
    fullName: 'Faith Wanjiku (POS Cashier)',
    role: 'cashier',
    phone: '+254 700 000 002',
    branch: 'Nairobi HQ & Central Warehouse',
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 4,
    username: 'workshop',
    email: 'garage@masuma.co.ke',
    fullName: 'Eng. Dennis Otieno (Workshop Chief)',
    role: 'workshop',
    phone: '+254 700 000 003',
    branch: 'Industrial Area Lift Bays',
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 5,
    username: 'accountant',
    email: 'accountant@masuma.co.ke',
    fullName: 'Grace Muthoni (Head Accountant)',
    role: 'accountant',
    phone: '+254 700 000 005',
    branch: 'Nairobi HQ & Central Warehouse',
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: 6,
    username: 'auditor',
    email: 'auditor@masuma.co.ke',
    fullName: 'Bernard Kilonzo (Internal & Tax Auditor)',
    role: 'auditor',
    phone: '+254 700 000 006',
    branch: 'All Branches / Multi-Branch Float',
    isActive: true,
    lastLogin: new Date().toISOString()
  }
];

// Granular permission mapping: Role -> Resource -> Allowed CrudActions
export const ROLE_PERMISSIONS: Record<SystemUserRole, Record<AppResource, CrudAction[]>> = {
  admin: {
    dashboard: ['read', 'export'],
    pos: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    inventory: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    sales: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    quotations: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    invoices: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    purchasing: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    shipping: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    contacts: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    reports: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    accounting: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    garage: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    integrations: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    settings: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin'],
    users: ['read', 'create', 'update', 'delete', 'export', 'approve', 'admin']
  },
  manager: {
    dashboard: ['read', 'export'], // Management access
    pos: ['read', 'create', 'update', 'export', 'approve'],
    inventory: ['read', 'create', 'update', 'export', 'approve'], // NO delete
    sales: ['read', 'create', 'update', 'export', 'approve'],
    quotations: ['read', 'create', 'update', 'export', 'approve'],
    invoices: ['read', 'create', 'update', 'export', 'approve'],
    purchasing: ['read', 'create', 'update', 'export', 'approve'],
    shipping: ['read', 'create', 'update', 'export', 'approve'],
    contacts: ['read', 'create', 'update', 'export'],
    reports: ['read', 'export'],
    accounting: ['read', 'export'], // Read only financial overview
    garage: ['read', 'create', 'update', 'export', 'approve'],
    integrations: [], // Strictly no API key management
    settings: ['read'], // General settings view only
    users: [] // Strictly no user management or staff roster viewing (Admin only)
  },
  cashier: {
    dashboard: [], // STRICTLY NO DASHBOARD - Reserved for management only
    pos: ['read', 'create', 'update', 'export'], // Full front-desk cash register
    inventory: ['read'], // Read-only parts catalog lookup (NO add, NO edit, NO delete)
    sales: ['read', 'create'], // Create orders & quotes
    quotations: ['read', 'create', 'export'], // Draft quotes & print slips
    invoices: ['read', 'export'], // View customer invoices & print receipts
    purchasing: [], // NO access
    shipping: [], // NO access - Freight dispatch reserved for logistics team
    contacts: ['read', 'create'], // Add retail walk-in customer contacts
    reports: [], // NO financial intelligence
    accounting: [], // NO access
    garage: [], // NO access
    integrations: [], // NO access
    settings: [], // NO access
    users: [] // NO access
  },
  workshop: {
    dashboard: [], // STRICTLY NO DASHBOARD - Reserved for management only
    pos: [], // NO cash handling
    inventory: ['read'], // Search parts & verify store stock for lift bay
    sales: [], // NO sales order administration
    quotations: [], // NO quotation creation
    invoices: [], // NO invoice management
    purchasing: [], // NO purchasing authority
    shipping: [], // NO shipping dispatch
    contacts: ['read'], // View customer vehicle owners
    reports: [], // NO group financial reports
    accounting: [], // NO access
    garage: ['read', 'create', 'update', 'export', 'approve'], // Full OBD-II, Job Cards, bays
    integrations: [], // NO access
    settings: [], // NO access
    users: [] // NO access
  },
  accountant: {
    dashboard: [], // STRICTLY NO DASHBOARD - Reserved for management only
    pos: [], // Front-counter register is for cashiers; accountant audits in invoices/reports
    inventory: ['read', 'export'], // Asset valuation inspection
    sales: ['read', 'export'], // Sales journal audits
    quotations: ['read', 'export'], // Quotation review
    invoices: ['read', 'create', 'update', 'export', 'approve'], // Tax invoices & eTIMS returns
    purchasing: ['read', 'export', 'approve'], // PO validation & GRN payments
    shipping: [], // Delivery logistics is for shipping team
    contacts: ['read', 'update', 'export'], // Payables / Receivables ledger
    reports: ['read', 'export'], // Full financial & VAT tax reporting
    accounting: ['read', 'create', 'update', 'export', 'approve'], // Full General Ledger & COA
    garage: [], // Workshop bays are for garage technicians
    integrations: [], // NO access
    settings: [], // NO access
    users: [] // NO access
  },
  auditor: {
    dashboard: [], // STRICTLY NO DASHBOARD - Reserved for management only
    pos: ['read'], // Inspect counter sales logs & receipts (read-only audit)
    inventory: ['read', 'export'], // Asset stock valuation & stock movement audit
    sales: ['read', 'export'], // Sales journal audits & customer receipts
    quotations: ['read', 'export'], // Quotation review & pricing audit
    invoices: ['read', 'export'], // Fiscal invoices, eTIMS compliance & tax logs
    purchasing: ['read', 'export'], // PO validation, supplier invoices & GRN 3-way match
    shipping: ['read'], // Waybills & dispatch verification
    contacts: ['read', 'export'], // Customer & Supplier debt/credit ledgers
    reports: ['read', 'export'], // Full Financial P&L, VAT & Tax audit reporting
    accounting: ['read', 'export'], // General Ledger, COA, Journal entries, Balance Sheet (Strictly Read & Export, NO write/edit/delete/approve)
    garage: ['read', 'export'], // Service job cards & parts billing audit
    integrations: [], // NO access
    settings: ['read'], // Can view compliance settings, cannot edit
    users: [] // Strictly no user management or staff roster viewing (Admin only)
  }
};

// Route to resource mapping for high-level URL and navigation guards
export const ROUTE_RESOURCE_MAP: Record<string, AppResource> = {
  '/': 'dashboard',
  '/dashboard': 'dashboard',
  '/pos': 'pos',
  '/inventory': 'inventory',
  '/vin-picker': 'inventory',
  '/sales': 'sales',
  '/sales-history': 'sales',
  '/quotations': 'quotations',
  '/invoices': 'invoices',
  '/purchasing': 'purchasing',
  '/shipping': 'shipping',
  '/contacts': 'contacts',
  '/customers': 'contacts',
  '/reports': 'reports',
  '/accounting': 'accounting',
  '/garage': 'garage',
  '/integrations': 'integrations',
  '/settings': 'settings'
};

/**
 * Returns the designated operational landing page for each role.
 * Management (admin, manager) lands on the Executive Dashboard ('/'),
 * while frontline staff land directly in their respective workspace.
 */
export const getDefaultRoleHome = (role?: SystemUserRole): string => {
  switch (role) {
    case 'admin':
    case 'manager':
      return '/';
    case 'cashier':
      return '/pos';
    case 'workshop':
      return '/garage';
    case 'accountant':
      return '/accounting';
    case 'auditor':
      return '/reports';
    default:
      return '/profile';
  }
};

interface AuthContextType {
  currentUser: SystemUser;
  userRole: SystemUserRole;
  isAuthenticated: boolean;
  login: (user: SystemUser) => void;
  logout: () => void;
  switchUser: (user: SystemUser) => void;
  switchRole: (role: SystemUserRole) => void;
  hasPermission: (resource: AppResource, action: CrudAction) => boolean;
  canAccessRoute: (routePath: string) => boolean;
  getRoleBadge: (role?: SystemUserRole) => { label: string; color: string; bg: string; border: string };
  allPersonas: SystemUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode; onLogoutExternal?: () => void }> = ({ 
  children,
  onLogoutExternal
}) => {
  const [currentUser, setCurrentUser] = useState<SystemUser>(() => {
    try {
      const stored = localStorage.getItem('masuma_current_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.role) return parsed;
      }
    } catch (_) {}
    return SYSTEM_PERSONAS[0]; // Default to Super Admin if unset
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('masuma_auth_active') === 'true';
  });

  // Sync state to localStorage whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('masuma_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  const login = (user: SystemUser) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('masuma_current_user', JSON.stringify(user));
    sessionStorage.setItem('masuma_auth_active', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('masuma_auth_active');
    try {
      localStorage.removeItem('masuma_current_user');
    } catch (_) {}
    if (onLogoutExternal) {
      onLogoutExternal();
    }
  };

const mapSystemRoleToGarageRole = (role: SystemUserRole): string => {
  switch (role) {
    case 'admin': return 'SUPER_ADMIN';
    case 'manager': return 'BRANCH_MANAGER';
    case 'workshop': return 'DIAGNOSTIC_TECH';
    case 'cashier': return 'RECEPTIONIST';
    case 'accountant': return 'BRANCH_MANAGER';
    default: return 'SUPER_ADMIN';
  }
};

  const switchUser = (user: SystemUser) => {
    // Only Super Administrator is permitted to switch roles or test personas
    if (currentUser.role !== 'admin') {
      console.warn('[RBAC Security] Privilege switching and impersonation are strictly restricted to Super Administrators.');
      return;
    }
    setCurrentUser(user);
    localStorage.setItem('masuma_current_user', JSON.stringify(user));
    const garageRole = mapSystemRoleToGarageRole(user.role);
    try {
      localStorage.setItem('garage_active_role', garageRole);
      window.dispatchEvent(new CustomEvent('garage_role_sync', { detail: garageRole }));
    } catch (_) {}
  };

  const switchRole = (role: SystemUserRole) => {
    // Only Super Administrator is permitted to switch roles or test personas
    if (currentUser.role !== 'admin') {
      console.warn('[RBAC Security] Privilege switching is strictly restricted to Super Administrators.');
      return;
    }
    const matched = SYSTEM_PERSONAS.find(p => p.role === role) || {
      ...currentUser,
      role,
      fullName: `Active User (${role.toUpperCase()})`
    };
    switchUser(matched);
  };

  const hasPermission = (resource: AppResource, action: CrudAction): boolean => {
    const role = currentUser.role || 'cashier';
    const roleTable = ROLE_PERMISSIONS[role];
    if (!roleTable) return false;
    const actions = roleTable[resource] || [];
    return actions.includes(action);
  };

  const canAccessRoute = (routePath: string): boolean => {
    const [pathPart, queryPart] = routePath.split('?');
    const cleanPath = pathPart.toLowerCase();
    
    // Profile is universally accessible
    if (cleanPath === '/profile') return true;

    // Executive Dashboard is strictly reserved for management only (Admin & Regional Manager)
    if ((cleanPath === '/' || cleanPath === '/dashboard') && currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return false;
    }

    // Parts Suppliers tab under contacts requires purchasing permission
    if (cleanPath === '/contacts' && queryPart && queryPart.includes('tab=Suppliers')) {
      return hasPermission('purchasing', 'read');
    }

    // Users and staff management under settings is strictly restricted to Super Administrator
    if (cleanPath === '/settings' && queryPart && queryPart.includes('tab=users')) {
      return currentUser.role === 'admin';
    }

    const resource = ROUTE_RESOURCE_MAP[cleanPath];
    if (!resource) return true; // Unmapped paths default to allowed

    return hasPermission(resource, 'read');
  };

  const getRoleBadge = (targetRole?: SystemUserRole) => {
    const r = targetRole || currentUser.role;
    switch (r) {
      case 'admin':
        return { label: 'Super Administrator', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' };
      case 'manager':
        return { label: 'Regional Operations Manager', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
      case 'cashier':
        return { label: 'POS Counter Cashier', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
      case 'workshop':
        return { label: 'Garage Workshop Lead', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' };
      case 'accountant':
        return { label: 'Financial & Tax Accountant', color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' };
      case 'auditor':
        return { label: 'Internal / External Auditor', color: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/30' };
      default:
        return { label: 'Staff Member', color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/30' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userRole: currentUser.role,
        isAuthenticated,
        login,
        logout,
        switchUser,
        switchRole,
        hasPermission,
        canAccessRoute,
        getRoleBadge,
        allPersonas: currentUser.role === 'admin' ? SYSTEM_PERSONAS : [currentUser]
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
