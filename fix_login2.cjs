const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

const oldAdminSuccess = `
          return res.json({
            success: true,
            user: {
              id: 1,
              username: cleanId.includes('@') ? cleanId.split('@')[0] : 'admin',
              email: cleanId.includes('@') ? cleanId : 'admin@masuma.co.ke',
              role: 'admin',
              fullName: 'System Administrator'
            }
          });
`;

const newAdminSuccess = `
          const token = crypto.randomBytes(32).toString('hex');
          const sessionData = {
            userId: '1',
            username: cleanId.includes('@') ? cleanId.split('@')[0] : 'admin',
            email: cleanId.includes('@') ? cleanId : 'admin@masuma.co.ke',
            fullName: 'System Administrator',
            role: 'admin',
            branch: 'Nairobi HQ & Central Warehouse',
            createdAt: Date.now()
          };
          registerSession(token, sessionData);
          const perms = await resolveUserPermissions(sessionData.userId, sessionData.role);

          return res.json({
            success: true,
            token,
            permissions: Object.fromEntries(perms),
            user: {
              id: 1,
              username: sessionData.username,
              email: sessionData.email,
              role: 'admin',
              fullName: 'System Administrator'
            }
          });
`;

content = content.replace(oldAdminSuccess, newAdminSuccess);
fs.writeFileSync('server/routes.ts', content);
