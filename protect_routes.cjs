const fs = require('fs');
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Config
content = content.replace("router.get('/config/smtp', (req, res)", "router.get('/config/smtp', authenticateToken, requirePermission('settings.view'), (req, res)");
content = content.replace("router.post('/config/smtp/test', async (req, res)", "router.post('/config/smtp/test', authenticateToken, requirePermission('smtp.manage'), async (req, res)");
content = content.replace("router.post('/config/smtp/update', (req, res)", "router.post('/config/smtp/update', authenticateToken, requirePermission('smtp.manage'), (req, res)");
content = content.replace("router.get('/db/status', async (req, res)", "router.get('/db/status', authenticateToken, requirePermission('settings.view'), async (req, res)");
content = content.replace("router.post('/db/seed', async (req, res)", "router.post('/db/seed', authenticateToken, requirePermission('db.manage'), async (req, res)");

// Data GETs
content = content.replace("router.get('/products', async (req, res)", "router.get('/products', authenticateToken, requirePermission('inventory.view'), async (req, res)");
content = content.replace("router.get('/customers', async (req, res)", "router.get('/customers', authenticateToken, requirePermission('customers.view'), async (req, res)");
content = content.replace("router.get('/accounting/accounts', async (req, res)", "router.get('/accounting/accounts', authenticateToken, requirePermission('accounting.view'), async (req, res)");
content = content.replace("router.get('/garage/branches', async (req, res)", "router.get('/garage/branches', authenticateToken, requirePermission('garage.view'), async (req, res)");

// Users
content = content.replace("router.get('/users', async (req, res)", "router.get('/users', authenticateToken, requirePermission('users.view'), async (req, res)");
content = content.replace("router.post('/users', async (req, res)", "router.post('/users', authenticateToken, requirePermission('users.create'), preventPrivilegeEscalation, async (req, res)");
content = content.replace("router.put('/users/:id', async (req, res)", "router.put('/users/:id', authenticateToken, requirePermission('users.edit'), preventPrivilegeEscalation, async (req, res)");
content = content.replace("router.delete('/users/:id', async (req, res)", "router.delete('/users/:id', authenticateToken, requirePermission('users.disable'), preventPrivilegeEscalation, async (req, res)");

// Integrations
content = content.replace("router.get('/integrations/status', (req, res)", "router.get('/integrations/status', authenticateToken, requirePermission('integrations.view'), (req, res)");
content = content.replace("router.post('/integrations/config', (req, res)", "router.post('/integrations/config', authenticateToken, requirePermission('integrations.manage'), (req, res)");
content = content.replace("router.post('/integrations/mpesa/stkpush', async (req, res)", "router.post('/integrations/mpesa/stkpush', authenticateToken, requirePermission('pos.create_sale'), async (req, res)");
content = content.replace("router.post('/integrations/mpesa/query', async (req, res)", "router.post('/integrations/mpesa/query', authenticateToken, requirePermission('pos.create_sale'), async (req, res)");

// eTIMS
content = content.replace("router.post('/integrations/kra/handshake', async (req, res)", "router.post('/integrations/kra/handshake', authenticateToken, requirePermission('integrations.manage'), async (req, res)");
content = content.replace("router.post('/integrations/kra/sign', async (req, res)", "router.post('/integrations/kra/sign', authenticateToken, requirePermission('pos.create_sale'), async (req, res)");

fs.writeFileSync('server/routes.ts', content);
