# 29_QA_INTEGRATION_TESTS_1.md - Week 2 QA Testing

**Sprint:** Week 2  
**Date:** April 9, 2026  
**Module:** QA Integration & E2E Testing (Student Portal)  
**Owner:** QA Agent

---

## Executive Summary

Comprehensive QA testing strategy covering:
- Integration tests (Jest + Firebase Emulator)
- End-to-end workflows (Cypress)  
- Component tests (React Testing Library)
- API contract validation
- Database consistency checks
- Performance testing (K6 load tests)
- Security testing (JWT, XSS, CSRF)
- Accessibility compliance (WCAG 2.1 AA)
- Mobile responsiveness testing
- Data validation tests

**Coverage Target:** 70%+ codebase (10-15% E2E, 70% integration, 80% unit)

---

## 1. Integration Test Suite (Jest + Firebase Emulator)

### Setup
**Jest config:** `jest.config.integration.cjs` with Firebase Emulator initialization  
**Emulator start:** Firebase Emulator Suite (Firestore, Auth, Pub/Sub locally)  
**Setup/Teardown:** Auto-clear Firestore collections after each test  
**Mocks:** Pub/Sub, BigQuery, Razorpay, Twilio services

### StudentService Tests
- `enrollStudent()`: Create new student, verify Firestore doc + timestamp
- `enrollStudent()` duplicate: Reject email already enrolled
- `enrollStudent()` validation: Missing required fields → error
- `getStudent()`: Retrieve by ID, return null for nonexistent
- `updateStudent()`: Modify profile, verify Firestore updated
- `deleteStudent()`: Mark inactive, verify Firestore state

### AttendanceService Tests
- `recordAttendance()`: Create attendance records, validate date/status
- `recordAttendance()` constraints: Reject future dates, locked exams
- `getAttendanceReport()`: Filter by month, sort by date
- `getAttendanceReport()` percentage: Calculate monthly %, at-risk alerts
- `bulkImportAttendance()`: Import CSV, validate 100 records in <2s

### GradeService Tests
- `recordMarks()`: Enter exam marks, calculate grade (A/B/C/D/F)
- `recordMarks()` validation: Marks in range [0-100], all students marked
- `getTranscript()`: Retrieve student grades, generate PDF
- `calculateGPA()`: Formula (Σ Grade Points) / Students, verify 3.45/4.0
- `calculateGPA()` edge case: Division by zero (0 grades) → null

### FeeService Tests
- `createInvoice()`: Generate invoice, store in Firestore, calculate total
- `recordPayment()`: Mark paid, update ledger, trigger Pub/Sub event
- `recordPayment()` idempotency: Same payment twice → no duplicate
- `getLedger()`: Fetch payment history, verify running balance
- `refundPayment()`: Process refund, update balance, audit trail

### Database Consistency Tests
- After payment recorded: Firestore + BigQuery + email sent
- After attendance: Firestore + Pub/Sub event + BigQuery insert
- No orphaned records (payment without invoice, attendance without student)

---

## 2. End-to-End Test Workflows (Cypress)

### Workflow 1: Login → Dashboard
```cypress
describe('Student Portal Login & Dashboard', () => {
  it('should login and view dashboard', () => {
    cy.visit('/login');
    cy.get('[data-testid=email]').type('student@demo.school');
    cy.get('[data-testid=password]').type('TestPass123');
    cy.get('[data-testid=login-btn]').click();
    cy.url().should('include', '/dashboard');
    cy.get('[data-testid=kpi-attendance]').should('be.visible');
    cy.get('[data-testid=kpi-fees]').should('be.visible');
  });
});
```

### Workflow 2: View Attendance & Download CSV
```cypress
describe('Attendance Workflow', () => {
  it('should view, filter, and download attendance', () => {
    cy.login('student@demo.school');
    cy.visit('/attendance');
    cy.get('[data-testid=month-filter]').select('March');
    cy.get('[data-testid=attendance-table]').within(() => {
      cy.get('tbody tr').should('have.length', 20); // 20 records shown
    });
    cy.get('[data-testid=download-csv]').click();
    cy.readFile('cypress/downloads/Attendance_*.csv').should('exist');
  });
});
```

### Workflow 3: View Grades & GPA
```cypress
describe('Grades Workflow', () => {
  it('should calculate GPA and show performance trends', () => {
    cy.login('student@demo.school');
    cy.visit('/grades');
    cy.get('[data-testid=gpa-display]').should('contain', '3.45');
    cy.get('[data-testid=trend-chart]').should('be.visible');
    cy.get('[data-testid=class-comparison]').should('contain', 'vs Class Avg');
    cy.get('[data-testid=download-transcript]').click();
    cy.request('GET', '/api/student/export/transcript').then(res => {
      expect(res.status).to.eq(200);
    });
  });
});
```

### Workflow 4: Pay Fee (Razorpay Integration)
```cypress
describe('Fee Payment Workflow', () => {
  it('should open Razorpay and complete payment', () => {
    cy.login('student@demo.school');
    cy.visit('/fees');
    cy.get('[data-testid=outstanding-balance]').should('contain', '₹15,000');
    cy.get('[data-testid=pay-btn]').click();
    
    // Intercept Razorpay modal (stubbed in test)
    cy.window().then(win => {
      cy.stub(win, 'Razorpay').returns({
        open: function() {
          // Simulate successful payment
          this.onSuccess({
            razorpay_payment_id: 'pay_test123',
            razorpay_order_id: 'order_test123',
          });
        },
      });
    });
    
    cy.get('[data-testid=success-snackbar]').should('contain', 'Payment successful');
    cy.get('[data-testid=status-paid]').should('be.visible');
  });
});
```

### Workflow 5: View Exams & Admit Card
```cypress
describe('Exams Workflow', () => {
  it('should view exams and download admit card', () => {
    cy.login('student@demo.school');
    cy.visit('/exams');
    cy.get('[data-testid=upcoming-exams]').should('contain', 'Mathematics');
    cy.get('[data-testid=admit-card-btn]').first().click();
    cy.readFile('cypress/downloads/AdmitCard_*.pdf').should('exist');
  });
});
```

---

## 3. Component-Level Tests (React Testing Library)

**StudentDashboard:**
- Renders profile card, school selector, 4 KPI cards
- School change updates all child components
- Loading state shows skeleton

**AttendanceView:**
- Table renders 30 rows/page, pagination works
- Filter by month changes data
- Sort by date (asc/desc) works
- Download CSV triggers file download

**GradesView:**
- Table renders subjects + grades
- GPA calculated correctly
- Chart renders without errors
- Class comparison bars show correctly

**FeesView:**
- Invoice list renders
- Pay button opens modal
- Payment success updates status

**ExamsView:**
- Schedule calendar shows
- Filters work (filter by subject, date)
- Download admit card triggers download

---

## 4. API Contract Tests

**Endpoint validation:**
```bash
# GET /students/{id} - should return 200 + Student schema
# 401 if unauthenticated, 403 if unauthorized, 404 if not found

# POST /attendance - should return 201 + AttendanceRecord
# 400 if invalid data, 409 if duplicate

# POST /fees/pay - should return 200 + PaymentReceipt
# 402 if payment failed, 422 if already paid
```

**Response schema validation (Zod):**
```typescript
const StudentResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'TRANSFERRED']),
  createdAt: z.date(),
});

// Validate API response matches schema
const validated = StudentResponseSchema.parse(response.data);
```

**Latency SLA:** All endpoints <500ms (p95)

---

## 5. Performance Testing (K6 Load Tests)

```javascript
// Load scenario: 100 concurrent students + 10 concurrent teachers
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '2m30s', target: 100 }, // Hold at 100 users
    { duration: '30s', target: 0 }, // Ramp down to 0
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],  // 95th percentile < 300ms
    http_req_failed: ['rate<0.01'],    // <1% failure rate
  },
};

export default function() {
  const res = http.get('https://api.schoolerp.in/v1/students/profile');
  check(res, {
    'dashboard loads': r => r.status === 200,
    'response time <300ms': r => r.timings.duration < 300,
  });
}
```

---

## 6. Security Testing

- **JWT validation:** Expired token → 401, invalid signature → 401
- **RBAC enforcement:** Student accessing teacher data → 403
- **Input validation:** XSS attempts (e.g., `<script>`) → sanitized
- **CSRF tokens:** POST requests require valid CSRF token
- **Rate limiting:** >100 requests/min per user → 429

---

## 7. Accessibility Testing (WCAG 2.1 AA)

**Axe-core validation on all pages:**
- Color contrast: Text >4.5:1 ratio (normal), >3:1 (large)
- Keyboard navigation: Tab through all interactive elements
- ARIA labels: All form fields + images have labels
- Focus indicators: Visible focus outline on all elements
- Page structure: Proper heading hierarchy (H1 → H2)

---

## 8. Mobile Responsiveness Testing (Playwright)

**Test devices:**
- iPhone 12 (390×844): Portrait + landscape
- Pixel 5 (393×786): Portrait + landscape

**Test scenarios:**
- Dashboard: Single column, touch-friendly spacing
- Attendance table: Horizontal scroll or card layout
- Payment modal: Works on small screens
- Charts: Responsive sizing

---

## Success Criteria (Week 2)

- [ ] All integration tests passing (85%+ service coverage)
- [ ] All E2E workflows passing on staging
- [ ] <1s Cypress test suite execution (parallel mode)
- [ ] Zero flaky tests (3x run = same results)
- [ ] 70%+ code coverage
- [ ] Load test: p95 <300ms, <1% errors
- [ ] No security vulnerabilities (OWASP Top 10)
- [ ] WCAG 2.1 AA compliance
- [ ] Mobile responsive on 320px+

**Results:** Generate test report → codecov.io + Slack notification → merge approval if all pass

