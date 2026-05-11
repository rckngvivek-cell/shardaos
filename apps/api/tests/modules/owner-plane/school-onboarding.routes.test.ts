import request from 'supertest';
import type { Employee } from '@school-erp/shared';

const mockGetSessionFromAccessToken = jest.fn();
const mockGetAccessTokenPayload = jest.fn();

jest.mock('../../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getSessionFromAccessToken: mockGetSessionFromAccessToken,
    getAccessTokenPayload: mockGetAccessTokenPayload,
  })),
}));

import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { getDocumentStore } from '../../../src/lib/document-store.js';

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

const schoolOnboardingPayload = {
  school: {
    name: 'Riverdale Public School',
    code: 'rps',
    address: '14 River Road',
    city: 'Patna',
    state: 'Bihar',
    country: 'India',
    phone: '+91-9000000001',
    email: 'office@riverdale.example',
    principalName: 'Riya Sharma',
  },
  servicePlanTier: 'advanced',
  enabledServiceKeys: ['student_records', 'attendance', 'academics', 'transport', 'fee_collection'],
};

function setPlatformSession(role: 'owner' | 'employee') {
  const uid = role === 'owner' ? 'owner-uid-1' : 'employee-uid-1';
  const email = role === 'owner' ? 'owner@example.com' : 'ops@shardaos.internal';

  mockGetSessionFromAccessToken.mockResolvedValue({
    uid,
    email,
    role,
    plane: 'platform',
    schoolId: '',
  });
  mockGetAccessTokenPayload.mockResolvedValue({
    sub: uid,
    email,
    role,
    plane: 'platform',
    sid: `${role}-session-1`,
    typ: 'access',
    iat: Math.floor(Date.now() / 1000),
  });
}

async function seedPlatformEmployee(overrides: Partial<Employee> = {}) {
  const employee: Employee = {
    id: 'employee-1',
    uid: 'employee-uid-1',
    email: 'ops@shardaos.internal',
    displayName: 'Operations Lead',
    role: 'employee',
    department: 'Operations',
    isActive: true,
    emailVerified: true,
    mfaEnabled: true,
    authProviderDisabled: false,
    platformAccessActive: true,
    lastLoginAt: '2026-04-20T08:00:00.000Z',
    lastSyncedAt: '2026-04-20T08:00:00.000Z',
    createdAt: '2026-04-20T08:00:00.000Z',
    updatedAt: '2026-04-20T08:00:00.000Z',
    onboardedBy: 'owner-uid-1',
    ...overrides,
  };
  const { id, ...data } = employee;
  await getDocumentStore().collection('platform_employees').doc(id).set(data);
}

describe('school onboarding approval workflow routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.AUTH_MODE = 'jwt';
    mutableEnv.NODE_ENV = 'test';
    mutableEnv.ADMIN_ALLOWED_IPS = '';
    mutableEnv.ADMIN_MFA_REQUIRED = true;
    setPlatformSession('employee');
  });

  afterAll(() => {
    mutableEnv.AUTH_MODE = originalAuthMode;
    mutableEnv.NODE_ENV = originalNodeEnv;
    mutableEnv.ADMIN_ALLOWED_IPS = originalAdminAllowedIps;
    mutableEnv.ADMIN_MFA_REQUIRED = originalAdminMfaRequired;
  });

  it('lets an active platform employee create a school onboarding approval request', async () => {
    await seedPlatformEmployee();

    const res = await request(app)
      .post('/api/owner/school-onboarding')
      .set('Authorization', 'Bearer employee-token')
      .send(schoolOnboardingPayload);

    expect(res.status).toBe(201);
    expect(res.body.data).toEqual(
      expect.objectContaining({
        type: 'school_onboarding',
        status: 'pending',
        requestedBy: 'employee-uid-1',
        requestedByEmail: 'ops@shardaos.internal',
        title: 'Onboard Riverdale Public School',
      }),
    );
    expect(res.body.data.metadata).toEqual(
      expect.objectContaining({
        schoolId: 'school-rps',
        servicePlanTier: 'advanced',
        enabledServiceKeys: ['student_records', 'attendance', 'academics', 'transport', 'fee_collection'],
        schoolDraft: expect.objectContaining({
          code: 'RPS',
          email: 'office@riverdale.example',
        }),
      }),
    );

    const schoolDoc = await getDocumentStore().collection('schools').doc('school-rps').get();
    expect(schoolDoc.exists).toBe(false);

    const auditSnap = await getDocumentStore().collection('platform_audit_log').get();
    expect(auditSnap.docs[0].data()).toEqual(
      expect.objectContaining({
        action: 'SCHOOL_ONBOARDING_REQUESTED',
        targetType: 'school',
        targetId: 'school-rps',
      }),
    );
  });

  it('provisions the requested school only after owner approval', async () => {
    await seedPlatformEmployee();

    const requestRes = await request(app)
      .post('/api/owner/school-onboarding')
      .set('Authorization', 'Bearer employee-token')
      .send(schoolOnboardingPayload);

    setPlatformSession('owner');

    const approvalRes = await request(app)
      .post(`/api/owner/approvals/${requestRes.body.data.id}/approve`)
      .set('Authorization', 'Bearer owner-token');

    expect(approvalRes.status).toBe(200);
    expect(approvalRes.body.data.status).toBe('approved');
    expect(approvalRes.body.data.approvedBy).toBe('owner-uid-1');

    const schoolDoc = await getDocumentStore().collection('schools').doc('school-rps').get();
    expect(schoolDoc.exists).toBe(true);
    expect(schoolDoc.data()).toEqual(
      expect.objectContaining({
        name: 'Riverdale Public School',
        code: 'RPS',
        servicePlanTier: 'advanced',
        enabledServiceKeys: ['student_records', 'attendance', 'academics', 'transport', 'fee_collection'],
        studentCount: 0,
        isActive: true,
      }),
    );

    const auditSnap = await getDocumentStore().collection('platform_audit_log').get();
    expect(auditSnap.docs.map((doc) => doc.data().action)).toEqual([
      'SCHOOL_ONBOARDING_REQUESTED',
      'APPROVAL_GRANTED',
      'SCHOOL_ONBOARDED',
    ]);
  });
});
