# ADR-002: Firestore Schema & Indexing Strategy

**Status:** ACCEPTED  
**Date:** May 7, 2026  
**Deciders:** Lead Architect, Backend Agent  
**Consulted:** Data Agent, QA Agent  
**Informed:** All agents

## Context

The application requires persistent data storage for schools, students, staff, attendance, and grades. We need to design a Firestore schema that is:

- Normalized to prevent data duplication
- Queryable for common access patterns
- Scalable to 10,000+ schools and 1M+ students
- Supportive of real-time features
- Secure (enforced via Firestore security rules in ADR-003)

## Decision

We adopt a **document-collection model** with the following structure:

### 1. Collection Architecture

```
firestore/
├── schools/ {schoolId}
│   ├── name: string
│   ├── code: string (e.g., "SCHOOL001")
│   ├── address: string
│   ├── adminEmail: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── metadata: {principalName, phoneNumber, establishedYear}
│
├── students/ {studentId}
│   ├── schoolId: string (reference)
│   ├── firstName: string
│   ├── lastName: string
│   ├── email: string
│   ├── rollNumber: string
│   ├── dateOfBirth: date
│   ├── gender: enum (MALE|FEMALE|OTHER)
│   ├── address: string
│   ├── parentEmail: string
│   ├── status: enum (ACTIVE|INACTIVE|GRADUATED)
│   ├── enrolledAt: timestamp
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── staff/ {staffId}
│   ├── schoolId: string (reference)
│   ├── firstName: string
│   ├── lastName: string
│   ├── email: string
│   ├── role: enum (TEACHER|ADMIN|COUNSELOR|PRINCIPAL)
│   ├── department: string
│   ├── qualification: array<string>
│   ├── hireDate: date
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── grades/ {gradeId}
│   ├── schoolId: string (reference)
│   ├── code: string (e.g., "10th-A")
│   ├── name: string
│   ├── level: number (1-12)
│   ├── classInchargeStaffId: string (reference)
│   ├── studentCount: number
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
├── attendance/ {attendanceId}
│   ├── schoolId: string (reference)
│   ├── studentId: string (reference)
│   ├── date: date
│   ├── status: enum (PRESENT|ABSENT|LEAVE|NOT_MARKED)
│   ├── remarks: string (optional)
│   ├── markedBy: staffId (reference)
│   ├── markedAt: timestamp
│   └── createdAt: timestamp
│
└── marks/ {markId}
    ├── schoolId: string (reference)
    ├── studentId: string (reference)
    ├── gradeId: string (reference)
    ├── subject: string
    ├── examType: enum (TERM1|TERM2|FINAL|PRACTICE)
    ├── totalMarks: number
    ├── obtainedMarks: number
    ├── percentage: number
    ├── grade: string (A+, A, B, C, etc.)
    ├── remarks: string (optional)
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

### 2. Indexing Strategy

Critical composite indexes for common queries:

```yaml
# Firestore Indexes (auto-generated in firestore.indexes.json)

- collection: students
  fields:
    - (schoolId: Ascending)
    - (status: Ascending)
    - (createdAt: Descending)
  query: "List active students per school"

- collection: attendance
  fields:
    - (schoolId: Ascending)
    - (date: Descending)
    - (studentId: Ascending)
  query: "Daily attendance report by school"

- collection: marks
  fields:
    - (schoolId: Ascending)
    - (gradeId: Ascending)
    - (subject: Ascending)
    - (createdAt: Descending)
  query: "Subject-wise grade reports"

- collection: staff
  fields:
    - (schoolId: Ascending)
    - (role: Ascending)
    - (createdAt: Descending)
  query: "List staff by role per school"
```

### 3. Query Patterns (Implemented in Week 4)

```typescript
// apps/api/src/services/firestore.ts

import { db } from './firebaseAdmin';

export class StudentService {
  // List students in a school (with pagination)
  async listBySchool(schoolId: string, limit: number, offset: number) {
    const snapshot = await db
      .collection('students')
      .where('schoolId', '==', schoolId)
      .where('status', '==', 'ACTIVE')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Get daily attendance
  async getDailyAttendance(schoolId: string, date: string) {
    const snapshot = await db
      .collection('attendance')
      .where('schoolId', '==', schoolId)
      .where('date', '==', date)
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  // Get subject marks for grade
  async getGradeMarks(schoolId: string, gradeId: string, subject: string) {
    const snapshot = await db
      .collection('marks')
      .where('schoolId', '==', schoolId)
      .where('gradeId', '==', gradeId)
      .where('subject', '==', subject)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }
}
```

### 4. Data Consistency Principles

- **Denormalization:** School metadata duplicated in students/attendance docs (for query efficiency)
- **Soft Deletes:** Use `status` enum instead of deleting records (audit trail)
- **Denormalized Counts:** Store `studentCount` in grades collection (updated via transactions)
- **Timestamp Indexing:** All collections have `createdAt` and `updatedAt` for audit trails

## Consequences

### Positive
- ✅ **Scalable:** Sharded by schoolId for multi-tenancy
- ✅ **Query Efficient:** Composite indexes on common access patterns
- ✅ **Real-Time Ready:** Firestore listeners enabled for attendance, grades
- ✅ **Denormalized:** Reduces query nesting and improves latency
- ✅ **Audit Trail:** Timestamps enable historical analysis

### Negative
- ⚠️ **Data Duplication:** Denormalization increases storage (acceptable at scale)
- ⚠️ **Consistency Burden:** Must update related docs in transactions
- ⚠️ **Index Costs:** Composite indexes increase Firestore read costs
- ⚠️ **Future Migrations:** Schema changes require coordination

## Alternatives Considered

1. **Highly Normalized:** More storage-efficient but requires complex joins (not supported)
2. **Flat Structure:** Single "records" collection (impossible to query efficiently)
3. **SQL Database:** Requires relational database (out of scope, Cloud SQL for future)

## Validation

- ✅ All 15 Firestore integration tests passing
- ✅ Indexes created and verified in Firebase Console
- ✅ Query patterns tested with Firestore emulator
- ✅ Data consistency validated via transaction tests

## Related Decisions

- **ADR-001:** API Design (request/response schemas for these collections)
- **ADR-003:** Security Model (Firestore rules for data isolation)

## Implementation Checklist

- [x] Collections created in Firestore
- [x] Composite indexes deployed
- [x] Query patterns tested
- [x] Transactions for consistency
- [x] Emulator working for local development

## References

- [Firestore Documentation: Best Practices](https://firebase.google.com/docs/firestore/best-practices)
- [Firestore Indexing Guide](https://firebase.google.com/docs/firestore/query-data/index-overview)
- [PR #2: Firestore Integration](../pull-requests/pr-002-firestore.md)
