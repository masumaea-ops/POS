const fs = require('fs');
let content = fs.readFileSync('server/rbac/permissions.ts', 'utf-8');

// Update workshop role
content = content.replace(
  `{ permissionId: 'garage.view', scope: 'branch' },`,
  `{ permissionId: 'garage.view', scope: 'branch' },
      { permissionId: 'inventory.view', scope: 'branch' },
      { permissionId: 'customers.view', scope: 'branch' },`
);

// Update accountant role
content = content.replace(
  `{ permissionId: 'accounting.view', scope: 'all' },`,
  `{ permissionId: 'accounting.view', scope: 'all' },
      { permissionId: 'inventory.view', scope: 'all' },
      { permissionId: 'sales.view', scope: 'all' },
      { permissionId: 'quotations.view', scope: 'all' },
      { permissionId: 'invoices.view', scope: 'all' },
      { permissionId: 'invoices.manage', scope: 'all' },
      { permissionId: 'purchasing.view', scope: 'all' },
      { permissionId: 'purchasing.manage', scope: 'all' },
      { permissionId: 'contacts.view', scope: 'all' },
      { permissionId: 'reports.view', scope: 'all' },`
);

// Update auditor role
content = content.replace(
  `{ permissionId: 'audit.view', scope: 'all' },`,
  `{ permissionId: 'audit.view', scope: 'all' },
      { permissionId: 'pos.view', scope: 'all' },
      { permissionId: 'inventory.view', scope: 'all' },
      { permissionId: 'sales.view', scope: 'all' },
      { permissionId: 'quotations.view', scope: 'all' },
      { permissionId: 'invoices.view', scope: 'all' },
      { permissionId: 'purchasing.view', scope: 'all' },
      { permissionId: 'shipping.view', scope: 'all' },
      { permissionId: 'customers.view', scope: 'all' },
      { permissionId: 'reports.view', scope: 'all' },
      { permissionId: 'accounting.view', scope: 'all' },
      { permissionId: 'garage.view', scope: 'all' },
      { permissionId: 'settings.view', scope: 'all' },`
);

fs.writeFileSync('server/rbac/permissions.ts', content);
