import request from 'supertest';

const mockGetSessionFromAccessToken = jest.fn();

jest.mock('../../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    getSessionFromAccessToken: mockGetSessionFromAccessToken,
  })),
}));

import { createApp } from '../../../src/app.js';
import { getDocumentStore } from '../../../src/lib/document-store.js';

const app = createApp();

function setTenantSession() {
  mockGetSessionFromAccessToken.mockResolvedValue({
    uid: 'tenant-students-1',
    email: 'registrar@north.school',
    role: 'school_admin',
    plane: 'tenant',
    schoolId: 'school-north',
  });
}

async function seedStudent(id: string, overrides: Record<string, unknown> = {}) {
  await getDocumentStore()
    .collection('schools')
    .doc('school-north')
    .collection('students')
    .doc(id)
    .set({
      firstName: 'Aarav',
      lastName: 'Sharma',
      dateOfBirth: '2021-04-05',
      gender: 'male',
      grade: 'Nursery',
      section: 'A',
      rollNumber: 'NUR-001',
      parentName: 'Neha Sharma',
      parentPhone: '+919000000001',
      parentEmail: 'neha@example.com',
      address: 'House 11, Sector 1, Delhi',
      emergencyContact: '+919000000001',
      admissionSourceType: 'direct',
      isActive: true,
      enrollmentDate: '2026-05-08T00:00:00.000Z',
      createdAt: '2026-05-08T00:00:00.000Z',
      updatedAt: '2026-05-08T00:00:00.000Z',
      ...overrides,
    });
}

describe('student tenant routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setTenantSession();
  });

  it('filters student records by admission source metadata', async () => {
    await seedStudent('student-admission-1', {
      admissionSourceType: 'admission_crm',
      admissionSource: {
        type: 'admission_crm',
        applicantId: 'applicant-1',
        applicantNumber: 'ADM-00001',
        sessionId: 'admission-session-active',
        sessionName: '2026-27 Main Admission Window',
        convertedAt: '2026-05-08T00:00:00.000Z',
        convertedBy: 'tenant-admissions-1',
      },
      guardianProfile: {
        name: 'Neha Sharma',
        relationship: 'Mother',
        phone: '+919000000001',
        email: 'neha@example.com',
        sourceApplicantId: 'applicant-1',
      },
    });
    await seedStudent('student-direct-1', {
      firstName: 'Direct',
      lastName: 'Student',
      rollNumber: 'NUR-002',
      admissionSourceType: 'direct',
    });

    const res = await request(app)
      .get('/api/students?source=admission_crm')
      .set('Authorization', 'Bearer tenant-token');

    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(1);
    expect(res.body.data).toEqual([
      expect.objectContaining({
        id: 'student-admission-1',
        admissionSourceType: 'admission_crm',
        admissionSource: expect.objectContaining({
          applicantNumber: 'ADM-00001',
          sessionName: '2026-27 Main Admission Window',
        }),
        guardianProfile: expect.objectContaining({
          sourceApplicantId: 'applicant-1',
        }),
      }),
    ]);
  });

  it('updates section allocation while preventing duplicate roll numbers', async () => {
    await seedStudent('student-1', {
      firstName: 'Aarav',
      section: 'A',
      rollNumber: 'NUR-001',
    });
    await seedStudent('student-2', {
      firstName: 'Isha',
      section: 'B',
      rollNumber: 'NUR-002',
    });

    const duplicateRes = await request(app)
      .put('/api/students/student-2')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        section: 'A',
        rollNumber: 'NUR-001',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('STUDENT_ROLL_NUMBER_EXISTS');

    const updateRes = await request(app)
      .put('/api/students/student-2')
      .set('Authorization', 'Bearer tenant-token')
      .send({
        section: 'C',
        rollNumber: 'NUR-003',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data).toEqual(
      expect.objectContaining({
        id: 'student-2',
        section: 'C',
        rollNumber: 'NUR-003',
      }),
    );
  });
});
