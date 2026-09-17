import type { AuditLogEntry } from './types.js';
import { getDbPool } from '../db.js';

const MEMORY_AUDIT_LOGS: AuditLogEntry[] = [];
const MAX_MEMORY_LOGS = 1000;

export async function recordAuditLog(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<AuditLogEntry> {
  const fullEntry: AuditLogEntry = { ...entry, timestamp: new Date().toISOString() };

  MEMORY_AUDIT_LOGS.unshift(fullEntry);
  if (MEMORY_AUDIT_LOGS.length > MAX_MEMORY_LOGS) { MEMORY_AUDIT_LOGS.pop(); }

  try {
    const pool = await getDbPool();
    if (pool) {
      await pool.query(`
        INSERT INTO security_audit_logs 
        (timestamp, user_id, username, user_role, action, permission_used, resource, resource_id, scope_applied, status, reason, ip_address, user_agent, before_state, after_state)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        new Date(fullEntry.timestamp), fullEntry.userId || null, fullEntry.username || null, fullEntry.userRole || null,
        fullEntry.action, fullEntry.permissionUsed || null, fullEntry.resource, fullEntry.resourceId || null,
        fullEntry.scopeApplied || null, fullEntry.status, fullEntry.reason || null, fullEntry.ipAddress || null,
        fullEntry.userAgent || null, fullEntry.beforeState ? JSON.stringify(fullEntry.beforeState) : null,
        fullEntry.afterState ? JSON.stringify(fullEntry.afterState) : null
      ]);
    }
  } catch (err: any) {
    // console.warn('Audit DB error', err.message);
  }

  if (fullEntry.status === 'denied') {
    console.warn(`[SECURITY DENIED] User: ${fullEntry.username} [${fullEntry.permissionUsed}] - ${fullEntry.reason}`);
  }
  return fullEntry;
}

export async function getAuditLogs(options?: { limit?: number; offset?: number; status?: 'allowed' | 'denied' | 'error'; }): Promise<AuditLogEntry[]> {
  const limit = Math.min(options?.limit || 100, 500);
  const offset = options?.offset || 0;
  
  let filtered = [...MEMORY_AUDIT_LOGS];
  if (options?.status) filtered = filtered.filter(l => l.status === options.status);
  return filtered.slice(offset, offset + limit);
}
