const fs = require('fs');

// Fix middleware.ts
let mw = fs.readFileSync('server/rbac/middleware.ts', 'utf8');
mw = mw.replace("import type { AuthenticatedUserContext, PermissionScope, ResourceScopeTarget } from './types.js';", "import type { AuthenticatedUserContext, PermissionScope } from './types.js';\nexport interface ResourceScopeTarget { ownerId?: string | number; branch?: string; warehouse?: string; }");
fs.writeFileSync('server/rbac/middleware.ts', mw);

// Fix routes.ts
let rt = fs.readFileSync('server/routes.ts', 'utf8');
rt = rt.replace("  requireSuperAdmin, \n", "");
rt = rt.replace(", updateRolePermissions ", " ");
fs.writeFileSync('server/routes.ts', rt);
