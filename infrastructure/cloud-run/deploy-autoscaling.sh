# Cloud Run Auto-scaling Configuration
# Deployed via gcloud run deploy with parameters

gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:latest \
  --region us-central1 \
  --min-instances 2 \
  --max-instances 50 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 100 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --service-account school-erp-sa@school-erp-prod.iam.gserviceaccount.com \
  --ingress all

# Regional deployments for multi-region setup
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:latest \
  --region asia-south1 \
  --min-instances 3 \
  --max-instances 30 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 100 \
  --platform managed \
  --allow-unauthenticated \
  --tag asia

gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:latest \
  --region europe-west1 \
  --min-instances 1 \
  --max-instances 20 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 100 \
  --platform managed \
  --allow-unauthenticated \
  --tag eu
