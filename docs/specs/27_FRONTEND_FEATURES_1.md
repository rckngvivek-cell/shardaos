# 27_FRONTEND_FEATURES_1.md — Week 2 Student Portal Implementation

**Date:** April 9, 2026  
**Sprint:** Week 2  
**Module:** Student Portal (Frontend)  
**Owner:** Frontend Agent  
**Status:** Implementation Phase  

---

## Executive Summary

Week 2 focuses on building the complete Student Portal—the primary interface where students interact with the ERP system. This module delivers 5 core feature pages, 5 supporting components, and Redux + RTK Query integration for efficient state management and data fetching.

**Key Success Metrics:**
- 5 complete portal pages + supporting components operational
- <1s initial load time (Lighthouse >80)
- 60% reduction in API calls via RTK Query caching
- Zero prop-drilling (Redux centralized state)
- 100% mobile responsive (320px–1024px+)
- Zero console errors/warnings

---

## Architecture Overview

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **State Management** | Redux Toolkit (RTK) | Centralized state, predictable flow |
| **Data Fetching** | RTK Query | Caching, automatic refetching, normalized state |
| **UI Components** | Material-UI (MUI) v5+ | Pre-built accessibility, theming, responsive |
| **Charts** | Recharts | Lightweight, React-friendly charting |
| **Routing** | React Router v6+ | Protected routes, lazy code-splitting |
| **Payment** | Razorpay API | Payment gateway for fee collection |
| **PDF Generation** | Cloud Function (via API) | Server-side PDF rendering (reports, receipts) |
| **CSV Export** | Client-side (Papa Parse) | Fast attendance/grade export |
| **Icons** | Material-UI Icons | Consistent icon system |
| **Forms** | React Hook Form + Zod | Lightweight validation, minimal re-renders |

---

## Component Specifications (Part 1)

### 1. StudentDashboard Component
**Location:** `apps/web/src/pages/student/StudentDashboard.tsx`

**Features:**
- Multi-school support with dropdown selector
- Student profile card (name, roll, class, photo from Cloud Storage)
- 4 KPI cards: Attendance %, Pending Fees, Upcoming Exams, Announcements
- Recent announcements feed (last 5, pagination)
- Upcoming 7-day class schedule
- Responsive (1024px desktop → 320px mobile)
- Redux state: `studentSlice` (profile, school, class)
- RTK Query hooks: `useGetAnnouncementsQuery()`, `useGetScheduleQuery()`
- Error boundaries + Suspense boundaries with skeleton loaders

**Code Pattern:**
```typescript
// useAppSelector for state
const { profile, school } = useAppSelector(state => state.student);

// useAppDispatch for actions
dispatch(studentSlice.actions.setSchool(newSchoolId));

// RTK Query with caching
const { data: announcements } = useGetAnnouncementsQuery();
```

### 2. AttendanceView Component
**Location:** `apps/web/src/pages/student/AttendanceView.tsx`

**Features:**
- Attendance records table: 30 rows/page with pagination
- Monthly attendance % bar chart (75% threshold line)
- Attendance policy info box with at-risk warnings
- Filter by month + class, sort by date
- Download attendance as CSV
- Color-coded status: Green (Present), Red (Absent), Yellow (Leave)
- Redux state: `attendanceSlice` (records, filter, pagination)
- RTK Query: `useGetAttendanceQuery()` with pagination support
- Responsive table (mobile: horizontal scroll or card layout)

### 3. GradesView Component
**Location:** `apps/web/src/pages/student/GradesView.tsx`

**Features:**
- Subject-wise grades table (Subject, Exam Type, Marks, Grade, %)
- GPA calculation: (Σ Grade Points) / Total Subjects
- Performance trends line chart (last 10 exams)
- Class average comparison bars (Your Score vs Class Avg)
- Filter by subject + exam type, sort by score
- Download transcript as PDF (Cloud Function)
- View report card (if available)
- At-risk indicator if average <40%
- Redux state: `gradesSlice` (records, gpa, trends, filter)
- RTK Query: `useGetGradesQuery()` with filter support

### 4. FeesView Component
**Location:** `apps/web/src/pages/student/FeesView.tsx`

**Features:**
- Invoice list: Amount | Due Date | Status (Paid/Pending)
- Payment history table with receipt links
- Outstanding balance card (₹X)
- Next due date highlighted prominently
- Pay button → Razorpay modal (integrated payment gateway)
- Download invoice + receipt PDFs
- SMS/Email reminders opt-in/out section
- Redux state: `feesSlice` (invoices, payments, balance)
- RTK Query: `useGetFeesQuery()`, `useMakePaymentMutation()`
- Payment confirmation snackbar (success/error)

### 5. ExamsView Component
**Location:** `apps/web/src/pages/student/ExamsView.tsx`

**Features:**
- Upcoming exams list (Date, Time, Subject, Location)
- Calendar view of exam schedule
- Download admit card (if released)
- Exam instructions + syllabus links
- Previous exam results (if available)
- Download exam timetable PDF
- Redux state: `examsSlice` (upcoming, results, schedule)
- RTK Query: `useGetExamsQuery()`

### 6. RouteAuth & PermissionGuard Components
**Location:** `apps/web/src/components/RouteAuth.tsx`

**Purpose:** Protect routes, verify student JWT claims

**Features:**
- Check `JWT custom claims: role === 'student'`
- Redirect unauthenticated → login page
- Redirect unauthorized → 403 error page
- Session timeout handling: 5-min warning, auto-logout
- Token refresh on API call (RTK Query middleware)

```typescript
export const ProtectedStudentRoute: React.FC = ({ children }) => {
  const auth = useAuth(); // from Firebase Auth context
  
  if (!auth.token) return <Navigate to="/login" />;
  if (auth.role !== 'student') return <ForbiddenPage />;
  
  return <>{children}</>;
};
```

### 7. Redux State Management

**Slices needed:**
```typescript
// studentSlice
interface StudentState {
  profile: { id, name, enrollmentDate, status, ... }
  school: { id, name, logo }
  class: string
  section: string
}

// attendanceSlice
interface AttendanceState {
  records: Attendance[]
  filter: { month?, class? }
  pagination: { currentPage, pageSize, total }
  loading: boolean
}

// gradesSlice
interface GradesState {
  records: Grade[]
  gpa: number
  trends: TrendData[]
  filter: { subject?, examType? }
  loading: boolean
}

// feesSlice
interface FeesState {
  invoices: Invoice[]
  payments: Payment[]
  balance: number
  loading: boolean
}

// examsSlice
interface ExamsState {
  upcoming: Exam[]
  results: ExamResult[]
  schedule: ScheduleEvent[]
  loading: boolean
}

// uiSlice
interface UIState {
  sidebarOpen: boolean
  darkMode: boolean
  activeTab: string
  notifications: Notification[]
}
```

### 8. RTK Query API Hooks

```typescript
// API hooks with auto-caching
useGetStudentQuery(schoolId, studentId)
useGetAttendanceQuery(filter, pagination)
useGetGradesQuery(studentId, filter)
useGetFeesQuery(studentId)
useGetExamsQuery(schoolId, classId)
useGetAnnouncementsQuery()
useGetScheduleQuery(studentId, classId, days)

// Mutations
useMakePaymentMutation() → Razorpay
useDownloadTranscriptMutation()
useDownloadReportCardMutation()
```

### 9. Material-UI Integration

**Components Used:**
- `Card`, `CardContent` for content containers
- `Table`, `TableHead`, `TableBody`, `TableRow` for data tables
- `Select`, `Dropdown` for filters
- `Dialog` for modals (payment confirmation, receipt view)
- `Snackbar` for notifications (payment success/error)
- `Chip` for status indicators
- `Alert` for policy warnings
- `Skeleton` for loading placeholders
- `LinearProgress` for GPA scale
- `Pagination` for table pagination
- `Grid`, `Box` for responsive layouts

### 10. Responsive Design

**Breakpoints:**
- **Mobile (320px–640px):** Single column, hamburger menu, card-based layouts
- **Tablet (640px–1024px):** 2-column layouts, condensed tables
- **Desktop (1024px+):** Full tables, side-by-side charts, full features

**Mobile Optimizations:**
- Touch-friendly buttons (44px+ tap targets)
- Swipeable tabs
- Horizontal scroll tables (or card-based)
- Hamburger navigation menu
- Bottom sheet for modals

---

## Integration Points

### With Backend API (Cloud Run)

**Endpoints Used:**
```
GET /api/v1/schools/{schoolId}/students/{studentId}
GET /api/v1/schools/{schoolId}/students/{studentId}/attendance
GET /api/v1/schools/{schoolId}/students/{studentId}/grades
GET /api/v1/schools/{schoolId}/bills/{studentId}
GET /api/v1/schools/{schoolId}/exams
POST /api/v1/schools/{schoolId}/fees/pay (Razorpay webhook)
POST /api/v1/export/transcript
```

### With Firestore (Real-Time Listeners)

**Collections Subscribed:**
- `schools/{schoolId}/announcements` (real-time feed)
- `schools/{schoolId}/schedule` (calendar updates)
- `schools/{schoolId}/fees/{studentId}` (fee updates)

### With External Services

**Razorpay Integration:**
```typescript
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET
});

const handlePayment = async (amount: number) => {
  const options = {
    key: process.env.VITE_RAZORPAY_KEY,
    amount: amount * 100, // Convert to paise
    currency: 'INR',
    name: 'School ERP',
    description: 'Fee Payment',
    handler: (response) => {
      // Verify payment on backend
      // Update feesSlice on success
    }
  };
  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

---

## Performance Optimization

**RTK Query Benefits:**
- Automatic caching: repeated requests served from cache
- Background refetching: keeps data fresh without user action
- Normalized state: each entity stored once
- Reduced API calls: 60% reduction compared to naive fetch

**Code-Splitting:**
```typescript
const StudentDashboard = lazy(() => import('./StudentDashboard'));
const AttendanceView = lazy(() => import('./AttendanceView'));
// Loaded on-demand when route accessed
```

**Memoization:**
```typescript
const calculateGPA = useMemo(() => { ... }, [records]);
const filteredRecords = useMemo(() => { ... }, [records, filter]);
```

**Image Optimization:**
- Cloud Storage signed URLs with `.jpg?w=400&q=80` query params
- WebP format preference (with JPG fallback)
- Lazy load profile photos

---

##Success Criteria (Week 2)

- [ ] All 5 portal pages rendering without errors
- [ ] Redux DevTools shows all state changes correctly
- [ ] RTK Query cache working (repeated requests instant)
- [ ] Payment flow tested end-to-end (Razorpay sandbox)
- [ ] <1s initial load time (Lighthouse Perf >80)
- [ ] All API calls return 200-series status codes
- [ ] Zero console warnings/errors
- [ ] Mobile responsive on 320px, 768px, 1024px viewports
- [ ] Cypress E2E tests passing for login → view grades → pay fee workflow

---

## Summary of Deliverables

**Components:** 7 (Dashboard, Attendance, Grades, Fees, Exams, RouteAuth, PermissionGuard)  
**Redux Slices:** 6 (student, attendance, grades, fees, exams, ui)  
**RTK Query Endpoints:** 10+ (GET student, attendance, grades, fees, exams, announcements, schedule)  
**Material-UI Components Used:** 20+  
**Total Lines of Code (Est.):** 3,500–4,000 TypeScript + JSX  
**Test Coverage:** 70%+ (unit + integration)  

**Handoff:** Production-ready code for deployment April 16, 2026.
