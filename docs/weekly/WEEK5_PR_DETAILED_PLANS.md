# WEEK 5 - DETAILED PR SPECIFICATIONS & TEST PLANS

---

## PR #6: MOBILE APP FOUNDATION (React Native)

**Lead:** Frontend Agent  
**Timeline:** Days 1-5 (90% complete by Day 5)  
**Dependencies:** Week 4 APIs (already live)

### Architecture Overview
```
├── apps/mobile/
│   ├── ios/ (native config)
│   ├── android/ (native config)
│   ├── src/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── AttendanceScreen.tsx
│   │   │   ├── GradesScreen.tsx
│   │   │   └── ProfileScreen.tsx
│   │   ├── components/
│   │   ├── navigation/
│   │   ├── store/ (Redux)
│   │   ├── services/ (API calls)
│   │   ├── utils/
│   │   └── App.tsx
│   ├── __tests__/
│   └── package.json
```

### Core Features (MVP)
1. **Authentication** (Reuse Week 4 Firebase)
   - SMS OTP + email login
   - Token refresh
   - Logout

2. **Dashboard Screen**
   - Student's name + profile pic
   - Current attendance %
   - Latest 5 grades
   - Quick actions menu

3. **Attendance Screen**
   - Last 30 days attendance
   - Date picker
   - Pie chart (present/absent/leave)

4. **Grades Screen**
   - All subjects + marks
   - Term filter
   - Sort by subject

5. **Profile Screen**
   - Edit profile (name, phone, email)
   - Change password
   - Settings

### Technical Stack
```
Framework:      React Native 0.73.6
Navigation:     React Navigation 6.x
State Mgmt:     Redux Toolkit + Redux Persist
API:            RTK Query (same as web)
Storage:        AsyncStorage (offline caching)
Notifications:  React Native Firebase Cloud Messaging
Icons:          React Native Vector Icons
UI:             React Native Paper (Material Design)
Testing:        Jest + React Native Testing Library
Build:          Expo (CLI) for both iOS & Android
```

### Database (Offline Support)
- AsyncStorage for login credentials & last sync timestamp
- Cache API responses for 24 hours
- SQLite for complex queries (Phase 2)

### Tests Required (15+)
```
Unit Tests (8):
├─ LoginScreen - renders, button click, OTP validation
├─ DashboardScreen - displays student data, loads state
├─ AttendanceScreen - date picker works, chart renders
├─ GradesScreen - filters, sorts correctly
├─ ProfileScreen - edit form inputs
├─ Navigation - redirects work correctly
├─ Store (Redux) - state updates correctly
└─ Utils - date formatting, token refresh

Integration Tests (5):
├─ Full login flow (OTP → Dashboard)
├─ API sync (fetch grades, update profile)
├─ Offline mode (works without internet)
├─ Notifications (receive + display)
└─ Storage persistence (survives app restart)

E2E Tests (2):
├─ Teacher login → view attendance
└─ Student login → see grades
```

### Success Criteria
- [ ] iOS simulator runs without crashes
- [ ] Android simulator runs without crashes
- [ ] Login works with real Firebase
- [ ] Dashboard loads in <2 seconds
- [ ] All screens responsive (portrait + landscape)
- [ ] 15+ tests passing (100%)
- [ ] 80%+ code coverage
- [ ] No console errors/warnings

### Deliverables
```
1,500 LOC React Native code
15+ tests (Jest + React Native Testing Library)
Responsive design for 4" to 6.7" screens
Offline caching working
Push notifications ready for PR #8 (SMS)
```

---

## PR #7: BULK IMPORT ENGINE

**Lead:** Backend Agent  
**Timeline:** Days 1-3 (100% complete by Day 4)  
**Dependencies:** Week 4 APIs + Firestore

### API Endpoint
```
POST /api/v1/schools/{schoolId}/bulk-import
Content-Type: multipart/form-data

Request:
- file: CSV file (max 10 MB)
- type: "students" | "teachers" | "classes"
- dryRun: true | false (validate only)

Response:
{
  sessionId: "import-uuid",
  status: "processing|completed|failed",
  recordsProcessed: 500,
  recordsSuccessful: 495,
  recordsFailed: 5,
  errors: [
    { row: 2, field: "email", error: "Invalid format" }
  ],
  startedAt: "2026-04-14T10:00:00Z",
  completedAt: "2026-04-14T10:00:28Z",
  timeSeconds: 28
}
```

### CSV Format (Students Example)
```
firstName,lastName,email,phone,rollNumber,section,dob,gender
John,Doe,john.doe@school.edu,9876543210,101,A,2010-01-15,M
Jane,Smith,jane.smith@school.edu,9876543211,102,A,2009-06-20,F
```

### Processing Logic
1. **Parse CSV** → Convert to JSON
2. **Validate Each Record**
   - Required fields present
   - Email format valid
   - Phone format valid
   - DOB is valid date
   - Roll number unique in section
3. **Duplicate Detection**
   - Check existing DB for email/phone
   - If exists: show "merge" option
4. **Batch Create** (if not dryRun)
   - Batch insert 50 records at a time
   - Track progress
   - Rollback on error
5. **Return Summary**
   - Total records: 500
   - Successful: 495
   - Failed: 5 (with reasons)

### Validation Rules
```
STUDENTS:
- firstName: 1-50 chars, required
- lastName: 1-50 chars, required
- email: valid format, unique in school
- phone: 10 digits, unique in school
- rollNumber: 1-999, unique in section
- section: A-Z, required
- dob: YYYY-MM-DD, valid date
- gender: M/F/Other

TEACHERS:
- firstName, lastName: required
- email: unique in school
- phone: unique in school
- subject: required
- experience: 0-50 years

CLASSES:
- name: 1-50 chars, unique
- section: A-Z
- capacity: 1-100
```

### Error Handling
```
Validation errors → Return in response (don't stop processing)
Database errors → Rollback transaction, return error
File too large → Return 413 Payload Too Large
Invalid CSV format → Return 400 Bad Request
Duplicate emails → Return as warning in response
```

### Tests Required (15+)
```
CSV Parsing (3):
├─ Parse valid CSV (5 rows) → JSON array
├─ Handle missing columns → Error
└─ Handle special characters (UTF-8) → Parse correctly

Validation (5):
├─ Valid student record → Pass
├─ Invalid email → Fail with reason
├─ Duplicate email → Detected
├─ Missing required field → Fail
└─ DOB in future → Fail

Batch Processing (4):
├─ Import 100 students → All created in DB
├─ Import 1000 students → 1 minute < processing time
├─ Rollback on error → None created
└─ Progress tracking → Callback fired every 50 records

API Tests (3):
├─ POST valid CSV → 200 + summary
├─ POST large file (>10MB) → 413 error
└─ Duplicate detection → Show existing records
```

### Performance Targets
```
CSV parsing:    <1 second (100 records)
Validation:     <2 seconds (500 records)
Batch insert:   <30 seconds (500 records to Firestore)
Total time:     <30 seconds (500 students)
```

### Deliverables
```
1 API endpoint (/bulk-import)
400 LOC backend code
CSV parser utility
Batch insert handler
15+ tests passing
100% validation coverage
```

---

## PR #8: SMS NOTIFICATIONS

**Lead:** Backend Agent  
**Timeline:** Days 2-4  
**Dependencies:** Twilio account + SMS credits

### Twilio Integration
```
npm install twilio
TWILIO_ACCOUNT_SID = "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN = "your_auth_token"
TWILIO_PHONE_NUMBER = "+1234567890" (or India: "+911234567890")
```

### Event Triggers (MVP Phase)
```
1. Attendance Marked
   Trigger: When teacher marks attendance
   Message: "Hi [Parent], [Student] present today (Math, Science, Eng)"
   Recipient: Parent phone
   Delay: 15 minutes after school hours

2. Grade Posted
   Trigger: When teacher posts grades
   Message: "Hi [Parent], [Student] scored 85/100 in Math exam"
   Recipient: Parent phone
   Delay: Immediate

3. Announcement
   Trigger: When school makes announcement
   Message: "[School] announces: [Message]"
   Recipient: Parents of all students
   Delay: Immediate

4. Fee Due
   Trigger: When fee becomes due
   Message: "Hi [Parent], Fee due ₹15,000. Pay now: [Link]"
   Recipient: Parent phone
   Delay: 1 day before due date
```

### Message Templates
```
ATTENDANCE: "Hi {{parentName}}, {{studentName}} present today ({{subjects}}). -{{schoolName}}"
GRADES: "Hi {{parentName}}, {{studentName}} scored {{marks}}/100 in {{subject}}. -{{schoolName}}"
ANNOUNCEMENT: "{{schoolName}} announces: {{message}}"
FEE_DUE: "Hi {{parentName}}, Fee ₹{{amount}} due by {{dueDate}}. Pay: {{link}}"
HOLIDAY: "{{schoolName}} holiday on {{date}} ({{reason}})"
```

### API Endpoint
```
POST /api/v1/schools/{schoolId}/sms/send
{
  recipients: ["9876543210", "9876543211"],
  templateId: "ATTENDANCE",
  variables: {
    parentName: "Mr. Sharma",
    studentName: "Rohan Sharma",
    subjects: "Math, Science, English"
  },
  sendAt: "2026-04-14T17:00:00Z" // optional, for scheduled
}

Response:
{
  messageId: "SMxxxxxxxxxxxx",
  status: "queued",
  recipients: 2,
  cost: "₹2.00",
  estimatedDelivery: "10 seconds"
}
```

### Audit Trail
```
Store every SMS in Firestore:
{
  type: "sms",
  templateId: "ATTENDANCE",
  recipient: "9876543210",
  message: "Hi Mr. Sharma, Rohan present today...",
  status: "delivered", // pending, sent, delivered, failed
  sentAt: "2026-04-14T16:30:00Z",
  deliveredAt: "2026-04-14T16:30:02Z",
  cost: "₹1.00",
  externalId: "SMxxxxxxxxxxxx" (Twilio)
}
```

### Cost Tracking
```
Per SMS cost: ₹0.50 to ₹1.50 (India)
Target: <₹0.50/SMS via bulk pricing
Twilio Programmable SMS: ₹0.47/SMS (bulk)

Monthly cost for 10 schools:
- 500 students per school
- 5,000 total students
- 2 SMSs per student per day (attendance + weekly)
- 10,000 SMSs per day
- ₹5,000/day = ₹150,000/month

Revenue per school: ₹3L/year
SMS cost: ₹18L/year → Breakeven at 90 schools
```

### Tests Required (10+)
```
Template Rendering (3):
├─ Attendance template → Variables filled
├─ Grades template → Variables filled
└─ Special characters → Escaped correctly

Twilio Integration (4):
├─ Send SMS → Twilio API called with correct params
├─ Delivery confirmation → Webhook updates status
├─ Retry failed SMS → 3 retries then abandon
└─ Rate limiting → Max 10 SMS/second

Audit Trail (2):
├─ SMS logged in Firestore
└─ Cost tracked correctly

E2E (1):
├─ Grade posted → SMS sent in <5 seconds
```

### Rate Limiting
```
Per phone: 5 SMS/hour (prevent spam)
Per school: 1000 SMS/hour
Burst: 10 SMS/second
Queue: AWS SQS for reliability
```

### Deliverables
```
Twilio integration module
4 message templates
1 API endpoint
Audit trail logging
10+ tests passing
Cost tracking working
```

---

## PR #9: ADVANCED REPORTING ENGINE

**Lead:** Data Agent  
**Timeline:** Days 2-5  
**Dependencies:** Week 4 analytics + BigQuery prep

### Report Builder API
```
POST /api/v1/schools/{schoolId}/reports/create
{
  name: "Monthly Attendance Report",
  description: "Attendance in March 2026",
  type: "attendance|grades|fees|summary",
  filters: {
    dateRange: { from: "2026-03-01", to: "2026-03-31" },
    section: ["A", "B"],
    subject: ["Math"], // for grades
    status: ["present", "absent"] // for attendance
  },
  columns: [
    { field: "studentName", label: "Student" },
    { field: "rollNumber", label: "Roll #" },
    { field: "attendance", label: "Attendance %" }
  ],
  sortBy: [{ field: "attendance", order: "desc" }],
  groupBy: "section", // optional
  exportFormat: "pdf|excel|csv" // optional
}

Response:
{
  reportId: "rpt-uuid",
  name: "Monthly Attendance Report",
  generatedAt: "2026-04-14T16:35:00Z",
  rowCount: 250,
  columns: 5,
  downloadUrl: "https://api.school.app/reports/rpt-uuid/download",
  expiresAt: "2026-04-21T16:35:00Z" // 7 days
}
```

### Pre-built Report Templates (20+)
```
ATTENDANCE REPORTS:
1. Daily Attendance Summary (single day, by section)
2. Monthly Attendance (all students, by month)
3. Attendance Trends (by student, 6 months)
4. Absent Students Today (list)
5. Leave Applications (pending, approved, rejected)

GRADE REPORTS:
6. Term Grades (all subjects, all students)
7. Subject Performance (single subject, all students)
8. Student Grades (single student, all subjects)
9. Class Performance (average, median, distribution)
10. Topper List (by subject, by term)

FEE REPORTS:
11. Fee Collection (by month, payment status)
12. Pending Fees (amount, due date)
13. Late Payments (days overdue)
14. Discount Summary (applied, reason)

TEACHER REPORTS:
15. Classes Assigned (teacher, schedule)
16. Lesson Plan Adherence (vs attendance)
17. Exam Conducting (assigned exams)

SUMMARY REPORTS:
18. Monthly KPI Dashboard (students, fees, attendance)
19. School Performance (attendance %, avg grades)
20. Enrollment Trends (new students, dropouts)
```

### Export Formats
```
PDF:
- Header with school logo + date
- Tables with borders
- Charts/graphs embedded
- Footer with page numbers
- Watermark "CONFIDENTIAL"

EXCEL:
- Multiple sheets (one per section)
- Formulas for totals/averages
- Color coding (red: <75%, green: >95%)
- Filters enabled

CSV:
- Comma-separated, properly quoted
- Excel-ready (UTF-8 encoding)
```

### Report Scheduling
```
POST /api/v1/schools/{schoolId}/reports/{reportId}/schedule
{
  frequency: "daily|weekly|monthly",
  dayOfWeek: "monday", // for weekly
  dayOfMonth: 1, // for monthly
  time: "08:00", // IST (Asia/Kolkata)
  recipients: ["principal@school.edu", "admin@school.edu"],
  format: "pdf|excel"
}

Action: Email report every week/month automatically
```

### Performance Targets
```
Report generation (<10 seconds):
- 500 students, 5 subjects
- 10,000 records to query
- Filter, group, sort
- Export to PDF/Excel
```

### Tests Required (15+)
```
Report Generation (5):
├─ Attendance report → 10 seconds
├─ Grades report → 8 seconds
├─ Fees report → 5 seconds
├─ Group by section → Correct grouping
└─ Sort by column → Correct ordering

Filtering (4):
├─ Date range → Correct records
├─ Section filter → Only matching
├─ Subject filter → Correct grades
└─ Combined filters → AND logic

Export (4):
├─ Export to PDF → Valid file
├─ Export to Excel → Formula working
├─ Export to CSV → Correct format
└─ Large export (10k rows) → <15 seconds

Scheduling (2):
├─ Schedule report → Saved correctly
└─ Scheduled email → Sent at right time
```

### Deliverables
```
Report builder API endpoint
20+ pre-built templates
3 export formats (PDF, Excel, CSV)
Scheduling system
15+ tests passing
Performance tracking
```

---

## PR #10: PARENT PORTAL MVP

**Lead:** Frontend Agent  
**Timeline:** Days 3-5  
**Dependencies:** Week 4 APIs + authentication

### Architecture
```
apps/parent-portal/src/
├── pages/
│   ├── LoginPage.tsx
│   ├── ChildrenDashboard.tsx
│   ├── AttendanceDetail.tsx
│   ├── GradesDetail.tsx
│   ├── AnnouncementsPage.tsx
│   └── MessagesPage.tsx
├── components/
│   ├── AttendanceChart.tsx
│   ├── GradesSummary.tsx
│   ├── MessageThread.tsx
│   └─── FeesCard.tsx
├── store/ (Redux)
├── services/ (API)
├── styles/ (Material-UI theme)
└── App.tsx
```

### Features
1. **Login** (Email + OTP / Phone + OTP)
2. **Children Dashboard**
   - Select child (dropdown if multiple)
   - Name, photo, class
   - Attendance % (large number)
   - Current subject/period
   - Quick grade summary

3. **Attendance Details**
   - Last 30 days (calendar view)
   - Pie chart (present/absent/leave)
   - Notifications when marked

4. **Grades Details**
   - All subjects + marks
   - Term/exam filter
   - Grade distribution (bar chart)

5. **Announcements**
   - List from school
   - By date (newest first)
   - Attachments (if any)

6. **Messages**
   - 1-to-1 with teachers
   - Create new message (list of teachers)
   - Message history
   - Read receipts

7. **Fees/Payments**
   - Current balance
   - Due dates
   - Payment history
   - Pay now (Razorpay link)

8. **Settings**
   - Edit phone/email
   - Change password
   - Notification preferences
   - Language (English/Hindi)

### Responsive Design
```
Mobile (375px):
- Single column layout
- Touch-friendly buttons (48px)
- Bottom navigation (5 icons)

Tablet (768px):
- Two column (sidebar + content)
- Larger text
- Multi-select options

Desktop (1920px):
- Full dashboard
- All columns visible
- Widgets resizable
```

### API Endpoints Used
```
POST /auth/parent/login (OTP)
GET  /parents/{parentId}/children
GET  /children/{childId}/attendance
GET  /children/{childId}/grades
GET  /announcements
GET  /messages/threads
POST /messages/send
GET  /fees/balance
POST /fees/pay
```

### Tests Required (12+)
```
Authentication (2):
├─ Login with OTP → Token received
└─ Session timeout → Redirect to login

Children Dashboard (2):
├─ Display child's name + photo
└─ Show attendance % live

Attendance (2):
├─ Calendar shows last 30 days
└─ Pie chart renders correctly

Grades (2):
├─ Display all subjects + marks
└─ Filter by term works

Messages (2):
├─ List of teacher conversations
└─ Send message → Appears in thread

Payments (2):
├─ Display balance + due dates
└─ Pay button → Razorpay opens correctly

Responsive (1):
├─ All screens work on mobile/tablet/desktop
```

### Success Criteria
- [ ] Pages load in <2 seconds
- [ ] Mobile responsive (375px+)
- [ ] Attendance chart displays correctly
- [ ] Messages send/receive working
- [ ] All 12+ tests passing
- [ ] 85%+ code coverage

### Deliverables
```
8 pages + components
1,200 LOC React
12+ tests passing
Fully responsive design
Material-UI theming
```

---

## PR #11: TIMETABLE MANAGEMENT

**Lead:** Backend Agent + Frontend Engineer  
**Timeline:** Days 3-5  
**Dependencies:** Week 4 APIs

### Timetable Schema
```
Firestore Collection: timetables/{schoolId}/entries
{
  id: "tt-uuid",
  schoolId: "school-uuid",
  className: "10A", // e.g., 10A
  dayOfWeek: 1, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  period: 1, // 1st period, 2nd, etc.
  startTime: "09:00", // IST
  endTime: "10:00",
  subjectId: "sub-uuid",
  subjectName: "Mathematics",
  teacherId: "teacher-uuid",
  teacherName: "Mr. Sharma",
  roomNumber: "A1",
  createdAt: "2026-04-14T10:00:00Z",
  updatedAt: "2026-04-14T10:00:00Z"
}
```

### API Endpoints
```
GET  /api/v1/schools/{schoolId}/timetable?className=10A&day=monday
     → Returns all periods for 10A on Monday

POST /api/v1/schools/{schoolId}/timetable
     {
       className: "10A",
       dayOfWeek: 1,
       period: 1,
       startTime: "09:00",
       endTime: "10:00",
       subjectId: "math-uuid",
       teacherId: "teacher-uuid",
       roomNumber: "A1"
     }

PUT  /api/v1/schools/{schoolId}/timetable/{ttId}
     {same fields for update}

DELETE /api/v1/schools/{schoolId}/timetable/{ttId}
```

### UI Component: Timetable Builder
```
┌─────────────────────────────────────────┐
│ Class: [10A ▼] │ Week View │ By Teacher │
├─────────────────────────────────────────┤
│    Mon    │    Tue    │    Wed    │ ...  │
├─────────────────────────────────────────┤
│ Period 1  │           │           │      │
│ 09:00-10:00 │ [Drag Math/Sharma]  │      │
├─────────────────────────────────────────┤
│ Period 2  │           │           │      │
│ 10:00-11:00│           │           │      │
├─────────────────────────────────────────┤
```

### Conflict Detection
```
Rule 1: One teacher can't teach 2 classes at same time
Rule 2: One class can't have 2 subjects at same time
Rule 3: One room can't be booked twice at same time

Validation on save:
- Check all existing timetables for conflicts
- If conflict found: Show error with conflicting entry
- Allow override if admin (with warning)
```

### Bulk Upload
```
CSV format (import timetable for whole school):
className,dayOfWeek,period,startTime,endTime,subject,teacher,room
10A,Monday,1,09:00,10:00,Mathematics,Mr. Sharma,A1
10A,Monday,2,10:00,11:00,English,Ms. Singh,A1
```

### Export Formats
```
1. PDF (printable, per class)
2. iCal (import to Google Calendar)
3. HTML (embed on school website)
4. CSV (edit in Excel)
```

### Tests Required (12+)
```
API Tests (4):
├─ Create timetable entry → Saved
├─ Update entry → Changes reflected
├─ Delete entry → Removed
└─ Fetch for class/day → Correct entries

Conflict Detection (4):
├─ Same teacher 2 classes → Error
├─ Same class 2 subjects → Error
├─ Same room 2 uses → Error
└─ Valid non-conflicting → Success

UI Tests (2):
├─ Drag-drop works → Period updated
└─ Conflict shown → Red highlight

Bulk Import (2):
├─ CSV parse → 50 entries created
└─ Rollback on conflict → No entries saved
```

### Deliverables
```
API: 4 endpoints (GET, POST, PUT, DELETE)
UI: Visual timetable builder (React component)
Features: Conflict detection, bulk import, export
Tests: 12+ tests passing
Performance: <500ms query
```

---

## PR #12: DEVOPS CI/CD & MONITORING (Mobile + Infrastructure)

**Lead:** DevOps Agent  
**Timeline:** Days 1-5 (runs parallel with backlog)  
**Dependencies:** Week 4 infrastructure

### Mobile CI/CD Pipeline (Fastlane)
```yaml
Workflows:
├─ Build iOS
│  ├─ Install dependencies (CocoaPods)
│  ├─ Run tests (XCTest)
│  ├─ Build app (Release config)
│  └─ Upload to TestFlight
├─ Build Android
│  ├─ Install dependencies
│  ├─ Run tests (JUnit)
│  ├─ Build APK (Release)
│  └─ Upload to Google Play Beta
└─ E2E Tests
   ├─ Simulator tests (iOS)
   ├─ Emulator tests (Android)
   └─ Cross-platform verification
```

### GitHub Actions Workflows
```yaml
Trigger: Push to main

Steps:
1. Checkout code
2. Setup Node.js 18
3. Setup React Native
4. Install dependencies (npm + pods)
5. Run tests (Jest + XCTest + JUnit)
6. Build iOS (fastlane build_ios)
7. Build Android (fastlane build_android)
8. Upload to TestFlight (iOS)
9. Upload to Google Play (Android)
10. Notify team (Slack)
```

### Monitoring for Mobile Apps
```
Cloud Monitoring metrics:
├─ App crashes (realtime)
├─ API latency from mobile
├─ Battery drain analysis
├─ Network usage
├─ Session duration
└─ User retention funnel
```

### Load Testing (1000 concurrent users)
```
Tool: Apache JMeter + Cloud Load Testing

Scenarios:
1. Login surge (100 users/second)
2. Steady load (500 concurrent)
3. Peak load (1000 concurrent)
4. Sustained peak (300 seconds)

Targets:
✅ p95 latency <400ms
✅ Error rate <0.1%
✅ Throughput >5000 RPS
✅ Zero timeouts
```

### Database Migration Strategy
```
Schema changes for new features:
1. Add new collections (non-breaking)
2. Add indexes for performance
3. Migrate data (if needed)
4. Update security rules

Tools:
- Scripted migrations (Node.js)
- Firestore admin SDK
- Validation queries
- Rollback scripts
```

### Tests Required (16+)
```
CI/CD Pipeline (8):
├─ iOS build succeeds
├─ Android build succeeds
├─ Tests run automatically
├─ Coverage report generated
├─ TestFlight upload works
├─ Google Play upload works
├─ Slack notification sent
└─ Rollback on failure

Monitoring (4):
├─ Metrics collected and stored
├─ Alerts trigger on thresholds
├─ Dashboard displays realtime
└─ Historical data charts work

Load Testing (2):
├─ Sustained 1000 RPS
└─ p95 latency <400ms

Database (2):
├─ Migration script runs
└─ Rollback works correctly
```

### Deliverables
```
Fastlane setup (iOS + Android)
GitHub Actions workflows
Mobile CI/CD pipeline
Load testing infrastructure
Database migration system
Monitoring dashboards (mobile)
16+ tests passing
```

---

## 📊 PR TEST SUMMARY

```
PR #6 (Mobile):       15 tests
PR #7 (Bulk Import):  15 tests
PR #8 (SMS):          10 tests
PR #9 (Reporting):    15 tests
PR #10 (Portal):      12 tests
PR #11 (Timetable):   12 tests
PR #12 (DevOps):      16 tests

TOTAL:               95 new tests
(Plus 12 carried from Week 4 = 107 total)
```

---

## ✅ SUCCESS CRITERIA (All PRs)

**Code Quality:**
- [ ] All 95 new tests passing (100%)
- [ ] 85%+ code coverage
- [ ] Zero critical bugs
- [ ] Zero security vulnerabilities

**Performance:**
- [ ] APIs <400ms p95
- [ ] Mobile app <2s startup
- [ ] Reports <10 seconds
- [ ] Load test: 1000 concurrent ✅

**Deployment:**
- [ ] All 6 PRs merged to main
- [ ] Blue-green deployment
- [ ] Zero downtime
- [ ] Rollback plan ready

**Business:**
- [ ] 10 new schools onboarded
- [ ] ₹30+ lakh revenue locked
- [ ] 9.2/10 average satisfaction
- [ ] Zero critical incidents

---

**Week 5 Detailed Plans Ready for Execution** ✅
**All 6 PRs Specified | All Tests Planned | All Success Criteria Defined**

---
