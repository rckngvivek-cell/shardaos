# 21_FRONTEND_IMPLEMENTATION.md

## School ERP Frontend Foundation - React 18 + TypeScript + Redux

**Status:** Ready for Week 2 Implementation  
**Tech Stack:** React 18 + TypeScript + Redux Toolkit + Material-UI v5  
**Ownership:** Frontend Agent — React shell, Redux, design system, responsive UX

---

## 1. PROJECT STRUCTURE

```
apps/
├── web/                                # React app
│   ├── src/
│   │   ├── index.tsx                   # Entry point
│   │   ├── App.tsx                     # Root component
│   │   ├── types/
│   │   │   ├── models.ts               # Domain types (Student, Teacher, etc.)
│   │   │   ├── api.ts                  # API request/response types
│   │   │   └── store.ts                # Redux types
│   │   ├── redux/
│   │   │   ├── store.ts                # Redux store configuration
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts        # Authentication state
│   │   │   │   ├── schoolSlice.ts      # School data
│   │   │   │   ├── studentSlice.ts     # Student data
│   │   │   │   ├── attendanceSlice.ts
│   │   │   │   ├── gradeSlice.ts
│   │   │   │   ├── feeSlice.ts
│   │   │   │   └── uiSlice.ts          # Loading, errors, notifications
│   │   │   ├── hooks.ts                # useAppDispatch, useAppSelector
│   │   │   └── api.ts                  # RTK Query API client
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   ├── SignupPage.tsx
│   │   │   │   └─ ProtectedRoute.tsx
│   │   │   ├── Shared/
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── NotificationToast.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── StudentDashboard.tsx
│   │   │   │   ├── TeacherDashboard.tsx
│   │   │   │   └── AdminDashboard.tsx
│   │   │   ├── Forms/
│   │   │   │   ├── AttendanceForm.tsx
│   │   │   │   ├── GradeForm.tsx
│   │   │   │   └── FeeForm.tsx
│   │   │   └── Common/
│   │   │       ├── Loading.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── EmptyState.tsx
│   │   ├── pages/
│   │   │   └── index.tsx               # Route definitions
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useSchool.ts
│   │   │   ├── useStudent.ts
│   │   │   └── useFetch.ts
│   │   ├── utils/
│   │   │   ├── api-client.ts           # API interceptor + JWT
│   │   │   ├── firebase.ts             # Firebase setup
│   │   │   ├── validators.ts           # Form validation
│   │   │   ├── formatters.ts           # Date, currency formatting
│   │   │   └── constants.ts            # App constants
│   │   ├── styles/
│   │   │   ├── theme.ts                # Material-UI theme
│   │   │   └── global.css
│   │   └── App.css
│   ├── public/
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── logo.png
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── .prettierrc
```

---

## 2. REDUX STORE SETUP

### Redux Architecture (RTK - Redux Toolkit)

```typescript
// src/redux/store.ts

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import schoolReducer from "./slices/schoolSlice";
import studentReducer from "./slices/studentSlice";
import attendanceReducer from "./slices/attendanceSlice";
import uiReducer from "./slices/uiSlice";
import { schoolErpApi } from "./api";

export const store = configureStore({
  reducer: {
    // Domain slices
    auth: authReducer,
    school: schoolReducer,
    student: studentReducer,
    attendance: attendanceReducer,

    // UI state
    ui: uiReducer,

    // RTK Query cache
    [schoolErpApi.reducerPath]: schoolErpApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(schoolErpApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### Auth Slice

```typescript
// src/redux/slices/authSlice.ts

import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  uid: string;
  email: string;
  displayName: string;
  role: "student" | "teacher" | "principal" | "finance" | "admin";
  school_id: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  token: string | null;
}

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  token: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
    },
  },
});

export const { setUser, setToken, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
```

---

## 3. RTK QUERY API CLIENT

```typescript
// src/redux/api.ts

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "./store";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const schoolErpApi = createApi({
  reducerPath: "schoolErpApi",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState;
      const token = state.auth.token;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  
  endpoints: (builder) => ({
    // Attendance endpoints
    markAttendance: builder.mutation({
      query: ({ schoolId, data }) => ({
        url: `/schools/${schoolId}/attendance/mark`,
        method: "POST",
        body: data,
      }),
    }),

    getStudentAttendance: builder.query({
      query: ({ schoolId, studentId, month }) => ({
        url: `/schools/${schoolId}/students/${studentId}/attendance`,
        params: { month },
      }),
    }),

    // Grades endpoints
    submitGrade: builder.mutation({
      query: ({ schoolId, data }) => ({
        url: `/schools/${schoolId}/grades/submit`,
        method: "POST",
        body: data,
      }),
    }),

    getStudentGrades: builder.query({
      query: ({ schoolId, studentId }) => ({
        url: `/schools/${schoolId}/students/${studentId}/grades`,
      }),
    }),

    // Fees endpoints
    getStudentInvoices: builder.query({
      query: ({ schoolId, studentId }) => ({
        url: `/schools/${schoolId}/fees/invoices/${studentId}`,
      }),
    }),
  }),
});

export const {
  useMarkAttendanceMutation,
  useGetStudentAttendanceQuery,
  useSubmitGradeMutation,
  useGetStudentGradesQuery,
  useGetStudentInvoicesQuery,
} = schoolErpApi;
```

---

## 4. AUTHENTICATION FLOW

### Firebase Config

```typescript
// src/utils/firebase.ts

import { initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Enable emulator in development
if (process.env.NODE_ENV === "development") {
  connectAuthEmulator(auth, "http://localhost:9099");
}
```

### Protected Route Component

```typescript
// src/components/Auth/ProtectedRoute.tsx

import React from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../redux/hooks";

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }

  return children;
};
```

---

## 5. MATERIAL-UI THEME

```typescript
// src/styles/theme.ts

import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",  // Blue
    },
    secondary: {
      main: "#f50057",  // Pink
    },
    success: {
      main: "#4caf50",  // Green
    },
    error: {
      main: "#f44336",  // Red
    },
    warning: {
      main: "#ff9800",  // Orange
    },
    info: {
      main: "#2196f3",  // Light blue
    },
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
    h1: {
      fontSize: "2.5rem",
      fontWeight: 600,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        },
      },
    },
  },
});
```

---

## 6. CORE PAGE COMPONENTS

### Login Page

```typescript
// src/components/Auth/LoginPage.tsx

import React, { useState } from "react";
import {
  Container,
  Card,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../utils/firebase";
import { useAppDispatch } from "../../redux/hooks";
import { setUser, setToken } from "../../redux/slices/authSlice";

export const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const idToken = await user.getIdToken();

      dispatch(setToken(idToken));
      dispatch(
        setUser({
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "User",
          role: "student", // Get from custom claims
          school_id: "", // Get from custom claims
        })
      );

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Card sx={{ p: 4 }}>
          <Typography variant="h4" align="center" sx={{ mb: 4 }}>
            School ERP Login
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleLogin}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 3 }}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </Card>
      </Box>
    </Container>
  );
};
```

### Student Dashboard

```typescript
// src/components/Dashboard/StudentDashboard.tsx

import React from "react";
import { Grid, Card, CardContent, Typography, Box, LinearProgress } from "@mui/material";
import { useAppSelector } from "../../redux/hooks";
import { useGetStudentAttendanceQuery, useGetStudentGradesQuery } from "../../redux/api";

export const StudentDashboard: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);

  if (!user) return <Typography>Loading...</Typography>;

  const { data: attendance } = useGetStudentAttendanceQuery(
    {
      schoolId: user.school_id,
      studentId: user.uid,
      month: new Date().toISOString().slice(0, 7),
    },
    { skip: !user }
  );

  const { data: grades } = useGetStudentGradesQuery(
    { schoolId: user.school_id, studentId: user.uid },
    { skip: !user }
  );

  const attendancePercentage = attendance?.percentage || 0;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4 }}>
        Welcome, {user.displayName}
      </Typography>

      <Grid container spacing={3}>
        {/* Attendance Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Attendance
              </Typography>
              <Typography variant="h5" sx={{ mb: 2 }}>
                {attendancePercentage.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={Math.min(attendancePercentage, 100)}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Grades Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Average Grade
              </Typography>
              <Typography variant="h5">
                {grades?.data[0]?.grade || "N/A"}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
```

---

## 7. RESPONSIVE LAYOUT

```typescript
// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { theme } from "./styles/theme";
import { LoginPage } from "./components/Auth/LoginPage";
import { StudentDashboard } from "./components/Dashboard/StudentDashboard";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
```

---

## 8. ENVIRONMENT VARIABLES

```bash
# .env.example

REACT_APP_API_URL=http://localhost:5000
REACT_APP_FIREBASE_API_KEY=***
REACT_APP_FIREBASE_AUTH_DOMAIN=school-erp-prod.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=school-erp-prod
REACT_APP_FIREBASE_STORAGE_BUCKET=school-erp-prod.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=***
REACT_APP_FIREBASE_APP_ID=***
```

---

## 9. PACKAGE.JSON DEPENDENCIES

```json
{
  "name": "school-erp-web",
  "version": "1.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "@mui/material": "^5.11.0",
    "@mui/icons-material": "^5.11.0",
    "@reduxjs/toolkit": "^1.9.2",
    "react-redux": "^8.1.0",
    "@reduxjs/toolkit/query": "^1.9.2",
    "firebase": "^9.17.0",
    "axios": "^1.3.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "react-scripts": "5.0.1"
  }
}
```

---

## 10. DEPLOYMENT & BUILD

```bash
# Build for production
npm run build

# Output: build/ folder ready for Cloud Run Dockerfile
```

---

**Status:** Frontend scaffold complete. Ready for feature implementation in Week 2.
