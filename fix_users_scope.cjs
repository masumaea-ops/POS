const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

const oldUsersGet = `
        const [rows]: any = await pool.query(
          'SELECT id, username, email, full_name as fullName, role, pin_code as pinCode, is_active as isActive, last_login as lastLogin, created_at as createdAt FROM users ORDER BY id ASC'
        );
`;

const newUsersGet = `
        const scope = req.user?.permissions.get('users.view');
        let query = 'SELECT id, username, email, full_name as fullName, role, branch, pin_code as pinCode, is_active as isActive, last_login as lastLogin, created_at as createdAt FROM users';
        const params = [];
        if (scope === 'branch' && req.user?.branch) {
          query += ' WHERE branch = ?';
          params.push(req.user.branch);
        } else if (scope === 'own') {
          query += ' WHERE id = ?';
          params.push(req.user?.id);
        }
        query += ' ORDER BY id ASC';
        const [rows]: any = await pool.query(query, params);
`;

content = content.replace(oldUsersGet, newUsersGet);
fs.writeFileSync('server/routes.ts', content);
