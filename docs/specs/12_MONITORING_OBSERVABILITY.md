# MONITORING & OBSERVABILITY GUIDE
## Logging, Metrics, Alerts, Dashboards & Performance Tracking

**Version:** 1.0.0  
**Date:** April 9, 2026  
**Status:** Production-Ready  

---

# PART 1: STRUCTURED LOGGING

## Logging Architecture

```typescript
// src/utils/logger.ts
import winston from 'winston';
import path from 'path';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.label({ label: path.basename(process.mainModule!.filename) }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level} [${info.label}]: ${info.message}`
  )
);

const transports = [
  // Console output
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      format
    ),
  }),

  // Error logs file
  new winston.transports.File({
    filename: './logs/errors.log',
    level: 'error',
    format,
  }),

  // All logs file
  new winston.transports.File({
    filename: './logs/all.log',
    format,
  }),
];

export const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
});
```

## Usage in Services

```typescript
// src/services/students.service.ts
import { Logger } from '@/utils/logger';

export class StudentsService {
  async createStudent(schoolId: string, data: StudentDTO): Promise<Student> {
    Logger.info(`Creating student in school ${schoolId}`, {
      schulId,
      email: data.email,
      timestamp: new Date().toISOString(),
    });

    try {
      const student = await firestore
        .collection('students')
        .add(data);

      Logger.info(`Student created: ${student.id}`, {
        studentId: student.id,
        schoolId,
      });

      return student.data() as Student;
    } catch (error) {
      Logger.error(`Failed to create student: ${error.message}`, {
        schoolId,
        error: error.stack,
      });
      throw error;
    }
  }

  async getStudent(schoolId: string, studentId: string): Promise<Student> {
    Logger.debug(`Fetching student ${studentId}`, {
      schoolId,
    });

    const student = await firestore
      .collection('students')
      .doc(studentId)
      .get();

    if (!student.exists()) {
      Logger.warn(`Student not found: ${studentId}`, {
        schoolId,
      });
      throw new NotFoundError('Student', studentId);
    }

    Logger.debug(`Student fetched successfully`, {
      studentId,
      schoolId,
    });

    return student.data() as Student;
  }
}
```

---

# PART 2: APPLICATION METRICS

## Key Metrics to Track

```typescript
// src/middleware/metrics.ts
import prometheus from 'prom-client';

// Request duration
export const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
});

// Request counter
export const httpRequestTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Error counter
export const errorCounter = new prometheus.Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['error_type', 'route', 'status_code'],
});

// Database operations
export const dbOperationDuration = new prometheus.Histogram({
  name: 'db_operation_duration_seconds',
  help: 'Duration of database operations',
  labelNames: ['operation', 'collection'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
});

// Active connections
export const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'],
});

// Cache hit rate
export const cacheHitRate = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type'],
});

// Middleware to track metrics
export const metricsMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);

    httpRequestTotal
      .labels(req.method, route, res.statusCode)
      .inc();

    if (res.statusCode >= 400) {
      errorCounter
        .labels('http_error', route, res.statusCode)
        .inc();
    }
  });

  next();
};
```

---

# PART 3: GOOGLE CLOUD LOGGING

## Log Aggregation Setup

```bash
# Enable Cloud Logging API
gcloud services enable logging.googleapis.com

# Create log sink
gcloud logging sinks create school-erp-logs \
  cloud-storage://school-erp-logs-bucket \
  --log-filter='resource.type="cloud_run_revision" 
               resource.labels.service_name="school-erp-api"'

# Create log retention policy (90 days)
gcloud logging update-log --retention-days=90
```

## Custom Log Queries

```bash
# Query: High error rate (last 1 hour)
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND jsonPayload.level="ERROR"
   AND timestamp>="2026-04-09T00:00:00Z"' \
  --limit 100 \
  --format json

# Query: Slow API requests (> 2 seconds)
gcloud logging read \
  'resource.type="cloud_run_revision"
   AND jsonPayload.duration_seconds > 2' \
  --limit 50

# Query: Failed authentications
gcloud logging read \
  'jsonPayload.error_code="UNAUTHORIZED"
   AND timestamp>="2026-04-09T00:00:00Z"' \
  --limit 100
```

---

# PART 4: METRICS & DASHBOARDS

## Google Cloud Monitoring Dashboard

```bash
# Create Firestore metrics dashboard
gcloud monitoring dashboards create --config-from-file=- << 'EOF'
{
  "displayName": "School ERP - Firestore Metrics",
  "dashboardFilters": [],
  "gridLayout": {
    "widgets": [
      {
        "title": "Document Reads/sec",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"firestore.googleapis.com/document/reads\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_RATE"
                }
              }
            }
          }]
        }
      },
      {
        "title": "Document Writes/sec",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"firestore.googleapis.com/document/writes\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_RATE"
                }
              }
            }
          }]
        }
      },
      {
        "title": "Storage Usage (GB)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"firestore.googleapis.com/available_operations\"",
                "aggregation": {
                  "alignmentPeriod": "86400s"
                }
              }
            }
          }]
        }
      }
    ]
  }
}
EOF

# Create API metrics dashboard
gcloud monitoring dashboards create --config-from-file=- << 'EOF'
{
  "displayName": "School ERP - API Performance",
  "gridLayout": {
    "widgets": [
      {
        "title": "Request Rate (req/sec)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"run.googleapis.com/request_count\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_RATE"
                }
              }
            }
          }]
        }
      },
      {
        "title": "Error Rate (%)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"run.googleapis.com/request_count\" resource.labels.service_name=\"school-erp-api\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_RATE"
                }
              }
            }
          }]
        }
      },
      {
        "title": "CPU Usage (%)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"run.googleapis.com/container/cpu/allocation_time\""
              }
            }
          }]
        }
      },
      {
        "title": "Memory Usage (MB)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"run.googleapis.com/container/memory/working_set_bytes\""
              }
            }
          }]
        }
      }
    ]
  }
}
EOF
```

---

# PART 5: ALERTING POLICIES

## Critical Alerts

```bash
# Alert: High error rate (> 5%)
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="High Error Rate Alert" \
  --condition-display-name="Error rate exceeds 5%" \
  --condition-threshold-filter='metric.type="run.googleapis.com/request_count"' \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s \
  --condition-threshold-comparison=COMPARISON_GT

# Alert: High latency (p99 > 2 seconds)
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="High Latency Alert" \
  --condition-display-name="API latency p99 > 2s" \
  --condition-threshold-value=2000 \
  --condition-threshold-duration=300s

# Alert: Database rate limit exceeded
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="Database Rate Limit Alert" \
  --condition-display-name="Firestore writes > 5000/sec" \
  --condition-threshold-filter='metric.type="firestore.googleapis.com/document/writes"' \
  --condition-threshold-value=5000

# Alert: Storage quota 90% full
gcloud alpha monitoring policies create \
  --notification-channels=<CHANNEL_ID> \
  --display-name="Storage Quota Alert" \
  --condition-display-name="Firestore storage > 90% of quota"

# Alert: Service down (uptime check)
gcloud monitoring uptime create \
  --display-name="School ERP API Uptime" \
  --monitored-resource="uptime-url" \
  --http-check="test-path=/api/v1/health&expected-status-code=200" \
  --period=60
```

---

# PART 6: PERFORMANCE MONITORING

## Request Tracing

```typescript
// src/middleware/tracing.ts
import { trace, context } from '@opentelemetry/api';

const tracer = trace.getTracer('school-erp-api');

export const tracingMiddleware = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
): void => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);

  context.with(trace.setSpan(context.active(), span), () => {
    res.on('finish', () => {
      span.setAttributes({
        'http.method': req.method,
        'http.url': req.url,
        'http.status_code': res.statusCode,
        'http.response_time_ms': Date.now() - req.startTime,
      });
      span.end();
    });

    next();
  });
};
```

## Slow Query Detection

```typescript
// src/services/students.service.ts
async getStudentsByClass(schoolId: string, classNum: number): Promise<Student[]> {
  const startTime = performance.now();

  const students = await firestore
    .collection('students')
    .where('schoolId', '==', schoolId)
    .where('class', '==', classNum)
    .get();

  const duration = performance.now() - startTime;

  // Flag slow queries
  if (duration > 1000) {
    Logger.warn(`Slow query detected: ${duration}ms`, {
      query: 'getStudentsByClass',
      schoolId,
      classNum,
      duration,
    });
  }

  return students.docs.map((doc) => doc.data() as Student);
}
```

---

# PART 7: BUSINESS METRICS

## KPI Tracking

```typescript
// src/services/analytics.service.ts
import { Logger } from '@/utils/logger';

export class AnalyticsService {
  // Track student enrollment
  async trackEnrollment(schoolId: string): Promise<number> {
    const count = await firestore
      .collection('students')
      .where('schoolId', '==', schoolId)
      .where('status', '==', 'active')
      .count()
      .get();

    Logger.info(`Student enrollment tracked`, {
      schoolId,
      activeStudents: count.data().count,
    });

    return count.data().count;
  }

  // Track attendance rate
  async calculateAttendanceRate(
    schoolId: string,
    date: Date
  ): Promise<number> {
    const attendance = await firestore
      .collection('attendance')
      .where('schoolId', '==', schoolId)
      .where('date', '==', date)
      .get();

    const presentCount = attendance.docs.filter(
      (doc) => doc.data().status === 'present'
    ).length;

    const rate = (presentCount / attendance.size) * 100;

    Logger.info(`Attendance rate calculated`, {
      schoolId,
      date,
      attendanceRate: rate.toFixed(2),
    });

    return rate;
  }

  // Track exam performance
  async trackExamPerformance(
    schoolId: string,
    examId: string
  ): Promise<{ average: number; median: number; distribution: Record<string, number> }> {
    const marks = await firestore
      .collection('grades')
      .where('schoolId', '==', schoolId)
      .where('examId', '==', examId)
      .get();

    const scores = marks.docs.map((doc) => doc.data().obtainedMarks);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const sorted = scores.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    Logger.info(`Exam performance analyzed`, {
      schoolId,
      examId,
      average: average.toFixed(2),
      median,
      totalStudents: scores.length,
    });

    return {
      average,
      median,
      distribution: this.calculateDistribution(scores),
    };
  }

  private calculateDistribution(scores: number[]): Record<string, number> {
    return {
      'A (90-100)': scores.filter((s) => s >= 90).length,
      'B (80-89)': scores.filter((s) => s >= 80 && s < 90).length,
      'C (70-79)': scores.filter((s) => s >= 70 && s < 80).length,
      'D (60-69)': scores.filter((s) => s >= 60 && s < 70).length,
      'F (<60)': scores.filter((s) => s < 60).length,
    };
  }
}
```

---

# PART 8: ALERTING CHANNELS

```bash
# Create email notification channel
gcloud alpha monitoring channels create \
  --display-name="Team Email" \
  --type=email \
  --channel-labels=email_address=team@schoolerp.io

# Create Slack notification channel
gcloud alpha monitoring channels create \
  --display-name="Slack #alerts" \
  --type=slack \
  --channel-labels=channel_name=#alerts

# Create PagerDuty notification channel
gcloud alpha monitoring channels create \
  --display-name="PagerDuty On-Call" \
  --type=pagerduty \
  --channel-labels=service_key=<SERVICE_KEY>

# Get channel ID for use in alerts
gcloud alpha monitoring channels list --filter="displayName:Slack" --format="value(name)"
```

---

# PART 9: ON-CALL RUNBOOK

## Common Issues & Resolutions

```
┌─ ALERT: High Error Rate
│
├─ CHECK: Error logs in Cloud Logging
├─ COMMAND: gcloud logging read 'severity=ERROR' --limit 20
│
├─ IF: Database error
│   └─ ACTION: Check Firestore quota (gcloud firestore databases describe)
│
├─ IF: Service unavailable
│   └─ ACTION: Restart Cloud Run (gcloud run deploy school-erp-api --no-traffic)
│
└─ ESCALATE: If unresolved in 15 min, page backup on-call engineer

┌─ ALERT: High Latency (p99 > 2s)
│
├─ CHECK: CPU/Memory usage (dashboard)
├─ CHECK: Slow queries (application traces)
│
├─ IF: High CPU usage
│   └─ ACTION: Increase max-instances (gcloud run update school-erp-api --max-instances 100)
│
├─ IF: Slow query detected
│   └─ ACTION: Add index or optimize query
│
└─ FOLLOW UP: Review trace logs to identify root cause

┌─ ALERT: Storage Quota Alert (90% full)
│
├─ CALCULATE: Current usage vs quota
├─ ESTIMATE: Growth rate (days to quota exhaustion)
│
├─ IF: Days < 14
│   └─ ACTION: Emergency meeting to discuss partition/cleanup
│
└─ PLAN: Archive old data or request quota increase
```

---

**Your monitoring setup provides end-to-end visibility into system health, performance, and business impact.**
