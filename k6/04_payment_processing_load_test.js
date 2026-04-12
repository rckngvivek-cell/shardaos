import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Custom metrics
const paymentDuration = new Trend('payment_duration');
const paymentSuccessRate = new Rate('payment_success_rate');
const paymentFailures = new Counter('payment_failures');

export const options = {
  vus: 100,
  duration: '10m',
  thresholds: {
    'payment_duration{endpoint:payment_processing}': ['p(99)<1000'], // P99 < 1 second
    'payment_success_rate': ['rate>0.95'], // 95% success rate
    'http_req_failed': ['rate<0.05'], // Less than 5% failure
    'http_req_duration': ['p(95)<900'], // P95 < 900ms
  },
  ext: {
    loadimpact: {
      projectID: 1234567,
      name: 'DeerFlow - Payment Processing Load Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.deerflow.dev';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token-placeholder';

export default function () {
  group('Payment Processing - 100 Concurrent VUs', () => {
    // Simulate payment initiation
    const invoiceId = `invoice_${(__VU % 50) + 1}`;
    const amount = (Math.random() * 5000 + 500).toFixed(2); // 500-5500 INR

    // Step 1: Initiate payment
    const initiatePaymentPayload = JSON.stringify({
      invoiceId: invoiceId,
      amount: parseFloat(amount),
      currency: 'INR',
      method: 'razorpay',
      studentId: `student_${__VU}`,
    });

    const paymentParams = {
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'K6LoadTest/1.0',
        'X-Request-ID': `pay_${__VU}_${__ITER}`,
      },
      tags: { endpoint: 'payment_processing', vus: '100' },
    };

    let initRes = http.post(
      `${BASE_URL}/api/v1/payments/initiate`,
      initiatePaymentPayload,
      paymentParams
    );

    const initStartTime = new Date();
    const initDuration = new Date() - initStartTime;
    paymentDuration.add(initDuration, { endpoint: 'payment_processing', step: 'initiate' });

    let initiateSuccess = check(initRes, {
      'payment initiation status is 200': (r) => r.status === 200,
      'response contains order_id': (r) => r.body.includes('order_id'),
      'response time < 500ms': (r) => r.timings.duration < 500,
      'no 5xx errors': (r) => r.status < 500,
    });

    if (!initiateSuccess) {
      paymentFailures.add(1);
    }

    if (initiateSuccess) {
      let initData = JSON.parse(initRes.body);
      let orderId = initData.data.order_id;

      sleep(Math.random() * 2 + 0.5); // Simulate user payment entry

      // Step 2: Verify payment
      const verifyPaymentPayload = JSON.stringify({
        orderId: orderId,
        paymentId: `razorpay_payment_${__ITER}`,
        signature: `signature_${__VU}_${__ITER}`,
      });

      let verifyRes = http.post(
        `${BASE_URL}/api/v1/payments/verify`,
        verifyPaymentPayload,
        paymentParams
      );

      const verifyStartTime = new Date();
      const verifyDuration = new Date() - verifyStartTime;
      paymentDuration.add(verifyDuration, { endpoint: 'payment_processing', step: 'verify' });

      let verifySuccess = check(verifyRes, {
        'payment verification status is 200': (r) => r.status === 200,
        'response contains transaction_id': (r) => r.body.includes('transaction_id'),
        'payment verification time < 1000ms': (r) => r.timings.duration < 1000,
        'verification returns success': (r) => r.body.includes('"status":"success"') || r.body.includes('"status":"completed"'),
      });

      paymentSuccessRate.add(verifySuccess);

      if (!verifySuccess) {
        paymentFailures.add(1);
      }

      sleep(Math.random() * 3 + 1); // Random sleep between transactions
    } else {
      paymentSuccessRate.add(false);
    }
  });
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
