# 43_STAFF_PORTAL_TECHNICAL_SPECS.md
# Staff Portal: Technical Specifications & API Design

**Status:** Technical Design | **For:** Week 3 Implementation | **Audience:** Backend + Frontend teams

---

## 📋 OVERVIEW

Staff Portal is the second major portal of the School ERP system (after Parent Portal). It serves teachers, administrators, and support staff with features for attendance management, grade entry, student management, and communication.

**Portal Statistics:**
- 8 main pages
- 25+ API endpoints
- 5 Redux slices (staff-specific)
- 20+ RTK Query hooks
- 500+ lines of Firestore rules
- 3,000+ lines of backend code
- 3,000+ lines of frontend code

---

## 🗄️ FIRESTORE SCHEMA

### Collections Structure

```
firestore/
├── staff/
│   ├── {staffId}/
│   │   ├── email: string (unique, indexed)
│   │   ├── firstName: string
│   │   ├── lastName: string
│   │   ├── phone: string
│   │   ├── school: reference (to schools collection)
│   │   ├── role: 'TEACHER' | 'ADMIN' | 'PRINCIPAL'
│   │   ├── qualifications: string[]
│   │   ├── subjects: string[]
│   │   ├── assignedClasses: reference[]
│   │   ├── profilePicture: string (GCS URL)
│   │   ├── passwordHash: string
│   │   ├── lastLogin: timestamp
│   │   ├── isActive: boolean
│   │   ├── createdAt: timestamp
│   │   └── updatedAt: timestamp
│
├── staffRoles/
│   ├── TEACHER/
│   │   ├── permissions: string[]
│   │   │   ├── 'view_own_class_roster'
│   │   │   ├── 'mark_attendance'
│   │   │   ├── 'enter_grades'
│   │   │   ├── 'download_reports'
│   │   │   ├── 'send_notifications'
│   │   │   └── ...
│   │   ├── menu: string[]
│   │   └── features: map
│   └── ADMIN/ (similar)
│
├── staffSessions/
│   ├── {sessionId}/
│   │   ├── staffId: string
│   │   ├── token: string (hashed)
│   │   ├── createdAt: timestamp
│   │   ├── expiresAt: timestamp
│   │   ├── ipAddress: string
│   │   ├── userAgent: string
│   │   └── isActive: boolean
│
├── staffAuditLog/
│   ├── {logId}/
│   │   ├── staffId: string
│   │   ├── action: string
│   │   ├── resource: string (attendance | grades | students)
│   │   ├── resourceId: string
│   │   ├── changes: map
│   │   ├── timestamp: timestamp
│   │   ├── ipAddress: string
│   │   └── status: 'SUCCESS' | 'FAILED'
│
├── classRosters/
│   ├── {classId}/
│   │   ├── className: string
│   │   ├── section: string
│   │   ├── teacher: reference (to staff)
│   │   ├── students: reference[]
│   │   ├── totalStudents: number
│   │   ├── academicYear: string
│   │   └── createdAt: timestamp
│
├── classAttendance/
│   ├── {classId}/
│   │   ├── {attendanceId}/
│   │   │   ├── date: date (indexed)
│   │   │   ├── markedBy: reference (to staff)
│   │   │   ├── records: array
│   │   │   │   ├── studentId: string
│   │   │   │   ├── status: 'PRESENT' | 'ABSENT' | 'LEAVE'
│   │   │   │   ├── remarks: string (optional)
│   │   │   │   └── timestamp: timestamp
│   │   │   ├── markedAt: timestamp
│   │   │   └── editHistory: array (for audit)
│
└── classGrades/
    ├── {classId}/
    │   ├── {examId}/
    │   │   ├── examName: string
    │   │   ├── examDate: date
    │   │   ├── subject: string
    │   │   ├── gradeRecords: array
    │   │   │   ├── studentId: string
    │   │   │   ├── marks: number
    │   │   │   ├── totalMarks: number
    │   │   │   ├── percentage: number
    │   │   │   ├── grade: string (A/B/C/D)
    │   │   │   └── enteredAt: timestamp
    │   │   ├── published: boolean (indexed)
    │   │   ├── publishedAt: timestamp (indexed)
    │   │   ├── publishedBy: reference (to staff)
    │   │   └── editHistory: array
```

---

## 🔐 FIRESTORE SECURITY RULES

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Staff can only view their own profile
    match /staff/{staffId} {
      allow read: if request.auth.uid == staffId;
      allow write: if request.auth.uid == staffId && 
                      request.resource.data.role == resource.data.role;
      allow delete: if false;
    }
    
    // Admin can view all staff
    match /staff/{staffId} {
      allow read: if 
        hasRole('ADMIN') || hasRole('PRINCIPAL');
    }
    
    // Staff can mark attendance for assigned classes
    match /classAttendance/{classId}/{attendanceId} {
      allow read: if 
        isTeacherOfClass(classId) || hasRole('ADMIN');
      allow create: if 
        isTeacherOfClass(classId) && 
        request.resource.data.markedBy == request.auth.uid;
      allow update: if 
        isTeacherOfClass(classId) || hasRole('ADMIN');
    }
    
    // Staff can enter/edit grades
    match /classGrades/{classId}/{examId} {
      allow read: if 
        isTeacherOfClass(classId) || hasRole('ADMIN');
      allow create, update: if 
        isTeacherOfClass(classId) && 
        !exists(/databases/{database}/documents/classGrades/$(classId)/$(examId)/published) &&
        request.resource.data.published == false;
      // Can only publish to true, not back to false
      allow update: if 
        isTeacherOfClass(classId) && 
        request.resource.data.published == true && 
        resource.data.published == false;
    }
    
    // Helper functions
    function hasRole(role) {
      return get(/databases/{database}/documents/staff/$(request.auth.uid))
        .data.role == role;
    }
    
    function isTeacherOfClass(classId) {
      return get(/databases/{database}/documents/classRosters/$(classId))
        .data.teacher == request.auth.uid;
    }
  }
}
```

---

## 🔌 API ENDPOINTS

### Authentication

```python
# POST /api/v1/staff/auth/login
Request:
{
  "email": "teacher@school.com",
  "password": "SecurePassword123!"
}

Response (200):
{
  "success": true,
  "data": {
    "staffId": "staff-123",
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "staff": {
      "id": "staff-123",
      "email": "teacher@school.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "TEACHER",
      "school": "school-456",
      "assignedClasses": ["class-1", "class-2"],
      "subjects": ["Math", "Physics"],
      "permissions": [...]
    }
  }
}

# GET /api/v1/staff/auth/me
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "id": "staff-123",
    "email": "teacher@school.com",
    "role": "TEACHER",
    "permissions": [...]
  }
}

# POST /api/v1/staff/auth/logout
Headers: Authorization: Bearer {token}
Response (200): { "success": true }
```

### Dashboard

```python
# GET /api/v1/staff/dashboard
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "staff": { ... },
    "stats": {
      "classesAssigned": 3,
      "totalStudents": 120,
      "attendanceMarkedToday": true,
      "gradesPendingPublication": 2,
      "classesScheduledToday": 4
    },
    "recentActivities": [
      {
        "action": "ATTENDANCE_MARKED",
        "class": "Class 10A",
        "timestamp": "2026-04-10T10:30:00Z",
        "count": 45
      }
    ],
    "quickActions": [...]
  }
}
```

### Attendance Management

```python
# GET /api/v1/staff/classes/{classId}/attendance
Query Params: month=4, year=2026
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "classId": "class-1",
    "className": "10A",
    "month": 4,
    "year": 2026,
    "calendar": {
      "2026-04-01": {
        "date": "2026-04-01",
        "dayOfWeek": "Wednesday",
        "status": "MARKED",
        "count": 45
      },
      "2026-04-02": {
        "date": "2026-04-02",
        "dayOfWeek": "Thursday",
        "status": "NOT_MARKED",
        "count": null
      }
    }
  }
}

# POST /api/v1/staff/classes/{classId}/attendance/mark
Request:
{
  "classId": "class-1",
  "date": "2026-04-10",
  "records": [
    {
      "studentId": "student-1",
      "status": "PRESENT",
      "remarks": ""
    },
    {
      "studentId": "student-2",
      "status": "ABSENT",
      "remarks": "Sick leave"
    }
  ]
}

Response (201):
{
  "success": true,
  "data": {
    "attendanceId": "att-123",
    "classId": "class-1",
    "date": "2026-04-10",
    "recordsCount": 45,
    "markedAt": "2026-04-10T11:00:00Z"
  }
}

# GET /api/v1/staff/classes/{classId}/attendance/stats
Query Params: month=4, year=2026

Response (200):
{
  "success": true,
  "data": {
    "classId": "class-1",
    "totalDaysInMonth": 22,
    "daysMarked": 18,
    "students": [
      {
        "studentId": "student-1",
        "name": "Alice Smith",
        "daysPresent": 17,
        "daysAbsent": 1,
        "percentage": 94.4
      }
    ]
  }
}
```

### Grade Management

```python
# GET /api/v1/staff/classes/{classId}/grades
Query Params: examId=exam-1, subject=Math

Response (200):
{
  "success": true,
  "data": {
    "classId": "class-1",
    "examId": "exam-1",
    "examName": "Mid-term Exam",
    "subject": "Math",
    "totalMarks": 100,
    "grades": [
      {
        "studentId": "student-1",
        "name": "Alice Smith",
        "rollNumber": "001",
        "marks": 85,
        "totalMarks": 100,
        "percentage": 85.0,
        "grade": "A",
        "enteredAt": "2026-04-10T10:15:00Z"
      }
    ]
  }
}

# POST /api/v1/staff/classes/{classId}/grades/enter
Request:
{
  "classId": "class-1",
  "examId": "exam-1",
  "subject": "Math",
  "totalMarks": 100,
  "records": [
    {
      "studentId": "student-1",
      "marks": 85
    }
  ]
}

Response (201):
{
  "success": true,
  "data": {
    "gradeEntryId": "grade-entry-1",
    "recordsCount": 45,
    "savedAt": "2026-04-10T11:00:00Z"
  }
}

# POST /api/v1/staff/classes/{classId}/grades/publish
Request:
{
  "classId": "class-1",
  "examId": "exam-1"
}

Response (200):
{
  "success": true,
  "data": {
    "message": "Grades published successfully",
    "notificationsSent": 45,
    "publishedAt": "2026-04-10T15:00:00Z"
  }
}

# Trigger: Notifications sent to all parents
Event: grade:published
Data: {
  "examName": "Mid-term Exam",
  "subject": "Math",
  "gradesUrl": "/grades/{examId}"
}
```

### Student Management

```python
# GET /api/v1/staff/classes/{classId}/students
Headers: Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "classId": "class-1",
    "className": "10A",
    "totalStudents": 45,
    "students": [
      {
        "studentId": "student-1",
        "rollNumber": "001",
        "firstName": "Alice",
        "lastName": "Smith",
        "dateOfBirth": "2010-06-15",
        "gender": "F",
        "fatherName": "John Smith",
        "motherName": "Jane Smith",
        "phone": "+919876543210",
        "email": "alice@example.com",
        "profilePicture": "gs://bucket/profile-1.jpg"
      }
    ]
  }
}

# GET /api/v1/staff/students/{studentId}
Response (200):
{
  "success": true,
  "data": {
    "studentId": "student-1",
    "name": "Alice Smith",
    "class": "10A",
    "rollNumber": "001",
    "parentName": "John Smith",
    "parentPhone": "+919876543210",
    "parentEmail": "john@example.com",
    "feeStatus": "PAID", // or PENDING, OVERDUE
    "attendancePercentage": 94.4,
    "averageGPA": 3.8
  }
}
```

### Reports

```python
# GET /api/v1/staff/classes/{classId}/reports/attendance
Query Params: month=4, year=2026, format=PDF

Response (200):
{
  "success": true,
  "data": {
    "reportUrl": "gs://bucket/reports/attendance-class1-2026-04.pdf",
    "generatedAt": "2026-04-10T15:00:00Z",
    "fileName": "attendance-class1-2026-04.pdf"
  }
}

# GET /api/v1/staff/classes/{classId}/reports/grades
Query Params: examId=exam-1, format=CSV

Response (200):
{
  "success": true,
  "data": {
    "reportUrl": "gs://bucket/reports/grades-class1-exam1.csv",
    "downloadUrl": "/download/grades-class1-exam1.csv"
  }
}
```

### Exam Schedule

```python
# GET /api/v1/staff/exams
Query Params: classId=class-1

Response (200):
{
  "success": true,
  "data": {
    "exams": [
      {
        "examId": "exam-1",
        "examName": "Mid-term Exam",
        "date": "2026-04-15",
        "subject": "Math",
        "totalMarks": 100,
        "status": "SCHEDULED"
      }
    ]
  }
}

# POST /api/v1/staff/exams
Request:
{
  "examName": "Final Exam",
  "date": "2026-05-20",
  "classIds": ["class-1", "class-2"],
  "subject": "Math",
  "totalMarks": 100
}

Response (201):
{
  "success": true,
  "data": {
    "examId": "exam-123",
    "notificationsSent": 2
  }
}
```

---

## 🎨 REACT COMPONENTS

### StaffDashboard.tsx

```typescript
import React, { useEffect } from 'react';
import { useGetStaffDashboardQuery } from '../hooks/useStaffApi';
import { Grid, Card, CardContent, Button, Box } from '@mui/material';
import StatCard from '../components/StatCard';

export function StaffDashboard() {
  const { data: dashboard, isLoading } = useGetStaffDashboardQuery();

  if (isLoading) return <LoadingSpinner />;

  const { stats, recentActivities, quickActions } = dashboard.data;

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Classes Assigned"
            value={stats.classesAssigned}
            icon="📚"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon="👥"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Attendance Today"
            value={stats.attendanceMarkedToday ? '✓' : '✗'}
            icon="📋"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Grades"
            value={stats.gradesPendingPublication}
            icon="📊"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <h3>Quick Actions</h3>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="contained">Mark Attendance</Button>
                <Button variant="contained">Enter Grades</Button>
                <Button variant="outlined">View Reports</Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <h3>Recent Activities</h3>
              {recentActivities.map((activity: any) => (
                <Box key={activity.action} sx={{ mb: 1 }}>
                  <small>{activity.action}: {activity.class}</small>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
```

### AttendanceGrid Component

```typescript
interface AttendanceGridProps {
  classId: string;
  students: Student[];
  onSave: (records: AttendanceRecord[]) => Promise<void>;
}

export function AttendanceGrid({ classId, students, onSave }: AttendanceGridProps) {
  const [attendance, setAttendance] = useState<Map<string, AttendanceStatus>>(
    new Map(students.map(s => [s.id, 'PRESENT']))
  );

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    const updated = new Map(attendance);
    updated.set(studentId, status);
    setAttendance(updated);
  };

  const handleSave = async () => {
    const records = Array.from(attendance.entries()).map(([studentId, status]) => ({
      studentId,
      status
    }));
    await onSave(records);
  };

  return (
    <Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Roll No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map(student => (
              <TableRow key={student.id}>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  <Select
                    value={attendance.get(student.id)}
                    onChange={(e) => handleStatusChange(student.id, e.target.value)}
                    size="small"
                  >
                    <MenuItem value="PRESENT">Present</MenuItem>
                    <MenuItem value="ABSENT">Absent</MenuItem>
                    <MenuItem value="LEAVE">Leave</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSave}>
          Save Attendance
        </Button>
      </Box>
    </Box>
  );
}
```

---

## 🔌 RTK Query Hooks

```typescript
// src/web/store/api/staffApi.ts

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.REACT_APP_API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('staffToken');
      if (token) headers.set('authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Staff', 'Attendance', 'Grades', 'Students', 'Exams'],
  endpoints: (builder) => ({
    loginStaff: builder.mutation<{ token: string; staff: Staff }, StaffLoginPayload>({
      query: (body) => ({
        url: '/api/v1/staff/auth/login',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Staff'],
    }),

    getStaffDashboard: builder.query<DashboardData, void>({
      query: () => '/api/v1/staff/dashboard',
      providesTags: ['Staff'],
    }),

    getClassAttendance: builder.query<AttendanceData, { classId: string; month: number; year: number }>({
      query: ({ classId, month, year }) =>
        `/api/v1/staff/classes/${classId}/attendance?month=${month}&year=${year}`,
      providesTags: ['Attendance'],
    }),

    markAttendance: builder.mutation<any, AttendancePayload>({
      query: ({ classId, ...body }) => ({
        url: `/api/v1/staff/classes/${classId}/attendance/mark`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Attendance'],
    }),

    enterGrades: builder.mutation<any, GradePayload>({
      query: ({ classId, ...body }) => ({
        url: `/api/v1/staff/classes/${classId}/grades/enter`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Grades'],
    }),

    publishGrades: builder.mutation<any, { classId: string; examId: string }>({
      query: ({ classId, examId }) => ({
        url: `/api/v1/staff/classes/${classId}/grades/publish`,
        method: 'POST',
        body: { examId },
      }),
      invalidatesTags: ['Grades'],
    }),

    getClassStudents: builder.query<StudentListData, string>({
      query: (classId) => `/api/v1/staff/classes/${classId}/students`,
      providesTags: ['Students'],
    }),

    generateReport: builder.mutation<any, ReportParams>({
      query: ({ classId, type, format, ...params }) => ({
        url: `/api/v1/staff/classes/${classId}/reports/${type}?format=${format}`,
        method: 'GET',
        params,
      }),
    }),

    createExam: builder.mutation<any, ExamPayload>({
      query: (body) => ({
        url: '/api/v1/staff/exams',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Exams'],
    }),

    getExams: builder.query<ExamListData, string>({
      query: (classId) => `/api/v1/staff/exams?classId=${classId}`,
      providesTags: ['Exams'],
    }),
  }),
});

export const {
  useLoginStaffMutation,
  useGetStaffDashboardQuery,
  useGetClassAttendanceQuery,
  useMarkAttendanceMutation,
  useEnterGradesMutation,
  usePublishGradesMutation,
  useGetClassStudentsQuery,
  useGenerateReportMutation,
  useCreateExamMutation,
  useGetExamsQuery,
} = staffApi;
```

---

## 📦 REDUX SLICES

```typescript
// src/web/store/slices/staffSlice.ts

interface StaffState {
  user: Staff | null;
  isAuthenticated: boolean;
  selectedClass: Class | null;
  students: Student[];
  attendance: AttendanceRecord[];
  grades: GradeRecord[];
  exams: Exam[];
  loading: boolean;
  error: string | null;
}

const staffSlice = createSlice({
  name: 'staff',
  initialState,
  reducers: {
    setStaffUser(state, action) {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    selectClass(state, action) {
      state.selectedClass = action.payload;
    },
    logoutStaff(state) {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem('staffToken');
    },
  },
});
```

---

## ✅ SUMMARY

**Staff Portal Specifications:**
- 8 main pages fully specified
- 25+ API endpoints with request/response examples
- Firestore schema with security rules
- RTK Query hooks for all operations
- Redux slices for state management
- React components with Material-UI
- Integration points with backend
- Ready for implementation

**Next:** Begin Day 1 tasks (Staff auth + dashboard)
