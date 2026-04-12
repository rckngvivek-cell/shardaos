# 🔧 Deployment Troubleshooting & Recovery Runbook

## Emergency Response Guide

---

## 🚨 CRITICAL ISSUES

### Issue: Production Down / Service Unavailable

**Symptoms:**
- All API requests returning 500/503
- Service appears completely offline
- Error tracking shows high volume of failures

**Recovery Steps (5-10 min):**

```bash
# 1. Verify service status
gcloud run services describe school-erp-api \
  --region asia-south1 | grep status

# 2. Check if it's a revision issue
gcloud run services describe school-erp-api \
  --region asia-south1 | grep revision

# 3. Immediate rollback to last known good version
LAST_REVISION=$(gcloud run services describe school-erp-api \
  --region asia-south1 \
  --format='value(status.traffic[0].revision.name)')

gcloud run services update-traffic school-erp-api \
  --to-revisions $LAST_REVISION=100 \
  --region asia-south1

# 4. Verify recovery
curl https://school-erp-api.run.app/health

# 5. Alert team
echo "✅ Service recovered. Rolled back to revision: $LAST_REVISION"
```

**Post-Recovery Investigation:**
1. Check Cloud Run logs for error patterns
2. Review recent code changes (git log)
3. Check Firestore quota/limits
4. Verify all environment variables are present

**Prevention:**
- Enable PagerDuty alerts for service downtime
- Always test in staging first
- Use canary deployments (traffic split)

---

### Issue: High Error Rate (>5%)

**Symptoms:**
- Error rate spike in Cloud Trace
- 400/401/403 errors increasing
- Specific endpoint failures

**Diagnosis (2-5 min):**

```bash
# Get recent errors
gcloud run logs read school-erp-api \
  --region asia-south1 \
  --limit 100 \
  --format json | grep -A2 '"severity":"ERROR"'

# Extract error patterns
gcloud run logs read school-erp-api \
  --region asia-south1 \
  --format json | jq '.message' | sort | uniq -c | sort -rn | head -10

# Check specific time window
gcloud run logs read school-erp-api \
  --region asia-south1 \
  --start-time="30 min ago" \
  --format json | jq '.message'
```

**Common Causes & Fixes:**

| Error | Cause | Fix |
|-------|-------|-----|
| Firebase auth failed | Credentials expired | Rotate Firebase keys in Secrets Manager |
| Firestore quota exceeded | Too many writes | Scale Firestore or optimize queries |
| CORS error | Frontend domain mismatch | Update CORS_ORIGINS env var |
| 401 Unauthorized | JWT expired | Clear browser cache, regenerate tokens |
| Generic 500 | Code bug | Review recent deploys, revert if needed |

**Recovery:**

```bash
# If caused by environment variable
gcloud run services update school-erp-api \
  --set-env-vars FIREBASE_PROJECT_ID=correct-value \
  --region asia-south1

# Wait for rollout
gcloud run services describe school-erp-api \
  --region asia-south1 --format='value(status.latestRevisionStatus)'

# Verify
curl https://school-erp-api.run.app/health/firestore
```

---

### Issue: Database Unreachable

**Symptoms:**
- All Firestore queries fail
- API returns 503 Service Unavailable
- Connection timeout errors in logs

**Recovery Steps:**

```bash
# 1. Check Firestore is still running
gcloud firestore databases describe --database='(default)'

# 2. Verify IAM permissions
gcloud projects get-iam-policy <PROJECT_ID> \
  --flatten="bindings[].members" \
  --filter="bindings.role:roles/datastore.user"

# 3. Test connectivity directly
gcloud firestore export gs://bucket/test-backup

# 4. Check if quotas exceeded
gcloud compute project-info describe --project=<PROJECT_ID> | grep -A5 Limit

# 5. If quota exceeded, request increase
gcloud compute project-info describe --project=<PROJECT_ID> \
  --format='value(quotas[].usage)'
```

**Prevention:**
- Monitor Firestore usage dashboard
- Set up quota alerts
- Plan for growth (batch operations)

---

## ⚠️ WARNING-LEVEL ISSUES

### Issue: Memory Leaks / High Memory Usage

**Symptoms:**
- Memory utilization approaching 100%
- Garbage collection time increasing
- Requests getting slower over time

**Diagnosis:**

```bash
# Check memory metrics
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision" AND metric.type="compute.googleapis.com/instance/memory/utilization"' \
  --format json | jq '.metrics[].timeSeries[].points[-5:]'

# Enable profiling
gcloud run services update school-erp-api \
  --set-env-vars ENABLE_PROFILING=true \
  --region asia-south1
```

**Fix:**

```bash
# Increase memory allocation
gcloud run services update school-erp-api \
  --memory 1Gi \
  --region asia-south1

# Or reduce batch size
gcloud run services update school-erp-api \
  --set-env-vars FIRESTORE_BATCH_SIZE=50 \
  --region asia-south1

# Restart service (forces garbage collection)
gcloud run services describe school-erp-api \
  --region asia-south1 --format='value(status.latestRevisionName)' | grep -o 'school-erp-api-[a-v0-9]*'
```

---

### Issue: Cold Start Time > 3 seconds

**Symptoms:**
- First request after deployment very slow
- P99 latency spikes
- New deployments causing latency issues

**Solution:**

```bash
# Enable minimum instances (tradeoff: costs more)
gcloud run services update school-erp-api \
  --min-instances 1 \
  --region asia-south1

# Or optimize startup code
# Review: apps/api/src/index.ts for slow initialization

# Profile startup:
gcloud traces list --filter 'labels.service:school-erp-api' \
  --limit 10 --format json | jq '.traces[].spans | map(select(.duration < "1s"))'
```

---

### Issue: High API Latency (>500ms)

**Symptoms:**
- User complaints about slow pages
- Frontend observing >500ms response times
- Latency spike at specific times

**Investigation:**

```bash
# Query latency percentiles
gcloud monitoring read \
  'resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_latencies"'

# Identify slow endpoints
gcloud run logs read school-erp-api \
  --region asia-south1 \
  --format json | jq '.jsonPayload | select(.duration > 500) | {endpoint: .endpoint, duration: .duration}'

# Check if Firestore queries are slow
gcloud firestore operations list
```

**Optimization Steps:**

```bash
# 1. Enable query caching
gcloud run services update school-erp-api \
  --set-env-vars CACHE_TTL_SECONDS=3600,CACHE_ENABLED=true \
  --region asia-south1

# 2. Optimize Firestore indexes
firebase firestore:indexes list

# 3. Add composite index if needed
firebase firestore:indexes create

# 4. Profile specific endpoint
curl -H "X-Trace: true" https://school-erp-api.run.app/api/v1/slow-endpoint
```

---

## 🔴 DEPLOYMENT FAILURES

### Issue: Deployment Build Fails

**Symptoms:**
- `gcloud run deploy` fails during build
- Docker build errors
- npm install errors

**Common Causes & Fixes:**

```bash
# Out of disk space
gcloud compute images list | grep school-erp

# Failed npm install
npm ci --prefer-offline --no-audit

# Docker build failure
docker build -t test . --progress=plain

# Push to artifact registry failed
gcloud auth configure-docker asia-south1-docker.pkg.dev

# Retry deployment
gcloud run deploy school-erp-api \
  --source . \
  --region asia-south1 \
  --no-cache
```

---

### Issue: Deployment Stuck / Timeout

**Symptoms:**
- `gcloud run deploy` running for >30 minutes
- No new output in build logs
- Deployment never completes

**Recovery:**

```bash
# 1. Cancel current deployment
# Press Ctrl+C in terminal

# 2. Check if service is partially updated
gcloud run services describe school-erp-api \
  --region asia-south1 | grep -A3 status

# 3. Force new deployment
gcloud run deploy school-erp-api \
  --source . \
  --region asia-south1 \
  --no-traffic \
  --tag pending

# 4. Monitor explicitly
watch gcloud run services describe school-erp-api \
  --region asia-south1 | grep -A3 status
```

---

### Issue: Environment Variable Not Taking Effect

**Symptoms:**
- Code still using old value
- Configuration change not applied
- New env var shows as undefined

**Cause & Fix:**

```bash
# 1. Verify env var was set
gcloud run services describe school-erp-api \
  --region asia-south1 | grep -A20 "env:"

# 2. If not showing, set it
gcloud run services update school-erp-api \
  --set-env-vars NEW_VAR=new_value \
  --region asia-south1

# 3. Force new revision
gcloud run deploy school-erp-api \
  --source . \
  --region asia-south1

# 4. Verify in running environment
curl https://school-erp-api.run.app/api/v1/config/env-vars
```

---

## 🟡 PERFORMANCE ISSUES

### Issue: Database Queries Too Slow

**Symptoms:**
- Specific endpoints slow
- Firestore reads/writes are bottleneck
- Latency increases with data size

**Investigation:**

```bash
# 1. Enable Firestore instrumentation
gcloud run services update school-erp-api \
  --set-env-vars ENABLE_FIRESTORE_PROFILING=true \
  --region asia-south1

# 2. Run slow query test
npm run test:slow-queries

# 3. Check Firestore operations
firebase firestore:operations list --verbose

# 4. View index recommendations
gcloud firestore operations list \
  --filter="description.operationType:CREATE_INDEX"
```

**Solutions:**

```bash
# Create composite index
firebase firestore:indexes create

# Batch reads instead of individual queries
# Query only needed fields (select projection)
# Use Firestore pagination for large result sets
# Enable Firestore caching
```

---

### Issue: API Rate Limiting Being Hit

**Symptoms:**
- 429 Too Many Requests errors
- Specific clients getting rate limited
- Load test showing low throughput

**Solution:**

```bash
# Check rate limit settings
gcloud run services describe school-erp-api \
  --region asia-south1 | grep rate-limit

# Increase rate limit
gcloud run services update school-erp-api \
  --set-env-vars API_RATE_LIMIT=1000,API_RATE_LIMIT_WINDOW=1m \
  --region asia-south1

# Or distribute requests across instances
gcloud run services update school-erp-api \
  --min-instances 2 \
  --region asia-south1

# Monitor actual usage
curl -I https://school-erp-api.run.app/api/v1/data | grep RateLimit
```

---

## 🟢 MONITORING & ALERTS

### Setup PagerDuty Alerts

```bash
# 1. Create alert policy
gcloud alpha monitoring policies create \
  --display-name="School ERP API Down" \
  --condition-display-name="Service unavailable" \
  --condition-threshold-value=1 \
  --notification-channels=<PAGERDUTY_CHANNEL_ID>

# 2. Test alert
gcloud run services update school-erp-api --no-traffic
sleep 60
# Should receive PagerDuty alert
gcloud run services update school-erp-api --traffic LATEST=100
```

---

### Setup Error Tracking

```bash
# Sentry (recommended for dev teams)
npm install --save @sentry/node

# Add to code:
import * as Sentry from "@sentry/node";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});
```

---

## 📋 RECOVERY CHECKLIST

- [ ] Alert team on Slack
- [ ] Gather current data (logs, metrics)
- [ ] Identify root cause
- [ ] Execute recovery steps
- [ ] Verify service health
- [ ] Monitor for 30 minutes
- [ ] Post-incident review
- [ ] Document lessons learned
- [ ] Update runbook

---

## 🎓 RELATED DOCUMENTS

- [DEPLOYMENT_CONFIGURATION.md](DEPLOYMENT_CONFIGURATION.md)
- [DEPLOYMENT_QUICK_REFERENCE.md](DEPLOYMENT_QUICK_REFERENCE.md)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Console](https://console.firebase.google.com)
- [GCP Monitoring](https://console.cloud.google.com/monitoring)

---

**Last Updated**: April 2026  
**Maintained By**: DevOps Agent  
**Emergency Contact**: On-call engineer via PagerDuty
