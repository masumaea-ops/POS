const fs = require('fs');
let content = fs.readFileSync('server/rbac/store.ts', 'utf-8');

// Replace the count check with a forced upsert for permissions to ensure new permissions get linked
content = content.replace(
  `const [roleCountRows]: any = await connection.query('SELECT COUNT(*) as count FROM rbac_roles');
      if (roleCountRows[0].count === 0) {
        for (const r of DEFAULT_ROLES) {
          await connection.query(\`INSERT INTO rbac_roles (id, name, description, is_system) VALUES (?, ?, ?, ?)\`, [r.id, r.name, r.description, r.isSystem]);
          for (const perm of r.permissions) {
            await connection.query(\`INSERT INTO rbac_role_permissions (role_id, permission_id, scope) VALUES (?, ?, ?)\`, [r.id, perm.permissionId, perm.scope]);
          }
        }
      }`,
  `// Force sync default roles and their permissions
      for (const r of DEFAULT_ROLES) {
        await connection.query(\`INSERT INTO rbac_roles (id, name, description, is_system) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=VALUES(name)\`, [r.id, r.name, r.description, r.isSystem]);
        for (const perm of r.permissions) {
          await connection.query(\`INSERT IGNORE INTO rbac_role_permissions (role_id, permission_id, scope) VALUES (?, ?, ?)\`, [r.id, perm.permissionId, perm.scope]);
        }
      }`
);

fs.writeFileSync('server/rbac/store.ts', content);
