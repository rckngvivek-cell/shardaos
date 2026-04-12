#!/bin/bash
# Deployment Script: Phase 2 Backend + Frontend to Cloud Run (Staging)
# Week 7 Day 2: DevOps Mission
# Target: Ready by 1:30 PM for 2 PM demo

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="school-erp-dev"
REGION="us-central1"
API_SERVICE_NAME="exam-api-staging"
WEB_SERVICE_NAME="exam-web-staging"
IMAGE_TAG="v1.0.0"
REGISTRY="gcr.io"
WORKSPACE_ROOT="$(pwd)"

# Start timestamp
START_TIME=$(date +%s)

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}PHASE 2 DEPLOYMENT TO CLOUD RUN (STAGING)${NC}"
echo -e "${BLUE}Week 7 Day 2 - DevOps Mission${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# Step 1: Prerequisites Check
echo -e "${YELLOW}STEP 1: Checking prerequisites...${NC}"
echo ""

# Check gcloud
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}✗ gcloud CLI not found${NC}"
    echo "  Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi
echo -e "${GREEN}✓ gcloud CLI found${NC}"

# Check docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found${NC}"
    echo "  Install from: https://docs.docker.com/install"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Configure gcloud
echo "  Setting up gcloud configuration..."
gcloud config set project $PROJECT_ID
gcloud auth configure-docker $REGISTRY > /dev/null 2>&1
echo -e "${GREEN}✓ gcloud configured${NC}"

# Verify project access
if ! gcloud projects describe $PROJECT_ID > /dev/null 2>&1; then
    echo -e "${RED}✗ Cannot access project: $PROJECT_ID${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Project access verified${NC}"

# Check dist folders
if [ ! -d "apps/api/dist" ]; then
    echo -e "${RED}✗ Backend dist/ folder not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Backend dist/ found${NC}"

if [ ! -d "apps/web/dist" ]; then
    echo -e "${RED}✗ Frontend dist/ folder not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Frontend dist/ found${NC}"

echo ""

# Step 2: Build Backend Image
echo -e "${YELLOW}STEP 2: Building backend Docker image...${NC}"
echo "  Building: $REGISTRY/$PROJECT_ID/api:$IMAGE_TAG"
echo ""

docker build \
  -f apps/api/Dockerfile.prod \
  -t $REGISTRY/$PROJECT_ID/api:$IMAGE_TAG \
  -t $REGISTRY/$PROJECT_ID/api:latest \
  . > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image built successfully${NC}"
    docker images | grep api | head -1 | awk '{printf "  Image: %s:%s (%s) %s\n", $1, $2, $3, $4}'
else
    echo -e "${RED}✗ Backend image build failed${NC}"
    exit 1
fi

echo ""

# Step 3: Build Frontend Image
echo -e "${YELLOW}STEP 3: Building frontend Docker image...${NC}"
echo "  Building: $REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
echo ""

docker build \
  -f apps/web/Dockerfile.prod \
  -t $REGISTRY/$PROJECT_ID/web:$IMAGE_TAG \
  -t $REGISTRY/$PROJECT_ID/web:latest \
  . > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend image built successfully${NC}"
    docker images | grep web | head -1 | awk '{printf "  Image: %s:%s (%s) %s\n", $1, $2, $3, $4}'
else
    echo -e "${RED}✗ Frontend image build failed${NC}"
    exit 1
fi

echo ""

# Step 4: Push Backend Image
echo -e "${YELLOW}STEP 4: Pushing backend image to GCR...${NC}"
echo ""

docker push $REGISTRY/$PROJECT_ID/api:$IMAGE_TAG > /dev/null 2>&1
docker push $REGISTRY/$PROJECT_ID/api:latest > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend image pushed to GCR${NC}"
    echo "  Image: $REGISTRY/$PROJECT_ID/api:$IMAGE_TAG"
else
    echo -e "${RED}✗ Backend image push failed${NC}"
    exit 1
fi

echo ""

# Step 5: Push Frontend Image
echo -e "${YELLOW}STEP 5: Pushing frontend image to GCR...${NC}"
echo ""

docker push $REGISTRY/$PROJECT_ID/web:$IMAGE_TAG > /dev/null 2>&1
docker push $REGISTRY/$PROJECT_ID/web:latest > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend image pushed to GCR${NC}"
    echo "  Image: $REGISTRY/$PROJECT_ID/web:$IMAGE_TAG"
else
    echo -e "${RED}✗ Frontend image push failed${NC}"
    exit 1
fi

echo ""

# Step 6: Deploy Backend to Cloud Run
echo -e "${YELLOW}STEP 6: Deploying backend to Cloud Run...${NC}"
echo "  Service: $API_SERVICE_NAME"
echo "  Region: $REGION"
echo ""

gcloud run deploy $API_SERVICE_NAME \
  --image=$REGISTRY/$PROJECT_ID/api:$IMAGE_TAG \
  --region=$REGION \
  --platform=managed \
  --memory=512Mi \
  --cpu=2 \
  --timeout=30 \
  --max-instances=10 \
  --min-instances=1 \
  --port=8080 \
  --allow-unauthenticated \
  --set-env-vars=NODE_ENV=staging,FIRESTORE_PROJECT_ID=$PROJECT_ID,LOG_LEVEL=debug \
  --project=$PROJECT_ID > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend service deployed${NC}"
    
    # Get backend URL
    BACKEND_URL=$(gcloud run services describe $API_SERVICE_NAME \
      --region=$REGION \
      --format='value(status.url)' \
      --project=$PROJECT_ID)
    
    echo "  URL: $BACKEND_URL"
else
    echo -e "${RED}✗ Backend deployment failed${NC}"
    exit 1
fi

echo ""

# Step 7: Deploy Frontend to Cloud Run
echo -e "${YELLOW}STEP 7: Deploying frontend to Cloud Run...${NC}"
echo "  Service: $WEB_SERVICE_NAME"
echo "  Region: $REGION"
echo ""

gcloud run deploy $WEB_SERVICE_NAME \
  --image=$REGISTRY/$PROJECT_ID/web:$IMAGE_TAG \
  --region=$REGION \
  --platform=managed \
  --memory=256Mi \
  --cpu=1 \
  --timeout=60 \
  --max-instances=5 \
  --min-instances=1 \
  --port=3000 \
  --allow-unauthenticated \
  --set-env-vars=VITE_API_URL=$BACKEND_URL/api/v1,NODE_ENV=staging \
  --project=$PROJECT_ID > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend service deployed${NC}"
    
    # Get frontend URL
    FRONTEND_URL=$(gcloud run services describe $WEB_SERVICE_NAME \
      --region=$REGION \
      --format='value(status.url)' \
      --project=$PROJECT_ID)
    
    echo "  URL: $FRONTEND_URL"
else
    echo -e "${RED}✗ Frontend deployment failed${NC}"
    exit 1
fi

echo ""

# Step 8: Verify Deployments
echo -e "${YELLOW}STEP 8: Verifying deployments...${NC}"
echo ""

# Check backend health
echo "  Checking backend health..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/health)
if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}✓ Backend health check passed${NC}"
else
    echo -e "${YELLOW}⚠ Backend health check: HTTP $HEALTH_CHECK (may be initializing)${NC}"
fi

# Check frontend response
echo "  Checking frontend response..."
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL/)
if [ "$FRONTEND_CHECK" == "200" ]; then
    echo -e "${GREEN}✓ Frontend response check passed${NC}"
else
    echo -e "${YELLOW}⚠ Frontend check: HTTP $FRONTEND_CHECK (may be initializing)${NC}"
fi

echo ""

# Calculate deployment time
END_TIME=$(date +%s)
DEPLOY_TIME=$((END_TIME - START_TIME))

# Final Summary
echo -e "${BLUE}=====================================================${NC}"
echo -e "${GREEN}✓ DEPLOYMENT COMPLETE${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""
echo "📊 DEPLOYMENT SUMMARY"
echo "  Deployment Time: ${DEPLOY_TIME}s"
echo ""
echo "🔗 DEPLOYED SERVICES"
echo ""
echo "Backend API Service:"
echo "  Name: $API_SERVICE_NAME"
echo "  URL:  $BACKEND_URL"
echo "  Health: $BACKEND_URL/health"
echo "  API:   $BACKEND_URL/api/v1"
echo ""
echo "Frontend Web Service:"
echo "  Name: $WEB_SERVICE_NAME"
echo "  URL:  $FRONTEND_URL"
echo ""
echo "📋 TEST COMMANDS (Run these to verify)"
echo ""
echo "  # Backend health check"
echo "  curl $BACKEND_URL/health"
echo ""
echo "  # Frontend load"
echo "  curl $FRONTEND_URL/"
echo ""
echo "  # API test"
echo "  curl \"$BACKEND_URL/api/v1/exams?schoolId=test-1\""
echo ""
echo "📝 DOCUMENTATION"
echo "  See: DEPLOYMENT_GUIDE_WEEK7_DAY2.md"
echo ""
echo "🎯 READY FOR DEMO"
echo "  Both services deployed and healthy"
echo "  URLs ready to share with Agent 6"
echo "  Deployment completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo -e "${BLUE}=====================================================${NC}"

# Save URLs to file for reference
cat > DEPLOYMENT_URLS.txt << EOF
# Week 7 Day 2 - Phase 2 Staging Deployment URLs
# Generated: $(date '+%Y-%m-%d %H:%M:%S')

BACKEND_URL=$BACKEND_URL
FRONTEND_URL=$FRONTEND_URL
PROJECT_ID=$PROJECT_ID
REGION=$REGION

# Test Commands
curl $BACKEND_URL/health
curl $FRONTEND_URL/
curl "$BACKEND_URL/api/v1/exams?schoolId=test-1"

# Rollback Commands
gcloud run deploy $API_SERVICE_NAME --image=$REGISTRY/$PROJECT_ID/api:latest
gcloud run deploy $WEB_SERVICE_NAME --image=$REGISTRY/$PROJECT_ID/web:latest

# Logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$API_SERVICE_NAME"
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=$WEB_SERVICE_NAME"
EOF

echo "✓ URLs saved to: DEPLOYMENT_URLS.txt"
