# Runbook 002: Zero-Downtime Deployment Procedures

**Last Updated:** April 9, 2026  
**Owner:** DevOps Agent  
**Target:** Deploy with <1 second service interruption  

---

## Overview

Deploy code changes to production without disrupting active user sessions or ongoing operations.

**Key Principle:** Blue-Green (old version still serving traffic) → Canary (new version tested) → Green (new version promoted)

---

## Pre-Deployment Checklist (24 hours before)

### Code Quality Gates
- [ ] All unit tests passing (Jest, >85% coverage)
- [ ] Integration tests passing (Firestore, auth endpoints)
- [ ] TypeScript strict mode: 0 errors
- [ ] ESLint: 0 violations
- [ ] Security scan: 0 critical CVEs

### Deployment Planning
- [ ] Deployment window scheduled (Tue 2 PM or Wed 9 AM)
- [ ] Staging deployment completed and validated
- [ ] Rollback plan documented (previous version identified)
- [ ] Monitoring dashboards prepared
- [ ] Team assigned (DevOps lead, QA, on-call backend/frontend)

### Infrastructure Readiness
- [ ] Cloud Run auto-scaling working (test scale up/down)
- [ ] Redis/DiskCache healthy (uptime >99.95%)
- [ ] Firestore within quota (usage <70%)
- [ ] Load Balancer health checks passing
- [ ] Cloud Armor rules active

---

## Deployment Steps (0-30 minutes total)

### 1. Pre-Flight Check (Minute 0)

```bash
#!/bin/bash

# Health check: API responding?
curl -s https://api.school-erp.in/health | jq .

# Expected output:
# {
#   "status": "ok",
#   "version": "v0.1.9",
#   "uptime_seconds": 3600,
#   "checks": { "db": "ok", "redis": "ok" }
# }

# Check current version
gcloud run services describe school-erp-api \
  --format='value(status.traffic)'

# Expected: school-erp-api-v0-1-9=100

# Check error rate (should be <0.05%)
gcloud monitoring time-series list \
  --filter='resource.labels.service_name=school-erp-api AND metric.type=logging.googleapis.com/user/error_rate' \
  --format=json | jq '.[] | .points[0].value.double_value'

# Check available capacity (should be <70% CPU/memory)
gcloud run services describe school-erp-api \
  --format='value(status.conditions[0].message)'
```

**Go/No-Go Decision:**
- ✅ All checks passing → PROCEED
- ❌ Any check failing → ABORT & investigate

---

### 2. Build & Tag Docker Image (Minute 1-3)

```bash
# Build Docker image from Git commit
cd /path/to/school-erp-api
git pull origin main

# Build image
docker build -t gcr.io/school-erp-prod/api:v0-2-0 .
docker push gcr.io/school-erp-prod/api:v0-2-0

# Tag as "latest" (rollback reference)
docker tag gcr.io/school-erp-prod/api:v0-2-0 \
           gcr.io/school-erp-prod/api:latest
docker push gcr.io/school-erp-prod/api:latest

# Verify image in registry
gcloud container images describe gcr.io/school-erp-prod/api:v0-2-0
```

---

### 3. Deploy New Revision to Cloud Run (Minute 4-5)

```bash
# Deploy new version (traffic = 0% initially)
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:v0-2-0 \
  --platform managed \
  --region asia-south1 \
  --memory 1Gi \
  --cpu 2 \
  --concurrency 100 \
  --timeout 60s \
  --set-env-vars ENVIRONMENT=production \
  --no-traffic  # Important: Don't route traffic yet

# Verify deployment created new revision
gcloud run revisions list --service school-erp-api --limit=3
# Should show: school-erp-api-v0-2-0 (NEW)
#             school-erp-api-v0-1-9 (RUNNING)
```

**Status:** New version deployed but not receiving traffic yet ✅

---

### 4. Smoke Tests on New Revision (Minute 6-8)

```bash
# Get service endpoint
export NEW_VERSION_URL=$(gcloud run services describe school-erp-api \
  --format='value(status.url)')

# Direct traffic to new revision via test header
# (Cloud Load Balancer will route based on header)

# Test basic endpoints
curl -s -H "X-Revision: school-erp-api-v0-2-0" \
  $NEW_VERSION_URL/health | jq .

curl -s -H "X-Revision: school-erp-api-v0-2-0" \
  $NEW_VERSION_URL/api/schools \
  -H "Authorization: Bearer $TEST_TOKEN" | jq '.[] | {id, name}' | head

# Monitor logs for errors
gcloud logging read \
  'resource.labels.service_name=school-erp-api AND severity>=ERROR' \
  --limit=10 --format=json | jq '.[] | .textPayload'
```

**Go/No-Go:**
- ✅ Health check passing → Continue to canary
- ❌ Health check failing → STOP, investigate, rebuild

---

### 5. Canary Deployment (10% traffic) - Minute 9-14

```bash
# Update traffic split: 10% new, 90% old
gcloud run services update-traffic school-erp-api \
  --to-revisions \
    school-erp-api-v0-2-0=10 \
    school-erp-api-v0-1-9=90

# Verify traffic split
gcloud run services describe school-erp-api \
  --format='value(status.traffic)'

# Expected output:
# school-erp-api-v0-2-0: 10%
# school-erp-api-v0-1-9: 90%
```

**Monitoring (5 minutes):**
- Watch error rate (should stay <0.05%)
- Watch latency p95 (should stay <400ms)
- Watch memory/CPU (should stay <70%)

```bash
# Monitor metrics (every 10 seconds, for 5 minutes)
watch -n 10 'gcloud monitoring time-series list \
  --filter="resource.labels.service_name=school-erp-api" \
  --format="table(metric.type, points[0].value.double_value)"'
```

**Decision:**
- ✅ All metrics healthy → Proceed to 25%
- ❌ Error spike or latency increase → ROLLBACK immediately

---

### 6. Gradual Rollout (25% → 50% → 100%) - Minute 15-25

**At Minute 15: Promote to 25%**
```bash
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-v0-2-0=25 school-erp-api-v0-1-9=75

# Monitor for 5 minutes
# (same metrics as before)
```

**At Minute 20: Promote to 50%**
```bash
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-v0-2-0=50 school-erp-api-v0-1-9=50

# Monitor for 5 minutes
```

**At Minute 25: Promote to 100%**
```bash
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-v0-2-0=100

# Confirm
gcloud run services describe school-erp-api \
  --format='value(status.traffic)'

# Expected: school-erp-api-v0-2-0: 100%
```

---

### 7. Final Verification (Minute 26-30)

```bash
# Health check from production
curl -s https://api.school-erp.in/health | jq .

# Check version matches
curl -s https://api.school-erp.in/health | jq .version
# Should be: v0.2.0

# Monitor error rate for 5 more minutes
for i in {1..5}; do
  echo "=== Minute $i Post-Deployment ==="
  gcloud logging read \
    'resource.labels.service_name=school-erp-api AND severity=ERROR' \
    --limit=5 --format=compact
  sleep 60
done
```

**Success Criteria:**
- ✅ Error rate <0.05%
- ✅ Latency <400ms p95
- ✅ Memory/CPU <70%
- ✅ Uptime >99.95%
- ✅ No customer complaints (Slack #support)

---

## During Deployment: Session Management

**Active User Sessions (Should NOT be interrupted)**

```javascript
// Frontend: If JWT expires during deployment, refresh transparently
// (User should not see interruption)

const refreshToken = setInterval(async () => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${oldToken}` }
  });
  const { token: newToken } = await response.json();
  updateAuthToken(newToken);
}, 5 * 60 * 1000); // Every 5 minutes
```

**Database Transactions (Should NOT be interrupted)**

- Long-running reports: Async (don't block on API timeout)
- Grade entry: Batch writes (auto-retry if deployment happens mid-request)
- Attendance sync: Queue in Cloud Tasks (retry on service restart)

---

## Automatic Rollback Triggers

**The system automatically rolls back if:**

1. **Error Rate Spike**
   - Threshold: >0.5% (10x normal)
   - Action: Immediate rollback to previous version
   - Alert: Slack #incidents + page on-call

2. **Latency Increase**
   - Threshold: p95 >1000ms (2.5x normal)
   - Action: Immediate rollback
   - Alert: Same as above

3. **Memory/CPU Spike**
   - Threshold: >85% memory or >80% CPU
   - Action: Immediate rollback
   - Alert: Same as above

4. **Health Check Failures**
   - Threshold: 3 consecutive failures (30 seconds)
   - Action: Remove from load balancer, auto-rollback
   - Alert: Same as above

---

## Manual Rollback (if automatic doesn't trigger)

**When:** Deployment is stable technically but breaks business logic

```bash
# Step 1: Identify previous stable version
gcloud run revisions list --service school-erp-api --limit=5
# Pick the one before current

# Step 2: Immediate rollback
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-v0-1-9=100

# Step 3: Monitor
curl -s https://api.school-erp.in/health | jq .

# Step 4: Verify in monitoring dashboard
# (Error rate should drop immediately)

# Step 5: Notify team
# @here MANUAL ROLLBACK: v0.2.0 → v0.1.9
# Reason: [business logic issue]
# Status: Service recovering
```

**Time to rollback:** <1 minute

---

## Traffic Flow During Deployment

```
┌──────────────┐
│ User Browser │
└──────┬───────┘
       │
       ↓ (HTTPS)
┌────────────────────────────────┐
│ Cloud Load Balancer            │
│ (Health checks running)        │
├────────────────────────────────┤
│ Weighted Routing:              │
│  90% → v0.1.9 (old/stable)    │
│  10% → v0.2.0 (new/canary)    │
└────────────────────────────────┘
       ↙                    ↘
   ✅ Old Version         🧪 New Version
  (Stable, proven)      (Testing in prod)
```

**Key Point:** At any time during deployment, if new version fails, traffic instantly reverts to old version. **User experiences NO interruption.**

---

## Post-Deployment Actions

### Immediate (Within 1 hour)
- [ ] Monitor error rate for any regressions
- [ ] Check customer feedback in #support
- [ ] Confirm all critical workflows still work

### Same Day (After 4-hour soak)
- [ ] Delete old revision (if stable 4+ hours)
- [ ] Document any issues in Jira
- [ ] Update deployment checklist if problems found

### Next Day
- [ ] Review logs for any error patterns
- [ ] Run analytics on deployment timing
- [ ] Share notes with team

---

## Deployment Checklist

```markdown
## Deployment: v0.2.0
**Date:** April 9, 2026  
**Time:** 2:00 PM IST

- [ ] Pre-flight checks passing
- [ ] All tests green
- [ ] Staging deployment verified
- [ ] Rollback plan documented
- [ ] Team assigned
- [ ] Docker image built & pushed
- [ ] New revision deployed (0% traffic)
- [ ] Smoke tests passing
- [ ] Canary 10% healthy (5 min)
- [ ] Deployed to 25% (5 min)
- [ ] Deployed to 50% (5 min)
- [ ] Deployed to 100% (30 min final)
- [ ] Error rate <0.05%
- [ ] Customers notified (if needed)
- [ ] Post-deployment monitoring active

**Status:** ✅ COMPLETE
**Time:** 30 minutes
**Rollback available:** Yes (v0.1.9)
```

---

## Related Documents

- [Staged Rollout Strategy](../architecture/ADRs/005-staged-rollout-deployment.md)
- [Production Incident Response](./001-production-incident-response.md)
- [Monitoring Dashboard](../monitoring-observability.md)

