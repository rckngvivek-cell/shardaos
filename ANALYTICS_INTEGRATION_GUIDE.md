/**
 * Analytics Integration Guide
 * Step-by-step instructions for integrating analytics into the application
 */

// ============================================================================
// BACKEND INTEGRATION - Express App
// ============================================================================

/*
File: apps/api/src/app.ts (or main Express app setup)

1. Import analytics dependencies:
*/

import { AnalyticsService } from './services/analytics';
import { analyticsMiddleware } from './middleware/analytics';
import { createTelemetryRouter } from './routes/telemetry';
import {
  initializeAnalytics,
  printAnalyticsStatus,
} from './config/analytics';
import { getFirestore } from 'firebase-admin/firestore';

/*
2. After Firebase Admin initialization, set up analytics:
*/

// Initialize Firebase Admin (already done in your startup)
// const db = getFirestore();

// Initialize Analytics Service
const analyticsService = initializeAnalytics(db);
printAnalyticsStatus(loadAnalyticsConfig());

/*
3. Add analytics middleware to Express app EARLY (before routes):
*/

const app = express();

// ... other middleware ...

// Analytics middleware - insert here (before route handlers)
app.use(analyticsMiddleware(analyticsService));

/*
4. Register telemetry routes:
*/

// Create telemetry router
const telemetryRouter = createTelemetryRouter(analyticsService);

// Mount at /api/v1
app.use('/api/v1', telemetryRouter);

/*
5. Make analytics service available to routes (optional but recommended):
*/

// Attach to app for route access
app.locals.analyticsService = analyticsService;

/*
6. In route handlers, you can log business events:
*/

// Example: In student enrollment route
router.post('/students', async (req, res) => {
  const analyticsService = req.app.locals.analyticsService;
  
  // ... handle student creation ...
  
  // Log business event
  await analyticsService.logBusinessEvent(
    'student_enrolled',
    req.user.uid,
    {
      school_id: req.body.school_id,
      student_id: newStudent.id,
      grade: req.body.grade,
      section: req.body.section,
    }
  );
  
  res.json(newStudent);
});

// ============================================================================
// FRONTEND INTEGRATION - React App
// ============================================================================

/*
File: apps/web/src/main.tsx or apps/web/src/App.tsx

1. Import analytics client:
*/

import { analytics } from './services/analytics';

/*
2. Initialize analytics in App component:
*/

import React, { useEffect } from 'react';
import { analytics } from './services/analytics';
import { useAuth } from './hooks/useAuth';

export function App() {
  const { user } = useAuth();

  useEffect(() => {
    // Set user context after login
    if (user) {
      analytics.setUser(user.uid, user.role);
    } else {
      analytics.clearUser();
    }
  }, [user]);

  return (
    // Your app JSX
  );
}

/*
3. Track feature access in components:
*/

import { analytics } from './services/analytics';

export function StudentEnrollmentPage() {
  useEffect(() => {
    // Track page view automatically happens in analytics constructor
    // But you can explicitly track feature access:
    analytics.trackFeatureAccess(
      'student_enrollment',
      'view'
    );
  }, []);

  const handleEnrollStudent = async (student: any) => {
    try {
      const startTime = Date.now();
      const response = await fetch('/api/v1/students', {
        method: 'POST',
        body: JSON.stringify(student),
      });
      const latency = Date.now() - startTime;

      analytics.trackApiCall(
        '/api/v1/students',
        'POST',
        response.status,
        latency,
        response.ok
      );

      if (response.ok) {
        analytics.trackFeatureAccess(
          'student_enrollment',
          'create',
          { item_count: 1 }
        );
      }
    } catch (error) {
      analytics.trackError(
        'enrollment_error',
        'Failed to enroll student',
        { error: String(error) }
      );
    }
  };

  return (
    // Component JSX
  );
}

/*
4. Track errors:
*/

try {
  // Some operation
} catch (error) {
  analytics.trackError(
    'operation_error',
    error instanceof Error ? error.message : 'Unknown error',
    { component: 'StudentForm' }
  );
}

/*
5. Manual flush for route changes (if not using automatic tracking):
*/

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics } from './services/analytics';

export function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Flush pending events before route change
    analytics.flush();
  }, [location]);

  return null; // Invisible component
}

// Add to App:
<AnalyticsTracker />

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

/*
File: .env.example (add these lines)
*/

# Google Analytics 4 Configuration
GA4_ENABLED=true
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Analytics Configuration
ANALYTICS_ENABLED=true
ANALYTICS_EVENTS_COLLECTION=analytics_events
ANALYTICS_METRICS_COLLECTION=metrics
ANALYTICS_BATCH_SIZE=100
ANALYTICS_FLUSH_INTERVAL_MS=5000

# Application Version (for tracking)
APP_VERSION=0.1.0

/*
To get Google Analytics 4 credentials:

1. Go to Google Analytics: https://analytics.google.com/
2. Create new property or use existing
3. Get Measurement ID (starts with G-)
4. Admin → Data Streams → Web → Get stream
5. In Admin, go to "Measurement Protocol API secrets"
6. Create new secret → copy API Secret
*/

// ============================================================================
// FIRESTORE SETUP
// ============================================================================

/*
Firestore needs these collections and indexes:

1. Collection: analytics_events
   - Stores all incoming events
   - Indexed by: timestamp DESC, event_name ASC
   - Indexed by: user_id ASC, timestamp DESC

2. Collection: metrics
   - Real-time aggregates (daily and hourly)
   - Documents: daily_YYYY-MM-DD, hourly_YYYY-MM-DDTHH
   - Contains counters for each event type

3. Collection: telemetry (optional, for organizing)
   - Subcollection approach if events collection gets too large
*/

// ============================================================================
// DEPLOYMENT CHECKLIST
// ============================================================================

/*
Before deploying Week 4:

Backend (Express app):
  [ ] AnalyticsService created and imported
  [ ] analyticsMiddleware added to Express
  [ ] telemetry routes registered at /api/v1
  [ ] GA4 credentials configured in environment
  [ ] Firestore collections created (analytics_events, metrics)
  [ ] Test event logging works (POST /api/v1/telemetry/test in dev)

Frontend (React app):
  [ ] analytics client imported in main.tsx
  [ ] user context set in auth hook
  [ ] feature tracking added to pages/components
  [ ] error tracking in try/catch blocks
  [ ] route tracking implemented
  [ ] events flushing on unload

Testing:
  [ ] Run backend in dev mode
  [ ] Run frontend in dev mode
  [ ] Perform login action → verify user_login event in Firestore
  [ ] Call an API → verify 3 events (request_started, request, request_completed)
  [ ] Navigate pages → verify page_view events
  [ ] Check Firestore console → events appearing in real-time
  [ ] Check Google Analytics dashboard → events showing up

*/

// ============================================================================
// VERIFICATION QUERIES
// ============================================================================

/*
Use these Firestore queries to verify analytics is working:

1. Check all events logged today:
   db.collection('analytics_events')
     .where('timestamp', '>=', '2026-05-06T00:00:00Z')
     .orderBy('timestamp', 'desc')
     .limit(100)

2. Check events for specific user:
   db.collection('analytics_events')
     .where('user_id', '==', 'user_123')
     .orderBy('timestamp', 'desc')
     .limit(50)

3. Check api_request events only:
   db.collection('analytics_events')
     .where('event_name', '==', 'api_request')
     .orderBy('timestamp', 'desc')
     .limit(50)

4. Check error events:
   db.collection('analytics_events')
     .where('event_name', '==', 'api_error')
     .orderBy('timestamp', 'desc')
     .limit(20)

5. Check daily metrics:
   db.collection('metrics')
     .where((doc) => doc.id.startsWith('daily_'))
     .orderBy('date', 'desc')
     .limit(7)

*/

// ============================================================================
// TROUBLESHOOTING
// ============================================================================

/*
Problem: Events not appearing in Firestore

Debug steps:
1. Check analytics middleware is added BEFORE routes
2. Verify GA4 credentials are not the issue (GA4 send failures shouldn't stop Firestore logging)
3. Check browser console for fetch errors
4. Verify Firestore permissions allow writes to analytics_events collection
5. In development, check Express console for [Analytics] log messages

Solution:
  - Add console.log in AnalyticsService.logEvent() to see if it's being called
  - Check Firestore security rules aren't blocking writes
  - Verify Firestore database exists and is accessible

---

Problem: Google Analytics not receiving events

Debug steps:
1. Check GA4_ENABLED=true in environment
2. Verify GA4_MEASUREMENT_ID and GA4_API_SECRET are correct
3. Check GA4 API returns 204 (should be silent on success)
4. In dev, GA4 sends might be slow (5-10 minutes)

Solution:
  - Verify credentials in Google Analytics Admin panel
  - Test with curl:
    curl -X POST https://www.google-analytics.com/mp/collect \
      -H 'Content-Type: application/json' \
      -d '{
        "measurement_id": "G-xxx",
        "api_secret": "xxx",
        "events": [{
          "name": "test_event",
          "params": {"timestamp_micros": "'$(date +%s)'000000"}
        }]
      }'

---

Problem: Dashboard showing old data

Solution:
  - Clear Firestore metrics documents: db.collection('metrics').deleteWhere(...)
  - Restart backend to reinitialize
  - Check that real-time aggregation is working (look for daily_YYYY-MM-DD docs)

---

Problem: High Firestore costs

Solution:
  - Implement TTL on analytics_events (delete events > 90 days old)
  - Use document sampling (log every Nth event in certain conditions)
  - Archive old events to BigQuery (Week 5 task)
  - Reduce batch size or flush interval

*/
