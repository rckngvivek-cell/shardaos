import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const gradesFetchDuration = new Trend('grades_fetch_duration');
const gradesSuccessRate = new Rate('grades_success_rate');

export const options = {
  vus: 500,
  duration: '10m',
  thresholds: {
    'grades_fetch_duration{endpoint:get_child_grades}': ['p(95)<300'], // P95 < 300ms
    'grades_success_rate': ['rate>0.99'], // 99% success rate
    'http_req_failed': ['rate<0.01'], // Less than 1% failure
    'http_req_duration': ['p(90)<350'], // P90 < 350ms
  },
  ext: {
    loadimpact: {
      projectID: 1234567,
      name: 'DeerFlow - Get Child Grades Load Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.deerflow.dev';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token-placeholder';

export default function () {
  group('Get Child Grades - 500 Concurrent VUs', () => {
    // Simulate different children across VUs
    const childId = `child_${(__VU % 100) + 1}`;

    const params = {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip',
        'User-Agent': 'K6LoadTest/1.0',
        'X-Request-ID': `req_${__VU}_${__ITER}`,
      },
      tags: { endpoint: 'get_child_grades', vus: '500' },
    };

    // Fetch child grades
    let res = http.get(
      `${BASE_URL}/api/v1/children/${childId}/grades?term=2024-Q3`,
      params
    );

    gradesFetchDuration.add(res.timings.duration, { endpoint: 'get_child_grades' });

    let success = check(res, {
      'grades fetch status is 200': (r) => r.status === 200,
      'response contains grades array': (r) => r.body.includes('grades'),
      'response time < 300ms': (r) => r.timings.duration < 300,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'no server errors': (r) => r.status < 500,
    });

    gradesSuccessRate.add(success);

    if (success) {
      // Parse and verify grades structure
      let gradesData = JSON.parse(res.body);
      check(gradesData, {
        'grades array exists': (data) => Array.isArray(data.data.grades),
        'grades contain subject': (data) => data.data.grades[0]?.subject !== undefined,
        'grades contain marks': (data) => data.data.grades[0]?.marks !== undefined,
      });
    }

    sleep(Math.random() * 3 + 1); // Random sleep 1-4 seconds
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
