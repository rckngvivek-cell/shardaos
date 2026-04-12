# INCIDENT RESPONSE RUNBOOKS - WEEK 6
**Purpose:** Standardized procedures for handling production incidents  
**Authority:** DevOps Agent + Lead Architect  
**Target SLA:** <30 minute MTTR

---

## 📋 RUNBOOK INDEX

1. **High Error Rate (>0.1%)**
2. **Service Downtime (<99.9% uptime)**
3. **Database Unavailable**
4. **Region Failover**
5. **Memory Leak Detection**
6. **DDoS Attack Response**
7. **Load Balancer Failure**
8. **SSL Certificate Expiration**

---

## RUNBOOK #1: HIGH ERROR RATE (>0.1%)
**Severity:** 🔴 CRITICAL  
**SLA:** Page on-call immediately  
**Target MTTR:** 15 minutes  

### Alert Trigger
- Error rate exceeds 0.1% for 5+ minutes
- Dashboard shows 4xx or 5xx responses increasing

### Immediate Actions (0-2 minutes)
1. Check Cloud Monitoring dashboard for error breakdown
   ```
   Dashboard: Performance Dashboard
   View: Error Rate by HTTP Status Code
   ```

2. Open recent error logs
   ```
   Cloud Logging: resource.type="cloud_run_revision"
   Filter: severity >= ERROR
   Time: Last 5 minutes
   ```

3. Identify error pattern
   - All endpoints affected? → Backend service crash
   - Specific endpoints? → Check recent code changes
   - 4xx errors? → Request validation issue
   - 5xx errors? → Backend processing error

### Investigation Steps (2-5 minutes)

**If Database Errors:**
```bash
# Check Firestore status
gcloud firestore query --collection users --limit 1

# View connection pool
gcloud sql instances describe deerflow-prod

# Check replication lag
gcloud firestore databases describe
```

**If Backend Crash:**
```bash
# Check Cloud Run revision status
gcloud run services describe deerflow-backend --region asia-south1

# View recent deployments
gcloud run services describe deerflow-backend --region asia-south1 | grep -A 5 traffic

# Check service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=deerflow-backend AND severity >= ERROR" --limit 50 --format json
```

**If Memory Issues:**
```bash
# Check memory metrics
gcloud monitoring time-series read \
  --filter='resource.type="cloud_run_revision" AND metric.type="run.googleapis.com/request_utilization"'

# View memory growth
gcloud logging read "resource.type=cloud_run_revision" --limit 100 | grep memory
```

### Resolution Steps (5-15 minutes)

**Option A: Deploy Fix**
- If issue is in recent code change:
  ```bash
  # Rollback to previous revision
  gcloud run services update-traffic deerflow-backend \
    --to-revisions REVISION_ID=100 \
    --region asia-south1
  ```

**Option B: Scale Out**
- If overloaded:
  ```bash
  # Manually increase instances
  gcloud run services update deerflow-backend \
    --min-instances 5 \
    --max-instances 20 \
    --region asia-south1
  ```

**Option C: Restart Service**
- If crash/memory leak:
  ```bash
  # Deploy new revision (forces restart)
  gcloud run deploy deerflow-backend \
    --image gcr.io/school-erp-prod/backend:latest \
    --region asia-south1
  ```

### Verification (15-20 minutes)
```bash
# Monitor error rate - should drop below 0.05%
gcloud monitoring query "run.googleapis.com/request_count" \
  --filter='resource.labels.service_name="deerflow-backend"'

# Verify no new errors in logs
gcloud logging read "resource.type=cloud_run_revision AND severity >= ERROR" --limit 10
```

### Communication
- **Team Chat:** Posted to #incident channel
- **Status Page:** Update if >5 minute outage
- **Customer Support:** Notify if user-impacting

### Post-Incident Review (within 2 hours)
- [ ] Root cause identified
- [ ] Fix deployed to production
- [ ] Monitoring enhanced to catch earlier
- [ ] Team debriefed on resolution

---

## RUNBOOK #2: SERVICE DOWNTIME (<99.9% UPTIME)
**Severity:** 🔴 CRITICAL  
**SLA:** Page on-call immediately + escalate to lead  
**Target MTTR:** 5 minutes

### Alert Trigger
- Uptime <99.9% for 10+ minutes
- Combined request count near zero
- Multiple regions failing simultaneously

### Immediate Actions (0-1 minute)
1. **Check all 3 regions simultaneously:**
   ```bash
   for region in asia-south1 us-central1 europe-west1; do
     echo "Region: $region"
     gcloud run services describe deerflow-backend --region $region
   done
   ```

2. **Verify load balancer is routing:**
   ```bash
   gcloud compute forwarding-rules describe school-erp-global-https --global
   ```

3. **Page on-call + escalate to lead immediately**

### Investigation Steps (1-3 minutes)

**Check Service Status:**
```bash
# All Cloud Run services
gcloud run services list

# Check for recent deployments
gcloud run operations list --region asia-south1

# Verify no quota issues
gcloud compute project-info describe --project school-erp-prod
```

**Check Network:**
```bash
# Firewall rules
gcloud compute security-policies describe school-erp-cloudarmor-waf

# Load balancer health checks
gcloud compute health-checks describe school-erp-https-health-check
```

**Check Database:**
```bash
# Firestore availability
gcloud firestore databases list

# Check backup status
gcloud firestore backups list
```

### Resolution Steps (3-5 minutes)

**If Service Down:**
```bash
# Manual restart
gcloud run deploy deerflow-backend \
  --image gcr.io/school-erp-prod/backend:latest \
  --region asia-south1
```

**If Load Balancer Issue:**
```bash
# Recreate forwarding rule
gcloud compute forwarding-rules delete school-erp-global-https --global --quiet
gcloud compute forwarding-rules create school-erp-global-https \
  --global \
  --target-https-proxy school-erp-https-proxy \
  --address 34.1.2.3
```

**If Database Issue:**
```bash
# Trigger failover
gcloud firestore databases describe
# Contact GCP - may need manual intervention
```

### Verification (5-10 minutes)
- [ ] All 3 regions showing healthy
- [ ] Load balancer routing traffic
- [ ] Error rate <0.1%
- [ ] Requests/second recovering
- [ ] Users can authenticate + access system

### Communication
- **Executive:** Page immediately
- **Team:** #incident channel + SMS
- **Status Page:** "Investigating" → "Resolved"
- **Customers:** Proactive notification

---

## RUNBOOK #3: DATABASE UNAVAILABLE
**Severity:** 🔴 CRITICAL (System Non-Functional)  
**SLA:** Page on-call + database admin  
**Target MTTR:** 10 minutes

### Alert Trigger
- Firestore connection failures >5%
- Database read/write latency >5 seconds
- Failed authentication against database

### Immediate Actions
1. **Verify database status:**
   ```bash
   gcloud firestore databases describe --database-id='(default)'
   ```

2. **Check replication status:**
   ```bash
   gcloud firestore backups list
   gcloud firestore backup-schedules list
   ```

3. **Page database admin + on-call**

### Investigation Steps
```bash
# Check database metrics
gcloud monitoring query "firestore.googleapis.com/database/operation_count" \
  --filter='metric.response_code="PERMISSION_DENIED"'

# View recent errors
gcloud logging read "resource.type=firestore_database AND severity >= ERROR"
```

### Resolution Steps

**If Firestore Down (GCP Service Issue):**
- Contact GCP support immediately
- Activate backup failover if configured
- Status: https://status.cloud.google.com/

**If Connection Pool Exhausted:**
```bash
# Check connection limits in backend config
# Reduce max connections or increase pool size
# Update in backend deployment
```

**If Backup Needed:**
```bash
# Restore from backup
gcloud firestore databases restore <backup-id> --database-id='(default)'
```

### Verification
- [ ] Database responding to queries
- [ ] Read/write latency <100ms
- [ ] Replication sync'd across regions
- [ ] Connection pool healthy
- [ ] Application queries success rate >99%

---

## RUNBOOK #4: REGION FAILOVER (PRIMARY DOWN)
**Severity:** 🔴 CRITICAL  
**SLA:** Automatic failover <30 seconds + manual verification  
**Target RTO:** 2 minutes

### Automatic Failover (Cloud Infrastructure Handles)
- Health check fails on asia-south1 (3 × 10 sec = 30 seconds)
- Load balancer automatically shifts traffic
- New distribution: us-central1 70%, europe-west1 30%
- Alert fires to on-call engineer

### Manual Verification Steps (0-2 minutes)

1. **Verify failover occurred:**
   ```bash
   # Check load balancer traffic weights
   gcloud compute backend-services get-health backend-service-asia
   gcloud compute backend-services get-health backend-service-us
   gcloud compute backend-services get-health backend-service-eu
   ```

2. **Monitor traffic shifting:**
   - Open Performance Dashboard
   - Watch QPS distribution across regions
   - Should show traffic leaving asia-south1

3. **Verify secondary regions healthy:**
   ```bash
   for region in us-central1 europe-west1; do
     gcloud run services describe deerflow-backend --region $region
   done
   ```

### Investigation Steps (2-5 minutes)

**Why Did Primary Fail?**
```bash
# Check Cloud Run service status
gcloud run services describe deerflow-backend --region asia-south1

# View recent errors/crashes
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=deerflow-backend \
  AND resource.labels.location=asia-south1" --limit 50

# Check resource quotas
gcloud compute project-info describe --format="value(quotas[])"
```

### Recovery Steps (5-15 minutes)

**Option 1: Fix and Bring Primary Back**
```bash
# Deploy fix or restart
gcloud run deploy deerflow-backend \
  --image gcr.io/school-erp-prod/backend:latest \
  --region asia-south1

# Verify health
gcloud run services describe deerflow-backend --region asia-south1
```

**Option 2: Gradual Traffic Shift Back**
```bash
# Wait 5 minutes for service to stabilize
# Then shift traffic back gradually
gcloud compute backend-services update backend-service-asia \
  --global

# Monitor for 10 minutes
```

### Post-Failover Checklist
- [ ] Primary region healthy or being repaired
- [ ] Secondary regions handling load
- [ ] No error rate spike during failover
- [ ] Database replication sync'd
- [ ] Status page updated to "Resolved"
- [ ] Post-incident review scheduled

---

## RUNBOOK #5: MEMORY LEAK DETECTION
**Severity:** 🟡 WARNING (Performance Degradation)  
**SLA:** Address within 1 hour  
**Target:** Prevent OOM kill

### Alert Trigger
- Memory utilization >85%
- Memory growing consistently over time
- OOM kills in logs

### Investigation Steps

1. **Identify affected service:**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision AND (text_payload=~'.*OOM.*' OR text_payload=~'.*Out of memory.*')"
   ```

2. **Analyze memory trends:**
   ```bash
   gcloud monitoring query "run.googleapis.com/request_utilization" \
     --filter='resource.labels.metric_name="memory"' \
     --format json
   ```

3. **Check service logs for patterns:**
   ```bash
   # Look for repetitive allocation
   gcloud logging read "resource.type=cloud_run_revision" \
     --limit 1000 | grep -i "memory\|cache\|buffer"
   ```

### Resolution Steps

**Short-term (Immediate):**
```bash
# Increase memory allocation per instance
gcloud run services update deerflow-backend \
  --memory 3Gi \
  --region asia-south1

# Deploy new revision to force restart
gcloud run deploy deerflow-backend \
  --image gcr.io/school-erp-prod/backend:latest \
  --region asia-south1
```

**Long-term (Within 24 hours):**
1. Code review recent changes for memory leaks
2. Use profiling tools:
   ```bash
   # Enable CPU/memory profiling in backend
   # Generate heap dump
   # Analyze with VS Code or Chrome DevTools
   ```
3. Deploy fix with profiling enabled
4. Monitor memory over multiple days

---

## RUNBOOK #6: DDoS ATTACK RESPONSE
**Severity:** 🔴 CRITICAL  
**SLA:** Escalate immediately  
**Target:** Absorb attack, maintain service

### Attack Detection (Auto-triggered by CloudArmor)

1. **Automatic response:**
   - Rate limiting activates (1000 req/min per IP)
   - Blocking IPs that exceed threshold
   - Logging all blocked requests
   - Metrics updated in real-time

2. **Alert sent:** #incident channel + on-call paged

### Investigation Steps

```bash
# View Cloud Armor logs
gcloud logging read "resource.type=http_load_balancer \
  AND policy_name=school-erp-cloudarmor-waf" --limit 100

# Identify attack pattern
# - Single IP? Multiple IPs?
# - Specific endpoints? All endpoints?
# - Request types? (GET, POST, etc)

# Check attack stats
gcloud compute security-policies rules describe --security-policy school-erp-cloudarmor-waf
```

### Mitigation Steps

1. **Verify CloudArmor Rules Active:**
   ```bash
   gcloud compute security-policies describe school-erp-cloudarmor-waf
   ```

2. **Manual IP Blocking (if needed):**
   ```bash
   # Add custom rule to block specific IPs
   gcloud compute security-policies rules create 50000 \
     --security-policy school-erp-cloudarmor-waf \
     --action "deny-403" \
     --expression "origin.ip in ['1.2.3.4', '1.2.3.5']" \
     --description "Blocking known attack IPs"
   ```

3. **Scale out if needed:**
   ```bash
   gcloud run services update deerflow-backend \
     --max-instances 30 \
     --region asia-south1
   ```

4. **Update status page:**
   - "We're experiencing elevated traffic. Our DDoS protection is active."

### Communication
- **Status Page:** Immediate update
- **Customers:** "Service performance may be impacted"
- **GCP Support:** Notify for attack patterns analysis

### Post-Attack Review
- [ ] Attack duration / peak traffic
- [ ] Attack pattern identified
- [ ] CloudArmor effectiveness verified
- [ ] Permanent rules added if pattern repeats
- [ ] Capacity planning updated

---

## RUNBOOK #7: LOAD BALANCER FAILURE
**Severity:** 🔴 CRITICAL  
**SLA:** Page on-call + network team  
**Target MTTR:** 5 minutes

### Alert Trigger
- Forwarding rule not accepting traffic
- Health checks all failing
- SSL certificate issues

### Investigation

```bash
# Check forwarding rule
gcloud compute forwarding-rules describe school-erp-global-https --global

# Check target HTTPS proxy
gcloud compute target-https-proxies describe school-erp-https-proxy

# Check SSL cert status
gcloud compute ssl-certificates describe api-schoolerp-com-cert

# Check backend health
gcloud compute backend-services get-health backend-service-asia --global
gcloud compute backend-services get-health backend-service-us --global
gcloud compute backend-services get-health backend-service-eu --global
```

### Resolution

```bash
# Recreate forwarding rule if corrupted
gcloud compute forwarding-rules delete school-erp-global-https --global --quiet
gcloud compute forwarding-rules create school-erp-global-https \
  --global \
  --target-https-proxy school-erp-https-proxy \
  --address [existing-IP] \
  --port-range 443

# Verify
gcloud compute forwarding-rules describe school-erp-global-https --global
```

---

## RUNBOOK #8: SSL CERTIFICATE EXPIRATION
**Severity:** 🟡 WARNING (Scheduled Prevention)  
**SLA:** Update before expiry  
**Target:** Zero surprises

### Monitoring (Ongoing)

```bash
# Check certificate expiry
gcloud compute ssl-certificates describe api-schoolerp-com-cert
# Look for: expireTime field

# Auto-renewal configured
# Google Cloud automatically renews 30 days before expiry
```

### If Manual Update Needed

```bash
# Upload new cert
gcloud compute ssl-certificates create api-schoolerp-com-cert-new \
  --certificate /path/to/cert.crt \
  --private-key /path/to/key.key

# Update HTTPS proxy
gcloud compute target-https-proxies update school-erp-https-proxy \
  --ssl-certificates api-schoolerp-com-cert-new

# Verify
gcloud compute forwarding-rules describe school-erp-global-https --global
```

---

## 📞 ESCALATION CHAIN

| Level | Contact | Time | Action |
|-------|---------|------|--------|
| 1 | On-call engineer | 2 min | Execute runbook |
| 2 | Secondary on-call | 5 min | Assist / escalate |
| 3 | Lead DevOps | 10 min | Strategic decisions |
| 4 | Project Manager | 15 min | Executive escalation |

---

## 🎯 INCIDENT TRACKING

**Template for each incident:**
```
Title: [Service] - [Issue] on [Date/Time]
Severity: 🔴 CRITICAL / 🟡 WARNING
Start Time: [UTC time]
End Time: [UTC time]
Duration: [minutes]
MTTR: [minutes]
Root Cause: [description]
Resolution: [what was done]
Prevention: [what changed to avoid repeat]
```

---

**Created:** April 9, 2026  
**Review Date:** April 14, 2026 (Weekly)  
**Version:** 1.0 - Week 6 Launch

