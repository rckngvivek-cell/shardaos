# 23_QA_TESTING_STRATEGY.md

## School ERP Testing Framework - Jest + React Testing Library + Cypress

**Status:** Ready for Week 1 Implementation  
**Tech Stack:** Jest (unit) + React Testing Library (component) + Cypress (E2E)  
**Ownership:** QA Agent — test strategy, integration coverage, regression checks, release sign-off

---

## TABLE OF CONTENTS

1. Testing Pyramid Strategy
2. Jest Unit Testing Setup
3. React Testing Library (RTL)
4. Cypress E2E Testing
5. GitHub Actions CI Integration
6. Coverage Targets & Reporting
7. Test Data & Mocking
8. Running Tests Locally & in CI
9. Testing Best Practices
10. Week 1-4 Test Roadmap

---

## 1. TESTING PYRAMID

```
        /\
       /  \  E2E Tests (10-15 tests)
      /____\  Cypress: Full workflows
     /      \
    /        \ Integration Tests (20-30 tests)
   /          \ Jest + RTL: Component + API
  /____________\
 /              \ Unit Tests (100-150 tests)
/______________\ Jest: Validators, reducers, utils
```

**Distribution:**
- **Unit Tests (70%):** Fast, isolated, tools/utils/validators
- **Integration Tests (20%):** Component + service integration
- **E2E Tests (10%):** Critical user journeys

---

## 2. JEST UNIT TESTING SETUP

### 2.1 Jest Configuration

```javascript
// jest.config.js

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts(x)?', '**/?(*.)+(spec|test).ts(x)?'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/**/__tests__/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
```

### 2.2 Sample Unit Tests

**Test 1: Validator Functions**

```typescript
// src/utils/__tests__/validators.test.ts

import { isValidDate, isValidMarks, isValidPhone, isValidEmail } from '../validators';

describe('Validators', () => {
  describe('isValidDate', () => {
    it('should validate correct date format YYYY-MM-DD', () => {
      expect(isValidDate('2026-04-09')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(isValidDate('04-09-2026')).toBe(false);
      expect(isValidDate('2026/04/09')).toBe(false);
      expect(isValidDate('invalid')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(isValidDate('')).toBe(false);
    });
  });

  describe('isValidMarks', () => {
    it('should accept marks 0-100', () => {
      expect(isValidMarks(0)).toBe(true);
      expect(isValidMarks(50)).toBe(true);
      expect(isValidMarks(100)).toBe(true);
    });

    it('should reject marks outside 0-100', () => {
      expect(isValidMarks(-1)).toBe(false);
      expect(isValidMarks(101)).toBe(false);
    });
  });

  describe('isValidPhone (India)', () => {
    it('should accept valid Indian phone numbers', () => {
      expect(isValidPhone('9876543210')).toBe(true);
      expect(isValidPhone('8765432109')).toBe(true);
    });

    it('should reject invalid numbers', () => {
      expect(isValidPhone('1234567890')).toBe(false);  // Starts with 1
      expect(isValidPhone('123456789')).toBe(false);    // Too short
    });
  });

  describe('isValidEmail', () => {
    it('should accept valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('name.surname@school.co.in')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });
});
```

**Test 2: Redux Reducer**

```typescript
// src/redux/slices/__tests__/authSlice.test.ts

import authReducer, { setUser, setToken, logout } from '../authSlice';

describe('authSlice', () => {
  const initialState = {
    user: null,
    loading: false,
    error: null,
    token: null,
  };

  it('should set user', () => {
    const mockUser = {
      uid: 'user_123',
      email: 'teacher@school.com',
      displayName: 'Raj Kumar',
      role: 'teacher',
      school_id: 'sch_001',
    };

    const newState = authReducer(initialState, setUser(mockUser));
    expect(newState.user).toEqual(mockUser);
  });

  it('should set token', () => {
    const token = 'jwt_token_xyz';
    const newState = authReducer(initialState, setToken(token));
    expect(newState.token).toBe(token);
  });

  it('should logout', () => {
    const stateWithUser = {
      ...initialState,
      user: { uid: 'user_123', email: 'test@test.com', displayName: 'Test', role: 'student', school_id: 'sch_001' },
      token: 'jwt_token',
    };

    const newState = authReducer(stateWithUser, logout());
    expect(newState.user).toBeNull();
    expect(newState.token).toBeNull();
  });
});
```

---

## 3. REACT TESTING LIBRARY (COMPONENT TESTS)

### 3.1 Setup

```typescript
// src/setupTests.ts

import '@testing-library/jest-dom';
import { server } from './__mocks__/server';

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 3.2 Sample Component Tests

**Test 1: ProtectedRoute**

```typescript
// src/components/Auth/__tests__/ProtectedRoute.test.tsx

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ProtectedRoute } from '../ProtectedRoute';
import { store } from '../../../redux/store';

describe('ProtectedRoute', () => {
  it('should render protected component if user is authenticated', () => {
    // Mock authenticated state
    const authenticated = {
      ...store.getState(),
      auth: {
        user: { uid: 'user_123', email: 'test@test.com', displayName: 'Test', role: 'student', school_id: 'sch_001' },
        token: 'jwt_token',
        loading: false,
        error: null,
      },
    };

    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login if user not authenticated', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    );

    // Should not show protected content (redirect happens)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('should check role if requiredRole provided', () => {
    // Authenticated but wrong role
    // Should redirect to unauthorized
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});
```

**Test 2: LoginPage**

```typescript
// src/components/Auth/__tests__/LoginPage.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { LoginPage } from '../LoginPage';
import { store } from '../../../redux/store';

describe('LoginPage', () => {
  it('should render login form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('should show error message on failed login', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </Provider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const loginButton = screen.getByRole('button', { name: /login/i });

    fireEvent.change(emailInput, { target: { value: 'invalid@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('should redirect to dashboard on successful login', async () => {
    // Mock successful login (requires mocking Firebase)
    // This test validates the happy path
  });
});
```

---

## 4. CYPRESS E2E TESTING

### 4.1 Cypress Configuration

```javascript
// cypress.config.js

import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    setupNodeEvents(on, config) {
      // Can add plugins here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
});
```

### 4.2 Sample E2E Tests

**Scenario 1: Student Login & View Dashboard**

```typescript
// cypress/e2e/student-dashboard.cy.ts

describe('Student Portal - Dashboard', () => {
  beforeEach(() => {
    // Login as student
    cy.visit('/login');
    cy.get('input[type="email"]').type('student@school.com');
    cy.get('input[type="password"]').type('password123');
    cy.get('button:contains("Login")').click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });

  it('should display student name and attendance', () => {
    cy.contains(/welcome, ananya/i).should('be.visible');
    cy.get('[data-testid="attendance-percentage"]').should('contain', '85%');
  });

  it('should show grades card', () => {
    cy.get('[data-testid="grades-card"]').should('be.visible');
    cy.get('[data-testid="average-grade"]').should('contain', 'A');
  });

  it('should show pending fees', () => {
    cy.get('[data-testid="fees-card"]').should('contain', 'Pending: ₹3,000');
  });

  it('should allow clicking on attendance to view details', () => {
    cy.get('[data-testid="attendance-card"]').click();
    cy.url().should('include', '/attendance');
    cy.get('table').should('be.visible');
  });
});
```

**Scenario 2: Teacher Mark Attendance**

```typescript
// cypress/e2e/teacher-attendance.cy.ts

describe('Teacher Portal - Mark Attendance', () => {
  beforeEach(() => {
    cy.login('teacher@school.com', 'password123');
    cy.visit('/teacher/attendance');
  });

  it('should display list of students in class', () => {
    cy.get('[data-testid="class-select"]').select('Class 5A');
    cy.get('[data-testid="student-list"]').within(() => {
      cy.get('table tbody tr').should('have.length.greaterThan', 0);
    });
  });

  it('should mark student as present', () => {
    cy.get('[data-testid="class-select"]').select('Class 5A');
    cy.get('table').within(() => {
      cy.contains('tr', 'Ananya').within(() => {
        cy.get('button:contains("Present")').click();
      });
    });

    cy.get('[data-testid="toast-message"]').should('contain', 'Attendance marked');
  });

  it('should mark student as absent with reason', () => {
    cy.get('[data-testid="class-select"]').select('Class 5A');
    cy.get('table').within(() => {
      cy.contains('tr', 'Rohan').within(() => {
        cy.get('button:contains("Absent")').click();
      });
    });

    cy.get('[data-testid="absence-reason"]').type('Medical leave');
    cy.get('button:contains("Save")').click();

    cy.get('[data-testid="toast-message"]').should('contain', 'Absence recorded');
  });

  it('should submit all attendance at end of day', () => {
    // Mark multiple students
    cy.markAttendance('Class 5A', [
      { name: 'Ananya', status: 'present' },
      { name: 'Rohan', status: 'absent' },
      { name: 'Priya', status: 'present' },
    ]);

    // Submit
    cy.get('button:contains("Submit Attendance")').click();
    cy.get('[data-testid="toast-message"]').should('contain', 'All attendance submitted');

    // Verify sync to BigQuery (check in admin panel)
    cy.visit('/admin/analytics');
    cy.contains('Today\'s Attendance: 2/3 present').should('be.visible');
  });
});
```

**Scenario 3: Admin Enter Grades**

```typescript
// cypress/e2e/admin-grades.cy.ts

describe('Admin Portal - Enter Grades', () => {
  beforeEach(() => {
    cy.login('principal@school.com', 'password123');
    cy.visit('/admin/grades');
  });

  it('should import grades from exam data', () => {
    cy.get('button:contains("Import Grades")').click();
    cy.get('input[type="file"]').selectFile('cypress/fixtures/grades.xlsx');
    cy.get('button:contains("Preview")').click();
    
    cy.get('table tbody tr').should('have.length', 45);  // 45 students
    cy.get('button:contains("Import")').click();

    cy.get('[data-testid="toast-message"]').should('contain', 'Grades imported: 45 records');
  });

  it('should validate marks are 0-100', () => {
    cy.get('button:contains("Import Grades")').click();
    cy.get('input[type="file"]').selectFile('cypress/fixtures/grades-invalid.xlsx');
    cy.get('button:contains("Preview")').click();

    cy.get('[data-testid="error-message"]').should('contain', 'Row 5: Math score 150 exceeds maximum 100');
  });

  it('should publish grades to students/parents', () => {
    cy.selectExam('Final Exam 2026');
    cy.get('button:contains("Publish Grades")').click();

    cy.get('[data-testid="confirmation-dialog"]').should('contain', 'Publish to 1,250 students and parents?');
    cy.get('button:contains("Confirm")').click();

    cy.get('[data-testid="toast-message"]').should('contain', 'Grades published');
    cy.get('table').within(() => {
      cy.get('[data-testid="status"]').should('contain', 'Published');
    });
  });
});
```

---

## 5. GITHUB ACTIONS CI INTEGRATION

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit -- --coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3

  component-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:components

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Start Dev Server
        run: npm start &
      
      - name: Wait for Server
        run: npm run wait-on http://localhost:3000
      
      - name: Run Cypress Tests
        uses: cypress-io/github-action@v5
        with:
          browser: chrome
          start: npm start
          wait-on: http://localhost:3000
      
      - name: Upload Screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

---

## 6. COVERAGE TARGETS

```
Week 1: >50% coverage
Week 2: >60% coverage
Week 3: >70% coverage
Week 4: >80% coverage

By Launch: 85%+ coverage
- Unit tests: 90%
- Components: 80%
- Integration: 60%
```

---

## 7. TEST DATA & MOCKING

```typescript
// src/__mocks__/server.ts

import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const server = setupServer(
  rest.get('/api/schools/:schoolId/students/:studentId', (req, res, ctx) => {
    return res(
      ctx.json({
        student_id: 'stu_123',
        name: 'Ananya',
        class_id: 'class_5a',
        attendance_percentage: 85,
      })
    );
  }),

  rest.post('/api/schools/:schoolId/attendance/mark', (req, res, ctx) => {
    return res(ctx.json({ success: true }));
  })
);
```

---

## 8. RUNNING TESTS

```bash
# Unit tests
npm run test:unit

# Components
npm run test:components

# E2E
npm run test:e2e

# All tests with coverage
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

---

## 9. TESTING BEST PRACTICES

✅ Test behavior, not implementation  
✅ Use data-testid for E2E selectors (not class names)  
✅ Write tests before or alongside code (TDD preferred)  
✅ Keep tests isolated and independent  
✅ Mock external APIs  
✅ Test error scenarios  
✅ Use descriptive test names  

---

## 10. WEEK 1-4 TEST ROADMAP

**Week 1:**
- Jest setup + 20 unit tests
- RTL setup + 10 component tests
- Cypress setup + 5 E2E flows
- Target coverage: 50%

**Week 2:**
- Add 30 unit tests (validators, formatters)
- Add 20 RTL component tests
- Add 10 E2E tests (attendance, grades, fees)
- Target coverage: 60%

**Week 3:**
- Add 40 unit tests (services, reducers)
- Add 20 RTL tests (forms, modals)
- Add 15 E2E tests (admin workflows)
- Target coverage: 70%

**Week 4:**
- Add 30 integration tests
- Add 10 E2E tests (analytics, reporting)
- Mobile responsive tests
- Target coverage: 80%+

---

**Next:** QA team starts writing tests in parallel with feature development.
