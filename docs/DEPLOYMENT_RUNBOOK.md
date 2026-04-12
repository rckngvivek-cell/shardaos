# School ERP Deployment Runbook

**Version:** 1.0  
**Last Updated:** May 9, 2026  
**Status:** PRODUCTION READY  
**On-Call Escalation:** See Emergency Procedures section

---

## Pre-Deployment Verification Checklist (15 min)

### Code Quality Checks

- [ ] **All tests passing**
  ```bash
  npm run test
  # Expected: 47/47 tests passing
  # Coverage: 82%+
  ```

- [ ] **Code linting**
  ```bash
  npm run lint
  # Expected: 0 errors, 0 warnings
  ```

- [ ] **TypeScript strict mode**
  ```bash
  npm run typecheck
  # Expected: 0 type errors
  ```

### Staging Environment Tests

- [ ] **Deploy to staging**
  ```bash
  gcloud run deploy school-erp-api-staging \
    --image gcr.io/[PROJECT_ID]/school-erp-api:staging \
    --region us-central1 \
    --platform managed
  ```

- [ ] **Health check endpoint**
  ```bash
  curl -X GET https://staging-school-erp.cloud.run/api/v1/health
  # Expected: 200 OK with { "status": "ok", "env": "staging", ... }
  ```

- [ ] **Integration smoke tests**
  ```bash
  npm run test:integration -- --env=staging
  # Expected: All endpoints responding correctly
  ```

### Production Readiness

- [ ] **Load testing (p95 latency)**
  ```bash
  k6 run load-test.js --vus 100 --duration 5m
  # Expected: p95 latency <500ms, error rate 0%
  ```

- [ ] **Security audit**
  ```bash
  npm run security:audit
  # Expected: 0 critical vulnerabilities, 0 high-risk findings
  ```

- [ ] **Database backup created**
  ```bash
  export BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
  gcloud firestore export gs://school-erp-backups/backup_$BACKUP_DATE \
    --async
  # Expected: Backup initiated successfully
  ```

- [ ] **Monitoring dashboard accessible**
  - Verify Cloud Monitoring dashboard loads: https://console.cloud.google.com/monitoring/dashboards
  - All 5 key metrics displaying live data

- [ ] **Team notified of deployment window**
  - Post in #deployments Slack channel
  - Target: 2 PM UTC (off-peak)

---

## Zero-Downtime Blue-Green Deployment (15 min total)

### Overview
- **Blue (Current):** Production revision running with full traffic
- **Green (New):** New version deployed with zero traffic initially
- **Phased Rollout:** 10% (5 min) → 50% (5 min) → 100% (immediate)

### Step 1: Prepare New Version

```bash
# 1. Tag version with timestamp
export VERSION=$(date +%Y%m%d_%H%M%S)
export IMAGE="gcr.io/[PROJECT_ID]/school-erp-api:$VERSION"

# 2. Build Docker image
docker build -t school-erp-api:$VERSION \
  -f apps/api/Dockerfile \
  .

# 3. Push to Container Registry
docker push gcr.io/[PROJECT_ID]/school-erp-api:$VERSION

# 4. Verify image exists
gcloud container images describe $IMAGE
```

### Step 2: Deploy Green Revision (No Traffic)

```bash
# Deploy new version WITHOUT serving traffic
gcloud run deploy school-erp-api-green \
  --image="$IMAGE" \
  --region=us-central1 \
  --platform=managed \
  --no-traffic \
  --memory=512Mi \
  --cpu=1 \
  --timeout=30

# Verify green revision deployed
gcloud run revisions list --service=school-erp-api-green
```

### Step 3: Canary Deployment (10% Traffic, 5 min)

```bash
# Route 10% traffic to green revision
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-green=10 school-erp-api-blue=90 \
  --region us-central1

echo "✓ Canary deployment active (10% traffic on green)"
echo "Monitor errors and latency for 5 minutes..."
```

**Monitor (5 minutes):**
```bash
# Watch in real-time
watch -n 5 'gcloud logging read \
  "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=10 --format=json | jq .[].severity'

# Check metrics dashboard
# Target: Error rate 0%, p95 latency <500ms, no spike in CPU
```

**Decision Point:**
- ✅ **Healthy:** Proceed to Step 4
- ❌ **Issues Found:** Execute ROLLBACK (see section below)

### Step 4: Gradual Traffic Shift (50% Traffic, 5 min)

```bash
# Increase to 50% traffic
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-green=50 school-erp-api-blue=50 \
  --region us-central1

echo "✓ Gradual shift active (50% traffic on green)"
echo "Monitor for 5 minutes..."
```

**Monitor:** Same as Step 3, check dashboard metrics

### Step 5: Full Production Rollout (100% Traffic)

```bash
# Shift all traffic to new version
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-green=100 \
  --region us-central1

echo "✓ Full rollout complete"
echo "Deployment successful - monitoring for 10 minutes"

# Tag blue revision as previous version (keep for quick rollback)
gcloud run revisions list --service=school-erp-api \
  --sort-by=~created | head -2
```

**Monitor (10 minutes):**
- Error rate: should remain <1%
- p95 latency: should be <500ms
- No spike in CPU or memory usage
- All endpoints responding normally

**Success Metrics:**
- ✅ Error rate <1%
- ✅ p95 latency <500ms
- ✅ No increase in slow queries
- ✅ All integrations working

---

## Immediate Rollback Procedure

**When to rollback:**
- Error rate exceeds 1% for >60 seconds
- p95 latency exceeds 800ms consistently
- Database connection errors spike
- Critical functionality broken

**Rollback steps (aim for <2 min):**

```bash
# 1. Identify previous healthy revision
gcloud run revisions list --service=school-erp-api \
  --sort-by=~created | head -3

# 2. Revert all traffic to blue (previous version)
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-blue=100 \
  --region us-central1

# 3. Verify rollback success
sleep 10
curl https://school-erp.cloud.run/api/v1/health
# Expected: 200 OK response

# 4. Notify team immediately
echo "🚨 ROLLBACK EXECUTED - Reverted to previous version"
# Post in #incidents Slack channel with link to logs
```

**Post-Rollback Investigation:**
```bash
# Collect error logs (last 20 min)
gcloud logging read \
  "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=100 \
  --format=json > /tmp/error_logs.json

# Analyze failure
jq '.[] | {time: .timestamp, message: .textPayload}' /tmp/error_logs.json

# Create incident ticket with logs attached
# Schedule post-mortem for 24 hours later
```

---

## On-Call Response Procedures

### Alert: Error Rate > 1%

**Response Time: Acknowledge within 5 min, Resolve within 15 min**

Checklist:
- [ ] Acknowledge alert in PagerDuty
- [ ] Check error logs:
  ```bash
  gcloud logging read "severity=ERROR" \
    --limit=50 --format=json | jq '.[] | {timestamp, textPayload}'
  ```
- [ ] Is this a recent deployment? → Execute ROLLBACK
- [ ] Check Firestore quota:
  ```bash
  gcloud firestore quota list
  ```
- [ ] Check Cloud Run scaling:
  ```bash
  gcloud run services describe school-erp-api --region us-central1
  ```
- [ ] If quota exceeded, scale down immediately:
  ```bash
  gcloud run services update school-erp-api \
    --max-instances=5 --region us-central1
  ```

### Alert: p95 Latency > 500ms

**Response Time: Acknowledge within 10 min**

Checklist:
- [ ] Acknowledge alert
- [ ] Check slow query logs:
  ```bash
  gcloud logging read "response_time_ms > 500" \
    --limit=20 --format='table(timestamp, textPayload)'
  ```
- [ ] Identify slow endpoints
- [ ] Check database query performance (Firestore index missing?)
- [ ] Scale instances if CPU is high:
  ```bash
  gcloud run services update school-erp-api \
    --min-instances=3 --region us-central1
  ```
- [ ] Create performance optimization ticket

### Alert: Cloud Run Auto-scale Failure

**Response Time: Immediate - Page on-call ops**

Checklist:
- [ ] Check if deployment in progress:
  ```bash
  gcloud run revisions list --service=school-erp-api
  ```
- [ ] Verify Cloud Run quota not exceeded:
  ```bash
  gcloud compute project-info describe --project=[PROJECT_ID] | grep -A 5 INSTANCES
  ```
- [ ] Check Cloud Build for failed builds:
  ```bash
  gcloud builds list --limit=10
  ```
- [ ] Manually scale if necessary:
  ```bash
  gcloud run services update school-erp-api \
    --min-instances=2 --max-instances=10 --region us-central1
  ```
- [ ] Contact GCP support if quota issue

---

## Emergency Procedures

### Scenario 1: Complete Application Failure

**Steps (aim for <5 min recovery):**

1. Immediate Rollback:
   ```bash
   gcloud run services update-traffic school-erp-api \
     --to-revisions school-erp-api-blue=100
   ```

2. Verify service responding:
   ```bash
   curl -I https://school-erp.cloud.run/api/v1/health
   ```

3. Check health of dependencies:
   ```bash
   # Firestore status
   gcloud firestore describe
   
   # Cloud Logging
   gcloud logging sinks list
   ```

4. Post incident report:
   ```bash
   # Create GitHub issue with logs, timeline, resolution
   gh issue create --title "[INCIDENT] Deployment Failure - $(date)" \
     --body "See attached logs" --assignee @devops
   ```

### Scenario 2: Database Connection Errors

**Steps:**

1. Check Firestore quota:
   ```bash
   gcloud firestore quota list
   ```

2. If quota exceeded, wait for quota reset (happens hourly) or contact GCP

3. If quota available, check connection string:
   ```bash
   vault kv get secret/school-erp/firestore-config
   # Verify GOOGLE_APPLICATION_CREDENTIALS and project ID are correct
   ```

4. Restart API service:
   ```bash
   gcloud run services update school-erp-api --region us-central1
   ```

### Scenario 3: SSL Certificate Issue

**Steps:**

1. Check certificate expiry:
   ```bash
   gcloud compute ssl-certificates describe school-erp-cert
   ```

2. If expired or expiring soon:
   ```bash
   # Create new certificate
   gcloud compute ssl-certificates create school-erp-cert-new \
     --certificate=/path/to/cert.pem \
     --private-key=/path/to/key.pem
   ```

3. Update load balancer to use new certificate:
   ```bash
   gcloud compute target-https-proxies update school-erp-proxy \
     --ssl-certificates school-erp-cert-new
   ```

---

## Deployment Success Verification

**Post-deployment (10 min after green = 100%):**

Run complete health check:
```bash
# 1. API responds
curl -X GET https://school-erp.cloud.run/api/v1/health

# 2. All endpoints operational
npm run test:integration -- --env=production

# 3. No new errors in logs
gcloud logging read "severity=ERROR" --limit=10

# 4. Performance metrics normal
gcloud monitoring time-series list --filter='metric.type="logging.googleapis.com/user/api_response_time"'

# 5. Zero critical alerts firing
gcloud alpha monitoring policies list --format='table(displayName,enabled)' | grep CRITICAL
```

**Success confirmation:**
```
✅ No active critical alerts
✅ Error rate < 1%
✅ p95 latency < 500ms
✅ All integration tests passing
✅ Firestore operations normal
✅ No spike in customer complaints
```

---

## Useful Commands Reference

```bash
# View deployment history
gcloud run revisions list --service=school-erp-api --region us-central1

# View live logs (tail)
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=50 --follow=true

# Describe current service
gcloud run services describe school-erp-api --region us-central1

# Manual instance scaling
gcloud run services update school-erp-api \
  --min-instances=2 --max-instances=10 --region us-central1

# Emergency rollback
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-blue=100 --region us-central1

# Health check test
curl -v https://school-erp.cloud.run/api/v1/health

# End-to-end test
npm run test:e2e -- --env=production
```

---

## Quick Reference Card

| Scenario | Command | Status |
|----------|---------|--------|
| Deploy new version | `gcloud run deploy school-erp-api --image=...` | Used |
| Rollback immediately | `gcloud run services update-traffic school-erp-api --to-revisions school-erp-api-blue=100` | Emergency |
| Check health | `curl https://school-erp.cloud.run/api/v1/health` | Test |
| View errors | `gcloud logging read "severity=ERROR" --limit=10` | Diagnostic |
| Scale up | `gcloud run services update school-erp-api --min-instances=3` | Performance |

---

**Document Status:** ✅ PRODUCTION READY  
**Next Review:** May 16, 2026  
**Owner:** DevOps Team  
**Contact:** #devops-team Slack channel

**Resolution:**

```bash
# 1. Identify slow queries:
gcloud logging read 'resource.type="cloud_run_revision" AND jsonPayload.operation="firestore.query" AND jsonPayload.duration_ms > 500' \
  --limit 20 --format json

# 2. Optimize the query:
# - Add indexes (check ADR-002)
# - Denormalize data
# - Implement caching

# 3. Temporary: Increase connection pool
# Cloud Run → Concurrency setting
gcloud run services update school-erp-api \
  --concurrency 100 \
  --region us-central1

# 4. Test fix by replicating load:
artillery quick --count 100 --num 1000 https://school-erp-api.run.app/api/v1/students
```

---

## Common Issues & Fixes

### Issue: "401 Unauthorized" after deployment

**Cause:** Firebase credentials not loaded  
**Fix:**

```bash
# Verify secret exists in Secret Manager
gcloud secrets describe firebase-config --project school-erp-prod

# If missing, create it:
gcloud secrets create firebase-config \
  --data-file=./firebase-key.json \
  --project school-erp-prod

# Redeploy service (re-mounts secrets)
gcloud run deploy school-erp-api --region us-central1
```

### Issue: Tests failing in CI but passing locally

**Cause:** Environment variables not set in cloud build  
**Fix:**

```bash
# Check cloudbuild.yaml has all env vars:
cat cloudbuild.yaml | grep env_vars

# Add missing vars:
gcloud builds update --substitutions _ENV_VAR="value" cloudbuild.yaml

# Re-run build:
gcloud builds submit --config cloudbuild.yaml
```

### Issue: "Firestore query requires index"

**Cause:** Composite index missing for query pattern  
**Fix:**

```bash
# Firebase automatically suggests indexes
# Check Cloud Console logs for suggestion
gcloud logging read 'The query requires an index' --limit 5

# Create index from suggestion:
gcloud firestore indexes create \
  --collection=students \
  --field-config="schoolId=Ascending,status=Ascending"
  
# Test query after index is built (usually < 1 minute)
```

### Issue: Image pull takes > 2 minutes

**Cause:** Image too large (> 500MB)  
**Fix:**

```bash
# Check image size in GCR:
docker image inspect gcr.io/school-erp-prod/school-erp-api:latest | grep Size

# Optimize Dockerfile:
# 1. Use multi-stage build
# 2. Remove dev dependencies
# 3. Compress node_modules
# Example: FROM node:18-alpine (vs node:18)

# Rebuild after optimization:
gcloud builds submit --config cloudbuild.yaml
```

---

## Post-Deployment Verification Checklist

After successful deployment, verify:

- [ ] Error rate < 0.1% for 15 minutes
- [ ] p95 latency < 400ms
- [ ] All 5 API endpoints responding (HTTP 200)
- [ ] Health check endpoint: GET /health → 200 OK
- [ ] Firestore queries returning data
- [ ] Pilot schools able to log in
- [ ] Student data visible in dashboard
- [ ] Attendance API functional
- [ ] Grades data accessible
- [ ] Audit logs being written
- [ ] Monitoring dashboard showing data
- [ ] Alerts tested (can be manually triggered)

---

## Deployment Rollback Audit Trail

| Date | Deployed | Status | Reason (if rollback) | On-Call |
|------|----------|--------|----------------------|---------|
| 2026-05-09 | v0.1.0 | LIVE | Initial deployment | DevOps Lead |
| (empty) | (future) | - | - | - |

---

## Quick Reference

**Emergency Rollback:** `gcloud run services update-traffic school-erp-api --to-revisions school-erp-api-prev=100 --region us-central1`

**Check Service Status:** `gcloud run services describe school-erp-api --region us-central1`

**View Recent Logs:** `gcloud logging read 'resource.type="cloud_run_revision"' --limit 50`

**View Metrics:** Cloud Monitoring Dashboard: [link to dashboard]

**Incident Slack Channel:** `#incidents`

---

**Last Tested:** May 9, 2026  
**Next Review:** May 23, 2026 (bi-weekly)

