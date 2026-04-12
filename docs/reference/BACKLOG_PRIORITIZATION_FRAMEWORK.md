# Backlog Prioritization Framework

**Date**: April 10, 2024  
**Prepared By**: Product Agent  
**Version**: 1.0 (Post-Phase 2)  
**Applies To**: Phase 3+ (Weeks 8-onwards)

---

## Purpose

This framework ensures we prioritize features that maximize:
1. **Revenue impact** (direct deal value, upsell potential)
2. **Customer retention** (stickiness, engagement, ease of use)
3. **Platform health** (reliability, performance, operationability)

**Trade-off rule**: Revenue > Retention > Platform (but platform is non-negotiable below thresholds)

---

## Priority Tiers

### Priority 1: Revenue-Generating Features (Must Complete Week Of)

**Definition**: Features that directly enable customer contracts, increase deal size, or drive upsell.

**Examples**:
- Pilot school production deployment (Week 8) ← enables ₹10-15L deal
- Attendance module (Week 8-9) ← core feature customers demand
- Marks management (Week 9) ← increases school adoption
- WhatsApp parent engagement (Week 9) ← upsell differentiator

**Decision Criteria**:
- [ ] Customer has explicitly requested this in meetings
- [ ] Revenue impact: >₹5L annual contribution expected
- [ ] Timeline: Required before customer contract signature
- [ ] Zero alternative (can't achieve revenue without this)

**Resource**: Always assigned primary agent ownership (no context-switching)  
**Testing**: Minimum ≥80% coverage (P1 features can't regress)  
**Documentation**: Required before sprint ends (customer-facing or internal runbook)  
**Go-live**: Product Agent sign-off required

---

### Priority 2: Retention/Engagement Features (Complete Within 2 Weeks)

**Definition**: Features that increase daily active usage, reduce customer churn, improve NPS.

**Examples**:
- Performance optimization for large schools (Week 10) ← school stays engaged with responsive app
- Analytics dashboards (Week 10) ← helps school see value, justifies continued investment
- Mobile app (Week 11) ← teacher adoption increases, engagement rises
- Offline sync (Week 11) ← reduces frustration with connectivity, improves trust
- Parent WhatsApp notifications (Week 9) ← drives engagement loop (parent sees updates → encourages attendance)

**Decision Criteria**:
- [ ] Retention metric: Improves DAU, session length, or feature adoption
- [ ] Customer feedback: Heard from 2+ pilots or prospects
- [ ] Time to value: Core benefit realized within 1 week of launch
- [ ] Competitive parity: Not falling behind competitor feature set

**Resource**: Secondary ownership, can run parallel with P1  
**Testing**: Minimum ≥75% coverage  
**Documentation**: Internal docs sufficient if complex, external if customer-visible  
**Cadence**: Can land every 2 weeks (not as time-critical as P1)

---

### Priority 3: Platform/Operational Features (Backlog, Assigned as Capacity)

**Definition**: Infrastructure, reliability, scale, security, or developer experience—not directly visible to customers but enable the above.

**Examples**:
- Monitoring & alerting (Week 10-11) ← enables on-call operations
- Query optimization (Week 10) ← supports 2000+ student scale  
- Secret management (Week 8) ← security non-negotiable
- Module load order fixes (Week 8) ← reduces dev friction
- Documentation automation (Week 8-9) ← improves onboarding

**Decision Criteria**:
- [ ] Unblocks P1 or P2 features
- [ ] Security or compliance requirement
- [ ] Technical debt: Debt interest exceeds repayment cost
- [ ] Operations: Without this, team can't deploy/monitor safely

**Resource**: Assigned teams' remaining 20-30% capacity  
**Testing**: Minimum ≥70% coverage (lower risk, less customer impact)  
**Documentation**: Auto-docs acceptable (inline comments, README)  
**Cadence**: Complete by end of quarter, not blocking weekly demo

---

## Real-World Prioritization Decisions (Phase 3-4 Reference)

### Decision: Why Marks Before Mobile (Week 9 vs. 11)?
**Scoring**:
- **Marks module**:
  - Revenue: ₹2-3L upsell (teachers need to enter marks) = **10/10**
  - Retention: Essential feature for school stickiness = **9/10**
  - Platform: Built on stable APIs = **7/10**
  - **Score: 26/30** → Priority 1

- **Mobile app**:
  - Revenue: "Nice to have" for pilots, not required for deal = **4/10**
  - Retention: Increases teacher engagement significantly = **8/10**
  - Platform: Adds complexity (new platform to maintain) = **4/10**
  - **Score: 16/30** → Priority 3 (POC in Week 11)

**Outcome**: Marks shipped Week 9, Mobile POC scheduled Week 11.

---

### Decision: Why Performance Optimization Week 10 (Not Week 9)?
**Assessment**:
- **Week 9 pilot school**: 500-800 students, current P90 = 240ms, acceptable
- **Week 10 perspective**: As schools grow (by week 10, likely 1000+ across multiple pilots), will see degradation
- **Customer escalation risk**: "App slow at 2000 students" = churn risk

**Timing**:
- Week 8-9: Pilot revenue critical (can't optimize prematurely, might miss feature deadline)
- Week 10: Initial pilots stable, second wave of schools coming in pipeline
- Proactive Week 10 optimization = prevents Week 11-12 firefighting

**Outcome**: P2 optimization scheduled Week 10, unblocks Week 11 mobile scaling.

---

### Decision: Why Fix Module Load Order in Week 8 (Not Later)?
**Impact Analysis**:
- Current state: 3 test failures per sprint due to init order
- Ripple cost: 8 hours debugging × 13 developers = 104 hours/month
- Fix effort: 3 story points = 12 hours one-time

**ROI**: 104 hours saved / 12 hours invested = **8.7x** return in 1 month  
**Outcome**: Added to Week 8 P3 backlog (DevOps leads, <1 day effort).

---

## Applying the Framework: Weekly Triage Process

### Every Monday 9 AM: Triage Session (15 minutes)
**Participants**: Lead Architect, Product Agent, 1 agent per team  
**Agenda**:

1. **Validate P1 status** → Any P1 items at risk? Escalate immediately.
   - "Marks module 80% done, on track for Friday" = OK
   - "Marks module 20% done Friday EOD" = BLOCKER, reallocate resources now

2. **Confirm P2 capacity** → Is this week's P2 work progressing?
   - "Mobile UI design 50% done, looks good" = OK
   - "Mobile design blocked on backend API design" = Move to next week, swap in different P2

3. **Assess P3 backlog** → Remaining capacity for platform work?
   - "Backend done early, can take module loader fix" = Assign 3-point task

### Output: Weekly Commitment (Recorded in Sprint Board)
```
[ ] P1: <feature name> - On track / At risk / Blocked
[ ] P2: <feature name> - On track / At risk  
[ ] P3: <feature name> - Optional, assign if capacity remains
```

---

## Criteria for Re-Prioritization (Escalation Path)

### When to Move Feature UP (earlier):
1. **Customer emergency**: Pilot school can't use system → P1 → expedite
2. **Revenue deal**: Second school wants to sign, needs feature first → P1 → pull forward
3. **Critical security bug**: Data at risk → P3 → immediate (replace lowest P3)

**Process**: Lead Architect approves, Product Agent updates roadmap, teams notified

### When to Move Feature DOWN (defer):
1. **Technical blocker**: Can't complete without external dependency (unavailable for 2 weeks) → defer
2. **Team capacity**: Velocity lower than forecast → drop lowest P2, shift P3 to next month
3. **Market validation**: Feature assumption failed in pilot → revisit design, defer implementation

**Process**: Product Agent + Lead Architect discuss, escalate if revenue impact

---

## Resource Allocation Strategy

### Default Allocation (Weekly Capacity per Agent)
```
Backend: 10 points/week = 8-9 P1 + 1-2 P2+P3
Frontend: 10 points/week = 8-9 P1 + 1-2 P2+P3
Data: 5 points/week = 3-4 P1 + 1-2 P2+P3 (fewer P1 items)
DevOps: 3 points/week = 1-2 P1 + 1-2 P2+P3 (support role)
QA: 5 points/week = 4 P1 (testing only) + 1 P2+P3 (automation)
```

### Rebalancing Rules
- **If P1 exceeds capacity**: Lead Architect identifies non-critical P2, defers to next month
- **If P2 stalls**: Assign highest-value P2 item 50% of agent time, finish in 2 weeks instead of 1
- **If P3 overflows**: Keep only security/critical debt fixes, defer nice-to-have (documentation, optimizations)

### Conflict Resolution (If Multiple P1s Compete)
1. **Revenue value** (₹ value) → Higher wins
2. **Timeline** (customer contract due date) → Earlier wins
3. **Unblocking** (does this unblock others?) → Yes wins
4. **Risk** (failure = customer churn?) → High risk wins

**Example**: "Marks module vs. Pilot prod deployment both P1"
- Pilot prod deployment: ₹10-15L deal blocking, must be done by Wed
- Marks module: ₹2-3L upsell, can slip to next mon (customer UAT starts then)
- **Decision**: Pilot deployment gets 80% capacity Mon-Wed, Marks begins Thu

---

## Phase 3-4 Applied Priorities (Weeks 8-11)

### Week 8: Production Launch & Attendance
| Item | Priority | Points | Owner | Status |
|------|----------|--------|-------|--------|
| Pilot prod deployment | P1 | 15 | All | Blocker |
| Attendance API & UI | P1 | 20 | BE+FE | Core |
| Test suite | P1 | 5 | QA | Essential |
| GCP credential tooling | P3 | 4 | DevOps | If capacity |

### Week 9: Marks + WhatsApp
| Item | Priority | Points | Owner | Status |
|------|----------|--------|-------|--------|
| Marks entry & API | P1 | 15 | BE+FE | Revenue feature |
| Parent marks view | P1 | 8 | FE | UI feature |
| WhatsApp integration | P1 | 12 | BE | Differentiator |
| Data pipeline | P1 | 5 | Data | Support |

### Week 10: Scale & Analytics
| Item | Priority | Points | Owner | Status |
|------|----------|--------|-------|--------|
| Performance optimization | P2 | 13 | BE+FE | Retention (proactive) |
| Analytics dashboard | P2 | 14 | Data+FE | Stickiness |
| Load testing | P2 | 5 | QA | Validation |

### Week 11: Mobile POC
| Item | Priority | Points | Owner | Status |
|------|----------|--------|-------|--------|
| React Native mobile | P3 | 10 | FE | Expansion |
| Mobile API optimization | P3 | 5 | BE | Support |
| Operational runbooks | P3 | 5 | DevOps | Platform |

---

## Gate Decisions & Sign-Off Required

| Feature | Completion | Gate Decision | Owner |
|---------|-----------|---------------|-------|
| Pilot prod deployment | EOW8 | Production ready? | Product Agent + QA |
| Attendance module | EOW9 | Revenue feature ready? | Product Agent |
| Marks module | EOW9 | Can teachers use? | Product Agent |
| WhatsApp | EOW9 | ≥95% delivery rate? | Backend lead |
| Performance targets | EOW10 | P99 <500ms? | DevOps |
| Mobile POC | EOW11 | Zero crashes/week? | Frontend lead |

**Sign-off**: Product Agent confirms metrics met before code ships to production. If gate fails: Feature goes to next sprint, root cause investigated, escalate if pattern emerges.

---

## Backlog Grooming Cadence

### Weekly (Every Monday)
- Triage P1/P2 progress
- Identify P3 overflow opportunities
- Validate no schedule slips

### Every 2 Weeks (Sprint Planning)
- Estimate new backlog items (story points)
- Assign owners & acceptance criteria
- Lock in 2-week commitment (road)

### Monthly (Quarterly Review)
- Assess revenue impact of realized features
- Measure retention metrics (DAU, NPS)
- Update forecasts (velocity, customer pipeline)
- Reprioritize Phase 5+ backlog

---

## Success Metrics for This Framework

| Metric | Target | Tracking |
|--------|--------|----------|
| P1 features on-time delivery | ≥95% | Weekly |
| Revenue realized vs. forecast | ≥90% | Monthly |
| Team velocity stability | <10% variance/sprint | Every 2 weeks |
| Customer NPS due to feature prioritization | ≥60 | Quarterly |
| Technical debt interest cost | <10% of velocity | Monthly |

---

## Review Checklist

- [x] Criteria for P1/P2/P3 clear and distinguishable
- [x] Phase 3-4 backlog reflects framework (consistent scoring)
- [x] Resource allocation realistic (no agent >15 points consistently)
- [x] Escalation paths defined (what happens when priorities conflict)
- [x] Trade-offs transparent (why Marks > Mobile)
- [x] Framework is repeatable (Weeks 12+ use same logic)

**Approved By**: Product Agent | **Date**: April 10, 2024

---

## Next: [WEEK7_METRICS_DASHBOARD.md](WEEK7_METRICS_DASHBOARD.md)
