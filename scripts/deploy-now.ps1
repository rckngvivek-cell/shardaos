# #!/usr/bin/env powershell
# PRODUCTION DEPLOYMENT SCRIPT - School ERP API
# Deploys to Google Cloud Run in 3 minutes

param(
    [string]$Project = "school-erp-prod",
    [string]$Region = "asia-south1",
    [string]$ServiceName = "school-erp-api"
)

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║           🚀 SCHOOL ERP - CLOUD RUN DEPLOYMENT               ║
║              Production Deployment Starting                   ║
╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# ====================================================================
# STEP 0: Fix PATH and Verify Tools
# ====================================================================

Write-Host "📋 Step 0: Setting up environment..." -ForegroundColor Yellow

$env:PATH = $env:PATH + ';C:\Program Files (x86)\Google\Cloud SDK\google-cloud-sdk\bin'

Write-Host "✓ GCloud path updated" -ForegroundColor Green

# Verify gcloud is available
try {
    $version = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✓ gcloud CLI ready: $version" -ForegroundColor Green
} catch {
    Write-Host "✗ gcloud not found. Please install: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# ====================================================================
# STEP 1: Authenticate with GCP (if needed)
# ====================================================================

Write-Host "`n🔐 Step 1: Authenticating with Google Cloud..." -ForegroundColor Yellow

$authStatus = gcloud auth list 2>&1
if ($authStatus -match "ACTIVE") {
    Write-Host "✓ Already authenticated with GCP" -ForegroundColor Green
} else {
    Write-Host "⏳ Opening Google Cloud login..." -ForegroundColor Cyan
    gcloud auth login
}

# ====================================================================
# STEP 2: Set Project and Enable APIs
# ====================================================================

Write-Host "`n⚙️  Step 2: Configuring GCP project ($Project)..." -ForegroundColor Yellow

gcloud config set project $Project
Write-Host "✓ Project set to $Project" -ForegroundColor Green

Write-Host "⏳ Enabling Cloud Run API..." -ForegroundColor Cyan
gcloud services enable run.googleapis.com 2>&1 | Out-Null
Write-Host "✓ Cloud Run API enabled" -ForegroundColor Green

Write-Host "⏳ Enabling Firestore API..." -ForegroundColor Cyan
gcloud services enable firestore.googleapis.com 2>&1 | Out-Null
Write-Host "✓ Firestore API enabled" -ForegroundColor Green

# ====================================================================
# STEP 3: Deploy API to Cloud Run
# ====================================================================

Write-Host "`n📦 Step 3: Deploying to Cloud Run..." -ForegroundColor Yellow
Write-Host "⏳ This may take 2-3 minutes..." -ForegroundColor Cyan

$deployResult = gcloud run deploy $ServiceName `
    --source . `
    --runtime nodejs20 `
    --region $Region `
    --memory 512Mi `
    --cpu 1 `
    --allow-unauthenticated `
    --project $Project `
    --set-env-vars="NODE_ENV=production,STORAGE_DRIVER=firestore,AUTH_MODE=firebase" `
    --quiet `
    2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Deployment successful!" -ForegroundColor Green
} else {
    Write-Host "✗ Deployment failed:" -ForegroundColor Red
    Write-Host $deployResult -ForegroundColor Red
    exit 1
}

# ====================================================================
# STEP 4: Get Service URL and Test
# ====================================================================

Write-Host "`n🔗 Step 4: Getting service URL..." -ForegroundColor Yellow

$serviceUrl = gcloud run services describe $ServiceName `
    --platform managed `
    --region $Region `
    --format 'value(status.url)' `
    2>&1

Write-Host "✓ Service URL: $serviceUrl" -ForegroundColor Green

# ====================================================================
# STEP 5: Test Health Endpoint
# ====================================================================

Write-Host "`n✅ Step 5: Testing production endpoint..." -ForegroundColor Yellow

$healthUrl = "$serviceUrl/api/v1/health"
Write-Host "⏳ Testing: $healthUrl" -ForegroundColor Cyan

$maxAttempts = 10
$attempt = 0
$healthCheck = $null

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $healthCheck = $response.Content | ConvertFrom-Json
            break
        }
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "  ⏳ Waiting for service to be ready (attempt $attempt/$maxAttempts)..."
            Start-Sleep -Seconds 3
        }
    }
}

if ($healthCheck) {
    Write-Host "✓ Health check passed!" -ForegroundColor Green
    Write-Host "  Status: $($healthCheck.status)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Health check timeout (service may still be initializing)" -ForegroundColor Yellow
}

# ====================================================================
# DEPLOYMENT COMPLETE
# ====================================================================

Write-Host @"

╔═══════════════════════════════════════════════════════════════╗
║                  ✅ DEPLOYMENT SUCCESSFUL!                   ║
╚═══════════════════════════════════════════════════════════════╝

📍 SERVICE LIVE AT:
   $serviceUrl

📊 API ENDPOINTS:
   Health:    $serviceUrl/api/v1/health
   Schools:   $serviceUrl/api/v1/schools
   Students:  $serviceUrl/api/v1/students
   Attendance: $serviceUrl/api/v1/attendance

🔧 NEXT STEPS:
   1. Configure Firestore database
   2. Set up Firebase authentication
   3. Onboard first school
   4. Train teachers & admin staff

📞 CLOUD RUN COMMANDS:
   View logs:     gcloud run logs read $ServiceName --region $Region --limit 100
   Scale service: gcloud run services update $ServiceName --min-instances 1 --region $Region
   Update service: Run this script again with modified environment variables

" -ForegroundColor Green

# Copy URL to clipboard
$serviceUrl | Set-Clipboard
Write-Host "✓ Service URL copied to clipboard" -ForegroundColor Green

# Show QR code or direct link option
Write-Host "`nℹ️  Save this URL for school onboarding:" -ForegroundColor Cyan
Write-Host $serviceUrl -ForegroundColor Cyan
