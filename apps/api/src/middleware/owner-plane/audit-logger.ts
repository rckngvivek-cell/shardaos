import type { Request, Response, NextFunction } from 'express';
import type { PlatformAuthUser, AuditAction, AuditLog } from '@school-erp/shared';
import { getFirestoreDb } from '../../lib/firebase.js';
import { logger } from '../../lib/logger.js';

const log = logger('audit');

/**
 * Records every owner action to the `platform_audit_log` Firestore collection.
 * This middleware runs AFTER owner-auth, so platformUser is guaranteed set.
 *
 * Also provides a helper `req.audit()` to log specific actions from controllers.
 */
export function auditLogger(req: Request, res: Response, next: NextFunction): void {
  const platformUser = (req as Request & { platformUser?: PlatformAuthUser }).platformUser;
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? 'unknown';
  const userAgent = req.headers['user-agent'] ?? 'unknown';

  // Attach audit helper to request
  req.audit = async (action, targetType, targetId, metadata) =>
    recordAudit(req, action, targetType, targetId, metadata);

  // Log the raw request for every admin endpoint (auto-audit)
  const autoAction = mapMethodToAction(req.method, req.path);
  if (autoAction && platformUser) {
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
      },
    };

    // Fire-and-forget write — don't block the request
    writeAuditLog(entry).catch((err) =>
      log.error('Failed to write audit log', { error: String(err) })
    );
  }

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
    const db = getFirestoreDb();
    await db.collection('platform_audit_log').add(entry);
  } catch (err) {
    // Structured logging — DO NOT throw; audit failures must not crash requests
    log.error('Audit write failed', { error: String(err), action: entry.action });
  }
}

function mapMethodToAction(method: string, path: string): AuditAction | null {
  if (path.includes('/employees') && method === 'POST') return 'EMPLOYEE_CREATED';
  if (path.includes('/employees') && method === 'DELETE') return 'EMPLOYEE_DEACTIVATED';
  if (path.includes('/approvals') && path.includes('/approve') && method === 'POST') return 'APPROVAL_GRANTED';
  if (path.includes('/approvals') && path.includes('/deny') && method === 'POST') return 'APPROVAL_DENIED';
  if (path.includes('/schools') && method === 'POST') return 'SCHOOL_ONBOARDED';
  if (path.includes('/settings') && method === 'PUT') return 'SETTINGS_CHANGED';
  return null;
}
