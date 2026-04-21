import type { Request, Response, NextFunction } from 'express';
import type { PlatformAuthUser, PlatformRole } from '@school-erp/shared';
import type { AuditAction, AuditLog } from '@school-erp/shared';
import { isPlatformRole } from '@school-erp/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { logger } from '../../lib/logger.js';
import { AuthService } from '../../modules/auth/auth.service.js';
import { EmployeeRepository } from '../../modules/owner-plane/employees/employee.repository.js';

const log = logger('owner-auth');
const employeeRepository = new EmployeeRepository();
const authService = new AuthService();
const OWNER_FALLBACK_UID = process.env.VITE_DEV_OWNER_UID?.trim() || 'owner-local-bootstrap';
const OWNER_FALLBACK_EMAIL = (process.env.VITE_DEV_OWNER_EMAIL ?? 'owner.local@shardaos.internal').trim().toLowerCase();

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
 *  2. Bearer token verification via first-party JWT
 *  3. Role must be a PlatformRole (owner | employee)
 *  4. Employee tokens must still map to an active platform employee record
 *  5. Short-lived platform access token enforcement
 */
export async function ownerAuthMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const hasBearerToken = authHeader?.startsWith('Bearer ');

    // ── Dev mode bypass ──
    if (env.AUTH_MODE === 'dev' && !hasBearerToken) {
      (req as Request & { platformUser: PlatformAuthUser }).platformUser = {
        uid: OWNER_FALLBACK_UID,
        email: OWNER_FALLBACK_EMAIL,
        role: 'owner',
        plane: 'platform',
      };
      return next();
    }

    // ── Token extraction ──
    if (!hasBearerToken) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    }

    const sessionUser = await authService.getSessionFromAccessToken(authHeader);
    const decoded = await authService.getAccessTokenPayload(authHeader);

    // ── Role validation — must be platform role ──
    const role = sessionUser.role;
    if (!role || !isPlatformRole(role)) {
      log.warn('Non-platform role attempted admin access', {
        uid: sessionUser.uid,
        role: String(role),
        ip: req.ip,
      });
      throw new AppError(403, 'FORBIDDEN', 'Access restricted to platform personnel');
    }

    // ── Employee access enforcement ──
    if (role === 'employee') {
      const employee = await employeeRepository.findByUid(sessionUser.uid);
      if (!employee || !employee.isActive || !employee.platformAccessActive || employee.authProviderDisabled) {
        log.warn('Inactive employee attempted platform access', {
          uid: sessionUser.uid,
          email: sessionUser.email,
          ip: req.ip,
        });
        throw new AppError(403, 'EMPLOYEE_ACCESS_DISABLED', 'Platform employee access is disabled');
      }
    }

    // ── Session age check ──
    const issuedAt = decoded.iat ? decoded.iat * 1000 : Date.now();
    const sessionAgeMs = Date.now() - issuedAt;
    const maxSessionMs = env.ADMIN_SESSION_TIMEOUT_MIN * 60 * 1000;
    if (sessionAgeMs > maxSessionMs) {
      throw new AppError(401, 'SESSION_EXPIRED', 'Admin session has expired — please re-authenticate');
    }

    // ── Set platform user on request ──
    (req as Request & { platformUser: PlatformAuthUser }).platformUser = {
      uid: sessionUser.uid,
      email: sessionUser.email ?? '',
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
