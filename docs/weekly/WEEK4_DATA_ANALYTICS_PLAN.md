# WEEK 4 DATA AGENT - ANALYTICS INFRASTRUCTURE PLAN

**Owner:** Data Agent  
**Duration:** May 6-10, 2026  
**Status:** PLANNING PHASE ✅  
**Priority:** P0 - Enable real-time observability  

---

## 1️⃣ DAY 1 (MON MAY 6) - TELEMETRY EVENTS DEFINITION

### Objective
Define comprehensive event schema for all key user interactions and system metrics.

### Events to Capture

#### A. User Authentication Events
```
Event Name: user_login
Fields:
  - timestamp: ISO8601 (server-side accurate)
  - user_id: string (Firebase UID)
  - email: string
  - role: enum [admin, teacher, student, parent]
  - success: boolean
  - failure_reason: string | null (if success=false)
  - ip_address: string
  - user_agent: string
  - device_type: enum [mobile, tablet, desktop]
  - location: string | null (if available)

Trigger: Post login attempt
Location: Backend auth service + Frontend auth handler
```

```
Event Name: user_logout
Fields:
  - timestamp: ISO8601
  - user_id: string
  - session_duration_ms: number
  - role: enum [admin, teacher, student, parent]

Trigger: Logout action
Location: Frontend auth handler
```

#### B. API Endpoint Performance Events
```
Event Name: api_request
Fields:
  - timestamp: ISO8601
  - request_id: string (UUID)
  - endpoint: string (e.g., "/api/v1/students")
  - method: enum [GET, POST, PUT, DELETE, PATCH]
  - user_id: string
  - user_role: enum [admin, teacher, student, parent]
  - status_code: number
  - latency_ms: number
  - response_size_bytes: number
  - db_query_time_ms: number
  - cache_hit: boolean | null

Trigger: API request completion
Location: Backend middleware + Express response
Target: 3+ events per API call (request initiated, response prepared, request completed)
```

```
Event Name: api_error
Fields:
  - timestamp: ISO8601
  - request_id: string
  - endpoint: string
  - method: enum [GET, POST, PUT, DELETE]
  - user_id: string | null
  - error_type: enum [validation_error, auth_error, not_found, server_error, timeout]
  - error_message: string
  - error_code: string
  - status_code: number
  - severity: enum [low, medium, high, critical]
  - stacktrace: string | null

Trigger: Request fails or throws error
Location: Backend error middleware
```

#### C. Feature Usage Events
```
Event Name: feature_accessed
Fields:
  - timestamp: ISO8601
  - user_id: string
  - role: enum [admin, teacher, student, parent]
  - feature_name: string (e.g., "student_enrollment", "attendance_marking", "grade_entry")
  - action: enum [view, create, update, delete, export]
  - item_count: number | null (records created/updated)
  - duration_ms: number
  - success: boolean

Trigger: User interacts with major feature
Location: Frontend page component + Backend service handler
```

```
Event Name: page_view
Fields:
  - timestamp: ISO8601
  - user_id: string
  - page_path: string (e.g., "/dashboard", "/students", "/attendance")
  - page_title: string
  - referrer: string | null
  - device_type: enum [mobile, tablet, desktop]
  - session_id: string
  - time_on_page_ms: number | null

Trigger: User navigates to page
Location: Frontend React router + layout component
```

#### D. System Health Events
```
Event Name: system_health
Fields:
  - timestamp: ISO8601
  - metric_type: enum [uptime, error_rate, latency_p95, latency_p99, db_connection_time]
  - value: number
  - threshold: number
  - status: enum [healthy, warning, critical]
  - region: string (GCP region)
  - service: string (e.g., "api", "web", "firestore")

Trigger: Every 60 seconds (server-side)
Location: Backend monitoring service
```

#### E. Business Events
```
Event Name: school_created
Fields:
  - timestamp: ISO8601
  - school_id: string
  - user_id: string (creator)
  - school_name: string
  - student_count: number
  - staff_count: number

Trigger: New school registration
Location: Backend school service
```

```
Event Name: student_enrolled
Fields:
  - timestamp: ISO8601
  - school_id: string
  - student_id: string
  - grade: string
  - section: string
  - user_id: string (enrolled by)

Trigger: Student enrollment
Location: Backend student service
```

```
Event Name: attendance_marked
Fields:
  - timestamp: ISO8601
  - school_id: string
  - class_id: string
  - user_id: string (marked by)
  - present_count: number
  - absent_count: number
  - date: string (YYYY-MM-DD)

Trigger: Attendance submission
Location: Backend attendance service
```

### Event Schema Structure (TypeScript)

```typescript
// apps/api/src/types/telemetry.ts
export interface TelemetryEvent {
  event_name: string;
  timestamp: string; // ISO8601
  request_id?: string;
  user_id?: string;
  user_role?: 'admin' | 'teacher' | 'student' | 'parent';
  properties: Record<string, any>;
  context: {
    user_agent: string;
    ip_address: string;
    device_type: 'mobile' | 'tablet' | 'desktop';
  };
}

// apps/web/src/types/telemetry.ts
export interface ClientTelemetryEvent {
  event_name: string;
  timestamp: string;
  user_id?: string;
  session_id?: string;
  properties: Record<string, any>;
  context: {
    page_path: string;
    device_type: 'mobile' | 'tablet' | 'desktop';
  };
}
```

### Success Criteria
- [ ] Event schema documented in TypeScript
- [ ] All 8+ event types defined with fields
- [ ] 3+ events per API call requirement specified
- [ ] Error events capture severity levels
- [ ] Ready for Lead Architect review

---

## 2️⃣ DAY 2-3 (TUE-WED MAY 7-8) - ANALYTICS CLIENT INTEGRATION

### Implementation Tasks

#### Task 1: Choose Analytics Platform
**Decision:** Google Analytics 4 (GA4) + Firestore event logging
- **Why GA4:** 
  - Free tier: 10M events/month
  - Real-time dashboards
  - Built-in dashboards for DAU, session duration, events
  - Easy integration with both web & backend
- **Fallback:** Mixpanel (more advanced cohort analysis, but requires paid tier)

#### Task 2: Server-Side Analytics Service

**File:** `apps/api/src/services/analytics.ts`

```typescript
import { Firestore } from 'firebase-admin';

export interface AnalyticsEvent {
  event_name: string;
  timestamp: string;
  user_id?: string;
  properties: Record<string, any>;
  context: {
    environment: string;
    version: string;
  };
}

export class AnalyticsService {
  private readonly db: Firestore;
  private readonly collectionName = 'analytics_events';

  constructor(firestore: Firestore) {
    this.db = firestore;
  }

  /**
   * Log event to Firestore for historical analysis
   * Also sends to Google Analytics via HTTP
   */
  async logEvent(event: AnalyticsEvent): Promise<void> {
    try {
      // 1. Store in Firestore for BigQuery sync
      await this.db.collection(this.collectionName).add({
        ...event,
        _stored_at: new Date().toISOString(),
      });

      // 2. Send to Google Analytics (GA4 Measurement Protocol)
      await this.sendToGA4(event);

      // 3. Update real-time counters in Firestore
      await this.updateRealTimeMetrics(event);
    } catch (error) {
      console.error('Analytics logging error:', error);
      // Don't throw - analytics failures should not break API
    }
  }

  private async sendToGA4(event: AnalyticsEvent): Promise<void> {
    const gaUrl = 'https://www.google-analytics.com/mp/collect';
    const payload = {
      measurement_id: process.env.GA4_MEASUREMENT_ID,
      api_secret: process.env.GA4_API_SECRET,
      events: [
        {
          name: event.event_name,
          params: {
            ...event.properties,
            user_id: event.user_id,
            timestamp: event.timestamp,
          },
        },
      ],
    };

    await fetch(gaUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  private async updateRealTimeMetrics(event: AnalyticsEvent): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const metricsRef = this.db.collection('metrics').doc('daily_' + today);

    await metricsRef.set(
      {
        total_events: Firestore.FieldValue.increment(1),
        [event.event_name]: Firestore.FieldValue.increment(1),
        last_updated: new Date().toISOString(),
      },
      { merge: true }
    );
  }

  /**
   * Log API endpoint call with latency
   */
  async logApiCall(
    endpoint: string,
    method: string,
    statusCode: number,
    latencyMs: number,
    userId?: string,
    userRole?: string
  ): Promise<void> {
    await this.logEvent({
      event_name: 'api_request',
      timestamp: new Date().toISOString(),
      user_id: userId,
      properties: {
        endpoint,
        method,
        status_code: statusCode,
        latency_ms: latencyMs,
        user_role: userRole,
      },
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });
  }

  /**
   * Log error event
   */
  async logError(
    errorType: string,
    message: string,
    endpoint?: string,
    userId?: string
  ): Promise<void> {
    await this.logEvent({
      event_name: 'api_error',
      timestamp: new Date().toISOString(),
      user_id: userId,
      properties: {
        error_type: errorType,
        error_message: message,
        endpoint,
        severity: this.getSeverity(errorType),
      },
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });
  }

  private getSeverity(
    errorType: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
      validation_error: 'low',
      not_found: 'low',
      auth_error: 'medium',
      timeout: 'high',
      server_error: 'high',
      database_error: 'critical',
    };
    return severityMap[errorType] || 'medium';
  }
}
```

#### Task 3: Client-Side Analytics Service

**File:** `apps/web/src/services/analytics.ts`

```typescript
/**
 * Client-side analytics tracking
 * Sends events to backend /api/v1/telemetry endpoint
 */

export interface ClientEvent {
  event_name: string;
  properties: Record<string, any>;
}

class AnalyticsClient {
  private apiEndpoint = '/api/v1/telemetry';
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // Track page views
    this.trackPageView();

    // Track unload (session end)
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd();
    });

    // Track route changes
    window.addEventListener('popstate', () => {
      this.trackPageView();
    });
  }

  /**
   * Set user context (after auth)
   */
  setUser(userId: string, role: string): void {
    this.userId = userId;
    // Also track login event
    this.trackEvent('user_login', {
      role,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track page view
   */
  private trackPageView(): void {
    this.trackEvent('page_view', {
      page_path: window.location.pathname,
      page_title: document.title,
      device_type: this.getDeviceType(),
    });
  }

  /**
   * Track feature access
   */
  trackFeatureAccess(
    featureName: string,
    action: string,
    properties?: Record<string, any>
  ): void {
    this.trackEvent('feature_accessed', {
      feature_name: featureName,
      action,
      ...properties,
      device_type: this.getDeviceType(),
    });
  }

  /**
   * Track custom event
   */
  trackEvent(eventName: string, properties?: Record<string, any>): void {
    const event = {
      event_name: eventName,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString(),
      properties: properties || {},
      context: {
        page_path: window.location.pathname,
        device_type: this.getDeviceType(),
      },
    };

    // Send to backend
    navigator.sendBeacon(this.apiEndpoint, JSON.stringify(event));

    // Also send via fetch for real-time
    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    }).catch(console.error);
  }

  /**
   * Track session end
   */
  private trackSessionEnd(): void {
    this.trackEvent('user_logout', {
      session_duration_ms: Date.now() - parseInt(this.sessionId.split('-')[0]),
    });
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
}

export const analytics = new AnalyticsClient();
```

#### Task 4: Express Middleware Integration

**File:** `apps/api/src/middleware/analytics.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics';

export function analyticsMiddleware(analyticsService: AnalyticsService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const requestId = req.get('x-request-id') || generateRequestId();

    // Attach to request for later use
    req.requestId = requestId;

    // Log request initiated (event 1/3)
    await analyticsService.logEvent({
      event_name: 'api_request_started',
      timestamp: new Date().toISOString(),
      user_id: req.user?.uid,
      properties: {
        endpoint: req.path,
        method: req.method,
        request_id: requestId,
      },
      context: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '0.1.0',
      },
    });

    // Intercept response
    const originalSend = res.send;
    res.send = function (data) {
      const latency = Date.now() - startTime;

      // Log response prepared (event 2/3)
      analyticsService.logApiCall(
        req.path,
        req.method,
        res.statusCode,
        latency,
        req.user?.uid,
        req.user?.role
      ).catch(console.error);

      // Log request completed (event 3/3)
      analyticsService.logEvent({
        event_name: 'api_request_completed',
        timestamp: new Date().toISOString(),
        user_id: req.user?.uid,
        properties: {
          endpoint: req.path,
          method: req.method,
          status_code: res.statusCode,
          latency_ms: latency,
          request_id: requestId,
          response_size_bytes: JSON.stringify(data).length,
        },
        context: {
          environment: process.env.NODE_ENV || 'development',
          version: process.env.APP_VERSION || '0.1.0',
        },
      }).catch(console.error);

      return originalSend.call(this, data);
    };

    next();
  };
}

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
```

#### Task 5: Firestore Collection Setup

**File:** `apps/api/src/firestore-indexes.json` (addition)

```json
{
  "indexes": [
    {
      "collectionGroup": "analytics_events",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "timestamp", "order": "DESCENDING"},
        {"fieldPath": "event_name", "order": "ASCENDING"}
      ]
    },
    {
      "collectionGroup": "analytics_events",
      "queryScope": "Collection",
      "fields": [
        {"fieldPath": "user_id", "order": "ASCENDING"},
        {"fieldPath": "timestamp", "order": "DESCENDING"}
      ]
    }
  ]
}
```

#### Task 6: Environment Configuration

**File:** `.env.example` (additions)

```
# Analytics Configuration
GA4_MEASUREMENT_ID=G-xxxxxxxxxx
GA4_API_SECRET=xxxxxxxxxxxxxxxxxxxx
ANALYTICS_ENABLED=true
```

### Integration Points

1. **Telemetry API Endpoint**
   - `POST /api/v1/telemetry`
   - Accepts client-side events
   - Stored in `analytics_events` collection

2. **Middleware Integration**
   - Express middleware logs all API calls
   - Captures req/response timing
   - Extracts user/role info

3. **Backend Event Logging**
   - Student service → log `student_enrolled`
   - Attendance service → log `attendance_marked`
   - School service → log `school_created`

### Success Criteria
- [ ] AnalyticsService integrated
- [ ] Client analytics.ts created
- [ ] Analytics middleware active
- [ ] 3+ events logged per API call
- [ ] Events flowing to Firestore
- [ ] GA4 credentials configured

---

## 3️⃣ DAY 4 (THU MAY 9) - ANALYTICS DASHBOARD

### Dashboard Requirements

#### Real-Time Dashboard (Metrics)
Location: Firestore dashboard view (OR embed in admin panel)

**Metric #1: Daily Active Users (DAU)**
```
Query: analytics_events 
  WHERE timestamp > TODAY - 1 DAY
  AND event_name IN ['page_view', 'api_request']
Group By: user_id
Display: Line chart (hourly)
Current: X users
Change vs yesterday: +Y% / -Y%
```

**Metric #2: API Response Time Distribution**
```
Query: analytics_events 
  WHERE event_name = 'api_request'
  AND timestamp > NOW - 24 HOURS
Extract: latency_ms from properties
Display: P50, P95, P99 percentiles
Format: Box plot chart
Target: P95 < 500ms
```

**Metric #3: Error Rate Over Time**
```
Query: analytics_events 
  WHERE event_name = 'api_error'
  AND timestamp > NOW - 24 HOURS
Group By: error_type
Display: Stacked bar chart (hourly)
Alert: If error_rate > 1%
```

**Metric #4: Feature Usage Breakdown**
```
Query: analytics_events 
  WHERE event_name = 'feature_accessed'
  AND timestamp > NOW - 7 DAYS
Group By: feature_name, action
Display: Pie chart + table
Show: % of users per feature
```

#### Daily Email Report

**Email Schedule:** 9:00 AM IST (4:30 PM UTC)  
**Recipients:** admin@school-erp.com  
**Content:**

```
Subject: Daily Analytics Report - [Date]

📊 DAILY SUMMARY

💻 Users Online Now: X
📈 Daily Active Users: Y
⏱️ Avg Response Time: Zms

📉 Key Metrics
├─ API Success Rate: 99.8% ↑
├─ Error Rate: 0.2% ↓
├─ Avg Session Duration: 8m 45s
└─ Mobile vs Desktop: 60% / 40%

🔥 Top Features
1. Student Enrollment (450 uses)
2. Attendance Marking (380 uses)
3. Grade Entry (290 uses)

⚠️ Alerts
- P95 Latency: 320ms (healthy)
- Database Errors: 0 (healthy)
- Auth Failures: 2 (investigate)

[View Full Dashboard](https://dashboard.school-erp.com)
```

#### Dashboard Implementation (Cloud Firestore + Looker Studio)

**Option 1: Cloud Firestore UI**
- Use Firestore's built-in charts
- Query: `db.collection('metrics').orderBy('timestamp', 'desc').limit(100)`
- Display in Firebase Console

**Option 2: Looker Studio (Recommended)**
- Connect Firestore → Looker Studio
- Create custom reports
- Set up email scheduling
- Easy sharing with stakeholders

**Option 3: Custom React Dashboard** (Future)
- React component queries Firestore in real-time
- Recharts for visualization
- Deploy to Cloud Run

### Setup Steps

**Day 4 Morning:** Create Looker Studio Dashboard
1. Create Google Cloud project with Firestore
2. Connect Firestore to Looker Studio
3. Add dashboard widgets for metrics
4. Configure email delivery

**Day 4 Noon:** Verify Events Flowing
1. Run backend + frontend in dev mode
2. Perform test login + API calls
3. Check Firestore for events
4. Verify on dashboard within 5 minutes

**Day 4 EOD:** Deploy Dashboard
1. Share Looker Studio link with team
2. Test daily email delivery
3. Document dashboard URL in runbook

### Success Criteria
- [ ] Dashboard shows live DAU count
- [ ] API response time distribution visible
- [ ] Error rate alerts working
- [ ] Daily email configured + sent
- [ ] All events flowing correctly

---

## 4️⃣ INFRASTRUCTURE - BIGQUERY PREPARATION

### BigQuery Table Schemas

**Table 1: `analytics.events` (Fact Table)**
```sql
CREATE TABLE IF NOT EXISTS `analytics.events` (
  event_id STRING NOT NULL,
  event_name STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  user_id STRING,
  user_role STRING,
  properties JSON,
  context JSON,
  _inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_name, user_id;
```

**Table 2: `analytics.daily_metrics` (Aggregated)**
```sql
CREATE TABLE IF NOT EXISTS `analytics.daily_metrics` (
  date DATE NOT NULL,
  metric_name STRING NOT NULL,
  metric_value FLOAT64,
  user_count INT64,
  event_count INT64
)
PARTITION BY date;
```

**Table 3: `analytics.user_sessions` (Session Data)**
```sql
CREATE TABLE IF NOT EXISTS `analytics.user_sessions` (
  session_id STRING NOT NULL,
  user_id STRING NOT NULL,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  duration_seconds INT64,
  page_views INT64,
  api_calls INT64,
  errors INT64,
  device_type STRING,
  location STRING
)
PARTITION BY DATE(session_start)
CLUSTER BY user_id;
```

### Data Pipeline (Future - Week 5+)

**Flow:**
```
Firestore (real-time) 
  → Cloud Dataflow (ETL)
  → BigQuery (warehouse)
  → Looker (BI)
```

**Frequency:** 
- Daily batch: 2:00 AM UTC
- Real-time: 15-minute micro-batches

### Current State (Week 4)
- [x] Firestore: Events stored
- [x] Looker Studio: Dashboards configured
- [ ] BigQuery: Tables designed (ready for automated sync)
- [ ] Data Pipeline: Documented for Week 5 implementation

---

## VERIFICATION CHECKLIST

### Day 1 (Mon)
- [ ] Telemetry event schema defined
- [ ] 8+ event types documented
- [ ] TypeScript interfaces created
- [ ] Lead Architect reviewed + approved

### Day 2-3 (Tue-Wed)
- [ ] AnalyticsService implemented
- [ ] Client analytics.ts created
- [ ] Express middleware integrated
- [ ] Firestore collection + indexes created
- [ ] GA4 credentials configured
- [ ] 3+ events per API call verified
- [ ] Events flowing to Firestore ✓

### Day 4 (Thu)
- [ ] Looker Studio dashboard created
- [ ] DAU metric displaying
- [ ] API latency distribution visible
- [ ] Error rate alerts configured
- [ ] Daily email scheduled + tested
- [ ] All events verified on dashboard

### Friday (Verification)
- [ ] All analytics flowing for 5 PRs
- [ ] Dashboard accessible for QA/Product teams
- [ ] Daily report delivered successfully
- [ ] BigQuery schemas ready for Week 5

---

## RISKS & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|-----------|
| GA4 quota exceeded | Data loss | Implement sampling strategy |
| Firestore costs spike | Budget overrun | Use TTL policies, archive old events |
| Analytics impact API latency | Performance degradation | Async logging, circuit breaker pattern |
| Event schema mismatch | Data inconsistency | Zod validation before storage |
| Dashboard slow queries | Poor UX | Implement pre-aggregated metrics |

---

## DELIVERABLES SUMMARY

| Day | Deliverable | Status | Owner |
|-----|------------|--------|-------|
| Mon | Telemetry events schema | TODO | Data Agent |
| Tue-Wed | Analytics client + middleware | TODO | Data Agent |
| Thu | Real-time dashboard + email | TODO | Data Agent |
| Mon-Fri | BigQuery preparation | TODO | Data Agent |

---

**Plan Status:** READY FOR REVIEW  
**Created:** April 9, 2026  
**Target Completion:** May 10, 2026
