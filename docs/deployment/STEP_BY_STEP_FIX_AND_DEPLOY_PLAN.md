# ⚙️ STEP-BY-STEP FIX PLAN - From Code to Production
**Get 13,641 LOC of written code working in 1 day**

**Status:** Code exists ✅ | Build broken ❌ | Need 4-6 hours to deploy

---

## PHASE 1: FIX BUILD SYSTEM (2-3 hours)

### Step 1: Verify Node.js & npm
```powershell
# Check versions
node --version  # Should be 18+
npm --version   # Should be 9+
npm list -g npm # Verify npm is global

# If old, install LTS
# See your terminal: "node --version" returned (version info)
```

### Step 2: Clean Install Dependencies
```powershell
cd "c:\Users\vivek\OneDrive\Scans\files"

# Remove corrupted dependencies
rm -r node_modules
rm package-lock.json

# Fresh install
npm install --legacy-peer-deps

# Install each workspace
npm --workspace=@school-erp/api install
npm --workspace=@school-erp/web install
```

### Step 3: Build Shared Library
```powershell
# Backend API needs shared types
npm --workspace=@school-erp/shared run build

# Should complete without errors
# Check that dist/ is created
ls apps/shared/dist/
```

### Step 4: Compile Backend API
```powershell
cd "c:\Users\vivek\OneDrive\Scans\files\apps\api"

# Build
npm run build

# Verify dist/ exists
ls dist/

# Should show:
# - dist/index.js
# - dist/app.js  
# - dist/routes/
# - dist/services/
# etc.
```

**✅ Expected Output:**
```
Built successfully!
dist/index.js (size: 200KB+)
dist/types/
dist/services/
```

**❌ If Fails:**
Check for:
- TypeScript errors (show in terminal)
- Missing type definitions
- Import path issues
- Syntax errors

---

## PHASE 2: RUN LOCALLY (30 mins)

### Step 5: Create .env file
```bash
cd "c:\Users\vivek\OneDrive\Scans\files\apps\api"

# Create .env
cat > .env << 'EOF'
NODE_ENV=development
PORT=8080
STORAGE_DRIVER=mock
AUTH_MODE=firebase
FIREBASE_PROJECT_ID=school-erp-dev
EOF
```

### Step 6: Start API Locally
```powershell
cd "c:\Users\vivek\OneDrive\Scans\files\apps\api"

# Start development server
npm run dev

# Expected output:
# 🚀 School ERP API running on http://localhost:8080/api/v1
#    Environment: development
#    Mode: Standalone (core API only)
```

### Step 7: Test API Endpoints
**In NEW PowerShell window:**
```powershell
# Test health endpoint
Invoke-WebRequest -Uri "http://localhost:8080/api/v1/health" -Method GET

# Should return:
# Status: 200
# Response: { "status": "ok", "timestamp": "2026-04-10T..." }

# Test attendance endpoint
$body = @{
    studentId = "student-001"
    date = "2026-04-10"
    status = "present"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:8080/api/v1/attendance/mark" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

# Should return 200 with attendance record
```

**✅ Success Indicators:**
- `/health` endpoint returns 200
- `/attendance/mark` accepts POST
- API logs show requests
- No TypeScript errors

---

## PHASE 3: BUILD DOCKER IMAGE (1 hour)

### Step 8: Create Production .env
```bash
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=8080
STORAGE_DRIVER=firestore
AUTH_MODE=firebase
FIREBASE_PROJECT_ID=school-erp-prod
GCP_PROJECT_ID=your-gcp-project
EOF
```

### Step 9: Build Docker Image
```powershell
cd "c:\Users\vivek\OneDrive\Scans\files"

# Build image
docker build -f apps/api/Dockerfile.prod `
  -t school-erp-api:latest `
  -t school-erp-api:v0.1.0 `
  .

# Verify image size
docker images | grep school-erp-api

# Should show:
# school-erp-api  latest   (200-300MB)
```

### Step 10: Test Docker Image
```powershell
# Run container locally
docker run -p 8080:8080 `
  -e NODE_ENV=development `
  -e PORT=8080 `
  -e STORAGE_DRIVER=mock `
  school-erp-api:latest

# Should show:
# 🚀 School ERP API running on http://localhost:8080/api/v1
```

**Test from another terminal:**
```powershell
curl http://localhost:8080/api/v1/health

# Should return 200
```

---

## PHASE 4: DEPLOY TO GOOGLE CLOUD RUN (1-2 hours)

### Step 11: Setup GCP Authentication
```powershell
# Install GCloud SDK (if not installed)
winget install Google.CloudSDK

# Authenticate
gcloud auth login

# Set project
gcloud config set project school-erp-prod

# Verify
gcloud config get-value project
```

### Step 12: Push to Cloud Registry
```powershell
# Configure Docker for GCP
gcloud auth configure-docker

# Push image
gcloud builds submit `
  --tag gcr.io/school-erp-prod/api:latest `
  --dockerfile=apps/api/Dockerfile.prod `
  .

# Should show:
# Building [=========================] 100%
# Successfully pushed image in X seconds
```

### Step 13: Deploy to Cloud Run
```powershell
gcloud run deploy school-erp-api `
  --image gcr.io/school-erp-prod/api:latest `
  --platform managed `
  --region asia-south1 `
  --memory 512Mi `
  --cpu 1 `
  --timeout 300 `
  --set-env-vars NODE_ENV=production,STORAGE_DRIVER=firestore,AUTH_MODE=firebase `
  --allow-unauthenticated

# Expected output:
# Service [school-erp-api] revision [school-erp-api-00001] has been deployed
# URL: https://school-erp-api-xxxxx.a.run.app
```

### Step 14: Verify Production Deployment
```powershell
# Get the URL from previous output
$API_URL = "https://school-erp-api-xxxxx.a.run.app"

# Test health
Invoke-WebRequest -Uri "$API_URL/api/v1/health"

# Should return 200 OK
```

---

## PHASE 5: DEPLOY FRONTEND (30 mins - optional for MVP)

### Step 15: Build Frontend
```powershell
cd "c:\Users\vivek\OneDrive\Scans\files\apps\web"

npm run build

# Should create dist/
ls dist/
```

### Step 16: Deploy to Cloud Run or Firebase Hosting
```powershell
# Option A: Firebase Hosting
firebase deploy --project school-erp-prod

# Option B: Cloud Run
gcloud run deploy school-erp-web `
  --source apps/web/dist
```

---

## PHASE 6: LIVE SMOKE TESTS (1 hour)

### Step 17: Test Core Workflows

**Test 1: Health Check**
```powershell
$API_URL = "https://school-erp-api-xxxxx.a.run.app"
Invoke-WebRequest "$API_URL/api/v1/health"
# ✅ Should return 200
```

**Test 2: Register School**
```powershell
$body = @{
    name = "Test School"
    location = "Mumbai"
    capacity = 500
} | ConvertTo-Json

$res = Invoke-WebRequest "$API_URL/api/v1/schools" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body

$res.StatusCode
# ✅ Should return 201
```

**Test 3: Add Students**
```powershell
$body = @{
    firstName = "Raj"
    lastName = "Kumar"
    rollNo = "001"
    schoolId = "school-123"
} | ConvertTo-Json

Invoke-WebRequest "$API_URL/api/v1/students" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
# ✅ Should return 201
```

**Test 4: Mark Attendance**
```powershell
$body = @{
    studentId = "student-001"
    date = "2026-04-10"
    status = "present"
} | ConvertTo-Json

Invoke-WebRequest "$API_URL/api/v1/attendance/mark" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
# ✅ Should return 200
```

**Test 5: Get Stats**
```powershell
Invoke-WebRequest "$API_URL/api/v1/attendance/stats"
# ✅ Should return 200 with statistics
```

### Step 18: Verify Firestore Data
```powershell
# Go to Firebase Console
# https://console.firebase.google.com/project/school-erp-prod

# Check collections:
# ✅ students (has 1+ document)
# ✅ attendance (has 1+ document)
# ✅ schools (has 1+ document)
```

---

## TROUBLESHOOTING

### Build Fails: "Cannot find module"
```
Solution:
npm install
npm run build --workspace=@school-erp/shared
npm run build
```

### API Fails: "ENOENT: no such file or directory"
```
Solution:
1. Check dist/ exists: ls dist/
2. Verify compiled files: ls dist/index.js
3. Check .env file exists
```

### Docker Build Fails
```
Solution:
1. npm run build first
2. Check Dockerfile paths
3. Verify .dockerignore excludes node_modules
```

### Cloud Run 500 Error
```
Solution:
1. Check service account permissions
2. Verify Firestore database exists
3. Check Cloud Logging for errors:
   gcloud run logs read school-erp-api --limit 50
```

### Firestore Connection Fails
```
Solution:
1. Verify credentials: echo $env:GOOGLE_APPLICATION_CREDENTIALS
2. Check project ID: gcloud config get-value project
3. Verify service account has Firestore access
```

---

## TIMELINE

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Fix build system | 2-3 hrs | ⏳ TODO |
| 2 | Run locally | 30 min | ⏳ TODO |
| 3 | Docker build | 1 hr | ⏳ TODO |
| 4 | GCP deployment | 1-2 hrs | ⏳ TODO |
| 5 | Frontend deploy | 30 min | ⏳ OPTIONAL |
| 6 | Smoke tests | 1 hr | ⏳ TODO |
| **TOTAL** | **From code to production** | **6-8 hours** | **Today possible** |

---

## SUCCESS CRITERIA

✅ npm run build → Success (no errors)  
✅ npm run dev → Server starts on 8080  
✅ curl /health → 200 OK  
✅ Docker build → Image created  
✅ Cloud Run deploy → URL available  
✅ https://api.yourdomain.com/health → 200 OK  
✅ Create school → 201 response  
✅ Mark attendance → 200 response  
✅ Firestore data → Records created  

---

**After completing all steps above:**
- ✅ API live in production
- ✅ 13,641 LOC deployed
- ✅ Real students can be marked
- ✅ SMS notifications working
- ✅ Teachers + Parents can use system
- ✅ Revenue-generating deployment
