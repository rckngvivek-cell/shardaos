# PHASE 2 API DEPLOYMENT - READY TO EXECUTE
## Google Cloud Run Staging Deployment
### Week 7 Day 2 - DevOps Mission
**Status:** ✅ READY FOR EXECUTION  
**Deadline:** 2:00 PM IST (1:30 PM IST buffer)  
**Time Created:** April 10, 2026, ~10:50 AM IST  

---

## 📋 EXECUTIVE SUMMARY

**What:** Deploy Phase 2 School ERP API to Google Cloud Run staging environment  
**Where:** Google Cloud Run (us-central1 region)  
**Expected URLs:**
- Backend API: `https://exam-api-staging-[HASH].run.app`  
- Frontend Web: `https://exam-web-staging-[HASH].run.app`  

**Deployment Time:** 10-15 minutes (once gcloud CLI is available)  
**Status:** All code compiled, Dockerfiles ready, deployment scripts prepared  

**Blocking Issue:** gcloud CLI installation needs to complete  
**Resolution:** Follow quick setup below, then run deployment script  

---

## ⚡ QUICK START (5 MINUTES)

### Option 1: If You Already Have gcloud Installed
```powershell
cd c:\Users\vivek\OneDrive\Scans\files
.\deploy-to-cloudrun.ps1
```

### Option 2: Quick Manual Installation + Deploy
```powershell
# 1. Install gcloud (one-time, ~5 min)
#    Download: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe
#    Run installer → Accept defaults → Restart PowerShell

# 2. After restart, authenticate to GCP
gcloud auth login
gcloud config set project school-erp-dev
gcloud auth configure-docker gcr.io

# 3. Build and deploy images
cd c:\Users\vivek\OneDrive\Scans\files
.\deploy-to-cloudrun.ps1
```

**Expected Duration:** 10-15 minutes from this point  

---

## ✅ PRE-DEPLOYMENT CHECKLIST

### Prerequisites (5 minutes)
- [ ] Google Cloud SDK installed (`gcloud --version` works)
- [ ] Docker running (`docker ps` works)
- [ ] Authenticated to GCP project `school-erp-dev`
- [ ] Backend compiled to `apps/api/dist/`  ✅ DONE
- [ ] Frontend built to `apps/web/dist/`  ✅ DONE
- [ ] Dockerfiles in place  ✅ DONE

### If Missing Any Prerequisites
| Missing | Solution | Time |
|---------|----------|------|- | gcloud CLI | Download: https://cloud.google.com/sdk/docs/install#windows | 5 min |
| Docker | Download: https://docs.docker.com/desktop/install/windows | 5 min |
| GCP Auth | Run: `gcloud auth login` | 2 min |
| Dist folders | Run: `npm run build` in apps/api and apps/web | 5 min |

---

## 🚀 DEPLOYMENT EXECUTION

### Method 1: AUTOMATIC (Recommended - 1 Command)
```powershell
cd c:\Users\vivek\OneDrive\Scans\files
.\deploy-to-cloudrun.ps1
```

**What It Does:**
1. ✓ Checks prerequisites (gcloud, docker, dist folders)
2. ✓ Configures gcloud authentication
3. ✓ Builds backend Docker image
4. ✓ Builds frontend Docker image
5. ✓ Pushes both images to Google Container Registry
6. ✓ Deploys backend to Cloud Run
7. ✓ Deploys frontend to Cloud Run
8. ✓ Verifies health checks
9. ✓ Saves URLs to DEPLOYMENT_URLS.txt

**Expected Output:**
```
PHASE 2 DEPLOYMENT TO CLOUD RUN (STAGING)
...
✓ Backend service deployed
  URL: https://exam-api-staging-xxx123.run.app
✓ Frontend service deployed
  URL: https://exam-web-staging-xxx123.run.app
✓ Backend health check PASSED (HTTP 200)
✓ URLs saved to DEPLOYMENT_URLS.txt
```

**Time Required:** ~10-15 minutes  

---

### Method 2: MANUAL STEP-BY-STEP (If Script Fails)

#### Step 1: Set Variables
```powershell
$PROJECT_ID = "school-erp-dev"
$REGION = "us-central1"
$API_SERVICE_NAME = "exam-api-staging"
$WEB_SERVICE_NAME = "exam-web-staging"
$IMAGE_TAG = "v1.0.0"
$REGISTRY = "gcr.io"

cd c:\Users\vivek\OneDrive\Scans\files
```

#### Step 2: Configure GCP
```powershell
gcloud config set project $PROJECT_ID
gcloud auth configure-docker $REGISTRY
```

#### Step 3: Build Backend Image
```powershell
docker build `
  -f apps/api/Dockerfile.prod `
  -t "$REGISTRY/$PROJECT_ID/api:$IMAGE_TAG" `
  -t "$REGISTRY/$PROJECT_ID/api:latest" `
  .
```

#### Step 4: Build Frontend Image
```powershell
docker build `
  -f apps/web/Dockerfile.prod `
  -t "$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG" `
  -t "$REGISTRY/$PROJECT_ID/web:latest" `
  .
```

#### Step 5: Push Backend Image
```powershell
docker push "$REGISTRY/$PROJECT_ID/api:$IMAGE_TAG"
docker push "$REGISTRY/$PROJECT_ID/api:latest"
```

#### Step 6: Push Frontend Image
```powershell
docker push "$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
docker push "$REGISTRY/$PROJECT_ID/web:latest"
```

#### Step 7: Deploy Backend
```powershell
$BACKEND_URL = gcloud run deploy $API_SERVICE_NAME `
  --image="$REGISTRY/$PROJECT_ID/api:$IMAGE_TAG" `
  --region=$REGION `
  --platform=managed `
  --memory=512Mi `
  --cpu=2 `
  --timeout=30 `
  --max-instances=10 `
  --min-instances=1 `
  --port=8080 `
  --allow-unauthenticated `
  --set-env-vars="NODE_ENV=staging,FIREBASE_PROJECT_ID=$PROJECT_ID,LOG_LEVEL=debug" `
  --project=$PROJECT_ID `
  --format='value(status.url)'

Write-Host "Backend URL: $BACKEND_URL"
```

#### Step 8: Deploy Frontend
```powershell
$FRONTEND_URL = gcloud run deploy $WEB_SERVICE_NAME `
  --image="$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG" `
  --region=$REGION `
  --platform=managed `
  --memory=256Mi `
  --cpu=1 `
  --timeout=60 `
  --max-instances=5 `
  --min-instances=1 `
  --port=3000 `
  --allow-unauthenticated `
  --set-env-vars="VITE_API_URL=$BACKEND_URL/api/v1,NODE_ENV=staging" `
  --project=$PROJECT_ID `
  --format='value(status.url)'

Write-Host "Frontend URL: $FRONTEND_URL"
```

#### Step 9: Verify Health Checks
```powershell
# Test backend
(Invoke-WebRequest -Uri "$BACKEND_URL/health" -UseBasicParsing).StatusCode

# Test frontend
(Invoke-WebRequest -Uri "$FRONTEND_URL" -UseBasicParsing).StatusCode
```

---

## 🔍 VERIFICATION STEPS

After deployment completes, verify the services are working:

### 1. Health Check
```powershell
# Backend
(Invoke-WebRequest -Uri "https://exam-api-staging-xxx123.run.app/health").StatusCode
# Expected: 200

# Frontend
(Invoke-WebRequest -Uri "https://exam-web-staging-xxx123.run.app" -UseBasicParsing).StatusCode
# Expected: 200
```

### 2. API Endpoints
```powershell
# List exams
Invoke-RestMethod -Uri "https://exam-api-staging-xxx123.run.app/api/v1/exams"

# Get health info
Invoke-RestMethod -Uri "https://exam-api-staging-xxx123.run.app/health"
```

### 3. Cloud Run Dashboard
Open browser:
```
https://console.cloud.google.com/run?project=school-erp-dev
```

Should show two services:
- ✓ `exam-api-staging` (Backend)
- ✓ `exam-web-staging` (Frontend)

---

## 📊 DEPLOYMENT CONFIGURATION

### Backend Service (exam-api-staging)
```
Image:          gcr.io/school-erp-dev/api:v1.0.0
Port:           8080
Memory:         512 MB
CPU:            2
Min Instances:  1
Max Instances:  10 (auto-scale)
Timeout:        30s
Health Check:   /health
Environment:    NODE_ENV=staging
Database:       Firestore (school-erp-dev project)
```

### Frontend Service (exam-web-staging)
```
Image:          gcr.io/school-erp-dev/web:v1.0.0
Port:           3000
Memory:         256 MB
CPU:            1
Min Instances:  1
Max Instances:  5 (auto-scale)
Timeout:        60s
API Backend:    Proxied to backend service
Environment:    NODE_ENV=staging
```

---

## 🧪 TEST COMMANDS FOR DEMO (Agent 6)

### Test 1: Backend Health
```powershell
$url = "https://exam-api-staging-xxx.run.app/health"
Invoke-RestMethod -Uri $url | ConvertTo-Json
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-04-10T...",
  "database": "connected"
}
```

### Test 2: Frontend Load
Open in browser:
```
https://exam-web-staging-xxx.run.app
```

**Expected:** React UI loads, no CORS errors

### Test 3: API Call
```powershell
$url = "https://exam-api-staging-xxx.run.app/api/v1/exams"
$response = Invoke-RestMethod -Uri $url -Headers @{ "Accept" = "application/json" }
$response | ConvertTo-Json | Out-Host
```

**Expected:** JSON array of exams or empty array

---

## 🛠️ TROUBLESHOOTING

### Issue: "gcloud not found"
**Solution:**
1. Download: https://cloud.google.com/sdk/docs/install#windows
2. Run installer
3. Restart PowerShell
4. Run: `gcloud --version`

### Issue: "Docker build fails"
**Solution:**
1. Check Docker is running: `docker ps`
2. Check dist folders exist:
   - `Test-Path apps/api/dist/`
   - `Test-Path apps/web/dist/`
3. If missing, rebuild: `npm run build` in each folder
4. Retry build command

### Issue: "Authentication failed"
**Solution:**
1. Authenticate: `gcloud auth login`
2. Set project: `gcloud config set project school-erp-dev`
3. Configure Docker: `gcloud auth configure-docker gcr.io`
4. Retry deployment

### Issue: "Deployment times out"
**Solution:**
1. Check logs: `gcloud run logs read exam-api-staging --follow`
2. Verify image pushed: `gcloud container images list --project=school-erp-dev`
3. Check service: `gcloud run services describe exam-api-staging --region=us-central1`

### Issue: "Health check fails after deployment"
**Solution:**
1. Service is likely still starting (takes ~30 seconds)
2. Wait 1-2 minutes and retry
3. Check logs: `gcloud run logs read exam-api-staging --limit=50`
4. Common issues:
   - Firestore not initialized
   - Environment variables not set correctly
   - Port not exposed correctly

---

## 📈 MONITORING & LOGS

### View Real-Time Logs
```powershell
# Backend logs
gcloud run logs read exam-api-staging --follow --region=us-central1

# Frontend logs
gcloud run logs read exam-web-staging --follow --region=us-central1

# All errors
gcloud logging read "severity=ERROR" --limit=10 --project=school-erp-dev
```

### Check Service Status
```powershell
# Backend status
gcloud run services describe exam-api-staging --region=us-central1 --project=school-erp-dev

# Frontend status
gcloud run services describe exam-web-staging --region=us-central1 --project=school-erp-dev
```

### View Metrics
Open: https://console.cloud.google.com/monitoring?project=school-erp-dev

---

## ↩️ ROLLBACK PROCEDURES

### Rollback to Previous Version
```powershell
# Backend - revert to latest
gcloud run deploy exam-api-staging `
  --image=gcr.io/school-erp-dev/api:latest `
  --region=us-central1 `
  --project=school-erp-dev

# Frontend - revert to latest
gcloud run deploy exam-web-staging `
  --image=gcr.io/school-erp-dev/web:latest `
  --region=us-central1 `
  --project=school-erp-dev
```

### Delete Services (if needed)
```powershell
gcloud run services delete exam-api-staging --region=us-central1 --quiet
gcloud run services delete exam-web-staging --region=us-central1 --quiet
```

---

## 📦 DEPLOYMENT ARTIFACTS

### Files Ready to Deploy
```
✅ apps/api/Dockerfile.prod          - Backend production image
✅ apps/api/dist/                    - Compiled backend (index.js, app.js, routes/*.js)
✅ apps/web/Dockerfile.prod          - Frontend production image
✅ apps/web/dist/                    - Built frontend (index.html, assets/*, etc)
✅ apps/web/nginx.conf               - Nginx SPA routing config
✅ deploy-to-cloudrun.ps1            - Automated deployment script (main)
✅ deploy-to-cloudrun.sh             - Alternative bash script (for Linux/Mac)
✅ DEPLOYMENT_QUICK_START.md         - 1-page quick reference
✅ DEPLOYMENT_URLS.md                - Will be populated during deployment
```

### Environment Configuration
```
Backend Environment Variables:
  NODE_ENV=staging
  FIREBASE_PROJECT_ID=school-erp-dev
  LOG_LEVEL=debug
  PORT=8080

Frontend Environment Variables:
  VITE_API_URL={BACKEND_URL}/api/v1
  NODE_ENV=staging
```

---

## ⏰ TIMELINE TO DEMO (2:00 PM IST)

| Time | Task | Duration |
|------|------|----------|
| 10:50 AM | Start: Run deployment script | - |
| 11:00 AM | Prerequisites check | 1 min |
| 11:01 AM | Build backend image | 3 min |
| 11:04 AM | Build frontend image | 3 min |
| 11:07 AM | Push images to GCR | 5 min |
| 11:12 AM | Deploy backend to Cloud Run | 3 min |
| 11:15 AM | Deploy frontend to Cloud Run | 2 min |
| 11:17 AM | Verify health checks | 2 min |
| 11:19 AM | **COMPLETE - READY FOR DEMO** | - |
| 11:20 AM - 4:00 PM | Buffer/monitoring | - |
| 2:00 PM | **AGENT 6 DEMO STARTS** | ✅ READY |

**Buffer:** 2 hours 40 minutes (plenty of time for troubleshooting if needed)

---

## 🎯 DEMO SCRIPT FOR AGENT 6 (5 Minutes)

### Setup (1 min)
1. Have these URLs ready:
   - Backend: `https://exam-api-staging-[HASH].run.app`
   - Frontend: `https://exam-web-staging-[HASH].run.app`

### Demo Flow (4 min)

**Step 1: Health Check (30 sec)**
```
Open browser: [BACKEND_URL]/health
Expected: JSON response with "status": "healthy"
Shows: Backend and database are connected
```

**Step 2: Frontend Load (30 sec)**
```
Open browser: [FRONTEND_URL]
Expected: React UI loads, dashboard visible
Shows: Frontend successfully deployed and running
```

**Step 3: API Call (30 sec)**
```
PowerShell: Invoke-RestMethod -Uri "[BACKEND_URL]/api/v1/exams"
Expected: JSON array (exams data)
Shows: API accessible and returning data
```

**Step 4: Browser DevTools (30 sec)**
```
Open DevTools (F12) → Network tab
Refresh frontend
Expected: API calls to /api/v1/* endpoints visible
Shows: Frontend successfully calling backend
```

**Step 5: Create Test Data (90 sec)**
```
Via API:
POST [BACKEND_URL]/api/v1/exams
Body: { "name": "Test Exam", "schoolId": "test-school" }

Refresh frontend
Expected: New exam appears in UI
Shows: Full CRUD functionality working
```

---

## ✨ SUCCESS INDICATORS

### ✅ Deployment Successful When:
- [ ] Both services deployed without errors
- [ ] Backend health check returns HTTP 200
- [ ] Frontend loads in browser without errors
- [ ] API endpoints respond with data
- [ ] No CORS errors in browser console
- [ ] URLs saved to DEPLOYMENT_URLS.txt
- [ ] Services visible in Cloud Run dashboard

### ⚠️ Warning Signs:
- Deployment takes >30 minutes (likely stuck)
- Health check returns 500 errors (check logs)
- Frontend returns 404 (Nginx routing issue)
- API returns 502 (backend not starting)

---

## 📞 SUPPORT CONTACTS

### Deployment Issues
1. Check logs: `gcloud run logs read exam-api-staging`
2. Verify prerequisites installed
3. Ensure GCP project access

### Database Issues  
1. Check Firestore console: https://console.firebase.google.com
2. Verify security rules active
3. Check database has test data

### Monitoring
1. Cloud Run Dashboard: https://console.cloud.google.com/run
2. Cloud Logging: https://console.cloud.google.com/logs

---

## 📝 NEXT STEPS

### IMMEDIATE (Now)
1. [ ] Verify all prerequisites installed
2. [ ] Run deployment script: `.\deploy-to-cloudrun.ps1`
3. [ ] Wait 10-15 minutes for completion
4. [ ] Verify health checks passing
5. [ ] Save URLs to DEPLOYMENT_URLS.txt

### BEFORE DEMO (1:00 PM)
1. [ ] Test all endpoints manually
2. [ ] Verify no error logs
3. [ ] Prepare demo script
4. [ ] Share URLs with Agent 6

### DURING DEMO (2:00 PM)
1. [ ] Have Cloud Run dashboard open
2. [ ] Monitor service logs
3. [ ] Be ready for troubleshooting
4. [ ] Record demo for team

### POST-DEMO
1. [ ] Collect feedback
2. [ ] Update documentation
3. [ ] Plan for production deployment
4. [ ] Analyze performance metrics

---

## 🎓 QUICK REFERENCE: FILE LOCATIONS

| Resource | Location |
|----------|----------|
| Backend Code | `apps/api/src/` |
| Backend Build | `apps/api/dist/` |
| Frontend Code | `apps/web/src/` |
| Frontend Build | `apps/web/dist/` |
| Docker Images | Build Dockerfile.prod files |
| Deployment Script | `deploy-to-cloudrun.ps1` |
| Configuration | `apps/api/.env.staging` |

---

## 🔐 SECURITY NOTES (STAGING ONLY)

**⚠️ Current Configuration: PUBLIC ACCESS**

```
- Backend: allow-unauthenticated ✓
- Frontend: allow-unauthenticated ✓
- HTTPS: Auto-enabled by Cloud Run ✓
- Database: Firestore auth rules active ✓
```

**For Production:** Restrict to authenticated users only

---

**Document Generated:** April 10, 2026  
**Status:** ✅ READY FOR EXECUTION  
**Target Demo:** 2:00 PM IST  
**Estimated Duration:** 10-15 minutes  

---

## 🚀 TO START DEPLOYMENT:

### RUN THIS NOW:
```powershell
cd c:\Users\vivek\OneDrive\Scans\files
.\deploy-to-cloudrun.ps1
```

**You will have the staging URLs in ~15 minutes!**
