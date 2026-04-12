import http from 'k6/http';
import { check, sleep } from 'k6';

/**
 * Mobile load test script.
 *
 * This is intentionally "API-first": it exercises the same JSON endpoints the mobile app will
 * call in production (health + tenant-plane list endpoints). The workflow controls concurrency
 * (`--vus`) and runtime (`--duration`) so this script can be reused for different load profiles.
 *
 * Environment variables:
 * - API_BASE_URL (required): Base URL of the deployment. Can be either:
 *   - https://example.com            (script will use https://example.com/api/*)
 *   - https://example.com/api        (script will use https://example.com/api/*)
 * - API_BEARER_TOKEN (optional): When set, protected endpoints are exercised using Authorization: Bearer.
 * - SCHOOL_ID (optional): Used as `X-School-Id` header when the bearer token does not include a schoolId claim.
 * - THRESHOLD_P50_MS / THRESHOLD_P95_MS / THRESHOLD_P99_MS (optional): latency thresholds in milliseconds.
 * - THRESHOLD_ERR_RATE (optional): http_req_failed rate threshold (e.g. 0.001 for 0.1%).
 */

function requireEnv(name) {
  const raw = (__ENV[name] || '').trim();
  if (!raw) {
    throw new Error(`${name} is required`);
  }
  return raw;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toFloat(value, fallback) {
  const parsed = Number.parseFloat(String(value ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

const rawBaseUrl = requireEnv('API_BASE_URL').replace(/\/+$/, '');
const apiBaseUrl = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const bearerToken = (__ENV.API_BEARER_TOKEN || '').trim();
const schoolId = (__ENV.SCHOOL_ID || '').trim();

const thresholdP50Ms = toInt(__ENV.THRESHOLD_P50_MS, 200);
const thresholdP95Ms = toInt(__ENV.THRESHOLD_P95_MS, 400);
const thresholdP99Ms = toInt(__ENV.THRESHOLD_P99_MS, 500);
const thresholdErrRate = toFloat(__ENV.THRESHOLD_ERR_RATE, 0.001);

export const options = {
  thresholds: {
    http_req_failed: [`rate<${thresholdErrRate}`],
    http_req_duration: [
      `p(50)<${thresholdP50Ms}`,
      `p(95)<${thresholdP95Ms}`,
      `p(99)<${thresholdP99Ms}`,
    ],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

const baseHeaders = {
  'Content-Type': 'application/json',
};

if (bearerToken) {
  baseHeaders.Authorization = `Bearer ${bearerToken}`;
}

// The API uses `x-school-id` as an escape hatch when the ID token doesn't include a schoolId claim.
if (schoolId) {
  baseHeaders['X-School-Id'] = schoolId;
}

// Print once at init time so operators can see whether auth is enabled.
if (!bearerToken) {
  // eslint-disable-next-line no-console
  console.log('[k6] API_BEARER_TOKEN not set; protected endpoints will be skipped.');
}

function getJson(url, params) {
  const res = http.get(url, params);
  return res;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function loadTestIteration() {
  // Public health endpoint (no auth)
  {
    const res = getJson(`${apiBaseUrl}/health`, { tags: { name: 'GET /api/health' } });
    check(res, {
      'health status 200': (r) => r.status === 200,
      'health body ok': (r) => {
        try {
          const body = r.json();
          return body && body.status === 'ok';
        } catch {
          return false;
        }
      },
    });
  }

  // Protected endpoints: only run when a bearer token is provided.
  if (bearerToken) {
    const params = { headers: baseHeaders };

    {
      const res = getJson(`${apiBaseUrl}/students?page=1&limit=20`, {
        ...params,
        tags: { name: 'GET /api/students' },
      });
      check(res, {
        'students status 200': (r) => r.status === 200,
        'students envelope success': (r) => {
          try {
            const body = r.json();
            return body && body.success === true && Array.isArray(body.data);
          } catch {
            return false;
          }
        },
      });
    }

    {
      const date = todayIsoDate();
      const res = getJson(`${apiBaseUrl}/attendance?date=${encodeURIComponent(date)}&page=1&limit=50`, {
        ...params,
        tags: { name: 'GET /api/attendance' },
      });
      check(res, {
        'attendance status 200': (r) => r.status === 200,
        'attendance envelope success': (r) => {
          try {
            const body = r.json();
            return body && body.success === true && Array.isArray(body.data);
          } catch {
            return false;
          }
        },
      });
    }

    {
      const res = getJson(`${apiBaseUrl}/grades?page=1&limit=20`, {
        ...params,
        tags: { name: 'GET /api/grades' },
      });
      check(res, {
        'grades status 200': (r) => r.status === 200,
        'grades envelope success': (r) => {
          try {
            const body = r.json();
            return body && body.success === true && Array.isArray(body.data);
          } catch {
            return false;
          }
        },
      });
    }
  }

  // Small think-time so the workload isn't unrealistically "busy loop" by default.
  sleep(0.2);
}

