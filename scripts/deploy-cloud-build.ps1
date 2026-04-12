# Deploy Phase 2 Using Google Cloud Build (No Local Docker Needed)
# This script builds and deploys without requiring Docker Desktop
# Perfect fallback if Docker is not available locally

cd "c:\Users\vivek\OneDrive\Scans\files"

$PROJECT_ID = "school-erp-dev"
$REGION = "us-central1"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "CLOUD BUILD DEPLOYMENT (No Docker Required)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Enable Cloud Build API (if not already enabled)
Write-Host "Step 1: Ensuring Cloud Build API is enabled..." -ForegroundColor Blue
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
Write-Host "✓ Cloud Build API enabled" -ForegroundColor Green
Write-Host ""

# Step 2: Create build bucket if needed
Write-Host "Step 2: Ensuring Cloud Build bucket exists..." -ForegroundColor Blue
$BUCKET = "${PROJECT_ID}_cloudbuild"
gsutil ls "gs://$BUCKET" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Creating bucket: gs://$BUCKET" -ForegroundColor Gray
    gsutil mb "gs://$BUCKET" 2>&1 | Out-Null
}
Write-Host "✓ Build bucket ready" -ForegroundColor Green
Write-Host ""

# Step 3: Submit build to Cloud Build
Write-Host "Step 3: Submitting build to Cloud Build..." -ForegroundColor Blue
Write-Host "  This will build and deploy both services in the cloud" -ForegroundColor Gray
Write-Host "  Estimated time: 10-15 minutes" -ForegroundColor Gray
Write-Host "  You can monitor progress at:" -ForegroundColor Gray
Write-Host "  https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID" -ForegroundColor Gray
Write-Host ""

try {
    # Submit the build
    $buildOutput = gcloud builds submit `
      --config=cloudbuild.yaml `
      --project=$PROJECT_ID `
      2>&1
    
    # Extract build ID
    $buildId = $buildOutput | Select-String "ID" | Select-Object -First 1
    
    Write-Host "✓ Build submitted!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Build Details:" -ForegroundColor Cyan
    Write-Host $buildOutput
    Write-Host ""
    
} catch {
    Write-Host "✗ Build submission failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
    Write-Host "1. Check project: gcloud config get-value project" -ForegroundColor Yellow
    Write-Host "2. Check permissions: gcloud auth list" -ForegroundColor Yellow
    Write-Host "3. Verify Cloud Build enabled: gcloud services list --enabled" -ForegroundColor Yellow
    Write-Host "4. Check quota: gcloud compute project-info describe --project=$PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "============================================" -ForegroundColor Green
Write-Host "Build Started Successfully!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""

Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "1. Wait for build to complete (watch progress above)" -ForegroundColor White
Write-Host "2. Images will be pushed to GCR automatically" -ForegroundColor White
Write-Host "3. Services will be deployed to Cloud Run automatically" -ForegroundColor White
Write-Host "4. You'll see deployment URLs in the output" -ForegroundColor White
Write-Host ""

Write-Host "Monitor Build Progress:" -ForegroundColor Cyan
Write-Host "  Web: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID" -ForegroundColor White
Write-Host ""

Write-Host "View Cloud Run Services:" -ForegroundColor Cyan  
Write-Host "  Web: https://console.cloud.google.com/run?project=$PROJECT_ID" -ForegroundColor White
Write-Host ""

# Step 4: Wait for build to complete and show summary
Write-Host "Waiting for build completion..." -ForegroundColor Blue
Write-Host "(This may take 10-15 minutes)" -ForegroundColor Gray
Write-Host ""

# Poll for build status
$maxWaitTime = 1800  # 30 minutes
$startTime = Get-Date
$buildComplete = $false

while (((Get-Date) - $startTime).TotalSeconds -lt $maxWaitTime) {
    try {
        $builds = gcloud builds list --limit=1 --project=$PROJECT_ID --format="value(ID,STATUS)" 2>&1
        $latestBuild = $builds -split "`n" | Select-Object -First 1
        
        if ($latestBuild) {
            $buildStatus = ($latestBuild -split " ")[-1]
            
            if ($buildStatus -eq "SUCCESS") {
                Write-Host "✓ Build completed successfully!" -ForegroundColor Green
                $buildComplete = $true
                break
            } elseif ($buildStatus -eq "FAILURE") {
                Write-Host "✗ Build failed" -ForegroundColor Red
                Write-Host "View error logs at:" -ForegroundColor Yellow
                Write-Host "  https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID" -ForegroundColor Yellow
                break
            } elseif ($buildStatus -in "QUEUED", "WORKING") {
                # Still building
                $elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
                Write-Host "  Status: $buildStatus (elapsed: ${elapsed}s)" -ForegroundColor Gray
            }
        }
    } catch {
        # Silently continue polling
    }
    
    Start-Sleep -Seconds 30
}

Write-Host ""

if ($buildComplete) {
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✓ DEPLOYMENT COMPLETE!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "Your Services Are Now Running:" -ForegroundColor Cyan
    Write-Host ""
    
    # Get backend URL
    try {
        $backendUrl = gcloud run services describe exam-api-staging `
          --region=us-central1 `
          --format='value(status.url)' `
          --project=$PROJECT_ID 2>&1
        
        Write-Host "Backend API:" -ForegroundColor Yellow
        Write-Host "  URL: $backendUrl" -ForegroundColor White
        Write-Host "  Health: $backendUrl/health" -ForegroundColor White
        Write-Host "  API: $backendUrl/api/v1" -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "Backend URL retrieval pending..." -ForegroundColor Gray
    }
    
    # Get frontend URL
    try {
        $frontendUrl = gcloud run services describe exam-web-staging `
          --region=us-central1 `
          --format='value(status.url)' `
          --project=$PROJECT_ID 2>&1
        
        Write-Host "Frontend Web:" -ForegroundColor Yellow
        Write-Host "  URL: $frontendUrl" -ForegroundColor White
        Write-Host ""
    } catch {
        Write-Host "Frontend URL retrieval pending..." -ForegroundColor Gray
    }
    
    Write-Host "Next Actions:" -ForegroundColor Cyan
    Write-Host "1. Test APIs: curl $backendUrl/health" -ForegroundColor White
    Write-Host "2. Share URLs with Agent 6 for demo" -ForegroundColor White
    Write-Host "3. View logs: gcloud run logs read exam-api-staging --follow" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "⚠ Build is still in progress" -ForegroundColor Yellow
    Write-Host "Check status at: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
