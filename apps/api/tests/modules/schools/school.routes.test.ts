import request from 'supertest';
import { getEnabledSchoolServiceKeysForPlan, type School } from '@school-erp/shared';

const mockGetSessionFromAccessToken = jest.fn();

jest.mock('../../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getSessionFromAccessToken: mockGetSessionFromAccessToken,
  })),
}));

import { createApp } from '../../../src/app.js';
import { getDocumentStore } from '../../../src/lib/document-store.js';

const app = createApp();
const basicServiceKeys = getEnabledSchoolServiceKeysForPlan('basic');
const advancedServiceKeys = getEnabledSchoolServiceKeysForPlan('advanced');
const configuredBasicSubset = ['student_records', 'attendance', 'academics'];

function createSchool(overrides: Partial<School> = {}): School {
  return {
    id: 'school-north',
    name: 'North Valley School',
    code: 'NVS',
    address: 'Sector 1',
    city: 'Delhi',
    state: 'Delhi',
    country: 'India',
    phone: '+91 9999999999',
    email: 'admin@north.school',
    principalName: 'North Principal',
    studentCount: 420,
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

describe('school routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSessionFromAccessToken.mockResolvedValue({
      uid: 'tenant-user-1',
      email: 'principal@north.school',
      role: 'principal',
      plane: 'tenant',
      schoolId: 'school-north',
    });
  });

  it('returns Basic plan services with advanced modules locked', async () => {
    await seedSchool(createSchool({
      servicePlanTier: 'basic',
      enabledServiceKeys: ['student_records', 'attendance', 'academics', 'transport'],
    }));

    const res = await request(app)
      .get('/api/schools/me/services')
      .set('Authorization', 'Bearer tenant-token');

    expect(res.status).toBe(200);
    expect(res.body.data.planTier).toBe('basic');
    expect(res.body.data.enabledServiceKeys).toEqual(configuredBasicSubset);
    expect(res.body.data.basicServices).toHaveLength(basicServiceKeys.length);
    expect(res.body.data.advancedServices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'transport',
          state: 'locked',
          lockedReason: 'Requires the Advanced school service plan.',
        }),
        expect.objectContaining({
          key: 'fee_collection',
          state: 'locked',
        }),
      ]),
    );
  });

  it('returns Advanced plan services enabled by default when no explicit keys are stored', async () => {
    await seedSchool(createSchool({ servicePlanTier: 'advanced' }));

    const res = await request(app)
      .get('/api/schools/me/services')
      .set('Authorization', 'Bearer tenant-token');

    expect(res.status).toBe(200);
    expect(res.body.data.planTier).toBe('advanced');
    expect(res.body.data.totals).toEqual({
      enabled: advancedServiceKeys.length,
      available: 0,
      locked: 0,
    });
    expect(res.body.data.advancedServices).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'transport', state: 'enabled' }),
        expect.objectContaining({ key: 'fee_collection', state: 'enabled' }),
        expect.objectContaining({ key: 'library', state: 'enabled' }),
        expect.objectContaining({ key: 'report_cards', state: 'enabled' }),
      ]),
    );

    const admissionService = res.body.data.services.find(
      (service: { key: string }) => service.key === 'admission_crm',
    );
    expect(admissionService.workflow.ownerApprovalGate).toEqual(
      expect.objectContaining({
        approver: 'owner',
        title: 'Admission launch approval',
      }),
    );
    expect(admissionService.workflow.steps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'launch_review',
          ownerApprovalRequired: true,
        }),
      ]),
    );
  });
});
