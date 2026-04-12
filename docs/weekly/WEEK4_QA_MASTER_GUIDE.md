# Week 4 QA Agent - Master Execution Guide

**Role:** QA Agent (Quality Assurance & Release Verification)  
**Duration:** May 6-10, 2026  
**Deadline:** Friday May 10, 5:00 PM Production Deployment  
**Success:** 47 tests passing | 82%+ coverage | Release sign-off given

---

## 📋 QA AGENT QUICK REFERENCE

### Your Mission (in 30 seconds)

You are responsible for ensuring all code merged this week is production-ready:
1. **Set up test infrastructure** (Jest, Supertest, Istanbul) ✅
2. **Verify all 47 tests passing** across 5 PRs ✅
3. **Confirm 82%+ code coverage** ✅
4. **Run load tests & security scans** ✅
5. **Give final release sign-off** or block deployment ✅

### Daily Schedule

**Monday: Setup Day** (9 AM - 5 PM)
- Configure Jest, Supertest, Istanbul
- Establish coverage tracking
- Create test templates
- Status: Infrastructure ready ✅

**Tuesday-Wednesday: Test Verification** (9 AM - 5 PM)
- Monitor PR #1 (15 API tests) → Tue
- Monitor PR #2 (15 Firestore tests) → Wed
- Monitor PR #3 (6 security tests) → Wed
- Monitor PR #4 (5 React tests) → Wed
- Status: 41/47 tests expected by EOD Wed

**Thursday: Integration & Performance** (9 AM - 5 PM)
- Verify PR #5 (DevOps + 1 E2E test)
- Run load tests: <500ms p95
- Run security scans: 0 critical
- Status: 47/47 tests passing ✅

**Friday: Release Sign-Off** (9 AM - 11 AM)
- Final verification: All gates pass
- Decision: GO / NO-GO
- Deployment: 10:00 AM - 4:00 PM
- Status: Production live 🎉

---

## 🎯 DELIVERABLES CHECKLIST

### Documents to Create (Monday)

- [ ] WEEK4_QA_TEST_STRATEGY.md ✅ (Created)
- [ ] WEEK4_TEST_INFRASTRUCTURE_SETUP.md ✅ (Created)
- [ ] WEEK4_TEST_CASE_VERIFICATION.md ✅ (Created)
- [ ] WEEK4_QA_RELEASE_SIGN_OFF.md ✅ (Created)
- [ ] WEEK4_DAILY_PROGRESS_DASHBOARD.md ✅ (Created)

### Daily Tracking

- [ ] Monday: Update progress dashboard (infrastructure setup)
- [ ] Tuesday: Update dashboard (PR #1 - 15 tests)
- [ ] Wednesday: Update dashboard (PR #2+#3 - 21 tests)
- [ ] Thursday: Update dashboard (PR #4+#5 - 9 tests, load test, security)
- [ ] Friday: Final verification & release sign-off

### Friday Pre-Deployment Checklist

- [ ] All 47 tests: PASSING ✅
- [ ] Coverage: 82%+ ✅
- [ ] Performance: <500ms p95 ✅
- [ ] Security: 0 critical CVEs ✅
- [ ] Code quality: 0 critical errors ✅
- [ ] Regression: Week 3 features working ✅
- [ ] Deployment: Infrastructure ready ✅
- [ ] Release sign-off: APPROVED ✅

---

## 📊 COVERAGE TARGETS

### Backend (apps/api) - 82%+

| Module | Target | Status |
|--------|--------|--------|
| routes/ | 85% | Pending |
| services/ | 85% | Pending |
| middleware/ | 80% | Pending |
| utils/ | 85% | Pending |
| **TOTAL** | **82%+** | **Pending** |

### Frontend (apps/web) - 82%+

| Module | Target | Status |
|--------|--------|--------|
| pages/ | 80% | Pending |
| components/ | 80% | Pending |
| redux/ | 75% | Pending |
| services/ | 85% | Pending |
| **TOTAL** | **82%+** | **Pending** |

---

## 🧪 TEST BREAKDOWN (47 TOTAL)

| PR | Feature | Count | Deadline | Status |
|----|---------|-------|----------|--------|
| #1 | API Routes | 15 | Mon 5 PM | Pending |
| #2 | Firestore | 15 | Tue 12 PM | Pending |
| #3 | Security | 6 | Wed 5 PM | Pending |
| #4 | Frontend | 5 | Wed 5 PM | Pending |
| #5 | DevOps | 3+1 | Thu 5 PM | Pending |
| **TOTAL** | | **47** | **Thu 5 PM** | **Pending** |

---

## 🚀 DAILY EXECUTION SCRIPT

### Monday - Setup Day

```bash
# Step 1: Verify Jest configuration
cd apps/api
npm list jest jest-cli ts-jest @types/jest
npm run test -- --version

cd ../web
npm list jest jest-cli ts-jest @types/jest
npm run test -- --version

# Step 2: Verify Supertest setup
cd apps/api
npm list supertest
npm run test -- api.test.ts

# Step 3: Start Firestore emulator
firebase emulators:start --only firestore

# Step 4: Run baseline test
cd apps/api && npm run test -- --coverage

# Step 5: Check infrastructure docs
- Review WEEK4_QA_TEST_STRATEGY.md
- Review WEEK4_TEST_INFRASTRUCTURE_SETUP.md
- Update test templates

# Step 6: Update progress dashboard
- Log: Infrastructure setup complete
- Status: Ready for PR #1 Tuesday
```

### Tuesday - PR #1 Testing

```bash
# Step 1: Verify PR #1 arrival
- Check GitHub PR #1: Core API Routes
- Expected: 15 API endpoint tests
- Location: apps/api/tests/api.test.ts

# Step 2: Run PR #1 tests
cd apps/api
npm run test -- api.test.ts --verbose

# Step 3: Check coverage
npm run test -- --coverage
# Verify: routes/ module has 85%+ coverage

# Step 4: Update dashboard
- Log results in WEEK4_DAILY_PROGRESS_DASHBOARD.md
- Track: 15/47 tests passing
- Document: Backend coverage %

# Step 5: Monitor PR #4 (Frontend start)
- PR #4 should start Tuesday
- Expect first 3-4 component tests
```

### Wednesday - PR #2 + #3 Testing

```bash
# Step 1: Verify PR #2 & #3
- Check GitHub PR #2: Firestore Integration (15 tests)
- Check GitHub PR #3: Security Rules (6 tests)

# Step 2: Run Firestore tests
cd apps/api
npm run test -- integration/firestore.test.ts --verbose

# Step 3: Run Security tests
npm run test -- security.test.ts --verbose

# Step 4: Check coverage
npm run test -- --coverage
# Verify: services/ has 85%+ coverage
# Verify: firestore.rules tested

# Step 5: Monitor PR #4 completion
- Expect all 5 React component tests
- Verify responsive tests included

# Step 6: Update dashboard
- Log results: 41/47 tests now passing
- Track coverage: Target 82%+
- Document any failures with debugging notes
```

### Thursday - Final Testing

```bash
# Step 1: Verify PR #5 & Integration E2E
- Check GitHub PR #5: DevOps (health + monitoring)
- Expect 1 end-to-end integration test

# Step 2: Run all tests
npm run test               # All 47 tests
npm run test -- --coverage # Coverage report

# Step 3: Load testing
npm run test:load -- --duration 60s --concurrency 100

# Step 4: Security scan
npm audit --audit-level=moderate  # Backend
npm audit --audit-level=moderate  # Frontend

# Step 5: Regression testing
- Verify Week 3 features working
- Login/logout ✅
- Student CRUD ✅
- Attendance ✅

# Step 6: Update dashboard
- Log results: 47/47 tests passing ✅
- Track: 83%+ coverage ✅
- Performance: <500ms p95 ✅
- Status: READY FOR DEPLOYMENT ✅
```

### Friday - Release Sign-Off

```bash
# Step 1: Final verification (9:00 AM)
npm run test                # 47/47 PASSING?
npm run test -- --coverage  # 82%+?
npm run typecheck           # 0 errors?
npm run lint                # 0 errors?
npm audit                   # 0 critical?

# Step 2: Load test confirmation
# Check Thursday results documented

# Step 3: Security scan confirmation
# Check Thursday results documented

# Step 4: Release sign-off decision
# Complete WEEK4_QA_RELEASE_SIGN_OFF.md

# Step 5: Decision
# [ ] GO - DEPLOY
# [ ] NO-GO - BLOCK (if issues found)

# Step 6: Communication
# If GO: Notify team, DevOps begins deployment
# If NO-GO: Escalate to Lead Architect immediately
```

---

## 🔍 KEY COMMANDS (Bookmarks)

### Test Execution

```bash
# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Watch mode (for debugging)
npm run test:watch

# Specific test file
npm run test -- api.test.ts

# Specific pattern
npm run test -- --testNamePattern="POST /api"

# Debug mode
npm run test:debug
```

### Coverage Verification

```bash
# Generate coverage report
npm run test -- --coverage

# View HTML report
open coverage/index.html

# Check coverage threshold
npm run test -- --collectCoverageFrom="src/**/*.ts"
```

### Performance Testing

```bash
# Load test (if configured)
npm run test:load -- --duration 60s --concurrency 100

# Performance metrics
npm run test:perf
```

### Security Scanning

```bash
# Audit dependencies
npm audit --audit-level=moderate

# SAST scan (if configured)
npm run security:check

# Snyk check (if installed)
snyk test
```

---

## 📞 ESCALATION CONTACTS

### If Tests Start Failing

1. **First Stop:** Reproduce locally
   - Run: `npm run test:watch`
   - Find exact error
   - Check recent code changes

2. **Blocking Issue:** Notify immediately
   - Slack: `@Backend_Agent` (API/Firestore tests)
   - Slack: `@Frontend_Agent` (React tests)
   - Slack: `@DevOps_Agent` (DevOps/infrastructure)
   - SLA: 15 minutes to respond

3. **Escalate if:</strong>
   - Issue unresolved >30 minutes
   - Multiple tests failing
   - Coverage drops significantly
   - Performance metrics unhealthy

### Contacts

| Role | Slack | Focus |
|------|-------|-------|
| Lead Architect | @lead-architect | Blocker decisions |
| Backend Agent | @backend-agent | API/DB test issues |
| Frontend Agent | @frontend-agent | React test issues |
| DevOps Agent | @devops-agent | Infrastructure/deploy |
| Product Lead | @product-lead | Release decision final |

---

## ✅ SUCCESS CRITERIA

### By Friday 4:00 PM (Non-Negotiable)

```
✅ All 47 tests passing (100%)
✅ Coverage 82%+ (all modules)
✅ Performance <500ms p95 latency
✅ Security: 0 critical vulnerabilities
✅ Code quality: 0 critical errors
✅ Regression: Week 3 features working
✅ Release sign-off: APPROVED
✅ Infrastructure: Ready for deployment
```

### Failure = Deployment Blocked

If ANY criteria fail:
1. NO-GO decision given
2. Team notified immediately
3. Issues documented
4. Escalated to Lead Architect
5. Deployment delayed to following Monday

---

## 📝 IMPORTANT NOTES

### Coverage Truth

- **82%+ is required, not optional**
- Coverage includes: lines, branches, functions, statements
- All 4 metrics must meet threshold
- Untested code = lower coverage

### Load Testing Reality

- <500ms p95 means 95% of requests must be ≤500ms
- Under 100 concurrent connections
- For 60 seconds continuously
- Any timeout = test fails

### Security Standard

- Zero high or critical CVEs acceptable
- Firestore security rules must be tested
- Hard-coded secrets must not exist
- All dependencies must be scanned

---

## 🎉 SUCCESS CELEBRATION

When all criteria are met Friday:

1. **Release sign-off given** ✅
2. **Team notified** (Slack announcement)
3. **Deployment begins** (DevOps takes over)
4. **Monitoring started** (Production watch begins)
5. **Pilot schools activated** (Business goes live)
6. **Team celebration** (You did it! 🎊)

---

## 📚 SUPPORTING DOCUMENTS

**Read in this order:**

1. [WEEK4_QA_TEST_STRATEGY.md](WEEK4_QA_TEST_STRATEGY.md) - Full strategy & plan
2. [WEEK4_TEST_INFRASTRUCTURE_SETUP.md](WEEK4_TEST_INFRASTRUCTURE_SETUP.md) - Technical setup
3. [WEEK4_TEST_CASE_VERIFICATION.md](WEEK4_TEST_CASE_VERIFICATION.md) - All 47 tests detailed
4. [WEEK4_DAILY_PROGRESS_DASHBOARD.md](WEEK4_DAILY_PROGRESS_DASHBOARD.md) - Daily tracking
5. [WEEK4_QA_RELEASE_SIGN_OFF.md](WEEK4_QA_RELEASE_SIGN_OFF.md) - Friday release gates

---

## 🚀 YOU'RE READY TO START

**Next Action:** Monday May 6, 9:00 AM

1. Read this document one more time
2. Attend team standup
3. Confirm test infrastructure setup plan
4. Begin Monday execution

**Your test infrastructure must be operational by Monday 5 PM.**

Good luck! The team is counting on you to deliver Week 4 with zero critical bugs. 💪

---

**Document:** Week 4 QA Master Guide  
**Created:** April 9, 2026  
**Status:** ✅ READY FOR EXECUTION  
**Target:** May 6-10, 2026
