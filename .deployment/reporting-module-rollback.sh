#!/bin/bash
###############################################
# PR #9 Reporting Module - Rollback Procedure
# Author: Backend Deploy Expert
# Date: April 15, 2026
# CRITICAL: Emergency rollback for production issues
###############################################

set -e

# Configuration
SERVICE_NAME="reporting-api"
BACKUP_DIR="/opt/backups/reporting-module"
DOCKER_REGISTRY="cloud.docker.com"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_critical() { echo -e "${RED}[CRITICAL]${NC} $1"; }

ROLLBACK_LOG="/var/log/deployments/rollback-$(date +'%Y%m%d-%H%M%S').log"
mkdir -p "$(dirname "$ROLLBACK_LOG")"

log_critical "====== ROLLBACK INITIATED ======"
log_critical "Time: $(date)"
log_critical "Rollback log: $ROLLBACK_LOG"

# Phase 1: Verify current state
log_info "====== PHASE 1: VERIFY CURRENT STATE ======"

CURRENT_CONTAINER=$(docker ps -q -f name="${SERVICE_NAME}-prod" || true)
if [ -n "$CURRENT_CONTAINER" ]; then
  log_info "Current production container: $CURRENT_CONTAINER"
  CURRENT_IMAGE=$(docker inspect "$CURRENT_CONTAINER" --format='{{.Image}}')
  log_info "Current image: $CURRENT_IMAGE"
  CURRENT_VERSION=$(docker inspect "$CURRENT_CONTAINER" --format='{{.Config.Labels.version}}')
  log_info "Current version: $CURRENT_VERSION"
else
  log_warning "No current production container found"
fi

# Phase 2: Find latest backup
log_info "====== PHASE 2: LOCATE BACKUP ======"

if [ ! -d "$BACKUP_DIR" ]; then
  log_error "Backup directory not found: $BACKUP_DIR"
  exit 1
fi

LATEST_IMAGE_BACKUP=$(ls -t "$BACKUP_DIR"/image-backup-*.tar 2>/dev/null | head -1 || true)
LATEST_CONTAINER_BACKUP=$(ls -t "$BACKUP_DIR"/container-backup-*.tar 2>/dev/null | head -1 || true)

if [ -z "$LATEST_IMAGE_BACKUP" ]; then
  log_error "No image backup found"
  exit 1
fi

log_info "Latest image backup: $LATEST_IMAGE_BACKUP"
log_info "Latest container backup: $LATEST_CONTAINER_BACKUP"

# Phase 3: Load backup image
log_info "====== PHASE 3: LOAD BACKUP IMAGE ======"

log_warning "Loading backup image..."
if ! docker load -i "$LATEST_IMAGE_BACKUP" 2>&1 | tee -a "$ROLLBACK_LOG"; then
  log_error "Failed to load backup image"
  exit 1
fi

BACKUP_IMAGE=$(tar -tzf "$LATEST_IMAGE_BACKUP" | grep -E '^.*\.json$' | head -1 | xargs -I {} tar -xzOf "$LATEST_IMAGE_BACKUP" {} | grep -o '"RepoTags":\[.*\]' | sed 's/.*://;s/["]//g;s/,//;s/\]//' | head -1)
log_info "Backup image identified: $BACKUP_IMAGE"

# Phase 4: Stop current production
log_info "====== PHASE 4: STOP CURRENT PRODUCTION ======"

if [ -n "$CURRENT_CONTAINER" ]; then
  log_warning "Stopping current production container..."
  docker stop "${SERVICE_NAME}-prod" 2>&1 | tee -a "$ROLLBACK_LOG"
  docker wait "${SERVICE_NAME}-prod" 2>/dev/null || true
  log_info "✓ Current container stopped"
  
  # Save current container for investigation
  FAILED_CONTAINER_BACKUP="$BACKUP_DIR/failed-container-$(date +'%Y%m%d-%H%M%S').tar"
  log_info "Saving failed container for investigation: $FAILED_CONTAINER_BACKUP"
  docker export "$CURRENT_CONTAINER" > "$FAILED_CONTAINER_BACKUP" 2>&1 | tee -a "$ROLLBACK_LOG"
  
  log_warning "Removing failed production container..."
  docker rm "${SERVICE_NAME}-prod" 2>&1 | tee -a "$ROLLBACK_LOG"
else
  log_warning "No container to stop"
fi

# Phase 5: Start previous version
log_info "====== PHASE 5: START PREVIOUS VERSION ======"

log_warning "Starting production container with previous version..."

docker run \
  --detach \
  --name "${SERVICE_NAME}-prod" \
  --restart always \
  --network bridge \
  --port 8080:8080 \
  --env NODE_ENV=production \
  --env LOG_LEVEL=warn \
  --memory 2G \
  --memory-reservation 1500M \
  --cpus 2 \
  --health-cmd='curl -f http://localhost:8080/health || exit 1' \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=3 \
  --label service=$SERVICE_NAME \
  --label rollback=true \
  --label rolledbackAt="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  "$BACKUP_IMAGE" 2>&1 | tee -a "$ROLLBACK_LOG"

if [ $? -ne 0 ]; then
  log_error "Failed to start previous version container"
  exit 1
fi

ROLLBACK_CONTAINER=$(docker ps -q -f name="${SERVICE_NAME}-prod")
log_info "✓ Rollback container started: $ROLLBACK_CONTAINER"

# Phase 6: Verify rollback
log_info "====== PHASE 6: VERIFY ROLLBACK ======"

log_info "Waiting for application startup..."
sleep 5

# Health check
HEALTH_CHECK_RETRIES=30
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${SERVICE_NAME}-prod" 2>/dev/null || echo "unknown")
  
  if [ "$STATUS" = "healthy" ]; then
    log_info "✓ Rollback container is healthy"
    break
  elif [ $i -eq $HEALTH_CHECK_RETRIES ]; then
    log_error "Rollback container health check failed"
    docker logs "${SERVICE_NAME}-prod" 2>&1 | tail -30 | tee -a "$ROLLBACK_LOG"
    exit 1
  fi
  
  sleep 2
done

# Smoke tests on rollback
log_info "Running smoke tests..."
SMOKE_TESTS_PASSED=0

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/health")
if [ "$HTTP_STATUS" = "200" ]; then
  ((SMOKE_TESTS_PASSED++))
  log_info "✓ Health endpoint working"
else
  log_error "✗ Health endpoint failed (HTTP $HTTP_STATUS)"
fi

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8080/api/v1/schools/test/reports/templates")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
  ((SMOKE_TESTS_PASSED++))
  log_info "✓ API endpoints working"
else
  log_error "✗ API endpoints failed (HTTP $HTTP_STATUS)"
fi

if [ $SMOKE_TESTS_PASSED -lt 2 ]; then
  log_error "Smoke tests failed after rollback"
  exit 1
fi

# Phase 7: Cleanup and documentation
log_info "====== PHASE 7: CLEANUP & DOCUMENTATION ======"

# Clean up unused images
log_info "Cleaning up unused Docker images..."
docker image prune -af --filter "until=24h" 2>/dev/null || true

# Create rollback report
ROLLBACK_REPORT="rollback-report-$(date +'%Y%m%d-%H%M%S').json"
cat > "$ROLLBACK_REPORT" <<EOF
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "service": "$SERVICE_NAME",
  "status": "rollback_complete",
  "previous_version": "$CURRENT_VERSION",
  "restored_version": "$(docker inspect "$ROLLBACK_CONTAINER" --format='{{.Config.Labels.version}}')",
  "previous_container": "$CURRENT_CONTAINER",
  "rollback_container": "$ROLLBACK_CONTAINER",
  "failed_container_backup": "$FAILED_CONTAINER_BACKUP",
  "image_backup_restored": "$LATEST_IMAGE_BACKUP",
  "rollback_log": "$ROLLBACK_LOG",
  "smoke_tests_passed": $SMOKE_TESTS_PASSED,
  "action_required": "URGENT: Investigate failed deployment and fix issues before next retry"
}
EOF

log_critical "====== ROLLBACK COMPLETE ======"
log_critical "Previous version is now running"
log_critical "Rollback report: $ROLLBACK_REPORT"
log_critical ""
log_critical "NEXT ACTIONS:"
log_critical "1. Review logs: $ROLLBACK_LOG"
log_critical "2. Check failed backup: $FAILED_CONTAINER_BACKUP"
log_critical "3. Investigate root cause"
log_critical "4. Fix code issues"
log_critical "5. Notify team immediately"
log_critical "======================================"

cat "$ROLLBACK_REPORT"

# Alert team
if [ -n "$ALERTING_WEBHOOK" ]; then
  log_info "Sending alert to team..."
  curl -X POST "$ALERTING_WEBHOOK" \
    -H 'Content-Type: application/json' \
    -d @"$ROLLBACK_REPORT" 2>/dev/null || true
fi

exit 0
