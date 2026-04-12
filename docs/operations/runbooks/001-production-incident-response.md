# Runbook 001: Production Incident Response Procedures

**Last Updated:** April 9, 2026  
**Owner:** DevOps Agent  
**SLA:** P1 acknowledgment <5 min, decision <30 min, resolution <2 hours  

---

## Quick Reference (Triage in 2 minutes)

**Is the API down? (Check first)**
```bash
curl -s https://api.school-erp.in/health | jq .
# Should return: {"status":"ok","uptime_seconds":123456}
```

**Is Firestore accessible?**
```bash
# From production API
gcloud firestore query --collection schools --limit=1
```

**What's the error rate?**
- Open [Monitoring Dashboard](https://console.cloud.google.com/monitoring)
- Look at: Error rate widget (should be <0.05%)

**Escalate if:**
- Error rate >0.5% 
- Uptime <99.95%
- Any API endpoint timing out (>30 sec)

---

## Incident Categories

### P1 - CRITICAL 🔴 (Page immediately)

**Severity:** Revenue-blocking, affects 10+ schools

**Symptoms:**
- Production API completely down (no response)
- Uptime probability <99.9% (expected <99.95%)
- Error rate >0.5%
- Database unable to read/write (Firestore unavailable)

**Response:**
1. **Immediately (0-2 min):**
   - Acknowledge in #incidents Slack channel
   - Page DevOps on-call lead
   - Create Incident ticket in Jira (title: "[P1] API Down - Schools Blocked")

2. **Diagnosis (2-10 min):**
   - Check Cloud Run status (healthy replicas?)
   - Check Firestore status (can connect?)
   - Check error logs (what errors repeating?)
   - Check metrics (CPU/memory/disk usage)

3. **Action (10-30 min):**
   - If Cloud Run crashed: Auto-restart (check if pod recovered)
   - If Firestore down: Fail to backup region (switch traffic)
   - If quota exceeded: Bump quota + restart
   - If buggy code: ROLLBACK immediately (revert to previous version)

4. **Resolution (30-120 min):**
   - Restore service to normal
   - Implement fix or maintain workaround
   - Monitor for 1 hour (ensure stability)

5. **Post-incident (within 24 hours):**
   - Write RCA document: what happened, why, how to prevent
   - Share with team in Slack #postmortems
   - Schedule follow-up action items

**Escalation:**  
If unresolved after 30 min → call Lead Architect + Product Lead

---

### P2 - HIGH 🟠 (Escalate within 30 min)

**Severity:** Service degraded, affects 1-5 schools

**Symptoms:**
- P95 latency >1000ms (should be <400ms)
- Error rate 0.1-0.5% (should be <0.05%)
- Single school experiencing intermittent failures
- Feature partially unavailable (e.g., attendance works, grades slow)

**Response:**
1. **Immediately (0-5 min):**
   - Acknowledge in #incidents Slack channel
   - Create Jira ticket (P2, assign to relevant agent)

2. **Diagnosis (5-30 min):**
   - Isolate affected school/user
   - Check logs for specific error patterns
   - Profile slow endpoint (check database query times)
   - Review recent deployments (was code just released?)

3. **Action (30-90 min):**
   - If query slow: Optimize query, add index, or cache result
   - If recent deployment caused: ROLLBACK to stable version
   - If specific school issue: Check school configuration (broken data?)
   - If high memory: Increase Cloud Run memory or scale replicas

4. **Resolution (2-8 hours):**
   - Verify symptoms gone
   - Communicate with affected school (if applicable)
   - Monitor for regression

**Escalation:**  
If unresolved after 1 hour → escalate to Backend/Frontend lead

---

### P3 - MEDIUM 🟡 (Schedule fix, escalate if >2 hours)

**Severity:** Nuisance issue, workaround available

**Symptoms:**
- P95 latency 500-1000ms (noticeable but acceptable)
- Error rate 0.05-0.1%
- Cosmetic UI issues
- Non-critical feature broken (nice-to-have)

**Response:**
1. **Immediately:**
   - Create Jira ticket (P3, schedule for backlog)
   - Investigate root cause (doesn't require immediate fix)

2. **Action:**
   - Document workaround for users (if needed)
   - Plan fix for next sprint

3. **Escalation:**  
If unresolved for >2 hours AND impacts production → elevate to P2

---

### P4 - LOW 🟢 (Business hours only)

**Severity:** Cosmetic, future enhancement

**Symptoms:**
- Minor UI bugs (button placement, text color)
- Feature requests during incident
- Documentation gaps

**Response:**
- Create Jira ticket, assign to backlog
- No emergency response needed

---

## Incident Response Checklist

### Phase 1: Triage (0-5 min)

- [ ] Confirm incident is real (not false alarm)
- [ ] Determine severity (P1, P2, P3, P4)
- [ ] Alert relevant team via Slack #incidents
- [ ] Create Jira ticket (link in Slack thread)
- [ ] Assign on-call owner (Backend, DevOps, Frontend, etc.)

### Phase 2: Diagnosis (5-30 min for P1, 30-60 min for P2)

**Checklists by category:**

**For "API Down" (no response):**
- [ ] curl health endpoint → getting response?
- [ ] Cloud Run service status (GCP console)
- [ ] Check recent deployments (rolled out bad code?)
- [ ] Check error rate in Cloud Monitoring
- [ ] Check Firestore connection from pod
- [ ] Check CPU/memory/disk usage

**For "Latency High" (slow):**
- [ ] Which endpoint slow? (check logs)
- [ ] Is it consistent or intermittent?
- [ ] Recent code change? (git log --oneline -5)
- [ ] Database query slow? (Firestore latency metrics)
- [ ] Disk I/O high? (check Cloud Run metrics)
- [ ] Memory leak? (memory growing over time?)

**For "Errors Spiking" (>0.1%):**
- [ ] What type of errors? (500, 403, timeout, etc.)
- [ ] Which endpoints affected?
- [ ] Firestore quota exceeded?
- [ ] Authentication broken?
- [ ] Third-party API (e.g., payment processor) down?

### Phase 3: Action (Varies)

**If Critical Infrastructure Down:**
1. Attempt restart (Cloud Run auto-restart)
2. Check if previous version stable (consider rollback)
3. Switch to backup region if necessary
4. If >5 min unresolved: War room activation

**If Recent Deployment Bad:**
1. Identify which PR/commit broke it
2. ROLLBACK to previous version (1-2 min)
3. Verify metrics recover
4. Investigate root cause
5. Re-deploy fixed version

**If Database Issue:**
1. Check Firestore quota (console.cloud.google.com/firestore)
2. Check for data corruption (spot check)
3. If quota: Request increase + restart
4. If corruption: Restore from backup (15 min, contact DevOps)

**If Specific Code Issue:**
1. Check logs for stack trace
2. Identify affected code path
3. Create hotfix PR
4. Deploy via canary (10% → 25% → 100%)
5. Verify no regression

### Phase 4: Verification (Varies)

- [ ] Error rate back to normal (<0.05%)
- [ ] Latency back to normal (<400ms p95)
- [ ] Uptime recovering (>99.95% during incident window)
- [ ] No new errors in logs
- [ ] Affected stakeholders (schools) confirmed service working

### Phase 5: Post-Incident (Within 24 hours)

- [ ] Write RCA document (template below)
- [ ] Assign follow-up action items (improve monitoring, fix root cause)
- [ ] Share in Slack #postmortems
- [ ] Schedule team sync to discuss learnings

---

## RCA Template (Root Cause Analysis)

```markdown
## Incident RCA: [Title]
**Date:** April 9, 2026  
**Incident ID:** P1-2026-04-09-001
**Duration:** 15 minutes (2:30 PM - 2:45 PM IST)
**Impact:** 5 schools, 500 users affected, ₹2k estimated revenue impact

### Timeline
- 2:27 PM: Error rate spikes to 2%
- 2:30 PM: Alerted to incident
- 2:32 PM: Diagnosed: Firestore quota exceeded
- 2:37 PM: Rolled back deployment PR #42
- 2:45 PM: Service recovered, error rate <0.05%

### Root Cause
PR #42 deployed report-generation feature that queries Firestore 10x more than before.
This pushed daily quota usage from 80% → 125%, causing quota exceeded errors.

**Why not caught?**
- Load testing was done with 10 concurrent users
- Real traffic: 100 concurrent users doing reports simultaneously
- SLA: Load test must include realistic concurrent scenarios

### Fix
1. (Immediate) Rolled back PR #42
2. (This week) Optimize report queries (add caching, use batch reads)
3. (Next week) Increase Firestore quota from 100k → 500k read/day
4. (Process) Update deployment checklist: verify Firestore quota headroom before merge

### Action Items
- [ ] Backend Agent: Optimize report queries (reduce 10x cost) - Due: This week
- [ ] DevOps Agent: Increase Firestore quota - Due: Tuesday
- [ ] QA Agent: Add load test with real concurrent scenarios - Due: Next week
- [ ] Lead Architect: Review quota planning process - Due: Next sprint

### Prevention for Future
- Add quota monitoring: Alert if usage >70%
- Require load test results in PR checklist
- Add Firestore quota comment to PRs that touch queries
```

---

## Rollback Procedure (Emergency)

**When:** Service broken, needs immediate fix

```bash
# 1. Check current deployed version
gcloud run services describe school-erp-api --format="value(status.traffic)"
# Output: school-erp-api-v0-2-0=100

# 2. Check previous versions available
gcloud run revisions list --service school-erp-api --limit=10
# Pick the one before current

# 3. Rollback to previous version
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-v0-1-9=100

# 4. Verify
gcloud run services describe school-erp-api --format="value(status.traffic)"
# Should show: school-erp-api-v0-1-9=100

# 5. Monitor (30 seconds for traffic to shift)
curl -s https://api.school-erp.in/health | jq .status

# 6. If OK, confirm in Slack
# @here ROLLBACK COMPLETE: v0.2.0 → v0.1.9, all metrics normal
```

**Time to rollback:** <2 minutes (automatic + manual verification)

---

## War Room Activation (P1 + >5 min unresolved)

**Who joins:**
- DevOps on-call lead (incident commander)
- Backend lead (or agent owning issue)
- Frontend lead (if API affected)
- Lead Architect (strategic decisions)
- Product lead (customer communication)

**Slack channel:** #war-room  
**Meeting:** 5-minute standup updates until resolved

**Format:**
```
DevOps Lead: "Status check, everyone. What's your status?"
Backend Agent: "Investigating... found error in attendance query, fixing now"
DevOps Lead: "OK, proceed, I'll monitor metrics. ETA 10 min?"
Backend Agent: "Yes, 10 min"
[5 min later]
Backend Agent: "PR #43 hotfix ready, promoting via canary"
DevOps Lead: "Monitoring canary... error rate 0% at 10% traffic"
DevOps Lead: "Promoting to 100%"
[5 min later]
DevOps Lead: "✅ RESOLVED: Error rate <0.05%, uptime recovered. Ending war room."
```

---

## Escalation Tree

```
Incident Detected
    ↓
Level 1: On-Call Agent (Backend/Frontend/DevOps)
  - <5 min acknowledge
  - <30 min attempt fix
  - If unresolved after 30 min → escalate
    ↓
Level 2: Agent Lead + Peer Support
  - <60 min decision
  - Architectural change approved
  - Can authorize rollback/deploy
  - If unresolved after 60 min → escalate
    ↓
Level 3: Lead Architect + Product Lead
  - <90 min resolution plan
  - War room activated
  - Can make business decisions (downtime OK for fix)
  - If >15 min revenue impact → escalate
    ↓
Level 4: CTO + Product Lead + CEO
  - Full incident command structure
  - Communication to customers
  - Possible public status update
```

---

## On-Call Handoff (Daily at 4:00 PM)

**Outgoing agent:**
- Document any ongoing issues (link to Jira)
- Share context: what's fragile? what should be monitored?
- Point incoming agent to relevant dashboards
- Confirm monitoring alerts active

**Incoming agent:**
- Review alerts configuration
- Spot-check monitoring dashboards
- Confirm CloudMonitoring notification emails working
- Read previous day's incident reports

---

## Related Documents

- [Monitoring & Alerting Guide](../monitoring-observability.md)
- [Rollback Procedures](./005-staged-rollout-deployment.md)
- [On-Call Rotation Schedule](../on-call-schedule.md)

