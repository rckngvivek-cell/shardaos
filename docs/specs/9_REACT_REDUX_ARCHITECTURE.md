# REACT & REDUX ARCHITECTURE - Frontend Structure
## Complete Folder Structure & State Management Design

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Production-Ready  

---

# PART 1: Folder Structure

```
src/
├── components/
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Loading.tsx
│   │   └── ErrorBoundary.tsx
│   │
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── SignupForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── ProtectedRoute.tsx
│   │
│   ├── students/
│   │   ├── StudentCard.tsx
│   │   ├── StudentForm.tsx
│   │   ├── StudentList.tsx
│   │   ├── StudentSearch.tsx
│   │   └── StudentDetail.tsx
│   │
│   ├── attendance/
│   │   ├── AttendanceForm.tsx
│   │   ├── AttendanceReport.tsx
│   │   ├── AttendanceChart.tsx
│   │   └── OfflineAttendance.tsx
│   │
│   ├── grades/
│   │   ├── GradeForm.tsx
│   │   ├── GradeBook.tsx
│   │   ├── ReportCard.tsx
│   │   └── ClassRankings.tsx
│   │
│   ├── exams/
│   │   ├── ExamForm.tsx
│   │   ├── ExamList.tsx
│   │   ├── MarksEntry.tsx
│   │   └── ExamResults.tsx
│   │
│   ├── dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── KPICard.tsx
│   │   ├── RecentActivity.tsx
│   │   └── AnalyticsChart.tsx
│   │
│   └── admin/
│       ├── SchoolSettings.tsx
│       ├── UserManagement.tsx
│       └── FeatureToggle.tsx
│
├── pages/
│   ├── AuthPage.tsx
│   ├── DashboardPage.tsx
│   ├── StudentsPage.tsx
│   ├── AttendancePage.tsx
│   ├── GradesPage.tsx
│   ├── ExamsPage.tsx
│   ├── SettingsPage.tsx
│   └── NotFoundPage.tsx
│
├── hooks/
│   ├── useAuth.ts
│   ├── useStudents.ts
│   ├── useAttendance.ts
│   ├── useGrades.ts
│   ├── useOfflineSync.ts
│   ├── useLocalStorage.ts
│   └── useDebounce.ts
│
├── redux/
│   ├── store.ts
│   │
│   ├── slices/
│   │   ├── authSlice.ts
│   │   ├── studentsSlice.ts
│   │   ├── attendanceSlice.ts
│   │   ├── gradesSlice.ts
│   │   ├── examsSlice.ts
│   │   ├── uiSlice.ts
│   │   └── offlineSlice.ts
│   │
│   ├── selectors/
│   │   ├── authSelectors.ts
│   │   ├── studentSelectors.ts
│   │   ├── attendanceSelectors.ts
│   │   └── gradeSelectors.ts
│   │
│   └── thunks/
│       ├── authThunks.ts
│       ├── studentThunks.ts
│       ├── attendanceThunks.ts
│       └── gradeThunks.ts
│
├── services/
│   ├── api.ts (Axios configured instance)
│   ├── auth.service.ts
│   ├── students.service.ts
│   ├── attendance.service.ts
│   ├── grades.service.ts
│   ├── exams.service.ts
│   ├── storage.service.ts (localStorage, indexedDB)
│   └── sync.service.ts (offline sync)
│
├── utils/
│   ├── constants.ts
│   ├── helpers.ts
│   ├── formatters.ts (date, currency, etc.)
│   ├── validators.ts
│   ├── logger.ts
│   └── errorHandler.ts
│
├── styles/
│   ├── globals.css
│   ├── variables.css
│   ├── components.css
│   └── responsive.css
│
└── App.tsx
└── index.tsx
```

---

# PART 2: Redux Store Schema

## File: `src/redux/store.ts`

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import studentsReducer from './slices/studentsSlice';
import attendanceReducer from './slices/attendanceSlice';
import gradesReducer from './slices/gradesSlice';
import examsReducer from './slices/examsSlice';
import uiReducer from './slices/uiSlice';
import offlineReducer from './slices/offlineSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentsReducer,
    attendance: attendanceReducer,
    grades: gradesReducer,
    exams: examsReducer,
    ui: uiReducer,
    offline: offlineReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/setUser'], // Ignore non-serializable Date objects
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

---

# PART 3: Redux Slices

## File: `src/redux/slices/authSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { authThunks } from '../thunks/authThunks';

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'principal' | 'teacher' | 'parent';
  schoolId: string;
  photoURL?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  loading: false,
  error: null,
  isAuthenticated: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(authThunks.login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(authThunks.login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(authThunks.login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Login failed';
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
```

## File: `src/redux/slices/studentsSlice.ts`

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { studentThunks } from '../thunks/studentThunks';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dob: Date;
  class: number;
  section: string;
  rollNumber: string;
  status: 'active' | 'inactive';
  contact: {
    parentEmail: string;
    parentPhone: string;
  };
}

interface StudentsState {
  items: Student[];
  selectedStudent: Student | null;
  loading: boolean;
  error: string | null;
  filters: {
    class?: number;
    section?: string;
    status?: 'active' | 'inactive';
    searchQuery?: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: StudentsState = {
  items: [],
  selectedStudent: null,
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 0,
    limit: 20,
    total: 0,
  },
};

export const studentsSlice = createSlice({
  name: 'students',
  initialState,
  reducers: {
    setFilter: (state, action: PayloadAction<Partial<StudentsState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
      state.pagination.page = 0; // Reset to first page
    },
    selectStudent: (state, action: PayloadAction<Student | null>) => {
      state.selectedStudent = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch students
    builder
      .addCase(studentThunks.fetchStudents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(studentThunks.fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.students;
        state.pagination.total = action.payload.total;
      })
      .addCase(studentThunks.fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch students';
      });
  },
});

export const { setFilter, selectStudent, clearError } = studentsSlice.actions;
export default studentsSlice.reducer;
```

---

# PART 4: Selectors

## File: `src/redux/selectors/studentSelectors.ts`

```typescript
import { RootState } from '../store';

export const selectStudents = (state: RootState) => state.students.items;
export const selectSelectedStudent = (state: RootState) => state.students.selectedStudent;
export const selectStudentsLoading = (state: RootState) => state.students.loading;
export const selectStudentsError = (state: RootState) => state.students.error;
export const selectStudentFilters = (state: RootState) => state.students.filters;
export const selectPagination = (state: RootState) => state.students.pagination;

// Selector for filtered students
export const selectFilteredStudents = (state: RootState) => {
  const { items, filters } = state.students;
  return items.filter((student) => {
    if (filters.class && student.class !== filters.class) return false;
    if (filters.section && student.section !== filters.section) return false;
    if (filters.status && student.status !== filters.status) return false;
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return (
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        student.rollNumber.includes(query)
      );
    }
    return true;
  });
};

// Selector for class statistics
export const selectClassStatistics = (state: RootState) => {
  const students = state.students.items;
  const byClass = {} as Record<number, number>;
  
  students.forEach((student) => {
    byClass[student.class] = (byClass[student.class] || 0) + 1;
  });
  
  return byClass;
};
```

---

# PART 5: Hooks

## File: `src/hooks/useStudents.ts`

```typescript
import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { AppDispatch } from '@/redux/store';
import { studentThunks } from '@/redux/thunks/studentThunks';
import {
  selectStudents,
  selectStudentsLoading,
  selectStudentsError,
  selectFilteredStudents,
} from '@/redux/selectors/studentSelectors';
import { setFilter, selectStudent } from '@/redux/slices/studentsSlice';

export const useStudents = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const students = useSelector(selectStudents);
  const filteredStudents = useSelector(selectFilteredStudents);
  const loading = useSelector(selectStudentsLoading);
  const error = useSelector(selectStudentsError);

  const fetchStudents = useCallback(
    (filters?: any) => {
      dispatch(studentThunks.fetchStudents(filters));
    },
    [dispatch]
  );

  const createStudent = useCallback(
    (schoolId: string, studentData: any) => {
      return dispatch(studentThunks.createStudent({ schoolId, studentData }));
    },
    [dispatch]
  );

  const updateStudent = useCallback(
    (schoolId: string, studentId: string, updates: any) => {
      return dispatch(studentThunks.updateStudent({ schoolId, studentId, updates }));
    },
    [dispatch]
  );

  const deleteStudent = useCallback(
    (schoolId: string, studentId: string) => {
      return dispatch(studentThunks.deleteStudent({ schoolId, studentId }));
    },
    [dispatch]
  );

  const setFilters = useCallback(
    (filters: any) => {
      dispatch(setFilter(filters));
    },
    [dispatch]
  );

  const selectStudentRecord = useCallback(
    (student: any) => {
      dispatch(selectStudent(student));
    },
    [dispatch]
  );

  return {
    students,
    filteredStudents,
    loading,
    error,
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    setFilters,
    selectStudentRecord,
  };
};
```

---

# PART 6: React Components

## File: `src/components/students/StudentList.tsx`

```typescript
import React, { useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import StudentCard from './StudentCard';
import Loading from '@/components/common/Loading';

interface StudentListProps {
  class?: number;
  section?: string;
}

const StudentList: React.FC<StudentListProps> = ({ class: classNum, section }) => {
  const {
    filteredStudents,
    loading,
    error,
    fetchStudents,
    setFilters,
  } = useStudents();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (classNum || section) {
      setFilters({ class: classNum, section });
    }
  }, [classNum, section]);

  if (loading) return <Loading />;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="student-list">
      <h2>Students</h2>
      <div className="grid">
        {filteredStudents.map((student) => (
          <StudentCard key={student.id} student={student} />
        ))}
      </div>
      {filteredStudents.length === 0 && <p>No students found</p>}
    </div>
  );
};

export default StudentList;
```

---

# PART 7: API Service

## File: `src/services/api.ts`

```typescript
import axios, { AxiosInstance } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080/api/v1',
  timeout: 10000,
});

// Add Firebase token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('firebaseToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      localStorage.removeItem('firebaseToken');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

**This React + Redux architecture supports scalability, offline-first capability, and clean separation of concerns.**
