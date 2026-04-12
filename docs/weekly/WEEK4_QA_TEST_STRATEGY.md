# Week 4 QA Test Strategy & Coverage Plan

**QA Agent Owner:** Test Strategy, Coverage Verification, Release Sign-Off  
**Duration:** May 6-10, 2026  
**Success Metric:** 47/47 tests passing ✅ | 82%+ coverage ✅ | Zero critical bugs ✅

---

## 🎯 QA RESPONSIBILITIES & OBJECTIVES

### Primary Goals
1. **Test Infrastructure:** Jest + Supertest + Istanbul configured and operational
2. **Coverage Tracking:** 82%+ coverage gates in CI/CD enforced daily
3. **47 Test Verification:** All tests implemented, passing, properly integrated
4. **Release Sign-Off:** Friday Friday production deployment approval given

### Success Definitions
- **100% Test Pass Rate:** All 47 tests passing consistently
- **82%+ Coverage:** Entire codebase covered by tests
- **Zero Critical Bugs:** No blocker-level issues in production
- **Performance Validated:** <500ms p95 latency confirmed under load
- **Security Cleared:** No high/critical CVEs found

---

## 📊 TEST BREAKDOWN BY PR

### PR #1: Core API Routes (Backend Agent)
**Target:** 15 API endpoint tests  
**Scope:** REST routes for schools, students, attendance  
**Test Categories:**
- Happy path tests (5): All endpoints successful response
- Error handling tests (5): 4xx/5xx scenarios, validation failures
- Authentication tests (3): JWT token validation, unauthorized access
- Rate limiting tests (2): ThrottleHandler working correctly

**Test Coverage Target:** 85%+ for `apps/api/src/routes/`

**Test Checklist:**
```
✓ POST /api/v1/schools - Create school
✓ GET /api/v1/schools/:id - Get school details
✓ PUT /api/v1/schools/:id - Update school
✓ DELETE /api/v1/schools/:id - Delete school
✓ GET /api/v1/schools - List schools (with pagination)
✓ POST /api/v1/students - Add student
✓ GET /api/v1/students - List students
✓ GET /api/v1/students/:id - Get student details
✓ PUT /api/v1/students/:id - Update student
✓ DELETE /api/v1/students/:id - Delete student
✓ POST /api/v1/attendance - Mark attendance
✓ GET /api/v1/attendance/:studentId - Get attendance records
✓ PUT /api/v1/attendance/:id - Update attendance
✓ Error: Invalid request body returns 400
✓ Error: Unauthorized returns 401
```

### PR #2: Firestore Integration (Backend Agent)
**Target:** 15 Firestore integration tests  
**Scope:** Database CRUD operations, queries, indexes  
**Test Categories:**
- Collection operation tests (8): create, read, update, delete for each collection
- Query tests (4): Filter, sort, pagination, aggregation
- Transaction tests (2): Multi-document updates
- Error handling tests (1): Connection failures, validation

**Collections to Test:**
- Schools collection: Create, read, update, delete school records
- Students collection: Full CRUD + pagination
- Attendance collection: Time-series records, filtering by date
- Grades collection: Create, update grades per student

**Test Coverage Target:** 85%+ for `apps/api/src/services/firestore.ts`

**Test Checklist:**
```
✓ Firestore: Create school record
✓ Firestore: Read school record by ID
✓ Firestore: Update school record
✓ Firestore: Delete school record
✓ Firestore: Create student record
✓ Firestore: Read student record
✓ Firestore: Update student record
✓ Firestore: Delete student record
✓ Firestore: Query students by school_id
✓ Firestore: Query with filters and sorting
✓ Firestore: Pagination - retrieve page 1, page 2
✓ Firestore: Create grades for student
✓ Firestore: Transaction - update multiple documents
✓ Firestore: Handle connection error gracefully
✓ Firestore: Validate required fields before write
```

### PR #3: Security Rules & RBAC (Backend Agent)
**Target:** 6 security-focused tests  
**Scope:** Firestore security rules, role-based access control  
**Test Categories:**
- Role-based access tests (4): Admin, teacher, student, parent roles
- Permission tests (1): Verify unauthorized access denied
- Data encryption tests (1): Sensitive data encrypted at rest

**Test Coverage Target:** 80%+ for `firestore.rules`

**Test Checklist:**
```
✓ Security: Admin can read all documents
✓ Security: Admin can write all documents
✓ Security: Teacher can read student data only
✓ Security: Teacher cannot delete records
✓ Security: Student can only read their own data
✓ Security: Unauthenticated user denied all access
```

### PR #4: Frontend React Components (Frontend Agent)
**Target:** 5 React component tests  
**Scope:** Login form, dashboard, layout components  
**Test Categories:**
- Component rendering tests (2): Login form renders, dashboard renders after auth
- Integration tests (2): Form submission flow, Redux state updates
- Responsive tests (1): Mobile, tablet, desktop viewport handling

**Test Coverage Target:** 80%+ for `apps/web/src/components/` and `apps/web/src/pages/`

**Test Checklist:**
```
✓ Frontend: Login form renders with email/password fields
✓ Frontend: Dashboard renders after successful authentication
✓ Frontend: Form submission sends POST to /api/auth/login
✓ Frontend: Redux store updates with user data after login
✓ Frontend: Responsive design - mobile/tablet/desktop breakpoints
```

### PR #5: DevOps/Monitoring Documentation (DevOps Agent)
**Target:** 1 smoke test + health check verification  
**Scope:** Deployment health, monitoring dashboards functional  
**Test Categories:**
- Health check tests (1): Cloud Run endpoints responding
- Monitoring tests (0): Dashboards setup verified manually

**Test Checklist:**
```
✓ DevOps: Cloud Run health check endpoint responding
✓ DevOps: Monitoring dashboard collecting metrics
✓ DevOps: Alerting rules configured and testing
```

---

## 🔧 TEST INFRASTRUCTURE REQUIREMENTS

### Technology Stack
- **Test Framework:** Jest 29+
- **API Testing:** Supertest 6+
- **Coverage Tool:** Istanbul/nyc
- **Mocking:** Mock Firebase Admin SDK for unit tests
- **Emulator:** Firestore Emulator for integration tests
- **CI/CD:** GitHub Actions test gate (82% coverage minimum)

### Configuration Files Required
```
apps/api/
├── jest.config.js              # Jest configuration
├── tsconfig.test.json          # TypeScript test config
├── .nycrc.json                 # Istanbul coverage config
└── tests/
    ├── unit/                   # Unit tests (60% of tests)
    ├── integration/            # Integration tests (30% of tests)
    └── e2e/                    # End-to-end tests (10% of tests)

apps/web/
├── jest.config.js              # Jest configuration
├── setup-tests.ts              # Test environment setup
└── src/__tests__/              # Component tests
```

### CI/CD Gates (GitHub Actions)
```yaml
Test Gates:
- Tests must pass: 47/47
- Coverage must be: 82%+ (all files)
- No critical eslint violations
- TypeScript strict mode passes
- No critical security vulnerabilities
```

### Local Development Workflow
```bash
# Run all tests with watch mode
npm run test:watch

# Run tests with coverage report
npm run test -- --coverage

# Run integration tests only
npm run test -- --testPathPattern=integration

# Run specific test file
npm run test -- api.test.ts

# Generate HTML coverage report
npm run test -- --coverage --coverageReporters=html
```

---

## 📈 DAILY TEST VERIFICATION SCHEDULE

### Monday May 6 - Test Foundation Day

**Morning (9:00 AM - 12:00 PM):**
- [ ] Verify Jest configuration in both apps/api and apps/web
- [ ] Verify Supertest installed and configured
- [ ] Verify Firestore emulator can start locally
- [ ] Verify Istanbul coverage reporting works
- [ ] Set up CI/CD test gates in GitHub Actions

**Afternoon (1:00 PM - 5:00 PM):**
- [ ] Create test infrastructure documentation
- [ ] Create test case templates (API, component, integration)
- [ ] Set up coverage tracking dashboard template
- [ ] Create daily progress tracking sheet

**EOD Verification:**
```bash
npm run test              # Should pass (establishes baseline)
npm run test -- --coverage  # Should generate coverage report
```

### Tuesday May 7 - PR #1 & #4 Testing

**Morning (9:00 AM - 12:00 PM):**
- [ ] Backend Agent commits PR #1 (15 API tests)
- [ ] Frontend Agent starts PR #4 (5 component tests)
- [ ] Run: `npm run test` → Verify all tests passing

**Afternoon (1:00 PM - 5:00 PM):**
- [ ] Verify 15 API tests from PR #1 passing
- [ ] Check coverage from PR #1
- [ ] Verify >= 3 component tests from PR #4
- [ ] Document any failing tests

**EOD Verification:**
- [ ] PR #1: 15/15 tests passing
- [ ] Coverage report generated and logged
- [ ] Any failures documented with debugging notes

### Wednesday May 8 - PR #2 & #3 Testing

**Morning (9:00 AM - 12:00 PM):**
- [ ] Backend Agent commits PR #2 (15 Firestore tests)
- [ ] Backend Agent commits PR #3 (6 security tests)
- [ ] Run: `npm run test` → Verify all tests passing

**Afternoon (1:00 PM - 5:00 PM):**
- [ ] Verify 15 Firestore tests passing
- [ ] Verify 6 security tests passing
- [ ] Verify Frontend:  5/5 component tests complete (PR #4)
- [ ] Check cumulative coverage: target 82%+

**EOD Verification:**
- [ ] PR #1: 15/15 ✅
- [ ] PR #2: 15/15 ✅
- [ ] PR #3: 6/6 ✅
- [ ] PR #4: 5/5 ✅
- [ ] Total: 41/41 tests ✅
- [ ] Coverage: 82%+ ✅

### Thursday May 9 - Integration & Performance Testing

**Morning (9:00 AM - 12:00 PM):**
- [ ] DevOps Agent commits PR #5 (docs + health check)
- [ ] Run full test suite: `npm run test`
- [ ] Verify all 47 tests passing: 47/47 ✅
- [ ] Generate coverage report: target 82%+

**Afternoon (1:00 PM - 5:00 PM):**
- [ ] Integration testing: Auth → API → Firestore → Response flow
- [ ] Load testing: Verify <500ms p95 latency
- [ ] Regression testing: Week 3 features still working
- [ ] Document results

**EOD Verification:**
- [ ] All 47 tests passing: 47/47 ✅
- [ ] Coverage: 82%+ ✅
- [ ] Load test: <500ms p95 ✅
- [ ] Regression: Week 3 features working ✅

### Friday May 10 - Release Sign-Off & Deployment

**Morning (9:00 AM - 12:00 PM) - Final Verification:**
```
PRE-DEPLOYMENT CHECKLIST:
✓ Run full test suite: npm run test → 47/47 passing
✓ Check coverage: npm run test -- --coverage → 82%+
✓ TypeScript check: npm run typecheck → no errors
✓ Linting check: npm run lint → no errors
✓ Security scan: npm run security:check → no critical issues
✓ Load test results: <500ms p95 latency confirmed
✓ Regression test: Week 3 features live and working
✓ Pre-deployment monitoring: Dashboards operational
```

**Afternoon (1:00 PM - 4:00 PM) - Deployment & Monitoring:**
- [ ] 1:00 PM: Deployment begins (10% canary)
- [ ] 1:05 PM: Monitor error rates & latency (5 min watch)
- [ ] 1:10 PM: Increase to 50% if metrics healthy
- [ ] 1:15 PM: Monitor error rates & latency (5 min watch)
- [ ] 1:20 PM: Roll to 100% if metrics healthy
- [ ] 1:25 PM: Final verification

**Release Sign-Off Decision:** GO / NO-GO

---

## 📋 TEST VERIFICATION CHECKLIST

### Complete Test Coverage Matrix

| # | Test Name | PR | Type | Status | Pass/Fail | Notes |
|---|-----------|----|----|--------|-----------|-------|
| 1 | POST /api/v1/schools | #1 | API | Pending | ⏳ | Create school |
| 2 | GET /api/v1/schools/:id | #1 | API | Pending | ⏳ | Get school |
| 3 | PUT /api/v1/schools/:id | #1 | API | Pending | ⏳ | Update school |
| 4 | DELETE /api/v1/schools/:id | #1 | API | Pending | ⏳ | Delete school |
| 5 | GET /api/v1/schools | #1 | API | Pending | ⏳ | List schools w/pagination |
| 6 | POST /api/v1/students | #1 | API | Pending | ⏳ | Add student |
| 7 | GET /api/v1/students | #1 | API | Pending | ⏳ | List students |
| 8 | GET /api/v1/students/:id | #1 | API | Pending | ⏳ | Get student details |
| 9 | PUT /api/v1/students/:id | #1 | API | Pending | ⏳ | Update student |
| 10 | DELETE /api/v1/students/:id | #1 | API | Pending | ⏳ | Delete student |
| 11 | POST /api/v1/attendance | #1 | API | Pending | ⏳ | Mark attendance |
| 12 | GET /api/v1/attendance/:studentId | #1 | API | Pending | ⏳ | Get attendance records |
| 13 | PUT /api/v1/attendance/:id | #1 | API | Pending | ⏳ | Update attendance |
| 14 | Error: Invalid body → 400 | #1 | Error | Pending | ⏳ | Validation error |
| 15 | Error: Unauthorized → 401 | #1 | Auth | Pending | ⏳ | Auth error |
| 16 | Firestore: Create school | #2 | DB | Pending | ⏳ | Create collection record |
| 17 | Firestore: Read school | #2 | DB | Pending | ⏳ | Read collection record |
| 18 | Firestore: Update school | #2 | DB | Pending | ⏳ | Update collection record |
| 19 | Firestore: Delete school | #2 | DB | Pending | ⏳ | Delete collection record |
| 20 | Firestore: Create student | #2 | DB | Pending | ⏳ | Create student record |
| 21 | Firestore: Read student | #2 | DB | Pending | ⏳ | Read student record |
| 22 | Firestore: Update student | #2 | DB | Pending | ⏳ | Update student record |
| 23 | Firestore: Delete student | #2 | DB | Pending | ⏳ | Delete student record |
| 24 | Firestore: Query by school_id | #2 | Query | Pending | ⏳ | Filter query |
| 25 | Firestore: Query with filters/sort | #2 | Query | Pending | ⏳ | Advanced query |
| 26 | Firestore: Pagination page 1 | #2 | Query | Pending | ⏳ | Pagination test |
| 27 | Firestore: Pagination page 2 | #2 | Query | Pending | ⏳ | Pagination test |
| 28 | Firestore: Create grades | #2 | DB | Pending | ⏳ | Grades record |
| 29 | Firestore: Transaction update | #2 | Transaction | Pending | ⏳ | Multi-doc update |
| 30 | Firestore: Handle connection error | #2 | Error | Pending | ⏳ | Error handling |
| 31 | Security: Admin read all | #3 | Security | Pending | ⏳ | RBAC admin |
| 32 | Security: Admin write all | #3 | Security | Pending | ⏳ | RBAC admin |
| 33 | Security: Teacher read students | #3 | Security | Pending | ⏳ | RBAC teacher |
| 34 | Security: Teacher no delete | #3 | Security | Pending | ⏳ | RBAC teacher |
| 35 | Security: Student read own data | #3 | Security | Pending | ⏳ | RBAC student |
| 36 | Security: Unauthenticated denied | #3 | Security | Pending | ⏳ | RBAC guest |
| 37 | Frontend: Login form renders | #4 | UI | Pending | ⏳ | Component render |
| 38 | Frontend: Dashboard renders | #4 | UI | Pending | ⏳ | After-auth component |
| 39 | Frontend: Form submission POST | #4 | Integration | Pending | ⏳ | Form flow |
| 40 | Frontend: Redux store update | #4 | State | Pending | ⏳ | State management |
| 41 | Frontend: Responsive mobile | #4 | Responsive | Pending | ⏳ | <768px viewport |
| 42 | Frontend: Responsive tablet | #4 | Responsive | Pending | ⏳ | 768-1024px |
| 43 | Frontend: Responsive desktop | #4 | Responsive | Pending | ⏳ | >1024px viewport |
| 44 | Cloud Run health check | #5 | DevOps | Pending | ⏳ | Service health |
| 45 | Monitoring dashboard active | #5 | DevOps | Pending | ⏳ | Metrics collection |
| 46 | Alerting rules working | #5 | DevOps | Pending | ⏳ | Alert testing |
| 47 | Integration E2E flow | #5 | E2E | Pending | ⏳ | Full system test |

**Legend:** ✅ Passing | ❌ Failing | ⏳ Pending | ⚠️ Needs Attention

---

## 🎯 COVERAGE TARGETS BY MODULE

### Backend (apps/api/)
| Module | Target | Actual | Status |
|--------|--------|--------|--------|
| routes/ | 85% | ⏳ | Pending |
| services/firestore.ts | 85% | ⏳ | Pending |
| middleware/ | 80% | ⏳ | Pending |
| utils/ | 85% | ⏳ | Pending |
| **Overall** | **82%+** | **⏳** | **Pending** |

### Frontend (apps/web/)
| Module | Target | Actual | Status |
|--------|--------|--------|--------|
| pages/ | 80% | ⏳ | Pending |
| components/ | 80% | ⏳ | Pending |
| redux/ | 75% | ⏳ | Pending |
| services/ | 85% | ⏳ | Pending |
| **Overall** | **82%+** | **⏳** | **Pending** |

---

## 🚨 FAILURE HANDLING & ESCALATION

### If Tests Start Failing

1. **First 3 failures:** Local debugging
   - Run test in watch mode: `npm run test:watch`
   - Check test output for specific error
   - Review recent code changes
   - Fix and re-run

2. **4+ failures or blocker:** Escalate immediately
   - Post in `#week4-blockers` Slack channel
   - Tag `@Backend_Agent` or `@Frontend_Agent` depending on area
   - Lead Architect to resolve within 15 minutes

3. **Coverage drops below 82%:** Investigate
   - Run coverage report: `npm run test -- --coverage`
   - Identify which files dropped coverage
   - Add tests to bring coverage back up
   - Re-run to verify 82%+ achieved

### Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| "Cannot find module" | Missing dependencies | `npm install` in both apps/api and apps/web |
| "Firestore emulator not running" | Emulator not started | `firebase emulators:start` in root |
| "Jest timeout" | Test running too long | Increase Jest timeout or optimize test |
| "Coverage below 82%" | Untested code | Add unit tests for missing coverage |
| "GitHub Actions failing" | Environment variable missing | Check `.env` or Action secrets |

---

## 📞 ESCALATION CONTACTS

- **Backend Tests Failing:** Backend Agent (@backend-agent)
- **Frontend Tests Failing:** Frontend Agent (@frontend-agent)
- **Infrastructure Tests Failing:** DevOps Agent (@devops-agent)
- **General Blocker:** Lead Architect (@lead-architect)
- **Friday Sign-Off Blocker:** Lead Architect ASAP (priority interrupt)

---

## 📝 DELIVERABLES CHECKLIST

By Friday 5 PM:

- [ ] WEEK4_TEST_INFRASTRUCTURE_SETUP.md created
- [ ] WEEK4_TEST_CASE_VERIFICATION.md with all 47 test cases documented
- [ ] WEEK4_DAILY_PROGRESS_DASHBOARD.md tracking test results daily
- [ ] All 47 tests passing: 47/47 ✅
- [ ] Coverage verified: 82%+ ✅
- [ ] Release sign-off decision: GO / NO-GO
- [ ] Production deployment successful (if GO)
- [ ] Pilot schools activated (if GO)

---

**Created:** April 9, 2026  
**Status:** ✅ READY FOR EXECUTION  
**Target Start:** Monday May 6, 9:00 AM
