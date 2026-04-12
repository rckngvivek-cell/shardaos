# WEEK 3 - DAY 3 DETAILED IMPLEMENTATION PLAN

**Date:** April 12, 2024  
**Sprint:** Week 3 Staff Portal Launch  
**Status:** READY FOR APPROVAL & EXECUTION  
**PRI Phase:** Planning (Awaiting Review & Approval)

---

## DAY 3 OBJECTIVE

### Primary Goal
Build **Grades Management System** for staff portal (mark, view, report grades)

### Secondary Goals
- Extend frontend with grade entry & viewing
- Maintain 100% test pass rate
- Deploy to production
- Document all changes

### Volume Target
- **1,000 lines of code**
- **5 files** (backend, frontend ×2, tests, API)
- **8 hours** execution time
- **0 production issues**

---

## DETAILED SCOPE: BACKEND TRACK

### Backend Deliverables

**File:** `backend/src/api/v1/staff/grades.ts` (280 lines)

**Endpoints to Implement:**

#### 1. Mark/Update Grade (POST)
```
POST /api/v1/staff/grades/mark

Request Body:
{
  class_id: string (required)
  student_id: string (required)
  subject: string (required) // "Math", "English", "Science", etc.
  score: number (required) // 0-100
  exam_type?: string // "midterm", "final", "practice"
  notes?: string (optional)
}

Response (201 Created or 200 Updated):
{
  id: string
  status: "created" | "updated"
  score: number
  grade_letter: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F"
  timestamp: string
}

Validation Rules:
✓ class_id required, non-empty
✓ student_id required, non-empty
✓ subject required, in enum: ["Math", "English", "Science", "History", "PE", "Arts"]
✓ score required, 0-100 integer (or decimal?)
✓ exam_type optional, in enum: ["midterm", "final", "practice", "quiz"]

Error Responses:
✗ 400: Invalid score (negative or >100)
✗ 400: Invalid subject
✗ 400: Missing required fields
✗ 401: Not authenticated
✗ 403: No permission to edit grades (not teacher for class)
✗ 404: Student not in class

Business Logic:
→ Query duplicate (class_id + student_id + subject + exam_type)
→ If exists: Update score + timestamp
→ If new: Create with auto-calculated grade_letter
→ Audit log: Who entered grade, when, what changed
→ Firestore write with composite index on (class_id, subject)
```

#### 2. Get Grades by Class (GET)
```
GET /api/v1/staff/grades/by-class

Query Parameters:
?class_id=X [required]
&subject=Math [optional, filter by subject]
&exam_type=final [optional, filter by exam type]

Response (200):
{
  records: [
    {
      id: string
      student_id: string
      student_name: string
      subject: string
      score: number
      grade_letter: string
      exam_type: string
      marked_by: string (staff_id)
      marked_at: string (timestamp)
      notes?: string
    }
  ],
  count: number,
  class_id: string,
  subject?: string,
  exam_type?: string
}

Query Logic:
→ Start with WHERE class_id = X
→ If subject provided: AND subject = subject
→ If exam_type provided: AND exam_type = exam_type
→ Order by: student_name ASC, subject ASC
→ Return array of records

Performance:
→ Target: <300ms for class of 30 students
→ Index on: (class_id, subject, exam_type)
```

#### 3. Get Grade Statistics (GET)
```
GET /api/v1/staff/grades/stats

Query Parameters:
?class_id=X [required]
&subject=Math [optional]
&exam_type=final [optional]

Response (200):
{
  class_id: string,
  subject?: string,
  exam_type?: string,
  statistics: {
    total_students: number
    graded: number
    not_graded: number
    
    score_stats: {
      average: number (0-100)
      median: number
      min: number
      max: number
      std_deviation: number
    }
    
    grade_distribution: {
      "A+": number,
      "A": number,
      "B+": number,
      "B": number,
      "C+": number,
      "C": number,
      "D": number,
      "F": number
    }
    
    grade_percentages: {
      "A+": number (0-100%),
      "A": number,
      ... [same]
    }
    
    pass_rate: number (0-100%), // C+ and above = pass
    fail_rate: number (0-100%)
  }
}

Calculation Logic:
→ Get all records matching filters
→ Calculate: sum, count, average, median, min, max
→ For std_deviation: sqrt(sum((score - avg)²) / count)
→ Count by grade_letter
→ Calculate percentages: (count_grade / total) * 100
→ Pass rate: (count_C_and_above / total) * 100

Performance:
→ Target: <500ms even for large classes
→ Consider caching if > 1000 records
```

### Backend Implementation Details

#### Grade Calculation Logic

```typescript
function calculateGradeLetter(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 85) return "A";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "C+";
  if (score >= 65) return "C";
  if (score >= 60) return "D";
  return "F";
}

// Decision Point: Should we support decimal scores?
// Option A: Integer only (0-100)
// Option B: One decimal (0-100.0)
// Option C: Two decimals (0-100.00)
// Recommendation: Integer for simplicity, can extend later
```

#### Firestore Collections

```
classGrades/
├─ {gradeId}
│  ├─ class_id: string
│  ├─ student_id: string
│  ├─ student_name: string (denormalized for query perf)
│  ├─ subject: string
│  ├─ score: number
│  ├─ grade_letter: string
│  ├─ exam_type: string ("midterm" | "final" | "practice" | "quiz")
│  ├─ marked_by: string (staff_id)
│  ├─ marked_at: timestamp
│  ├─ updated_at: timestamp
│  └─ notes?: string

Indexes Required:
├─ (class_id, subject, exam_type)
├─ (class_id, student_id)
└─ (class_id, marked_at DESC)

Query Patterns:
├─ Get all grades for class: class_id
├─ Get grades by subject: class_id + subject
├─ Get grades by exam type: class_id + exam_type
├─ Get grades by student: class_id + student_id
└─ Find duplicates: class_id + student_id + subject + exam_type
```

#### Error Handling

```typescript
// Validation errors (400)
throw new ValidationError("Score must be between 0 and 100");
throw new ValidationError("Subject must be one of: Math, English, Science...");
throw new ValidationError("class_id is required");

// Auth errors (401/403)
throw new UnauthorizedError("No token provided");
throw new ForbiddenError("You are not a teacher for this class");

// Not found errors (404)
throw new NotFoundError("Student not found in class");

// Server errors (500)
throw new Error("Database write failed");

// All errors logged to: staffAuditLog collection
```

---

## DETAILED SCOPE: FRONTEND TRACK

### Frontend Deliverables

#### 1. Grade Management Page Component

**File:** `frontend/src/pages/GradeManagementPage.tsx` (400 lines)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Grade Management                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ [Class Dropdown] [Subject Filter] [Exam Type Filter]│
│ [Load Students] [Refresh]                           │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Table: Student ID | Name | Score | Grade | Notes   │
│ [25 rows of students with inline editing]          │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Summary: Avg: 82.5 | A+: 5 | A: 8 | B+: 7 ...     │
├─────────────────────────────────────────────────────┤
│                              [Export CSV] [Save]    │
└─────────────────────────────────────────────────────┘
```

**Features:**

1. **Class & Subject Selection**
   - Class dropdown (5 sample classes)
   - Subject dropdown filter (Math, English, Science, etc.)
   - Exam type: Midterm / Final / Practice / Quiz
   - Load Students button (populates table)

2. **Grade Entry Table**
   - Column 1: Student ID (read-only)
   - Column 2: Student Name (read-only)
   - Column 3: Score (editable, 0-100 number input)
   - Column 4: Grade (read-only, auto-calculated)
   - Column 5: Notes (editable, text field)
   - Column 6: Action (Shows "Saved" or "New" chip)
   - 25 rows per page + pagination

3. **Inline Editing**
   - Type score → Grade letter auto-calculates
   - Color coding: A+ green, B+ yellow, D/F red
   - Tab key to next student
   - Enter key to save entire row
   - Esc to cancel edits

4. **Statistics Panel**
   - 5 metric cards:
     - Average Score: 82.5
     - Median Score: 84.0
     - Pass Rate: 92% (C+ and above)
     - Fail Rate: 8%
     - Graded: 25/25 students

5. **Grade Distribution Bar Chart**
   - X-axis: Grade letters (A+, A, B+, B, C+, C, D, F)
   - Y-axis: Number of students
   - Color: Green/Yellow/Red based on grade
   - Show percentages on hover

6. **Action Buttons**
   - Export CSV: Download all grades
   - Save: Send all grades to backend
   - Refresh: Reload from server
   - Bulk: Mark all as A+ (test only)

7. **Error Handling**
   - Score out of range: Show error
   - Invalid subject: Show dropdown error
   - Save failure: Retry button
   - Success toast: "✅ Grades saved for 25/25 students"

**State Management:**
```typescript
interface GradeState {
  classId: string
  subject?: string
  examType?: string
  grades: GradeRecord[]
  selectedStudent?: string
  editingIndex?: number
  errors: Record<string, string>
  successMessage?: string
  isLoading: boolean
  isSaving: boolean
}
```

**Form Validation:**
```typescript
const gradeSchema = z.object({
  score: z.number().min(0).max(100),
  subject: z.enum(["Math", "English", "Science", "History", "PE", "Arts"]),
  examType: z.enum(["midterm", "final", "practice", "quiz"]).optional(),
  notes: z.string().optional(),
});
```

#### 2. Grade Reporting/Viewing Page

**File:** `frontend/src/pages/GradeReportPage.tsx` (300 lines)

**Purpose:** Students/parents/admin view grades (read-only)

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Grade Report                                         │
├─────────────────────────────────────────────────────┤
│ Student: John Doe | Class: 10-A | Period: Q2 2024  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Midterm Exams:                                      │
│ Subject      Score   Grade   Notes                 │
│ Math         85      A       Excellent work        │
│ English      78      B+      Good                  │
│ Science      92      A+      Outstanding          │
│                                                     │
│ Final Exams:                                        │
│ Math         88      A       ....                  │
│ English      81      A       ....                  │
│                                                     │
│ Overall GPA: 84.8 (A)                             │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Filter by student, class, exam type
- Show all grades chronologically
- Display grade trends (showing progress)
- Export to PDF (optional, future feature)
- Responsive mobile view

---

### Frontend API Integration

**File:** `frontend/src/api/staffApi.ts` (Updated, +150 lines)

**New RTK Query Hooks:**

```typescript
// Mutations
useMarkGradeMutation()              // POST /grades/mark
useUpdateGradeMutation()            // PUT /grades/:gradeId
useDeleteGradeMutation()            // DELETE /grades/:gradeId

// Queries
useGetGradesByClassQuery()          // GET /grades/by-class
useGetGradeStatsQuery()             // GET /grades/stats
useGetGradeReportQuery()            // GET /grades/report/:studentId
useGetSubjectsQuery()               // GET /grades/subjects (list available)
useGetExamTypesQuery()              // GET /grades/exam-types (list available)

// Types
type GradeRecord = {
  id: string;
  class_id: string;
  student_id: string;
  student_name: string;
  subject: string;
  score: number;
  grade_letter: string;
  exam_type: string;
  marked_by: string;
  marked_at: string;
  notes?: string;
};

type GradeStats = {
  total_students: number;
  graded: number;
  average: number;
  median: number;
  grade_distribution: Record<string, number>;
  pass_rate: number;
  fail_rate: number;
};
```

---

## DETAILED SCOPE: QA TRACK

### QA Deliverables

**File:** `test/grades.spec.ts` (280 lines)

**Test Cases (8 Total):**

| TC # | Test | Category | Priority |
|------|------|----------|----------|
| TC19 | Mark grade (valid) | Happy Path | P1 |
| TC20 | Reject score > 100 | Validation | P1 |
| TC21 | Reject invalid subject | Validation | P1 |
| TC22 | Duplicate detection | Logic | P2 |
| TC23 | Get grades by class | Query | P1 |
| TC24 | Calculate statistics | Calculation | P2 |
| TC25 | Grade distribution | Calculation | P2 |
| TC26 | Auth enforcement | Security | P1 |

**Test Template:**

```typescript
describe('Mark Grade Endpoint', () => {
  it('TC19: Mark grade with valid input', async () => {
    // Setup
    const payload = {
      class_id: 'class-001',
      student_id: 'student-001',
      subject: 'Math',
      score: 85,
      exam_type: 'midterm'
    };
    
    // Execute
    const response = await request(app)
      .post('/api/v1/staff/grades/mark')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(201);
    
    // Assert
    expect(response.body).toHaveProperty('id');
    expect(response.body.score).toBe(85);
    expect(response.body.grade_letter).toBe('A');
    expect(response.body.status).toBe('created');
    expect(response.body.timestamp).toBeDefined();
  });
});
```

**Test Coverage Target:**
- Unit tests: 8 test cases
- Coverage: 80%+ lines
- Pass rate: 100% expected
- Execution time: ~6 seconds

---

## DETAILED SCOPE: DOCUMENTATION

### Documentation Deliverables

**Files to Create:**

1. **API Specification** (100 lines)
   - Endpoint definitions
   - Request/response schemas
   - Error codes
   - Example requests

2. **Implementation Status** (150 lines)
   - Day 3 progress tracking
   - Deliverable checklist
   - Testing results

3. **Architecture Decision Record** (80 lines)
   - Why integer scores (not decimal)
   - Why auto-calculate grade letters
   - Why denormalize student_name

4. **User Guide** (100 lines)
   - How to mark grades
   - How to view reports
   - Troubleshooting

---

## IMPLEMENTATION TIMELINE

### Phase 1: Planning & Review (8:00 AM - 9:00 AM)

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Present Day 3 plan | 15 min | Lead Architect | ⏳ |
| Q&A on scope | 15 min | Team | ⏳ |
| Lead Architect approval | 15 min | Architect | ⏳ |
| Team prep | 15 min | All | ⏳ |

**Gate:** Lead Architect must approve before Phase 2

### Phase 2: Backend Implementation (9:00 AM - 12:00 PM)

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Grade marking endpoint | 45 min | Backend | ⏳ |
| Get by class endpoint | 45 min | Backend | ⏳ |
| Statistics endpoint | 60 min | Backend | ⏳ |
| Integration test | 30 min | Backend | ⏳ |

**Output:** 280 lines of code + passing integration tests

### Phase 3: Frontend Implementation (12:00 PM - 3:00 PM)

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Grade Management Page | 70 min | Frontend | ⏳ |
| RTK Query hooks | 40 min | Frontend | ⏳ |
| Grade Report Page | 50 min | Frontend | ⏳ |
| UI tweaks | 20 min | Frontend | ⏳ |

**Output:** 700 lines of code + Material-UI components

### Phase 4: QA Testing (3:00 PM - 5:00 PM)

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Backend unit tests | 30 min | QA | ⏳ |
| Frontend E2E | 40 min | QA | ⏳ |
| Manual verification | 30 min | QA | ⏳ |
| Sign-off | 20 min | QA | ⏳ |

**Output:** 8/8 tests passing + QA approval

### Phase 5: Sign-Off & Day 4 Prep (5:00 PM - 6:00 PM)

| Task | Duration | Owner | Status |
|------|----------|-------|--------|
| Day 3 final sign-off | 20 min | Architect | ⏳ |
| Metrics review | 15 min | Lead | ⏳ |
| Day 4 planning | 25 min | Planning | ⏳ |

**Output:** Day 3 complete + Day 4 ready to go

---

## SUCCESS CRITERIA

### Code Delivery ✅ (by 3 PM)

- [ ] 280 lines backend code
- [ ] 700 lines frontend code
- [ ] 150 lines API hooks
- [ ] TypeScript strict mode passing
- [ ] ESLint: 0 violations
- [ ] No console errors

### Testing ✅ (by 5 PM)

- [ ] 8/8 backend tests passing
- [ ] 80%+ code coverage
- [ ] E2E: All grade workflows working
- [ ] Grade calculation verified
- [ ] CSV export working
- [ ] 100% pass rate

### Performance ✅ (by 5 PM)

- [ ] Mark grade: <300ms
- [ ] Get grades: <300ms
- [ ] Calculate stats: <500ms
- [ ] UI load: <1s
- [ ] Save 25 grades: <3s

### Quality ✅ (by 5 PM)

- [ ] All error paths tested
- [ ] Auth enforced
- [ ] Input validation working
- [ ] Duplicate detection working
- [ ] Grade letter calculation correct
- [ ] Statistics accurate

---

## DECISION POINTS (Require Review)

### Decision 1: Score Precision
**Question:** Should scores support decimals (85.5) or integers only (85)?

**Options:**
- A: Integers only (0-100) — simpler, faster
- B: One decimal (0-100.0) — common in schools
- C: Two decimals (0-100.00) — precise but overkill

**Recommendation:** Integer (Option A) for Day 3, can extend in Week 4

**Decision Required:** Lead Architect

### Decision 2: Grade Edit Permissions
**Question:** Can teachers edit grades after submission?

**Options:**
- A: Yes, without restriction — flexible but risky
- B: Yes, but limited (e.g., within 24 hours) — balanced
- C: No, grades locked after first submission — audit-safe

**Recommendation:** Option B (24-hour grace period)

**Decision Required:** Product Team

### Decision 3: Grade Distribution Export
**Question:** Should we export to PDF or just CSV?

**Options:**
- A: CSV only — simpler, Day 3 ready
- B: Both PDF and CSV — more professional
- C: PDF only — better for parents

**Recommendation:** CSV for Day 3, add PDF in Week 4

**Decision Required:** Lead Architect

---

## RISK ASSESSMENT

| Risk | Severity | Probability | Mitigation | Owner |
|------|----------|-------------|-----------|-------|
| Grade calc error | High | Medium | Unit tests + peer review | QA |
| Performance issue | Medium | Low | Composite indexes + monitoring | DevOps |
| Edit conflicts | Medium | Low | Timestamp-based conflict resolution | Backend |
| CSV export bug | Low | Low | Export test case (TC27) | QA |
| UI rendering lag | Medium | Low | Component optimization + React.memo | Frontend |

**Contingency:** If blocking issue found in Phase 2 → extend Phase 3-4 time

---

## DEPENDENCIES

### Prerequisites (Day 2 Must Be Complete)

- [x] Infrastructure deployed ✅
- [x] Auth system working ✅
- [x] Firestore collections initialized ✅
- [x] Cloud Run service live ✅

### Internal Dependencies

- Backend complete → Frontend starts (serial)
- Frontend complete → QA tests (serial)
- QA complete → Sign-off (serial)

---

## CHECKLIST FOR START

Before Day 3 Implementation Begins:

- [ ] Lead Architect approved this plan
- [ ] Team reviewed timeline
- [ ] Environment setup: Node 18+, npm packages installed
- [ ] Development servers ready: Backend, Frontend
- [ ] Database: Firestore instance online
- [ ] API: Cloud Run service healthy
- [ ] All team members present & ready
- [ ] Slack channel: #week3-day3 active
- [ ] Documentation: This plan available to all

---

## HANDOFF FROM DAY 2

**From:** Day 2 Implementation Team  
**To:** Day 3 Planning Team

**Knowledge Transfer:**
1. Backend patterns: Use same error handling + auth middleware
2. Frontend patterns: Use same Redux + RTK Query structure
3. Testing patterns: Jest + Supertest + Material-UI snapshot tests
4. Deployment: Same Terraform + Cloud Run configuration
5. Monitoring: All metrics in Cloud Logging

**Questions to Clarify:**
- [ ] Score decimal support: Decision needed
- [ ] Grade edit permissions: Decision needed
- [ ] PDF export scope: Decision needed

---

## APPROVAL GATES (Required Before Execution)

### Gate 1: Lead Architect Sign-Off

**Reviewer:** Lead Architect  
**Status:** ⏳ PENDING  

**Approval Criteria:**
- [ ] Implementation plan complete
- [ ] Scope realistic for 8 hours
- [ ] Success criteria clear
- [ ] Dependencies met
- [ ] Risk mitigation adequate

**Timeline:** Approval required by 7:00 AM tomorrow

---

## NEXT STEPS

1. **Tonight (6:00 PM):** Upload Day 3 plan to shared drive
2. **Tomorrow 7:00 AM:** Lead Architect review & approve
3. **Tomorrow 8:00 AM:** Day 3 Planning & Review phase begins
4. **Tomorrow 9:00 AM:** Implementation phase starts (if approved)

---

**Plan Version:** 1.0  
**Status:** READY FOR REVIEW  
**Date:** 2024-04-11  
**Target Date:** 2024-04-12 (Execution)

---
