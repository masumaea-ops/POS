const fs = require('fs');
let content = fs.readFileSync('contexts/AuthContext.tsx', 'utf8');

// Update AuthContextType interface to include serverPermissions
content = content.replace(
  "export interface AuthContextType {",
  "export interface AuthContextType {\n  serverPermissions?: Record<string, string>;"
);

// Add state for serverPermissions
content = content.replace(
  "const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {",
  "const [serverPermissions, setServerPermissions] = useState<Record<string, string>>(() => {\n    try {\n      const p = localStorage.getItem('masuma_server_permissions');\n      if (p) return JSON.parse(p);\n    } catch (e) {}\n    return {};\n  });\n\n  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {"
);

// Update login to save token and permissions
const oldLogin = `
  const login = (user: SystemUser) => {
    setPrimaryUser(user);
    setSimulatedRole(null);
    setIsAuthenticated(true);
    localStorage.setItem('masuma_primary_user', JSON.stringify(user));
    localStorage.setItem('masuma_current_user', JSON.stringify(user));
    sessionStorage.setItem('masuma_auth_active', 'true');
    sessionStorage.removeItem('masuma_simulated_role');
  };
`;

const newLogin = `
  const login = (user: SystemUser, token?: string, permissions?: Record<string, string>) => {
    setPrimaryUser(user);
    setSimulatedRole(null);
    setIsAuthenticated(true);
    localStorage.setItem('masuma_primary_user', JSON.stringify(user));
    localStorage.setItem('masuma_current_user', JSON.stringify(user));
    sessionStorage.setItem('masuma_auth_active', 'true');
    sessionStorage.removeItem('masuma_simulated_role');
    
    if (token) {
      localStorage.setItem('masuma_auth_token', token);
    }
    if (permissions) {
      setServerPermissions(permissions);
      localStorage.setItem('masuma_server_permissions', JSON.stringify(permissions));
    }
  };
`;
content = content.replace(oldLogin, newLogin);

// Update logout
const oldLogout = `
    try {
      localStorage.removeItem('masuma_primary_user');
      localStorage.removeItem('masuma_current_user');
    } catch (_) {}
`;
const newLogout = `
    try {
      localStorage.removeItem('masuma_primary_user');
      localStorage.removeItem('masuma_current_user');
      localStorage.removeItem('masuma_auth_token');
      localStorage.removeItem('masuma_server_permissions');
    } catch (_) {}
    setServerPermissions({});
`;
content = content.replace(oldLogout, newLogout);

// Expose serverPermissions in provider
content = content.replace(
  "value={{",
  "value={{\n        serverPermissions,"
);

fs.writeFileSync('contexts/AuthContext.tsx', content);
