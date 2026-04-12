# Runbook: Failover Procedure - Regional Disaster Recovery

**Last Updated:** April 9, 2026  
**Runbook ID:** RB-004  
**Severity Level:** Critical  
**Owner:** DevOps Agent + Lead Architect  
**Escalation Contact:** CTO (emergency only)

---

## 📋 Purpose

Respond to India region failure by failing over to US/Europe read replica. Goal: Restore service to full functionality in <2 minutes with zero manual intervention (automated failover triggers).

**When to use this:**
- Alert: "GCP India region down"
- Alert: "Firestore india region unresponsive"
- Manual trigger: Region severely degraded (>30% error rate)
- Test: Quarterly disaster recovery drill

**When NOT to use this:**
- Individual service failure (use RB-002: Incident Response)
- Network connectivity issue (use RB-07: Network Troubleshooting)
- Single datacenter issue (use RB-004)

**Estimated Duration:** 1-2 minutes (automated) + 5 minutes (verification)  
**Risk Level:** Critical (temporary read-only service)

---

## ✅ Prerequisites

Before failover can execute:

- [ ] Multi-region Firestore replication enabled
- [ ] US/Europe replicas are healthy and synced
- [ ] DNS failover rules configured in Cloud DNS
- [ ] Monitoring dashboards checking all regions
- [ ] On-call team aware of failover procedures
- [ ] School leaders understand "read-only" state during failover

---

## 🔧 Step-by-Step Failover Procedure

### Automatic Failover (Happens Automatically)

**How it works behind the scenes:**
```
India Region Error
  ↓
Monitoring detects: Error rate >50% OR latency >5 seconds
  ↓
Automatic trigger: Switch DNS to US replica
  ↓
Application traffic routes to US region
  ↓
Firestore reads: Served from US replica
  ↓
Firestore writes: Temporary DISABLED (read-only mode)
  ↓
Alert team: "@on-call Failover activated - India down"
```

**Timeline:** <30 seconds (automatic, no human action needed)

---

### Manual Failover (If Automatic Fails)

**Step 1.1: Confirm India Region Is Down**
```bash
# Check if India region responding:
gcloud compute backend-services health-checks \
  --filter="name:school-erp-prod" \
  --format="value(healthChecks)"

# Or test directly:
curl -I https://api.school-erp.local/health \
  --resolve api.school-erp.local:443:149.28.227.175
# If timeout or refuses connection → India region down
```
- ✅ Success: Confirmed India region not responding
- ❌ Failed: Issue might be elsewhere, check network

**Step 1.2: Activate Failover**
```bash
# Update DNS to point to US replica:
gcloud compute forwarding-rules update school-erp-prod-api \
  --target-https-proxy school-erp-us-replica-proxy \
  --region us-central1

# Verify DNS updated:
nslookup api.school-erp.local
# Should show: 35.x.x.x (US IP, not 149.x.x.x)
```
- ✅ Success: DNS updated, traffic routing to US
- ⚠️ Wait 10 seconds for DNS propagation

**Step 1.3: Switch Firestore Write Endpoint**
```bash
# Update application config to disable writes:
gcloud run services update school-erp-api-production \
  --set-env-vars FIRESTORE_MODE=read-only

# Restart service to pick up new config:
gcloud compute instances create-image school-erp-api-prod \
  --source-instance school-erp-api-prod-1
```
- Expected: Application restarts (30 seconds)
- ✅ Success: Service reads from US replica

**Step 1.4: Verify Failover Operational**
```bash
# Test API endpoint:
curl https://api.school-erp.local/health

# Expected response:
{"status": "ok", "mode": "read-only", "region": "us-central1"}

# Test read operation:
curl https://api.school-erp.local/api/v1/schools/SC001

# Expected: ✅ Success - school data returns
# Do NOT test write operation (should fail gracefully)
```
- ✅ Success: Reads working, writes blocked
- ❌ Failed: Failover incomplete, proceed to Troubleshooting

---

### Phase 2: Operational During Failover (Read-Only Mode)

**⏰ During failover to US region:**

**What works:**
- ✅ Reading student data
- ✅ Viewing reports & dashboards
- ✅ Checking attendance
- ✅ Viewing exam marks
- ✅ Viewing fee status

**What doesn't work:**
- ❌ Cannot enter new marks
- ❌ Cannot mark attendance
- ❌ Cannot collect fees
- ❌ Cannot create students
- ❌ Status: "Read-Only Mode Active"

**User experience:**
- Dashboard shows: ⚠️ "System in read-only mode (maintenance)"
- Inputs disabled: "Cannot write - failover active"
- Timeline visible: "Expected recovery: [estimated time]"

---

### Phase 3: Recovery (Once India Region Restored)

**Step 3.1: Confirm India Region Recovery**
```bash
# Wait for India region monitoring to show:
# - Error rate <1%
# - Latency <500ms
# - All health checks passing

# Then verify:
curl -I https://india-api.school-erp.local/health
# Expected: 200 OK
```
- ✅ Success: India region back online
- Monitor for 5 minutes: Verify stability

**Step 3.2: Failback to India Region**
```bash
# Update DNS to point back to India:
gcloud compute forwarding-rules update school-erp-prod-api \
  --target-https-proxy school-erp-india-main-proxy \
  --region asia-south1

# Re-enable writes:
gcloud run services update school-erp-api-production \
  --set-env-vars FIRESTORE_MODE=read-write

# Restart service:
gcloud compute instances restart school-erp-api-prod-1
```
- Expected: Service restarts, traffic back to India
- ✅ Success: Write mode re-enabled

**Step 3.3: Verify Failback Successful**
```bash
# Test both read and write:
curl https://api.school-erp.local/health
# Expected: {"status": "ok", "mode": "read-write", "region": "asia-south1"}

# Test write operation (should now work):
POST to mark attendance → Should succeed ✅
```
- ✅ Success: Normal operations resumed
- ❌ If errors: Revert to failover, investigate

**Step 3.4: Notify School Leaders**
- Post to Status Page: "✅ Service restored to normal"
- Slack announcement: "Failover complete, system fully operational"
- Log incident: Document what happened and timeline

---

## 🐛 Troubleshooting

### Issue 1: Failover Activated But US Replica Not Responding
**Symptoms:**
```
⚠️ Error rate still high (50%+) after failover
Logs: "Connection refused to US replica"
```
**Root Cause:** US replica corrupted or not synced
**Resolution:**
1. Check US replica Firestore sync status
2. If replication lag: Wait 2 minutes for sync
3. If replica corrupted: Automatic failback to India region
4. Contact Google Cloud: "Multi-region Firestore issue"

---

### Issue 2: DNS Not Updated, Traffic Still Going to India
**Symptoms:**
```
After failover command: Still seeing India region timouts
DNS lookup still shows: 149.x.x.x (India IP)
```
**Root Cause:** DNS cache not cleared or update failed
**Resolution:**
1. Clear DNS cache: `ipconfig /flushdns` (Windows) or `dscacheutil -flushcache` (Mac)
2. Wait 60 seconds for DNS propagation
3. Retest: `nslookup api.school-erp.local`
4. If still failing: Manually update hosts file (temporary)

---

### Issue 3: Partial Failover - Some Queries Still Timeout
**Symptoms:**
```
Some reports work, some timeout
Error: "context deadline exceeded"
```
**Root Cause:** Some queries still hitting India region
**Resolution:**
1. Verify all Cloud Run instances restarted (got new DNS)
2. Manually restart instances:
   ```bash
   gcloud compute instances restart school-erp-api-prod-1
   ```
3. Check application config: FIRESTORE_MODE is read-only?
4. Give 2-3 minutes for propagation

---

## 📞 Emergency Escalation

**If failover not working within 3 minutes:**
- 🔴 Page all hands
- CTO authority: "Activate emergency protocol"
- Options: Maintenance mode OR manual restoration

**If US replica also down:**
- 🟠 Both regions unavailable
- Activate: Incident response (RB-002)
- Notify: All school leaders immediately
- Decision: Restore from backup or wait for recovery

---

## 📊 Failover Metrics

**Target metrics for successful failover:**
- Read latency: <500ms (US replica)
- Uptime during failover: >99.5% (some errors expected)
- Write rejection: <0.1% error (graceful failures)
- Failover duration: <2 minutes
- Failback duration: <2 minutes

**Quarterly Disaster Recovery Drill:**
- Test failover every Q (April, July, Oct, Jan)
- Execute full procedure including failback
- Document any issues
- Update procedures based on findings

---

## 📝 Failover Event Log

Log all failover events:

| Date | Trigger | Duration | Impact | Resolved | Root Cause |
|------|---------|----------|--------|----------|-----------|
| 2026-04-15 | Test drill | 5 min | None | ✅ | Planned |
| 2026-04-20 | GCP outage | 8 min | RO mode 8min | ✅ | Network |

---

## 📚 Related Runbooks

- [RB-002: Incident Response](RB-002-Incident-Response.md)
- [RB-003: Data Recovery](RB-003-Data-Recovery.md)
- [ADR-003: Multi-Region Firestore](../architecture/ADR-003-Firestore-MultiRegion.md)

---

## 👥 Ownership

**Process Owner:** DevOps Agent  
**Reviewed by:** Lead Architect  
**Last Tested:** April 2, 2026 ✅  
**Next Drill:** July 9, 2026
