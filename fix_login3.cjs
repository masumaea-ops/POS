const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

const oldFallbackSuccess = `
        if (isMatch) {
          resetLoginRateLimit(cleanId);
          account.lastLogin = new Date().toISOString();
          return res.json({
            success: true,
            user: {
              id: account.id,
              username: account.username,
              email: account.email,
              role: account.role,
              fullName: account.fullName
            }
          });
        }
`;

const newFallbackSuccess = `
        if (isMatch) {
          resetLoginRateLimit(cleanId);
          account.lastLogin = new Date().toISOString();
          
          const token = crypto.randomBytes(32).toString('hex');
          const sessionData = {
            userId: String(account.id),
            username: account.username,
            email: account.email,
            fullName: account.fullName,
            role: account.role || 'cashier',
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
              id: account.id,
              username: account.username,
              email: account.email,
              role: account.role,
              fullName: account.fullName
            }
          });
        }
`;

content = content.replace(oldFallbackSuccess, newFallbackSuccess);
fs.writeFileSync('server/routes.ts', content);
