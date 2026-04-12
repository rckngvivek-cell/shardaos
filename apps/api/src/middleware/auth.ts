import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';

import { env, type AuthMode } from '../config/env';
import { AppError } from '../lib/app-error';
import { fail } from '../lib/api-response';
import { getFirebaseAuth } from '../lib/firebase';

const PUBLIC_PATHS = new Set(['/api/v1/health']);

type FirebaseDecodedToken = DecodedIdToken & {
  role?: unknown;
};

type FirebaseTokenVerifier = (token: string) => Promise<FirebaseDecodedToken>;

function readBearerToken(req: Request) {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length).trim();
  return token || null;
}

function readMockUser(req: Request, token: string) {
  return {
    uid: token,
    email: req.header('x-user-email') ?? 'demo-admin@schoolerp.local',
    role: req.header('x-user-role') ?? 'school_admin'
  };
}

function buildAuthModeHandler(
  authMode: AuthMode,
  verifyIdToken: FirebaseTokenVerifier
): RequestHandler {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (PUBLIC_PATHS.has(req.path)) {
      next();
      return;
    }

    const token = readBearerToken(req);
    if (!token) {
      fail(res, 401, 'UNAUTHORIZED', 'Missing bearer token', req.requestId);
      return;
    }

    if (authMode === 'mock') {
      req.user = readMockUser(req, token);
      next();
      return;
    }

    try {
      const decoded = await verifyIdToken(token);
      req.user = {
        uid: decoded.uid,
        email: decoded.email,
        role: String(decoded.role ?? 'school_admin')
      };
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(error);
        return;
      }

      fail(res, 401, 'UNAUTHORIZED', 'Invalid or expired token', req.requestId);
    }
  };
}

export function createAuthMiddleware(options: {
  authMode?: AuthMode;
  verifyIdToken?: FirebaseTokenVerifier;
} = {}): RequestHandler {
  return buildAuthModeHandler(
    options.authMode ?? env.AUTH_MODE,
    options.verifyIdToken ?? ((token) => getFirebaseAuth().verifyIdToken(token) as Promise<FirebaseDecodedToken>)
  );
}

export const authMiddleware = createAuthMiddleware();
