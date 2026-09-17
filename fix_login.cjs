const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

// The replacement logic to introduce JWTs and RBAC to /auth/login
const oldLoginSuccess = `
        if (isMatch) {
          resetLoginRateLimit(cleanId);
          await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]).catch(() => {});
          return res.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              fullName: user.full_name
            }
          });
        }
`;

const newLoginSuccess = `
        if (isMatch) {
          resetLoginRateLimit(cleanId);
          await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]).catch(() => {});
          
          const token = crypto.randomBytes(32).toString('hex');
          const sessionData = {
            userId: String(user.id),
            username: user.username,
            email: user.email,
            fullName: user.full_name,
            role: user.role || 'cashier',
            branch: user.branch || 'Nairobi HQ & Central Warehouse',
            createdAt: Date.now()
          };
          registerSession(token, sessionData);
          const perms = await resolveUserPermissions(sessionData.userId, sessionData.role);
          const permissionsObj = Object.fromEntries(perms);

          recordAuditLog({
             userId: String(user.id), username: user.username, userRole: user.role,
             action: 'login', resource: 'auth', status: 'allowed'
          });

          return res.json({
            success: true,
            token,
            permissions: permissionsObj,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              fullName: user.full_name
            }
          });
        }
`;

content = content.replace(oldLoginSuccess, newLoginSuccess);
fs.writeFileSync('server/routes.ts', content);
