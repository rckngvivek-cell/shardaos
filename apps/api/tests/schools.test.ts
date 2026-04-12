import request from 'supertest';
import { app } from '../app';

/**
 * Test suite for Schools endpoints (PR #1)
 * Coverage: POST /api/v1/schools, GET /api/v1/schools/{id}
 * Target: 85%+ coverage, 5+ test cases
 */

describe('Schools Endpoints', () => {
  const mockAdminToken = { uid: 'admin-1', role: 'admin', email: 'admin@test.com' };
  const mockUserToken = { uid: 'user-1', role: 'teacher', email: 'teacher@test.com' };

  // Mock auth middleware for tests
  beforeAll(() => {
    const originalAuthMiddleware = require('../middleware/auth').authMiddleware;
    require('../middleware/auth').authMiddleware = (req: any, res: any, next: any) => {
      // Set mock user based on Authorization header
      if (req.headers.authorization === 'Bearer admin') {
        req.user = mockAdminToken;
      } else if (req.headers.authorization === 'Bearer user') {
        req.user = mockUserToken;
      } else if (req.headers.authorization === 'Bearer none') {
        req.user = null;
      }
      next();
    };
  });

  describe('POST /api/v1/schools - Create School', () => {
    /**
     * TC1: Create school with valid data
     * Expected: 201 Created + school response
     */
    it('TC1: should create school with valid data', async () => {
      const schoolData = {
        name: 'St. John\'s Public School',
        email: 'principal@stjohns.edu.in',
        phone: '+91-11-4095-5678',
        address: '123 Education Street',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        principalName: 'Dr. Rajesh Singh',
        schoolRegistrationNumber: 'SR-2024-001'
      };

      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', 'Bearer admin')
        .send(schoolData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: schoolData.name,
        email: schoolData.email,
        phone: schoolData.phone,
        city: schoolData.city,
        status: 'active'
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.createdAt).toBeDefined();
    });

    /**
     * TC2: Create school with missing required field
     * Expected: 400 Bad Request
     */
    it('TC2: should return 400 for missing required field (email)', async () => {
      const invalidSchoolData = {
        name: 'Test School',
        phone: '+91-11-4095-5678',
        address: '123 Street',
        city: 'Delhi',
        state: 'Delhi',
        pinCode: '110001',
        principalName: 'Principal Name',
        schoolRegistrationNumber: 'SR-2024-002'
        // Missing email
      };

      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', 'Bearer admin')
        .send(invalidSchoolData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toMatch(/VALIDATION_ERROR|ZodError/);
    });

    /**
     * TC3: Create school with invalid email format
     * Expected: 400 Bad Request
     */
    it('TC3: should return 400 for invalid email format', async () => {
      const invalidSchoolData = {
        name: 'Test School',
        email: 'invalid-email',
        phone: '+91-11-4095-5678',
        address: '123 Street',
        city: 'Delhi',
        state: 'Delhi',
        pinCode: '110001',
        principalName: 'Principal Name',
        schoolRegistrationNumber: 'SR-2024-003'
      };

      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', 'Bearer admin')
        .send(invalidSchoolData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    /**
     * TC4: Create school with duplicate email
     * Expected: 409 Conflict
     */
    it('TC4: should return 409 for duplicate email', async () => {
      const schoolData = {
        name: 'Green Valley Public School',
        email: 'principal@greenvalley.edu.in', // Already exists
        phone: '+91-11-4095-5678',
        address: '123 Education Street',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        principalName: 'Dr. Rajesh Singh',
        schoolRegistrationNumber: 'SR-2024-004'
      };

      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', 'Bearer admin')
        .send(schoolData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CONFLICT');
    });

    /**
     * TC5: Create school without admin authorization
     * Expected: 403 Forbidden
     */
    it('TC5: should return 403 for non-admin user', async () => {
      const schoolData = {
        name: 'Test School',
        email: 'admin@test-school.edu.in',
        phone: '+91-11-4095-5678',
        address: '123 Education Street',
        city: 'New Delhi',
        state: 'Delhi',
        pinCode: '110001',
        principalName: 'Principal Name',
        schoolRegistrationNumber: 'SR-2024-005'
      };

      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', 'Bearer user') // Teacher, not admin
        .send(schoolData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/schools/:id - Get School Details', () => {
    /**
     * TC6: Get existing school
     * Expected: 200 OK + school data
     */
    it('TC6: should get school details for valid ID', async () => {
      const response = await request(app)
        .get('/api/v1/schools/demo-school')
        .set('Authorization', 'Bearer user');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: 'demo-school',
        name: 'Green Valley Public School',
        email: 'principal@greenvalley.edu.in'
      });
    });

    /**
     * TC7: Get non-existent school
     * Expected: 404 Not Found
     */
    it('TC7: should return 404 for non-existent school', async () => {
      const response = await request(app)
        .get('/api/v1/schools/non-existent-id')
        .set('Authorization', 'Bearer user');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SCHOOL_NOT_FOUND');
    });

    /**
     * TC8: Get school without authentication
     * Expected: 401 Unauthorized
     */
    it('TC8: should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/v1/schools/demo-school')
        .set('Authorization', 'Bearer none');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    /**
     * TC9: Get school with missing auth header
     * Expected: 401 Unauthorized
     */
    it('TC9: should return 401 with missing auth header', async () => {
      const response = await request(app)
        .get('/api/v1/schools/demo-school');
        // No Authorization header

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Response format validation', () => {
    /**
     * TC10: Response includes required metadata
     */
    it('TC10: response includes timestamp and version metadata', async () => {
      const response = await request(app)
        .get('/api/v1/schools/demo-school')
        .set('Authorization', 'Bearer user');

      expect(response.status).toBe(200);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.timestamp).toBeDefined();
      expect(response.body.meta.version).toBeDefined();
    });
  });
});
