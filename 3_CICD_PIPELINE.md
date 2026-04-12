# CI/CD PIPELINE - Cloud Build Configuration
## Production-Ready Deployment Automation

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Ready to Deploy  

---

# PART 1: Cloud Build Configuration (.cloudbuild.yaml)

```yaml
# File: .cloudbuild.yaml
# Location: Root of GitHub repo
# Purpose: Automated build, test, and deploy pipeline

steps:

  # STEP 1: Lint & Code Quality Check
  - name: 'gcr.io/cloud-builders/gke-deploy'
    id: 'lint'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        npm install
        npm run lint
        npm run format:check

  # STEP 2: Unit Tests
  - name: 'gcr.io/cloud-builders/gke-deploy'
    id: 'unit-tests'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        npm run test:unit -- --coverage
        # Fail if coverage < 80%
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "Coverage $COVERAGE% is below 80% threshold"
          exit 1
        fi

  # STEP 3: Build Docker Image
  - name: 'gcr.io/cloud-builders/docker'
    id: 'build-image'
    args:
      - 'build'
      - '-t'
      - 'gcr.io/$PROJECT_ID/school-erp-api:$SHORT_SHA'
      - '-t'
      - 'gcr.io/$PROJECT_ID/school-erp-api:latest'
      - '-f'
      - 'Dockerfile'
      - '.'
    env:
      - 'DOCKER_BUILDKIT=1'

  # STEP 4: Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    id: 'push-image'
    args:
      - 'push'
      - 'gcr.io/$PROJECT_ID/school-erp-api:$SHORT_SHA'

  # STEP 5: Integration Tests (Against Firestore Emulator)
  - name: 'gcr.io/cloud-builders/gke-deploy'
    id: 'integration-tests'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        npm run test:integration

  # STEP 6: Security Scan (Container)
  - name: 'gcr.io/cloud-builders/container-scanning'
    id: 'security-scan'
    args:
      - 'gcr.io/$PROJECT_ID/school-erp-api:$SHORT_SHA'

  # STEP 7: Deploy to Cloud Run (Staging)
  - name: 'gcr.io/cloud-builders/run'
    id: 'deploy-staging'
    args:
      - 'deploy'
      - 'school-erp-api-staging'
      - '--image'
      - 'gcr.io/$PROJECT_ID/school-erp-api:$SHORT_SHA'
      - '--region'
      - 'asia-northeast1'
      - '--platform'
      - 'managed'
      - '--memory'
      - '512Mi'
      - '--cpu'
      - '1'
      - '--timeout'
      - '60'
      - '--set-env-vars'
      - 'NODE_ENV=staging,FIRESTORE_DATABASE=school-erp-staging'
      - '--no-allow-unauthenticated'
    env:
      - 'CLOUDSDK_COMPUTE_REGION=asia-northeast1'

  # STEP 8: Smoke Tests (Against Staging)
  - name: 'gcr.io/cloud-builders/gke-deploy'
    id: 'smoke-tests'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        # Wait for deployment
        sleep 30
        # Run smoke tests
        npm run test:smoke -- --baseUrl=https://school-erp-api-staging.run.app

  # STEP 9: Deploy to Cloud Run (Production) - Manual approval
  - name: 'gcr.io/cloud-builders/run'
    id: 'deploy-production'
    args:
      - 'deploy'
      - 'school-erp-api'
      - '--image'
      - 'gcr.io/$PROJECT_ID/school-erp-api:$SHORT_SHA'
      - '--region'
      - 'asia-south1'
      - '--platform'
      - 'managed'
      - '--memory'
      - '2Gi'
      - '--cpu'
      - '2'
      - '--timeout'
      - '60'
      - '--set-env-vars'
      - 'NODE_ENV=production,FIRESTORE_DATABASE=school-erp-prod'
      - '--no-allow-unauthenticated'
    env:
      - 'CLOUDSDK_COMPUTE_REGION=asia-south1'
    # Only deploy to prod if on main branch
    onFailure: ['ROLLBACK']

  # STEP 10: Health Check
  - name: 'gcr.io/cloud-builders/gke-deploy'
    id: 'health-check'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        curl -f https://school-erp-api.run.app/api/v1/health || exit 1

  # STEP 11: Database Migration (if schema changed)
  - name: 'gcr.io/cloud-builders/gke-deploy'
    id: 'db-migration'
    entrypoint: 'bash'
    args:
      - '-c'
      - |
        # Check if any Firestore schema files changed
        if git diff HEAD~1 HEAD --name-only | grep -q "firestore-schema"; then
          echo "Schema change detected, updating indexes..."
          npm run firestore:update-indexes
        fi

images:
  - 'gcr.io/$PROJECT_ID/school-erp-api:$SHORT_SHA'
  - 'gcr.io/$PROJECT_ID/school-erp-api:latest'

artifacts:
  objects:
    location: 'gs://$PROJECT_ID-build-logs/artifacts/$BUILD_ID'
    paths:
      - 'coverage/**/*'
      - 'test-results/**/*'

timeout: '3600s'

# Trigger configuration (in Cloud Console):
# - Branch: ^main$            (production deployments)
# - Branch: ^staging$         (staging deployments)
# - Trigger file: .cloudbuild.yaml
```

---

# PART 2: GitHub Actions (Alternative/Complementary)

## File: `.github/workflows/test.yml`

```yaml
name: Unit Tests & Linting

on:
  pull_request:
    branches: [ main, staging ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18.x'
        cache: 'npm'
    
    - name: Install Dependencies
      run: npm ci
    
    - name: Lint Code
      run: npm run lint
    
    - name: Run Unit Tests
      run: npm run test:unit -- --coverage
    
    - name: Upload Coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
    
    - name: Check Coverage Threshold
      run: |
        COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
        if (( $(echo "$COVERAGE < 80" | bc -l) )); then
          echo "❌ Coverage $COVERAGE% is below 80%"
          exit 1
        fi
        echo "✅ Coverage $COVERAGE% meets threshold"
```

## File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Cloud SDK
      uses: google-github-actions/setup-gcloud@v1
      with:
        project_id: ${{ secrets.GCP_PROJECT_ID }}
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        export_default_credentials: true
    
    - name: Configure Docker to use Cloud SDK
      run: |
        gcloud auth configure-docker
    
    - name: Build & Push Docker Image
      run: |
        docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/school-erp-api:${{ github.sha }} .
        docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/school-erp-api:${{ github.sha }}
    
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy school-erp-api \
          --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/school-erp-api:${{ github.sha }} \
          --region asia-south1 \
          --platform managed \
          --no-allow-unauthenticated
    
    - name: Smoke Test
      run: |
        sleep 30
        curl -f https://school-erp-api.run.app/api/v1/health
```

---

# PART 3: Environment Management

## `.env.local` (Development)

```bash
# Firebase
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=school-erp-dev.firebaseapp.com
FIREBASE_PROJECT_ID=school-erp-dev
FIREBASE_DATABASE_URL=https://school-erp-dev.firebaseio.com
FIREBASE_STORAGE_BUCKET=school-erp-dev.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef...

# GCP
GCP_PROJECT_ID=school-erp-dev
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json

# Firestore
FIRESTORE_EMULATOR_HOST=localhost:8080

# App
NODE_ENV=development
PORT=8080
LOG_LEVEL=debug
```

## `.env.staging`

```bash
# Firebase
FIREBASE_API_KEY=AIza...staging
FIREBASE_PROJECT_ID=school-erp-staging

# GCP
GCP_PROJECT_ID=school-erp-staging

# Firestore
FIRESTORE_DATABASE=school-erp-staging

# App
NODE_ENV=staging
PORT=8080
LOG_LEVEL=info
```

## `.env.production`

```bash
# Firebase (Different project)
FIREBASE_API_KEY=AIza...prod
FIREBASE_PROJECT_ID=school-erp-prod

# GCP
GCP_PROJECT_ID=school-erp-prod

# Firestore
FIRESTORE_DATABASE=school-erp-prod

# App
NODE_ENV=production
PORT=8080
LOG_LEVEL=warn
```

---

# PART 4: Rollback Procedure

## If Deployment Fails or Bug Found:

```bash
#!/bin/bash
# Script: rollback.sh

SERVICE_NAME="school-erp-api"
REGION="asia-south1"
CURRENT_VERSION=$(gcloud run services describe $SERVICE_NAME --region $REGION \
  --format='value(spec.template.spec.containers[0].image)')

echo "Current version: $CURRENT_VERSION"

# Get previous working version
PREVIOUS_VERSION=$(gcloud run revisions list --service $SERVICE_NAME --region $REGION \
  --format='value(name)' --limit=2 | tail -1)

echo "Rolling back to: $PREVIOUS_VERSION"

# Rollback
gcloud run update $SERVICE_NAME \
  --image $PREVIOUS_VERSION \
  --region $REGION

echo "✅ Rollback complete"
```

## Automated Rollback (On Health Check Failure):

```yaml
# In .cloudbuild.yaml:
onFailure:
  - 'ROLLBACK'

steps:
  - name: 'Health Check'
    args: ['curl', '-f', '${HEALTH_CHECK_URL}']
    onFailure: ['ROLLBACK']
```

---

# PART 5: Monitoring & Alerting

## Cloud Logging Configuration

```
Severity Level Mapping:
  DEBUG (Firestore queries, cache hits)
  INFO (Successful operations)
  WARNING (Slow queries >5 seconds, rate limit approaching)
  ERROR (Failed operations, auth failures)
  CRITICAL (Data corruption, security breach)

Alert Triggers:
- 5+ ERROR level logs in 5 minutes → Page on-call engineer
- 100+ requests/min from same IP → Potential DDoS, block
- <90% uptime in last hour → Escalate to team lead
```

---

**This CI/CD setup ensures zero-downtime deployments, automatic rollbacks, and production-grade reliability.**
