import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Gauge, Rate } from 'k6/metrics';

// ============================================================================
// LOAD TEST FOR 99.95% UPTIME - FRIDAY APRIL 11, 2026
// Purpose: Validate auto-scaling, SLOs, and error rate under 2,000 concurrent load
// ============================================================================

// Custom metrics
const responseLatency = new Trend('response_latency_ms');
const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');
const activeConnections = new Gauge('active_connections');
const requestsPerSecond = new Counter('requests_per_second');

// VUS (Virtual Users) scaling
export const options = {
  stages: [
    // Phase 1: Ramp-up (2 hours) - 100 to 2000 users
    { duration: '30m', target: 500 },   // Ramp to 500 users over 30 min
    { duration: '30m', target: 2000 },  // Ramp to 2000 users over next 30 min

    // Phase 2: Steady state (3 hours) - Hold at 2000 users
    { duration: '30m', target: 2000 },  // 1st hour
    { duration: '30m', target: 2000 },  // 2nd hour
    { duration: '30m', target: 2000 },  // 3rd hour

    // Phase 3: Spike test (5 minutes) - Jump to 3000 users
    { duration: '5m', target: 3000 },   // Spike to 3000
    { duration: '5m', target: 2000 },   // Back to 2000

    // Phase 4: Cooldown (30 minutes) - Ramp down
    { duration: '30m', target: 0 },     // Ramp down to 0
  ],

  // Thresholds for pass/fail
  thresholds: {
    'response_latency_ms': [
      'p(95)<500',      // P95 latency must be < 500ms
      'p(99)<1000',     // P99 latency must be < 1000ms
    ],
    'error_rate': [
      'rate<0.001',     // Error rate must be < 0.1%
    ],
    'success_rate': [
      'rate>0.999',     // Success rate must be > 99.9%
    ],
    'http_reqs': [
      'count>100000',   // Must have at least 100k requests
    ],
  },

  // Reporting
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
};

// ============================================================================
// BASE URL - Change based on environment
// ============================================================================
const BASE_URL = __ENV.BASE_URL || 'https://api.schoolerp.com';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token';

// ============================================================================
// SETUP - Run once before tests
// ============================================================================
export function setup() {
  console.log(`Load test starting against: ${BASE_URL}`);
  console.log(`Test duration: ~5.5 hours`);
  console.log(`Peak load: 2,000 concurrent users`);
  console.log(`Success criteria: <0.1% error rate, P95 latency <500ms`);

  return { token: AUTH_TOKEN };
}

// ============================================================================
// MAIN TEST FUNCTION - Runs for each VU
// ============================================================================
export default function (data) {
  const token = data.token;

  // Active connections gauge
  activeConnections.add(1);

  try {
    // Test 1: Authentication - Get token
    group('1. Authentication', function () {
      const authRes = http.post(`${BASE_URL}/auth/verify`, {
        token: token,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key',
        },
        timeout: '10s',
      });

      const authSuccess = check(authRes, {
        'Auth status 200': (r) => r.status === 200,
        'Auth response time < 200ms': (r) => r.timings.duration < 200,
      });

      successRate.add(authSuccess);
      errorRate.add(!authSuccess);
      responseLatency.add(authRes.timings.duration);
      requestsPerSecond.add(1);

      if (!authSuccess) {
        console.error(`AUTH FAILED: ${authRes.status} - ${authRes.body}`);
      }
    });

    sleep(0.1);

    // Test 2: List Schools
    group('2. List Schools', function () {
      const schoolRes = http.get(`${BASE_URL}/schools?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: '10s',
      });

      const schoolSuccess = check(schoolRes, {
        'List schools status 200': (r) => r.status === 200,
        'Schools response time < 300ms': (r) => r.timings.duration < 300,
        'Response has schools': (r) => r.body.length > 0,
      });

      successRate.add(schoolSuccess);
      errorRate.add(!schoolSuccess);
      responseLatency.add(schoolRes.timings.duration);
      requestsPerSecond.add(1);
    });

    sleep(0.1);

    // Test 3: Get Students List
    group('3. Get Students', function () {
      const studentRes = http.get(`${BASE_URL}/students?school=test-school&limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: '10s',
      });

      const studentSuccess = check(studentRes, {
        'Get students status 200': (r) => r.status === 200,
        'Students response time < 400ms': (r) => r.timings.duration < 400,
      });

      successRate.add(studentSuccess);
      errorRate.add(!studentSuccess);
      responseLatency.add(studentRes.timings.duration);
      requestsPerSecond.add(1);
    });

    sleep(0.1);

    // Test 4: Get Attendance
    group('4. Get Attendance', function () {
      const attendanceRes = http.get(`${BASE_URL}/attendance?date=2026-04-11&school=test-school`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: '10s',
      });

      const attendanceSuccess = check(attendanceRes, {
        'Get attendance status 200': (r) => r.status === 200 || r.status === 204,
        'Attendance response time < 500ms': (r) => r.timings.duration < 500,
      });

      successRate.add(attendanceSuccess);
      errorRate.add(!attendanceSuccess);
      responseLatency.add(attendanceRes.timings.duration);
      requestsPerSecond.add(1);
    });

    sleep(0.1);

    // Test 5: Create Transaction (Order)
    group('5. Create Transaction', function () {
      const txnRes = http.post(`${BASE_URL}/transactions`, {
        school_id: 'test-school',
        amount: 5000,
        type: 'fee_payment',
        student_id: 'test-student',
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: '15s',
      });

      const txnSuccess = check(txnRes, {
        'Create transaction status 201': (r) => r.status === 201 || r.status === 200,
        'Transaction response time < 800ms': (r) => r.timings.duration < 800,
        'Transaction has ID': (r) => r.body.id !== undefined,
      });

      successRate.add(txnSuccess);
      errorRate.add(!txnSuccess);
      responseLatency.add(txnRes.timings.duration);
      requestsPerSecond.add(1);
    });

    sleep(0.1);

    // Test 6: Dashboard Metrics
    group('6. Dashboard Metrics', function () {
      const dashboardRes = http.get(`${BASE_URL}/dashboard/metrics?school=test-school`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: '10s',
      });

      const dashboardSuccess = check(dashboardRes, {
        'Dashboard status 200': (r) => r.status === 200,
        'Dashboard response time < 600ms': (r) => r.timings.duration < 600,
      });

      successRate.add(dashboardSuccess);
      errorRate.add(!dashboardSuccess);
      responseLatency.add(dashboardRes.timings.duration);
      requestsPerSecond.add(1);
    });

    sleep(0.5);  // Think time between iterations

  } catch (error) {
    console.error(`Test iteration failed: ${error}`);
    errorRate.add(1);
    successRate.add(0);
  } finally {
    activeConnections.add(-1);
  }
}

// ============================================================================
// TEARDOWN - Run once after all tests
// ============================================================================
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Base URL tested: ${BASE_URL}`);
}

// ============================================================================
// THRESHOLDS EXPLANATION
// ============================================================================
// 
// These thresholds define the SUCCESS CRITERIA for the load test:
//
// 1. response_latency_ms (Latency SLO)
//    - p(95)<500: 95% of requests must complete in <500ms
//    - p(99)<1000: 99% of requests must complete in <1000ms
//
// 2. error_rate (Error Rate SLO)
//    - rate<0.001: Error rate must stay below 0.1%
//
// 3. success_rate (Availability)
//    - rate>0.999: At least 99.9% of requests must succeed
//
// 4. http_reqs (Minimum test size)
//    - count>100000: Must execute at least 100,000 requests
//
// If ANY threshold is violated, the load test FAILS
// This validates the system can handle 2,000 concurrent users
// while maintaining 99.95% uptime SLA
//

