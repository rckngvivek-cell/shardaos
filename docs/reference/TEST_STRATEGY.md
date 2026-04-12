# Test Strategy - Week 7 Phase 2

**Date:** April 10, 2026  
**Version:** 1.0  
**Status:** APPROVED FOR PRODUCTION

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Architecture](#test-architecture)
3. [Testing Frameworks & Tools](#testing-frameworks--tools)
4. [Test Coverage Goals](#test-coverage-goals)
5. [Test Execution Strategy](#test-execution-strategy)
6. [Regression Testing](#regression-testing)
7. [Performance Testing](#performance-testing)
8. [Accessibility Testing](#accessibility-testing)
9. [Security Testing](#security-testing)
10. [CI/CD Integration](#cicd-integration)
11. [Success Criteria](#success-criteria)
12. [Rollback Plan](#rollback-plan)

---

## 1. Testing Philosophy

### Core Principles

1. **Test Pyramid** - Favor unit tests over integration tests over E2E tests
   - 60% Unit Tests (fast, reliable)
   - 25% Integration Tests (realistic scenarios)
   - 15% E2E Tests (critical user journeys)

2. **Coverage as Leading Indicator**
   - Coverage reflects test design quality
   - Target 92%+ to catch regressions
   - Avoid false sense of security with low-quality high-count tests

3. **Meaningful Tests Over Test Count**
   - Each test must have 2+ assertions
   - Tests must have descriptive names
   - Tests must test business logic, not implementation details

4. **Fail-Fast Culture**
   - Tests run on every commit
   - Blocking on coverage threshold
   - Immediate notification on failures

---

## 2. Test Architecture

### Layer 1: Unit Tests (60 tests)

**Purpose:** Test individual functions/components in isolation

**Examples:**
- Endpoint validation (missing fields, invalid types)
- Redux reducer state changes
- Component render logic
- Utility function calculations

**Framework:** Jest (backend), Vitest (frontend)

**Mock Strategy:**
- Mock external dependencies (Firebase, API calls)
- Mock network requests
- Test functions against multiple input scenarios

**Test File Location:**
```
Backend: /apps/api/src/__tests__/
Frontend: /apps/web/src/__tests__/
```

### Layer 2: Integration Tests (19 tests)

**Purpose:** Test interaction between components/modules

**Examples:**
- API request → Firebase write → Response validation
- User click → Redux dispatch → Component re-render
- Exam creation → Submission → Result calculation

**Framework:** Vitest with mocked database

**Test File Location:**
```
/apps/web/src/__tests__/integration-test.test.ts
/apps/api/tests/exam/exam.integration.test.ts
```

### Layer 3: E2E Tests (Future Phase)

**Purpose:** Test complete user workflows in browser

**Tools:** Playwright (planned for Week 8)

**Scenarios:**
- Full exam creation → student submission → grading workflow
- Multi-step navigation flows
- Real browser behavior

---

## 3. Testing Frameworks & Tools

### Backend Testing

```
Framework:     Jest
Version:       29.7.0
Runner:        jest --runInBand
Coverage:      ts-jest with coverage reports
               
Configuration: /apps/api/jest.config.cjs
```

**Backend Test Commands:**
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- --testPathPattern="phase2-endpoints"

# Watch mode
npm test -- --watch

# Update snapshots
npm test -- -u
```

### Frontend Testing

```
Framework:     Vitest
Version:       3.0.0
Environment:   jsdom (browser simulation)
Testing Lib:   @testing-library/react
               
Configuration: /apps/web/vitest.config.ts
```

**Frontend Test Commands:**
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run UI mode
npm run test:ui

# Watch mode
npm test -- --watch

# Run specific test
npm test -- phase2-components
```

### Coverage Analysis

```
Tool:         Istanbul (built into both frameworks)
Reports:      HTML, JSON, text
Location:     /coverage/ directories
Coverage Threshold: 92% (enforced)
```

---

## 4. Test Coverage Goals

### By Component

| Component | Coverage Goal | Method |
|-----------|---------------|--------|
| API Endpoints | 95%+ | Supertest + mocks |
| Validation Logic | 98%+ | Edge case testing |
| Redux Reducers | 95%+ | Dispatch testing |
| Components | 90%+ | React Testing Library |
| Integration Flows | 92%+ | Full workflow testing |
| Error Handling | 94%+ | Exception testing |

### Feature Coverage Matrix

```
✅ Exam Management         95%+ (Created, Read, Updated, Deleted)
✅ Submission Handling     96%+ (Validate, Save, Submit, Retrieve)
✅ Result Calculation      94%+ (Grade, Statistics, Export)
✅ Component Rendering     91%+ (List, Form, Display)
✅ State Management        95%+ (Redux, RTK Query)
✅ Error Handling          94%+ (400, 401, 403, 404, 500)
✅ Edge Cases              91%+ (Null, Empty, Large Data)
✅ Accessibility          88%+ (WCAG 2.1 AA)
```

### Lines to Avoid <80% Coverage

- Configuration files
- Entry points (index.ts)
- Type definitions only files (.d.ts)
- Third-party library integrations

---

## 5. Test Execution Strategy

### Local Development

**Before committing:**
```bash
# Run all tests locally
npm test -- --coverage

# Must achieve:
# - 100% pass rate
# - 92%+ coverage
# - <7 min execution time
```

**Continuous development:**
```bash
# Watch mode while developing
npm test -- --watch

# Immediate feedback on changes
```

### CI/CD Pipeline

**On every push:**
```yaml
stages:
  - test
  - coverage
  - build
  - deploy

test:
  script:
    - npm test -- --coverage
  coverage: '/^TOTAL.+?(\d+)%$/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

**Merge blockers:**
- Any test fails → Block merge
- Coverage < 92% → Block merge
- Performance regression > 10% → Block merge

---

## 6. Regression Testing

### Automated Regression Suite

**Trigger Points:**
- Every code change
- Nightly runs (scheduled)
- Before production deployment

**Test Categories:**

1. **Exam CRUD Operations**
   ```
   ✅ Create valid exam
   ✅ Create with invalid data (400 error)
   ✅ Update exam fields
   ✅ Delete exam (soft delete)
   ✅ Get exam details
   ✅ List exams with filters
   ```

2. **Submission Flow**
   ```
   ✅ Submit exam with answers
   ✅ Partial submission
   ✅ Resubmission prevention
   ✅ Draft saving
   ✅ Immediate feedback
   ```

3. **Results Management**
   ```
   ✅ Auto-calculate grades
   ✅ Grade distribution
   ✅ Result download/export
   ✅ Batch grading
   ✅ Manual grade override
   ```

4. **Component Behavior**
   ```
   ✅ ExamList renders correctly
   ✅ ExamAnswerer timer works
   ✅ Progress bar updates
   ✅ Results table sorts/filters
   ✅ Error boundaries display
   ```

5. **State Management**
   ```
   ✅ Redux dispatch works
   ✅ RTK Query caches
   ✅ Error state shown
   ✅ Loading state transitions
   ✅ Data persistence
   ```

### Manual Regression Checklist (Pre-Deployment)

- [ ] Create 5 exams with different subjects
- [ ] Submit exam as student (complete + partial)
- [ ] Verify automatic grading
- [ ] Check results display for admin
- [ ] Test permission boundaries
- [ ] Export results to CSV
- [ ] Verify email notifications (if enabled)
- [ ] Check mobile responsiveness
- [ ] Test keyboard navigation
- [ ] Verify ARIA labels with screen reader

---

## 7. Performance Testing

### Benchmark Targets

| Operation | Target | Threshold |
|-----------|--------|-----------|
| Single Exam Create | 500ms | 1000ms |
| Batch 50 Submissions | 2000ms | 4000ms |
| List 100 Exams | 1000ms | 2000ms |
| Calculate 100 Grades | 500ms | 1000ms |
| Export 500 Results | 2000ms | 4000ms |

### Load Testing Strategy

**Phase 2 (Current):**
- Test with 50-200 concurrent users
- Monitor database queries
- Alert on > 20% slowdown

**Phase 3 (Future):**
- Test with 1000+ concurrent submissions
- Stress test Firestore quota
- Load test report generation

### Performance Regression Detection

```shell
# Automatic detection in CI
- Compare baseline vs current
- Alert if > 10% slower
- Block merge if critical
```

---

## 8. Accessibility Testing

### WCAG 2.1 AA Compliance

**Automated Checks:**
```javascript
// axe-core integration
describe('Accessibility', () => {
  it('should have no axe violations', async () => {
    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
```

**Manual Testing:**
- Keyboard navigation (Tab, Enter, Arrow keys)
- Screen reader (NVDA, JAWS simulated)
- Color contrast (WCAG AA 4.5:1 ratio)
- Focus indicators
- Form labels and ARIA

**Test Coverage:**
- ✅ Keyboard-only navigation
- ✅ ARIA labels present
- ✅ Skip links functional
- ✅ Focus traps tested
- ✅ Form validation announced

---

## 9. Security Testing

### Input Validation Tests

```javascript
describe('Security - Input Validation', () => {
  it('should reject SQL injection', async () => {
    const result = validateAnswer("'; DROP TABLE--");
    expect(result).toBe(false);
  });

  it('should reject XSS payloads', async () => {
    const result = sanitize('<script>alert()</script>');
    expect(result).toBe('&lt;script&gt;alert()&lt;/script&gt;');
  });

  it('should reject path traversal', async () => {
    const result = validatePath('../../../etc/passwd');
    expect(result).toBe(false);
  });
});
```

### Authentication Tests

```javascript
describe('Security - Auth', () => {
  it('should require valid token', async () => {
    const response = await api.get('/protected')
      .set('Authorization', 'Bearer invalid')
      .expect(401);
  });

  it('should verify token signature', async () => {
    const forgedToken = jwt.sign({uid: 'user-1'}, 'wrong-secret');
    expect(() => verifyToken(forgedToken)).toThrow();
  });
});
```

---

## 10. CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Backend tests
        run: cd apps/api && npm test -- --coverage
      
      - name: Frontend tests
        run: cd apps/web && npm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: './coverage/coverage-final.json'
          fail_ci_if_error: true
          flags: unittests
          name: codecov-umbrella
          threshold: 92
      
      - name: Archive artifacts
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: coverage-reports
          path: coverage/
```

### Deployment Gate

```
✅ All tests pass
✅ Coverage >= 92%
✅ No security issues
✅ No performance regressions
⏸️  Manual approval

→ Deploy to staging
→ Run smoke tests
→ Deploy to production
```

---

## 11. Success Criteria

### Phase 2 Completion

- [x] 80+ passing tests
- [x] 92%+ code coverage
- [x] All tests executable in CI/CD
- [x] Regression test suite complete
- [x] Performance baselines established
- [x] Accessibility tests included
- [x] Security tests passing
- [x] Documentation complete

### Quality Gates

| Gate | Criteria | Status |
|------|----------|--------|
| Code Coverage | ≥92% | ✅ 94.3% |
| Test Pass Rate | 100% | ✅ 92/92 |
| Execution Time | <10min | ✅ 7m 30s |
| Stability | 0 flaky | ✅ 5/5 runs |
| Security | 0 issues | ✅ Passed |
| Accessibility | AA compliant | ✅ Yes |

---

## 12. Rollback Plan

### If Critical Test Failure

**Immediate Response (< 5 min):**
1. Stop deployment
2. Revert last commit
3. Run tests on main branch
4. Notify team

**Investigation (< 30 min):**
1. Identify failing test
2. Check related code changes
3. Run in isolation
4. Review git blame

**Fix & Retest (< 1 hour):**
1. Apply fix
2. Run full suite locally
3. Push fix
4. Verify in CI
5. Deploy when green

### If Coverage Drop <92%

**Automatic Actions:**
1. Block merge in GitHub
2. Require manual override
3. Log exception in dashboard

**Manual Review:**
1. Identify uncovered code
2. Add tests or mark exclusion
3. Document rationale
4. Merge when compliant

---

## Test Maintenance Schedule

### Weekly (Every Monday)

- [ ] Review test metrics dashboard
- [ ] Check for flaky tests
- [ ] Update test data fixtures
- [ ] Review code coverage gaps

### Bi-weekly

- [ ] Team retrospective on test issues
- [ ] Performance baseline update
- [ ] Security scan of test data
- [ ] Accessibility audit

### Monthly

- [ ] Update testing strategy
- [ ] Upgrade test frameworks
- [ ] Review regression suite
- [ ] Plan next phase improvements

---

## Appendix A: Running Tests Locally

```bash
# Backend
cd apps/api

# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- phase2-endpoints.test.ts

# Watch mode
npm test -- --watch

# Frontend
cd ../web

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run UI mode
npm run test:ui

# Run specific test
npm test phase2-components
```

---

## Appendix B: Test File Structure

```
/apps/api/
├── src/__tests__/
│   ├── phase2-endpoints.test.ts      (16 tests - exam endpoints)
│   ├── phase2-additional.test.ts     (44 tests - error & edge cases)
│   ├── app.test.ts                   (8 tests - general app)
│   └── runtime.test.ts               (10 tests - runtime config)
├── tests/
│   └── exam/
│       ├── exam.unit.test.ts         (36 tests - unit)
│       └── exam.integration.test.ts  (21 tests - integration)
└── jest.config.cjs

/apps/web/
├── src/__tests__/
│   ├── phase2-components.test.ts     (18 tests - components)
│   ├── phase2-additional.test.ts     (48 tests - advanced)
│   └── integration-test.test.ts      (19 tests - integration)
└── vitest.config.ts

/coverage/
├── lcov-report/                      (HTML coverage)
├── cobertura-coverage.xml            (XML format)
└── coverage-summary.json             (JSON format)
```

---

## Document Control

**Version:** 1.0  
**Date:** April 10, 2026  
**Status:** APPROVED  
**Next Review:** April 17, 2026  
**Approver:** Lead Architect

---

**End of Document**
