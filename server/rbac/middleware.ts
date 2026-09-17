import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedUserContext, PermissionScope } from './types.js';
export interface ResourceScopeTarget { ownerId?: string | number; branch?: string; warehouse?: string; }
import { resolveUserPermissions } from './store.js';
import { recordAuditLog } from './audit.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserContext;
    }
  }
}

export interface SessionData {
  userId: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  branch: string;
  createdAt: number;
}

export const activeAuthSessions = new Map<string, SessionData>();

export function registerSession(token: string, data: SessionData): void {
  activeAuthSessions.set(token, data);
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.startsWith('Bearer ')) ? authHeader.substring(7).trim() : (req.headers['x-auth-token'] as string || '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Missing token.' });
  }

  const session = activeAuthSessions.get(token);
  if (!session) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }

  try {
    const permissions = await resolveUserPermissions(session.userId, session.role);
    req.user = {
      id: session.userId,
      username: session.username,
      email: session.email,
      fullName: session.fullName,
      role: session.role,
      branch: session.branch || 'Nairobi HQ & Central Warehouse',
      permissions,
      isSuperAdmin: session.role === 'admin'
    };
    next();
  } catch (err: any) {
    return res.status(500).json({ success: false, message: 'Internal authorization evaluation failure.' });
  }
}

export function requirePermission(permissionId: string, scopeExtractor?: (req: Request) => ResourceScopeTarget | Promise<ResourceScopeTarget>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });

    const userScope = req.user.permissions.get(permissionId);
    if (!userScope) {
      await recordAuditLog({ userId: req.user.id, username: req.user.username, userRole: req.user.role, action: 'permission_check', permissionUsed: permissionId, resource: req.baseUrl + req.path, status: 'denied', reason: `Lacking permission: ${permissionId}` });
      return res.status(403).json({ success: false, message: `Access denied. Required permission: '${permissionId}'` });
    }

    if (scopeExtractor) {
      try {
        const target = await scopeExtractor(req);
        if (userScope === 'all') return next();
        if (userScope === 'branch' && target.branch && target.branch !== req.user.branch) {
          return res.status(403).json({ success: false, message: `Access restricted to branch: '${req.user.branch}'` });
        }
        if (userScope === 'own' && target.ownerId && String(target.ownerId) !== String(req.user.id)) {
          return res.status(403).json({ success: false, message: 'Access restricted to your own records.' });
        }
      } catch (err) {
        return res.status(500).json({ success: false, message: 'Scope evaluation failed.' });
      }
    }
    next();
  };
}

export function preventPrivilegeEscalation(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required.' });
  const targetUserId = req.params.id;
  const requestedRole = req.body.role ? String(req.body.role).toLowerCase() : undefined;

  if (targetUserId && String(targetUserId) === String(req.user.id)) {
    if (requestedRole && requestedRole !== req.user.role.toLowerCase()) return res.status(403).json({ success: false, message: 'Cannot change your own security role.' });
    if (req.body.isActive === false) return res.status(403).json({ success: false, message: 'Cannot deactivate your own account.' });
  }

  if (requestedRole === 'admin' && !req.user.isSuperAdmin) {
    return res.status(403).json({ success: false, message: 'Only existing Super Administrators can provision Administrator roles.' });
  }
  next();
}
