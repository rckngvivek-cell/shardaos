import request from 'supertest';

const mockGetSessionFromAccessToken = jest.fn();
const mockGetAccessTokenPayload = jest.fn();
const mockAuditCollectionAdd = jest.fn();
const mockDocumentStore = {
  collection: jest.fn(() => ({
    add: mockAuditCollectionAdd,
  })),
};

const mockList = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockActivate = jest.fn();
const mockSyncIdentity = jest.fn();
const mockDeactivate = jest.fn();

jest.mock('../../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getSessionFromAccessToken: mockGetSessionFromAccessToken,
    getAccessTokenPayload: mockGetAccessTokenPayload,
  })),
}));

jest.mock('../../../src/lib/document-store.js', () => ({
  getDocumentStore: () => mockDocumentStore,
}));

jest.mock('../../../src/modules/owner-plane/employees/employee.service.js', () => ({
  EmployeeService: jest.fn().mockImplementation(() => ({
    list: mockList,
    create: mockCreate,
    update: mockUpdate,
    activate: mockActivate,
    syncIdentity: mockSyncIdentity,
    deactivate: mockDeactivate,
    countActive: jest.fn(),
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

describe('employee owner routes', () => {
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

  it('updates an employee record for authenticated owner requests', async () => {
    mockUpdate.mockResolvedValue({
      id: 'employee-1',
      uid: 'uid-1',
      email: 'ops@example.com',
      displayName: 'Operations Lead',
      role: 'employee',
      department: 'Support',
      isActive: true,
      mfaEnabled: false,
      lastLoginAt: '',
      createdAt: '2026-04-16T10:00:00.000Z',
      updatedAt: '2026-04-16T10:05:00.000Z',
      onboardedBy: 'owner-uid-1',
    });

    const response = await request(app)
      .patch('/api/owner/employees/employee-1')
      .set('Authorization', 'Bearer owner-token')
      .send({
        displayName: 'Operations Lead',
        department: 'Support',
      });

    expect(response.status).toBe(200);
    expect(mockUpdate).toHaveBeenCalledWith('employee-1', {
      displayName: 'Operations Lead',
      department: 'Support',
    });
  });

  it('reactivates an employee record for authenticated owner requests', async () => {
    mockActivate.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/owner/employees/employee-2/activate')
      .set('Authorization', 'Bearer owner-token');

    expect(response.status).toBe(204);
    expect(mockActivate).toHaveBeenCalledWith('employee-2');
  });

  it('syncs identity metadata for authenticated owner requests', async () => {
    mockSyncIdentity.mockResolvedValue({
      id: 'employee-3',
      uid: 'uid-3',
      email: 'staff@example.com',
      displayName: 'Staff Member',
      role: 'employee',
      department: 'Support',
      isActive: true,
      emailVerified: true,
      mfaEnabled: true,
      authProviderDisabled: false,
      platformAccessActive: true,
      lastLoginAt: '2026-04-16T10:00:00.000Z',
      lastSyncedAt: '2026-04-16T10:15:00.000Z',
      createdAt: '2026-04-15T10:00:00.000Z',
      updatedAt: '2026-04-16T10:15:00.000Z',
      onboardedBy: 'owner-uid-1',
    });

    const response = await request(app)
      .post('/api/owner/employees/employee-3/sync')
      .set('Authorization', 'Bearer owner-token');

    expect(response.status).toBe(200);
    expect(mockSyncIdentity).toHaveBeenCalledWith('employee-3');
  });

  it('rejects empty employee patch payloads', async () => {
    const response = await request(app)
      .patch('/api/owner/employees/employee-1')
      .set('Authorization', 'Bearer owner-token')
      .send({});

    expect(response.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });
}
