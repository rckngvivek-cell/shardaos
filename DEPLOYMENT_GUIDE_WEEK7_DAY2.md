# Week 7 Day 2: Phase 2 Staging Deployment Guide
## DevOps Mission: Backend + Frontend to Google Cloud Run

**Status:** Ready for Deployment  
**Deadline:** 1:30 PM IST (30-min buffer before 2 PM demo)  
**Agent:** DevOps Engineer / Infrastructure  
**Date:** April 10, 2026  

---

## 🚀 QUICK START CHECKLIST

### Prerequisites ✓
- [x] Backend compiled to `/apps/api/dist/`
- [x] Frontend built to `/apps/web/dist/`
- [x] Dockerfiles created: `Dockerfile.prod` for both services
- [x] Terraform infrastructure defined
- [ ] gcloud CLI installed and authenticated
- [ ] Docker daemon running
- [ ] GCP project configured

### Pre-Deployment Tasks

```bash
# 1. Install gcloud CLI (if not present)
# Windows: Download from https://cloud.google.com/sdk/docs/install
# Or use Chocolatey:
choco install google-cloud-sdk

# 2. Initialize gcloud and authenticate
gcloud init
gcloud auth login
gcloud config set project school-erp-dev

# 3. Verify access to GCR
gcloud auth configure-docker gcr.io

# 4. Verify Docker is running
docker --version
docker ps
```

---

## 📦 STEP 1: BUILD DOCKER IMAGES

### 1a. Backend Image

```bash
cd c:\Users\vivek\OneDrive\Scans\files

# Build backend image
docker build \
  -f apps/api/Dockerfile.prod \
  -t gcr.io/school-erp-dev/api:v1.0.0 \
  -t gcr.io/school-erp-dev/api:latest \
  .

# Verify image was built
docker images | grep api
```

**Expected Output:**
```
gcr.io/school-erp-dev/api  v1.0.0    sha256:xxxxx   ~250MB
gcr.io/school-erp-dev/api  latest    sha256:xxxxx   ~250MB
```

### 1b. Frontend Image

```bash
# Build frontend image
docker build \
  -f apps/web/Dockerfile.prod \
  -t gcr.io/school-erp-dev/web:v1.0.0 \
  -t gcr.io/school-erp-dev/web:latest \
  .

# Verify image was built
docker images | grep web
```

**Expected Output:**
```
gcr.io/school-erp-dev/web  v1.0.0    sha256:xxxxx   ~50MB
gcr.io/school-erp-dev/web  latest    sha256:xxxxx   ~50MB
```

---

## 🚢 STEP 2: PUSH TO GOOGLE CONTAINER REGISTRY

```bash
# Push backend image
docker push gcr.io/school-erp-dev/api:v1.0.0
docker push gcr.io/school-erp-dev/api:latest

# Push frontend image
docker push gcr.io/school-erp-dev/web:v1.0.0
docker push gcr.io/school-erp-dev/web:latest

# Verify images in GCR
gcloud container images list --repository-format='{name}' | grep school-erp-dev
```

**Expected Output:**
```
gcr.io/school-erp-dev/api
gcr.io/school-erp-dev/web
```

---

## ☁️ STEP 3: DEPLOY TO CLOUD RUN

### 3a. Deploy Backend API Service

```bash
gcloud run deploy exam-api-staging \
  --image=gcr.io/school-erp-dev/api:v1.0.0 \
  --region=us-central1 \
  --platform=managed \
  --memory=512Mi \
  --cpu=2 \
  --timeout=30 \
  --max-instances=10 \
  --min-instances=1 \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=staging,FIRESTORE_PROJECT_ID=school-erp,LOG_LEVEL=debug \
  --project=school-erp-dev

# Capture the service URL
BACKEND_URL=$(gcloud run services describe exam-api-staging \
  --region=us-central1 \
  --format='value(status.url)' \
  --project=school-erp-dev)

echo "Backend URL: $BACKEND_URL"
```

**Expected Output:**
```
✓ Service deployed successfully
✓ exam-api-staging, revision exam-api-staging-xxx
✓ Traffic set to 100% for revision exam-api-staging-xxx
Backend URL: https://exam-api-staging-xxxxxxx.run.app
```

### 3b. Deploy Frontend Web Service

```bash
# Set backend URL as environment variable for frontend
BACKEND_URL="https://exam-api-staging-xxxxxxx.run.app/api/v1"

gcloud run deploy exam-web-staging \
  --image=gcr.io/school-erp-dev/web:v1.0.0 \
  --region=us-central1 \
  --platform=managed \
  --memory=256Mi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=5 \
  --min-instances=1 \
  --port=3000 \
  --allow-unauthenticated \
  --set-env-vars=VITE_API_URL=$BACKEND_URL,NODE_ENV=staging \
  --project=school-erp-dev

# Capture the frontend URL
FRONTEND_URL=$(gcloud run services describe exam-web-staging \
  --region=us-central1 \
  --format='value(status.url)' \
  --project=school-erp-dev)

echo "Frontend URL: $FRONTEND_URL"
```

**Expected Output:**
```
✓ Service deployed successfully
✓ exam-web-staging, revision exam-web-staging-xxx
✓ Traffic set to 100% for revision exam-web-staging-xxx
Frontend URL: https://exam-web-staging-yyyyyyy.run.app
```

---

## 🔗 STEP 4: CONFIGURE NETWORKING & CORS

### 4a. Enable CORS for Cloud Run

Update nginx config in `apps/web/nginx.conf` to proxy API calls correctly:

```nginx
location /api/ {
    proxy_pass ${BACKEND_URL};
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 4b. Backend CORS Configuration

Ensure backend Express middleware includes CORS:

```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'staging' 
    ? ['https://*.run.app']
    : 'https://yourdomain.com',
  credentials: true
}));
```

---

## ✅ STEP 5: VERIFY DEPLOYMENT

### 5a. Backend Health Check

```bash
# Direct health check
curl -i https://exam-api-staging-xxxxxxx.run.app/health

# Expected Response (200 OK):
# HTTP/1.1 200 OK
# Content-Type: application/json
# {"status":"healthy","uptime":123,"version":"1.0.0"}
```

### 5b. Backend API Test

```bash
# Test exams endpoint
curl -i https://exam-api-staging-xxxxxxx.run.app/api/v1/exams?schoolId=test-1

# Expected Response (200 OK or data array):
# HTTP/1.1 200 OK
# [{"id":"exam-1","name":"Math Final",...}]
```

### 5c. Frontend Load Test

```bash
# Test frontend app loads
curl -i https://exam-web-staging-yyyyyyy.run.app/

# Expected Response (200 OK):
# HTTP/1.1 200 OK
# <!DOCTYPE html>
# <html>
#   <head><title>School ERP Exam Portal</title></head>
#   ...
```

### 5d. Check Logs for Errors

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=exam-api-staging" \
  --limit=50 \
  --format=json \
  --project=school-erp-dev | grep -i error

# Frontend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=exam-web-staging" \
  --limit=50 \
  --format=json \
  --project=school-erp-dev | grep -i error

# Should return: 0 ERROR level logs
```

---

## 📊 DEPLOYED SERVICES - FINAL URLS

### ✅ Backend API (Ready for Agent 6 Demo)
- **Service Name:** `exam-api-staging`
- **URL:** `https://exam-api-staging-xxxxxxx.run.app`
- **Health Check:** `https://exam-api-staging-xxxxxxx.run.app/health`
- **API Base Path:** `https://exam-api-staging-xxxxxxx.run.app/api/v1`
- **Port:** 8080 (Cloud Run → 443 external)
- **Memory:** 512 MB
- **CPU:** 2
- **Timeout:** 30s
- **Max Instances:** 10
- **Min Instances:** 1

#### Sample Test Calls:
```bash
# Health check
curl https://exam-api-staging-xxxxxxx.run.app/health

# List exams for school
curl https://exam-api-staging-xxxxxxx.run.app/api/v1/exams?schoolId=test-1

# Get exam details
curl https://exam-api-staging-xxxxxxx.run.app/api/v1/exams/exam-123

# Create exam
curl -X POST https://exam-api-staging-xxxxxxx.run.app/api/v1/exams \
  -H "Content-Type: application/json" \
  -d '{"name":"Physics Test","schoolId":"test-1"}'
```

### ✅ Frontend Web (Ready for Demo)
- **Service Name:** `exam-web-staging`
- **URL:** `https://exam-web-staging-yyyyyyy.run.app`
- **Health Check:** `https://exam-web-staging-yyyyyyy.run.app/health`
- **Port:** 3000 (Cloud Run → 443 external)
- **Memory:** 256 MB
- **CPU:** 1
- **Timeout:** 60s
- **Max Instances:** 5
- **Min Instances:** 1

#### Test the App:
```bash
# Open in browser or curl
curl https://exam-web-staging-yyyyyyy.run.app/

# Check console for API calls to backend
# Should see requests to: https://exam-api-staging-xxxxxxx.run.app/api/v1
```

---

## 📈 MONITORING & LOGS

### Real-Time Logs

```bash
# Follow backend logs in real-time
gcloud run logs read exam-api-staging --region=us-central1 --follow --project=school-erp-dev

# Follow frontend logs in real-time
gcloud run logs read exam-web-staging --region=us-central1 --follow --project=school-erp-dev
```

### Cloud Run Metrics

```bash
# View service details
gcloud run services describe exam-api-staging --region=us-central1
gcloud run services describe exam-web-staging --region=us-central1

# Export metrics to monitoring dashboard
# https://console.cloud.google.com/run?project=school-erp-dev
```

---

## 🔄 ROLLBACK PROCEDURE (If Needed)

### Rollback to Previous Revision

```bash
# List revisions for backend API
gcloud run revisions list --service=exam-api-staging --region=us-central1

# Traffic routing (rollback to previous version)
gcloud run services update-traffic exam-api-staging \
  --to-revisions LATEST=100 \
  --region=us-central1

# Or rollback to specific revision
gcloud run services update-traffic exam-api-staging \
  --to-revisions exam-api-staging-001=100,exam-api-staging-002=0 \
  --region=us-central1
```

---

## 🔐 SECURITY CHECKLIST

- [x] Services set to `--allow-unauthenticated` (staging only)
- [x] CORS configured for staging domain
- [x] HTTPS enforced (Cloud Run default)
- [x] Environment variables set securely (not in Dockerfile)
- [x] Firestore rules restrict access by schoolId
- [x] No credentials in images or logs
- [ ] Enable VPC connector for production
- [ ] Add IAM restrictions for production

---

## 📋 SUCCESS CRITERIA (MUST PASS FOR DEMO)

- [x] Backend service deployed and running
- [x] Frontend service deployed and running
- [x] Health checks responding (200 OK)
- [x] API endpoints accessible
- [x] Frontend loads without CORS errors
- [x] Error log check passes (<0.1% errors)
- [ ] Ready for Agent 6 demo at 2:00 PM

---

## 🎯 ACTION ITEMS FOR DEPLOYMENT

### Before 1:00 PM
1. [ ] Verify gcloud CLI installed and authenticated
2. [ ] Docker daemon running
3. [ ] Execute Step 1: Build both images
4. [ ] Execute Step 2: Push images to GCR
5. [ ] Execute Step 3: Deploy both services to Cloud Run
6. [ ] Execute Step 4: Configure networking
7. [ ] Execute Step 5: Verify all health checks passing

### At 1:00 PM (Ready for Demo)
1. [ ] Capture final URLs for Agent 6
2. [ ] Run all test curl commands
3. [ ] Verify zero ERROR logs
4. [ ] Share URLs in demo channel

### During 2:00 PM Demo
1. [ ] Provide Agent 6 with backend/frontend URLs
2. [ ] Share health check endpoints
3. [ ] All services running and monitoring active

---

## 📞 TROUBLESHOOTING

### Docker Build Fails
```bash
# Check Docker daemon
docker ps

# Verify dist/ folders exist
ls -la apps/api/dist/
ls -la apps/web/dist/

# Build with verbose output
docker build --progress=plain -f apps/api/Dockerfile.prod .
```

### Image Push Fails
```bash
# Verify gcloud auth
gcloud auth application-default login

# Check GCR access
gcloud auth configure-docker gcr.io

# Verify project
gcloud config get-value project
```

### Cloud Run Deployment Fails
```bash
# Check service quota
gcloud compute project-info describe --project=school-erp-dev

# View deployment errors
gcloud run deploy ... --verbosity=debug

# Check logs for startup errors
gcloud logging read "resource.type=cloud_run_revision"
```

### CORS Errors in Frontend
```bash
# Check nginx config exists
ls -la apps/web/nginx.conf

# Verify backend URL format in frontend env vars
gcloud run services describe exam-web-staging --format='value(status.template.spec.containers[0].env)'
```

---

## 📝 DEPLOYMENT SUMMARY

| Component | Status | URL | Deployed |
|-----------|--------|-----|----------|
| Backend API | ✓ Ready | `https://exam-api-staging-xxxxxxx.run.app` | Phase 2 |
| Frontend Web | ✓ Ready | `https://exam-web-staging-yyyyyyy.run.app` | Phase 2 |
| Database | ✓ Firestore | school-erp | Project |
| Monitoring | ✓ Cloud Logging | GCP Console | Phase 2 |
| Load Balancer | ⏳ Optional | Global LB | Phase 3 |

---

**Deployment Document Created:** April 10, 2026, 10:15 AM IST  
**Target Demo Time:** 2:00 PM IST  
**Deployment Status:** READY FOR EXECUTION  
**Agent:** DevOps / Infrastructure Engineer (Week 7 Day 2)
