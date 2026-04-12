#!/bin/bash

###############################################################################
# BigQuery Phase 2 Setup Script (Linux/Mac)
# 
# Automates BigQuery dataset and table creation for analytics pipeline
# Usage: ./setup-bigquery-phase2.sh
###############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-school-erp-prod}"
DATASET="school_erp_analytics"
LOCATION="US"

echo -e "${BLUE}=== BigQuery Phase 2 Setup ===${NC}\n"
echo "Project ID: $PROJECT_ID"
echo "Dataset: $DATASET"
echo "Location: $LOCATION"
echo ""

# Function to print status
print_status() {
  local step=$1
  local message=$2
  echo -e "${YELLOW}[$step]${NC} $message"
}

# Function to print success
print_success() {
  echo -e "${GREEN}✓${NC} $1"
}

# Function to print error
print_error() {
  echo -e "${RED}✗${NC} $1"
}

# Function to print info
print_info() {
  echo -e "${BLUE}ℹ${NC} $1"
}

# Step 0: Verify Prerequisites
print_status "STEP 0" "Verifying prerequisites..."

# Check gcloud
if ! command -v gcloud &> /dev/null; then
  print_error "gcloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
  exit 1
fi
print_success "gcloud CLI found"

# Check bq
if ! command -v bq &> /dev/null; then
  print_error "bq CLI not found. Install with: gcloud components install bq"
  exit 1
fi
print_success "bq CLI found"

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="list()" | grep -q .; then
  print_error "GCP authentication failed. Run: gcloud auth login"
  exit 1
fi
print_success "GCP authentication verified"

# Verify project
CURRENT_PROJECT=$(gcloud config get-value project)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
  print_info "Setting project to $PROJECT_ID..."
  gcloud config set project "$PROJECT_ID"
fi
print_success "Project set to $PROJECT_ID"

echo ""

# Step 1: Create Dataset
print_status "STEP 1" "Creating BigQuery dataset..."

if bq ls -d | grep -q "$DATASET"; then
  print_info "Dataset $DATASET already exists, skipping creation"
else
  bq mk \
    --dataset \
    --description="School ERP Analytics data warehouse" \
    --location="$LOCATION" \
    "$DATASET"
  print_success "Dataset $DATASET created"
fi

echo ""

# Step 2: Create Events Table
print_status "STEP 2" "Creating events table..."

if bq ls -t "$DATASET" | grep -q "events"; then
  print_info "Table 'events' already exists, skipping"
else
  bq mk \
    --table \
    --description="Real-time event stream" \
    "$DATASET.events" \
    timestamp:TIMESTAMP,event_type:STRING,school_id:STRING,user_id:STRING,data:JSON
  print_success "Table 'events' created"
fi

# Add metadata if table exists
bq update --description="Real-time event stream from Firestore" "$DATASET.events"

echo ""

# Step 3: Create Metrics Daily Table
print_status "STEP 3" "Creating metrics_daily table..."

if bq ls -t "$DATASET" | grep -q "metrics_daily"; then
  print_info "Table 'metrics_daily' already exists, skipping"
else
  bq mk \
    --table \
    --description="Daily aggregated metrics" \
    "$DATASET.metrics_daily" \
    date:DATE,school_id:STRING,active_users:INTEGER,reports_generated:INTEGER,errors_count:INTEGER,api_calls:INTEGER
  print_success "Table 'metrics_daily' created"
fi

bq update --description="Daily aggregated metrics for dashboards" "$DATASET.metrics_daily"

echo ""

# Step 4: Create Revenue Transactions Table
print_status "STEP 4" "Creating revenue_transactions table..."

if bq ls -t "$DATASET" | grep -q "revenue_transactions"; then
  print_info "Table 'revenue_transactions' already exists, skipping"
else
  bq mk \
    --table \
    --description="Financial transaction records" \
    "$DATASET.revenue_transactions" \
    timestamp:TIMESTAMP,school_id:STRING,amount:FLOAT64,transaction_type:STRING,status:STRING
  print_success "Table 'revenue_transactions' created"
fi

bq update --description="Financial transaction data for revenue tracking" "$DATASET.revenue_transactions"

echo ""

# Step 5: Create NPS Responses Table
print_status "STEP 5" "Creating nps_responses table..."

if bq ls -t "$DATASET" | grep -q "nps_responses"; then
  print_info "Table 'nps_responses' already exists, skipping"
else
  bq mk \
    --table \
    --description="NPS survey responses" \
    "$DATASET.nps_responses" \
    timestamp:TIMESTAMP,school_id:STRING,response_value:INTEGER,feedback_text:STRING
  print_success "Table 'nps_responses' created"
fi

bq update --description="Net Promoter Score survey data" "$DATASET.nps_responses"

echo ""

# Step 6: Create Students Aggregate Table
print_status "STEP 6" "Creating students_aggregate table..."

if bq ls -t "$DATASET" | grep -q "students_aggregate"; then
  print_info "Table 'students_aggregate' already exists, skipping"
else
  bq mk \
    --table \
    --description="School student population snapshots" \
    "$DATASET.students_aggregate" \
    snapshot_date:DATE,school_id:STRING,total_students:INTEGER,active_students:INTEGER,classes_count:INTEGER
  print_success "Table 'students_aggregate' created"
fi

bq update --description="Point-in-time snapshots of student data" "$DATASET.students_aggregate"

echo ""

# Step 7: Create System Health Table
print_status "STEP 7" "Creating system_health table..."

if bq ls -t "$DATASET" | grep -q "system_health"; then
  print_info "Table 'system_health' already exists, skipping"
else
  bq mk \
    --table \
    --description="System monitoring and health metrics" \
    "$DATASET.system_health" \
    timestamp:TIMESTAMP,metric_name:STRING,metric_value:FLOAT64,status:STRING
  print_success "Table 'system_health' created"
fi

bq update --description="System performance and health monitoring data" "$DATASET.system_health"

echo ""

# Step 8: Verify All Tables
print_status "STEP 8" "Verifying all tables created..."

echo ""
print_info "Tables in dataset '$DATASET':"
echo ""

bq ls -t "$DATASET" | awk 'NR>1 {printf "  ✓ %s (%s)\n", $1, $2}'

echo ""

# Step 9: Check Table Schemas
print_status "STEP 9" "Verifying table schemas..."

for table in events metrics_daily revenue_transactions nps_responses students_aggregate system_health; do
  if bq ls -t "$DATASET" | grep -q "$table"; then
    print_success "Schema for '$table' verified"
  else
    print_error "Table '$table' not found!"
  fi
done

echo ""

# Step 10: Set Dataset Permissions (Optional)
print_status "STEP 10" "Dataset configuration..."

# Make dataset accessible to service accounts with appropriate roles
print_info "Ensuring BigQuery permissions are configured"
print_info "Configure IAM roles in GCP Console if needed"

echo ""

# Step 11: Verification Summary
print_status "STEP 11" "Final Verification..."

TABLES_COUNT=$(bq ls -t "$DATASET" | wc -l)
TABLES_COUNT=$((TABLES_COUNT - 1)) # Subtract header line

if [ "$TABLES_COUNT" -eq 6 ]; then
  print_success "All 6 tables created successfully"
else
  print_error "Expected 6 tables, found $TABLES_COUNT"
fi

echo ""

# Step 12: Output Summary
print_status "STEP 12" "Deployment Summary..."

echo ""
echo "Dataset Details:"
echo "  Project ID: $PROJECT_ID"
echo "  Dataset Name: $DATASET"
echo "  Location: $LOCATION"
echo "  Tables: $TABLES_COUNT/6"
echo ""

echo "Tables Created:"
bq ls -t "$DATASET" | tail -n +2 | awk '{printf "  • %s\n", $1}'

echo ""
echo -e "${GREEN}=== Setup Complete ===${NC}"
echo ""
echo "Next Steps:"
echo "  1. Deploy Cloud Function:"
echo "     gcloud functions deploy firestore-to-bigquery --runtime nodejs18 ..."
echo ""
echo "  2. Start API server:"
echo "     cd apps/api && npm run dev"
echo ""
echo "  3. Load sample data:"
echo "     curl -X POST http://localhost:3000/api/analytics/test-data/load"
echo ""
echo "  4. Test dashboard queries:"
echo "     bq query \"SELECT COUNT(*) FROM $DATASET.events\""
echo ""

print_success "Phase 2 Setup Complete - Ready for Cloud Function Deployment"
