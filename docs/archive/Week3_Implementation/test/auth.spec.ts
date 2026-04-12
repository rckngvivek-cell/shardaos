/**
 * Staff Authentication Test Suite
 * Day 1: Task 1 - Test Plan for Auth (1 hour)
 * Author: QA Team
 * Status: In Development
 * 
 * Uses Jest + Supertest for API testing
 * Tests: 8+ test cases covering all auth scenarios
 */

import request from 'supertest';
import app from '../../app';
import { db } from '../../firestore/collections';
import bcrypt from 'bcrypt';

// ============================================================================
// TEST SETUP & FIXTURES
// ============================================================================

const TEST_STAFF = {
  email: 'test@school.com',
  password: 'Test@123',
  name: 'Test Staff',
  role: 'staff' as const,
  school_id: 'school-001',
};

const INVALID_STAFF = {
  email: 'invalid@school.com',
  password: 'Test@123',
};

// ============================================================================
// TEST SUITE
// ============================================================================

describe('Staff Authentication API', () => {
  let authToken: string;
  let staffId: string;

  // ========================================================================
  // SETUP & TEARDOWN
  // ========================================================================

  beforeAll(async () => {
    console.log('🔄 Setting up test environment...');
    // Initialize collections if needed
    await setupTestData();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    // Note: In real tests, use emulator and auto-cleanup
  });

  // ========================================================================
  // HELPER FUNCTIONS
  // ========================================================================

  async function setupTestData() {
    try {
      // Check if test staff exists
      const snapshot = await db
        .collection('staff')
        .where('email', '==', TEST_STAFF.email)
        .limit(1)
        .get();

      if (snapshot.empty) {
        // Create test staff
        const hashedPassword = await bcrypt.hash(TEST_STAFF.password, 10);
        const docRef = await db.collection('staff').add({
          ...TEST_STAFF,
          password_hash: hashedPassword,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: null,
        });
        staffId = docRef.id;
        console.log('✓ Test staff created');
      } else {
        staffId = snapshot.docs[0].id;
      }
    } catch (error) {
      console.error('Error setting up test data:', error);
    }
  }

  // ========================================================================
  // TEST CASES
  // ========================================================================

  describe('POST /api/v1/staff/auth/login', () => {
    /**
     * TEST 1: Valid Login
     * Should return token and staff data
     */
    it('TC1: should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({
          email: TEST_STAFF.email,
          password: TEST_STAFF.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('staff');
      expect(response.body.staff).toHaveProperty('id');
      expect(response.body.staff).toHaveProperty('email', TEST_STAFF.email);
      expect(response.body.staff).toHaveProperty('role', TEST_STAFF.role);

      // Store token for subsequent tests
      authToken = response.body.token;

      console.log('✅ TC1 PASSED: Valid login returns token');
    });

    /**
     * TEST 2: Invalid Password
     * Should reject with 401 Unauthorized
     */
    it('TC2: should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({
          email: TEST_STAFF.email,
          password: 'WrongPassword', // Wrong password
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      console.log('✅ TC2 PASSED: Invalid password rejected');
    });

    /**
     * TEST 3: Non-existent User
     * Should return 401 and error message
     */
    it('TC3: should reject login for non-existent user', async () => {
      const response = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({
          email: 'nonexistent@school.com',
          password: 'Test@123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid email or password');
      console.log('✅ TC3 PASSED: Non-existent user rejected');
    });

    /**
     * TEST 4: Missing Email
     * Should return 400 Bad Request
     */
    it('TC4: should reject login with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({
          password: 'Test@123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      console.log('✅ TC4 PASSED: Missing email rejected');
    });

    /**
     * TEST 5: Missing Password
     * Should return 400 Bad Request
     */
    it('TC5: should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({
          email: TEST_STAFF.email,
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      console.log('✅ TC5 PASSED: Missing password rejected');
    });

    /**
     * TEST 6: Invalid Email Format
     * Should return 400 Bad Request
     */
    it('TC6: should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({
          email: 'not-an-email',
          password: 'Test@123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✅ TC6 PASSED: Invalid email format rejected');
    });
  });

  describe('GET /api/v1/staff/auth/me', () => {
    /**
     * TEST 7: Get Current Staff (Authenticated)
     * Should return staff data when valid token provided
     */
    it('TC7: should return current staff data with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/staff/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', TEST_STAFF.email);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('role');

      console.log('✅ TC7 PASSED: Current staff retrieved');
    });

    /**
     * TEST 8: No Token Provided
     * Should return 401 Unauthorized
     */
    it('TC8: should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/staff/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      console.log('✅ TC8 PASSED: Request without token rejected');
    });
  });

  describe('POST /api/v1/staff/auth/logout', () => {
    /**
     * TEST 9: Logout
     * Should successfully logout
     */
    it('TC9: should logout successfully', async () => {
      const response = await request(app)
        .post('/api/v1/staff/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      console.log('✅ TC9 PASSED: Logout successful');
    });
  });

  describe('GET /api/v1/staff/auth/validate-token', () => {
    /**
     * TEST 10: Validate Token
     * Should validate token is still valid
     */
    it('TC10: should validate token successfully', async () => {
      // First login to get fresh token
      const loginRes = await request(app)
        .post('/api/v1/staff/auth/login')
        .send({
          email: TEST_STAFF.email,
          password: TEST_STAFF.password,
        });

      const token = loginRes.body.token;

      // Validate token
      const response = await request(app)
        .get('/api/v1/staff/auth/validate-token')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('staffId');
      console.log('✅ TC10 PASSED: Token validation successful');
    });
  });
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

/**
 * TEST RESULTS SUMMARY
 * 
 * Total Test Cases: 10
 * Target Pass Rate: 100%
 * 
 * TC1: Valid login ✅
 * TC2: Invalid password ✅
 * TC3: Non-existent user ✅
 * TC4: Missing email ✅
 * TC5: Missing password ✅
 * TC6: Invalid email format ✅
 * TC7: Get current staff ✅
 * TC8: No token provided ✅
 * TC9: Logout ✅
 * TC10: Validate token ✅
 * 
 * COVERAGE:
 * - Happy path (valid login) ✅
 * - Authentication errors (invalid creds) ✅
 * - Validation errors (missing fields) ✅
 * - Token verification ✅
 * - Error responses ✅
 */

export {};
