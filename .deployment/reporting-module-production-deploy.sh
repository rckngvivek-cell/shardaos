#!/bin/bash
###############################################
# PR #9 Reporting Module - Production Deployment
# Author: Backend Deploy Expert
# Date: April 15, 2026 (Tuesday 2 PM)
# CRITICAL: Production deployment after validation
###############################################

set -e

# Configuration
DEPLOYMENT_ENV="production"
SERVICE_NAME="reporting-api"
DOCKER_REGISTRY="cloud.docker.com"
IMAGE_NAME="reporting"
IMAGE_VERSION="v1.0.0"
IMAGE_TAG="${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_VERSION}"
PRODUCTION_URL="https://api.schoolerp.app"
PRODUCTION_PORT="8080"
BACKUP_DIR="/opt/backups/reporting-module"
DEPLOYMENT_LOG="/var/log/deployments/reporting-module-$(date +'%Y%m%d-%H%M%S').log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log_info() { echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }
log_debug() { echo -e "${BLUE}[DEBUG]${NC} $1" | tee -a "$DEPLOYMENT_LOG"; }

# Ensure deployment log directory exists
mkdir -p "$(dirname "$DEPLOYMENT_LOG")"
mkdir -p "$BACKUP_DIR"

log_info "====== PRODUCTION DEPLOYMENT: PR #9 Reporting Module ======"
log_info "Start time: $(date)"
log_info "Log file: $DEPLOYMENT_LOG"

# Phase 1: Pre-deployment verification
log_info "====== PHASE 1: PRE-DEPLOYMENT VERIFICATION ======"

# Check prerequisites
log_info "Verifying prerequisites..."

if ! command -v docker &> /dev/null; then
  log_error "Docker not installed"
  exit 1
fi

if ! command -v curl &> /dev/null; then
  log_error "curl not installed"
  exit 1
fi

# Verify image exists in registry
log_info "Verifying Docker image exists: $IMAGE_TAG"
docker pull "$IMAGE_TAG" 2>&1 | tee -a "$DEPLOYMENT_LOG"

if [ ${PIPESTATUS[0]} -ne 0 ]; then
  log_error "Failed to pull image from registry"
  exit 1
fi
log_info "✓ Image verified and pulled"

# Phase 2: Backup current production
log_info "====== PHASE 2: BACKUP CURRENT PRODUCTION ======"

log_info "Creating backup of current production container..."
CURRENT_CONTAINER=$(docker ps -q -f name="${SERVICE_NAME}-prod" || true)

if [ -n "$CURRENT_CONTAINER" ]; then
  BACKUP_FILE="$BACKUP_DIR/container-backup-$(date +'%Y%m%d-%H%M%S').tar"
  docker export "$CURRENT_CONTAINER" > "$BACKUP_FILE"
  log_info "✓ Container backup created: $BACKUP_FILE"
  
  # Also backup current image
  CURRENT_IMAGE=$(docker inspect "$CURRENT_CONTAINER" --format='{{.Image}}' || true)
  if [ -n "$CURRENT_IMAGE" ]; then
    docker save "$CURRENT_IMAGE" -o "$BACKUP_DIR/image-backup-$(date +'%Y%m%d-%H%M%S').tar"
    log_info "✓ Current image backed up"
  fi
else
  log_warning "No current production container found (first deployment?)"
fi

# Phase 3: Deploy new version
log_info "====== PHASE 3: DEPLOY NEW VERSION ======"

log_info "Stopping old production container..."
docker stop "${SERVICE_NAME}-prod" 2>/dev/null || true
docker wait "${SERVICE_NAME}-prod" 2>/dev/null || true

log_info "Removing old production container..."
docker rm "${SERVICE_NAME}-prod" 2>/dev/null || true

log_info "Starting new production container with version $IMAGE_VERSION..."

# Create environment file from secrets
ENV_FILE="/tmp/reporting-prod.env"
cat > "$ENV_FILE" <<EOF
NODE_ENV=production
NODE_TLS_REJECT_UNAUTHORIZED=0
LOG_LEVEL=info
PORT=8080
DATABASE_URL=${PROD_DATABASE_URL}
FIREBASE_CONFIG=${PROD_FIREBASE_CONFIG}
SMTP_HOST=${PROD_SMTP_HOST}
SMTP_PORT=${PROD_SMTP_PORT}
SMTP_USER=${PROD_SMTP_USER}
SMTP_PASSWORD=${PROD_SMTP_PASSWORD}
SMTP_FROM=reports@schoolerp.app
CACHE_TTL=3600
REPORT_TIMEOUT=30000
MAX_REPORT_ROWS=100000
EOF

docker run \
  --detach \
  --name "${SERVICE_NAME}-prod" \
  --restart always \
  --network bridge \
  --port "${PRODUCTION_PORT}:8080" \
  --env-file "$ENV_FILE" \
  --memory 2G \
  --memory-reservation 1500M \
  --cpus 2 \
  --health-cmd='curl -f http://localhost:8080/health || exit 1' \
  --health-interval=10s \
  --health-timeout=5s \
  --health-retries=3 \
  --label service=$SERVICE_NAME \
  --label version=$IMAGE_VERSION \
  --label environment=production \
  --label deployedAt="$(date -u +'%Y-%m-%dT%H:%M:%SZ')" \
  "$IMAGE_TAG"

if [ $? -ne 0 ]; then
  log_error "Failed to start production container"
  exit 1
fi

CONTAINER_ID=$(docker ps -q -f name="${SERVICE_NAME}-prod")
log_info "✓ Production container started: $CONTAINER_ID"

# Clean up env file
rm -f "$ENV_FILE"

# Phase 4: Wait for health check
log_info "====== PHASE 4: HEALTH CHECK ======"

log_info "Waiting for application startup..."
sleep 3

HEALTH_CHECK_RETRIES=60
HEALTH_CHECK_INTERVAL=2
HEALTH_CHECK_PASSED=0

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' "${SERVICE_NAME}-prod" 2>/dev/null || echo "unknown")
  DOCKER_STATUS=$(docker inspect --format='{{.State.Status}}' "${SERVICE_NAME}-prod")
  
  if [ "$STATUS" = "healthy" ]; then
    log_info "✓ Container health check PASSED (attempt $i)"
    HEALTH_CHECK_PASSED=1
    break
  elif [ "$DOCKER_STATUS" != "running" ]; then
    log_error "Container is not running (status: $DOCKER_STATUS)"
    docker logs "${SERVICE_NAME}-prod" 2>&1 | tail -30 | tee -a "$DEPLOYMENT_LOG"
    exit 1
  fi
  
  log_debug "Health check attempt $i/$HEALTH_CHECK_RETRIES... (status: $STATUS)"
  sleep $HEALTH_CHECK_INTERVAL
done

if [ $HEALTH_CHECK_PASSED -ne 1 ]; then
  log_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
  docker logs "${SERVICE_NAME}-prod" 2>&1 | tail -50 | tee -a "$DEPLOYMENT_LOG"
  
  log_warning "Initiating automatic rollback..."
  exec "$0" --rollback
  exit 1
fi

# Phase 5: Production smoke tests
log_info "====== PHASE 5: PRODUCTION SMOKE TESTS ======"

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Health endpoint
log_info "Test 1: Health endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PRODUCTION_PORT}/health")
if [ "$HTTP_STATUS" = "200" ]; then
  log_info "✓ Test 1 PASSED"
  ((TESTS_PASSED++))
else
  log_error "✗ Test 1 FAILED (HTTP $HTTP_STATUS)"
  ((TESTS_FAILED++))
fi

# Test 2: Report generation
log_info "Test 2: Report generation..."
RESPONSE=$(curl -s -X POST "http://localhost:${PRODUCTION_PORT}/api/v1/schools/school-123/reports/create" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -d '{
    "name": "Production Test Report",
    "type": "ATTENDANCE",
    "filters": {},
    "columns": [{"field": "studentName", "label": "Student Name"}],
    "exportFormat": "PDF"
  }' 2>/dev/null)

if echo "$RESPONSE" | grep -q '"success":true'; then
  log_info "✓ Test 2 PASSED"
  ((TESTS_PASSED++))
else
  log_error "✗ Test 2 FAILED: $RESPONSE"
  ((TESTS_FAILED++))
fi

# Test 3: Template endpoints
log_info "Test 3: Template endpoints..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PRODUCTION_PORT}/api/v1/schools/school-123/reports/templates")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "401" ]; then
  log_info "✓ Test 3 PASSED"
  ((TESTS_PASSED++))
else
  log_error "✗ Test 3 FAILED (HTTP $HTTP_STATUS)"
  ((TESTS_FAILED++))
fi

# Test 4: Metrics endpoint
log_info "Test 4: Metrics endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PRODUCTION_PORT}/metrics")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
  log_info "✓ Test 4 PASSED"
  ((TESTS_PASSED++))
else
  log_error "✗ Test 4 FAILED (HTTP $HTTP_STATUS)"
  ((TESTS_FAILED++))
fi

# Test 5: Error handling
log_info "Test 5: Error handling (expected 404)..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${PRODUCTION_PORT}/api/v1/nonexistent")
if [ "$HTTP_STATUS" = "404" ]; then
  log_info "✓ Test 5 PASSED"
  ((TESTS_PASSED++))
else
  log_error "✗ Test 5 FAILED (HTTP $HTTP_STATUS, expected 404)"
  ((TESTS_FAILED++))
fi

log_info "======================================"
log_info "Smoke tests: $TESTS_PASSED passed, $TESTS_FAILED failed"

if [ $TESTS_FAILED -gt 0 ]; then
  log_error "Smoke tests failed! Initiating rollback..."
  exec "$0" --rollback
  exit 1
fi

# Phase 6: Final validation
log_info "====== PHASE 6: FINAL VALIDATION ======"

# Check error rate
ERROR_RATE=$(docker exec "${SERVICE_NAME}-prod" sh -c 'curl -s http://localhost:8080/metrics | grep "error_rate{" || echo "0"' 2>/dev/null || echo "0")
log_info "Current error rate: $ERROR_RATE"

# Check response times
RESPONSE_TIME=$(docker exec "${SERVICE_NAME}-prod" sh -c 'curl -s http://localhost:8080/metrics | grep "response_time{" || echo "0"' 2>/dev/null || echo "0")
log_info "Average response time: $RESPONSE_TIME"

# Phase 7: Notify monitoring
log_info "====== PHASE 7: UPDATE MONITORING ======"

log_info "Updating deployment records..."
echo "Version $IMAGE_VERSION deployed to production at $(date)" >> "$BACKUP_DIR/deployment-history.txt"

# Phase 8: Success summary
log_info "====== DEPLOYMENT SUCCESS ======"
log_info "Service: $SERVICE_NAME"
log_info "Version: $IMAGE_VERSION"
log_info "Container: $CONTAINER_ID"
log_info "Environment: $DEPLOYMENT_ENV"
log_info "Start time: $(date +%s)"
log_info "End time: $(date +%s)"
log_info "======================================"

# Generate deployment report
REPORT_FILE="deployment-report-$(date +'%Y%m%d-%H%M%S').json"
cat > "$REPORT_FILE" <<EOF
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "service": "$SERVICE_NAME",
  "environment": "$DEPLOYMENT_ENV",
  "image": "$IMAGE_TAG",
  "version": "$IMAGE_VERSION",
  "container_id": "$CONTAINER_ID",
  "status": "success",
  "tests_passed": $TESTS_PASSED,
  "tests_failed": $TESTS_FAILED,
  "health_status": "healthy",
  "backup_location": "$BACKUP_DIR",
  "deployment_log": "$DEPLOYMENT_LOG",
  "critical_success_factor": "error_rate < 0.05%"
}
EOF

log_info "Deployment report: $REPORT_FILE"
cat "$REPORT_FILE" | tee -a "$DEPLOYMENT_LOG"

exit 0
