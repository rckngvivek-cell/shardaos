# Incident Response Runbooks - School ERP Production

## Table of Contents
1. [High Error Rate (P0)](#high-error-rate-p0)
2. [API Latency Spike (P0)](#api-latency-spike-p0)
3. [Notification Service Failures (P1)](#notification-service-failures-p1)
4. [Cloud Run Out of Capacity (P1)](#cloud-run-out-of-capacity-p1)
5. [Firestore Quota Exceeded (P0)](#firestore-quota-exceeded-p0)
6. [Zero Traffic/Potential Outage (P0)](#zero-trafficpotential-outage-p0)

---

## High Error Rate (P0)

**Alert Trigger:** Error rate > 5% for 3 minutes

**Impact:** Users unable to use core platform features  
**Target RTO:** 15 minutes

### Step 1: Immediate Investigation (5 min)

```bash
# 1.1 Check current error rate
gcloud logging read \
  "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit 100 \
  --format="table(timestamp,jsonPayload.error_message)" \
  --project=school-erp-prod

# 1.2 Check API latency
gcloud monitoring read \
  'metric.type="custom.googleapis.com/api_latency"' \
  --filter='resource.type="cloud_run_revision"' \
  --project=school-erp-prod

# 1.3 Check Cloud Run instance health
gcloud run services describe school-erp-api \
  --region us-central1 \
  --project=school-erp-prod \
  --format="table(status.conditions[].type,status.conditions[].status)"

# 1.4 Check Firestore connectivity
gcloud firestore databases describe school-erp-prod \
  --project=school-erp-prod
```

### Step 2: Triage (5 min)

**If error type is database-related:**
- Connection pool exhaustion? → Scale Firestore
- Quota exceeded? → Go to [Firestore Quota Exceeded](#firestore-quota-exceeded-p0)

**If error type is timeout (>1s):**
- Go to [API Latency Spike](#api-latency-spike-p0)

**If error type is deployment-related:**
- Recent deploy in last 30 min? → Rollback
- See: [Rollback Procedure](#rollback-procedure)

### Step 3: Recovery Options (RTO: 15 min)

**Option A: Immediate Rollback (Recommended)**
```bash
cd /path/to/infra
chmod +x scripts/rollback.sh
./scripts/rollback.sh --force
```

**Option B: Scale Up Resources**
```bash
# Increase min instances from 2 to 5
gcloud run services update school-erp-api \
  --region us-central1 \
  --min-instances=5 \
  --project=school-erp-prod
```

**Option C: Restart Service**
```bash
# Force refresh (last resort)
gcloud run services update school-erp-api \
  --region us-central1 \
  --set-env-vars=FORCE_RESTART=$(date +%s) \
  --project=school-erp-prod
```

### Step 4: Verify Recovery

```bash
# Monitor error rate for 10 minutes
watch -n 30 'gcloud logging read \
  "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit 50 \
  --project=school-erp-prod \
  --format="value(severity)" | sort | uniq -c'
```

---

## API Latency Spike (P0)

**Alert Trigger:** P99 latency > 1 second or P95 > 500ms  
**Impact:** Slow application performance  
**Target RTO:** 10 minutes

### Step 1: Root Cause Analysis (5 min)

```bash
# 1.1 Check resource utilization
gcloud monitoring read \
  'metric.type="run.googleapis.com/container/cpu/utilizations"' \
  --project=school-erp-prod

gcloud monitoring read \
  'metric.type="run.googleapis.com/container/memory/utilizations"' \
  --project=school-erp-prod

# 1.2 Check Firestore operation latency
gcloud logging read \
  'resource.type=firestore_database AND jsonPayload.latency_ms > 1000' \
  --limit 50 \
  --project=school-erp-prod \
  --format="table(timestamp,jsonPayload.operation,jsonPayload.latency_ms)"

# 1.3 Check request breakdown by endpoint
gcloud logging read \
  'resource.type=cloud_run_revision' \
  --limit 200 \
  --project=school-erp-prod \
  --format="table(jsonPayload.path,jsonPayload.response_time_ms)" | \
  sort -k2 -nr | head -20

# 1.4 Check for hot database collections
gcloud logging read \
  'resource.type=firestore_database' \
  --limit 100 \
  --project=school-erp-prod \
  --format="table(jsonPayload.collection,jsonPayload.operation_count)"
```

### Step 2: Strategic Response

**If CPU/Memory > 90%:**
```bash
# Increase resource allocation
gcloud run services update school-erp-api \
  --memory 4Gi \
  --cpu 4 \
  --min-instances 3 \
  --region us-central1 \
  --project=school-erp-prod
```

**If Firestore reads/writes are slow:**
```bash
# Check for missing indexes
gcloud firestore indexes list \
  --database=school-erp-prod \
  --project=school-erp-prod

# Monitor composite indexes
# Manual index creation if needed:
# gcloud firestore indexes create --config=firestore.indexes.json
```

**If specific endpoint is slow:**
```bash
# Check Redis cache hit rate
gcloud redis instances describe school-erp-cache \
  --region us-central1 \
  --project=school-erp-prod

# Clear cache if needed
gcloud redis instances flush-cache school-erp-cache \
  --region us-central1 \
  --project=school-erp-prod
```

### Step 3: Recovery

**Option A: Scale Horizontally**
```bash
gcloud run services update school-erp-api \
  --max-instances=20 \
  --min-instances=5 \
  --region us-central1 \
  --project=school-erp-prod
```

**Option B: Enable Request Caching**
```bash
# Temporary cache headers: request re-routing to cached content
# (Requires code deployment - as interim)
gcloud run services update school-erp-api \
  --memory 3Gi \
  --region us-central1 \
  --project=school-erp-prod
```

### Step 4: Monitor Recovery (10 min)

```bash
# Continuous latency monitoring
while true; do
  gcloud monitoring read \
    'metric.type="custom.googleapis.com/api_latency"' \
    --filter='resource.type="cloud_run_revision"' \
    --project=school-erp-prod \
    --format="table(points[0].value.double_value)" | tail -1
  sleep 10
done
```

---

## Notification Service Failures (P1)

**Alert Trigger:** SMS/Email/Push delivery < 99%  
**Impact:** Notifications not reaching users  
**Target RTO:** 20 minutes

### Step 1: Check Service Status

```bash
# 1.1 Check Pub/Sub subscription health
gcloud pubsub subscriptions describe school-erp-notifications-sub \
  --project=school-erp-prod

# 1.2 Check DLQ size
gcloud pubsub subscriptions pull school-erp-notifications-dlq-sub \
  --limit=10 \
  --format="table(ackId,message.data,message.attributes)" \
  --project=school-erp-prod

# 1.3 Monitor recent failures
gcloud logging read \
  'jsonPayload.notification_type:* AND severity=ERROR' \
  --limit 100 \
  --project=school-erp-prod \
  --format="table(timestamp,jsonPayload.service,jsonPayload.error)"

# 1.4 Check Twilio/SendGrid/FCM quota
# (See respective service documentation)
```

### Step 2: Service-Specific Troubleshooting

**SMS (Twilio) Failures:**
```bash
# Check Twilio API authentication
gcloud secrets versions access latest --secret="twilio-account-sid" \
  --project=school-erp-prod

# Verify Twilio credentials are current
# (Set env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
```

**Email (SendGrid) Failures:**
```bash
# Check SendGrid API key
gcloud secrets versions access latest --secret="sendgrid-api-key" \
  --project=school-erp-prod

# Monitor bounces/blocks
gcloud logging read \
  'jsonPayload.service="sendgrid"' \
  --limit 50 \
  --project=school-erp-prod
```

**Push (FCM) Failures:**
```bash
# Check FCM server key
gcloud secrets versions access latest --secret="fcm-server-key" \
  --project=school-erp-prod

# Monitor invalid device tokens
gcloud logging read \
  'jsonPayload.service="fcm" AND jsonPayload.error="InvalidToken"' \
  --limit 100 \
  --project=school-erp-prod
```

### Step 3: Recovery

**Process DLQ:**
```bash
# Manually reprocess failed messages
gcloud pubsub subscriptions pull school-erp-notifications-dlq-sub \
  --auto-ack \
  --limit=100 \
  --project=school-erp-prod

# Re-publish to main topic for retry
# (Requires custom Cloud Function to parse and republish)
```

**Restart Notification Cloud Function:**
```bash
# Redeploy to force fresh start
gcloud functions deploy notify-dispatcher \
  --region us-central1 \
  --runtime nodejs18 \
  --trigger-topic school-erp-notifications \
  --project=school-erp-prod
```

---

## Cloud Run Out of Capacity (P1)

**Alert Trigger:** Requests queuing, high latency despite low error rate  
**Target RTO:** 10 minutes

### Step 1: Check Current Load

```bash
# Check request count per instance
gcloud monitoring read \
  'metric.type="run.googleapis.com/request_count"' \
  --project=school-erp-prod \
  --format="table(resource.labels.service_name,points[0].value)"

# Check active connections
gcloud logging read \
  'resource.type=cloud_run_revision' \
  --limit 100 \
  --project=school-erp-prod \
  --format="table(jsonPayload.active_connections)"
```

### Step 2: Scale Up

```bash
# Immediately increase min instances
gcloud run services update school-erp-api \
  --min-instances=5 \
  --max-instances=30 \
  --region us-central1 \
  --project=school-erp-prod

# Monitor scale-up progress
gcloud run services describe school-erp-api \
  --region us-central1 \
  --project=school-erp-prod | grep -A 5 "Instance"
```

### Step 3: Enable Request Throttling

```bash
# Update load balancer rate limiting
# (Requires Terraform update)
# Edit: infra/terraform/modules/global-load-balancer/main.tf
# rate_limit_threshold.count = 150 (increased from 100)
```

---

## Firestore Quota Exceeded (P0)

**Alert Trigger:** Firestore quota error  
**Impact:** Read/write operations fail  
**Target RTO:** 15 minutes

### Step 1: Identify Quota

```bash
# Check quota dashboard
gcloud firestore databases describe school-erp-prod \
  --project=school-erp-prod

# Check recent operations
gcloud logging read \
  'resource.type=firestore_database AND severity=ERROR' \
  --limit 50 \
  --project=school-erp-prod
```

### Step 2: Request Quota Increase

```bash
# For reads/writes quota
gcloud compute project-info describe \
  --project=school-erp-prod \
  --format="value(quotas[])"

# Request increase via Cloud Console:
# IAM & Admin → Quotas → Filter: "Firestore Reads/Writes"
# Select → Request Quota Increase → Set new limit
```

### Step 3: Interim Mitigations

**Reduce read operations:**
```bash
# Increase cache TTL temporarily
gcloud run services update school-erp-api \
  --set-env-vars="CACHE_TTL=600" \
  --region us-central1 \
  --project=school-erp-prod
```

**Batch writes instead of individual:**
```bash
# Requires code deployment - implement batch operations
```

**Temporarily disable non-critical features:**
```bash
gcloud run services update school-erp-api \
  --set-env-vars="DISABLE_ANALYTICS=true" \
  --region us-central1 \
  --project=school-erp-prod
```

---

## Zero Traffic/Potential Outage (P0)

**Alert Trigger:** Zero requests for 5 minutes  
**Impact:** Complete service unavailability  
**Target RTO:** 5 minutes

### Step 1: Immediate Triage

```bash
# 1.1 Check if service exists
gcloud run services list \
  --region us-central1 \
  --project=school-erp-prod | grep school-erp-api

# 1.2 Check service status
gcloud run services describe school-erp-api \
  --region us-central1 \
  --project=school-erp-prod \
  --format="table(status.conditions[].reason,status.conditions[].message)"

# 1.3 Check load balancer
gcloud compute backend-services describe school-erp-global-lb \
  --global \
  --project=school-erp-prod | grep -A 5 "backends"

# 1.4 Check DNS resolution
nslookup api.school-erp.com
dig api.school-erp.com
```

### Step 2: Recovery

**If service is down:**
```bash
# Redeploy from last working image
gcloud run deploy school-erp-api \
  --image=gcr.io/school-erp-prod/school-erp-api:latest \
  --region us-central1 \
  --project=school-erp-prod
```

**If load balancer is unhealthy:**
```bash
# Check health check configuration
gcloud compute health-checks describe school-erp-api-health-check \
  --global \
  --project=school-erp-prod

# Manually trigger health check
curl -I https://api.school-erp.com/health
```

**If DNS issue:**
```bash
# Check DNS record
gcloud dns record-sets list \
  --zone=school-erp-zone \
  --project=school-erp-prod

# Update DNS if needed
gcloud dns record-sets transaction start \
  --zone=school-erp-zone \
  --project=school-erp-prod
```

### Step 3: Failover to Secondary Region (if needed)

```bash
# Activate Asia-South1 load balancer
cd /path/to/infra
./scripts/disaster-recovery.sh failover-execute
```

---

## Post-Incident Actions

### Within 1 Hour

- [ ] Create incident ticket with slack/jira ID
- [ ] Document timeline and root cause
- [ ] Notify stakeholders via email
- [ ] Update incident status page

### Within 24 Hours

- [ ] Conduct blameless postmortem
- [ ] Identify preventive measures
- [ ] Create action items (P0/P1/P2/P3)
- [ ] Update runbooks if needed

### Follow-up

- [ ] Implement fixes for identified issues
- [ ] Deploy changes and test
- [ ] Update monitoring/alerts if needed
- [ ] Close incident ticket
