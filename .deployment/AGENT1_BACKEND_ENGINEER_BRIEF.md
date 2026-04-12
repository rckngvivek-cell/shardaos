# AGENT 1: BACKEND ENGINEER  
## Week 7 Day 2 Briefing

**Your Role:** Implement Phase 2 endpoints with real Firestore logic  
**Code Time:** 90% = ~7 hours coding  
**Target:** 4 endpoints fully implemented by 3 PM  

---

## TODAY'S MISSION

```
Implement 4 core exam endpoints (REAL logic, not stubs)
- Create exam, List exams, Submit answers, View results
Connect to Firestore (real database calls)
Write 12 new unit tests
Phase 2 progress: 30-40% complete (4/12 endpoints)
```

---

## 🎯 THE 4 ENDPOINTS (Exact Spec)

### ENDPOINT 1: POST /api/v1/exams
**Purpose:** Create new exam  
**Input:**
```json
{
  "title": "Math Quiz Week 5",
  "description": "...",
  "classId": "CLASS-001",
  "subjectId": "MATH",
  "totalMarks": 100,
  "durationMinutes": 60,
  "questions": [
    {
      "id": "Q1",
      "text": "What is 2+2?",
      "type": "MULTIPLE_CHOICE",
      "options": ["3", "4", "5"],
      "correctAnswer": "1",
      "marks": 10
    }
    // ... more questions
  ],
  "startTime": "2026-04-22T10:00:00Z",
  "endTime": "2026-04-22T11:00:00Z"
}
```

**Output:**
```json
{
  "examId": "EXAM-UUID-12345",
  "status": "CREATED",
  "createdAt": "2026-04-22T09:30:15Z"
}
```

**Validation:**
- [ ] Title required (1-200 chars)
- [ ] At least 1 question required
- [ ] Total marks = sum of all question marks
- [ ] Start time < end time
- [ ] Class exists in Firestore (db.collection("classes").doc(classId))

**Error Responses:**
```
400 Bad Request: "Invalid exam title"
400 Bad Request: "Questions array empty"
400 Bad Request: "Start time must be before end time"
404 Not Found: "Class CLASS-001 not found"
500 Internal Server Error: "Firestore write failed"
```

**Firestore Write:**
```
db.collection("exams").doc(examId).set({
  title, description, classId, subjectId,
  totalMarks, durationMinutes, questions,
  startTime, endTime,
  createdBy: userId,
  createdAt: Timestamp.now(),
  status: "ACTIVE"
})
```

**Test Cases:**
1. ✅ Successfully create exam (happy path)
2. ❌ Missing title → 400
3. ❌ Empty questions → 400
4. ❌ Invalid class ID → 404
5. ❌ Firestore error → 500

---

### ENDPOINT 2: GET /api/v1/exams
**Purpose:** List all exams for authenticated user's classes  
**Query Params:**
```
?classId=CLASS-001&subjectId=MATH&status=ACTIVE
```

**Output:**
```json
{
  "exams": [
    {
      "examId": "EXAM-123",
      "title": "Math Quiz",
      "classId": "CLASS-001",
      "totalMarks": 100,
      "activeStudents": 45,
      "status": "ACTIVE"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

**Pagination:**
- [ ] Support limit (default 20, max 100)
- [ ] Support offset/page
- [ ] Return total count

**Firestore Query:**
```
db.collection("exams")
  .where("classId", "==", classId)
  .where("status", "==", "ACTIVE")
  .orderBy("startTime", "desc")
  .limit(20)
  .get()
```

**Test Cases:**
1. ✅ List exams for class (happy path)
2. ✅ Pagination works (page 2 shows correct exams)
3. ✅ Filter by status
4. ✅ Empty list returns [] with total: 0

---

### ENDPOINT 3: POST /api/v1/exams/:examId/submissions
**Purpose:** Submit exam answers (student takes exam)  
**Input:**
```json
{
  "studentId": "STU-001",
  "answers": [
    {
      "questionId": "Q1",
      "selectedOption": "1",
      "submittedAt": "2026-04-22T10:45:30Z"
    }
  ],
  "submittedAt": "2026-04-22T10:55:00Z"
}
```

**Output:**
```json
{
  "submissionId": "SUBMISSION-UUID",
  "status": "SUBMITTED",
  "examId": "EXAM-123",
  "scoredAt": "2026-04-22T10:55:05Z",
  "preliminaryScore": 85
}
```

**Business Logic:**
- [ ] Check student hasn't already submitted (unique submission per student)
- [ ] Check exam hasn't ended (now <= endTime)
- [ ] Check student is enrolled in class (authorization)
- [ ] Auto-grade multiple choice (compare selectedOption to correctAnswer)
- [ ] Record submission time
- [ ] Start background job for essay grading (flag for manual review)

**Firestore Transaction (ATOMIC):**
```
BEGIN TRANSACTION
  1. Check: submissions.where(studentId, examId).count() == 0 [NOT already submitted]
  2. Check: exam.endTime >= now() [EXAM NOT ENDED]
  3. Validate: student enrolled in exam.classId
  4. WRITE: submissions/{submissionId} = {studentId, examId, answers, submittedAt, rawScore: X}
  5. UPDATE: exams/{examId}/stats = {lastSubmission: now(), submissionCount: ++}
  6. PUBLISH: Pub/Sub topic "exam-submissions" with submission event
COMMIT
```

**Error Responses:**
```
400 Bad Request: "Student already submitted this exam"
400 Bad Request: "Exam has ended, cannot submit"
401 Unauthorized: "Student not enrolled in this class"
404 Not Found: "Exam not found"
500 Internal Server Error: "Transaction failed"
```

**Test Cases:**
1. ✅ Successfully submit exam (happy path)
2. ❌ Student submits twice → 400 (unique)
3. ❌ Submit after exam ended → 400
4. ❌ Student not enrolled → 401
5. ✅ Score calculated correctly (if 2/3 correct, score = 66.67)

---

### ENDPOINT 4: GET /api/v1/exams/:examId/results
**Purpose:** Get exam results (for student viewing own results or teacher viewing class)  
**Query Params:**
```
?studentId=STU-001 [optional - if not provided, show YOUR results]
```

**Output:**
```json
{
  "exam": {
    "examId": "EXAM-123",
    "title": "Math Quiz",
    "totalMarks": 100
  },
  "results": [
    {
      "studentId": "STU-001",
      "studentName": "Rahul Kumar",
      "submittedAt": "2026-04-22T10:55:00Z",
      "score": 85,
      "percentage": 85,
      "status": "GRADED",
      "answers": [
        {
          "questionId": "Q1",
          "studentAnswer": "Option B",
          "correctAnswer": "Option B",
          "marks": 10,
          "isCorrect": true
        }
      ]
    }
  ],
  "classStats": {
    "totalStudents": 50,
    "studentsSubmitted": 45,
    "averageScore": 72.5,
    "highestScore": 98,
    "lowestScore": 34
  }
}
```

**Authorization:**
- [ ] Student can only see their own results
- [ ] Teacher can see results for all students in their class
- [ ] Admin can see all results

**Firestore Read:**
```
IF studentId provided:
  Read: submissions/{submissionId} where studentId = X
ELSE:
  Read: MY results (authenticated user)
  
Read: exams/{examId} for metadata
Read: exams/{examId}/stats for class statistics
```

**Test Cases:**
1. ✅ Student views own results
2. ✅ Teacher views all class results + stats
3. ❌ Student tries to view another student's results → 401
4. ✅ Results include calculated percentages + stats

---

## 📦 IMPLEMENTATION STRUCTURE

```
src/
├── api/
│   ├── exams.ts (4 new endpoints)
│   └── middleware/
│       ├── firestore-client.ts (Firestore initialization)
│       ├── auth.ts (verify JWT + extract userId)
│       └── error-handler.ts (standardize error responses)
├── services/
│   ├── exam-service.ts (business logic)
│   ├── grading-service.ts (score calculation)
│   └── firestore-service.ts (Firestore CRUD)
├── models/
│   ├── exam.ts (Exam TypeScript interface)
│   ├── submission.ts (Submission interface)
│   └── db-schema.ts (Firestore schema definitions)
└── tests/
    ├── exams.test.ts (12 new tests)
    └── firestore-service.test.ts (Firestore mocking tests)
```

---

## 🔧 TECHNICAL SETUP

### Firestore Client Setup (if not done)
```typescript
// src/services/firestore-service.ts
import admin from 'firebase-admin';

const db = admin.firestore();

// Enable Firestore Emulator for local development
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

export const firestoreService = {
  createExam: async (exam: IExam) => {
    const examId = db.collection('exams').doc().id;
    await db.collection('exams').doc(examId).set({
      ...exam,
      createdAt: admin.firestore.Timestamp.now()
    });
    return { examId };
  },
  
  listExams: async (classId: string) => {
    const snapshot = await db.collection('exams')
      .where('classId', '==', classId)
      .orderBy('startTime', 'desc')
      .get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
  
  // ... more CRUD operations
};
```

### Transaction Example (for atomic submit)
```typescript
const batch = db.batch();

// Check student hasn't submitted (pseudo-code, real: query first)
const existing = await db.collection('submissions')
  .where('examId', '==', examId)
  .where('studentId', '==', studentId)
  .limit(1)
  .get();

if (existing.size > 0) {
  throw new Error('Already submitted');
}

// Create submission
const submissionRef = db.collection('submissions').doc();
batch.set(submissionRef, { examId, studentId, answers, submittedAt });

// Update exam stats
batch.update(db.collection('exams').doc(examId), {
  submissionCount: admin.firestore.FieldValue.increment(1)
});

await batch.commit();
```

---

## ✅ TESTING REQUIREMENTS

**Unit Tests (12 total):**

1. `test_createExam_valid` - create exam, verify in Firestore
2. `test_createExam_invalidTitle` - reject <1 char title
3. `test_createExam_classNotFound` - 404 if class doesn't exist
4. `test_listExams_happy` - list exams for class
5. `test_listExams_pagination` - page 2 works correctly
6. `test_submitExam_valid` - student submits, score calculated
7. `test_submitExam_duplicate` - reject 2nd submission
8. `test_submitExam_examEnded` - reject if past endTime
9. `test_submitExam_unauthorized` - reject if not enrolled
10. `test_getResults_student_own` - student sees own results
11. `test_getResults_teacher_class` - teacher sees all results
12. `test_getResults_unauthorized` - student can't see others' results

**Test Framework:** Jest + mock Firestore  
**Expected Coverage:** 90%+ on exams.ts

---

## 🚀 DEPLOYMENT STEPS

1. **Run Firestore Emulator locally:**
   ```bash
   firebase emulators:start --only firestore
   ```

2. **Start Express server:**
   ```bash
   npm run dev
   ```

3. **Run tests:**
   ```bash
   npm test -- exams.test.ts
   ```

4. **Manual test with Postman/cURL:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/exams \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer TOKEN" \
     -d @exam-payload.json
   ```

---

## ⏰ YOUR TIMELINE

| Time | Task | Status |
|------|------|--------|
| 9:30-10:00 | Setup Firestore client + auth middleware | START |
| 10:00-11:30 | Implement endpoints 1-2 (create, list) | CODE |
| 11:30-12:00 | Write unit tests for 1-2 | TEST |
| 12:00-1:00 | LUNCH |
| 1:00-2:30 | Implement endpoints 3-4 (submit, results) | CODE |
| 2:30-3:00 | Write unit tests for 3-4 | TEST |
| 3:00-3:30 | **CHECKPOINT: Push Phase 2 PR to GitHub** | PUSH |
| 3:30-4:00 | Wait for Architect review + fixes | REVIEW |
| 4:00-5:00 | Merge + coordinate with Frontend integration | MERGE |

---

## 🎯 SUCCESS CRITERIA

✅ All 4 endpoints implemented (not stubs)  
✅ All 4 endpoints have validation + error handling  
✅ 12 unit tests (80%+ coverage)  
✅ Firestore integration tested locally  
✅ PR description clear + reviewed by Architect  
✅ Phase 2 endpoints: 30-40% complete  

**By 3:30 PM:**
- Push PR with 4 endpoints + 12 tests
- Get Architect approval

**By 5:00 PM:**
- Merge to main branch
- Coordinate with Frontend (they'll start integrating now)

---

**BACKEND AGENT - PHASE 2 IMPLEMENTATION LOCKED** 🚀

**Start:** 9:30 AM  
**Checkpoint:** 3:00 PM (push Phase 2 PR)  
**Finish:** 5:00 PM (merge)

Ready to code? 💪
