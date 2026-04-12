# AGENT 0: LEAD ARCHITECT
## Week 7 Day 2 Briefing

**Your Role:** Architecture Governance + Production Oversight  
**Time Budget:** 10-15% review = ~1-2 hours total  
**Decision Authority:** Final approval on all Phase 2 patterns  

---

## TODAY'S MISSION

```
Review + approve integration patterns for Phase 2
Monitor production (99.95%+)
Ensure architectural consistency
Make NO instances of tech debt introduced
```

---

## 🎯 SPECIFIC TASKS

### TASK 1: Approve Backend Design Patterns
**Input:** Backend Agent will push Phase 2 implementation for Firestore integration  
**Your Job:**
1. Review Firestore CRUD patterns (are they scalable?)
2. Check transaction logic (will they handle concurrent submits?)
3. Verify error handling (proper fallbacks?)
4. Approve architecture document from Backend

**Criteria:**
- ✅ CRUD operations properly separated (repository pattern)
- ✅ Transactions use optimistic locking (not heavyweight)
- ✅ No N+1 query problems
- ✅ Error codes match API specification

**Turnaround:** Must review + approve within 2 hours of code push  
**Expected:** Backend will push around 11:30 AM

---

### TASK 2: Approve Frontend-Backend Integration
**Input:** Frontend Agent will finalize API integration layer  
**Your Job:**
1. Check API contract (does it match Backend spec exactly?)
2. Verify error handling (proper HTTP status codes?)
3. Check Redux state management (is state normalized?)
4. Approve API layer architecture

**Criteria:**
- ✅ API layer uses proper separation (services, interceptors, adapters)
- ✅ All HTTP errors handled (4xx, 5xx, network timeouts)
- ✅ Redux state is predictable + testable
- ✅ No API calls directly from components (uses hooks/selectors)

**Turnaround:** <2 hour review time  
**Expected Push:** Around 1:00 PM

---

### TASK 3: Review BigQuery Wiring
**Input:** Data Agent will provision BigQuery + Pub/Sub pipeline  
**Your Job:**
1. Does Firestore → Pub/Sub trigger work reliably?
2. Is BigQuery schema consistent with data model?
3. Will Dataflow handle 50K+ submissions per day?
4. Cost budget OK (should be <$500/mo)?

**Criteria:**
- ✅ End-to-end pipeline tested (can trace 1 submission all the way to BigQuery)
- ✅ No data loss (all submissions reach BigQuery)
- ✅ BigQuery schema matches Phase 2 data structures
- ✅ Cost is <$500/mo at 50K/day throughput

**Turnaround:** Review by 4:00 PM  
**Expected:** Data Agent completes around 2:30 PM

---

### TASK 4: Production SLA Monitoring (Continuous)
**Parallel Task - Run all day:**

1. **Uptime:** Check status.example.com every 30 min (0 downtime acceptable)
2. **Error Rate:** Monitor logs for exceptions (keep <0.05%)
3. **Latency:** p95 latency should stay <200ms (no regression)
4. **Incidents:** If any issue → immediately escalate to DevOps

**Tool:** Use monitoring dashboard (check links in deployment docs)

---

### TASK 5: Architecture Decision Log
**By 5 PM:**
- [ ] Document Phase 2 architectural patterns used (1 page summary)
- [ ] List any deviations from original design (flag if any)
- [ ] Identify risks introduced (if any) + mitigation plans

---

## 📋 APPROVAL CHECKLIST

When Backend/Frontend/Data push code, use this checklist:

```
BACKEND PHASE 2 APPROVAL
□ Firestore CRUD patterns are scalable
□ Transactions handle 100+ concurrent submits
□ Error codes match spec (400, 404, 500, etc)
□ No tech debt introduced
□ Tests provided (12+ tests)
□ PR description clear

FRONTEND INTEGRATION APPROVAL
□ API clients properly separated (no direct calls from components)
□ HTTP error handling complete (4xx, 5xx, network)
□ Redux state is normalized + cacheable
□ RTK Query or axios used consistently (not mixed)
□ Tests provided (20+ component tests update)

DATA PIPELINE APPROVAL
□ Firestore → Pub/Sub triggers stable + tested
□ BigQuery schema matches data model exactly
□ Dataflow handles designed throughput (50K+/day)
□ Cost budget <$500/mo at design throughput
□ End-to-end latency <5 seconds (95th percentile)
```

**Your Approval Format:**
```
APPROVED ✅ (with X conditions)
Comment: "Looks good, minor change needed: ..."
```

---

## ⏰ TIMELINE FOR YOUR DAY

| Time | Task | Input From |
|------|------|-----------|
| 9:00-11:30 | Standby (monitor production) | (continuous) |
| 11:30-12:30 | Review Backend Phase 2 | Backend Agent |
| 1:00-2:00 | Review Frontend Integration | Frontend Agent |
| 2:00-4:00 | Monitor production + demos | Sales/DevOps |
| 3:00-4:30 | Review Data Pipeline | Data Agent |
| 4:30-5:00 | Architecture decision log | (write summary) |
| 5:00 | Report out | (report to you) |

---

## 🤝 Communication Protocol

**If you spot an issue:**
1. Comment on PR with specific concern
2. Tag responsible agent
3. Set 30-min deadline for response
4. Escalate to Project Head (you) if no response

**If production issue:**
1. IMMEDIATELY notify DevOps
2. Assess impact (critical vs non-critical)
3. Decide: rollback vs. fix-forward
4. Document in incident log

**Your Approvals Required For:**
- Any Phase 2 PR (code push)
- Any production deployment
- Any architecture deviation from plan

---

## SUCCESS CRITERIA FOR TODAY

✅ All Phase 2 code approved within 2 hours  
✅ 0 production incidents  
✅ 99.95%+ uptime maintained  
✅ 0 architectural deviations introduced  
✅ Integration patterns documented  

**Report to Project Head by 5:30 PM with:**
- Status of all Phase 2 approvals (done/pending)
- Production health summary (uptime, errors, latency)
- Risk assessment (any concerns for tomorrow?)

---

**BRIEFING COMPLETE - YOU'RE LEAD ARCHITECT TODAY** 🏛️
