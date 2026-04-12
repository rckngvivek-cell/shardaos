#!/usr/bin/env pwsh
<#
DEMO QUICK-START: Create public URL for local API
Uses ngrok (free) or similar tunnel service
#>

Write-Host @"
============================================
DEMO SETUP: Public URL for Local API
============================================

Your API is running locally on port 8080.
This script creates a public, temporary URL for the demo.
============================================
"@ -ForegroundColor Green

# Check if ngrok is installed
$ngrokPath = Try { (Get-Command ngrok -ErrorAction Stop).Source } Catch { $null }

if ($ngrokPath) {
    Write-Host "`n✓ ngrok found at: $ngrokPath" -ForegroundColor Green
    Write-Host "`nStarting ngrok tunnel..." -ForegroundColor Cyan
    Write-Host "Your public URL will appear below in 3 seconds..." -ForegroundColor Yellow
    Write-Host "`n" -ForegroundColor Gray
    
    & ngrok http 8080 --log=stdout
}
else {
    Write-Host "`n⚠ ngrok not installed (needed for public URL tunnel)" -ForegroundColor Yellow
    Write-Host "`nFast alternative - Run locally:" -ForegroundColor Green
    Write-Host @"
    
    For local demo on your machine:
    1. API is running on: http://localhost:8080/api/v1
    2. Health check: http://localhost:8080/health
    
    For remote demo (use this):
    A. Download ngrok: https://ngrok.com/download
    B. Extract and add to PATH
    C. Run: ngrok http 8080
    D. Share the HTTPS URL with Agent 6
    
    OR use Cloudflare Tunnel (free, no signup needed):
    A. Download: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/
    B. Run: cloudflared tunnel --url http://localhost:8080
    C. Share the public URL
    
    OR ask Agent 4 to enable billing on GCP project to deploy to Cloud Run permanently.
"@ -ForegroundColor Cyan
}
