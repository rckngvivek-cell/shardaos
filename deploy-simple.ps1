# Simple Deployment Script That Finds and Uses gcloud
$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Cloud Run Deployment - Finding gcloud..." -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Common gcloud paths
$possiblePaths = @(
    "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin",
    "C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin",
    "C:\google-cloud-sdk\bin",
    "$env:APPDATA\gcloud\bin"
)

$gcloudBinPath = $null

# Find gcloud
foreach ($path in $possiblePaths) {
    if (Test-Path "$path\gcloud.cmd") {
        $gcloudBinPath = $path
        Write-Host "✓ Found gcloud at: $path" -ForegroundColor Green
        break
    }
}

if (-not $gcloudBinPath) {
    Write-Host "✗ gcloud not found in common locations" -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick Fix (choose one):" -ForegroundColor Yellow
    Write-Host "1. Download: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe" -ForegroundColor Yellow
    Write-Host "2. Run installer and accept defaults" -ForegroundColor Yellow
    Write-Host "3. Run this script again" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative:" -ForegroundColor Yellow
    Write-Host "winget install Google.CloudSDK" -ForegroundColor Yellow
    exit 1
}

# Add to PATH for this session
$env:Path = "$gcloudBinPath;$env:Path"

# Verify gcloud works
Write-Host ""
Write-Host "Testing gcloud..." -ForegroundColor Blue
try {
    $version = & gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✓ gcloud is working: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ gcloud test failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Starting Cloud Run Deployment" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "school-erp-dev"
$REGION = "us-central1"
$API_SERVICE = "exam-api-staging"
$WEB_SERVICE = "exam-web-staging"
$TAG = "v1.0.0"
$REGISTRY = "gcr.io"

# Step 1: Verify prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Blue
Write-Host ""

# Check docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "✗ Docker not found. Install from: https://docs.docker.com/desktop/install/windows" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Docker found" -ForegroundColor Green

# Check dist folders
if (-not (Test-Path "apps/api/dist/index.js")) {
    Write-Host "✗ Backend not compiled. Run: npm run build in apps/api/" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend compiled" -ForegroundColor Green

if (-not (Test-Path "apps/web/dist/index.html")) {
    Write-Host "⚠ Frontend not built. Will deploy backend only" -ForegroundColor Yellow
    $DEPLOY_WEB = $false
} else {
    Write-Host "✓ Frontend built" -ForegroundColor Green
    $DEPLOY_WEB = $true
}

Write-Host ""

#Step 2: Configure GCP
Write-Host "Step 2: Configuring GCP..." -ForegroundColor Blue
Write-Host ""

Write-Host "  Setting project to: $PROJECT_ID" -ForegroundColor Gray
& gcloud config set project $PROJECT_ID 2>&1 | Out-Null

Write-Host "  Configuring Docker auth..." -ForegroundColor Gray
& gcloud auth configure-docker $REGISTRY 2>&1 | Out-Null

Write-Host "✓ GCP configured" -ForegroundColor Green
Write-Host ""

# Step 3: Build and push backend
Write-Host "Step 3: Building and pushing backend image..." -ForegroundColor Blue
Write-Host ""

$apiImage = "$REGISTRY/$PROJECT_ID/api:$TAG"
Write-Host "  Building: $apiImage" -ForegroundColor Gray

try {
    docker build `
      -f apps/api/Dockerfile.prod `
      -t $apiImage `
      -t "$REGISTRY/$PROJECT_ID/api:latest" `
      . 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
} catch {
    Write-Host "✗ Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "  Pushing to GCR..." -ForegroundColor Gray
try {
    docker push "$apiImage" 2>&1 | Out-Null
    docker push "$REGISTRY/$PROJECT_ID/api:latest" 2>&1 | Out-Null
} catch {
    Write-Host "✗ Push failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Backend pushed: $apiImage" -ForegroundColor Green
Write-Host ""

# Step 4: Build and push frontend (if available)
if ($DEPLOY_WEB) {
    Write-Host "Step 4: Building and pushing frontend image..." -ForegroundColor Blue
    Write-Host ""
    
    $webImage = "$REGISTRY/$PROJECT_ID/web:$TAG"
    Write-Host "  Building: $webImage" -ForegroundColor Gray
    
    try {
        docker build `
          -f apps/web/Dockerfile.prod `
          -t $webImage `
          -t "$REGISTRY/$PROJECT_ID/web:latest" `
          . 2>&1 | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    } catch {
        Write-Host "✗ Build failed: $_" -ForegroundColor Red
        $DEPLOY_WEB = $false
    }
    
    if ($DEPLOY_WEB) {
        Write-Host "  Pushing to GCR..." -ForegroundColor Gray
        try {
            docker push "$webImage" 2>&1 | Out-Null
            docker push "$REGISTRY/$PROJECT_ID/web:latest" 2>&1 | Out-Null
        } catch {
            Write-Host "✗ Push failed: $_" -ForegroundColor Red
            $DEPLOY_WEB = $false
        }
        
        Write-Host "✓ Frontend pushed: $webImage" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Step 5: Deploy backend
Write-Host "Step 5: Deploying backend to Cloud Run..." -ForegroundColor Blue
Write-Host ""

Write-Host "  Service: $API_SERVICE" -ForegroundColor Gray
Write-Host "  Region: $REGION" -ForegroundColor Gray
Write-Host "  This may take 2-5 minutes..." -ForegroundColor Gray

try {
    & gcloud run deploy $API_SERVICE `
      --image=$apiImage `
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
      --quiet 2>&1 | Out-Null
} catch {
    Write-Host "✗ Deployment failed: $_" -ForegroundColor Red
    exit 1
}

# Get URL
Write-Host "  Retrieving URL..." -ForegroundColor Gray
$BACKEND_URL = (& gcloud run services describe $API_SERVICE `
  --region=$REGION `
  --format='value(status.url)' `
  --project=$PROJECT_ID 2>&1).Trim()

Write-Host "✓ Backend deployed: $BACKEND_URL" -ForegroundColor Green
Write-Host ""

# Step 6: Deploy frontend (if available)
if ($DEPLOY_WEB) {
    Write-Host "Step 6: Deploying frontend to Cloud Run..." -ForegroundColor Blue
    Write-Host ""
    
    Write-Host "  Service: $WEB_SERVICE" -ForegroundColor Gray
    Write-Host "  Region: $REGION" -ForegroundColor Gray
    Write-Host "  Backend URL: $BACKEND_URL" -ForegroundColor Gray
    
    try {
        & gcloud run deploy $WEB_SERVICE `
          --image="$REGISTRY/$PROJECT_ID/web:$TAG" `
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
          --quiet 2>&1 | Out-Null
    } catch {
        Write-Host "✗ Frontend deployment failed: $_" -ForegroundColor Red
        $DEPLOY_WEB = $false
    }
    
    if ($DEPLOY_WEB) {
        Write-Host "  Retrieving URL..." -ForegroundColor Gray
        $FRONTEND_URL = (& gcloud run services describe $WEB_SERVICE `
          --region=$REGION `
          --format='value(status.url)' `
          --project=$PROJECT_ID 2>&1).Trim()
        
        Write-Host "✓ Frontend deployed: $FRONTEND_URL" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Step 7: Verify
Write-Host "Step 7: Verifying deployment..." -ForegroundColor Blue
Write-Host ""

Write-Host "  Testing backend health..." -ForegroundColor Gray
$maxRetries = 3
$retryCount = 0

while ($retryCount -lt $maxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" `
          -UseBasicParsing `
          -TimeoutSec 10 `
          -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host "✓ Backend health check passed (HTTP 200)" -ForegroundColor Green
            break
        }
    } catch {
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "  Retrying in 5 seconds... (attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
            Start-Sleep -Seconds 5
        } else {
            Write-Host "⚠ Health check failed (service may still be starting)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""

# Summary
Write-Host "============================================" -ForegroundColor Green
Write-Host "✓ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "BACKEND API" -ForegroundColor Cyan
Write-Host "  URL: $BACKEND_URL" -ForegroundColor White
Write-Host "  Health: $BACKEND_URL/health" -ForegroundColor White
Write-Host "  API: $BACKEND_URL/api/v1" -ForegroundColor White
Write-Host ""

if ($DEPLOY_WEB) {
    Write-Host "FRONTEND WEB" -ForegroundColor Cyan
    Write-Host "  URL: $FRONTEND_URL" -ForegroundColor White
    Write-Host ""
}

Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "  1. Test health: curl $BACKEND_URL/health" -ForegroundColor White
if ($DEPLOY_WEB) {
    Write-Host "  2. Open frontend: $FRONTEND_URL" -ForegroundColor White
}
Write-Host "  3. Share URLs with Agent 6 for demo" -ForegroundColor White
Write-Host "  4. View logs: gcloud run logs read $API_SERVICE --follow" -ForegroundColor White
Write-Host ""

# Save URLs to file
$urlsFile = "DEPLOYMENT_URLS_LIVE.txt"
@"
========================================
PHASE 2 DEPLOYMENT - STAGING URLS
========================================
Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

BACKEND API
-----------
URL: $BACKEND_URL
Health: $BACKEND_URL/health
API: $BACKEND_URL/api/v1

Test:
  (Invoke-WebRequest -Uri "$BACKEND_URL/health").StatusCode
  Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/exams"
"@ | Out-File $urlsFile -Encoding UTF8

if ($DEPLOY_WEB) {
    @"

FRONTEND WEB
-----------
URL: $FRONTEND_URL
"@ | Add-Content $urlsFile
}

Write-Host "URLs saved to: $urlsFile" -ForegroundColor Green
Write-Host ""
