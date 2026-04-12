# 🚀 Quick Deployment Reference Card

## One-Page Guide for All Deployment Scenarios

---

## 1️⃣ LOCAL DEVELOPMENT

```bash
# Setup
git clone <repo>
cd school-erp
npm install

# Use local config
cp .env.example .env.local

# Start
npm run dev
# or
docker-compose up -d

# Stop
docker-compose down
```

**Access**: http://localhost:5173 (frontend) + http://localhost:3000/api (backend)

---

## 2️⃣ STAGING DEPLOYMENT (Cloud Run)

```bash
# Automated via GitHub Actions
# Create PR → Tests run → Merge to develop → Auto-deploys to staging

# Manual deployment
gcloud run deploy school-erp-api-staging \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated

# View logs
gcloud run logs read school-erp-api-staging --region asia-south1 --limit 50
```

**Access**: https://school-erp-staging.run.app

---

## 3️⃣ PRODUCTION DEPLOYMENT (Cloud Run)

### Automated (Recommended)
```
Push to main
    → Tests pass
    → Staging succeeds
    → Staging load test passes
    → Awaits manual approval in GitHub Actions
    → Click "Approve" in workflow
    → Deploy to production
```

### Manual Deployment
```bash
# First time setup
gcloud run deploy school-erp-api \
  --source . \
  --region asia-south1 \
  --memory 1Gi \
  --cpu 1 \
  --concurrency 100 \
  --allow-unauthenticated

# Update existing service
gcloud run deploy school-erp-api \
  --source . \
  --region asia-south1

# Traffic split (gradual rollout)
gcloud run services update-traffic school-erp-api \
  --to-revisions LATEST=90,PREVIOUS=10 \
  --region asia-south1
```

**Access**: https://school-erp-api.run.app

---

## 4️⃣ VERCEL DEPLOYMENT (Alternative)

```bash
# First time
npm install -g vercel
vercel link

# Add secrets
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_API_KEY
# ... add all from .env.production.example

# Deploy preview (staging)
vercel deploy

# Deploy production
vercel --prod

# View deployments
vercel ls
```

**Access**: https://school-erp.vercel.app

---

## 5️⃣ ENVIRONMENT VARIABLES

### Minimal for Local Dev
```bash
cp .env.example .env.local
# Keep defaults for Firebase emulator
```

### Production Setup
```bash
# Get production template
cp .env.production.example .env.production.local

# Fill in all YOUR_* placeholders with actual values

# Set in Cloud Run
gcloud run services update school-erp-api \
  --set-env-vars KEY1=value1,KEY2=value2 \
  --region asia-south1

# Or use Secret Manager (recommended)
gcloud secrets create firebase-api-key \
  --data-file=- <<EOF
YOUR_ACTUAL_KEY
EOF

gcloud run services update school-erp-api \
  --set-env-vars FIREBASE_API_KEY=firebase-api-key:latest \
  --region asia-south1
```

---

## 6️⃣ ROLLBACK PROCEDURES

### Previously Deployed Versions
```bash
# List revisions
gcloud run services describe school-erp-api \
  --region asia-south1 | grep revision

# Revert to previous revision
gcloud run services update-traffic school-erp-api \
  --to-revisions <OLD_REVISION_ID>=100 \
  --region asia-south1
```

### Vercel Rollback
```bash
# List past deployments
vercel ls

# Rollback to specific deployment
vercel rollback <DEPLOYMENT_ID> --prod
```

---

## 7️⃣ MONITORING & LOGS

### Cloud Run Logs
```bash
# Recent errors
gcloud run logs read school-erp-api \
  --region asia-south1 \
  --limit 50 \
  --format json | grep ERROR

# Real-time logs
gcloud run logs read school-erp-api \
  --region asia-south1 \
  --follow

# Specific timeframe
gcloud run logs read school-erp-api \
  --region asia-south1 \
  --start-time="2 hours ago"
```

### Metrics
```bash
# CPU utilization
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision" AND metric.type="compute.googleapis.com/instance/cpu/utilization"'
```

### Vercel Analytics
Open https://vercel.com/dashboard → Project → Analytics

---

## 8️⃣ SECURITY CHECKLIST

- [ ] All secrets in environment variables (not in code)
- [ ] `.env.local` and `.env.production.local` in `.gitignore`
- [ ] HTTPS enforced (automatic in Cloud Run & Vercel)
- [ ] CORS properly configured
- [ ] Firebase Security Rules reviewed
- [ ] Rate limits enabled
- [ ] Audit logging active

---

## 9️⃣ TROUBLESHOOTING

### Deployment Fails
```bash
# Check auth
gcloud auth list

# Check permissions
gcloud projects get-iam-policy <PROJECT_ID>

# View detailed build logs
gcloud run deploy school-erp-api --source . --region asia-south1 --no-cache
```

### High Latency
```bash
# Check cold starts
gcloud run services describe school-erp-api \
  --region asia-south1 | grep startup

# Use reserved instances
gcloud run services update school-erp-api \
  --region asia-south1 \
  --min-instances 1
```

### Database Connection Issues
```bash
# Test Firestore
firebase firestore:get /

# Check quotas
gcloud compute project-info describe --project=<PROJECT_ID>
```

---

## 🔟 COST OPTIMIZATION

### Cloud Run
```bash
# Right-size memory (affects CPU)
gcloud run services update school-erp-api \
  --memory 512Mi \
  --cpu 0.5

# Set minimum instances to 0 (cold start ok)
gcloud run services update school-erp-api \
  --min-instances 0

# Monitor costs
gcloud billing accounts list
gcloud compute project-info describe --project=<PROJECT_ID>
```

### Vercel
- Free tier includes 100GB bandwidth/month
- Projects > 7 days inactive are paused
- Upgrade to Pro ($20/month) for custom domains

---

## Quick Status Checks

```bash
# Is service running?
curl https://school-erp-api.run.app/health
# Response: {"status":"ok"}

# Check API version
curl https://school-erp-api.run.app/api/v1/version
# Response: {"version":"v1.0.0"}

# Check Firestore connectivity
curl https://school-erp-api.run.app/api/v1/health/firestore
# Response: {"firestore":"connected"}
```

---

## 📋 Pre-Deployment Checklist

- [ ] All tests passing (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run build`)
- [ ] Code linting passed (`npm run lint`)
- [ ] Environment variables configured
- [ ] Firebase Rules reviewed
- [ ] Database migrations complete
- [ ] Load test baseline established
- [ ] Monitoring alerts enabled
- [ ] Rollback procedure tested
- [ ] Team notified of planned deployment

---

## 📞 Getting Help

**Deployment Issues**: Check GitHub Actions logs
**Performance Concerns**: Review GCP Cloud Trace & Cloud Profiler
**Database Errors**: Firebase Console → Firestore
**API Errors**: Cloud Run Logs or Vercel Analytics

---

**Last Updated**: April 2026  
**Keep it handy** 👍
