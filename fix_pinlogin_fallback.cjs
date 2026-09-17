const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

const oldFallbackSuccess = `
    if (matched) {
      return res.json({
        success: true,
        user: {
          id: matched.id,
          username: matched.username,
          email: matched.email,
          role: matched.role,
          fullName: matched.fullName,
          branch: 'Nairobi HQ & Central Warehouse',
        }
      });
    }
`;

const newFallbackSuccess = `
    if (matched) {
      const token = crypto.randomBytes(32).toString('hex');
      const sessionData = {
        userId: String(matched.id),
        username: matched.username,
        email: matched.email,
        fullName: matched.fullName,
        role: matched.role || 'cashier',
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
          id: matched.id,
          username: matched.username,
          email: matched.email,
          role: matched.role,
          fullName: matched.fullName,
          branch: 'Nairobi HQ & Central Warehouse',
        }
      });
    }
`;

content = content.replace(oldFallbackSuccess, newFallbackSuccess);
fs.writeFileSync('server/routes.ts', content);
