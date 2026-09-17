import type { PermissionDefinition, PermissionScope, RoleDefinition } from './types.js';

export const ALL_PERMISSIONS: PermissionDefinition[] = [
  // System & Settings
  { id: 'settings.view', module: 'settings', action: 'view', name: 'View Settings', description: 'View system configuration', riskLevel: 'low' },
  { id: 'settings.edit', module: 'settings', action: 'edit', name: 'Edit Settings', description: 'Modify system configuration', riskLevel: 'critical' },
  
  // SMTP Config
  { id: 'smtp.manage', module: 'settings', action: 'manage', name: 'Manage SMTP', description: 'Configure email settings', riskLevel: 'high' },
  
  // Database / Seed
  { id: 'db.manage', module: 'settings', action: 'manage', name: 'Manage Database', description: 'Seed or inspect database status', riskLevel: 'critical' },

  // Integrations
  { id: 'integrations.view', module: 'integrations', action: 'view', name: 'View Integrations', description: 'View API keys and status', riskLevel: 'medium' },
  { id: 'integrations.manage', module: 'integrations', action: 'manage', name: 'Manage Integrations', description: 'Configure M-Pesa/eTIMS keys', riskLevel: 'critical' },
  
  // POS & Payments
  { id: 'pos.create_sale', module: 'pos', action: 'create_sale', name: 'Conduct Sale', description: 'Process transactions', riskLevel: 'medium' },
  { id: 'pos.void_sale', module: 'pos', action: 'void_sale', name: 'Void Sale', description: 'Void transaction', riskLevel: 'high' },
  { id: 'pos.refund', module: 'pos', action: 'refund', name: 'Issue Refund', description: 'Execute refund', riskLevel: 'high' },
  
  // Inventory / Products
  { id: 'inventory.view', module: 'inventory', action: 'view', name: 'View Inventory', description: 'Search catalog', riskLevel: 'low' },
  { id: 'inventory.manage', module: 'inventory', action: 'manage', name: 'Manage Inventory', description: 'Create/Edit/Adjust items', riskLevel: 'high' },
  { id: 'inventory.delete', module: 'inventory', action: 'delete', name: 'Delete Inventory', description: 'Delete catalog items', riskLevel: 'critical' },

  // Customers
  { id: 'customers.view', module: 'customers', action: 'view', name: 'View Customers', description: 'Search customer accounts', riskLevel: 'low' },
  { id: 'customers.manage', module: 'customers', action: 'manage', name: 'Manage Customers', description: 'Create or edit customers', riskLevel: 'medium' },

  // Users & Roles
  { id: 'users.view', module: 'users', action: 'view', name: 'View Users', description: 'Browse staff accounts', riskLevel: 'low' },
  { id: 'users.create', module: 'users', action: 'create', name: 'Create User', description: 'Provision staff', riskLevel: 'critical' },
  { id: 'users.edit', module: 'users', action: 'edit', name: 'Modify User', description: 'Update staff details', riskLevel: 'high' },
  { id: 'users.disable', module: 'users', action: 'disable', name: 'Deactivate User', description: 'Lock access', riskLevel: 'critical' },
  
  // Roles
  { id: 'roles.view', module: 'roles', action: 'view', name: 'View Roles', description: 'Inspect RBAC', riskLevel: 'medium' },
  { id: 'roles.assign_permissions', module: 'roles', action: 'assign_permissions', name: 'Assign Permissions', description: 'Grant/revoke rights', riskLevel: 'critical' },
  
  // Audit
  { id: 'audit.view', module: 'audit', action: 'view', name: 'View Audit Logs', description: 'Inspect security events', riskLevel: 'high' },
  
  // Garage
  { id: 'garage.view', module: 'garage', action: 'view', name: 'View Garage', description: 'View jobs/branches', riskLevel: 'low' },
  
  // Accounting
  { id: 'accounting.view', module: 'accounting', action: 'view', name: 'View Accounting', description: 'View charts/accounts', riskLevel: 'low' }
];

export const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Super Administrator',
    description: 'Executive authority with full administrative, financial, and RBAC governance rights',
    isSystem: true,
    permissions: ALL_PERMISSIONS.map(p => ({
      permissionId: p.id,
      scope: 'all' as PermissionScope
    }))
  },
  {
    id: 'manager',
    name: 'Operations Manager',
    description: 'Branch manager',
    isSystem: true,
    permissions: [
      { permissionId: 'settings.view', scope: 'branch' },
      { permissionId: 'pos.create_sale', scope: 'branch' },
      { permissionId: 'pos.void_sale', scope: 'branch' },
      { permissionId: 'pos.refund', scope: 'branch' },
      { permissionId: 'inventory.view', scope: 'branch' },
      { permissionId: 'inventory.manage', scope: 'branch' },
      { permissionId: 'customers.view', scope: 'branch' },
      { permissionId: 'customers.manage', scope: 'branch' },
      { permissionId: 'users.view', scope: 'branch' },
      { permissionId: 'garage.view', scope: 'branch' },
      { permissionId: 'accounting.view', scope: 'branch' }
    ]
  },
  {
    id: 'cashier',
    name: 'POS Terminal Cashier',
    description: 'Frontline counter checkout terminal operator',
    isSystem: true,
    permissions: [
      { permissionId: 'pos.create_sale', scope: 'own' },
      { permissionId: 'inventory.view', scope: 'branch' },
      { permissionId: 'customers.view', scope: 'branch' },
      { permissionId: 'customers.manage', scope: 'branch' }
    ]
  },
  {
    id: 'workshop',
    name: 'Workshop Chief Engineer',
    description: 'Garage lead mechanic',
    isSystem: true,
    permissions: [
      { permissionId: 'garage.view', scope: 'branch' },
      { permissionId: 'inventory.view', scope: 'branch' }
    ]
  },
  {
    id: 'accountant',
    name: 'Head Financial Accountant',
    description: 'Manages chart of accounts, ledgers, tax',
    isSystem: true,
    permissions: [
      { permissionId: 'accounting.view', scope: 'all' },
      { permissionId: 'inventory.view', scope: 'all' },
      { permissionId: 'customers.view', scope: 'all' },
      { permissionId: 'settings.view', scope: 'all' },
      { permissionId: 'integrations.view', scope: 'all' }
    ]
  },
  {
    id: 'auditor',
    name: 'Internal Auditor & Compliance',
    description: 'Read-Only compliance auditor',
    isSystem: true,
    permissions: [
      { permissionId: 'audit.view', scope: 'all' },
      { permissionId: 'accounting.view', scope: 'all' },
      { permissionId: 'inventory.view', scope: 'all' },
      { permissionId: 'customers.view', scope: 'all' },
      { permissionId: 'users.view', scope: 'all' },
      { permissionId: 'roles.view', scope: 'all' },
      { permissionId: 'settings.view', scope: 'all' },
      { permissionId: 'integrations.view', scope: 'all' },
      { permissionId: 'garage.view', scope: 'all' }
    ]
  }
];
