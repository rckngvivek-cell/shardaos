import type { NextFunction, Request, Response } from 'express';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import type { AuthUser } from './auth.types.js';

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return;
  }

  initializeApp({
    projectId: env.requireFirebaseProjectId(),
    credential:
      process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
        ? cert({
            projectId: env.requireFirebaseProjectId(),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          })
        : undefined,
  });
}

function readDevUser(request: Request): AuthUser {
  const schoolId =
    request.header('x-school-id') ?? request.params.schoolId ?? 'demo-school';

  return {
    uid: request.header('x-user-id') ?? 'dev-admin',
    email: request.header('x-user-email') ?? 'admin@demo.school',
    role: request.header('x-user-role') ?? 'admin',
    schoolId,
  };
}

async function readFirebaseUser(request: Request): Promise<AuthUser> {
  const authorization = request.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Missing bearer token');
  }

  initFirebaseAdmin();
  const token = authorization.slice('Bearer '.length);
  const decoded = await getAuth().verifyIdToken(token);

  return {
    uid: decoded.uid,
    email: decoded.email,
    role: String(decoded.role ?? 'user'),
    schoolId: String(decoded.school_id ?? request.params.schoolId ?? ''),
  };
}

export async function requireAuth(
  request: Request,
  _response: Response,
  next: NextFunction,
) {
  try {
    const user =
      env.authMode === 'firebase'
        ? await readFirebaseUser(request)
        : readDevUser(request);

    if (!user.schoolId) {
      throw new AppError(403, 'FORBIDDEN', 'School scope missing from token');
    }

    request.user = user;
    next();
  } catch (error) {
    next(
      error instanceof AppError
        ? error
        : new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token'),
    );
  }
}
