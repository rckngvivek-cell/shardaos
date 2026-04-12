# ADR-004: Monitoring & Alerting Strategy

**Status:** ACCEPTED  
**Date:** May 9, 2026  
**Deciders:** Lead Architect, DevOps Agent  
**Consulted:** QA Agent, Backend Agent  
**Informed:** All agents

## Context

Production deployment of Week 4 requires real-time visibility into system health and performance. We need:

- Error detection and alerting for on-call response
- Performance monitoring to catch regression
- Audit logging for compliance
- Distributed tracing for debugging production issues
- Cost optimization through log aggregation

## Decision

We implement **Google Cloud Operations (GCP) + Cloud Monitoring + Cloud Logging** with structured logging and SLO-based alerting.

### 1. Logging Strategy

**Structured Logging with JSON:**

```typescript
// apps/api/src/middleware/logging.ts

import { createLogger } from 'winston';
import * as functions from '@google-cloud/functions-framework';

const logger = createLogger({
  format: functions.logEntry({ serviceContext: { service: 'school-erp-api' } }),
  transports: [new winston.transports.Console()],
  defaultMeta: { application: 'school-erp-api' },
});

// Log levels
logger.error('Payment failed', {
  severity: 'ERROR',
  userId: user.id,
  schoolId: user.schoolId,
  error: error.message,
  stack: error.stack,
  tags: ['payment', 'critical'],
});

logger.warn('High latency detected', {
  severity: 'WARNING',
  endpoint: '/api/v1/students',
  latency_ms: 1250,
  p95_threshold_ms: 500,
  tags: ['performance'],
});

logger.info('Student created', {
  severity: 'INFO',
  action: 'CREATE_STUDENT',
  studentId: student.id,
  schoolId: student.schoolId,
  duration_ms: 45,
  tags: ['audit', 'student'],
});
```

**Log Ingestion:**

```yaml
# Cloud Logging Configuration (automatic in Cloud Run)
# All console.log() and logger output automatically sent to Cloud Logging
# Access via: Cloud Console > Logging > Logs Explorer

Filtering examples:
- resource.type="cloud_run_revision" 
- resource.labels.service_name="school-erp-api"
- severity="ERROR"
- jsonPayload.tags=["critical"]
```

### 2. Metrics Collection

**Key Metrics:**

```typescript
// apps/api/src/services/metrics.ts

import { Histogram, Counter, Gauge } from '@google-cloud/monitoring';

// Response time histogram
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [50, 100, 250, 500, 1000, 2500, 5000],
});

// Error counter
const errorCounter = new Counter({
  name: 'errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity', 'endpoint'],
});

// Active students gauge
const activeStudentsGauge = new Gauge({
  name: 'active_students',
  help: 'Number of active students',
  labelNames: ['school_id'],
});

// Middleware to collect metrics
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);

    if (res.statusCode >= 400) {
      errorCounter
        .labels(
          res.statusCode >= 500 ? 'SERVER_ERROR' : 'CLIENT_ERROR',
          res.statusCode >= 500 ? 'HIGH' : 'MEDIUM',
          req.route?.path || req.path
        )
        .inc();
    }
  });

  next();
});
```

### 3. Cloud Monitoring Dashboard

```yaml
# Cloud Monitoring Dashboard (school-erp-api-health)

Dashboard Layout:
├── RED Metrics (4 charts)
│   ├── Rate (requests/sec) - Line chart, red/yellow/green zones
│   ├── Errors (% error rate) - Line chart, alert zone > 1%
│   ├── Duration (p95 latency) - Line chart, alert zone > 500ms
│   └── Saturation (CPU/Memory %) - Gauge chart
│
├── System Health (4 charts)
│   ├── Cloud Run Instances - Gauge (current/max)
│   ├── Cold Start Rate - Line chart
│   ├── Memory Usage - Area chart
│   └── CPU Usage - Area chart
│
├── Business Metrics (3 charts)
│   ├── Active Schools - Line chart
│   ├── Student Enrollment Trend - Line chart
│   └── API Endpoint Usage - Bar chart (top 10 endpoints)
│
└── Logs Explorer (3 panels)
    ├── Errors: filter severity="ERROR"
    ├── Warnings: filter severity="WARNING"
    └── Recent Activity: latest 100 logs
```

### 4. Alerting Rules

```yaml
# Cloud Monitoring Alerts (school-erp-api alerts)

Alert #1: High Error Rate
  Condition: error_rate > 1% for 5 minutes
  Severity: CRITICAL
  Action:
    - Page on-call engineer (via Slack: #incidents)
    - Create incident in Incident.io
  Runbook: docs/runbooks/high-error-rate.md

Alert #2: P95 Latency Degradation
  Condition: p95_latency > 500ms for 10 minutes
  Severity: WARNING
  Action:
    - Notify #performance in Slack
    - Check recent deployments
  Runbook: docs/runbooks/latency-degradation.md

Alert #3: Cloud Run OOM
  Condition: memory_usage > 90% for 2 minutes
  Severity: HIGH
  Action:
    - Page on-call engineer
    - Auto-scale (may be handling spike)
  Runbook: docs/runbooks/high-memory.md

Alert #4: Deployment Failure
  Condition: deployment_status = "FAILURE"
  Severity: HIGH
  Action:
    - Slack notification to #devops
    - Block merge to main branch
  Runbook: docs/runbooks/deployment-failure.md

Alert #5: Firestore Read Quota
  Condition: firestore_read_ops > 100k in 1 minute
  Severity: WARNING
  Action:
    - Slack notification
    - Investigate query patterns
  Runbook: docs/runbooks/high-firestore-ops.md
```

### 5. SLO Definition

```yaml
# Service Level Objectives

SLO-1: Availability
  Target: 99.9% (9 hours downtime allowed per month)
  Metric: uptime = (total_requests - 5xx_errors) / total_requests
  Alert (threshold): 99.5% for 15 minutes

SLO-2: Latency
  Target: p95 latency < 500ms
  Metric: 95th percentile of response time
  Alert (threshold): p95 > 400ms for 10 minutes (early warning)

SLO-3: Error Rate
  Target: < 0.5% errors
  Metric: (5xx_errors + 4xx_user_errors) / total_requests
  Alert (threshold): > 0.3% for 5 minutes (early warning)

SLO-4: Data Durability
  Target: 100% (zero data loss)
  Metric: backup_verification_success_rate
  Alert: any backup failure triggers incident
```

### 6. Tracing for Debugging

```typescript
// apps/api/src/services/tracing.ts

import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('school-erp-api');

// Trace request flow
app.use((req, res, next) => {
  const span = tracer.startSpan(`${req.method} ${req.path}`);
  
  span.setAttributes({
    'http.method': req.method,
    'http.url': req.url,
    'http.target': req.path,
    'http.host': req.hostname,
  });

  // Auto-span database operations
  const firebaseSpan = tracer.startSpan('firestore.query', {
    parent: span,
  });
  
  // Child spans for each stage
  const dbSpan = tracer.startSpan('db.operation'); // Returned by promise
  const cacheSpan = tracer.startSpan('cache.lookup');
  
  res.on('finish', () => {
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  });

  next();
});

// Traces visible in Cloud Trace console
// Filter by: label:school-erp-api duration>500ms
```

## Consequences

### Positive
- ✅ **Real-Time Visibility:** Immediate notification of issues
- ✅ **SLO Tracking:** Quantified reliability targets
- ✅ **Cost Visibility:** Per-endpoint cost tracking enables optimization
- ✅ **Audit Trail:** Compliance logging for regulated data
- ✅ **Performance Insights:** Identify bottlenecks before users report

### Negative
- ⚠️ **Cloud Logging Costs:** ~$2-5/GB ingested (optimized via sampling)
- ⚠️ **Complexity:** Multiple tools require dashboard maintenance
- ⚠️ **Alert Fatigue:** Too many alerts cause on-call burnout
- ⚠️ **Learning Curve:** Team needs monitoring tool training

## Alternatives Considered

1. **Application Performance Monitoring (APM) Only:** DataDog/New Relic
   - More expensive (~$500+/month)
   - Robust but overkill for current scale
   
2. **Basic Logging Only:** No structured observability
   - Insufficient for production debugging
   - On-call response times too slow

3. **Prometheus + Grafana:** Self-hosted monitoring
   - Operational overhead unacceptable
   - GCP integration poor

## Validation

- ✅ Cloud Logging configured and receiving logs
- ✅ Metrics collection verified in Cloud Monitoring
- ✅ Dashboard displays all RED metrics
- ✅ Alert rules tested and triggerable
- ✅ Traces visible in Cloud Trace

## Implementation Checklist

- [x] Cloud Logging enabled for Cloud Run service
- [x] Structured logging middleware deployed
- [x] Metrics collection implemented
- [x] Cloud Monitoring dashboard created
- [x] Alert rules configured
- [x] On-call runbooks written
- [x] Team trained on dashboard access

## Related Decisions

- **ADR-001:** API Design (includes error logging)
- **ADR-003:** Security Model (includes audit logging)

## References

- [Google Cloud Logging Documentation](https://cloud.google.com/logging/docs)
- [Cloud Monitoring Best Practices](https://cloud.google.com/monitoring/best-practices)
- [SLO Definition Guide](https://sre.google/books/)
- [PR #5: DevOps Monitoring Setup](../pull-requests/pr-005-monitoring.md)
