/**
 * Staff Attendance Management Test Suite
 * Day 2: Task 2.3 - Add Attendance Tests (2 hours)
 * Author: QA Team
 * Status: IMPLEMENTATION
 */

import request from 'supertest';
import app from '../../app';
import { db } from '../../firestore/collections';

// ============================================================================
// TEST SETUP
// ============================================================================

const TEST_CLASS_ID = 'class-001';
const TEST_STUDENT_ID = 'student-123';
const TEST_AUTH_TOKEN = 'valid-jwt-token'; // From Day 1 login test

describe('Staff Attendance Management API', () => {
  // ========================================================================
  // TESTS: Mark Attendance
  // ========================================================================

  describe('POST /api/v1/staff/attendance/mark', () => {
    /**
     * TC11: Mark attendance with valid input
     * Success: 201 Created + attendance record returned
     */
    it('TC11: should mark attendance with valid input', async () => {
      const response = await request(app)
        .post('/api/v1/staff/attendance/mark')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send({
          class_id: TEST_CLASS_ID,
          student_id: TEST_STUDENT_ID,
          status: 'present',
          notes: 'On time',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'created');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('student_id', TEST_STUDENT_ID);

      console.log('✅ TC11 PASSED: Attendance marked successfully');
    });

    /**
     * TC12: Mark attendance with invalid class_id (missing)
     * Error: 400 Bad Request
     */
    it('TC12: should reject mark attendance with missing class_id', async () => {
      const response = await request(app)
        .post('/api/v1/staff/attendance/mark')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send({
          student_id: TEST_STUDENT_ID,
          status: 'present',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Validation failed');
      console.log('✅ TC12 PASSED: Missing class_id rejected');
    });

    /**
     * TC13: Mark attendance with invalid status
     * Error: 400 Bad Request
     */
    it('TC13: should reject mark attendance with invalid status', async () => {
      const response = await request(app)
        .post('/api/v1/staff/attendance/mark')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send({
          class_id: TEST_CLASS_ID,
          student_id: TEST_STUDENT_ID,
          status: 'invalid-status',
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      console.log('✅ TC13 PASSED: Invalid status rejected');
    });

    /**
     * TC14: Mark duplicate attendance (same student, same day)
     * Success: 200 Updated (not 201 Created)
     */
    it('TC14: should update duplicate attendance record', async () => {
      // First mark
      await request(app)
        .post('/api/v1/staff/attendance/mark')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send({
          class_id: TEST_CLASS_ID,
          student_id: 'student-dup-test',
          status: 'absent',
        })
        .expect(201);

      // Second mark (duplicate) - should update
      const response = await request(app)
        .post('/api/v1/staff/attendance/mark')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send({
          class_id: TEST_CLASS_ID,
          student_id: 'student-dup-test',
          status: 'present', // Changed from absent
        })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'updated');
      console.log('✅ TC14 PASSED: Duplicate attendance updated');
    });
  });

  // ========================================================================
  // TESTS: Get Attendance by Class
  // ========================================================================

  describe('GET /api/v1/staff/attendance/by-class', () => {
    /**
     * TC15: Get attendance records for class
     * Success: 200 OK + array of records
     */
    it('TC15: should get attendance records for class', async () => {
      // First create some records
      await request(app)
        .post('/api/v1/staff/attendance/mark')
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .send({
          class_id: TEST_CLASS_ID,
          student_id: 'student-001',
          status: 'present',
        });

      // Then fetch them
      const response = await request(app)
        .get(
          `/api/v1/staff/attendance/by-class?class_id=${TEST_CLASS_ID}&date=${new Date()
            .toISOString()
            .split('T')[0]}`
        )
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('records');
      expect(Array.isArray(response.body.records)).toBe(true);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('class_id', TEST_CLASS_ID);

      console.log('✅ TC15 PASSED: Attendance records retrieved');
    });

    /**
     * TC16: Get attendance without authentication
     * Error: 401 Unauthorized
     */
    it('TC16: should reject request without authentication', async () => {
      const response = await request(app)
        .get(
          `/api/v1/staff/attendance/by-class?class_id=${TEST_CLASS_ID}`
        )
        .expect(401);

      expect(response.body).toHaveProperty('error');
      console.log('✅ TC16 PASSED: Unauthenticated request rejected');
    });
  });

  // ========================================================================
  // TESTS: Get Attendance Stats
  // ========================================================================

  describe('GET /api/v1/staff/attendance/stats', () => {
    /**
     * TC17: Get attendance statistics
     * Success: 200 OK + statistical breakdown
     */
    it('TC17: should get attendance statistics', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/attendance/stats?class_id=${TEST_CLASS_ID}&date_range=week`)
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .expect(200);

      expect(response.body).toHaveProperty('class_id');
      expect(response.body).toHaveProperty('statistics');
      expect(response.body.statistics).toHaveProperty('total');
      expect(response.body.statistics).toHaveProperty('present_percentage');
      expect(response.body.statistics).toHaveProperty('absent_percentage');
      expect(response.body.statistics).toHaveProperty('late_percentage');

      console.log('✅ TC17 PASSED: Attendance statistics calculated');
    });

    /**
     * TC18: Get stats with invalid date_range
     * Should default to 'week'
     */
    it('TC18: should use default date_range', async () => {
      const response = await request(app)
        .get(`/api/v1/staff/attendance/stats?class_id=${TEST_CLASS_ID}`)
        .set('Authorization', `Bearer ${TEST_AUTH_TOKEN}`)
        .expect(200);

      expect(response.body.date_range).toBe('week');
      console.log('✅ TC18 PASSED: Default date_range applied');
    });
  });
});

// ============================================================================
// TEST SUMMARY
// ============================================================================

/**
 * ATTENDANCE TEST COVERAGE
 * 
 * Total New Tests: 8
 * Previous Tests: 10 (auth)
 * Total: 18 tests
 * 
 * Coverage:
 * ├─ Mark attendance (happy path) ✅
 * ├─ Mark attendance (validation errors) ✅
 * ├─ Duplicate detection + update ✅
 * ├─ Get by class ✅
 * ├─ Authentication enforcement ✅
 * ├─ Statistics calculation ✅
 * └─ Default parameters ✅
 * 
 * Expected Pass Rate: 18/18 (100%)
 * Expected Coverage: 80%+
 */

export {};
