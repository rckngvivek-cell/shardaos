# Week 2: DevOps Infrastructure Enhancements (28_DEVOPS_ENHANCEMENTS_1.md)

**Document Owner**: DevOps Agent  
**Week**: Week 2  
**Target**: Production-ready, zero-downtime deployment infrastructure  
**Start Date**: April 9, 2026  
**End Date**: April 20, 2026  

---

## Executive Summary

Week 2 establishes enterprise-grade infrastructure for the DeerFlow School ERP. This document defines 11 critical DevOps enhancements that enable zero-downtime deployments, multi-region failover, secure secret management, and full observability across staging and production environments.

**Key Outcomes**:
- Staging environment mirrors production (enables safe testing)
- Blue-green deployments with automated rollback
- Multi-region active-active setup (us-central1, asia-south1, europe-west1)
- Full secrets encrypted and managed via Cloud Secret Manager
- Real-time monitoring, alerting, and cost tracking
- <5 minute deployment cycle with automated smoke tests

---

## 1. Staging Environment Complete Setup

### Overview
The staging environment is a production-replica that allows safe testing of deployments, configuration changes, and scale testing without impacting real users.

### Architecture

#### 1.1 Firestore Staging Instance
- **Project**: `schoolerp-staging-gcp`
- **Database**: `firestore-staging` (separate from production)
- **Access**: Restricted to developers and CI/CD pipeline
- **Data Population**:
  - Dev fixtures: 5 schools, 50 teachers, 500 students
  - Realistic data volumes for performance testing
  - Anonymized production data (optional, with PII redaction)
  - Automated daily reset to known baseline state

#### 1.2 Cloud Run Staging Service
- **Service Name**: `schoolerp-api-staging`
- **Replicas**: 2 (lower than production's 5)
- **Memory Per Instance**: 512MB (production: 1GB)
- **Concurrency**: 32 requests/instance (production: 80)
- **CPU**: 1 shared CPU (production: 1 dedicated)
- **Autoscaling**:
  - Min instances: 1 (keep one warm)
  - Max instances: 3 (prevent runaway costs)
  - Target CPU: 60%

#### 1.3 Cloud Load Balancer Routing
- **Domain**: `staging.schoolerp.in`
- **Configuration**:
  - Global HTTPS load balancer
  - TLS certificate: managed (auto-renewal via Cloud SSL Certificates)
  - Health check: `/api/healthz` endpoint (5s interval, 3 consecutive failures to mark unhealthy)
  - Session affinity: None (stateless APIs)
  - Request timeout: 30 seconds

#### 1.4 Cloud Storage (Staging)
- **Bucket**: `schoolerp-staging-documents`
- **Location**: Multi-region (US)
- **Access Control**: Private (requires signed URLs)
- **Lifecycle Rules**:
  - Delete objects after 90 days (keep storage costs low)
  - No versioning (staging is ephemeral)
- **Contents**:
  - Student documents (Aadhaar verification)
  - Exam result PDFs
  - Report cards
  - Bulk import templates

#### 1.5 BigQuery Staging Dataset
- **Project**: `schoolerp-staging-gcp`
- **Dataset**: `analytics_staging`
- **Tables** (schemas match production):
  - `student_attendance` (partitioned by date)
  - `exam_marks` (partitioned by exam_id)
  - `payment_transactions` (partitioned by date)
  - `login_events` (partitioned by date)
  - `api_latency_logs` (partitioned by date)
- **Retention**: 30 days (auto-delete old partitions)
- **Query limits**: No cost implications for developers (use free tier)

#### 1.6 Cloud Logging Aggregation
- **Log Sink Configuration**:
  - All logs from staging → Cloud Logging project
  - Log levels: DEBUG, INFO, WARN, ERROR
  - Filter: Include all API logs, Firestore operations, errors
- **Log Retention**: 30 days in Cloud Logging, 7 days in Cloud Logging Archive (Cloud Storage)
- **Search**: Full-text search available in console

#### 1.7 Monitoring Alerts (Staging-Specific)
- **Lower Thresholds** (to catch issues early):
  - API latency p95 > 300ms (catch before production)
  - Error rate > 0.5% (production threshold: 1%)
  - Firestore read/write latency > 100ms
  - Cold starts > 2s
  - Database quota usage > 50% (staging is smaller)
- **Notification Channels**: Slack #devops-staging

### Deployment Steps

```bash
# 1. Create staging GCP project
gcloud projects create schoolerp-staging-gcp --set-as-default

# 2. Enable APIs
gcloud services enable run.googleapis.com firestore.googleapis.com \
  cloudresourcemanager.googleapis.com logging.googleapis.com

# 3. Deploy Firestore staging instance
gcloud firestore databases create --database=firestore-staging --location=us-central1

# 4. Create Cloud Storage bucket
gsutil mb -b on -l US gs://schoolerp-staging-documents

# 5. Create BigQuery dataset
bq mk --dataset --location=US schoolerp-staging-gcp:analytics_staging

# 6. Deploy Cloud Run service (manual, then via terraform)
gcloud run deploy schoolerp-api-staging \
  --source . \
  --region us-central1 \
  --memory=512M \
  --cpu=1 \
  --concurrency=32 \
  --min-instances=1 \
  --max-instances=3

# 7. Configure load balancer (via terraform)
terraform apply -target=module.staging_load_balancer
```

### Maintenance

- **Weekly**: Run data fixture reset (restore baseline)
- **Daily**: Verify staging and production schemas are in sync
- **Monthly**: Review staging costs, optimize instance sizes

---

## 2. Blue-Green Deployment Strategy

### Overview
Blue-Green deployment enables zero-downtime updates by running two identical production environments. "Blue" serves current traffic; "Green" is deployed with new code. Once healthy, traffic shifts to Green.

### Architecture

#### 2.1 Cloud Run Revisions
- **Blue Revision** (Current):
  - Running version: e.g., `schoolerp-api@001.production`
  - Receives 100% traffic initially
  - Health: continuously monitored
  - Rollback point: always available

- **Green Revision** (New):
  - Deployed with new code: e.g., `schoolerp-api@002.production`
  - Receives 0% traffic initially
  - Health checks run in isolation
  - Warm-up period: 5 minutes

#### 2.2 Traffic Shifting Strategy

```
Phase 1: Deploy to Green (0% traffic)
├─ New code deployed
├─ Warm-up: 5 minutes (load caches, establish DB connections)
├─ Health check: /api/healthz must return 200 OK
└─ Proceed to Phase 2 only if healthy

Phase 2: Canary (10% traffic)
├─ Route 10% of requests to Green (real user traffic)
├─ Monitor: error rate, latency (5-minute window)
├─ Success criteria: errors < 0.1%, latency p95 < 500ms
└─ If healthy: proceed to Phase 3. If failing: instant rollback to Blue.

Phase 3: Ramp (50% traffic)
├─ Route 50% of requests to Green
├─ Monitor: error rate, latency (5-minute window)
├─ Success criteria: errors < 0.1%, latency p95 < 500ms
└─ If healthy: proceed to Phase 4. If failing: instant rollback to Blue.

Phase 4: Full Deployment (100% traffic)
├─ Manual approval required
├─ Route 100% of requests to Green
├─ Blue becomes standby (ready for instant rollback)
└─ Deployment complete.

Rollback (Instant)
└─ Route 100% traffic back to Blue (takes 30 seconds)
```

#### 2.3 Load Balancer Configuration

```yaml
# URL Map (Cloud Load Balancer)
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeUrlMap
metadata:
  name: schoolerp-urlmap
spec:
  defaultService: blue-backend-service
  # Weighted routing (for canary/ramp)
  hostRules:
    - hosts: ["api.schoolerp.in"]
      pathMatcher: "api"
  pathMatchers:
    - name: "api"
      defaultService: blue-backend-service
      routeRules:
        # 90% → Blue, 10% → Green (canary phase)
        - priority: 1
          service: green-backend-service
          weightedBackendServices:
            - backendService: green-backend-service
              weight: 10
            - backendService: blue-backend-service
              weight: 90
```

#### 2.4 Health Check Configuration

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeHealthCheck
metadata:
  name: schoolerp-healthcheck
spec:
  checkIntervalSec: 10
  timeoutSec: 5
  healthyThreshold: 2
  unhealthyThreshold: 3
  httpHealthCheck:
    port: 8080
    requestPath: /api/healthz
    # Custom headers
    requestHeaders:
      - "User-Agent: HealthChecker"
```

#### 2.5 Deployment Workflow

**Manual Steps** (DevOps):
1. Verify all tests passed in CI/CD
2. Build and push new image to Container Registry
3. Deploy to Green revision in staging first
4. Run smoke tests on Green/staging (see Section 3)
5. If staging passes: proceed to production

**Automated Steps** (Cloud Deployment Pipeline):
1. Deploy to Green revision (production)
2. Wait 5 minutes (warm-up)
3. Monitor health checks
4. If healthy: shift 10% traffic to Green, wait 5 minutes
5. If 10% stable: shift 50% traffic, wait 5 minutes
6. If 50% stable: proceed to manual approval step
7. DevOps approves, system shifts 100% to Green
8. Or: DevOps rejects, system rolls back 100% to Blue

**Instant Rollback** (Anytime):
- At any phase, click "Rollback" button
- 100% traffic → Blue
- Takes 30 seconds
- Green revision stays running for diagnostics

#### 2.6 Monitoring During Deployment

```yaml
# Metrics to watch (real-time dashboard)
- API latency p50, p95, p99 (should not increase >10%)
- Error rate 4xx, 5xx (should stay <0.1%)
- Cloud Run CPU, memory (should stay stable)
- Database latency (should not spike)
- Cold starts (should remain <3s)
```

### Terraform Configuration

```hcl
# gcp/infrastructure/deployment.tf

resource "google_compute_backend_service" "blue" {
  name            = "schoolerp-api-blue"
  protocol        = "HTTPS"
  port_name       = "http"
  timeout_sec     = 30

  health_checks = [google_compute_health_check.schoolerp.id]

  iap {
    enabled = true
    oauth2_client_secret_name = "projects/${var.project_id}/secrets/iap-oauth-secret/versions/latest"
  }
}

resource "google_compute_backend_service" "green" {
  name            = "schoolerp-api-green"
  protocol        = "HTTPS"
  port_name       = "http"
  timeout_sec     = 30

  health_checks = [google_compute_health_check.schoolerp.id]
}

# URL map with traffic splitting
resource "google_compute_url_map" "schoolerp" {
  name            = "schoolerp-urlmap"
  default_service = google_compute_backend_service.blue.id

  host_rule {
    hosts        = ["api.schoolerp.in"]
    path_matcher = "api"
  }

  path_matcher {
    name            = "api"
    default_service = google_compute_backend_service.blue.id

    # Canary routing (10% Green, 90% Blue)
    route_rule {
      priority = 1
      service  = google_compute_backend_service.blue.id
      match_rules {
        prefix_match = "/api"
      }
    }
  }
}
```

---

## 3. Automated Smoke Tests (Post-Deploy)

### Overview
Smoke tests run immediately after deployment to verify critical functionality. Failures trigger automatic rollback; success enables blue-green traffic shift.

### Smoke Test Suite

#### 3.1 Health Endpoint Test
```bash
#!/bin/bash
# tests/smoke/health.sh

TARGET_URL="${1:-http://localhost:8080}"

# Test: Health endpoint returns 200 OK
RESPONSE=$(curl -s -w "\n%{http_code}" "${TARGET_URL}/api/healthz")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "FAIL: Health endpoint returned $HTTP_CODE"
  exit 1
fi

# Parse health JSON
HEALTHY=$(echo "$BODY" | jq -r '.healthy // false')
if [ "$HEALTHY" != "true" ]; then
  echo "FAIL: Service reports unhealthy"
  exit 1
fi

echo "PASS: Health check"
exit 0
```

#### 3.2 Authentication Flow Test
```bash
#!/bin/bash
# tests/smoke/auth_flow.sh

TARGET_URL="${1:-http://localhost:8080}"
TEST_SCHOOL_EMAIL="test@schoolerp-staging.com"
TEST_SCHOOL_PASSWORD="SmokeTest@123"

# Step 1: POST /api/v1/auth/login
LOGIN_RESPONSE=$(curl -s -X POST "${TARGET_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"${TEST_SCHOOL_EMAIL}\", \"password\": \"${TEST_SCHOOL_PASSWORD}\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
if [ -z "$TOKEN" ]; then
  echo "FAIL: Login did not return token"
  exit 1
fi

# Step 2: Verify token by calling protected endpoint
PROFILE_RESPONSE=$(curl -s -X GET "${TARGET_URL}/api/v1/auth/profile" \
  -H "Authorization: Bearer ${TOKEN}")

SCHOOL_ID=$(echo "$PROFILE_RESPONSE" | jq -r '.school_id // empty')
if [ -z "$SCHOOL_ID" ]; then
  echo "FAIL: Protected endpoint failed"
  exit 1
fi

# Step 3: POST /api/v1/auth/logout
LOGOUT_RESPONSE=$(curl -s -X POST "${TARGET_URL}/api/v1/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}")

echo "PASS: Auth flow"
exit 0
```

#### 3.3 API Endpoint Connectivity Tests
```bash
#!/bin/bash
# tests/smoke/api_endpoints.sh

TARGET_URL="${1:-http://localhost:8080}"

# List of critical endpoints to test (GET only, no side effects)
ENDPOINTS=(
  "/api/v1/schools"
  "/api/v1/students"
  "/api/v1/attendance"
  "/api/v1/exams"
  "/api/v1/reports"
)

FAILED=0

for endpoint in "${ENDPOINTS[@]}"; do
  RESPONSE=$(curl -s -w "\n%{http_code}" "${TARGET_URL}${endpoint}")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "401" ]; then
    echo "FAIL: ${endpoint} returned $HTTP_CODE"
    FAILED=$((FAILED + 1))
  else
    echo "PASS: ${endpoint}"
  fi
done

exit $FAILED
```

#### 3.4 Database Connectivity Test
```bash
#!/bin/bash
# tests/smoke/database.sh

TARGET_URL="${1:-http://localhost:8080}"

# Test: Firestore connectivity (via health endpoint that queries Firestore)
RESPONSE=$(curl -s -i -X GET "${TARGET_URL}/api/healthz" \
  -H "X-Health-Check: database")

# Check if response includes database status
if echo "$RESPONSE" | grep -q "firestore.*healthy"; then
  echo "PASS: Database connectivity"
  exit 0
else
  echo "FAIL: Database connectivity"
  exit 1
fi
```

#### 3.5 Advanced Tests (Post-Deploy to Staging Only)
```bash
#!/bin/bash
# tests/smoke/advanced.sh

TARGET_URL="${1:-http://localhost:8080}"

# Test: Bulk API performance (simulate concurrent requests)
echo "Testing API under load..."
for i in {1..10}; do
  curl -s "${TARGET_URL}/api/v1/schools" > /dev/null &
done
wait

# Check for errors
if [ $? -ne 0 ]; then
  echo "FAIL: Concurrent load test"
  exit 1
fi

echo "PASS: Advanced tests"
exit 0
```

### Test Execution Pipeline

#### 3.6 Smoke Test Orchestration

```yaml
# .github/workflows/deploy-with-smoke-tests.yml

name: Deploy with Smoke Tests

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging]
        default: staging

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: |
          docker build -f apps/api/Dockerfile -t schoolerp-api:${{ github.sha }} .
          docker tag schoolerp-api:${{ github.sha }} gcr.io/${{ secrets.GCP_PROJECT }}/schoolerp-api:latest
      
      - name: Push to Container Registry
        run: |
          docker push gcr.io/${{ secrets.GCP_PROJECT }}/schoolerp-api:latest
      
      - name: Deploy to Green (staging)
        run: |
          gcloud run deploy schoolerp-api-staging \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/schoolerp-api:latest \
            --region us-central1 \
            --no-traffic  # Don't route traffic yet
      
      - name: Wait for warm-up (5 minutes)
        run: sleep 300
      
      - name: Run smoke tests
        timeout-minutes: 10
        run: |
          set -e
          STAGING_URL="https://staging.schoolerp.in"
          
          echo "Running health check..."
          bash tests/smoke/health.sh "$STAGING_URL"
          
          echo "Running auth flow test..."
          bash tests/smoke/auth_flow.sh "$STAGING_URL"
          
          echo "Running API endpoints test..."
          bash tests/smoke/api_endpoints.sh "$STAGING_URL"
          
          echo "Running database connectivity test..."
          bash tests/smoke/database.sh "$STAGING_URL"
          
          echo "All smoke tests passed!"
      
      - name: On Failure - Rollback
        if: failure()
        run: |
          echo "Smoke tests failed. Rolling back..."
          # Remove new revision, keep old one
          gcloud run services delete schoolerp-api-staging \
            --region=us-central1 \
            --no-prompt || true
          # Redeploy previous version
          gcloud run deploy schoolerp-api-staging \
            --image gcr.io/${{ secrets.GCP_PROJECT }}/schoolerp-api:previous \
            --region us-central1
          exit 1
      
      - name: Notify DevOps (Slack)
        if: always()
        run: |
          STATUS="${{ job.status }}"
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d "Smoke tests finished with status: $STATUS"
```

### Success/Failure Handling

| Test Result | Action |
|---|---|
| All smoke tests pass (staging) | Proceed to canary phase (10% traffic to Green) |
| Health check fails | Rollback immediately; alert DevOps |
| Auth flow fails | Rollback immediately; investigate; block deployment |
| API endpoint fails | Rollback immediately; check database |
| Timeout (no test response after 10 min) | Abort deployment; rollback to Blue |

---

## 4. Secret Management (Cloud Secret Manager)

### Overview
All sensitive data (API keys, database passwords, payment credentials) is stored in Google Cloud Secret Manager with encryption, access control, and audit logging.

### Architecture

#### 4.1 Secret Storage Structure

```
schoolerp-secrets/
├─ staging/
│  ├─ database-password
│  ├─ razorpay-key-id
│  ├─ razorpay-key-secret
│  ├─ twilio-auth-token
│  ├─ firebase-admin-sdk
│  ├─ openai-api-key
│  └─ jwt-secret
│
└─ production/
   ├─ database-password
   ├─ razorpay-key-id
   ├─ razorpay-key-secret
   ├─ twilio-auth-token
   ├─ firebase-admin-sdk
   ├─ openai-api-key
   └─ jwt-secret
```

#### 4.2 Encryption

- **At Rest**: All secrets encrypted using Google Cloud KMS
  - Master Key Location: `projects/schoolerp-prod/locations/us-central1/keyRings/schoolerp-keyring/cryptoKeys/secrets-key`
  - Encryption standard: AES-256-GCM

- **In Transit**: HTTPS/TLS only (never over HTTP)

- **Key Rotation**: Automatic every 90 days (configurable)

#### 4.3 Access Control

**Service Accounts with Secret Access**:

| Service Account | Secrets | Environment |
|---|---|---|
| `schoolerp-api-sa@schoolerp-prod.iam.gserviceaccount.com` | All production secrets | Production |
| `schoolerp-api-sa@schoolerp-staging.iam.gserviceaccount.com` | All staging secrets | Staging |
| `ci-cd-deployer@schoolerp-prod.iam.gserviceaccount.com` | All secrets (for CI/CD deployments) | Both |

**IAM Role Assignment**:
```bash
# Bind production API service account to read production secrets
gcloud secrets add-iam-policy-binding schoolerp-prod/api-key \
  --member=serviceAccount:schoolerp-api-sa@schoolerp-prod.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
```

#### 4.4 Audit Logging

All secret access is logged in Cloud Audit Logs:
- **Who**: Service account name, user email
- **When**: Timestamp (UTC)
- **What**: Secret name, operation (read, create, update, destroy)
- **Verdict**: Result (success, permission denied)

**Example Log Entry**:
```json
{
  "timestamp": "2026-04-15T10:30:45.123Z",
  "protoPayload": {
    "serviceName": "secretmanager.googleapis.com",
    "methodName": "google.cloud.secretmanager.v1.SecretManagerService.AccessSecretVersion",
    "principalEmail": "schoolerp-api-sa@schoolerp-prod.iam.gserviceaccount.com",
    "resourceName": "projects/schoolerp-prod/secrets/razorpay-key-id/versions/latest",
    "status": {
      "code": 0,
      "message": "Success"
    }
  }
}
```

**Query Examples**:
```bash
# View all secret access in last 24 hours
gcloud logging read "resource.type=secretmanager.googleapis.com AND timestamp>='2026-04-14T10:30:45Z'" --limit 100

# Who accessed the database password?
gcloud logging read "protoPayload.resourceName=~'database-password' AND timestamp>='2026-04-01T00:00:00Z'" --limit 50
```

#### 4.5 Rotation Policy

**Automatic Rotation** (90-day cycle):
```bash
# Enable automatic rotation
gcloud secrets update razorpay-key-id \
  --rotation-period=7776000s \
  --next-rotation-time=2026-08-15T00:00:00Z
```

**Manual Rotation**:
```bash
# 1. Generate new secret value
NEW_VALUE=$(openssl rand -base64 32)

# 2. Create new version in Secret Manager
echo -n "$NEW_VALUE" | gcloud secrets versions add razorpay-key-id --data-file=-

# 3. Update dependent service (Razorpay webhook config, etc.)
# 4. Verify old and new values work
# 5. Destroy old version (optional, kept for audit trail by default)
```

#### 4.6 Accessing Secrets in Code

**Backend (Node.js)**:
```javascript
// apps/api/src/config/secrets.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const secretManager = new SecretManagerServiceClient();

export async function getSecret(secretName: string): Promise<string> {
  const projectId = process.env.GCP_PROJECT_ID;
  const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
  
  const [version] = await secretManager.accessSecretVersion({ name });
  
  if (!version.payload?.data) {
    throw new Error(`Secret ${secretName} not found`);
  }
  
  return version.payload.data.toString('utf8');
}

// Usage:
const razorpayKeyId = await getSecret('production/razorpay-key-id');
const razorpayKeySecret = await getSecret('production/razorpay-key-secret');
```

**Environment Variable Mapping** (in Cloud Run):
```yaml
# Cloud Run service environment variables (loaded from secrets)
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: schoolerp-api
spec:
  template:
    spec:
      containers:
        - name: api
          image: gcr.io/schoolerp-prod/schoolerp-api:latest
          env:
            - name: RAZORPAY_KEY_ID
              valueFrom:
                secretKeyRef:
                  name: razorpay-key-id
                  key: latest
            - name: RAZORPAY_KEY_SECRET
              valueFrom:
                secretKeyRef:
                  name: razorpay-key-secret
                  key: latest
```

#### 4.7 Emergency Access

**Break-Glass Procedure** (for incidents):
1. User requests access to DevOps lead
2. DevOps lead verifies user identity and business justification
3. Temporary access granted for 1 hour
4. Access logged and reviewed post-incident
5. Incident report generated

```bash
# Grant emergency access (1 hour)
gcloud secrets add-iam-policy-binding production/database-password \
  --member=user:devops-lead@schoolerp.in \
  --role=roles/secretmanager.secretAccessor \
  --condition='resource.name="projects/schoolerp-prod/secrets/database-password" AND expression: now < timestamp("2026-04-15T11:30:00Z")'
```

### Terraform Configuration

```hcl
# gcp/infrastructure/secrets.tf

resource "google_secret_manager_secret" "razorpay_key_id_prod" {
  secret_id = "production/razorpay-key-id"
  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "razorpay_key_id_prod" {
  secret = google_secret_manager_secret.razorpay_key_id_prod.id
  secret_data = var.razorpay_key_id_prod
}

# Grant service account access
resource "google_secret_manager_secret_iam_member" "api_sa_razorpay" {
  secret_id = google_secret_manager_secret.razorpay_key_id_prod.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:schoolerp-api-sa@schoolerp-prod.iam.gserviceaccount.com"
}

# Enable automatic rotation
resource "google_secret_manager_secret" "database_password_prod" {
  secret_id     = "production/database-password"
  rotation {
    rotation_period    = "7776000s"  # 90 days
    next_rotation_time = "2026-08-15T00:00:00Z"
  }
  replication {
    auto {}
  }
}
```

---

## 5. Multi-Region Deployment

### Overview
DeerFlow operates across three regions for global availability, low latency, and disaster recovery. Each region runs independently with automatic failover.

### Architecture

#### 5.1 Regions

| Region | Location | Primary Use | Backup For |
|---|---|---|---|
| `us-central1` | Iowa, USA | North America, default | - |
| `asia-south1` | Mumbai, India | India schools, APAC | EU |
| `europe-west1` | Belgium, EU | EU schools, GDPR compliance | Asia |

#### 5.2 Global Load Balancer

```
User in India → Global LB → Route to nearest region (asia-south1)
User in USA   → Global LB → Route to nearest region (us-central1)
User in EU    → Global LB → Route to nearest region (europe-west1)

Failover: If asia-south1 down → Route Indian users to us-central1 (backup)
```

**Configuration**:

```hcl
# gcp/infrastructure/global_load_balancer.tf

resource "google_compute_global_forwarding_rule" "schoolerp" {
  name                  = "schoolerp-forwarding-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL"
  port_range            = "443"
  target                = google_compute_target_https_proxy.schoolerp.id
}

resource "google_compute_target_https_proxy" "schoolerp" {
  name           = "schoolerp-https-proxy"
  url_map        = google_compute_url_map.schoolerp.id
  ssl_certificates = [
    google_compute_ssl_certificate.schoolerp.id
  ]
}

resource "google_compute_url_map" "schoolerp" {
  name            = "schoolerp-global-urlmap"
  default_service = google_compute_backend_service.us_central1.id

  # Route traffic by region
  host_rule {
    hosts        = ["api.schoolerp.in"]
    path_matcher = "regional-routing"
  }

  path_matcher {
    name = "regional-routing"

    # Geo-based routing
    route_rule {
      match_rules {
        prefix_match = "/api"
        metadata_filters {
          filter_match_criteria = "MATCH_ANY"
          filter_labels {
            name  = "region"
            value = "asia"
          }
        }
      }
      service = google_compute_backend_service.asia_south1.id
      priority = 1
    }

    route_rule {
      match_rules {
        prefix_match = "/api"
        metadata_filters {
          filter_match_criteria = "MATCH_ANY"
          filter_labels {
            name  = "region"
            value = "europe"
          }
        }
      }
      service = google_compute_backend_service.europe_west1.id
      priority = 2
    }

    # Default: USA
    default_service = google_compute_backend_service.us_central1.id
  }
}

# Health-based failover
resource "google_compute_backend_service" "us_central1" {
  name               = "schoolerp-api-us-central1"
  protocol           = "HTTPS"
  port_name          = "http"
  load_balancing_scheme = "EXTERNAL"
  health_checks = [google_compute_health_check.schoolerp.id]
  session_affinity   = "NONE"
  affinity_cookie_ttl_sec = 0
}

resource "google_compute_backend_service" "asia_south1" {
  name               = "schoolerp-api-asia-south1"
  protocol           = "HTTPS"
  port_name          = "http"
  load_balancing_scheme = "EXTERNAL"
  health_checks = [google_compute_health_check.schoolerp.id]
  session_affinity   = "NONE"
  failover_policy {
    disable_connection_drain_on_failover = true
    drop_traffic_if_unhealthy            = true
  }
}

resource "google_compute_backend_service" "europe_west1" {
  name               = "schoolerp-api-europe-west1"
  protocol           = "HTTPS"
  port_name          = "http"
  load_balancing_scheme = "EXTERNAL"
  health_checks = [google_compute_health_check.schoolerp.id]
  session_affinity   = "NONE"
}
```

#### 5.3 Cloud Run Services (Per-Region)

Each region runs independent Cloud Run service:

```bash
# Deploy to us-central1
gcloud run deploy schoolerp-api-us-central1 \
  --image gcr.io/schoolerp-prod/schoolerp-api:latest \
  --region us-central1 \
  --service-account=schoolerp-api-sa@schoolerp-prod.iam.gserviceaccount.com \
  --memory 1Gi \
  --cpu 2 \
  --concurrency 80

# Deploy to asia-south1
gcloud run deploy schoolerp-api-asia-south1 \
  --image gcr.io/schoolerp-prod/schoolerp-api:latest \
  --region asia-south1 \
  --service-account=schoolerp-api-sa@schoolerp-prod.iam.gserviceaccount.com \
  --memory 1Gi \
  --cpu 2 \
  --concurrency 80

# Deploy to europe-west1
gcloud run deploy schoolerp-api-europe-west1 \
  --image gcr.io/schoolerp-prod/schoolerp-api:latest \
  --region europe-west1 \
  --service-account=schoolerp-api-sa@schoolerp-prod.iam.gserviceaccount.com \
  --memory 1Gi \
  --cpu 2 \
  --concurrency 80
```

#### 5.4 Firestore Multi-Region Replication

Firestore automatically replicates data across regions:

```hcl
# gcp/infrastructure/firestore.tf

resource "google_firestore_database" "production" {
  project             = "schoolerp-prod"
  name                = "production"
  location_id         = "nam5"  # Multi-region (USA, EU)
  type                = "FIRESTORE_NATIVE"
  
  # Enable multi-region replication
  cmek_config {
    kms_key_name = google_kms_crypto_key.firestore.id
  }
}
```

**Replication Details**:
- **Consistency Model**: Eventual consistency (multi-master replication)
- **Replication Latency**: <5 seconds for most operations
- **Write Region**: First write accepted by any region; replicated globally
- **Fallback**: If one region down, users can read/write from other regions

**Example Scenario**:
```
User in India writes to Asia region (asia-south1):
├─ Write accepted immediately (latency: 50ms)
├─ Data replicated to us-central1 (latency: 200ms)
├─ Data replicated to europe-west1 (latency: 300ms)
└─ After 5 seconds, all regions consistent

If asia-south1 goes down:
├─ User redirected to us-central1 by Global LB
├─ Read/write succeeds (latency: 200ms higher, but functional)
└─ asia-south1 data re-synced when back online
```

#### 5.5 Cloud Storage Bucket Replication

```hcl
# gcp/infrastructure/storage.tf

resource "google_storage_bucket" "documents" {
  name          = "schoolerp-documents"
  location      = "US"              # Multi-region for replication
  storage_class = "STANDARD"         # Auto-replicates across US
  
  # Dual-region for faster access (optional)
  # location = "US"
  # storage_class = "MULTI_REGION_ASIA"
}

resource "google_storage_bucket" "documents_asia" {
  name          = "schoolerp-documents-asia"
  location      = "ASIA"
  storage_class = "STANDARD"
}
```

#### 5.6 BigQuery Multi-Region Dataset

```hcl
# gcp/infrastructure/bigquery.tf

resource "google_bigquery_dataset" "analytics" {
  dataset_id    = "analytics"
  location      = "US"         # Multi-region
  friendly_name = "Analytics"
}

resource "google_bigquery_dataset" "analytics_asia" {
  dataset_id    = "analytics_asia"
  location      = "asia-south1"
  friendly_name = "Analytics (Asia)"
}
```

#### 5.7 Health Checks (Per-Region)

```yaml
apiVersion: compute.cnrm.cloud.google.com/v1beta1
kind: ComputeHealthCheck
metadata:
  name: schoolerp-healthcheck-asia
spec:
  checkIntervalSec: 10
  timeoutSec: 5
  healthyThreshold: 2
  unhealthyThreshold: 3
  httpHealthCheck:
    port: 8080
    requestPath: /api/healthz?region=asia-south1
```

#### 5.8 Failover Behavior

**Automatic Failover** (when region unhealthy):
```
asia-south1 region fails (3 consecutive health checks fail)
├─ Global LB removes asia-south1 from rotation
├─ New Indian user requests → routed to us-central1 (backup)
├─ Existing asia-south1 users → connection drops, auto-reconnect to us-central1
├─ Latency impact: +200ms (Asia → USA)
└─ Alert sent to DevOps Slack

asia-south1 recovers (2 consecutive health checks pass)
├─ Global LB adds asia-south1 back to rotation
├─ New requests → asia-south1 (low latency again)
└─ Alert: Region recovered
```

#### 5.9 Data Consistency Across Regions

**Challenge**: Multi-master Firestore can have temporary inconsistencies.

**Solution**: Application-level conflict detection and resolution.

```javascript
// apps/api/src/services/attendance.ts

import { Firestore } from '@google-cloud/firestore';

interface AttendanceRecord {
  studentId: string;
  date: string;
  status: 'present' | 'absent';
  timestamp: number;
  region: string;
}

export async function markAttendance(
  firestore: Firestore,
  record: AttendanceRecord
): Promise<void> {
  const docRef = firestore
    .collection('schools')
    .doc(record.schoolId)
    .collection('attendance')
    .doc(`${record.studentId}_${record.date}`);

  // Use conditional write (if-not-exists or if-version-matches)
  await firestore.runTransaction(async (transaction) => {
    const existing = await transaction.get(docRef);
    
    if (existing.exists) {
      const existingData = existing.data();
      
      // Conflict detected: same record written from different regions
      if (existingData.timestamp < record.timestamp) {
        // Newer write wins
        transaction.set(docRef, record);
      } else {
        // Existing is newer, ignore this write
        console.log(`Ignoring write (older): ${record.timestamp}`);
      }
    } else {
      // No conflict, write normally
      transaction.set(docRef, record);
    }
  });
}
```

### Deployment Checklist

- [ ] Deploy Cloud Run to us-central1, asia-south1, europe-west1 (same version)
- [ ] Verify health checks pass in all regions
- [ ] Configure Global Load Balancer with geo-based routing
- [ ] Test failover: kill asia-south1 region, verify requests route to us-central1
- [ ] Verify Firestore replication latency <5s
- [ ] Test multi-region write: write from Asia, read from USA (should be consistent within 5s)
- [ ] Configure monitoring alerts per region
- [ ] Document runbook: "What to do if a region is down?"

---

## 6. Infrastructure as Code (Terraform/Bicep)

### Overview
All GCP infrastructure is defined in Terraform code, version-controlled in Git. This enables reproducible deployments, change auditing, and safe infrastructure testing.

### Project Structure

```
schoolerp-infrastructure/
├─ terraform/
│  ├─ main.tf                 # Provider, variables, outputs
│  ├─ gcp.tf                  # GCP provider configuration
│  ├─ variables.tf            # Input variables (changeable)
│  ├─ terraform.tfvars        # Variable values (not in git)
│  ├─ .gitignore              # Exclude terraform state
│  │
│  ├─ environments/
│  │  ├─ staging.tfvars       # Staging environment settings
│  │  └─ production.tfvars    # Production environment settings
│  │
│  ├─ modules/
│  │  ├─ cloud_run/           # Cloud Run service (reusable)
│  │  ├─ firestore/           # Firestore database (reusable)
│  │  ├─ cloud_storage/       # Cloud Storage bucket (reusable)
│  │  ├─ bigquery/            # BigQuery dataset (reusable)
│  │  ├─ load_balancer/       # Global/regional load balancers
│  │  ├─ secrets/             # Secret Manager configuration
│  │  ├─ monitoring/          # Cloud Monitoring dashboards
│  │  └─ networking/          # VPC, firewalls
│  │
│  ├─ staging/
│  │  ├─ main.tf              # Staging infrastructure
│  │  ├─ terraform.tfvars     # Staging variables
│  │  └─ terraform.tfstate    # Staging state (backed up)
│  │
│  └─ production/
│     ├─ main.tf              # Production infrastructure
│     ├─ terraform.tfvars     # Production variables
│     └─ terraform.tfstate    # Production state (backed up)
│
└─ docs/
   ├─ TERRAFORM_GUIDE.md      # How to use terraform
   ├─ PLAN_REVIEW_PROCESS.md  # Approval process
   └─ RUNBOOKS.md             # Common tasks
```

### Core Terraform Files

#### 6.1 Main Configuration

```hcl
# schoolerp-infrastructure/terraform/main.tf

terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Remote state stored in Cloud Storage (not local)
  backend "gcs" {
    bucket  = "schoolerp-terraform-state"
    prefix  = "terraform/state"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Instantiate modules for environment
module "cloud_run" {
  source = "./modules/cloud_run"

  project_id          = var.gcp_project_id
  region              = var.gcp_region
  service_name        = var.service_name
  container_image     = var.container_image
  memory_mb           = var.memory_mb
  cpu                 = var.cpu
  concurrency         = var.concurrency
  min_instances       = var.min_instances
  max_instances       = var.max_instances
  
  environment_variables = merge(
    {
      GCP_PROJECT_ID = var.gcp_project_id
      ENVIRONMENT    = var.environment
    },
    var.extra_env_vars
  )

  service_account_email = google_service_account.api.email
}

module "firestore" {
  source = "./modules/firestore"

  project_id = var.gcp_project_id
  database_id = "${var.environment}-db"
  location_id = var.firestore_location
  
  # Production: multi-region replication
  # Staging: single-region for cost savings
  enable_multi_region = var.environment == "production"
}

module "monitoring" {
  source = "./modules/monitoring"

  project_id = var.gcp_project_id
  env_name   = var.environment
  
  # Alert thresholds vary by environment
  alert_latency_threshold = var.alert_latency_threshold
  alert_error_rate_threshold = var.alert_error_rate_threshold
  
  notification_channel_slack = google_monitoring_notification_channel.slack.id
}
```

#### 6.2 Variables Configuration

```hcl
# schoolerp-infrastructure/terraform/variables.tf

variable "gcp_project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "gcp_region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (staging, production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be 'staging' or 'production'."
  }
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
}

variable "container_image" {
  description = "Container image URL"
  type        = string
  # e.g., "gcr.io/schoolerp-prod/schoolerp-api:v1.0.0"
}

variable "memory_mb" {
  description = "Memory allocation (MB)"
  type        = number
  default     = 1024
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
  default     = "1"
}

variable "concurrency" {
  description = "Max concurrent requests per instance"
  type        = number
  default     = 80
}

variable "min_instances" {
  description = "Minimum number of instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum number of instances"
  type        = number
  default     = 5
}

variable "alert_latency_threshold" {
  description = "Alert threshold for API latency (ms)"
  type        = number
  default     = 500
}

variable "alert_error_rate_threshold" {
  description = "Alert threshold for error rate (%)"
  type        = number
  default     = 1.0
}

variable "extra_env_vars" {
  description = "Additional environment variables"
  type        = map(string)
  default     = {}
}
```

#### 6.3 Environment-Specific Values

```hcl
# schoolerp-infrastructure/terraform/environments/staging.tfvars

gcp_project_id              = "schoolerp-staging-gcp"
gcp_region                  = "us-central1"
environment                 = "staging"
service_name                = "schoolerp-api-staging"
container_image             = "gcr.io/schoolerp-staging-gcp/schoolerp-api:latest"
memory_mb                   = 512
cpu                         = "1"
concurrency                 = 32
min_instances               = 1
max_instances               = 3
alert_latency_threshold     = 300
alert_error_rate_threshold  = 0.5

extra_env_vars = {
  LOG_LEVEL         = "DEBUG"
  FEATURE_FLAGS     = "enable-beta-features"
  PROFILE_REQUESTS  = "true"
}
```

```hcl
# schoolerp-infrastructure/terraform/environments/production.tfvars

gcp_project_id              = "schoolerp-prod"
gcp_region                  = "us-central1"
environment                 = "production"
service_name                = "schoolerp-api"
container_image             = "gcr.io/schoolerp-prod/schoolerp-api:v1.0.0"
memory_mb                   = 1024
cpu                         = "2"
concurrency                 = 80
min_instances               = 3
max_instances               = 10
alert_latency_threshold     = 500
alert_error_rate_threshold  = 1.0

extra_env_vars = {
  LOG_LEVEL         = "INFO"
  FEATURE_FLAGS     = ""
  PROFILE_REQUESTS  = "false"
}
```

### Workflow: Plan, Review, Apply

#### 6.4 Planning Phase

```bash
#!/bin/bash
# scripts/terraform-plan.sh

ENVIRONMENT=${1:-staging}
TERRAFORM_DIR="schoolerp-infrastructure/terraform"

echo "Planning infrastructure changes for $ENVIRONMENT..."

cd "$TERRAFORM_DIR"

# Initialize terraform (if not already done)
terraform init

# Plan changes (output to file for review)
terraform plan \
  -var-file="environments/${ENVIRONMENT}.tfvars" \
  -out="plans/${ENVIRONMENT}.tfplan"

echo "Plan saved to plans/${ENVIRONMENT}.tfplan"
echo "Next: Review changes and run 'terraform apply plans/${ENVIRONMENT}.tfplan'"
```

**Plan Output Example**:
```
Terraform will perform the following actions:

  # module.cloud_run.google_cloud_run_service.schoolerp will be created
  + resource "google_cloud_run_service" "schoolerp" {
      + id                          = (known after apply)
      + location                    = "us-central1"
      + name                        = "schoolerp-api-staging"
      + project                     = "schoolerp-staging-gcp"
      + status                      = (known after apply)
      + traffic_config              = (known after apply)
      ...
    }

  # google_storage_bucket.terraform_state will be created
  + resource "google_storage_bucket" "terraform_state" {
      + name     = "schoolerp-terraform-state-staging"
      ...
    }

Plan: 8 to add, 0 to change, 0 to destroy.

The plan was saved to: plans/staging.tfplan
To apply it, run: terraform apply plans/staging.tfplan
```

#### 6.5 Review Phase

**For Staging**:
- Any DevOps team member can review
- Generate plan, verify no destructive changes
- Approve and proceed

**For Production**:
- Lead DevOps architect reviews plan
- 2 technical leads must approve
- Use GitHub PR for visibility and audit trail

```bash
# Review checklist (before approval)
# 1. No unexpected resource deletions
# 2. Resource sizes match expectations (no cost surprises)
# 3. Security groups/IAM changes reviewed
# 4. Environment variables correct
# 5. Backup strategy in place (before destructive changes)

# Command to check plan:
terraform show plans/production.tfplan
```

#### 6.6 Apply Phase

```bash
#!/bin/bash
# scripts/terraform-apply.sh

ENVIRONMENT=${1:-staging}
PLAN_FILE="plans/${ENVIRONMENT}.tfplan"
TERRAFORM_DIR="schoolerp-infrastructure/terraform"

if [ ! -f "$TERRAFORM_DIR/$PLAN_FILE" ]; then
  echo "Error: Plan file not found: $PLAN_FILE"
  exit 1
fi

cd "$TERRAFORM_DIR"

echo "Applying infrastructure changes for $ENVIRONMENT..."
echo "Plan file: $PLAN_FILE"
echo "Press ENTER to continue, or Ctrl+C to cancel."
read

# Apply the plan (deterministic, no re-planning)
terraform apply "$PLAN_FILE"

# Backup state file
curl -X POST "https://cloudstorage.googleapis.com/storage/v1/b/schoolerp-terraform-state/o" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -F "file=@terraform.tfstate" \
  -F "name=backups/tfstate-$(date -u +%Y%m%d-%H%M%S).json"

echo "Infrastructure applied successfully!"
echo "State file backed up to Cloud Storage."
```

#### 6.7 Destroy (Staging Only)

```bash
#!/bin/bash
# scripts/terraform-destroy-staging.sh

# Safety check: prevent accidental production destruction
if grep -q "production" terraform.tfvars; then
  echo "Error: Cannot destroy production infrastructure!"
  exit 1
fi

echo "DESTROYING STAGING INFRASTRUCTURE!"
echo "This will delete all resources in staging environment."
echo "Type 'I am sure' to continue:"
read CONFIRM

if [ "$CONFIRM" != "I am sure" ]; then
  echo "Cancelled."
  exit 0
fi

terraform destroy -var-file="environments/staging.tfvars"
```

#### 6.8 CI/CD Integration (GitHub Actions)

```yaml
# .github/workflows/terraform-plan.yml

name: Terraform Plan

on:
  pull_request:
    paths:
      - 'terraform/**'
      - '.github/workflows/terraform*.yml'

jobs:
  plan:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_TF_SA_KEY }}
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Terraform Plan (Staging)
        if: github.event.pull_request.base.ref == 'main'
        run: |
          cd terraform
          terraform init
          terraform plan -var-file=environments/staging.tfvars -out=tfplan-staging
      
      - name: Post Plan Comment
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_wrapper: false
      
      - name: Comment PR
        uses: actions/github-script@v6
        if: github.event_name == 'pull_request'
        with:
          script: |
            const fs = require('fs');
            const plan = fs.readFileSync('terraform/tfplan-staging', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## Terraform Plan (Staging)\n\`\`\`\n${plan}\n\`\`\``
            });
```

```yaml
# .github/workflows/terraform-apply.yml

name: Terraform Apply

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        options: [staging, production]
        default: staging
      
permissions:
  contents: read
  pull-requests: read

jobs:
  apply:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v2
        with:
          terraform_version: 1.5.0
      
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_TF_SA_KEY }}
      
      - name: Setup Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Terraform Apply (${{ github.event.inputs.environment }})
        run: |
          ENV="${{ github.event.inputs.environment }}"
          
          if [ "$ENV" = "production" ]; then
            # Require 2 approvals before production
            echo "Production apply requires manual approval"
            echo "Check GitHub Actions for approval step"
          fi
          
          cd terraform
          terraform init
          terraform apply \
            -var-file="environments/${ENV}.tfvars" \
            -auto-approve
      
      - name: Notify Slack
        if: always()
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -d "Terraform apply completed for ${{ github.event.inputs.environment }} environment"
```

### Terraform Best Practices

| Practice | Implementation |
|---|---|
| **State Management** | Remote state in Cloud Storage (encrypted, versioned) |
| **Access Control** | Only CI/CD service account can apply changes |
| **Audit Trail** | All terraform.tfplan files committed to Git |
| **Secrets** | Never store secrets in .tfvars; use Cloud Secret Manager |
| **Testing** | terraform validate, terraform fmt -check |
| **Rollback** | Previous state stored; can revert to prior version |
| **Documentation** | Every module has README.md with usage examples |

---

## 7. Monitoring & Alerting Enhancements

### Overview
Real-time monitoring of all infrastructure provides visibility into system health, performance, and cost. Alerts notify DevOps of issues before they impact users.

### Cloud Monitoring Dashboards

#### 7.1 API Performance Dashboard

**Dashboard Name**: `schoolerp-api-performance`

**Panels**:

```yaml
# API Latency (p50, p95, p99)
apiVersion: monitoring.googleapis.com/v1
kind: Dashboard
metadata:
  displayName: SchoolERP API Performance
spec:
  gridLayout:
    widgets:
      - title: "API Request Latency"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="custom.googleapis.com/api/latency"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_PERCENTILE_50"
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="custom.googleapis.com/api/latency"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_PERCENTILE_95"
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="custom.googleapis.com/api/latency"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_PERCENTILE_99"
          timeshiftDuration: "0s"
          yAxis:
            label: "Latency (ms)"
            scale: "LINEAR"

      - title: "4xx and 5xx Error Rates"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_count" AND metric.response_code_class="4xx"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_RATE"

      - title: "Cloud Run Instances"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/instance_count"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_MEAN"

      - title: "Cold Start Latency"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="custom.googleapis.com/api/cold_start_latency"'
                  aggregation:
                    alignmentPeriod: "300s"
                    perSeriesAligner: "ALIGN_MAX"
```

#### 7.2 Database Performance Dashboard

```yaml
# Database Dashboard
apiVersion: monitoring.googleapis.com/v1
kind: Dashboard
metadata:
  displayName: SchoolERP Database Performance
spec:
  gridLayout:
    widgets:
      - title: "Firestore Read Latency"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="firestore_database" AND metric.type="firestore.googleapis.com/document/read_ops"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_DELTA"

      - title: "Firestore Write Latency"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="firestore_database" AND metric.type="firestore.googleapis.com/document/write_ops"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_DELTA"

      - title: "Quota Usage (Reads, Writes)"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="firestore_database" AND metric.type="firestore.googleapis.com/quota/used"'
                  aggregation:
                    alignmentPeriod: "60s"
                    perSeriesAligner: "ALIGN_MEAN"
```

#### 7.3 Infrastructure Dashboard

```yaml
# Infrastructure Dashboard
apiVersion: monitoring.googleapis.com/v1
kind: Dashboard
metadata:
  displayName: SchoolERP Infrastructure
spec:
  gridLayout:
    widgets:
      - title: "Cloud Run Memory Usage"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/memory_utilizations"'

      - title: "Cloud Run CPU Usage"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/cpu_utilizations"'

      - title: "Cloud Load Balancer Backend Health"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="https_lb_rule" AND metric.type="loadbalancing.googleapis.com/https/backend_latencies"'

      - title: "Pub/Sub Message Lag"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: 'resource.type="pubsub_subscription" AND metric.type="pubsub.googleapis.com/subscription/num_held_acks"'
```

### Alert Policies

#### 7.4 Critical Alerts

```yaml
# Alert 1: High API Latency
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  displayName: "API Latency (p95) > 500ms - CRITICAL"
spec:
  conditions:
    - displayName: "API latency p95 exceeds 500ms"
      conditionThreshold:
        filter: |
          resource.type="cloud_run_revision"
          metric.type="custom.googleapis.com/api/latency"
        aggregations:
          - alignmentPeriod: "60s"
            perSeriesAligner: "ALIGN_PERCENTILE_95"
        comparison: "COMPARISON_GT"
        thresholdValue: 500
        duration: "300s"
  notificationChannels:
    - projects/schoolerp-prod/notificationChannels/pagerduty-critical
    - projects/schoolerp-prod/notificationChannels/slack-devops
  documentation:
    content: |
      Possible causes:
      - High database latency
      - Cloud Run instance overload
      - Network congestion
      
      Remediation:
      1. Check Firestore operation latency
      2. Review Cloud Run instance CPU/memory
      3. Check global load balancer metrics
      4. Scale up if needed: gcloud run deploy --max-instances 15

---

# Alert 2: High Error Rate
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  displayName: "Error Rate > 1% - WARNING"
spec:
  conditions:
    - displayName: "Error rate exceeds 1%"
      conditionThreshold:
        filter: |
          resource.type="cloud_run_revision"
          metric.type="run.googleapis.com/request_count"
          metric.response_code_class="5xx"
        aggregations:
          - alignmentPeriod: "60s"
            perSeriesAligner: "ALIGN_RATE"
        comparison: "COMPARISON_GT"
        thresholdValue: 0.01  # 1% of requests
        duration: "120s"
  notificationChannels:
    - projects/schoolerp-prod/notificationChannels/slack-errors
  documentation:
    content: |
      Check recent deployments or backend errors.

---

# Alert 3: Dead Letter Queue Messages Accumulating
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  displayName: "DLQ Messages > 10 - WARNING"
spec:
  conditions:
    - displayName: "DLQ has messages"
      conditionThreshold:
        filter: |
          resource.type="pubsub_subscription"
          resource.labels.subscription_id=~".*-dlq"
          metric.type="pubsub.googleapis.com/subscription/num_undelivered_messages"
        comparison: "COMPARISON_GT"
        thresholdValue: 10
        duration: "300s"
  notificationChannels:
    - projects/schoolerp-prod/notificationChannels/slack-warnings
  documentation:
    content: |
      Messages failed to publish to primary topic.
      Investigate the original error and replay from DLQ.

---

# Alert 4: Firestore Quota Exceeded
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  displayName: "Firestore Quota Exceeded - CRITICAL"
spec:
  conditions:
    - displayName: "Quota usage > 95%"
      conditionThreshold:
        filter: |
          resource.type="firestore_database"
          metric.type="firestore.googleapis.com/quota/used"
        comparison: "COMPARISON_GT"
        thresholdValue: 0.95  # 95% of quota
        duration: "60s"
  notificationChannels:
    - projects/schoolerp-prod/notificationChannels/pagerduty-critical
    - projects/schoolerp-prod/notificationChannels/slack-devops
  documentation:
    content: |
      Firestore quota usage is very high. Options:
      1. Optimize queries (add indexes)
      2. Request quota increase from GCP
      3. Implement request throttling

---

# Alert 5: Cold Start Latency
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  displayName: "Cold Start > 5s - INFO"
spec:
  conditions:
    - displayName: "Cold start exceeds 5s"
      conditionThreshold:
        filter: |
          resource.type="cloud_run_revision"
          metric.type="custom.googleapis.com/api/cold_start_latency"
        aggregations:
          - alignmentPeriod: "300s"
            perSeriesAligner: "ALIGN_MAX"
        comparison: "COMPARISON_GT"
        thresholdValue: 5000  # 5s in milliseconds
        duration: "600s"
  notificationChannels:
    - projects/schoolerp-prod/notificationChannels/slack-performance
  documentation:
    content: |
      Cold start detected. Increase min-instances to reduce cold starts.

---

# Alert 6: Out of Memory
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  displayName: "Out of Memory Error - CRITICAL"
spec:
  conditions:
    - displayName: "OOM in logs"
      conditionThreshold:
        filter: |
          resource.type="cloud_run_revision"
          severity="ERROR"
          jsonPayload.error=~"out of memory|ENOMEM"
        comparison: "COMPARISON_GT"
        thresholdValue: 1
        duration: "60s"
  notificationChannels:
    - projects/schoolerp-prod/notificationChannels/pagerduty-critical
    - projects/schoolerp-prod/notificationChannels/slack-devops
  documentation:
    content: |
      Cloud Run instance ran out of memory.
      Increase memory allocation or optimize code.
```

#### 7.5 Slack Integration

```yaml
# Notification Channel: Slack (DevOps)
apiVersion: monitoring.googleapis.com/v1
kind: NotificationChannel
metadata:
  displayName: "#devops (Slack)"
spec:
  type: slack
  labels:
    channel_name: "#devops"
  userLabels:
    severity: "critical"

---

# Notification Channel: Slack (Errors)
apiVersion: monitoring.googleapis.com/v1
kind: NotificationChannel
metadata:
  displayName: "#errors (Slack)"
spec:
  type: slack
  labels:
    channel_name: "#errors"

---

# Notification Channel: PagerDuty
apiVersion: monitoring.googleapis.com/v1
kind: NotificationChannel
metadata:
  displayName: "PagerDuty (On-Call)"
spec:
  type: pagerduty
  labels:
    integration_key: ${{ secrets.PAGERDUTY_INTEGRATION_KEY }}
```

### Custom Metrics

#### 7.6 Publishing Custom Metrics from Backend

```javascript
// apps/api/src/middleware/monitoring.ts

import { MetricServiceClient } from '@google-cloud/monitoring';

const client = new MetricServiceClient();

export function recordLatency(
  endpoint: string,
  latencyMs: number,
  statusCode: number
): void {
  const now = new Date();
  const value = {
    doubleValue: latencyMs,
  };

  const dataPoint = {
    interval: {
      endTime: {
        seconds: Math.floor(now.getTime() / 1000),
        nanos: (now.getTime() % 1000) * 1e6,
      },
    },
    value: value,
  };

  const timeSeries = {
    metric: {
      type: 'custom.googleapis.com/api/latency',
      labels: {
        endpoint: endpoint,
        status_code: String(statusCode),
      },
    },
    resource: {
      type: 'cloud_run_revision',
      labels: {
        service_name: process.env.K_SERVICE,
        revision_name: process.env.K_REVISION,
        location: process.env.CLOUD_RUN_REGION,
      },
    },
    points: [dataPoint],
  };

  const request = {
    name: client.projectPath(process.env.GCP_PROJECT_ID!),
    timeSeries: [timeSeries],
  };

  client.createTimeSeries(request).catch(console.error);
}

// Usage in Express middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const latency = Date.now() - start;
    recordLatency(req.path, latency, res.statusCode);
  });
  
  next();
});
```

---

## 8. Database Backup Strategy

### Overview
Daily backups with 30-day retention enable rapid recovery from data corruption, accidental deletes, or ransomware attacks.

### Firestore Backup Architecture

#### 8.1 Automated Daily Backups

```bash
#!/bin/bash
# scripts/firestore-backup.sh

PROJECT_ID="schoolerp-prod"
DATABASE_ID="production"
BACKUP_LOCATION="us-central1"
BUCKET="schoolerp-firestore-backups"

# Create backup
gcloud firestore backups create \
  --project="${PROJECT_ID}" \
  --database="${DATABASE_ID}" \
  --location="${BACKUP_LOCATION}"

# Export backup collection to Cloud Storage (long-term archive)
gcloud firestore export \
  --project="${PROJECT_ID}" \
  --collection-ids="schools,students,teachers,attendance,exams,marks" \
  gs://${BUCKET}/backups/$(date -u +%Y%m%d)/

echo "Backup completed at $(date)"
```

**Schedule**: Cron job at 2 AM IST daily

```yaml
# Cloud Scheduler Job
apiVersion: cloudscheduler.googleapis.com/v1
kind: Job
metadata:
  name: firestore-backup-daily
  location: asia-south1
spec:
  schedule: "0 20 * * *"  # 2 AM IST = 8:30 PM UTC previous day
  timeZone: "Asia/Kolkata"
  httpTarget:
    uri: https://us-central1-schoolerp-prod.cloudfunctions.net/firestore-backup
    httpMethod: POST
    headers:
      Content-Type: application/json
    idempotencyKey: ${uuid()}
```

#### 8.2 Backup Retention Policy

| Backup Type | Retention | Storage Cost |
|---|---|---|
| **Firestore automated backups** | 7 days | Included in Firestore |
| **Cloud Storage export** | 30 days rolling | ₹0.02/GB/month (cold storage) |
| **BigQuery snapshots** | 7 days (queryable) | Included in BigQuery |
| **Full yearly snapshot** | 3 years | ₹0.01/GB/month (cold storage) |

#### 8.3 Weekly Restore Test

**Example**: Every Sunday at 3 AM, restore backup to staging database to verify:
1. Backup integrity
2. Data consistency  
3. Restore RPO/RTO

```bash
#!/bin/bash
# scripts/test-restore-staging.sh

PROJECT_ID="schoolerp-staging-gcp"
BACKUP_ID="firestore_backup_$(date -u +%Y%m%d)"

# Find latest backup from production
PROD_BACKUPS=$(gcloud firestore backups list --project=schoolerp-prod --filter='state=SUCCESS' --limit=1)
LATEST_BACKUP=$(echo "$PROD_BACKUPS" | grep -oP 'bkpst_[a-f0-9]+' | head -1)

echo "Restoring backup: $LATEST_BACKUP to staging..."

# Restore to staging database
gcloud firestore databases restore \
  --project="${PROJECT_ID}" \
  --database=staging-restore-test \
  --backup=projects/schoolerp-prod/locations/us-central1/backups/${LATEST_BACKUP}

# Verify data count
DOCUMENT_COUNT=$(gcloud firestore query --project="${PROJECT_ID}" -- 'schools' --limit=0 | wc -l)
echo "Restored database contains $DOCUMENT_COUNT documents"

# Cleanup after verification
gcloud firestore databases delete staging-restore-test --project="${PROJECT_ID}"

echo "Restore test completed successfully"
```

**Schedule**: Cloud Scheduler, Sundays 3 AM IST

#### 8.4 Disaster Recovery Runbook

**Scenario**: Data corruption detected in production (e.g., payment records corrupted)

**Steps**:

```
1. ISOLATE (prevent further damage)
   - Stop writes to affected Firestore collection
   - Alert: All write operations paused
   - Notify customers: "Under investigation, no new transactions"

2. ASSESS (understand scope)
   - Query: How many documents affected?
   - Timeline: When did corruption start?
   - Root cause: Malicious edit? API bug? Ransomware?
   - Backup integrity: Will restored backup fix the issue?

3. PREPARE (backup plan)
   - Select backup point-in-time (before corruption)
   - Estimate restore time: E.g., 500GB database = 30 minutes
   - Plan downtime window: 4 AM - 5 AM (low traffic)
   - Notify: School admins of brief maintenance

4. RESTORE (execute recovery)
   - Restore Firestore to point-in-time
   - Verify: Sample check 10 documents
   - Run smoke tests (see Section 3)
   - Resume writes

5. VALIDATE (ensure correctness)
   - Compare checksums: Restored vs. backup
   - Query spot-checks: Attendance records correct? Marks correct?
   - Full consistency check: All indices rebuilt
   - Alert: Recovery complete

6. COMMUNICATE (update stakeholders)
   - Slack: All-clear message
   - Email: Customer notification
   - Post-mortem: Root cause analysis
```

**RTO/RPO Target**:
- **RPO** (Recovery Point Objective): 24 hours (daily backup)
  - If production fails at 3 PM, restore to data from 2 AM (13 hours of data loss)
  - Acceptable risk for non-critical operations
- **RTO** (Recovery Time Objective): 30 minutes
  - From decision to restore → production live again: 30 minutes

### BigQuery Backups

#### 8.5 Table Snapshots (Daily)

```sql
-- Create daily snapshot of analytics tables
-- Scheduled query (Daily 2:30 AM IST)

-- Snapshot: attendance table
CREATE OR REPLACE TABLE `schoolerp-prod.analytics.attendance_snapshot_20260415` AS
SELECT * FROM `schoolerp-prod.analytics.attendance`;

-- Retention: Automatically delete snapshots older than 7 days
DELETE FROM `schoolerp-prod.analytics.attendance_snapshot_*`
WHERE EXTRACT(DATE FROM CURRENT_TIMESTAMP()) - DATE(PARSE_DATE('%Y%m%d', REGEXP_EXTRACT(_TABLE_SUFFIX, r'(\d{8})$'))) > 7;
```

**BigQuery Snapshot Benefits**:
- Immutable (can't delete/modify)
- Queryable (can run reports against old data)
- Point-in-time view (exactly as it was on date X)

### Backup Monitoring

#### 8.6 Backup Automation Alerts

```yaml
# Alert: Backup Failed
apiVersion: monitoring.googleapis.com/v1
kind: AlertPolicy
metadata:
  displayName: "Firestore Backup Failed - CRITICAL"
spec:
  conditions:
    - displayName: "No successful backup in last 26 hours"
      conditionThreshold:
        filter: |
          resource.type="firestore_backup"
          metric.type="firestore.googleapis.com/backup/backup_size"
          metric.backup_status="SUCCESS"
        aggregations:
          - alignmentPeriod: "3600s"
            perSeriesAligner: "ALIGN_NONE"
        comparison: "COMPARISON_LT"
        thresholdValue: 1
        duration: "93600s"  # 26 hours
  notificationChannels:
    - projects/schoolerp-prod/notificationChannels/pagerduty-critical
    - projects/schoolerp-prod/notificationChannels/slack-devops
```

---

## 9. Log Aggregation & Analysis (Cloud Logging)

### Overview
All logs are centralized in Cloud Logging, searchable, and analyzed for troubleshooting and compliance.

### Log Sources

#### 9.1 Application Logs

```javascript
// apps/api/src/middleware/logging.ts

import { logging } from '@google-cloud/logging';

const log = logging.log('schoolerp-api');

// Log API request
export function logRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const entry = log.entry(
    {
      severity: 'INFO',
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.url,
        status: res.statusCode,
        userAgent: req.get('user-agent'),
        remoteIp: req.ip,
        latency: res.getHeader('X-Response-Time'),
      },
      labels: {
        service: 'schoolerp-api',
        version: process.env.VERSION,
        environment: process.env.ENVIRONMENT,
      },
    },
    `${req.method} ${req.path} - ${res.statusCode}`
  );
  
  entry.write();
  next();
}

// Log authentication event
export function logAuthEvent(
  userId: string,
  action: 'login' | 'logout' | 'mfa',
  status: 'success' | 'failure',
  reason?: string
): void {
  const entry = log.entry(
    {
      severity: status === 'success' ? 'INFO' : 'WARNING',
      labels: {
        event_type: 'authentication',
        user_id: userId,
        action: action,
        status: status,
      },
    },
    `Authentication ${action} for user ${userId}: ${status}${reason ? ` (${reason})` : ''}`
  );
  
  entry.write();
}

// Log payment transaction
export function logPaymentTransaction(
  transactionId: string,
  schoolId: string,
  amount: number,
  status: 'pending' | 'success' | 'failed',
  razorpayResponse?: object
): void {
  const entry = log.entry(
    {
      severity: status === 'failed' ? 'ERROR' : 'INFO',
      labels: {
        event_type: 'payment',
        transaction_id: transactionId,
        school_id: schoolId,
      },
    },
    {
      transaction_id: transactionId,
      school_id: schoolId,
      amount: amount,
      status: status,
      razorpay_response: razorpayResponse,
    }
  );
  
  entry.write();
}

// Log database operation (Firestore)
export function logDatabaseOperation(
  collection: string,
  operation: 'read' | 'write' | 'delete',
  documentId: string,
  latencyMs: number,
  success: boolean,
  error?: string
): void {
  const entry = log.entry(
    {
      severity: success ? 'DEBUG' : 'WARNING',
      labels: {
        event_type: 'database',
        collection: collection,
        operation: operation,
      },
    },
    {
      collection: collection,
      document_id: documentId,
      operation: operation,
      latency_ms: latencyMs,
      success: success,
      error: error,
    }
  );
  
  entry.write();
}
```

#### 9.2 Infrastructure Logs

Cloud Logging automatically ingests:
- Cloud Run request/response logs
- Firestore operation logs
- Cloud Load Balancer access logs
- Cloud Storage access logs
- VPC Flow Logs

#### 9.3 Error Stack Traces

```javascript
// apps/api/src/middleware/errors.ts

export function logError(error: Error, context: object): void {
  const entry = log.entry(
    {
      severity: 'ERROR',
      sourceLocation: {
        file: error.stack?.split('\n')[1], // Line with error
      },
      labels: {
        event_type: 'error',
      },
    },
    {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
    }
  );
  
  entry.write();
}

// Express error handler
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  logError(error, {
    url: req.url,
    method: req.method,
    userId: req.user?.id,
  });
  
  res.status(500).json({ error: 'Internal server error' });
});
```

### Log Queries

#### 9.4 Common Log Queries

```sql
-- Query 1: Failed logins in last 24 hours
SELECT
  jsonPayload.user_id,
  COUNT(*) as failure_count,
  ARRAY_AGG(DISTINCT jsonPayload.reason) as reasons
FROM `schoolerp-prod.cloud_logging_data.projects_logs`
WHERE jsonPayload.event_type = 'authentication'
  AND jsonPayload.action = 'login'
  AND jsonPayload.status = 'failure'
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR)
GROUP BY jsonPayload.user_id
ORDER BY failure_count DESC;

-- Query 2: Slowest API endpoints (p95 latency)
SELECT
  resource.labels.service_name,
  httpRequest.requestUrl,
  COUNT(*) as request_count,
  APPROX_QUANTILES(CAST(httpRequest.latency as FLOAT64), 100)[OFFSET(95)] as p95_latency_seconds
FROM `schoolerp-prod.cloud_logging_data.projects_logs`
WHERE resource.type = 'cloud_run_revision'
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
GROUP BY resource.labels.service_name, httpRequest.requestUrl
ORDER BY p95_latency_seconds DESC
LIMIT 10;

-- Query 3: Payment transaction errors
SELECT
  jsonPayload.transaction_id,
  jsonPayload.school_id,
  jsonPayload.status,
  jsonPayload.error,
  timestamp
FROM `schoolerp-prod.cloud_logging_data.projects_logs`
WHERE jsonPayload.event_type = 'payment'
  AND jsonPayload.status = 'failed'
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAYS)
ORDER BY timestamp DESC;

-- Query 4: Database latency distribution
SELECT
  jsonPayload.collection,
  jsonPayload.operation,
  COUNT(*) as operation_count,
  APPROX_QUANTILES(jsonPayload.latency_ms, 100)[OFFSET(50)] as p50_latency_ms,
  APPROX_QUANTILES(jsonPayload.latency_ms, 100)[OFFSET(95)] as p95_latency_ms,
  APPROX_QUANTILES(jsonPayload.latency_ms, 100)[OFFSET(99)] as p99_latency_ms
FROM `schoolerp-prod.cloud_logging_data.projects_logs`
WHERE jsonPayload.event_type = 'database'
  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
GROUP BY jsonPayload.collection, jsonPayload.operation
ORDER BY p95_latency_ms DESC;
```

### Log-Based Metrics

#### 9.5 Derive Metrics from Logs

```yaml
# Create metric: Count of failed logins per hour
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingMetric
metadata:
  name: failed_logins
spec:
  filter: |
    jsonPayload.event_type="authentication"
    AND jsonPayload.action="login"
    AND jsonPayload.status="failure"
  metricDescriptor:
    metricKind: DELTA
    valueType: INT64
    displayName: "Failed Logins"
    unit: "1"
  labelExtractors:
    school_id: EXTRACT(jsonPayload.school_id)
    reason: EXTRACT(jsonPayload.reason)

---

# Create metric: API latency from logs
apiVersion: logging.cnrm.cloud.google.com/v1beta1
kind: LoggingMetric
metadata:
  name: api_request_latency
spec:
  filter: |
    resource.type="cloud_run_revision"
    AND httpRequest.latency!=""
  metricDescriptor:
    metricKind: DELTA
    valueType: DISTRIBUTION
    displayName: "API Request Latency"
    unit: "ms"
    bucketOptions:
      exponentialBuckets:
        numFiniteBuckets: 32
        growthFactor: 2
  valueExtractor: EXTRACT(httpRequest.latency)
  labelExtractors:
    endpoint: EXTRACT(httpRequest.requestUrl)
    status_code: EXTRACT(httpRequest.status)
```

### Log Sink (Export to BigQuery)

#### 9.6 Long-Term Log Archive

```hcl
# gcp/infrastructure/logging.tf

resource "google_logging_project_sink" "bigquery_export" {
  name        = "bigquery-export-sink"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/cloud_logging_data"
  
  filter = <<FILTER
    (resource.type="cloud_run_revision"
    OR resource.type="firestore_database"
    OR resource.type="cloud_load_balancer"
    OR resource.type="cloud_storage_bucket")
    AND severity >= "DEBUG"
  FILTER
  
  unique_writer_identity = true
}

# Grant sink service account permission to write to BigQuery dataset
resource "google_bigquery_dataset_iam_member" "sink_writer" {
  dataset_id = google_bigquery_dataset.logging_archive.id
  role       = "roles/bigquery.dataEditor"
  member     = google_logging_project_sink.bigquery_export.writer_identity
}
```

---

## 10. Performance Profiling & Optimization

### Overview
Continuous profiling identifies performance bottlenecks and recommends optimizations.

### Cloud Profiler Integration

#### 10.1 Enable Profiling in Node.js

```javascript
// apps/api/src/index.ts (before other imports)

if (process.env.ENVIRONMENT === 'production') {
  require('@google-cloud/profiler').start({
    projectId: process.env.GCP_PROJECT_ID,
    serviceVersion: process.env.VERSION,
    serviceVersion: `api-${process.env.VERSION}`,
  });
}

import express from 'express';
// ... rest of app
```

#### 10.2 Profile Data

Cloud Profiler collects:
- **CPU profile**: Which functions consume most CPU?
- **Memory profile**: Which functions allocate most memory?
- **Wall-clock profile**: Where is execution time spent?
- **Thread state**: How many threads? How many blocked?

**Example Report**:

```
CPU Profile (top functions, last hour):
┌─────────────────────────────────────┬──────────┬─────────────┐
│ Function                            │ CPU %    │ Time (ms)   │
├─────────────────────────────────────┼──────────┼─────────────┤
│ firebaseAuth.verifyIdToken()        │ 35%      │ 2100        │
│ firestoreDb.collection().get()      │ 28%      │ 1680        │
│ razorpayClient.validatePayment()    │ 15%      │ 900         │
│ middleware.cors()                   │ 12%      │ 720         │
│ Other                               │ 10%      │ 600         │
└─────────────────────────────────────┴──────────┴─────────────┘

Opportunities:
- Cache verification tokens (reduce 35% CPU)
- Add Firestore index on common queries (reduce 28% CPU)
```

### Cloud Trace Integration

#### 10.3 Distributed Tracing

```javascript
// apps/api/src/middleware/trace.ts

import { trace } from '@google-cloud/trace-agent';

// Trace initialization (before app starts)
trace.start({
  projectId: process.env.GCP_PROJECT_ID,
  samplingRate: 0.1,  // Sample 10% of requests (for cost)
});

// Trace custom spans
export async function attendanceService(
  req: Request,
  res: Response
): Promise<void> {
  const rootSpan = trace.createChildSpan({ name: 'attendance-service' });

  try {
    // Database query
    const dbSpan = trace.createChildSpan({
      name: 'firestore-query',
      childOf: rootSpan,
    });
    const data = await firestore
      .collection('attendance')
      .where('date', '==', req.query.date)
      .get();
    dbSpan.endSpan();

    // Processing
    const processSpan = trace.createChildSpan({
      name: 'attendance-processing',
      childOf: rootSpan,
    });
    const processed = processAttendanceData(data);
    processSpan.endSpan();

    // BigQuery export
    const bqSpan = trace.createChildSpan({
      name: 'bigquery-insert',
      childOf: rootSpan,
    });
    await bigQuery.dataset('analytics').table('attendance').insert(processed);
    bqSpan.endSpan();

    res.json(processed);
  } finally {
    rootSpan.endSpan();
  }
}
```

**Trace Waterfall** (example):

```
attendance-service (400ms total)
├─ firestore-query (100ms)
│  └─ network latency (50ms)
│  └─ Firestore processing (50ms)
├─ attendance-processing (50ms)
│  └─ data transformation (50ms)
└─ bigquery-insert (250ms)
   └─ network latency (50ms)
   └─ BigQuery batch insert (200ms)
```

### Performance Dashboards

#### 10.4 Custom Dashboard for Performance

```yaml
apiVersion: monitoring.googleapis.com/v1
kind: Dashboard
metadata:
  displayName: Performance Analysis Dashboard
spec:
  gridLayout:
    widgets:
      - title: "Top CPU-Consuming Functions"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: |
                    resource.type="global"
                    AND metric.type="cloudprofiler.googleapis.com/cpu_profile"
                  aggregation:
                    alignmentPeriod: "3600s"
                    perSeriesAligner: "ALIGN_SUM"

      - title: "Memory Allocation Profile"
        xyChart:
          dataSets:
            - timeSeriesQuery:
                timeSeriesFilter:
                  filter: |
                    resource.type="global"
                    AND metric.type="cloudprofiler.googleapis.com/memory_profile"

      - title: "Trace Latency Breakdown (Last Hour)"
        # Shows where requests spend time
```

### Optimization Recommendations

#### 10.5 Automated Optimization Suggestions (via Cloud Logging Analysis)

| Issue Detected | Recommendation | Expected Improvement |
|---|---|---|
| Frequent Firestore reads for same data | Implement caching (Redis/Memcached) | 50% latency reduction |
| Missing Firestore index on common queries | Create composite index | 70% query latency reduction |
| High JWT verification CPU | Cache verified tokens (TTL 5 min) | 35% CPU reduction |
| Large response payloads | Implement pagination + field filtering | 40% bandwidth reduction |
| Cold starts every hour | Increase min-instances to 2 | 50% cold start reduction |
| Duplicate API calls in frontend | Add client-side caching (IndexedDB) | 30% fewer API calls |

---

## 11. Cost Optimization

### Overview
Monitor spending, identify expensive operations, and apply optimizations to stay under budget.

### Cost Analysis

#### 11.1 Cloud Billing Export

```hcl
# Export daily costs to BigQuery for analysis
resource "google_billing_budget" "schoolerp_prod_budget" {
  billing_account = var.billing_account_id
  display_name    = "SchoolERP Production Budget"
  budget_amount_currency_code = "INR"

  budget_amount_nanos = 500000000000  # ₹5,00,000

  threshold_rule {
    threshold_percent = 0.50  # Alert at 50%
    spend_basis      = "CURRENT_SPEND"
  }

  threshold_rule {
    threshold_percent = 0.80  # Alert at 80%
    spend_basis      = "CURRENT_SPEND"
  }

  threshold_rule {
    threshold_percent = 1.0   # Alert at 100%
    spend_basis      = "CURRENT_SPEND"
  }

  all_updates_rule {
    monitoring_notification_channels = [
      google_monitoring_notification_channel.slack_billing.id
    ]
    disable_default_iam_recipients = false
  }
}
```

#### 11.2 Cost Breakdown Query

```sql
-- Monthly cost by service
SELECT
  service.description as Service,
  ROUND(SUM(cost), 2) as Total_Cost_INR,
  ROUND(SUM(cost) / SUM(SUM(cost)) OVER (), 2) * 100 as Percentage
FROM `schoolerp-prod.billing_export.gcp_billing_export_v1_*`
WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', CURRENT_DATE() - 1)
GROUP BY Service
ORDER BY Total_Cost_INR DESC;

-- Cost by resource label (environment tag)
SELECT
  labels.value as Environment,
  ROUND(SUM(cost), 2) as Total_Cost_INR
FROM `schoolerp-prod.billing_export.gcp_billing_export_v1_*`
WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', CURRENT_DATE() - 1)
  AND labels.key = 'environment'
GROUP BY Environment;

-- Expensive Firestore operations
SELECT
  resource.name as Operation,
  ROUND(SUM(cost), 2) as Cost_INR,
  ROUND(SUM(usage.amount), 0) as Usage_Units
FROM `schoolerp-prod.billing_export.gcp_billing_export_v1_*`
WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', CURRENT_DATE() - 1)
  AND service.description LIKE '%Firestore%'
GROUP BY resource.name
ORDER BY Cost_INR DESC;
```

#### 11.3 Cost Optimization Recommendations

| Service | Current Cost | Issue | Recommendation | Savings |
|---|---|---|---|---|
| **Cloud Run** | ₹15,000 | Instances always at max concurrency | Scale down to 50% in staging | ₹4,000 (-26%) |
| **Firestore** | ₹18,000 | Unindexed queries (expensive scans) | Create 3 composite indices | ₹6,000 (-33%) |
| **Cloud Storage** | ₹8,000 | Hot storage for old backups | Move to cold storage (90+ days old) | ₹6,400 (-80%) |
| **BigQuery** | ₹5,000 | Scanning entire table per query | Partition tables by date | ₹1,500 (-30%) |
| **Pub/Sub** | ₹2,000 | Small batch size, high message count | Batch messages (save 40% API calls) | ₹800 (-40%) |
| **Compute Network** | ₹3,000 | Multi-region data transfer | Use CDN caching (Cloud CDN) | ₹1,500 (-50%) |

#### 11.4 Commitment Discounts

For stable, predictable workloads, use 1-year or 3-year commitments:

```hcl
# Example: Commit to 100GB/month of Firestore reads
# Pay upfront: ₹1,50,000/year (25% discount)
# Save: ₹51,000/year vs on-demand

resource "google_compute_resource_commitment" "firestore" {
  name        = "schoolerp-firestore-commitment"
  plan        = "ONE_YEAR"
  commitment_config {
    resource_type = "firestore"
    resources {
      amount = 100  # 100GB
      type   = "firestore.googleapis.com/database/read_ops"
    }
  }
}
```

#### 11.5 Spend Forecasting

```sql
-- Predict next month's costs based on last 7 days
SELECT
  CURRENT_DATE() as forecast_date,
  DATE_ADD(CURRENT_DATE(), INTERVAL 1 MONTH) as projected_end_date,
  ROUND(AVG(daily_cost) * 30, 0) as projected_monthly_cost_INR
FROM (
  SELECT
    _TABLE_SUFFIX as date,
    ROUND(SUM(cost), 2) as daily_cost
  FROM `schoolerp-prod.billing_export.gcp_billing_export_v1_*`
  WHERE _TABLE_SUFFIX >= FORMAT_DATE('%Y%m%d', CURRENT_DATE() - 7)
  GROUP BY _TABLE_SUFFIX
);

-- If trend shows increase, alert DevOps
-- Example: "Projected cost ₹5,50,000 (↑10% from last month)"
```

---

## Success Criteria (Week 2)

### Deployment & Operations
- ✅ Staging environment fully configured and operational
- ✅ Blue-green deployment tested in staging (0% downtime achieved)
- ✅ Automated smoke tests run successfully post-deploy
- ✅ All secrets in Cloud Secret Manager (zero env vars in code)
- ✅ Deployment cycle: <5 minutes (build + deploy + smoke tests)

### Infrastructure & Reliability
- ✅ Terraform defines 100% of infrastructure
- ✅ `terraform plan` → review → `terraform apply` workflow enabled
- ✅ Multi-region deployment: 3 regions active, automatic failover working
- ✅ Firestore multi-region replication <5 seconds latency
- ✅ Daily backups with 30-day retention (test restore weekly)
- ✅ MTTR (Mean Time To Recovery) <30 seconds

### Observability
- ✅ Cloud Monitoring dashboards for API, database, infrastructure
- ✅ 11 critical alerts configured (PagerDuty + Slack integration)
- ✅ Cloud Logging aggregating all sources (100,000+ logs/day searchable)
- ✅ Cost tracking: Daily billing export to BigQuery
- ✅ Custom metrics: API latency, cold starts, database operations

### Performance & Cost
- ✅ Cloud Profiler enabled: identify bottlenecks continuously
- ✅ Distributed tracing: latency breakdown per service
- ✅ Cost forecasting: Projected monthly spend <₹5,00,000
- ✅ Optimization recommendations: 25% cost savings identified (via analysis)

---

## Timeline & Ownership

| Task | Owner | Week | Start | End |
|---|---|---|---|---|
| Staging infrastructure setup | DevOps | Week 2 | Apr 9 | Apr 11 |
| Blue-green deployment config | DevOps | Week 2 | Apr 9 | Apr 12 |
| Smoke test automation | QA + DevOps | Week 2 | Apr 10 | Apr 13 |
| Secret Manager setup | DevOps | Week 2 | Apr 11 | Apr 12 |
| Multi-region deployment | DevOps | Week 2 | Apr 12 | Apr 14 |
| Terraform modules (all infra) | DevOps | Week 2 | Apr 9 | Apr 15 |
| Monitoring dashboards + alerts | DevOps | Week 2 | Apr 13 | Apr 16 |
| Backup + restore runbooks | DevOps | Week 2 | Apr 14 | Apr 17 |
| Cloud Logging setup + queries | DevOps + QA | Week 2 | Apr 15 | Apr 18 |
| Performance profiling + cost optimization | DevOps | Week 2 | Apr 16 | Apr 20 |

---

## Related Documents

- [3_CICD_PIPELINE.md](3_CICD_PIPELINE.md) - GitHub Actions workflow details
- [7_DOCKER_LOCAL_DEV.md](7_DOCKER_LOCAL_DEV.md) - Local development with Docker
- [19_CLOUD_INFRASTRUCTURE_SETUP.md](19_CLOUD_INFRASTRUCTURE_SETUP.md) - Initial GCP setup
- [20_BACKEND_IMPLEMENTATION.md](20_BACKEND_IMPLEMENTATION.md) - API healthz endpoint, logging middleware
- [22_DEVOPS_PIPELINE.md](22_DEVOPS_PIPELINE.md) - Companion DevOps document (Week 1)

---

**Document Version**: 1.0  
**Last Updated**: April 9, 2026  
**Next Review**: April 21, 2026 (post-Week 2 completion)
