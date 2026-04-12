# WEEK 4 KICKOFF - Foundation Phase Final Sprint

**Week:** May 6-10, 2026  
**Phase:** Phase 1 (Weeks 1-4) - Foundation & Infrastructure - WEEK 4/4  
**Goal:** Production-ready foundation with first API suite deployed  
**Team Size:** 2-3 engineers (backend, frontend, DevOps)  
**Status:** Foundation infrastructure COMPLETE + first feature APIs READY  

---

## 🎯 WEEK 4 OBJECTIVES

By Friday May 10, you must have:

1. ✅ **First 5 API endpoints** fully tested on Cloud Run (production)
2. ✅ **CI/CD pipeline** auto-deploying every merge to main branch
3. ✅ **Firestore collections** set up (Schools, Students, Staff, Attendance, Grades)
4. ✅ **Security rules** enforced (role-based access control)
5. ✅ **Monitoring & alerting** live (error tracking, performance metrics)
6. ✅ **Test suite** with 80%+ coverage
7. ✅ **Authentication flow** fully integrated (Firebase Auth)
8. ✅ **Frontend React shell** deployed to production
9. ✅ **Documentation** complete (API docs, deployment runbooks)
10. ✅ **Pilot school approval** (at least 1 school signed up)

**Success Metric:** Production system handles 100 simultaneous users with <500ms response time ✅

---

## 📊 COMING INTO WEEK 4 (Expected State from Weeks 1-3)

### Infrastructure Status (Should be READY)
```
✅ GCP Project: school-erp-prod (billing enabled)
✅ Firestore: Created in asia-south1, emulator running locally
✅ Cloud Run: Service created, domain configured
✅ Cloud Logging: Logging pipeline active
✅ GitHub Repo: school-erp-api (main branch protected)
✅ CI/CD: Cloud Build configured (auto-deploy on merge)
✅ Firebase Auth: Google OAuth configured
✅ Secrets Manager: GCP credentials stored securely
```

### Team Status (Expected)
```
✅ Backend Engineer: Full-time, Day 1 complete
✅ You (Lead): Hired frontend engineer (starting Week 3 or 4)
✅ DevOps: Part-time or embedded in backend team
```

### Code Foundation (Expected Deliverables from Weeks 1-3)
```
backend/
├── src/
│   ├── index.ts               (Express server)
│   ├── middleware/
│   │   ├── auth.ts            (Firebase Auth verification)
│   │   └── errors.ts          (Error handling)
│   ├── routes/
│   │   ├── schools.ts         (School API - STUB)
│   │   └── students.ts        (Student API - PARTIAL)
│   └── services/
│       └── firestore.ts       (Firestore client)
├── tests/
│   ├── schools.test.ts        (2-3 tests)
│   ├── students.test.ts       (3-5 tests)
│   └── auth.test.ts           (2 tests)
├── Dockerfile                 (Multi-stage build)
├── cloudbuild.yaml            (CI/CD pipeline)
└── package.json               (Dependencies)

frontend/
├── src/
│   ├── App.tsx                (React shell - STUB)
│   ├── pages/
│   │   └── Dashboard.tsx      (Placeholder)
│   └── components/
│       └── Header.tsx         (Basic header)
├── Dockerfile                 (nginx + React build)
└── package.json
```

---

## 📋 WEEK 4 DETAILED PLAN (Day-by-Day)

### MONDAY, MAY 6 - API Build Sprint Kickoff

**Morning Standup (30 min) - 9:00 AM**
```
Attendees: You, Backend Eng, Frontend Eng (if started)
Agenda:
  1. Week 4 goals review (5 min)
  2. Demo: What was built Weeks 1-3 (5 min)
  3. This week's 5 APIs breakdown (10 min)
  4. Blockers check (5 min)
  5. Monday assignments (5 min)
```

**Backend Engineer: Days 1 Assignment**

**PLAN (Follow PRI Framework)**
- Create document: `WEEK4_API_PLAN.md`
- List all 5 APIs:
  1. `POST /api/v1/schools` - Create school
  2. `GET /api/v1/schools/{id}` - Get school details
  3. `POST /api/v1/schools/{id}/students` - Add students
  4. `GET /api/v1/schools/{id}/students` - List students
  5. `POST /api/v1/schools/{id}/attendance` - Mark attendance

- For each API:
  - [ ] Request schema (Firestore document shape)
  - [ ] Response schema (success + error cases)
  - [ ] Authentication requirement
  - [ ] Test cases (3-5 per API)
  - [ ] File locations (route, service, test)

- [ ] Write plan in PR #1, post link in Slack

**REVIEW (You review)**
- [ ] Does plan match API spec document?
- [ ] Are test cases comprehensive?
- [ ] Any security gaps?
- [ ] Feedback comments in PR

**Afternoon (After approval):**
- [ ] IMPLEMENT: Code all 5 API routes (stub services)
- [ ] TEST: Write tests (target 80%+ coverage)
- [ ] COMMIT: `feat: Add 5 core APIs (routes layer)`

**You (Lead):**
- [ ] Email pilot schools (2-3 more): "API ready for testing, pilot program free setup"
- [ ] Review plan document (30 min)
- [ ] Create Week 4 status dashboard
- [ ] Interview frontend engineer candidates (if not hired yet)

**Frontend Engineer (if starting today):**
- [ ] Environment setup (clone repo, npm install, Firestore emulator)
- [ ] Read React architecture doc
- [ ] Set up basic React app structure
- [ ] Create PR #2: `scaffold: Initial React app + routing`

**EOD Target:** ✅ Stub APIs created, tests written, PRs ready for review

---

### TUESDAY, MAY 7 - Connect APIs to Firestore + Enhance Tests

**Morning Standup (15 min)**
```
Review: How are PRs looking?
Goal: Connect services to actual Firestore
Blockers: Any GitHub issues to discuss?
```

**Backend Engineer:**

**REVIEW Phase (You + Backend):**
- [ ] Code review PR #1 (5 APIs)
  - Validate error handling
  - Check auth middleware usage
  - Ensure Zod validation (when added)
- [ ] Approve + merge to main branch
  - ➜ Automatic deploy to Cloud Run staging
  - ➜ Tests run in CI/CD
  - ➜ Performance check

**IMPLEMENT Phase 2:**
- Tasks:
  1. Create `src/services/schools.ts` (Firestore queries for schools)
  2. Create `src/services/students.ts` (Firestore queries for students)
  3. Update routes to use services (connect to Firestore)
  4. Add Zod validation to request bodies
  5. Enhance error handling with standard responses

- Update API routes:
  ```typescript
  // routes/schools.ts (OLD - just return mock data)
  router.get('/:id', (req, res) => {
    res.json({ id: 'mock-123', name: 'Test School' });
  });

  // routes/schools.ts (NEW - use service + Firestore)
  router.get('/:id', async (req, res) => {
    try {
      const school = await schoolService.getSchoolById(req.params.id);
      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }
      res.json(school);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  ```

- Create PR #3: `feat: Connect APIs to Firestore + add validation`

**You (Lead):**
- [ ] Review PR #2 (Frontend - React structure)
- [ ] Start creating Firestore security rules document
- [ ] Set up monitoring dashboard (Cloud Logging)

**Frontend Engineer:**

**REVIEW Phase:**
- [ ] You review React structure PR
- [ ] Ask for: routing setup, auth integration start

**IMPLEMENT Phase:**
- [ ] Add React Router configuration
- [ ] Create Login page component
- [ ] Integrate Firebase Auth SDK
- [ ] Test login flow locally
- [ ] Create PR #3: `feat: Add authentication UI`

**EOD Target:** ✅ PRs #2 & #3 merged, APIs connected to Firestore, Frontend auth UI ready

---

### WEDNESDAY, MAY 8 - Security Rules + Monitoring

**Morning Standup (15 min)**
```
Status: How are the integrations looking?
Goal: Secure everything + set up monitoring
```

**Backend Engineer:**

**PLAN:**
- Document: `WEEK4_SECURITY_PLAN.md`
- Firestore security rules (role-based):
  - [ ] Admins can read/write all schools
  - [ ] Teachers can read/write their school only
  - [ ] Students can read schedules, attendance
  - [ ] Unauthorized users cannot access data
- Test all access scenarios
- Create PR #4: `feat: Add Firestore security rules`

**IMPLEMENT:**
- [ ] Write Firestore security rules (rules.ts or firestore.rules)
- [ ] Test with unauthenticated requests (should fail)
- [ ] Test with wrong role (should fail)
- [ ] Test with correct role (should succeed)
- [ ] Integration test: Full flow (login → call API → Firestore read/write)

**You (Lead):**

**PLAN:**
- Document: `WEEK4_MONITORING_PLAN.md`
- Set up alerting for:
  - [ ] Error rate > 1% (alert)
  - [ ] Response time > 1000ms (warning)
  - [ ] No errors for 24h (success log)
  - [ ] Cloud Run out of memory (critical)

**IMPLEMENT:**
- [ ] Create Cloud Logging dashboard
- [ ] Add metric-based alerts
- [ ] Create PagerDuty integration (optional)
- [ ] Write runbook: "How to respond to alerts"

**Frontend Engineer:**

**IMPLEMENT:**
- [ ] Add API client (axios + auth headers)
- [ ] Create Dashboard page
- [ ] Add error boundary component
- [ ] Test login + redirect flow
- [ ] Create PR #4: `feat: Add API client + dashboard`

**Integration Test (All):**
- [ ] End-to-end: Frontend login → API call → Firestore read
  - Expected: Successful data fetch
  - Expected: Unauthorized users redirected to login

**EOD Target:** ✅ Security rules live, monitoring active, E2E flow tested

---

### THURSDAY, MAY 9 - Performance Testing + Documentation

**Morning Standup (15 min)**
```
Status: Security + Monitoring online?
Goal: Performance testing + complete docs
```

**Backend Engineer:**

**PLAN:**
- Document: `WEEK4_PERF_TEST_PLAN.md`
- Test scenarios:
  - [ ] 10 concurrent users (should be instant)
  - [ ] 100 concurrent users (should be <500ms)
  - [ ] 1000 concurrent users (load test - see where it breaks)
  - [ ] Check error rate at each level
  - [ ] Check Cloud Run scaling behavior

**IMPLEMENT:**
- [ ] Set up k6 load testing tool
- [ ] Create load test script (simulate 100 users hitting API)
- [ ] Run test against staging Cloud Run
- [ ] Document results:
  - Latency at each level
  - Throughput (requests/sec)
  - Error rate
  - Auto-scaling behavior
- [ ] Create PR #5: `test: Add performance test suite`

```bash
# Example k6 test
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },    // 10 users
    { duration: '1m', target: 100 },    // 100 users
    { duration: '30s', target: 0 },     // ramp down
  ],
};

export default function() {
  let response = http.get('https://school-erp-api-xyz.run.app/api/v1/schools/123');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

**You (Lead):**

**Create Documentation:**
- [ ] `API_DOCUMENTATION.md` - Complete API reference
  - All 5 endpoints + full examples
  - Authentication flow
  - Error codes + meanings
  - Rate limits
- [ ] `DEPLOYMENT_RUNBOOK.md` - How to deploy to production
  - Step-by-step Cloud Run deployment
  - Database migration process
  - Rollback procedure
- [ ] `MONITORING_GUIDE.md` - How to monitor production
  - Cloud Logging dashboard
  - How to interpret metrics
  - Alert response procedures
- [ ] `INCIDENT_RESPONSE.md` - What to do if things break
  - 5xx error response
  - Database down response
  - DDoS mitigation

**Frontend Engineer:**

**IMPLEMENT:**
- [ ] Add error handling + error page
- [ ] Add loading states + spinners
- [ ] Create school selection dropdown
- [ ] Create student list component
- [ ] Test with API (integration)
- [ ] Create PR #5: `feat: Complete dashboard UI`

**EOD Target:** ✅ Performance tested, documentation complete, UImore polished

---

### FRIDAY, MAY 10 - Week 4 Sign-Off + Pilot Launch

**Morning Standup (15 min)**
```
Status: All PRs merged?
Goal: Week 4 sign-off + pilot school testing
```

**All Team:**

**REVIEW & MERGE:**
- [ ] All PRs reviewed + merged to main
- [ ] Tests passing (CI/CD green)
- [ ] Code coverage > 80%
- [ ] No critical issues in security review

**TESTING:**
- [ ] Manual smoke test:
  - [ ] Create test school in Firestore
  - [ ] Call GET school API (should work)
  - [ ] Call create student API (should work)
  - [ ] Check logs in Cloud Logging (no errors)
  - [ ] Check performance metrics (all green)

**You (Lead):**

**PLAN & EXECUTE PILOT LAUNCH:**
- [ ] Email pilot schools: "API ready for testing"
  ```
  Subject: School ERP Pilot Launch Ready!
  
  Hi Principal,
  
  Your free pilot is ready! Here's what you get:
  - Free setup (normally ₹5K)
  - ₹10K/year pricing (50% discount)
  - Free onboarding
  - 24/7 support during pilot
  
  Next: We'll schedule a 1-hour demo + walkthrough
  Available times: Saturday 10-11 AM or Sunday 2-3 PM
  
  Reply with preferred time!
  ```

- [ ] Schedule 2-3 demo calls with pilot schools (Sat/Sun)
- [ ] Prepare demo script:
  1. "This is your school dashboard" (10 min)
  2. "Here's how to add students" (5 min)
  3. "Here's how to mark attendance" (5 min)
  4. "Questions?" (5 min)

**Create Week 4 Sign-Off Document:**

```markdown
# WEEK 4 SIGN-OFF

**Week:** May 6-10, 2026
**Status:** ✅ ALL OBJECTIVES MET

## Delivered
- ✅ 5 API endpoints (schools, students, attendance)
- ✅ Connected to Firestore
- ✅ CI/CD pipeline auto-deploying
- ✅ Security rules enforced
- ✅ Monitoring + alerting live
- ✅ 80%+ test coverage
- ✅ Frontend React shell + auth UI
- ✅ Complete documentation
- ✅ Performance tested (100 concurrent users ✅)
- ✅ Pilot schools ready to onboard

## Team Performance
- Backend Engineer: 15 PRs, all merged
- Frontend Engineer: 5 PRs, all merged
- You: 3 documentation PRs, pilot partnerships started

## Metrics
- Test Pass Rate: 100% (47/47)
- Code Coverage: 82%
- API Response Time p95: 280ms
- Production Uptime: 100%
- User Errors: 0

## Next Phase: WEEK 5
- Week 5-8: Build core features (attendance, grades, fees)
- Week 5 starts Monday May 13
- Target: 8-10 core APIs + UI pages

**Signed:** [Your Name], Lead
**Date:** May 10, 2026
```

**EOD Target:** ✅ Week 4 complete, pilot schools identified, Phase 1 complete

---

## 📁 WEEK 4 FILE STRUCTURE

By end of Week 4, your repo should look like:

```
school-erp/
├── backend/
│   ├── src/
│   │   ├── index.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   └── errors.ts
│   │   ├── routes/
│   │   │   ├── schools.ts (5 endpoints)
│   │   │   ├── students.ts
│   │   │   └── attendance.ts
│   │   ├── services/
│   │   │   ├── schools.ts (Firestore queries)
│   │   │   ├── students.ts
│   │   │   └── attendance.ts
│   │   └── types.ts (TypeScript interfaces)
│   ├── tests/
│   │   ├── schools.test.ts (~5 tests)
│   │   ├── students.test.ts (~5 tests)
│   │   ├── attendance.test.ts (~5 tests)
│   │   └── auth.test.ts (~3 tests)
│   ├── .env.example
│   ├── Dockerfile
│   ├── cloudbuild.yaml
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   └── Students.tsx
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── api/
│   │   │   └── client.ts (axios with auth)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useApi.ts
│   │   └── App.css
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── docs/
│   ├── API_DOCUMENTATION.md (complete reference)
│   ├── DEPLOYMENT_RUNBOOK.md (how to deploy)
│   ├── MONITORING_GUIDE.md (how to monitor)
│   ├── INCIDENT_RESPONSE.md (what to do if broken)
│   ├── ARCHITECTURE.md (system overview)
│   └── FIRESTORE_SCHEMA.md (database schema)
│
├── infrastructure/
│   ├── firestore.rules (security ruleset)
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── cloud_run.tf
│   │   └── variables.tf
│   └── k6/
│       └── performance_test.js (load testing)
│
├── .github/
│   ├── workflows/
│   │   └── ci.yml (CI/CD pipeline)
│   └── CODEOWNERS (who owns what)
│
├── README.md (project overview)
├── WEEK4_KICKOFF_PLAN.md (this file)
├── WEEK4_SIGN_OFF.md (completion report)
└── docker-compose.yml (local dev setup)
```

---

## ✅ SUCCESS CRITERIA - WEEK 4

At Friday 5 PM (May 10), you have achieved:

| Criterion | Target | Goal |
|-----------|--------|------|
| **APIs Deployed** | 5 | All live on Cloud Run ✅ |
| **Tests Written** | 80%+ coverage | 47 tests, 82% coverage |
| **Tests Passing** | 100% | 47/47 ✅ |
| **Frontend Pages** | 3 | Login, Dashboard, Students ✅ |
| **Security** | RBAC enforced | Firestore rules live ✅ |
| **Monitoring** | Alerts active | Cloud Logging + alerts ✅ |
| **Documentation** | Complete | 4 major docs + API ref ✅ |
| **Performance** | 100 concurrent users | <500ms response time ✅ |
| **Pilot Schools** | 1+ signed up | Ready for onboarding ✅ |
| **Team Velocity** | 200 LOC/hr | On track ✅ |

---

## 🚀 MOMENTUM GOING INTO WEEK 5

**What Week 5 will build on:**
- Week 4 leaves you with: Production-grade infrastructure + 5 core APIs
- Week 5 adds: 8-10 more APIs (attendance, grades, fees features)
- Week 6-8: Complete core features (payroll, reports, notifications)

**Status at end of Week 4:**
- ✅ Phase 1 COMPLETE (Foundation ready)
- ✅ Phase 2 READY TO START (Feature development)
- ✅ 42% through 24-week roadmap (on schedule)

---

## 📞 SUPPORT & ESCALATION

If during Week 4 you hit blockers:

**Backend Issues:**
- Firestore not working? Check emulator + service account permissions
- Deploy failing? Check Cloud Build logs
- Tests failing? Check Firebase Admin SDK version

**Frontend Issues:**
- Login not working? Check Firebase Auth config
- API calls failing? Check CORS headers + auth tokens
- Build failing? Check Node.js version (must be 18+)

**Infrastructure Issues:**
- Cloud Run cost too high? Check auto-scaling config
- Database queries slow? Check Firestore indexes
- Logs not showing? Check Cloud Logging sink configuration

**Escalation:**
- Week 4 blockers blocking progress? Slack the team immediately
- Need architect review? Create `[URGENT]` PR comment
- Design decision needed? Email to Lead Architect + wait max 2 hours

---

## 📝 NOTES FOR YOU

- Keep daily standup to 15 min max (check velocity)
- Never skip code review (security gate)
- Test coverage must stay at 80%+ (no exceptions)
- All PRs must have tests + documentation (before merge)
- Deploy to staging on every merge (fail fast, fix early)
- Production deploy only after 24-hour soak test on staging

**Final Note:** Week 4 is your last foundation week. Starting Week 5, you're building features customers will see. Quality can't slip. Test everything. Document everything. Deploy carefully.

---

**Week 4 Kickoff Created:** April 9, 2026  
**Week 4 Execution Dates:** May 6-10, 2026  
**24-Week Sprint Progress:** Phase 1/4 complete (25%)
