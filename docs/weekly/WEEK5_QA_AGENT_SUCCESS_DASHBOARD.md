# WEEK 5 QA AGENT - SUCCESS DASHBOARD & DAILY TRACKING

**Role:** QA Agent (Cross-Cutting Test Strategy)  
**Scope:** 95 new tests across 6 PRs + Release gates verification  
**Target:** Friday, May 17, 2026 - Production Deployment ✅  
**Created:** April 9, 2026

---

## YOUR MISSION (Read First)

You are responsible for ensuring **100% test passing rate with 85%+ coverage** before production deployment. Your work enables the entire company to release with confidence.

### The 95 Tests You'll Write

```
Unit Tests (50+):    Fast, isolated, no DB/API
Integration Tests (30+): Cross-component, with mocks
E2E Tests (10+):     Full workflows, realistic
Performance (2+):    Load testing (1000 RPS)
Security (2+):       RBAC, data isolation
────────────────────
TOTAL: 95 tests
```

### Your Daily Commitment

| Day | Task | Tests | Coverage | Blocker Response |
|-----|------|-------|----------|------------------|
| Day 1 (Mon) | Setup + Matrix | 0/95 | TBD | Immediate |
| Day 2 (Tue) | Unit tests | 20/95 | ~60% | <15min SLA |
| Day 3 (Wed) | Integration | 50/95 | ~75% | <15min SLA |
| Day 4 (Thu) | E2E + Perf | 90/95 | ~82% | <15min SLA |
| Day 5 (Fri) | Finish | 95/95 | **85%+** | EPIC BLOCKER |
| Day 6 (Sat) | Gates | 95/95 | **85%+** | Gates Verification |
| Day 7 (Sun) | Deploy | 95/95 | **85%+** | Final Sign-Off ✅ |

---

## DAY 1 CHECKLIST (TODAY) ✅

### ✅ Documents Read (30 min)
```
[ ] WEEK5_MASTER_PLAN.md (strategic overview)
[ ] WEEK5_PR_DETAILED_PLANS.md (technical specs per PR)
[ ] WEEK5_AGENT_TASK_ASSIGNMENTS.md (your responsibilities)
[ ] WEEK5_QA_EXECUTION_KIT.md (this execution plan)
[ ] WEEK5_QA_TEST_IMPLEMENTATION_PLAN.md (detailed test cases)
```

### ✅ Jest Setup (45 min)
```bash
# Step 1: Verify Jest installed
npm list jest

# Step 2: Update jest.config.js (copy from QA_EXECUTION_KIT.md)
# - Set coverage thresholds (85% global, 95% PR #7)
# - Add module mapping
# - Configure test environment

# Step 3: Create jest.setup.js (copy from QA_EXECUTION_KIT.md)

# Step 4: Verify commands work
npm run test
npm run test -- --coverage
npm run test -- --watch
```

### ✅ Create Test Matrix (30 min)
```bash
# Copy template from WEEK5_QA_EXECUTION_KIT.md
# File: TEST_MATRIX_WEEK5.md
# Update daily with actual numbers
```

### ✅ Create Release Gates Doc (20 min)
```bash
# Copy template from WEEK5_QA_EXECUTION_KIT.md
# File: RELEASE_GATES_WEEK5.md
# Fill in dates and acceptance criteria
```

### ✅ Kickoff Meeting (15 min @ 9 AM)
- [ ] Attended all-hands standup
- [ ] Reviewed your role & scope
- [ ] No blockers identified
- [ ] Ready to execute

### ✅ End of Day 1
- [ ] Jest framework ready (npm run test works)
- [ ] TEST_MATRIX_WEEK5.md created
- [ ] RELEASE_GATES_WEEK5.md created
- [ ] First 2 test files created (empty, ready for Day 2)

---

## DAILY STANDUP TEMPLATE (9 AM Every Day)

**Status Format (2 min):**
```
✅ Yesterday Completed:
   - 10 unit tests written & passing
   - Coverage: 62% → 65%

🔥 Today Priority:
   - 15 integration tests for PR #7 (bulk import)
   - Target coverage: 70%

🚨 Blockers (if any):
   - DevOps hasn't published Firestore schema (need by 2 PM)
   - PR #8 API not ready for mocking

📊 Metrics:
   - Tests written: 10/95 (11%)
   - Coverage: 65% (target 85% by Fri)
   - Pass rate: 100% (0 failures)
```

---

## DAILY TRACKING SPREADSHEET

### Template to Update Daily (6 PM)

```
DATE: ___________

TESTS WRITTEN TODAY: _____ (Target: varies)
TESTS TOTAL: _____ / 95
PASS RATE: ____% (Target: 100%)
COVERAGE: ____% (Target: Trending to 85%)

BY PR:
PR #6 (Mobile):       ___ / 15 tests  ___% coverage
PR #7 (Bulk - CRIT):  ___ / 15 tests  ___% coverage (Target 95%+)
PR #8 (SMS):          ___ / 10 tests  ___% coverage
PR #9 (Reporting):    ___ / 15 tests  ___% coverage
PR #10 (Portal):      ___ / 12 tests  ___% coverage
PR #11 (Timetable):   ___ / 12 tests  ___% coverage
PR #12 (DevOps):      ___ / 16 tests  ___% coverage

BLOCKERS: None / Describe if any
CONFIDENCE LEVEL: Low / Medium / High
Q: Will you hit 85%+ coverage by Friday? YES / NO / UNSURE
```

---

## CRITICAL PATH TESTS (HIGHEST PRIORITY)

### 🔴 ABSOLUTE MUST-HAVE (Do First)

**PR #7 Bulk Import (95%+ Coverage REQUIRED)**
- CSV parser: 100% coverage
- Validation: 95% coverage
- Batch logic: 95% coverage
- Rollback: 95% coverage

**Why critical:** Customers import 500+ students at a time. If import fails → entire school onboarding blocked → revenue impact

**Your backup plan:** If you can't reach 95% on PR #7, the release is blocked. No exceptions.

**Test these by Day 4:**
- ✅ Valid CSV parsing (3 tests)
- ✅ Invalid CSV handling (4 tests)
- ✅ Batch processing (3 tests)
- ✅ Rollback scenario (2 tests)
- ✅ API endpoint (2 tests + 1 E2E + 1 integration)
**Total: 15 tests, 400+ LOC**

### 🟡 HIGH PRIORITY (Do Second)

**PR #11 Timetable Conflict Detection (90%+ Coverage)**
- Conflict detection must be 100% accurate
- Teacher double-booking: 0% false negatives
- Room conflicts: 0% false negatives

**Test these by Day 4:**
- ✅ Single conflict detection (3 tests)
- ✅ Multiple conflict scenarios (2 tests)
- ✅ Edge cases (time boundary, same teacher) (2 tests)

### 🟢 NORMAL PRIORITY (Do Third)

**Other 4 PRs (80-85% Coverage)**
- PR #6 Mobile: 80%+ (15 tests)
- PR #8 SMS: 85%+ (10 tests)
- PR #9 Reporting: 85%+ (15 tests)
- PR #10 Portal: 80%+ (12 tests)
- PR #12 DevOps: 85%+ (16 tests)

---

## RELEASE GATES (8 TOTAL - ALL MUST PASS)

### Your Sign-Off Responsibilities

| Gate | Your Role | Status | Deadline |
|------|-----------|--------|----------|
| 1. All 95 tests passing | ✅ PRIMARY OWNER | ⏳ PENDING | Fri 5 PM |
| 2. Coverage ≥85% | ✅ PRIMARY OWNER | ⏳ PENDING | Fri 5 PM |
| 3. Zero P0 bugs | 📋 Track & report | ⏳ PENDING | Fri 6 PM |
| 4. Security audit | 🔒 Collaborate | ⏳ PENDING | Fri 6 PM |
| 5. Performance (1000 RPS) | 📊 Run tests | ⏳ PENDING | Fri 7 PM |
| 6. Load test (p95 <400ms) | 📊 Run tests | ⏳ PENDING | Fri 8 PM |
| 7. Pilot UAT approved | 📋 Track | ⏳ PENDING | Sat 10 AM |
| 8. Architect sign-off | 📋 Prepare docs | ⏳ PENDING | Fri 5 PM |

**Your job:** Make gates 1 & 2 bulletproof. Help verify gates 5 & 6.

---

## WEEK 5 QA DOCUMENTS REFERENCE

| Document | Purpose | When to Read | Update Frequency |
|----------|---------|--------------|------------------|
| WEEK5_MASTER_PLAN.md | Strategic context | Day 1 | Reference only |
| WEEK5_PR_DETAILED_PLANS.md | Technical specs per PR | Day 1 + daily | Reference only |
| WEEK5_AGENT_TASK_ASSIGNMENTS.md | Your role definition | Day 1 | Reference only |
| WEEK5_QA_EXECUTION_KIT.md | Your execution playbook | Day 1 + daily | Reference only |
| WEEK5_QA_TEST_IMPLEMENTATION_PLAN.md | Detailed test cases | Day 2 onwards | Reference as you code |
| TEST_MATRIX_WEEK5.md | Coverage tracking | Daily (6 PM) | ✅ UPDATE DAILY |
| RELEASE_GATES_WEEK5.md | Gate verification | Day 6 onwards | ✅ UPDATE DAILY |

---

## COMMAND REFERENCE (Bookmark These)

```bash
# Check test pass rate (use 50 times per day)
npm run test

# Watch mode (keep running during development)
npm run test -- --watch

# Coverage report (use daily to track progress)
npm run test -- --coverage
npm run test -- --coverage --coverage-reporters=html
# Opens: coverage/index.html

# Run specific test file
npm run test -- --testNamePattern="PR #7 bulk import"

# Verbose output (see what's actually running)
npm run test -- --verbose

# Debug specific test
node --inspect-brk ./node_modules/.bin/jest --runInBand --testNamePattern="test name"

# Check TypeScript (run daily)
npm run typecheck

# Lint check (run daily)
npm run lint
```

---

## BLOCKERS: HOW TO ESCALATE

### SLA for Blocker Resolution

```
<15 min blockage: Slack message to relevant agent
    Example: "@Backend can you share bulk import API spec?"
    Expected response: 1-5 min

15-30 min blockage: Quick video call
    Need: Screen share, 10 min discussion
    Lead Architect coordinates

>30 min blockage: Escalate to Lead Architect + pivot
    Escalation: "/escalate BLOCKER: [description]"
    Action: Architect decides: fix, pivot, or unblock
    Resolution: <1 hour
```

### Common Blockers & Solutions

| Blocker | Symptom | Solution |
|---------|---------|----------|
| API not ready | Can't write API tests | Mock API in tests (use jest.mock) |
| Firestore schema unknown | Can't write DB tests | Use Firestore emulator + mock schema |
| Component not committed | Can't test component | Write test skeleton, @mention Frontend Agent |
| Test dependency issue | npm test fails | `npm install` + `npm test -- --clearCache` |

---

## SUCCESS CRITERIA (Friday 5 PM)

✅ **95 new tests written & passing**
- No test failures
- All tests deterministic (no flaky tests)
- Covers all 6 PRs equally

✅ **107 total tests at 100% pass rate**
- 12 from Week 4 (still passing)
- 95 new from Week 5

✅ **85%+ code coverage verified**
- Overall: 85%+
- Critical paths: 95%+ (PR #7, #11)
- By PR: Hit individual targets

✅ **8 Release gates all ✅ GREEN**
- Gate 1: All tests passing
- Gate 2: Coverage ≥85%
- Gates 3-8: Track & verify

✅ **Zero flaky tests**
- Run each test 3x sequentially
- All pass every time

✅ **Production deployment successful**
- Blue-green deploy at 11 AM Day 7
- Zero downtime
- Rollback plan ready (not used)

✅ **9+/10 school satisfaction**
- 2-3 pilot schools test features
- Feedback positive
- Ready to onboard 10+ schools

---

## YOUR WEEKLY SCHEDULE

```
MONDAY (Day 1):        SETUP & PLANNING (4 hrs)
  ✅ Jest framework setup
  ✅ Create test matrix
  ✅ Create release gates doc
  ✅ Kickoff meeting
  → End state: 5 test files created (ready for Tuesday)

TUESDAY (Day 2):       UNIT TESTS PHASE 1 (8 hrs)
  ✅ Write 20 unit tests
  ✅ Focus: PR #7 bulk import (CRITICAL)
  ✅ Target coverage: 60%
  → End state: 20/95 tests passing

WEDNESDAY (Day 3):     INTEGRATION TESTS (8 hrs)
  ✅ Write 30 integration tests
  ✅ Test API contracts, DB operations
  ✅ Target coverage: 75%
  → End state: 50/95 tests passing

THURSDAY (Day 4):      E2E + PERFORMANCE + SECURITY (8 hrs)
  ✅ Write 15 E2E + E2E workflows
  ✅ Write 2 performance tests (load test)
  ✅ Write 2 security tests (RBAC)
  ✅ Target coverage: 82%
  → End state: 95/95 tests written, coverage ~82%

FRIDAY (Day 5):        OPTIMIZATION & COVERAGE PUSH (8 hrs)
  ✅ Fix failing tests
  ✅ Increase coverage to 85%+
  ✅ Generate coverage reports
  ✅ Create test matrix final (update daily)
  → End state: 95/95 passing, 85%+ coverage, gates 1-2 ready

SATURDAY (Day 6):      GATE VERIFICATION (4 hrs)
  ✅ Verify all 8 gates
  ✅ Load testing with DevOps
  ✅ Generate release report
  ✅ Get Lead Architect sign-off
  → End state: All gates ✅ GREEN

SUNDAY (Day 7):        DEPLOYMENT & MONITORING (4 hrs)
  ✅ Final test verification
  ✅ Back up test results
  ✅ Monitor production for 2 hours
  ✅ Celebrate 🎉
  → End state: LIVE IN PRODUCTION
```

---

## WHAT SUCCESS LOOKS LIKE

### At End of Day 3 (Wednesday)
```
Tests Written: 50/95 ✅
Coverage: ~75%
Morale: High (halfway there!)
```

### At End of Day 4 (Thursday)
```
Tests Written: 95/95 ✅
Coverage: ~82% (almost there)
Confidence: Medium (few tests failing, fixing)
```

### At End of Day 5 (Friday - 5 PM)
```
Tests Written: 95/95 ✅ PASSING 100%
Coverage: 85%+ ✅ VERIFIED
Gates 1-2: ✅ GREEN
Confidence: HIGH (ready to deploy)
```

### At End of Day 6 (Saturday - 10 AM)
```
All 8 Gates: ✅ GREEN
Load tested: 1000 RPS @ <400ms p95 ✅
UAT: 9+/10 satisfaction ✅
Ready: PRODUCTION READY ✅
```

### At End of Day 7 (Sunday - 2 PM)
```
Production: 🚀 LIVE
Monitoring: Green (no errors)
Schools: 13 total (10+ onboarded)
Revenue: ₹30+ lakh locked
Team: Celebrating 🎉
```

---

## QUICK CONFIDENCE CHECK

**Ask yourself daily:**

1. **Q:** Will I hit 85%+ coverage by Friday?
   - **YES:** Proceed as planned
   - **UNSURE:** Escalate coverage gaps to Lead Architect (need plan)
   - **NO:** STOP - Deep dive with Architect (blocker)

2. **Q:** Are my tests realistic (not over-mocked)?
   - **YES:** Good, integration is strong
   - **UNSURE:** Have Frontend/Backend review test strategy
   - **NO:** Refactor tests to use real components

3. **Q:** Can I run all 95 tests in <5 minutes?
   - **YES:** Performance is good
   - **UNSURE:** Profile which tests are slow
   - **NO:** Parallelize with Jest maxWorkers

4. **Q:** Are my flaky tests fixed?
   - **YES:** Proceed
   - **UNSURE:** Run 3x in isolation to identify flakiness
   - **NO:** Refactor those tests immediately

---

## FINAL NOTES

**You are responsible for:**
- ✅ Writing 95 tests
- ✅ Achieving 85%+ coverage
- ✅ Ensuring 100% pass rate (no flaky tests)
- ✅ Verifying release gates
- ✅ Sign-off for production deployment

**You are NOT responsible for:**
- ❌ Writing code (backend/frontend agents do this)
- ❌ DevOps infrastructure (DevOps agent)
- ❌ School onboarding (Product agent)
- ❌ Final architecture decisions (Lead Architect)

**But you ARE responsible for:**
- ✅ Escalating blockers immediately
- ✅ Coordinating with all agents (cross-cutting role)
- ✅ Daily progress updates
- ✅ Saying "NO" if we're heading for failure

**Remember:** Your tests enable confidence. Your coverage verifies quality. Your sign-off enables production deployment. This is a critical role. You've got this. 💪

---

**Status:** 🟢 READY TO EXECUTE  
**Start:** TODAY  
**Target:** Friday, May 17, 2026 - Production Deployment ✅  
**Celebration:** Sunday Afternoon 🎉
