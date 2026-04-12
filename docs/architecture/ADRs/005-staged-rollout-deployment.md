# ADR 005: Staged Rollout Deployment Strategy

**Status:** ACCEPTED (April 9, 2026)  
**Decision Maker:** Lead Architect + DevOps Agent  
**Date:** April 9, 2026  
**Affected Layers:** CI/CD, Deployment, Release Management  

---

## Problem Statement

Deploy new code reliably to production without:
- **Complete outages** (all schools affected immediately)
- **Cascading failures** (bug spreads to healthy servers)
- **Inability to rollback** (stuck with broken version)
- **Slow release cycles** (fear of deployments slows velocity)

**Requirements:**
- Deploy multiple times per day (5-10 PRs)
- Catch 95% of bugs before general release
- Rollback broken code in <5 minutes
- Maintain 99.95% uptime during deployments

---

## Decision

**Use Canary Deployment (gradual rollout) with automated and manual gates.**

### Deployment Flow

```
Code Commit
    ↓
Automated Tests (unit, integration, e2e)
    ↓ [GATE 1: ALL TESTS PASS]
    ↓
Build Docker Image
    ↓
Deploy to Staging (exact replica of production)
    ↓ [GATE 2: SMOKE TESTS + MANUAL QA]
    ↓
Canary Deployment (10% of traffic)
    ↓ [MONITORING: Wait 5 minutes, check error rate]
    ↓ [GATE 3: ERROR RATE <0.1%?]
    ├─ YES → Proceed to 25%
    └─ NO → ROLLBACK immediately
    ↓
25% Deployment
    ↓ [MONITORING: Wait 5 minutes]
    ↓ [GATE 4: ERROR RATE <0.1%?]
    ├─ YES → Proceed to 50%
    └─ NO → ROLLBACK immediately
    ↓
50% Deployment
    ↓ [MONITORING: Wait 5 minutes]
    ↓ [GATE 5: ERROR RATE <0.1%?]
    ├─ YES → Proceed to 100%
    └─ NO → ROLLBACK immediately
    ↓
100% Deployment (All servers)
    ↓
Monitor for 1 hour
    ↓ [GATE 6: NO NEW ERRORS, UPTIME >99.95%]
    ↓
✅ DEPLOYMENT COMPLETE
```

---

## Deployment Stages

### Stage 1: Automated Tests (5 minutes)

**What runs:**
- Unit tests (Jest, 1000+ tests)
- Integration tests (Firestore, auth, APIs)
- Linting (ESLint, TypeScript strict mode)
- Security scan (OWASP, CVE check)
- Build verification (no missing deps)

**Criteria to proceed:**
- ✅ 100% tests passing
- ✅ 0 TypeScript errors
- ✅ 0 CVEs in dependencies
- ✅ Code coverage >85%

**Owner:** Backend/Frontend Agents

**Action on failure:** Block deployment, flag PR for review

---

### Stage 2: Staging Deployment (10 minutes)

**What happens:**
- Deploy image to staging Cloud Run
- Staging is **exact replica** of production
  - Same Firestore schema (test database)
  - Same Redis configuration
  - Same load balancer rules
  - Same monitoring dashboards

**Smoke tests after deployment:**
- Server health check (200 OK)
- Database connectivity (Firestore query <100ms)
- Auth integration (test login → JWT)
- API endpoints (all responding <1s)

**Manual QA checklist (30 min window):**
- QA lead reviews deployment dashboard
- Spot-checks critical workflows (attendance entry → grade query)
- Verifies no regression (known bugs still fixed)

**Criteria to proceed:**
- ✅ All smoke tests passing
- ✅ QA sign-off (✓ checkbox in Slack)
- ✅ No blockers in deployment notes

**Owner:** QA Agent

**Action on failure:** Fix + retest, or revert to previous staging version

---

### Stage 3: 10% Canary Deployment (15 minutes)

**What happens:**
```
Cloud Load Balancer routes:
  90% → Previous production version (v0.1.0)
  10% → New version (v0.2.0)
```

**Who gets new version:**
- Randomly selected 10% of requests (geography-blind)
- OR tracked schools (opt-in canary schools)

**Monitoring (automated every 10 seconds):**
- Error rate (target: <0.1%)
- Latency p95 (target: <400ms)
- CPU/memory usage (target: <70%)
- Firestore quota errors (target: 0)

**Decisions (after 5 minutes):**

| Metric | Status | Action |
|--------|--------|--------|
| Error rate <0.1% | ✅ PASS | Proceed to 25% |
| Latency <400ms | ✅ PASS | Proceed to 25% |
| Memory <70% | ✅ PASS | Proceed to 25% |
| ANY FAIL | ❌ RED | IMMEDIATE ROLLBACK |

**Rollback (automatic):**
```
Error detected → Cloud Monitoring trigger
  → Cloud Function runs: gcloud compute instance-templates delete v0.2.0
  → Load Balancer reconfigures: 100% → v0.1.0
  → Slack alert: "ROLLBACK: v0.2.0 canary caught error rate spike"
  → Team notified, Slack thread opened for RCA
```

**Time to rollback:** <1 minute (automatic)

**Owner:** DevOps Agent (automated)

---

### Stage 4: 25% Deployment (20 minutes)

**Load: 25% of traffic on new version (v0.2.0)**

**Monitoring (5 minute window):**
- Same metrics as Stage 3
- Expanded to check cross-service interactions
- Verify Firestore quota holding steady

**Decision:** If metrics green → proceed to 50%, else rollback

---

### Stage 5: 50% Deployment (25 minutes)

**Load: 50% of traffic on new version**

**Extended window (10 minutes):**
- Monitor real-world usage patterns
- Check for gradual memory leaks (10 min is enough)
- Verify Redis doesn't hit max connections

**Decision:** If metrics green → proceed to 100%, else rollback

---

### Stage 6: 100% Deployment (30 minutes)

**All traffic on new version (v0.2.0)**

**Final monitoring (1 hour):**
- Error rate <0.1%
- Uptime >99.95%
- No latency regression
- All alerts silent

**Decision:** If all clear → deployment complete ✅, else initiate incident response

---

## Configuration Example (Cloud Run)

```yaml
# deployment-strategy.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: school-erp-api
spec:
  traffic:
    # Canary: 10% to new version
    - revisionName: school-erp-api-v0-2-0
      percent: 10
      tag: canary
    # Stable: 90% to previous version
    - revisionName: school-erp-api-v0-1-9
      percent: 90
      tag: stable
    # Latest always gets new code
    - revisionName: school-erp-api-v0-2-0
      percent: 0
      tag: latest
```

**Automated rollout (after 5 min green):**
```bash
# When canary stable, promote to 25%
kubectl patch ksvc school-erp-api --type merge -p '{"spec":{"traffic":[{"revisionName":"school-erp-api-v0-2-0","percent":25},{"revisionName":"school-erp-api-v0-1-9","percent":75}]}}'

# After 10 min green, promote to 50%
kubectl patch ksvc school-erp-api --type merge -p '{"spec":{"traffic":[{"revisionName":"school-erp-api-v0-2-0","percent":50},{"revisionName":"school-erp-api-v0-1-9","percent":50}]}}'

# After 15 min green, go to 100%
kubectl patch ksvc school-erp-api --type merge -p '{"spec":{"traffic":[{"revisionName":"school-erp-api-v0-2-0","percent":100}]}}'
```

---

## Monitoring Dashboard

**Real-time tracking:**
```
┌─────────────────────────────────────────┐
│ DEPLOYMENT v0.2.0 → PROD                │
├─────────────────────────────────────────┤
│ Status: CANARY (10%) - STAGE 3 (5 min)  │
│                                         │
│ Metrics (Last 1 min):                   │
│  Error Rate:      0.05% ✅              │
│  Latency p95:     350ms ✅              │
│  Memory:          65% ✅                │
│  Requests/sec:    150 (normal) ✅       │
│                                         │
│ Status: HEALTHY → AUTO PROMOTE 25%     │
│ Promotion Time: < 1 minute              │
├─────────────────────────────────────────┤
│ Rollback available: gcloud...           │
│ Logs:  /deployments/v0.2.0/logs       │
└─────────────────────────────────────────┘
```

---

## Failure Modes & Recovery

| Scenario | Probability | Impact | Recovery Time | Action |
|----------|---|---|---|---|
| Canary catches error | MEDIUM | 10% traffic affected | <1 min auto-rollback | Automatic (no action needed) |
| Bug escapes canary | LOW | Full outage | 5 min manual rollback | Team alerted, manually revert |
| Rollback itself fails | VERY LOW | Stuck on bad version | 15 min manual fix | Last resort: Switch region |
| Degraded performance (latency >1s) | LOW | Users experience slowness | 1 min auto-rollback | Automatic |

---

## Rollback Procedures

### Automatic Rollback

**Triggers (monitored every 10 sec):**
- Error rate >0.5%
- Latency p95 >1000ms
- Memory >85%
- Firestore quota errors
- Any critical alert

**Process:**
1. Error detected by Cloud Monitoring
2. Alert fires (webhook to Cloud Run)
3. Cloud Function executes: `gcloud run services update-traffic --clear`
4. Traffic reverts to previous stable version
5. Slack alert sent: "ROLLBACK TRIGGERED: [reason]"
6. Team notified (30-second response window)

**Time to rollback:** <30 seconds (automatic)

### Manual Rollback (if needed)

```bash
# View deployment history
gcloud run services describe school-erp-api --format=json

# Rollback to previous version
gcloud run services update-traffic school-erp-api \
  --to-revisions school-erp-api-v0-1-9=100

# Verify
gcloud run services describe school-erp-api \
  --format='value(status.traffic)'

# Expected: school-erp-api-v0-1-9 = 100%
```

**Time to manual rollback:** <2 minutes (human+automated)

---

## Deployment Schedule & Planning

**Frequency:** 2-5 deployments per week (not per day yet, to avoid alert fatigue)

**Deployment windows:**
- Tuesday 2:00 PM: Tuesday deployment (after morning standup)
- Wednesday 9:00 AM: Wednesday deployment
- Friday 3:00 PM: Friday deployment (before weekend, team monitoring)
- ❌ **NO** deployments after 5:00 PM or on weekends (unmonitored)

**Timeouts:**
- If canary catches issue → retry next day
- If manual QA fails → fix and redeploy (same day if<2 hours)

**Team assignments:**
- DevOps Agent: Monitors deployment (5 min per deployment)
- Backend/Frontend Agents: On-call (response <5 min if rollback needed)
- QA Agent: Approves staging → canary transition

---

## Cost

**Deployment Strategy Cost:**
- Staging Cloud Run replicas: $15/month
- Monitoring/alerting: $10/month
- Cloud Build (CI): $0.0085 per build minute
- **Total:** ~$30-50/month

**ROI:**
- Prevents 1 outage/month (baseline) = saves ₹10k/month
- Enables 5x deployment frequency (faster innovation)
- Reduces incident response time (automatic rollback)

---

## Success Criteria

✅ **Week 6:** Zero unintended production outages (all bugs caught in canary)  
✅ **Week 8:** 3+ deployments/week, 100% canary catch rate  
✅ **Week 10:** <2 minute rollback time verified, team confidence high  
✅ **Week 12:** Deploy on-demand (no scheduled windows needed)  

---

## Related Decisions

- [ADR-001](./001-cloud-run-firestore-scalability.md): Cloud Run auto-scaling
- [ADR-004](./004-rate-limiting-ddos-protection.md): Rate limiting during spike traffic
- [ADR-003](./003-firestore-replication.md): Multi-region failover (backup to us-central1)

