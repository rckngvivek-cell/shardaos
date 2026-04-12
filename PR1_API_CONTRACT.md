# PR #1 - API Contract Reference

**Version:** 0.1.0  
**Date:** April 9, 2026  
**Status:** Ready for Integration

---

## 📡 API Endpoints Summary

| # | Endpoint | Method | Auth | Status Codes |
|---|----------|--------|------|--------------|
| 1 | `/api/v1/schools` | POST | Admin | 201, 400, 401, 403, 409 |
| 2 | `/api/v1/schools/{id}` | GET | User | 200, 401, 404 |
| 3 | `/api/v1/students` | POST | Admin | 201, 400, 401, 403, 404, 409 |
| 4 | `/api/v1/students` | GET | Teacher/Admin | 200, 400, 401, 404 |
| 5 | `/api/v1/attendance` | POST | Teacher/Admin | 201, 400, 401, 403, 404, 409 |

---

## 1️⃣ POST /api/v1/schools - Create School

### Request
```typescript
{
  name: string              // 3-100 chars
  email: string             // valid email
  phone: string             // E.164 +91-XXXXXXXXXX
  address: string           // 5-500 chars
  city: string              // 2-50 chars
  state: string             // 2-50 chars
  pinCode: string           // exactly 6 digits
  principalName: string     // 2-100 chars
  schoolRegistrationNumber: string // 5-20 chars
}
```

### Response (201 Created)
```typescript
{
  success: true,
  data: {
    id: string              // UUID v4
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pinCode: string
    principalName: string
    schoolRegistrationNumber: string
    createdAt: string       // ISO 8601 datetime
    status: 'active' | 'inactive'
  },
  meta: {
    timestamp: string
    version: string
  }
}
```

### Error Responses
- **400 Bad Request** - Schema validation failed
- **401 Unauthorized** - Missing/invalid auth token
- **403 Forbidden** - Non-admin user
- **409 Conflict** - Email already exists

### Example
```bash
POST /api/v1/schools
Authorization: Bearer admin_token
Content-Type: application/json

{
  "name": "Green Valley School",
  "email": "admin@greenvalley.edu.in",
  "phone": "+91-11-4095-5678",
  "address": "123 Knowledge Road",
  "city": "New Delhi",
  "state": "Delhi",
  "pinCode": "110001",
  "principalName": "Dr. Rajesh Singh",
  "schoolRegistrationNumber": "SR-2024-001"
}
```

---

## 2️⃣ GET /api/v1/schools/{id} - Get School Details

### Parameters
- `id` (path): School UUID

### Response (200 OK)
```typescript
{
  success: true,
  data: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    city: string
    state: string
    pinCode: string
    principalName: string
    schoolRegistrationNumber: string
    createdAt: string
    status: 'active' | 'inactive'
  },
  meta: {
    timestamp: string
    version: string
  }
}
```

### Error Responses
- **401 Unauthorized** - Missing/invalid auth token
- **404 Not Found** - School doesn't exist

### Example
```bash
GET /api/v1/schools/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer user_token
```

---

## 3️⃣ POST /api/v1/students - Add Student

### Request
```typescript
{
  schoolId: string              // UUID of school
  firstName: string             // 2-50 chars
  lastName: string              // 2-50 chars
  email: string                 // valid email, unique per school
  phone: string                 // E.164 format
  dateOfBirth: string           // YYYY-MM-DD
  gradeLevel: string            // '1' to '12'
  rollNumber: string            // 1-20 chars, unique per grade
  parentName: string            // 2-100 chars
  parentPhone: string           // E.164 format
  parentEmail: string           // valid email
  enrollmentDate: string        // ISO 8601 datetime
}
```

### Response (201 Created)
```typescript
{
  success: true,
  data: {
    id: string                  // UUID v4
    schoolId: string
    firstName: string
    lastName: string
    email: string
    dateOfBirth: string
    gradeLevel: string
    rollNumber: string
    parentName: string
    parentEmail: string
    enrollmentDate: string
    createdAt: string           // ISO 8601 datetime
    status: 'active' | 'inactive' | 'graduated'
  },
  meta: {
    timestamp: string
    version: string
  }
}
```

### Error Responses
- **400 Bad Request** - Schema validation failed
- **401 Unauthorized** - Missing/invalid auth token
- **403 Forbidden** - Non-admin user
- **404 Not Found** - School doesn't exist
- **409 Conflict** - Email or roll number already exists

### Example
```bash
POST /api/v1/students
Authorization: Bearer admin_token
Content-Type: application/json

{
  "schoolId": "550e8400-e29b-41d4-a716-446655440000",
  "firstName": "Arjun",
  "lastName": "Kumar",
  "email": "arjun@student.edu.in",
  "phone": "+91-9876543210",
  "dateOfBirth": "2010-05-15",
  "gradeLevel": "10",
  "rollNumber": "A-101",
  "parentName": "Rajesh Kumar",
  "parentPhone": "+91-9876543211",
  "parentEmail": "rajesh@email.com",
  "enrollmentDate": "2026-05-06T10:00:00Z"
}
```

---

## 4️⃣ GET /api/v1/students - List Students

### Query Parameters
```typescript
{
  schoolId: string           // UUID (required)
  gradeLevel?: string        // optional, '1'-'12'
  status?: string            // optional, 'active'|'inactive'|'graduated'
  limit?: number             // 1-100, default 20
  offset?: number            // 0+, default 0
}
```

### Response (200 OK)
```typescript
{
  success: true,
  data: [
    {
      id: string
      schoolId: string
      firstName: string
      lastName: string
      email: string
      dateOfBirth: string
      gradeLevel: string
      rollNumber: string
      parentName: string
      parentEmail: string
      enrollmentDate: string
      createdAt: string
      status: 'active' | 'inactive' | 'graduated'
    }
    // ... more students
  ],
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  },
  meta: {
    timestamp: string
    version: string
  }
}
```

### Error Responses
- **400 Bad Request** - Invalid schoolId format
- **401 Unauthorized** - Missing/invalid auth token
- **404 Not Found** - School doesn't exist

### Examples
```bash
# List all students
GET /api/v1/students?schoolId=550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer teacher_token

# Filter by grade
GET /api/v1/students?schoolId=550e8400-e29b-41d4-a716-446655440000&gradeLevel=10
Authorization: Bearer teacher_token

# Pagination
GET /api/v1/students?schoolId=550e8400-e29b-41d4-a716-446655440000&limit=50&offset=100
Authorization: Bearer teacher_token
```

---

## 5️⃣ POST /api/v1/attendance - Mark Attendance

### Request
```typescript
{
  schoolId: string              // UUID
  classId?: string              // optional, for class-based attendance
  studentId: string             // UUID
  date: string                  // YYYY-MM-DD
  status: string                // 'present'|'absent'|'late'|'excused'
  notes?: string                // optional, 0-500 chars
  markedBy: string              // UUID of teacher/admin
}
```

### Response (201 Created)
```typescript
{
  success: true,
  data: {
    id: string                  // UUID v4
    schoolId: string
    studentId: string
    date: string                // YYYY-MM-DD
    status: 'present' | 'absent' | 'late' | 'excused'
    notes?: string
    markedBy: string
    markedAt: string            // ISO 8601 datetime
  },
  meta: {
    timestamp: string
    version: string
  }
}
```

### Error Responses
- **400 Bad Request** - Schema validation failed (invalid date, status, etc)
- **401 Unauthorized** - Missing/invalid auth token
- **403 Forbidden** - Student user or insufficient permissions
- **404 Not Found** - School or student doesn't exist
- **409 Conflict** - Attendance already marked for this date

### Examples
```bash
# Mark present
POST /api/v1/attendance
Authorization: Bearer teacher_token
Content-Type: application/json

{
  "schoolId": "550e8400-e29b-41d4-a716-446655440000",
  "studentId": "student-uuid",
  "date": "2026-05-06",
  "status": "present",
  "notes": "Regular attendance",
  "markedBy": "teacher-uuid"
}

# Mark absent with reason
POST /api/v1/attendance
Authorization: Bearer teacher_token

{
  "schoolId": "550e8400-e29b-41d4-a716-446655440000",
  "studentId": "student-uuid",
  "date": "2026-05-07",
  "status": "absent",
  "notes": "Sick leave",
  "markedBy": "teacher-uuid"
}
```

---

## 🔐 Authentication

### Auth Header Format
```
Authorization: Bearer {id_token}
```

### Token Payload (JWT)
```typescript
{
  uid: string                 // Firebase user ID
  role: 'admin' | 'teacher' | 'student'
  email: string
}
```

### Role Permissions
| Role | Create School | Add Student | Mark Attendance | View Students |
|------|---|---|---|---|
| Admin | ✅ | ✅ | ✅ | ✅ |
| Teacher | ❌ | ❌ | ✅ | ✅ |
| Student | ❌ | ❌ | ❌ | ✅ (own only) |

---

## 📊 Response Format

### Success Response
```typescript
{
  success: true,
  data: any,              // Endpoint-specific data
  meta: {
    timestamp: string,    // ISO 8601
    version: string,      // e.g., "0.1.0"
    requestId?: string    // On error responses
  }
}
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: string,         // e.g., "VALIDATION_ERROR"
    message: string,      // Human readable message
    status: number,       // HTTP status code
    details?: object      // Validation details
  },
  meta: {
    timestamp: string,
    requestId?: string
  }
}
```

---

## 🔍 Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| VALIDATION_ERROR | 400 | Input validation failed |
| UNAUTHORIZED | 401 | Missing or invalid auth token |
| FORBIDDEN | 403 | Insufficient permissions |
| SCHOOL_NOT_FOUND | 404 | School doesn't exist |
| STUDENT_NOT_FOUND | 404 | Student doesn't exist |
| CONFLICT | 409 | Duplicate resource (email, roll number, etc) |

---

## 💡 Integration Notes

1. **All timestamps** are ISO 8601 format in UTC
2. **All IDs** are UUID v4 format
3. **All phone numbers** use E.164 format (+CC-XXXXXXXXXX)
4. **All emails** are validated with RFC 5322
5. **Pagination** uses offset-based pagination (not cursor-based)
6. **Rate Limiting** not implemented in PR #1 (add in PR #2)
7. **CORS** configured at web app level (update in PR #4)

---

## 🧪 Test Tokens

For testing without Firebase Auth:

```bash
# Admin token
Authorization: Bearer admin

# Teacher token
Authorization: Bearer teacher

# Student token
Authorization: Bearer student
```

*(In production, use real Firebase ID tokens)*

---

**Last Updated:** 2026-04-09  
**Maintained By:** Backend Agent  
**Next Review:** PR #2 Release
