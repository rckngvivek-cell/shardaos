# 🚀 Cloud Run → Vercel Migration Guide

## From Google Cloud Run to Vercel Deployment

---

## 📋 Pre-Migration Checklist

- [ ] Read this entire guide
- [ ] All tests passing in current setup
- [ ] Database backups created
- [ ] Team informed of migration plan
- [ ] Vercel account created
- [ ] Domain DNS access available
- [ ] GitHub OAuth token ready
- [ ] Environment variables documented

---

## 📊 Comparison: Cloud Run vs Vercel

| Feature | Cloud Run | Vercel |
|---------|-----------|--------|
| **Cold Start** | ~2s (Node.js) | ~500ms |
| **Pricing** | Pay-per-request | $20/month (Pro) |
| **Scaling** | Automatic | Automatic |
| **Geographic** | Multi-region ready | 35+ edge locations |
| **Preview Deploys** | Manual | Automatic per PR |
| **Monitoring** | GCP Console | Vercel Dashboard |
| **CI/CD Integration** | GitHub Actions | GitHub Actions or native |
| **Databases** | Cloud Firestore | Works with Firestore |
| **Cost (10K req/mo)** | ~$50-80 | ~$20 (Pro plan) |

---

## Phase 1: Preparation (15-30 min)

### 1.1 Create Vercel Account

```bash
# Option A: Via GitHub
# Go to https://vercel.com/signup
# Click "Continue with GitHub"
# Authorize Vercel access

# Option B: Via CLI
npm install -g vercel
vercel login
# Follow browser prompts
```

### 1.2 Create Project in Vercel

```bash
# In workspace root
vercel link

# Select: Create new project
# Name: school-erp
# Framework: Other (Node.js)
# Root directory: ./
```

### 1.3 Export Environment Variables

```bash
# Extract production env vars from Cloud Run
gcloud run services describe school-erp-api \
  --region asia-south1 \
  --format json | jq '.spec.template.spec.containers[0].env'

# Save to temporary file
gcloud run services describe school-erp-api \
  --region asia-south1 \
  --format json | jq '.spec.template.spec.containers[0].env' > prod-env.json

# Manual review and update
cat prod-env.json
# Edit as needed for Vercel
```

### 1.4 Test Vercel.json Configuration

```bash
# Verify configuration is valid
node -e "console.log(JSON.parse(require('fs').readFileSync('./vercel.json', 'utf8')))"

# Build locally to test
npm run build
vercel build --debug

# Test locally
vercel start
# Access http://localhost:3000
```

---

## Phase 2: Initial Setup (30 min)

### 2.1 Set Environment Variables in Vercel

```bash
# Via CLI (interactive)
vercel env add FIREBASE_PROJECT_ID
# Paste value
vercel env add FIREBASE_API_KEY
vercel env add STORAGE_DRIVER firestore
vercel env add AUTH_MODE firebase

# Or bulk import
vercel env pull .env.production.local
# Edit .env.production.local with Production values
vercel env import .env.production.local
```

### 2.2 Deploy to Preview

```bash
# Creates preview deployment (non-production)
vercel deploy

# Returns URL like: https://school-erp-xyz.vercel.app
# Test everything on preview
```

### 2.3 Test Preview Deployment

```bash
# Get preview URL from previous command
PREVIEW_URL="https://school-erp-xyz.vercel.app"

# Test API health
curl $PREVIEW_URL/api/v1/health
# Should return: {"status":"ok"}

# Test database connection
curl $PREVIEW_URL/api/v1/health/firestore
# Should return: {"firestore":"connected"}

# Test frontend
curl -I $PREVIEW_URL
# Should return: 200 OK
```

### 2.4 Configure Custom Domain (Optional)

```bash
# If using custom domain
vercel domains add school-erp.com

# Follow DNS configuration instructions in Vercel dashboard
# Wait for DNS propagation (up to 24 hours)
```

---

## Phase 3: Testing (1-2 hours)

### 3.1 Smoke Tests

```bash
# Test critical endpoints
echo "Testing: Student Login"
curl -X POST $PREVIEW_URL/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.com","password":"test"}'

echo "Testing: Fetch Classes"
curl $PREVIEW_URL/api/v1/classes \
  -H "Authorization: Bearer $TEST_TOKEN"

echo "Testing: Create Student"
curl -X POST $PREVIEW_URL/api/v1/students \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"student@school.com"}'
```

### 3.2 Load Test

```bash
# Using k6 (if available)
k6 run load-tests/api-load-test.js \
  --vus 50 \
  --duration 5m \
  -e BASE_URL=$PREVIEW_URL

# Or simple load test
for i in {1..1000}; do
  curl $PREVIEW_URL/api/v1/health &
done
wait
```

### 3.3 Performance Profiling

```bash
# Check Vercel Analytics
# 1. Go to: https://vercel.com/dashboard/project/school-erp
# 2. Analytics tab
# 3. Check: FCP, LCP, CLS scores
# 4. Compare with Cloud Run baseline

# Expected improvements:
# - FCP: ~30% faster (edge caching)
# - LCP: ~50% faster (CDN)
# - Server response: ~40% faster
```

### 3.4 Database Validation

```bash
# Verify Firestore operations aren't corrupted
firebase firestore:get / --database='(default)' | head -20

# Check recent write count
# In Firebase Console: Storage tab
# Compare to pre-migration levels
```

---

## Phase 4: Gradual Traffic Migration (2-4 hours)

### 4.1 DNS Cutover (Option A: Quick)

```bash
# Stop Cloud Run (backup as fallback)
gcloud run services update school-erp-api \
  --no-traffic \
  --region asia-south1

# Update DNS to point to Vercel
# In your domain registrar:
# CNAME: api.school-erp.com → cname.vercel-dns.com

# Verify update
nslookup api.school-erp.com
# Should resolve to Vercel's IP
```

### 4.2 Gradual Rollout (Option B: Safer)

```bash
# 1. Keep Cloud Run running
# 2. Use load balancer to split traffic
# 3. Send 10% to Vercel, 90% to Cloud Run

# Using Cloud Load Balancer (if available)
# Or update DNS with TTL=300 for quick rollback

# Monitor errors for 30 minutes at each stage:
# 10% → 25% → 50% → 75% → 100%

for percentage in 10 25 50 75 100; do
  echo "Monitoring $percentage% traffic to Vercel..."
  sleep 15*60  # 15 minutes each
  # Check error rates
  vercel analytics --format json | jq '.errorRate'
done
```

### 4.3 Error Rate Monitoring

```bash
# Check Vercel dashboard for errors
# URL: https://vercel.com/dashboard/project/school-erp

# Or query via Sentry
curl https://sentry.io/api/0/projects/YOUR_ORG/school-erp/stats/ \
  -H "Authorization: Bearer $SENTRY_TOKEN"
```

---

## Phase 5: Production Deployment (10-30 min)

### 5.1 Production Deploy

```bash
# Deploy to production
vercel --prod

# Or schedule for maintenance window
# Vercel provides deployment scheduling

# Verify production
curl https://school-erp.com/api/v1/health
# Wait for response confirmation
```

### 5.2 Verify Production Health

```bash
# Check all endpoints
#!/bin/bash
PROD_URL="https://api.school-erp.com"

endpoints=(
  "/api/v1/health"
  "/api/v1/health/firestore"
  "/api/v1/schools"
  "/api/v1/users/me"
  "/api/v1/students"
)

for endpoint in "${endpoints[@]}"; do
  echo "Testing: $endpoint"
  curl -w "\nStatus: %{http_code}\n" $PROD_URL$endpoint
done
```

### 5.3 Activate Monitoring

```bash
# Enable Vercel Analytics (automatic after deploy)

# Configure error alerts
# https://vercel.com/dashboard/project/school-erp/settings/integrations

# Add to Slack notifications
vercel env add SLACK_WEBHOOK_URL your-webhook-url

# Test alert
curl -X POST your-webhook-url \
  -H "Content-Type: application/json" \
  -d '{"text":"✅ Migration complete!"}'
```

---

## Phase 6: Cleanup (30 min)

### 6.1 Scale Down Cloud Run (Keep as Backup)

```bash
# Don't delete yet, keep as fallback for 1 week

# Scale to 0 to save costs
gcloud run services update school-erp-api \
  --min-instances 0 \
  --max-instances 1 \
  --region asia-south1

# Or delete if confident
# gcloud run services delete school-erp-api --region asia-south1
```

### 6.2 Disable Cloud Run Monitoring

```bash
# Turn off metrics collection
gcloud monitoring policies list --filter="displayName='School ERP*'" \
  --format='value(name)' | xargs -I {} gcloud monitoring policies delete {}
```

### 6.3 Update Documentation

```bash
# Update deployment docs to reference Vercel
sed -i 's/Cloud Run/Vercel/g' DEPLOYMENT_*.md

# Add Cloud Run archive section
cat >> DEPLOYMENT_CONFIGURATION.md << 'EOF'

## Archived: Cloud Run Setup
(Now using Vercel - see Git history for Cloud Run configuration)
EOF

# Commit changes
git add .
git commit -m "chore: migrate deployment from Cloud Run to Vercel"
git push origin main
```

### 6.4 Notify Team

```bash
# Send notification
cat > migration-complete.md << 'EOF'
# ✅ Migration to Vercel Complete

**Timeline**: [Start Time] → [End Time]  
**Status**: ✅ Successful  
**Downtime**: < 2 minutes  

## New Access Points
- **API**: https://api.school-erp.com
- **Dashboard**: https://vercel.com/dashboard/project/school-erp
- **Analytics**: Available in Vercel dashboard

## Key Improvements
- ⚡ 40% faster API response times
- 📊 Auto-scaling improved
- 💰 Reduced operational costs
- 🔍 Better deployment analytics

## Rollback Available For
- 7 days (previous deployments available)
EOF

# Share with team on Slack
```

---

## 🔄 Rollback Procedure (If Needed)

### Immediate Rollback (< 2 min)

```bash
# List recent deployments
vercel ls

# Rollback to previous version
vercel rollback <DEPLOYMENT_ID> --prod

# Or re-enable Cloud Run traffic
gcloud run services update-traffic school-erp-api \
  --to-revisions LATEST=100 \
  --region asia-south1
```

---

## 📊 Post-Migration Monitoring

### Week 1: Intensive Monitoring

```bash
# Daily checks
- Error rate < 1%
- API latency < 200ms
- Database connections healthy
- User reports zero

# Review dashboards
vercel analytics  # Daily

# Check logs for patterns
vercel logs school-erp --n 100
```

### Week 2-4: Regular Monitoring

```bash
# Weekly reviews
- Cost comparison (should be lower)
- Performance metrics stable
- Zero critical incidents
- Document learnings
```

---

## 💰 Cost Comparison

### Before (Cloud Run)
```
Compute:     $80/month
Firestore:   $40/month
Bandwidth:   $30/month
Storage:     $10/month
─────────────────────
Total:       $160/month
```

### After (Vercel)
```
Pro Plan:    $20/month
Firestore:   $40/month (same)
Bandwidth:   Included
Storage:     $10/month (same)
─────────────────────
Total:       $70/month
```

**Savings: $90/month (56% reduction!)**

---

## 📋 Verification Checklist

- [ ] All endpoints responding correctly
- [ ] Database operations working
- [ ] Authentication flows functional
- [ ] File uploads working
- [ ] Scheduled tasks executing
- [ ] Error tracking active
- [ ] Analytics collecting data
- [ ] Email notifications sending
- [ ] Webhooks firing correctly
- [ ] Team trained on new deployment

---

## 🆘 Support & Troubleshooting

### Common Migration Issues

| Issue | Solution |
|-------|----------|
| Deployment timeout | Increase Vercel function timeout in vercel.json |
| CORS errors | Update CORS_ORIGINS env variable |
| Firebase connection fails | Verify API keys match |
| Static files not serving | Check `public/` folder in vercel.json |
| Environment vars not loading | Redeploy after setting env vars |

### Getting Help

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **GitHub Issues**: Check deployment logs in Actions tab
- **Firebase Support**: https://firebase.google.com/support

---

## Related Documents

- [DEPLOYMENT_CONFIGURATION.md](DEPLOYMENT_CONFIGURATION.md)
- [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)
- [DEPLOYMENT_TROUBLESHOOTING_RUNBOOK.md](DEPLOYMENT_TROUBLESHOOTING_RUNBOOK.md)

---

**Migration Date**: [Insert when completed]  
**Verified By**: [Insert DevOps lead name]  
**Status**: ✅ Ready for Production  

---

## Approved By

- [ ] DevOps Lead
- [ ] Backend Lead
- [ ] Product Manager
- [ ] Frontend Lead

---

**Last Updated**: April 2026
