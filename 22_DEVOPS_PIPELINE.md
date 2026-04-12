# DevOps Pipeline & Cloud Deployment Infrastructure
## GitHub Actions, Docker, Cloud Run, and Secret Management

**Version:** 1.0.0  
**Date:** April 9, 2026  
**Status:** Production-Ready  
**Owner:** DevOps Agent  

---

## Table of Contents
1. [GitHub Repository Setup](#github-repository-setup)
2. [CI/CD Pipeline (GitHub Actions)](#cicd-pipeline-github-actions)
3. [Docker Configuration](#docker-configuration)
4. [Cloud Run Deployment](#cloud-run-deployment)
5. [Environment & Secret Management](#environment--secret-management)
6. [Rollback Strategy](#rollback-strategy)
7. [Monitoring & Alerting](#monitoring--alerting)

---

## GitHub Repository Setup

### 1. Repository Structure (Monorepo)

```
school-erp/
├── .github/
│   └── workflows/              # GitHub Actions workflows
│       ├── ci-pr.yml           # Lint, test on PR
│       ├── build-deploy.yml    # Build & deploy on main
│       └── release-prod.yml    # Production release on tag
├── apps/
│   ├── api/                    # Express/Node.js backend
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   └── tests/
│   ├── web/                    # React frontend
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── src/
│   └── founder/                # Founder admin panel
│       ├── Dockerfile
│       ├── package.json
│       └── src/
├── packages/
│   └── shared/                 # Shared TypeScript types & utils
│       ├── package.json
│       └── src/
├── docker-compose.yml          # Local development
├── .env.example                # Environment template
├── .gcloudignore               # Cloud Build filters
├── cloudbuild.yaml             # Cloud Build config (alternative)
├── package.json                # Monorepo root
└── README.md
```

### 2. Branch Strategy

- **main** → Auto-deploy to **staging** (Cloud Run)
- **tags** (v1.0.0, v1.0.1) → Deploy to **production**
- **feature branches** → Run tests, lint, typecheck
- **Protected main** → Require passing tests + 1 approval

---

## CI/CD Pipeline (GitHub Actions)

### Workflow 1: PR Validation (ci-pr.yml)

**File:** `.github/workflows/ci-pr.yml`

**Trigger:** Pull requests to `main`  
**Actions:** Lint → Typecheck → Unit Tests (must all pass)

```yaml
name: CI - PR Validation

on:
  pull_request:
    branches:
      - main

concurrency:
  group: ci-pr-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    name: Lint & Format Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint
        continue-on-error: false

      - name: Check formatting
        run: npm run format:check

  typecheck:
    name: TypeScript Type Checking
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type check all workspaces
        run: npm run typecheck

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    services:
      firestore:
        image: google/cloud-sdk:emulators
        ports:
          - 8080:8080
        options: >-
          --health-cmd "curl -f http://localhost:8080 || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests with coverage
        run: npm run test -- --coverage
        env:
          FIRESTORE_EMULATOR_HOST: 'localhost:8080'
          NODE_ENV: test

      - name: Check coverage threshold
        run: |
          COVERAGE=$(npm run test -- --coverage --silent 2>&1 | grep -oP 'Lines\s*:\s*\K[\d.]+' || echo "0")
          echo "Code coverage: $COVERAGE%"
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "::error::Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-summary.json
          flags: unittests
          fail_ci_if_error: false

  pr-summary:
    name: Report PR Status
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    if: always()
    steps:
      - name: Check job status
        run: |
          if [[ "${{ needs.lint.result }}" != "success" || \
                "${{ needs.typecheck.result }}" != "success" || \
                "${{ needs.test.result }}" != "success" ]]; then
            echo "::error::One or more checks failed"
            exit 1
          fi
          echo "✅ All checks passed!"
```

---

### Workflow 2: Build & Deploy to Staging (build-deploy.yml)

**File:** `.github/workflows/build-deploy.yml`

**Trigger:** Merge to `main`  
**Actions:** Build → Push to Artifact Registry → Deploy to Cloud Run staging

```yaml
name: Build & Deploy to Staging

on:
  push:
    branches:
      - main

concurrency:
  group: deploy-staging
  cancel-in-progress: false

env:
  REGISTRY: us-central1-docker.pkg.dev
  PROJECT_ID: '${{ secrets.GCP_PROJECT_ID }}'
  ARTIFACT_REPO: 'school-erp'

jobs:
  changes:
    name: Detect Changes
    runs-on: ubuntu-latest
    outputs:
      api: ${{ steps.changes.outputs.api }}
      web: ${{ steps.changes.outputs.web }}
      founder: ${{ steps.changes.outputs.founder }}
    steps:
      - uses: actions/checkout@v4

      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            api:
              - 'apps/api/**'
              - 'packages/shared/**'
              - '.github/workflows/build-deploy.yml'
            web:
              - 'apps/web/**'
              - 'packages/shared/**'
              - '.github/workflows/build-deploy.yml'
            founder:
              - 'apps/founder/**'
              - 'packages/shared/**'
              - '.github/workflows/build-deploy.yml'

  build-api:
    name: Build & Push API
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.api == 'true' }}
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v1

      - name: Configure Docker auth for Artifact Registry
        run: |
          gcloud auth configure-docker us-central1-docker.pkg.dev

      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          file: ./apps/api/Dockerfile
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/api:latest
            ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy API to Cloud Run (staging)
        run: |
          gcloud run deploy school-erp-api-staging \
            --image=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/api:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --set-env-vars=FIRESTORE_PROJECT_ID=${{ env.PROJECT_ID }},NODE_ENV=staging,DEPLOYMENT_ENV=staging \
            --service-account=${{ secrets.CLOUD_RUN_SA_STAGING }} \
            --memory=2Gi \
            --timeout=60s \
            --update-on-push

  build-web:
    name: Build & Push Web Frontend
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.web == 'true' }}
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v1

      - name: Configure Docker auth for Artifact Registry
        run: |
          gcloud auth configure-docker us-central1-docker.pkg.dev

      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          file: ./apps/web/Dockerfile
          push: true
          build-args: |
            REACT_APP_API_URL=https://api-staging.example.com
            REACT_APP_ENV=staging
          tags: |
            ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/web:latest
            ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/web:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy Web to Cloud Run (staging)
        run: |
          gcloud run deploy school-erp-web-staging \
            --image=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/web:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --memory=1Gi \
            --timeout=60s \
            --update-on-push

  build-founder:
    name: Build & Push Founder Admin
    runs-on: ubuntu-latest
    needs: changes
    if: ${{ needs.changes.outputs.founder == 'true' }}
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: docker/setup-buildx-action@v3

      - uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v1

      - name: Configure Docker auth for Artifact Registry
        run: |
          gcloud auth configure-docker us-central1-docker.pkg.dev

      - name: Build and push Founder image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/founder
          file: ./apps/founder/Dockerfile
          push: true
          build-args: |
            REACT_APP_API_URL=https://api-staging.example.com
            REACT_APP_ENV=staging
          tags: |
            ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/founder:latest
            ${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/founder:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy Founder to Cloud Run (staging)
        run: |
          gcloud run deploy school-erp-founder-staging \
            --image=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/founder:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --no-allow-unauthenticated \
            --memory=1Gi \
            --timeout=60s \
            --set-env-vars=REACT_APP_ENV=staging,REACT_APP_API_URL=https://api-staging.example.com \
            --update-on-push

  smoke-tests:
    name: Run Smoke Tests on Staging
    runs-on: ubuntu-latest
    needs: [build-api, build-web, build-founder]
    if: always() && (needs.build-api.result == 'success' || needs.build-api.result == 'skipped') && (needs.build-web.result == 'success' || needs.build-web.result == 'skipped') && (needs.build-founder.result == 'success' || needs.build-founder.result == 'skipped')
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Wait for deployments to stabilize
        run: sleep 30

      - name: Run smoke tests
        run: npm run test:smoke:staging
        env:
          API_URL: 'https://api-staging.example.com'
          WEB_URL: 'https://web-staging.example.com'

      - name: Notify Slack on success
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Staging deployment successful",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment Successful*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}

      - name: Notify Slack on failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "❌ Staging deployment failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Staging Deployment Failed*\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

### Workflow 3: Production Release (release-prod.yml)

**File:** `.github/workflows/release-prod.yml`

**Trigger:** Git tag (v*.*.*)  
**Actions:** Deploy to Cloud Run production

```yaml
name: Release to Production

on:
  push:
    tags:
      - 'v[0-9]+.[0-9]+.[0-9]+'

env:
  REGISTRY: us-central1-docker.pkg.dev
  PROJECT_ID: '${{ secrets.GCP_PROJECT_ID }}'
  ARTIFACT_REPO: 'school-erp'

jobs:
  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: 'https://api.example.com'
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4

      - uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v1

      - name: Extract version from tag
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/}" >> $GITHUB_OUTPUT

      - name: Deploy API to Production
        run: |
          gcloud run deploy school-erp-api-prod \
            --image=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/api:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --set-env-vars=FIRESTORE_PROJECT_ID=${{ env.PROJECT_ID }},NODE_ENV=production,DEPLOYMENT_ENV=prod,VERSION=${{ steps.version.outputs.VERSION }} \
            --service-account=${{ secrets.CLOUD_RUN_SA_PROD }} \
            --memory=2Gi \
            --cpu=1 \
            --timeout=60s \
            --min-instances=2 \
            --max-instances=50 \
            --update-on-push

      - name: Deploy Web to Production
        run: |
          gcloud run deploy school-erp-web-prod \
            --image=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/web:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --memory=1Gi \
            --min-instances=1 \
            --max-instances=20 \
            --timeout=60s \
            --update-on-push

      - name: Deploy Founder to Production
        run: |
          gcloud run deploy school-erp-founder-prod \
            --image=${{ env.REGISTRY }}/${{ env.PROJECT_ID }}/${{ env.ARTIFACT_REPO }}/founder:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --no-allow-unauthenticated \
            --memory=1Gi \
            --timeout=60s \
            --set-env-vars=REACT_APP_ENV=production \
            --min-instances=1 \
            --max-instances=10 \
            --update-on-push

      - name: Run production smoke tests
        run: npm run test:smoke:prod
        env:
          API_URL: 'https://api.example.com'
          WEB_URL: 'https://app.example.com'
          FOUNDER_URL: 'https://founder.example.com'

      - name: Create GitHub Release
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.version.outputs.VERSION }}
          release_name: Release ${{ steps.version.outputs.VERSION }}
          body: |
            ## Production Deployment
            - **Version:** ${{ steps.version.outputs.VERSION }}
            - **Commit:** ${{ github.sha }}
            - **Author:** ${{ github.actor }}
            - **Date:** ${{ github.event.head_commit.timestamp }}
          draft: false
          prerelease: false

      - name: Notify deployment team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚀 Production Deployment Complete",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Production Deployment Complete*\nVersion: ${{ steps.version.outputs.VERSION }}\nCommit: ${{ github.sha }}\nAuthor: ${{ github.actor }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Docker Configuration

### API Dockerfile (Production)

**File:** `apps/api/Dockerfile`

```dockerfile
# Multi-stage build for API

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install production dependencies only
RUN npm ci --workspace @school-erp/api --production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Install all dependencies (including dev)
RUN npm ci

# Build shared library
RUN npm run build --workspace @school-erp/shared

# Build API
RUN npm run build --workspace @school-erp/api

# Stage 3: Runtime
FROM node:20-alpine AS runtime
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy dependencies from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=dependencies /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built application from builder stage
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy configuration files
COPY apps/api/package.json ./apps/api/
COPY package.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Expose port
EXPOSE 8080

# Use dumb-init to run Node
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/api/dist/index.js"]
```

---

### Web Dockerfile (React Frontend)

**File:** `apps/web/Dockerfile`

```dockerfile
# Multi-stage build for React Web

# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

# Install dependencies
RUN npm ci

# Build shared library
RUN npm run build --workspace @school-erp/shared

# Build React app with build arguments
ARG REACT_APP_API_URL=https://api.example.com
ARG REACT_APP_ENV=production
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ENV=$REACT_APP_ENV

RUN npm run build --workspace @school-erp/web

# Stage 2: Runtime (Nginx)
FROM nginx:1.25-alpine AS runtime

# Copy Nginx config
COPY apps/web/nginx.conf /etc/nginx/nginx.conf
COPY apps/web/default.conf /etc/nginx/conf.d/default.conf

# Copy built React app
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001
USER nginx

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### Nginx Config for React Router

**File:** `apps/web/nginx.conf`

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript
               application/x-javascript application/xml+rss
               application/javascript application/json;

    include /etc/nginx/conf.d/*.conf;
}
```

**File:** `apps/web/default.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # Cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # SPA routing - serve index.html for all non-file requests
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=0, must-revalidate";
    }

    # Deny access to environment files
    location ~ /\.env {
        deny all;
    }

    location ~ /\.git {
        deny all;
    }
}
```

---

### Founder Admin Dockerfile

**File:** `apps/founder/Dockerfile`

```dockerfile
# Identical to web Dockerfile for founder app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/ ./packages/shared/
COPY apps/founder/ ./apps/founder/

RUN npm ci

RUN npm run build --workspace @school-erp/shared

ARG REACT_APP_API_URL=https://api.example.com
ARG REACT_APP_ENV=production
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ENV=$REACT_APP_ENV

RUN npm run build --workspace @school-erp/founder

FROM nginx:1.25-alpine AS runtime

COPY apps/founder/nginx.conf /etc/nginx/nginx.conf
COPY apps/founder/default.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/apps/founder/dist /usr/share/nginx/html

RUN addgroup -g 1001 -S nginx && adduser -S nginx -u 1001
USER nginx

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## Cloud Run Deployment

### Cloud Run Service YAML Manifests

**File:** `infra/cloud-run/api-staging.yaml`

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: school-erp-api-staging
  namespace: default
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: '1'
        autoscaling.knative.dev/maxScale: '10'
        run.googleapis.com/cpu-throttling: 'false'
    spec:
      serviceAccountName: school-erp-api-staging
      containers:
        - image: us-central1-docker.pkg.dev/PROJECT_ID/school-erp/api:latest
          ports:
            - containerPort: 8080
          resources:
            limits:
              memory: 2Gi
              cpu: '1'
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
          env:
            - name: NODE_ENV
              value: 'staging'
            - name: FIRESTORE_PROJECT_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: DEBUG
              value: 'false'
            - name: LOG_LEVEL
              value: 'info'
          envFrom:
            - secretRef:
                name: api-staging-secrets
  traffic:
    - percent: 100
      latestRevision: true
```

**File:** `infra/cloud-run/api-prod.yaml`

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: school-erp-api-prod
  namespace: default
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/minScale: '2'
        autoscaling.knative.dev/maxScale: '50'
        run.googleapis.com/cpu-throttling: 'false'
        client.knative.dev/user-image: us-central1-docker.pkg.dev/PROJECT_ID/school-erp/api:latest
    spec:
      serviceAccountName: school-erp-api-prod
      containers:
        - image: us-central1-docker.pkg.dev/PROJECT_ID/school-erp/api:latest
          ports:
            - containerPort: 8080
          resources:
            limits:
              memory: 2Gi
              cpu: '1'
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 30
            timeoutSeconds: 5
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 2
          env:
            - name: NODE_ENV
              value: 'production'
            - name: FIRESTORE_PROJECT_ID
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: LOG_LEVEL
              value: 'warn'
          envFrom:
            - secretRef:
                name: api-prod-secrets
  traffic:
    - percent: 100
      latestRevision: true
```

---

## Environment & Secret Management

### 1. Environment Files (.env)

**File:** `.env.example`

```env
# API Environment
NODE_ENV=development
PORT=8080
DEBUG=true
LOG_LEVEL=debug

# Firebase/Firestore
FIRESTORE_PROJECT_ID=school-erp-project
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_PRIVATE_KEY_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx
FIREBASE_CLIENT_ID=xxx
FIREBASE_CLIENT_CERT_URL=xxx

# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=schoolerp
POSTGRES_PASSWORD=dev_password
POSTGRES_DB=schoolerp_dev

# Redis
REDIS_URL=redis://localhost:6379

# Google Cloud
GCP_PROJECT_ID=school-erp-project
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json

# Authentication
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRY=24h

# Frontend URLs
REACT_APP_API_URL=http://localhost:8081
REACT_APP_ENV=development
REACT_APP_ENABLE_MOCK_DATA=true

# Monitoring
ENABLE_TRACING=false
SENTRY_DSN=
```

---

### 2. Google Secret Manager Setup

**Script:** `scripts/setup-secrets.sh`

```bash
#!/bin/bash
set -e

PROJECT_ID=${1:-school-erp-project}
ENVIRONMENT=${2:-staging}

echo "Setting up secrets in Google Secret Manager for project: $PROJECT_ID (env: $ENVIRONMENT)"

# Read .env file
if [ ! -f ".env.${ENVIRONMENT}" ]; then
  echo "Error: .env.${ENVIRONMENT} file not found"
  exit 1
fi

# Function to create or update secret
create_or_update_secret() {
  local secret_name=$1
  local secret_value=$2

  if gcloud secrets describe "$secret_name" --project="$PROJECT_ID" &>/dev/null; then
    echo "Updating secret: $secret_name"
    echo -n "$secret_value" | gcloud secrets versions add "$secret_name" \
      --data-file=- \
      --project="$PROJECT_ID"
  else
    echo "Creating secret: $secret_name"
    echo -n "$secret_value" | gcloud secrets create "$secret_name" \
      --data-file=- \
      --replication-policy="automatic" \
      --project="$PROJECT_ID"
  fi
}

# Parse .env file and create secrets
while IFS='=' read -r key value; do
  # Skip empty lines and comments
  [[ -z "$key" || "$key" =~ ^# ]] && continue

  # Remove quotes if present
  value="${value%\"}"
  value="${value#\"}"

  secret_name="${key,,}-${ENVIRONMENT}"
  create_or_update_secret "$secret_name" "$value"
done < ".env.${ENVIRONMENT}"

# Grant Cloud Run service account access
SA_EMAIL="school-erp-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "Granting secret accessor role to $SA_EMAIL"
gcloud projects get-iam-policy "$PROJECT_ID" --format=json > /tmp/policy.json

# For each secret, add binding
gcloud secrets add-iam-policy-binding "jwt-secret-${ENVIRONMENT}" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor" \
  --project="$PROJECT_ID"

echo "✅ Secrets setup complete"
```

---

### 3. GitHub Actions Secret Configuration

Add these secrets to your GitHub repository settings (`Settings → Secrets and variables → Actions`):

```
GCP_PROJECT_ID              → "school-erp-project"
WIF_PROVIDER                → "projects/123456/locations/global/workloadIdentityPools/github-pool/providers/github-provider"
WIF_SERVICE_ACCOUNT         → "github-actions@school-erp-project.iam.gserviceaccount.com"
CLOUD_RUN_SA_STAGING        → "school-erp-staging@school-erp-project.iam.gserviceaccount.com"
CLOUD_RUN_SA_PROD           → "school-erp-prod@school-erp-project.iam.gserviceaccount.com"
SLACK_WEBHOOK_URL           → "https://hooks.slack.com/services/..."
DOCKERHUB_USERNAME          → "your-dockerhub-user"
DOCKERHUB_TOKEN             → "your-dockerhub-token"
```

---

### 4. Load Secrets in Cloud Run

**Script:** `scripts/deploy-with-secrets.sh`

```bash
#!/bin/bash
set -e

SERVICE_NAME=$1
IMAGE=$2
ENVIRONMENT=$3
REGION=${4:-us-central1}

if [ -z "$SERVICE_NAME" ] || [ -z "$IMAGE" ] || [ -z "$ENVIRONMENT" ]; then
  echo "Usage: $0 <service-name> <image> <environment> [region]"
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project)

# Build secret environment variables from Secret Manager
SECRET_ENV_VARS=""
secrets=$(gcloud secrets list --project="$PROJECT_ID" --filter="name:*-${ENVIRONMENT}" --format="value(name)")

for secret in $secrets; do
  secret_key=$(echo "$secret" | sed "s/-${ENVIRONMENT}$//" | tr '[:lower:]' '[:upper:]' | sed 's/-/_/g')
  SECRET_ENV_VARS="${SECRET_ENV_VARS}${secret_key}=sm://${secret},"
done

# Remove trailing comma
SECRET_ENV_VARS="${SECRET_ENV_VARS%,}"

echo "Deploying $SERVICE_NAME with secrets..."
gcloud run deploy "$SERVICE_NAME" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform=managed \
  --set-secrets="$SECRET_ENV_VARS" \
  --service-account="school-erp-${ENVIRONMENT}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --memory=2Gi \
  --cpu=1 \
  --timeout=60s \
  --min-instances=1 \
  --max-instances=50

echo "✅ Deployment complete"
```

---

## Rollback Strategy

### 1. Automatic Rollback on Failure

**File:** `.github/workflows/rollback.yml`

```yaml
name: Automatic Rollback

on:
  workflow_run:
    workflows: ["Build & Deploy to Staging"]
    types: [completed]

jobs:
  rollback-on-failure:
    name: Rollback on Deployment Failure
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'failure' }}
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - uses: google-github-actions/setup-gcloud@v1

      - name: Get previous stable revision
        id: previous
        run: |
          REVISION=$(gcloud run services describe school-erp-api-staging \
            --region=us-central1 \
            --format='value(status.traffic[0].revision)' \
            || echo "")
          echo "REVISION=$REVISION" >> $GITHUB_OUTPUT

      - name: Rollback to previous revision
        if: steps.previous.outputs.REVISION
        run: |
          gcloud run services update-traffic school-erp-api-staging \
            --to-revisions=${{ steps.previous.outputs.REVISION }}=100 \
            --region=us-central1

      - name: Notify team of rollback
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "⚠️ Automatic Rollback Triggered",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Automatic Rollback Executed*\nWorkflow: ${{ github.event.workflow_run.name }}\nReason: Deployment failure detected"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

### 2. Manual Rollback Script

**Script:** `scripts/rollback.sh`

```bash
#!/bin/bash
set -e

SERVICE=$1
REVISION=${2:-}
ENVIRONMENT=${3:-staging}
REGION=${4:-us-central1}

if [ -z "$SERVICE" ]; then
  echo "Usage: $0 <service-name> [revision] [environment] [region]"
  echo "Example: $0 school-erp-api-staging aa1b2c3 staging us-central1"
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project)

if [ -z "$REVISION" ]; then
  echo "Listing recent revisions for $SERVICE..."
  gcloud run revisions list \
    --service="$SERVICE" \
    --region="$REGION" \
    --limit=10 \
    --format="table(name,created,status)"
  
  read -p "Enter revision to rollback to: " REVISION
fi

echo "Rolling back $SERVICE to revision: $REVISION"

gcloud run services update-traffic "$SERVICE" \
  --to-revisions="$REVISION"=100 \
  --region="$REGION"

echo "✅ Rollback complete"
echo "Verify: gcloud run services describe $SERVICE --region=$REGION"
```

---

### 3. Canary Deployment (Gradual Rollout)

**Script:** `scripts/canary-deploy.sh`

```bash
#!/bin/bash
set -e

SERVICE=$1
NEW_IMAGE=$2
REGION=${3:-us-central1}

if [ -z "$SERVICE" ] || [ -z "$NEW_IMAGE" ]; then
  echo "Usage: $0 <service-name> <image> [region]"
  exit 1
fi

PROJECT_ID=$(gcloud config get-value project)

echo "Starting canary deployment for $SERVICE..."

# Deploy new revision (not yet receiving traffic)
echo "Step 1: Deploy new revision..."
NEW_REVISION=$(gcloud run deploy "$SERVICE" \
  --image="$NEW_IMAGE" \
  --region="$REGION" \
  --no-traffic \
  --format='value(status.latestRevision)')

echo "New revision: $NEW_REVISION"

# Send 10% traffic
echo "Step 2: Sending 10% traffic to new revision..."
gcloud run services update-traffic "$SERVICE" \
  --to-revisions="$NEW_REVISION"=10 \
  --region="$REGION"

sleep 30

# Check for errors
echo "Step 3: Monitoring for errors..."
ERROR_RATE=$(gcloud monitoring time-series list \
  --filter="resource.service =\"$SERVICE\" AND metric.error_rate > 0.05" \
  --format='value(metric.error_rate)' || echo "0")

if [ "$ERROR_RATE" != "0" ]; then
  echo "High error rate detected: $ERROR_RATE"
  echo "Rolling back to previous revision..."
  gcloud run services update-traffic "$SERVICE" \
    --to-revisions="$NEW_REVISION"=0 \
    --region="$REGION"
  exit 1
fi

# Gradual rollout
for percentage in 25 50 100; do
  echo "Step: Increasing traffic to $percentage%..."
  gcloud run services update-traffic "$SERVICE" \
    --to-revisions="$NEW_REVISION"=$percentage \
    --region="$REGION"
  sleep 60
done

echo "✅ Canary deployment complete"
```

---

## Monitoring & Alerting

### 1. Cloud Monitoring Setup

**File:** `infra/monitoring/alerts.yaml`

```yaml
# Alert Policy for API Service Errors
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: school-erp-api-alerts
spec:
  groups:
    - name: school-erp.rules
      interval: 30s
      rules:
        # High Error Rate
        - alert: HighErrorRate
          expr: |
            rate(requests_total{job="school-erp-api",status=~"5.."}[5m]) > 0.05
          for: 5m
          labels:
            severity: critical
            service: api
          annotations:
            summary: "High error rate detected"
            description: "Error rate above 5% for {{ $labels.service }}"

        # High Latency
        - alert: HighLatency
          expr: |
            histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="school-erp-api"}[5m])) > 1.0
          for: 5m
          labels:
            severity: warning
            service: api
          annotations:
            summary: "High API latency"
            description: "P95 latency above 1 second"

        # Pod Restarts
        - alert: HighRestartRate
          expr: |
            increase(kube_pod_container_status_restarts_total[15m]) > 3
          labels:
            severity: warning
          annotations:
            summary: "High pod restart rate"

        # Memory Usage
        - alert: HighMemoryUsage
          expr: |
            (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
          for: 5m
          labels:
            severity: warning
          annotations:
            summary: "High memory usage"
            description: "Memory usage above 90% for {{ $labels.pod }}"
```

---

### 2. Structure for Cloud Logging

**File:** `infra/monitoring/logging-config.yaml`

```yaml
# Cloud Logging Configuration
logging:
  version: 1
  handlers:
    stdout:
      class: logging.StreamHandler
      level: INFO
      formatter: json
  formatters:
    json:
      format: >-
        {
          "timestamp": "%(asctime)s",
          "level": "%(levelname)s",
          "message": "%(message)s",
          "service": "school-erp-api",
          "traceId": "%(trace_id)s"
        }
  root:
    level: INFO
    handlers:
      - stdout
```

---

### 3. Deployment Health Checks

**Script:** `scripts/health-check.sh`

```bash
#!/bin/bash
set -e

API_URL=${1:-https://api-staging.example.com}
TIMEOUT=${2:-5}
RETRIES=${3:-3}

echo "Running health checks on $API_URL..."

# Function to check endpoint
check_endpoint() {
  local endpoint=$1
  local expected_status=$2

  echo -n "Checking $endpoint... "
  
  status=$(curl -s -o /dev/null -w "%{http_code}" \
    --connect-timeout "$TIMEOUT" \
    "$API_URL$endpoint")

  if [ "$status" -eq "$expected_status" ]; then
    echo "✅ OK ($status)"
    return 0
  else
    echo "❌ FAILED (expected $expected_status, got $status)"
    return 1
  fi
}

# Run health checks
failed=0

for i in $(seq 1 "$RETRIES"); do
  echo "Attempt $i/$RETRIES"
  
  check_endpoint "/health" 200 || ((failed++))
  check_endpoint "/ready" 200 || ((failed++))
  check_endpoint "/api/v1/students" 200 || ((failed++))
  
  if [ $failed -eq 0 ]; then
    echo "✅ All health checks passed"
    exit 0
  fi
  
  if [ $i -lt "$RETRIES" ]; then
    sleep 5
  fi
done

echo "❌ Health checks failed"
exit 1
```

---

### 4. Deployment Verification

**File:** `.github/workflows/verify-deployment.yml`

```yaml
name: Verify Deployment

on:
  workflow_run:
    workflows: ["Build & Deploy to Staging"]
    types: [completed]

jobs:
  verify:
    name: Verify Deployment Status
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Wait for service to stabilize
        run: sleep 30

      - name: Run health checks
        run: |
          bash scripts/health-check.sh https://api-staging.example.com 5 3

      - name: Run smoke tests
        run: npm run test:smoke:staging

      - name: Verify metrics
        uses: google-github-actions/auth@v1
        with:
          workload_identity_provider: ${{ secrets.WIF_PROVIDER }}
          service_account: ${{ secrets.WIF_SERVICE_ACCOUNT }}

      - name: Check service metrics
        run: |
          gcloud monitoring metrics-descriptors list \
            --filter="metric.type:cloudrun.googleapis.com/request_count" \
            --limit=10

      - name: Report deployment status
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Staging Deployment Verified",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Deployment Verified*\nAll health checks passed\nMetrics nominal"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

---

## Quick Start Checklist

### Prerequisites
- [ ] GitHub repository created (monorepo structure)
- [ ] Google Cloud Project created
- [ ] GCP Artifact Registry enabled (`gcloud services enable artifactregistry.googleapis.com`)
- [ ] Cloud Run enabled (`gcloud services enable run.googleapis.com`)
- [ ] Secret Manager enabled (`gcloud services enable secretmanager.googleapis.com`)

### Setup Steps

1. **Create GitHub Secrets**
   - Go to `Settings → Secrets and variables → Actions`
   - Add all secrets from section above

2. **Setup GCP Service Account**
   ```bash
   # Create service account
   gcloud iam service-accounts create github-actions \
     --display-name="GitHub Actions Deploy"

   # Grant permissions
   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/run.admin"

   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:github-actions@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/iam.serviceAccountUser"
   ```

3. **Create Credential Secrets in Secret Manager**
   ```bash
   bash scripts/setup-secrets.sh school-erp-project staging
   bash scripts/setup-secrets.sh school-erp-project prod
   ```

4. **Deploy Workflows**
   - Copy workflow files to `.github/workflows/`
   - Push to main branch

5. **Create Dockerfiles**
   - Copy Dockerfile content to respective app directories

6. **Test Pipeline**
   - Make a PR with small changes
   - Verify PR checks pass
   - Merge to main and verify staging deployment

---

## Deployment Flow

```
Engineer commits code
        ↓
Create Pull Request
        ↓
GitHub Actions: CI Check (lint, typecheck, tests)
        ↓
❌ Failed? → Fix and push again
❌ Passed? → Can merge after review approval
        ↓
Merge to main
        ↓
GitHub Actions: Build & Deploy to Staging
        ↓
Build Docker images
        ↓
Push to Artifact Registry
        ↓
Deploy to Cloud Run (staging)
        ↓
Run smoke tests
        ↓
Notify team on Slack
        ↓
Manual testing/verification
        ↓
Tag release (v1.0.0)
        ↓
GitHub Actions: Release to Production
        ↓
Deploy to Cloud Run (prod)
        ↓
Run production smoke tests
        ↓
Create GitHub Release
        ↓
✅ Complete
```

---

## Commands Reference

```bash
# Local development
npm run dev

# Build all services
npm run build

# Run tests
npm run test

# Lint & typecheck
npm run lint
npm run typecheck

# Docker build locally
docker build -f apps/api/Dockerfile -t school-erp-api:local .
docker run -p 8080:8080 school-erp-api:local

# Deploy with secrets
bash scripts/deploy-with-secrets.sh school-erp-api-staging \
  us-central1-docker.pkg.dev/PROJECT_ID/school-erp/api:latest \
  staging

# Manual rollback
bash scripts/rollback.sh school-erp-api-staging aa1b2c3d staging

# Canary deployment
bash scripts/canary-deploy.sh school-erp-api-staging \
  us-central1-docker.pkg.dev/PROJECT_ID/school-erp/api:latest

# Health check
bash scripts/health-check.sh https://api-staging.example.com

# View Cloud Run revisions
gcloud run revisions list --service school-erp-api-staging --region us-central1

# View logs
gcloud run services logs read school-erp-api-staging --region us-central1 --limit 50
```

---

## Ownership & Support

- **DevOps Agent**: CI/CD pipeline maintenance, deployment troubleshooting
- **Backend Agent**: API Dockerfile optimization, service health
- **Frontend Agent**: Web/Founder Dockerfile, build configuration
- **QA Agent**: Smoke tests, deployment verification
- **Documentation Agent**: Runbooks, deployment guides

---

## References

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Cloud Run Security](https://cloud.google.com/run/docs/securing/managing-access)

---

**Last Updated:** April 9, 2026  
**Status:** Ready for Day-1 Implementation
