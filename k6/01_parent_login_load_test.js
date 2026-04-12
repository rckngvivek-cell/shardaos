import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Threshold } from 'k6/metrics';

// Custom metrics
const successRate = new Rate('success_rate');
const loginDuration = new Trend('login_duration');

export const options = {
  stages: [
    { duration: '2m', target: 100 },    // Ramp up to 100 users
    { duration: '5m', target: 500 },    // Ramp up to 500 users
    { duration: '5m', target: 1000 },   // Ramp up to 1000 users
    { duration: '5m', target: 1000 },   // Stay at 1000 users
    { duration: '2m', target: 0 },      // Ramp down
  ],
  thresholds: {
    'login_duration{scenario:parent_login}': ['p(99)<500'], // P99 < 500ms
    'http_req_failed': ['rate<0.01'], // Less than 1% failure
    'http_req_duration': ['p(95)<400'], // P95 < 400ms
  },
  ext: {
    loadimpact: {
      projectID: 1234567,
      name: 'DeerFlow - Parent Login Load Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.deerflow.dev';

export default function () {
  group('Parent Login Scenario', () => {
    // Generate unique credentials per user
    const username = `parent_${__VU}_${__ITER}@example.com`;
    const password = 'SecurePassword123!';

    // Login request
    const loginPayload = JSON.stringify({
      email: username,
      password: password,
      rememberMe: false,
    });

    const loginParams = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'K6LoadTest/1.0',
      },
      tags: { scenario: 'parent_login', name: 'login' },
    };

    let loginRes = http.post(`${BASE_URL}/api/v1/auth/login`, loginPayload, loginParams);
    
    // Store start time for metric
    const startTime = new Date();
    const duration = new Date() - startTime;
    loginDuration.add(duration, { scenario: 'parent_login' });

    // Verify login success
    let success = check(loginRes, {
      'login status is 200': (r) => r.status === 200,
      'login returns auth token': (r) => r.body.includes('token'),
      'response time < 500ms': (r) => r.timings.duration < 500,
    });

    successRate.add(success);

    if (success && loginRes.status === 200) {
      // Parse response and extract token
      let responseBody = JSON.parse(loginRes.body);
      let authToken = responseBody.data.token;

      sleep(1);

      // Get dashboard after login
      const dashboardParams = {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
          'Accept-Encoding': 'gzip',
          'User-Agent': 'K6LoadTest/1.0',
        },
        tags: { scenario: 'parent_login', name: 'get_dashboard' },
      };

      let dashboardRes = http.get(
        `${BASE_URL}/api/v1/parents/dashboard`,
        dashboardParams
      );

      check(dashboardRes, {
        'dashboard status is 200': (r) => r.status === 200,
        'dashboard returns data': (r) => r.body.includes('children'),
        'dashboard response time < 300ms': (r) => r.timings.duration < 300,
      });

      sleep(Math.random() * 2 + 1); // Random sleep 1-3 seconds
    }
  });
}

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
    json: JSON.stringify(data),
  };
}
