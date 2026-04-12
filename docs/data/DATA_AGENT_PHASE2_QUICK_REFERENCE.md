# DATA AGENT PHASE 2 - QUICK REFERENCE (One Page)
## Thursday, April 10, 2026 - 9:00 AM Launch

---

## PREREQUISITES (5 min)

```bash
# Verify tools
gcloud --version          # Should be 400+
bq --version              # Should be installed
node --version            # Should be 18+

# Authenticate
gcloud auth login
gcloud config set project school-erp-prod

# Set variables
export PROJECT_ID="school-erp-prod"
export DATASET="school_erp_analytics"
```

---

## STEP 1: CREATE BIGQUERY TABLES (10 min)

```bash
# Navigate to repo
cd apps/api

# Run setup script (choose your OS)
# Linux/Mac:
chmod +x scripts/setup-bigquery-phase2.sh
./scripts/setup-bigquery-phase2.sh

# Windows PowerShell:
powershell -ExecutionPolicy Bypass -File scripts/setup-bigquery-phase2.ps1

# Verify tables created
bq ls -t school_erp_analytics
# Expected: events, metrics_daily, revenue_transactions, nps_responses, students_aggregate, system_health
```

---

## STEP 2: DEPLOY CLOUD FUNCTION (15 min)

```bash
# Deploy firestore-to-bigquery function
gcloud functions deploy firestore-to-bigquery \
  --runtime nodejs18 \
  --trigger-resource firestore \
  --trigger-event "providers/cloud.firestore/eventTypes/document.write" \
  --entry-point=syncFirestoreToBQ \
  --set-env-vars BIGQUERY_DATASET=school_erp_analytics,GCP_PROJECT_ID=school-erp-prod \
  --timeout=300 \
  --memory=512MB \
  --region=us-central1 \
  --project=school-erp-prod

# Verify deployment
gcloud functions describe firestore-to-bigquery --region=us-central1
# Expected: Status shows "ACTIVE"
```

---

## STEP 3: TEST DASHBOARD QUERIES (10 min)

```bash
# Test Query 1: Active Users
bq query --location=US --use_legacy_sql=false \
  "SELECT DATE(timestamp) as date, COUNT(DISTINCT user_id) as active_users FROM \`school-erp-prod.school_erp_analytics.events\` WHERE event_type = 'user_login' GROUP BY date ORDER BY date DESC LIMIT 30"

# Test Query 2: Revenue
bq query --location=US --use_legacy_sql=false \
  "SELECT DATE(timestamp) as date, COUNT(*) as transactions FROM \`school-erp-prod.school_erp_analytics.events\` WHERE event_type LIKE '%payment%' GROUP BY date ORDER BY date DESC"

# Test Query 3: Error Rate
bq query --location=US --use_legacy_sql=false \
  "SELECT DATE(timestamp) as date, COUNTIF(event_type LIKE '%error%') as error_count FROM \`school-erp-prod.school_erp_analytics.events\` GROUP BY date ORDER BY date DESC"

# Test Query 4: Reports
bq query --location=US --use_legacy_sql=false \
  "SELECT DATE(timestamp) as date, COUNT(*) as reports FROM \`school-erp-prod.school_erp_analytics.events\` WHERE event_type = 'report_generated' GROUP BY date ORDER BY date DESC"
```

---

## STEP 4: LOAD SAMPLE DATA (5 min)

```bash
# Start API server (in separate terminal)
cd apps/api
npm run dev
# Expected: "✓ API Server running on http://localhost:3000"

# In another terminal - load data
curl -X POST http://localhost:3000/api/analytics/test-data/load \
  -H "Content-Type: application/json" \
  -d '{"count": 1000}'
# Expected: "rowsInserted": 1000

# Verify data
bq query --location=US \
  "SELECT COUNT(*) as event_count FROM school_erp_analytics.events"
# Expected: 1000+
```

---

## STEP 5: END-TO-END TEST (10 min)

```bash
# Send test event
curl -X POST http://localhost:3000/api/analytics/events/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "test_event_phase2",
    "school_id": "SCHOOL_TEST",
    "user_id": "USER_TEST",
    "data": {"source": "phase2_test"}
  }'
# Expected: "success": true

# Wait 30 seconds then check BigQuery
# (First sync may take up to 5 minutes)
sleep 30

bq query --location=US \
  "SELECT * FROM school_erp_analytics.events WHERE event_type = 'test_event_phase2' LIMIT 1"
# Expected: Test event appears (note sync time)
```

---

## STEP 6: VERIFY API ENDPOINTS (10 min)

```bash
# Health check
curl -X GET http://localhost:3000/api/analytics/health
# Expected: "connected": true for both BigQuery and Firestore

# All metrics
curl -X GET http://localhost:3000/api/analytics/dashboards/metrics

# Individual endpoints
curl -X GET http://localhost:3000/api/analytics/dashboards/active-users
curl -X GET http://localhost:3000/api/analytics/dashboards/revenue
curl -X GET http://localhost:3000/api/analytics/dashboards/errors
curl -X GET http://localhost:3000/api/analytics/dashboards/reports

# All should return 200 status with data
```

---

## QUICK TEST SUITE (5 min)

```bash
# Run all Phase 2 tests
npm test -- --testPathPattern=phase2

# Expected: ✓ All tests pass (25+ test cases)
```

---

## SUCCESS CHECKLIST

- [ ] BigQuery dataset created: `bq ls -d school_erp_analytics`
- [ ] 6 tables created: `bq ls -t school_erp_analytics` (count shows 6)
- [ ] Cloud Function deployed: Status shows "ACTIVE"
- [ ] Sample data loaded: >1000 events in BigQuery
- [ ] Dashboard queries execute: All 4 queries return results
- [ ] API endpoints working: All return 200 status
- [ ] End-to-end sync working: Test event in BigQuery within 5 min
- [ ] Test suite passing: 25/25 tests pass
- [ ] No errors in logs: Check API server console

---

## IF ISSUES OCCUR

### Dataset/Table Creation Failed
→ Check: `gcloud config get-value project` (should be school-erp-prod)
→ Fix: `gcloud auth login` then retry setup script

### Cloud Function Deployment Failed
→ Check: `gcloud services list | grep functions` (should show active)
→ Fix: `gcloud services enable cloudfunctions.googleapis.com` then retry

### Sample Data Not Appearing
→ Check: API server console for errors
→ Check: Firestore has the data (Firebase Console)
→ Fix: Wait 5 minutes, then check BigQuery again

### Sync Taking Too Long
→ Check: Cloud Function logs: `gcloud functions logs read firestore-to-bigquery --limit 20`
→ Fix: Increase memory: `--memory=1024MB`

### Need to Rollback
→ Delete function: `gcloud functions delete firestore-to-bigquery --quiet`
→ Delete tables: `bq rm -t school_erp_analytics.events` (repeat for each table)
→ Restart API: `npm run dev`

---

## FINAL STATUS REPORT (By 3:00 PM)

**Generate and submit:**

```
✅ Phase 2 Execution Complete

Date: April 10, 2026
Execution Time: 9:00 AM - 10:10 AM
Status: ALL ITEMS COMPLETE

Deliverables:
✓ BigQuery dataset & tables created
✓ Cloud Function deployed (ACTIVE)
✓ Sample data loaded (1000+ events)
✓ Dashboard queries verified
✓ API endpoints working
✓ End-to-end sync tested
✓ Test suite passing (25/25)

Readiness: 🚀 GO-LIVE READY
Next: Monday 10:30 AM Launch
```

---

## KEY TIMES

| Task | Duration | Start | End |
|------|----------|-------|-----|
| Pre-flight | 5 min | 9:00 | 9:05 |
| Setup script | 5 min | 9:05 | 9:10 |
| Verify tables | 3 min | 9:10 | 9:13 |
| Deploy function | 12 min | 9:13 | 9:25 |
| Test queries | 10 min | 9:25 | 9:35 |
| Load data | 5 min | 9:35 | 9:40 |
| E2E test | 10 min | 9:40 | 9:50 |
| API verify | 10 min | 9:50 | 10:00 |
| **TOTAL** | **~70 min** | **9:00** | **10:10** |

---

## RESOURCES

| File | Purpose |
|------|---------|
| DATA_AGENT_PHASE2_DEPLOYMENT_GUIDE.md | Full detailed guide |
| DATA_AGENT_PHASE2_EXECUTION_CHECKLIST.md | Timestamped checklist |
| setup-bigquery-phase2.sh | Linux/Mac automation |
| setup-bigquery-phase2.ps1 | Windows automation |
| phase2-deployment.test.ts | Test suite |

---

## CONTACT

- **Technical Issues:** Check Troubleshooting in full deployment guide
- **Architecture Questions:** Refer to Phase 1 documentation
- **Escalation:** Lead Architect (30 min response SLA)

---

**GO-LIVE READY: 🚀**  
**Execution Date:** Thursday, April 10, 2026  
**Completion Target:** 3:00 PM  
**Next Milestone:** Monday 10:30 AM Launch  

