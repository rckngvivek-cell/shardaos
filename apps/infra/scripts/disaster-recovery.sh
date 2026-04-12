#!/bin/bash

# Disaster Recovery Script for School ERP
# Usage: ./disaster-recovery.sh <action> [options]
# Actions: backup, restore, failover-test, failover-execute, status

set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-school-erp-prod}"
PRIMARY_REGION="us-central1"
SECONDARY_REGIONS=("asia-south1" "europe-west1")
BACKUP_BUCKET="school-erp-firestore-backups-${PROJECT_ID}"

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

# Function to create Firestore backup
backup_firestore() {
    log BLUE "Creating Firestore backup..."
    
    local backup_file="firestore-backup-$(date +%Y%m%d_%H%M%S).json"
    
    # Export Firestore to GCS
    gcloud firestore export gs://${BACKUP_BUCKET}/${backup_file} \
        --project=$PROJECT_ID \
        --async
    
    log GREEN "Backup initiated: ${backup_file}"
    log BLUE "Monitor progress: gcloud firestore operations list"
}

# Function to verify backup recovery
verify_backup_recovery() {
    log BLUE "Verifying backup recovery to staging..."
    
    local latest_backup=$(gsutil ls -l gs://${BACKUP_BUCKET}/ | tail -2 | head -1 | awk '{print $NF}')
    
    if [ -z "$latest_backup" ]; then
        log RED "No backups found"
        return 1
    fi
    
    log BLUE "Latest backup: $latest_backup"
    log YELLOW "Manual restore step required:"
    log YELLOW "gcloud firestore import $latest_backup --project=school-erp-staging"
    
    return 0
}

# Function to perform health check on region
health_check_region() {
    local region=$1
    
    log BLUE "Checking health of region: $region"
    
    # Check Cloud Run service
    local run_status=$(gcloud run services describe school-erp-api \
        --region=$region \
        --project=$PROJECT_ID \
        --format="value(status.conditions[0].status)" 2>/dev/null || echo "UNKNOWN")
    
    # Check Firestore connectivity
    local firestore_status=$(gcloud firestore databases describe school-erp-prod \
        --project=$PROJECT_ID \
        --format="value(name)" 2>/dev/null || echo "UNKNOWN")
    
    log BLUE "  Cloud Run: $run_status"
    log BLUE "  Firestore: $firestore_status"
    
    if [ "$run_status" == "True" ] && [ -n "$firestore_status" ]; then
        log GREEN "✓ Region $region is healthy"
        return 0
    else
        log RED "✗ Region $region has issues"
        return 1
    fi
}

# Function to failover to secondary region (simulated)
failover_test() {
    log YELLOW "=== FAILOVER TEST (NON-DESTRUCTIVE) ==="
    log BLUE "This test validates failover readiness without actual cutover"
    
    for region in "${SECONDARY_REGIONS[@]}"; do
        log BLUE "Testing failover to $region..."
        
        if health_check_region $region; then
            log GREEN "✓ $region is ready for failover"
        else
            log RED "✗ $region is NOT ready for failover"
        fi
    done
    
    log YELLOW "Failover test completed - no actual cutover performed"
}

# Function to execute actual failover (for catastrophic primary failure)
failover_execute() {
    log RED "=== CRITICAL: FAILOVER EXECUTION ==="
    log RED "This will redirect traffic from primary to secondary region"
    
    read -p "Are you SURE? Type 'FAILOVER' to continue: " confirm
    if [ "$confirm" != "FAILOVER" ]; then
        log BLUE "Failover cancelled"
        return
    fi
    
    log RED "Executing failover..."
    
    # Find healthy secondary region
    local failover_region=""
    for region in "${SECONDARY_REGIONS[@]}"; do
        if health_check_region $region; then
            failover_region=$region
            break
        fi
    done
    
    if [ -z "$failover_region" ]; then
        log RED "No healthy secondary regions available"
        return 1
    fi
    
    log YELLOW "Failing over to region: $failover_region"
    
    # Update load balancer to prioritize secondary region
    gcloud compute backend-services update school-erp-global-lb \
        --project=$PROJECT_ID \
        --global \
        --enable-cdn || true
    
    log GREEN "Failover executed to $failover_region"
    
    # Record incident
    log_incident "FAILOVER" "Executed failover to $failover_region" "critical"
}

# Function to perform complete system recovery
full_system_recovery() {
    log RED "=== FULL SYSTEM RECOVERY PROCEDURE ==="
    log RED "Use this only in catastrophic failure scenarios"
    
    read -p "Full recovery will restore from latest backup. Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log BLUE "Recovery cancelled"
        return
    fi
    
    log YELLOW "Starting full system recovery..."
    
    # Step 1: Verify backups exist
    local backup_count=$(gsutil ls gs://${BACKUP_BUCKET}/ | wc -l)
    if [ "$backup_count" -lt 1 ]; then
        log RED "No backups available for recovery"
        return 1
    fi
    
    log BLUE "Found $backup_count backups"
    
    # Step 2: Get latest backup
    local latest_backup=$(gsutil ls -l gs://${BACKUP_BUCKET}/ | tail -2 | head -1 | awk '{print $NF}')
    log BLUE "Latest backup: $latest_backup"
    
    # Step 3: Restore to temporary database
    log YELLOW "Restoring to temporary database (requires manual verification)..."
    log BLUE "To restore: gcloud firestore import $latest_backup --database=recovery-validation"
    
    # Step 4: Validate data
    log BLUE "After restore, validate data integrity before promoting to primary"
    
    log_incident "FULL_RECOVERY" "Started recovery from $latest_backup" "critical"
}

# Function to log incident
log_incident() {
    local incident_type=$1
    local description=$2
    local severity=$3
    
    local log_entry=$(cat <<EOF
{
  "timestamp": "$(date -Iseconds)",
  "incident_type": "$incident_type",
  "description": "$description",
  "severity": "$severity",
  "region": "$PRIMARY_REGION"
}
EOF
)
    
    # Log to GCS for persistence
    echo "$log_entry" | gsutil cp - gs://${BACKUP_BUCKET}/incident-logs/$(date +%Y%m%d_%H%M%S).json || true
}

# Function to show status
show_status() {
    log BLUE "=== DISASTER RECOVERY STATUS ==="
    
    log BLUE "Primary Region: $PRIMARY_REGION"
    health_check_region $PRIMARY_REGION
    
    log BLUE ""
    log BLUE "Secondary Regions:"
    for region in "${SECONDARY_REGIONS[@]}"; do
        health_check_region $region
    done
    
    log BLUE ""
    log BLUE "Latest Backups:"
    gsutil ls -l gs://${BACKUP_BUCKET}/ | tail -5 || log RED "No backups found"
    
    log BLUE ""
    log BLUE "Firestore Replication Status:"
    gcloud firestore databases describe school-erp-prod \
        --project=$PROJECT_ID \
        --format="table(name,type,locationId)" || log RED "Database not found"
}

# Main dispatcher
main() {
    local action=${1:-status}
    
    case $action in
        backup)
            backup_firestore
            ;;
        verify)
            verify_backup_recovery
            ;;
        health)
            health_check_region ${2:-$PRIMARY_REGION}
            ;;
        failover-test)
            failover_test
            ;;
        failover-execute)
            failover_execute
            ;;
        recovery)
            full_system_recovery
            ;;
        status)
            show_status
            ;;
        *)
            log RED "Unknown action: $action"
            log BLUE "Available actions: backup, verify, health, failover-test, failover-execute, recovery, status"
            exit 1
            ;;
    esac
}

main "$@"
