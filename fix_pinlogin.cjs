const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

const oldPinSuccess = `
      if (rows && rows.length > 0) {
        const user = rows[0];
        return res.json({
          success: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
            branch: user.branch || 'Nairobi HQ & Central Warehouse',
          }
        });
      }
`;

const newPinSuccess = `
      if (rows && rows.length > 0) {
        const user = rows[0];
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

        return res.json({
          success: true,
          token,
          permissions: Object.fromEntries(perms),
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.full_name,
            branch: user.branch || 'Nairobi HQ & Central Warehouse',
          }
        });
      }
`;

content = content.replace(oldPinSuccess, newPinSuccess);
fs.writeFileSync('server/routes.ts', content);
