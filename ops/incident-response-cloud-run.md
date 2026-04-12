# Cloud Run Incident Response Runbook
## Emergency Procedures for School ERP API

**Document Version:** 1.0  
**Last Updated:** April 9, 2026  
**Audience:** DevOps Team, On-Call Engineers  

---

## 🚨 INCIDENT RESPONSE PROCEDURE

### When Alert Fires

1. **Acknowledge the alert immediately**
   - Check Slack channel: #alerts
   - Log into PagerDuty dashboard
   - Document start time

2. **Assess severity level**
   - **CRITICAL** (Red): Uptime <99.9%, errors >0.2%, latency >1s
   - **HIGH** (Orange): Errors >0.1%, latency >400ms, CPU >80%
   - **MEDIUM** (Yellow): CPU >70%, memory >75%, DDoS <100/min
   - **LOW** (Blue): Database latency >200ms, memory >85%

3. **Access monitoring dashboard**
   ```bash
   # Navigate to Cloud Monitoring Console
   https://console.cloud.google.com/monitoring/dashboards
   
   # List active dashboards
   gcloud monitoring dashboards list
   ```

---

## 📊 STEP-BY-STEP TROUBLESHOOTING

### 1. HIGH ERROR RATE INCIDENT (errors/sec > 0.001)

**Symptoms:** Alert fires when error rate exceeds 0.1%

**Immediate Actions (0-5 min):**
```bash
# 1. Check recent logs
gcloud logging read \
  'resource.type="cloud_run_revision" AND severity="ERROR"' \
  --limit 50 \
  --format json

# 2. Check error distribution
gcloud logging read \
  'resource.type="cloud_run_revision" AND httpRequest.status>=500' \
  --limit 100 \
  --format 'table(timestamp,httpRequest.status,jsonPayload.error)'

# 3. Check recent deployments
gcloud run revisions list \
  --service school-erp-api \
  --region us-central1 \
  --limit 5
```

**Investigation (5-10 min):**
```bash
# Check what changed in the last revision
gcloud run revisions describe REVISION_NAME \
  --service school-erp-api \
  --region us-central1

# Check current traffic split
gcloud run services describe school-erp-api \
  --region us-central1 \
  --format='value(status.traffic[*].[percent,revisionName])'

# Check database connection status
gcloud firestore operations list
```

**Resolution Options:**

**Option A: Rollback to previous revision**
```bash
# Identify stable previous revision
gcloud run revisions list \
  --service school-erp-api \
  --region us-central1 \
  --limit 10

# Roll back traffic
gcloud run services update-traffic school-erp-api \
  --to-revisions STABLE_REVISION=100 \
  --region us-central1

# Verify error rate recovers
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND metric.response_code_class="5xx"' \
  --interval-start-time "$(date --date='5 minutes ago' --iso-8601=seconds)" \
  --interval-end-time "$(date --iso-8601=seconds)"
```

**Option B: Scale down and restart**
```bash
# Reduce max instances (force restart of problematic instance)
gcloud run update school-erp-api \
  --max-instances=5 \
  --region us-central1

# Wait 2 minutes for new instances to spin up
sleep 120

# Scale back up
gcloud run update school-erp-api \
  --max-instances=50 \
  --region us-central1
```

**Option C: Fix code issue and hotfix deploy**
```bash
# Build new image with fix
docker build -t gcr.io/school-erp-prod/api:hotfix-$(date +%s) .
docker push gcr.io/school-erp-prod/api:hotfix-$(date +%s)

# Deploy hotfix
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:hotfix-TIMESTAMP \
  --region us-central1

# Monitor error rate
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count" AND metric.response_code_class="5xx"' \
  --interval-start-time NOW \
  --interval-end-time "$(date --date='5 minutes' --iso-8601=seconds)"
```

---

### 2. HIGH LATENCY INCIDENT (P95 > 400ms)

**Symptoms:** Request latency spikes above 400ms for p95

**Check Traffic Patterns:**
```bash
# Get request latency metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_latencies"' \
  --format='table(points[0].value.string_value,points[0].interval.end_time)'

# Identify slow endpoints
gcloud logging read \
  'resource.type="cloud_run_revision" AND httpRequest.latency>"400ms"' \
  --limit 20 \
  --format='table(timestamp,httpRequest.requestUrl,httpRequest.latency)'

# Check database latency
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/database/latencies"'
```

**Resolution:**
```bash
# Option 1: Scale up to handle load
gcloud run update school-erp-api \
  --min-instances=5 \
  --region us-central1

# Option 2: Check and optimize database queries
# Review Firestore slow queries
gcloud firestore bulk-delete \
  --database default

# Option 3: Enable request caching
# Update Cloud CDN configuration
gcloud compute backend-services update school-erp-backend \
  --enable-cdn
```

---

### 3. UPTIME ALERT (<99.9%)

**Symptoms:** Service availability drops

**Check Service Status:**
```bash
# Test health endpoint
curl -v https://api.schoolerp.io/health

# Check all regions
for region in us-central1 asia-south1 europe-west1; do
  echo "=== Region: $region ==="
  gcloud run services describe school-erp-api --region $region | grep "status:"
done

# Check load balancer status
gcloud compute backend-services get-health school-erp-backend \
  --region us-central1 \
  --global
```

**Resolution:**
```bash
# Option 1: Check Cloud Run service status
gcloud run services describe school-erp-api --region us-central1

# Option 2: Manually restart service
gcloud run services update school-erp-api \
  --update-env-vars RESTART_FLAG=$(date +%s) \
  --region us-central1

# Option 3: Switch to backup region
gcloud run services update-traffic school-erp-api \
  --to-revisions LATEST=70,PREV_STABLE=30 \
  --region asia-south1
```

---

### 4. HIGH CPU USAGE (>80%)

**Symptoms:** CPU utilization spike

**Check CPU Load:**
```bash
# Get CPU usage metrics
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/cpu_utilizations"' \
  --format='table(resource.label.service_name,points[0].value.double_value)' \
  --limit 5

# Check for memory leaks or runaway processes
gcloud logging read \
  'resource.type="cloud_run_revision" AND jsonPayload.process' \
  --limit 20

# Check number of active instances
gcloud run revisions list \
  --service school-erp-api \
  --region us-central1 \
  --format='value(name,status.conditions[0].lastTransitionTime,status.conditions[0].message)'
```

**Auto-scaling Action:**
```bash
# Trigger horizontal pod autoscaler
# This happens automatically, but verify:
gcloud run services describe school-erp-api \
  --region us-central1 \
  --format='value(status.conditions)'

# Monitor instance count
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/instance_count"' \
  --format='table(resource.label.service_name,points[0].value.int64_value)'

# If scaling not happening, manually trigger
gcloud run update school-erp-api \
  --max-instances=30 \
  --region us-central1
```

---

### 5. HIGH MEMORY USAGE (>85%)

**Symptoms:** Memory consumption critical

**Check Memory Status:**
```bash
# Get memory utilization
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/memory_utilizations"'

# Check for memory leaks in logs
gcloud logging read \
  'resource.type="cloud_run_revision" AND jsonPayload.memory' \
  --limit 20

# Check large object creation
gcloud logging read \
  'resource.type="cloud_run_revision" AND "MEMORY"' \
  --limit 50
```

**Resolution:**
```bash
# Option 1: Reduce job concurrency
gcloud run update school-erp-api \
  --concurrency 50 \
  --region us-central1

# Option 2: Increase container memory
gcloud run update school-erp-api \
  --memory 3Gi \
  --region us-central1

# Option 3: Restart all instances
gcloud run services update school-erp-api \
  --force-unlock \
  --region us-central1
```

---

### 6. DATABASE LATENCY HIGH (>200ms)

**Symptoms:** Firestore queries running slow

**Check Database Health:**
```bash
# Check Firestore metrics
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/database/latencies"'

# Check quota usage
gcloud firestore describe database

# Check for high write load
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/database/write_operations"'

# List active transactions
gcloud firestore operations list
```

**Resolution:**
```bash
# Option 1: Check indexes
gcloud firestore indexes list

# Option 2: Increase Firestore capacity (if on standard mode)
# Note: Consider migration to Firestore in Datastore mode for better scaling

# Option 3: Throttle write rate temporarily
# Implement client-side rate limiting

# Option 4: Check query performance
# Enable query logging in Firestore console
gcloud logging read \
  'resource.type="cloud_firestore_database" AND severity="ERROR"' \
  --limit 50
```

---

### 7. DDOS ATTACK DETECTED (blocked >100/min)

**Symptoms:** Alert triggers for blocked requests via CloudArmor

**Emergency Response:**
```bash
# 1. Check attack details
gcloud logging read \
  'resource.type="security_policy" AND severity>0' \
  --limit 100 \
  --format json | jq '.[] | {timestamp, severity, httpRequest}'

# 2. Identify attack source
gcloud logging read \
  'protoPayload.methodName=~"*.securitypolicies*"' \
  --format='table(protoPayload.request.sourceIPs)' \
  --limit 50

# 3. Get current security policy
gcloud compute security-policies rules list school-erp-policy

# 4. Add emergency block rules
gcloud compute security-policies rules create 1000 \
  --action deny \
  --security-policy school-erp-policy \
  --expression 'origin.regex_match("ATTACK_PATTERN")'
```

**Escalation:**
```bash
# Contact Lead Architect immediately
# Log incident in incident tracking system
# Page on-call SRE

# Scale up capacity if under load attack
gcloud run update school-erp-api \
  --max-instances=100 \
  --region us-central1

# Enable advanced DDoS protection
gcloud compute security-policies rules update 2000 \
  --security-policy school-erp-policy \
  --action deny-403

# Monitor attack status
watch 'gcloud logging read "resource.type=security_policy" --limit 1 --format json'
```

---

### 8. DEPLOYMENT FAILURE DETECTED

**Symptoms:** New deployment failed to start

**Check Deployment Status:**
```bash
# Get deployment details
gcloud run services describe school-erp-api \
  --region us-central1 \
  --format json | jq '.status.conditions'

# Check recent revisions
gcloud run revisions list \
  --service school-erp-api \
  --region us-central1 \
  --limit 5 \
  --format='table(name,status.conditions[0].type,status.conditions[0].status)'

# Check deployment logs
gcloud logging read \
  'resource.type="cloud_run_resource" AND severity="ERROR"' \
  --limit 50

# Check container startup issues
gcloud logging read \
  'resource.type="cloud_run_revision" AND "startup"' \
  --limit 20
```

**Roll Back:**
```bash
# Identify last successful revision
LAST_GOOD_REVISION=$(gcloud run revisions list \
  --service school-erp-api \
  --region us-central1 \
  --limit 3 \
  --format 'value(name)' | tail -1)

# Roll back to previous revision
gcloud run services update-traffic school-erp-api \
  --to-revisions $LAST_GOOD_REVISION=100 \
  --region us-central1

# Verify traffic restored
gcloud run services describe school-erp-api \
  --region us-central1 \
  --format='value(status.traffic[*].[percent,revisionName])'
```

---

## 🔧 PREVENTIVE MONITORING COMMANDS

**Monitor all metrics continuously:**
```bash
# Watch error rate in real-time
gcloud logging read \
  'resource.type="cloud_run_revision" AND severity="ERROR"' \
  --tail --format json | jq '.[] | {timestamp, severity, message}'

# Watch latency percentiles
watch -n 10 'gcloud monitoring time-series list \
  --filter="metric.type=run.googleapis.com/request_latencies" \
  --format="value(points[0].value)"'

# Monitor instance count changes
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/instance_count"' \
  --format='table(resource.label.service_name,points[0].value)'

# Watch dashboard in browser
open https://console.cloud.google.com/monitoring/dashboards
```

---

## 📞 ESCALATION CHAIN

**Level 1 (Resolve within 15 minutes):**
- On-call DevOps Engineer
- Contact: [Slack: @devops-oncall]
- Authority: View logs, restart services, scale resources

**Level 2 (Resolve within 30 minutes):**
- Lead DevOps Architect
- Contact: [Slack: @lead-devops]
- Authority: Modify security policies, manual failover, rollback

**Level 3 (Critical - within 10 minutes):**
- Lead Architect
- Contact: [Slack: @lead-architect] [Phone: +91-XXX-XXX-XXXX]
- Authority: Disable security rules, manual traffic management

**Level 4 (Business Impact):**
- CTO / Founder
- Contact: [Slack: @founder] [Email]
- Authority: Public communications, refunds/credits

---

## ✅ POST-INCIDENT CHECKLIST

After incident is resolved:

- [ ] Stop bleed (service restored)
- [ ] Document root cause in incident log
- [ ] Create post-mortem within 24 hours
- [ ] Identify 2-3 preventive actions
- [ ] Schedule action item completion
- [ ] Update runbook if needed
- [ ] Notify customer success team
- [ ] Adjust SLA credits if applicable

---

**Last Updated:** April 9, 2026  
**Next Review:** April 16, 2026  
**Owner:** DevOps Team
