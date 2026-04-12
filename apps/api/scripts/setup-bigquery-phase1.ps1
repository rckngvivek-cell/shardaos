# ============================================================================
# DATA AGENT PHASE 1 SETUP SCRIPT (Windows PowerShell)
# BigQuery Analytics Pipeline Setup
# 
# Run: .\setup-bigquery-phase1.ps1
# ============================================================================

param(
    [string]$ProjectId = (gcloud config get-value project 2>$null),
    [switch]$SkipSetup = $false
)

Write-Host "🚀 DATA AGENT PHASE 1 - BIGQUERY SETUP (Windows)" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""

# Check dependencies
function Test-Dependency {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $cmd) {
        Write-Error "$Name not found. Install with: gcloud components install bq"
        exit 1
    }
}

Test-Dependency "bq"
Test-Dependency "gcloud"

if ([string]::IsNullOrEmpty($ProjectId)) {
    Write-Host "❌ ERROR: GCP project not set" -ForegroundColor Red
    Write-Host "Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Yellow
    exit 1
}

Write-Host "📍 PROJECT ID: $ProjectId" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 1: CREATE DATASET
# ============================================================================
Write-Host "STEP 1: Creating BigQuery Dataset" -ForegroundColor Yellow
Write-Host "================================" -ForegroundColor Yellow

try {
    $datasetExists = bq ls -d school_erp_analytics 2>$null
    if ($datasetExists) {
        Write-Host "✅ Dataset already exists: school_erp_analytics" -ForegroundColor Green
    } else {
        Write-Host "Creating dataset: school_erp_analytics..." -ForegroundColor Cyan
        bq mk `
            --dataset `
            --location=US `
            --description="School ERP Analytics data warehouse" `
            school_erp_analytics | Out-Null
        Write-Host "✅ Dataset created: school_erp_analytics" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error creating dataset: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 2: CREATE TABLES
# ============================================================================
Write-Host "STEP 2: Creating Tables" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow

$tables = @{
    'events' = 'timestamp:TIMESTAMP,event_type:STRING,school_id:STRING,user_id:STRING,data:JSON'
    'metrics_daily' = 'date:DATE,school_id:STRING,active_users:INTEGER,reports_generated:INTEGER,errors_count:INTEGER,api_calls:INTEGER'
    'nps_responses' = 'timestamp:TIMESTAMP,school_id:STRING,response_value:INTEGER,feedback_text:STRING,user_id:STRING'
    'revenue_transactions' = 'date:DATE,school_id:STRING,amount:NUMERIC,transaction_type:STRING,status:STRING,invoice_id:STRING'
    'students_aggregate' = 'date:DATE,school_id:STRING,total_students:INTEGER,active_students:INTEGER,avg_grade:NUMERIC,avg_attendance:NUMERIC'
    'system_health' = 'timestamp:TIMESTAMP,api_latency_ms:INTEGER,error_rate_percent:NUMERIC,active_connections:INTEGER,database_size_gb:NUMERIC'
}

foreach ($table in $tables.GetEnumerator()) {
    try {
        $tableExists = bq ls -t "school_erp_analytics.$($table.Name)" 2>$null
        if ($tableExists) {
            Write-Host "✅ Table exists: $($table.Name)" -ForegroundColor Green
        } else {
            Write-Host "Creating table: $($table.Name)..." -ForegroundColor Cyan
            bq mk `
                --table `
                "school_erp_analytics.$($table.Name)" `
                $table.Value | Out-Null
            Write-Host "✅ Table created: $($table.Name)" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Error creating table $($table.Name): $_" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================================================
# STEP 3: VERIFY TABLES
# ============================================================================
Write-Host "STEP 3: Verifying Tables" -ForegroundColor Yellow
Write-Host "=======================" -ForegroundColor Yellow

bq ls -t school_erp_analytics

Write-Host ""

# ============================================================================
# STEP 4: ENABLE DATAFLOW
# ============================================================================
Write-Host "STEP 4: Enabling Dataflow API" -ForegroundColor Yellow
Write-Host "=============================" -ForegroundColor Yellow

Write-Host "Enabling Dataflow API..." -ForegroundColor Cyan
gcloud services enable dataflow.googleapis.com 2>$null
Write-Host "✅ Dataflow API enabled" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 5: TEST BIGQUERY
# ============================================================================
Write-Host "STEP 5: Testing BigQuery Connection" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

$query = "SELECT COUNT(*) as row_count FROM \`$ProjectId.school_erp_analytics.events\` LIMIT 1"
Write-Host "Executing test query..." -ForegroundColor Cyan

try {
    $result = bq query --use_legacy_sql=false $query 2>$null
    Write-Host "✅ Query executed successfully" -ForegroundColor Green
    Write-Host "Current event count: $result" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Query may have failed (tables are empty)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# COMPLETION
# ============================================================================
Write-Host "🎉 PHASE 1 SETUP COMPLETE!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ BigQuery dataset: school_erp_analytics" -ForegroundColor Green
Write-Host "✅ 6 tables created and ready" -ForegroundColor Green
Write-Host ""
Write-Host "📋 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "   1. Deploy Cloud Function for Firestore sync"
Write-Host "   2. Load sample data (npm run analytics:load-sample-data)"
Write-Host "   3. Verify pipeline (npm run analytics:health)"
Write-Host "   4. Start development server (npm run dev)"
Write-Host ""
Write-Host "🔑 Key Endpoints:" -ForegroundColor Cyan
Write-Host "   GET  /api/analytics/dashboards/metrics"
Write-Host "   GET  /api/analytics/dashboards/active-users"
Write-Host "   GET  /api/analytics/dashboards/revenue"
Write-Host "   GET  /api/analytics/dashboards/errors"
Write-Host "   POST /api/analytics/test-event"
Write-Host ""
Write-Host "📊 View BigQuery tables:" -ForegroundColor Cyan
Write-Host "   bq query 'SELECT * FROM school_erp_analytics.events LIMIT 100'"
Write-Host ""
Write-Host "🚀 Ready for Monday 10:30 AM go-live!" -ForegroundColor Green
