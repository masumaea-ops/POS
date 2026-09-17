const fs = require('fs');

let content = fs.readFileSync('server/rbac/permissions.ts', 'utf-8');

const missingPerms = `
  // Dashboard
  { id: 'dashboard.view', module: 'dashboard', action: 'view', name: 'View Dashboard', description: 'View executive dashboard', riskLevel: 'low' },
  // POS
  { id: 'pos.view', module: 'pos', action: 'view', name: 'View POS', description: 'View POS interface', riskLevel: 'low' },
  // Sales
  { id: 'sales.view', module: 'sales', action: 'view', name: 'View Sales', description: 'View sales orders', riskLevel: 'low' },
  { id: 'sales.manage', module: 'sales', action: 'manage', name: 'Manage Sales', description: 'Manage sales orders', riskLevel: 'medium' },
  // Quotations
  { id: 'quotations.view', module: 'quotations', action: 'view', name: 'View Quotations', description: 'View quotations', riskLevel: 'low' },
  { id: 'quotations.manage', module: 'quotations', action: 'manage', name: 'Manage Quotations', description: 'Manage quotations', riskLevel: 'medium' },
  // Invoices
  { id: 'invoices.view', module: 'invoices', action: 'view', name: 'View Invoices', description: 'View invoices', riskLevel: 'low' },
  { id: 'invoices.manage', module: 'invoices', action: 'manage', name: 'Manage Invoices', description: 'Manage invoices', riskLevel: 'medium' },
  // Purchasing
  { id: 'purchasing.view', module: 'purchasing', action: 'view', name: 'View Purchasing', description: 'View POs', riskLevel: 'low' },
  { id: 'purchasing.manage', module: 'purchasing', action: 'manage', name: 'Manage Purchasing', description: 'Manage POs', riskLevel: 'medium' },
  // Shipping
  { id: 'shipping.view', module: 'shipping', action: 'view', name: 'View Shipping', description: 'View shipping', riskLevel: 'low' },
  { id: 'shipping.manage', module: 'shipping', action: 'manage', name: 'Manage Shipping', description: 'Manage shipping', riskLevel: 'medium' },
  // Reports
  { id: 'reports.view', module: 'reports', action: 'view', name: 'View Reports', description: 'View reports', riskLevel: 'low' },
];

export const DEFAULT_ROLES
`;

content = content.replace('];\n\nexport const DEFAULT_ROLES', missingPerms);
content = content.replace('];\nexport const DEFAULT_ROLES', missingPerms);

// Update manager role
content = content.replace(
  `{ permissionId: 'pos.create_sale', scope: 'branch' },`,
  `{ permissionId: 'dashboard.view', scope: 'branch' },
      { permissionId: 'pos.view', scope: 'branch' },
      { permissionId: 'pos.create_sale', scope: 'branch' },`
);

content = content.replace(
  `{ permissionId: 'accounting.view', scope: 'branch' }`,
  `{ permissionId: 'accounting.view', scope: 'branch' },
      { permissionId: 'sales.view', scope: 'branch' },
      { permissionId: 'sales.manage', scope: 'branch' },
      { permissionId: 'quotations.view', scope: 'branch' },
      { permissionId: 'quotations.manage', scope: 'branch' },
      { permissionId: 'invoices.view', scope: 'branch' },
      { permissionId: 'invoices.manage', scope: 'branch' },
      { permissionId: 'purchasing.view', scope: 'branch' },
      { permissionId: 'purchasing.manage', scope: 'branch' },
      { permissionId: 'shipping.view', scope: 'branch' },
      { permissionId: 'shipping.manage', scope: 'branch' },
      { permissionId: 'reports.view', scope: 'branch' }`
);

// Update cashier role
content = content.replace(
  `{ permissionId: 'pos.create_sale', scope: 'own' },`,
  `{ permissionId: 'pos.view', scope: 'own' },
      { permissionId: 'pos.create_sale', scope: 'own' },
      { permissionId: 'sales.view', scope: 'own' },
      { permissionId: 'sales.manage', scope: 'own' },
      { permissionId: 'quotations.view', scope: 'own' },
      { permissionId: 'quotations.manage', scope: 'own' },
      { permissionId: 'invoices.view', scope: 'branch' },`
);

fs.writeFileSync('server/rbac/permissions.ts', content);
