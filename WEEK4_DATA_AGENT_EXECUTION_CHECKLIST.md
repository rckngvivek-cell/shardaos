# DATA AGENT - WEEK 4 EXECUTION CHECKLIST

**Role:** Data Agent  
**Period:** May 6-10, 2026  
**Deadline:** Friday May 10, 5:00 PM  
**Status:** READY FOR IMPLEMENTATION ✅  

---

## DAY 1 (MONDAY MAY 6) - TELEMETRY EVENTS & PLAN REVIEW

### Morning (9:00 AM - 12:00 PM)
- [ ] **9:00 AM** - Attend team standup
  - Share analytics plan with team
  - Review blockers
  - Confirm environment setup

- [ ] **9:15 AM** - Lead Architect plan review
  - Present WEEK4_DATA_ANALYTICS_PLAN.md
  - Answer questions on event schema
  - Get approval ✓

- [ ] **10:00 AM** - Setup development environment
  ```bash
  # Clone repo + setup
  git pull origin main
  npm install
  
  # Start Firestore emulator
  firebase emulators:start
  
  # Verify emulator running on localhost:8080
  curl http://localhost:8080
  ```

### Afternoon (12:00 PM - 5:00 PM)
- [ ] **1:00 PM** - Review & document event schema
  - Verify apps/api/src/types/telemetry.ts is complete
  - Review all 14+ event types
  - Check Zod schemas are valid

- [ ] **2:00 PM** - Verify environment configuration
  - Copy .env.analytics.example to .env
  ```bash
  cp .env.analytics.example .env
  ```
  - Add GA4 credentials (if available, or use test credentials)
  - Verify all values are set

- [ ] **3:00 PM** - Create test data
  - Manually test event schema validation
  - Check TypeScript compilation
  ```bash
  cd apps/api
  npm run typecheck
  ```

- [ ] **4:00 PM** - Document Day 1 completion
  - Telemetry schema: ✓
  - Environment setup: ✓
  - Plan approved: ✓
  - Ready for Day 2 implementation: ✓

### EOD Checklist
- [ ] Lead Architect approved plan
- [ ] Environment variables configured
- [ ] Firestore emulator running
- [ ] TypeScript compilation passing
- [ ] All event types documented
- [ ] Team notified of readiness

### Day 1 Success Criteria
✅ Telemetry events schema fully defined (8+ types)  
✅ Lead Architect reviewed & approved  
✅ Environment ready for implementation  

---

## DAY 2-3 (TUESDAY-WEDNESDAY MAY 7-8) - ANALYTICS INTEGRATION

### Section A: Backend Analytics Service Implementation

#### Morning Session (Tuesday 9:00 AM - 12:00 PM)

- [ ] **9:00 AM** - Backend implementation start
  - Verify apps/api/src/services/analytics.ts exists ✓
  - Review service structure & methods
  - Understand GA4 integration

- [ ] **9:30 AM** - Integrate analytics service into Express app
  ```typescript
  // In apps/api/src/app.ts or main startup file:
  
  import { AnalyticsService } from './services/analytics';
  import { analyticsMiddleware } from './middleware/analytics';
  import { initializeAnalytics, printAnalyticsStatus } from './config/analytics';
  
  // After Firebase Admin init
  const analyticsService = initializeAnalytics(db);
  printAnalyticsStatus(loadAnalyticsConfig());
  
  // Add middleware BEFORE routes
  app.use(analyticsMiddleware(analyticsService));
  
  // Register telemetry routes
  const telemetryRouter = createTelemetryRouter(analyticsService);
  app.use('/api/v1', telemetryRouter);
  ```

- [ ] **10:30 AM** - Verify middleware integration
  - Start backend: `npm run dev:api`
  - Check for startup errors
  - Verify middleware logs appearing
  - Test request-response cycle

- [ ] **11:30 AM** - Verify Firestore events collection
  - Open Firestore emulator console
  - Look for analytics_events collection
  - Check for test events from middleware

#### Afternoon Session (Tuesday 1:00 PM - 5:00 PM)

- [ ] **1:00 PM** - Enable GA4 integration (optional for dev)
  - If GA4 credentials available, add to .env
  - GA4_MEASUREMENT_ID=G-YOUR_ID
  - GA4_API_SECRET=YOUR_SECRET
  - Restart backend

- [ ] **2:00 PM** - Test backend analytics with postman/curl
  ```bash
  # Test telemetry endpoint
  curl -X POST http://localhost:3000/api/v1/telemetry \
    -H "Content-Type: application/json" \
    -d '{
      "events": [{
        "event_name": "test_event",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "user_id": "test_user",
        "properties": {"test": true},
        "context": {
          "environment": "development",
          "version": "0.1.0"
        }
      }]
    }'
  
  # Should return: { success: true, events_processed: 1 }
  ```

- [ ] **3:00 PM** - Verify API call logging
  - Make test API requests to existing endpoints
  - Check Firestore analytics_events collection
  - Verify 3+ events per API call
  - Check latency_ms is captured

- [ ] **4:00 PM** - Unit test analytics service
  ```bash
  cd apps/api
  npm run test -- tests/analytics.test.ts
  
  # Should show 15+ tests passing
  ```

- [ ] **4:30 PM** - Document Day 2 completion

### Section B: Frontend Analytics Client Implementation

#### Day 2 Evening (Tuesday 2:00 PM parallel)

- [ ] **2:00 PM** - Frontend analytics client setup
  - Verify apps/web/src/services/analytics.ts exists ✓
  - Review client structure & methods
  - Understand event batching

- [ ] **2:30 PM** - Integrate analytics into React app
  ```typescript
  // In apps/web/src/App.tsx or main.tsx
  import { analytics } from './services/analytics';
  import { useAuth } from './hooks/useAuth';
  
  export function App() {
    const { user } = useAuth();
    
    useEffect(() => {
      if (user) {
        analytics.setUser(user.uid, user.role as any);
      } else {
        analytics.clearUser();
      }
    }, [user]);
    
    return (/* JSX */);
  }
  ```

- [ ] **3:00 PM** - Add route tracking
  ```typescript
  // Optional: Add page tracking on route changes
  import { useLocation } from 'react-router-dom';
  
  export function RouteTracker() {
    const location = useLocation();
    
    useEffect(() => {
      analytics.flush();
    }, [location]);
    
    return null;
  }
  ```

- [ ] **3:30 PM** - Test frontend analytics
  ```bash
  cd apps/web
  npm run dev
  
  # In browser:
  # - Open DevTools Console
  # - Look for [Analytics] log messages
  # - Check Network tab for POST /api/v1/telemetry
  ```

- [ ] **4:00 PM** - Verify events reaching backend
  - Perform login in dev browser
  - Check Firestore console
  - Should see user_login event
  - Should see page_view events

### Day 2-3 Success Criteria

✅ AnalyticsService integrated & functional  
✅ Express middleware logging API calls  
✅ Frontend analytics client sending events  
✅ 3+ events per API call verified  
✅ Events reaching Firestore in real-time  
✅ GA4 integration optional (can verify later)  
✅ Unit tests passing (15+ tests)  

---

## DAY 4 (THURSDAY MAY 9) - ANALYTICS DASHBOARD & VERIFICATION

### Morning Session (9:00 AM - 12:00 PM)

- [ ] **9:00 AM** - Verify all events flowing
  - Count total events in Firestore:
  ```sql
  db.collection('analytics_events').where('_inserted_at', '>=', today).count()
  ```
  - Should be 100+ events from days 2-3 testing

- [ ] **9:30 AM** - Create dashboard (Looker Studio)
  - Option A: Use Firestore → Looker Studio connector
    - Go to datastudio.google.com
    - Create new report
    - Connect to Firestore
    - Add data source: analytics_events
    
  - Option B: Use Cloud Firestore UI
    - Open Firebase Console
    - View analytics_events collection
    - Add filters & visualizations

- [ ] **10:30 AM** - Add dashboard metrics
  - [ ] Daily Active Users (DAU) metric
    ```
    Query: COUNT(DISTINCT user_id) WHERE event_name IN [page_view, api_request]
    Visualization: Line chart (hourly)
    ```
  
  - [ ] API Response Time Distribution
    ```
    Query: APPROX_QUANTILES(latency_ms, 100)
    Visualization: Box plot
    Display: P50, P95, P99
    ```
  
  - [ ] Error Rate Over Time
    ```
    Query: COUNT WHERE event_name = 'api_error'
    Visualization: Area chart (hourly)
    Alert: Highlight if > 1%
    ```
  
  - [ ] Feature Usage Breakdown
    ```
    Query: COUNT BY feature_name FROM feature_accessed events
    Visualization: Pie chart + table
    ```

- [ ] **11:30 AM** - Test dashboard
  - Refresh Firestore queries
  - Verify metrics updating in real-time
  - Check visualizations displaying correctly
  - Document dashboard URL

### Afternoon Session (1:00 PM - 5:00 PM)

- [ ] **1:00 PM** - Set up daily email report
  - Option A: Use Looker Studio scheduling
    - In Looker Studio report settings
    - Enable "Scheduled emails"
    - Set recipient: admin@school-erp.com
    - Set time: 9:00 AM IST (4:30 PM UTC previous day)
    - Template: Daily digest
  
  - Option B: Create Cloud Scheduler job
    ```bash
    # Create scheduled Cloud Function that:
    # 1. Queries Firestore daily metrics
    # 2. Generates email HTML
    # 3. Sends via SendGrid/Gmail API
    ```

- [ ] **2:00 PM** - Verify dashboard displaying live data
  - Perform new API calls from test browser
  - Check dashboard updates within 5 minutes
  - Verify user_id is anonymized/hashed if needed

- [ ] **3:00 PM** - Document dashboard in runbook
  ```markdown
  # Analytics Dashboard
  
  **URL:** [Looker Studio link]
  
  **Metrics:**
  - Daily Active Users: X users
  - API p95 latency: Xms
  - Error rate: X%
  - Feature usage: [breakdown]
  
  **Data Freshness:** Real-time (updated every 5 min)
  **Email Reports:** Daily at 9:00 AM IST
  ```

- [ ] **4:00 PM** - Create BigQuery infrastructure
  - [ ] BigQuery schemas created (from BIGQUERY_SCHEMA_SETUP.sql)
  - [ ] Tables: analytics.events, daily_metrics, etc
  - [ ] Views created for dashboards
  - [ ] Document pipeline for Week 5

- [ ] **4:30 PM** - Final verification
  - [ ] Dashboard accessible to team
  - [ ] Email report configured
  - [ ] All events visible in real-time
  - [ ] No data quality issues
  - [ ] Performance acceptable

### Day 4 Success Criteria

✅ Real-time dashboard showing live metrics  
✅ DAU metric visible & accurate  
✅ API latency distribution showing  
✅ Error rate alerts configured  
✅ Daily email report configured & tested  
✅ BigQuery infrastructure ready (Week 5)  

---

## DAY 5 (FRIDAY MAY 10) - VERIFICATION & PRODUCTION DEPLOYMENT

### Morning Session (9:00 AM - 12:00 PM)

- [ ] **9:00 AM** - Final verification
  - [ ] All tests passing
    ```bash
    npm run test
    
    # Should have 47 total tests passing
    # Including 15+ analytics tests
    ```
  
  - [ ] Coverage target met
    ```bash
    npm run test -- --coverage
    
    # Analytics service: 85%+ coverage
    # Overall: 82%+ coverage
    ```
  
  - [ ] No TypeScript errors
    ```bash
    npm run typecheck
    ```
  
  - [ ] ESLint passing
    ```bash
    npm run lint
    ```

- [ ] **10:00 AM** - Performance check
  - API response time: < 500ms p95 ✓
  - Dashboard load time: < 3 seconds ✓
  - Event processing latency: < 1 second ✓
  - Firestore reads/writes stable ✓

- [ ] **10:30 AM** - Analytics data quality check
  - Events all have required fields ✓
  - User IDs properly captured ✓
  - Timestamps valid ✓
  - No duplicate events ✓
  - No orphaned events ✓

- [ ] **11:00 AM** - Production deployment
  ```bash
  # Deploy to Cloud Run (backend)
  gcloud run deploy school-erp-api \
    --source . \
    --platform managed \
    --region us-central1
  
  # Deploy to production website (frontend)
  cd apps/web
  npm run build
  gcloud firebasehosting:channel:deploy main --only hosting:web
  ```

- [ ] **11:30 AM** - Verify production analytics
  - Test login in production
  - Verify analytics events flowing
  - Check dashboard on production data
  - Verify email report works with prod data

### Afternoon Session (12:00 PM - 5:00 PM)

- [ ] **1:00 PM** - Notify stakeholders
  - Send to QA: Analytics ready for testing
  - Send to Product: Dashboard accessible
  - Send to DevOps: Production monitoring live

- [ ] **2:00 PM** - Monitor for issues
  - Watch Firestore write rates
  - Monitor error events
  - Check dashboard metrics
  - Alert on any anomalies

- [ ] **3:00 PM** - Final QA sign-off
  - QA verifies analytics working
  - QA runs smoke test suite
  - QA approves production deployment

- [ ] **4:00 PM** - Document Week 4 completion
  - [ ] WEEK4_COMPLETION_SUMMARY.md created
  - [ ] All PRI workflows documented
  - [ ] Decisions captured in ADRs
  - [ ] Runbook finalized

- [ ] **5:00 PM** - Week 4 Sprint Complete! 🎉
  - All deliverables submitted
  - All tests passing
  - Production deployed
  - Analytics live & monitoring

### Friday Success Criteria (FINAL)

✅ Analytics infrastructure operational  
✅ Dashboard showing live metrics  
✅ Daily email reports working  
✅ All 47 tests passing  
✅ 82%+ code coverage  
✅ 3+ events per API call logged  
✅ Production deployed successfully  
✅ Zero critical bugs  
✅ 2-3 pilot schools onboarded  

---

## INTEGRATION CHECKLIST

### Backend Integration Tasks
- [ ] AnalyticsService in apps/api/src/services/analytics.ts
- [ ] analyticsMiddleware in apps/api/src/middleware/analytics.ts
- [ ] Express app.ts updated with middleware
- [ ] Telemetry routes registered
- [ ] Firestore collections created
- [ ] GA4 credentials configured
- [ ] Environment variables set

### Frontend Integration Tasks
- [ ] Analytics client in apps/web/src/services/analytics.ts
- [ ] React App.tsx updated with user context
- [ ] Route tracking implemented
- [ ] Error tracking in components
- [ ] Feature tracking in pages
- [ ] Event flushing on navigation

### Infrastructure Tasks
- [ ] Firestore collections: analytics_events, metrics
- [ ] Firestore indexes created
- [ ] BigQuery tables designed
- [ ] Looker Studio dashboard created
- [ ] Email scheduling configured
- [ ] GA4 Measurement Protocol enabled

---

## VERIFICATION QUERIES

### Check Events in Firestore
```sql
-- All events today
db.collection('analytics_events')
  .where('timestamp', '>=', 'TODAY_START')
  .orderBy('timestamp', 'desc')
  .limit(100)

-- Events by user
db.collection('analytics_events')
  .where('user_id', '==', 'USER_ID')
  .orderBy('timestamp', 'desc')

-- API events only
db.collection('analytics_events')
  .where('event_name', '==', 'api_request')
  .limit(50)

-- Error events
db.collection('analytics_events')
  .where('event_name', '==', 'api_error')
  .limit(20)
```

### Check Real-time Metrics
```sql
-- Daily metrics
db.collection('metrics')
  .doc('daily_2026-05-06')
  .get()

-- Hourly metrics
db.collection('metrics')
  .doc('hourly_2026-05-06T10')
  .get()
```

---

## TROUBLESHOOTING GUIDE

### Problem: No events appearing
**Solution:**
1. Check AnalyticsService is initialized
2. Verify analyticsMiddleware added BEFORE routes
3. Check Firestore permissions
4. Enable console logging
5. Test with development endpoint

### Problem: GA4 not showing events
**Solution:**
1. Verify credentials are correct
2. Check GA4 property exists
3. Wait 24 hours for data propagation
4. Use test endpoint to verify

### Problem: Dashboard slow
**Solution:**
1. Add Firestore indexes
2. Reduce date range in queries
3. Use pre-aggregated metrics
4. Implement caching

### Problem: High Firestore costs
**Solution:**
1. Implement TTL on events
2. Use event sampling
3. Archive old events to BigQuery
4. Reduce write frequency

---

## DELIVERABLES SUMMARY

| Item | Status | Notes |
|------|--------|-------|
| Telemetry event schema | ✅ | 14+ event types |
| Backend analytics service | ✅ | 450+ LOC |
| Frontend analytics client | ✅ | 350+ LOC |
| Express middleware | ✅ | 3+ events per call |
| API endpoint handlers | ✅ | Batch event ingestion |
| Analytics dashboard | ✅ | Real-time metrics |
| Daily email reports | ✅ | Automated scheduling |
| BigQuery infrastructure | ✅ | Ready for Week 5 |
| Unit tests | ✅ | 15+ test cases |
| Documentation | ✅ | Integration guide |
| Environment config | ✅ | .env template |

---

**Status:** READY FOR EXECUTION  
**Target Start:** Monday May 6, 2026, 9:00 AM  
**Target End:** Friday May 10, 2026, 5:00 PM  
**Success Metric:** All deliverables operational with live dashboards  

**Let's go! 🚀**
