import request from 'supertest';
import { app } from '../app';

/**
 * Test suite for Students endpoints (PR #1)
 * Coverage: POST /api/v1/students, GET /api/v1/students
 * Target: 85%+ coverage, 5+ test cases
 */

describe('Students Endpoints', () => {
  const mockAdminToken = { uid: 'admin-1', role: 'admin', email: 'admin@test.com' };
  const mockTeacherToken = { uid: 'teacher-1', role: 'teacher', email: 'teacher@test.com' };

  // Mock auth middleware for tests
  beforeAll(() => {
    require('../middleware/auth').authMiddleware = (req: any, res: any, next: any) => {
      if (req.headers.authorization === 'Bearer admin') {
        req.user = mockAdminToken;
      } else if (req.headers.authorization === 'Bearer teacher') {
        req.user = mockTeacherToken;
      } else if (req.headers.authorization === 'Bearer none') {
        req.user = null;
      }
      next();
    };
  });

  describe('POST /api/v1/students - Add Student', () => {
    /**
     * TC1: Add student with valid data
     * Expected: 201 Created + student response
     */
    it('TC1: should add student with valid data', async () => {
      const studentData = {
        schoolId: 'demo-school',
        firstName: 'Priya',
        lastName: 'Singh',
        email: 'priya.singh@student.edu.in',
        phone: '+91-9876543212',
        dateOfBirth: '2010-03-20',
        gradeLevel: '10',
        rollNumber: 'A-102',
        parentName: 'Rajendra Singh',
        parentPhone: '+91-9876543213',
        parentEmail: 'rajendra@email.com',
        enrollmentDate: '2026-05-07T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', 'Bearer admin')
        .send(studentData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        firstName: 'Priya',
        lastName: 'Singh',
        email: 'priya.singh@student.edu.in',
        gradeLevel: '10',
        status: 'active'
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    /**
     * TC2: Add student with missing required field
     * Expected: 400 Bad Request
     */
    it('TC2: should return 400 for missing required field (firstName)', async () => {
      const invalidStudentData = {
        schoolId: 'demo-school',
        lastName: 'Singh',
        email: 'test@student.edu.in',
        phone: '+91-9876543214',
        dateOfBirth: '2010-05-15',
        gradeLevel: '10',
        rollNumber: 'A-103',
        parentName: 'Parent Name',
        parentPhone: '+91-9876543215',
        parentEmail: 'parent@email.com',
        enrollmentDate: '2026-05-07T10:00:00Z'
        // Missing firstName
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', 'Bearer admin')
        .send(invalidStudentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * TC3: Add student with invalid email format
     * Expected: 400 Bad Request
     */
    it('TC3: should return 400 for invalid email format', async () => {
      const invalidStudentData = {
        schoolId: 'demo-school',
        firstName: 'Test',
        lastName: 'Student',
        email: 'invalid-email',
        phone: '+91-9876543216',
        dateOfBirth: '2010-05-15',
        gradeLevel: '10',
        rollNumber: 'A-104',
        parentName: 'Parent Name',
        parentPhone: '+91-9876543217',
        parentEmail: 'parent@email.com',
        enrollmentDate: '2026-05-07T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', 'Bearer admin')
        .send(invalidStudentData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * TC4: Add student with duplicate email
     * Expected: 409 Conflict
     */
    it('TC4: should return 409 for duplicate email', async () => {
      const studentData = {
        schoolId: 'demo-school',
        firstName: 'Arjun',
        lastName: 'Kumar',
        email: 'arjun.kumar@student.edu.in', // Already exists
        phone: '+91-9876543218',
        dateOfBirth: '2010-05-15',
        gradeLevel: '10',
        rollNumber: 'A-105',
        parentName: 'Rajesh Kumar',
        parentPhone: '+91-9876543219',
        parentEmail: 'rajesh@email.com',
        enrollmentDate: '2026-05-07T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', 'Bearer admin')
        .send(studentData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    /**
     * TC5: Add student with non-existent school
     * Expected: 404 Not Found
     */
    it('TC5: should return 404 for non-existent school', async () => {
      const studentData = {
        schoolId: 'non-existent-school',
        firstName: 'Test',
        lastName: 'Student',
        email: 'test@student.edu.in',
        phone: '+91-9876543220',
        dateOfBirth: '2010-05-15',
        gradeLevel: '10',
        rollNumber: 'A-106',
        parentName: 'Parent Name',
        parentPhone: '+91-9876543221',
        parentEmail: 'parent@email.com',
        enrollmentDate: '2026-05-07T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', 'Bearer admin')
        .send(studentData);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SCHOOL_NOT_FOUND');
    });

    /**
     * TC6: Add student without admin authorization
     * Expected: 403 Forbidden
     */
    it('TC6: should return 403 for non-admin user', async () => {
      const studentData = {
        schoolId: 'demo-school',
        firstName: 'Test',
        lastName: 'Student',
        email: 'test@student.edu.in',
        phone: '+91-9876543222',
        dateOfBirth: '2010-05-15',
        gradeLevel: '10',
        rollNumber: 'A-107',
        parentName: 'Parent Name',
        parentPhone: '+91-9876543223',
        parentEmail: 'parent@email.com',
        enrollmentDate: '2026-05-07T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', 'Bearer teacher') // Teacher, not admin
        .send(studentData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    /**
     * TC7: Add student without authentication
     * Expected: 401 Unauthorized
     */
    it('TC7: should return 401 without authentication', async () => {
      const studentData = {
        schoolId: 'demo-school',
        firstName: 'Test',
        lastName: 'Student',
        email: 'test@student.edu.in',
        phone: '+91-9876543224',
        dateOfBirth: '2010-05-15',
        gradeLevel: '10',
        rollNumber: 'A-108',
        parentName: 'Parent Name',
        parentPhone: '+91-9876543225',
        parentEmail: 'parent@email.com',
        enrollmentDate: '2026-05-07T10:00:00Z'
      };

      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', 'Bearer none')
        .send(studentData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('GET /api/v1/students - List Students', () => {
    /**
     * TC8: List students with valid schoolId
     * Expected: 200 OK + paginated students
     */
    it('TC8: should list students with valid pagination', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .query({ schoolId: 'demo-school', limit: 20, offset: 0 })
        .set('Authorization', 'Bearer teacher');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBeDefined();
      expect(response.body.pagination.limit).toBe(20);
      expect(response.body.pagination.offset).toBe(0);
      expect(response.body.pagination.hasMore).toBeDefined();
    });

    /**
     * TC9: List students with grade level filter
     * Expected: 200 OK + filtered students
     */
    it('TC9: should filter students by grade level', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .query({ schoolId: 'demo-school', gradeLevel: '10', limit: 20 })
        .set('Authorization', 'Bearer teacher');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      // All returned students should be in grade 10
      response.body.data.forEach((student: any) => {
        expect(student.gradeLevel).toBe('10');
      });
    });

    /**
     * TC10: List students with status filter
     * Expected: 200 OK + filtered by status
     */
    it('TC10: should filter students by status', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .query({ schoolId: 'demo-school', status: 'active' })
        .set('Authorization', 'Bearer teacher');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // All returned students should have active status
      response.body.data.forEach((student: any) => {
        expect(student.status).toBe('active');
      });
    });

    /**
     * TC11: List students with non-existent school
     * Expected: 404 Not Found
     */
    it('TC11: should return 404 for non-existent school', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .query({ schoolId: 'non-existent-school' })
        .set('Authorization', 'Bearer teacher');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SCHOOL_NOT_FOUND');
    });

    /**
     * TC12: List students without authentication
     * Expected: 401 Unauthorized
     */
    it('TC12: should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .query({ schoolId: 'demo-school' })
        .set('Authorization', 'Bearer none');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    /**
     * TC13: Pagination with custom limit
     * Expected: 200 OK with specified limit
     */
    it('TC13: should respect custom limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .query({ schoolId: 'demo-school', limit: 5, offset: 0 })
        .set('Authorization', 'Bearer teacher');

      expect(response.status).toBe(200);
      expect(response.body.pagination.limit).toBe(5);
    });
  });

  describe('Response format validation', () => {
    /**
     * TC14: Student response includes all required fields
     */
    it('TC14: student data includes all required fields', async () => {
      const response = await request(app)
        .get('/api/v1/students')
        .query({ schoolId: 'demo-school', limit: 1 })
        .set('Authorization', 'Bearer teacher');

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        const student = response.body.data[0];
        expect(student.id).toBeDefined();
        expect(student.firstName).toBeDefined();
        expect(student.lastName).toBeDefined();
        expect(student.email).toBeDefined();
        expect(student.gradeLevel).toBeDefined();
        expect(student.status).toBeDefined();
        expect(student.createdAt).toBeDefined();
      }
    });
  });
});
