import request from 'supertest';
import { getEnabledSchoolServiceKeysForPlan, type School } from '@school-erp/shared';

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
const basicServiceKeys = getEnabledSchoolServiceKeysForPlan('basic');
const configuredBasicSubset = ['student_records', 'attendance', 'academics'];
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

function createSchool(overrides: Partial<School> = {}): School {
  return {
    id: 'school-north',
    name: 'North Campus',
    code: 'NORTH',
    address: '1 North Road',
    city: 'Patna',
    state: 'Bihar',
    country: 'India',
    phone: '111',
    email: 'north@example.com',
    principalName: 'North Principal',
    studentCount: 620,
    servicePlanTier: 'basic',
    enabledServiceKeys: basicServiceKeys,
    isActive: true,
    createdAt: '2026-04-20T08:00:00.000Z',
    updatedAt: '2026-04-20T08:00:00.000Z',
    ...overrides,
  };
}

async function seedSchool(school: School) {
  const { id, ...data } = school;
  await getDocumentStore().collection('schools').doc(id).set(data);
}

describe('owner school management routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.AUTH_MODE = 'jwt';
    mutableEnv.NODE_ENV = 'test';
    mutableEnv.ADMIN_ALLOWED_IPS = '';
    mutableEnv.ADMIN_MFA_REQUIRED = true;
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

  it('updates a school to the Advanced service plan with enabled advanced services', async () => {
    await seedSchool(createSchool());

    const res = await request(app)
      .patch('/api/owner/schools/school-north/service-plan')
      .set('Authorization', 'Bearer owner-token')
      .send({
        servicePlanTier: 'advanced',
        enabledServiceKeys: ['student_records', 'attendance', 'academics', 'transport', 'fee_collection'],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.servicePlanTier).toBe('advanced');
    expect(res.body.data.enabledServiceKeys).toEqual([
      'student_records',
      'attendance',
      'academics',
      'transport',
      'fee_collection',
    ]);

    const auditSnap = await getDocumentStore().collection('platform_audit_log').get();
    expect(auditSnap.docs).toHaveLength(1);
    expect(auditSnap.docs[0].data()).toEqual(
      expect.objectContaining({
        action: 'SETTINGS_CHANGED',
        targetType: 'school',
        targetId: 'school-north',
      }),
    );
  });

  it('keeps Basic plan updates limited to Basic services', async () => {
    await seedSchool(createSchool({ servicePlanTier: 'advanced' }));

    const res = await request(app)
      .patch('/api/owner/schools/school-north/service-plan')
      .set('Authorization', 'Bearer owner-token')
      .send({
        servicePlanTier: 'basic',
        enabledServiceKeys: ['student_records', 'attendance', 'academics', 'transport'],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.servicePlanTier).toBe('basic');
    expect(res.body.data.enabledServiceKeys).toEqual(configuredBasicSubset);
  });
});
