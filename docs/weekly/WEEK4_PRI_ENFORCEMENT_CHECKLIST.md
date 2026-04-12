# WEEK 4 - PRI FRAMEWORK ENFORCEMENT CHECKLIST

**Mandatory Workflow:** PLAN → REVIEW → IMPLEMENT → TEST & VERIFY  
**Owner:** Lead (enforce on all PRs)  
**Deadline:** 100% compliance by end of Week 4  

---

## 📋 HOW PRI WORKS

Every PR in Week 4 MUST follow this process (total ~30-45 min per task):

### 1. PLAN (30 min)
```
What you're building:
├─ Document the feature/API in writing first
├─ List all files you'll create/modify
├─ List test cases needed (before coding!)
├─ Create PR draft with plan description
└─ Post in Slack for team visibility

File to create: docs/WEEK4_[FEATURE]_PLAN.md
```

### 2. REVIEW (15 min)
```
Team reviews the plan:
├─ Lead (you) checks: "Does this solve the problem?"
├─ Backend lead checks: "Is design sound?"
├─ QA rep checks: "Are tests comprehensive?"
├─ If approved: "You can code"
├─ If issues: "Provide feedback, iterate on plan"
└─ No coding starts until plan is approved!

Approval gate: 2 reviewers must comment "approved" or "ready to implement"
```

### 3. IMPLEMENT (2-3 hours)
```
Code exactly as planned:
├─ Write code
├─ Write tests as you go (not after!)
├─ Run tests locally (npm test)
├─ Ensure 80%+ coverage
├─ Format code (ESLint + Prettier)
└─ Push to GitHub (creates/updates PR)

Before pushing: Run locally to ensure tests pass
```

### 4. TEST & VERIFY (15 min)
```
Code review + merge:
├─ Lead reviews code (checking against plan)
├─ Look for: security, error handling, test quality
├─ Request changes if needed
├─ If approved: merge to main
├─ CI/CD auto-runs (tests + deploy)
└─ Verify deployment to staging

Gate: All tests must pass in CI/CD before merge
```

---

## WEEK 4 PR CHECKLIST

### PR #1: API Routes (5 Endpoints) - MONDAY MORNING

```
PLAN PHASE:
─────────────────────────────────────────────
[ ] Create WEEK4_API_ROUTES_PLAN.md with:
    [ ] List 5 APIs:
        [ ] POST /api/v1/schools
        [ ] GET /api/v1/schools/{id}
        [ ] POST /api/v1/schools/{id}/students
        [ ] GET /api/v1/schools/{id}/students
        [ ] POST /api/v1/schools/{id}/attendance
    [ ] For each API, document:
        [ ] Request body (JSON schema)
        [ ] Response (success + errors)
        [ ] Auth requirement (bearer token)
        [ ] Test cases (3-5 per endpoint)
    [ ] List files to create:
        [ ] src/routes/schools.ts
        [ ] src/routes/students.ts
        [ ] src/routes/attendance.ts
        [ ] src/middleware/validate.ts
        [ ] tests/schools.test.ts (3-5 tests)
        [ ] tests/students.test.ts (3-5 tests)
        [ ] tests/attendance.test.ts (3-5 tests)
[ ] Post plan in PR #1 draft

REVIEW PHASE (You review):
─────────────────────────────────────────────
[ ] Does plan align with API spec? YES / NO
[ ] Are test cases comprehensive? YES / NO
[ ] Any security gaps? YES / NO
[ ] Any questions? (list below)
[ ] APPROVED or REQUEST CHANGES

IMPLEMENT PHASE (Backend Engineer codes):
─────────────────────────────────────────────
[ ] Create src/routes/schools.ts (stub - return mock data)
[ ] Create src/routes/students.ts (stub - return mock data)
[ ] Create src/routes/attendance.ts (stub - return mock data)
[ ] Create test files with 15+ tests
[ ] Run tests locally: npm test
[ ] All tests pass? YES / NO
[ ] Coverage > 80%? YES / NO
[ ] Code formatted? npm run format
[ ] Push to GitHub (PR #1 code + tests)

TEST & VERIFY PHASE (Code review):
─────────────────────────────────────────────
[ ] Code review: Tests well-written? YES / NO
[ ] Security: Any vulnerabilities? YES / NO
[ ] Error handling: All error cases covered? YES / NO
[ ] APPROVED ✅
[ ] Merge to main
[ ] CI/CD: All tests pass? YES / NO
[ ] Deploy to staging: Successful? YES / NO
[ ] Manual smoke test: Endpoints respond? YES / NO

RESULT: ✅ PR #1 MERGED
```

---

### PR #2: Firestore Integration - TUESDAY

```
PLAN PHASE:
─────────────────────────────────────────────
[ ] Create WEEK4_FIRESTORE_INTEGRATION_PLAN.md with:
    [ ] Lists for each endpoint:
        [ ] Firestore collection it reads from
        [ ] Fields to read/write
        [ ] Validation rules (Zod schema)
        [ ] Error cases (400/401/404/500)
    [ ] Files to create:
        [ ] src/services/schools.ts (Firestore queries)
        [ ] src/services/students.ts (Firestore queries)
        [ ] src/services/attendance.ts (Firestore queries)
        [ ] src/validators/schools.ts (Zod schemas)
        [ ] src/validators/students.ts (Zod schemas)
        [ ] src/validators/attendance.ts (Zod schemas)
    [ ] New tests:
        [ ] Test invalid input rejected (Zod validation)
        [ ] Test Firestore query results
        [ ] Test error handling (DB errors)

REVIEW PHASE:
─────────────────────────────────────────────
[ ] Plan reviewed + approved by you

IMPLEMENT PHASE:
─────────────────────────────────────────────
[ ] Create src/services/schools.ts
    [ ] Implement: getSchoolById(id)
    [ ] Implement: createSchool(data)
    [ ] Add Firestore queries
[ ] Create src/services/students.ts (similar)
[ ] Create src/services/attendance.ts (similar)
[ ] Create Zod validators
[ ] Update routes to use services (not stubs)
[ ] Add validation to all endpoints
[ ] Create new tests:
    [ ] Test invalid input → 400 error
    [ ] Test Firestore integration
    [ ] Test auth failures → 401 error
[ ] Run tests: npm test
[ ] Coverage > 80%? YES / NO
[ ] Push PR #2

TEST & VERIFY:
─────────────────────────────────────────────
[ ] Code review: Services + validation correct? YES / NO
[ ] Tests: Cover all error cases? YES / NO
[ ] APPROVED ✅
[ ] Merge to main
[ ] CI/CD passing? YES / NO
[ ] Deploy to staging
[ ] Test in staging: Create school → Get school? YES / NO

RESULT: ✅ PR #2 MERGED (APIs now connected to Firestore)
```

---

### PR #3: Security Rules - WEDNESDAY

```
PLAN PHASE:
─────────────────────────────────────────────
[ ] Create WEEK4_SECURITY_RULES_PLAN.md with:
    [ ] Firestore security rules to implement:
        [ ] Admins can read/write all collections
        [ ] Teachers can read/write their school only
        [ ] Students can read (not write)
        [ ] Unauthenticated users cannot access
    [ ] Test scenarios:
        [ ] Admin login + read all schools ✅
        [ ] Teacher login + read own school only ✅
        [ ] Teacher read another school ❌ (should fail)
        [ ] Student read grades ✅
        [ ] Student write grades ❌ (should fail)
        [ ] No auth + read anything ❌ (should fail)
    [ ] File to create:
        [ ] infrastructure/firestore.rules (Firestore rules)
        [ ] tests/security.test.ts (6+integration tests)

REVIEW PHASE:
─────────────────────────────────────────────
[ ] Plan reviewed: Does RBAC cover all roles? YES / NO
[ ] Security: Any gaps in authorization? YES / NO
[ ] APPROVED ✅

IMPLEMENT PHASE:
─────────────────────────────────────────────
[ ] Create infrastructure/firestore.rules
    [ ] Implement admin access (read/write all)
    [ ] Implement teacher access (own school only)
    [ ] Implement student access (read-only)
[ ] Create tests/security.test.ts
    [ ] Test admin access allowed
    [ ] Test teacher access allowed (own school)
    [ ] Test teacher access denied (other school)
    [ ] Test student read allowed
    [ ] Test student write denied
    [ ] Test unauthenticated denied
[ ] Run tests: npm test
[ ] All security tests pass? YES / NO
[ ] Push PR #3

TEST & VERIFY:
─────────────────────────────────────────────
[ ] Code review: Rules correctly implemented? YES / NO
[ ] Security: Any bypass opportunities? YES / NO
[ ] Tests: All scenarios covered? YES / NO
[ ] APPROVED ✅
[ ] Merge to main
[ ] Test in staging:
    [ ] Unauthorized request → 403/401? YES / NO
    [ ] Authorized request → success? YES / NO

RESULT: ✅ PR #3 MERGED (Security live)
```

---

### PR #4: Frontend Auth UI - TUESDAY-WEDNESDAY

```
PLAN PHASE:
─────────────────────────────────────────────
[ ] Create WEEK4_FRONTEND_AUTH_PLAN.md with:
    [ ] Pages to create:
        [ ] Login.tsx (email/password form)
        [ ] Dashboard.tsx (show current user)
        [ ] Students.tsx (list students)
    [ ] Components to create:
        [ ] Header.tsx (with logout)
        [ ] Sidebar.tsx (navigation)
        [ ] ErrorBoundary.tsx (error handling)
    [ ] Hooks to create:
        [ ] useAuth.ts (auth state + login/logout)
        [ ] useApi.ts (API calls with auth token)
    [ ] Integration:
        [ ] Firebase Auth SDK
        [ ] API client with bearer token auth
        [ ] Auth guard (redirect if not logged in)
    [ ] Tests:
        [ ] Test login form validation
        [ ] Test API call adds bearer token
        [ ] Test redirect if not authenticated

REVIEW PHASE:
─────────────────────────────────────────────
[ ] Plan reviewed + approved

IMPLEMENT PHASE:
─────────────────────────────────────────────
[ ] Create src/pages/Login.tsx
    [ ] Email + password form
    [ ] Firebase Auth integration
    [ ] Error handling
[ ] Create src/pages/Dashboard.tsx
    [ ] Show current user info
    [ ] Logout button
[ ] Create src/components/auth/ProtectedRoute.tsx
    [ ] Redirect if not authenticated
[ ] Create src/hooks/useAuth.ts
    [ ] Login function
    [ ] Logout function
    [ ] Current user state
[ ] Create src/api/client.ts
    [ ] Axios instance with bearer token
    [ ] Auth token from localStorage
[ ] Create tests for each
[ ] Run tests: npm test
[ ] Push PR #4

TEST & VERIFY:
─────────────────────────────────────────────
[ ] Code review: Auth flow correct? YES / NO
[ ] Tests: Cover login/logout? YES / NO
[ ] APPROVED ✅
[ ] Merge + test in staging

RESULT: ✅ PR #4 MERGED (Frontend auth live)
```

---

### PR #5: Monitoring + Documentation - THURSDAY

```
PLAN PHASE:
─────────────────────────────────────────────
[ ] Create WEEK4_MONITORING_PLAN.md with:
    [ ] Docs to create:
        [ ] API_DOCUMENTATION.md (complete API reference)
        [ ] DEPLOYMENT_RUNBOOK.md (how to deploy)
        [ ] MONITORING_GUIDE.md (how to monitor)
        [ ] INCIDENT_RESPONSE.md (what to do if broken)
    [ ] Monitoring setup:
        [ ] Cloud Logging dashboard
        [ ] Alerts for: error rate > 1%, latency > 1000ms
        [ ] Metrics to track: p95 latency, requests/sec, errors

REVIEW PHASE:
─────────────────────────────────────────────
[ ] Plan reviewed + approved

IMPLEMENT PHASE:
─────────────────────────────────────────────
[ ] Create docs/API_DOCUMENTATION.md
    [ ] Document all 5 endpoints
    [ ] Include curl examples
    [ ] Document error codes
[ ] Create docs/DEPLOYMENT_RUNBOOK.md
    [ ] Step-by-step deployment
    [ ] Rollback procedure
[ ] Create docs/MONITORING_GUIDE.md
    [ ] How to view logs
    [ ] How to interpret metrics
    [ ] How to set up alerts
[ ] Create docs/INCIDENT_RESPONSE.md
    [ ] 5xx error response
    [ ] DB connection error
    [ ] Out of memory error
[ ] Set up Cloud Logging dashboard
[ ] Configure alerts
[ ] Push PR #5

TEST & VERIFY:
─────────────────────────────────────────────
[ ] Documentation: Complete + accurate? YES / NO
[ ] Examples: Work when run? YES / NO
[ ] APPROVED ✅
[ ] Merge to main

RESULT: ✅ PR #5 MERGED (Documentation live, monitoring active)
```

---

## ENFORCEMENT RULES FOR WEEK 4

**RULE 1: No code without plan approval**
- If backend engineer creates PR without plan → REJECT + request plan document first
- Exception: Typo fixes or docs updates (< 10 lines)

**RULE 2: All PRs must have tests**
- Minimum: 1 test per API endpoint (5 tests for PR #1)
- If PRtests < 80% coverage → REQUEST CHANGES
- Exception: Documentation PRs

**RULE 3: Code review before merge**
- Every PR gets reviewed by you (Lead) + 1 other person
- Minimum wait: 30 min before merge (prevent rushing)
- If tests fail in CI/CD → cannot merge (hard stop)

**RULE 4: CI/CD must pass**
- `npm test` must pass (all tests green)
- Coverage check must pass (> 80%)
- Build check must pass (no TypeScript errors)
- If any check fails → cannot merge manually, fix code

**RULE 5: Weekly checkpoint (Friday EOD)**
- By 5 PM Friday, lead reviews all PRs merged
- If PRs incomplete → highlight blockers + reassign work
- No half-done PRs carry to next week

---

## PR TEMPLATE (Copy for each PR)

```markdown
# PR #X: [Feature Name]

## Plan
- [Link to WEEK4_[FEATURE]_PLAN.md or summary]

## Files Changed
- [ ] src/routes/[file].ts
- [ ] src/services/[file].ts
- [ ] tests/[file].test.ts
- [ ] docs/[file].md

## Test Coverage
- Tests written: X
- Coverage: X%+
- All passing: YES / NO

## Security Review
- [ ] No secrets in code
- [ ] Auth middleware used correctly
- [ ] Input validation in place
- [ ] Error messages don't leak sensitive info

## Performance
- [ ] No N+1 queries
- [ ] Firestore indexes used
- [ ] Response time acceptable

## Ready for Merge
- [ ] Plan approved
- [ ] Tests passing
- [ ] Code reviewed
- [ ] CI/CD green
```

---

## ENFORCER CHECKLIST (For You - Lead)

**Your job in Week 4:**

### Every Day
- [ ] Check Slack for blockers (respond within 30 min)
- [ ] Review PRs in queue (target: 15-min turnaround)
- [ ] Approve one PR or request changes
- [ ] Update daily progress dashboard

### When PR is created
- [ ] Does PR have plan document link? If NO → ask for it
- [ ] Does PR have tests? If NO → request changes
- [ ] Code review: 15 min (check against plan)
- [ ] Approve or request changes (same day)

### When tests fail
- [ ] Notify backend engineer immediately
- [ ] Do NOT merge if tests failing
- [ ] Wait for fix + retest

### Friday EOD
- [ ] All PRs merged to main?
- [ ] All tests passing (47/47)?
- [ ] Coverage > 80%?
- [ ] Create WEEK4_SIGN_OFF.md
- [ ] Document any blockers that delayed progress

---

## SUCCESS METRICS

By end of Week 4:

| Metric | Target | How to Verify |
|--------|--------|---------------|
| **PRs Created** | 5+ | GitHub PR count |
| **PRs Merged** | 5+ | `git log --oneline \| grep Merge` |
| **Tests Written** | 47+ | `npm test \| grep "tests"` |
| **Tests Passing** | 100% | `npm test` output |
| **Coverage** | 80%+ | Coverage report |
| **Code Review Cycle** | <1 day | PR timeline in GitHub |
| **Plan Docs** | 5+ | Count WE EK4_*_PLAN.md files |
| **Production Docs** | 4+ | Count in docs/ folder |
| **PRI Compliance** | 100% | All PRs follow plan→review→implement→test |

---

## ESCALATION PATH

**If team doesn't follow PRI:**

1. **First violation:** Mention in standup (verbal reminder)
2. **Second violation:** Comment on PR (written feedback)
3. **Third violation:** Reject PR + require re-plan + re-review (enforcement)
4. **Pattern violations:** 1-1 with engineer (discuss blockers preventing PRI)

**If PRI is slowing you down:**

Talk to Lead Architect - might adjust PRI to:
- Skip documentation PRs
- Combine multiple small changes
- Parallel planning (plan multiple features at once)

But core rule remains: **PLAN → REVIEW before IMPLEMENT**

---

## WEEK 4 PRI SUMMARY

```
5 PRs required:
├─ PR #1: API routes + tests (Mon)
├─ PR #2: Firestore + validation (Tue)
├─ PR #3: Security rules (Wed)
├─ PR #4: Frontend auth UI (Tue-Wed)
└─ PR #5: Docs + monitoring (Thu)

Process: PLAN → REVIEW → IMPLEMENT → TEST & MERGE
Timeline: 30 min → 15 min → 2-3 hr → 15 min (per PR)
Total per engineer: ~3.5 hours/PR × 2-3 engineers = 10-15 commits/day

Success: All 5 PRs merged, tests passing, documentation complete
Failure: PR stuck in review, tests failing, incomplete documentation
```

---

**PRI Enforcement Active:** Week 4, May 6-10, 2026  
**Enforcer:** Lead (you)  
**Escalation:** Lead Architect (if PRI blocks progress)
