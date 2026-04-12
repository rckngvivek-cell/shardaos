# AGENT 2: FRONTEND ENGINEER
## Week 7 Day 2 Briefing

**Your Role:** Connect React components to Backend Phase 2 endpoints  
**Interface Time:** 90% = ~7 hours coding  
**Target:** ExamList, ExamAnswerer, ResultsViewer fully integrated by 3:30 PM  

---

## TODAY'S MISSION

```
Connect 3 major components to backend
- ExamList component → GET /api/v1/exams
- ExamAnswerer component → GET questions + POST submissions
- ResultsViewer component → GET /api/v1/exams/{id}/results
Implement Redux + RTK Query integration for API calls
Write 20+ component tests
60% of UI components integrated by EOD
```

---

## 🎯 THE 3 COMPONENTS TO INTEGRATE

### COMPONENT 1: ExamList (Display all exams)

**Current State:** Component renders hardcoded mock exams  
**Integration Goal:** Load real exams from Backend

**What to Change:**
```typescript
// BEFORE (current)
import { useMemo } from 'react';

export function ExamList() {
  const exams = [
    { id: 'E1', title: 'Math Quiz', status: 'ACTIVE' },
    { id: 'E2', title: 'Science Quiz', status: 'ENDED' }
  ];
  
  return (
    <div>
      {exams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
    </div>
  );
}

// AFTER (integration)
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { fetchExams, selectExams, selectLoading } from '../redux/examsSlice';

export function ExamList() {
  const dispatch = useDispatch();
  const exams = useSelector(selectExams);
  const loading = useSelector(selectLoading);
  
  useEffect(() => {
    dispatch(fetchExams({ classId: 'CLASS-001' })); // from context
  }, [dispatch]);
  
  if (loading) return <Skeleton />;
  if (!exams.length) return <EmptyState />;
  
  return (
    <div>
      {exams.map(exam => <ExamCard key={exam.id} exam={exam} />)}
    </div>
  );
}
```

**API Layer to Create:**
```typescript
// src/api/examApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const examApi = createApi({
  reducerPath: 'examApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token; // from Redux
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getExams: builder.query({
      query: (params) => ({
        url: '/api/v1/exams',
        params, // classId, status, etc
      }),
    }),
    // ... more endpoints
  }),
});

export const { useGetExamsQuery } = examApi;
```

**Redux Slice to Create:**
```typescript
// src/redux/examsSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export const fetchExams = createAsyncThunk(
  'exams/fetchExams',
  async ({ classId }, { rejectWithValue }) => {
    try {
      const res = await fetch(`/api/v1/exams?classId=${classId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const examsSlice = createSlice({
  name: 'exams',
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExams.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExams.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.exams;
      })
      .addCase(fetchExams.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const selectExams = (state) => state.exams.list;
export const selectLoading = (state) => state.exams.loading;
```

**Testing:**
```typescript
// src/__tests__/ExamList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ExamList } from './ExamList';
import * as api from '../api/examApi';

jest.mock('../api/examApi');

test('ExamList loads and displays exams from backend', async () => {
  (api.useGetExamsQuery as jest.Mock).mockReturnValue({
    data: { exams: [{ id: 'E1', title: 'Math' }] },
    isLoading: false,
    error: null,
  });
  
  render(<ExamList />);
  
  await waitFor(() => {
    expect(screen.getByText('Math')).toBeInTheDocument();
  });
});
```

---

### COMPONENT 2: ExamAnswerer (Student takes exam)

**Current State:** Component shows questions but doesn't submit  
**Integration Goal:** 
- Fetch questions from Backend
- Submit answers to Backend
- Show success/error messages

**What to Change:**
```typescript
// BEFORE
export function ExamAnswerer({ examId }) {
  const [answers, setAnswers] = useState({});
  
  return (
    <div>
      {MOCK_QUESTIONS.map(q => (
        <Question key={q.id} question={q} />
      ))}
      <button onClick={() => alert('Not implemented')}>Submit</button>
    </div>
  );
}

// AFTER
export function ExamAnswerer({ examId }) {
  const dispatch = useDispatch();
  const [answers, setAnswers] = useState({});
  const { data: exam, isLoading } = useGetExamQuery(examId);
  const [submitExam, { isLoading: submitting }] = useSubmitExamMutation();
  const { success, error } = useSelector(selectSubmitStatus);
  
  const handleSubmit = async () => {
    try {
      await submitExam({
        examId,
        answers: Object.entries(answers).map(([qId, answer]) => ({
          questionId: qId,
          selectedOption: answer,
        })),
      }).unwrap();
      // Success - show message, navigate to results
    } catch (err) {
      // Error - show error message
    }
  };
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      {exam.questions.map(q => (
        <Question 
          key={q.id} 
          question={q}
          onChange={(ans) => setAnswers({...answers, [q.id]: ans})}
        />
      ))}
      <button 
        onClick={handleSubmit} 
        disabled={submitting}
      >
        {submitting ? 'Submitting...' : 'Submit'}
      </button>
      {error && <ErrorAlert message={error} />}
      {success && <SuccessAlert message="Submitted successfully!" />}
    </div>
  );
}
```

**API Endpoints to Use:**
```typescript
// New endpoints in examApi.ts
getExamQuestions: builder.query({
  query: (examId) => `/api/v1/exams/${examId}`,
}),

submitExam: builder.mutation({
  query: ({ examId, answers }) => ({
    url: `/api/v1/exams/${examId}/submissions`,
    method: 'POST',
    body: { answers, submittedAt: new Date().toISOString() },
  }),
}),
```

**Testing:**
```typescript
test('ExamAnswerer submits answers and shows success', async () => {
  const { getByText, getByRole } = render(
    <ExamAnswerer examId="EXAM-123" />
  );
  
  // Wait for questions to load
  await waitFor(() => {
    expect(getByText('Question 1')).toBeInTheDocument();
  });
  
  // Select answers
  getByRole('radio', { name: /Option B/i }).click();
  
  // Submit
  const submitBtn = getByRole('button', { name: /Submit/i });
  submitBtn.click();
  
  // Verify success message
  await waitFor(() => {
    expect(getByText(/Successfully submitted/i)).toBeInTheDocument();
  });
});
```

---

### COMPONENT 3: ResultsViewer (Show exam scores)

**Current State:** Component displays hardcoded results  
**Integration Goal:** Fetch real results from Backend

**What to Change:**
```typescript
// BEFORE
export function ResultsViewer({ examId }) {
  const results = {
    score: 75,
    totalMarks: 100,
    answers: [
      { question: 'Q1', correct: true, marks: 10 }
    ]
  };
  
  return <Results results={results} />;
}

// AFTER
export function ResultsViewer({ examId }) {
  const studentId = useSelector(selectCurrentUserId);
  const { data: results, isLoading } = useGetResultsQuery(
    { examId, studentId }
  );
  
  if (isLoading) return <Skeleton />;
  
  return (
    <div>
      <ScoreDisplay 
        score={results.results[0].score}
        totalMarks={results.exam.totalMarks}
      />
      <AnswerReview answers={results.results[0].answers} />
      <ClassStats stats={results.classStats} />
    </div>
  );
}
```

**API Endpoint:**
```typescript
getResults: builder.query({
  query: ({ examId, studentId }) => ({
    url: `/api/v1/exams/${examId}/results`,
    params: studentId ? { studentId } : {},
  }),
}),
```

---

## 📦 FILE STRUCTURE TO CREATE/UPDATE

```
src/
├── api/
│   ├── examApi.ts [NEW - RTK Query for all exam endpoints]
│   ├── client.ts [Update - add interceptors]
│   └── types.ts [Update - add response types]
├── redux/
│   ├── examsSlice.ts [NEW - exam state management]
│   ├── store.ts [Update - add examApi reducer]
│   └── hooks.ts [Update - export useExams, etc]
├── components/
│   ├── ExamList.tsx [Update - integrate API]
│   ├── ExamAnswerer.tsx [Update - integrate API + submit]
│   ├── ResultsViewer.tsx [Update - integrate API]
│   └── __tests__/
│       ├── ExamList.test.tsx [NEW - 5 tests]
│       ├── ExamAnswerer.test.tsx [NEW - 8 tests]
│       └── ResultsViewer.test.tsx [NEW - 5 tests]
└── types/
    ├── exam.ts [NEW - TypeScript interfaces]
    └── api.ts [Update - API response types]
```

---

## 🔧 IMPLEMENTATION STEPS

**Step 1: Create API layer (examApi.ts)**
```typescript
// Define RTK Query endpoints
// Mock responses initially (mock response body for each endpoint)
```

**Step 2: Create Redux slice (examsSlice.ts)**
```typescript
// Define initial state
// Add async thunks for API calls
// Add reducers for state updates
```

**Step 3: Update Redux store**
```typescript
// Import examApi
// Add to configureStore
// Make sure middleware is included
```

**Step 4: Update ExamList component**
```typescript
// Remove hardcoded data
// Add useDispatch + useSelector hooks
// Call fetchExams useEffect
// Add loading/error states
```

**Step 5: Update ExamAnswerer component**
```typescript
// Fetch questions on mount
// Add submit handler (call submitExam mutation)
// Add success/error UI
```

**Step 6: Update ResultsViewer component**
```typescript
// Fetch results on mount
// Display real data from API
```

**Step 7: Write tests**
```typescript
// 5 tests for ExamList (load, paginate, filter, error, empty)
// 8 tests for ExamAnswerer (load, submit, error, validation, etc)
// 5 tests for ResultsViewer (load, display, unauthorized, etc)
```

---

## ⏰ YOUR TIMELINE

| Time | Task | Status |
|------|------|--------|
| 9:30-10:00 | Review Backend Phase 2 spec (what's available) | READ |
| 10:00-11:00 | Create examApi.ts + examsSlice.ts | CODE |
| 11:00-12:00 | Update ExamList component | CODE |
| 12:00-1:00 | LUNCH |
| 1:00-2:30 | Update ExamAnswerer + ResultsViewer | CODE |
| 2:30-3:30 | Write 18+ tests | TEST |
| 3:30-4:00 | **CHECKPOINT: Push Frontend PR** | PUSH |
| 4:00-5:00 | Fix review comments + coordinate integration test | MERGE |

---

## 🚀 TESTING REQUIREMENTS

**Component Tests (18+):**
1. ExamList loads exams from Backend (happy)
2. ExamList shows loading state
3. ExamList shows error state
4. ExamList pagination works
5. ExamList filters by status
6. ExamAnswerer loads questions
7. ExamAnswerer submits answers (happy)
8. ExamAnswerer shows loading during submit
9. ExamAnswerer shows error on submit failure
10. ExamAnswerer validates form before submit
11. ExamAnswerer prevents double-submit
12. ExamAnswerer handles network timeout
13. ResultsViewer loads results
14. ResultsViewer displays score correctly
15. ResultsViewer shows class stats
16. ResultsViewer student can't see others' results
17. API interceptor attaches auth token
18. API handles 404/500 errors gracefully

**Coverage Target:** 90%+ on components

---

## ✅ SUCCESS CRITERIA

✅ ExamList connects to Backend  
✅ ExamAnswerer can submit answers  
✅ ResultsViewer displays real results  
✅ Redux state properly normalized  
✅ Error handling complete (network, validation, auth)  
✅ 18+ tests written (90%+ coverage)  
✅ No console errors  

**By 3:30 PM:**
- Push PR with 3 components + 18 tests
- Ready for Architect review

**By 5:00 PM:**
- Merge to main
- Coordinate E2E test with QA

---

**FRONTEND AGENT - PHASE 2 INTEGRATION LOCKED** 🎨

**Start:** 9:30 AM  
**Checkpoint:** 3:30 PM (push PR)  
**Finish:** 5:00 PM (merge)

Let's connect! 🔌
