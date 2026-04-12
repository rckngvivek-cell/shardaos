# 🚀 SCHOOL ERP BUILD EXECUTION PLAN - WEEK 1 SPRINT

**Current Date:** April 9, 2026  
**Sprint Duration:** Week 1 (April 9-15, 2026)  
**Build Strategy:** Parallel multi-agent execution with synchronized checkpoints  
**Success Criteria:** Foundation phase complete, all 7 workstreams launched, zero blockers

---

## AGENT DEPLOYMENT MAP

```
ORCHESTRATION TIER (Master Agents):
├─ Deploy Expert (Lead) → Infrastructure + Cloud Setup
├─ Explore Agent → Codebase investigation (baseline)
└─ modernize-design → Architecture validation + tech decisions

IMPLEMENTATION TIER (Parallel Workstreams):
├─ Backend Agent Path (Firebase + API)
│  └─ Firestore schema + Cloud Functions starter
├─ Frontend Agent Path (React UI)
│  └─ Design system + component library scaffold
├─ DevOps Agent Path (CI/CD + Cloud Run)
│  └─ Cloud Run deployment template + scheduler setup
├─ QA Agent Path (Testing Framework)
│  └─ Jest/Cypress setup + test infrastructure
├─ Data Agent Path (Analytics)
│  └─ BigQuery dataset schema + sync jobs
└─ Documentation Agent Path (Knowledge)
│  └─ ADRs + architecture diagrams

VERIFICATION TIER:
├─ Integration checks at checkpoint (end of week)
├─ Build validation (code compiles)
└─ Deployment test (staging env)
```

---

## PARALLEL WORKSTREAMS - WEEK 1

### Workstream 1: Infrastructure & Cloud Setup (Deploy Expert) ⚙️

**Status:** LAUNCHING NOW  
**Duration:** Days 1-3  
**Deliverables:**
- ✅ GCP project configured (Firestore, BigQuery, Cloud Run)
- ✅ Service accounts + RBAC setup
- ✅ Cloud Scheduler enabled
- ✅ Pub/Sub topics created
- ✅ Monitoring + alerting baseline

**Commands Executed:**
```bash
# GCP Setup
gcloud projects create school-erp-prod
gcloud services enable firestore cloudfunctions run compute bigquery pubsub storage

# Firestore initialization
gcloud firestore databases create --region=asia-south1

# Service accounts
gcloud iam service-accounts create school-erp-backend
gcloud iam service-accounts create school-erp-scheduler

# Cloud Run setup (reserved)
gcloud run enable --region=asia-south1
```

**Checkpoint:** Setup complete → Document in 19_CLOUD_INFRASTRUCTURE_SETUP.md

---

### Workstream 2: Backend Architecture (Firebase + API Layer) 📦

**Status:** LAUNCHING NOW  
**Duration:** Days 1-5  
**Deliverables:**
- ✅ Firebase Admin SDK initialized  
- ✅ Firestore collections schema (v1)
- ✅ Cloud Function starter templates (5 core functions)
- ✅ API type definitions (TypeScript)
- ✅ Authentication middleware

**Firestore Schema (First Pass):**
```
/schools/{schoolId}
  ├─ name, email, phone, address
  ├─ /students/{studentId}
  │  ├─ name, email, phone, class, roll_no
  │  └─ /attendance/{dateISO}/{mark}
  ├─ /staff/{staffId}
  │  ├─ name, email, phone, role, salary
  │  └─ /payroll/{monthYear}/{record}
  ├─ /grades/{examId}/{studentId}/{subject}
  ├─ /fees
  │  ├─ /structure/{classId} = {items}
  │  └─ /invoices/{studentId}/{monthYear}
  └─ /audit_logs

/administrators/{adminId}
  ├─ email, name, role (super_admin, school_admin, finance, etc.)
  └─ /access_logs
```

**Cloud Functions (v1 - Basic):**
1. `markAttendance` → triggered by POST /attendance/mark
2. `syncToBigQuery` → triggered by Firestore document change
3. `generateInvoice` → triggered by Cloud Scheduler (monthly 1st)
4. `sendNotification` → triggered by Pub/Sub (fan-out to SMS/Email)
5. `backupFirestore` → triggered by Cloud Scheduler (daily 2am)

**Checkpoint:** Core schema + 5 functions deployed to staging → Test in 20_BACKEND_IMPLEMENTATION.md

---

### Workstream 3: Frontend Architecture (React Shell + Design System) 🎨

**Status:** LAUNCHING NOW  
**Duration:** Days 2-5  
**Stack:** React 18 + TypeScript + Redux Toolkit + Material-UI v5  
**Deliverables:**
- ✅ React project scaffold (create-react-app or Vite)
- ✅ TypeScript configuration
- ✅ Redux store setup (RTK)
- ✅ Material-UI theme + component library imported
- ✅ Authentication guard component (Firebase Auth)
- ✅ Core layouts (Dashboard, StudentHome, TeacherPortal, AdminPanel)

**Project Structure:**
```
frontend/
├─ src/
│  ├─ components/
│  │  ├─ Auth/ (LoginPage, SignupPage, ProtectedRoute)
│  │  ├─ Dashboard/ (StudentDashboard, TeacherDashboard, AdminDashboard)
│  │  ├─ Shared/ (Header, Sidebar, Footer, Modal)
│  │  └─ Forms/ (AttendanceForm, GradeForm, FeeForm)
│  ├─ pages/ (Router setup)
│  ├─ redux/ (store, slices: auth, schools, students, etc.)
│  ├─ utils/ (api.ts, firebase.ts, validators.ts)
│  ├─ types/ (TypeScript interfaces for all data models)
│  ├─ hooks/ (useAuth, useSchool, useStudent custom hooks)
│  └─ App.tsx, index.tsx
├─ public/ (logo, icons)
├─ package.json (dependencies)
└─ tsconfig.json
```

**Checkpoint:** Pages load, auth works, Redux connected → Demo in 21_FRONTEND_IMPLEMENTATION.md

---

### Workstream 4: DevOps & CI/CD Pipeline 🔄

**Status:** LAUNCHING NOW  
**Duration:** Days 2-5  
**Deliverables:**
- ✅ GitHub repository setup (mono-repo or multi-repo)
- ✅ GitHub Actions CI workflow (lint, typecheck, test, build)
- ✅ Cloud Run deployment configuration (Dockerfile, deploy.yaml)
- ✅ Environment variables management (.env.staging, .env.prod)
- ✅ Secret management (Google Secret Manager integration)

**CI/CD Pipeline:**
```yaml
Triggers:
  ├─ On: Push to main → Deploy to prod
  ├─ On: Push to staging → Deploy to staging
  ├─ On: PR created → Run tests, lint, typecheck (block if fails)
  └─ On: Tag release → Deploy + version management

Jobs:
  ├─ Lint (ESLint, Prettier)
  ├─ Type Check (TypeScript)
  ├─ Unit Tests (Jest)
  ├─ Integration Tests (if backend ready)
  ├─ Build Docker image
  ├─ Push to Artifact Registry
  └─ Deploy to Cloud Run
```

**Checkpoint:** GitHub Actions working, first deployment to staging → Log in 22_DEVOPS_PIPELINE.md

---

### Workstream 5: QA & Testing Framework 🧪

**Status:** LAUNCHING NOW  
**Duration:** Days 2-5  
**Test Stack:** Jest (unit) + React Testing Library (component) + Cypress (E2E)  
**Deliverables:**
- ✅ Jest configuration + sample tests
- ✅ React Testing Library setup
- ✅ Cypress E2E framework
- ✅ Test directory structure
- ✅ GitHub Actions CI integration (run tests on PR)

**Test Structure:**
```
tests/
├─ unit/
│  ├─ utils/ (validators, formatters)
│  ├─ redux/ (reducer logic)
│  └─ services/ (API calls mock)
├─ integration/
│  ├─ auth-flow.test.ts
│  ├─ attendance-marking.test.ts
│  └─ grade-entry.test.ts
└─ e2e/ (Cypress)
   ├─ login.cy.ts
   ├─ student-dashboard.cy.ts
   └─ teacher-attendance.cy.ts
```

**Checkpoint:** Test suite runs, baseline coverage >50% → Results in 23_QA_TESTING_STRATEGY.md

---

### Workstream 6: Data Platform (BigQuery + Analytics) 📊

**Status:** LAUNCHING NOW  
**Duration:** Days 3-5  
**Deliverables:**
- ✅ BigQuery datasets created (prod, staging)
- ✅ Table schemas defined (schools, students, attendance, grades, fees, payroll)
- ✅ Cloud Functions for real-time sync (Firestore → BigQuery)
- ✅ Sample SQL queries (for dashboards)
- ✅ Data retention policies (30-day daily, 1-year monthly)

**BigQuery Schema:**
```sql
-- Dataset: school_erp_prod

CREATE TABLE schools (
  school_id STRING,
  name STRING,
  email STRING,
  phone STRING,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

CREATE TABLE students (
  school_id STRING,
  student_id STRING,
  name STRING,
  class STRING,
  roll_no INT,
  email STRING,
  phone STRING,
  created_at TIMESTAMP,
  _PARTITIONTIME DATE
);

CREATE TABLE attendance (
  school_id STRING,
  student_id STRING,
  date DATE,
  status STRING, -- present, absent, leave
  created_at TIMESTAMP,
  _PARTITIONTIME DATE
) PARTITION BY date CLUSTER BY school_id;

-- [Similar for grades, fees, payroll, audit_logs]
```

**Checkpoint:** Datasets created, sync function deployed, test data flowing → Verify in 24_DATA_PLATFORM.md

---

### Workstream 7: Documentation & Architecture (ADRs) 📚

**Status:** LAUNCHING NOW  
**Duration:** Days 1-5  
**Deliverables:**
- ✅ ADR-001: Tech stack decision (GCP, Firebase, React)
- ✅ ADR-002: Authentication strategy (Firebase Auth + JWT)
- ✅ ADR-003: Database design (Firestore denormalization strategy)
- ✅ ADR-004: API design (REST vs GraphQL decision)
- ✅ Architecture diagrams (C4 model)
- ✅ Onboarding runbook for new developers

**Sample ADR:**
```markdown
# ADR-001: Technology Stack Selection

## Context
School ERP needs to support 100+ schools, 100K+ students. Need:
- Real-time sync (attendance, grades)
- Scalability (handle peak load Sep + final exams)
- Cost efficiency (₹20-80K/year per school)
- Indian regional compliance

## Decision
- **Backend:** Google Cloud Platform (Firestore + Cloud Functions)
- **Frontend:** React 18 + Material-UI
- **Data:** BigQuery + Cloud Scheduler + Pub/Sub
- **Auth:** Firebase Authentication
- **Notifications:** Twilio (SMS), SendGrid (Email)

## Rationale
- Firestore: Managed, real-time, built-in auth
- Cloud Functions: Serverless, scales automatically, pay-per-use
- BigQuery: Powerful analytics, native integration with Firestore
- React: Rich ecosystem, large talent pool in India

## Consequences
- Vendor lock-in to GCP (mitigated by clean architecture)
- Learning curve for Firebase (offset by managed services)
- Cost scales with usage (acceptable tradeoff for product velocity)

## Status: Approved ✅
```

**Checkpoint:** All ADRs documented, diagrams created → Review in 25_ARCHITECTURAL_DECISIONS.md

---

## WEEK 1 PARALLEL EXECUTION TIMELINE

```
Day 1 (Wed Apr 9):
  09:00 - Deploy Expert: GCP project setup begins
  09:00 - Backend Agent: Firestore schema design
  09:00 - Documentation: ADRs drafted
  17:00 - Checkpoint: Foundation decisions documented

Day 2 (Thu Apr 10):
  09:00 - Frontend Agent: React scaffold created
  09:00 - DevOps Agent: GitHub repo + CI setup
  09:00 - QA Agent: Test framework scaffolded
  14:00 - Backend Agent: Cloud Functions written
  17:00 - Checkpoint: Code pushed to GitHub, CI running

Day 3 (Fri Apr 11):
  09:00 - Deploy Expert: Cloud Run deployment template
  09:00 - Data Agent: BigQuery schema created
  09:00 - Backend Agent: Firestore sync function deployed
  14:00 - Frontend Agent: Login page + dashboard layout
  17:00 - Checkpoint: Staging environment live, can auth

Day 4 (Sat Apr 12):
  09:00 - QA Agent: First test suite written
  09:00 - Backend Agent: API endpoints documented
  09:00 - Data Agent: Sample SQL queries
  14:00 - Frontend Agent: Student dashboard prototype
  17:00 - Checkpoint: End-to-end flow testable

Day 5 (Sun Apr 13):
  09:00 - Integration testing across all workstreams
  09:00 - Documentation Agent: Developer onboarding guide
  09:00 - All agents: Bug fixes + polish
  15:00 - WEEK 1 REVIEW MEETING
  17:00 - Deploy to staging + final checkpoint

Days 6-7 (Mon-Tue Apr 14-15):
  - Buffer for spillover work
  - Sprint retrospective
  - Week 2 planning
```

---

## CRITICAL PATH DEPENDENCIES

```
Must Complete Week 1:
  ✅ GCP infrastructure
  ✅ Firestore basic schema
  ✅ Firebase Auth working
  ✅ GitHub repo + CI running
  ✅ React app loads

Blocks Week 2 If Missing:
  ❌ Firestore schema wrong → Delays all backend features
  ❌ CI pipeline broken → Slows development velocity
  ❌ Frontend auth broken → Blocks feature development
  ❌ Cloud Run deploy failing → Staging environment unavailable
```

---

## AGENT DEPLOYMENT COMMANDS

**Now executing in parallel:**

```bash
# Command 1: Deploy Expert (Infrastructure)
> SPAWN: Deploy Expert Agent
  TASK: "Set up GCP project, Firestore, BigQuery, Cloud Run, monitoring"
  CONFIGURATION: "asia-south1 region, prod/staging/dev environments"
  OUTPUT: "19_CLOUD_INFRASTRUCTURE_SETUP.md"

# Command 2: Backend (Firestore + API)
> SPAWN: Backend Expert (or use Explore + guidance)
  TASK: "Design Firestore schema, implement 5 core Cloud Functions, auth middleware"
  TECH: "Firebase Admin SDK, TypeScript, Cloud Functions runtime"
  OUTPUT: "20_BACKEND_IMPLEMENTATION.md"

# Command 3: Frontend (React + Design System)
> SPAWN: Frontend Expert (or modernize-design)
  TASK: "Create React app scaffold, auth flow, dashboard layouts, Material-UI integration"
  TECH: "React 18, TypeScript, Redux Toolkit, Material-UI v5"
  OUTPUT: "21_FRONTEND_IMPLEMENTATION.md"

# Command 4: DevOps (CI/CD + Deployment)
> SPAWN: Deploy Expert (Pipeline focus)
  TASK: "GitHub Actions CI, Cloud Run deployment config, environment management"
  TECH: "Docker, GitHub Actions, Cloud Run, Secret Manager"
  OUTPUT: "22_DEVOPS_PIPELINE.md"

# Command 5: QA (Testing Framework)
> SPAWN: QA Framework Expert
  TASK: "Jest + React Testing Library setup, Cypress E2E, test infrastructure"
  TECH: "Jest, React Testing Library, Cypress, GitHub Actions integration"
  OUTPUT: "23_QA_TESTING_STRATEGY.md"

# Command 6: Data (BigQuery + Sync)
> SPAWN: Data Platform Expert
  TASK: "BigQuery schema, data warehouse setup, Firestore sync functions"
  TECH: "BigQuery, Cloud Functions, Pub/Sub, SQL"
  OUTPUT: "24_DATA_PLATFORM.md"

# Command 7: Documentation (ADRs + Architecture)
> SPAWN: Documentation Expert
  TASK: "Write ADRs, architecture diagrams, developer onboarding"
  TECH: "Markdown, Mermaid, C4 model"
  OUTPUT: "25_ARCHITECTURAL_DECISIONS.md"
```

---

## SUCCESS CRITERIA - END OF WEEK 1

If all workstreams complete:

- [ ] ✅ GCP project fully configured + monitoring live
- [ ] ✅ Firestore schema v1 deployed
- [ ] ✅ Cloud Functions running (5 core functions)
- [ ] ✅ React app scaffold with auth working
- [ ] ✅ GitHub CI pipeline testing code on every PR
- [ ] ✅ Cloud Run deployment template created
- [ ] ✅ BigQuery datasets + tables created
- [ ] ✅ All code pushed, no TODOs blocking
- [ ] ✅ Zero critical bugs (P0 issues = blocker)
- [ ] ✅ Documentation complete for all decisions
- [ ] ✅ First team member can onboard without help
- [ ] ✅ Demo-ready staging environment

**If incomplete:** No agent moves to Week 2 until dependencies resolved.

---

## WEEKLY CHECKPOINTS (Every Friday 5pm)

```
Week 1 Checkpoint (Apr 15):
  ├─ All 7 workstreams report status
  ├─ Demo: Live staging environment
  ├─ Issues: P0 bugs documented + assigned
  ├─ Blockers: Escalated immediately
  └─ Week 2 kickoff: Ready to add features

Week 2 Checkpoint (Apr 22):
  ├─ Backend: More API endpoints, fee management
  ├─ Frontend: Student portal complete, teacher dashboard
  ├─ Data: Sync working for 80% of workflows
  └─ QA: >60% test coverage

[Continue weekly through Week 24]
```

---

## NEXT STEPS (Start Week 2)

**Week 2 Focus Areas:**
1. **Backend:** Fee management API, payment integration (Razorpay)
2. **Frontend:** Teacher portal (mark attendance, enter grades)
3. **Data:** Implement real-time sync for all workflows
4. **DevOps:** Set up staging + prod environments
5. **QA:** Expand test coverage to 70%

---

## HOW TO USE THIS PLAN

Print this → Post on team Slack → Reference as the NORTH STAR for the entire week.

Every agent should:
1. Read this plan first thing
2. Know their workstream dependencies
3. Report blockers immediately (don't wait till Friday)
4. Update status daily (async in Slack #build-status)
5. Demo Friday at 5pm with working code

**This is your execution authority. Build it exactly as written. Deviate only if blocked (with escalation).**

---

**BUILD PHASE INITIATED: 🚀 WEEK 1 SPRINT STARTS NOW**
