import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

const BASE_URL = __ENV.API_BASE_URL || 'http://localhost:8080';
const LOAD_DURATION = __ENV.LOAD_DURATION || '5m';
const VIRTUAL_USERS = parseInt(__ENV.VIRTUAL_USERS || '50');

// Custom metrics
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration');
const successCount = new Counter('success_count');
const activeUsers = new Gauge('active_users');
const requestRate = new Trend('request_rate');

// Scenario configuration
export const options = {
  stages: [
    { duration: '1m', target: VIRTUAL_USERS * 0.25 }, // Ramp up to 25%
    { duration: '2m', target: VIRTUAL_USERS * 0.50 }, // Ramp up to 50%
    { duration: '3m', target: VIRTUAL_USERS * 1.00 }, // Ramp up to 100%
    { duration: '5m', target: VIRTUAL_USERS * 1.00 }, // Hold at 100%
    { duration: '2m', target: VIRTUAL_USERS * 0.50 }, // Ramp down to 50%
    { duration: '1m', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    // Health checks
    'http_req_duration': ['p(95)<500', 'p(99)<1000'],
    'errors': ['rate<0.05'], // Error rate must be < 5%
    'http_req_failed': ['rate<0.05'],
    
    // Custom metrics
    'api_duration': ['p(95)<500'],
    'request_rate': ['avg<100'],
  },
};

export default function () {
  activeUsers.add(1);

  // Test 1: Health check
  group('Health Checks', () => {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health status is 200': (r) => r.status === 200,
      'health response contains OK': (r) => r.body.includes('OK'),
    });
    apiDuration.add(res.timings.duration, { endpoint: 'health' });
    if (res.status !== 200) errorRate.add(1);
    else successCount.add(1);
  });

  sleep(1);

  // Test 2: SMS Notification API
  group('SMS Notifications', () => {
    const smsPayload = JSON.stringify({
      phone_number: '+919999999999',
      message: 'Test notification from load test',
      notification_type: 'announcement',
    });

    const res = http.post(`${BASE_URL}/api/v1/notifications/sms`, smsPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'SMS endpoint status is 2xx': (r) => r.status >= 200 && r.status < 300,
      'SMS response time < 1s': (r) => r.timings.duration < 1000,
    });
    apiDuration.add(res.timings.duration, { endpoint: 'sms' });
    if (res.status >= 400) errorRate.add(1);
    else successCount.add(1);
  });

  sleep(1);

  // Test 3: Email Notification API
  group('Email Notifications', () => {
    const emailPayload = JSON.stringify({
      recipient_email: 'test@school-erp.com',
      subject: 'Load Test Notification',
      template: 'announcement',
      template_data: { title: 'Test', message: 'Load test' },
    });

    const res = http.post(`${BASE_URL}/api/v1/notifications/email`, emailPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'Email endpoint status is 2xx': (r) => r.status >= 200 && r.status < 300,
      'Email response time < 1s': (r) => r.timings.duration < 1000,
    });
    apiDuration.add(res.timings.duration, { endpoint: 'email' });
    if (res.status >= 400) errorRate.add(1);
    else successCount.add(1);
  });

  sleep(1);

  // Test 4: Push Notification API
  group('Push Notifications', () => {
    const pushPayload = JSON.stringify({
      device_tokens: ['token1', 'token2', 'token3'],
      title: 'School Notification',
      body: 'Important announcement',
      data: { priority: 'high' },
    });

    const res = http.post(`${BASE_URL}/api/v1/notifications/push`, pushPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'Push endpoint status is 2xx': (r) => r.status >= 200 && r.status < 300,
      'Push response time < 1s': (r) => r.timings.duration < 1000,
    });
    apiDuration.add(res.timings.duration, { endpoint: 'push' });
    if (res.status >= 400) errorRate.add(1);
    else successCount.add(1);
  });

  sleep(1);

  // Test 5: Notification Status Check
  group('Notification Status', () => {
    const res = http.get(`${BASE_URL}/api/v1/notifications/status`);

    check(res, {
      'Status endpoint status is 200': (r) => r.status === 200,
      'Status response contains metrics': (r) => r.body.includes('sent') || r.body.includes('delivered'),
    });
    apiDuration.add(res.timings.duration, { endpoint: 'status' });
    if (res.status !== 200) errorRate.add(1);
    else successCount.add(1);
  });

  sleep(1);

  // Test 6: Get Notification Templates
  group('Template Operations', () => {
    const res = http.get(`${BASE_URL}/api/v1/notifications/templates`);

    check(res, {
      'Templates endpoint status is 200': (r) => r.status === 200,
      'Response contains template list': (r) => r.body.includes('template'),
    });
    apiDuration.add(res.timings.duration, { endpoint: 'templates' });
    if (res.status !== 200) errorRate.add(1);
    else successCount.add(1);
  });

  sleep(1);

  // Test 7: Notification Preference Management
  group('Notification Preferences', () => {
    const prefPayload = JSON.stringify({
      user_id: 'user123',
      preferences: {
        sms_enabled: true,
        email_enabled: true,
        push_enabled: true,
        quiet_hours: { start: '22:00', end: '08:00' },
      },
    });

    const res = http.post(`${BASE_URL}/api/v1/notifications/preferences`, prefPayload, {
      headers: { 'Content-Type': 'application/json' },
    });

    check(res, {
      'Preferences endpoint status is 2xx': (r) => r.status >= 200 && r.status < 300,
      'Preferences response time < 500ms': (r) => r.timings.duration < 500,
    });
    apiDuration.add(res.timings.duration, { endpoint: 'preferences' });
    if (res.status >= 400) errorRate.add(1);
    else successCount.add(1);
  });

  sleep(1);

  // Test 8: Firestore Real-time Monitoring
  group('Real-time Data', () => {
    const res = http.get(`${BASE_URL}/api/v1/notifications/realtime-stats`);

    check(res, {
      'Real-time endpoint status is 200': (r) => r.status === 200,
      'Real-time response includes timestamp': (r) => r.body.includes('timestamp') || r.body.includes('time'),
    });
    apiDuration.add(res.timings.duration, { endpoint: 'realtime-stats' });
    if (res.status !== 200) errorRate.add(1);
    else successCount.add(1);
  });

  activeUsers.add(-1);
  sleep(2);
}

// Teardown - Log summary
export function teardown(data) {
  console.log('=== Load Test Summary ===');
  console.log(`Total Requests: ${data?.totalRequests || 'N/A'}`);
  console.log(`Successful Requests: ${data?.successes || 'N/A'}`);
  console.log(`Failed Requests: ${data?.failures || 'N/A'}`);
  console.log(`Error Rate: ${data?.errorRate || 'N/A'}%`);
  console.log(`Avg Response Time: ${data?.avgResponseTime || 'N/A'}ms`);
}
