import express from 'express';
import request from 'supertest';

const mockGetSessionFromAccessToken = jest.fn();
const mockGetAccessTokenPayload = jest.fn();
const mockFindByUid = jest.fn();

jest.mock('../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getSessionFromAccessToken: mockGetSessionFromAccessToken,
    getAccessTokenPayload: mockGetAccessTokenPayload,
  })),
}));

jest.mock('../../src/modules/owner-plane/employees/employee.repository.js', () => ({
  EmployeeRepository: jest.fn().mockImplementation(() => ({
    findByUid: mockFindByUid,
  })),
}));

import { env } from '../../src/config/env.js';
import { errorHandler } from '../../src/middleware/error-handler.js';
import { ownerAuthMiddleware } from '../../src/middleware/owner-plane/owner-auth.js';

describe('ownerAuthMiddleware', () => {
  const mutableEnv = env as unknown as {
    AUTH_MODE: 'dev' | 'jwt';
    NODE_ENV: string;
    ADMIN_MFA_REQUIRED: boolean;
  };
  const originalAuthMode = env.AUTH_MODE;
  const originalNodeEnv = env.NODE_ENV;
  const originalAdminMfaRequired = env.ADMIN_MFA_REQUIRED;

  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.AUTH_MODE = 'jwt';
    mutableEnv.NODE_ENV = 'test';
    mutableEnv.ADMIN_MFA_REQUIRED = false;

    mockGetAccessTokenPayload.mockResolvedValue({
      sub: 'employee-1',
      email: 'staff@example.com',
      role: 'employee',
      plane: 'platform',
      sid: 'session-1',
      typ: 'access',
      iat: Math.floor(Date.now() / 1000),
    });
  });

  afterAll(() => {
    mutableEnv.AUTH_MODE = originalAuthMode;
    mutableEnv.NODE_ENV = originalNodeEnv;
    mutableEnv.ADMIN_MFA_REQUIRED = originalAdminMfaRequired;
  });

  function createTestApp() {
    const app = express();
    app.get('/secure', ownerAuthMiddleware, (req, res) => {
      res.json({ role: req.platformUser?.role, email: req.platformUser?.email });
    });
    app.use(errorHandler);
    return app;
  }

  it('rejects inactive employee records', async () => {
    mockGetSessionFromAccessToken.mockResolvedValue({
      uid: 'employee-2',
      email: 'inactive@example.com',
      role: 'employee',
      plane: 'platform',
      schoolId: '',
    });
    mockGetAccessTokenPayload.mockResolvedValue({
      sub: 'employee-2',
      email: 'inactive@example.com',
      role: 'employee',
      plane: 'platform',
      sid: 'session-2',
      typ: 'access',
      iat: Math.floor(Date.now() / 1000),
    });
    mockFindByUid.mockResolvedValue({
      id: 'employee-2',
      uid: 'employee-2',
      email: 'inactive@example.com',
      displayName: 'Inactive User',
      role: 'employee',
      department: 'Support',
      isActive: false,
      emailVerified: true,
      mfaEnabled: false,
      authProviderDisabled: false,
      platformAccessActive: false,
      lastLoginAt: '',
      lastSyncedAt: '2026-04-16T10:00:00.000Z',
      createdAt: '2026-04-15T10:00:00.000Z',
      updatedAt: '2026-04-16T10:00:00.000Z',
      onboardedBy: 'owner-1',
    });

    const response = await request(createTestApp())
      .get('/secure')
      .set('Authorization', 'Bearer employee-token');

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      error: {
        code: 'EMPLOYEE_ACCESS_DISABLED',
        message: 'Platform employee access is disabled',
      },
    });
  });

  it('allows active platform employees through the owner auth boundary', async () => {
    mockGetSessionFromAccessToken.mockResolvedValue({
      uid: 'employee-3',
      email: 'active@example.com',
      role: 'employee',
      plane: 'platform',
      schoolId: '',
    });
    mockGetAccessTokenPayload.mockResolvedValue({
      sub: 'employee-3',
      email: 'active@example.com',
      role: 'employee',
      plane: 'platform',
      sid: 'session-3',
      typ: 'access',
      iat: Math.floor(Date.now() / 1000),
    });
    mockFindByUid.mockResolvedValue({
      id: 'employee-3',
      uid: 'employee-3',
      email: 'active@example.com',
      displayName: 'Active User',
      role: 'employee',
      department: 'Operations',
      isActive: true,
      emailVerified: true,
      mfaEnabled: true,
      authProviderDisabled: false,
      platformAccessActive: true,
      lastLoginAt: '2026-04-16T10:00:00.000Z',
      lastSyncedAt: '2026-04-16T10:05:00.000Z',
      createdAt: '2026-04-15T10:00:00.000Z',
      updatedAt: '2026-04-16T10:05:00.000Z',
      onboardedBy: 'owner-1',
    });

    const response = await request(createTestApp())
      .get('/secure')
      .set('Authorization', 'Bearer employee-token');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      role: 'employee',
      email: 'active@example.com',
    });
  });

  it('allows local owner fallback when auth mode is dev and no bearer token is present', async () => {
    mutableEnv.AUTH_MODE = 'dev';

    const response = await request(createTestApp()).get('/secure');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      role: 'owner',
      email: expect.stringContaining('@'),
    });
    expect(mockGetSessionFromAccessToken).not.toHaveBeenCalled();
  });
}
