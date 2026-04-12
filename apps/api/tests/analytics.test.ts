/**
 * Analytics Service Tests
 * tests/analytics.test.ts
 */

import { initializeApp, cert, getApps, deleteApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { AnalyticsService } from '../src/services/analytics';
import { Firestore } from 'firebase-admin/firestore';

let db: Firestore;
let analyticsService: AnalyticsService;

// Test setup
beforeAll(() => {
  // Use Firebase Emulator for testing
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
  process.env.NODE_ENV = 'test';

  // Initialize Firebase Admin
  if (!getApps().length) {
    initializeApp({
      projectId: 'test-project',
    });
  }

  db = getFirestore();
  analyticsService = new AnalyticsService(db);
});

afterAll(async () => {
  // Cleanup
  if (getApps().length > 0) {
    await deleteApp(getApps()[0]);
  }
});

// Clear collections before each test
beforeEach(async () => {
  const collections = ['analytics_events', 'metrics'];
  for (const collection of collections) {
    const snapshot = await db.collection(collection).get();
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  }
});

describe('AnalyticsService', () => {
  describe('logEvent', () => {
    test('should log event to Firestore', async () => {
      const event = {
        event_name: 'test_event',
        timestamp: new Date().toISOString(),
        user_id: 'user_123',
        properties: { test: true },
        context: {
          environment: 'test',
          version: '0.1.0',
        },
      };

      await analyticsService.logEvent(event);

      const snapshot = await db.collection('analytics_events').get();
      expect(snapshot.docs.length).toBe(1);

      const doc = snapshot.docs[0].data();
      expect(doc.event_name).toBe('test_event');
      expect(doc.user_id).toBe('user_123');
      expect(doc._stored_at).toBeDefined();
    });

    test('should update real-time metrics', async () => {
      const event = {
        event_name: 'api_request',
        timestamp: new Date().toISOString(),
        user_id: 'user_123',
        properties: {},
        context: {
          environment: 'test',
          version: '0.1.0',
        },
      };

      await analyticsService.logEvent(event);

      // Check metrics collection
      const today = new Date().toISOString().split('T')[0];
      const metricsDoc = await db.collection('metrics').doc(`daily_${today}`).get();

      expect(metricsDoc.exists).toBe(true);
      expect(metricsDoc.data()?.total_events).toBe(1);
      expect(metricsDoc.data()?.api_request).toBe(1);
    });
  });

  describe('logApiCall', () => {
    test('should log API call with correct properties', async () => {
      await analyticsService.logApiCall(
        '/api/v1/students',
        'POST',
        201,
        125,
        'user_123',
        'teacher'
      );

      const snapshot = await db.collection('analytics_events').get();
      expect(snapshot.docs.length).toBe(1);

      const doc = snapshot.docs[0].data();
      expect(doc.event_name).toBe('api_request');
      expect(doc.properties.endpoint).toBe('/api/v1/students');
      expect(doc.properties.method).toBe('POST');
      expect(doc.properties.status_code).toBe(201);
      expect(doc.properties.latency_ms).toBe(125);
      expect(doc.properties.is_success).toBe(true);
      expect(doc.properties.is_error).toBe(false);
    });

    test('should mark error responses correctly', async () => {
      await analyticsService.logApiCall(
        '/api/v1/students',
        'GET',
        404,
        50,
        'user_123',
        'student'
      );

      const snapshot = await db.collection('analytics_events').get();
      const doc = snapshot.docs[0].data();

      expect(doc.properties.is_success).toBe(false);
      expect(doc.properties.is_error).toBe(true);
    });
  });

  describe('logError', () => {
    test('should log error with correct severity', async () => {
      await analyticsService.logError(
        'auth_error',
        'Unauthorized access',
        '/api/v1/admin',
        'user_123',
        401
      );

      const snapshot = await db.collection('analytics_events').get();
      const doc = snapshot.docs[0].data();

      expect(doc.event_name).toBe('api_error');
      expect(doc.properties.error_type).toBe('auth_error');
      expect(doc.properties.severity).toBe('medium');
      expect(doc.properties.status_code).toBe(401);
    });

    test('should assign correct severity levels', async () => {
      const testCases = [
        { errorType: 'validation_error', expectedSeverity: 'low' },
        { errorType: 'not_found', expectedSeverity: 'low' },
        { errorType: 'auth_error', expectedSeverity: 'medium' },
        { errorType: 'server_error', expectedSeverity: 'high' },
        { errorType: 'database_error', expectedSeverity: 'critical' },
      ];

      for (const testCase of testCases) {
        // Clear events
        const snapshot = await db.collection('analytics_events').get();
        for (const doc of snapshot.docs) {
          await doc.ref.delete();
        }

        await analyticsService.logError(
          testCase.errorType,
          'Test error',
          '/test'
        );

        const newSnapshot = await db.collection('analytics_events').get();
        const doc = newSnapshot.docs[0].data();

        expect(doc.properties.severity).toBe(testCase.expectedSeverity);
      }
    });
  });

  describe('logAuthEvent', () => {
    test('should log login event', async () => {
      await analyticsService.logAuthEvent('login', 'user_123', true);

      const snapshot = await db.collection('analytics_events').get();
      const doc = snapshot.docs[0].data();

      expect(doc.event_name).toBe('user_login');
      expect(doc.user_id).toBe('user_123');
      expect(doc.properties.success).toBe(true);
      expect(doc.properties.failure_reason).toBeUndefined();
    });

    test('should log failed login with reason', async () => {
      await analyticsService.logAuthEvent(
        'login',
        'user_123',
        false,
        'Invalid password'
      );

      const snapshot = await db.collection('analytics_events').get();
      const doc = snapshot.docs[0].data();

      expect(doc.properties.success).toBe(false);
      expect(doc.properties.failure_reason).toBe('Invalid password');
    });
  });

  describe('logFeatureUsage', () => {
    test('should log feature access', async () => {
      await analyticsService.logFeatureUsage(
        'student_enrollment',
        'create',
        'user_123',
        'admin',
        1,
        5000
      );

      const snapshot = await db.collection('analytics_events').get();
      const doc = snapshot.docs[0].data();

      expect(doc.event_name).toBe('feature_accessed');
      expect(doc.properties.feature_name).toBe('student_enrollment');
      expect(doc.properties.action).toBe('create');
      expect(doc.properties.item_count).toBe(1);
      expect(doc.properties.duration_ms).toBe(5000);
    });
  });

  describe('logBusinessEvent', () => {
    test('should log student enrolled event', async () => {
      await analyticsService.logBusinessEvent(
        'student_enrolled',
        'user_123',
        {
          school_id: 'school_1',
          student_id: 'student_1',
          grade: '10A',
          section: 'A',
        }
      );

      const snapshot = await db.collection('analytics_events').get();
      const doc = snapshot.docs[0].data();

      expect(doc.event_name).toBe('student_enrolled');
      expect(doc.properties.school_id).toBe('school_1');
      expect(doc.properties.student_id).toBe('student_1');
    });

    test('should log attendance marked event', async () => {
      await analyticsService.logBusinessEvent(
        'attendance_marked',
        'user_123',
        {
          school_id: 'school_1',
          class_id: 'class_1',
          present_count: 25,
          absent_count: 5,
          date: '2026-05-06',
        }
      );

      const snapshot = await db.collection('analytics_events').get();
      const doc = snapshot.docs[0].data();

      expect(doc.event_name).toBe('attendance_marked');
      expect(doc.properties.present_count).toBe(25);
      expect(doc.properties.absent_count).toBe(5);
    });
  });

  describe('getRealTimeMetrics', () => {
    test('should return correct metrics', async () => {
      // Log multiple events
      await analyticsService.logApiCall(
        '/api/v1/students',
        'GET',
        200,
        100,
        'user_1',
        'admin'
      );
      await analyticsService.logApiCall(
        '/api/v1/students',
        'GET',
        200,
        200,
        'user_2',
        'teacher'
      );
      await analyticsService.logApiCall(
        '/api/v1/students',
        'POST',
        500,
        150,
        'user_1',
        'admin'
      );

      const metrics = await analyticsService.getRealTimeMetrics();

      expect(metrics.total_events).toBe(3);
      expect(metrics.unique_users).toBe(2);
      expect(metrics.api_requests).toBe(3);
      expect(metrics.error_count).toBe(1);
      expect(metrics.error_rate).toBe(33.33);
      expect(metrics.latency.p50).toBe(150);
      expect(metrics.latency.p95).toBeLessThanOrEqual(200);
      expect(metrics.latency.p99).toBeLessThanOrEqual(200);
      expect(metrics.latency.mean).toBe(150);
    });
  });

  describe('Event batching', () => {
    test('should handle multiple concurrent events', async () => {
      const events = Array.from({ length: 10 }, (_, i) => ({
        event_name: 'api_request',
        timestamp: new Date().toISOString(),
        user_id: `user_${i % 3}`,
        properties: {
          endpoint: `/api/endpoint_${i}`,
          latency_ms: Math.random() * 500,
        },
        context: {
          environment: 'test',
          version: '0.1.0',
        },
      }));

      // Log all events concurrently
      await Promise.all(
        events.map((event) => analyticsService.logEvent(event))
      );

      const snapshot = await db.collection('analytics_events').get();
      expect(snapshot.docs.length).toBe(10);
    });
  });
});
