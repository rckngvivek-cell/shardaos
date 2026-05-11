import type { Request, Response, NextFunction } from 'express';
import type { PlatformAuthUser, AuditAction, AuditLog } from '@school-erp/shared';
import { getDocumentStore } from '../../lib/document-store.js';
import { logger } from '../../lib/logger.js';

const log = logger('audit');

/**
 * Records every owner action to the `platform_audit_log` document collection.
 * This middleware runs AFTER owner-auth, so platformUser is guaranteed set.
 *
 * Also provides a helper `req.audit()` to log specific actions from controllers.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const platformUser = (req as Request & { platformUser?: PlatformAuthUser }).platformUser;
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? 'unknown';
  let controllerAuditRecorded = false;

  // Attach audit helper to request
  req.audit = async (action, targetType, targetId, metadata) => {
    controllerAuditRecorded = true;
    await recordAudit(req, action, targetType, targetId, metadata);
  };

  // Fall back to a generic request-level audit entry only when the controller
  // did not record a more specific action. This keeps the timeline accurate and
  // prevents double-counting employee and approval mutations.
  const autoAction = mapMethodToAction(req.method, req.path);
  res.on('finish', () => {
    if (!autoAction || !platformUser || controllerAuditRecorded || res.statusCode >= 400) {
      return;
    }

    const entry: Omit<AuditLog, 'id'> = {
      action: autoAction,
      performedBy: platformUser.uid,
      performedByEmail: platformUser.email,
      performedByRole: platformUser.role,
      ipAddress: clientIp,
      userAgent,
      timestamp: new Date().toISOString(),
      metadata: {
        method: req.method,
        path: req.path,
        requestId: req.requestId,
        statusCode: res.statusCode,
      },
    };

    void writeAuditLog(entry).catch((err) =>
      log.error('Failed to write audit log', { error: String(err) })
    );
  });

  next();
}

/** Controller-callable audit recorder */
async function recordAudit(
  req: Request,
  action: AuditAction,
  targetType?: AuditLog['targetType'],
  targetId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const platformUser = (req as Request & { platformUser?: PlatformAuthUser }).platformUser;
  if (!platformUser) return;

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';

  await writeAuditLog({
    action,
    performedBy: platformUser.uid,
    performedByEmail: platformUser.email,
    performedByRole: platformUser.role,
    targetType,
    targetId,
    metadata,
    ipAddress: clientIp,
    userAgent: req.headers['user-agent'] ?? 'unknown',
    timestamp: new Date().toISOString(),
  });
}

async function writeAuditLog(entry: Omit<AuditLog, 'id'>): Promise<void> {
  try {
    const db = getDocumentStore();
    await db.collection('platform_audit_log').add(entry);
  } catch (err) {
    // Structured logging — DO NOT throw; audit failures must not crash requests
    log.error('Audit write failed', { error: String(err), action: entry.action });
  }
}

function mapMethodToAction(method: string, path: string): AuditAction | null {
  if (path.includes('/employees/') && path.endsWith('/activate') && method === 'POST') return 'EMPLOYEE_REACTIVATED';
  if (path.includes('/employees/') && path.endsWith('/sync') && method === 'POST') return 'EMPLOYEE_UPDATED';
  if (path.includes('/employees/') && method === 'PATCH') return 'EMPLOYEE_UPDATED';
  if (path === '/employees' && method === 'POST') return 'EMPLOYEE_CREATED';
  if (path.includes('/employees') && method === 'DELETE') return 'EMPLOYEE_DEACTIVATED';
  if (path.includes('/approvals') && path.includes('/approve') && method === 'POST') return 'APPROVAL_GRANTED';
  if (path.includes('/approvals') && path.includes('/deny') && method === 'POST') return 'APPROVAL_DENIED';
  if (path.includes('/schools') && method === 'POST') return 'SCHOOL_ONBOARDED';
  if (path.includes('/settings') && method === 'PUT') return 'SETTINGS_CHANGED';
  return null;
}
