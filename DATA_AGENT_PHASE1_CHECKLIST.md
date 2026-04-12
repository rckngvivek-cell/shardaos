📋 DATA AGENT PHASE 1 - MANUAL SETUP CHECKLIST
================================================

Status: Ready for Monday 10:30 AM Go-Live
Timeline: 60 minutes (6:00-7:00 PM)

---

## STEP 1: PREREQUISITES CHECK (5 minutes)

Before starting, verify these are installed and configured:

- [ ] Google Cloud CLI (gcloud)
  `gcloud --version`

- [ ] BigQuery CLI (bq)
  `bq version`

- [ ] Authenticated to GCP
  `gcloud auth login`

- [ ] Project set correctly
  `gcloud config get-value project`
  Expected output: Your GCP project ID

- [ ] BigQuery API enabled
  `gcloud services list --enabled | grep bigquery`

- [ ] Node.js 18+
  `node --version`

---

## STEP 2: CREATE BIGQUERY DATASET (8 minutes)

### Command to run:
```bash
bq mk --dataset --location=US school_erp_analytics
```

Or using gcloud:
```bash
gcloud bigquery datasets create \
  --location=US \
  --description="School ERP Analytics data warehouse" \
  school_erp_analytics
```

### Verify:
```bash
bq ls -d school_erp_analytics
```

Expected output:
```
   datasetId         
 ---------------------
  school_erp_analytics
```

✅ Checklist:
- [ ] Dataset created
- [ ] Dataset verified

---

## STEP 3: CREATE TABLES (12 minutes)

Run these commands exactly:

### Table 1: events
```bash
bq mk --table school_erp_analytics.events \
  timestamp:TIMESTAMP,event_type:STRING,school_id:STRING,user_id:STRING,data:JSON
```

### Table 2: metrics_daily
```bash
bq mk --table school_erp_analytics.metrics_daily \
  date:DATE,school_id:STRING,active_users:INTEGER,reports_generated:INTEGER,errors_count:INTEGER,api_calls:INTEGER
```

### Table 3: nps_responses
```bash
bq mk --table school_erp_analytics.nps_responses \
  timestamp:TIMESTAMP,school_id:STRING,response_value:INTEGER,feedback_text:STRING,user_id:STRING
```

### Table 4: revenue_transactions
```bash
bq mk --table school_erp_analytics.revenue_transactions \
  date:DATE,school_id:STRING,amount:NUMERIC,transaction_type:STRING,status:STRING,invoice_id:STRING
```

### Table 5: students_aggregate
```bash
bq mk --table school_erp_analytics.students_aggregate \
  date:DATE,school_id:STRING,total_students:INTEGER,active_students:INTEGER,avg_grade:NUMERIC,avg_attendance:NUMERIC
```

### Table 6: system_health
```bash
bq mk --table school_erp_analytics.system_health \
  timestamp:TIMESTAMP,api_latency_ms:INTEGER,error_rate_percent:NUMERIC,active_connections:INTEGER,database_size_gb:NUMERIC
```

### Verify all tables created:
```bash
bq ls -t school_erp_analytics
```

Expected output:
```
        tableId         
 -------------------------
  events                 
  metrics_daily          
  nps_responses          
  revenue_transactions   
  students_aggregate     
  system_health
```

✅ Checklist:
- [ ] events table created
- [ ] metrics_daily table created
- [ ] nps_responses table created
- [ ] revenue_transactions table created
- [ ] students_aggregate table created
- [ ] system_health table created
- [ ] All tables verified

---

## STEP 4: EXECUTE SETUP SCRIPTS (Automated)

### Option A: Linux/Mac
```bash
chmod +x apps/api/scripts/setup-bigquery-phase1.sh
./apps/api/scripts/setup-bigquery-phase1.sh
```

### Option B: Windows PowerShell
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\apps\api\scripts\setup-bigquery-phase1.ps1
```

---

## STEP 5: LOAD SAMPLE DATA (3 minutes)

Start the API:
```bash
cd apps/api
npm install
npm run dev
```

In another terminal:
```bash
# Load 1000 sample events + metrics
curl -X POST http://localhost:3000/api/analytics/test-data/load

# Expected response:
# {"success": true, "eventsLoaded": 1000, "metricsLoaded": 3}
```

### Verify sample data loaded:
```bash
bq query "SELECT COUNT(*) as event_count FROM school_erp_analytics.events"
```

Expected output:
```
 event_count
 -----------
 1000
```

✅ Checklist:
- [ ] API started
- [ ] Sample data loaded
- [ ] Event count verified (>0)

---

## STEP 6: TEST DASHBOARD QUERIES (5 minutes)

Test each endpoint:

### 1. Active Users
```bash
curl http://localhost:3000/api/analytics/dashboards/active-users
```

Expected response:
```json
{
  "success": true,
  "metric": "Active Users",
  "data": [
    {"date": "2026-04-09", "active_users": 45, "schools_active": 3},
    ...
  ]
}
```

### 2. Revenue Trend
```bash
curl http://localhost:3000/api/analytics/dashboards/revenue
```

### 3. Error Rate
```bash
curl http://localhost:3000/api/analytics/dashboards/errors
```

### 4. Reports Generated
```bash
curl http://localhost:3000/api/analytics/dashboards/reports
```

### 5. All Metrics
```bash
curl http://localhost:3000/api/analytics/dashboards/metrics
```

✅ Checklist:
- [ ] Active users endpoint responding
- [ ] Revenue endpoint responding
- [ ] Error rate endpoint responding
- [ ] Reports endpoint responding
- [ ] All metrics endpoint responding

---

## STEP 7: TEST END-TO-END DATA FLOW (5 minutes)

### 1. Send test event
```bash
curl -X POST http://localhost:3000/api/analytics/test-event \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event",
    "school_id": "test_school",
    "user_id": "test_user",
    "data": {"test": true}
  }'
```

### 2. Check BigQuery (immediately and within 5 minutes)
```bash
bq query "SELECT * FROM school_erp_analytics.events WHERE data LIKE '%test%' LIMIT 1"
```

### 3. Wait up to 5 minutes for sync
Check again:
```bash
bq query "SELECT COUNT(*) FROM school_erp_analytics.events WHERE event_type = 'test_event'"
```

Expected: Should show event count > 0

✅ Checklist:
- [ ] Test event sent
- [ ] Event appears in BigQuery within 5 minutes
- [ ] Dashboard queries include new event

---

## STEP 8: VERIFY SYSTEM HEALTH (2 minutes)

```bash
curl http://localhost:3000/api/analytics/health
```

Expected response:
```json
{
  "healthy": true,
  "eventCount": 1001,
  "timestamp": "2026-04-09T18:30:00Z"
}
```

✅ Checklist:
- [ ] Health check passing
- [ ] Event count > 0

---

## STEP 9: PREPARE DASHBOARD UI (10 minutes)

### Option A: Using Looker Studio (Recommended for Week 1)

1. Go to: https://lookerstudio.google.com/
2. Create new report
3. Add 4 charts:
   - Active Users (line chart)
   - Revenue (bar chart)
   - Error Rate (line chart)
   - Reports Generated (bar chart)
4. Connect to BigQuery dataset: school_erp_analytics
5. Set auto-refresh: 5 minutes
6. Share with team (read-only)

### Option B: React Components (Custom)

Components already created in:
```
apps/web/src/components/dashboards/
  - ActiveUsersChart.tsx
  - RevenueChart.tsx
  - ErrorRateChart.tsx
  - ReportsChart.tsx
```

Mount in React app:
```jsx
import { AnalyticsDashboard } from '@/components/dashboards'

export function MainDashboard() {
  return <AnalyticsDashboard />
}
```

✅ Checklist:
- [ ] Dashboard UI prepared (Looker or React)
- [ ] All 4 metrics visible
- [ ] Auto-refresh configured

---

## STEP 10: FINAL VERIFICATION (5 minutes)

Run final checks:

```bash
# 1. Check dataset
bq ls -d school_erp_analytics

# 2. Check tables
bq ls -t school_erp_analytics

# 3. Check row counts
bq query "SELECT 
  'events' as table_name, COUNT(*) as rows FROM school_erp_analytics.events
UNION ALL SELECT
  'metrics_daily', COUNT(*) FROM school_erp_analytics.metrics_daily"

# 4. Test dashboard query
bq query "SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as active_users
FROM school_erp_analytics.events
WHERE event_type = 'user_login'
GROUP BY date
ORDER BY date DESC LIMIT 1"

# 5. Health check
curl http://localhost:3000/api/analytics/health
```

✅ Checklist:
- [ ] Dataset exists
- [ ] All 6 tables exist
- [ ] Row counts > 0
- [ ] Queries execute successfully
- [ ] Health check: healthy=true

---

## STEP 11: DOCUMENTATION & HANDOFF (5 minutes)

Create/Update documentation:

- [ ] README.md updated with BigQuery setup
- [ ] API endpoints documented
- [ ] Data schema documented
- [ ] Dashboard access shared with team
- [ ] Monitoring alerts configured

---

## STEP 12: REPORT STATUS (5 minutes)

Send email to team:

**Subject:** ✅ Data Phase 1 Complete - BigQuery + Dashboards Ready

**Content:**
```
🎉 DATA AGENT PHASE 1 - COMPLETE

✅ BigQuery schema: CREATED
   - Dataset: school_erp_analytics
   - Tables: 6 (events, metrics_daily, nps_responses, revenue_transactions, students_aggregate, system_health)
   - Total events: 1000+ (sample data)

✅ Firestore sync: CONFIGURED
   - Cloud Function: Ready for deploy
   - Real-time sync window: <5 minutes

✅ Dashboard queries: WRITTEN & TESTED
   1. Active Users (30-day trend)
   2. Revenue Trend (daily, with success rate)
   3. Error Rate (affected schools)
   4. Reports Generated (with generation time)

✅ Sample data: LOADED
   - Events: 1000
   - Metrics: 3 schools daily
   - All queryable in BigQuery

✅ End-to-end test: PASSED
   - Event → Firestore → BigQuery: <5 minutes
   - Dashboard reflects new data: ✅

✅ Dashboard UI: READY
   - Looker Studio or React components
   - Auto-refresh: 5 minutes
   - Team access configured

📊 Access:
   - BigQuery: https://console.cloud.google.com/bigquery
   - Looker: https://lookerstudio.google.com/
   - API: http://localhost:3000/api/analytics/dashboards/metrics

🚀 Monday Readiness: GREEN ✅
   - All systems operational
   - Sample data validated
   - End-to-end flow verified
   - Team trained

Next: Deploy to Cloud Run on Monday AM
```

---

## ROLLBACK PROCEDURES

If anything fails:

### Delete and recreate dataset:
```bash
bq rm -r school_erp_analytics
bq mk --dataset --location=US school_erp_analytics
# Then re-run table creation
```

### Check API logs:
```bash
npm run dev  # Start with debug logging
NODE_DEBUG=* npm run dev  # Full debug
```

### Check BigQuery logs:
```bash
gcloud logging read "resource.type=bigquery_resource" --limit 50
```

---

## SUCCESS CRITERIA - ALL MUST BE ✅

- ✅ BigQuery dataset created
- ✅ 6 tables with correct schema
- ✅ 1000+ sample events loaded
- ✅ All 4 dashboard queries tested
- ✅ Test event syncs to BigQuery<5 min
- ✅ Dashboard UI visible with data
- ✅ Health check endpoint returning healthy
- ✅ Team notified + trained
- ✅ Ready for Monday 10:30 AM go-live

---

## CRITICAL SUCCESS TIMELINE

- 6:00 PM: Prerequisites verified
- 6:08 PM: BigQuery dataset created
- 6:20 PM: All 6 tables created (MILESTONE)
- 6:25 PM: Sample data loaded
- 6:30 PM: Dashboard queries tested (MILESTONE)
- 6:40 PM: End-to-end test passed (MILESTONE)
- 6:50 PM: Dashboard UI ready
- 6:55 PM: Final verification complete (MILESTONE)
- 7:00 PM: Status report sent ✅

---

## SUPPORT & ESCALATION

Questions or blockers? Immediate response:

1. Check BigQuery logs:
   https://console.cloud.google.com/logs

2. Test API connectivity:
   ```bash
   curl http://localhost:3000/api/analytics/health
   ```

3. Check GCP project quotas:
   https://console.cloud.google.com/apis/dashboard

4. Slack: #week6-data-agent

---

**Execute NOW. Report by 7:00 PM. Go-live Monday 10:30 AM. 🚀**
