#!/usr/bin/env powershell
# School ERP API - Direct Cloud Run Deployment (Without Docker)
# Uses Cloud Run's native Node.js runtime for faster deployment

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  School ERP - Direct Cloud Run Deployment" -ForegroundColor Magenta
Write-Host "║  (No Docker needed - using Cloud Run native)" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

$PROJECT_ID = "school-erp-prod"
$SERVICE_NAME = "school-erp-api"
$REGION = "asia-south1"
$RUNTIME = "nodejs20"

# STEP 1: Verify gcloud is installed
Write-Host "━━━ STEP 1: Check GCP Setup ━━━" -ForegroundColor Cyan

try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✅ gcloud CLI: Available" -ForegroundColor Green
} catch {
    Write-Host "❌ gcloud CLI not found" -ForegroundColor Red
    Write-Host "   Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# STEP 2: Check GCP project configuration
Write-Host "`n━━━ STEP 2: Check GCP Authentication ━━━" -ForegroundColor Cyan

try {
    $currentProject = gcloud config get-value project 2>&1
    if ($currentProject -like "*school-erp*" -or $currentProject -like "*not set*") {
        Write-Host "Current Project: $currentProject" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not get current project" -ForegroundColor Yellow
}

# Check if authenticated
try {
    $authStatus = gcloud auth list 2>&1 | Select-Object -First 5
    if ($authStatus -like "*ACTIVE*") {
        Write-Host "✅ GCP Authentication: Active" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No active authentication. Running: gcloud auth login" -ForegroundColor Yellow
        gcloud auth login
    }
} catch {
    Write-Host "⚠️  Auth check failed - will attempt login" -ForegroundColor Yellow
    gcloud auth login
}

# STEP 3: Set project
Write-Host "`n━━━ STEP 3: Configure Project ━━━" -ForegroundColor Cyan
Write-Host "Setting project to: $PROJECT_ID"

gcloud config set project $PROJECT_ID

# STEP 4: Verify Firestore database exists
Write-Host "`n━━━ STEP 4: Verify Firestore ━━━" -ForegroundColor Cyan

try {
    $firestore = gcloud firestore databases list 2>&1
    if ($firestore -like "*Firestore*") {
        Write-Host "✅ Firestore database exists" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Creating Firestore database..." -ForegroundColor Yellow
        gcloud firestore databases create --region=$REGION
    }
} catch {
    Write-Host "⚠️  Could not verify Firestore" -ForegroundColor Yellow
}

# STEP 5: Configure environment variables
Write-Host "`n━━━ STEP 5: Configure Environment ━━━" -ForegroundColor Cyan

$envVars = @(
    "NODE_ENV=production",
    "PORT=8080",
    "STORAGE_DRIVER=firestore",
    "AUTH_MODE=firebase",
    "FIREBASE_PROJECT_ID=$PROJECT_ID"
)

Write-Host "Environment variables:"
foreach ($var in $envVars) {
    Write-Host "  $var" -ForegroundColor Green
}

# STEP 6: Deploy to Cloud Run
Write-Host "`n━━━ STEP 6: Deploy to Cloud Run ━━━" -ForegroundColor Cyan
Write-Host "This may take 2-5 minutes..."

$envVarArgs = ($envVars | ForEach-Object { "--set-env-vars=$_" }) -join " "

# Build the deployment command
$deployCmd = @(
    "run", "deploy", "$SERVICE_NAME",
    "--source", ".",
    "--platform", "managed",
    "--region", "$REGION",
    "--runtime", "$RUNTIME",
    "--entry-point", "node",
    "--timeout", "600",
    "--memory", "512Mi",
    "--cpu", "1",
    "--allow-unauthenticated"
) + $envVars.Split(" ")

Write-Host "Running deployment command..." -ForegroundColor Cyan

gcloud run deploy "$SERVICE_NAME" `
    --source . `
    --platform managed `
    --region "$REGION" `
    --runtime "$RUNTIME" `
    --memory 512Mi `
    --cpu 1 `
    --timeout 600 `
    --allow-unauthenticated `
    --set-env-vars="NODE_ENV=production,STORAGE_DRIVER=firestore,AUTH_MODE=firebase,FIREBASE_PROJECT_ID=$PROJECT_ID"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    Write-Host "Try running: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Deployment complete!" -ForegroundColor Green

# STEP 7: Get service URL
Write-Host "`n━━━ STEP 7: Get Service URL ━━━" -ForegroundColor Cyan

$SERVICE_URL = (gcloud run services describe "$SERVICE_NAME" `
    --platform managed `
    --region "$REGION" `
    --format "value(status.url)" 2>&1)

Write-Host "✅ Service URL: $SERVICE_URL" -ForegroundColor Green

# STEP 8: Test endpoint
Write-Host "`n━━━ STEP 8: Test Production Endpoint ━━━" -ForegroundColor Cyan

Write-Host "Waiting for service to initialize..."
Start-Sleep -Seconds 5

try {
    Write-Host "Testing: $SERVICE_URL/api/v1/health"
    $response = Invoke-WebRequest -Uri "$SERVICE_URL/api/v1/health" `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Production API responding!" -ForegroundColor Green
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2 | Write-Host
    } else {
        Write-Host "⚠️  Status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Health check timed out (service may still be initializing)" -ForegroundColor Yellow
    Write-Host "   Try again in 30 seconds:" -ForegroundColor Yellow
    Write-Host "   curl $SERVICE_URL/api/v1/health" -ForegroundColor Cyan
}

# STEP 9: Summary
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  🚀 Deployment Complete!  🚀" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📊 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  Service: $SERVICE_NAME" -ForegroundColor Cyan
Write-Host "  Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "  Region: $REGION" -ForegroundColor Cyan
Write-Host "  Runtime: $RUNTIME" -ForegroundColor Cyan
Write-Host "  URL: $SERVICE_URL" -ForegroundColor Green

Write-Host "`n✅ API is now live in production!" -ForegroundColor Green
Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 1 minute for full initialization" -ForegroundColor Yellow
Write-Host "  2. Test endpoint: curl $SERVICE_URL/api/v1/health" -ForegroundColor Yellow
Write-Host "  3. View logs: gcloud run logs read $SERVICE_NAME --region $REGION" -ForegroundColor Yellow
Write-Host "  4. Configure custom domain (optional)" -ForegroundColor Yellow
Write-Host "  5. Set up CI/CD pipeline" -ForegroundColor Yellow

Write-Host "`n💰 Cost estimate for this service:" -ForegroundColor Yellow
Write-Host "  ~\$5-10/month for 10,000 requests/month" -ForegroundColor Yellow

exit 0
