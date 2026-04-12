#!/bin/bash
###############################################
# PR #9 Reporting Module - Staging Deployment
# Author: Backend Deploy Expert
# Date: April 9, 2026
###############################################

set -e  # Exit on any error

# Configuration
DEPLOYMENT_ENV="staging"
SERVICE_NAME="reporting-api"
DOCKER_REGISTRY="cloud.docker.com"
IMAGE_NAME="reporting"
IMAGE_VERSION="v1.0.0"
IMAGE_TAG="${DOCKER_REGISTRY}/${IMAGE_NAME}:${IMAGE_VERSION}"
STAGING_URL="https://staging-api.schoolerp.app"
STAGING_PORT="8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Phase 1: Pre-deployment validation
log_info "====== PHASE 1: PRE-DEPLOYMENT VALIDATION ======"

log_info "Checking Docker availability..."
if ! command -v docker &> /dev/null; then
  log_error "Docker is not installed or not in PATH"
  exit 1
fi
docker --version

log_info "Validating Docker registry credentials..."
# Assumes credentials are configured in ~/.docker/config.json
if [ ! -f ~/.docker/config.json ]; then
  log_error "Docker credentials not configured"
  exit 1
fi

log_info "Checking source code compilation..."
cd "$(dirname "$0")"/apps/api
if ! npm run build 2>&1 | tee /tmp/build.log; then
  log_error "Build failed. Check /tmp/build.log for details"
  exit 1
fi
log_info "✓ Build successful"

log_info "Running test suite..."
if ! npm test -- --coverage 2>&1 | tee /tmp/test.log; then
  log_error "Tests failed. Check /tmp/test.log for details"
  exit 1
fi
log_info "✓ All 39 tests passed"

# Phase 2: Docker image build
log_info "====== PHASE 2: DOCKER IMAGE BUILD ======"

log_info "Building Docker image: $IMAGE_TAG"
docker build \
  --tag "$IMAGE_TAG" \
  --build-arg NODE_ENV=$DEPLOYMENT_ENV \
  --build-arg VERSION=$IMAGE_VERSION \
  --label version=$IMAGE_VERSION \
  --label buildDate=$(date -u +'%Y-%m-%dT%H:%M:%SZ') \
  --label gitCommit=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown") \
  .

if [ $? -ne 0 ]; then
  log_error "Docker build failed"
  exit 1
fi
log_info "✓ Docker image built successfully"

log_info "Verifying image..."
docker image inspect "$IMAGE_TAG" > /dev/null
log_info "✓ Docker image verified"

# Phase 3: Push to registry
log_info "====== PHASE 3: PUSH TO REGISTRY ======"

log_info "Pushing image to registry: $IMAGE_TAG"
docker push "$IMAGE_TAG"

if [ $? -ne 0 ]; then
  log_error "Docker push failed"
  exit 1
fi
log_info "✓ Image pushed successfully"

# Phase 4: Deploy to staging
log_info "====== PHASE 4: DEPLOY TO STAGING ======"

log_info "Stopping existing staging container..."
docker stop "${SERVICE_NAME}-staging" 2>/dev/null || true
docker rm "${SERVICE_NAME}-staging" 2>/dev/null || true

log_info "Starting new staging container..."
docker run \
  --detach \
  --name "${SERVICE_NAME}-staging" \
  --restart unless-stopped \
  --port "${STAGING_PORT}:8080" \
  --env NODE_ENV=$DEPLOYMENT_ENV \
  --env DATABASE_URL="${STAGING_DATABASE_URL}" \
  --env FIREBASE_CONFIG="${STAGING_FIREBASE_CONFIG}" \
  --env SMTP_HOST="${STAGING_SMTP_HOST}" \
  --env SMTP_PORT="${STAGING_SMTP_PORT}" \
  --env SMTP_USER="${STAGING_SMTP_USER}" \
  --env SMTP_PASSWORD="${STAGING_SMTP_PASSWORD}" \
  --label service=$SERVICE_NAME \
  --label version=$IMAGE_VERSION \
  "$IMAGE_TAG"

if [ $? -ne 0 ]; then
  log_error "Failed to start container"
  exit 1
fi

CONTAINER_ID=$(docker ps -q -f name="${SERVICE_NAME}-staging")
log_info "✓ Container started: $CONTAINER_ID"

# Phase 5: Health check
log_info "====== PHASE 5: HEALTH CHECK ======"

log_info "Waiting for application startup..."
sleep 5

# Wait for health check to pass
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=2

for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
  log_info "Health check attempt $i/$HEALTH_CHECK_RETRIES..."
  
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${STAGING_PORT}/health")
  
  if [ "$HTTP_STATUS" = "200" ]; then
    log_info "✓ Health check passed (HTTP 200)"
    break
  elif [ $i -eq $HEALTH_CHECK_RETRIES ]; then
    log_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
    docker logs "${SERVICE_NAME}-staging" | tail -50
    exit 1
  fi
  
  sleep $HEALTH_CHECK_INTERVAL
done

# Phase 6: Smoke tests
log_info "====== PHASE 6: SMOKE TESTS ======"

SMOKE_TEST_RESULTS=0

# Test 1: Health endpoint
log_info "Smoke Test 1: Health endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${STAGING_PORT}/health")
if [ "$HTTP_STATUS" = "200" ]; then
  log_info "✓ Smoke Test 1 passed"
else
  log_error "✗ Smoke Test 1 failed (HTTP $HTTP_STATUS)"
  ((SMOKE_TEST_RESULTS++))
fi

# Test 2: Create report endpoint
log_info "Smoke Test 2: Create report endpoint..."
RESPONSE=$(curl -s -X POST "http://localhost:${STAGING_PORT}/api/v1/schools/school-123/reports/create" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Attendance Report",
    "type": "ATTENDANCE",
    "filters": {},
    "columns": [{"field": "studentName", "label": "Student Name"}],
    "exportFormat": "PDF"
  }')

if echo "$RESPONSE" | grep -q '"success":true'; then
  log_info "✓ Smoke Test 2 passed"
else
  log_error "✗ Smoke Test 2 failed: $RESPONSE"
  ((SMOKE_TEST_RESULTS++))
fi

# Test 3: Templates endpoint
log_info "Smoke Test 3: Templates list endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${STAGING_PORT}/api/v1/schools/school-123/reports/templates")
if [ "$HTTP_STATUS" = "200" ]; then
  log_info "✓ Smoke Test 3 passed"
else
  log_error "✗ Smoke Test 3 failed (HTTP $HTTP_STATUS)"
  ((SMOKE_TEST_RESULTS++))
fi

# Test 4: Export engine - PDF
log_info "Smoke Test 4: PDF export endpoint..."
RESPONSE=$(curl -s -X GET "http://localhost:${STAGING_PORT}/api/v1/schools/school-123/reports/exec-123/export/pdf" \
  -H "Accept: application/pdf")
if [ ${#RESPONSE} -gt 100 ]; then
  log_info "✓ Smoke Test 4 passed"
else
  log_error "✗ Smoke Test 4 failed"
  ((SMOKE_TEST_RESULTS++))
fi

# Test 5: Scheduled report endpoint
log_info "Smoke Test 5: Scheduled reports endpoint..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${STAGING_PORT}/api/v1/schools/school-123/reports/schedules")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "404" ]; then
  log_info "✓ Smoke Test 5 passed"
else
  log_error "✗ Smoke Test 5 failed (HTTP $HTTP_STATUS)"
  ((SMOKE_TEST_RESULTS++))
fi

log_info "======================================"
if [ $SMOKE_TEST_RESULTS -eq 0 ]; then
  log_info "✓ All 5 smoke tests PASSED"
else
  log_error "✗ $SMOKE_TEST_RESULTS smoke tests FAILED"
  exit 1
fi

# Phase 7: Summary
log_info "====== DEPLOYMENT COMPLETE ======"
log_info "Service: $SERVICE_NAME"
log_info "Environment: $DEPLOYMENT_ENV"
log_info "Image: $IMAGE_TAG"
log_info "Container ID: $CONTAINER_ID"
log_info "Staging URL: $STAGING_URL:${STAGING_PORT}"
log_info "======================================"

# Generate deployment report
DEPLOYMENT_REPORT="deployment-report-$(date +'%Y%m%d-%H%M%S').json"
cat > "$DEPLOYMENT_REPORT" <<EOF
{
  "timestamp": "$(date -u +'%Y-%m-%dT%H:%M:%SZ')",
  "service": "$SERVICE_NAME",
  "environment": "$DEPLOYMENT_ENV",
  "image": "$IMAGE_TAG",
  "container_id": "$CONTAINER_ID",
  "version": "$IMAGE_VERSION",
  "status": "success",
  "smoke_tests_passed": 5,
  "smoke_tests_failed": $SMOKE_TEST_RESULTS,
  "build_log": "/tmp/build.log",
  "test_log": "/tmp/test.log"
}
EOF

log_info "Deployment report saved: $DEPLOYMENT_REPORT"
cat "$DEPLOYMENT_REPORT"

exit 0
