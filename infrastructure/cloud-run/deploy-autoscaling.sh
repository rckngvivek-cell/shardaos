#!/usr/bin/env sh
set -eu

# This script exists to mirror the single supported deployment baseline in this repo:
# build an API image, then deploy `school-erp-api` to one Cloud Run region.
PROJECT_ID="${PROJECT_ID:?Set PROJECT_ID to your Google Cloud project id.}"
REGION="${REGION:-asia-south1}"
SERVICE_NAME="${SERVICE_NAME:-school-erp-api}"
IMAGE_NAME="${IMAGE_NAME:-school-erp-api}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
IMAGE_URI="gcr.io/${PROJECT_ID}/${IMAGE_NAME}:${IMAGE_TAG}"

gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE_URI}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --concurrency 100 \
  --min-instances 0 \
  --max-instances 20 \
  --set-env-vars "NODE_ENV=production,AUTH_MODE=firebase,PORT=3000"
