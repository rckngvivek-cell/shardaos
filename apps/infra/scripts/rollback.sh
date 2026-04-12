#!/bin/bash

# Rollback Script for School ERP Production
# Usage: ./rollback.sh [--force] [--revision <revision-name>]

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-school-erp-prod}"
REGION="${GCS_REGION:-us-central1}"
SERVICE_NAME="school-erp-api"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    local level=$1
    shift
    echo -e "${!level}[$(date +'%Y-%m-%d %H:%M:%S')] $@${NC}"
}

# Function to get previous healthy revision
get_previous_healthy_revision() {
    # Get list of recent revisions sorted by date
    gcloud run revisions list \
        --service=$SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --sort-by="~DEPLOYED_TIME" \
        --filter="status=ACTIVE" \
        --limit=2 \
        --format="value(name)" | tail -n +2
}

# Function to verify revision is healthy
verify_revision_healthy() {
    local revision=$1
    log BLUE "Verifying revision $revision is healthy..."
    
    # Get service with this revision
    local service_url=$(gcloud run revisions describe $revision \
        --service=$SERVICE_NAME \
        --region=$REGION \
        --project=$PROJECT_ID \
        --format="value(status.url)")
    
    # Check health endpoint
    local health_check=$(curl -s "$service_url/health" | grep -q "OK" && echo "true" || echo "false")
    
    if [ "$health_check" == "true" ]; then
        log GREEN "✓ Revision $revision is healthy"
        return 0
    else
        log RED "✗ Revision $revision is unhealthy"
        return 1
    fi
}

# Function to execute rollback
execute_rollback() {
    local target_revision=$1
    local force_flag=$2
    
    if [ "$force_flag" != "--force" ]; then
        log YELLOW "Ready to rollback to revision: $target_revision"
        read -p "Confirm rollback? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            log BLUE "Rollback cancelled"
            exit 0
        fi
    fi
    
    log RED "Executing rollback to revision: $target_revision"
    
    gcloud run services update-traffic $SERVICE_NAME \
        --to-revisions="${target_revision}=100" \
        --region=$REGION \
        --project=$PROJECT_ID
    
    log GREEN "Rollback completed successfully"
}

# Main logic
main() {
    local force_flag=""
    local target_revision=""
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                force_flag="--force"
                shift
                ;;
            --revision)
                target_revision="$2"
                shift 2
                ;;
            *)
                log RED "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    log BLUE "Starting rollback process for $SERVICE_NAME..."
    
    # If revision not specified, find previous healthy one
    if [ -z "$target_revision" ]; then
        log BLUE "Finding previous healthy revision..."
        target_revision=$(get_previous_healthy_revision)
        
        if [ -z "$target_revision" ]; then
            log RED "No previous healthy revisions found"
            exit 1
        fi
        
        log BLUE "Found previous revision: $target_revision"
    fi
    
    # Verify target revision is healthy
    if ! verify_revision_healthy $target_revision; then
        log RED "Target revision is not healthy"
        exit 1
    fi
    
    # Execute rollback
    execute_rollback $target_revision $force_flag
}

main "$@"
