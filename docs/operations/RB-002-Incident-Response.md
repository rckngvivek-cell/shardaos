# Runbook: Incident Response - Error Spikes & Downtime

**Last Updated:** April 9, 2026  
**Runbook ID:** RB-002  
**Severity Level:** Critical  
**Owner:** DevOps Agent + On-call Team  
**Escalation Contact:** Lead Architect (PagerDuty)

---

## 📋 Purpose

Respond to production incidents: error spikes, timeouts, downtime, and performance degradation. Goal: Restore service within 5 minutes, full diagnosis within 30 minutes.

**When to use this:**
- Alert: "Error rate >1%"
- Alert: "Service latency p99 >2 seconds"
- Alert: "API down (0% success)"
- User report: "Cannot login" or "System very slow"

**When NOT to use this:**
- Planned maintenance (use deployment runbook)
- Database schema changes (use schema migration runbook)
- Known issues with planned fix (use status page)

**Estimated Duration:** 5 minutes (immediate action) + 30 minutes (full diagnosis)  
**Risk Level:** Critical (do NOT wait for approval, act immediately)

---

## ✅ Prerequisites

Before you can respond to incidents:

- [ ] PagerDuty app installed on phone
- [ ] Slack notifications enabled for #incidents-critical
- [ ] Access to production monitoring dashboard
- [ ] Access to Cloud Run logs (gcloud CLI configured)
- [ ] Production database credentials in secure vault
- [ ] Know how to trigger rollback (Step 3.1)

---

## 🔧 Step-by-Step Procedure

### Phase 1: Immediate Response (0-2 minutes)

**⏰ WITHIN 30 SECONDS:**

Step 1.1: Acknowledge Alert
- If paged: Click "Acknowledge" in PagerDuty
- Post in #incidents-critical: `🚨 INCIDENT: Error spike detected`
- Expected: Notification goes to on-call team

Step 1.2: Access Production Dashboard
- Open bookmark: https://console.cloud.google.com/monitoring/dashboards
- Select dashboard: "School ERP Production"
- Expected: Live metrics visible
- ✅ Success: Dashboard loads, showing error rate spike
- ❌ Failed: Use backup dashboard (saved locally) or logs

Step 1.3: Assess Severity (takes 30 seconds)
- Check error rate: What % (0-100%)?
- Check uptime: Is API responding at all?
- Check affected users: All? Or specific region?

**Severity Classification:**
- 🔴 **CRITICAL:** Error rate >50% or API down
- 🟠 **EMERGENCY:** Error rate 10-50%
- 🟡 **HIGH:** Error rate 1-10%
- 🔵 **MEDIUM:** Error rate 0.1-1%

---

### Phase 2: Triage (2-5 minutes)

**Step 2.1: Identify Error Type**
- Look at logs: `gcloud run logs read --service school-erp-api-production --limit 50`
- Read error messages - common patterns:
  - "Connection timeout" → Database down or network issue
  - "Out of memory" → Memory leak or spike in data
  - "TypeError" → Bug in recent code deployment
  - "Permission denied" → Firestore auth issue
- Expected: Error pattern identified
- ✅ Success: Know the root cause (or hypothesis)

```bash
# See last 50 errors quickly:
gcloud run logs read \
  --service school-erp-api-production \
  --limit 50 \
  --filter="severity=ERROR"
```

**Step 2.2: Determine If Recent Deployment**
- Run: `gcloud run revisions list --service school-erp-api-production --limit 5`
- Check: Did we deploy in last 5 minutes?
- Expected output shows timestamps
- ✅ Success: Know if this is deployment-related
- Decision: If deployed <5 min ago → Likely culprit

**Step 2.3: Make Decision**

**If recent deployment + errors started after deploy:**
- → Go to Step 3.1 (Rollback)

**If not deployment-related:**
- → Go to Step 4.1 (Investigate infrastructure)

**If unsure:**
- → Check both: Start with rollback (faster)

---

### Phase 3: Rollback (If Deployment-Related)

**⏰ EXECUTE WITHIN 3 MINUTES**

**Step 3.1: Rollback to Previous Version**
```bash
# List revisions:
gcloud run revisions list \
  --service school-erp-api-production \
  --limit 5

# Route 100% traffic to previous revision:
# (replace REVISION_ID with actual revision)
gcloud run services update-traffic school-erp-api-production \
  --to-revisions=[PREVIOUS_REVISION_ID]=100
```
- Expected: Command returns successfully
- ✅ Success: No errors from gcloud
- ❌ Failed: Try again, or proceed to incident war room

**Step 3.2: Verify Rollback (takes 30 seconds)**
```bash
# Run smoke test:
npm run test:e2e:production

# Or manual check:
curl https://api.school-erp.local/health
# Expected: {"status": "ok", "latency_ms": 45}
```
- ✅ Success: Health check returns 200
- ❌ Failed: Something deeper than just code

**Step 3.3: Monitor Recovery (2-5 minutes)**
- Watch dashboard error rate
- Expected: Error rate drops to <0.1% within 1 minute
- Expected: Latency returns to <500ms within 1 minute
- ✅ Success: Metrics normalized
- ⚠️ If not improving in 2 minutes: Escalate to War Room

**Step 3.4: Post-Rollback Steps**
- Post to #incidents-critical: `✅ Rollback complete, service restored`
- Tag on-call: "Investigating cause of deployment error"
- Create post-mortem task (fix code)
- Return to normal monitoring

---

### Phase 4: Investigate Infrastructure (If Not Deployment)

**Step 4.1: Check Cloud SQL Database**
```bash
# Is database responding?
gcloud sql instances describe school-erp-prod-db

# Check connections:
gcloud sql operations list --instance=school-erp-prod-db --limit 10

# Check error logs:
gcloud sql operations list \
  --instance=school-erp-prod-db \
  --filter="error" \
  --limit 5
```
- ✅ Success: Database connections healthy
- ❌ Failed: Database might be issue. See Troubleshooting.

**Step 4.2: Check Firestore**
- Open Firestore console
- Check: Any throttling errors?
- Check: Write/read quota exceeded?
- Look for: "Resource exhausted" errors
- Expected: No quota issues
- ✅ Success: Firestore healthy
- ❌ Failed: Contact Google Cloud support (use RB-08: GCP Issues)

**Step 4.3: Check Cloud Run Service**
```bash
# Get service status:
gcloud run services describe school-erp-api-production

# Check for OOMKilled containers:
gcloud run logs read \
  --service school-erp-api-production \
  --filter="OOMKilled" \
  --limit 5
```
- ✅ Success: Service healthy, no OOM
- ❌ Failed: See Troubleshooting - Memory leak detected

**Step 4.4: Check External Dependencies**
- Twilio SMS service status: https://status.twilio.com
- Firebase status: https://status.firebase.google.com
- Google Cloud status: https://status.cloud.google.com
- Expected: All showing "operational"
- ✅ Success: No external outages
- ⚠️ If external outage: Update status page, notify users

---

## 🐛 Troubleshooting

### Issue 1: Error Rate High But No Recent Deployment
**Symptoms:**
```
🚨 Error rate: 15%
Last deployment: 2 hours ago
Logs show: "Connection timeout: Firestore"
```
**Root Cause:** Firestore experiencing issues or quota exceeded
**Resolution:**
1. Check Firestore quota: Cloud Console → Quotas
2. If quota hit: Contact sales (emergency limit increase)
3. If connection timeout: Check network policies
4. Temporary mitigation: Rate limit requests (tell frontend)
5. Investigate root cause in parallel

**Verification:** Error rate drops, Firestore connection restored

---

### Issue 2: Memory Usage Growing, Service Crashing
**Symptoms:**
```
⚠️ Alert: Memory 95%
🚨 Alert: Service OOMKilled (out of memory crashed)
Logs: "JavaScript heap out of memory"
```
**Root Cause:** Memory leak in application code
**Resolution:**
1. Immediate: Scale up Cloud Run memory (temporary)
2. Investigate: Review recent code changes
3. Fix: Find and fix the memory leak
4. Redeploy: Push fix to production
5. Monitor: Watch memory for recurrence

**Verification:** Memory usage stable <70%, no more OOMKills

---

### Issue 3: Database Connection Pool Exhausted
**Symptoms:**
```
Errors: "FATAL: sorry, too many clients already"
CloudSQL showing: 100/100 connections used
```
**Root Cause:** Too many simultaneous connections (connection leak)
**Resolution:**
1. Restart Cloud Run service (kills long-lived connections)
2. Check for connection leak in code
3. Increase CloudSQL max connections (temporary)
4. Deploy connection pool fix
5. Monitor connection count

**Verification:** Connection count returns to normal (20-30 typically)

---

### Issue 4: Can't Access Monitoring Dashboard
**Symptoms:**
```
❌ Cannot load monitoring dashboard
Need to make decisions with incomplete info
```
**Root Cause:** GCP console down or network issue
**Resolution:**
1. Use gcloud CLI instead:
   ```bash
   gcloud monitoring read [metric_name]
   ```
2. Or check Cloud Run metrics directly:
   ```bash
   gcloud run services describe school-erp-api-production
   ```
3. Email ops team: "Monitoring access issue"
4. Continue with logs-based diagnosis

---

## 📞 Escalation

**If error rate still high after 3 minutes:**
- 🔴 Activate Incident War Room
- Post in #incidents-critical: `⚠️ ESCALATION: Need help`
- Page: Lead Architect + Backend Lead + Database Admin
- Actions: Collective diagnosis and decision-making

**If error rate high after 5 minutes WITHOUT SOLUTION:**
- 🟠 Make decision: Continue investigation or trigger emergency maintenance?
- Notify school leaders on status page: "Degraded service"
- Activate incident commander (Lead Architect)

**If service down for 10+ minutes:**
- 🟡 Notify schools: Send outage notification via all channels
- Activate 24/7 response team
- Continuous escalation until resolved

---

## 📊 Response Timeline Targets

- 0-1 minute: Acknowledge, triage, classify severity
- 1-3 minutes: Identify root cause (deployment vs infrastructure)
- 3-5 minutes: Execute rollback OR start infrastructure investigation
- 5-10 minutes: Service restored OR incident commander engaged
- 10-30 minutes: Full diagnosis + long-term fix identified

---

## 📝 Incident Response Log

Log every incident response here:

| Date | Time | Issue | Severity | Action | Duration | Resolved |
|------|------|-------|----------|--------|----------|----------|
| 2026-04-09 | 14:30 | Error spike 5% | CRITICAL | Rollback PR#9 | 3 min | ✅ |
| 2026-04-10 | 09:15 | Latency 2s | HIGH | Scaled memory | 5 min | ✅ |

---

## 📚 Related Runbooks

- [RB-001: Deployment](RB-001-Deployment.md)
- [RB-003: Data Recovery](RB-003-Data-Recovery.md)
- [RB-004: Failover](RB-004-Failover.md)
- [RB-005: Performance Debugging](RB-005-Performance-Debugging.md)

---

## 👥 Ownership

**Process Owner:** DevOps Agent  
**On-call Schedule:** [Link to calendar]  
**Last Updated:** April 9, 2026  
**Last Drilled:** [Date of last incident response drill]  

**Review frequency:** After every incident (+ quarterly)
