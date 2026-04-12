import request from 'supertest';
import { app } from '../app';

/**
 * Test suite for Attendance endpoints (PR #1)
 * Coverage: POST /api/v1/attendance
 * Target: 85%+ coverage, 5+ test cases
 */

describe('Attendance Endpoints', () => {
  const mockAdminToken = { uid: 'admin-1', role: 'admin', email: 'admin@test.com' };
  const mockTeacherToken = { uid: 'teacher-1', role: 'teacher', email: 'teacher@test.com' };
  const mockStudentToken = { uid: 'student-1', role: 'student', email: 'student@test.com' };

  // Mock auth middleware for tests
  beforeAll(() => {
    require('../middleware/auth').authMiddleware = (req: any, res: any, next: any) => {
      if (req.headers.authorization === 'Bearer admin') {
        req.user = mockAdminToken;
      } else if (req.headers.authorization === 'Bearer teacher') {
        req.user = mockTeacherToken;
      } else if (req.headers.authorization === 'Bearer student') {
        req.user = mockStudentToken;
      } else if (req.headers.authorization === 'Bearer none') {
        req.user = null;
      }
      next();
    };
  });

  describe('POST /api/v1/attendance - Mark Attendance', () => {
    /**
     * TC1: Mark attendance with valid data
     * Expected: 201 Created + attendance record
     */
    it('TC1: should mark attendance with valid data', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-1',
        date: '2026-05-06',
        status: 'present',
        notes: 'Regular attendance',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        schoolId: 'demo-school',
        studentId: 'student-1',
        date: '2026-05-06',
        status: 'present',
        notes: 'Regular attendance'
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.markedAt).toBeDefined();
    });

    /**
     * TC2: Mark attendance with absent status
     * Expected: 201 Created with absent status
     */
    it('TC2: should mark absence with valid data', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-2',
        date: '2026-05-07',
        status: 'absent',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('absent');
    });

    /**
     * TC3: Mark attendance with late status
     * Expected: 201 Created with late status
     */
    it('TC3: should mark late attendance', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-3',
        date: '2026-05-08',
        status: 'late',
        notes: 'Heavy traffic',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('late');
    });

    /**
     * TC4: Mark attendance with excused status
     * Expected: 201 Created with excused status
     */
    it('TC4: should mark excused attendance', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-4',
        date: '2026-05-09',
        status: 'excused',
        notes: 'Medical appointment',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('excused');
    });

    /**
     * TC5: Mark attendance with missing required field
     * Expected: 400 Bad Request
     */
    it('TC5: should return 400 for missing required field (status)', async () => {
      const invalidAttendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-5',
        date: '2026-05-10',
        // Missing status
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(invalidAttendanceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * TC6: Mark attendance with invalid date format
     * Expected: 400 Bad Request
     */
    it('TC6: should return 400 for invalid date format', async () => {
      const invalidAttendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-6',
        date: '2026-13-45', // Invalid date
        status: 'present',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(invalidAttendanceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * TC7: Mark attendance with invalid status
     * Expected: 400 Bad Request
     */
    it('TC7: should return 400 for invalid status', async () => {
      const invalidAttendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-7',
        date: '2026-05-11',
        status: 'invalid-status',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(invalidAttendanceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * TC8: Mark duplicate attendance on same date
     * Expected: 409 Conflict
     */
    it('TC8: should return 409 for duplicate attendance on same date', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-8',
        date: '2026-05-12',
        status: 'present',
        markedBy: 'teacher-1'
      };

      // First request - should succeed
      let response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(201);

      // Second request with same student & date - should fail
      response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    /**
     * TC9: Mark attendance for non-existent school
     * Expected: 404 Not Found
     */
    it('TC9: should return 404 for non-existent school', async () => {
      const attendanceData = {
        schoolId: 'non-existent-school',
        studentId: 'student-9',
        date: '2026-05-13',
        status: 'present',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SCHOOL_NOT_FOUND');
    });

    /**
     * TC10: Mark attendance without teacher/admin authorization
     * Expected: 403 Forbidden
     */
    it('TC10: should return 403 for student user', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-10',
        date: '2026-05-14',
        status: 'present',
        markedBy: 'student-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer student') // Student, not teacher/admin
        .send(attendanceData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    /**
     * TC11: Mark attendance without authentication
     * Expected: 401 Unauthorized
     */
    it('TC11: should return 401 without authentication', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-11',
        date: '2026-05-15',
        status: 'present',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer none')
        .send(attendanceData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    /**
     * TC12: Mark attendance with admin role
     * Expected: 201 Created (admin can also mark)
     */
    it('TC12: should allow admin to mark attendance', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-12',
        date: '2026-05-16',
        status: 'present',
        markedBy: 'admin-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer admin')
        .send(attendanceData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    /**
     * TC13: Mark attendance with optional notes
     * Expected: 201 Created with notes preserved
     */
    it('TC13: should include optional notes in response', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-13',
        date: '2026-05-17',
        status: 'late',
        notes: 'Left early for sports event',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(201);
      expect(response.body.data.notes).toBe('Left early for sports event');
    });

    /**
     * TC14: Attendance with notes exceeding max length
     * Expected: 400 Bad Request
     */
    it('TC14: should return 400 for notes exceeding max length', async () => {
      const longNotes = 'a'.repeat(501); // Max is 500
      const invalidAttendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-14',
        date: '2026-05-18',
        status: 'present',
        notes: longNotes,
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(invalidAttendanceData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response format validation', () => {
    /**
     * TC15: Attendance response includes all required fields
     */
    it('TC15: attendance response includes all required fields', async () => {
      const attendanceData = {
        schoolId: 'demo-school',
        studentId: 'student-15',
        date: '2026-05-19',
        status: 'present',
        markedBy: 'teacher-1'
      };

      const response = await request(app)
        .post('/api/v1/attendance')
        .set('Authorization', 'Bearer teacher')
        .send(attendanceData);

      expect(response.status).toBe(201);
      const data = response.body.data;
      expect(data.id).toBeDefined();
      expect(data.schoolId).toBeDefined();
      expect(data.studentId).toBeDefined();
      expect(data.date).toBeDefined();
      expect(data.status).toBeDefined();
      expect(data.markedBy).toBeDefined();
      expect(data.markedAt).toBeDefined();
    });
  });
});
