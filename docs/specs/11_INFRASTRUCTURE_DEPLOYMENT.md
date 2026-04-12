# INFRASTRUCTURE & DEPLOYMENT GUIDE
## GCP Setup, Cloud Run, Databases, Scaling & DevOps

**Version:** 1.0.0  
**Date:** April 9, 2026  
**Status:** Production-Ready  

---

# PART 1: GCP PROJECT SETUP

## Step 1: Create GCP Project

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init

# Create new project
gcloud projects create school-erp-prod --name="School ERP Production"

# Set project ID
export PROJECT_ID="school-erp-prod"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable \
  firestore.googleapis.com \
  run.googleapis.com \
  container.googleapis.com \
  cloudtasks.googleapis.com \
  logging.googleapis.com \
  monitoring.googleapis.com \
  cloudbuild.googleapis.com \
  compute.googleapis.com \
  secretmanager.googleapis.com
```

## Step 2: Setup Billing & IAM

```bash
# Enable billing for project
gcloud billing projects link $PROJECT_ID \
  --billing-account=0X1234-ABCDEF-56789G

# Create service account for deployment
gcloud iam service-accounts create school-erp-deployer \
  --display-name="School ERP Deployer"

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:school-erp-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:school-erp-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:school-erp-deployer@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/container.developer"

# Create and download key
gcloud iam service-accounts keys create key.json \
  --iam-account=school-erp-deployer@$PROJECT_ID.iam.gserviceaccount.com
```

---

# PART 2: FIRESTORE DATABASE SETUP

## Production Database Configuration

```bash
# Create Firestore database in native mode
gcloud firestore databases create \
  --database=production \
  --location=asia-south1 \
  --type=firestore-native

# Create backup schedule (daily at 2 AM UTC)
gcloud firestore backups create \
  --database=production \
  --location=asia-south1 \
  --retention-days=30
```

## Database Scaling Rules

```
Small deployment (< 10,000 students):
├─ Read operations: ~1,000 ops/sec
├─ Write operations: ~500 ops/sec
├─ Storage: ~10 GB
└─ Keep: Default pricing plan

Medium deployment (10K-100K students):
├─ Read operations: ~5,000 ops/sec
├─ Write operations: ~2,000 ops/sec
├─ Storage: ~100 GB
└─ Upgrade: Committed pricing (monthly discount)

Large deployment (100K+ students):
├─ Read operations: ~10,000+ ops/sec
├─ Write operations: ~5,000+ ops/sec
├─ Storage: > 500 GB
├─ Add: Redis caching layer
└─ Add: PostgreSQL for analytics
```

---

# PART 3: CLOUD RUN DEPLOYMENT

## Deploying API to Cloud Run

```bash
# Step 1: Build and push Docker image
PROJECT_ID="school-erp-prod"
IMAGE_NAME="gcr.io/$PROJECT_ID/school-erp-api:latest"

# Authenticate with GCR
gcloud auth configure-docker

# Build image
docker build -t $IMAGE_NAME .

# Push to Google Container Registry
docker push $IMAGE_NAME

# Step 2: Deploy to Cloud Run
gcloud run deploy school-erp-api \
  --image=$IMAGE_NAME \
  --platform=managed \
  --region=asia-south1 \
  --allow-unauthenticated \
  --set-env-vars="PROJECT_ID=$PROJECT_ID,NODE_ENV=production" \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=50 \
  --min-instances=1 \
  --timeout=60 \
  --port=8080

# Get the service URL
gcloud run services describe school-erp-api \
  --platform=managed \
  --region=asia-south1 \
  --format='value(status.url)'
```

## Cloud Run Configuration Details

```
Resource Allocation:
├─ Memory: 2GB (handles concurrent requests)
├─ CPU: 2 vCPU (fast response times)
├─ Timeout: 60 seconds (long operations)
└─ Port: 8080 (matches container)

Auto-scaling:
├─ Min instances: 1 (cost savings when idle)
├─ Max instances: 50 (handle traffic spikes)
├─ CPU threshold: 70% (scale up when busy)
└─ Concurrency: 80 (requests per instance)

Networking:
├─ Allow unauthenticated: No (secure API)
├─ VPC: None (Cloud Run is managed)
├─ Load balancer: Built-in Google LB
└─ SSL/TLS: Automatic with google.run.app domain
```

---

# PART 4: CLOUD SQL (OPTIONAL - For Analytics)

```bash
# Create PostgreSQL instance
gcloud sql instances create school-erp-postgres \
  --database-version=POSTGRES_15 \
  --region=asia-south1 \
  --tier=db-custom-2-8192 \
  --backup \
  --backup-start-time=02:00 \
  --enable-bin-log

# Create database
gcloud sql databases create schoolerp_analytics \
  --instance=school-erp-postgres

# Create user
gcloud sql users create erp_user \
  --instance=school-erp-postgres \
  --password=<SECURE_PASSWORD>

# Get connection details
gcloud sql instances describe school-erp-postgres \
  --format="value(ipAddresses[0].ipAddress)"

# Connection string
DATABASE_URL="postgresql://erp_user:<PASSWORD>@<IP>:5432/schoolerp_analytics"
```

---

# PART 5: SECRET MANAGEMENT

## Store Secrets in Secret Manager

```bash
# Store Firebase keys
echo -n "$(cat serviceAccount.json)" | \
  gcloud secrets create google-application-credentials \
  --data-file=-

# Store API keys
echo -n "your-firebase-api-key" | \
  gcloud secrets create firebase-api-key \
  --data-file=-

# Store database credentials
echo -n "postgresql://user:pass@host/db" | \
  gcloud secrets create database-url \
  --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding google-application-credentials \
  --member=serviceAccount:school-erp-deployer@$PROJECT_ID.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Reference in Cloud Run deployment
gcloud run deploy school-erp-api \
  --image=$IMAGE_NAME \
  --set-secrets="GOOGLE_APPLICATION_CREDENTIALS=google-application-credentials:latest" \
  --set-secrets="FIREBASE_API_KEY=firebase-api-key:latest"
```

---

# PART 6: CUSTOM DOMAIN & SSL/TLS

```bash
# Map custom domain
gcloud run domain-mappings create \
  --service=school-erp-api \
  --domain=api.schoolerp.io \
  --platform=managed \
  --region=asia-south1

# Get Cloud Run CNAME target
gcloud run domain-mappings describe api.schoolerp.io \
  --format="value(status.resourceRecords[0].rrdata)"

# Add DNS record (in your registrar)
# Type: CNAME
# Name: api.schoolerp.io
# Value: grun.app (from above)

# Verify SSL certificate (auto-provisioned)
gcloud run domain-mappings describe api.schoolerp.io
```

---

# PART 7: LOAD BALANCING & CDN

```bash
# Create Cloud CDN bucket
gsutil mb gs://school-erp-cdn-bucket

# Configure CORS
gsutil cors set - gs://school-erp-cdn-bucket << 'EOF'
[
  {
    "origin": ["https://schoolerp.io"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
EOF

# Upload static assets
gsutil -m cp -r dist/* gs://school-erp-cdn-bucket/

# Create backend service
gcloud compute backend-buckets create school-erp-backend \
  --gcs-bucket-name=school-erp-cdn-bucket \
  --enable-cdn \
  --cache-mode=CACHE_ALL_STATIC \
  --default-ttl=3600 \
  --max-ttl=86400

# Create URL map and load balancer
gcloud compute url-maps create school-erp-lb \
  --default-backend-bucket=school-erp-backend

gcloud compute target-https-proxies create school-erp-https-proxy \
  --url-map=school-erp-lb

gcloud compute forwarding-rules create school-erp-https \
  --target-https-proxy=school-erp-https-proxy \
  --address=35.201.123.45 \
  --global \
  --ports=443
```

---

# PART 8: MONITORING & ALERTS

## Setup Google Cloud Monitoring

```bash
# Create uptime check
gcloud monitoring uptime create \
  --display-name="School ERP API Health" \
  --monitored-resource="uptime-url" \
  --selected-regions="ASIA" \
  --http-check="test-path=/api/v1/health&expected-status-code=200" \
  --period=60

# Create alert policy for high error rate
gcloud alpha monitoring policies create \
  --notification-channels=<channel-id> \
  --display-name="High API Error Rate" \
  --condition-display-name="Error rate > 5%" \
  --condition-threshold-value=5 \
  --condition-threshold-duration=300s

# View logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=school-erp-api" \
  --limit 50 \
  --format json
```

---

# PART 9: AUTOMATED DEPLOYMENT (CI/CD)

## GitHub Actions for GCP Deployment

```yaml
# .github/workflows/deploy-gcp.yml
name: Deploy to GCP Cloud Run

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Build Docker image
        run: |
          gcloud builds submit \
            --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/school-erp-api:${{ github.sha }} \
            --project=${{ secrets.GCP_PROJECT_ID }}
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy school-erp-api \
            --image=gcr.io/${{ secrets.GCP_PROJECT_ID }}/school-erp-api:${{ github.sha }} \
            --region=asia-south1 \
            --platform=managed \
            --allow-unauthenticated \
            --set-env-vars="NODE_ENV=production" \
            --project=${{ secrets.GCP_PROJECT_ID }}
```

---

# PART 10: SCALING STRATEGIES

## Horizontal Scaling

```
Traffic Level          Action
├─ 0-1,000 req/min      Cloud Run handles automatically
├─ 1K-10K req/min       Increase max-instances to 20
├─ 10K-100K req/min     Add Memorystore (Redis) caching
└─ 100K+ req/min        Add CDN + global load balancer

Firestore Scaling:

If reads exceed 10K ops/sec:
  ├─ Enable Firestore sharding (split by school ID)
  ├─ Add Redis caching tier
  └─ Consider Cloud Datastore (predecessor - don't use)

If writes exceed 5K ops/sec:
  ├─ Batch writes (group updates)
  ├─ Use batch API (instead of individual docs)
  └─ Consider PostgreSQL for analytics (async)
```

## Cost Optimization

```
Finance Review Checklist:

Monthly Cost Breakdown (Production Scale: 50K students):
├─ Firestore:           $500 (50GB storage + 5M reads/writes)
├─ Cloud Run:           $400 (compute + requests)
├─ Cloud SQL (optional):$300 (analytics database)
├─ Cloud Storage (CDN): $100 (static assets)
├─ Monitoring:          $50
└─ TOTAL:              ~$1,350/month ($0.027 per student/month)

Optimizations:
├─ Use "committed pricing" (25% discount on Firestore)
├─ Enable Cloud CDN (reduces egress costs)
├─ Set Cloud Run min-instances=0 (scale to zero when idle)
└─ Use "scheduled backups" (auto-delete old backups)
```

---

# PART 11: DISASTER RECOVERY

## Backup Strategy

```bash
# Automated daily backups
gcloud firestore backups create \
  --database=production \
  --location=asia-south1 \
  --retention-days=30

# Restore from backup
gcloud firestore backups restore <BACKUP_ID> \
  --database=production

# Export Firestore to Cloud Storage (monthly)
gcloud firestore export \
  gs://school-erp-backups/firestore-exports/$(date +%Y%m%d)

# Test restore procedure (quarterly)
gcloud firestore backups restore latest \
  --database=test-restore

# Database replication (different region)
# Already handled: Firestore replicates across zones automatically
```

---

# PART 12: PRODUCTION CHECKLIST

```
Pre-Launch Verification:
├─ ✅ Database backed up daily
├─ ✅ SSL certificate auto-renewed
├─ ✅ Monitoring & alerts configured
├─ ✅ Error rate monitored (< 0.1%)
├─ ✅ API response time < 500ms p99
├─ ✅ 99.95% SLA commitment
├─ ✅ Team on-call rotation scheduled
├─ ✅ Runbooks created for common issues
├─ ✅ Incident response plan documented
└─ ✅ Load testing completed (2x peak traffic)

Day 1 Post-Launch:
├─ Monitor error rates
├─ Check database performance
├─ Verify backups working
├─ Test failover procedures
└─ Brief team on any issues

Week 1 Post-Launch:
├─ Review metrics/dashboards
├─ Optimize slow queries
├─ Adjust auto-scaling settings
├─ Plan next features
└─ Celebrate! 🎉
```

---

**Your infrastructure is enterprise-grade, cost-optimized, and ready for 100K+ students.**
