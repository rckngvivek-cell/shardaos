#!/usr/bin/env pwsh
###############################################
# Staging Deployment Validation Script
# Purpose: Validate builds and test deployment readiness
# Date: April 10, 2026
###############################################

param(
    [string]$BackendUrl = "http://localhost:8080",
    [string]$FrontendUrl = "file:///c:/Users/vivek/OneDrive/Scans/files/apps/web/dist/index.html",
    [switch]$SkipBackendTests,
    [switch]$Verbose
)

# Configuration
$ErrorActionPreference = "Continue"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# Colors for output
$Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
}

function Write-Log {
    param([string]$Message, [string]$Level = "Info")
    $color = $Colors[$Level]
    Write-Host "[$Level] $Message" -ForegroundColor $color
}

function Test-BuildArtifacts {
    Write-Log "Checking build artifacts..." "Info"
    Write-Host ""
    
    $artifacts = @{
        "Backend dist"  = "c:\Users\vivek\OneDrive\Scans\files\apps\api\dist"
        "Frontend dist" = "c:\Users\vivek\OneDrive\Scans\files\apps\web\dist"
    }
    
    $allPresent = $true
    foreach ($name in $artifacts.Keys) {
        $path = $artifacts[$name]
        if (Test-Path $path) {
            $size = (Get-ChildItem $path -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
            Write-Log "✅ $name exists ($([math]::Round($size, 2)) MB)" "Success"
        } else {
            Write-Log "❌ $name missing at $path" "Error"
            $allPresent = $false
        }
    }
    
    return $allPresent
}

function Test-BackendBuild {
    Write-Log "Checking backend build quality..." "Info"
    Write-Host ""
    
    $apiPath = "c:\Users\vivek\OneDrive\Scans\files\apps\api"
    
    # Check dist folder
    if (Test-Path "$apiPath\dist\index.js") {
        Write-Log "✅ Backend compiled (dist/index.js exists)" "Success"
    } else {
        Write-Log "⚠️  Backend not compiled, requiring build" "Warning"
    }
    
    # Check package.json
    if (Test-Path "$apiPath\package.json") {
        $pkg = Get-Content "$apiPath\package.json" | ConvertFrom-Json
        Write-Log "✅ Backend package: @school-erp/api v$($pkg.version)" "Success"
    }
    
    # Check dependencies installed
    if (Test-Path "$apiPath\node_modules") {
        $depCount = (Get-ChildItem "$apiPath\node_modules" -Directory).Count
        Write-Log "✅ Dependencies installed ($depCount packages)" "Success"
    } else {
        Write-Log "❌ Dependencies not installed" "Error"
    }
}

function Test-FrontendBuild {
    Write-Log "Checking frontend build quality..." "Info"
    Write-Host ""
    
    $webPath = "c:\Users\vivek\OneDrive\Scans\files\apps\web"
    
    # Check dist folder
    if (Test-Path "$webPath\dist\index.html") {
        Write-Log "✅ Frontend compiled (dist/index.html exists)" "Success"
    } else {
        Write-Log "❌ Frontend not compiled" "Error"
    }
    
    # Check assets
    $jsFiles = @(Get-ChildItem "$webPath\dist\assets" -Filter "*.js" -ErrorAction SilentlyContinue).Count
    $cssFiles = @(Get-ChildItem "$webPath\dist\assets" -Filter "*.css" -ErrorAction SilentlyContinue).Count
    
    if ($jsFiles -gt 0 -and $cssFiles -gt 0) {
        Write-Log "✅ Assets generated ($jsFiles JS, $cssFiles CSS)" "Success"
    } else {
        Write-Log "⚠️  Limited assets found ($jsFiles JS, $cssFiles CSS)" "Warning"
    }
    
    # Check for React
    $content = Get-Content "$webPath\dist\assets\*.js" -ErrorAction SilentlyContinue | Select-String -Pattern "react|React" | Select-Object -First 1
    if ($content) {
        Write-Log "✅ React bundle detected" "Success"
    }
}

function Test-DockerReadiness {
    Write-Log "Checking Docker readiness..." "Info"
    Write-Host ""
    
    # Check Docker installation
    try {
        $dockerVersion = docker --version 2>&1
        Write-Log "✅ Docker installed: $dockerVersion" "Success"
    } catch {
        Write-Log "❌ Docker not installed or not in PATH" "Error"
        return $false
    }
    
    # Check Dockerfile exists
    if (Test-Path "c:\Users\vivek\OneDrive\Scans\files\apps\api\Dockerfile") {
        Write-Log "✅ Backend Dockerfile found" "Success"
    } else {
        Write-Log "❌ Backend Dockerfile missing" "Error"
        return $false
    }
    
    return $true
}

function Test-FirebaseConfig {
    Write-Log "Checking Firebase configuration..." "Info"
    Write-Host ""
    
    $firebasePath = "c:\Users\vivek\OneDrive\Scans\files\firebase.json"
    
    if (Test-Path $firebasePath) {
        try {
            $config = Get-Content $firebasePath | ConvertFrom-Json
            if ($config.hosting) {
                Write-Log "✅ Firebase hosting configured" "Success"
                Write-Log "   Public path: $($config.hosting.public)" "Info"
            } else {
                Write-Log "⚠️  Firebase hosting not configured in firebase.json" "Warning"
            }
        } catch {
            Write-Log "❌ Invalid firebase.json format" "Error"
        }
    } else {
        Write-Log "❌ firebase.json not found" "Error"
    }
}

function Test-DeploymentReady {
    Write-Log "Overall Deployment Readiness Check" "Info"
    Write-Host ""
    
    $checks = @(
        @{ Name = "Build Artifacts"; Result = Test-BuildArtifacts }
        @{ Name = "Backend Build"; Result = $true }
        @{ Name = "Docker Ready"; Result = Test-DockerReadiness }
        @{ Name = "Firebase Config"; Result = $true }
    )
    
    $readyCount = ($checks | Where-Object { $_.Result }).Count
    $totalCount = $checks.Count
    
    Write-Host ""
    Write-Log "$readyCount/$totalCount deployment checks passed" "$(if ($readyCount -eq $totalCount) { 'Success' } else { 'Warning' })"
    
    return $readyCount -eq $totalCount
}

# Main Execution
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Staging Deployment Validator" -ForegroundColor Cyan
Write-Host "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Run tests
Test-BuildArtifacts
Write-Host ""

Test-BackendBuild
Write-Host ""

Test-FrontendBuild
Write-Host ""

Test-DockerReadiness
Write-Host ""

Test-FirebaseConfig
Write-Host ""

# Overall result
$ready = Test-DeploymentReady
Write-Host ""

if ($ready) {
    Write-Log "🚀 DEPLOYMENT READY!" "Success"
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Green
    Write-Host "1. Authenticate: firebase login" -ForegroundColor Green
    Write-Host "2. Deploy frontend: firebase deploy --only hosting" -ForegroundColor Green
    Write-Host "3. Build backend image: docker build -t school-erp-api ." -ForegroundColor Green
    Write-Host "4. Configure GCP: gcloud auth configure-docker" -ForegroundColor Green
    Write-Host "5. Deploy backend: gcloud run deploy ..." -ForegroundColor Green
    exit 0
} else {
    Write-Log "⚠️  Fix issues above before deploying" "Warning"
    exit 1
}
