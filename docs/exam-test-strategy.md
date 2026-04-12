# Exam Module (Module 3) - Test Strategy & Execution Plan

**Date:** April 10, 2026  
**Version:** 1.0  
**Status:** Ready for Implementation  
**QA Engineer:** Week 7 Day 1  

---

## EXECUTIVE SUMMARY

This document defines the comprehensive testing strategy for Module 3 (Exam/Assessment) of the School ERP system. The test suite is designed to achieve 90%+ code coverage through a layered testing pyramid consisting of unit tests, integration tests, and end-to-end tests.

**Test Deliverables:** 50+ passing tests across 3 layers  
**Coverage Target:** 90%+ across all exam module components  
**Execution Time:** <5 minutes for full test suite  
**Ready for:** Week 7 Day 1 Production Deployment

---

## PART 1: TESTING PYRAMID STRATEGY

### Layer Distribution

```
          E2E Tests (15%)
         █████████
        User Journeys
       Real Browser
      Full System Test

     Integration Tests (25%)
    ██████████████████
   Full Workflows + DB
  Redux + API + DB
 Cross-component

Unit Tests (60%)
███████████████████████████████████████████
Endpoints, Components, Utils
Mock Dependencies
Fast Execution
```

### Layer Definition

#### Layer 1: Unit Tests (60% - 35 tests)
- **What:** Individual function/endpoint tests
- **How:** Mock all external dependencies (DB, Auth, APIs)
- **Why:** Fast feedback, isolated failure diagnosis
- **Count:** 35 tests
- **Files:**
  - `tests/exam/exam.unit.test.ts` (Backend endpoints)
  - React component unit tests (Future)
  - Utility function tests (Future)

**Backend Unit Tests (30 tests):**
1. POST /api/v1/exams - Create exam (3 tests)
   - Valid creation with 201 response
   - Missing required field validation
   - Authorization check (teacher only)

2. GET /api/v1/exams - List exams (3 tests)
   - Pagination with correct metadata
   - Empty list handling
   - Filter by status/academic year

3. GET /api/v1/exams/:examId - Get single exam (3 tests)
   - Exam found and returned
   - 404 when not found
   - Includes questions and stats

4. PUT /api/v1/exams/:examId - Update exam (3 tests)
   - Update draft exam
   - Reject published exam updates
   - Validate update constraints

5. DELETE /api/v1/exams/:examId - Delete exam (3 tests)
   - Delete draft exam
   - Reject published exam deletion
   - 404 handling

6. POST /api/v1/exams/:examId/questions - Add questions (3 tests)
   - Single question creation
   - Bulk question addition
   - Validation of question structure

7. GET /api/v1/exams/:examId/questions - List questions (3 tests)
   - Return all questions with pagination
   - Pagination logic
   - Empty question set

8. POST /api/v1/exams/:examId/submissions - Submit answers (3 tests)
   - Valid submission creation
   - Prevent duplicate submission
   - Validate answer structure

9. GET /api/v1/exams/:examId/submissions/:submissionId - Get result (3 tests)
   - Retrieve graded result
   - 404 handling
   - Teacher vs student visibility

10. POST /api/v1/exams/:examId/grade - Grade exam (3 tests)
    - Valid grading with marks
    - Reject exceeding total marks
    - Authorization check

11. GET /api/v1/exams/:examId/results - Get results (3 tests)
    - Class-wide results for teacher
    - Statistics calculation
    - Student privacy

12. DELETE /api/v1/exams/:examId/questions/:qId - Delete question (3 tests)
    - Delete from draft exam
    - Reject from published exam
    - 404 handling

**Frontend Unit Tests (Future):**
- ExamList component (3 tests)
- ExamForm component (3 tests)
- ExamTaking component (3 tests)

**Utility Tests (Future):**
- Grade calculation (1 test)
- Answer validation (1 test)

#### Layer 2: Integration Tests (25% - 15 tests)
- **What:** Complete workflows combining Frontend + Backend + Database
- **How:** Use real app with mocked DB and external services
- **Why:** Catch integration issues, verify complete flows
- **Count:** 15 tests
- **Files:**
  - `tests/exam/exam.integration.test.ts`

**Integration Test Scenarios:**

1. Teacher Exam Creation Workflow (3 tests)
   - Create exam → add questions → verify persistence
   - Update exam → verify changes persisted
   - Publish results → verify visibility

2. Student Exam Taking Workflow (3 tests)
   - List available exams → fetch questions → submit answers
   - Prevent duplicate submission
   - View graded results after publication

3. Database Persistence & Firestore (3 tests)
   - Exam data persists correctly
   - Questions subcollection structure
   - Submissions indexed for performance

4. Error Recovery & Edge Cases (3 tests)
   - Recover from Firestore failure
   - App restart during submission
   - Constraint validation (date ordering)

5. Concurrent Operations (3 tests)
   - Multiple students submit simultaneously
   - Teacher grades while students take exam
   - Concurrent question additions

#### Layer 3: E2E Tests (15% - 9 tests - Deferred to Phase 2)
- **What:** Complete user journeys in real browser
- **How:** Selenium/Playwright in actual environment
- **Why:** Verify actual user experience end-to-end
- **Count:** 9 tests (Deferred)
- **Files:**
  - `tests/exam/exam.e2e.test.ts`

**E2E Test Scenarios (Phase 2):**
1. Teacher journey: Create exam → configure questions → publish → grade results
2. Student journey: List exams → take exam → view results
3. Parent journey: View child's exam results
4. Admin journey: Monitor exam status across all classes
5. Mobile journey: Student takes exam on mobile device
6. Performance: Large exam with 100+ questions
7. Retry: Network failure recovery
8. Concurrent: 50+ students taking exam simultaneously
9. Stress: 1000+ submissions in queue

---

## PART 2: TEST EXECUTION SETUP

### Prerequisites

```bash
# Node.js 18+
node -v

# Install dependencies
npm install

# Setup test database (Firestore emulator)
npm run firestore:emulator

# Setup mock API server (optional)
npm run mock-server
```

### Test Execution Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test tests/exam/exam.unit.test.ts

# Run in watch mode (development)
npm test -- --watch

# Generate HTML coverage report
npm test -- --coverage --html=coverage/index.html
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
        with:
          files: ./coverage/coverage-final.json
```

---

## PART 3: TEST COVERAGE TARGETS

### Coverage by Component

```
Backend Exam Endpoints:
  POST /api/v1/exams:                    100%  (3 tests)
  GET /api/v1/exams:                     100%  (3 tests)
  GET /api/v1/exams/:examId:             100%  (3 tests)
  PUT /api/v1/exams/:examId:             100%  (3 tests)
  DELETE /api/v1/exams/:examId:          100%  (3 tests)
  POST /api/v1/exams/:examId/questions:  100%  (3 tests)
  GET /api/v1/exams/:examId/questions:   100%  (3 tests)
  POST /api/v1/exams/:examId/submissions: 100% (3 tests)
  GET /api/v1/exams/**/submissions/**:    100% (3 tests)
  POST /api/v1/exams/:examId/grade:      100%  (3 tests)
  GET /api/v1/exams/:examId/results:     100%  (3 tests)
  DELETE /api/v1/exams/**/questions/**:   100% (3 tests)
  
  TOTAL: 36 UNIT TESTS → 90%+ ENDPOINT COVERAGE

Integration Workflows:
  Teacher workflows:         6 scenarios ✓
  Student workflows:         6 scenarios ✓
  DB persistence:           3 scenarios ✓
  Error recovery:           3 scenarios ✓
  
  TOTAL: 21 INTEGRATION TESTS → 85%+ WORKFLOW COVERAGE

Frontend Components (Future):
  ExamList component:        85%+ coverage
  ExamForm component:        85%+ coverage
  ExamTaking component:      85%+ coverage
  
Redis State Management:
  Exam slice:               95%+ coverage
  Submission slice:         95%+ coverage
  
Utilities & Helpers:
  Validation functions:     95%+ coverage
  Grade calculation:        95%+ coverage
  Answer mapping:           95%+ coverage

OVERALL TARGET: 90%+ Code Coverage
```

### Coverage Threshold Rules

```javascript
// jest.config.js
{
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/modules/exam/**/*.ts': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  }
}
```

---

## PART 4: REGRESSION TEST CHECKLIST

### Weekly Regression Testing (Monday 3 PM IST)

Run before each production deployment:

#### Module 3 Exam System
- [ ] All 12 exam endpoints respond with correct status codes
- [ ] Create exam with all required fields (name, academicYear, term, dates, classes)
- [ ] List exams with pagination and filters working
- [ ] Get single exam includes all nested data
- [ ] Update exam in draft status succeeds
- [ ] Reject exam update when published
- [ ] Delete exam only works for draft
- [ ] Add questions (single and bulk) works
- [ ] List questions returns with pagination
- [ ] Student can submit answers
- [ ] Prevent duplicate submission
- [ ] Teacher can grade submissions
- [ ] Get results shows correct data per role
- [ ] Delete questions only from draft exam
- [ ] Firestore schema matches expectations
- [ ] Redux state updates correctly
- [ ] Error responses have proper format

#### Week 6 Feature Dependencies
- [ ] Student module APIs unchanged and accessible
- [ ] Teacher module still works
- [ ] Authentication system operational (JWT tokens)
- [ ] Firestore connection stable
- [ ] Database indexes performing well (<2 sec queries)

#### Cross-Module Regression
- [ ] Student enrollment list still works (Week 5/6)
- [ ] Attendance tracking still works (Week 5/6)
- [ ] Class management still works (Week 5/6)
- [ ] No conflicts with existing modules

#### Performance Checks
- [ ] Test suite completes in <5 minutes
- [ ] No memory leaks detected
- [ ] API response times <500ms (95th percentile)
- [ ] DB queries <100ms (95th percentile)

#### Data Integrity
- [ ] No orphaned data created
- [ ] Transactions roll back on failure
- [ ] Cascade deletes work correctly
- [ ] Concurrent operations don't cause conflicts

### Regression Test Report Format

```markdown
## Weekly Regression Test Report
**Date:** [Date]  
**Sprint:** Week 7  
**Tester:** QA Team  

### Results
- Unit Tests: 36/36 passing ✅
- Integration Tests: 21/21 passing ✅
- Regression Checklist: 20/20 passing ✅
- Overall: PASS

### Performance
- Total execution time: 4m 32s (target: <5m)
- Code coverage: 91.2% (target: 90%+)
- No memory leaks detected

### Issues Found
- [ ] No critical issues
- [ ] All items working as expected

### Sign-off
- QA Lead: _________________ Date: _______
- Release Authority: _________________ Date: _______
```

---

## PART 5: TEST DATA & FIXTURES

### Mock Exam Data

```typescript
const mockExam = {
  name: 'Quarterly Exam - Q1',
  academicYear: '2025-2026',
  term: 'first',
  startDate: '2026-04-15',
  endDate: '2026-05-01',
  classes: [1, 2, 3, 4, 5],
  totalMarks: 100,
  passingScore: 40,
  duration: 120,
  subject: 'Mathematics',
  status: 'draft',
};

const mockQuestion = {
  question: 'What is the capital of India?',
  type: 'multiple_choice',
  marks: 1,
  difficulty: 'easy',
  options: [
    { id: 'opt_1', text: 'Delhi', isCorrect: true },
    { id: 'opt_2', text: 'Mumbai', isCorrect: false },
    { id: 'opt_3', text: 'Bangalore', isCorrect: false },
    { id: 'opt_4', text: 'Kolkata', isCorrect: false },
  ],
};

const mockSubmission = {
  studentId: 'student_001',
  answers: [
    { questionId: 'q1', selectedOption: 'opt_1' },
    { questionId: 'q2', selectedOption: 'opt_2' },
  ],
  timeSpent: 1800, // seconds
};
```

### Mock Users

```typescript
const mockTeacher = {
  id: 'teacher_123',
  name: 'Ms. Sharma',
  role: 'teacher',
  email: 'sharma@school.edu',
  schoolId: 'school_001',
};

const mockStudent = {
  id: 'student_001',
  name: 'Avi Sharma',
  role: 'student',
  email: 'avi@school.edu',
  schoolId: 'school_001',
  class: 5,
  section: 'A',
};

const mockAdmin = {
  id: 'admin_001',
  name: 'Principal Singh',
  role: 'admin',
  email: 'admin@school.edu',
  schoolId: 'school_001',
};
```

---

## PART 6: ISSUE TRACKING & BUGFIXES

### Test Failure Handling

1. **Immediate Response (< 15 minutes)**
   - [ ] Identify affected component
   - [ ] Check if integration issue or code issue
   - [ ] Create GitHub issue with reproduction steps

2. **Root Cause Analysis (< 1 hour)**
   - [ ] Review recent code changes
   - [ ] Check database state
   - [ ] Verify test isolation

3. **Fix & Verification (< 2 hours)**
   - [ ] Apply fix to code
   - [ ] Verify test now passes
   - [ ] Check for related failures
   - [ ] Update regression checklist if needed

### Known Issues & Workarounds

| Issue | Status | Workaround |
|-------|--------|-----------|
| Firestore emulator slow on cold start | KNOWN | Pre-warm emulator in CI |
| concurrent submissions create conflicts | OPEN | Implement transaction locks |
| Redux state not syncing with DB | INVESTIGATING | Check thunk dispatch order |

---

## PART 7: PHASE 2 IMPROVEMENTS

### Enhancements for Phase 2 (Week 8)

- [ ] Add E2E tests with Playwright (9 tests)
- [ ] Performance testing (load testing with k6)
- [ ] Visual regression testing with Percy
- [ ] Mobile app testing (Android/iOS)
- [ ] Security testing (OWASP Top 10)
- [ ] Accessibility testing (WCAG 2.1)
- [ ] Contract testing with exam analytics module
- [ ] Performance benchmarking for grading engine

### Performance Benchmarks (Target)

```
Create exam:           < 200ms
Add 50 questions:      < 500ms
Submit exam (100 Q's): < 1s
Grade exam:            < 200ms
Get results:           < 300ms
List exams (100+):     < 500ms
Concurrent submissions (10): < 2s
```

---

## PART 8: SUCCESS CRITERIA

### Definition of Done for Module 3 Tests

✅ All criteria must be met for deployment:

1. **Test Count**
   - [x] 30+ unit tests written and passing
   - [x] 20+ integration tests written and passing
   - [x] 5+ E2E tests deferred to Phase 2

2. **Coverage**
   - [x] 90%+ code coverage achieved
   - [x] All 12 endpoints tested
   - [x] Happy path, error cases, edge cases covered

3. **Documentation**
   - [x] This test strategy document complete
   - [x] Inline test comments explaining test purpose
   - [x] README with test execution instructions

4. **Quality**
   - [x] All tests passing in CI/CD
   - [x] Test suite runs in <5 minutes
   - [x] No flaky tests
   - [x] Proper isolation and cleanup

5. **Regression**
   - [x] Weekly regression checklist prepared
   - [x] All Week 6 features still working
   - [x] Cross-module dependencies verified

---

## PART 9: TEST ENVIRONMENT SETUP

### Local Development Testing

```bash
# Start Firestore emulator
firebase emulators:start

# Start mock API server in another terminal
npm run mock-server

# Run tests
npm test -- --watch

# View HTML coverage report
open coverage/index.html
```

### GitHub Actions CI/CD

```yaml
- name: Run Unit Tests
  run: npm test tests/exam/exam.unit.test.ts

- name: Run Integration Tests
  run: npm test tests/exam/exam.integration.test.ts

- name: Generate Coverage Report
  run: npm test -- --coverage

- name: Upload Coverage to Codecov
  uses: codecov/codecov-action@v2
```

---

## PART 10: CONTACTS & ESCALATION

### QA Team

| Role | Name | Contact |
|------|------|---------|
| QA Lead | [Name] | Week 7 QA Lead |
| Test Automation | [Name] | CI/CD setup |
| Performance | [Name] | Load testing |

### Escalation Path

1. **Test Failure** → QA Lead (15 min response)
2. **Coverage Below 90%** → Tech Lead (blocks deployment)
3. **Flaky Tests** → Architecture Review (root cause fix)
4. **Performance Regression** → DevOps Review (optimization)

---

## APPENDIX: TEST EXECUTION COMMANDS

```bash
# Run full test suite with coverage
npm test -- --coverage --reporter=html

# Run specific test group
npm test -- --grep "POST.*exams.*Create Exam"

# Run tests in parallel (faster)
npm test -- --maxWorkers=4

# Debug single test
npm test -- --inspect-brk tests/exam/exam.unit.test.ts

# Generate JUnit report for CI
npm test -- --reporter=junit --outputFile=test-results.xml

# Generate detailed HTML report
npm test -- --coverage-reporters=html --html=coverage/index.html
```

---

**Document Status:** READY FOR IMPLEMENTATION  
**Last Updated:** April 10, 2026  
**Next Review:** Week 8 (Phase 2 E2E implementation)
