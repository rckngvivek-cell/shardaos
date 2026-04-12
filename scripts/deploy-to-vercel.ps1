#!/usr/bin/env pwsh
# Deploy to Vercel - ONE COMMAND DEPLOYMENT
# Usage: .\deploy-to-vercel.ps1

Write-Host "🚀 DEPLOYING TO VERCEL" -ForegroundColor Cyan
Write-Host "======================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check if Vercel CLI is installed
Write-Host "1️⃣  Checking Vercel CLI..." -ForegroundColor Yellow
$vercelCliCheck = npm list -g vercel 2>&1 | Select-String "vercel"
if (-not $vercelCliCheck) {
    Write-Host "   📦 Installing Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host "   ✅ Vercel CLI ready" -ForegroundColor Green
Write-Host ""

# Step 2: Build the project
Write-Host "2️⃣  Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "   ✅ Build successful" -ForegroundColor Green
Write-Host ""

# Step 3: Link to Vercel (if not already linked)
Write-Host "3️⃣  Linking to Vercel..." -ForegroundColor Yellow
$vercelrcCheck = Test-Path .vercelignore
if (-not $vercelrcCheck) {
    Write-Host "   🔗 First time - linking project..." -ForegroundColor Yellow
    vercel link --yes
}
Write-Host "   ✅ Linked to Vercel" -ForegroundColor Green
Write-Host ""

# Step 4: Deploy to production
Write-Host "4️⃣  Deploying to Vercel PRODUCTION..." -ForegroundColor Yellow
Write-Host ""
vercel --prod

Write-Host ""
Write-Host "✅ DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Your app is now live on:" -ForegroundColor Cyan
Write-Host "   https://school-erp.vercel.app" -ForegroundColor Green
Write-Host ""
Write-Host "📈 View your deployment:" -ForegroundColor Cyan
Write-Host "   https://vercel.com/dashboard" -ForegroundColor Green
Write-Host ""
