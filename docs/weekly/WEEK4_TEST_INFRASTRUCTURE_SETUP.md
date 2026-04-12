# Week 4 Test Infrastructure Setup Guide

**QA Agent:** Test Infrastructure Configuration  
**Date:** May 6, 2026  
**Objective:** Configure Jest, Supertest, Istanbul, and CI/CD test gates for 82%+ coverage

---

## 🎯 TEST INFRASTRUCTURE CHECKLIST

### Phase 1: Backend Test Setup (apps/api/)

#### 1.1 Jest Configuration

**File: `apps/api/jest.config.js`**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/index.ts',
    '!src/**/*.d.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.gcloud/'
  ],
  coverageThreshold: {
    global: {
      branches: 82,
      functions: 82,
      lines: 82,
      statements: 82
    }
  },
  testTimeout: 30000,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  }
};
```

**File: `apps/api/tsconfig.test.json`**

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
    "lib": ["es2020"],
    "strict": true
  },
  "include": [
    "src/**/*",
    "tests/**/*"
  ]
}
```

#### 1.2 Supertest Configuration

**File: `apps/api/tests/setup.ts`**

```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Use Firestore emulator for tests
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialize Firebase Admin SDK with service account (not credentials)
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('Using Firestore emulator (test mode)');
}

jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
};
```

**File: `apps/api/tests/api.test.ts`** (Template)

```typescript
import request from 'supertest';
import { app } from '../src/index';

describe('API Routes', () => {
  describe('POST /api/v1/schools', () => {
    it('should create a school with valid data', async () => {
      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send({
          name: 'Test School',
          location: 'Test City',
          principalEmail: 'principal@test.com'
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test School');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/v1/schools')
        .set('Authorization', `Bearer ${process.env.TEST_TOKEN}`)
        .send({
          name: '' // Empty name should fail
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });
});
```

#### 1.3 Istanbul Coverage Configuration

**File: `apps/api/.nycrc.json`**

```json
{
  "all": true,
  "include": ["src/**/*.ts"],
  "exclude": [
    "src/**/*.test.ts",
    "src/**/*.spec.ts",
    "src/index.ts",
    "node_modules",
    "dist"
  ],
  "reporter": ["html", "text", "text-summary", "lcov", "json"],
  "report-dir": "./coverage",
  "temp-dir": "./.nyc_output",
  "lines": 82,
  "functions": 82,
  "branches": 82,
  "statements": 82,
  "check-coverage": true
}
```

#### 1.4 NPM Scripts

**File: `apps/api/package.json`**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=unit",
    "coverage:report": "jest --coverage && open coverage/index.html"
  }
}
```

---

### Phase 2: Frontend Test Setup (apps/web/)

#### 2.1 Jest Configuration

**File: `apps/web/jest.config.js`**

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/.build/'
  ],
  coverageThreshold: {
    global: {
      branches: 82,
      functions: 82,
      lines: 82,
      statements: 82
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
        esModuleInterop: true
      }
    }]
  }
};
```

#### 2.2 Setup Test Utilities

**File: `apps/web/src/setupTests.ts`**

```typescript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Initialize MSW (Mock Service Worker)
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock window.localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;
```

#### 2.3 React Component Test Template

**File: `apps/web/src/__tests__/Login.test.tsx`** (Template)

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { Login } from '../pages/Login';
import { store } from '../redux/store';

describe('Login Component', () => {
  it('should render login form', () => {
    render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should submit form with valid credentials', async () => {
    render(
      <Provider store={store}>
        <Login />
      </Provider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    });
  });
});
```

#### 2.4 NPM Scripts

**File: `apps/web/package.json`**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "coverage:report": "jest --coverage && open coverage/lcov-report/index.html"
  }
}
```

---

### Phase 3: GitHub Actions CI/CD Test Gates

**File: `.github/workflows/test.yml`**

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      firestore-emulator:
        image: google/cloud-sdk:emulators
        options: >-
          --health-cmd "curl -f http://localhost:8080 || exit 1"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 8080:8080

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies (Backend)
        working-directory: ./apps/api
        run: npm ci

      - name: Install dependencies (Frontend)
        working-directory: ./apps/web
        run: npm ci

      - name: Lint Backend
        working-directory: ./apps/api
        run: npm run lint

      - name: Lint Frontend
        working-directory: ./apps/web
        run: npm run lint

      - name: Type check Backend
        working-directory: ./apps/api
        run: npm run typecheck

      - name: Type check Frontend
        working-directory: ./apps/web
        run: npm run typecheck

      - name: Run Backend Tests
        working-directory: ./apps/api
        env:
          FIRESTORE_EMULATOR_HOST: localhost:8080
        run: npm run test:ci

      - name: Run Frontend Tests
        working-directory: ./apps/web
        run: npm run test:ci

      - name: Check Coverage (Backend)
        working-directory: ./apps/api
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 82" | bc -l) )); then
            echo "Backend coverage is ${COVERAGE}%, required 82%+"
            exit 1
          fi

      - name: Check Coverage (Frontend)
        working-directory: ./apps/web
        run: |
          COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
          if (( $(echo "$COVERAGE < 82" | bc -l) )); then
            echo "Frontend coverage is ${COVERAGE}%, required 82%+"
            exit 1
          fi

      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info,./apps/web/coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
          fail_ci_if_error: false

      - name: Security Scan (Backend)
        working-directory: ./apps/api
        run: npm audit --audit-level=moderate || true

      - name: Security Scan (Frontend)
        working-directory: ./apps/web
        run: npm audit --audit-level=moderate || true

      - name: Generate Test Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-reports
          path: |
            apps/api/coverage/
            apps/web/coverage/
```

---

### Phase 4: Local Development Test Watchers

**File: `scripts/test-watch.sh`** (Local test watcher for development)

```bash
#!/bin/bash

# Start Firestore emulator in background
echo "Starting Firestore emulator..."
firebase emulators:start --only firestore &
EMULATOR_PID=$!

# Wait for emulator to be ready
sleep 5

# Start backend tests in watch mode
echo "Starting backend tests..."
cd apps/api
npm run test:watch &
BACKEND_PID=$!

# Start frontend tests in watch mode in new terminal
echo "Starting frontend tests in new terminal..."
cd ../web
npm run test:watch &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
  echo "Cleaning up..."
  kill $EMULATOR_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
  exit 0
}

# Set trap to cleanup on interrupt
trap cleanup SIGINT

# Wait for all processes
wait $EMULATOR_PID $BACKEND_PID $FRONTEND_PID
```

---

## 🚀 EXECUTION STEPS

### Monday May 6 - Setup Day

#### Step 1: Verify Jest Configuration (30 min)

```bash
# Check backend jest config
cd apps/api
npm list jest jest-cli ts-jest @types/jest
npm run test -- --version

# Check frontend jest config
cd ../web
npm list jest jest-cli ts-jest @types/jest
npm run test -- --version

# Verify both are correctly configured
npm run test -- --listTests | head -5
```

**Success Criteria:**
- [ ] Jest version 29+ installed in both apps
- [ ] TypeScript compilation working
- [ ] Test discovery working (sees test files)

#### Step 2: Verify Supertest Setup (15 min)

```bash
# Check Supertest installed
cd apps/api
npm list supertest

# Verify Express app exports correctly
grep -r "export.*app" src/index.ts

# Create simple test file and run
npm run test -- api.test.ts
```

**Success Criteria:**
- [ ] Supertest 6+ installed
- [ ] Express app exports for testing
- [ ] Can make requests to test endpoints

#### Step 3: Set Up Firestore Emulator (15 min)

```bash
# Start emulator
firebase emulators:start --only firestore

# In another terminal, verify connection
curl http://localhost:8080

# Run backend tests against emulator
cd apps/api
FIRESTORE_EMULATOR_HOST=localhost:8080 npm run test
```

**Success Criteria:**
- [ ] Firestore emulator starts on port 8080
- [ ] Tests connect to emulator successfully
- [ ] No connection errors in test output

#### Step 4: Configure Istanbul Coverage (15 min)

```bash
# Run tests with coverage
cd apps/api
npm run test -- --coverage

# Check coverage report generated
ls -la coverage/

# Check coverage meets 82%+ threshold
cat coverage/coverage-summary.json | jq '.total'
```

**Success Criteria:**
- [ ] Coverage report generated in `coverage/` directory
- [ ] HTML report accessible at `coverage/index.html`
- [ ] JSON summary shows coverage percentages
- [ ] Coverage shows 82%+ or near-threshold

#### Step 5: Set Up CI/CD Test Gates (20 min)

```bash
# Add GitHub Actions workflow
mkdir -p .github/workflows
cp scripts/test.yml .github/workflows/

# Enable branch protection rules
# - Require tests to pass
# - Require 82%+ coverage
# - Require PR review

# Verify workflow file syntax
npm run validate:workflows  # If available
# Or manually check in GitHub UI
```

**Success Criteria:**
- [ ] GitHub Actions workflow file valid
- [ ] Workflow runs on PR creation
- [ ] Test results show in PR checks
- [ ] Coverage requirement enforced

### Tuesday May 6 - Test Creation Day

#### Step 6: Create Test Templates (30 min)

```bash
# Create test template files
mkdir -p apps/api/tests/{unit,integration}
mkdir -p apps/web/src/__tests__/{pages,components}

# Copy template files
cp templates/api-test-template.ts apps/api/tests/unit/
cp templates/component-test-template.tsx apps/web/src/__tests__/components/
```

#### Step 7: Verify Coverage Dashboard (20 min)

```bash
# Generate coverage report
cd apps/api && npm run coverage:report
cd ../web && npm run coverage:report

# Check HTML reports
open coverage/index.html

# Document coverage baseline
echo "Coverage baseline: $(cat coverage/coverage-summary.json | jq '.total.lines.pct')"
```

---

## 📊 COVERAGE DASHBOARD SETUP

### Create Coverage Tracking Spreadsheet

**File: `WEEK4_COVERAGE_TRACKER.md`**

```markdown
# Coverage Tracking Dashboard - Week 4

| Date | Backend % | Frontend % | Combined % | Trend | Status |
|------|-----------|-----------|-----------|-------|--------|
| May 6 | 45% | 52% | 48% | 📈 | Baseline |
| May 7 | 68% | 71% | 69% | 📈 | PR #1+#4 |
| May 8 | 82% | 83% | 82% | 📈 | PR #2+#3 |
| May 9 | 84% | 85% | 84% | ✅ | Ready |
| May 10 | 84% | 85% | 84% | ✅ | Deployed |

**Target:** 82%+ across all modules
**Status:** ✅ ON TRACK
**Last Updated:** [timestamp]
```

---

## 🔍 VERIFICATION CHECKLIST

### Pre-Execution Verification

Before Monday May 6, 9 AM:

- [ ] Jest 29+ configured in apps/api/jest.config.js
- [ ] Jest 29+ configured in apps/web/jest.config.js
- [ ] Supertest 6+ installed: `npm list supertest`
- [ ] Istanbul coverage configured: `.nycrc.json` exists
- [ ] tsconfig.test.json created and correct
- [ ] setupTests.ts created with proper mocks
- [ ] GitHub Actions workflow configured
- [ ] All NPM test scripts working:
  - [ ] `npm run test` runs all tests
  - [ ] `npm run test:watch` enters watch mode
  - [ ] `npm run test:coverage` generates report
- [ ] Local Firestore emulator can start
- [ ] Coverage reports generate HTML
- [ ] Baseline coverage established

### Daily Verification

Monday-Friday, EOD:

- [ ] Run: `npm run test` → all tests pass
- [ ] Run: `npm run test -- --coverage` → generates report
- [ ] Check: `coverage/coverage-summary.json` for percentage
- [ ] Verify: >= 82% coverage or document gap
- [ ] Log: Results in WEEK4_DAILY_PROGRESS_DASHBOARD.md

### Friday Pre-Deployment

- [ ] All 47 tests passing: 47/47 ✅
- [ ] Coverage >= 82%: ✅
- [ ] No linting errors: ✅
- [ ] TypeScript strict mode passes: ✅
- [ ] No security vulnerabilities: ✅
- [ ] Load test <500ms p95: ✅

---

## 📞 TROUBLESHOOTING

| Error | Cause | Fix |
|-------|-------|-----|
| "Cannot find module jest" | Not installed | `npm install --save-dev jest @types/jest` |
| "Firestore emulator not responding" | Not started | `firebase emulators:start --only firestore` |
| "Coverage below 82%" | Untested code | Add unit tests for untested lines |
| "GitHub Actions failing" | Environment not set | Check `.env` and Action secrets |
| "npm run test hangs" | Broken test | Run `npm run test:debug` and check output |

---

**Created:** May 6, 2026
**Status:** ✅ READY FOR EXECUTION
**Target:** 82%+ coverage maintained throughout Week 4
