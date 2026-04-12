# Runbook: Cloud Run Staging Deployment

**Goal:** Deploy Phase 2 API to Cloud Run staging environment  
**Owner:** DevOps Agent / Backend Agent  
**Last Updated:** April 10, 2026  
**Estimated Time:** 15-20 minutes

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-10 | Documentation Agent | Phase 2 staging deployment guide |

---

## Prerequisites

✅ **Before starting, ensure:**

1. **Google Cloud SDK installed:**
   ```bash
   gcloud --version  # Should be v466+
   ```
   [Install gcloud](https://cloud.google.com/sdk/docs/install)

2. **Authenticated to GCP:**
   ```bash
   gcloud auth login
   gcloud auth application-default login
   gcloud config set project school-erp-staging
   ```

3. **Required roles in GCP project:**
   - Cloud Run `roles/run.admin`
   - Container Registry `roles/storage.admin`
   - Service Account `roles/iam.serviceAccountAdmin`

4. **Docker installed (local builds only):**
   ```bash
   docker --version  # Should be 24.0+
   ```

5. **API code built and tested:**
   ```bash
   npm run build
   npm test  # All 92 tests passing
   ```

---

## Step 1: Configure Google Cloud Project

**Time: ~2 minutes**

```bash
# Set project variables
export GCP_PROJECT_ID=school-erp-staging
export REGION=asia-south1  # India (or us-central1 for US, europe-west1 for EU)
export SERVICE_NAME=exam-api-v2
export DOCKER_REPO=asia.gcr.io/school-erp-staging

# Verify authentication
gcloud auth list
# Should show your account as ACTIVE

# Verify project
gcloud config get-value project
# Should output: school-erp-staging

# Enable required APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com  
gcloud services enable pubsub.googleapis.com bigquery.googleapis.com
gcloud services enable logging.googleapis.com
```

**Expected output:**
```
✅ API [run.googleapis.com] already enabled
✅ API [containerregistry.googleapis.com] already enabled
```

---

## Step 2: Build & Push Docker Image

**Option A: Use Cloud Build (Recommended - no local Docker needed)**

```bash
# Build in cloud
gcloud builds submit \
  --tag ${DOCKER_REPO}/${SERVICE_NAME}:latest \
  --tag ${DOCKER_REPO}/${SERVICE_NAME}:v2.0.0 \
  --region=${REGION}

# Expected output
# Building image: asia.gcr.io/school-erp-staging/exam-api-v2:latest
# Step 1/5: FROM node:18-alpine
# ...
# ✅ Image built and pushed (15 seconds)
# ✅ Digest: sha256:abc123...
```

**Option B: Build Locally & Push**

```bash
# Build Docker image locally
docker build -t ${DOCKER_REPO}/${SERVICE_NAME}:latest .

# Expected output
# Step 1/5: FROM node:18-alpine
# Step 2/5: WORKDIR /app
# ...
# Successfully built sha256:abc123...

# Push to Container Registry
docker push ${DOCKER_REPO}/${SERVICE_NAME}:latest

# Verify push
gcloud container images list --repository=${DOCKER_REPO}
```

**Dockerfile should look like:**
```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY src/ ./src/

EXPOSE 8080
CMD ["node", "dist/index.js"]
```

---

## Step 3: Create Staging Service Accounts & Setup

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create exam-api-staging \
  --display-name "Exam API Staging Service Account"

# Get the service account email
export SERVICE_ACCOUNT=$(gcloud iam service-accounts list \
  --filter="displayName:Exam API Staging" \
  --format='value(email)')

echo "Service Account: $SERVICE_ACCOUNT"

# Grant necessary roles
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT} \
  --role=roles/pubsub.publisher

gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT} \
  --role=roles/bigquery.dataEditor

gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT} \
  --role=roles/logging.logWriter

gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT} \
  --role=roles/firestore.user
```

---

## Step 4: Deploy to Cloud Run

```bash
# Deploy the service
gcloud run deploy ${SERVICE_NAME} \
  --image=${DOCKER_REPO}/${SERVICE_NAME}:latest \
  --region=${REGION} \
  --platform=managed \
  --no-allow-unauthenticated \
  --service-account=${SERVICE_ACCOUNT} \
  --memory=1Gi \
  --cpu=1 \
  --timeout=300 \
  --max-instances=100 \
  --min-instances=1 \
  --set-env-vars="NODE_ENV=staging,\
API_PORT=8080,\
STORAGE_DRIVER=firestore,\
PUBSUB_ENABLED=true,\
BIGQUERY_ENABLED=true,\
CLOUD_LOGGING_ENABLED=true,\
GCP_PROJECT_ID=${GCP_PROJECT_ID},\
FIREBASE_PROJECT_ID=school-erp-staging" \
  --labels="environment=staging,app=exam-api,version=v2"
```

**Expected output:**
```
✅ Service [exam-api-v2] deployed to [https://exam-api-v2-abc123.a.run.app]
   Revision: exam-api-v2-00001-abc
   Digest: sha256:xyz789...
   Service Traffic: 100% -> Revision exam-api-v2-00001-abc (Active)

Wait for deployment to complete...
✅ Deployment complete!
```

**Save the service URL:**
```bash
export STAGING_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region=${REGION} \
  --format='value(status.url)')

echo "Staging URL: $STAGING_URL"
# Output: https://exam-api-v2-abc123.a.run.app
```

---

## Step 5: Verify Deployment

### Health Check (200 OK)

```bash
# Test health endpoint
curl -i -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
  ${STAGING_URL}/health/ready

# OR use curl without auth (if public endpoint)
curl -i ${STAGING_URL}/health/ready
```

**Expected response (200 OK):**
```json
{
  "status": "ready",
  "timestamp": "2026-04-10T10:00:00.000Z",
  "services": {
    "api": "✅ running",
    "firestore": "✅ ready",
    "pubsub": "✅ ready",
    "bigquery": "✅ ready",
    "cloud_logging": "✅ ready"
  },
  "uptime_seconds": 45
}
```

### Test Exam Endpoints

```bash
# Get access token
TOKEN=$(gcloud auth print-identity-token)

# Create exam
curl -X POST ${STAGING_URL}/api/v1/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school-123",
    "title": "Physics Test",
    "subject": "Physics",
    "totalMarks": 100,
    "durationMinutes": 60,
    "classId": "class-12A",
    "startTime": "2026-04-10T14:00:00Z",
    "endTime": "2026-04-10T15:00:00Z"
  }'

# Expected response (201 Created)
# {
#   "id": "exam-550e8400-...",
#   "status": "draft"
# }
```

### Check Cloud Run Logs

```bash
# View recent logs
gcloud logging read "resource.type=cloud_run_revision AND \
  resource.labels.service_name=${SERVICE_NAME}" \
  --limit=50 --format=json | head -100

# Follow logs (tail)
gcloud logging read "resource.type=cloud_run_revision AND \
  resource.labels.service_name=${SERVICE_NAME}" \
  --limit=20 --freshness=10s

# Filter for errors
gcloud logging read "resource.type=cloud_run_revision AND \
  resource.labels.service_name=${SERVICE_NAME} AND \
  severity>=ERROR" \
  --limit=50
```

### Check Metrics

```bash
# CPU utilization (should be <50%)
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container_cpu_utilization" AND \
  resource.labels.service_name="'${SERVICE_NAME}'"' \
  --format="table(points[0].value.double_value)"

# Memory utilization (should be <70% of 1Gi)
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/container_memory_utilization" AND \
  resource.labels.service_name="'${SERVICE_NAME}'"' \
  --format="table(points[0].value.double_value)"

# Request count
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND \
  resource.labels.service_name="'${SERVICE_NAME}'"' \
  --format="table(metric.labels.response_code_class,points[0].value.int64_value)"
```

---

## Step 6: Performance Validation

```bash
# Load test (100 requests)
for i in {1..100}; do
  curl -s ${STAGING_URL}/health/ready > /dev/null && echo "✓ Request $i OK"
done

# OR use Apache Bench (if installed)
ab -n 100 -c 10 ${STAGING_URL}/health/ready

# Expected results
# Requests/sec: 50+
# Latency p50: <100ms
# Latency p99: <300ms
```

---

## Step 7: Configure Traffic Routing (Optional)

If deploying multiple revisions side-by-side:

```bash
# Deploy new revision (100% traffic to old)
gcloud run deploy ${SERVICE_NAME} \
  --image=${DOCKER_REPO}/${SERVICE_NAME}:v2.0.1 \
  --region=${REGION} \
  --no-traffic  # NO TRAFFIC INITIALLY

# Route 10% traffic to new revision
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-revisions LATEST=10 \
  --region=${REGION}

# Wait 5 minutes, monitor errors...

# Route 50% traffic
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-revisions LATEST=50 \
  --region=${REGION}

# If no errors, route 100%
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-revisions LATEST=100 \
  --region=${REGION}
```

---

## Rollback Procedures

### Quick Rollback (Previous Revision)

```bash
# List revisions
gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION}

# Output:
# REVISION               ACTIVE  IMAGE                     DEPLOYED
# exam-api-v2-00002-abc  yes     asia.gcr.io/.../exam-api-v2:latest    1 min ago
# exam-api-v2-00001-def  -       asia.gcr.io/.../exam-api-v2:v2.0.0    10 min ago

# Rollback to previous revision
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-revisions exam-api-v2-00001-def=100 \
  --region=${REGION}

# Verify traffic switched
gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION}
```

### Full Rollback (Delete Current Deployment)

```bash
# Update service to previous Docker image
gcloud run deploy ${SERVICE_NAME} \
  --image=${DOCKER_REPO}/${SERVICE_NAME}:v2.0.0 \
  --region=${REGION} \
  --no-traffic

# Route all traffic to old version
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-revisions exam-api-v2-00001-def=100 \
  --region=${REGION}

# Start fresh deployment of new version when ready
```

---

## Debugging

### Issue: Deployment Fails - "Permission Denied"

**Error:**
```
Error: PERMISSION_DENIED: Permission denied on resource
```

**Solution:**
```bash
# Check service account permissions
gcloud projects get-iam-policy ${GCP_PROJECT_ID} \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*"

# Re-apply roles
gcloud projects add-iam-policy-binding ${GCP_PROJECT_ID} \
  --member=serviceAccount:${SERVICE_ACCOUNT} \
  --role=roles/run.admin
```

### Issue: Image Not Found in Registry

**Error:**
```
Error: Error response from daemon: manifest not found
```

**Solution:**
```bash
# List images in registry
gcloud container images list --repository=${DOCKER_REPO}

# If empty, rebuild and push
docker build -t ${DOCKER_REPO}/${SERVICE_NAME}:latest .
docker push ${DOCKER_REPO}/${SERVICE_NAME}:latest
```

### Issue: API Starts but Returns 502/503 Errors

**Cause:** Services failed to initialize (Pub/Sub, BigQuery, etc.)

**Debug:**
```bash
# Check logs for initialization errors
gcloud logging read "resource.type=cloud_run_revision AND \
  resource.labels.service_name=${SERVICE_NAME}" \
  --limit=50 --format=json | grep -i "error\|failed"

# If Pub/Sub failed:
gcloud pubsub topics list  # Check topics exist

# If BigQuery failed:
gcloud bq ls --dataset-id=school_erp_staging  # Check dataset exists

# Redeploy with corrected environment variables
gcloud run deploy ${SERVICE_NAME} \
  --update-env-vars="PUBSUB_ENABLED=true" \
  --region=${REGION}
```

### Issue: High Latency (P99 > 500ms)

**Cause:** CPU/memory constraints

**Solution:**
```bash
# Increase resources
gcloud run deploy ${SERVICE_NAME} \
  --memory=2Gi \
  --cpu=2 \
  --max-instances=200 \
  --region=${REGION}

# Monitor improvement
gcloud logging read "resource.type=cloud_run_revision AND \
  jsonPayload.duration_ms>500" \
  --limit=50
```

---

## Quick Reference Commands

```bash
# Deployment
gcloud run deploy exam-api-v2 --image=asia.gcr.io/.../exam-api-v2:latest

# Monitoring
gcloud run services describe exam-api-v2 --region=asia-south1
gcloud logging read "resource.type=cloud_run" --limit=50

# Rollback
gcloud run services update-traffic exam-api-v2 --to-revisions=exam-api-v2-00001-abc=100

# Update environment
gcloud run deploy exam-api-v2 --update-env-vars="KEY=value"

# View URL
gcloud run services describe exam-api-v2 --region=asia-south1 --format='value(status.url)'
```

---

## Post-Deployment Checklist

- [ ] Health check returns 200 OK
- [ ] Exam endpoints respond with correct data
- [ ] Cloud Logging shows no errors
- [ ] CPU utilization <50%, Memory <70%
- [ ] Request latency p99 <300ms
- [ ] Pub/Sub topics initialized
- [ ] BigQuery can receive events
- [ ] Service account has correct permissions
- [ ] Minimum instances set to 1 (no cold starts)
- [ ] Rollback procedure tested

---

## Related Documentation

- **[LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)** - Local dev environment
- **[DATA_PIPELINE_OPERATIONS.md](./DATA_PIPELINE_OPERATIONS.md)** - Monitor data pipeline
- **[INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)** - Handle P1 incidents
- **[ADR-DATA-PIPELINE-STRATEGY.md](../adr/ADR-DATA-PIPELINE-STRATEGY.md)** - Pipeline architecture

---

## Support

**Questions?**
- Slack: #devops-staging channel
- Docs: [Cloud Run Documentation](https://cloud.google.com/run/docs)
- Team: Tag @devops-agent in PR comments
