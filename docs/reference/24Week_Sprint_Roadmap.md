# LAUNCH ROADMAP: 24-Week Sprint Plan

**Purpose:** Week-by-week execution timeline for Pan-India School ERP  
**Duration:** 24 weeks (6 months)  
**Start Date:** Week of April 15, 2026  
**Target Launch:** Week of September 29, 2026  
**Team Size:** 2-3 engineers (Week 1) → 8 by Week 20  

---

## ⚡ MANDATORY: PRI FRAMEWORK FOR ALL ENGINEERS

**Every task, every PR, every feature must follow this process:**

1. **PLAN (30 min):** 
   - Document what you're building
   - List all files to modify
   - Identify test cases needed
   - Create PR draft with plan

2. **REVIEW (15 min):** 
   - Team reviews the plan
   - Approve or request changes
   - Get sign-off before coding

3. **IMPLEMENT (2-3 hours):**
   - Code exactly as planned
   - Write tests as you go
   - Submit for code review
   - Fix issues → merge

**See:** [17_DEVELOPMENT_WORKFLOW_STANDARDS.md](17_DEVELOPMENT_WORKFLOW_STANDARDS.md) - THIS IS ENFORCED

**Owner:** Senior Team Leader (Agent 0) - Enforce PRI on all PRs  

---

## PHASE 1: FOUNDATION & INFRASTRUCTURE (Weeks 1-4)

### Week 1-2: Setup & All 17 Specs + First Hires 
**[Lead: Agent 0 (Senior Leader) + Agent 1 (Backend) + Agent 4 (DevOps)]**

**🎯 PHASE 1: Review All 17 Technical Specifications (Mandatory)**

All team members must review and approve:
1. ✅ [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md) - 20+ REST endpoints
2. ✅ [2_FIRESTORE_SCHEMA.md](2_FIRESTORE_SCHEMA.md) - 10 collections, full schema
3. ✅ [3_CICD_PIPELINE.md](3_CICD_PIPELINE.md) - GitHub Actions automation
4. ✅ [4_FIRESTORE_SECURITY_RULES.md](4_FIRESTORE_SECURITY_RULES.md) - Multi-tenant access control
5. ✅ [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md) - Jest + >80% coverage mandate
6. ✅ [6_ESLINT_PRETTIER_CONFIG.md](6_ESLINT_PRETTIER_CONFIG.md) - Code quality enforcement
7. ✅ [7_DOCKER_LOCAL_DEV.md](7_DOCKER_LOCAL_DEV.md) - One-command setup
8. ✅ [8_ERROR_HANDLING.md](8_ERROR_HANDLING.md) - Standard error responses
9. ✅ [9_REACT_REDUX_ARCHITECTURE.md](9_REACT_REDUX_ARCHITECTURE.md) - Frontend state machine
10. ✅ [10_DEVELOPMENT_ENVIRONMENT_GUIDE.md](10_DEVELOPMENT_ENVIRONMENT_GUIDE.md) - Day 1 checklist
11. ✅ [11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md) - GCP Cloud Run setup
12. ✅ [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md) - Winston logging + metrics
13. ✅ [13_CUSTOMER_ONBOARDING.md](13_CUSTOMER_ONBOARDING.md) - School registration wizard
14. ✅ [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md) - Grading, promotion logic
15. ✅ [15_MOBILE_APP_SPECIFICATION.md](15_MOBILE_APP_SPECIFICATION.md) - React Native iOS/Android
16. ✅ [16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md) - Design system + components
17. ✅ [17_DEVELOPMENT_WORKFLOW_STANDARDS.md](17_DEVELOPMENT_WORKFLOW_STANDARDS.md) - PRI Framework MANDATORY

**Deliverables:**
- [ ] All 17 specs reviewed by team (Mon-Tue)
- [ ] Team commits to PRI framework for ALL work (Tue)
- [ ] GitHub repo created + CI/CD pipeline (Cloud Build) configured
  - See: [3_CICD_PIPELINE.md](3_CICD_PIPELINE.md)
- [ ] GCP project set up with billing + service accounts
  - See: [11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md)
- [ ] Firestore emulator running locally (Docker)
  - See: [7_DOCKER_LOCAL_DEV.md](7_DOCKER_LOCAL_DEV.md)
- [ ] Firebase project created (Auth, Firestore, Storage)
- [ ] DEVELOPMENT_ENVIRONMENT_GUIDE.md ready (Day 1 onboarding)
  - See: [10_DEVELOPMENT_ENVIRONMENT_GUIDE.md](10_DEVELOPMENT_ENVIRONMENT_GUIDE.md)
- [ ] Founding backend engineer hired & onboarded

**Activities & PRI Framework:**
- **Day 1 (Monday):** PROJECT KICKOFF
  - 1 hour: Review 17 specs (everyone reads at least 3)
  - 1 hour: Team discussion on PRI framework
  - 1 hour: GCP project setup planning
  - Action: Get commits to PRI framework from entire team
  
- **Day 2-3 (Tue-Wed):** INFRASTRUCTURE (follow [11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md))
  - PLAN: Document GCP setup, services, accounts needed
  - REVIEW: Team approves plan
  - IMPLEMENT: GCP → Firebase → Firestore emulator
  - TEST: [7_DOCKER_LOCAL_DEV.md](7_DOCKER_LOCAL_DEV.md) setup works in 30 min
  
- **Day 4-5 (Thu-Fri):** GIT + CI/CD ([3_CICD_PIPELINE.md](3_CICD_PIPELINE.md))
  - PLAN: Document GitHub strategy, CI/CD pipeline stages
  - REVIEW: Team approves
  - IMPLEMENT: GitHub repo + Cloud Build pipeline
  - TEST: First passing unit test via CI/CD
  
- **Week 2 (Next Mon):** HIRE + ONBOARD
  - Interview backend engineer (strong GCP/Firestore background)
  - Onboard using [10_DEVELOPMENT_ENVIRONMENT_GUIDE.md](10_DEVELOPMENT_ENVIRONMENT_GUIDE.md) (must complete in 30 min)
  - First task: Read all 17 specs + commit to PRI framework

**Success Metric:** 
- ✅ All 17 specs reviewed & approved by team
- ✅ Engineer can clone repo, run emulator, execute first API in 30 mins
- ✅ Team committed to PRI framework for all future work
- ✅ First CI/CD pipeline test passing

---

### Week 2-3: API Foundation & Data Model 
**[Lead: Agent 1 (Backend Architecture) using PRI Framework]**
**[Reference: SPEC #1 (API), #2 (Firestore), #3 (CI/CD), #5 (Testing), #6 (Linting), #8 (Errors), #11 (Infrastructure), #12 (Monitoring)]**

**Deliverables:**
- [ ] [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md) endpoints: POST/GET/PATCH schools
  - School creation + retrieval + updates
  - Full request/response validation (see spec #1)
  
- [ ] [2_FIRESTORE_SCHEMA.md](2_FIRESTORE_SCHEMA.md) implemented (10 collections)
  - Collections: schools, users, students, attendance, grades, exams, fees, communications, hr, analytics
  - Full indexes created for queries
  - Emulator testing working per [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md)
  
- [ ] Express.js boilerplate (routes, middleware, auth)
  - Auth middleware: Verify Firebase tokens
  - Error handling: Per [8_ERROR_HANDLING.md](8_ERROR_HANDLING.md) standard responses
  - Request validation: Joi/Zod middleware
  
- [ ] Firebase Auth integration (Google OAuth for login)
  - OAuth2 fully working
  - Token validation per [4_FIRESTORE_SECURITY_RULES.md](4_FIRESTORE_SECURITY_RULES.md)
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md) MANDATED: >80% Code Coverage
  - Unit tests for all endpoints
  - Integration tests with Firestore emulator
  - E2E tests using Supertest
  - Target: >80% code coverage by Friday
  
- [ ] [6_ESLINT_PRETTIER_CONFIG.md](6_ESLINT_PRETTIER_CONFIG.md) ENFORCED
  - Pre-commit hooks (Husky) blocking 'no lint' commits
  - CI/CD blocks PRs with linting errors
  - Zero linting errors before any merge
  
- [ ] API documentation (auto-generated from code)
  - Swagger UI at `/api/docs`
  - All endpoints match [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md) exactly
  
- [ ] Cloud Run deployed per [11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md)
  - GET /health endpoint responding
  - Response time: <200ms p95
  - Monitoring configured per [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md)
  - Winston logger configured (structured logs to Google Cloud Logging)

**Tech Stack (from specs):**
- Node.js 18 + Express.js + TypeScript
- Firestore Admin SDK + emulator
- Jest + Supertest ([5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md))
- ESLint + Prettier ([6_ESLINT_PRETTIER_CONFIG.md](6_ESLINT_PRETTIER_CONFIG.md))
- Winston logger ([12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md))
- Cloud Run ([11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md))

**Week 2-3 PRI Schedule (Mandatory for all PRs):**
- **MON:** Plan all 3 endpoints (POST/GET/PATCH)
  - PLAN: List files, test cases, edge cases
  - REVIEW: Team approves plan
  - IMPLEMENT: Not until approved!
  
- **TUE-WED:** Implement endpoints following plan
  - Code exactly as planned
  - Tests as you go
  - ESLint + Prettier run automatically
  
- **THU:** Complete testing & coverage reporting
  - Target: >80% coverage reported
  - All tests passing (local + CI/CD)
  
- **FRI:** Code review + deploy to Cloud Run
  - Full code review (PRI Framework check #17)
  - Automated deployment via CI/CD
  - Staging verification
  - Merge to main

**Metrics to Track:**
```
- Lines of code: ~2000
- Functions: ~20 (3 controllers)
- Test cases: >40 unit + integration tests
- Code coverage: >80% (mandatory)
- Test execution time: <30 seconds
- API response time: <200ms p95
```

**Success Metric:** 
- ✅ All 3 endpoints match [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md) exactly
- ✅ >80% test coverage achieved ([5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md))
- ✅ Cloud Run responding in <200ms p95
- ✅ ESLint + Prettier + PRI Framework compliance 100%
- ✅ First team member's PRs reviewed & merged using PRI process

---

### Week 3-4: Student Module MVP + Frontend 
**[Lead: Agent 1 (Backend) + Agent 2 (Frontend) + Agent 5 (QA)]**
**[Reference: SPEC #1 (API), #4 (Security), #5 (Testing), #8 (Errors), #9 (React), #16 (UI/UX)]**

**Deliverables:**
- [ ] Student CRUD API endpoints (see [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md))
  - POST /schools/{schoolId}/students (create student)
  - GET /schools/{schoolId}/students (list all)
  - GET /schools/{schoolId}/students/{studentId} (read one)
  - PATCH /schools/{schoolId}/students/{studentId} (update student)
  - DELETE /schools/{schoolId}/students/{studentId} (delete student)
  - GET /schools/{schoolId}/students/search?q=name (search by name, Aadhar)
  
- [ ] [4_FIRESTORE_SECURITY_RULES.md](4_FIRESTORE_SECURITY_RULES.md) enforcement
  - Student data readable only by school's admin/teachers
  - Parent can only see their child's data
  - Full multi-tenant isolation
  
- [ ] Student document features
  - Photo upload to Cloud Storage
  - Document vault (birth certificate, transfer certificate)
  - Metadata: Aadhar, class, section, roll number
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md) ALL ENDPOINTS
  - Unit tests for CRUD logic
  - Integration tests with Firestore emulator
  - E2E tests with real photo upload
  - Target: >80% coverage (mandatory)
  
- [ ] React Component: StudentForm.jsx (see [9_REACT_REDUX_ARCHITECTURE.md](9_REACT_REDUX_ARCHITECTURE.md))
  - Form using [16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md) design system
  - Form validations matching API spec (#1)
  - Photo upload + preview
  - Success/error handling per [8_ERROR_HANDLING.md](8_ERROR_HANDLING.md)
  
- [ ] React Component: StudentList.jsx
  - Table showing all students
  - Search & filter (name, class, section)
  - Edit/delete actions
  - Export to CSV
  
- [ ] Agent 2 (Frontend) onboarded
  - Run [10_DEVELOPMENT_ENVIRONMENT_GUIDE.md](10_DEVELOPMENT_ENVIRONMENT_GUIDE.md) (30 min)
  - Submit first PR using PRI Framework ([17_DEVELOPMENT_WORKFLOW_STANDARDS.md](17_DEVELOPMENT_WORKFLOW_STANDARDS.md))

**Load Testing:**
- 1 school tenant, 1000 students
- Search response time: <500ms
- List endpoint (pagination): <200ms

**API Endpoints by end of Week 4:**
```
POST   /api/v1/schools/{schoolId}/students
GET    /api/v1/schools/{schoolId}/students
GET    /api/v1/schools/{schoolId}/students/{studentId}
PATCH  /api/v1/schools/{schoolId}/students/{studentId}
DELETE /api/v1/schools/{schoolId}/students/{studentId}
GET    /api/v1/schools/{schoolId}/students/search?q=...
```

**Success Metric:** 
- ✅ Web app can create student, upload photo, search by name (all in <2s)
- ✅ All 6 endpoints >80% test coverage ([5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md))
- ✅ Firestore security rules enforced ([4_FIRESTORE_SECURITY_RULES.md](4_FIRESTORE_SECURITY_RULES.md))
- ✅ UI components follow design system ([16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md))
- ✅ All PRs follow PRI Framework ([17_DEVELOPMENT_WORKFLOW_STANDARDS.md](17_DEVELOPMENT_WORKFLOW_STANDARDS.md))

---

## PHASE 2: CORE WORKFLOWS (Weeks 5-12)

### Week 5-6: Attendance Module (Phase 1) 
**[Lead: Agent 1 (Backend) + Agent 2 (Frontend) + Agent 3 (Analytics)]**
**[Reference: SPEC #1 (API), #5 (Testing), #8 (Errors), #14 (Business Rules)]**

**Deliverables:**
- [ ] Attendance API endpoints per [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md)
  - POST /schools/{schoolId}/attendance/mark (mark present/absent/leave)
  - GET /schools/{schoolId}/attendance/stats (attendance % by student)
  - GET /schools/{schoolId}/attendance/daily (view by date)
  - See [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md) for attendance calculation
  
- [ ] Teacher app feature: Mark attendance (1-click per student)
  - Offline support: Mark offline → sync when WiFi available
  - See [15_MOBILE_APP_SPECIFICATION.md](15_MOBILE_APP_SPECIFICATION.md) for mobile implementation
  
- [ ] Real-time notification system
  - SMS when student absent: "Ananya absent today, class 5A"
  - See [13_CUSTOMER_ONBOARDING.md](13_CUSTOMER_ONBOARDING.md) for notification setup
  - Twilio SMS integration
  
- [ ] Offline-sync logic (critical feature)
  - IndexedDB (web) or SQLite (mobile) stores pending marks
  - Background job checks WiFi every 10s
  - When online: POST /attendance/sync uploads pending marks
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md) completeness
  - Unit tests: Attendance % calculation, sync logic
  - Integration tests: With Firestore + notifications
  - E2E tests: Mark attendance offline → go online → sync → parent gets SMS
  - Target: >80% coverage (mandatory)
  
- [ ] Class schedule master
  - Admin sets timetable per class
  - API: CRUD + search by class/day
  
- [ ] React components: AttendanceMarker, AttendanceStats
  - Teacher taps student name → "Present" button shows state change
  - Real-time update to Firestore
  - See [16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md)

**Key Feature Flow:**
```
Teacher taps "Ananya" → Clicks "Present" → 
  Saves to Firestore → "Synced" indicator shows →
  Background job sends SMS to parent: "Ananya marked present, Class 5A" →
  Attendance % auto-calculated per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
```

**Notification Stack:** (see [13_CUSTOMER_ONBOARDING.md](13_CUSTOMER_ONBOARDING.md))
- Firebase Cloud Messaging (in-app)
- Twilio (SMS to parents)
- Cloud Tasks (queue + retry logic)

**Success Metric:** 
- ✅ 45 students marked present in <60 seconds
- ✅ 100% parent notifications delivered (Track via Cloud Tasks)
- ✅ Attendance % calculated correctly per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
- ✅ Offline sync working (tested by disabling WiFi, then re-enabling)

---

### Week 6-8: Attendance Phase 2 + Grades Phase 1
**[Lead: Agent 1 (Backend) + Agent 3 (Analytics) + Agent 2 (Frontend)]**
**[Reference: SPEC #1 (API), #14 (Business Rules), #12 (Monitoring), #5 (Testing)]**

**Week 6-7: Attendance Reporting & Analytics**
- [ ] Attendance % calculation per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
  - Formula: (Days Present / Total Days) × 100
  - Minimum 75% threshold flagged
  
- [ ] Monthly attendance report (PDF export)
  - Generated via Cloud Function
  - Email + WhatsApp to parents
  
- [ ] Chronic absentees dashboard (< 75%)
  - Flag students & their parents automatically
  - Principal view: All chronic absentees in school
  - See [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md) for real-time alerts
  
- [ ] Parent dashboard: See child's attendance trend
  - Graph showing week-by-week %
  - Alert if dropping below 75%
  
- [ ] Principal dashboard: Class-level attendance summary
  - Compare classes
  - Export reports to Excel
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md): All analytics tested
  - Query performance: <10s for monthly report
  - Edge cases: Mid-month, semester transfers

**Week 8: Grades Module Begins**
- [ ] Grades API endpoints per [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md)
  - POST /schools/{schoolId}/grades (teacher enters mark)
  - GET /schools/{schoolId}/grades/{studentId} (view transcript)
  - See [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md) for grading schema
  
- [ ] Grading schema (supports multiple assessment types)
  - Quizzes (10%)
  - Tests (20%)
  - Assignment (10%)
  - Exams (60%)
  - Weighted average calculated automatically
  - See [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md) for exact formulas
  
- [ ] Teacher portal: Enter marks for tests/assignments/exams
  - Bulk import from Excel
  - Duplicate detection
  - Validation: Marks in 0-100 range
  
- [ ] React component: GradeEntryForm.jsx
  - Teachers bulk-enter marks
  - See [16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md) for table design
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md): Grade calculation tests
  - Unit: Weighted average logic
  - Integration: Firestore → calculation → report card

**Deliverables by end of Week 8:**
- ✅ Attendance fully operational at 3-4 pilot schools
- ✅ Grades module 30% complete (data entry working)

**Success Metric:** 
- ✅ Attendance report generated in <10 seconds
- ✅ 2 schools using daily attendance marking
- ✅ Grade entry form working, calculations verified

---

### Week 8-10: Grades Module (Phase 2)
**[Lead: Agent 1 (Backend) + Agent 3 (Analytics)]**
**[Reference: SPEC #1 (API), #14 (Business Rules), #5 (Testing)]**

**Deliverables:**
- [ ] Grade reporting: Subject-wise performance
  - API: GET /schools/{schoolId}/grades/{studentId}/by-subject
  - Calculations per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
  
- [ ] Class analytics: Top performers, struggling students
  - Principal view: Class rank list
  - Filter by subject, assessment type
  
- [ ] Report card generation (PDF, state-compliant format)
  - Cloud Function triggered on grade entry
  - See [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md) for exact format
  - PDF template supports: English medium, vernacular, different boards
  
- [ ] Parent portal: Real-time grades (not once/year)
  - React component: GradeView.jsx
  - Shows: Subject, assessment, mark, grade, class average
  - See [16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md)
  
- [ ] Teacher analytics: Class average trend
  - Week-by-week class average graph
  - Track performance improvements
  
- [ ] Promotion logic: Flag students <50% average
  - Automatic flagging per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
  - Principal reviews & approves promotions
  - See next phase (Exams) for full promotion workflow
  
- [ ] Report card smart features
  - jsPDF-generated PDFs from templates
  - Stored in Cloud Storage
  - Email + WhatsApp sent to parents automatically
  - Track delivery status
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md): Full report card flow tested
  - Unit: PDF generation, calculations
  - Integration: Grade entry → PDF → email sent → parent received
  - Performance: Generate 500 report cards in <2 minutes

**Success Metric:** 
- ✅ Report cards generated automatically
- ✅ 100 teachers using grade entry system by Week 10
- ✅ Parents receiving report card PDFs via email/WhatsApp
- ✅ PDF generation performance: <5s per report card

---

### Week 10-12: Exam & Assessment Module
**[Lead: Agent 1 (Backend) + Agent 2 (Frontend) + Agent 3 (Analytics)]**
**[Reference: SPEC #1 (API), #5 (Testing), #14 (Business Rules), #16 (UI/UX)]**

**Deliverables:**
- [ ] Question bank creation API (see [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md))
  - POST /schools/{schoolId}/question-bank (add question)
  - GET /schools/{schoolId}/question-bank (search questions)
  - Question types: MCQ, short-answer, long-answer, matching
  
- [ ] Question bank organized by chapter + difficulty
  - Metadata: Chapter, topic, difficulty (1-5), learning outcome
  - Teacher can filter & preview questions
  
- [ ] Exam scheduler: Create exam, assign to classes
  - API: CRUD exam instances
  - Specify: Subject, date, duration, marks
  
- [ ] Random question paper generation (difficulty-matched)
  - Cloud Function: Given exam + requirements → generate random question paper
  - Ensure: Mix of difficulty levels, no duplicates
  - Difficulty distribution per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
  
- [ ] Student exam portal: Answer questions online
  - React component: ExamTaker.jsx
  - Features: Timer, progress bar, review questions before submit
  - See [16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md)
  
- [ ] Auto-grading for MCQ (instant feedback)
  - Cloud Function: On submission → auto-grade MCQs
  - Calculation: MCQ score × weight + long-answer queue for teacher
  
- [ ] Long-answer queue for teacher review
  - Teacher Portal: ExamReviewQueue.jsx
  - Teachers rate each long-answer (0-marks for question)
  - Cloud Function: On all ratings complete → finalize score
  
- [ ] Item analysis: Discrimination index, pass percentage
  - BigQuery aggregation: Questions → performance stats
  - Admin view: Which questions need revision
  
- [ ] Result heatmap: Show which students got which questions wrong
  - BigQuery visualization via Data Studio
  - Principal view: Identifies tough questions & struggling students
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md): Full exam platform tested
  - Unit: Question randomization, auto-grading logic
  - Integration: Question bank → paper generation → submission → grading
  - E2E: Student takes exam, auto-grades, results visible to teacher
  - Load test: 200 students taking exam simultaneously
  
- [ ] Pub/Sub integration: Publish 'exam_completed' event
  - Subscribers: Email notification to teacher (exam ready for review)
  - Update analytics pipeline (see [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md))

**Database Model:**
```
exams/
├── questionBank (500+ questions, searchable by chapter)
├── examInstances (exam scheduled for Class 5A on date)
├── studentSubmissions (each student's answers)
├── gradingQueue (long-answer submissions awaiting teacher)
└── analytics (aggregated results)
```

**Success Metric:** 
- ✅ 200 students take mock exam
- ✅ MCQ results + analysis available in 5 minutes (auto-graded)
- ✅ Item analysis shows discrimination index for all questions
- ✅ Teacher can review long-answers + finalize scores within 1 hour
- ✅ Parent sees results via portal + SMS notification

---

## PHASE 3: OPERATIONS & SCALE (Weeks 13-18)

### Week 13-14: Communication Hub
**[Lead: Agent 1 (Backend) + Agent 2 (Frontend)]**
**[Reference: SPEC #1 (API), #13 (Customer Onboarding), #5 (Testing)]**

**Deliverables:**
- [ ] Admin announces to all parents (see [13_CUSTOMER_ONBOARDING.md](13_CUSTOMER_ONBOARDING.md))
  - API: POST /schools/{schoolId}/announcements
  - Broadcast to: SMS + email + app + WhatsApp
  - Scheduling: Send at specific time (e.g., 3:15pm when kids leave school)
  
- [ ] Teacher sends class-level messages
  - API: POST /schools/{schoolId}/classes/{classId}/announcements
  - Visible to: All students in class + their parents
  
- [ ] Two-way chat: Parent ↔ Teacher
  - Real-time messaging via Firestore + Firebase realtime database
  - React component: ChatWidget.jsx
  - Mobile: Within app, no SMS for chat
  
- [ ] Notification preferences: Each parent chooses channels
  - User settings: SMS (yes/no), Email (yes/no), Push (yes/no), WhatsApp (yes/no)
  - API: PATCH /users/{userId}/notification-preferences
  - Respect opt-outs (GDPR compliant)
  
- [ ] SMS gateway integration (Twilio or Exotel selected)
  - Twilio: ₹0.75 per SMS (outbound India)
  - Cost: ~₹500/month for small school (~500 SMS/day)
  
- [ ] Announcement scheduling (send 3:15pm when kids leave)
  - Cloud Scheduler: Trigger Cloud Function at specific time per school timezone
  - Timezone handling: Each school has timezone setting
  
- [ ] WhatsApp integration (via Twilio)
  - Announcements can be sent via WhatsApp instead of SMS
  - Business account required (application process: 1-2 weeks)
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md): Full communication flow tested
  - Unit: Message formatting, scheduling logic
  - Integration: Announcement → SMS/email/WhatsApp sent
  - Monitor: Delivery status tracking per channel
  - Performance: Broadcast to 1000 parents in <2 min
  
- [ ] Notification channels (per [13_CUSTOMER_ONBOARDING.md](13_CUSTOMER_ONBOARDING.md))
  - Firebase Cloud Messaging (in-app, web push)
  - SMS (Twilio)
  - Email (SendGrid)
  - WhatsApp (Twilio)
  - In-app chat (Firestore realtime)
  
- [ ] React components
  - AnnouncementBoard.jsx (display announcements)
  - ChatWidget.jsx (two-way messaging)
  - NotificationSettings.jsx (user preferences)

**Success Metric:** 
- ✅ Announcement sent to 500 parents
- ✅ All 500 within 2 minutes (track delivery status)
- ✅ Parent notification preferences respected (GDPR)
- ✅ Chat fully functional (no message delays > 5s)
- ✅ WhatsApp integration live (pending business account approval)

---

### Week 14-16: Financial Module
**[Lead: Agent 1 (Backend) + Agent 2 (Frontend) + Agent 3 (Analytics)]**
**[Reference: SPEC #1 (API), #5 (Testing), #14 (Business Rules)]**

**Deliverables:**
- [ ] Fee structure templates (different for each class)
  - API: CRUD fee structures per [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md)
  - Templates: Class 1-2, 3-5, 6-8, 9-10 with different amounts
  - Example (from [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)):
    - Class 1-2: Tuition ₹2,000 + Activity ₹500 + Transport ₹200 = ₹2,700
    - Class 3-5: Tuition ₹3,000 + Activity ₹500 + Transport ₹300 = ₹3,800
    - Class 6-8: Tuition ₹4,000 + Activity ₹500 + Transport ₹500 = ₹5,000
  
- [ ] Invoice generation (PDF)
  - Cloud Function: On fee charge date → generate PDF invoices
  - Template: School letterhead, student details, fee breakdown, due date
  - Bulk generation: 1000 invoices per day
  
- [ ] Payment tracking (manual entry + Razorpay API)
  - API: PATCH /invoices/{invoiceId}/payment (record payment)
  - Razorpay webhook: Auto-record payments from online portal
  - Manual entry: For cash/check/DD payments
  
- [ ] Fee collection dashboard (% collected, outstanding)
  - Principal view: Collection % by class, by month
  - React component: FeeCollectionDashboard.jsx
  - Metrics: Total due, collected, outstanding
  - Graph: Collection trend over time
  
- [ ] Defaulter report (students overdue)
  - API: GET /schools/{schoolId}/fee-defaulters (>30 days overdue)
  - Admin view: Send defaulter reminders (SMS + email)
  - Filter: By class, by amount outstanding
  
- [ ] Parent portal: Pay fees online (Razorpay button)
  - React component: PaymentGateway.jsx
  - Parents see: Outstanding balance, due date
  - One-click payment via Razorpay (credit/debit/UPI)
  - Instant payment confirmation + SMS
  
- [ ] Reconciliation: Match payments to invoices
  - Cloud Function: Daily reconciliation job
  - Track: Cash discrepancies, mismatched payments
  - Manual override: For partial payments, multiple payments
  
- [ ] Discount/scholarship application
  - API: Apply discount to student fee per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
  - Examples: Scholarship 50%, Sibling discount 10%
  - Auto-recalculate invoices
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md): Full financial flow tested
  - Unit: Fee calculations, discount logic, reconciliation
  - Integration: Fee charged → invoice generated → payment recorded → reconciled
  - Performance: Generate 1000 invoices in <2 minutes
  - Security: PCI compliance for online payments (Razorpay handles)

**Payment Integration:**
- Razorpay API (payment gateway)
- Invoice PDF emailed + available in portal
- Payment webhook updates Firestore in real-time
- Parent gets SMS/email: "₹3,000 received, thank you"

**Success Metric:** 
- ✅ ₹5L+ collected via app in first month
- ✅ 95% reconciliation accuracy (all payments matched to invoices)
- ✅ Invoice generation automated (zero manual entry)
- ✅ Parents paying online: >50% via Razorpay

---

### Week 16-18: HR Module
**[Lead: Agent 1 (Backend) + Agent 2 (Frontend)]**
**[Reference: SPEC #1 (API), #5 (Testing), #14 (Business Rules)]**

**Deliverables:**
- [ ] Staff directory (name, qualifications, phone, email)
  - API: CRUD staff per [1_API_SPECIFICATION.md](1_API_SPECIFICATION.md)
  - Fields: Name, phone, email, qualifications, experience, specialization
  - React component: StaffDirectory.jsx
  
- [ ] Payroll: Salary structure + deductions
  - API: CRUD salary structure per employee
  - Calculations per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md):
    - Basic + HRA + DA (allowances)
    - Minus: PF (12%), Tax (as per IT slabs), ESI (if applicable)
    - Net = Gross - all deductions
  
- [ ] Salary slip generation (PDF)
  - Cloud Function: On salary month → generate PDFs for all staff
  - Template: Earnings breakdown, deductions, net amount, tax summary
  - Email + WhatsApp to staff
  
- [ ] Leave management (request → approval → balance tracking)
  - API: POST /staff/{staffId}/leave-request (request leave)
  - Approval workflow: Staff → HOD → Principal
  - Firestore tracks: Leave balance, used, pending
  - Types: Casual, sick, earned, privilege
  
- [ ] Staff attendance (clock in/out)
  - React component: Attendance screen
  - Mobile app: QR code scan or manual entry
  - Attendance % calculation (for bonus/incentive)
  
- [ ] Performance reviews (optional: quarterly)
  - API: CRUD performance reviews
  - Fields: Goals, achievements, rating (1-5), notes
  - Optional: Start with attendance/payroll, add later
  
- [ ] Document vault (contracts, certifications)
  - Cloud Storage: Upload documents (PDF, JPG)
  - API: Manage documents per staff member
  - Search/filter by document type & date
  
- [ ] [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md): Full HR workflow tested
  - Unit: Payroll calculations, leave balance logic
  - Integration: Salary entry → slip generation → email sent
  - Performance: Generate 50 salary slips in <1 minute
  - Edge cases: Tax calculations for different brackets, mid-month joins

**Payroll Features:**
- Auto-calculate: Salary - PF - Tax = Net (per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md))
- Generate compliance reports: IT, ESI, PF contributions
- Bulk salary slip distribution via email/WhatsApp

**Success Metric:** 
- ✅ 50 staff members' payroll processed
- ✅ Salary slips generated & distributed (zero manual entry)
- ✅ Compliance reports (IT/ESI/PF) accurate & ready for filing
- ✅ Leave management fully functional (requests → approvals → balance)
- ✅ Zero disputes on salary calculations

---

## PHASE 4: INTELLIGENCE & POLISH (Weeks 19-24)

### Week 19-20: Analytics & Dashboards
**[Lead: Agent 3 (Data & Analytics) + Agent 2 (Frontend)]**
**[Reference: SPEC #12 (Monitoring & Observability), #16 (UI/UX)]**

**Deliverables:**
- [ ] BigQuery dataset populated (daily sync of all data)
  - Cloud Function: Daily job syncs Firestore → BigQuery
  - Schema: All tables match Firestore collections
  - Partitioning: By school_id for performance
  - See [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md) for logging & monitoring
  
- [ ] Principal dashboard: Student performance, attendance, revenue, enrollment
  - React component: PrincipalDashboard.jsx using [16_UI_UX_COMPONENT_LIBRARY.md](16_UI_UX_COMPONENT_LIBRARY.md)
  - KPIs: Total revenue, collection %, enrollment trend, attendance %
  - Heatmap: Student performance (red/yellow/green by grade)
  
- [ ] Teacher dashboard: Class performance, student progress
  - React component: TeacherDashboard.jsx
  - Charts: Class average trend, attendance, grade distribution
  - Drill-down: Click class → see individual students
  
- [ ] Parent dashboard: Child's grades, attendance, announcements
  - React component: ParentDashboard.jsx
  - Cards: Grades (latest 5 subjects), attendance %, announcements
  - Quick links: Pay fees, view report card, send message to teacher
  
- [ ] Board member dashboard: School KPIs (enrollment, revenue, performance)
  - Top-line metrics: Total enrolled, monthly revenue, average performance
  - Comparison: vs. targets, vs. previous year
  
- [ ] Data Studio: Live dashboards (auto-refresh hourly)
  - Google Data Studio connected to BigQuery
  - Embeddable dashboards per school
  - Shared with admin/principal via dashboard link
  
- [ ] Custom reports: Export to Excel/PDF
  - API: Generate custom reports (filtering, grouping)
  - Cloud Function: Convert BigQuery results → Excel file
  - Email file or download from dashboard
  
- [ ] [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md) Integration
  - Error rates, API latency, uptime metrics
  - Custom dashboards for ops team
  - Alerts on anomalies (high error rate, slow queries)

**Dashboard Metrics:**
- **Student Performance:** Class average, top 10, bottom 10, grade distribution
- **Attendance:** Overall %, by class, chronic absentees, trend
- **Financial:** Total revenue, % collected, outstanding, trend, pie chart by source
- **Enrollment:** Total students, by class, growth trend, retention %
- **Engagement:** Daily active users, feature adoption, login frequency

**Success Metric:** 
- ✅ Principal views real-time dashboard, makes data-driven decision
- ✅ BigQuery syncing daily with zero data loss
- ✅ Reports generated in <10 seconds for 10K records
- ✅ Custom reports exported to Excel in <30 seconds

---

### Week 20-22: Testing, Security & Polish
**[Lead: Agent 5 (QA & Testing) + Agent 0 (Senior Leader)]**
**[Reference: SPEC #5 (Testing), #3 (CI/CD), #7 (Docker), #17 (PRI Framework), #8 (Error Handling)]**

**Deliverables:**
- [ ] All API endpoints: >80% code coverage (Jest)
  - Target: 80% lines, 75% branches
  - Tools: Jest + Istanbul (coverage reporting)
  - See [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md)
  
- [ ] Integration tests: All workflows (Supertest)
  - Tests: API + Firestore + external services
  - Example: Student creation → updates attendance → generates report card
  
- [ ] E2E tests: Critical paths (Playwright)
  - Paths: Login → Create student → Mark attendance → View grades → Pay fees
  - Browsers: Chrome, Firefox, Safari (macOS/iOS testing)
  - See [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md)
  
- [ ] Security audit (OWASP, SQL injection, XSS, CSRF)
  - OWASP Top 10 checklist:
    1. Broken access control (Firestore rules verify)
    2. Cryptographic failures (TLS + encryption at rest)
    3. Injection (Firestore parameterized queries)
    4. Insecure design (threat modeling completed)
    5. Security misconfiguration (GCP best practices)
    6. Vulnerable components (dependency scanning)
    7. Auth failures (Firebase Auth + MFA)
    8. Software/data integrity (CI/CD verified builds)
    9. Logging/monitoring (Winston logging in place)
    10. SSRF (rate limiting + WAF rules)
  
- [ ] Penetration testing (hire external firm)
  - Scope: Web app + mobile app + APIs
  - Duration: 1 week
  - Report: Findings + remediation plan
  
- [ ] Performance testing (1000 concurrent users)
  - Load test: 1000 users marking attendance simultaneously
  - Tools: Apache JMeter or Gatling
  - Target: <500ms response time at p95
  - See [11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md) for scaling
  
- [ ] Bug bash: 2-week sprint fixing issues
  - All critical bugs (P0) fixed before launch
  - P1 bugs: 90% fixed
  - P2 bugs: Backlog for post-launch
  
- [ ] Mobile app polish (iOS + Android)
  - Refer: [15_MOBILE_APP_SPECIFICATION.md](15_MOBILE_APP_SPECIFICATION.md)
  - QA: All features working on iOS/Android
  - Performance: App startup <3s
  
- [ ] UX refinement (based on user testing)
  - User tests: 5 schools, 20 users each
  - Feedback: Collect via surveys + session recordings
  - Changes: Prioritize top 10 pain points
  
- [ ] [17_DEVELOPMENT_WORKFLOW_STANDARDS.md](17_DEVELOPMENT_WORKFLOW_STANDARDS.md) Enforcement
  - All PRs follow PRI framework (Plan → Review → Implement)
  - No commits to main without code review
  - All developers trained on framework

**Security Checklist:**
- [ ] All API endpoints authenticated (Firebase Auth)
- [ ] Firestore rules enforce permissions ([4_FIRESTORE_SECURITY_RULES.md](4_FIRESTORE_SECURITY_RULES.md))
- [ ] Student data encrypted at rest (GCP KMS)
- [ ] HTTPS enforced (all environments)
- [ ] Cloud KMS for secrets management
- [ ] Audit logs for sensitive actions (user creation, fee payment, grades entered)
- [ ] GDPR compliance (EU data residency optional, email/SMS opt-in)
- [ ] Backup strategy (daily automated, retention: 30 days)
- [ ] Rate limiting on public APIs (100 req/min per IP)

**Performance Targets:**
- API latency: <200ms P95 (see [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md))
- Page load: <2s (web, see [9_REACT_REDUX_ARCHITECTURE.md](9_REACT_REDUX_ARCHITECTURE.md) optimization)
- Mobile app startup: <3s (see [15_MOBILE_APP_SPECIFICATION.md](15_MOBILE_APP_SPECIFICATION.md))
- Concurrent users: 1000 at single school scale

**Success Metric:** 
- ✅ >80% test coverage achieved
- ✅ Security audit: Zero critical findings
- ✅ Performance: 1000 concurrent users handled, <500ms p95 response
- ✅ Bug bash: <10 P0 bugs in production
- ✅ Mobile apps: 4.5+ star rating on stores
- ✅ Production-ready certification: All green lights

---

### Week 22-24: Launch Prep & Deployment
**[Lead: Agent 0 (Senior Leader) + Agent 4 (DevOps) + Agent 6 (Product Manager)]**
**[Reference: SPEC #11 (Infrastructure), #12 (Monitoring), #13 (Customer Onboarding), #17 (PRI Framework)]**

**Week 22 Deliverables: Pre-Launch Readiness**
- [ ] Documentation (3 guides for different users)
  - Admin guide: School setup, user management, configuration
  - Teacher guide: Mark attendance, enter grades, view reports
  - Parent guide: Login, view child's progress, pay fees, send messages
  - PDF + video tutorials (see next point)
  
- [ ] Video tutorials (10+ shorts, 30s each on YouTube)
  - Topics: How to login, mark attendance, view grades, pay fees, etc.
  - Hosted: YouTube School ERP channel (with subtitles)
  - Mobile: Embedded in app help section
  
- [ ] Support process: Email + WhatsApp hotline
  - Email: support@schoolerp.in (response: <4 hours)
  - WhatsApp: +91-XXXXXXXXXX (response: <2 hours, business hours)
  - Ticketing system: Help desk software (Freshdesk / Zoho)
  
- [ ] Onboarding script: 2-week go-live plan per school
  - Week 1: Setup, user creation, data import
  - Week 2: Training, pilot users (2-3 teachers), bug fixes
  - Launch: Full rollout to all teachers & parents
  - See [13_CUSTOMER_ONBOARDING.md](13_CUSTOMER_ONBOARDING.md)
  
- [ ] Marketing materials
  - Website: schoolerp.in (landing page)
  - Email template: announcement to school principals
  - Case study: 1 pilot school success story
  - Social media: Twitter/LinkedIn posts (5 per week)
  
- [ ] Pricing finalized (confirmed & tested)
  - Tier 1: ₹20K/year (schools <500 students)
  - Tier 2: ₹40K/year (schools 500-1500 students)
  - Tier 3: ₹80K+/year (schools >1500 students)
  - Features: Same, plus custom onboarding
  
- [ ] Legal: T&C, Privacy Policy, Data Processing Agreement
  - Reviewed by lawyer (cybersecurity + data privacy)
  - GDPR compliant
  - School customer agreement template
  
- [ ] Sales team ready
  - 2-3 person sales team trained on product
  - Demo scripts prepared
  - First 10 leads contacted (email + calls)

**Week 23: Staging Deployment**
- [ ] Deploy all code to staging (GCP staging project)
  - See [11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md)
  - Staging = identical to production (minus data scale)
  
- [ ] Run full E2E test suite
  - Playwright: Critical paths on staging
  - All tests must pass before production
  
- [ ] Load test (1000 users, attendance marking peak load)
  - Simulate: Peak usage (3:00 PM when students mark attendance)
  - Verify: <500ms p95 response, zero errors
  
- [ ] Disaster recovery test (restore from backup)
  - Procedure: Restore Firestore from 7-day-old backup
  - Verify: Data restored completely, migrations run smoothly
  - Time to recovery: <30 minutes
  
- [ ] Sales team onboards, ready to pitch
  - Watch platform demo video (30 min)
  - Practice pitch with Product Manager
  - First customer meeting: 1 school (pre-arranged, discounted ₹10K/year)
  
- [ ] [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md): Alerts configured
  - Error rate > 1% → Page on-call engineer
  - API latency > 500ms p95 → Alert Ops team
  - Firestore quota exceeded → Alert DevOps
  - Database backup failed → Alert DevOps

**Week 24: Production Launch**
- [ ] Blue-green deployment to production
  - Deploy: New version to GCP Green environment
  - Verify: All health checks passing
  - Switch: Traffic from Blue → Green (1 minute cutover)
  - Rollback plan: Revert to Blue if issues
  - See [11_INFRASTRUCTURE_DEPLOYMENT.md](11_INFRASTRUCTURE_DEPLOYMENT.md)
  
- [ ] Monitor 24/7 for errors, latency, availability
  - On-call rotation: Engineering + Support team
  - Escalation: P0 bugs → Immediate fix, deploy hotfix
  - Status page: Public uptime dashboard
  - See [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md)
  
- [ ] On-call support team ready
  - Support engineer: Monitor ticketing system
  - Engineering: Available for escalations
  - Incident protocol: Slack channel, resolution tracking
  
- [ ] First customer (pre-arranged, discounted ₹10K/year)
  - School name: [TBD in Week 22]
  - Go-live date: Monday of launch week
  - Success metric: 50% of teachers active in Week 1
  
- [ ] Celebrate! 🎉
  - Team celebration (virtual meeting + takeout)
  - Announce launch via Twitter/LinkedIn/email
  - Press release (if applicable for B2B SaaS)

**Key Deliverables by Launch:**
- ✅ All 17 technical specs fully implemented & tested
- ✅ PRI Framework (spec #17) enforced on all 500+ commits
- ✅ Production infrastructure (GCP, Cloud Run, Firestore)
- ✅ Monitoring & alerts (spec #12)
- ✅ Customer onboarding 2-week flow (spec #13)
- ✅ First paying customer signed & going live
- ✅ Support team ready for 24/7 coverage

**Launch Success Metrics:** 
- ✅ 99.9% uptime (first week after launch)
- ✅ <200ms p95 API latency sustained
- ✅ Zero critical bugs in production
- ✅ First customer 50%+ teacher adoption Week 1
- ✅ NPS score >40 from pilot feedback

---

## WEEK-BY-WEEK SUMMARY TABLE

| Week | Phase | Focus Module | Backend | Frontend | Milestone |
|------|-------|--------------|---------|----------|-----------|
| 1-2 | Foundation | Infrastructure | Boilerplate | n/a | GCP + API framework ready |
| 2-4 | Foundation | Students | CRUD API | StudentForm | Student mgmt live |
| 5-6 | Workflows | Attendance | Mark + sync | AttendanceWidget | Attendance tracking |
| 6-8 | Workflows | Attendance + Grades | Reports + grading | ReportCard | Grades partially working |
| 8-10 | Workflows | Grades (Phase 2) | Report card gen | GradeViewParent | Report cards auto-generated |
| 10-12 | Workflows | Exams | Auto-grading | ExamTaker | Exam module complete |
| 13-14 | Operations | Communication | SMS/notification | AnnouncementBoard | Messaging operational |
| 14-16 | Operations | Finance | Invoicing + Razorpay | PaymentGateway | Fee collection live |
| 16-18 | Operations | HR | Payroll | StaffDirectory | Payroll complete |
| 19-20 | Intelligence | Analytics | BigQuery sync | Dashboard | Real-time insights ready |
| 20-22 | Polish | Testing + Security | Code coverage, audit | Bug fixes | Production-ready |
| 22-24 | Launch | Deployment |Prod infrastructure | Marketing | Go-live! |

---

## DEPLOYMENT ENVIRONMENTS

### Development (Local)
```
Firestore Emulator: localhost:8080
Cloud Run Emulator: localhost:8080
Frontend: localhost:3000
```

### Staging (GCP)
```
Firestore: school-erp-staging.firebaseio.com
Cloud Run: https://school-erp-api-staging-xyz.a.run.app
Frontend: https://staging.schoolerp.in
```

### Production (GCP)
```
Firestore: school-erp-prod.firebaseio.com
Cloud Run: https://school-erp-api-prod-xyz.a.run.app
Frontend: https://app.schoolerp.in
```

---

## KEY METRICS TO TRACK WEEKLY

### Engineering Metrics
- Code committed (lines, functions, modules)
- Test coverage (% of code tested)
- Bugs found + fixed
- Performance (API latency, errors, uptime)
- Technical debt

### Customer Metrics (Post-Launch)
- Schools signed up (target: 10 by Week 24)
- Daily active users
- Feature adoption (% using each module)
- Support tickets (response time, resolution)
- Customer satisfaction (NPS)

### Business Metrics
- Revenue run rate
- Customer acquisition cost (CAC)
- Churn rate
- Lifetime value (LTV)
- Burn rate (expenses - revenue)

---

## CRITICAL SUCCESS FACTORS

1. **Fast iteration:** Ship every 2 weeks (even if incomplete)
2. **Customer feedback:** Interview 1 pilot school every week
3. **Quality gates:** No production release without >80% test coverage
4. **Team communication:** Daily standup (15 mins), weekly retro
5. **Documentation:** Write docs as you build (not after)
6. **Monitoring:** Alerts configured before each launch
7. **Contingency:** 1-week buffer for unexpected issues (security, performance)

---

## RISKS & CONTINGENCIES

| Risk | Impact | Mitigation | Owner |
|------|--------|-----------|-------|
| **Hiring takes longer** | Delays everything | Start recruiting Week 1, try contract devs | You |
| **Firestore scales slower** | App slow > users churn | Pre-plan for Cloud Spanner upgrade | Backend Lead |
| **Feature creep** | Misses launch | Strict scope control, no new features after W15 | Product Owner |
| **Security issues found late** | Delays launch | Audit at Week 20, not Week 24 | Tech Lead |
| **First school goes slow** | Discourages CAC | Plan 4-week onboarding, not 2 | Sales |

---

## WEEKLY STANDUP TEMPLATE

Every Monday 10am:

**Each person (2 mins):**
- What I shipped last week
- What I'm shipping this week
- Blockers (e.g., "Need DevOps to set up Redis")

**Metrics:**
- Velocity (points completed)
- Test coverage trending
- Bugs open vs closed
- Customer feedback

**Decisions:**
- Any scope changes?
- Any deployment needed?
- Any hiring moves?

---

## SAMPLE WEEK 1 DAILY STANDUP

**Day 1 (Monday): Kickoff**
- Announce 24-week timeline
- Distribute business plan + architecture docs
- Set up GCP billing + project access

**Day 2 (Tuesday): Infrastructure**
- Firebase project created
- Firestore emulator running locally
- GitHub repo + CI/CD pipeline configured

**Day 3 (Wednesday): First Code**
- Express.js boilerplate (auth, routes, error handling)
- `/health` endpoint live on Cloud Run
- First test written + passing

**Day 4 (Thursday): Review**
- Engineering review of boilerplate
- Performance baseline (cold start time, latency)
- One-on-one with backend engineer

**Day 5 (Friday): Plan Week 2**
- Hiring interview (backend engineer candidate)
- Week 2 sprint planning (Student CRUD)
- Retrospective (what went well, what didn't)

---

