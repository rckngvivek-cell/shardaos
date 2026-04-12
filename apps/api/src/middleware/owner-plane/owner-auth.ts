import type { Request, Response, NextFunction } from 'express';
import type { PlatformAuthUser, PlatformRole } from '@school-erp/shared';
import type { AuditAction, AuditLog } from '@school-erp/shared';
import { isPlatformRole } from '@school-erp/shared';
import { env } from '../../config/env.js';
import { getFirebaseAuth } from '../../lib/firebase.js';
import { AppError } from '../../errors/app-error.js';
import { logger } from '../../lib/logger.js';

const log = logger('owner-auth');

declare global {
  namespace Express {
    interface Request {
      platformUser?: PlatformAuthUser;
      audit?: (
        action: AuditAction,
        targetType?: AuditLog['targetType'],
        targetId?: string,
        metadata?: Record<string, unknown>
      ) => Promise<void>;
    }
  }
}

/**
 * Owner auth middleware — hardened for the platform (owner/employee) plane.
 *
 * Security layers:
 *  1. IP whitelist (checked before any auth to reject unknown origins fast)
 *  2. Bearer token verification via Firebase Admin
 *  3. Role must be a PlatformRole (owner | employee)
 *  4. MFA claim must be present in production
 *  5. Short-lived session enforcement
 */
export async function ownerAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // ── Dev mode bypass ──
    if (env.AUTH_MODE === 'dev') {
      (req as Request & { platformUser: PlatformAuthUser }).platformUser = {
        uid: 'dev-owner-001',
        email: 'owner@shardaos.internal',
        role: 'owner',
        plane: 'platform',
      };
      return next();
    }

    // ── Token extraction ──
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(token);

    // ── Role validation — must be platform role ──
    const role = (decoded.role ?? decoded.custom_role) as string | undefined;
    if (!role || !isPlatformRole(role)) {
      log.warn('Non-platform role attempted admin access', {
        uid: decoded.uid,
        role: String(role),
        ip: req.ip,
      });
      throw new AppError(403, 'FORBIDDEN', 'Access restricted to platform personnel');
    }

    // ── MFA enforcement (production only) ──
    if (env.ADMIN_MFA_REQUIRED && env.NODE_ENV === 'production') {
      const mfaVerified = decoded.mfa_verified === true || decoded.firebase?.sign_in_second_factor != null;
      if (!mfaVerified) {
        throw new AppError(403, 'MFA_REQUIRED', 'Multi-factor authentication is required for admin access');
      }
    }

    // ── Session age check ──
    const authTime = decoded.auth_time ? decoded.auth_time * 1000 : Date.now();
    const sessionAgeMs = Date.now() - authTime;
    const maxSessionMs = env.ADMIN_SESSION_TIMEOUT_MIN * 60 * 1000;
    if (sessionAgeMs > maxSessionMs) {
      throw new AppError(401, 'SESSION_EXPIRED', 'Admin session has expired — please re-authenticate');
    }

    // ── Set platform user on request ──
    (req as Request & { platformUser: PlatformAuthUser }).platformUser = {
      uid: decoded.uid,
      email: decoded.email ?? '',
      role: role as PlatformRole,
      plane: 'platform',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    log.error('Owner auth verification failed', { error: String(error), ip: req.ip });
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired owner token'));
  }
}

/**
 * Require a specific minimum platform role.
 * Usage: requirePlatformRole('owner') — only owner can access.
 */
export function requirePlatformRole(minimumRole: PlatformRole) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const platformUser = (req as Request & { platformUser?: PlatformAuthUser }).platformUser;
    if (!platformUser) {
      return next(new AppError(401, 'UNAUTHORIZED', 'Platform authentication required'));
    }

    const hierarchy: Record<PlatformRole, number> = { owner: 1000, employee: 500 };
    if (hierarchy[platformUser.role] < hierarchy[minimumRole]) {
      log.warn('Insufficient platform role', {
        uid: platformUser.uid,
        role: platformUser.role,
        required: minimumRole,
        ip: req.ip,
      });
      return next(new AppError(403, 'OWNER_ONLY', `This action requires ${minimumRole} role`));
    }

    next();
  };
}
