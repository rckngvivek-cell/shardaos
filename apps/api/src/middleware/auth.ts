import type { Request, Response, NextFunction } from 'express';
import type { TenantAuthUser } from '@school-erp/shared';
import { isTenantRole } from '@school-erp/shared';
import { env } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';
import { AuthService } from '../modules/auth/auth.service.js';

const log = logger('auth');
const authService = new AuthService();

declare global {
  namespace Express {
    interface Request {
      user?: TenantAuthUser;
      requestId?: string;
    }
  }
}

export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (env.AUTH_MODE === 'dev') {
      const roleHeader = typeof req.headers['x-dev-role'] === 'string'
        ? req.headers['x-dev-role'].trim().toLowerCase()
        : '';
      const schoolIdHeader = typeof req.headers['x-school-id'] === 'string'
        ? req.headers['x-school-id'].trim()
        : '';
      const emailHeader = typeof req.headers['x-dev-email'] === 'string'
        ? req.headers['x-dev-email'].trim().toLowerCase()
        : '';
      const uidHeader = typeof req.headers['x-dev-uid'] === 'string'
        ? req.headers['x-dev-uid'].trim()
        : '';

      // Local tenant development must preserve the employee role selected in
      // the browser so the full request path reflects the correct workspace.
      req.user = {
        uid: uidHeader || 'dev-user-001',
        email: emailHeader || 'admin@dev.school',
        role: isTenantRole(roleHeader) ? roleHeader : 'school_admin',
        schoolId: schoolIdHeader || 'dev-school-001',
        plane: 'tenant',
      };
      return next();
    }

    const sessionUser = await authService.getSessionFromAccessToken(req.headers.authorization);
    if (sessionUser.plane !== 'tenant') {
      throw new AppError(403, 'TENANT_ONLY', 'Tenant authentication required');
    }

    const schoolId = sessionUser.schoolId;
    if (!schoolId) {
      throw new AppError(403, 'SCHOOL_SCOPE_MISSING', 'Token must include school scope');
    }

    const role = isTenantRole(sessionUser.role) ? sessionUser.role : 'student';

    req.user = {
      uid: sessionUser.uid,
      email: sessionUser.email,
      role,
      schoolId,
      plane: 'tenant',
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    log.error('Auth verification failed', { error: String(error) });
    next(new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'));
  }
}
