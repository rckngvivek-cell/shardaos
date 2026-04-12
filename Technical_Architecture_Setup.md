# Technical Architecture: Pan-India School ERP

**Document:** Technical Implementation Reference  
**Status:** Ready for Development  
**Version:** 1.0  
**Date:** April 8, 2026  

---

## SECTION 1: TECH STACK SUMMARY

### Technology Choices

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
├─────────────────────────────────────────────────────┤
│ Web:        React 18 + TypeScript + Tailwind CSS    │
│ Mobile:     React Native (iOS + Android)            │
│ State:      Redux Toolkit + RTK Query               │
│ Real-time:  Firebase Realtime (for sync)            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                      API LAYER                       │
├─────────────────────────────────────────────────────┤
│ Runtime:    Node.js 18 LTS                          │
│ Framework:  Express.js                              │
│ Host:       Google Cloud Run (serverless)           │
│ Port:       8080 (default)                          │
│ Deployment: Cloud Build + GitHub Actions            │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                  DATA LAYER                          │
├─────────────────────────────────────────────────────┤
│ Primary:    Firestore (NoSQL, real-time)            │
│ Analytics:  BigQuery (data warehouse)               │
│ Cache:      Memorystore Redis                       │
│ Storage:    Cloud Storage (GCS)                     │
└─────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────┐
│                SUPPORTING SERVICES                   │
├─────────────────────────────────────────────────────┤
│ Auth:       Firebase Auth                           │
│ Messaging:  Pub/Sub + Cloud Tasks                   │
│ SMS:        Twilio / Exotel API                     │
│ Logging:    Cloud Logging + Error Reporting         │
│ Monitoring: Cloud Monitoring (traces, metrics)      │
└─────────────────────────────────────────────────────┘
```

---

## SECTION 2: FIRESTORE DATABASE DESIGN

### Collections Structure

```
firestore/
├── schools/
│   └── {schoolId}/
│       ├── name, city, state, phone, subscription
│       ├── metadata (studentCount, staff, created_at)
│       ├── settings (language, timezone, theme)
│       └── billing (subscription tier, next_billing_date)
│
├── students/
│   └── {schoolId}/
│       └── {studentId}/
│           ├── name, dob, aadhar, gender
│           ├── contact (parentPhone, parentEmail, emergency)
│           ├── academic (class, section, enrollmentDate, status)
│           ├── media (photoUrl, documents[])
│           ├── notes (remarks, alerts)
│           └── metadata (created_at, updated_at, created_by)
│
├── classes/
│   └── {schoolId}/
│       └── {classId}/
│           ├── name, grade, section
│           ├── teacher_id, capacity, current_strength
│           ├── subjects[], academic_year
│           └── metadata
│
├── attendance/
│   └── {schoolId}/
│       └── {date}/
│           └── {classId}/
│               └── {studentId}/
│                   ├── present (bool)
│                   ├── markedAt (timestamp)
│                   ├── markedBy (staffId)
│                   ├── remarks (string)
│                   └── notified (bool)
│
├── grades/
│   └── {schoolId}/
│       └── {academicYear}/
│           └── {termId}/
│               └── {classId}/
│                   └── {studentId}/
│                       └── {subject}/
│                           ├── assessment (test1, test2, exam)
│                           ├── marks
│                           ├── weightedAverage
│                           ├── grade (A+, A, B+, etc)
│                           └── metadata
│
├── exams/
│   └── {schoolId}/
│       └── {examId}/
│           ├── name, date, duration, totalMarks
│           ├── classes[], subjects
│           ├── questions[{id, type, text, marks, answer, explanation}]
│           ├── status (draft, published, completed)
│           └── metadata
│
├── submissions/
│   └── {schoolId}/
│       └── {submissionId}/
│           ├── exam_id, student_id, class_id
│           ├── submitted_at, total_time
│           ├── answers[{question_id, answer, is_correct, marks_scored}]
│           ├── total_score, grade
│           └── metadata
│
├── announcements/
│   └── {schoolId}/
│       └── {announcementId}/
│           ├── title, content, type
│           ├── target (all, class_id, staff, parents)
│           ├── channels (app, email, sms, whatsapp)
│           ├── scheduled_at, expires_at
│           ├── created_by, status
│           └── metadata
│
├── invoices/
│   └── {schoolId}/
│       └── {invoiceId}/
│           ├── student_id, amount, due_date
│           ├── items[{description, amount}]
│           ├── discount (fixed, percent), tax
│           ├── paid_amount, paid_date
│           ├── status (draft, issued, paid, overdue, cancelled)
│           ├── payment_method (cash, online, cheque)
│           └── metadata
│
├── staff/
│   └── {schoolId}/
│       └── {staffId}/
│           ├── name, email, phone, role
│           ├── qualifications[], experience
│           ├── employment (joining_date, salary, department)
│           ├── attendance (daily records)
│           ├── documents (contract, certifications)
│           ├── status (active, inactive, on_leave)
│           └── metadata
│
├── users/
│   └── {userId}/
│       ├── email, phone, display_name, photo_url
│       ├── role (admin, teacher, parent, accountant, principal)
│       ├── school_id, assigned_school_ids[]
│       ├── permissions[{module, read, write, delete}]
│       ├── last_login, login_count
│       ├── firebase_uid
│       └── metadata (created_at, updated_at)
│
└── audit_logs/
    └── {schoolId}/
        └── {logId}/
            ├── user_id, action (create, update, delete, export)
            ├── module (students, grades, attendance, etc)
            ├── resource_id, resource_type
            ├── old_value, new_value
            ├── timestamp, ip_address
            └── status (success, failure)
```

### Firestore Indexes (Critical for Performance)

**Required Composite Indexes:**

```javascript
// students: Filter by school + class + status
db.collection('students')
  .where('schoolId', '==', schoolId)
  .where('class', '==', 'Class 5')
  .where('status', '==', 'active')
  .orderBy('name')

// attendance: Filter by school + date + class
db.collection('attendance')
  .where('schoolId', '==', schoolId)
  .where('date', '==', '2026-04-08')
  .where('class', '==', 'Class 5A')
  .orderBy('present')

// grades: Get student's grades for a term
db.collection('grades')
  .where('schoolId', '==', schoolId)
  .where('termId', '==', 'term1')
  .where('studentId', '==', studentId)
  .orderBy('subject')

// invoices: Find overdue by school
db.collection('invoices')
  .where('schoolId', '==', schoolId)
  .where('status', '==', 'overdue')
  .orderBy('dueDate')
```

Create these in Firestore console → Indexes tab.

---

## SECTION 3: API DESIGN (REST)

### Authentication & Authorization

**All API calls require:**
```
Header: Authorization: Bearer {idToken}
```

**idToken:** From Firebase Auth (client calls `getIdToken()` after login)

### API Endpoints (RESTful)

#### Students Module

```
POST   /api/v1/schools/{schoolId}/students
       → Create student
       ← { studentId, name, class, ... }

GET    /api/v1/schools/{schoolId}/students
       ← [{ studentId, name, class, status, ... }]

GET    /api/v1/schools/{schoolId}/students/{studentId}
       ← { studentId, name, dob, aadhar, class, ... }

PATCH  /api/v1/schools/{schoolId}/students/{studentId}
       → { name, class, section, ... }
       ← Updated student

DELETE /api/v1/schools/{schoolId}/students/{studentId}
       → Soft delete (status = 'deleted')

GET    /api/v1/schools/{schoolId}/students/search
       → ?q=aarav&class=5A
       ← [matching students]
```

#### Attendance Module

```
POST   /api/v1/schools/{schoolId}/attendance
       → { date, classId, studentId, present, remarks }
       ← { attendanceId, created_at }

GET    /api/v1/schools/{schoolId}/attendance
       → ?date=2026-04-08&classId=5A
       ← [{ studentId, present, markedAt, ... }]

GET    /api/v1/schools/{schoolId}/students/{studentId}/attendance
       → ?fromDate=2026-01-01&toDate=2026-04-08
       ← [{ date, present, remarks, ... }]
       → Calculate attendance percentage in response

PATCH  /api/v1/schools/{schoolId}/attendance/{attendanceId}
       → { present, remarks }
       ← Updated record

GET    /api/v1/schools/{schoolId}/classes/{classId}/attendance/report
       → Summary of class attendance for a date
       ← { present: 42, absent: 3, leave: 5, dated: 2026-04-08 }
```

#### Grades Module

```
POST   /api/v1/schools/{schoolId}/grades
       → { studentId, subject, term, marks, assessment }
       ← { gradeId, weightedAverage, grade, ... }

GET    /api/v1/schools/{schoolId}/students/{studentId}/grades
       → ?term=term1&year=2026
       ← [{ subject, marks, grade, weightedAvg, ... }]

GET    /api/v1/schools/{schoolId}/classes/{classId}/grades
       → Class average per subject
       ← [{ subject, classAvg, topScore, bottomScore, ... }]

POST   /api/v1/schools/{schoolId}/reportCards
       → { studentId, term }
       ← { content, html, pdf_url }
       → Cloud Function generates PDF, stores in GCS, returns signed URL
```

#### Exams Module

```
POST   /api/v1/schools/{schoolId}/exams
       → { name, date, duration, totalMarks, questions[], classes[] }
       ← { examId, status: 'draft', ... }

GET    /api/v1/schools/{schoolId}/exams
       ← [{ examId, name, date, status, ... }]

PATCH  /api/v1/schools/{schoolId}/exams/{examId}
       → { status: 'published' } (make live for students)

POST   /api/v1/schools/{schoolId}/exams/{examId}/submit
       → { studentId, answers[{ questionId, answer, timeSpent }] }
       ← { submissionId, score, grade, feedback, ... }
       → Cloud Function auto-grades MCQs, queues long-answers for teacher

GET    /api/v1/schools/{schoolId}/exams/{examId}/results
       → Aggregated results: avg score, pass %, item analysis
       ← { avgScore, passPercentage, itemAnalysis[{ questionId, correctPercent, discrimination_index }] }

GET    /api/v1/schools/{schoolId}/exams/{examId}/submissions/{submissionId}
       → Student result + detailed feedback
       ← { studentId, score, answers[], explanation[], ... }
```

#### Announcements Module

```
POST   /api/v1/schools/{schoolId}/announcements
       → { title, content, channels: ['app', 'sms', 'email'], target: 'all|class_5A|staff' }
       ← { announcementId, status: 'scheduled', ... }

GET    /api/v1/schools/{schoolId}/announcements
       → ?limit=10&offset=0
       ← [{ announcementId, title, created_at, ... }]

POST   /api/v1/schools/{schoolId}/announcements/{announcementId}/send
       → Trigger send (if not scheduled)
       ← { sent: 42, failed: 1, ... }
       → Cloud Tasks queues SMS/email to each recipient
```

#### Invoices / Financials Module

```
POST   /api/v1/schools/{schoolId}/invoices
       → { studentId, amount, dueDate, items[] }
       ← { invoiceId, status: 'draft', ... }

GET    /api/v1/schools/{schoolId}/invoices
       → ?status=pending&sort=dueDate
       ← [{ invoiceId, studentId, amount, status, ... }]

PATCH  /api/v1/schools/{schoolId}/invoices/{invoiceId}
       → { status: 'paid', paidDate, paymentMethod: 'cash|online|cheque' }
       ← Updated

GET    /api/v1/schools/{schoolId}/invoices/{invoiceId}/pdf
       → Download invoice as PDF
       ← Binary PDF file

POST   /api/v1/schools/{schoolId}/invoices/{invoiceId}/send
       → Email invoice to parent
       ← { sent: true, email_id: "..." }

GET    /api/v1/schools/{schoolId}/financials/summary
       → Dashboard: Total revenue, outstanding, overdue
       ← { totalInvoiced, totalCollected, outstanding, overdue, percentageCollected }

GET    /api/v1/schools/{schoolId}/financials/defaulters
       → List students overdue
       ← [{ studentId, studentName, outstanding, daysOverdue, ... }]
```

#### Reports Module

```
GET    /api/v1/schools/{schoolId}/reports/attendance
       → ?fromDate=...&toDate=...&format=pdf|excel
       ← File download or JSON

GET    /api/v1/schools/{schoolId}/reports/academic
       → Class-wise performance report
       ← JSON + PDF option

GET    /api/v1/schools/{schoolId}/reports/financial
       → Fee collection, outstanding, trends
       ← JSON + PDF

GET    /api/v1/schools/{schoolId}/reports/compliance
       → DISE, UDIS data export (for govt submission)
       ← Excel/CSV in required format
```

#### Admin / Settings

```
GET    /api/v1/schools/{schoolId}/settings
       ← { language, timezone, theme, logo, ... }

PATCH  /api/v1/schools/{schoolId}/settings
       → { language: 'hi', timezone: 'Asia/Kolkata', ... }

POST   /api/v1/schools/{schoolId}/staff/{staffId}/invite
       → { email, role: 'teacher|accountant|admin' }
       ← Sends invite email with onboarding link

GET    /api/v1/schools/{schoolId}/users
       ← List of all users (teachers, staff, parents) at school

PATCH  /api/v1/schools/{schoolId}/users/{userId}/permissions
       → { modules: [{ name: 'students', read: true, write: true, ... }] }
```

### Error Responses

**Standard error format:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Student name is required",
    "statusCode": 400,
    "timestamp": "2026-04-08T10:30:45Z"
  }
}
```

**Common HTTP codes:**
- 200: Success
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized (bad token)
- 403: Forbidden (no permission)
- 404: Not found
- 500: Server error
- 503: Server overloaded (rate limiting)

---

## SECTION 4: CLOUD RUN DEPLOYMENT

### Container Structure

```
school-erp-api/
├── dockerfile
├── package.json
├── .env.example
├── src/
│   ├── index.js (Express app entry)
│   ├── middleware/
│   │   ├── auth.js (Firebase token verification)
│   │   ├── errorHandler.js
│   │   └── logging.js
│   ├── routes/
│   │   ├── students.js
│   │   ├── attendance.js
│   │   ├── grades.js
│   │   ├── exams.js
│   │   ├── announcements.js
│   │   ├── invoices.js
│   │   └── reports.js
│   ├── controllers/ (business logic)
│   │   ├── studentController.js
│   │   ├── attendanceController.js
│   │   └── ...
│   ├── services/ (Firestore, BigQuery queries)
│   │   ├── studentService.js
│   │   ├── attendanceService.js
│   │   └── ...
│   ├── utils/
│   │   ├── firebaseAdmin.js (initialize Firestore)
│   │   ├── bigQueryClient.js
│   │   ├── notificationService.js (SMS/email)
│   │   └── pdfGenerator.js
│   └── config/
│       └── index.js (environment variables)
└── tests/
    ├── unit/
    └── integration/
```

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (prune for production)
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Cloud Run requires PORT env var
ENV PORT=8080

# Run app
CMD ["node", "src/index.js"]
```

### Cloud Run Deployment

```bash
# Step 1: Configure gcloud
gcloud config set project school-erp-prod

# Step 2: Build image (Cloud Build)
gcloud builds submit --tag gcr.io/school-erp-prod/api:v1

# Step 3: Deploy to Cloud Run
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:v1 \
  --platform managed \
  --region asia-south1 \
  --memory 512Mi \
  --timeout 60s \
  --max-instances 100 \
  --set-env-vars PROJECT_ID=school-erp-prod,REDIS_URL=<redis-url> \
  --service-account school-erp-api@school-erp-prod.iam.gserviceaccount.com \
  --allow-unauthenticated=false

# Step 4: Set up Cloud Build trigger
gcloud builds create github-trigger \
  --name=github-school-erp \
  --github-repo-owner=your-org \
  --github-repo-name=school-erp-api \
  --github-push-branch=main \
  --build-config=cloudbuild.yaml
```

### Environment Variables (Cloud Run)

```env
PROJECT_ID=school-erp-prod
FIREBASE_SERVICE_ACCOUNT_KEY=<base64-encoded JSON>
REDIS_URL=redis://redishost:6379
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=+1234567890
BQ_DATASET=school_erp_analytics
NODE_ENV=production
LOG_LEVEL=info
```

---

## SECTION 5: FRONTEND ARCHITECTURE

### Web App (React)

**Folder structure:**
```
school-erp-web/
├── public/
├── src/
│   ├── index.jsx
│   ├── App.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── StudentsPage.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── GradesPage.jsx
│   │   ├── ExamsPage.jsx
│   │   ├── FinancialPage.jsx
│   │   └── ReportsPage.jsx
│   ├── components/ (reusable)
│   │   ├── StudentForm.jsx
│   │   ├── AttendanceMarker.jsx
│   │   ├── GradeCard.jsx
│   │   ├── Table.jsx
│   │   ├── Pagination.jsx
│   │   └── Modal.jsx
│   ├── hooks/ (custom React hooks)
│   │   ├── useAuth.js
│   │   ├── useStudents.js
│   │   ├── useAttendance.js
│   │   └── useNotification.js
│   ├── services/ (API calls)
│   │   ├── api.js (axios instance + auth)
│   │   ├── studentService.js
│   │   ├── attendanceService.js
│   │   └── ...
│   ├── store/ (Redux)
│   │   ├── store.js
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── studentSlice.js
│   │   │   ├── attendanceSlice.js
│   │   │   └── ...
│   │   └── thunks.js
│   ├── styles/
│   │   ├── index.css (Tailwind imports)
│   │   ├── theme.js (color variables)
│   │   └── globals.css
│   └── utils/
│       ├── formatters.js (date, currency)
│       ├── validators.js
│       └── constants.js
└── package.json
```

### Mobile App (React Native)

**Folder structure:**
```
school-erp-mobile/
├── app.json
├── package.json
├── src/
│   ├── App.jsx (entry)
│   ├── navigation/
│   │   ├── AuthNavigator.jsx
│   │   ├── MainNavigator.jsx
│   │   └── LinkingConfiguration.js (deep links)
│   ├── screens/
│   │   ├── LoginScreen.jsx
│   │   ├── HomeScreen.jsx
│   │   ├── StudentListScreen.jsx
│   │   ├── AttendanceScreen.jsx
│   │   ├── GradesScreen.jsx
│   │   └── ProfileScreen.jsx
│   ├── components/
│   │   ├── StudentCard.jsx
│   │   ├── AttendanceButton.jsx
│   │   ├── GradeDisplay.jsx
│   │   ├── Modal.jsx
│   │   └── LoadingSpinner.jsx
│   ├── services/
│   │   ├── api.js
│   │   └── * (same as web)
│   ├── utils/
│   │   ├── storage.js (AsyncStorage for offline)
│   │   ├── sync.js (background sync)
│   │   └── * (same as web)
│   └── styles/
│       └── theme.js
└── ios/ (native iOS code)
└── android/ (native Android code)
```

### Key Libraries

```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "react-native": "^0.72.x",
    "firebase": "^10.x",
    "axios": "^1.4.x",
    "@reduxjs/toolkit": "^1.9.x",
    "react-redux": "^8.x",
    "tailwindcss": "^3.x",
    "recharts": "^2.x",
    "jspdf": "^2.5.x",
    "xlsx": "^0.18.x"
  }
}
```

---

## SECTION 6: REAL-TIME SYNC & OFFLINE SUPPORT

### Offline-First Strategy

Schools have spotty WiFi. Your app must work offline.

**Approach:**
1. User marks attendance while offline (stored in local SQLite/AsyncStorage)
2. When WiFi returns, background sync pushes data to Firestore
3. UI shows "pending sync" indicator until confirmed

**Implementation:**

```javascript
// React Native: useEffect with sync
useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    if (state.isConnected && state.isInternetReachable) {
      syncPendingDataToFirebase();
    }
  });
  return unsubscribe;
}, []);

// Backend: Idempotency key prevents duplicates
POST /api/attendance
Header: Idempotency-Key: <uuid>
Body: { date, classId, studentId, present }
// If key seen before, return cached result (no duplicate)
```

### Real-Time Sync with Firestore

**Web + Mobile share real-time data:**

```javascript
// React component listening to Firestore
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

function StudentsList({ schoolId }) {
  const [students, setStudents] = useState([]);
  
  useEffect(() => {
    const q = query(
      collection(db, 'students'),
      where('schoolId', '==', schoolId),
      where('status', '==', 'active')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(data);
    });
    
    return unsubscribe; // Clean up listener
  }, [schoolId]);
  
  return (
    <ul>
      {students.map(student => (
        <li key={student.id}>{student.name} - {student.class}</li>
      ))}
    </ul>
  );
}
```

---

## SECTION 7: SECURITY & COMPLIANCE

### Firebase Authentication Flow

```
1. User enters email/password or clicks "Sign in with Google"
2. Firebase Auth verifies credentials
3. Firebase returns idToken (JWT, 1 hour expiry)
4. Client stores idToken in localStorage (web) or Secure Storage (mobile)
5. Every API call includes: Authorization: Bearer {idToken}
6. Cloud Run verifies token signature, extracts user claims
7. Authorization middleware checks user's school_id + permissions
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Only authenticated users can read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Students: Can read own data, school can read all
    match /students/{schoolId}/{studentId} {
      allow read: if 
        request.auth.uid == resource.data.principal_uid ||
        request.auth.uid == resource.data.parent_uid;
      allow write: if request.auth.uid == resource.data.principal_uid;
    }
    
    // Attendance: Teachers can write, parents can read
    match /attendance/{schoolId}/{date}/{classId}/{studentId} {
      allow read: if 
        isTeacherOfClass(request.auth.uid, classId) ||
        isParentOfStudent(request.auth.uid, studentId);
      allow create: if isTeacherOfClass(request.auth.uid, classId);
    }
    
    // Grades: Teachers + parents can read, teachers can write
    match /grades/{schoolId}/{academicYear}/{termId}/{classId}/{studentId} {
      allow read: if 
        isTeacherOfClass(request.auth.uid, classId) ||
        isParentOfStudent(request.auth.uid, studentId);
      allow write: if isTeacherOfClass(request.auth.uid, classId);
    }
    
    // Invoices: Parents read own, accountant can manage
    match /invoices/{schoolId}/{invoiceId} {
      allow read: if 
        isParentOfStudent(request.auth.uid, resource.data.student_id) ||
        isAccountantOfSchool(request.auth.uid, schoolId);
      allow write: if isAccountantOfSchool(request.auth.uid, schoolId);
    }
  }
  
  // Helper functions
  function isTeacherOfClass(uid, classId) {
    return get(/databases/$(database)/documents/classes/$(classId)).data.teacher_id == uid;
  }
  
  function isParentOfStudent(uid, studentId) {
    return uid in get(/databases/$(database)/documents/students/$(studentId)).data.parent_uids;
  }
  
  function isAccountantOfSchool(uid, schoolId) {
    return uid in get(/databases/$(database)/documents/schools/$(schoolId)).data.accountant_uids;
  }
}
```

### Data Privacy

- **GDPR compliance:** EU schools get data residency in europe-west1 (London)
- **HIPAA (if US):** Encrypt PII at rest + in transit
- **Student data protection:** Store Aadhar only with encryption
- **Audit logging:** All access logged in `audit_logs` collection (immutable)
- **Backups:** Daily automated backups (Cloud Firestore Backup)
- **Vendor compliance:** Twilio, Razorpay both SOC2 certified

---

## SECTION 8: MONITORING & OBSERVABILITY

### Cloud Logging

```javascript
// Log all API requests
app.use((req, res, next) => {
  const logger = new google.cloud.logging.Log('school-erp');
  logger.write({
    severity: 'INFO',
    message: `${req.method} ${req.path}`,
    timestamp: new Date(),
    userId: req.user?.uid,
    schoolId: req.user?.schoolId,
    duration: Date.now() - req.startTime
  });
  next();
});

// Log errors
process.on('uncaughtException', (error) => {
  const logger = new google.cloud.logging.Log('school-erp');
  logger.error({
    severity: 'ERROR',
    message: error.message,
    stack: error.stack,
    timestamp: new Date()
  });
});
```

### Cloud Monitoring Alerts

**Set up these alerts:**

1. **API latency:** Alert if P95 > 2s
2. **Error rate:** Alert if >1% of requests fail
3. **Cloud Run:** Alert if cold starts > 10s
4. **Firestore:** Alert if hot partition detected
5. **Quota:** Alert if approaching daily quota

### Dashboard (Data Studio)

**Create dashboard showing:**
- Daily active schools
- API request volume + errors
- Feature usage (who's using what module?)
- Infrastructure costs
- Customer satisfaction (NPS, support tickets)

---

## SECTION 9: TESTING STRATEGY

### Unit Tests (Jest)

```javascript
// Example: Test attendance calculation
describe('attendanceService', () => {
  test('calculates attendance percentage correctly', () => {
    const records = [
      { present: true }, { present: true }, { present: false }
    ];
    const percentage = calculateAttendance(records);
    expect(percentage).toBe(66.67);
  });
});
```

### Integration Tests (Supertest + Firestore Emulator)

```javascript
test('POST /attendance marks attendance and sends SMS', async () => {
  const response = await request(app)
    .post('/api/v1/schools/xyz/attendance')
    .send({ date: '2026-04-08', classId: '5A', studentId: '123', present: false })
    .expect(201);
    
  expect(response.body.announcementId).toBeDefined();
  // Verify SMS was queued
  const smsLog = await db.collection('sms_queue').doc(response.body.smsId).get();
  expect(smsLog.exists).toBe(true);
});
```

### E2E Tests (Playwright)

```javascript
test('Teacher marks attendance for class', async () => {
  // Login
  await page.goto('https://localhost:3000/login');
  await page.fill('input[name="email"]', 'teacher@school.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Mark attendance
  await page.goto('https://localhost:3000/attendance');
  await page.click('button[data-student-id="123"]'); // Mark present
  await page.click('button:has-text("Save")');
  
  // Verify success
  await expect(page.locator('text=Attendance saved')).toBeVisible();
});
```

---

## SECTION 10: DEPLOYMENT CHECKLIST

### Pre-Launch

- [ ] All 8 modules tested with real school (2-3 week validation)
- [ ] Security review (penetration testing, OWASP top 10)
- [ ] Performance tested (1000 concurrent users)
- [ ] Firestore backups automated
- [ ] Monitoring + alerting set up
- [ ] Documentation (API docs, admin guide, teacher guide)
- [ ] Support process (Slack channel, email, WhatsApp)

### Launch Steps

1. **Week before:** Deploy to staging environment (clone of prod)
2. **Day before:** Do final smoke tests, customer on standby
3. **Launch day:** Deploy to production (blue-green strategy)
4. **Post-launch:** Monitor errors/performance for 24h, on-call support

### Scaling Checkpoints

| Schools | Firestore Req/Sec | Cloud Run Instances | Estimated Monthly Cost |
|---------|-------------------|---------------------|------------------------|
| 100 | 10K | 5 | ₹10K |
| 1,000 | 100K | 20 | ₹50K |
| 10,000 | 1M | 100 | ₹3L |
| 50,000 | 5M | 500 | ₹15L |

**Firestore can handle 1M req/sec, so no scaling needed until >50K schools.**

---

## QUICK START FOR DEVELOPERS

### Week 1 Setup

```bash
# Clone repo
git clone <repo-url>
cd school-erp-api

# Install dependencies
npm install

# Set up Firebase emulator
npm install -g firebase-tools
firebase emulators:start

# Run tests
npm test

# Start dev server
npm run dev # Runs on http://localhost:8080

# API docs
npm run docs # Opens http://localhost:3000
```

### First Feature: Student CRUD

1. **API:** POST /students (create) + GET /students (list)
2. **Database:** Firestore schema defined
3. **Test:** Jest unit test passes
4. **Deploy:** To Cloud Run staging
5. **Frontend:** React component calls API
6. **Integration test:** E2E test marks attendance

---

**Next Step:** Create GitHub repo, set up Cloud Build, onboard first dev.

