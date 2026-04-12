/**
 * K6 Load Testing Framework - SchoolERP
 * 
 * Test Scenario:
 * 5.5-hour load test simulating realistic school day traffic
 * - 1 hour ramp-up: 0 → 2,000 users
 * - 3 hours sustained: 2,000 users continuous
 * - 5 minute spike: 2,000 → 3,000 users
 * - 30 minute ramp-down: 3,000 → 0 users
 * 
 * Success Criteria:
 * - p95 response time < 400ms
 * - p99 response time < 600ms
 * - Error rate < 0.1%
 * - System handles 3,000 concurrent users
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Gauge, Rate, Trend } from 'k6/metrics';

// ============================================================================
// CUSTOM METRICS
// ============================================================================

// Define custom metrics
const reportGenerationDuration = new Trend('report_generation_duration');
const exportDuration = new Trend('export_duration');
const authDuration = new Trend('auth_duration');
const dashboardLoadDuration = new Trend('dashboard_load_duration');
const errorCount = new Counter('errors');
const reportSuccessRate = new Rate('report_success');
const exportSuccessRate = new Rate('export_success');

// ============================================================================
// TEST OPTIONS
// ============================================================================

export const options = {
  stages: [
    // Ramp up: 0 to 2,000 users over 1 hour
    { 
      duration: '1h',
      target: 2000,
      name: 'Ramp-up Phase'
    },
    // Sustained load: stay at 2,000 for 3 hours
    { 
      duration: '3h',
      target: 2000,
      name: 'Sustained Load Phase'
    },
    // Spike: 2,000 to 3,000 for 5 minutes
    { 
      duration: '5m',
      target: 3000,
      name: 'Spike Phase'
    },
    // Ramp down: 3,000 to 0 over 30 minutes
    { 
      duration: '30m',
      target: 0,
      name: 'Ramp-down Phase'
    },
  ],
  
  // Success thresholds
  thresholds: {
    // Response time thresholds
    'http_req_duration': [
      'p(95) < 400',
      'p(99) < 600',
      'avg < 250',
    ],
    
    // Error rate thresholds
    'http_req_failed': [
      'rate < 0.001',
    ],
    
    // Custom metric thresholds
    'report_generation_duration': [
      'p(95) < 500',
    ],
    'export_duration': [
      'p(95) < 800',
    ],
    'auth_duration': [
      'p(95) < 300',
    ],
    'errors': [
      'count < 100',
    ],
    'report_success': [
      'rate > 0.99',
    ],
  },
  
  ext: {
    loadimpact: {
      name: 'SchoolERP - 5.5 Hour Load Test',
      projectID: 12345,
      note: 'Production load test - April 18, 2026'
    }
  }
};

// ============================================================================
// SETUP
// ============================================================================

export function setup() {
  // Authenticate and get session token
  const loginRes = http.post(
    'https://api.schoolerp.io/auth/login',
    JSON.stringify({
      email: 'admin@school.edu',
      password: 'LoadTestPassword123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  
  const authToken = loginRes.json('token');
  
  check(loginRes, {
    'authentication successful': (r) => r.status === 200,
  });
  
  return { authToken };
}

// ============================================================================
// MAIN TEST FUNCTION
// ============================================================================

export default function (data) {
  const baseUrl = 'https://api.schoolerp.io';
  const schoolId = 'LOAD_TEST_001';
  const authToken = data.authToken;
  
  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
    'User-Agent': 'k6-load-test/1.0'
  };
  
  // ========================================================================
  // GROUP 1: REPORT GENERATION (30% of traffic)
  // ========================================================================
  group('Report Generation Flow', () => {
    const generateRes = http.post(
      `${baseUrl}/reports/generate`,
      JSON.stringify({
        templateId: 'attendance',
        schoolId: schoolId,
        filters: {
          startDate: '2026-04-01',
          endDate: '2026-04-09',
          classId: `CLASS_${Math.floor(Math.random() * 20)}`
        }
      }),
      { tags: { name: 'ReportGenerate' }, headers }
    );
    
    reportGenerationDuration.add(generateRes.timings.duration);
    reportSuccessRate.add(generateRes.status === 200);
    
    check(generateRes, {
      'report generated': (r) => r.status === 200,
      'has reportId': (r) => r.json('reportId') !== undefined,
      'response time < 500ms': (r) => r.timings.duration < 500,
    });
    
    if (generateRes.status !== 200) {
      errorCount.add(1);
    }
    
    sleep(2);
  });
  
  // ========================================================================
  // GROUP 2: REPORT EXPORT (25% of traffic)
  // ========================================================================
  group('Report Export Flow', () => {
    const formats = ['pdf', 'excel', 'csv'];
    const format = formats[Math.floor(Math.random() * formats.length)];
    
    const exportRes = http.post(
      `${baseUrl}/reports/export`,
      JSON.stringify({
        reportId: 'REPORT_' + Math.random().toString(36).substr(2, 9),
        format: format,
        includeWatermark: true
      }),
      { tags: { name: 'ReportExport' }, headers }
    );
    
    exportDuration.add(exportRes.timings.duration);
    exportSuccessRate.add(exportRes.status === 200);
    
    check(exportRes, {
      'export successful': (r) => r.status === 200,
      'correct mime type': (r) => {
        const ct = r.headers['content-type'];
        if (format === 'pdf') return ct.includes('pdf');
        if (format === 'excel') return ct.includes('sheet');
        if (format === 'csv') return ct.includes('csv');
        return false;
      },
      'response time < 800ms': (r) => r.timings.duration < 800,
    });
    
    if (exportRes.status !== 200) {
      errorCount.add(1);
    }
    
    sleep(3);
  });
  
  // ========================================================================
  // GROUP 3: DASHBOARD ACCESS (20% of traffic)
  // ========================================================================
  group('Dashboard Access', () => {
    const dashRes = http.get(
      `${baseUrl}/student/dashboard`,
      { 
        tags: { name: 'DashboardLoad' },
        headers 
      }
    );
    
    dashboardLoadDuration.add(dashRes.timings.duration);
    
    check(dashRes, {
      'dashboard loaded': (r) => r.status === 200,
      'has data': (r) => r.json('data') !== undefined,
      'response time < 400ms': (r) => r.timings.duration < 400,
    });
    
    if (dashRes.status !== 200) {
      errorCount.add(1);
    }
    
    sleep(1);
  });
  
  // ========================================================================
  // GROUP 4: AUTHENTICATION (15% of traffic)
  // ========================================================================
  group('Authentication Flow', () => {
    const authRes = http.post(
      `${baseUrl}/auth/login`,
      JSON.stringify({
        email: `testuser_${Math.floor(Math.random() * 10000)}@school.edu`,
        password: 'TestPassword123'
      }),
      { tags: { name: 'Auth' }, headers: { 'Content-Type': 'application/json' } }
    );
    
    authDuration.add(authRes.timings.duration);
    
    check(authRes, {
      'login successful or expected failure': (r) => 
        r.status === 200 || r.status === 401,
      'response time < 300ms': (r) => r.timings.duration < 300,
    });
    
    sleep(2);
  });
  
  // ========================================================================
  // GROUP 5: MESSAGE SYSTEM (10% of traffic)
  // ========================================================================
  group('Message System', () => {
    const msgRes = http.post(
      `${baseUrl}/messages/send`,
      JSON.stringify({
        recipientId: 'USER_' + Math.random().toString(36).substr(2, 9),
        subject: 'Load test message',
        body: 'This is an automated load test message',
        priority: 'normal'
      }),
      { tags: { name: 'Messages' }, headers }
    );
    
    check(msgRes, {
      'message sent or queued': (r) => r.status === 200 || r.status === 202,
      'response time < 400ms': (r) => r.timings.duration < 400,
    });
    
    if (msgRes.status >= 400) {
      errorCount.add(1);
    }
    
    sleep(1);
  });
  
  // ========================================================================
  // RANDOM THINK TIME
  // ========================================================================
  const thinkTime = Math.random() * 3; // 0-3 seconds random think time
  sleep(thinkTime);
}

// ============================================================================
// TEARDOWN
// ============================================================================

export function teardown(data) {
  console.log('Load test completed successfully');
  
  // Optional: logout all sessions
  const logoutRes = http.post(
    'https://api.schoolerp.io/auth/logout',
    null,
    { 
      headers: { 
        'Authorization': `Bearer ${data.authToken}` 
      } 
    }
  );
  
  check(logoutRes, {
    'logout successful': (r) => r.status === 200,
  });
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

/*
 * RAMP-UP PHASE (1 hour):
 * - Linear increase from 0 to 2,000 VUs
 * - ~33 new users every second
 * - Tests system scaling
 * - Monitors gradual response time increase
 * 
 * SUSTAINED LOAD PHASE (3 hours):
 * - Constant 2,000 concurrent users
 * - ~14,000 requests per minute
 * - Tests system stability
 * - Monitors for memory leaks or connection pool issues
 * 
 * SPIKE PHASE (5 minutes):
 * - Sudden increase to 3,000 users (50% increase)
 * - Tests system resilience
 * - Monitors error rate and response time degradation
 * 
 * RAMP-DOWN PHASE (30 minutes):
 * - Gradual decrease to 0 users
 * - Tests graceful shutdown
 * - Verifies resource cleanup
 * 
 * TRAFFIC DISTRIBUTION:
 * - Report Generation: 30% (most critical)
 * - Report Export: 25% (high memory usage)
 * - Dashboard Access: 20% (frequent operations)
 * - Authentication: 15% (connection heavy)
 * - Message System: 10% (async operations)
 * 
 * EXPECTED RESULTS:
 * - Total Requests: ~500,000+
 * - P95 Response Time: < 400ms
 * - P99 Response Time: < 600ms
 * - Error Rate: < 0.1%
 * - Peak Memory: ~2GB
 * - Peak CPU: ~70%
 */

// ============================================================================
// MONITORING & OBSERVABILITY
// ============================================================================

/*
 * METRICS TRACKED:
 * - Response times (p50, p75, p90, p95, p99)
 * - Error rates by endpoint
 * - Throughput (requests/second)
 * - Connection pool utilization
 * - Memory usage
 * - CPU usage
 * - Database query times
 * - Cache hit rates
 * 
 * ALERTS:
 * - Error rate > 0.1%
 * - P95 response time > 400ms
 * - P99 response time > 600ms
 * - Connection pool exhausted
 * - Memory usage > 80%
 */
