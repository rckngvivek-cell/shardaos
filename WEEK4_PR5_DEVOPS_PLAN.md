# WEEK 4 PR #5 PLAN: DevOps - Documentation & Monitoring

**PR:** #5  
**Owner:** DevOps Agent  
**Day:** Thursday, May 9, 2026  
**Duration:** 2.5 hours  
**Status:** DRAFT - Awaiting Lead Architect Review

---

## 📋 FEATURE SUMMARY

Set up production monitoring dashboards, alerting rules, and comprehensive deployment runbooks. Configure Cloud Logging aggregation, set up p95 latency monitoring, error rate tracking, and deployment health checks. Document zero-downtime blue-green deployment process.

---

## 🎯 DELIVERABLES

| Component | Target | Platform |
|-----------|--------|----------|
| Monitoring Dashboard | Real-time metrics | Cloud Monitoring |
| Alerting Rules | 3+ alert conditions | Cloud Monitoring |
| Deployment Runbook | Step-by-step guide | Markdown |
| Health Check | Continuous monitoring | Cloud Run |

---

## 📊 MONITORING DASHBOARD SETUP

### Cloud Monitoring Dashboard (Dashboard Name: "School ERP - Week 4")

**Metrics to Display:**

1. **API Response Time (p95 latency)**
   ```
   Metric: compute.googleapis.com/instance/cpu/time_series
   Query: cloud.run.up{service_name="school-erp-api"}
           | distribution resource.response_time_ms | p95
   Display: Line chart
   Target: <500ms
   Alert: Trigger if >500ms for 5 min
   ```

2. **Error Rate**
   ```
   Metric: logging.googleapis.com/user/api_errors
   Query: resource.type="cloud_run_revision" 
          AND labels.error_level="ERROR"
   Display: Line chart
   Target: <1%
   Alert: Trigger if >1% for 5 min
   ```

3. **Request Count**
   ```
   Metric: logging.googleapis.com/user/api_requests
   Query: resource.type="cloud_run_revision"
   Display: Stacked bar chart
   Target: Monitor concurrent request load
   ```

4. **Cloud Run Instance Count**
   ```
   Metric: run.googleapis.com/instances
   Query: service_name="school-erp-api"
   Display: Area chart
   Target: Monitor auto-scaling (0-10 instances)
   ```

5. **Database (Firestore) Latency**
   ```
   Metric: firestore.googleapis.com/instance/firestore_latencies
   Query: operation="read" OR operation="write"
   Display: Distribution chart
   Target: <200ms for reads, <250ms for writes
   ```

**Dashboard JSON Structure:**

```json
{
  "displayName": "School ERP - Week 4 Monitoring",
  "dashboardFilters": [],
  "gridLayout": {
    "widgets": [
      {
        "title": "API Response Time (p95)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"logging.googleapis.com/user/api_response_time\" AND resource.type=\"cloud_run_revision\"",
                "aggregation": { "alignmentPeriod": "60s", "perSeriesAligner": "ALIGN_PERCENTILE_95" }
              }
            }
          }],
          "yAxis": { "label": "Response Time (ms)" }
        }
      },
      {
        "title": "Error Rate",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"logging.googleapis.com/user/api_errors\"",
                "aggregation": { "alignmentPeriod": "60s", "perSeriesAligner": "ALIGN_RATE" }
              }
            }
          }]
        }
      },
      {
        "title": "Request Volume",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"logging.googleapis.com/user/api_requests\"",
                "aggregation": { "alignmentPeriod": "60s", "perSeriesAligner": "ALIGN_RATE" }
              }
            }
          }]
        }
      }
    ]
  }
}
```

---

## 🚨 ALERTING RULES

### Alert Policy 1: High Error Rate

**Configuration:**
```yaml
Name: "API Error Rate > 1%"
Severity: Critical
Notification: Email + SMS + PagerDuty

Condition:
  - Metric: logging.googleapis.com/user/api_errors
  - Filter: resource.type="cloud_run_revision"
  - Threshold: >1% for 5 consecutive minutes
  - Action: Trigger alert, page on-call engineer

Response:
  - Page on-call backend engineer
  - Wait 5 minutes before escalating
  - If continues >15 min, page tech lead
```

---

### Alert Policy 2: Slow API Response

**Configuration:**
```yaml
Name: "API p95 Latency > 500ms"
Severity: High
Notification: Email + Slack

Condition:
  - Metric: logging.googleapis.com/user/api_response_time
  - Aggregation: p95
  - Threshold: >500ms for 5 consecutive minutes
  - Action: Log alert, notify team

Response:
  - Check dashboard for error spikes
  - Review Cloud Run logs for slow queries
  - If >1000ms, escalate to performance optimization
```

---

### Alert Policy 3: Cloud Run Instance Scaling Issue

**Configuration:**
```yaml
Name: "Cloud Run Auto-scale Failure"
Severity: High
Notification: Email + PagerDuty

Condition:
  - Metric: run.googleapis.com/instances
  - Threshold: Instances stuck at minimum (0) when requests > 10/s
  - Action: Alert ops team

Response:
  - Check Cloud Build deployment pipeline
  - Verify Cloud Run service quota not hit
  - Check Firestore quota
```

---

## 📋 DEPLOYMENT RUNBOOK

### Deployment Runbook (deployment-runbook.md - 80 LOC)

```markdown
# School ERP Deployment Runbook

## Pre-Deployment Verification (15 min)

### Code Quality Checks
- [ ] All tests passing: `npm run test`
  - Expected: 47/47 tests passing
  - Coverage: 82%+
  
- [ ] Code linting: `npm run lint`
  - Expected: 0 errors, 0 warnings
  
- [ ] TypeScript: `npm run typecheck`
  - Expected: 0 type errors

### Staging Deployment
- [ ] Deploy to staging: `gcloud run deploy school-erp-api --image gcr.io/[project]/school-erp-api:staging`
- [ ] Run smoke tests: `curl https://staging-school-erp.cloud.run/api/v1/health`
- [ ] Verify endpoints responding: `npm run test:integration -- --env=staging`

### Production Readiness
- [ ] Load test: `k6 run load-test.js --vus 100 --duration 5m`
  - Expected: p95 latency <500ms, 0% error rate
  
- [ ] Security audit: `npm run security:audit`
  - Expected: 0 critical vulnerabilities
  
- [ ] Database backup: `gcloud firestore export gs://[bucket]/backups/$(date +%Y%m%d_%H%M%S)`

---

## Deployment Steps (Zero-Downtime Blue-Green)

### Step 1: Canary Deployment (10% Traffic - 5 min)

```bash
# Tag new version
export VERSION=$(date +%Y%m%d_%H%M%S)
docker tag school-erp-api:latest gcr.io/[project]/school-erp-api:$VERSION

# Push to Container Registry
docker push gcr.io/[project]/school-erp-api:$VERSION

# Deploy new revision to Cloud Run
gcloud run deploy school-erp-api-green \
  --image gcr.io/[project]/school-erp-api:$VERSION \
  --platform managed \
  --region us-central1 \
  --no-traffic

# Route 10% to new revision
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-blue=90 school-erp-api-green=10
```

**Monitor (5 min):**
```bash
# Watch error rate on dashboard
watch 'gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" --limit 100'

# Target: 0% error rate
# If error rate > 1%: ROLLBACK (see rollback section)
```

---

### Step 2: Gradual Traffic Shift (50% Traffic - 5 min)

```bash
# Increase to 50% traffic
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-blue=50 school-erp-api-green=50
```

**Monitor (5 min):**
- Error rate should remain <1%
- p95 latency should be <500ms
- If both healthy, proceed to step 3

---

### Step 3: Full Production Rollout (100% Traffic - Immediate)

```bash
# Shift all traffic to new revision
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-green=100
```

**Monitor (10 min):**
- All metrics should be healthy
- No spike in error rate
- Response time stable

**Success:** New version running on 100% production traffic

---

## Rollback Procedure

**If deployment fails at any stage:**

```bash
# Immediate rollback to previous revision
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-blue=100

# Disable problematic revision
gcloud run revisions delete school-erp-api-green
```

**Post-Rollback Actions:**
1. Notify team in Slack: `@here Deployment rolled back. New version $VERSION failed.`
2. Investigate error logs: `gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR"`
3. Fix issues and re-test in staging
4. Schedule new deployment with fixes

---

## On-Call Response Procedures

### Alert: High Error Rate

**Response Time: <5 min**

1. [ ] Acknowledge alert in PagerDuty
2. [ ] Check error logs: `gcloud logging read "severity=ERROR" --limit 50`
3. [ ] Is this a deployment issue?
   - YES: Execute ROLLBACK
   - NO: Investigate root cause
4. [ ] Check Firestore quota: `gcloud firestore quota list`
5. [ ] Restart Cloud Run service if necessary: `gcloud run services describe school-erp-api`

### Alert: Slow API Response

**Response Time: <10 min**

1. [ ] Acknowledge alert
2. [ ] Check slow query logs: `gcloud logging read "response_time_ms > 5000" --limit 20`
3. [ ] Identify slow endpoints
4. [ ] Scale up Cloud Run instances temporarily: `gcloud run services update-traffic --to-revisions [revision]=100`
5. [ ] Create incident ticket for performance optimization

---

## Deployment Checklist

- [ ] Pre-flight: Code quality checks passing
- [ ] Staging: Smoke tests passing
- [ ] Load test: p95 <500ms
- [ ] Security: No critical vulnerabilities
- [ ] Backup: Database backed up
- [ ] Monitoring: Dashboard loaded
- [ ] Alerts: Team notified of deployment window
- [ ] Canary: Deploy to 10%, monitor 5 min
- [ ] Monitor: Check error rate <1%
- [ ] Increase: Shift to 50%, monitor 5 min
- [ ] Full rollout: 100% traffic
- [ ] Monitor: Check for 10 min
- [ ] Document: Log deployment in change log
- [ ] Celebrate: Team notification of success

---

## Emergency Procedures

### Deployment Failed - Immediate Rollback
1. Run rollback: `gcloud run services update-traffic school-erp-api --to-revisions school-erp-api-blue=100`
2. Verify: `curl https://school-erp.cloud.run/api/v1/health`
3. Alert team: Post in #incidents channel

### Database Unavailable
1. Check Firestore status: `gcloud firestore describe`
2. If quota exceeded: `gcloud firestore quota list` (need to adjust)
3. If corrupted: Restore from backup: `gcloud firestore import gs://[bucket]/backups/[date]`

### Certificate Issue (HTTPS)
1. Check certificate expiry: `gcloud compute ssl-certificates describe school-erp-cert`
2. Renew: `gcloud compute ssl-certificates create school-erp-cert-new --certificate=[path]`

---

## Useful Commands

```bash
# View deployment history
gcloud run revisions list --service=school-erp-api

# View logs
gcloud logging read "resource.type=cloud_run_revision" --limit 100

# Scale manually
gcloud run services update school-erp-api --min-instances 2 --max-instances 10

# Deploy new image
gcloud run deploy school-erp-api --image gcr.io/[project]/school-erp-api:latest

# Roll back to specific revision
gcloud run services update-traffic school-erp-api --to-revisions [revision]=100
```

---

## Contact Information

- **On-Call Eng:** [name] - Slack @oncall
- **Tech Lead:** [name] - Slack @lead
- **DevOps:** [name] - Slack @devops
- **Escalation:** PagerDuty incident #[team-id]

---

**Last Updated:** May 9, 2026  
**Next Review:** May 16, 2026
```

---

## 🗂️ FILES TO CHANGE

### Create New Files:
- [ ] `docs/DEPLOYMENT_RUNBOOK.md` (80 LOC)
- [ ] `infrastructure/monitoring/dashboard.json` (150 LOC - dashboard config)
- [ ] `infrastructure/monitoring/alerting-rules.yaml` (100 LOC - alert policies)
- [ ] `apps/api/tests/health-check.test.ts` (30 LOC)

### Modify Files:
- [ ] `README.md` - Add link to deployment runbook
- [ ] `firebase.json` - Update Firestore rules deployment config

---

## ⏱️ IMPLEMENTATION TIMELINE

| Task | Time | Owner |
|------|------|-------|
| **PLAN Review** | 15 min | Lead Architect |
| **Cloud Monitoring Setup** | 45 min | DevOps |
| **Alert Configuration** | 30 min | DevOps |
| **Runbook Documentation** | 30 min | DevOps |
| **Health Check Test** | 15 min | QA |
| **Code Review** | 15 min | Lead Architect |
| **Total** | **2.5 hours** | - |

---

## 🎯 SUCCESS CRITERIA

- ✅ Cloud Monitoring dashboard created and displaying live metrics
- ✅ 3+ alert rules configured and tested
- ✅ Deployment runbook written with clear steps
- ✅ Blue-green deployment tested in staging (0 errors)
- ✅ Health check endpoint responding correctly
- ✅ All monitoring tests passing
- ✅ On-call procedures documented

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Dashboard:** Use Cloud Monitoring web UI or JSON config for reproducibility.
2. **Alerts:** Set thresholds based on Week 3+ baseline performance.
3. **Blue-Green:** Always keep previous version running during deployment.
4. **Monitoring:** Start Cloud Logging sinks before alerts (need data flow).
5. **Runbook:** Test all commands in staging environment first.

---

**Status:** ⏳ AWAITING LEAD ARCHITECT REVIEW  
**Next Steps:** Lead Architect to review. Then begin IMPLEMENT phase.

*Created: 2026-04-09*  
*PR Target:** PR #5, Thursday May 9, 2026
