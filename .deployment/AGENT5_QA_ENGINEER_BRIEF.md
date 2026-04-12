# AGENT 5: QA ENGINEER
## Week 7 Day 2 Briefing

**Your Role:** Write integration tests alongside Phase 2 implementation  
**Testing Time:** 85% = ~6.5 hours coding + testing  
**Target:** 15-20 new tests written, 80+ total by EOD  

---

## TODAY'S MISSION

```
Write 5 new integration tests (Phase 2 endpoints)
Update 10 component tests (use real API calls)
Create 1 full E2E test (student journey)
Run regression suite (verify Week 6 not broken)
Maintain 90%+ code coverage (grow to 92%)
```

---

## 🎯 TESTING STRATEGY

**Test Pyramid (Day 2 Focus):**
```
                 E2E Tests (1)
               /            \
          Integration (5)   Component (10)
          /    |    |    \   /    |    |    \
      Unit Tests (80+)
```

---

## 🧪 INTEGRATION TESTS (5 Total)

### INTEGRATION TEST 1: Create Exam Flow
**File:** `tests/integration/exams.create.test.ts`

```typescript
describe('Integration: Create Exam', () => {
  let server: Express.Application;
  let adminToken: string;

  beforeAll(async () => {
    server = await setupTestServer();
    adminToken = generateTestToken('admin');
  });

  test('should create exam and verify in Firestore', async () => {
    const examPayload = {
      title: 'Integration Test Exam',
      classId: 'CLASS-001',
      totalMarks: 100,
      questions: [
        { id: 'Q1', text: '2+2?', type: 'MC', options: ['3', '4', '5'], correctAnswer: '1', marks: 10 }
      ],
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000)
    };

    const response = await request(server)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(examPayload);

    expect(response.status).toBe(201);
    expect(response.body.examId).toBeDefined();

    // Verify in Firestore
    const docSnapshot = await admin
      .firestore()
      .collection('exams')
      .doc(response.body.examId)
      .get();

    expect(docSnapshot.exists).toBe(true);
    expect(docSnapshot.data().title).toBe('Integration Test Exam');
  });

  test('should reject invalid exam data', async () => {
    const response = await request(server)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: '' }); // No questions, empty title

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('invalid');
  });

  test('should reject if class does not exist', async () => {
    const response = await request(server)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ...validExamPayload(),
        classId: 'NON-EXISTENT-CLASS'
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toContain('not found');
  });
});
```

---

### INTEGRATION TEST 2: Submit Exam (Atomic Transaction)
**File:** `tests/integration/exams.submit.test.ts`

```typescript
describe('Integration: Submit Exam (Transaction)', () => {
  test('should submit exam and auto-grade multiple choice', async () => {
    // Setup: Create exam
    const examId = await createTestExam();
    const studentId = 'STU-TEST-001';

    // Action: Submit
    const response = await request(server)
      .post(`/api/v1/exams/${examId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId,
        answers: [
          { questionId: 'Q1', selectedOption: '1' }, // Correct (2+2=4)
          { questionId: 'Q2', selectedOption: '0' }   // Incorrect
        ]
      });

    expect(response.status).toBe(201);
    expect(response.body.score).toBe(50); // 1/2 correct

    // Verify: Check submission exists in Firestore
    const submission = await admin
      .firestore()
      .collection('submissions')
      .doc(response.body.submissionId)
      .get();

    expect(submission.exists).toBe(true);
    expect(submission.data().score).toBe(50);
  });

  test('should prevent duplicate submission', async () => {
    const examId = await createTestExam();
    const studentId = 'STU-TEST-002';

    // First submission (success)
    const first = await request(server)
      .post(`/api/v1/exams/${examId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ studentId, answers: [] });

    expect(first.status).toBe(201);

    // Second submission (fail)
    const second = await request(server)
      .post(`/api/v1/exams/${examId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ studentId, answers: [] });

    expect(second.status).toBe(400);
    expect(second.body.error).toContain('already submitted');
  });

  test('should reject submission after exam ends', async () => {
    // Create exam that ended 1 hour ago
    const examId = await createTestExam({
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 1 * 60 * 60 * 1000)
    });

    const response = await request(server)
      .post(`/api/v1/exams/${examId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ studentId: 'STU-003', answers: [] });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('ended');
  });
});
```

---

### INTEGRATION TEST 3: List Exams with Pagination
**File:** `tests/integration/exams.list.test.ts`

```typescript
describe('Integration: List Exams', () => {
  test('should list exams with pagination', async () => {
    // Setup: Create 5 exams
    for (let i = 0; i < 5; i++) {
      await createTestExam({ title: `Exam ${i}` });
    }

    // Page 1
    const page1 = await request(server)
      .get('/api/v1/exams?limit=2&offset=0')
      .set('Authorization', `Bearer ${token}`);

    expect(page1.status).toBe(200);
    expect(page1.body.exams.length).toBe(2);
    expect(page1.body.total).toBe(5);

    // Page 2
    const page2 = await request(server)
      .get('/api/v1/exams?limit=2&offset=2')
      .set('Authorization', `Bearer ${token}`);

    expect(page2.status).toBe(200);
    expect(page2.body.exams.length).toBe(2);
    expect(page2.body.exams[0].title).not.toBe(page1.body.exams[0].title);
  });

  test('should filter exams by status', async () => {
    await createTestExam({ status: 'ACTIVE', title: 'Active Exam' });
    await createTestExam({ status: 'ENDED', title: 'Ended Exam' });

    const response = await request(server)
      .get('/api/v1/exams?status=ACTIVE')
      .set('Authorization', `Bearer ${token}`);

    expect(response.body.exams.every(e => e.status === 'ACTIVE')).toBe(true);
  });
});
```

---

### INTEGRATION TEST 4: Get Results (Authorization)
**File:** `tests/integration/exams.results.test.ts`

```typescript
describe('Integration: Get Results', () => {
  test('student can view own results', async () => {
    const examId = await createTestExam();
    const submissionId = await createTestSubmission(examId, 'STU-001');

    const response = await request(server)
      .get(`/api/v1/exams/${examId}/results`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(response.status).toBe(200);
    expect(response.body.results[0].studentId).toBe('STU-001');
  });

  test('student cannot view other student results', async () => {
    const examId = await createTestExam();
    await createTestSubmission(examId, 'STU-002'); // Other student

    const response = await request(server)
      .get(`/api/v1/exams/${examId}/results?studentId=STU-002`)
      .set('Authorization', `Bearer ${studentToken}`); // Log in as STU-001

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('unauthorized');
  });

  test('teacher can view all class results', async () => {
    const examId = await createTestExam();
    await createTestSubmission(examId, 'STU-001');
    await createTestSubmission(examId, 'STU-002');

    const response = await request(server)
      .get(`/api/v1/exams/${examId}/results`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(response.status).toBe(200);
    expect(response.body.results.length).toBe(2);
    expect(response.body.classStats).toBeDefined();
    expect(response.body.classStats.averageScore).toBe(calculateAverage([...scores]));
  });
});
```

---

### INTEGRATION TEST 5: End-to-End Flow (Full Student Journey)
**File:** `tests/integration/exam-flow.e2e.test.ts`

```typescript
describe('Integration: Full Student Exam Flow', () => {
  test('student journey: create → submit → view results', async () => {
    // Step 1: Teacher creates exam
    const createResponse = await request(server)
      .post('/api/v1/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'E2E Test Exam',
        classId: 'CLASS-E2E',
        totalMarks: 100,
        questions: [
          { id: 'Q1', text: '2+2?', correctAnswer: '1', marks: 50 },
          { id: 'Q2', text: '3+3?', correctAnswer: '1', marks: 50 }
        ]
      });

    const examId = createResponse.body.examId;
    expect(createResponse.status).toBe(201);

    // Step 2: Student lists exams
    const listResponse = await request(server)
      .get('/api/v1/exams')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(listResponse.body.exams.map(e => e.id)).toContain(examId);

    // Step 3: Student submits answers
    const submitResponse = await request(server)
      .post(`/api/v1/exams/${examId}/submissions`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentId: 'STU-E2E',
        answers: [
          { questionId: 'Q1', selectedOption: '1' }, // Correct
          { questionId: 'Q2', selectedOption: '0' }   // Wrong
        ]
      });

    expect(submitResponse.status).toBe(201);
    const submissionId = submitResponse.body.submissionId;

    // Step 4: Student views results
    const resultsResponse = await request(server)
      .get(`/api/v1/exams/${examId}/results`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(resultsResponse.status).toBe(200);
    expect(resultsResponse.body.results[0].score).toBe(50); // 1/2 correct
    expect(resultsResponse.body.results[0].submissionId).toBe(submissionId);

    // Step 5: Teacher views all class results
    const classResults = await request(server)
      .get(`/api/v1/exams/${examId}/results`)
      .set('Authorization', `Bearer ${teacherToken}`);

    expect(classResults.status).toBe(200);
    expect(classResults.body.classStats.totalStudents).toBeGreaterThan(0);
  });
});
```

---

## 🔄 COMPONENT TESTS (Update 10 Total)

**Update These Components (from mocks → real API):**

### Component 1-3: ExamList, ExamAnswerer, ResultsViewer
**Already specified in Frontend Brief - Update 18 tests to use real API responses**

```typescript
// Example: Update ExamList test
test('ExamList loads exams from Backend API', async () => {
  const mockExams = {
    exams: [{ id: 'E1', title: 'Math' }],
    total: 1
  };

  // Mock RTK Query fetch
  jest.mock('../api/examApi', () => ({
    useGetExamsQuery: () => ({
      data: mockExams,
      isLoading: false,
      error: null
    })
  }));

  const { getByText } = render(<ExamList />);
  await waitFor(() => {
    expect(getByText('Math')).toBeInTheDocument();
  });
});
```

---

## 📊 REGRESSION SUITE (Run All Day 1 Tests)

**Test Coverage Areas:**
```
✅ Authentication (4 tests)
✅ Authorization (3 tests)
✅ Firestore CRUD (8 tests)
✅ Error Handling (5 tests)
✅ API validation (4 tests)
✅ Component rendering (8 tests)
✅ Redux state management (4 tests)
✅ API integration (10 tests)
```

**Total: 57 tests should all pass + 15-20 new = 75-80 total**

**Run Regression:**
```bash
npm test -- --coverage

# Expected output:
# Tests: 80 passed, 0 failed
# Coverage: 90%+
```

---

## ⏰ YOUR TIMELINE

| Time | Task | Status |
|------|------|--------|
| 9:30-10:00 | Review Phase 2 endpoints spec (from Backend) | PLAN |
| 10:00-12:00 | Write 5 integration tests | CODE |
| 12:00-1:00 | LUNCH |
| 1:00-3:00 | Update 10 component tests | TEST |
| 3:00-4:00 | Run regression suite + E2E test | VERIFY |
| 4:00-4:30 | **CHECKPOINT: Push QA PR with all tests** | PUSH |
| 4:30-5:00 | Merge + report coverage | MERGE |

---

## ✅ SUCCESS CRITERIA

✅ 15-20 new tests written  
✅ 80+ total tests (all passing)  
✅ 90%+ code coverage (should grow to 92%)  
✅ All regression tests pass  
✅ 1 E2E test validates full student flow  
✅ 0 new test warnings/flakes  

**By 4:30 PM:**
- All tests passing
- Coverage report generated
- PR reviewed + merged

**By 5:00 PM:**
- QA sign-off on Phase 2
- Ready for production deployment (later)

---

**QA ENGINEER - TESTING COMPLETE** ✅

**Start:** 9:30 AM  
**Checkpoint:** 4:30 PM (80+ tests, 92% coverage)  
**Finish:** 5:00 PM (merged)

Let's verify! 🧪
