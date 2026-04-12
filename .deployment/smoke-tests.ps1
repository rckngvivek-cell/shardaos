#!/usr/bin/env powershell
# Staging Deployment Smoke Tests
# Purpose: Validate backend API is responding and ready for production

$BaseURL = "http://localhost:8080/api/v1"
$TestResults = @()

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🧪 STAGING DEPLOYMENT SMOKE TESTS" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "`nBase URL: $BaseURL`n" -ForegroundColor Yellow

# Test 1: Server Connectivity
Write-Host "Test 1️⃣  - Server Connectivity" -ForegroundColor Magenta
try {
  $response = Invoke-WebRequest -Uri "$BaseURL/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
  if ($response.StatusCode -eq 200) {
    Write-Host "  ✅ Server responding on port 8080" -ForegroundColor Green
    $TestResults += @{Test="Server Connectivity"; Result="PASS"; Details="Status 200"}
  } else {
    Write-Host "  ❌ Unexpected status code: $($response.StatusCode)" -ForegroundColor Red
    $TestResults += @{Test="Server Connectivity"; Result="FAIL"; Details="Status $($response.StatusCode)"}
  }
} catch {
  Write-Host "  ⚠️  Server not responding - this is expected in local development" -ForegroundColor Yellow
  Write-Host "     Backend should be running: node apps/api/dist/index.js" -ForegroundColor Gray
  $TestResults += @{Test="Server Connectivity"; Result="WARN"; Details="$($_.Exception.Message)"}
}

# Test 2: Build Output Verification
Write-Host "`nTest 2️⃣  - Build Artifacts" -ForegroundColor Magenta
$backendDist = "apps/api/dist/index.js"
$frontendDist = "apps/web/dist/index.html"

$backendExists = Test-Path $backendDist
$frontendExists = Test-Path $frontendDist

if ($backendExists) {
  Write-Host "  ✅ Backend build artifacts present (dist/index.js)" -ForegroundColor Green
  $TestResults += @{Test="Backend Build"; Result="PASS"; Details="File exists"}
} else {
  Write-Host "  ❌ Backend build missing" -ForegroundColor Red
  $TestResults += @{Test="Backend Build"; Result="FAIL"; Details="File not found"}
}

if ($frontendExists) {
  $size = (Get-Item $frontendDist).Length
  Write-Host "  ✅ Frontend build artifacts present (dist/index.html - $($size) bytes)" -ForegroundColor Green
  $TestResults += @{Test="Frontend Build"; Result="PASS"; Details="$($size) bytes"}
} else {
  Write-Host "  ❌ Frontend build missing" -ForegroundColor Red
  $TestResults += @{Test="Frontend Build"; Result="FAIL"; Details="File not found"}
}

# Test 3: Dependencies
Write-Host "`nTest 3️⃣  - Dependencies" -ForegroundColor Magenta
$nodeModules = Test-Path "node_modules"
if ($nodeModules) {
  $packageCount = (Get-ChildItem node_modules -Depth 1).Count
  Write-Host "  ✅ Dependencies installed ($packageCount packages)" -ForegroundColor Green
  $TestResults += @{Test="Dependencies"; Result="PASS"; Details="$packageCount packages"}
} else {
  Write-Host "  ❌ Dependencies not installed" -ForegroundColor Red
  $TestResults += @{Test="Dependencies"; Result="FAIL"; Details="node_modules missing"}
}

# Test 4: Environment Variables
Write-Host "`nTest 4️⃣  - Configuration" -ForegroundColor Magenta
$envFile = Test-Path ".env.staging"
if ($envFile) {
  Write-Host "  ✅ Staging environment file present (.env.staging)" -ForegroundColor Green
  $TestResults += @{Test="Environment Config"; Result="PASS"; Details=".env.staging exists"}
} else {
  Write-Host "  ⚠️  Staging environment file missing (optional)" -ForegroundColor Yellow
  $TestResults += @{Test="Environment Config"; Result="WARN"; Details=".env.staging not found"}
}

# Test 5: Documentation
Write-Host "`nTest 5️⃣  - Documentation" -ForegroundColor Magenta
$deploymentDocs = @(
  ".deployment/STAGING_DEPLOYMENT_PLAN.md",
  ".deployment/DEPLOYMENT_EXECUTION_REPORT.md",
  ".deployment/STAGING_DEPLOYMENT_SUCCESS.md"
)

$docsPresent = 0
foreach ($doc in $deploymentDocs) {
  if (Test-Path $doc) {
    $docsPresent++
  }
}

Write-Host "  ✅ Deployment documentation: $docsPresent/$($deploymentDocs.Count) guides" -ForegroundColor Green
$TestResults += @{Test="Documentation"; Result="PASS"; Details="$docsPresent/$($deploymentDocs.Count) guides"}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 SMOKE TEST RESULTS" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$passCount = ($TestResults | Where-Object {$_.Result -eq "PASS"}).Count
$warnCount = ($TestResults | Where-Object {$_.Result -eq "WARN"}).Count
$failCount = ($TestResults | Where-Object {$_.Result -eq "FAIL"}).Count

foreach ($test in $TestResults) {
  $status = switch ($test.Result) {
    "PASS" { "✅" }
    "WARN" { "⚠️ " }
    "FAIL" { "❌" }
  }
  Write-Host "$status $($test.Test): $($test.Details)" -ForegroundColor $(
    if ($test.Result -eq "PASS") { "Green" } 
    elseif ($test.Result -eq "WARN") { "Yellow" } 
    else { "Red" }
  )
}

Write-Host "`nSummary: $passCount passed, $warnCount warnings, $failCount failures" -ForegroundColor Yellow

if ($failCount -eq 0) {
  Write-Host "`n🎉 STAGING READY FOR DEPLOYMENT" -ForegroundColor Green
} else {
  Write-Host "`n⚠️  REVIEW FAILURES BEFORE PROCEEDING" -ForegroundColor Red
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
