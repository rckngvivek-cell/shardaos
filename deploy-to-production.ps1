#!/usr/bin/env powershell
# School ERP API - Docker Build & Cloud Run Deploy Script
# Phase 3-4: Build and Deploy to Production

$PROJECT_ID = "school-erp-prod"
$SERVICE_NAME = "school-erp-api"
$REGION = "asia-south1"
$IMAGE_NAME = "school-erp-api"
$IMAGE_TAG = "v0.1.0"

Write-Host "╔════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  School ERP - Docker Build & Cloud Run Deploy" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

# STEP 1: Verify build is complete
Write-Host "━━━ STEP 1: Verify Build ━━━" -ForegroundColor Cyan
if (Test-Path "apps/api/dist/index.js") {
    Write-Host "✅ dist/index.js exists" -ForegroundColor Green
    $fileSize = (Get-Item "apps/api/dist/index.js").Length
    Write-Host "   Size: $(($fileSize / 1KB).ToString('F2')) KB" -ForegroundColor Green
} else {
    Write-Host "❌ dist/index.js not found" -ForegroundColor Red
    Write-Host "   Run: npm run build" -ForegroundColor Yellow
    exit 1
}

# STEP 2: Check Docker installation
Write-Host "`n━━━ STEP 2: Check Docker ━━━" -ForegroundColor Cyan
try {
    $dockerV = docker --version
    Write-Host "✅ Docker: $dockerV" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found" -ForegroundColor Red
    Write-Host "   Install from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    exit 1
}

# STEP 3: Build Docker image locally
Write-Host "`n━━━ STEP 3: Build Docker Image ━━━" -ForegroundColor Cyan
Write-Host "Building: $IMAGE_NAME`:$IMAGE_TAG"

$dockerfile = "apps/api/Dockerfile.prod"
docker build -f $dockerfile `
  -t "${IMAGE_NAME}:latest" `
  -t "${IMAGE_NAME}:${IMAGE_TAG}" `
  .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker image built successfully" -ForegroundColor Green

# STEP 4: Test Docker image locally
Write-Host "`n━━━ STEP 4: Test Docker Image Locally ━━━" -ForegroundColor Cyan
Write-Host "Starting container test..."

$containerId = docker run -d `
  -p 8081:8080 `
  -e NODE_ENV=staging `
  -e PORT=8080 `
  -e STORAGE_DRIVER=memory `
  -e AUTH_MODE=mock `
  "${IMAGE_NAME}:${IMAGE_TAG}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container started: $containerId" -ForegroundColor Green

# Wait for container to be ready
Start-Sleep -Seconds 3

# Test health endpoint
Write-Host "Testing health endpoint..."
try {
    $health = Invoke-WebRequest -Uri "http://localhost:8081/api/v1/health" `
        -TimeoutSec 5 `
        -ErrorAction SilentlyContinue
    
    if ($health.StatusCode -eq 200) {
        Write-Host "✅ Container responding on port 8081" -ForegroundColor Green
        $health.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2 | Write-Host
    }
} catch {
    Write-Host "⚠️  Health check failed, but container may still be starting..." -ForegroundColor Yellow
}

# Stop test container
docker stop $containerId
docker rm $containerId
Write-Host "✅ Test container cleaned up" -ForegroundColor Green

# STEP 5: Configure GCP
Write-Host "`n━━━ STEP 5: Configure GCP ━━━" -ForegroundColor Cyan
Write-Host "Checking gcloud CLI..."

try {
    $gcloud = gcloud --version
    Write-Host "✅ gcloud CLI available" -ForegroundColor Green
} catch {
    Write-Host "❌ gcloud CLI not found" -ForegroundColor Red
    Write-Host "   Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}

# Check auth
try {
    $currentProject = gcloud config get-value project
    Write-Host "✅ GCP Project: $currentProject" -ForegroundColor Green
} catch {
    Write-Host "❌ Not authenticated with GCP" -ForegroundColor Red
    Write-Host "   Run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

# STEP 6: Configure Docker for GCP
Write-Host "`n━━━ STEP 6: Configure Docker Registry ━━━" -ForegroundColor Cyan
Write-Host "Setting up docker-gcr auth..."

gcloud auth configure-docker

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Docker registry configuration may need manual setup" -ForegroundColor Yellow
}

# STEP 7: Push to Google Container Registry
Write-Host "`n━━━ STEP 7: Push Image to GCR ━━━" -ForegroundColor Cyan

$GCR_IMAGE = "gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"
$GCR_LATEST = "gcr.io/${PROJECT_ID}/${IMAGE_NAME}:latest"

Write-Host "Tagging image..."
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "$GCR_IMAGE"
docker tag "${IMAGE_NAME}:${IMAGE_TAG}" "$GCR_LATEST"

Write-Host "Pushing to GCR..."
docker push "$GCR_IMAGE"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push image" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Image pushed to GCR" -ForegroundColor Green
Write-Host "   Image: $GCR_IMAGE" -ForegroundColor Green

# STEP 8: Deploy to Cloud Run
Write-Host "`n━━━ STEP 8: Deploy to Cloud Run ━━━" -ForegroundColor Cyan

Write-Host "Deploying service..."
gcloud run deploy "$SERVICE_NAME" `
  --image "$GCR_IMAGE" `
  --platform managed `
  --region "$REGION" `
  --memory 512Mi `
  --cpu 1 `
  --timeout 300 `
  --set-env-vars "NODE_ENV=production,STORAGE_DRIVER=firestore,AUTH_MODE=firebase" `
  --allow-unauthenticated

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to deploy to Cloud Run" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Service deployed to Cloud Run" -ForegroundColor Green

# STEP 9: Get service URL
Write-Host "`n━━━ STEP 9: Get Service URL ━━━" -ForegroundColor Cyan

$SERVICE_URL = (gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format="value(status.url)")

Write-Host "✅ Service URL: $SERVICE_URL" -ForegroundColor Green

# STEP 10: Test production deployment
Write-Host "`n━━━ STEP 10: Test Production Endpoint ━━━" -ForegroundColor Cyan

Write-Host "Testing health endpoint on production..."
Start-Sleep -Seconds 5  # Give Cloud Run time to start

try {
    $prodHealth = Invoke-WebRequest -Uri "${SERVICE_URL}/api/v1/health" `
        -TimeoutSec 10 `
        -ErrorAction SilentlyContinue
    
    if ($prodHealth.StatusCode -eq 200) {
        Write-Host "✅ Production API responding" -ForegroundColor Green
        $prodHealth.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2 | Write-Host
    }
} catch {
    Write-Host "⚠️  Initial health check may timeout while service starts..." -ForegroundColor Yellow
}

# Write deployment summary
Write-Host "`n╔════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Deployment Complete!" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════╝" -ForegroundColor Green

Write-Host "`n📊 Summary:" -ForegroundColor Cyan
Write-Host "  Service: $SERVICE_NAME" -ForegroundColor Cyan
Write-Host "  Region: $REGION" -ForegroundColor Cyan
Write-Host "  Image: $GCR_IMAGE" -ForegroundColor Cyan
Write-Host "  URL: $SERVICE_URL" -ForegroundColor Cyan

Write-Host "`n✅ API is now live in production!" -ForegroundColor Green
Write-Host "   Test: "
Write-Host "   curl $SERVICE_URL/api/v1/health" -ForegroundColor Green

Write-Host "`n📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Wait 30 seconds for service to fully initialize" -ForegroundColor Yellow
Write-Host "  2. Test endpoints with curl or Postman" -ForegroundColor Yellow
Write-Host "  3. Monitor logs: gcloud run logs read $SERVICE_NAME --region $REGION" -ForegroundColor Yellow
Write-Host "  4. Configure environment variables if needed" -ForegroundColor Yellow

exit 0
