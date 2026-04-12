# WEEK 4 PR #1 PLAN: Core API Routes

**PR:** #1  
**Owner:** Backend Agent  
**Day:** Monday, May 6, 2026  
**Duration:** 4 hours (9:00 AM - 1:00 PM + afternoon)  
**Status:** DRAFT - Awaiting Lead Architect Review

---

## 📋 FEATURE SUMMARY

Implement 5 core REST endpoints for school management system. These form the foundation API layer that all other modules depend on. All endpoints use TypeScript + Zod validation, Firebase Auth middleware, and structured error responses.

---

## 🎯 DELIVERABLES

| Endpoint | Method | Purpose | Auth | Response Time Target |
|----------|--------|---------|------|----------------------|
| /api/v1/schools | POST | Create new school | Admin | <200ms |
| /api/v1/schools/{id} | GET | Get school details | Authenticated | <200ms |
| /api/v1/students | POST | Add student to school | Admin | <250ms |
| /api/v1/students | GET | List students (paginated) | Teacher/Admin | <300ms |
| /api/v1/attendance | POST | Mark attendance for student | Teacher/Admin | <250ms |

---

## 📦 API ENDPOINT SPECIFICATIONS

### 1. POST /api/v1/schools - Create School

**Request Schema (Zod):**
```typescript
const CreateSchoolSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pinCode: z.string().regex(/^\d{6}$/),
  principalName: z.string().min(2).max(100),
  schoolRegistrationNumber: z.string().min(5).max(20),
});
```

**Response (Success) Schema:**
```typescript
const SchoolResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  principalName: z.string(),
  schoolRegistrationNumber: z.string(),
  createdAt: z.string().datetime(),
  status: z.enum(['active', 'inactive']),
});
```

**Error Cases:**
- ❌ 400 Bad Request: Invalid schema
  ```json
  {
    "error": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": { "field": "email", "issue": "invalid format" }
  }
  ```
- ❌ 401 Unauthorized: No auth token
- ❌ 403 Forbidden: User not Admin role
- ❌ 409 Conflict: Email already registered
- ❌ 500 Internal Server Error

**Success Example (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "St. John's Public School",
    "email": "admin@stjohns.edu.in",
    "phone": "+91-11-4095-5678",
    "address": "123 Education Street",
    "city": "New Delhi",
    "state": "Delhi",
    "pinCode": "110001",
    "principalName": "Dr. Rajesh Singh",
    "schoolRegistrationNumber": "SR-2024-001",
    "createdAt": "2026-05-06T09:30:00Z",
    "status": "active"
  }
}
```

---

### 2. GET /api/v1/schools/{id} - Get School Details

**Query Parameters:** None  
**Path Parameter:** `id` (UUID)

**Response (Success) Schema:**
```typescript
// Same as POST response schema above
```

**Error Cases:**
- ❌ 404 Not Found: School ID doesn't exist
- ❌ 401 Unauthorized: No auth token

**Success Example (200 OK):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "St. John's Public School",
    "email": "admin@stjohns.edu.in",
    ... (all fields)
  }
}
```

---

### 3. POST /api/v1/students - Add Student

**Request Schema (Zod):**
```typescript
const AddStudentSchema = z.object({
  schoolId: z.string().uuid(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  dateOfBirth: z.string().date(), // ISO 8601
  gradeLevel: z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
  rollNumber: z.string().min(1).max(20),
  parentName: z.string().min(2).max(100),
  parentPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  parentEmail: z.string().email(),
  enrollmentDate: z.string().datetime(),
});
```

**Response (Success) Schema:**
```typescript
const StudentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  dateOfBirth: z.string(),
  gradeLevel: z.string(),
  rollNumber: z.string(),
  parentName: z.string(),
  parentEmail: z.string(),
  enrollmentDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  status: z.enum(['active', 'inactive', 'graduated']),
});
```

**Error Cases:**
- ❌ 400 Bad Request: Invalid schema
- ❌ 404 Not Found: School ID doesn't exist
- ❌ 409 Conflict: Email or Roll Number already exists
- ❌ 401 Unauthorized: No auth token
- ❌ 403 Forbidden: User not authorized for this school

**Success Example (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "schoolId": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Arjun",
    "lastName": "Kumar",
    "email": "arjun.kumar@student.edu.in",
    "dateOfBirth": "2010-05-15",
    "gradeLevel": "10",
    "rollNumber": "A-101",
    "parentName": "Rajesh Kumar",
    "parentEmail": "rajesh@email.com",
    "enrollmentDate": "2026-05-06T10:00:00Z",
    "createdAt": "2026-05-06T10:05:00Z",
    "status": "active"
  }
}
```

---

### 4. GET /api/v1/students - List Students (Paginated)

**Query Parameters:**
```typescript
const ListStudentsQuerySchema = z.object({
  schoolId: z.string().uuid(),
  gradeLevel: z.string().optional(), // Filter by grade
  status: z.enum(['active', 'inactive', 'graduated']).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
```

**Response (Success) Schema:**
```typescript
const ListStudentsResponseSchema = z.object({
  data: z.array(StudentResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});
```

**Error Cases:**
- ❌ 400 Bad Request: Invalid schoolId format
- ❌ 404 Not Found: School doesn't exist
- ❌ 401 Unauthorized: No auth token

**Success Example (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "schoolId": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Arjun",
      "lastName": "Kumar",
      ... (fields)
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "schoolId": "550e8400-e29b-41d4-a716-446655440000",
      "firstName": "Priya",
      "lastName": "Singh",
      ... (fields)
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

### 5. POST /api/v1/attendance - Mark Attendance

**Request Schema (Zod):**
```typescript
const MarkAttendanceSchema = z.object({
  schoolId: z.string().uuid(),
  classId: z.string().optional(), // For class-based attendance
  studentId: z.string().uuid(),
  date: z.string().date(), // ISO 8601 (YYYY-MM-DD)
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().max(500).optional(),
  markedBy: z.string().uuid(), // Teacher/Admin user ID
});
```

**Response (Success) Schema:**
```typescript
const AttendanceResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.string().date(),
  status: z.enum(['present', 'absent', 'late', 'excused']),
  notes: z.string().optional(),
  markedBy: z.string().uuid(),
  markedAt: z.string().datetime(),
});
```

**Error Cases:**
- ❌ 400 Bad Request: Invalid date format or status
- ❌ 404 Not Found: Student or school not found
- ❌ 409 Conflict: Attendance already marked for this date
- ❌ 401 Unauthorized: No auth token
- ❌ 403 Forbidden: User not authorized to mark attendance

**Success Example (201 Created):**
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "schoolId": "550e8400-e29b-41d4-a716-446655440000",
    "studentId": "550e8400-e29b-41d4-a716-446655440001",
    "date": "2026-05-06",
    "status": "present",
    "notes": "Regular attendance",
    "markedBy": "550e8400-e29b-41d4-a716-446655440100",
    "markedAt": "2026-05-06T11:30:00Z"
  }
}
```

---

## 🗂️ FILES TO CHANGE

### Create New Files:
- [ ] `apps/api/src/routes/schools.ts` - School endpoints
- [ ] `apps/api/src/routes/students.ts` - Student endpoints
- [ ] `apps/api/src/routes/attendance.ts` - Attendance endpoints

### Modify Files:
- [ ] `apps/api/src/index.ts` - Import and register routes
- [ ] `apps/api/src/types.ts` - Add TypeScript interfaces (if not using Zod directly)

### Test Files:
- [ ] `apps/api/tests/schools.test.ts` - School endpoint tests
- [ ] `apps/api/tests/students.test.ts` - Student endpoint tests
- [ ] `apps/api/tests/attendance.test.ts` - Attendance endpoint tests

---

## ✅ TEST CASES (15+ total)

### Schools Endpoint Tests (5 tests)
- [ ] **TC1:** POST /schools with valid data → 201 Created + response data
- [ ] **TC2:** POST /schools with missing required field → 400 Bad Request
- [ ] **TC3:** POST /schools with duplicate email → 409 Conflict
- [ ] **TC4:** GET /schools/{id} with valid ID → 200 OK + school data
- [ ] **TC5:** GET /schools/{id} with invalid ID → 404 Not Found

### Students Endpoint Tests (5 tests)
- [ ] **TC6:** POST /students with valid school + data → 201 Created + student data
- [ ] **TC7:** POST /students with duplicate email → 409 Conflict
- [ ] **TC8:** POST /students with non-existent schoolId → 404 Not Found
- [ ] **TC9:** GET /students with schoolId + limit → 200 OK + paginated list
- [ ] **TC10:** GET /students with gradeLevel filter → 200 OK + filtered list

### Attendance Endpoint Tests (5 tests)
- [ ] **TC11:** POST /attendance with valid data → 201 Created + attendance record
- [ ] **TC12:** POST /attendance with duplicate date+student → 409 Conflict
- [ ] **TC13:** POST /attendance with invalid date format → 400 Bad Request
- [ ] **TC14:** POST /attendance with non-existent studentId → 404 Not Found
- [ ] **TC15:** Attendance with different status values → 201 Created (verify status persisted)

---

## 🔒 Authentication & Authorization

All endpoints require:
- **Auth Header:** `Authorization: Bearer {firebase_id_token}`
- **Middleware:** Firebase Auth middleware validates token and attaches `req.user` with role

Security Rules:
- ✅ **Admin** role: Can create schools, add students, mark attendance for any school
- ✅ **Teacher** role: Can only mark attendance for their assigned school
- ✅ **Student** role: Can only view their own details

---

## 📏 Code Quality Standards

- **Language:** TypeScript strict mode
- **Validation:** Zod schema validation on every endpoint
- **Error Handling:** Structured error responses with error codes
- **Logging:** Request/response logging for debugging
- **Testing:** Jest + Supertest, 85%+ coverage target
- **Linting:** ESLint + TypeScript strict

**Code Structure:**
```
apps/api/src/
├── routes/
│   ├── schools.ts     (60 LOC)
│   ├── students.ts    (80 LOC)
│   └── attendance.ts  (70 LOC)
├── middleware/
│   ├── auth.ts        (validate Firebase tokens)
│   └── errors.ts      (format error responses)
└── tests/
    ├── schools.test.ts     (100 LOC)
    ├── students.test.ts    (100 LOC)
    └── attendance.test.ts  (100 LOC)
```

---

## ⏱️ IMPLEMENTATION TIMELINE

| Task | Time | Owner |
|------|------|-------|
| **PLAN Review** | 15 min | Lead Architect |
| **Route Implementation** | 2 hours | Backend |
| **Test Writing** | 1 hour | Backend |
| **Code Review** | 15 min | Lead Architect |
| **Merge to Main** | 5 min | Backend |
| **Total** | **3.75 hours** | - |

---

## 🎯 SUCCESS CRITERIA

- ✅ All 5 endpoints functioning correctly
- ✅ 15+ tests passing 100%
- ✅ 85%+ code coverage for this PR
- ✅ No linting errors
- ✅ Running on staging environment <200ms average response time
- ✅ All error cases handled gracefully
- ✅ Lead Architect approval on code review

---

## 🚨 POTENTIAL BLOCKERS & SOLUTIONS

| Blocker | Solution |
|---------|----------|
| Firebase Auth token validation failing | Debug: Check GOOGLE_APPLICATION_CREDENTIALS path, test token with `firebase auth:import` |
| Zod validation too strict | Adjust schema constraints, document why |
| Response time exceeding target | Check if routes are doing unnecessary DB calls, optimize queries |
| Test setup not working | Ensure Jest + Supertest installed, Firebase emulator running |

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Firestore Integration:** These routes use stub services initially. PR #2 will implement actual Firestore calls.
2. **Error Responses:** Use consistent error format for all endpoints (error code + message).
3. **Timestamps:** Use UTC ISO 8601 format for all datetime fields.
4. **Pagination:** For list endpoints, implement offset-based pagination (not cursor-based).
5. **Validation:** Always validate at route level with Zod BEFORE passing to service layer.

---

**Status:** ⏳ AWAITING LEAD ARCHITECT REVIEW  
**Next Steps:** Lead Architect to review and approve. Then begin IMPLEMENT phase.

---

*Created: 2026-04-09*  
*PR Target:** PR #1, Monday May 6, 2026
