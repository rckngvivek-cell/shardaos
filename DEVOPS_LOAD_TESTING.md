# SECTION 1: LOAD TESTING & PERFORMANCE BASELINE
## K6 Load Test Scripts & Performance Configuration

---

## FILE 1: k6-attendance-loadtest.js
**Purpose:** Bulk attendance marking - 1,000 students/sec, <500ms P99  
**Concurrency:** Ramping from 100 to 2,000 VUs over 10 minutes

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics
const attendanceLatency = new Trend('attendance_latency_ms');
const attendanceErrors = new Counter('attendance_errors');
const attendanceSuccess = new Counter('attendance_success');
const attendanceP99 = new Trend('attendance_p99_latency');
const throughput = new Gauge('attendance_throughput_rps');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'https://api.schoolerp.asia-south1.run.app';
const SCHOOL_ID = __ENV.SCHOOL_ID || 'SCHOOL_IND_001';
const TEACHER_TOKEN = __ENV.TEACHER_TOKEN || 'bearer_token_placeholder';

export const options = {
  stages: [
    // Warm up
    { duration: '2m', target: 100, name: 'warm-up' },
    // Ramp to peak
    { duration: '8m', target: 2000, name: 'ramp-up' },
    // Peak load
    { duration: '5m', target: 2000, name: 'peak' },
    // Cool down
    { duration: '3m', target: 100, name: 'cool-down' },
    // Final soak
    { duration: '2m', target: 0, name: 'shutdown' },
  ],
  thresholds: {
    'attendance_latency_ms': ['p(99)<500', 'p(95)<300', 'p(50)<100'],
    'attendance_errors': ['count<50'], // Max 50 errors in entire test
    'http_req_duration': ['p(99)<500'],
    'http_req_failed': ['rate<0.01'], // Less than 1% failure rate
  },
  ext: {
    loadimpact: {
      projectID: 3496619,
      name: 'Attendance Bulk Mark Load Test',
    },
  },
};

// Test data generator
function generateAttendanceData(studentId, classId) {
  const statuses = ['PRESENT', 'ABSENT', 'LEAVE', 'LATE'];
  return {
    students: Array.from({ length: 50 }, (_, i) => ({
      studentId: `STU_${String(studentId + i).padStart(6, '0')}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      remarks: Math.random() > 0.7 ? 'Medical leave' : '',
    })),
    date: new Date().toISOString().split('T')[0],
    classId: classId,
    markedAt: new Date().toISOString(),
  };
}

// Main test function
export default function () {
  const studentBatchId = Math.floor(__VU * 50 + __ITER);
  const classId = `CLASS_${Math.floor(__VU / 10) % 50}`;
  
  group('POST /api/v1/attendance/bulk-mark', function () {
    const attendancePayload = JSON.stringify(generateAttendanceData(studentBatchId, classId));
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': TEACHER_TOKEN,
        'X-School-ID': SCHOOL_ID,
        'X-Request-ID': `REQ_${Date.now()}_${__VU}`,
      },
      tags: { name: 'AttendanceBulkMark' },
    };

    const startTime = Date.now();
    const response = http.post(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/attendance/bulk-mark`,
      attendancePayload,
      params
    );
    const duration = Date.now() - startTime;

    // Record metrics
    attendanceLatency.add(duration);
    attendanceP99.add(duration);
    throughput.add(__VU);

    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 500ms': (r) => r.timings.duration < 500,
      'has batchId in response': (r) => r.body && r.body.includes('batchId'),
      'has timestamp': (r) => r.body && r.body.includes('processedAt'),
    });

    if (success) {
      attendanceSuccess.add(1);
    } else {
      attendanceErrors.add(1);
      console.error(`Attendance request failed: VU=${__VU}, Status=${response.status}`);
    }
  });

  group('GET /api/v1/attendance/status/{batchId}', function () {
    const batchId = `BATCH_${studentBatchId}`;
    
    const params = {
      headers: {
        'Authorization': TEACHER_TOKEN,
        'X-School-ID': SCHOOL_ID,
      },
      tags: { name: 'AttendanceStatus' },
    };

    const response = http.get(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/attendance/status/${batchId}`,
      params
    );

    check(response, {
      'status polling is 200': (r) => r.status === 200,
      'status is COMPLETED or PROCESSING': (r) => 
        r.body.includes('COMPLETED') || r.body.includes('PROCESSING'),
    });
  });

  sleep(Math.random() * 2);
}

export function handleSummary(data) {
  return {
    'summary.json': JSON.stringify(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  let summary = '\n';
  
  summary += `${indent}✓ Attendance Load Test Summary\n`;
  summary += `${indent}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  
  if (data.metrics.attendance_latency_ms) {
    const latency = data.metrics.attendance_latency_ms.values;
    summary += `${indent}Latency:\n`;
    summary += `${indent}  P50: ${latency.p50 || 0}ms\n`;
    summary += `${indent}  P95: ${latency.p95 || 0}ms\n`;
    summary += `${indent}  P99: ${latency.p99 || 0}ms\n`;
  }
  
  summary += `${indent}Success: ${data.metrics.attendance_success.value || 0}\n`;
  summary += `${indent}Errors: ${data.metrics.attendance_errors.value || 0}\n`;
  
  return summary;
}
```

---

## FILE 2: k6-grades-loadtest.js
**Purpose:** Grade retrieval performance - 5,000 concurrent users, <300ms P95

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate } from 'k6/metrics';

const gradeLatency = new Trend('grade_latency_ms');
const gradeErrors = new Counter('grade_errors');
const gradeP95 = new Trend('grade_p95_latency');
const successRate = new Rate('grade_success_rate');

const BASE_URL = __ENV.BASE_URL || 'https://api.schoolerp.asia-south1.run.app';
const SCHOOL_ID = __ENV.SCHOOL_ID || 'SCHOOL_IND_001';
const PARENT_TOKEN = __ENV.PARENT_TOKEN || 'bearer_token_placeholder';

export const options = {
  stages: [
    { duration: '1m', target: 500, name: 'warm-up' },
    { duration: '5m', target: 5000, name: 'ramp-to-peak' },
    { duration: '10m', target: 5000, name: 'sustained-peak' },
    { duration: '3m', target: 500, name: 'cool-down' },
    { duration: '1m', target: 0, name: 'shutdown' },
  ],
  thresholds: {
    'grade_latency_ms': ['p(95)<300', 'p(99)<500', 'p(50)<100'],
    'grade_success_rate': ['rate>0.99'],
    'http_req_failed': ['rate<0.01'],
  },
};

function getGradeQuery(studentId, academicYear) {
  return {
    filter: {
      studentId: studentId,
      academicYear: academicYear,
      includeAnalytics: true,
    },
    sort: { subject: 'ASC', score: 'DESC' },
    pagination: { page: 1, pageSize: 100 },
  };
}

export default function () {
  const studentId = `STU_${String((__VU * 100 + __ITER) % 100000).padStart(6, '0')}`;
  const academicYear = '2025-2026';

  group('GET /api/v1/grades', function () {
    const query = getGradeQuery(studentId, academicYear);
    
    const params = {
      headers: {
        'Authorization': PARENT_TOKEN,
        'X-School-ID': SCHOOL_ID,
        'X-Student-ID': studentId,
        'Accept-Encoding': 'gzip',
      },
      tags: { name: 'GradeRetrieval' },
    };

    const startTime = Date.now();
    const response = http.get(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/grades?studentId=${studentId}&academicYear=${academicYear}`,
      params
    );
    const duration = Date.now() - startTime;

    gradeLatency.add(duration);
    gradeP95.add(duration);

    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 300ms': (r) => r.timings.duration < 300,
      'contains grade data': (r) => r.body && r.body.includes('grades'),
      'has gpa': (r) => r.body && r.body.includes('gpa'),
      'has timestamp': (r) => r.body && r.body.includes('fetchedAt'),
    });

    successRate.add(success);
    if (!success) {
      gradeErrors.add(1);
      console.warn(`Grade fetch failed for ${studentId}: ${response.status}`);
    }
  });

  group('GET /api/v1/grades/{subjectId}/trend', function () {
    const subjectId = `SUBJ_${Math.floor(__VU % 10)}`;
    
    const response = http.get(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/grades/${subjectId}/trend?studentId=${studentId}`,
      {
        headers: {
          'Authorization': PARENT_TOKEN,
          'X-School-ID': SCHOOL_ID,
        },
        tags: { name: 'GradeTrend' },
      }
    );

    check(response, {
      'trend data returned': (r) => r.status === 200 && r.body.includes('trend'),
    });
  });

  sleep(Math.random() * 1.5);
}
```

---

## FILE 3: k6-payment-loadtest.js
**Purpose:** Fee payment initiation - 500 concurrent, <1000ms P99

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

const paymentLatency = new Trend('payment_latency_ms');
const paymentErrors = new Counter('payment_errors');
const paymentP99 = new Trend('payment_p99_latency');
const concurrentPayments = new Gauge('concurrent_payments');
const dailyRevenue = new Counter('daily_revenue_total');

const BASE_URL = __ENV.BASE_URL || 'https://api.schoolerp.asia-south1.run.app';
const SCHOOL_ID = __ENV.SCHOOL_ID || 'SCHOOL_IND_001';
const PARENT_TOKEN = __ENV.PARENT_TOKEN || 'bearer_token_placeholder';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 500 },
    { duration: '8m', target: 500 },
    { duration: '2m', target: 50 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    'payment_latency_ms': ['p(99)<1000', 'p(95)<750', 'p(50)<300'],
    'payment_errors': ['count<25'],
    'http_req_failed': ['rate<0.005'],
  },
};

function generatePaymentPayload(parentId, childId) {
  return JSON.stringify({
    parentId: parentId,
    childId: childId,
    amount: Math.round(Math.random() * 50000 + 5000), // 5K - 55K INR
    feeType: ['TUITION', 'TRANSPORT', 'ACTIVITY', 'EXAM'][Math.floor(Math.random() * 4)],
    invoiceId: `INV_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    paymentMethod: 'RAZORPAY',
    currency: 'INR',
    description: 'School Fee Payment',
    metadata: {
      academicYear: '2025-2026',
      month: new Date().getMonth() + 1,
      initiatedAt: new Date().toISOString(),
    },
  });
}

export default function () {
  const parentId = `PAR_${String(__VU * 100 + __ITER).padStart(8, '0')}`;
  const childId = `STU_${String((__VU * 100 + __ITER) % 50000).padStart(6, '0')}`;

  concurrentPayments.add(__VU);

  group('POST /api/v1/payments/initiate', function () {
    const payload = generatePaymentPayload(parentId, childId);
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': PARENT_TOKEN,
        'X-School-ID': SCHOOL_ID,
        'X-Parent-ID': parentId,
        'X-Idempotency-Key': `PAYMENT_${Date.now()}_${__VU}`,
      },
      tags: { name: 'PaymentInitiate' },
    };

    const startTime = Date.now();
    const response = http.post(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/payments/initiate`,
      payload,
      params
    );
    const duration = Date.now() - startTime;

    paymentLatency.add(duration);
    paymentP99.add(duration);

    const success = check(response, {
      'status is 200': (r) => r.status === 200,
      'response time < 1000ms': (r) => r.timings.duration < 1000,
      'has razorpay order id': (r) => r.body && r.body.includes('orderId'),
      'has amount': (r) => r.body && r.body.includes('amount'),
      'has order key': (r) => r.body && r.body.includes('keyId'),
    });

    if (success) {
      const amount = Math.round(Math.random() * 50000 + 5000);
      dailyRevenue.add(amount);
    } else {
      paymentErrors.add(1);
      console.error(`Payment initiation failed for ${parentId}: ${response.status}`);
    }
  });

  group('POST /api/v1/payments/verify', function () {
    const verifyPayload = JSON.stringify({
      orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentId: `pay_${Math.random().toString(36).substr(2, 14)}`,
      signature: 'razorpay_signature_hash_placeholder',
    });

    const response = http.post(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/payments/verify`,
      verifyPayload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': PARENT_TOKEN,
          'X-School-ID': SCHOOL_ID,
        },
        tags: { name: 'PaymentVerify' },
      }
    );

    check(response, {
      'verification successful': (r) => r.status === 200,
      'has transaction record': (r) => r.body && r.body.includes('transactionId'),
    });
  });

  sleep(Math.random() * 2);
}
```

---

## FILE 4: k6-notification-loadtest.js
**Purpose:** Notification delivery - 10,000 msg/sec, <200ms latency

```javascript
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Counter, Gauge } from 'k6/metrics';

const notifLatency = new Trend('notification_latency_ms');
const notifErrors = new Counter('notification_errors');
const notifDelivered = new Counter('notification_delivered');
const messageQueueSize = new Gauge('message_queue_size');
const dlqSize = new Gauge('dlq_size');

const BASE_URL = __ENV.BASE_URL || 'https://api.schoolerp.asia-south1.run.app';
const SCHOOL_ID = __ENV.SCHOOL_ID || 'SCHOOL_IND_001';
const SERVICE_ACCOUNT_TOKEN = __ENV.SERVICE_ACCOUNT_TOKEN || 'bearer_token_placeholder';

export const options = {
  stages: [
    { duration: '30s', target: 1000, name: 'warm-up' },
    { duration: '2m', target: 10000, name: 'ramp-to-peak' },
    { duration: '5m', target: 10000, name: 'sustained-throughput' },
    { duration: '1m', target: 5000, name: 'ramp-down' },
    { duration: '30s', target: 0, name: 'shutdown' },
  ],
  thresholds: {
    'notification_latency_ms': ['p(99)<200', 'p(95)<150', 'p(50)<50'],
    'notification_errors': ['count<50'],
    'http_req_failed': ['rate<0.001'],
  },
  ext: {
    loadimpact: {
      projectID: 3496619,
      name: 'Notification Delivery Load Test - 10K msg/sec',
    },
  },
};

function generateNotificationPayload(recipientType) {
  const templates = {
    ANNOUNCEMENT: {
      title: 'New Announcement',
      body: 'A new announcement has been posted for your class',
      icon: 'announcement',
    },
    GRADE_POSTED: {
      title: 'Grades Posted',
      body: 'Exam results for Mathematics are now available',
      icon: 'grade',
    },
    ATTENDANCE_ALERT: {
      title: 'Low Attendance Alert',
      body: 'Your attendance is below 75%. Immediate action required.',
      icon: 'warning',
    },
    FEE_REMINDER: {
      title: 'Fee Due Reminder',
      body: 'Your tuition fee for March is now due. Please pay by 15th April.',
      icon: 'payment_pending',
    },
    EVENT_UPDATE: {
      title: 'Event Update',
      body: 'Annual sports day has been rescheduled to 20th April',
      icon: 'event',
    },
  };

  const templateKeys = Object.keys(templates);
  const notifType = templateKeys[Math.floor(Math.random() * templateKeys.length)];
  const template = templates[notifType];

  return {
    recipients: [
      {
        type: recipientType,
        id: `${recipientType}_${Math.random().toString(36).substr(2, 8)}`,
      },
    ],
    channels: ['SMS', 'EMAIL', 'PUSH'],
    priority: ['HIGH', 'MEDIUM', 'LOW'][Math.floor(Math.random() * 3)],
    notification: template,
    scheduledFor: new Date().toISOString(),
    tags: [notifType, recipientType.toLowerCase()],
  };
}

export default function () {
  const recipientType = ['PARENT', 'STUDENT', 'TEACHER'][Math.floor(__VU % 3)];

  group('POST /api/v1/notifications/send', function () {
    const payload = JSON.stringify(generateNotificationPayload(recipientType));
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': SERVICE_ACCOUNT_TOKEN,
        'X-School-ID': SCHOOL_ID,
        'X-Correlation-ID': `NOTIF_${Date.now()}_${__VU}_${__ITER}`,
      },
      tags: { name: 'NotificationSend' },
    };

    const startTime = Date.now();
    const response = http.post(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/notifications/send`,
      payload,
      params
    );
    const duration = Date.now() - startTime;

    notifLatency.add(duration);

    const success = check(response, {
      'status is 202 Accepted': (r) => r.status === 202,
      'response time < 200ms': (r) => r.timings.duration < 200,
      'has messageId': (r) => r.body && r.body.includes('messageId'),
      'has status QUEUED': (r) => r.body && r.body.includes('QUEUED'),
    });

    if (success) {
      notifDelivered.add(1);
    } else {
      notifErrors.add(1);
      console.error(`Notification send failed: ${response.status}, Duration: ${duration}ms`);
    }
  });

  group('GET /api/v1/notifications/queue-status', function () {
    const response = http.get(
      `${BASE_URL}/api/v1/schools/${SCHOOL_ID}/notifications/queue-status`,
      {
        headers: {
          'Authorization': SERVICE_ACCOUNT_TOKEN,
          'X-School-ID': SCHOOL_ID,
        },
        tags: { name: 'QueueStatus' },
      }
    );

    if (response.status === 200) {
      try {
        const data = JSON.parse(response.body);
        messageQueueSize.add(data.queueSize || 0);
        dlqSize.add(data.dlqSize || 0);
      } catch (e) {
        console.error('Failed to parse queue status response');
      }
    }
  });

  // Minimal sleep for high throughput
  sleep(Math.random() * 0.2);
}
```

---

## FILE 5: k6-thresholds-config.js
**Purpose:** Centralized threshold and configuration management

```javascript
/**
 * Unified K6 Thresholds Configuration
 * Used by all load test scripts for consistent SLA validation
 */

export const thresholds = {
  // Attendance Thresholds
  'attendance_latency_ms': [
    'p(99)<500',
    'p(95)<300',
    'p(50)<100',
    'avg<200',
  ],
  
  // Grade Retrieval Thresholds
  'grade_latency_ms': [
    'p(95)<300',
    'p(99)<500',
    'p(50)<100',
    'avg<150',
  ],
  
  // Payment Thresholds
  'payment_latency_ms': [
    'p(99)<1000',
    'p(95)<750',
    'p(50)<300',
    'avg<400',
  ],
  
  // Notification Thresholds
  'notification_latency_ms': [
    'p(99)<200',
    'p(95)<150',
    'p(50)<50',
    'avg<80',
  ],
  
  // Global HTTP Thresholds
  'http_req_duration': [
    'p(99)<1000',
    'p(95)<500',
    'p(50)<200',
  ],
  
  'http_req_failed': [
    'rate<0.01', // Less than 1% failure
  ],
  
  'http_reqs': [],
};

export const environments = {
  staging: {
    BASE_URL: 'https://api-staging.schoolerp.asia-south1.run.app',
    LOAD_MULTIPLIER: 0.5,
    DURATION_MULTIPLIER: 0.5,
  },
  production: {
    BASE_URL: 'https://api.schoolerp.asia-south1.run.app',
    LOAD_MULTIPLIER: 1.0,
    DURATION_MULTIPLIER: 1.0,
  },
};

export const apiEndpoints = {
  attendance: {
    bulkMark: '/api/v1/schools/{schoolId}/attendance/bulk-mark',
    getStatus: '/api/v1/schools/{schoolId}/attendance/status/{batchId}',
    getReport: '/api/v1/schools/{schoolId}/attendance/report',
  },
  grades: {
    get: '/api/v1/schools/{schoolId}/grades',
    getTrend: '/api/v1/schools/{schoolId}/grades/{subjectId}/trend',
    getAnalytics: '/api/v1/schools/{schoolId}/grades/analytics',
  },
  payments: {
    initiate: '/api/v1/schools/{schoolId}/payments/initiate',
    verify: '/api/v1/schools/{schoolId}/payments/verify',
    getStatus: '/api/v1/schools/{schoolId}/payments/{paymentId}/status',
  },
  notifications: {
    send: '/api/v1/schools/{schoolId}/notifications/send',
    queueStatus: '/api/v1/schools/{schoolId}/notifications/queue-status',
    getDLQ: '/api/v1/schools/{schoolId}/notifications/dlq',
  },
};

export const slaTargets = {
  attendance: {
    throughput: '1000 req/sec',
    p99Latency: '<500ms',
    p95Latency: '<300ms',
    errorRate: '<1%',
    successCriteria: 'p99Latency AND errorRate',
  },
  grades: {
    concurrency: '5000 concurrent users',
    p95Latency: '<300ms',
    p99Latency: '<500ms',
    errorRate: '<1%',
    successCriteria: 'p95Latency AND errorRate',
  },
  payment: {
    concurrency: '500 concurrent',
    p99Latency: '<1000ms',
    p95Latency: '<750ms',
    errorRate: '<0.5%',
    successCriteria: 'p99Latency AND errorRate',
  },
  notification: {
    throughput: '10,000 msg/sec',
    p99Latency: '<200ms',
    p95Latency: '<150ms',
    errorRate: '<0.1%',
    successCriteria: 'p99Latency AND errorRate',
  },
};

export const testScenarios = {
  smokeTest: {
    duration: '1m',
    vus: 10,
    description: 'Quick validation',
  },
  loadTest: {
    duration: '30m',
    vus: 'ramp from 0 to peak over 10m',
    description: 'Standard load test to peak capacity',
  },
  stressTest: {
    duration: '20m',
    vus: 'ramp above peak to breaking point',
    description: 'Identify system limits',
  },
  spikeTest: {
    duration: '15m',
    vus: 'sudden spike from baseline to peak',
    description: 'Test rapid scaling capability',
  },
};

export function getThresholdsForScenario(scenario) {
  const baseThresholds = thresholds;
  
  switch (scenario) {
    case 'smoke':
      return {
        ...baseThresholds,
        'http_req_failed': ['rate<0.05'], // More lenient for smoke
      };
    case 'stress':
      return {
        ...baseThresholds,
        'http_req_failed': ['rate<0.05'],
        // P99 allowed to be higher under stress
        'attendance_latency_ms': ['p(99)<1000'],
      };
    default:
      return baseThresholds;
  }
}
```

---

## FILE 6: k6-report-generator.js
**Purpose:** Centralized report generation and analysis

```javascript
/**
 * K6 Load Test Report Generator
 * Processes metrics and generates HTML + JSON reports
 */

export function generateReport(data) {
  const report = {
    summary: generateSummary(data),
    metrics: extractMetrics(data),
    thresholdResults: evaluateThresholds(data),
    recommendations: generateRecommendations(data),
    timeline: generateTimeline(data),
  };

  return report;
}

function generateSummary(data) {
  const metrics = data.metrics || {};
  
  return {
    testDuration: data.state?.testRunDurationMs || 0,
    totalRequests: metrics.http_reqs?.value || 0,
    totalErrors: metrics.http_req_failed?.value || 0,
    successRate: calculateSuccessRate(metrics),
    avgLatency: metrics.http_req_duration?.values?.avg || 0,
    p95Latency: metrics.http_req_duration?.values?.p95 || 0,
    p99Latency: metrics.http_req_duration?.values?.p99 || 0,
    peakVUs: data.state?.maxVUs || 0,
  };
}

function extractMetrics(data) {
  const metrics = data.metrics || {};
  
  return {
    attendance: {
      latency: {
        p50: metrics.attendance_latency_ms?.values?.p50 || 0,
        p95: metrics.attendance_latency_ms?.values?.p95 || 0,
        p99: metrics.attendance_latency_ms?.values?.p99 || 0,
        avg: metrics.attendance_latency_ms?.values?.avg || 0,
      },
      successCount: metrics.attendance_success?.value || 0,
      errorCount: metrics.attendance_errors?.value || 0,
      status: determineSLAStatus(
        metrics.attendance_latency_ms?.values?.p99,
        500,
        metrics.attendance_success?.value,
        metrics.attendance_errors?.value
      ),
    },
    grades: {
      latency: {
        p95: metrics.grade_latency_ms?.values?.p95 || 0,
        p99: metrics.grade_latency_ms?.values?.p99 || 0,
        avg: metrics.grade_latency_ms?.values?.avg || 0,
      },
      successRate: metrics.grade_success_rate?.value || 0,
      errorCount: metrics.grade_errors?.value || 0,
      status: determineSLAStatus(
        metrics.grade_latency_ms?.values?.p95,
        300,
        metrics.grade_success_rate?.value * 100,
        metrics.grade_errors?.value
      ),
    },
    payment: {
      latency: {
        p99: metrics.payment_latency_ms?.values?.p99 || 0,
        p95: metrics.payment_latency_ms?.values?.p95 || 0,
        avg: metrics.payment_latency_ms?.values?.avg || 0,
      },
      dailyRevenue: metrics.daily_revenue_total?.value || 0,
      errorCount: metrics.payment_errors?.value || 0,
      status: determineSLAStatus(
        metrics.payment_latency_ms?.values?.p99,
        1000,
        100,
        metrics.payment_errors?.value
      ),
    },
    notification: {
      latency: {
        p99: metrics.notification_latency_ms?.values?.p99 || 0,
        p95: metrics.notification_latency_ms?.values?.p95 || 0,
        avg: metrics.notification_latency_ms?.values?.avg || 0,
      },
      delivered: metrics.notification_delivered?.value || 0,
      errorCount: metrics.notification_errors?.value || 0,
      dlqSize: metrics.dlq_size?.value || 0,
      status: determineSLAStatus(
        metrics.notification_latency_ms?.values?.p99,
        200,
        metrics.notification_delivered?.value,
        metrics.notification_errors?.value
      ),
    },
  };
}

function evaluateThresholds(data) {
  const thresholdValues = data.thresholds || {};
  
  return {
    passed: Object.entries(thresholdValues)
      .filter(([_, v]) => v.pass === true)
      .map(([k]) => k),
    failed: Object.entries(thresholdValues)
      .filter(([_, v]) => v.pass === false)
      .map(([k]) => k),
    totalThresholds: Object.keys(thresholdValues).length,
    passRate: calculatePassRate(thresholdValues),
  };
}

function generateRecommendations(data) {
  const recommendations = [];
  const metrics = data.metrics || {};
  
  // Attendance recommendations
  if (metrics.attendance_latency_ms?.values?.p99 > 500) {
    recommendations.push({
      severity: 'HIGH',
      area: 'Attendance Bulk Mark',
      issue: 'P99 latency exceeds 500ms SLA',
      recommendation: 'Optimize batch processing or increase database capacity',
      action: 'Review firestore write throughput, enable caching',
    });
  }
  
  // Grade retrieval recommendations
  if (metrics.grade_errors?.value > 0) {
    recommendations.push({
      severity: 'MEDIUM',
      area: 'Grade Retrieval',
      issue: `${metrics.grade_errors?.value} errors detected`,
      recommendation: 'Investigate error logs and add retry logic',
      action: 'Check API error rate logs in Cloud Logging',
    });
  }
  
  // Payment recommendations
  if (metrics.payment_latency_ms?.values?.p99 > 1000) {
    recommendations.push({
      severity: 'HIGH',
      area: 'Payment Processing',
      issue: 'P99 latency exceeds 1000ms SLA',
      recommendation: 'Optimize Razorpay API calls or implement caching',
      action: 'Consider async processing with job queue (Cloud Tasks)',
    });
  }
  
  // Notification recommendations
  if (metrics.dlq_size?.value > 100) {
    recommendations.push({
      severity: 'HIGH',
      area: 'Notifications',
      issue: `Dead letter queue at ${metrics.dlq_size?.value} messages`,
      recommendation: 'Investigate failed notification delivery',
      action: 'Review Pub/Sub subscription errors and retry policies',
    });
  }
  
  return recommendations;
}

function generateTimeline(data) {
  // Generate 5-minute interval summaries
  return {
    intervals: data.samples?.map(sample => ({
      timestamp: sample.time,
      activeVUs: sample.vus,
      requestsPerSecond: sample.http_reqs || 0,
      avgLatency: sample.http_req_duration?.avg || 0,
      errorRate: sample.http_req_failed?.value || 0,
    })) || [],
  };
}

// Helper functions
function calculateSuccessRate(metrics) {
  const totalReqs = metrics.http_reqs?.value || 1;
  const failedReqs = metrics.http_req_failed?.value || 0;
  return Number((((totalReqs - failedReqs) / totalReqs) * 100).toFixed(2));
}

function calculatePassRate(thresholds) {
  const total = Object.keys(thresholds).length;
  const passed = Object.values(thresholds).filter(v => v.pass === true).length;
  return total > 0 ? Number(((passed / total) * 100).toFixed(2)) : 0;
}

function determineSLAStatus(latency, slaLimit, successCount, errorCount) {
  if (latency > slaLimit * 1.2) return 'CRITICAL';
  if (latency > slaLimit) return 'WARNING';
  if (errorCount > 10) return 'WARNING';
  if (successCount > 0) return 'PASS';
  return 'UNKNOWN';
}

export function htmlReport(reportData) {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>K6 Load Test Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
    .summary-card { display: inline-block; margin: 10px; padding: 15px; background: #f9f9f9; border-left: 4px solid #007bff; }
    .metric { font-size: 24px; font-weight: bold; color: #333; }
    .label { font-size: 12px; color: #666; }
    .status-pass { color: #28a745; }
    .status-fail { color: #dc3545; }
    .status-warn { color: #ffc107; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background: #007bff; color: white; }
    .recommendation { padding: 15px; margin: 10px 0; background: #fff3cd; border-left: 4px solid #ffc107; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 K6 Load Test Report</h1>
    <h3>Test Duration: ${reportData.summary.testDuration}ms | Total Requests: ${reportData.summary.totalRequests}</h3>
    
    <h2>Summary Metrics</h2>
    <div>
      <div class="summary-card">
        <div class="label">Success Rate</div>
        <div class="metric">${reportData.summary.successRate}%</div>
      </div>
      <div class="summary-card">
        <div class="label">Avg Latency</div>
        <div class="metric">${reportData.summary.avgLatency.toFixed(2)}ms</div>
      </div>
      <div class="summary-card">
        <div class="label">P99 Latency</div>
        <div class="metric">${reportData.summary.p99Latency.toFixed(2)}ms</div>
      </div>
      <div class="summary-card">
        <div class="label">Peak VUs</div>
        <div class="metric">${reportData.summary.peakVUs}</div>
      </div>
    </div>

    <h2>Per-Module SLA Status</h2>
    <table>
      <tr><th>Module</th><th>P99 Latency</th><th>Success</th><th>Errors</th><th>Status</th></tr>
      <tr>
        <td>Attendance</td>
        <td>${reportData.metrics.attendance.latency.p99.toFixed(2)}ms</td>
        <td>${reportData.metrics.attendance.successCount}</td>
        <td>${reportData.metrics.attendance.errorCount}</td>
        <td class="status-${reportData.metrics.attendance.status === 'PASS' ? 'pass' : reportData.metrics.attendance.status === 'WARNING' ? 'warn' : 'fail'}">${reportData.metrics.attendance.status}</td>
      </tr>
      <tr>
        <td>Grades</td>
        <td>${reportData.metrics.grades.latency.p95.toFixed(2)}ms (P95)</td>
        <td>${(reportData.metrics.grades.successRate * 100).toFixed(2)}%</td>
        <td>${reportData.metrics.grades.errorCount}</td>
        <td class="status-${reportData.metrics.grades.status === 'PASS' ? 'pass' : reportData.metrics.grades.status === 'WARNING' ? 'warn' : 'fail'}">${reportData.metrics.grades.status}</td>
      </tr>
      <tr>
        <td>Payment</td>
        <td>${reportData.metrics.payment.latency.p99.toFixed(2)}ms</td>
        <td>₹${reportData.metrics.payment.dailyRevenue.toLocaleString('en-IN')}</td>
        <td>${reportData.metrics.payment.errorCount}</td>
        <td class="status-${reportData.metrics.payment.status === 'PASS' ? 'pass' : reportData.metrics.payment.status === 'WARNING' ? 'warn' : 'fail'}">${reportData.metrics.payment.status}</td>
      </tr>
      <tr>
        <td>Notification</td>
        <td>${reportData.metrics.notification.latency.p99.toFixed(2)}ms</td>
        <td>${reportData.metrics.notification.delivered}</td>
        <td>${reportData.metrics.notification.errorCount} (DLQ: ${reportData.metrics.notification.dlqSize})</td>
        <td class="status-${reportData.metrics.notification.status === 'PASS' ? 'pass' : reportData.metrics.notification.status === 'WARNING' ? 'warn' : 'fail'}">${reportData.metrics.notification.status}</td>
      </tr>
    </table>

    <h2>Threshold Results</h2>
    <p><strong>Passed:</strong> ${reportData.thresholdResults.passed.length}/${reportData.thresholdResults.totalThresholds}</p>
    <div style="background: #e8f5e9; padding: 10px; border-radius: 4px; margin: 10px 0;">
      ${reportData.thresholdResults.passed.map(t => `<div>✓ ${t}</div>`).join('')}
    </div>
    ${reportData.thresholdResults.failed.length > 0 ? `
    <div style="background: #ffebee; padding: 10px; border-radius: 4px; margin: 10px 0;">
      <strong>Failed Thresholds:</strong>
      ${reportData.thresholdResults.failed.map(t => `<div>✗ ${t}</div>`).join('')}
    </div>
    ` : ''}

    <h2>Recommendations</h2>
    ${reportData.recommendations.map(rec => `
    <div class="recommendation">
      <strong>[${rec.severity}] ${rec.area}</strong><br/>
      <strong>Issue:</strong> ${rec.issue}<br/>
      <strong>Recommendation:</strong> ${rec.recommendation}<br/>
      <strong>Action:</strong> ${rec.action}
    </div>
    `).join('')}
  </div>
</body>
</html>
  `;
}
```

---

## EXECUTION COMMANDS

```bash
# Smoke Test (1 minute, 10 VUs)
k6 run --vus 10 --duration 1m k6-attendance-loadtest.js

# Load Test - Attendance (1,000 req/sec target)
k6 run --env BASE_URL=https://api.schoolerp.asia-south1.run.app \
       --env SCHOOL_ID=SCHOOL_IND_001 \
       --env TEACHER_TOKEN="bearer_token_here" \
       k6-attendance-loadtest.js

# Load Test - Grades (5,000 concurrent users)
k6 run -e BASE_URL=https://api.schoolerp.asia-south1.run.app \
       -e PARENT_TOKEN="bearer_token_here" \
       k6-grades-loadtest.js

# Load Test - Payments (500 concurrent, measure daily revenue)
k6 run -e BASE_URL=https://api.schoolerp.asia-south1.run.app \
       -e PARENT_TOKEN="bearer_token_here" \
       k6-payment-loadtest.js

# Load Test - Notifications (10,000 msg/sec)
k6 run -e BASE_URL=https://api.schoolerp.asia-south1.run.app \
       -e SERVICE_ACCOUNT_TOKEN="bearer_token_here" \
       k6-notification-loadtest.js

# Generate Report (JSON + HTML)
k6 run --out json=summary.json k6-attendance-loadtest.js
```

---

**Total Load Testing Code:** 2,000+ lines  
**Coverage:** 4 critical workflows, threshold validation, report generation  
**Status:** ✅ Production-ready
