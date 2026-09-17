import { getDbPool } from '../db.js';
import { ALL_PERMISSIONS, DEFAULT_ROLES } from './permissions.js';
import type { PermissionDefinition, PermissionScope, RoleDefinition } from './types.js';

let CACHED_ROLES: Map<string, RoleDefinition> = new Map();
let CACHED_PERMISSIONS: Map<string, PermissionDefinition> = new Map();
let IS_INITIALIZED = false;

export async function initializeRbacStore(): Promise<void> {
  ALL_PERMISSIONS.forEach(p => CACHED_PERMISSIONS.set(p.id, p));
  DEFAULT_ROLES.forEach(r => CACHED_ROLES.set(r.id, r));

  try {
    const pool = await getDbPool();
    if (!pool) {
      IS_INITIALIZED = true;
      return;
    }

    const connection = await pool.getConnection();
    try {
      await connection.query(`CREATE TABLE IF NOT EXISTS rbac_roles (id VARCHAR(50) PRIMARY KEY, name VARCHAR(100) NOT NULL, description TEXT, is_system BOOLEAN DEFAULT TRUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      await connection.query(`CREATE TABLE IF NOT EXISTS rbac_permissions (id VARCHAR(100) PRIMARY KEY, module VARCHAR(50) NOT NULL, action VARCHAR(50) NOT NULL, name VARCHAR(100) NOT NULL, description TEXT, risk_level VARCHAR(20) DEFAULT 'low', created_at DATETIME DEFAULT CURRENT_TIMESTAMP) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      await connection.query(`CREATE TABLE IF NOT EXISTS rbac_role_permissions (role_id VARCHAR(50) NOT NULL, permission_id VARCHAR(100) NOT NULL, scope VARCHAR(20) DEFAULT 'all', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (role_id, permission_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      await connection.query(`CREATE TABLE IF NOT EXISTS rbac_user_overrides (user_id INT NOT NULL, permission_id VARCHAR(100) NOT NULL, effect VARCHAR(10) NOT NULL, scope VARCHAR(20) DEFAULT 'branch', created_at DATETIME DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (user_id, permission_id)) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);
      await connection.query(`CREATE TABLE IF NOT EXISTS security_audit_logs (id BIGINT AUTO_INCREMENT PRIMARY KEY, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP, user_id INT NULL, username VARCHAR(100) NULL, user_role VARCHAR(50) NULL, action VARCHAR(100) NOT NULL, permission_used VARCHAR(100) NULL, resource VARCHAR(100) NOT NULL, resource_id VARCHAR(100) NULL, scope_applied VARCHAR(50) NULL, status VARCHAR(20) NOT NULL, reason TEXT NULL, ip_address VARCHAR(45) NULL, user_agent TEXT NULL, before_state JSON NULL, after_state JSON NULL) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`);

      for (const p of ALL_PERMISSIONS) {
        await connection.query(`INSERT INTO rbac_permissions (id, module, action, name, description, risk_level) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name)`, [p.id, p.module, p.action, p.name, p.description, p.riskLevel]);
      }

      const [roleCountRows]: any = await connection.query('SELECT COUNT(*) as count FROM rbac_roles');
      if (roleCountRows[0].count === 0) {
        for (const r of DEFAULT_ROLES) {
          await connection.query(`INSERT INTO rbac_roles (id, name, description, is_system) VALUES (?, ?, ?, ?)`, [r.id, r.name, r.description, r.isSystem]);
          for (const perm of r.permissions) {
            await connection.query(`INSERT INTO rbac_role_permissions (role_id, permission_id, scope) VALUES (?, ?, ?)`, [r.id, perm.permissionId, perm.scope]);
          }
        }
      }
      
      const [roleRows]: any = await connection.query('SELECT * FROM rbac_roles');
      const [linkRows]: any = await connection.query('SELECT * FROM rbac_role_permissions');
      const newRolesMap = new Map<string, RoleDefinition>();

      for (const r of roleRows) {
        const rolePerms = linkRows.filter((l: any) => l.role_id === r.id).map((l: any) => ({ permissionId: l.permission_id, scope: l.scope || 'all' }));
        newRolesMap.set(r.id, { id: r.id, name: r.name, description: r.description || '', isSystem: Boolean(r.is_system), permissions: rolePerms });
      }
      DEFAULT_ROLES.forEach(def => { if (!newRolesMap.has(def.id)) newRolesMap.set(def.id, def); });
      CACHED_ROLES = newRolesMap;
    } finally {
      connection.release();
    }
  } catch (err: any) {
    // console.warn('RBAC DB initialization failed, falling back to memory', err.message);
  }
  IS_INITIALIZED = true;
}

export async function resolveUserPermissions(userId: string, roleId: string): Promise<Map<string, PermissionScope>> {
  if (!IS_INITIALIZED) await initializeRbacStore();
  const effectivePermissions = new Map<string, PermissionScope>();
  const role = CACHED_ROLES.get(roleId.toLowerCase());
  if (role) {
    for (const p of role.permissions) effectivePermissions.set(p.permissionId, p.scope);
  }
  try {
    const pool = await getDbPool();
    if (pool && !isNaN(Number(userId))) {
      const [overrides]: any = await pool.query('SELECT permission_id, effect, scope FROM rbac_user_overrides WHERE user_id = ?', [Number(userId)]);
      for (const ov of overrides) {
        if (ov.effect === 'deny') effectivePermissions.delete(ov.permission_id);
        else if (ov.effect === 'grant') effectivePermissions.set(ov.permission_id, ov.scope || 'branch');
      }
    }
  } catch (err) { }
  return effectivePermissions;
}

export async function getAllRoles(): Promise<RoleDefinition[]> {
  if (!IS_INITIALIZED) await initializeRbacStore();
  return Array.from(CACHED_ROLES.values());
}
