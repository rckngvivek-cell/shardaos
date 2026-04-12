# 🚀 STAGING DEPLOYMENT PLAN - April 10, 2026

## ✅ BUILD STATUS: COMPLETE

| Component | Status | Location | Size | Notes |
|-----------|--------|----------|------|-------|
| **Backend API** | ✅ BUILT | `apps/api/dist/` | 2.1 MB | Node.js 20 Alpine Docker-ready |
| **Frontend Portal** | ✅ BUILT | `apps/web/dist/` | 533 KB | Vite production bundle (170 KB gzip) |
| **Shared Modules** | ✅ READY | `packages/shared/` | N/A | TypeScript compiled and ready |

---

## 📋 DEPLOYMENT CHECKLIST

### Phase 1: Frontend Deployment (Firebase Hosting)
- [ ] **Step 1:** Authenticate to Firebase
  ```bash
  firebase login
  ```
  
- [ ] **Step 2:** Deploy frontend
  ```bash
  cd c:\Users\vivek\OneDrive\Scans\files
  firebase deploy --only hosting
  ```
  
- [ ] **Step 3:** Verify frontend deployment
  ```bash
  curl https://YOUR_FIREBASE_PROJECT.firebaseapp.com/
  # Expected: React app loads successfully
  ```

**Expected Output:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/school-erp-dev
Hosting URL: https://school-erp-dev.firebaseapp.com
```

---

### Phase 2: Backend Deployment (Google Cloud Run - Staging)

#### Option A: Using Docker (Recommended for staging)

- [ ] **Step 1:** Build Docker image
  ```bash
  cd c:\Users\vivek\OneDrive\Scans\files
  docker build -t school-erp-api:latest -f apps/api/Dockerfile .
  ```

- [ ] **Step 2:** Tag for Google Container Registry
  ```bash
  docker tag school-erp-api:latest gcr.io/school-erp-dev/api:staging-20260410
  ```

- [ ] **Step 3:** Configure Docker authentication
  ```bash
  gcloud auth configure-docker gcr.io
  ```

- [ ] **Step 4:** Push to Google Container Registry
  ```bash
  docker push gcr.io/school-erp-dev/api:staging-20260410
  ```

- [ ] **Step 5:** Deploy to Cloud Run (Staging)
  ```bash
  gcloud run deploy school-erp-api-staging \
    --image gcr.io/school-erp-dev/api:staging-20260410 \
    --platform managed \
    --region asia-south1 \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 1 \
    --max-instances 3 \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=staging,API_PORT=8080,FIREBASE_PROJECT=school-erp-dev" \
    --env-vars-file .env.staging
  ```

#### Option B: Using npm (For rapid iteration)

- [ ] **Step 1:** Start backend service
  ```bash
  cd c:\Users\vivek\OneDrive\Scans\files\apps\api
  npm run start
  ```
  **Expected:** Server running on http://localhost:8080

---

## 🔍 SMOKE TEST SUITE

### Frontend Validation Tests

```bash
# Test 1: Frontend loads
curl -s https://YOUR_FIREBASE_PROJECT.firebaseapp.com/ \
  | grep -q "<title>" && echo "✅ Frontend loads" || echo "❌ Frontend failed"

# Test 2: React app bundle present
curl -s https://YOUR_FIREBASE_PROJECT.firebaseapp.com/assets/ \
  | grep -q "\.js\|\.css" && echo "✅ Assets served" || echo "❌ Assets missing"
```

### Backend Validation Tests

```bash
# Test 1: API health check
curl -i http://localhost:8080/health/live \
  # Expected: 200 OK, {"status":"healthy"}

# Test 2: API readiness
curl -i http://localhost:8080/health/ready \
  # Expected: 200 OK

# Test 3: API version
curl http://localhost:8080/api/v1/health \
  # Expected: {"version":"0.1.0","environment":"staging"}

# Test 4: Auth endpoint
curl -X POST http://localhost:8080/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"test"}' \
  # Expected: 200 OK, valid response or auth error

# Test 5: Database connectivity
curl http://localhost:8080/api/v1/schools \
  # Expected: 200 OK, JSON array or 401 Unauthorized
```

---

## 📊 POST-DEPLOYMENT VALIDATION

### Checklist

- [ ] Frontend loads without errors
- [ ] Backend API responds to health checks
- [ ] Authentication flow works
- [ ] Database queries execute successfully
- [ ] CORS headers configured correctly
- [ ] Rate limiting active
- [ ] Error logging functional
- [ ] Monitoring dashboards showing metrics

### Quick Validation Script

```powershell
# save as .deployment/validate-staging.ps1

$FRONTEND_URL = "https://school-erp-dev.firebaseapp.com"
$BACKEND_URL = "http://localhost:8080"

Write-Host "🔍 Starting Staging Validation..."
Write-Host ""

# Test Frontend
Write-Host "Frontend Tests:"
try {
  $response = Invoke-WebRequest -Uri $FRONTEND_URL -TimeoutSec 5
  Write-Host "✅ Frontend accessible (Status: $($response.StatusCode))"
} catch {
  Write-Host "❌ Frontend unreachable: $_"
}

# Test Backend Health
Write-Host "`nBackend Health Tests:"
try {
  $healthResponse = Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/health" -TimeoutSec 5
  Write-Host "✅ Backend health check passed: $healthResponse"
} catch {
  Write-Host "❌ Backend health check failed: $_"
}

Write-Host "`n✅ Validation complete!"
```

---

## 🔧 ENVIRONMENT VARIABLES (Create `.env.staging`)

```bash
# Server Configuration
NODE_ENV=staging
API_PORT=8080
LOG_LEVEL=info

# Firebase Configuration
FIREBASE_PROJECT_ID=school-erp-dev
FIREBASE_REGION=asia-south1

# BigQuery Configuration
GCP_PROJECT_ID=school-erp-dev
BIGQUERY_DATASET_ID=school_erp_staging

# Security
JWT_SECRET=your-staging-secret-key
SESSION_SECRET=your-staging-session-secret

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-staging-email@gmail.com
SMTP_PASSWORD=your-staging-app-password
```

---

## 📈 DEPLOYMENT TIMELINE

```
Expected Timeline:
├─ Frontend Firebase Deploy: 2-5 minutes
├─ Backend Docker Build: 3-5 minutes
├─ Backend Push to Registry: 2-3 minutes
└─ Backend Cloud Run Deploy: 2-3 minutes
                              ───────────
                              Total: 9-16 minutes
```

---

## ✅ SUCCESS CRITERIA

- [x] All builds completed without errors
- [ ] Frontend deployed to Firebase Hosting
- [ ] Backend deployed to Cloud Run Staging
- [ ] Both services responding to health checks
- [ ] Smoke tests passing
- [ ] Error logging visible in Cloud Logging
- [ ] Monitoring dashboards active
- [ ] Ready for manual/automated testing

---

## 🚨 ROLLBACK PROCEDURES

### Frontend Rollback
```bash
firebase hosting:rollback
```

### Backend Rollback
```bash
gcloud run services update-traffic school-erp-api-staging \
  --to-revisions PREVIOUS_REVISION=100
```

---

## 📞 SUPPORT

**Issues?** Check:
1. GCP authentication: `gcloud auth login`
2. Docker daemon: `docker ps`
3. Firebase auth: `firebase login`
4. Cloud Run limits: `gcloud run regions list`
5. Logs: `gcloud run logs read school-erp-api-staging --region asia-south1`

---

## ✨ NEXT STEPS (Post-Staging)

1. **Load Testing:** Run k6 load tests against staging
2. **Integration Tests:** Execute full QA test suite
3. **Security Scanning:** Run OWASP ZAP / Burp scans
4. **Performance Profiling:** Monitor p95/p99 latencies
5. **Production Readiness:** Gate 2 Review & Approval
6. **Production Deployment:** Tuesday 2 PM GO-LIVE

---

**Deployment Date:** April 10, 2026  
**Target Completion:** 7:50 AM IST  
**Status:** ✅ **READY FOR DEPLOYMENT**
