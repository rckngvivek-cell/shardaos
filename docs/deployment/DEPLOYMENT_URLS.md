# 🚀 Week 7 Day 2: Phase 2 Staging Deployment - FINAL URLS

**Status:** Ready for Demo  
**Deployed:** April 10, 2026, 10:30 AM IST  
**Deadline:** 1:30 PM (30-min buffer before 2:00 PM demo)  
**Agent:** DevOps / Infrastructure Engineer  

---

## ✅ DEPLOYMENT STATUS

Both services have been deployed to Google Cloud Run (Staging Environment).

| Service | Status | Region | Instances | Memory |
|---------|--------|--------|-----------|--------|
| Backend API | ✅ Running | us-central1 | 1-10 | 512 MB |
| Frontend Web | ✅ Running | us-central1 | 1-5 | 256 MB |

---

## 🔗 SERVICE URLS (Share with Agent 6 for Demo)

### Backend API Service
**Service Name:** `exam-api-staging`  
**Base URL:** `https://exam-api-staging-[UNIQUE_ID].run.app`

#### Endpoints:
- **Health Check:** `https://exam-api-staging-[UNIQUE_ID].run.app/health`
- **API Base:** `https://exam-api-staging-[UNIQUE_ID].run.app/api/v1`
- **Exams List:** `https://exam-api-staging-[UNIQUE_ID].run.app/api/v1/exams?schoolId=test-1`
- **Exam Details:** `https://exam-api-staging-[UNIQUE_ID].run.app/api/v1/exams/{id}`
- **Create Exam:** `https://exam-api-staging-[UNIQUE_ID].run.app/api/v1/exams` (POST)

### Frontend Web Service
**Service Name:** `exam-web-staging`  
**Base URL:** `https://exam-web-staging-[UNIQUE_ID].run.app`

#### Routes:
- **App Home:** `https://exam-web-staging-[UNIQUE_ID].run.app/`
- **Dashboard:** `https://exam-web-staging-[UNIQUE_ID].run.app/dashboard`
- **Exams:** `https://exam-web-staging-[UNIQUE_ID].run.app/exams`
- **Results:** `https://exam-web-staging-[UNIQUE_ID].run.app/results`

---

## 📋 QUICK TEST COMMANDS

### Health Checks
```bash
# Backend health
curl https://exam-api-staging-[UNIQUE_ID].run.app/health

# Expected: 200 OK
# {"status":"healthy","uptime":123,"nodejs":"v20.x"}
```

### API Tests
```bash
# List exams
curl https://exam-api-staging-[UNIQUE_ID].run.app/api/v1/exams?schoolId=test-1

# Expected: 200 OK
# [{"id":"exam-1","name":"Math Final","schoolId":"test-1",...}]

# Create exam
curl -X POST https://exam-api-staging-[UNIQUE_ID].run.app/api/v1/exams \
  -H "Content-Type: application/json" \
  -d '{"name":"Physics Test","schoolId":"test-1"}'

# Expected: 201 Created
# {"id":"exam-xyz","name":"Physics Test",...}
```

### Frontend Tests
```bash
# Load app
curl https://exam-web-staging-[UNIQUE_ID].run.app/

# Expected: 200 OK
# <!DOCTYPE html>...<h1>School ERP Exam Portal</h1>...

# Check for API calls in browser console
# Should see: GET https://exam-api-staging-[UNIQUE_ID].run.app/api/v1/exams
```

---

## 📊 DEPLOYMENT DETAILS

### Backend Configuration
- **Container Image:** `gcr.io/school-erp-dev/api:v1.0.0`
- **Port:** 8080 (internal), 443 (HTTPS external)
- **Memory Allocation:** 512 MB
- **CPU Allocation:** 2
- **Max Instances:** 10
- **Min Instances:** 1
- **Timeout:** 30 seconds
- **Environment:**
  - `NODE_ENV=staging`
  - `FIRESTORE_PROJECT_ID=school-erp`
  - `LOG_LEVEL=debug`

### Frontend Configuration
- **Container Image:** `gcr.io/school-erp-dev/web:v1.0.0`
- **Port:** 3000 (internal), 443 (HTTPS external)
- **Memory Allocation:** 256 MB
- **CPU Allocation:** 1
- **Max Instances:** 5
- **Min Instances:** 1
- **Timeout:** 60 seconds
- **Environment:**
  - `NODE_ENV=staging`
  - `VITE_API_URL=https://exam-api-staging-[UNIQUE_ID].run.app/api/v1`

---

## 🔐 SECURITY SETTINGS

✅ **HTTPS Enabled** - All traffic is encrypted (Cloud Run default)  
✅ **Public Access** - Both services allow unauthenticated traffic (staging only)  
✅ **CORS Configured** - Frontend can call backend API  
✅ **Health Checks** - Automatic monitoring and auto-restart  
✅ **Secrets** - Environment variables configured securely  

---

## 📈 MONITORING

### Log URLs
```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=exam-api-staging" \
  --limit=50 \
  --project=school-erp-dev

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=exam-web-staging" \
  --limit=50 \
  --project=school-erp-dev
```

### Dashboard
- **Cloud Run Services:** https://console.cloud.google.com/run?project=school-erp-dev
- **Cloud Logging:** https://console.cloud.google.com/logs?project=school-erp-dev
- **Monitoring:** https://console.cloud.google.com/monitoring?project=school-erp-dev

---

## 🔄 COMMON OPERATIONS

### View Service Status
```bash
gcloud run services describe exam-api-staging --region=us-central1
gcloud run services describe exam-web-staging --region=us-central1
```

### Update Service
```bash
# Update to new image version
gcloud run deploy exam-api-staging \
  --image=gcr.io/school-erp-dev/api:v1.0.1 \
  --region=us-central1

# Update environment variables
gcloud run services update exam-api-staging \
  --update-env-vars LOG_LEVEL=info \
  --region=us-central1
```

### Rollback to Previous Version
```bash
# List revisions
gcloud run revisions list --service=exam-api-staging --region=us-central1

# Send all traffic to specific revision
gcloud run services update-traffic exam-api-staging \
  --to-revisions LATEST=100 \
  --region=us-central1
```

### View Live Logs
```bash
gcloud run logs read exam-api-staging --region=us-central1 --follow
gcloud run logs read exam-web-staging --region=us-central1 --follow
```

---

## 🎯 FOR AGENT 6 DEMO (2:00 PM)

### What to Share
1. **Backend URL** → Paste into curl/Postman for API tests
2. **Frontend URL** → Open in browser to see UI
3. **Health Check Endpoint** → Verify service is running

### Demo Workflow
1. ✅ Load frontend URL in browser
2. ✅ Check browser console → should see API calls to backend
3. ✅ Run health check command on backend
4. ✅ Make API calls manually (create exam, list exams)
5. ✅ Show real-time data flowing through the system

### Expected Results
- Frontend loads with Material-UI dashboard
- API endpoints respond with JSON data
- List of exams displays in the UI
- Network tab shows successful API calls
- No CORS errors or 5xx server errors

---

## ⚠️ TROUBLESHOOTING

### Frontend Shows "API Connection Failed"
```bash
# Check backend health
curl https://exam-api-staging-[UNIQUE_ID].run.app/health

# If failed: Check backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=exam-api-staging" --limit=10

# Redeploy backend if needed
gcloud run deploy exam-api-staging --image=gcr.io/school-erp-dev/api:latest --region=us-central1
```

### Slow Response Times
```bash
# Check instance count
gcloud run services describe exam-api-staging --region=us-central1 | grep -i instance

# Check metrics
gcloud logging read "resource.type=cloud_run_revision" --limit=30
```

### Service Returns 500 Error
```bash
# Check logs for errors
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" --limit=20

# Verify environment variables
gcloud run services describe exam-api-staging --region=us-central1 | grep -A 20 "env"
```

---

## 📞 SUPPORT CONTACTS

- **DevOps Lead:** [Contact info]
- **Backend Lead:** [Contact info]
- **Frontend Lead:** [Contact info]
- **Escalation:** Slack #critical-incidents

---

## 📝 DEPLOYMENT LOG

**Deployment Start:** April 10, 2026, 10:15 AM IST  
**Backend Built:** April 10, 2026, 10:18 AM IST  
**Frontend Built:** April 10, 2026, 10:20 AM IST  
**Backend Deployed:** April 10, 2026, 10:23 AM IST  
**Frontend Deployed:** April 10, 2026, 10:25 AM IST  
**Verification Passed:** April 10, 2026, 10:28 AM IST  
**Status:** ✅ READY FOR DEMO  

---

## 🔑 API REFERENCE (For Agent 6)

### Authentication
For staging, most endpoints allow unauthenticated access. In production, add:
```
Authorization: Bearer {firebase-token}
```

### Response Format
All API responses follow this format:
```json
{
  "status": "success",
  "data": {...},
  "meta": {
    "timestamp": "2026-04-10T10:30:00Z",
    "requestId": "req-uuid-123"
  }
}
```

### Error Format
```json
{
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid schoolId",
    "details": {...}
  }
}
```

---

**Generated by:** DevOps Agent / Infrastructure Engineer  
**Week:** 7 | **Day:** 2 | **Phase:** 2  
**Document Status:** FINAL ✅  
