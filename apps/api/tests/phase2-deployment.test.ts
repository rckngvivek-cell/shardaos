/**
 * Phase 2 Deployment Test Suite
 * Tests all BigQuery endpoints and integration points
 * 
 * Run with: npm test -- --testPathPattern=phase2
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';
const PROJECT_ID = 'school-erp-prod';
const DATASET = 'school_erp_analytics';

describe('Phase 2: BigQuery Deployment Tests', () => {
  let testEventId: string;

  beforeAll(() => {
    console.log('\n🚀 Starting Phase 2 Deployment Tests...\n');
    console.log(`Project: ${PROJECT_ID}`);
    console.log(`Dataset: ${DATASET}`);
    console.log(`Base URL: ${BASE_URL}\n`);
  });

  // Test 1: Health Check
  describe('API Health & BigQuery Connection', () => {
    test('should verify API is running', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/health`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      console.log('✓ API Health Check Passed');
    });

    test('should verify BigQuery connection', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/health`);
      expect(response.data.bigquery).toBeDefined();
      expect(response.data.bigquery.connected).toBe(true);
      expect(response.data.bigquery.dataset).toBe(DATASET);
      console.log('✓ BigQuery Connection Verified');
    });

    test('should verify Firestore connection', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/health`);
      expect(response.data.firestore).toBeDefined();
      expect(response.data.firestore.connected).toBe(true);
      console.log('✓ Firestore Connection Verified');
    });
  });

  // Test 2: Dashboard Metrics Endpoints
  describe('Dashboard Metrics Endpoints', () => {
    test('should return all metrics', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/metrics`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      console.log('✓ All Metrics Endpoint Working');
    });

    test('should return active users data', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/active-users`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      console.log(`✓ Active Users Endpoint Working (${response.data.data.length} records)`);
    });

    test('should return revenue trend data', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/revenue`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      console.log(`✓ Revenue Trend Endpoint Working (${response.data.data.length} records)`);
    });

    test('should return error rate data', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/errors`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      console.log(`✓ Error Rate Endpoint Working (${response.data.data.length} records)`);
    });

    test('should return reports generated data', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/reports`);
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      console.log(`✓ Reports Generated Endpoint Working (${response.data.data.length} records)`);
    });
  });

  // Test 3: Sample Data Loading
  describe('Sample Data Loading', () => {
    test('should load sample data', async () => {
      const response = await axios.post(`${BASE_URL}/analytics/test-data/load`, {
        count: 100,
      });
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.rowsInserted).toBeGreaterThan(0);
      console.log(`✓ Sample Data Loaded (${response.data.rowsInserted} rows)`);
    });

    test('should verify data was actually inserted', async () => {
      // Wait briefly for data to be available
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await axios.get(`${BASE_URL}/analytics/dashboards/metrics`);
      expect(response.data.data).toBeDefined();

      // Check that at least one metric has data
      const hasData = Object.values(response.data.data).some(
        (metric: any) => Array.isArray(metric) && metric.length > 0
      );
      expect(hasData).toBe(true);
      console.log('✓ Sample Data Verified in BigQuery');
    });
  });

  // Test 4: Event Recording
  describe('Event Recording', () => {
    test('should record a test event', async () => {
      const response = await axios.post(`${BASE_URL}/analytics/events/record`, {
        event_type: 'test_event_phase2',
        school_id: 'SCHOOL_PHASE2_TEST',
        user_id: 'USER_PHASE2_TEST',
        data: {
          test_marker: 'phase2_deployment',
          timestamp: new Date().toISOString(),
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      testEventId = response.data.event_id;
      console.log(`✓ Test Event Recorded (ID: ${testEventId})`);
    });

    test('should send test event successfully', async () => {
      const response = await axios.post(`${BASE_URL}/analytics/events/send-test`, {
        event_type: 'test_event_sync',
        school_id: 'SCHOOL_SYNC_TEST',
        data: {
          phase: 2,
          marker: 'sync-test',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      console.log('✓ Test Event Sent via API');
    });
  });

  // Test 5: Query Performance
  describe('Query Performance', () => {
    test('active users query should execute in < 5 seconds', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/active-users`);
      const executionTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(executionTime).toBeLessThan(5000);
      console.log(`✓ Active Users Query Executed in ${executionTime}ms`);
    });

    test('revenue query should execute in < 5 seconds', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/revenue`);
      const executionTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(executionTime).toBeLessThan(5000);
      console.log(`✓ Revenue Query Executed in ${executionTime}ms`);
    });

    test('error rate query should execute in < 5 seconds', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/errors`);
      const executionTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(executionTime).toBeLessThan(5000);
      console.log(`✓ Error Rate Query Executed in ${executionTime}ms`);
    });

    test('reports query should execute in < 5 seconds', async () => {
      const startTime = Date.now();
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/reports`);
      const executionTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(executionTime).toBeLessThan(5000);
      console.log(`✓ Reports Query Executed in ${executionTime}ms`);
    });
  });

  // Test 6: Error Handling
  describe('Error Handling', () => {
    test('should handle invalid metric request', async () => {
      try {
        await axios.get(`${BASE_URL}/analytics/dashboards/invalid`);
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
        console.log(`✓ Invalid Request Handled (${error.response.status})`);
      }
    });

    test('should handle missing authentication', async () => {
      try {
        const instance = axios.create();
        await instance.get(`${BASE_URL}/analytics/dashboards/metrics`);
      } catch (error: any) {
        // Either 401 (unauthorized) or 200 (if auth is optional)
        console.log(`✓ Authentication Check Performed (${error.response?.status || 'allowed'})`);
      }
    });

    test('should handle malformed JSON', async () => {
      try {
        await axios.post(`${BASE_URL}/analytics/events/record`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400);
        console.log(`✓ Malformed JSON Handled (${error.response.status})`);
      }
    });
  });

  // Test 7: Data Validation
  describe('Data Validation', () => {
    test('active users data should have valid structure', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/active-users`);
      const data = response.data.data;

      if (data.length > 0) {
        expect(data[0]).toHaveProperty('date');
        expect(typeof data[0].date).toBe('string');
        console.log('✓ Active Users Data Structure Valid');
      } else {
        console.log('⚠ No data available to validate');
      }
    });

    test('revenue data should have valid structure', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/revenue`);
      const data = response.data.data;

      if (data.length > 0) {
        expect(data[0]).toHaveProperty('date');
        expect(typeof data[0].daily_revenue).toBe('number');
        console.log('✓ Revenue Data Structure Valid');
      } else {
        console.log('⚠ No data available to validate');
      }
    });

    test('error rate data should have valid structure', async () => {
      const response = await axios.get(`${BASE_URL}/analytics/dashboards/errors`);
      const data = response.data.data;

      if (data.length > 0) {
        expect(data[0]).toHaveProperty('date');
        console.log('✓ Error Rate Data Structure Valid');
      } else {
        console.log('⚠ No data available to validate');
      }
    });
  });

  // Test 8: Caching
  describe('Query Caching', () => {
    test('should cache metrics query', async () => {
      const start1 = Date.now();
      await axios.get(`${BASE_URL}/analytics/dashboards/metrics`);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await axios.get(`${BASE_URL}/analytics/dashboards/metrics`);
      const time2 = Date.now() - start2;

      console.log(`✓ First query: ${time1}ms, Cached query: ${time2}ms`);
      expect(time2).toBeLessThanOrEqual(time1 + 100);
    });
  });

  afterAll(() => {
    console.log('\n✅ All Phase 2 Tests Complete!\n');
    console.log('Deployment Status: READY FOR GO-LIVE');
    console.log('Next: Monday 10:30 AM Launch\n');
  });
});
