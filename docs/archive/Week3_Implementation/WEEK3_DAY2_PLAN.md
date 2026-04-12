# WEEK 3 - DAY 2 PLAN (April 11, 2026)
# PRI Workflow: PLAN Phase

**Status:** 📋 PLANNING PHASE | **Awaiting:** Lead Architect Review & Approval

---

## 📊 DAY 2 OVERVIEW

### Objective
Complete infrastructure deployment + integrate backend/frontend + build attendance management core

### All-Hands Metrics
| Metric | Target | Strategy |
|--------|--------|----------|
| **Team Hours** | 40 hours combined | Parallel work streams |
| **Code Lines** | 1,500+ new lines | Attendance + Dashboard + Tests |
| **Test Pass Rate** | 100% | All auth + attendance tests pass |
| **Go/No-Go** | Yes → Proceed to Day 3 | No → Hotfix + rollback |

---

## 🔄 PRI WORKFLOW STRUCTURE

```
PLAN (This Document)
├─ Objectives defined ✅
├─ Deliverables specified ✅
├─ Dependencies mapped ✅
├─ Risks identified ✅
└─ AWAITING: Lead Architect approval

REVIEW (Next Step - After Approval)
├─ Lead Architect review
├─ Team lead sign-off
├─ Scope confirmation
└─ Proceed to IMPLEMENT

IMPLEMENT (After Approval)
├─ Deploy infrastructure
├─ Write features
├─ Integrate components
└─ Ready for TEST

TEST & VERIFY (Before Day 3)
├─ All tests passing
├─ Integration working
├─ Coverage targets met
└─ Go-live readiness confirmed
```

---

## 📋 DAY 2 DETAILED PLAN

### PHASE 1: INFRASTRUCTURE DEPLOYMENT (Morning - 9 AM to 12 PM)
**Owner:** DevOps Lead | **Duration:** 3 hours | **Blocker Risk:** HIGH

#### Tasks
```
T1: Terraform Firestore Deployment (90 min)
├─ Action: terraform init -backend-config=...
├─ Action: terraform plan -var-file=env/dev.tfvars
├─ Verify: Firestore database appears in GCP console
├─ Verify: Collections auto-created
├─ Success: $ gcloud firestore databases list → school-erp-dev READY
└─ Owner: DevOps Lead

T2: Cloud Run Service Account Setup (60 min)
├─ Action: terraform apply (Cloud Run section only)
├─ Verify: Service account created with correct IAM roles
├─ Verify: IAM roles: datastore.user, storage.objectAdmin, pubsub.editor
├─ Verify: Cloud Run service created
└─ Owner: DevOps Lead

T3: Verify All Infrastructure Healthy (30 min)
├─ Verify: Firestore responds to queries
├─ Verify: Cloud Run health check passes
├─ Verify: Monitoring alerts configured
├─ Verify: Disk logging active
├─ Healthcheck: $ curl http://localhost:3001/health → {"status":"ok"}
└─ Owner: DevOps Lead + Backend Lead

DEPLOYMENT COMMANDS:
```
cd infrastructure/firestore
terraform init -backend-config="bucket=school-erp-terraform-state"
terraform plan -var-file="../env/dev.tfvars" -out=tfplan
terraform apply tfplan

cd ../cloud-run
terraform init -backend-config="bucket=school-erp-terraform-state"
terraform plan -var-file="../env/dev.tfvars"
terraform apply -var-file="../env/dev.tfvars"

# Verify
gcloud firestore databases list
gcloud run services describe school-erp-api-dev --region=us-central1
```

**UNBLOCK CRITERIA:** Firestore + Cloud Run both operational → Release Backend + Frontend teams

---

### PHASE 2: BACKEND IMPLEMENTATION (Parallel - 9 AM to 5 PM)
**Owner:** Backend Lead | **Duration:** 8 hours | **Depends:** Phase 1 complete

#### Task 2.1: Run Authentication Tests Against Live Firestore (1 hour)
```
After: Firestore deployed in Phase 1

Actions:
├─ cd backend
├─ npm test test/auth.spec.ts
├─ Review: 10 test cases should all pass
├─ Screenshot: Test results
└─ Success Criteria: 10/10 tests passing ✅

Expected Output:
  PASS  test/auth.spec.ts
  ✓ TC1: Valid login (150ms)
  ✓ TC2: Invalid password (120ms)
  ... [8 more tests]
  ✓ TC10: Validate token (85ms)
  
  Tests: 10 passed, 10 total
  Coverage: 85.2%
```

#### Task 2.2: Build Attendance Management Endpoints (4 hours)
```
Parent: Day 1 Auth structure
Output: 3 new API endpoints

ENDPOINT 1: POST /attendance/mark
├─ Input: { class_id, student_id, status: "present"|"absent"|"late" }
├─ Output: { id, timestamp, staff_id, success }
├─ Auth: ✅ verify token middleware
├─ Validation: class_id + student_id required, status enum
├─ DB: Insert into classAttendance collection
├─ Error: 400 bad request, 401 unauthorized, 500 server error
└─ Lines: ~80 lines TypeScript

ENDPOINT 2: GET /attendance/by-class
├─ Input Query: { class_id, date? }
├─ Output: { records: [{id, student_id, status, timestamp}], count }
├─ Auth: ✅ verify token middleware
├─ Firestore Query: classAttendance.where("class_id", "==", classId)
└─ Lines: ~60 lines TypeScript

ENDPOINT 3: GET /attendance/stats
├─ Input Query: { class_id, date_range: "week"|"month" }
├─ Output: { total, present, absent, late, percentages }
├─ Auth: ✅ verify token middleware
├─ Aggregation: Group + count from classAttendance
└─ Lines: ~70 lines TypeScript

File Location: backend/src/api/v1/staff/attendance.ts
Total Lines: ~210 lines
```

#### Task 2.3: Add Attendance Tests (2 hours)
```
Before: Task 2.2 endpoints complete
File: test/attendance.spec.ts

New Test Cases:
├─ TC11: Mark attendance - valid input
├─ TC12: Mark attendance - invalid class_id
├─ TC13: Get attendance by class
├─ TC14: Get attendance stats
├─ TC15: Attendance permission check (teacher-only)
└─ TC16: Duplicate attendance check

Lines: ~250 lines
Success: 6/6 new tests pass + 10/10 auth tests still pass = 16/16 ✅
```

#### Task 2.4: Integration Checklist (1 hour)
```
After: All endpoints + tests complete

Checklist:
├─ [ ] All 3 attendance endpoints respond with correct status codes
├─ [ ] Firestore collections updated correctly
├─ [ ] Auth middleware enforcing token requirement
├─ [ ] Zod validation catching bad inputs
├─ [ ] Error messages user-friendly
├─ [ ] Performance acceptable (<500ms response time)
└─ [ ] Ready for Frontend integration
```

---

### PHASE 3: FRONTEND IMPLEMENTATION (Parallel - 9 AM to 5 PM)
**Owner:** Frontend Lead | **Duration:** 8 hours | **Depends:** Phase 1 + 2.1 complete

#### Task 3.1: Connect Login to Running Backend (1.5 hours)
```
Before: Backend API running + tests passing

Actions:
├─ Update .env.local: REACT_APP_API_URL=http://localhost:3001/api/v1
├─ Test: Login with valid credentials (admin@school.com / Test@123)
├─ Verify: Token saved to localStorage
├─ Verify: Redux state updated correctly
├─ Verify: Navigate to /staff/dashboard after successful login
└─ success: Full login flow working end-to-end ✅

Manual Test Steps:
1. npm run dev:frontend (http://localhost:3000)
2. Click "Sign In"
3. Enter: admin@school.com / Test@123
4. Observe: Success message → Redirect to dashboard
5. Verify: localStorage contains authToken
6. Verify: Redux store has staff data
```

#### Task 3.2: Build Staff Dashboard Component (3 hours)
```
File: frontend/src/pages/StaffDashboard.tsx (~300 lines)

Component Structure:
├─ Header: Staff name, role, school
├─ Quick Stats: 4 cards
│  ├─ Classes managed: 5
│  ├─ Students enrolled: 145
│  ├─ Attendance rate: 94%
│  └─ Messages: 3 unread
├─ Navigation Menu: 4 sections
│  ├─ 📋 Attendance Management
│  ├─ 📊 Grade Management
│  ├─ 📄 Reports
│  └─ 🎓 Exam Schedule
└─ Recent Activity: Last 5 actions

Material-UI Components:
├─ Container + Grid layout
├─ Cards for stats
├─ IconButtons for navigation
├─ Data from Redux state
└─ Protected route wrapper
```

#### Task 3.3: Build Attendance Management Page (3 hours)
```
File: frontend/src/pages/AttendanceManagementPage.tsx (~350 lines)

Features:
├─ Class selector dropdown
├─ Date picker
├─ Student list with attendance grid
├─ Mark present/absent/late buttons
├─ Bulk actions (Mark all present, etc)
└─ Save button

Data Flow:
├─ Load students on page load (useGetStudentListQuery)
├─ Track changes in local state (useState)
├─ Submit all changes at once (useBulkMarkAttendanceMutation)
├─ Show success/error notifications
└─ Refresh page after successful save

RTK Query Hooks Needed:
├─ useGetStudentListQuery() → existing (from Week 2)
├─ useMarkAttendanceMutation() → NEW (Task 2.2)
├─ useGetAttendanceByClassQuery() → NEW (Task 2.2)
└─ useGetAttendanceStatsQuery() → NEW (Task 2.2)
```

#### Task 3.4: Update RTK Query Hooks (1 hour)
```
File: frontend/src/api/staffApi.ts (append to existing file)

New Hooks:
├─ useMarkAttendanceMutation() → POST /attendance/mark
├─ useGetAttendanceByClassQuery() → GET /attendance/by-class
├─ useGetAttendanceStatsQuery() → GET /attendance/stats
└─ All with full TypeScript types

Lines: ~150 new lines added to existing 300-line file
```

#### Task 3.5: Integration Testing (0.5 hours)
```
Manual Tests:
├─ [ ] Dashboard loads after login
├─ [ ] Navigation menu links work
├─ [ ] Attendance page loads student list
├─ [ ] Can mark attendance
├─ [ ] Save button submits correctly
├─ [ ] Error messages display for failed saves
└─ success: Full attendance flow E2E working ✅
```

---

### PHASE 4: QA TESTING (Parallel - 9 AM to 5 PM)
**Owner:** QA Lead | **Duration:** 8 hours | **Depends:** Phase 2 + 3 complete

#### Task 4.1: Deploy Backend Service Locally (1 hour)
```
Actions:
├─ cd backend
├─ npm install (if needed)
├─ npm run dev:api
├─ Verify: Server starts on http://localhost:3001
├─ Curl: curl http://localhost:3001/health
└─ Success: "{"status":"ok"}"
```

#### Task 4.2: Execute Full Auth Test Suite (1 hour)
```
Command: npm test test/auth.spec.ts --coverage

Expected Results:
├─ 10/10 tests pass ✅
├─ Coverage: 85%+ on auth.ts
├─ No flaky tests
├─ Response times <200ms

Pass Criteria:
└─ 100% pass rate
```

#### Task 4.3: Execute Attendance Test Suite (2 hours)
```
Command: npm test test/attendance.spec.ts

Expected Results:
├─ 6/6 new tests pass ✅
├─ Coverage: 80%+ on attendance.ts
├─ All error cases covered
├─ Database state verified

Pass Criteria:
└─ 100% pass rate + proper rollback tested
```

#### Task 4.4: Manual E2E Testing (2 hours)
```
Test Scenario 1: Happy Path Login
├─ Step 1: Navigate to http://localhost:3000
├─ Step 2: Enter: admin@school.com / Test@123
├─ Step 3: Click Sign In
├─ Expected: Redirect to dashboard
└─ Result: ✅ PASS or ❌ FAIL

Test Scenario 2: Mark Attendance
├─ Step 1: Login as staff member
├─ Step 2: Click "Attendance Management"
├─ Step 3: Select class + date
├─ Step 4: Mark 5 students present
├─ Step 5: Click Save
├─ Expected: Success message + data persists
└─ Result: ✅ PASS or ❌ FAIL

Test Scenario 3: Error Handling
├─ Step 1: Try marking without selecting class
├─ Expected: Error message shown
├─ Step 2: Try saving with network offline
├─ Expected: Retry prompt
└─ Result: ✅ PASS or ❌ FAIL
```

#### Task 4.5: Coverage Report + Analysis (1 hour)
```
Generate Report:
├─ npm test -- --coverage
├─ Coverage by file:
│  ├─ auth.ts: 85%
│  ├─ attendance.ts: 80%
│  ├─ jwt.ts: 75%
│  └─ Average: 80%+
├─ Identify gaps
├─ Plan coverage improvements for Day 3
└─ Output: coverage-report.html

Pass Criteria:
└─ Coverage 80%+ on all critical files
```

#### Task 4.6: QA Sign-Off (1 hour)
```
Checklist Before Sign-Off:
├─ [ ] All unit tests passing (16/16)
├─ [ ] All integration tests green
├─ [ ] E2E scenarios working
├─ [ ] Coverage 80%+
├─ [ ] No critical bugs found
├─ [ ] Performance acceptable
├─ [ ] Security checks passed
└─ [ ] Ready for Day 3

Authorization:
└─ QA Lead approval: APPROVED ✅ or REJECTED ❌
```

---

## 🎯 SUCCESS CRITERIA

### Morning (12 PM)
- ✅ Infrastructure deployed
- ✅ Firestore live and responding
- ✅ Cloud Run service created

### Afternoon (4 PM - Standup)
- ✅ 16 tests passing (10 auth + 6 attendance)
- ✅ Backend attendance endpoints working
- ✅ Frontend dashboard + attendance page built
- ✅ E2E login to attendance flow working
- ✅ Coverage 80%+

### EOD (6 PM)
- ✅ All code merged to main
- ✅ Day 2 deliverables 100% complete
- ✅ Go/No-Go vote: PROCEED to Day 3
- ✅ Ready for Day 3 (Grades + Reports)

---

## 🚨 RISK MITIGATION

### High Risk: Firestore deployment fails
**Probability:** Low (5%) | **Impact:** High (blocks everything)
- **Mitigation:** Run terraform plan first, review before apply
- **Fallback:** Use Firestore emulator instead of cloud
- **Decision:** If fail by 1 PM, pivot to emulator

### Medium Risk: API tests fail against live DB
**Probability:** Medium (30%) | **Impact:** Medium (debug delay)
- **Mitigation:** Run tests incrementally
- **Fallback:** Use mock data, isolate failures
- **Decision:** If >3 tests fail, investigate before proceeding

### Medium Risk: Frontend ↔ Backend integration messy
**Probability:** Medium (40%) | **Impact:** Medium (1-2 hour delay)
- **Mitigation:** Clear API contracts defined in Day 1, use mocks for testing
- **Fallback:** Use API stubs, test separately
- **Decision:** If integration broken, parallel testing allowed

### Low Risk: Team burnout (2 consecutive 8-hour days)
**Probability:** Low (10%) | **Impact:** Low (quality dip)
- **Mitigation:** 30-min lunch break, flexible afternoon schedule
- **Fallback:** Redistribute tasks if someone overloaded
- **Decision:** All work stops at 8 PM, no exceptions

---

## 📅 DAY 2 SCHEDULE

```
9:00 AM  - Team standup (15 min) + kickoff
9:15 AM  - All 4 teams start simultaneously
          ├─ DevOps: Deploy Firestore
          ├─ Backend: Prep + wait for Firestore
          ├─ Frontend: Environment setup
          └─ QA: Test environment config

12:00 PM - Infrastructure ready checkpoint
          └─ All teams unblocked?

12:30 PM - Lunch (30 min, staggered)

1:00 PM  - Full day: Heavy implementation
          ├─ Backend: Write attendance endpoints + tests
          ├─ Frontend: Build dashboard + attendance page
          ├─ QA: Begin test execution
          └─ DevOps: Monitor + optimize

4:00 PM  - Daily standup (20 min)
          ├─ Progress report by each role
          ├─ Blocker resolution
          └─ Plan final 2 hours

4:20 PM  - Final push (100 min)
          └─ Complete critical items only

6:00 PM  - EOD status:
          ├─ Code committed
          ├─ Tests passing
          ├─ QA approval
          └─ Go/No-Go decision

6:30 PM  - Team dismissed (1 day = 9.5 hours, in-policy ✅)
```

---

## 📊 DELIVERABLES TABLE

| Component | File | Lines | Status | Owner |
|-----------|------|-------|--------|-------|
| Attendance API | `backend/.../attendance.ts` | 210 | 📋 Plan | Backend |
| Attendance Tests | `test/attendance.spec.ts` | 250 | 📋 Plan | QA |
| Dashboard Component | `frontend/.../StaffDashboard.tsx` | 300 | 📋 Plan | Frontend |
| Attendance Page | `frontend/.../AttendanceManagementPage.tsx` | 350 | 📋 Plan | Frontend |
| RTK Hooks Update | `frontend/.../staffApi.ts` (append) | 150 | 📋 Plan | Frontend |
| Integration Tests | `test/integration.e2e.ts` | 200 | 📋 Plan | QA |
| **TOTAL** | **~6 files** | **~1,460 lines** | **📋 PLANNED** | **All Hands** |

---

## ✅ APPROVAL CHECKLIST

Before proceeding to REVIEW phase:

- [ ] **Lead Architect** - Scope clear + architecture sound?
- [ ] **Backend Lead** - Attendance endpoints realistic for 4 hours?
- [ ] **Frontend Lead** - Dashboard + page buildable in 3.5 hours?
- [ ] **DevOps Lead** - Infrastructure deployment tested + safe?
- [ ] **QA Lead** - Test plan comprehensive + achievable?
- [ ] **Product Manager** - Features match Week 3 scope?

**APPROVAL STATUS:** ⏳ **AWAITING LEAD ARCHITECT REVIEW**

---

## 📞 ESCALATION CONTACT

**If plan not approved OR major issues:**

| Role | Escalate To | Response Time |
|------|-------------|----------------|
| Plan Issues | Lead Architect | 15 min |
| Technical Block | Tech Lead (Role-specific) | 10 min |
| Scope Creep | Product Manager | 20 min |
| Emergency | Lead Architect + CTO | Immediate |

---

## 🔚 NEXT STEP

**→ AWAITING LEAD ARCHITECT APPROVAL**

Once approved, proceed to:
- ✅ REVIEW phase (team leads sign-off)
- ✅ IMPLEMENT phase (build everything)
- ✅ TEST & VERIFY phase (validate + go-live)

---

**Plan Created:** April 9, 2026  
**Plan Type:** Day 2 Implementation | PRI Workflow  
**Prepared By:** Development Team (All Leads)  
**Status:** 📋 Ready for Approval → REVIEW PHASE

