# PRI: Full Codebase Rebuild

## Phase 1 — PLAN

### Task

- Name: Remove all existing source code and scaffold clean monorepo
- Estimated time: Full session

### Context

- **Why:** The current codebase has grown organically over 8+ weeks and accumulated critical technical debt:
  - Duplicate auth middlewares with conflicting behavior
  - Double auth checking on routes
  - Duplicate model files (`students-pr1.ts` vs `students.ts`, etc.)
  - Duplicate services (`logger.ts` x2, `api-response.ts` x2)
  - Duplicate components (`ExamAnswerer.tsx` in 2 places, `AppShell.tsx` in 2 places)
  - Mixed patterns: `routes/` AND `modules/` coexist with overlapping responsibility
  - Minimal shared package (1 file, barely used)
  - Nearly empty founder app (3 files)
  - 20+ overlapping deploy scripts
  - 409+ doc files for a small project
  - No clear module boundaries or service contracts
  - No proper error handling strategy
  - No consistent validation layer
  - Firebase Admin initialized in multiple places

- **Trigger:** Auth review revealed systemic architectural problems beyond auth
- **Goal:** Clean, well-architected monorepo following SaaS School ERP Design skill framework

### What Gets REMOVED

Everything under these directories:

```
apps/api/src/           → All 113 source files
apps/web/src/           → All 64 source files
apps/mobile/src/        → All 10 source files
apps/founder/src/       → All 3 source files
packages/shared/src/    → The 1 source file
tests/                  → Exam tests (will rewrite)
k6/                     → Load tests (will rewrite later)
scripts/                → 20+ overlapping scripts
sql/                    → BigQuery schemas (will regen)
```

### What Gets PRESERVED

```
.git/                   → Git history stays
.github/workflows/      → CI pipelines (refactor later)
AGENTS.md               → Agent operating model
README.md               → Will rewrite
LICENSE                 → Stays
docs/process/           → PRI template, weekly template
docs/architecture/      → ADRs worth keeping
docs/adr/               → Phase ADRs
terraform/              → IaC (refactor later)
infrastructure/         → Cloud Run + monitoring configs
firebase.json           → Firebase config
firestore.rules         → Security rules
firestore.indexes.json  → Index definitions
.firebaserc             → Firebase project
cloudbuild.yaml         → Cloud Build
package.json            → Root (will update)
tsconfig.base.json      → Base config (will update)
.gitignore              → Stays
.env.example            → Stays
vercel.json             → Stays
```

### What Gets DELETED (non-code)

```
docs/weekly/            → 127 files, low value going forward
docs/specs/             → 45 files, outdated numbered specs
docs/deployment/        → 31 files, will regenerate relevant ones
docs/pr-reviews/        → 8 files, historical
docs/phases/            → 15 files, historical
docs/product/           → 11 files, keep 2-3 key ones
docs/demo/              → 4 files
docs/business/          → Historical
docs/reference/         → Historical
docs/archive/           → Already archived
docs/data/              → Will regenerate
docs/agents/            → Merge into AGENTS.md
docs/qa-reports/        → Historical
ops/                    → Operational docs
sales/                  → Sales pipeline docs
wiki/                   → Wiki content
qa/                     → QA docs
```

---

## Phase 2 — Architecture (Rebuild Scaffold)

### Tech Stack (from SaaS School ERP Design Skill)

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Database** | Firestore | Real-time sync, offline support, multi-tenant |
| **API** | Express 5 + TypeScript | Already proven, scales on Cloud Run |
| **Auth** | Firebase Auth | Multi-provider, mobile-native |
| **Frontend** | React 18 + Vite + Tailwind | Fast builds, modern DX |
| **State** | Redux Toolkit + RTK Query | Typed, cacheable API layer |
| **Mobile** | React Native + Expo | Cross-platform, shared logic |
| **Analytics** | BigQuery | Student outcome analysis |
| **Infra** | Cloud Run + Terraform | Serverless, scales to zero |
| **Validation** | Zod | Runtime + compile-time safety |
| **Testing** | Vitest (web) + Jest (API) | Fast, TypeScript-native |

### Module Architecture (MVP — Modules 1-3 from Skill)

```
Module 1: Student Information System (SIS)
  → enrollment, demographics, emergency contacts

Module 2: Attendance & Scheduling
  → daily/class-level attendance, automated alerts

Module 3: Academic Management
  → grades, assessments, transcripts, report cards
```

### Clean Monorepo Structure

```
shardaos/
├── AGENTS.md
├── README.md
├── LICENSE
├── package.json                      (workspaces: apps/*, packages/*)
├── tsconfig.base.json                (strict, paths configured)
├── .gitignore
├── .env.example
│
├── packages/
│   ├── shared/                       (types, constants, validation schemas)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── types/
│   │       │   ├── student.ts        (Student, CreateStudent, UpdateStudent)
│   │       │   ├── attendance.ts     (Attendance, AttendanceRecord)
│   │       │   ├── grades.ts         (Grade, Assessment, ReportCard)
│   │       │   ├── school.ts         (School, SchoolConfig)
│   │       │   ├── user.ts           (User, UserRole, AuthUser)
│   │       │   └── index.ts          (barrel export)
│   │       ├── schemas/
│   │       │   ├── student.schema.ts (Zod schemas matching types)
│   │       │   ├── attendance.schema.ts
│   │       │   ├── grades.schema.ts
│   │       │   └── index.ts
│   │       ├── constants/
│   │       │   ├── roles.ts          (UserRole enum, permissions map)
│   │       │   ├── errors.ts         (error codes)
│   │       │   └── index.ts
│   │       └── utils/
│   │           ├── validation.ts     (shared validators)
│   │           └── index.ts
│   │
│   └── ui/                           (shared React components — future)
│       ├── package.json
│       └── src/
│           └── index.ts
│
├── apps/
│   ├── api/                          (Express REST API)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   └── src/
│   │       ├── index.ts              (server bootstrap)
│   │       ├── app.ts                (Express app factory)
│   │       ├── config/
│   │       │   └── env.ts            (single source of truth for env vars)
│   │       ├── lib/
│   │       │   ├── firebase.ts       (single Firebase Admin init)
│   │       │   ├── firestore.ts      (Firestore client)
│   │       │   ├── logger.ts         (single structured logger)
│   │       │   └── api-response.ts   (typed response helpers)
│   │       ├── middleware/
│   │       │   ├── auth.ts           (ONE auth middleware — consolidated)
│   │       │   ├── error-handler.ts  (global error handler)
│   │       │   ├── request-id.ts     (correlation ID)
│   │       │   └── validate.ts       (Zod request validation middleware)
│   │       ├── modules/
│   │       │   ├── students/
│   │       │   │   ├── student.routes.ts
│   │       │   │   ├── student.controller.ts
│   │       │   │   ├── student.service.ts
│   │       │   │   └── student.repository.ts
│   │       │   ├── attendance/
│   │       │   │   ├── attendance.routes.ts
│   │       │   │   ├── attendance.controller.ts
│   │       │   │   ├── attendance.service.ts
│   │       │   │   └── attendance.repository.ts
│   │       │   ├── grades/
│   │       │   │   ├── grades.routes.ts
│   │       │   │   ├── grades.controller.ts
│   │       │   │   ├── grades.service.ts
│   │       │   │   └── grades.repository.ts
│   │       │   ├── schools/
│   │       │   │   ├── school.routes.ts
│   │       │   │   ├── school.controller.ts
│   │       │   │   ├── school.service.ts
│   │       │   │   └── school.repository.ts
│   │       │   └── health/
│   │       │       └── health.routes.ts
│   │       ├── errors/
│   │       │   └── app-error.ts      (single AppError class)
│   │       └── __tests__/
│   │           ├── app.test.ts
│   │           ├── modules/
│   │           │   ├── students.test.ts
│   │           │   ├── attendance.test.ts
│   │           │   └── grades.test.ts
│   │           └── middleware/
│   │               └── auth.test.ts
│   │
│   ├── web/                          (React SPA)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.cjs
│   │   ├── postcss.config.cjs
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx               (router + providers)
│   │       ├── store/
│   │       │   ├── store.ts          (configureStore)
│   │       │   ├── hooks.ts          (typed useAppDispatch/Selector)
│   │       │   └── api.ts            (RTK Query base API)
│   │       ├── features/
│   │       │   ├── auth/
│   │       │   │   ├── authSlice.ts
│   │       │   │   ├── authApi.ts    (RTK Query endpoints)
│   │       │   │   └── AuthGuard.tsx
│   │       │   ├── students/
│   │       │   │   ├── studentsApi.ts
│   │       │   │   └── studentsSlice.ts
│   │       │   ├── attendance/
│   │       │   │   └── attendanceApi.ts
│   │       │   └── grades/
│   │       │       └── gradesApi.ts
│   │       ├── pages/
│   │       │   ├── LoginPage.tsx
│   │       │   ├── DashboardPage.tsx
│   │       │   ├── StudentsPage.tsx
│   │       │   ├── AttendancePage.tsx
│   │       │   └── NotFoundPage.tsx
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── AppShell.tsx
│   │       │   │   ├── Header.tsx
│   │       │   │   └── Sidebar.tsx
│   │       │   └── shared/
│   │       │       ├── KpiCard.tsx
│   │       │       └── DataTable.tsx
│   │       ├── lib/
│   │       │   ├── firebase.ts       (Firebase client init)
│   │       │   └── api-client.ts     (axios/fetch wrapper)
│   │       ├── theme/
│   │       │   └── theme.ts
│   │       └── __tests__/
│   │
│   └── mobile/                       (React Native + Expo)
│       ├── package.json
│       ├── app.json
│       ├── tsconfig.json
│       └── src/
│           ├── App.tsx
│           ├── navigation/
│           │   └── index.tsx
│           ├── screens/
│           │   ├── LoginScreen.tsx
│           │   ├── DashboardScreen.tsx
│           │   ├── AttendanceScreen.tsx
│           │   └── ProfileScreen.tsx
│           ├── store/
│           │   └── index.ts
│           └── services/
│               └── api.ts
│
├── docs/
│   ├── process/                      (PRI template, weekly template)
│   ├── architecture/                 (ADRs)
│   ├── adr/                          (decision records)
│   └── automation/                   (day-1 automation tracking)
│
├── terraform/                        (IaC — kept, refactor later)
├── infrastructure/                   (Cloud Run, monitoring — kept)
├── .github/workflows/                (CI — kept, refactor later)
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── cloudbuild.yaml
```

### Module Pattern (Backend)

Each module follows: **Routes → Controller → Service → Repository**

```
Routes:      HTTP verbs, path params, calls controller
Controller:  Request parsing, Zod validation, calls service, formats response
Service:     Business logic, multi-tenant scoping (schoolId), calls repository
Repository:  Firestore CRUD, data mapping, no business logic
```

- No duplicate files per concern
- Repository pattern enables swapping Firestore for tests (in-memory)
- Controller handles validation via shared Zod schemas from `@school-erp/shared`
- Service enforces `schoolId` scoping on every query (multi-tenant boundary)

### Auth Strategy (Single Middleware)

One auth middleware in `apps/api/src/middleware/auth.ts`:

```
Modes:
  - "firebase": Verify Bearer token via Firebase Admin verifyIdToken()
  - "dev": Bypass token, inject dev user (local development only)

Responsibilities:
  1. Extract Bearer token from Authorization header
  2. Verify token (Firebase or dev bypass)
  3. Extract uid, email, role, schoolId from decoded token
  4. Attach AuthUser to req.user
  5. Reject 401 if invalid
  6. Reject 403 if missing schoolId (multi-tenant enforcement)

Applied: Once globally in app.ts (NOT per-module)
```

### Design System (from Skill — Step 4)

```
Colors:
  Brand Blue:     #2563EB (primary actions)
  Dark Navy:      #1e40af (headers)
  Success Green:  #10b981 (attendance present, payments)
  Warning Orange: #f59e0b (incomplete, alerts)
  Danger Red:     #ef4444 (absent, errors)
  Neutral Gray:   #6b7280 (disabled, secondary)

Typography: Inter font family
Spacing: 8px grid system
Components: Tailwind CSS utility classes + headless components
```

---

## Phase 3 — Implementation Order

### Sprint 0: Scaffold (this session)

1. Remove all source code
2. Clean up docs (keep process/, architecture/, adr/)
3. Scaffold monorepo structure with package.json files
4. Create `packages/shared` with types and schemas
5. Create `apps/api` with Express scaffold + single auth middleware
6. Create `apps/web` with React + Vite scaffold
7. Wire up root workspace scripts
8. Verify: `npm install`, `npm run typecheck`, `npm run build`

### Sprint 1: Student Module (next session)

- Backend: student routes, controller, service, repository
- Frontend: StudentsPage, student list, student form
- Tests: student CRUD unit + integration tests
- Validate: `npm run test`

### Sprint 2: Attendance Module

- Backend: attendance routes, controller, service, repository
- Frontend: AttendancePage, mark attendance UI
- Tests: attendance unit + integration tests

### Sprint 3: Grades Module

- Backend: grades routes, controller, service, repository
- Frontend: grades view, report cards
- Tests: grades unit + integration tests

### Sprint 4: Auth + Parent Portal

- Firebase Auth integration (production mode)
- Parent portal pages
- Role-based access control
- Mobile app scaffold

---

## Edge Cases

- Multi-tenant boundary: Every Firestore query must be scoped by schoolId
- Auth token missing schoolId: Return 403, not 401
- Dev mode leaked to production: env.ts validates NODE_ENV strictly
- Circular deps between packages: shared has zero deps on apps

## Testing Strategy

- Unit: Vitest for web, Jest for API (per-module test files)
- Integration: Supertest against Express app with in-memory repos
- Manual: Dev server startup verification
- Root validation: `npm run typecheck`, `npm run test`, `npm run build`, `npm run lint`

## Risks and Mitigations

- **Risk:** Losing working features during rebuild
  **Mitigation:** Git history preserved, old branch available, rebuild is additive

- **Risk:** Breaking CI pipelines
  **Mitigation:** Workflows preserved, update paths incrementally

- **Risk:** Scope creep during scaffold
  **Mitigation:** Sprint 0 = scaffold only, no features beyond health check
