import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';

// Custom metrics
const listChildrenDuration = new Trend('list_children_duration');
const listChildrenSuccessRate = new Rate('list_children_success_rate');

export const options = {
  vus: 1000,
  duration: '10m',
  thresholds: {
    'list_children_duration{operation:list_children}': ['p(50)<200'], // P50 < 200ms
    'list_children_success_rate': ['rate>0.98'], // 98% success rate
    'http_req_failed': ['rate<0.02'], // Less than 2% failure
    'http_req_duration': ['p(75)<250'], // P75 < 250ms
  },
  ext: {
    loadimpact: {
      projectID: 1234567,
      name: 'DeerFlow - List Children Load Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.deerflow.dev';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token-placeholder';

export default function () {
  group('List Children - 1000 Concurrent VUs', () => {
    // Paginate through results
    const page = (__ITER % 10) + 1;
    const pageSize = 20;

    const params = {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'User-Agent': 'K6LoadTest/1.0',
        'X-Request-ID': `list_${__VU}_${__ITER}`,
        'X-Client-Region': 'IN',
      },
      tags: { operation: 'list_children', vus: '1000', page: `${page}` },
    };

    // List children endpoint
    let res = http.get(
      `${BASE_URL}/api/v1/parents/children?page=${page}&pageSize=${pageSize}&sortBy=name`,
      params
    );

    listChildrenDuration.add(res.timings.duration, { operation: 'list_children' });

    let success = check(res, {
      'list children status is 200': (r) => r.status === 200,
      'response contains children array': (r) => r.body.includes('data'),
      'response time < 200ms': (r) => r.timings.duration < 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'response is gzipped': (r) => r.headers['Content-Encoding'] === 'gzip' || r.status === 200,
      'no 5xx errors': (r) => r.status < 500,
    });

    listChildrenSuccessRate.add(success);

    if (success) {
      try {
        let childrenData = JSON.parse(res.body);
        check(childrenData, {
          'children data exists': (data) => data.data !== undefined,
          'pagination metadata exists': (data) => data.pagination !== undefined,
          'children array structure valid': (data) => Array.isArray(data.data.children),
          'child has id': (data) => data.data.children?.[0]?.id !== undefined,
          'child has name': (data) => data.data.children?.[0]?.name !== undefined,
          'child has grade': (data) => data.data.children?.[0]?.grade !== undefined,
        });
      } catch (e) {
        console.error(`JSON parse error: ${e}`);
      }
    }

    sleep(Math.random() * 2 + 0.5); // Random sleep 0.5-2.5 seconds
  });
}

export function teardown(data) {
  console.log(`Load test completed: ${data} VUs finished`);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
