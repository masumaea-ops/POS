const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

const regex = /if \(isMatch\) \{\s*resetLoginRateLimit\(cleanId\);\s*account\.lastLogin = new Date\(\)\.toISOString\(\);\s*return res\.json\(\{\s*success: true,\s*user: \{[^\}]+\}\s*\}\);\s*\}/;

const newBlock = `if (isMatch) {
          resetLoginRateLimit(cleanId);
          account.lastLogin = new Date().toISOString();
          
          const token = crypto.randomBytes(32).toString('hex');
          const sessionData = {
            userId: String(account.id),
            username: account.username,
            email: account.email,
            fullName: account.fullName,
            role: account.role || 'cashier',
            branch: account.branch || 'Nairobi HQ & Central Warehouse',
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
              fullName: account.fullName,
              pinCode: account.pinCode,
              phone: account.phone,
              branch: account.branch,
            }
          });
        }`;

content = content.replace(regex, newBlock);
fs.writeFileSync('server/routes.ts', content);
