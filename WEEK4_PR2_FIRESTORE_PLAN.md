# WEEK 4 PR #2 PLAN: Firestore Integration

**PR:** #2  
**Owner:** Backend Agent  
**Day:** Tuesday, May 7, 2026  
**Duration:** 3 hours (9:00 AM - 12:00 PM)  
**Status:** DRAFT - Awaiting Lead Architect Review

---

## 📋 FEATURE SUMMARY

Connect all 5 API endpoints from PR #1 to Google Firestore database. Implement CRUD operations, manage collections, set up indexing, and optimize for production performance. All queries will use Firebase Admin SDK with TypeScript strong typing.

---

## 🎯 DELIVERABLES

| Component | Target | Priority |
|-----------|--------|----------|
| Firestore Collections | 5 collections created | Critical |
| CRUD Operations | Create, Read, Update for all | Critical |
| Query Optimization | Indexes configured | High |
| Data Validation | Firestore rules ready | High |
| Performance | P95 latency <500ms | High |

---

## 📦 FIRESTORE DATA STRUCTURE

### Collection: `schools`

```firestore
schools/
├── {schoolId} (document)
│   ├── name: string
│   ├── email: string
│   ├── phone: string
│   ├── address: string
│   ├── city: string
│   ├── state: string
│   ├── pinCode: string
│   ├── principalName: string
│   ├── schoolRegistrationNumber: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── status: string (active|inactive)
```

**Indexes:**
- [ ] Single field index on: `email` (unique simulation via app logic)
- [ ] Single field index on: `city`
- [ ] Single field index on: `state`
- [ ] Single field index on: `createdAt` (descending)

---

### Collection: `students`

```firestore
students/
├── {studentId} (document)
│   ├── schoolId: string (reference)
│   ├── firstName: string
│   ├── lastName: string
│   ├── email: string
│   ├── dateOfBirth: timestamp
│   ├── gradeLevel: string
│   ├── rollNumber: string
│   ├── parentName: string
│   ├── parentEmail: string
│   ├── enrollmentDate: timestamp
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   ├── status: string (active|inactive|graduated)
│   └── lastUpdatedBy: string (teacher/admin userId)
```

**Indexes:**
- [ ] Composite index: `schoolId` + `gradeLevel` + `status`
- [ ] Composite index: `schoolId` + `enrollmentDate` (descending)
- [ ] Single field index on: `email`
- [ ] Single field index on: `schoolId`

---

### Collection: `attendance`

```firestore
attendance/
├── {attendanceId} (document)
│   ├── schoolId: string (reference)
│   ├── studentId: string (reference)
│   ├── date: timestamp (beginning of day in UTC)
│   ├── status: string (present|absent|late|excused)
│   ├── notes: string
│   ├── markedBy: string (teacher/admin userId)
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

**Indexes:**
- [ ] Composite index: `schoolId` + `date` (descending)
- [ ] Composite index: `studentId` + `date` (descending)
- [ ] Single field index on: `schoolId`

---

### Collection: `grades`

```firestore
grades/
├── {gradeId} (document)
│   ├── schoolId: string (reference)
│   ├── studentId: string (reference)
│   ├── subject: string
│   ├── marks: number
│   ├── maxMarks: number
│   ├── percentage: number
│   ├── letterGrade: string (A+, A, B, etc.)
│   ├── term: string
│   ├── examinationName: string
│   ├── markedBy: string (teacher userId)
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
```

**Indexes:**
- [ ] Composite index: `schoolId` + `studentId` + `term`

---

### Collection: `users` (for auth)

```firestore
users/
├── {userId} (document - created during registration)
│   ├── email: string
│   ├── displayName: string
│   ├── role: string (admin|teacher|student|parent)
│   ├── schoolId: string (reference - which school they belong to)
│   ├── permissions: array<string> (Fine-grained perms)
│   ├── createdAt: timestamp
│   ├── lastLogin: timestamp
│   └── status: string (active|inactive|suspended)
```

**Indexes:**
- [ ] Single field index on: `email`
- [ ] Single field index on: `schoolId`
- [ ] Composite index: `schoolId` + `role` + `status`

---

## 🗂️ FILES TO CHANGE

### Create New Files:
- [ ] `apps/api/src/services/firestore.ts` (150 LOC)
  - Contains all Firestore operations
  - Export `db` Firestore instance
  - Export CRUD service functions

- [ ] `apps/api/src/types/models.ts` (100 LOC)
  - TypeScript interfaces for all Firestore documents
  - Ensure type safety for all DB operations

### Modify Files:
- [ ] `apps/api/src/routes/schools.ts` (from PR #1)
  - Replace stub implementations with Firestore calls
  - Add error handling for DB operations
  
- [ ] `apps/api/src/routes/students.ts` (from PR #1)
  - Implement actual Firestore CRUD
  - Add duplicate check before insert
  
- [ ] `apps/api/src/routes/attendance.ts` (from PR #1)
  - Connect to attendance collection
  - Add duplicate prevention logic

### Test Files:
- [ ] `apps/api/tests/firestore-schools.test.ts` (80 LOC)
- [ ] `apps/api/tests/firestore-students.test.ts` (80 LOC)
- [ ] `apps/api/tests/firestore-attendance.test.ts` (50 LOC)

---

## 💾 FIRESTORE SERVICE API

```typescript
// apps/api/src/services/firestore.ts

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export const db = getFirestore();

// Schools CRUD
export async function createSchool(schoolData: SchoolDocument): Promise<string> {
  // Add to collection with validation
  // Return schoolId
}

export async function getSchool(schoolId: string): Promise<SchoolDocument> {
  // Fetch from Firestore
  // Throw 404 if not found
}

export async function updateSchool(schoolId: string, updates: Partial<SchoolDocument>): Promise<void> {
  // Update specific fields
  // Add updatedAt timestamp
}

// Students CRUD
export async function addStudent(studentData: StudentDocument): Promise<string> {
  // Check for duplicates (email, rollNumber)
  // Add to collection
  // Return studentId
}

export async function getStudents(
  filters: { schoolId: string; gradeLevel?: string; status?: string },
  pagination: { limit: number; offset: number }
): Promise<{ students: StudentDocument[]; total: number }> {
  // Query with filters
  // Return paginated results
}

export async function getStudent(studentId: string): Promise<StudentDocument> {
  // Fetch single student
}

// Attendance CRUD
export async function markAttendance(attendanceData: AttendanceDocument): Promise<string> {
  // Check for duplicate (schoolId + studentId + date)
  // Add new record
  // Return attendanceId
}

export async function getAttendanceRecord(
  schoolId: string,
  studentId: string,
  date: string
): Promise<AttendanceDocument | null> {
  // Query for existing attendance
  // Return null if not found
}

export async function getAttendanceHistory(
  studentId: string,
  startDate: string,
  endDate: string
): Promise<AttendanceDocument[]> {
  // Query between date range
  // Return sorted by date descending
}
```

---

## ✅ TEST CASES (15+ total)

### Schools Collection Tests (4 tests)
- [ ] **TC1:** Create school → Document added to Firestore with correct ID
- [ ] **TC2:** Get school → Document retrieved with all fields
- [ ] **TC3:** Create duplicate email → Silently fails or updates (define behavior)
- [ ] **TC4:** Query schools by city → Returns correct results

### Students Collection Tests (5 tests)
- [ ] **TC5:** Add student → Document created with auto-generated ID
- [ ] **TC6:** Add student with duplicate email → Rejected/replaced (define behavior)
- [ ] **TC7:** Add student with non-existent schoolId → Still added to collection
- [ ] **TC8:** Query students by schoolId + gradeLevel → Returns filtered results
- [ ] **TC9:** Pagination: Get 20 students limit → Returns correct subset

### Attendance Collection Tests (4 tests)
- [ ] **TC10:** Mark attendance → Document created with correct timestamp
- [ ] **TC11:** Mark attendance twice same day → Second call fails/updates (define)
- [ ] **TC12:** Query attendance by date range → Returns in order
- [ ] **TC13:** Query attendance by student → Returns all records for student

### Integration Tests (2 tests)
- [ ] **TC14:** Full flow: Create school → Add student → Mark attendance → All linked
- [ ] **TC15:** Performance: Query 1000 records → Returns in <300ms

---

## 🔍 FIRESTORE EMULATOR SETUP

For local testing during implementation:

```bash
# Install emulator
firebase emulators:install firestore

# Start emulator (in separate terminal)
firebase emulators:start

# In tests, connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
```

---

## 🚀 PERFORMANCE OPTIMIZATION

**Query Patterns to Optimize:**

1. **Get students by school:**
   ```typescript
   db.collection('students')
     .where('schoolId', '==', schoolId)
     .orderBy('gradeLevel')
     .limit(20)
   ```
   - Index: `schoolId` + `gradeLevel` + `createdAt`

2. **Get today's attendance:**
   ```typescript
   db.collection('attendance')
     .where('schoolId', '==', schoolId)
     .where('date', '==', todayDate)
   ```
   - Index: `schoolId` + `date` descending

3. **Get student's attendance history:**
   ```typescript
   db.collection('attendance')
     .where('studentId', '==', studentId)
     .orderBy('date', 'desc')
   ```
   - Index: `studentId` + `date` descending

**Target Metrics:**
- Single document fetch (get): <50ms
- Collection query (list): <200ms
- Complex query (filter + order): <300ms

---

## 🗂️ CODE STRUCTURE

```
apps/api/src/
├── services/
│   └── firestore.ts (150 LOC)
│       ├── initializeAdmin()
│       ├── createSchool()
│       ├── getSchool()
│       ├── addStudent()
│       ├── getStudents()
│       ├── markAttendance()
│       └── ... (all CRUD methods)
│
├── types/
│   └── models.ts (100 LOC)
│       ├── SchoolDocument
│       ├── StudentDocument
│       ├── AttendanceDocument
│       ├── GradeDocument
│       └── UserDocument
│
└── tests/
    ├── firestore-schools.test.ts (80 LOC)
    ├── firestore-students.test.ts (80 LOC)
    ├── firestore-attendance.test.ts (50 LOC)
    └── integration.test.ts (40 LOC)

Total: 580 LOC for PR #2
```

---

## ⏱️ IMPLEMENTATION TIMELINE

| Task | Time | Owner |
|------|------|-------|
| **PLAN Review** | 15 min | Lead Architect |
| **Firestore Service** | 1.5 hours | Backend |
| **Route Updates** | 45 min | Backend |
| **Test Writing** | 45 min | Backend |
| **Code Review** | 15 min | Lead Architect |
| **Merge** | 5 min | Backend |
| **Total** | **3.75 hours** | - |

---

## 🎯 SUCCESS CRITERIA

- ✅ All 5 collections created in Firestore
- ✅ All CRUD operations working correctly
- ✅ 15+ tests passing 100%
- ✅ Firestore indexes configured
- ✅ Query performance <300ms p95
- ✅ No N+1 queries
- ✅ Error handling for network failures
- ✅ Data consistency maintained

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Authentication:** Use Firebase Admin SDK initialized with service account key in `GOOGLE_APPLICATION_CREDENTIALS`.
2. **Timestamps:** Use `admin.firestore.FieldValue.serverTimestamp()` for all date fields.
3. **Error Handling:** Firestore errors (network, permission) should be caught and returned as structured API errors.
4. **Transactions:** For operations affecting multiple documents, use Firestore transactions to ensure consistency.
5. **Duplicate Prevention:** For email uniqueness, query before insert (since Firestore doesn't support unique constraints).

---

**Status:** ⏳ AWAITING LEAD ARCHITECT REVIEW  
**Next Steps:** Lead Architect to review. Then begin IMPLEMENT phase.

*Created: 2026-04-09*  
*PR Target:** PR #2, Tuesday May 7, 2026
