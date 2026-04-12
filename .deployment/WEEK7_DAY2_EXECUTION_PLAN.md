# 📅 WEEK 7 - DAY 2 EXECUTION PLAN
## Tuesday, April 22, 2026 - 9:00 AM IST

**Status:** 🟢 LIVE EXECUTION  
**Project Head:** Vivek (You)  
**Focus:** Integration Sprint + Phase 2 Implementation  
**Velocity Target:** 30%+ of Module 3 complete by EOD  

---

# 🎯 DAY 2 MISSION STATEMENT

**Yesterday (Day 1):** We built the foundation (stubs, schemas, tests)  
**Today (Day 2):** We integrate everything + implement 30% of features  
**Goal:** By Friday → 50%+ Module 3 complete + revenue locked + production stable  

---

# 👥 ALL 8 AGENTS - DAY 2 MISSIONS

## AGENT 0: LEAD ARCHITECT
**Mission:** Approve integration patterns, monitor architecture, monitor production

**Day 2 Deliverables:**
- [ ] Review Backend Phase 2 implementation architecture
- [ ] Approve Frontend-Backend integration patterns  
- [ ] Review BigQuery → Dataflow → Data Studio wiring
- [ ] Monitor 99.95%+ uptime target
- [ ] Ensure zero architectural regressions

**Success Criteria:**
- All integration PRs approved same-day (<2 hr review time)
- 0 production incidents
- Architecture decisions documented for reference

---

## AGENT 1: BACKEND ENGINEER
**Mission:** Implement Phase 2 - 30% of exam endpoints with real logic

**Day 2 Deliverables (30% = ~3-4 endpoints fully implemented):**

- [ ] **Implement 4 core endpoints (FULL implementation, not stubs):**
  1. `POST /api/v1/exams` - Create exam (validation + Firestore write)
  2. `GET /api/v1/exams` - List exams (Firestore query)
  3. `POST /api/v1/exams/:examId/submissions` - Submit answers (transaction + grading begin)
  4. `GET /api/v1/exams/:examId/results` - Get results (Firestore read + computed)

- [ ] **Firestore integration:**
  - Set up Firestore client SDK
  - Implement CRUD operations for exams, questions, submissions
  - Add transaction support for atomic operations
  - Test with real Firestore emulator (local)

- [ ] **Error handling:**
  - Input validation (exam length, questions, scores)
  - Not found errors (404s when exam doesn't exist)
  - Authorization errors (who can view what)
  - Transaction conflicts (retry logic)

- [ ] **Tests:**
  - Update 12 unit tests to use real Firestore logic (not mocks)
  - Test all 4 endpoints with real data
  - Test error cases (invalid input, missing data)
  - Cover edge cases (empty exam, duplicate submission)

**Target Completion:** By 3:00 PM (status update required)  
**Phase 2 Progress:** 30-40% complete (4/12 endpoints done)  
**Blockers to Watch:** Firestore authentication, transaction locks

---

## AGENT 2: FRONTEND ENGINEER
**Mission:** Connect UI components to Backend Phase 2 endpoints

**Day 2 Deliverables:**

- [ ] **Connect ExamList component:**
  - Hook up to `GET /api/v1/exams` endpoint
  - Load real exam data from Backend
  - Handle loading states + errors
  - Implement search/filter functionality

- [ ] **Connect ExamAnswerer component:**
  - Hook up to `GET /api/v1/exams/:examId/questions` (when ready)
  - Begin hooking to `POST /api/v1/exams/:examId/submissions`
  - Implement answer submission with error handling
  - Show success/error messages to student

- [ ] **Connect ResultsViewer component:**
  - Hook up to `GET /api/v1/exams/:examId/results`
  - Display real grades from Backend
  - Show score breakdown from actual grading

- [ ] **Redux integration:**
  - Dispatch actions when Backend calls succeed/fail
  - Update Redux store with real API responses
  - Implement error state in Redux slice
  - Add loading indicators

- [ ] **API layer:**
  - Create `src/api/examApi.ts` (RTK Query or axios)
  - Implement API calls for all connected endpoints
  - Add request/response interceptors
  - Handle authentication tokens

- [ ] **Testing:**
  - Update 20+ component tests to use real API calls
  - Mock Backend responses
  - Test error flows (API fails, network down)
  - Test loading states

**Target Completion:** By 3:30 PM  
**Integration Progress:** 60% of components integrate  
**Blockers to Watch:** Backend endpoint availability, CORS issues

---

## AGENT 3: DATA ENGINEER
**Mission:** Provision BigQuery + set up real-time Pub/Sub sync

**Day 2 Deliverables:**

- [ ] **BigQuery setup:**
  - Create GCP project (or use existing)
  - Create BigQuery datasets (exam_analytics, staging)
  - Run DDL scripts to create 5 tables from Day 1 schema
  - Verify tables created + partitioning working
  - Test sample queries from Day 1

- [ ] **Pub/Sub setup:**
  - Create Pub/Sub topics (exam-events, exam-submissions)
  - Create subscriptions (push to BigQuery)
  - Configure Dataflow job template (Firestore → Pub/Sub → BigQuery)
  - Start stream pipeline (monitor for latency)

- [ ] **Firestore triggers:**
  - Create Cloud Function that publishes to Pub/Sub when exam is submitted
  - Trigger on Firestore: exams collection → Pub/Sub topic
  - Test: Create exam → verify event appears in Pub/Sub → appears in BigQuery

- [ ] **Data Studio:**
  - Connect Data Studio dashboard to real BigQuery tables
  - Verify dashboards load with initial data (may be empty)
  - Set up 5-minute auto-refresh
  - Configure scheduled PDF reports (daily 6 AM)

- [ ] **Monitoring:**
  - Create Dataflow job monitoring (throughput, latency, errors)
  - Set up alerts: if latency >5s or error rate >1%
  - Create dashboard: events processed/sec, end-to-end latency

**Target Completion:** By 4:00 PM  
**Live Data Pipeline:** Real-time exam events flowing to BigQuery  
**Blockers to Watch:** GCP project access, Dataflow quotas, Pub/Sub permissions

---

## AGENT 4: DEVOPS ENGINEER
**Mission:** Monitor Day 2 integration, prepare load test, maintain SLA

**Day 2 Deliverables:**

- [ ] **Production monitoring:**
  - Continue 99.95%+ uptime tracking (no Module 3 live yet, still Week 6)
  - Monitor API latency (ensure <200ms even with new demands)
  - Track error rates (should stay <0.05%)
  - Zero manual incidents (if problem, escalate)

- [ ] **Staging environment:**
  - Deploy Backend Phase 2 code to staging (port 8080)
  - Deploy Frontend with integrated API calls to staging
  - Verify end-to-end flow works: student takes exam → Backend processes → results show
  - Run smoke tests again (should still pass)

- [ ] **Load test preparation:**
  - Review load-test-exams.sh from Day 1
  - Prepare to run on Apr 11 (5 days away)
  - Simulate: 500 concurrent students taking exams simultaneously
  - Target: p99 latency <800ms, success rate >95%

- [ ] **Infrastructure:**
  - Monitor Firestore usage (should be low now, will spike on Apr 11)
  - Verify auto-scaling configured (CPU, memory, connections)
  - Check rollback procedure still verified
  - Document any infrastructure changes

- [ ] **CI/CD:**
  - Build + test pipeline running for each commit
  - Ensure all 57 tests still passing
  - Coverage stays at 90%+
  - Production deployments stay stable

**Target Completion:** Continuous (no specific deliverable end time)  
**SLA Status:** 99.95%+ maintained (all day)  
**Blockers:** Any production alerts should escalate immediately

---

## AGENT 5: QA ENGINEER
**Mission:** Write integration tests alongside code, verify Phase 2 functionality

**Day 2 Deliverables:**

- [ ] **Integration tests for Phase 2 endpoints:**
  - Write 5 new integration tests for the 4 Backend endpoints implemented today
  - Test: Create exam → List exam → Submit answers → View results (complete flow)
  - Test error cases: invalid exam, wrong student, late submission
  - Test concurrency: 5 students submit simultaneously (should all work)

- [ ] **Frontend integration tests:**
  - Update 10 component tests to use real API calls (mocked)
  - Test: ExamList loads → click exam → ExamAnswerer opens → submit works
  - Test error flows: API fails, network timeout, invalid response
  - Test loading/error states in UI

- [ ] **End-to-end test:**
  - Create 1 full E2E flow test (student journey start → finish)
  - Use real Frontend + real Backend (staging)
  - Test in staging environment (not production)
  - Verify: Exam shows in results after submission

- [ ] **Regression suite:**
  - Run full regression test suite (20-item checklist from Day 1)
  - Verify Week 6 features still work (student module, teacher module)
  - Check no existing tests broke
  - Coverage report: should stay 90%+

- [ ] **Performance tests:**
  - Verify endpoint response times <200ms (p95)
  - Check Firestore query latency
  - Monitor: no slow queries

**Target Completion:** By 4:30 PM  
**New Tests:** 15-20 tests written (total 80+ by EOD)  
**Coverage:** Maintain 90%+ (should grow to 92%+)

---

## AGENT 6: SALES / PRODUCT MANAGER
**Mission:** Run first demo calls, close first schools, lock revenue

**Day 2 Deliverables:**

- [ ] **Demo Call #1 & #2 (2 PM & 3 PM IST):**
  - Show Module 3 preview (slides from Day 1)
  - Demo: Exam creation flow (show Backend in action)
  - Discuss: Pricing, onboarding, go-live timeline
  - Target: Close 1-2 schools (lock contracts)

- [ ] **CRM updates:**
  - After each call: update CRM with decision (close or follow-up)
  - Document objections + required follow-ups
  - Track: Revenue locked from closed schools

- [ ] **Coordinating Demo #3 & #4 (for Wed/Thu):**
  - Confirm Wed 2 PM call is confirmed
  - Confirm Thu 2 PM call is confirmed
  - Prepare materials for each (customize per school)

- [ ] **Revenue tracking:**
  - By EOD: Should have ₹10-15L locked (1-2 schools closed)
  - Cumulative: ₹23L (Week 6) + ₹10-15L (Day 2) = ₹33-38L
  - Target by Friday: ₹50L (still achievable with 3 more demos)

**Target Completion:** By 5:00 PM (after last call wraps)  
**Revenue Locked:** ₹10-15L (1-2 schools)  
**Blockers:** If school cancels call, reschedule same day

---

## AGENT 7: DOCUMENTATION ENGINEER
**Mission:** Write ADR-7-3, update runbooks based on Day 2 implementation

**Day 2 Deliverables:**

- [ ] **ADR-7-3: Real-Time Analytics Pipeline**
  - Title: "Real-Time vs Batch Analytics: Pub/Sub Streaming + Nightly Aggregation"
  - Document: Hybrid architecture (5-min windows for real-time, 2 AM batch for final)
  - Decision: Chose Pub/Sub streaming because <2 second latency required
  - Alternatives: BigQuery ingest (slower), Firestore direct (unscalable)
  - Implementation: Dataflow template, Cloud Scheduler, autoscaling
  - Cost: ~$300/mo at 50K submissions/day

- [ ] **ADR-7-4: Grading Algorithm**
  - Title: "Exam Grading: Auto-Scoring vs Manual Review"
  - Decision: Hybrid (auto-score multiple choice, flag essay for manual)
  - This week (Day 2-5): Implement auto-grading only
  - Fallback: Manual grading UI for teachers (add if time)

- [ ] **Implementation runbooks:**
  - Create docs/PHASE2_IMPLEMENTATION.md (how to implement each endpoint)
  - Create docs/BIGQUERY_SETUP.md (steps for DevOps to provision)
  - Create docs/STAGING_DEPLOYMENT.md (how to deploy to staging)
  - Create docs/TROUBLESHOOTING_INTEGRATION.md (common issues + fixes)

- [ ] **Update existing docs:**
  - Update exam-ux-flow.md with screenshots of real UI (once running)
  - Update exam-analytics-pipeline.md with actual Dataflow job ID
  - Add Day 2 progress notes to WEEK7_ADR_ROADMAP.md

**Target Completion:** By 5:00 PM  
**ADRs Written:** 2 new (7-3, 7-4 drafted)  
**Runbooks:** 4 new operational guides

---

# ⏰ DAY 2 TIMELINE

```
9:00 AM   - STANDUP (all agents confirm ready, Day 1 lessons discussed)
9:30 AM   - ALL AGENTS START WORK
          └─ Backend: Start implementing 4 endpoints
          └─ Frontend: Connect ExamList to Backend
          └─ Data: Create BigQuery datasets
          └─ DevOps: Monitor + staging deployment prep
          └─ QA: Write first integration tests
          └─ Sales: Final prep for 2 PM demo call
          └─ Docs: Write ADR-7-3 draft
          └─ Lead Arch: Review architecture decisions

10:30 AM  - FIRST CHECKPOINT (code review, any blockers?)
11:30 AM  - SECOND CHECKPOINT (progress update)
12:00 PM  - LUNCH BREAK

1:00 PM   - AFTERNOON SPRINT START (final push to 5 PM)
2:00 PM   - SALES DEMO CALL #1 (Agent 6 on call)
3:00 PM   - AFTERNOON CHECKPOINT
3:00 PM   - SALES DEMO CALL #2 (Agent 6 on second call)
4:00 PM   - INTEGRATION VERIFICATION (all systems talking?)
5:00 PM   - EOD DELIVERABLES COLLECTION
6:00 PM   - FINAL REPORT EMAIL
```

---

# 🎯 DAY 2 SUCCESS CRITERIA

**ALL MUST PASS for Day 2 SUCCESS:**

```
✅ Backend: 4 endpoints fully implemented (not stubs)
✅ Frontend: Components integrated with real Backend calls
✅ Data: BigQuery provisioned, Pub/Sub streaming active
✅ Tests: 15+ new tests written (80+ total)
✅ Production: 99.95%+ uptime maintained (0 incidents)
✅ Sales: 1+ school closed (₹10L+ revenue locked)
✅ Code: 30%+ of Module 3 complete (phase 2)
✅ Coverage: 90%+ maintained (should grow to 92%)
```

**If 6-7/8 pass → Partial success, recoverable** ⚠️  
**If all 8 pass → Excellent progress** ✅

---

# 🚨 CRITICAL DEPENDENCIES (Don't miss!)

| Dependency | Owner | For Whom | Critical? |
|-----------|-------|---------|-----------|
| Backend endpoints implemented | Backend | Frontend | YES |
| Firestore emulator running | DevOps | Backend | YES |
| BigQuery datasets created | Data | DevOps | YES |
| Frontend API layer ready | Frontend | QA | YES |
| Demo slides ready | Sales | Demo | YES |
| ADR-7-3 complete | Docs | Approval | NO (nice-to-have) |

---

# 🎯 VICTORY CONDITION

By 5:00 PM Tuesday:
- Entire team integrated and talking
- Students could (in theory) take exams using real Backend + Frontend
- Results would flow to BigQuery dashboards
- At least 1 school closed for revenue
- Production still stable
- 30%+ of features working end-to-end

**If that's true → Day 2 = SUCCESS, Week 7 still on track for Friday** 🚀

---

**WEEK 7 DAY 2 - EXECUTION PLAN LOCKED**

**Start Time:** Tuesday 9:00 AM IST  
**Finish Time:** Tuesday 6:00 PM IST  
**Authority:** Project Head + Lead Architect  
**Status:** ✅ READY TO EXECUTE

🎪
