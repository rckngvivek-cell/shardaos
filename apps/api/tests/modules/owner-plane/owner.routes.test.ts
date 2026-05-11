import request from 'supertest';

const mockGetSessionFromAccessToken = jest.fn();
const mockGetAccessTokenPayload = jest.fn();
const mockAuditCollectionAdd = jest.fn();
const mockDocumentStore = {
  collection: jest.fn(() => ({
    add: mockAuditCollectionAdd,
  })),
};

const mockGetDashboard = jest.fn();
const mockGetSecurityCenter = jest.fn();

jest.mock('../../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getSessionFromAccessToken: mockGetSessionFromAccessToken,
    getAccessTokenPayload: mockGetAccessTokenPayload,
  })),
}));

jest.mock('../../../src/lib/document-store.js', () => ({
  getDocumentStore: () => mockDocumentStore,
}));

jest.mock('../../../src/modules/owner-plane/owner/owner.service.js', () => ({
  OwnerService: jest.fn().mockImplementation(() => ({
    getProfile: jest.fn(),
    getSummary: jest.fn(),
    getDashboard: mockGetDashboard,
    getSecurityCenter: mockGetSecurityCenter,
  })),
}));

import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';

const app = createApp();
const mutableEnv = env as unknown as {
  AUTH_MODE: 'dev' | 'jwt';
  NODE_ENV: string;
  ADMIN_ALLOWED_IPS: string;
  ADMIN_MFA_REQUIRED: boolean;
};

const originalAuthMode = env.AUTH_MODE;
const originalNodeEnv = env.NODE_ENV;
const originalAdminAllowedIps = env.ADMIN_ALLOWED_IPS;
const originalAdminMfaRequired = env.ADMIN_MFA_REQUIRED;

describe('owner dashboard routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.AUTH_MODE = 'jwt';
    mutableEnv.NODE_ENV = 'test';
    mutableEnv.ADMIN_ALLOWED_IPS = '';
    mutableEnv.ADMIN_MFA_REQUIRED = true;
    mockAuditCollectionAdd.mockResolvedValue(undefined);
    mockGetSessionFromAccessToken.mockResolvedValue({
      uid: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
      schoolId: '',
    });
    mockGetAccessTokenPayload.mockResolvedValue({
      sub: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
      sid: 'owner-session-1',
      typ: 'access',
      iat: Math.floor(Date.now() / 1000),
    });
  });

  afterAll(() => {
    mutableEnv.AUTH_MODE = originalAuthMode;
    mutableEnv.NODE_ENV = originalNodeEnv;
    mutableEnv.ADMIN_ALLOWED_IPS = originalAdminAllowedIps;
    mutableEnv.ADMIN_MFA_REQUIRED = originalAdminMfaRequired;
  });

  it('returns the owner dashboard aggregate contract for authenticated owner requests', async () => {
    mockGetDashboard.mockResolvedValue({
      generatedAt: '2026-04-13T04:00:00.000Z',
      owner: {
        uid: 'owner-uid-1',
        email: 'owner@example.com',
        role: 'owner',
        plane: 'platform',
      },
      overview: {
        pendingApprovals: 2,
        approvalsResolvedToday: 3,
        activeEmployees: 5,
        inactiveEmployees: 1,
        mfaCoveragePercent: 80,
        staleLogins: 1,
        overallStatus: 'watch',
      },
      alerts: [],
      workforce: {
        totalEmployees: 6,
        activeEmployees: 5,
        inactiveEmployees: 1,
        mfaEnabledEmployees: 4,
        mfaCoveragePercent: 80,
        staleLogins: 1,
        neverLoggedIn: 0,
        departments: [],
        recentHires: [],
      },
      approvals: {
        pendingCount: 2,
        approvedToday: 2,
        deniedToday: 1,
        queueStatus: 'watch',
        oldestPendingCreatedAt: '2026-04-13T03:00:00.000Z',
        priorityQueue: [],
      },
      schoolOperations: {
        totalSchools: 3,
        activeSchools: 2,
        inactiveSchools: 1,
        onboardingRiskCount: 1,
        exceptionCount: 1,
        schools: [],
        topRisks: [],
      },
      recentActivity: [],
    });

    const res = await request(app)
      .get('/api/owner/owner/dashboard')
      .set('Authorization', 'Bearer owner-token');

    expect(res.status).toBe(200);
    expect(mockGetSessionFromAccessToken).toHaveBeenCalledWith('Bearer owner-token');
    expect(mockGetDashboard).toHaveBeenCalledWith({
      uid: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
    });
  });

  it('prefers the real owner token on owner routes even when local tenant auth mode stays in dev', async () => {
    mutableEnv.AUTH_MODE = 'dev';
    mockGetSessionFromAccessToken.mockResolvedValue({
      uid: 'real-owner-uid',
      email: 'owner.local@shardaos.internal',
      role: 'owner',
      plane: 'platform',
      schoolId: '',
    });
    mockGetAccessTokenPayload.mockResolvedValue({
      sub: 'real-owner-uid',
      email: 'owner.local@shardaos.internal',
      role: 'owner',
      plane: 'platform',
      sid: 'owner-session-2',
      typ: 'access',
      iat: Math.floor(Date.now() / 1000),
    });
    mockGetDashboard.mockResolvedValue({
      generatedAt: '2026-04-20T04:00:00.000Z',
      owner: {
        uid: 'real-owner-uid',
        email: 'owner.local@shardaos.internal',
        role: 'owner',
        plane: 'platform',
      },
      overview: {
        pendingApprovals: 3,
        approvalsResolvedToday: 0,
        activeEmployees: 3,
        inactiveEmployees: 1,
        mfaCoveragePercent: 67,
        staleLogins: 2,
        overallStatus: 'watch',
      },
      alerts: [],
      workforce: {
        totalEmployees: 4,
        activeEmployees: 3,
        inactiveEmployees: 1,
        mfaEnabledEmployees: 2,
        mfaCoveragePercent: 67,
        staleLogins: 2,
        neverLoggedIn: 1,
        departments: [],
        recentHires: [],
      },
      approvals: {
        pendingCount: 3,
        approvedToday: 0,
        deniedToday: 0,
        queueStatus: 'watch',
        oldestPendingCreatedAt: '2026-04-20T03:00:00.000Z',
        priorityQueue: [],
      },
      schoolOperations: {
        totalSchools: 4,
        activeSchools: 3,
        inactiveSchools: 1,
        onboardingRiskCount: 1,
        exceptionCount: 1,
        schools: [],
        topRisks: [],
      },
      recentActivity: [],
    });

    const res = await request(app)
      .get('/api/owner/owner/dashboard')
      .set('Authorization', 'Bearer owner-token');

    expect(res.status).toBe(200);
    expect(mockGetDashboard).toHaveBeenCalledWith({
      uid: 'real-owner-uid',
      email: 'owner.local@shardaos.internal',
      role: 'owner',
      plane: 'platform',
    });
  });

  it('returns the owner security center contract for authenticated owner requests', async () => {
    mockGetSecurityCenter.mockResolvedValue({
      generatedAt: '2026-04-16T04:00:00.000Z',
      owner: {
        uid: 'owner-uid-1',
        email: 'owner@example.com',
        role: 'owner',
        plane: 'platform',
      },
      overview: {
        privilegedActions24h: 4,
        riskyEvents24h: 2,
        uniqueActors24h: 2,
        uniqueIpAddresses24h: 2,
        employeesNeedingReview: 1,
        disabledIdentities: 1,
        mfaCoveragePercent: 80,
      },
      findings: [],
      actionCounts: [{ action: 'EMPLOYEE_UPDATED', count: 2 }],
      accessReviewQueue: [
        {
          employeeId: 'employee-1',
          uid: 'uid-1',
          displayName: 'Ops Lead',
          email: 'ops@example.com',
          department: 'Operations',
          reasons: ['Identity access is disabled'],
          isActive: true,
          emailVerified: true,
          mfaEnabled: false,
          authProviderDisabled: true,
          platformAccessActive: false,
          lastLoginAt: '',
          lastSyncedAt: '2026-04-16T03:55:00.000Z',
        },
      ],
      priorityEvents: [],
      auditTimeline: [],
    });

    const res = await request(app)
      .get('/api/owner/owner/security')
      .set('Authorization', 'Bearer owner-token');

    expect(res.status).toBe(200);
    expect(mockGetSecurityCenter).toHaveBeenCalledWith({
      uid: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
    });
  });
}
