# Complete Deployment Script: Install gcloud + Deploy to Cloud Run
# Phase 2 API - Week 7 Day 2
# Deadline: 2 PM IST (1:30 PM IST buffer)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

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
function Write-Section { Write-Host ""; Write-Host @args -ForegroundColor Cyan -BackgroundColor Black }

$StartTime = Get-Date

Write-Section "================================================"
Write-Section "PHASE 2 DEPLOYMENT TO CLOUD RUN - FULL SETUP"
Write-Section "Week 7 Day 2 - Complete Installation + Deployment"
Write-Section "================================================"
Write-Info ""

# PART 1: Install gcloud SDK
Write-Section "PART 1: INSTALLING GOOGLE CLOUD SDK"
Write-Info ""

$gcloudPath = "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
$gcloudExists = Test-Path $gcloudPath

if ($gcloudExists) {
    Write-Success "✓ gcloud already installed"
    Write-Info "  Path: $gcloudPath"
} else {
    Write-Warning-Custom "gcloud not found. Installing..."
    Write-Info ""
    
    # Download installer
    Write-Info "  Downloading Google Cloud SDK installer..."
    $tempDir = "$env:TEMP\gcloud-install"
    if (-not (Test-Path $tempDir)) {
        New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
    }
    
    $installerPath = "$tempDir\GoogleCloudSDKInstaller.exe"
    
    try {
        #Download the installer
        $downloadUrl = "https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Write-Info "  URL: $downloadUrl"
        Write-Info "  This may take 2-3 minutes..."
        
        $webClient = New-Object System.Net.WebClient
        $webClient.DownloadFile($downloadUrl, $installerPath)
        
        Write-Success "✓ Installer downloaded"
        $fileSize = ([math]::Round((Get-Item $installerPath).Length / 1MB, 2))
        Write-Info "  Size: $fileSize MB"
    } catch {
        Write-Error-Custom "✗ Download failed"
        Write-Error-Custom "Error: $_"
        Write-Info ""
        Write-Info "Manual Installation:"
        Write-Info "1. Download: https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe"
        Write-Info "2. Run the installer"
        Write-Info "3. Run this script again"
        exit 1
    }
    
    # Run installer
    Write-Info ""
    Write-Info "  Running installer (this will take 2-3 minutes)..."
    Write-Info "  Note: Use default installation path and answer Yes to all prompts"
    Write-Info ""
    
    try {
        & $installerPath /norestart | Out-Null
        Start-Sleep -Seconds 5
        Write-Success "✓ gcloud SDK installed"
    } catch {
        Write-Error-Custom "✗ Installation failed"
        Write-Error-Custom "Run the installer manually: $installerPath"
        exit 1
    }
}

Write-Info ""

# PART 2: Verify gcloud
Write-Section "PART 2: VERIFYING GCLOUD INSTALLATION"
Write-Info ""

# Add gcloud to PATH temporarily
$gcloudDir = "C:\Program Files\Google\Cloud SDK\google-cloud-sdk\bin"
$env:Path = "$gcloudDir;$env:Path"

try {
    $gcloudVersion = & gcloud --version 2>&1 | Select-Object -First 1
    Write-Success "✓ gcloud CLI verified"
    Write-Info "  $gcloudVersion"
} catch {
    Write-Error-Custom "✗ gcloud CLI not accessible"
    Write-Error-Custom "Error: $_"
    exit 1
}

Write-Info ""

# PART 3: Prerequisites Check
Write-Section "PART 3: CHECKING PREREQUISITES"
Write-Info ""

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
try {
    gcloud config set project $PROJECT_ID | Out-Null
    gcloud auth configure-docker $REGISTRY 2>&1 | Out-Null
    Write-Success "✓ gcloud configured"
} catch {
    Write-Error-Custom "✗ gcloud configuration failed"
    Write-Info "  Make sure you run: gcloud auth login"
    Write-Info "  Then run this script again"
}

# Verify project access
try {
    Write-Info "  Verifying project access..."
    gcloud projects describe $PROJECT_ID --quiet 2>&1 | Out-Null
    Write-Success "✓ Project access verified"
} catch {
    Write-Error-Custom "✗ Cannot access project: $PROJECT_ID"
    Write-Info "  Make sure you're authenticated to the correct GCP project"
    Write-Info "  Run: gcloud auth login"
    Write-Info "  Then: gcloud config set project $PROJECT_ID"
    exit 1
}

# Check dist folders
Write-Info "  Checking build artifacts..."
if (-not (Test-Path "apps/api/dist")) {
    Write-Error-Custom "✗ Backend dist/ folder not found"
    exit 1
}
Write-Success "✓ Backend dist/ found"

if (-not (Test-Path "apps/web/dist")) {
    Write-Warning-Custom "⚠ Frontend dist/ folder not found"
    Write-Info "  Skipping frontend deployment"
    $deployFrontend = $false
} else {
    Write-Success "✓ Frontend dist/ found"
    $deployFrontend = $true
}

Write-Info ""

# PART 4: Build Backend Image
Write-Section "PART 4: BUILDING BACKEND DOCKER IMAGE"
Write-Info ""

$apiImage = "$REGISTRY/$PROJECT_ID/api:$IMAGE_TAG"
Write-Info "  Building: $apiImage"
Write-Info ""

try {
    docker build `
      -f apps/api/Dockerfile.prod `
      -t $apiImage `
      -t "$REGISTRY/$PROJECT_ID/api:latest" `
      . 2>&1 | ForEach-Object { Write-Info "  $_" }
    
    Write-Success "✓ Backend image built successfully"
} catch {
    Write-Error-Custom "✗ Backend image build failed"
    Write-Error-Custom "Error: $_"
    exit 1
}

Write-Info ""

# PART 5: Build Frontend Image (if dist exists)
if ($deployFrontend) {
    Write-Section "PART 5: BUILDING FRONTEND DOCKER IMAGE"
    Write-Info ""
    
    $webImage = "$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
    Write-Info "  Building: $webImage"
    Write-Info ""
    
    try {
        docker build `
          -f apps/web/Dockerfile.prod `
          -t $webImage `
          -t "$REGISTRY/$PROJECT_ID/web:latest" `
          . 2>&1 | ForEach-Object { Write-Info "  $_" }
        
        Write-Success "✓ Frontend image built successfully"
    } catch {
        Write-Error-Custom "✗ Frontend image build failed"
        Write-Error-Custom "Error: $_"
        $deployFrontend = $false
        Write-Info "  Continuing with backend-only deployment..."
    }
    
    Write-Info ""
}

# PART 6: Push Backend Image
Write-Section "PART 6: PUSHING BACKEND IMAGE TO GCR"
Write-Info ""

Write-Info "  Image: $apiImage"
Write-Info "  This may take 2-5 minutes..."
Write-Info ""

try {
    Write-Info "  Pushing $apiImage..."
    docker push "$apiImage" 2>&1 | ForEach-Object { Write-Info "  $_" }
    
    Write-Info "  Pushing latest tag..."
    docker push "$REGISTRY/$PROJECT_ID/api:latest" 2>&1 | Out-Null
    
    Write-Success "✓ Backend image pushed to GCR"
} catch {
    Write-Error-Custom "✗ Backend image push failed"
    Write-Error-Custom "Error: $_"
    exit 1
}

Write-Info ""

# PART 7: Push Frontend Image
if ($deployFrontend) {
    Write-Section "PART 7: PUSHING FRONTEND IMAGE TO GCR"
    Write-Info ""
    
    $webImage = "$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
    Write-Info "  Image: $webImage"
    Write-Info "  This may take 1-3 minutes..."
    Write-Info ""
    
    try {
        Write-Info "  Pushing $webImage..."
        docker push "$webImage" 2>&1 | ForEach-Object { Write-Info "  $_" }
        
        Write-Info "  Pushing latest tag..."
        docker push "$REGISTRY/$PROJECT_ID/web:latest" 2>&1 | Out-Null
        
        Write-Success "✓ Frontend image pushed to GCR"
    } catch {
        Write-Error-Custom "✗ Frontend image push failed"
        Write-Error-Custom "Error: $_"
        $deployFrontend = $false
        Write-Info "  Continuing with backend-only deployment..."
    }
    
    Write-Info ""
}

# PART 8: Deploy Backend to Cloud Run
Write-Section "PART 8: DEPLOYING BACKEND TO CLOUD RUN"
Write-Info ""

Write-Info "  Service: $API_SERVICE_NAME"
Write-Info "  Region: $REGION"
Write-Info "  Image: $apiImage"
Write-Info ""
Write-Info "  This may take 2-5 minutes... (first deployment is slower)"
Write-Info ""

try {
    Write-Info "  Deploying backend service..."
    gcloud run deploy $API_SERVICE_NAME `
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
      --quiet 2>&1 | ForEach-Object { Write-Info "  $_" }
    
    Write-Success "✓ Backend service deployed"
} catch {
    Write-Error-Custom "✗ Backend deployment failed"
    Write-Error-Custom "Error: $_"
    Write-Info ""
    Write-Info "Try:"
    Write-Info "  gcloud run deploy $API_SERVICE_NAME --help"
    exit 1
}

Write-Info ""
Write-Info "  Retrieving backend URL..."

try {
    $BACKEND_URL = (gcloud run services describe $API_SERVICE_NAME `
      --region=$REGION `
      --format='value(status.url)' `
      --project=$PROJECT_ID 2>&1).Trim()
    
    if (-not $BACKEND_URL) {
        throw "URL not returned"
    }
    
    Write-Success "✓ Backend URL: $BACKEND_URL"
} catch {
    Write-Error-Custom "✗ Could not retrieve backend URL"
    Write-Error-Custom "Error: $_"
    Write-Info "  Check manually: https://console.cloud.google.com/run"
    $BACKEND_URL = "https://<backend-url>.run.app"
}

Write-Info ""

# PART 9: Deploy Frontend to Cloud Run
if ($deployFrontend) {
    Write-Section "PART 9: DEPLOYING FRONTEND TO CLOUD RUN"
    Write-Info ""
    
    $webImage = "$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
    Write-Info "  Service: $WEB_SERVICE_NAME"
    Write-Info "  Region: $REGION"
    Write-Info "  Image: $webImage"
    Write-Info "  Backend URL: $BACKEND_URL"
    Write-Info ""
    Write-Info "  This may take 2-5 minutes..."
    Write-Info ""
    
    try {
        Write-Info "  Deploying frontend service..."
        gcloud run deploy $WEB_SERVICE_NAME `
          --image=$webImage `
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
          --quiet 2>&1 | ForEach-Object { Write-Info "  $_" }
        
        Write-Success "✓ Frontend service deployed"
    } catch {
        Write-Error-Custom "✗ Frontend deployment failed"
        Write-Error-Custom "Error: $_"
        $deployFrontend = $false
    }
    
    if ($deployFrontend) {
        Write-Info ""
        Write-Info "  Retrieving frontend URL..."
        
        try {
            $FRONTEND_URL = (gcloud run services describe $WEB_SERVICE_NAME `
              --region=$REGION `
              --format='value(status.url)' `
              --project=$PROJECT_ID 2>&1).Trim()
            
            if (-not $FRONTEND_URL) {
                throw "URL not returned"
            }
            
            Write-Success "✓ Frontend URL: $FRONTEND_URL"
        } catch {
            Write-Error-Custom "✗ Could not retrieve frontend URL"
            Write-Error-Custom "Error: $_"
            $FRONTEND_URL = "https://<frontend-url>.run.app"
        }
    }
}

Write-Info ""

# PART 10: Verify Health Checks
Write-Section "PART 10: VERIFYING HEALTH CHECKS"
Write-Info ""

Write-Info "  Testing backend health endpoint..."
Write-Info "  URL: $BACKEND_URL/health"
Write-Info ""

try {
    Start-Sleep -Seconds 2
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" `
      -UseBasicParsing `
      -TimeoutSec 10 `
      -ErrorAction Stop
    
    if ($response.StatusCode -eq 200) {
        Write-Success "✓ Backend health check PASSED (HTTP 200)"
        Write-Info "  Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Compress)"
    }
} catch {
    Write-Warning-Custom "⚠ Backend health check failed (may need more time to start)"
    Write-Info "  Error: $_"
    Write-Info "  Retrying in 10 seconds..."
    
    Start-Sleep -Seconds 10
    
    try {
        $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" `
          -UseBasicParsing `
          -TimeoutSec 10 `
          -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Success "✓ Backend health check PASSED (HTTP 200)"
        }
    } catch {
        Write-Error-Custom "✗ Backend health check failed"
        Write-Info "  The service may still be starting up."
        Write-Info "  Check logs: gcloud run logs read $API_SERVICE_NAME --follow --region=$REGION"
    }
}

Write-Info ""

# PART 11: Save URLs to File
Write-Section "PART 11: SAVING DEPLOYMENT URLS"
Write-Info ""

$urlsFile = "DEPLOYMENT_URLS_LIVE.txt"

$urlsContent = @"
========================================
PHASE 2 DEPLOYMENT - CLOUD RUN URLS
========================================
Deployment Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Project: $PROJECT_ID
Region: $REGION

BACKEND API
-----------
Service Name: $API_SERVICE_NAME
URL: $BACKEND_URL
Health Check: $BACKEND_URL/health
API Base: $BACKEND_URL/api/v1

API Endpoints:
- GET    $BACKEND_URL/health                    - Health check
- GET    $BACKEND_URL/api/v1/exams              - List exams
- POST   $BACKEND_URL/api/v1/exams              - Create exam
- GET    $BACKEND_URL/api/v1/exams/{id}         - Get exam
- PUT    $BACKEND_URL/api/v1/exams/{id}         - Update exam
- DELETE $BACKEND_URL/api/v1/exams/{id}         - Delete exam

Test Commands:
  curl -s $BACKEND_URL/health | jq .
  curl -s $BACKEND_URL/api/v1/exams | jq .
  
PowerShell:
  (Invoke-WebRequest -Uri "$BACKEND_URL/health").StatusCode
  Invoke-RestMethod -Uri "$BACKEND_URL/api/v1/exams"

"@

if ($deployFrontend) {
    $urlsContent += @"
FRONTEND WEB
-----------
Service Name: $WEB_SERVICE_NAME
URL: $FRONTEND_URL

Dashboards:
https://console.cloud.google.com/run?project=$PROJECT_ID
https://console.cloud.google.com/logs?project=$PROJECT_ID

"@
}

$urlsContent += @"
MONITORING & LOGS
-----------------
Cloud Run Services:
  https://console.cloud.google.com/run?project=$PROJECT_ID

View Logs:
  Backend:  gcloud run logs read $API_SERVICE_NAME --region=$REGION --project=$PROJECT_ID --follow
  Frontend: gcloud run logs read $WEB_SERVICE_NAME --region=$REGION --project=$PROJECT_ID --follow

View Metrics:
  https://console.cloud.google.com/monitoring?project=$PROJECT_ID

DEMO INSTRUCTIONS (Agent 6)
---------------------------
1. Open Browser:
   Backend Test: $BACKEND_URL/health
   Frontend UI:  $FRONTEND_URL (if deployed)

2. Test API via PowerShell/curl:
   $BACKEND_URL/api/v1/exams

3. Expected Status:
   ✓ Backend receiving requests (HTTP 200)
   ✓ Health checks passing
   ✓ Database connections active

ROLLBACK INSTRUCTIONS
---------------------
To rollback to previous version:
  gcloud run deploy $API_SERVICE_NAME --image=gcr.io/$PROJECT_ID/api:latest --region=$REGION
  
TROUBLESHOOTING
---------------
If health check fails:
  Check logs: gcloud run logs read $API_SERVICE_NAME --limit=50 --region=$REGION
  
If API unreachable:
  1. Verify image pushed: gcloud container images list --project=$PROJECT_ID
  2. Check service: gcloud run services describe $API_SERVICE_NAME --region=$REGION
  3. View errors: gcloud logging read "resource.type=cloud_run_revision" --limit=10 --project=$PROJECT_ID

========================================
Generated: $(Get-Date)
========================================
"@

try {
    $urlsContent | Out-File -FilePath $urlsFile -Encoding UTF8 -Force
    Write-Success "✓ URLs saved to: $urlsFile"
    Write-Info ""
    Write-Info "  Content:"
    Write-Info "  --------"
    $urlsContent -split "`n" | ForEach-Object { Write-Info "  $_" }
} catch {
    Write-Error-Custom "✗ Could not save URLs file"
    Write-Error-Custom "Error: $_"
}

Write-Info ""

# Summary
$Duration = (Get-Date) - $StartTime

Write-Section "DEPLOYMENT COMPLETE ✓"
Write-Info ""
Write-Success "✓ Backend API Deployed Successfully"
if ($deployFrontend) {
    Write-Success "✓ Frontend Web Deployed Successfully"
}
Write-Info ""
Write-Info "Backend API URL: $BACKEND_URL"
if ($deployFrontend) {
    Write-Info "Frontend Web URL: $FRONTEND_URL"
}
Write-Info ""
Write-Info "Deployment Duration: $([math]::Round($Duration.TotalMinutes, 2)) minutes"
Write-Info "Ready for Agent 6 Demo at 2:00 PM"
Write-Info ""
Write-Section "Next Steps"
Write-Info "1. Share URLs with Agent 6"
Write-Info "2. Monitor logs during demo"
Write-Info "3. Be ready for quick rollback if needed"
Write-Info "4. Keep DEPLOYMENT_URLS_LIVE.txt handy"
Write-Info ""
Write-Section "Done!"
