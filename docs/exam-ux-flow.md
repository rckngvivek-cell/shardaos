# Exam/Assessment Module - UX Flow Documentation

## Version 1.0
**Date**: April 10, 2026  
**Module**: Module 3 - Exam/Assessment  
**Status**: MVP Foundation

---

## Table of Contents
1. [Overview](#overview)
2. [Student Journey](#student-journey)
3. [Teacher Journey](#teacher-journey)
4. [Component Architecture](#component-architecture)
5. [State Management](#state-management)
6. [UX Mockup Descriptions](#ux-mockup-descriptions)
7. [State Transitions](#state-transitions)

---

## Overview

The Exam/Assessment Module enables:
- **Teachers**: Create, edit, and manage exams with questions, grading, and result tracking
- **Students**: View available exams, take exams, submit answers, and review results

### Key Features (Phase 1)
- Mock exam creation and editing
- Timed exam taking with question navigation
- Answer submission tracking
- Results display with score breakdown
- Question-wise performance analysis

### Out of Scope (Phase 2-3)
- Backend integration
- Real-time grading
- Analytics and reporting
- Mobile optimization
- Exam analytics dashboard

---

## Student Journey

### Flow Diagram
```
1. LOGIN (Session module handles)
   ↓
2. VIEW EXAMS (ExamList - Student view)
   ├─ Available exams displayed
   ├─ Exam status: Published, Draft, Completed
   └─ Actions: View, Take Exam, View Results
   ↓
3. TAKE EXAM (ExamAnswerer)
   ├─ Load 5 sample questions
   ├─ Display current question
   ├─ Student selects answer
   ├─ Navigate: Previous/Next buttons
   ├─ Track progress bar
   └─ Submit all answers
   ↓
4. VIEW RESULTS (ResultsViewer)
   ├─ Display overall score (%)
   ├─ Pass/Fail status
   ├─ Question-wise breakdown
   ├─ Correct/Incorrect count
   └─ Option to retake (if allowed)
   ↓
5. LOGOUT
```

### State Transitions - Student

| State | Condition | Next State | Action |
|-------|-----------|-----------|--------|
| Viewing Exams | Click "Take Exam" | Taking Exam | Load ExamAnswerer, setCurrentExam |
| Taking Exam | Complete all questions | Ready to Submit | Enable Submit button |
| Taking Exam | Answer all Q's, click Submit | Submitted | addSubmission, setResults |
| Submitted | Results displayed | Viewing Results | Show ResultsViewer |
| Viewing Results | Click Back | Viewing Exams | clearSubmissions, resetExamState |

---

## Teacher Journey

### Flow Diagram
```
1. LOGIN (Session module handles)
   ↓
2. VIEW EXAMS (ExamList - Teacher view)
   ├─ All created exams displayed
   ├─ Status: Draft, Published, Archived
   ├─ Shows attempt count
   └─ Actions: Edit, View Results, Delete
   ↓
3. CREATE/EDIT EXAM (ExamEditor)
   ├─ Form displayed with fields:
   │  ├─ Title
   │  ├─ Subject
   │  ├─ Duration (minutes)
   │  ├─ Total Questions
   │  └─ Passing Score (%)
   ├─ Validation on submit
   └─ Save exam
   ↓
4. MANAGE QUESTIONS (Future: Phase 2)
   ├─ Add questions to exam
   ├─ Edit questions
   └─ Delete questions
   ↓
5. VIEW STUDENT RESULTS (ResultsViewer - Teacher view)
   ├─ Student scores
   ├─ Question analysis
   ├─ Performance breakdown
   └─ Export (Future: Phase 3)
   ↓
6. LOGOUT
```

### State Transitions - Teacher

| State | Condition | Next State | Action |
|-------|-----------|-----------|--------|
| Viewing Exams | Click "Edit" | Editing Exam | Load ExamEditor, setCurrentExam |
| Editing Exam | Fill form, click Save | Exam Saved | updateExam, show success |
| Viewing Exams | Click "Results" | Viewing Results | Load ResultsViewer with mocked data |
| Viewing Exams | Click "Create" | Creating Exam | Load ExamEditor with empty form |
| Creating Exam | Fill form, click Save | Exam Created | addExam, show success, return to list |
| Viewing Exams | Click "Delete" | Exam Deleted | removeExam, show confirmation |

---

## Component Architecture

### Component Hierarchy
```
App
├── ExamList
│   ├── Props: exams[], role
│   ├── Role-based rendering (Student/Teacher)
│   └── Actions trigger: onView, onTakeExam, onViewResults, onEdit
│
├── ExamEditor
│   ├── Props: exam?, onSave, onCancel
│   ├── Form validation
│   ├── Submit creates/updates exam
│   └── Actions: Save/Cancel
│
├── ExamAnswerer
│   ├── Props: exam, onSubmit
│   ├── 5 mock questions loaded
│   ├── Progress tracking
│   ├── Question navigation
│   └── Answer submission
│
└── ResultsViewer
    ├── Props: results, exam
    ├── Score display
    ├── Question-wise breakdown
    └── Pass/Fail status
```

### Component Props

#### ExamList
```typescript
interface ExamListProps {
  exams: ExamListItem[];
  role: UserRole;
  onView?: (examId: string) => void;
  onTakeExam?: (examId: string) => void;
  onViewResults?: (examId: string) => void;
  onEdit?: (examId: string) => void;
  onDelete?: (examId: string) => void;
}
```

#### ExamEditor
```typescript
interface ExamEditorProps {
  exam?: Exam;
  onSave: (data: ExamFormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}
```

#### ExamAnswerer
```typescript
interface ExamAnswererProps {
  exam: Exam;
  onSubmit: (answers: StudentAnswer[]) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}
```

#### ResultsViewer
```typescript
interface ResultsViewerProps {
  results: ExamResult;
  exam: Exam;
  onBack?: () => void;
}
```

---

## State Management

### Redux Slice Structure

**File**: `src/features/exam/examSlice.ts`

```typescript
ExamSliceState = {
  exams: Exam[]           // All exams
  currentExam: Exam | null // Active exam
  submissions: StudentAnswer[]  // Current exam answers
  results: ExamResult | null    // Exam result
  status: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: string | null
}
```

### Redux Actions

| Action | Payload | Purpose |
|--------|---------|---------|
| `setExams` | `Exam[]` | Initialize exam list from backend |
| `setCurrentExam` | `Exam \| null` | Set exam being taken/edited |
| `addExam` | `Exam` | Add new exam to list |
| `updateExam` | `Exam` | Update existing exam |
| `removeExam` | `examId` | Delete exam from list |
| `addSubmission` | `StudentAnswer[]` | Record student answers |
| `clearSubmissions` | - | Reset answers for new exam |
| `setResults` | `ExamResult \| null` | Set exam result |
| `setStatus` | `Status` | Update loading status |
| `setError` | `string \| null` | Set error message |
| `resetExamState` | - | Clear all exam state |

### Redux Selectors

```typescript
selectAllExams(state)           // Get all exams
selectCurrentExam(state)        // Get current exam
selectSubmissions(state)        // Get student answers
selectResults(state)            // Get exam result
selectExamStatus(state)         // Get status
selectExamError(state)          // Get error
selectExamById(state, id)       // Find exam by ID
selectSubmissionCount(state)    // Count submitted answers
```

---

## UX Mockup Descriptions

### 1. Exam List - Student View
```
┌─────────────────────────────────────┐
│ Available Exams                     │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Mathematics Midterm             │ │
│ │ Subject: Mathematics            │ │
│ │ Duration: 120 min | Questions: 50│
│ │ Status: [Published]             │ │
│ │ [View] [Take Exam]              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ English Literature Quiz          │ │
│ │ Subject: English                │ │
│ │ Duration: 60 min | Questions: 30 │ │
│ │ Status: [Published]             │ │
│ │ [View] [Take Exam]              │ │
│ └─────────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

### 2. Exam List - Teacher View
```
┌────────────────────────────────────────┐
│ My Exams                               │
├────────────────────────────────────────┤
│ Title | Subject | Duration | Questions│
│       |         | Status   | Attempts │
├────────────────────────────────────────┤
│ Math  | Science | 120 | 50| [Published]│
│ Midterm          | 28 attempts        │
│                  │[Edit] [Results] [Delete]
├────────────────────────────────────────┤
│ English Quiz | English | 60 | 30      │
│              │ [Published] | 32      │
│              │[Edit] [Results] [Delete]
└────────────────────────────────────────┘
```

### 3. Exam Editor
```
┌─────────────────────────────────────┐
│ Create New Exam                     │
├─────────────────────────────────────┤
│                                     │
│ Exam Title                          │
│ [Mathematics Midterm           ]    │
│                                     │
│ Subject                             │
│ [Mathematics                   ]    │
│                                     │
│ Duration (minutes)                  │
│ [120                           ]    │
│                                     │
│ Total Questions                     │
│ [50                            ]    │
│                                     │
│ Passing Score (%)                   │
│ [60                            ]    │
│                                     │
│         [Cancel]  [Save Exam]       │
│                                     │
└─────────────────────────────────────┘
```

### 4. Exam Answerer (In Progress)
```
┌──────────────────────────────────────┐
│ Mathematics Midterm                  │
│ Question 2 of 5 [██░░░░░░░░] 40%    │
├──────────────────────────────────────┤
│                                      │
│ Which planet is closest to the Sun?  │
│                                      │
│ ○ Venus                              │
│ ○ Mercury                            │
│ ○ Earth                              │
│ ○ Mars                               │
│                                      │
│ Answered: 2 / 5                      │
│                                      │
├──────────────────────────────────────┤
│ [Previous] [Next]  [Cancel] [Submit] │
│                                      │
└──────────────────────────────────────┘
```

### 5. Results Viewer
```
┌──────────────────────────────────────┐
│ Exam Results                         │
│                                      │
│ Exam: Mathematics Midterm            │
│ Student: John Doe                    │
│ Submitted: April 10, 2026            │
├──────────────────────────────────────┤
│                                      │
│         Score: 80%                   │
│         [PASSED]                     │
│                                      │
│         ████████░░ 80/100            │
│                                      │
├──────────────────────────────────────┤
│ Correct: 4 | Incorrect: 1 | Skip: 0 │
├──────────────────────────────────────┤
│                                      │
│ Question-wise Results                │
│ Q# | Question | Your | Correct | ✓/✗ │
│ 1  | Capital? | Paris| Paris   | ✓  │
│ 2  | Planet?  | Venus| Mercury | ✗  │
│ 3  | 15×12?   | 180  | 180     | ✓  │
│ 4  | Author?  | Shake| Shake   | ✓  │
│ 5  | Au?      | Ag   | Au      | ✗  │
│                                      │
│              [Back to Exams]         │
│                                      │
└──────────────────────────────────────┘
```

---

## State Transitions

### Complete State Flow

```
INITIAL: status='idle', exams=[], currentExam=null, submissions=[], results=null

STUDENT PATH:
1. Load Exam List
   → setExams([...]) → status='succeeded'
   
2. Click "Take Exam"
   → setCurrentExam(exam) → status='idle'
   
3. Answer Questions & Submit
   → addSubmission([...]) → status='succeeded'
   → setResults(result)
   
4. View Results
   → ResultsViewer displayed
   
5. Back to Exam List
   → resetExamState() → all cleared

TEACHER PATH:
1. Load Exam List
   → setExams([...]) → status='succeeded'
   
2. Click "Create Exam"
   → setCurrentExam(null) → ExamEditor opened
   
3. Fill Form & Save
   → setStatus('loading')
   → onSave(formData)
   → addExam(newExam) → status='succeeded'
   
4. Click "Edit"
   → setCurrentExam(exam) → ExamEditor with data
   → updateExam(editedExam) → status='succeeded'
   
5. Click "Delete"
   → removeExam(examId) → status='succeeded'
```

---

## Integration Points (Phase 2)

### Backend API Integration
- Replace mock data with API calls to `/api/v1/exams`
- Implement real question loading from Firestore
- Connect to authentication/authorization middleware

### Real-time Features (Phase 3)
- Timer countdown in ExamAnswerer
- Auto-save answers periodically
- Connection state indicators
- Exam lock on submission

### Analytics (Phase 4)
- Question difficulty analysis
- Student performance trends
- Class-wide statistics
- Attempt history tracking

---

## Accessibility & Responsive Design

### Mobile Considerations
- Stack question options vertically
- Larger touch targets (min 44x44px)
- Simplified navigation (Full screen mode)
- Reduced progress bar complexity

### Keyboard Navigation
- Tab through answer options
- Enter to submit answer
- Arrow keys for previous/next
- Escape to cancel

### Screen Reader Support
- Semantic HTML structure
- Aria labels on all interactive elements
- Form field descriptions
- Status announcements

---

## Known Limitations (Phase 1)

1. **No Backend Integration**: All data is mocked
2. **No Timer Logic**: Duration field exists but no countdown
3. **No Real Grading**: Results are pre-mocked
4. **Limited Question Types**: Only multiple choice
5. **No Image Support**: Questions text-only
6. **No Bulk Operations**: Individual exam operations only
7. **No Export**: Results cannot be exported
8. **No Analytics**: No performance tracking or reports

---

## Next Steps

### Immediate (Phase 2)
- [ ] Implement Firestore integration for exams
- [ ] Connect ExamEditor to backend API
- [ ] Implement exam question management
- [ ] Add real submission handling
- [ ] Create question types framework

### Short-term (Phase 3)
- [ ] Add timer with auto-submit
- [ ] Implement auto-save for answers
- [ ] Add question image support
- [ ] Student help/support system
- [ ] Performance analytics

### Medium-term (Phase 4)
- [ ] Advanced question types (matching, fill-blank, essay)
- [ ] Bulk upload exams/questions
- [ ] Exam scheduling and notifications
- [ ] Cheating detection
- [ ] Mobile app exposure

---

## References

- **API Spec**: `docs/exam-firestore-schema.md`
- **Backend Routes**: `src/routes/exams.ts` (API stubs)
- **Test Guide**: `tests/exam/components.test.tsx`
- **Redux Setup**: `src/features/exam/examSlice.ts`
