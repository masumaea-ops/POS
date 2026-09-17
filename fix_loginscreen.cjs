const fs = require('fs');
let content = fs.readFileSync('pages/LoginScreen.tsx', 'utf8');

const oldLoginSuccess = `
        const data = await response.json();
        if (response.ok && data.success) {
          authSuccessful = true;
          authenticatedUser = data.user;
        } else if (response.status === 429) {
`;

const newLoginSuccess = `
        const data = await response.json();
        if (response.ok && data.success) {
          authSuccessful = true;
          authenticatedUser = data.user;
          if (data.token) localStorage.setItem('masuma_auth_token', data.token);
          if (data.permissions) localStorage.setItem('masuma_server_permissions', JSON.stringify(data.permissions));
        } else if (response.status === 429) {
`;

content = content.replace(oldLoginSuccess, newLoginSuccess);
fs.writeFileSync('pages/LoginScreen.tsx', content);
