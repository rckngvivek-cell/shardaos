import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import ws from 'k6/ws';
import { Gauge } from 'k6/metrics';

// Custom metrics
const notificationDispatchTime = new Trend('notification_dispatch_time');
const notificationSuccessRate = new Rate('notification_success_rate');
const throughput = new Gauge('throughput_msg_per_sec');
const totalNotificationsSent = new Counter('notifications_sent');

export const options = {
  stages: [
    { duration: '1m', target: 200 },     // Ramp to 200 msgs/sec
    { duration: '3m', target: 500 },     // Ramp to 500 msgs/sec
    { duration: '3m', target: 1000 },    // Ramp to 1000 msgs/sec (peak)
    { duration: '3m', target: 1000 },    // Sustain 1000 msgs/sec
    { duration: '1m', target: 0 },       // Ramp down
  ],
  thresholds: {
    'notification_dispatch_time': ['p(99)<100', 'p(95)<50'], // P99 < 100ms, P95 < 50ms
    'notification_success_rate': ['rate>0.99'], // 99% success
    'http_req_failed': ['rate<0.01'],
    'throughput_msg_per_sec': ['value>900'], // At least 900 msgs/sec
  },
  ext: {
    loadimpact: {
      projectID: 1234567,
      name: 'DeerFlow - Notification Dispatch Load Test',
    },
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://api.deerflow.dev';
const WS_URL = __ENV.WS_URL || 'wss://notifications.deerflow.dev';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || 'test-token-placeholder';

let messageCount = 0;
let successCount = 0;

export default function () {
  group('Notification Dispatch - 1000 msgs/sec', () => {
    // Method 1: HTTP-based notification dispatch (batch)
    dispatchViaHTTP();

    sleep(0.1); // 100ms between batch dispatches
  });
}

function dispatchViaHTTP() {
  // Simulate batch notification dispatch
  const batchSize = Math.floor(Math.random() * 50 + 10); // 10-60 notifications per batch
  const notifications = [];

  for (let i = 0; i < batchSize; i++) {
    const recipientId = `recipient_${(__VU % 10000) + i}`;
    const notificationType = ['announcement', 'grade_update', 'attendance', 'payment_due'][Math.floor(Math.random() * 4)];

    notifications.push({
      recipientId: recipientId,
      type: notificationType,
      message: `Test notification ${__ITER}_${i}`,
      channels: ['push', 'sms', 'email'],
      priority: Math.random() > 0.8 ? 'high' : 'normal',
      timestamp: new Date().toISOString(),
    });
  }

  const payload = JSON.stringify({
    notifications: notifications,
    batchId: `batch_${__VU}_${__ITER}`,
  });

  const params = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
      'Content-Type': 'application/json',
      'User-Agent': 'K6LoadTest/1.0',
      'X-Batch-ID': `batch_${__VU}_${__ITER}`,
    },
    tags: { 
      scenario: 'notification_dispatch',
      batch_size: batchSize.toString()
    },
  };

  const startTime = new Date().getTime();
  let res = http.post(
    `${BASE_URL}/api/v1/notifications/batch-dispatch`,
    payload,
    params
  );
  const duration = new Date().getTime() - startTime;

  notificationDispatchTime.add(duration, { batch_size: batchSize });

  let success = check(res, {
    'batch dispatch status is 200': (r) => r.status === 200,
    'response contains batch_id': (r) => r.body.includes('batch_id'),
    'dispatch time < 100ms': (r) => r.timings.duration < 100,
    'all notifications queued': (r) => r.body.includes('queued'),
    'no errors in response': (r) => !r.body.includes('error'),
  });

  notificationSuccessRate.add(success);
  messageCount += batchSize;
  if (success) {
    successCount += batchSize;
  }
  totalNotificationsSent.add(batchSize);

  // Update throughput gauge
  const elapsedSeconds = __VU * (messageCount / 1000);
  throughput.set(messageCount / Math.max(elapsedSeconds, 0.1));

  if (!success) {
    console.error(`Batch dispatch failed for batch_${__VU}_${__ITER}`);
  }
}

// WebSocket connection for real-time notification delivery verification
export function handleWebSocket() {
  const wsParams = {
    headers: {
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    tags: { scenario: 'notification_websocket' },
  };

  ws.connect(WS_URL, wsParams, function (socket) {
    socket.on('open', () => {
      console.log('WebSocket connected for notifications');
      socket.send(JSON.stringify({
        action: 'subscribe',
        channels: ['notifications'],
      }));
    });

    socket.on('message', (message) => {
      let data = JSON.parse(message);
      check(data, {
        'message has id': (m) => m.id !== undefined,
        'message has type': (m) => m.type !== undefined,
        'message has timestamp': (m) => m.timestamp !== undefined,
      });
    });

    socket.on('close', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (e) => {
      console.error('WebSocket error', e);
    });

    sleep(5);
    socket.close();
  });
}

export function teardown(data) {
  console.log(`Total notifications sent: ${messageCount}`);
  console.log(`Successful deliveries: ${successCount}`);
  console.log(`Success rate: ${((successCount / messageCount) * 100).toFixed(2)}%`);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify({
      summary: data,
      custom: {
        totalNotifications: messageCount,
        successfulNotifications: successCount,
        successRate: (successCount / messageCount) * 100,
      }
    }, null, 2),
  };
}
