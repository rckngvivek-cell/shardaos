#!/usr/bin/env pwsh
###############################################
# STAGING DEPLOYMENT EXECUTION SCRIPT
# Purpose: Deploy Week 6 builds to staging
# Timeline: April 10, 2026
###############################################

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🚀 STAGING DEPLOYMENT STARTED - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Configuration
$ProjectRoot = "c:\Users\vivek\OneDrive\Scans\files"
$BackendPort = 8080
$StagingUrl = "http://localhost:$BackendPort"

# Color helpers
function Write-Success { param($msg) Write-Host "✅ $msg" -ForegroundColor Green }
function Write-Error-Msg { param($msg) Write-Host "❌ $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "ℹ️  $msg" -ForegroundColor Cyan }
function Write-Step { param($msg) Write-Host "📍 $msg" -ForegroundColor Yellow }

# PHASE 1: Frontend Deployment
Write-Step "PHASE 1: Frontend Deployment to Firebase Hosting (5 min)"
Write-Host ""

# Set project directory
Push-Location $ProjectRoot

# Check Firebase CLI
Write-Info "Checking Firebase CLI..."
try {
    $firebaseVersion = firebase --version 2>&1 | Select-String "firebase-tools"
    Write-Success "Firebase CLI available"
} catch {
    Write-Error-Msg "Firebase CLI not available"
    exit 1
}

# Prepare frontend
Write-Info "Frontend build location: $ProjectRoot/apps/web/dist"
if (Test-Path "$ProjectRoot/apps/web/dist/index.html") {
    Write-Success "Frontend build verified (index.html found)"
} else {
    Write-Error-Msg "Frontend build missing - run npm run build --workspace @school-erp/web first"
    exit 1
}

# List files
$files = (Get-ChildItem "$ProjectRoot/apps/web/dist" -Recurse).Count
Write-Info "Frontend files: $files assets"

Write-Host ""
Write-Info "To deploy frontend, run:"
Write-Host "  firebase login" -ForegroundColor Yellow
Write-Host "  firebase deploy --only hosting --project school-erp-dev" -ForegroundColor Yellow
Write-Host ""

# PHASE 2: Backend Deployment
Write-Step "PHASE 2: Backend API Setup (Local Node.js)"
Write-Host ""

# Check backend build
Write-Info "Checking backend build..."
if (Test-Path "$ProjectRoot/apps/api/dist/index.js") {
    Write-Success "Backend build verified (dist/index.js found)"
} else {
    Write-Error-Msg "Backend build missing - run npm run build --workspace @school-erp/api first"
    exit 1
}

# Check dependencies
if (Test-Path "$ProjectRoot/apps/api/node_modules") {
    $depCount = (Get-ChildItem "$ProjectRoot/apps/api/node_modules" -Directory).Count
    Write-Success "Dependencies verified ($depCount packages)"
} else {
    Write-Error-Msg "Dependencies missing - run npm install in apps/api"
    exit 1
}

# Create staging env file
Write-Info "Creating .env staging configuration..."
$envContent = @"
NODE_ENV=staging
API_PORT=$BackendPort
LOG_LEVEL=debug
FIREBASE_PROJECT_ID=school-erp-dev
GCP_PROJECT_ID=school-erp-dev
JWT_SECRET=staging-secret-key-for-testing-only
SESSION_SECRET=staging-session-secret-for-testing-only
"@

Set-Content "$ProjectRoot/apps/api/.env.staging" $envContent
Write-Success "Environment file created (.env.staging)"

Write-Host ""
Write-Info "To start backend locally, run:"
Write-Host "  cd $ProjectRoot/apps/api" -ForegroundColor Yellow
Write-Host "  node dist/index.js" -ForegroundColor Yellow
Write-Host ""
Write-Host "OR for development with hot reload:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor Yellow
Write-Host ""

# PHASE 3: Deployment Status
Write-Step "PHASE 3: Deployment Status Summary"
Write-Host ""

Write-Host "Frontend:" -ForegroundColor Green
Write-Host "  Status: READY FOR DEPLOYMENT" -ForegroundColor Green
Write-Host "  Staging URL: https://school-erp-dev.firebaseapp.com" -ForegroundColor Green
Write-Host "  Latest Build: $(if (Test-Path "$ProjectRoot/apps/web/dist") { Get-Item "$ProjectRoot/apps/web/dist" | Select-Object -ExpandProperty LastWriteTime } else { "N/A" })" -ForegroundColor Green
Write-Host ""

Write-Host "Backend:" -ForegroundColor Green
Write-Host "  Status: READY FOR DEPLOYMENT" -ForegroundColor Green
Write-Host "  Staging URL: http://localhost:$BackendPort" -ForegroundColor Green
Write-Host "  Latest Build: $(if (Test-Path "$ProjectRoot/apps/api/dist") { Get-Item "$ProjectRoot/apps/api/dist" | Select-Object -ExpandProperty LastWriteTime } else { "N/A" })" -ForegroundColor Green
Write-Host ""

# PHASE 4: Next Steps
Write-Step "PHASE 4: Next Steps for Staging"
Write-Host ""
Write-Host "1️⃣  AUTHENTICATE FIREBASE" -ForegroundColor Cyan
Write-Host "   firebase login" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  DEPLOY FRONTEND" -ForegroundColor Cyan
Write-Host "   firebase deploy --only hosting --project school-erp-dev" -ForegroundColor Gray
Write-Host "   Expected result: https://school-erp-dev.firebaseapp.com 🟢" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  START BACKEND (in another terminal)" -ForegroundColor Cyan
Write-Host "   cd apps/api && node dist/index.js" -ForegroundColor Gray
Write-Host "   Expected result: Server running on http://localhost:$BackendPort 🟢" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  RUN SMOKE TESTS" -ForegroundColor Cyan
Write-Host "   curl http://localhost:$BackendPort/api/v1/health" -ForegroundColor Gray
Write-Host "   Expected result: 200 OK ✅" -ForegroundColor Gray
Write-Host ""

# Return to original location
Pop-Location

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  📋 STAGING READY FOR DEPLOYMENT" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Yellow
Write-Host "  • .deployment/STAGING_DEPLOYMENT_PLAN.md" -ForegroundColor Gray
Write-Host "  • .deployment/DEPLOYMENT_EXECUTION_REPORT.md" -ForegroundColor Gray
Write-Host ""
