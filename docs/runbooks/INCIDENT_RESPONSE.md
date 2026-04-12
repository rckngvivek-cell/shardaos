# Runbook: P1 Incident Response

**Goal:** Quick response procedures for common critical incidents  
**Owner:** DevOps Agent / On-Call Engineer  
**Last Updated:** April 10, 2026

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-10 | Documentation Agent | Phase 2 incident response procedures |

---

## Severity Levels

| Level | Response Time | Impact | Example |
|-------|---------------|--------|---------|
| P1 | 5 min | All users blocked | API completely down |
| P2 | 15 min | Many features broken | Exams can't submit |
| P3 | 1 hour | Feature degraded | Dashboard slow |
| P4 | Next business day | Minor impact | Typo in UI |

---

## Incident Response Process

```
1. ALERT (Monitoring detects issue)
   ↓
2. ACKNOWLEDGE (On-call responds in <2 min)
   ↓
3. TRIAGE (Root cause in <5 min)
   ↓
4. RESOLVE (Fix applied in <15 min)
   ↓
5. VERIFY (Testing + confirm resolution)
   ↓
6. POST-MORTEM (Within 24 hours)
```

---

## Incident 1: API Not Responding (503/502)

**Alert:** "API Health Check Failed - 3 consecutive failures"  
**MTTR Target:** 10 minutes

### Phase 1: Acknowledge & Assess (0-2 minutes)

```bash
# On-call engineer: Check service status immediately
export SERVICE_NAME=exam-api-v2
export REGION=asia-south1

# 1. Check if service is running
gcloud run services describe ${SERVICE_NAME} --region=${REGION}

# 2. Check health endpoint
curl -i https://exam-api-v2-abc123.a.run.app/health/live

# 3. Check for recent errors in logs
gcloud logging read "resource.type=cloud_run_revision AND \
  resource.labels.service_name=${SERVICE_NAME} AND \
  severity>=ERROR" \
  --limit=20 --format=short --freshness=300s
```

**Expected outputs:**
- ✅ Service ACTIVE - continue to Phase 2
- ❌ Service not found - API was deleted, restore from backup
- ❌ Recent errors - continue to Phase 2

### Phase 2: Root Cause Diagnosis (2-5 minutes)

**Check 1: Resource Constraints**
```bash
# CPU usage
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/instance_cpu_utilization" AND \
  resource.labels.service_name="'${SERVICE_NAME}'"' \
  --format="table(points[0].value.double_value)" | head -5

# Memory usage (should be <80% of 1Gi * 100 instances)
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/instance_memory_utilization" AND \
  resource.labels.service_name="'${SERVICE_NAME}'"' \
  --format="table(points[0].value.double_value)" | head -5

# Active instances
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/instance_count" AND \
  resource.labels.service_name="'${SERVICE_NAME}'"' \
  --format="table(points[0].value.int64_value)"
```

**Decision Tree:**
- CPU >90%? → Increase CPU (Phase 3A)
- Memory >80%? → Increase Memory (Phase 3B)
- High latency? → Check Firestore (Phase 3C)
- Otherwise → Restart service (Phase 3D)

**Check 2: Firestore Connectivity**
```bash
# Check if Firestore is accessible
gcloud firestore databases describe --location=asia-south1

# Check for quota exhaustion
gcloud compute quota-metrics list --filter="metric:datastore/*"

# Check read/write throughput
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/document/read_operations"' \
  --format="table(points[0].value.int64_value)"
```

**Check 3: Network/Load Balancer**
```bash
# Check backend health
gcloud compute backend-services get-health deerflow-backend-bs \
  --region=${REGION}

# Expected output: HEALTHY
# If UNHEALTHY: Container failed to start

# Check Cloud Armor rules
gcloud compute security-policies describe deerflow-armor \
  --format='value(rules[].ruleNumber)'
```

**Check 4: Recent Deployments**
```bash
# List recent revisions
gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION} --limit=5

# Output shows: which revision is currently active
# If new revision = bad deployment, rollback (Phase 3D)
```

### Phase 3: Remediation (5-15 minutes)

**Option 3A: Increase CPU/Memory**
```bash
# Scale up resources
gcloud run deploy ${SERVICE_NAME} \
  --memory=2Gi \
  --cpu=4 \
  --max-instances=200 \
  --region=${REGION}

# Wait for rollout (2-3 minutes)
echo "Waiting for rollout..."
sleep 180

# Verify health check
curl https://exam-api-v2-abc123.a.run.app/health/ready
```

**Option 3B: Restart Service**
```bash
# Redeploy current revision (restart with same code)
gcloud run deploy ${SERVICE_NAME} \
  --region=${REGION} \
  --image=asia.gcr.io/school-erp-staging/${SERVICE_NAME}:latest

# OR minimal restart: just update a label
gcloud run services update ${SERVICE_NAME} \
  --region=${REGION} \
  --update-labels=restart-time="$(date +%s)"
```

**Option 3C: Rollback to Previous Revision**
```bash
# List revisions
gcloud run revisions list --service=${SERVICE_NAME} --region=${REGION}

# If recent deployment caused issue, rollback
PREV_REVISION=exam-api-v2-00001-abc
gcloud run services update-traffic ${SERVICE_NAME} \
  --to-revisions=${PREV_REVISION}=100 \
  --region=${REGION}

# Verify health check passes
sleep 10
curl https://exam-api-v2-abc123.a.run.app/health/ready
```

**Option 3D: Check Pub/Sub/BigQuery Issues**
```bash
# If Pub/Sub or BigQuery initialization failed:
gcloud logging read "resource.labels.service_name=${SERVICE_NAME} AND \
  (jsonPayload.message:*Pub/Sub* OR jsonPayload.message:*BigQuery*)" \
  --limit=20 --format=short

# If failed (expected in development), disable optional services:
gcloud run deploy ${SERVICE_NAME} \
  --update-env-vars="PUBSUB_ENABLED=false,BIGQUERY_ENABLED=false" \
  --region=${REGION}
```

### Phase 4: Verify Resolution (15-20 minutes)

```bash
# 1. Health check
curl -i https://exam-api-v2-abc123.a.run.app/health/ready
# Expected: 200 OK, all services ✅

# 2. Test core endpoints
TOKEN=$(gcloud auth print-identity-token)

# Create exam
curl -X POST https://exam-api-v2-abc123.a.run.app/api/v1/exams \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"schoolId":"s1","title":"Test","subject":"Math","totalMarks":100,"durationMinutes":60,"classId":"c1","startTime":"2026-04-10T10:00:00Z","endTime":"2026-04-10T11:00:00Z"}'
# Expected: 201 Created

# 3. Monitor metrics (should show healthy activity)
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND \
  resource.labels.service_name="'${SERVICE_NAME}'"' \
  --format="table(metric.labels.response_code_class,points[0].value.int64_value)"

# 4. Check error rate (should be <1%)
ERROR_COUNT=$(gcloud logging read "resource.type=cloud_run_revision AND \
  resource.labels.service_name=${SERVICE_NAME} AND \
  severity>=ERROR AND \
  timestamp>=\"$(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S)Z\"" --limit=100 | wc -l)

if [ $ERROR_COUNT -eq 0 ]; then
  echo "✅ No errors in past 10 minutes - RESOLVED"
else
  echo "⚠️ Still $ERROR_COUNT errors - continue investigation"
fi
```

### Phase 5: Document & Close

```bash
# Incident ticket template
cat > INCIDENT-$(date +%Y%m%d-%H%M%S).txt << 'EOF'
INCIDENT REPORT

Severity: P1
Start Time: YYYY-MM-DD HH:MM:SS UTC
End Time: YYYY-MM-DD HH:MM:SS UTC
MTTR: X minutes

ROOT CAUSE:
[What caused the incident]

RESOLUTION:
[What was done to fix it]

IMPACT:
- Duration: X minutes
- Affected Users: All
- Data Loss: None / X records

PREVENTION:
- [Action to prevent recurrence]
- [Monitoring improvement]
- [Code change needed]

Follow-up Ticket: JIRA-XXXX
EOF
```

---

## Incident 2: Pub/Sub Message Backlog

**Alert:** "Pub/Sub oldest unacked message age > 1 hour"  
**MTTR Target:** 15 minutes

### Quick Diagnosis

```bash
# Check current backlog
gcloud pubsub subscriptions describe exam-submissions-subscription \
  --format='value(expirationPolicy)'

# Expected: <100 messages, <5 min age
# If >10K messages: Dataflow job is stuck
```

### Quick Fix

```bash
# Option 1: Drain and restart subscription
gcloud pubsub subscriptions seek exam-submissions-subscription --time='0s'

# Option 2: Increase Dataflow workers
JOB_ID=$(gcloud dataflow jobs list --filter="STATE:RUNNING" \
  --location=asia-south1 --format='value(id)' | head -1)

gcloud dataflow jobs update ${JOB_ID} \
  --autoscaling-algorithm=THROUGHPUT_BASED \
  --max-workers=20 \
  --location=asia-south1

# Option 3: If Dataflow is crashed, restart it
gcloud dataflow jobs drain ${JOB_ID} --location=asia-south1
sleep 300  # Wait 5 minutes for graceful shutdown
# Then redeploy from template
```

---

## Incident 3: BigQuery Load Errors

**Alert:** "BigQuery INSERT failed: schema mismatch"  
**MTTR Target:** 20 minutes

### Quick Diagnosis

```bash
# Check error messages in Dataflow
gcloud logging read "resource.type=cloud_dataflow_step AND \
  severity=ERROR" --limit=20 --format=short

# If "INVALID_FIELD": New field added to API but not BigQuery schema
# If "QUOTA_EXCEEDED": Quota limit reached
```

### Quick Fix

```bash
# Option 1: Add missing field to BigQuery
bq update school_erp_staging.exam_submissions \
  --schema_update_options=ALLOW_NULL_FIELD_ADDITION \
  --schema="
    submission_id:STRING,
    student_id:STRING,
    exam_id:STRING,
    school_id:STRING,
    submission_time:TIMESTAMP,
    duration_seconds:INTEGER,
    score:FLOAT,
    new_field:STRING  <-- Add here
  "

# Option 2: If quota exceeded, request increase or delete old data
bq query --use_legacy_sql=false \
  "DELETE FROM \`school-erp-staging.school_erp_staging.exam_submissions\`
   WHERE submission_time < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)"

# Wait for quota to refresh (usually immediate after deletion)
```

---

## Incident 4: High Request Latency (P99 > 500ms)

**Alert:** "P99 Latency > 500ms for 5+ minutes"  
**MTTR Target:** 10 minutes

### Quick Diagnosis

```bash
# Get P99 latency
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies" AND \
  resource.labels.service_name=exam-api-v2' \
  --format="table(metric.labels.request_latency_bucket)"

# Check which endpoints are slow
gcloud logging read "resource.type=cloud_run_revision AND \
  jsonPayload.duration_ms > 500" \
  --limit=30 --format=json | jq '.[]jsonPayload | {path, duration_ms}'
```

### Quick Fix

```bash
# Option 1: Check Firestore quota
gcloud firestore databases describe --location=asia-south1

# Option 2: Increase Cloud Run CPU
gcloud run deploy exam-api-v2 \
  --cpu=4 \
  --memory=2Gi \
  --region=asia-south1

# Option 3: Add caching for read-heavy endpoints
# (requires code change, deploy new version)

# Option 4: Scale up instances
gcloud run deploy exam-api-v2 \
  --min-instances=5 \
  --max-instances=200 \
  --region=asia-south1
```

---

## Incident 5: Database Connection Pool Exhausted

**Alert:** "Firestore: Too many concurrent connections"  
**MTTR Target:** 10 minutes

### Quick Diagnosis

```bash
# Check active connections
gcloud firestore databases describe --location=asia-south1 | grep -A5 connections

# Check if specific collection is bottleneck
gcloud logging read "jsonPayload.error:*connection*" --limit=20 --format=short
```

### Quick Fix

```bash
# Option 1: Restart API service (releases connections)
gcloud run services update-traffic exam-api-v2 \
  --to-revisions=$(gcloud run revisions list --format='value(name)' | head -1)=0

gcloud run services update-traffic exam-api-v2 \
  --to-revisions=$(gcloud run revisions list --format='value(name)' | head -1)=100

# Option 2: Increase max connections in API
gcloud run deploy exam-api-v2 \
  --update-env-vars="MAX_FIRESTORE_CONNECTIONS=10000" \
  --region=asia-south1

# Option 3: Implement connection pooling in code
# (requires code change, deploy new version)
```

---

## Common Alerts & Quick Actions

| Alert | Root Cause | Quick Action |
|-------|-----------|--------------|
| API 503 | Service crashed | Restart service |
| High CPU | Traffic spike | Scale up CPU |
| High Memory | Memory leak | Restart or upgrade |
| Pub/Sub lag | Dataflow stuck | Restart Dataflow |
| BigQuery errors | Schema mismatch | Add missing fields |
| DNS timeout | Network issue | Restart API |
| Auth failures | Credential expired | Refresh credentials |

---

## Escalation Matrix

| Symptom | First Action | If Still Down |
|---------|--------------|---------------|
| API down | Restart service | Rollback release |
| P99 > 1s | Scale CPU | Page on-call lead |
| Data loss | Page lead architect | Restore from backup |
| Multi-region down | Failover to other region | Page VP Engineering |

---

## Communication Template

**Slack #incidents channel:**
```
🚨 INCIDENT START

Severity: P1
Service: Exam API
Time: 2026-04-10 10:30 UTC
Status: INVESTIGATING

Description: "API health check failing, 503 errors"
Impact: "All users unable to access exams"
Lead: @oncall-engineer

Updates:
- 10:30 - Incident detected
- 10:32 - Root cause: Firestore quota exceeded
- 10:35 - Workaround: Disabled analytics pipeline
- 10:40 - RESOLVED, monitoring for recurrence
```

---

## Post-Incident Checklist

- [ ] Incident recorded in tracking system
- [ ] Root cause documented
- [ ] Monitoring dashboard updated
- [ ] Runbook updated (if needed)
- [ ] Alert threshold adjusted (if too noisy)
- [ ] Follow-up ticket created for prevention
- [ ] Post-mortem scheduled (within 24 hours)
- [ ] Team notified of learnings

---

## On-Call Rotation

**Week 1:** @backend-agent  
**Week 2:** @devops-agent  
**Week 3:** @data-agent  
**Week 4:** @qa-agent  

**Escalation chain:**
1. On-call engineer (5 min SLA)
2. On-call lead (attempt page at 10 min)
3. VP Engineering (page at 30 min)

---

## Quick Reference Commands

```bash
# Get current service status
gcloud run services describe exam-api-v2 --region=asia-south1 --format=json

# View recent revisions
gcloud run revisions list --service=exam-api-v2 --region=asia-south1 --limit=10

# Restart service immediately
gcloud run deploy exam-api-v2 --image=asia.gcr.io/.../exam-api-v2:latest --region=asia-south1

# Rollback to previous version
gcloud run services update-traffic exam-api-v2 --to-revisions=exam-api-v2-00001-abc=100

# View error logs
gcloud logging read "severity>=ERROR" --format=short --limit=50

# Get metrics
gcloud monitoring time-series list --filter='metric.type="run.googleapis.com/request_count"'
```

---

## Related Documentation

- **[STAGING_DEPLOYMENT_RUNBOOK.md](./STAGING_DEPLOYMENT_RUNBOOK.md)** - Deployment procedures
- **[DATA_PIPELINE_OPERATIONS.md](./DATA_PIPELINE_OPERATIONS.md)** - Data pipeline troubleshooting
- **[LOCAL_DEVELOPMENT_SETUP.md](./LOCAL_DEVELOPMENT_SETUP.md)** - Local dev issues
- **[ADR-GRACEFUL-DEGRADATION.md](../adr/ADR-GRACEFUL-DEGRADATION.md)** - Architecture context

---

## 24/7 Support

**Slack:** #incident-response  
**PagerDuty:** [school-erp-api](https://pagerduty.com/...)  
**Status Page:** [status.school-erp.io](https://status.school-erp.io)  
**War Room:** Zoom link in calendar event
