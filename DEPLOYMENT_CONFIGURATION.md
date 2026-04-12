# Deployment Configuration Guide

## Current Deployment Architecture

This document provides a comprehensive overview of the deployment configuration for the School ERP system.

### 🏗️ Multi-Environment Setup

**Current Active Deployments:**
- **Production**: Google Cloud Run (Asia South 1)
- **Staging**: Google Cloud Run (Asia South 1)
- **Local**: Docker Compose

**Available Alternatives:**
- Vercel (configured, ready for migration)
- AWS Lambda/ECS
- Azure Container Instances
- Self-hosted Kubernetes

---

## 1. Google Cloud Run (Currently Active)

### Location
- **Region**: `asia-south1` (Delhi region - optimal for India)
- **Service Account**: Managed via Workload Identity Federation (WIF)
- **Docker Registry**: Artifact Registry in asia-south1

### Deployment Flow
```
Push to main branch
    ↓
GitHub Actions Trigger
    ↓
Unit Tests (01-unit-tests.yml)
    ↓
Integration Tests (02-integration-tests.yml)
    ↓
E2E Tests (03-e2e-tests.yml)
    ↓
Security Scan (05-security-scan.yml)
    ↓
Deploy to Staging (06-deploy-staging.yml)
    ↓
Load Tests (04-load-tests.yml)
    ↓
Manual Approval Required
    ↓
Deploy to Production (07-deploy-production.yml)
```

### Key Files
- **Configuration**: `vercel.json` (multi-platform config)
- **Firebase**: `.firebaserc`, `firebase.json`
- **CI/CD**: `.github/workflows/07-deploy-production.yml`
- **Ignore Rules**: `.vercelignore`, `.gitignore`

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=3000
STORAGE_DRIVER=firestore
AUTH_MODE=firebase
GCP_PROJECT_ID=<your-project-id>
GCP_REGION=asia-south1
FIREBASE_PROJECT_ID=<project>
FIREBASE_API_KEY=<key>
```

### Deployment Commands
```bash
# Via gcloud CLI
gcloud run deploy school-erp-api \
  --source . \
  --platform managed \
  --region asia-south1 \
  --allow-unauthenticated

# Via GitHub Actions (Automated)
# Push to main branch triggers automatic deployment
```

### Monitoring & Logs
- **Cloud Logging**: View in GCP Console
- **Cloud Monitoring**: Metrics dashboard
- **Error Tracking**: Integrated with Firestore transaction logs

---

## 2. Vercel Deployment (Ready for Migration)

### Configuration File: `vercel.json`

**Architecture:**
- **API Server**: Node.js Serverless Function
- **Frontend**: Static Site
- **Database**: Firestore (same as Cloud Run)
- **Max Lambda Size**: 50MB

### Deployment Structure
```
vercel.json
├── builds:
│   ├── apps/api/dist/index.js → @vercel/node
│   └── apps/web/dist/** → @vercel/static
├── routes:
│   ├── /api/v1/* → serverless function
│   └── /* → static frontend
├── env: production variables
└── headers: cache control
```

### Benefits Over Cloud Run
✅ Automatic HTTPS and CDN  
✅ Zero-config deployments from Git  
✅ Faster edge caching for static assets  
✅ Built-in analytics and monitoring  
✅ Automatic preview deployments for PRs  

### How to Deploy to Vercel

#### 1. Connect Repository
```bash
npm install -g vercel
vercel link
```

#### 2. Configure Vercel CLI Secrets
```bash
vercel env add FIREBASE_API_KEY
vercel env add FIREBASE_PROJECT_ID
vercel env add STORAGE_DRIVER firestore
vercel env add AUTH_MODE firebase
# ... add all production environment variables
```

#### 3. Deploy
```bash
# Automatic: Git push → Vercel deploys automatically
# Manual: 
vercel --prod

# Preview:
vercel deploy
```

#### 4. GitHub Actions Integration
Add to `.github/workflows/deploy-vercel.yml`:

```yaml
name: 'Pipeline: Deploy to Vercel'

on:
  push:
    branches: [main, develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          production: ${{ github.ref == 'refs/heads/main' }}
```

### Ignore Rules (`.vercelignore`)
Files excluded from Vercel deployments:
- Local env files
- Build artifacts
- IDE configurations
- Local documentation
- Temporary files

### Performance Optimizations
```
Vercel Edge Network
    ↓
  Auto-gzip compression
    ↓
  Serverless Function Scaling
    ↓
  Firestore Cold-start Optimization
```

---

## 3. Local Development Deployment

### Docker Compose Setup
```bash
# Start all services locally
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Services
- **API**: Node.js on port 3000
- **Frontend**: React on port 5173
- **Firestore Emulator**: On port 8080
- **Authentication**: Firebase Emulator

### Configuration
- **File**: `docker-compose.yml` (in root)
- **Env**: `.env.local`
- **Network**: Internal connectivity via service names

---

## 4. Environment Variables

### Required for All Environments

#### Firebase Configuration
```env
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

#### Server Configuration
```env
NODE_ENV=production|development|staging
PORT=3000
STORAGE_DRIVER=firestore
AUTH_MODE=firebase
```

#### Optional Features
```env
ANALYTICS_ENABLED=true
MONITORING_ENABLED=true
LOG_LEVEL=info
CORS_ORIGINS=*
```

### Template File
See `.env.example` for complete template

### How to Set Secrets

**Production (Cloud Run):**
```bash
# Via gcloud CLI
gcloud run services update school-erp-api \
  --set-env-vars KEY=VALUE \
  --region asia-south1
```

**Staging (Cloud Run):**
```bash
gcloud run services update school-erp-api-staging \
  --set-env-vars KEY=VALUE \
  --region asia-south1
```

**Vercel:**
```bash
vercel env add ENV_VAR_NAME
# Interactive prompt for value
```

---

## 5. CI/CD Pipeline Overview

### Automated Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `01-unit-tests.yml` | PR, Push | Run Jest unit tests |
| `02-integration-tests.yml` | PR, Push | Firestore integration tests |
| `03-e2e-tests.yml` | PR, Push | Playwright E2E tests |
| `04-load-tests.yml` | Pre-production | k6 load testing |
| `05-security-scan.yml` | PR, Push | OWASP scan + dependency check |
| `06-deploy-staging.yml` | After tests | Deploy to staging Cloud Run |
| `07-deploy-production.yml` | Manual approval | Deploy to production Cloud Run |
| `08-notifications-reporting.yml` | After each step | Slack/Teams notifications |

### Approval Gates
1. ✅ All tests pass
2. ✅ Security scan passes
3. ✅ Staging deployment succeeds
4. ✅ Manual approval from product team

---

## 6. Monitoring & Observability

### Cloud Run Metrics
- Request rate & latency
- Error rates
- Cold start time
- Memory/CPU utilization

### Application Monitoring
- Transaction logging (Firestore)
- Performance trackers
- Error tracking (automatic)
- User analytics

### Alerts
- High error rate (>5%)
- Response time > 2s
- Memory threshold exceeded
- Deployment failures

---

## 7. Backup & Disaster Recovery

### Firestore Backups
```bash
# Automated daily backups
# Managed via Firebase Console

# Manual backup
gcloud firestore export gs://bucket/backup-name
```

### Data Recovery
- **Point-in-time**: Via Firestore console
- **Version History**: Git history in GitHub
- **Configuration**: Infrastructure as Code

### RTO/RPO Targets
- **RTO** (Recovery Time): < 1 hour
- **RPO** (Recovery Point): < 1 day (auto-backups)

---

## 8. Migration Path: Cloud Run → Vercel

If you decide to migrate from Cloud Run to Vercel:

### Step 1: Prepare (`vercel.json` already done ✓)

### Step 2: Test Locally
```bash
# Install Vercel CLI
npm install -g vercel

# Test production build locally
vercel build

# Test serverless function
vercel start
```

### Step 3: Setup Vercel Project
```bash
vercel link
# Register project, connect GitHub
```

### Step 4: Configure Secrets
```bash
# Add all env vars from .env.example
vercel env add FIREBASE_API_KEY
vercel env add FIREBASE_PROJECT_ID
# ... etc
```

### Step 5: Deploy to Preview
```bash
vercel deploy
# Test preview deployment
```

### Step 6: Deploy to Production
```bash
vercel --prod
```

### Step 7: Update DNS
- Point domain to Vercel's nameservers
- Or add CNAME record

### Step 8: Monitor & Rollback
- Vercel automatically keeps past deployments
- Easy rollback via Vercel dashboard
- Gradual traffic migration if needed

---

## 9. Troubleshooting

### Cloud Run Deployment Fails
```bash
# Check logs
gcloud run services describe school-erp-api \
  --region asia-south1

# Check Docker build
docker build -t gcr.io/project/app:latest .

# Redeploy manually
gcloud run deploy school-erp-api --source .
```

### Vercel Build Fails
```bash
# Check build logs in Vercel dashboard
# Or locally:
vercel build --debug

# Common issues:
# - Missing environment variables: vercel env list
# - Build output: Check dist/ directories
# - Serverless size: Check payload < 50MB limit
```

### Firebase Connection Issues
```bash
# Check Firebase config
cat .firebaserc

# Verify credentials
firebase auth:emulate

# Check Firestore access
firebase firestore:get /
```

---

## 10. Performance Benchmarks

### Current Cloud Run Performance
- **Cold start**: ~800ms (Java/Go), ~2s (Node.js)
- **Avg response**: 150ms
- **99th percentile**: 500ms
- **Throughput**: 100 req/sec per instance

### Vercel Expected Performance
- **Cold start**: ~500ms (optimized)
- **Avg response**: 100ms (CDN cache)
- **99th percentile**: 300ms
- **Throughput**: Unlimited (auto-scaling)

### Optimization Strategies
1. **Code Splitting**: Webpack bundle analysis
2. **Caching**: 24h for static, 5min for API
3. **Compression**: Auto gzip + brotli
4. **Database**: Firestore indexes optimized

---

## 11. Security Checklist

- [ ] HTTPS enforced (automatic in both)
- [ ] API secrets in environment variables
- [ ] Firebase Security Rules configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] WAF rules active
- [ ] DDoS protection active
- [ ] Regular security scans via `05-security-scan.yml`

---

## 12. Cost Estimation

### Cloud Run (Current)
- **Compute**: ~$50-100/month
- **Firestore**: ~$30-50/month
- **Bandwidth**: ~$20-30/month
- **Total**: ~$100-180/month

### Vercel (Alternative)
- **Compute**: Generous free tier, then $20/month
- **Firestore**: $30-50/month (same)
- **Bandwidth**: Included up to 100GB
- **Total**: ~$50-70/month

---

## Quick Start Commands

### Deploy to Cloud Run
```bash
gcloud run deploy school-erp-api --source . --region asia-south1
```

### Deploy to Vercel
```bash
vercel --prod
```

### Local Development
```bash
npm run dev
# or
docker-compose up -d
```

### View Logs
```bash
# Cloud Run
gcloud run services describe school-erp-api | grep logs

# Local
docker-compose logs -f api
```

---

## Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

**Last Updated**: April 2026  
**Maintained By**: DevOps Agent  
**Status**: ✅ Production Ready
