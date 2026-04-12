import type { Request, Response, NextFunction } from 'express';
import type { TenantAuthUser } from '@school-erp/shared';
import { isTenantRole } from '@school-erp/shared';
import { env } from '../config/env.js';
import { getFirebaseAuth } from '../lib/firebase.js';
import { AppError } from '../errors/app-error.js';
import { logger } from '../lib/logger.js';

const log = logger('auth');

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
      req.user = {
        uid: 'dev-user-001',
        email: 'admin@dev.school',
        role: 'school_admin',
        schoolId: 'dev-school-001',
        plane: 'tenant',
      };
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    const auth = getFirebaseAuth();
    const decoded = await auth.verifyIdToken(token);

    const schoolId = decoded.schoolId ?? decoded.school_id ?? req.headers['x-school-id'];
    if (!schoolId || typeof schoolId !== 'string') {
      throw new AppError(403, 'SCHOOL_SCOPE_MISSING', 'Token must include schoolId claim');
    }

    const claimRole = typeof decoded.role === 'string' ? decoded.role : undefined;
    const role = claimRole && isTenantRole(claimRole) ? claimRole : 'student';

    req.user = {
      uid: decoded.uid,
      email: decoded.email,
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
