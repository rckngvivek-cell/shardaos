import request from 'supertest';
import { getEnabledSchoolServiceKeysForPlan, type AdmissionApplicant, type AdmissionSession, type School } from '@school-erp/shared';

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
const advancedServiceKeys = getEnabledSchoolServiceKeysForPlan('advanced');

const admissionSessionPayload = {
  name: '2026-27 Main Admission Window',
  academicYear: '2026-27',
  opensAt: '2026-05-01',
  closesAt: '2026-07-31',
  classes: [
    {
      grade: 'Nursery',
      capacity: 60,
      sections: [
        { section: 'A', capacity: 1 },
        { section: 'B', capacity: 59 },
      ],
      feePlanCode: 'ADM-NUR-2026',
    },
    { grade: 'Class 1', capacity: 80, sections: [{ section: 'A', capacity: 80 }] },
  ],
  enquirySourceTags: ['walk-in', 'website'],
  publicSummary: 'Primary admission window for the 2026-27 academic year.',
};
const activeAdmissionSession: AdmissionSession = {
  id: 'admission-session-active',
  schoolId: 'school-north',
  ...admissionSessionPayload,
  status: 'active',
  launchApprovalId: 'approval-admission-active',
  launchApprovedAt: '2026-05-02T09:00:00.000Z',
  launchDecidedBy: 'owner-uid-1',
  createdBy: 'tenant-admissions-1',
  createdAt: '2026-05-01T09:00:00.000Z',
  updatedAt: '2026-05-02T09:00:00.000Z',
};
const admissionApplicantPayload = {
  sessionId: 'admission-session-active',
  studentName: 'Aarav Sharma',
  applyingGrade: 'Nursery',
  guardian: {
    name: 'Neha Sharma',
    relationship: 'Mother',
    phone: '+91 9000000001',
    email: 'neha@example.com',
  },
  sourceTag: 'website',
  enquiryNote: 'Guardian asked for Nursery admission and transport availability.',
};
const studentConversionPayload = {
  firstName: 'Aarav',
  lastName: 'Sharma',
  dateOfBirth: '2021-04-05',
  gender: 'male',
  section: 'A',
  rollNumber: 'NUR-001',
  address: 'House 11, Sector 1, Delhi',
  emergencyContact: '+91 9000000001',
  bloodGroup: 'O+',
};
const admissionOfferPayload = {
  feeQuote: {
    currency: 'INR',
    dueDate: '2026-05-20',
    notes: 'Pay the admission fee to reserve the allotted seat.',
    lines: [
      {
        code: 'ADM-FEE',
        label: 'Admission fee',
        amount: 15000,
        frequency: 'one_time',
        mandatory: true,
      },
      {
        code: 'TUITION-Q1',
        label: 'Quarter 1 tuition',
        amount: 30000,
        frequency: 'quarterly',
        mandatory: true,
      },
    ],
  },
  letter: {
    title: 'Admission offer for Nursery',
    body: 'We are pleased to offer admission for Nursery. Please complete fee payment before the due date.',
    expiresAt: '2026-05-25',
  },
  communication: {
    channel: 'email',
    subject: 'Admission offer issued',
    message: 'Your admission offer has been issued with the attached fee quote.',
  },
};
const admissionPaymentPayload = {
  amount: 45000,
  currency: 'INR',
  paidAt: '2026-05-20T10:30:00.000Z',
  method: 'upi',
  referenceNumber: 'UPI-ADM-00001',
  notes: 'Guardian paid the full admission quote.',
};
const enrollmentChecklistPayload = {
  items: [
    {
      key: 'payment_receipt_verified',
      label: 'Payment receipt verified',
      status: 'complete',
      notes: 'Receipt checked by admissions desk.',
    },
    {
      key: 'guardian_consent',
      label: 'Guardian consent collected',
      status: 'complete',
    },
    {
      key: 'student_profile_ready',
      label: 'Student profile ready',
      status: 'waived',
      notes: 'Profile will be completed during student record conversion.',
    },
  ],
};

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
    servicePlanTier: 'advanced',
    enabledServiceKeys: advancedServiceKeys,
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

async function seedAdmissionSession(session: AdmissionSession = activeAdmissionSession) {
  const { id, schoolId, ...data } = session;
  await getDocumentStore()
    .collection('schools')
    .doc(schoolId)
    .collection('admission_sessions')
    .doc(id)
    .set(data);
}

async function seedStudent(overrides: Record<string, unknown> = {}) {
  await getDocumentStore()
    .collection('schools')
    .doc('school-north')
    .collection('students')
    .doc('student-existing-1')
    .set({
      firstName: 'Existing',
      lastName: 'Student',
      dateOfBirth: '2021-01-01',
      gender: 'female',
      grade: 'Nursery',
      section: 'A',
      rollNumber: 'NUR-001',
      parentName: 'Existing Guardian',
      parentPhone: '+919000000002',
      address: 'Existing address',
      emergencyContact: '+919000000002',
      isActive: true,
      enrollmentDate: '2026-05-01T00:00:00.000Z',
      createdAt: '2026-05-01T00:00:00.000Z',
      updatedAt: '2026-05-01T00:00:00.000Z',
      ...overrides,
    });
}

async function seedAdmissionApplicant(applicant: AdmissionApplicant) {
  const { id, schoolId, ...data } = applicant;
  await getDocumentStore()
    .collection('schools')
    .doc(schoolId)
    .collection('admission_applicants')
    .doc(id)
    .set(data);
}

async function createAdmittedApplicant() {
  const createRes = await request(app)
    .post('/api/admissions/applicants')
    .set('Authorization', 'Bearer tenant-token')
    .send(admissionApplicantPayload);

  expect(createRes.status).toBe(201);
  const applicantId = createRes.body.data.id;

  await markApplicantReady(applicantId);

  const admittedRes = await request(app)
    .patch(`/api/admissions/applicants/${applicantId}/stage`)
    .set('Authorization', 'Bearer tenant-token')
    .send({
      stage: 'admitted',
      section: 'A',
      note: 'Admission desk accepted the applicant after document review.',
    });

  expect(admittedRes.status).toBe(200);
  expect(admittedRes.body.data.stage).toBe('admitted');
  return admittedRes.body.data;
}

async function prepareApplicantForConversion(applicantId: string) {
  const offerRes = await request(app)
    .post(`/api/admissions/applicants/${applicantId}/offer`)
    .set('Authorization', 'Bearer tenant-token')
    .send(admissionOfferPayload);

  expect(offerRes.status).toBe(201);

  const acceptRes = await request(app)
    .post(`/api/admissions/applicants/${applicantId}/offer/accept`)
    .set('Authorization', 'Bearer tenant-token');

  expect(acceptRes.status).toBe(200);

  const paymentRes = await request(app)
    .post(`/api/admissions/applicants/${applicantId}/payment`)
    .set('Authorization', 'Bearer tenant-token')
    .send(admissionPaymentPayload);

  expect(paymentRes.status).toBe(201);

  const checklistRes = await request(app)
    .patch(`/api/admissions/applicants/${applicantId}/enrollment-checklist`)
    .set('Authorization', 'Bearer tenant-token')
    .send(enrollmentChecklistPayload);

  expect(checklistRes.status).toBe(200);
  return checklistRes.body.data;
}

async function markApplicantReady(applicantId: string) {
  await request(app)
    .patch(`/api/admissions/applicants/${applicantId}/documents/birth_certificate`)
    .set('Authorization', 'Bearer tenant-token')
    .send({ status: 'verified' });

  await request(app)
    .patch(`/api/admissions/applicants/${applicantId}/documents/address_proof`)
    .set('Authorization', 'Bearer tenant-token')
    .send({ status: 'verified' });

  await request(app)
    .patch(`/api/admissions/applicants/${applicantId}/documents/previous_report_card`)
    .set('Authorization', 'Bearer tenant-token')
    .send({ status: 'verified' });
}

function setTenantSession() {
  mockGetSessionFromAccessToken.mockResolvedValue({
    uid: 'tenant-admissions-1',
    email: 'admissions@north.school',
    role: 'school_admin',
    plane: 'tenant',
    schoolId: 'school-north',
  });
}

function setOwnerSession() {
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
}

describe('admission CRM tenant routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.AUTH_MODE = 'jwt';
    mutableEnv.NODE_ENV = 'test';
    mutableEnv.ADMIN_ALLOWED_IPS = '';
    mutableEnv.ADMIN_MFA_REQUIRED = true;
    setTenantSession();
  });

  afterAll(() => {
    mutableEnv.AUTH_MODE = originalAuthMode;
    mutableEnv.NODE_ENV = originalNodeEnv;
    mutableEnv.ADMIN_ALLOWED_IPS = originalAdminAllowedIps;
    mutableEnv.ADMIN_MFA_REQUIRED = originalAdminMfaRequired;
  });

  it('creates and lists admission sessions for schools with Admission CRM enabled', async () => {
    await seedSchool(createSchool());

    const createRes = await request(app)
      .post('/api/admissions/sessions')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionSessionPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        schoolId: 'school-north',
        status: 'draft',
        createdBy: 'tenant-admissions-1',
        name: '2026-27 Main Admission Window',
      }),
    );

    const listRes = await request(app)
      .get('/api/admissions/sessions')
      .set('Authorization', 'Bearer tenant-token');

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toEqual([
      expect.objectContaining({
        id: createRes.body.data.id,
        status: 'draft',
      }),
    ]);
  });

  it('blocks Admission CRM when the purchased service plan does not enable it', async () => {
    await seedSchool(createSchool({
      servicePlanTier: 'basic',
      enabledServiceKeys: getEnabledSchoolServiceKeysForPlan('basic'),
    }));

    const res = await request(app)
      .post('/api/admissions/sessions')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionSessionPayload);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('SERVICE_NOT_ENABLED');
  });

  it('requests owner launch approval and activates the admission session only after owner approval', async () => {
    await seedSchool(createSchool());

    const createRes = await request(app)
      .post('/api/admissions/sessions')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionSessionPayload);

    const launchRes = await request(app)
      .post(`/api/admissions/sessions/${createRes.body.data.id}/request-launch-approval`)
      .set('Authorization', 'Bearer tenant-token');

    expect(launchRes.status).toBe(201);
    expect(launchRes.body.data.session.status).toBe('pending_owner_approval');
    expect(launchRes.body.data.approvalId).toEqual(expect.any(String));

    const approvalDoc = await getDocumentStore()
      .collection('platform_approvals')
      .doc(launchRes.body.data.approvalId)
      .get();
    expect(approvalDoc.data()).toEqual(
      expect.objectContaining({
        type: 'admission_launch',
        status: 'pending',
        requestedBy: 'tenant-admissions-1',
        requestedByEmail: 'admissions@north.school',
        title: 'Launch admissions for 2026-27 Main Admission Window',
        metadata: expect.objectContaining({
          schoolId: 'school-north',
          sessionId: createRes.body.data.id,
          classesOpen: ['Nursery', 'Class 1'],
        }),
      }),
    );

    setOwnerSession();
    const approvalRes = await request(app)
      .post(`/api/owner/approvals/${launchRes.body.data.approvalId}/approve`)
      .set('Authorization', 'Bearer owner-token');

    expect(approvalRes.status).toBe(200);
    expect(approvalRes.body.data.status).toBe('approved');

    const sessionDoc = await getDocumentStore()
      .collection('schools')
      .doc('school-north')
      .collection('admission_sessions')
      .doc(createRes.body.data.id)
      .get();

    expect(sessionDoc.data()).toEqual(
      expect.objectContaining({
        status: 'active',
        launchApprovalId: launchRes.body.data.approvalId,
        launchDecidedBy: 'owner-uid-1',
      }),
    );
  });

  it('updates draft admission sessions and locks edits after owner launch approval', async () => {
    await seedSchool(createSchool());

    const createRes = await request(app)
      .post('/api/admissions/sessions')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionSessionPayload);

    const updatedPayload = {
      ...admissionSessionPayload,
      name: '2026-27 Updated Admission Window',
      enquirySourceTags: ['website', 'referral'],
      publicSummary: 'Updated admission campaign summary for the school admissions desk.',
    };
    const updateRes = await request(app)
      .put(`/api/admissions/sessions/${createRes.body.data.id}`)
      .set('Authorization', 'Bearer tenant-token')
      .send(updatedPayload);

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data).toEqual(
      expect.objectContaining({
        id: createRes.body.data.id,
        status: 'draft',
        name: '2026-27 Updated Admission Window',
        enquirySourceTags: ['website', 'referral'],
      }),
    );

    const launchRes = await request(app)
      .post(`/api/admissions/sessions/${createRes.body.data.id}/request-launch-approval`)
      .set('Authorization', 'Bearer tenant-token');

    expect(launchRes.status).toBe(201);

    setOwnerSession();
    const approvalRes = await request(app)
      .post(`/api/owner/approvals/${launchRes.body.data.approvalId}/approve`)
      .set('Authorization', 'Bearer owner-token');

    expect(approvalRes.status).toBe(200);
    setTenantSession();

    const lockedRes = await request(app)
      .put(`/api/admissions/sessions/${createRes.body.data.id}`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...updatedPayload,
        publicSummary: 'Trying to edit an owner-approved admission launch after activation.',
      });

    expect(lockedRes.status).toBe(409);
    expect(lockedRes.body.error.code).toBe('ADMISSION_SESSION_LOCKED');
  });

  it('reopens denied admission sessions before a fresh launch approval request', async () => {
    await seedSchool(createSchool());

    const createRes = await request(app)
      .post('/api/admissions/sessions')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionSessionPayload);

    const launchRes = await request(app)
      .post(`/api/admissions/sessions/${createRes.body.data.id}/request-launch-approval`)
      .set('Authorization', 'Bearer tenant-token');

    expect(launchRes.status).toBe(201);

    setOwnerSession();
    const denyRes = await request(app)
      .post(`/api/owner/approvals/${launchRes.body.data.approvalId}/deny`)
      .set('Authorization', 'Bearer owner-token')
      .send({
        decisionNote: 'Capacity evidence is incomplete; add section-wise seat planning before launch.',
      });

    expect(denyRes.status).toBe(200);
    expect(denyRes.body.data.decisionNote).toBe(
      'Capacity evidence is incomplete; add section-wise seat planning before launch.',
    );

    const deniedSessionDoc = await getDocumentStore()
      .collection('schools')
      .doc('school-north')
      .collection('admission_sessions')
      .doc(createRes.body.data.id)
      .get();

    expect(deniedSessionDoc.data()).toEqual(
      expect.objectContaining({
        status: 'denied',
        launchDenialReason: 'Capacity evidence is incomplete; add section-wise seat planning before launch.',
      }),
    );
    setTenantSession();

    const blockedLaunchRes = await request(app)
      .post(`/api/admissions/sessions/${createRes.body.data.id}/request-launch-approval`)
      .set('Authorization', 'Bearer tenant-token');

    expect(blockedLaunchRes.status).toBe(409);
    expect(blockedLaunchRes.body.error.code).toBe('ADMISSION_SESSION_REOPEN_REQUIRED');

    const reopenRes = await request(app)
      .post(`/api/admissions/sessions/${createRes.body.data.id}/reopen`)
      .set('Authorization', 'Bearer tenant-token');

    expect(reopenRes.status).toBe(200);
    expect(reopenRes.body.data).toEqual(
      expect.objectContaining({
        status: 'draft',
        reopenedBy: 'tenant-admissions-1',
      }),
    );
    expect(reopenRes.body.data.launchApprovalId).toBeUndefined();
    expect(reopenRes.body.data.launchDeniedAt).toBeUndefined();
    expect(reopenRes.body.data.launchDenialReason).toBeUndefined();

    const relaunchRes = await request(app)
      .post(`/api/admissions/sessions/${createRes.body.data.id}/request-launch-approval`)
      .set('Authorization', 'Bearer tenant-token');

    expect(relaunchRes.status).toBe(201);
    expect(relaunchRes.body.data.session.status).toBe('pending_owner_approval');
    expect(relaunchRes.body.data.approvalId).not.toBe(launchRes.body.data.approvalId);
  });

  it('closes active admission sessions and blocks new applicant intake', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const closeRes = await request(app)
      .post('/api/admissions/sessions/admission-session-active/close')
      .set('Authorization', 'Bearer tenant-token');

    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data).toEqual(
      expect.objectContaining({
        status: 'closed',
        closedBy: 'tenant-admissions-1',
      }),
    );

    const createApplicantRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionApplicantPayload);

    expect(createApplicantRes.status).toBe(409);
    expect(createApplicantRes.body.error.code).toBe('ADMISSION_SESSION_NOT_ACTIVE');
  });

  it('captures and lists admission applicants for an active admission session', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const createRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionApplicantPayload);

    expect(createRes.status).toBe(201);
    expect(createRes.body.data).toEqual(
      expect.objectContaining({
        schoolId: 'school-north',
        sessionId: 'admission-session-active',
        applicantNumber: 'ADM-00001',
        stage: 'new_enquiry',
        studentName: 'Aarav Sharma',
        createdBy: 'tenant-admissions-1',
      }),
    );
    expect(createRes.body.data.documents).toEqual([
      expect.objectContaining({ key: 'birth_certificate', status: 'pending' }),
      expect.objectContaining({ key: 'address_proof', status: 'pending' }),
      expect.objectContaining({ key: 'previous_report_card', status: 'pending' }),
    ]);

    const listRes = await request(app)
      .get('/api/admissions/applicants?sessionId=admission-session-active')
      .set('Authorization', 'Bearer tenant-token');

    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toEqual([
      expect.objectContaining({
        id: createRes.body.data.id,
        stage: 'new_enquiry',
      }),
    ]);
  });

  it('blocks applicant capture until the owner has approved admission launch', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession({
      ...activeAdmissionSession,
      id: 'admission-session-draft',
      status: 'draft',
      launchApprovalId: undefined,
      launchApprovedAt: undefined,
      launchDecidedBy: undefined,
    });

    const res = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...admissionApplicantPayload,
        sessionId: 'admission-session-draft',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('ADMISSION_SESSION_NOT_ACTIVE');
  });

  it('moves applicant stages and promotes the applicant when documents are verified', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const createRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionApplicantPayload);

    const contactedRes = await request(app)
      .patch(`/api/admissions/applicants/${createRes.body.data.id}/stage`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        stage: 'contacted',
        note: 'Guardian confirmed interest by phone.',
      });

    expect(contactedRes.status).toBe(200);
    expect(contactedRes.body.data.stage).toBe('contacted');

    const invalidStageRes = await request(app)
      .patch(`/api/admissions/applicants/${createRes.body.data.id}/stage`)
      .set('Authorization', 'Bearer tenant-token')
      .send({ stage: 'admitted' });

    expect(invalidStageRes.status).toBe(409);
    expect(invalidStageRes.body.error.code).toBe('INVALID_ADMISSION_STAGE_TRANSITION');

    const birthCertificateRes = await request(app)
      .patch(`/api/admissions/applicants/${createRes.body.data.id}/documents/birth_certificate`)
      .set('Authorization', 'Bearer tenant-token')
      .send({ status: 'verified', notes: 'Original certificate checked.' });

    expect(birthCertificateRes.status).toBe(200);
    expect(birthCertificateRes.body.data.stage).toBe('application_started');

    await request(app)
      .patch(`/api/admissions/applicants/${createRes.body.data.id}/documents/address_proof`)
      .set('Authorization', 'Bearer tenant-token')
      .send({ status: 'verified' });

    const readyRes = await request(app)
      .patch(`/api/admissions/applicants/${createRes.body.data.id}/documents/previous_report_card`)
      .set('Authorization', 'Bearer tenant-token')
      .send({ status: 'verified' });

    expect(readyRes.status).toBe(200);
    expect(readyRes.body.data.stage).toBe('ready_for_review');
    expect(readyRes.body.data.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'created' }),
        expect.objectContaining({ type: 'stage_changed' }),
        expect.objectContaining({ type: 'document_updated' }),
      ]),
    );
  });

  it('exposes session capacity and blocks admission when a section is full', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();
    const admittedApplicant = await createAdmittedApplicant();

    expect(admittedApplicant.assignedSection).toBe('A');
    expect(admittedApplicant.decision).toEqual(
      expect.objectContaining({
        status: 'admitted',
        decidedBy: 'tenant-admissions-1',
        note: 'Admission desk accepted the applicant after document review.',
      }),
    );

    const summaryRes = await request(app)
      .get('/api/admissions/sessions/admission-session-active/capacity')
      .set('Authorization', 'Bearer tenant-token');

    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.classes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          grade: 'Nursery',
          admittedCount: 1,
          occupiedCount: 1,
          sections: expect.arrayContaining([
            expect.objectContaining({
              section: 'A',
              capacity: 1,
              admittedCount: 1,
              availableSeats: 0,
            }),
          ]),
        }),
      ]),
    );

    const createRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...admissionApplicantPayload,
        studentName: 'Vihaan Kapoor',
        guardian: {
          ...admissionApplicantPayload.guardian,
          name: 'Riya Kapoor',
          phone: '+91 9000000003',
          email: 'riya@example.com',
        },
      });

    expect(createRes.status).toBe(201);
    await markApplicantReady(createRes.body.data.id);

    const admitFullRes = await request(app)
      .patch(`/api/admissions/applicants/${createRes.body.data.id}/stage`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        stage: 'admitted',
        section: 'A',
        note: 'Trying to admit to a full section.',
      });

    expect(admitFullRes.status).toBe(409);
    expect(admitFullRes.body.error.code).toBe('ADMISSION_CAPACITY_FULL');
  });

  it('summarizes admission analytics for operational dashboards', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();
    const admittedApplicant = await createAdmittedApplicant();
    await prepareApplicantForConversion(admittedApplicant.id);

    const enquiryRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...admissionApplicantPayload,
        studentName: 'Vihaan Kapoor',
        guardian: {
          ...admissionApplicantPayload.guardian,
          name: 'Riya Kapoor',
          phone: '+91 9000000003',
          email: 'riya@example.com',
        },
      });
    expect(enquiryRes.status).toBe(201);

    const followUpRes = await request(app)
      .patch(`/api/admissions/applicants/${enquiryRes.body.data.id}/follow-up`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        assignedTo: 'admissions-counsellor-2',
        followUpAt: '2000-01-01T09:30:00.000Z',
        priority: 'urgent',
        status: 'open',
        note: 'Follow-up is overdue and should appear in dashboard analytics.',
      });
    expect(followUpRes.status).toBe(200);

    const analyticsRes = await request(app)
      .get('/api/admissions/analytics')
      .set('Authorization', 'Bearer tenant-token');

    expect(analyticsRes.status).toBe(200);
    expect(analyticsRes.body.data).toEqual(
      expect.objectContaining({
        schoolId: 'school-north',
        totals: expect.objectContaining({
          sessions: 1,
          activeSessions: 1,
          applicants: 2,
          offersIssued: 1,
          offersAccepted: 1,
          paymentsRecorded: 1,
          checklistReady: 1,
          readyToConvert: 1,
          converted: 0,
          openFollowUps: 1,
          dueFollowUps: 1,
          seatsOccupied: 1,
          seatsAvailable: 139,
          totalSeats: 140,
        }),
        stages: expect.arrayContaining([
          { stage: 'admitted', count: 1 },
          { stage: 'new_enquiry', count: 1 },
        ]),
        sessions: [
          expect.objectContaining({
            sessionId: 'admission-session-active',
            totalApplicants: 2,
            readyToConvert: 1,
            dueFollowUps: 1,
            capacity: expect.objectContaining({
              sessionId: 'admission-session-active',
            }),
          }),
        ],
      }),
    );
  });

  it('builds an actionable admission work queue for the school desk', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const reviewRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...admissionApplicantPayload,
        studentName: 'Vihaan Kapoor',
        guardian: {
          ...admissionApplicantPayload.guardian,
          name: 'Riya Kapoor',
          phone: '+91 9000000003',
          email: 'riya@example.com',
        },
      });
    expect(reviewRes.status).toBe(201);
    await markApplicantReady(reviewRes.body.data.id);

    const followUpRes = await request(app)
      .patch(`/api/admissions/applicants/${reviewRes.body.data.id}/follow-up`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        assignedTo: 'admissions-counsellor-2',
        followUpAt: '2000-01-01T09:30:00.000Z',
        priority: 'urgent',
        status: 'open',
        note: 'Call guardian before the review window closes.',
      });
    expect(followUpRes.status).toBe(200);

    const admittedApplicant = await createAdmittedApplicant();
    await prepareApplicantForConversion(admittedApplicant.id);

    const queueRes = await request(app)
      .get('/api/admissions/work-queue')
      .set('Authorization', 'Bearer tenant-token');

    expect(queueRes.status).toBe(200);
    expect(queueRes.body.data).toEqual(
      expect.objectContaining({
        schoolId: 'school-north',
        totalOpenItems: 3,
        buckets: expect.arrayContaining([
          expect.objectContaining({
            kind: 'due_follow_up',
            label: 'Due follow-ups',
            count: 1,
            items: [
              expect.objectContaining({
                applicantId: reviewRes.body.data.id,
                applicantNumber: 'ADM-00001',
                priority: 'urgent',
                nextActionLabel: 'Update follow-up',
              }),
            ],
          }),
          expect.objectContaining({
            kind: 'document_review',
            count: 1,
            items: [
              expect.objectContaining({
                applicantId: reviewRes.body.data.id,
                nextActionLabel: 'Decide admission',
              }),
            ],
          }),
          expect.objectContaining({
            kind: 'ready_to_convert',
            count: 1,
            items: [
              expect.objectContaining({
                applicantId: admittedApplicant.id,
                applicantNumber: 'ADM-00002',
                nextActionLabel: 'Convert to student',
              }),
            ],
          }),
        ]),
      }),
    );
  });

  it('records waitlist and rejection decision metadata', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const waitlistCreateRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...admissionApplicantPayload,
        studentName: 'Ira Mehta',
        guardian: {
          ...admissionApplicantPayload.guardian,
          name: 'Anika Mehta',
          phone: '+91 9000000004',
          email: 'anika@example.com',
        },
      });

    await markApplicantReady(waitlistCreateRes.body.data.id);
    const waitlistRes = await request(app)
      .patch(`/api/admissions/applicants/${waitlistCreateRes.body.data.id}/stage`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        stage: 'waitlisted',
        note: 'Strong applicant, waiting for a Nursery seat.',
      });

    expect(waitlistRes.status).toBe(200);
    expect(waitlistRes.body.data).toEqual(
      expect.objectContaining({
        stage: 'waitlisted',
        decision: expect.objectContaining({
          status: 'waitlisted',
          decidedBy: 'tenant-admissions-1',
          note: 'Strong applicant, waiting for a Nursery seat.',
        }),
      }),
    );

    const rejectCreateRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...admissionApplicantPayload,
        studentName: 'Kabir Sethi',
        guardian: {
          ...admissionApplicantPayload.guardian,
          name: 'Maya Sethi',
          phone: '+91 9000000005',
          email: 'maya@example.com',
        },
      });

    await markApplicantReady(rejectCreateRes.body.data.id);
    const rejectRes = await request(app)
      .patch(`/api/admissions/applicants/${rejectCreateRes.body.data.id}/stage`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        stage: 'rejected',
        note: 'Does not meet the age criteria for this session.',
      });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.data.decision).toEqual(
      expect.objectContaining({
        status: 'rejected',
        decidedBy: 'tenant-admissions-1',
        note: 'Does not meet the age criteria for this session.',
      }),
    );
  });

  it('updates applicant follow-up fields', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const createRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionApplicantPayload);

    expect(createRes.status).toBe(201);

    const followUpRes = await request(app)
      .patch(`/api/admissions/applicants/${createRes.body.data.id}/follow-up`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        assignedTo: 'admissions-counsellor-2',
        followUpAt: '2026-05-10T09:30:00.000Z',
        priority: 'high',
        status: 'open',
        note: 'Call guardian with transport details.',
      });

    expect(followUpRes.status).toBe(200);
    expect(followUpRes.body.data.followUp).toEqual(
      expect.objectContaining({
        assignedTo: 'admissions-counsellor-2',
        followUpAt: '2026-05-10T09:30:00.000Z',
        priority: 'high',
        status: 'open',
        note: 'Call guardian with transport details.',
        updatedBy: 'tenant-admissions-1',
      }),
    );
    expect(followUpRes.body.data.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'follow_up_updated',
          message: 'Call guardian with transport details.',
        }),
      ]),
    );
  });

  it('issues and accepts an admission offer with fee quote and guardian communication', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();
    const admittedApplicant = await createAdmittedApplicant();

    const offerRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/offer`)
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionOfferPayload);

    expect(offerRes.status).toBe(201);
    expect(offerRes.body.data.feeQuote).toEqual(
      expect.objectContaining({
        currency: 'INR',
        dueDate: '2026-05-20',
        totalAmount: 45000,
        generatedBy: 'tenant-admissions-1',
      }),
    );
    expect(offerRes.body.data.offerLetter).toEqual(
      expect.objectContaining({
        offerNumber: expect.stringContaining('ADM-00001-OFFER-'),
        status: 'issued',
        title: 'Admission offer for Nursery',
        issuedBy: 'tenant-admissions-1',
      }),
    );
    expect(offerRes.body.data.guardianCommunications).toEqual([
      expect.objectContaining({
        channel: 'email',
        status: 'sent',
        subject: 'Admission offer issued',
        sentBy: 'tenant-admissions-1',
      }),
    ]);
    expect(offerRes.body.data.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'offer_issued' }),
        expect.objectContaining({ type: 'guardian_communication_sent' }),
      ]),
    );

    const acceptRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/offer/accept`)
      .set('Authorization', 'Bearer tenant-token');

    expect(acceptRes.status).toBe(200);
    expect(acceptRes.body.data.offerLetter).toEqual(
      expect.objectContaining({
        status: 'accepted',
        acceptedBy: 'tenant-admissions-1',
      }),
    );
    expect(acceptRes.body.data.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'offer_accepted',
          message: expect.stringContaining('Accepted admission offer'),
        }),
      ]),
    );
  });

  it('blocks offer issue before admission and records standalone guardian communication', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const createRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionApplicantPayload);

    const blockedOfferRes = await request(app)
      .post(`/api/admissions/applicants/${createRes.body.data.id}/offer`)
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionOfferPayload);

    expect(blockedOfferRes.status).toBe(409);
    expect(blockedOfferRes.body.error.code).toBe('ADMISSION_APPLICANT_NOT_ADMITTED');

    const communicationRes = await request(app)
      .post(`/api/admissions/applicants/${createRes.body.data.id}/communications`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        channel: 'phone',
        subject: 'Document reminder',
        message: 'Called guardian to remind them about pending documents.',
      });

    expect(communicationRes.status).toBe(201);
    expect(communicationRes.body.data.guardianCommunications).toEqual([
      expect.objectContaining({
        channel: 'phone',
        subject: 'Document reminder',
        status: 'sent',
        sentBy: 'tenant-admissions-1',
      }),
    ]);
  });

  it('records admission payment and enrollment checklist after offer acceptance', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();
    const admittedApplicant = await createAdmittedApplicant();

    const prematurePaymentRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/payment`)
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionPaymentPayload);

    expect(prematurePaymentRes.status).toBe(409);
    expect(prematurePaymentRes.body.error.code).toBe('ADMISSION_OFFER_NOT_ACCEPTED');

    await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/offer`)
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionOfferPayload);
    await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/offer/accept`)
      .set('Authorization', 'Bearer tenant-token');

    const paymentRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/payment`)
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionPaymentPayload);

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.paymentReceipt).toEqual(
      expect.objectContaining({
        receiptNumber: expect.stringContaining('ADM-00001-PAY-'),
        amount: 45000,
        currency: 'INR',
        method: 'upi',
        referenceNumber: 'UPI-ADM-00001',
        recordedBy: 'tenant-admissions-1',
      }),
    );

    const checklistRes = await request(app)
      .patch(`/api/admissions/applicants/${admittedApplicant.id}/enrollment-checklist`)
      .set('Authorization', 'Bearer tenant-token')
      .send(enrollmentChecklistPayload);

    expect(checklistRes.status).toBe(200);
    expect(checklistRes.body.data.enrollmentChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'payment_receipt_verified',
          status: 'complete',
          updatedBy: 'tenant-admissions-1',
        }),
        expect.objectContaining({
          key: 'student_profile_ready',
          status: 'waived',
          updatedBy: 'tenant-admissions-1',
        }),
      ]),
    );
    expect(checklistRes.body.data.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'payment_recorded' }),
        expect.objectContaining({ type: 'enrollment_checklist_updated' }),
      ]),
    );
  });

  it('converts an admitted admission applicant into a student record', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();
    const admittedApplicant = await createAdmittedApplicant();
    await prepareApplicantForConversion(admittedApplicant.id);

    const convertRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/convert-to-student`)
      .set('Authorization', 'Bearer tenant-token')
      .send(studentConversionPayload);

    expect(convertRes.status).toBe(201);
    expect(convertRes.body.data.student).toEqual(
      expect.objectContaining({
        schoolId: 'school-north',
        firstName: 'Aarav',
        lastName: 'Sharma',
        grade: 'Nursery',
        section: 'A',
        rollNumber: 'NUR-001',
        parentName: 'Neha Sharma',
        parentPhone: '+91 9000000001',
        parentEmail: 'neha@example.com',
        guardianProfile: expect.objectContaining({
          name: 'Neha Sharma',
          relationship: 'Mother',
          sourceApplicantId: admittedApplicant.id,
        }),
        admissionSourceType: 'admission_crm',
        admissionSource: expect.objectContaining({
          type: 'admission_crm',
          applicantId: admittedApplicant.id,
          applicantNumber: 'ADM-00001',
          sessionId: 'admission-session-active',
          sessionName: '2026-27 Main Admission Window',
          convertedBy: 'tenant-admissions-1',
        }),
        isActive: true,
      }),
    );
    expect(convertRes.body.data.applicant).toEqual(
      expect.objectContaining({
        id: admittedApplicant.id,
        stage: 'converted_to_student',
        convertedStudentId: convertRes.body.data.student.id,
        convertedBy: 'tenant-admissions-1',
      }),
    );
    expect(convertRes.body.data.applicant.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'converted_to_student',
          message: `Converted to student record ${convertRes.body.data.student.id}`,
        }),
      ]),
    );

    const studentDoc = await getDocumentStore()
      .collection('schools')
      .doc('school-north')
      .collection('students')
      .doc(convertRes.body.data.student.id)
      .get();

    expect(studentDoc.exists).toBe(true);
    expect(studentDoc.data()).toEqual(
      expect.objectContaining({
        firstName: 'Aarav',
        grade: 'Nursery',
        rollNumber: 'NUR-001',
      }),
    );
  });

  it('blocks student conversion until the applicant has been admitted', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const createRes = await request(app)
      .post('/api/admissions/applicants')
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionApplicantPayload);

    const convertRes = await request(app)
      .post(`/api/admissions/applicants/${createRes.body.data.id}/convert-to-student`)
      .set('Authorization', 'Bearer tenant-token')
      .send(studentConversionPayload);

    expect(convertRes.status).toBe(409);
    expect(convertRes.body.error.code).toBe('ADMISSION_APPLICANT_NOT_ADMITTED');
  });

  it('blocks student conversion until offer, payment, and checklist are complete', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();
    const admittedApplicant = await createAdmittedApplicant();

    const beforeOfferRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/convert-to-student`)
      .set('Authorization', 'Bearer tenant-token')
      .send(studentConversionPayload);

    expect(beforeOfferRes.status).toBe(409);
    expect(beforeOfferRes.body.error.code).toBe('ADMISSION_OFFER_NOT_ACCEPTED');

    await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/offer`)
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionOfferPayload);
    await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/offer/accept`)
      .set('Authorization', 'Bearer tenant-token');

    const beforePaymentRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/convert-to-student`)
      .set('Authorization', 'Bearer tenant-token')
      .send(studentConversionPayload);

    expect(beforePaymentRes.status).toBe(409);
    expect(beforePaymentRes.body.error.code).toBe('ADMISSION_PAYMENT_REQUIRED');

    await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/payment`)
      .set('Authorization', 'Bearer tenant-token')
      .send(admissionPaymentPayload);

    const incompleteChecklistRes = await request(app)
      .patch(`/api/admissions/applicants/${admittedApplicant.id}/enrollment-checklist`)
      .set('Authorization', 'Bearer tenant-token')
      .send({
        items: [
          {
            key: 'guardian_consent',
            label: 'Guardian consent collected',
            status: 'pending',
          },
        ],
      });

    expect(incompleteChecklistRes.status).toBe(200);

    const beforeChecklistRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/convert-to-student`)
      .set('Authorization', 'Bearer tenant-token')
      .send(studentConversionPayload);

    expect(beforeChecklistRes.status).toBe(409);
    expect(beforeChecklistRes.body.error.code).toBe('ADMISSION_CHECKLIST_INCOMPLETE');
  });

  it('prevents student conversion when the target admission section is full', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();

    const baseApplicant = {
      schoolId: 'school-north',
      sessionId: 'admission-session-active',
      studentName: 'Seed Applicant',
      applyingGrade: 'Nursery',
      guardian: admissionApplicantPayload.guardian,
      sourceTag: 'website',
      enquiryNote: 'Seeded for conversion capacity guard.',
      documents: [],
      applicantNumber: 'ADM-99999',
      timeline: [],
      feeQuote: {
        currency: 'INR',
        dueDate: '2026-05-20',
        lines: admissionOfferPayload.feeQuote.lines,
        totalAmount: 45000,
        generatedAt: '2026-05-03T09:00:00.000Z',
        generatedBy: 'tenant-admissions-1',
      },
      offerLetter: {
        offerNumber: 'ADM-99999-OFFER-20260503',
        status: 'accepted',
        title: 'Admission offer for Nursery',
        body: 'Accepted offer for seeded applicant.',
        expiresAt: '2026-05-25',
        issuedAt: '2026-05-03T09:00:00.000Z',
        issuedBy: 'tenant-admissions-1',
        acceptedAt: '2026-05-03T09:05:00.000Z',
        acceptedBy: 'tenant-admissions-1',
      },
      paymentReceipt: {
        receiptNumber: 'ADM-99999-PAY-20260503',
        amount: 45000,
        currency: 'INR',
        paidAt: '2026-05-03T09:10:00.000Z',
        method: 'upi',
        recordedAt: '2026-05-03T09:10:00.000Z',
        recordedBy: 'tenant-admissions-1',
      },
      enrollmentChecklist: [
        {
          key: 'payment_receipt_verified',
          label: 'Payment receipt verified',
          status: 'complete',
          updatedAt: '2026-05-03T09:15:00.000Z',
          updatedBy: 'tenant-admissions-1',
        },
      ],
      createdBy: 'tenant-admissions-1',
      createdAt: '2026-05-03T09:00:00.000Z',
      updatedAt: '2026-05-03T09:00:00.000Z',
    };

    await seedAdmissionApplicant({
      ...baseApplicant,
      id: 'admission-applicant-occupying-seat',
      applicantNumber: 'ADM-00001',
      stage: 'admitted',
      assignedSection: 'A',
    });
    await seedAdmissionApplicant({
      ...baseApplicant,
      id: 'admission-applicant-conversion-blocked',
      applicantNumber: 'ADM-00002',
      stage: 'admitted',
    });

    const convertRes = await request(app)
      .post('/api/admissions/applicants/admission-applicant-conversion-blocked/convert-to-student')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        ...studentConversionPayload,
        rollNumber: 'NUR-002',
      });

    expect(convertRes.status).toBe(409);
    expect(convertRes.body.error.code).toBe('ADMISSION_CAPACITY_FULL');
  });

  it('prevents admission conversion when the target roll number already exists', async () => {
    await seedSchool(createSchool());
    await seedAdmissionSession();
    await seedStudent();
    const admittedApplicant = await createAdmittedApplicant();
    await prepareApplicantForConversion(admittedApplicant.id);

    const convertRes = await request(app)
      .post(`/api/admissions/applicants/${admittedApplicant.id}/convert-to-student`)
      .set('Authorization', 'Bearer tenant-token')
      .send(studentConversionPayload);

    expect(convertRes.status).toBe(409);
    expect(convertRes.body.error.code).toBe('STUDENT_ROLL_NUMBER_EXISTS');
  });
});
