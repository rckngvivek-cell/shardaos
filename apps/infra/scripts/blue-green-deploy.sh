#!/bin/bash

# Blue-Green Deployment Script for School ERP API
# Usage: ./blue-green-deploy.sh <new-image-uri> [--no-smoke-tests]
# Example: ./blue-green-deploy.sh gcr.io/project/api:v2.1.0

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-school-erp-prod}"
REGION="${GCS_REGION:-us-central1}"
SERVICE_NAME="school-erp-api"
TRAFFIC_SHIFT_DURATION=30 # minutes

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to log with timestamp
log() {
    local level=$1
    shift
    echo -e "${!level}[$(date +'%Y-%m-%d %H:%M:%S')] $@${NC}"
}

# Function to run smoke tests
run_smoke_tests() {
    local service_url=$1
    local stage=$2
    
    log BLUE "Running smoke tests for stage $stage..."
    
    local tests=(
        "GET /health"
        "GET /api/v1/schools"
        "GET /api/v1/teachers"
        "GET /api/v1/students"
        "GET /api/v1/attendance"
        "POST /api/v1/auth/validate"
        "GET /api/v1/notifications/status"
    )
    
    for test in "${tests[@]}"; do
        local method=$(echo $test | awk '{print $1}')
        local endpoint=$(echo $test | awk '{print $2}')
        
        log BLUE "Testing: $method $endpoint"
        
        if [ "$method" == "GET" ]; then
            response=$(curl -s -w "\n%{http_code}" "$service_url$endpoint")
        else
            response=$(curl -s -w "\n%{http_code}" -X $method \
                -H "Content-Type: application/json" \
                "$service_url$endpoint")
        fi
        
        http_code=$(echo "$response" | tail -n1)
        
        if [[ $http_code -ge 200 && $http_code -lt 500 ]]; then
            log GREEN "✓ $method $endpoint - HTTP $http_code"
        else
            log RED "✗ $method $endpoint - HTTP $http_code"
            return 1
        fi
    done
    
    log GREEN "All smoke tests passed for stage $stage"
    return 0
}

# Function to shift traffic
shift_traffic() {
    local new_traffic_percent=$1
    local blue_revision=$2
    local green_revision=$3
    
    log BLUE "Shifting traffic to $new_traffic_percent%..."
    
    gcloud run services update-traffic $SERVICE_NAME \
        --to-revisions="${green_revision}=${new_traffic_percent},${blue_revision}=$((100 - new_traffic_percent))" \
        --region=$REGION \
        --project=$PROJECT_ID
    
    # Wait for traffic shift to stabilize
    sleep 30
}

# Function to get service URL
get_service_url() {
    local revision=$1
    gcloud run revisions describe $revision \
        --service=$SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)"
}

# Function to rollback immediately
rollback_immediate() {
    log RED "ROLLING BACK - Reverting to 100% blue traffic..."
    
    local blue_revision=$1
    local green_revision=$2
    
    gcloud run services update-traffic $SERVICE_NAME \
        --to-revisions="${blue_revision}=100" \
        --region=$REGION \
        --project=$PROJECT_ID
    
    log GREEN "Rollback completed"
}

# Main deployment flow
main() {
    local new_image=$1
    local skip_smoke_tests=${2:-false}
    
    log BLUE "Starting blue-green deployment for $SERVICE_NAME"
    log BLUE "New image: $new_image"
    
    # Step 1: Get current blue revision
    local blue_revision=$(gcloud run services describe $SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.traffic[0].revision.name)")
    
    log BLUE "Current blue revision: $blue_revision"
    
    # Step 2: Deploy green revision
    log BLUE "Deploying green revision..."
    
    local green_revision=$(gcloud run deploy $SERVICE_NAME \
        --image=$new_image \
        --region=$REGION \
        --project=$PROJECT_ID \
        --no-traffic \
        --format="value(status.name)")
    
    log GREEN "Green revision deployed: $green_revision"
    
    # Step 3: Run baseline smoke tests on green (10% traffic)
    if [ "$skip_smoke_tests" != "--no-smoke-tests" ]; then
        log BLUE "Stage 1: Shifting 10% traffic to green..."
        shift_traffic 10 $blue_revision $green_revision
        
        local green_url=$(get_service_url $green_revision)
        if ! run_smoke_tests $green_url "1 (10%)"; then
            log RED "Stage 1 smoke tests failed"
            rollback_immediate $blue_revision $green_revision
            exit 1
        fi
        
        # Stage 2: 30% traffic
        log BLUE "Stage 2: Shifting 30% traffic to green..."
        sleep 60
        shift_traffic 30 $blue_revision $green_revision
        
        if ! run_smoke_tests $green_url "2 (30%)"; then
            log RED "Stage 2 smoke tests failed"
            rollback_immediate $blue_revision $green_revision
            exit 1
        fi
    else
        log YELLOW "Skipping smoke tests (--no-smoke-tests)"
        shift_traffic 10 $blue_revision $green_revision
        sleep 60
        shift_traffic 30 $blue_revision $green_revision
    fi
    
    # Stage 3: 100% traffic
    log BLUE "Stage 3: Shifting 100% traffic to green..."
    sleep 60
    shift_traffic 100 $blue_revision $green_revision
    
    log GREEN "Deployment completed successfully"
    log BLUE "Blue revision: $blue_revision (kept for rollback)"
    log BLUE "Green revision: $green_revision (now active)"
    
    # Step 4: Keep blue revision for 48 hours (automated cleanup scheduled)
    log YELLOW "Blue revision will be retained for 48 hours for emergency rollback"
}

# Execute main
main "$@"
