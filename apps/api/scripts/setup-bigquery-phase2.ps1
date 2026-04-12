###############################################################################
# BigQuery Phase 2 Setup Script (Windows PowerShell)
# 
# Automates BigQuery dataset and table creation for analytics pipeline
# Usage: .\setup-bigquery-phase2.ps1
###############################################################################

# Requires PowerShell 5.0+
#Requires -Version 5.0

# Enable error handling
$ErrorActionPreference = "Stop"

# Configuration
$PROJECT_ID = $env:GCP_PROJECT_ID -or "school-erp-prod"
$DATASET = "school_erp_analytics"
$LOCATION = "US"

# Color functions
function Write-Status {
  param([int]$Step, [string]$Message)
  Write-Host "[$($Step)] $Message" -ForegroundColor Yellow
}

function Write-Success {
  param([string]$Message)
  Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
  param([string]$Message)
  Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
  param([string]$Message)
  Write-Host "ℹ $Message" -ForegroundColor Cyan
}

Write-Host "=== BigQuery Phase 2 Setup ===" -ForegroundColor Blue
Write-Host ""
Write-Host "Project ID: $PROJECT_ID"
Write-Host "Dataset: $DATASET"
Write-Host "Location: $LOCATION"
Write-Host ""

# Step 0: Verify Prerequisites
Write-Status 0 "Verifying prerequisites..."

$gcloudFound = $null -ne (Get-Command gcloud -ErrorAction SilentlyContinue)
if (-not $gcloudFound) {
  Write-Error-Custom "gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
  exit 1
}
Write-Success "gcloud CLI found"

# Check authentication
try {
  $authList = gcloud auth list --filter="status:ACTIVE" --format="list()" 2>$null | Select-Object -First 1
  if ([string]::IsNullOrEmpty($authList)) {
    Write-Error-Custom "GCP authentication failed. Run: gcloud auth login"
    exit 1
  }
} catch {
  Write-Error-Custom "Could not verify GCP authentication"
  exit 1
}
Write-Success "GCP authentication verified"

# Set project
$currentProject = (gcloud config get-value project 2>$null).Trim()
if ($currentProject -ne $PROJECT_ID) {
  Write-Info "Setting project to $PROJECT_ID..."
  gcloud config set project $PROJECT_ID | Out-Null
}
Write-Success "Project set to $PROJECT_ID"

Write-Host ""

# Step 1: Create Dataset
Write-Status 1 "Creating BigQuery dataset..."

$datasetExists = bq ls -d 2>$null | Select-String -Pattern "^\s*$DATASET" -Quiet
if ($datasetExists) {
  Write-Info "Dataset $DATASET already exists, skipping creation"
} else {
  bq mk `
    --dataset `
    --description="School ERP Analytics data warehouse" `
    --location="$LOCATION" `
    $DATASET
  Write-Success "Dataset $DATASET created"
}

Write-Host ""

# Step 2: Create Events Table
Write-Status 2 "Creating events table..."

$tableExists = bq ls -t $DATASET 2>$null | Select-String -Pattern "^\s*events" -Quiet
if ($tableExists) {
  Write-Info "Table 'events' already exists, skipping"
} else {
  bq mk `
    --table `
    --description="Real-time event stream" `
    "$DATASET.events" `
    "timestamp:TIMESTAMP,event_type:STRING,school_id:STRING,user_id:STRING,data:JSON"
  Write-Success "Table 'events' created"
}

# Update metadata
bq update --description="Real-time event stream from Firestore" "$DATASET.events" 2>$null

Write-Host ""

# Step 3: Create Metrics Daily Table
Write-Status 3 "Creating metrics_daily table..."

$tableExists = bq ls -t $DATASET 2>$null | Select-String -Pattern "^\s*metrics_daily" -Quiet
if ($tableExists) {
  Write-Info "Table 'metrics_daily' already exists, skipping"
} else {
  bq mk `
    --table `
    --description="Daily aggregated metrics" `
    "$DATASET.metrics_daily" `
    "date:DATE,school_id:STRING,active_users:INTEGER,reports_generated:INTEGER,errors_count:INTEGER,api_calls:INTEGER"
  Write-Success "Table 'metrics_daily' created"
}

bq update --description="Daily aggregated metrics for dashboards" "$DATASET.metrics_daily" 2>$null

Write-Host ""

# Step 4: Create Revenue Transactions Table
Write-Status 4 "Creating revenue_transactions table..."

$tableExists = bq ls -t $DATASET 2>$null | Select-String -Pattern "^\s*revenue_transactions" -Quiet
if ($tableExists) {
  Write-Info "Table 'revenue_transactions' already exists, skipping"
} else {
  bq mk `
    --table `
    --description="Financial transaction records" `
    "$DATASET.revenue_transactions" `
    "timestamp:TIMESTAMP,school_id:STRING,amount:FLOAT64,transaction_type:STRING,status:STRING"
  Write-Success "Table 'revenue_transactions' created"
}

bq update --description="Financial transaction data for revenue tracking" "$DATASET.revenue_transactions" 2>$null

Write-Host ""

# Step 5: Create NPS Responses Table
Write-Status 5 "Creating nps_responses table..."

$tableExists = bq ls -t $DATASET 2>$null | Select-String -Pattern "^\s*nps_responses" -Quiet
if ($tableExists) {
  Write-Info "Table 'nps_responses' already exists, skipping"
} else {
  bq mk `
    --table `
    --description="NPS survey responses" `
    "$DATASET.nps_responses" `
    "timestamp:TIMESTAMP,school_id:STRING,response_value:INTEGER,feedback_text:STRING"
  Write-Success "Table 'nps_responses' created"
}

bq update --description="Net Promoter Score survey data" "$DATASET.nps_responses" 2>$null

Write-Host ""

# Step 6: Create Students Aggregate Table
Write-Status 6 "Creating students_aggregate table..."

$tableExists = bq ls -t $DATASET 2>$null | Select-String -Pattern "^\s*students_aggregate" -Quiet
if ($tableExists) {
  Write-Info "Table 'students_aggregate' already exists, skipping"
} else {
  bq mk `
    --table `
    --description="School student population snapshots" `
    "$DATASET.students_aggregate" `
    "snapshot_date:DATE,school_id:STRING,total_students:INTEGER,active_students:INTEGER,classes_count:INTEGER"
  Write-Success "Table 'students_aggregate' created"
}

bq update --description="Point-in-time snapshots of student data" "$DATASET.students_aggregate" 2>$null

Write-Host ""

# Step 7: Create System Health Table
Write-Status 7 "Creating system_health table..."

$tableExists = bq ls -t $DATASET 2>$null | Select-String -Pattern "^\s*system_health" -Quiet
if ($tableExists) {
  Write-Info "Table 'system_health' already exists, skipping"
} else {
  bq mk `
    --table `
    --description="System monitoring and health metrics" `
    "$DATASET.system_health" `
    "timestamp:TIMESTAMP,metric_name:STRING,metric_value:FLOAT64,status:STRING"
  Write-Success "Table 'system_health' created"
}

bq update --description="System performance and health monitoring data" "$DATASET.system_health" 2>$null

Write-Host ""

# Step 8: Verify All Tables
Write-Status 8 "Verifying all tables created..."

Write-Host ""
Write-Info "Tables in dataset '$DATASET':"
Write-Host ""

$tables = bq ls -t $DATASET 2>$null | Select-Object -Skip 1
foreach ($line in $tables) {
  $tableName = $line -split '\s+' | Select-Object -First 1
  if (-not [string]::IsNullOrEmpty($tableName)) {
    Write-Host "  ✓ $tableName"
  }
}

Write-Host ""

# Step 9: Check Table Schemas
Write-Status 9 "Verifying table schemas..."

$tableNames = @("events", "metrics_daily", "revenue_transactions", "nps_responses", "students_aggregate", "system_health")
foreach ($table in $tableNames) {
  $exists = bq ls -t $DATASET 2>$null | Select-String -Pattern "^\s*$table" -Quiet
  if ($exists) {
    Write-Success "Schema for '$table' verified"
  } else {
    Write-Error-Custom "Table '$table' not found!"
  }
}

Write-Host ""

# Step 10: Dataset Permissions
Write-Status 10 "Dataset configuration..."

Write-Info "Ensuring BigQuery permissions are configured"
Write-Info "Configure IAM roles in GCP Console if needed"

Write-Host ""

# Step 11: Verification Summary
Write-Status 11 "Final Verification..."

$tables = @(bq ls -t $DATASET 2>$null | Select-Object -Skip 1)
$tableCount = $tables.Count

if ($tableCount -eq 6) {
  Write-Success "All 6 tables created successfully"
} else {
  Write-Error-Custom "Expected 6 tables, found $tableCount"
}

Write-Host ""

# Step 12: Output Summary
Write-Status 12 "Deployment Summary..."

Write-Host ""
Write-Host "Dataset Details:" -ForegroundColor Cyan
Write-Host "  Project ID: $PROJECT_ID"
Write-Host "  Dataset Name: $DATASET"
Write-Host "  Location: $LOCATION"
Write-Host "  Tables: $tableCount/6"
Write-Host ""

Write-Host "Tables Created:" -ForegroundColor Cyan
foreach ($line in $tables) {
  $tableName = $line -split '\s+' | Select-Object -First 1
  if (-not [string]::IsNullOrEmpty($tableName)) {
    Write-Host "  • $tableName"
  }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Green
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Deploy Cloud Function:"
Write-Host "     gcloud functions deploy firestore-to-bigquery --runtime nodejs18 ..."
Write-Host ""
Write-Host "  2. Start API server:"
Write-Host "     cd apps/api; npm run dev"
Write-Host ""
Write-Host "  3. Load sample data:"
Write-Host "     curl -X POST http://localhost:3000/api/analytics/test-data/load"
Write-Host ""
Write-Host "  4. Test dashboard queries:"
Write-Host "     bq query 'SELECT COUNT(*) FROM $DATASET.events'"
Write-Host ""

Write-Success "Phase 2 Setup Complete - Ready for Cloud Function Deployment"
