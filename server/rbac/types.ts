export type PermissionScope = 'own' | 'branch' | 'warehouse' | 'all';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PermissionDefinition {
  id: string;
  module: string;
  action: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
}

export interface RolePermissionAssignment {
  roleId: string;
  permissionId: string;
  scope: PermissionScope;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: {
    permissionId: string;
    scope: PermissionScope;
  }[];
}

export interface AuthenticatedUserContext {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  branch: string;
  permissions: Map<string, PermissionScope>; // permissionId -> scope
  isSuperAdmin: boolean;
}

export interface AuditLogEntry {
  id?: number | string;
  timestamp: string;
  userId?: string | null;
  username?: string | null;
  userRole?: string | null;
  action: string;
  permissionUsed?: string | null;
  resource: string;
  resourceId?: string | null;
  scopeApplied?: string | null;
  status: 'allowed' | 'denied' | 'error';
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeState?: any;
  afterState?: any;
}
