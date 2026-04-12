# DATA AGENT - PHASE 2 EXECUTION GUIDE
## BigQuery Deployment & Real-Time Sync

**Date:** Thursday, April 10, 2026  
**Mission Owner:** Data Agent  
**Mission:** Complete BigQuery deployment + real-time sync by EOD  
**Target Completion:** 3:00 PM (Report Status)  
**Go-Live Readiness:** Monday 10:30 AM  

---

## MISSION OVERVIEW

Phase 2 is the **EXECUTION** phase of Phase 1's planning. All code, scripts, and configurations are ready. This guide walks through:

1. ✅ Creating BigQuery dataset and tables
2. ✅ Deploying Firestore → BigQuery real-time sync
3. ✅ Loading sample data (1000+ events)
4. ✅ Testing end-to-end pipeline
5. ✅ API endpoints verification
6. ✅ Dashboard queries validation

**Timeline:** 60 minutes (9:00 AM - 10:00 AM)  
**Success Criteria:** All 6 steps complete, all tests passing

---

## PREREQUISITES CHECKLIST

Before starting, verify all prerequisites are met:

### GCP Resources
- [ ] GCP Project ID: `school-erp-prod`
- [ ] BigQuery API enabled
- [ ] Cloud Functions API enabled
- [ ] Pub/Sub API enabled
- [ ] Cloud Firestore enabled
- [ ] Service account with appropriate permissions

### Local Environment
- [ ] `gcloud` CLI installed and authenticated
- [ ] `bq` CLI installed
- [ ] Node.js 18+ installed
- [ ] npm or yarn available
- [ ] API repository cloned locally
- [ ] Port 3000 available (API server)

### Credentials
- [ ] GCP service account key configured
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` environment variable set
- [ ] `GCP_PROJECT_ID` environment variable set

**Verification Commands:**
```bash
# Check gcloud
gcloud --version

# Check bq
bq --version

# Check Node.js
node --version

# Check authentication
gcloud auth list
gcloud config get-value project
```

---

## STEP 1: CREATE BIGQUERY DATASET & TABLES (10 minutes)

### 1.1 Set Environment Variables

```bash
# Linux/Mac
export PROJECT_ID="school-erp-prod"
export DATASET="school_erp_analytics"
export LOCATION="US"

# PowerShell (Windows)
$env:PROJECT_ID = "school-erp-prod"
$env:DATASET = "school_erp_analytics"
$env:LOCATION = "US"
```

### 1.2 Create Dataset

```bash
# Create the BigQuery dataset
bq mk \
  --project_id=$PROJECT_ID \
  --dataset \
  --description="School ERP Analytics data warehouse" \
  --location=$LOCATION \
  $DATASET

# Verify dataset created
bq ls -d $DATASET
```

### 1.3 Create Tables

Execute the setup script to create all 6 tables with proper schema:

```bash
# Linux/Mac
chmod +x apps/api/scripts/setup-bigquery-phase2.sh
./apps/api/scripts/setup-bigquery-phase2.sh

# PowerShell (Windows)
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\apps\api\scripts\setup-bigquery-phase2.ps1
```

### 1.4 Verify Tables Created

```bash
# List all tables in dataset
bq ls -t $DATASET

# Expected output should show:
# - events
# - metrics_daily
# - revenue_transactions
# - nps_responses
# - students_aggregate
# - system_health
```

### 1.5 Check Table Schemas

```bash
# Verify events table schema
bq show --schema $DATASET.events

# Verify metrics_daily table schema
bq show --schema $DATASET.metrics_daily
```

**Success Criteria:**
- ✅ Dataset exists in BigQuery
- ✅ 6 tables created with correct schemas
- ✅ All tables verified accessible

---

## STEP 2: SET UP FIRESTORE → BIGQUERY REAL-TIME SYNC (15 minutes)

### 2.1 Deploy Cloud Function

The `firestore-bigquery-sync` Cloud Function automatically syncs Firestore writes to BigQuery.

```bash
# Navigate to API directory
cd apps/api

# Deploy Cloud Function
gcloud functions deploy firestore-to-bigquery \
  --runtime nodejs18 \
  --trigger-resource firestore \
  --trigger-event "providers/cloud.firestore/eventTypes/document.write" \
  --entry-point=syncFirestoreToBQ \
  --set-env-vars BIGQUERY_DATASET=school_erp_analytics,GCP_PROJECT_ID=$PROJECT_ID \
  --timeout=300 \
  --memory=512MB \
  --region=us-central1 \
  --project=$PROJECT_ID

# For PowerShell, use backticks for line continuation:
gcloud functions deploy firestore-to-bigquery `
  --runtime nodejs18 `
  --trigger-resource firestore `
  --trigger-event "providers/cloud.firestore/eventTypes/document.write" `
  --entry-point=syncFirestoreToBQ `
  --set-env-vars BIGQUERY_DATASET=school_erp_analytics,GCP_PROJECT_ID=$PROJECT_ID `
  --timeout=300 `
  --memory=512MB `
  --region=us-central1 `
  --project=$PROJECT_ID
```

### 2.2 Alternative: Deploy as Pub/Sub Triggered Function

If direct Firestore trigger is not available:

```bash
# Create Pub/Sub topic
gcloud pubsub topics create firestore-export-topic --project=$PROJECT_ID

# Deploy Cloud Function with Pub/Sub trigger
gcloud functions deploy firestore-to-bigquery \
  --runtime nodejs18 \
  --trigger-topic firestore-export-topic \
  --entry-point=syncFirestoreToBQ \
  --set-env-vars BIGQUERY_DATASET=school_erp_analytics,GCP_PROJECT_ID=$PROJECT_ID \
  --timeout=300 \
  --memory=512MB \
  --region=us-central1 \
  --project=$PROJECT_ID
```

### 2.3 Verify Cloud Function Deployment

```bash
# List Cloud Functions
gcloud functions list --project=$PROJECT_ID

# Get function details
gcloud functions describe firestore-to-bigquery --region=us-central1 --project=$PROJECT_ID

# Check function logs (last 10 lines)
gcloud functions logs read firestore-to-bigquery --limit 10 --region=us-central1 --project=$PROJECT_ID
```

**Success Criteria:**
- ✅ Cloud Function deployed successfully
- ✅ Function status shows "ACTIVE"
- ✅ No deployment errors in logs

---

## STEP 3: CREATE & VERIFY DASHBOARD QUERIES (10 minutes)

Dashboard SQL queries are pre-built in `src/data/dashboard-queries.ts`.

### 3.1 Query 1: Active Users Trend (Last 30 Days)

```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as active_users
FROM `school-erp-prod.school_erp_analytics.events`
WHERE event_type = 'user_login'
AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC
```

### 3.2 Query 2: Revenue Trend (Last 30 Days)

```sql
SELECT 
  DATE(timestamp) as date,
  SUM(CAST(JSON_EXTRACT_SCALAR(data, '$.amount') AS FLOAT64)) as daily_revenue,
  COUNT(*) as transaction_count,
  COUNTIF(CAST(JSON_EXTRACT_SCALAR(data, '$.status') AS STRING) = 'completed') as completed_transactions
FROM `school-erp-prod.school_erp_analytics.events`
WHERE event_type = 'payment_completed'
AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC
```

### 3.3 Query 3: Error Rate (Last 30 Days)

```sql
SELECT 
  DATE(timestamp) as date,
  COUNTIF(event_type LIKE '%error%') as error_count,
  COUNT(*) as total_events,
  ROUND(COUNTIF(event_type LIKE '%error%') / COUNT(*) * 100, 2) as error_rate_percent
FROM `school-erp-prod.school_erp_analytics.events`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC
```

### 3.4 Query 4: Reports Generated (Last 30 Days)

```sql
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as reports_generated,
  COUNT(DISTINCT school_id) as schools_generating_reports,
  COUNT(DISTINCT user_id) as users_generating_reports
FROM `school-erp-prod.school_erp_analytics.events`
WHERE event_type = 'report_generated'
AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC
```

### 3.5 Test Queries in BigQuery Console

```bash
# Test Query 1: Active Users
bq query --location=US \
  "SELECT DATE(CURRENT_TIMESTAMP()) as test_date, COUNT(*) FROM school_erp_analytics.events LIMIT 1"

# Test Query 2: Data Access
bq query --location=US \
  "SELECT COUNT(*) as total_events, COUNT(DISTINCT school_id) as schools FROM school_erp_analytics.events"
```

**Success Criteria:**
- ✅ All 4 queries execute without errors
- ✅ Queries return expected column names
- ✅ Queries complete in <5 seconds

---

## STEP 4: LOAD SAMPLE DATA (5 minutes)

### 4.1 Start API Server

```bash
cd apps/api

# Install dependencies if needed
npm install

# Start API in development mode
npm run dev

# Expected output:
# ✓ API Server running on http://localhost:3000
# ✓ BigQuery connected
# ✓ Ready for requests
```

### 4.2 Load Sample Data via API Endpoint

```bash
# Load 1000 sample events
curl -X POST http://localhost:3000/api/analytics/test-data/load \
  -H "Content-Type: application/json" \
  -d '{"count": 1000}'

# Expected response:
# {
#   "success": true,
#   "message": "Sample data loaded successfully",
#   "rowsInserted": 1000,
#   "timestamp": "2026-04-10T14:00:00Z"
# }
```

### 4.3 Verify Sample Data Loaded

```bash
# Check record count
bq query --location=US \
  "SELECT COUNT(*) as event_count FROM school_erp_analytics.events"

# Check data variety
bq query --location=US \
  "SELECT event_type, COUNT(*) as count FROM school_erp_analytics.events GROUP BY event_type"

# Expected: >1000 total events with variety of event types
```

### 4.4 View Sample Data

```bash
# Show first 5 records
bq query --location=US \
  "SELECT * FROM school_erp_analytics.events LIMIT 5"

# Check timestamp range
bq query --location=US \
  "SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM school_erp_analytics.events"
```

**Success Criteria:**
- ✅ 1000+ sample events loaded
- ✅ Events have correct schema
- ✅ Data spans 30-day period
- ✅ Multiple event types present

---

## STEP 5: TEST END-TO-END PIPELINE (10 minutes)

### 5.1 Send Test Event to API

```bash
# Send single test event
curl -X POST http://localhost:3000/api/analytics/events/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event_phase2",
    "school_id": "SCHOOL_001",
    "user_id": "USER_001",
    "data": {
      "test_marker": "phase2_deployment",
      "timestamp": "'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"
    }
  }'

# Expected response:
# {
#   "success": true,
#   "message": "Test event recorded",
#   "event_id": "abc123..."
# }
```

### 5.2 Verify Event in Firestore

```bash
# Check Firestore for the test event
# (Use Firebase Console or programmatically via API)

curl -X GET "http://localhost:3000/api/analytics/events/latest?limit=1" \
  -H "Authorization: Bearer <token>"

# Should show your test event in Firestore
```

### 5.3 Verify Event Synced to BigQuery (Wait 5 minutes max)

```bash
# Query BigQuery for test event
# (Note: First sync may take up to 5 minutes)

bq query --location=US \
  "SELECT * FROM school_erp_analytics.events WHERE event_type = 'test_event_phase2' LIMIT 1"

# If no results, wait 30 more seconds and retry
```

### 5.4 Test Dashboard Queries Against Real Data

```bash
# Test Active Users query
bq query --location=US --use_legacy_sql=false \
  "SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as active_users FROM school_erp_analytics.events WHERE event_type = 'user_login' GROUP BY date ORDER BY date DESC LIMIT 30"

# Test Revenue query
bq query --location=US --use_legacy_sql=false \
  "SELECT DATE(timestamp) as date, COUNT(*) as transactions FROM school_erp_analytics.events WHERE event_type LIKE '%payment%' GROUP BY date ORDER BY date DESC LIMIT 30"
```

**Success Criteria:**
- ✅ Test event recorded in Firestore
- ✅ Test event appears in BigQuery table
- ✅ Sync latency < 5 minutes
- ✅ Dashboard queries return valid results

---

## STEP 6: VERIFY API ENDPOINTS (10 minutes)

### 6.1 Health Check

```bash
curl -X GET http://localhost:3000/api/analytics/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "bigquery": {
    "connected": true,
    "dataset": "school_erp_analytics",
    "tables": 6
  },
  "firestore": {
    "connected": true
  }
}
```

### 6.2 Get All Dashboard Metrics

```bash
curl -X GET http://localhost:3000/api/analytics/dashboards/metrics
```

Expected response:
```json
{
  "success": true,
  "data": {
    "activeUsers": [...],
    "revenueTrend": [...],
    "errorRate": [...],
    "reportsGenerated": [...]
  },
  "timestamp": "2026-04-10T14:30:00Z"
}
```

### 6.3 Individual Metric Endpoints

```bash
# Active Users
curl -X GET http://localhost:3000/api/analytics/dashboards/active-users

# Revenue Trend
curl -X GET http://localhost:3000/api/analytics/dashboards/revenue

# Error Rate
curl -X GET http://localhost:3000/api/analytics/dashboards/errors

# Reports Generated
curl -X GET http://localhost:3000/api/analytics/dashboards/reports
```

### 6.4 Test Data Endpoints

```bash
# Load sample data
curl -X POST http://localhost:3000/api/analytics/test-data/load \
  -H "Content-Type: application/json" \
  -d '{"count": 100}'

# Record custom event
curl -X POST http://localhost:3000/api/analytics/events/record \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "custom_event",
    "school_id": "TEST_SCHOOL",
    "user_id": "TEST_USER",
    "data": {"custom": "value"}
  }'
```

**Success Criteria:**
- ✅ All endpoints return 200 status
- ✅ Responses have correct JSON structure
- ✅ Data is populated and accessible
- ✅ No error messages in responses

---

## PHASE 2 EXECUTION CHECKLIST

Use this checklist to track progress through each step:

### Pre-Execution (5 min)
- [ ] Prerequisites verified (gcloud, bq, Node.js)
- [ ] GCP authentication confirmed
- [ ] Environment variables set
- [ ] API repository ready

### Step 1: BigQuery Setup (10 min)
- [ ] Dataset created successfully
- [ ] 6 tables created with correct schema
- [ ] Tables verified in BigQuery console
- [ ] Table schemas validated

### Step 2: Cloud Function (15 min)
- [ ] Cloud Function deployed
- [ ] Function status shows ACTIVE
- [ ] No errors in deployment logs
- [ ] Triggers configured correctly

### Step 3: Query Verification (10 min)
- [ ] All 4 dashboard queries tested
- [ ] Query execution time < 5 seconds
- [ ] Queries return expected columns
- [ ] No SQL syntax errors

### Step 4: Sample Data (5 min)
- [ ] API server started successfully
- [ ] 1000+ sample events loaded
- [ ] Data verification successful
- [ ] Data spans 30-day period

### Step 5: End-to-End Test (10 min)
- [ ] Test event created successfully
- [ ] Event appears in Firestore
- [ ] Event synced to BigQuery
- [ ] Sync latency verified < 5 min

### Step 6: API Endpoints (10 min)
- [ ] Health endpoint responds
- [ ] All dashboard endpoints working
- [ ] Metrics endpoints return data
- [ ] No 5xx errors

### Post-Execution (5 min)
- [ ] Status report generated
- [ ] All tests passing
- [ ] Logs reviewed for errors
- [ ] Handover documentation complete

**Total Time:** ~60 minutes  
**Target Completion:** 10:00 AM  

---

## TROUBLESHOOTING

### BigQuery Dataset Creation Fails
**Issue:** "Authentication failed" or "Permission denied"  
**Solution:**
```bash
# Verify authentication
gcloud auth list
gcloud config set project $PROJECT_ID

# Re-authenticate if needed
gcloud auth login
```

### Cloud Function Deployment Fails
**Issue:** "Function deployment failed" or "Invalid handler"  
**Solution:**
```bash
# Check if Cloud Functions API is enabled
gcloud services enable cloudfunctions.googleapis.com

# View deployment logs
gcloud functions logs read firestore-to-bigquery --limit 50

# Try manual deployment with detailed error output
gcloud functions deploy firestore-to-bigquery --source ./src/modules/analytics --debug
```

### BigQuery Queries Timeout
**Issue:** Queries take > 5 seconds  
**Solution:**
```bash
# Add project filter to queries
bq query --project_id=$PROJECT_ID --use_legacy_sql=false "..."

# Check table size
bq show -j --project_id=$PROJECT_ID school_erp_analytics.events
```

### Sample Data Not Appearing
**Issue:** API load returns success but no data in BigQuery  
**Solution:**
```bash
# Check API logs for errors
curl -X GET http://localhost:3000/api/analytics/health

# Verify Cloud Function is processing events
gcloud functions logs read firestore-to-bigquery --limit 20

# Check Firestore has the data
# (Use Firebase Console)
```

### Sync Latency > 5 Minutes
**Issue:** Events take too long to appear in BigQuery  
**Solution:**
```bash
# Check Cloud Function memory
gcloud functions describe firestore-to-bigquery --region=us-central1

# Increase memory if needed
gcloud functions deploy firestore-to-bigquery --memory=1024MB ...

# Check for quota issues
gcloud compute project-info describe --project=$PROJECT_ID
```

---

## ROLLBACK PROCEDURE

If issues arise and you need to rollback:

```bash
# Remove Cloud Function
gcloud functions delete firestore-to-bigquery --region=us-central1 --quiet

# Delete BigQuery tables (preserves dataset)
bq rm -t --force $DATASET.events
bq rm -t --force $DATASET.metrics_daily
bq rm -t --force $DATASET.revenue_transactions
bq rm -t --force $DATASET.nps_responses
bq rm -t --force $DATASET.students_aggregate
bq rm -t --force $DATASET.system_health

# Or delete entire dataset
bq rm -r --force school_erp_analytics

# Restart API server
cd apps/api && npm run dev
```

---

## COMPLETION HANDOVER

By **3:00 PM Thursday**, verify all completed items and report:

**Report Format:**
```
🚀 DATA AGENT PHASE 2 EXECUTION - STATUS REPORT

Date: April 10, 2026
Time: 15:00 (3:00 PM)

✅ COMPLETED ITEMS:
- BigQuery dataset created
- 6 tables with schema verified
- Cloud Function deployed and active
- Sample data loaded (1000+ events)
- Dashboard queries tested
- API endpoints verified
- End-to-end test passed
- Logs reviewed and clean

📊 METRICS:
- Events in BigQuery: X
- Sync latency: < 5 minutes
- Query execution time: < 2 seconds
- API response time: < 500ms

🎯 NEXT STEPS:
- Monday 10:30 AM: Go-live announcement
- Begin real event collection
- Monitor dashboard for 2 hours
- Daily health checks

SIGN-OFF: Data Agent - READY FOR GO-LIVE ✅
```

---

## RESOURCES & REFERENCES

- [BigQuery Schema Definition](./src/data/bigquery-schema.ts)
- [Dashboard Queries](./src/data/dashboard-queries.ts)  
- [Analytics Service](./src/services/analytics.service.ts)
- [Dashboard Routes](./src/routes/dashboards.ts)
- [Cloud Function Code](./src/modules/analytics/firestore-bigquery-sync.ts)
- [Phase 1 Checklist](./DATA_AGENT_PHASE1_CHECKLIST.md)

---

## SIGN-OFF

**Phase 2 Execution Guide - Ready for Deployment**

This guide provides step-by-step instructions to deploy the analytics pipeline coded in Phase 1.

**Lead Architect Review:** Pending  
**Data Agent Mission:** Complete BigQuery deployment + real-time sync by EOD Thursday  
**Go-Live Target:** Monday 10:30 AM

---

_Data Agent Phase 2 - April 10, 2026_
