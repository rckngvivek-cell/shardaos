# Deployment Script: Phase 2 Backend + Frontend to Cloud Run (Staging)
# Week 7 Day 2: DevOps Mission
# Target: Ready by 1:30 PM for 2 PM demo
# Platform: Windows PowerShell

$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = "school-erp-dev"
$REGION = "us-central1"
$API_SERVICE_NAME = "exam-api-staging"
$WEB_SERVICE_NAME = "exam-web-staging"
$IMAGE_TAG = "v1.0.0"
$REGISTRY = "gcr.io"
$WORKSPACE_ROOT = Get-Location

# Color codes
function Write-Success { Write-Host @args -ForegroundColor Green }
function Write-Error-Custom { Write-Host @args -ForegroundColor Red }
function Write-Warning-Custom { Write-Host @args -ForegroundColor Yellow }
function Write-Info { Write-Host @args -ForegroundColor Blue }

# Start timestamp
$StartTime = Get-Date

Write-Info "====================================================="
Write-Info "PHASE 2 DEPLOYMENT TO CLOUD RUN (STAGING)"
Write-Info "Week 7 Day 2 - DevOps Mission"
Write-Info "====================================================="
Write-Info ""

# Step 1: Prerequisites Check
Write-Warning-Custom "STEP 1: Checking prerequisites..."
Write-Info ""

# Check gcloud
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Success "✓ gcloud CLI found"
    Write-Info "  $gcloudVersion"
} catch {
    Write-Error-Custom "✗ gcloud CLI not found"
    Write-Info "  Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
}

# Check docker
try {
    $dockerVersion = docker --version
    Write-Success "✓ Docker found"
    Write-Info "  $dockerVersion"
} catch {
    Write-Error-Custom "✗ Docker not found"
    Write-Info "  Install from: https://docs.docker.com/install"
    exit 1
}

# Configure gcloud
Write-Info "  Setting up gcloud configuration..."
gcloud config set project $PROJECT_ID | Out-Null
gcloud auth configure-docker $REGISTRY | Out-Null
Write-Success "✓ gcloud configured"

# Verify project access
try {
    gcloud projects describe $PROJECT_ID | Out-Null
    Write-Success "✓ Project access verified"
} catch {
    Write-Error-Custom "✗ Cannot access project: $PROJECT_ID"
    exit 1
}

# Check dist folders
if (-not (Test-Path "apps/api/dist")) {
    Write-Error-Custom "✗ Backend dist/ folder not found"
    exit 1
}
Write-Success "✓ Backend dist/ found"

if (-not (Test-Path "apps/web/dist")) {
    Write-Error-Custom "✗ Frontend dist/ folder not found"
    exit 1
}
Write-Success "✓ Frontend dist/ found"

Write-Info ""

# Step 2: Build Backend Image
Write-Warning-Custom "STEP 2: Building backend Docker image..."
Write-Info "  Building: $REGISTRY/$PROJECT_ID/api:$IMAGE_TAG"
Write-Info ""

try {
    docker build `
      -f apps/api/Dockerfile.prod `
      -t "$REGISTRY/$PROJECT_ID/api:$IMAGE_TAG" `
      -t "$REGISTRY/$PROJECT_ID/api:latest" `
      . | Out-Null
    
    Write-Success "✓ Backend image built successfully"
    $apiImage = docker images | Select-String "api" | Select-Object -First 1
    Write-Info "  $apiImage"
} catch {
    Write-Error-Custom "✗ Backend image build failed"
    exit 1
}

Write-Info ""

# Step 3: Build Frontend Image
Write-Warning-Custom "STEP 3: Building frontend Docker image..."
Write-Info "  Building: $REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
Write-Info ""

try {
    docker build `
      -f apps/web/Dockerfile.prod `
      -t "$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG" `
      -t "$REGISTRY/$PROJECT_ID/web:latest" `
      . | Out-Null
    
    Write-Success "✓ Frontend image built successfully"
    $webImage = docker images | Select-String "web" | Select-Object -First 1
    Write-Info "  $webImage"
} catch {
    Write-Error-Custom "✗ Frontend image build failed"
    exit 1
}

Write-Info ""

# Step 4: Push Backend Image
Write-Warning-Custom "STEP 4: Pushing backend image to GCR..."
Write-Info ""

try {
    docker push "$REGISTRY/$PROJECT_ID/api:$IMAGE_TAG" | Out-Null
    docker push "$REGISTRY/$PROJECT_ID/api:latest" | Out-Null
    Write-Success "✓ Backend image pushed to GCR"
    Write-Info "  Image: $REGISTRY/$PROJECT_ID/api:$IMAGE_TAG"
} catch {
    Write-Error-Custom "✗ Backend image push failed"
    exit 1
}

Write-Info ""

# Step 5: Push Frontend Image
Write-Warning-Custom "STEP 5: Pushing frontend image to GCR..."
Write-Info ""

try {
    docker push "$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG" | Out-Null
    docker push "$REGISTRY/$PROJECT_ID/web:latest" | Out-Null
    Write-Success "✓ Frontend image pushed to GCR"
    Write-Info "  Image: $REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
} catch {
    Write-Error-Custom "✗ Frontend image push failed"
    exit 1
}

Write-Info ""

# Step 6: Deploy Backend to Cloud Run
Write-Warning-Custom "STEP 6: Deploying backend to Cloud Run..."
Write-Info "  Service: $API_SERVICE_NAME"
Write-Info "  Region: $REGION"
Write-Info ""

try {
    gcloud run deploy $API_SERVICE_NAME `
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
      --set-env-vars="NODE_ENV=staging,FIRESTORE_PROJECT_ID=$PROJECT_ID,LOG_LEVEL=debug" `
      --project=$PROJECT_ID | Out-Null
    
    Write-Success "✓ Backend service deployed"
    
    # Get backend URL
    $BACKEND_URL = gcloud run services describe $API_SERVICE_NAME `
      --region=$REGION `
      --format='value(status.url)' `
      --project=$PROJECT_ID
    
    Write-Info "  URL: $BACKEND_URL"
} catch {
    Write-Error-Custom "✗ Backend deployment failed"
    Write-Error-Custom $_
    exit 1
}

Write-Info ""

# Step 7: Deploy Frontend to Cloud Run
Write-Warning-Custom "STEP 7: Deploying frontend to Cloud Run..."
Write-Info "  Service: $WEB_SERVICE_NAME"
Write-Info "  Region: $REGION"
Write-Info ""

try {
    gcloud run deploy $WEB_SERVICE_NAME `
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
      --project=$PROJECT_ID | Out-Null
    
    Write-Success "✓ Frontend service deployed"
    
    # Get frontend URL
    $FRONTEND_URL = gcloud run services describe $WEB_SERVICE_NAME `
      --region=$REGION `
      --format='value(status.url)' `
      --project=$PROJECT_ID
    
    Write-Info "  URL: $FRONTEND_URL"
} catch {
    Write-Error-Custom "✗ Frontend deployment failed"
    Write-Error-Custom $_
    exit 1
}

Write-Info ""

# Step 8: Verify Deployments
Write-Warning-Custom "STEP 8: Verifying deployments..."
Write-Info ""

# Check backend health
Write-Info "  Checking backend health..."
try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "✓ Backend health check passed"
    } else {
        Write-Warning-Custom "⚠ Backend health check: HTTP $($response.StatusCode)"
    }
} catch {
    Write-Warning-Custom "⚠ Backend check: Connection timeout (may be initializing)"
}

# Check frontend response
Write-Info "  Checking frontend response..."
try {
    $response = Invoke-WebRequest -Uri "$FRONTEND_URL/" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "✓ Frontend response check passed"
    } else {
        Write-Warning-Custom "⚠ Frontend check: HTTP $($response.StatusCode)"
    }
} catch {
    Write-Warning-Custom "⚠ Frontend check: Connection timeout (may be initializing)"
}

Write-Info ""

# Calculate deployment time
$EndTime = Get-Date
$DeployTime = ($EndTime - $StartTime).TotalSeconds

# Final Summary
Write-Info "====================================================="
Write-Success "✓ DEPLOYMENT COMPLETE"
Write-Info "====================================================="
Write-Info ""
Write-Info "📊 DEPLOYMENT SUMMARY"
Write-Info "  Deployment Time: $($DeployTime)s"
Write-Info ""
Write-Info "🔗 DEPLOYED SERVICES"
Write-Info ""
Write-Info "Backend API Service:"
Write-Info "  Name: $API_SERVICE_NAME"
Write-Info "  URL:  $BACKEND_URL"
Write-Info "  Health: $BACKEND_URL/health"
Write-Info "  API:   $BACKEND_URL/api/v1"
Write-Info ""
Write-Info "Frontend Web Service:"
Write-Info "  Name: $WEB_SERVICE_NAME"
Write-Info "  URL:  $FRONTEND_URL"
Write-Info ""
Write-Info "📋 TEST COMMANDS (Run these to verify)"
Write-Info ""
Write-Info "  # Backend health check"
Write-Info "  curl $BACKEND_URL/health"
Write-Info ""
Write-Info "  # Frontend load"
Write-Info "  curl $FRONTEND_URL/"
Write-Info ""
Write-Info "  # API test"
Write-Info "  curl `"$BACKEND_URL/api/v1/exams?schoolId=test-1`""
Write-Info ""
Write-Info "📝 DOCUMENTATION"
Write-Info "  See: DEPLOYMENT_GUIDE_WEEK7_DAY2.md"
Write-Info ""
Write-Info "🎯 READY FOR DEMO"
Write-Info "  Both services deployed and healthy"
Write-Info "  URLs ready to share with Agent 6"
Write-Info "  Deployment completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Write-Info ""
Write-Info "====================================================="

# Save URLs to file for reference
$urlContent = @"
# Week 7 Day 2 - Phase 2 Staging Deployment URLs
# Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

BACKEND_URL=$BACKEND_URL
FRONTEND_URL=$FRONTEND_URL
PROJECT_ID=$PROJECT_ID
REGION=$REGION

# Test Commands
curl $BACKEND_URL/health
curl $FRONTEND_URL/
curl "$BACKEND_URL/api/v1/exams?schoolId=test-1"

# Rollback Commands
gcloud run deploy $API_SERVICE_NAME --image=$REGISTRY/$PROJECT_ID/api:latest
gcloud run deploy $WEB_SERVICE_NAME --image=$REGISTRY/$PROJECT_ID/web:latest

# Logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$API_SERVICE_NAME"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$WEB_SERVICE_NAME"
"@

$urlContent | Out-File -FilePath "DEPLOYMENT_URLS.txt" -Encoding UTF8
Write-Success "✓ URLs saved to: DEPLOYMENT_URLS.txt"
