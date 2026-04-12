import type { Request, Response } from 'express';

import { createAuthMiddleware } from '../middleware/auth';
import { getDefaultAuthMode, getDefaultStorageDriver } from '../config/env';
import { AppError } from '../lib/app-error';
import { FirestoreAttendanceRepository } from '../repositories/firestore-attendance-repository';
import { FirestoreStudentRepository } from '../repositories/firestore-student-repository';
import { InMemoryAttendanceRepository } from '../repositories/in-memory-attendance-repository';
import { InMemoryStudentRepository } from '../repositories/in-memory-student-repository';
import {
  createAttendanceRepository,
  createStudentRepository
} from '../repositories/repository-factory';

function createResponseMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis()
  } as unknown as Response;
}

describe('API runtime defaults', () => {
  it('defaults to local auth and memory storage outside production', () => {
    expect(getDefaultAuthMode('development')).toBe('mock');
    expect(getDefaultAuthMode('test')).toBe('mock');
    expect(getDefaultStorageDriver('development')).toBe('memory');
    expect(getDefaultStorageDriver('test')).toBe('memory');
  });

  it('defaults to firebase auth and firestore storage in production', () => {
    expect(getDefaultAuthMode('production')).toBe('firebase');
    expect(getDefaultStorageDriver('production')).toBe('firestore');
  });

  it('creates in-memory repositories for local storage', () => {
    expect(createStudentRepository('memory')).toBeInstanceOf(InMemoryStudentRepository);
    expect(createAttendanceRepository('memory')).toBeInstanceOf(InMemoryAttendanceRepository);
  });

  it('creates firestore repositories when storage is configured for firestore', () => {
    expect(createStudentRepository('firestore')).toBeInstanceOf(FirestoreStudentRepository);
    expect(createAttendanceRepository('firestore')).toBeInstanceOf(FirestoreAttendanceRepository);
  });
});

describe('auth middleware mode split', () => {
  const protectedPath = '/api/v1/schools/demo-school/students';

  function createRequest(token: string, headers: Record<string, string> = {}) {
    return {
      path: protectedPath,
      header(name: string) {
        if (name === 'authorization') {
          return `Bearer ${token}`;
        }

        return headers[name] ?? undefined;
      }
    } as unknown as Request;
  }

  it('uses mock auth without calling the firebase verifier', async () => {
    const verifyIdToken = jest.fn();
    const middleware = createAuthMiddleware({
      authMode: 'mock',
      verifyIdToken
    });
    const req = createRequest('demo-admin-token', {
      'x-user-email': 'admin@example.com',
      'x-user-role': 'principal'
    });
    const res = createResponseMock();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(verifyIdToken).not.toHaveBeenCalled();
    expect((req as Request & { user?: { uid: string; email?: string; role: string } }).user).toEqual(
      {
        uid: 'demo-admin-token',
        email: 'admin@example.com',
        role: 'principal'
      }
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('verifies bearer tokens in firebase mode', async () => {
    const verifyIdToken = jest.fn().mockResolvedValue({
      uid: 'firebase-user',
      email: 'teacher@example.com',
      role: 'teacher'
    });
    const middleware = createAuthMiddleware({
      authMode: 'firebase',
      verifyIdToken
    });
    const req = createRequest('firebase-token');
    const res = createResponseMock();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(verifyIdToken).toHaveBeenCalledWith('firebase-token');
    expect((req as Request & { user?: { uid: string; email?: string; role: string } }).user).toEqual(
      {
        uid: 'firebase-user',
        email: 'teacher@example.com',
        role: 'teacher'
      }
    );
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('surfaces Firebase configuration errors as server errors', async () => {
    const configurationError = new AppError(
      500,
      'FIREBASE_CONFIG_MISSING',
      'FIREBASE_PROJECT_ID must be set when Firebase auth or storage is enabled'
    );
    const verifyIdToken = jest.fn().mockRejectedValue(configurationError);
    const middleware = createAuthMiddleware({
      authMode: 'firebase',
      verifyIdToken
    });
    const req = createRequest('firebase-token');
    const res = createResponseMock();
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith(configurationError);
    expect(res.status).not.toHaveBeenCalled();
  });
});
