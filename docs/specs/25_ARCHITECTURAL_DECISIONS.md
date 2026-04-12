# 25_ARCHITECTURAL_DECISIONS.md

**Document Version:** 1.0  
**Date:** April 9, 2026  
**Status:** Approved & Active  
**Owner:** Lead Architect + Technical Leadership  

---

## PART 1: ARCHITECTURE DECISION RECORDS (ADRs)

### ADR-001: GCP + Firebase + React Tech Stack

**Decision Title:** Adopt Google Cloud Platform as primary cloud provider with Firestore and Firebase as core infrastructure.

**Context:**
- School ERP requires real-time synchronization across web and mobile platforms
- Multi-tenant SaaS architecture must support global deployments with regional data residency
- Cost efficiency critical for emerging markets (India, rural schools)
- Development velocity needed: 16-24 week MVP timeline

**Problem:**
- AWS requires complex orchestration (DynamoDB + DocumentDB + Lambda) for real-time sync
- Azure has limited real-time capabilities without custom solutions
- On-premises infrastructure adds DevOps burden for target market

**Solution:**
Adopt GCP stack:
- **Database:** Firestore (native real-time, offline-first, built-in auth)
- **Compute:** Cloud Run (serverless, scales 0→1000, ₹2,075/month baseline)
- **Storage:** Cloud Storage (student documents, photos, reports)
- **Authentication:** Firebase Auth (social + multi-provider)
- **Analytics:** BigQuery + Cloud Logging
- **Messaging:** Pub/Sub + Cloud Tasks
- **Deployment:** Cloud Build + Artifact Registry

**Consequences:**
✅ **Positive:**
- Real-time Firestore replication eliminates manual sync logic
- Serverless scaling reduces DevOps overhead
- ₹40-50% cost savings vs AWS for first 100 schools
- Firebase ecosystem integrates seamlessly
- Global CDN included (Edge Network)

⚠️ **Tradeoffs:**
- GCP vendor lock-in (migration to AWS complex)
- Firestore pricing scales with throughput (budgeting required)
- Team requires GCP certification path
- Limited GraphQL native support (REST API chosen instead)

**Approval Status:** ✅ APPROVED  
**Approved By:** Lead Architect  
**Approved Date:** April 8, 2026  
**Implementation Date:** Week 1, April 9, 2026

---

### ADR-002: Firebase Auth + JWT Custom Claims for Role-Based Access Control

**Decision Title:** Use Firebase Authentication with custom JWT claims to implement fine-grained RBAC across all endpoints.

**Context:**
- Multi-tenant system requires role segregation: Admin, Principal, Teacher, Parent, Student, Accountant, HOD
- Roles vary per school (role inheritance across schools not allowed)
- JWT token must carry RBAC metadata to avoid database queries on every request
- Firebase provides native JWT integration with custom claims

**Problem:**
- Custom JWT payload encoding complex without Firebase
- Role hierarchies differ across schools (can't use global role definitions)
- Session management in stateless API adds complexity
- Traditional session tokens don't scale for serverless

**Solution:**
Firebase Authentication + Custom JWT Claims:
1. User authenticates via Firebase Auth (email/password + social)
2. Firebase issues JWT with custom claims:
```json
{
  "sub": "uid_xyz123",
  "email": "teacher@school.in",
  "email_verified": true,
  "custom:schoolId": "school_abc",
  "custom:role": "teacher",
  "custom:permissions": ["read:students", "write:attendance", "read:grades"],
  "custom:classIds": ["class_001", "class_002"],
  "iat": 1712592000,
  "exp": 1712678400
}
```
3. API middleware verifies JWT signature (no DB hit)
4. All authorization checks use JWT claims
5. Role updates trigger token refresh on next login

**Consequences:**
✅ **Positive:**
- Zero-latency RBAC checks (JWT decoded once per request)
- Stateless API, horizontal scaling without session affinity
- OAuth2 social login (Google, Microsoft) out-of-box
- Firebase Admin SDK manages custom claims server-side
- Multi-school delegation via "schoolId" claim

⚠️ **Tradeoffs:**
- Role changes require token refresh (eventual consistency, ~1 hour max)
- JWT payload size limits (~8KB) restrict permission list
- Custom claims require Firebase Admin SDK (can't be set client-side)
- Token revocation requires Firestore lookup (expensive if abused)

**Approval Status:** ✅ APPROVED  
**Approved By:** Backend Agent + Security Lead  
**Approved Date:** April 8, 2026  
**Implementation Date:** Week 2, April 16, 2026

---

### ADR-003: Firestore Denormalization Strategy for Read Performance

**Decision Title:** Apply strategic denormalization in Firestore to optimize read performance while maintaining eventual consistency.

**Context:**
- Dashboard queries require aggregated data (student count, fee collection %, attendance %)
- Teacher dashboards reload every 30 seconds (performance critical)
- Reports generated frequently (principal needs real-time KPIs)
- Firestore reads cost ₹0.90 per 100K; write costs ₹1.80 per 100K

**Problem:**
- Joining collections requires client-side logic (N+1 reads)
- Querying across nested docs expensive (read quota exceeded for 500+ schools)
- Aggregation pipeline missing (unlike MongoDB)
- Calculated fields require full scan

**Solution:**
Three-tier denormalization strategy:

**Tier 1: Document-level Denormalization**
```firestore
students/{studentId}
├── name, class, section
├── parentName, parentPhone          ← Denormalized
├── currentAttendance%              ← Computed field
└── feesStatus: "pending"            ← Denormalized
```

**Tier 2: Collection Summaries**
```firestore
schools/{schoolId}/metadata/summary
├── totalStudents: 1200
├── totalStaff: 45
├── totalFeesPending: ₹4,50,000
├── classAttendanceAvg: 92.3%
├── attendanceLastUpdated: timestamp
└── _docVersion: 3
```

**Tier 3: Analytics Collection**
```firestore
schools/{schoolId}/analytics_daily/{date}
├── date: "2026-04-09"
├── newEnrollments: 12
├── totalFeeCollected: ₹1,50,000
├── attendancePercentage: 91.5
├── absentStudents: ["student_001", "student_002"]
└── snapshot_time: "2026-04-09T09:00:00Z"
```

**Consequences:**
✅ **Positive:**
- Dashboard loads in <100ms (pre-aggregated data)
- Read quota reduced 80% (fewer document fetches)
- Real-time updates via Firestore listeners
- Denormalized fields retrieved in single read

⚠️ **Tradeoffs:**
- Write complexity increases (update 2-3 docs on entry)
- Data consistency eventual (max 5-min drift)
- Storage +15% (duplicate data)
- Update cascades required

**Approval Status:** ✅ APPROVED  
**Approved By:** Backend Agent + Data Agent  
**Approved Date:** April 8, 2026  
**Implementation Date:** Week 3-4, April 23, 2026

---

### ADR-004: REST API Design (No GraphQL)

**Decision Title:** Implement REST API using OpenAPI 3.0 specification; reject GraphQL for initial version.

**Context:**
- Team bandwidth limited: 4 backend engineers
- Schema complexity high (8 modules, 14 Firestore collections)
- Rapid prototyping required (MVP in 24 weeks)
- Target users need simple, stable APIs
- Real-time via Firestore listeners, not GraphQL subscriptions

**Problem:**
- GraphQL requires: Schema stitching, N+1 query protection, dataloader management
- Team learning curve: 2-3 weeks
- Mobile clients benefit marginally (queries still pre-planned)

**Solution:**
REST API with OpenAPI 3.0:

**Standard Pattern:**
```
GET    /api/v1/schools/{schoolId}/students
POST   /api/v1/schools/{schoolId}/students
GET    /api/v1/schools/{schoolId}/students/{studentId}
PATCH  /api/v1/schools/{schoolId}/students/{studentId}
DELETE /api/v1/schools/{schoolId}/students/{studentId}
```

**Response Format:**
```json
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "timestamp": "2026-04-09T10:30:00Z",
    "version": "1.0.0",
    "requestId": "req-uuid-123456"
  }
}
```

**API Versioning:** `/api/v1/`, `/api/v2/` (backward compatibility 12 months)

**Consequences:**
✅ **Positive:**
- Simpler development (CRUD pattern)
- Faster learning curve for team
- OpenAPI auto-generated documentation
- HTTP caching strategies clear
- Firestore listeners handle real-time needs

⚠️ **Tradeoffs:**
- Potential over-fetching (Firestore projection mitigates)
- Multiple endpoints for related data
- Version management overhead

**Approval Status:** ✅ APPROVED  
**Approved By:** Lead Architect + Frontend Agent  
**Approved Date:** April 8, 2026  
**Implementation Date:** Week 1-2, April 9, 2026

---

### ADR-005: Pub/Sub for Real-Time Async Event Synchronization

**Decision Title:** Use Google Cloud Pub/Sub as async messaging layer for cross-service communication.

**Context:**
- Attendance → BigQuery sync required
- Payment received → Invoice generation + notification
- Exam results → Parent notification + analytics recalc
- Multiple services need decoupled communication
- API must remain fast (<500ms)

**Problem:**
- Synchronous API calls create tight coupling
- Database polling inefficient
- Background jobs need reliable triggering
- At-least-once delivery required

**Solution:**
Cloud Pub/Sub with Topic+Subscription pattern:

**Topics:**
```
orders.attendance.created → [analytics, notifications, reporting]
orders.fees.payment_received → [invoice-generator, financial-reporting, notifications]
orders.exam.results_published → [transcripts, notifications, analytics, cache-invalidation]
orders.student.enrolled → [fee-schedule, classroom-assignment, credentials, analytics]
```

**Message Format:**
```json
{
  "eventId": "evt-uuid-20260409-001",
  "eventType": "attendance.created",
  "schoolId": "school-abc-123",
  "entityId": "attendance-rec-001",
  "timestamp": "2026-04-09T10:30:00Z",
  "version": 1,
  "data": {
    "studentId": "std-001",
    "date": "2026-04-09",
    "status": "present"
  },
  "source": "web-api:attendance-endpoint"
}
```

**Delivery Pattern:**
```
API writes event → Pub/Sub → Cloud Functions
                              ├─ Async task returns immediately
                              ├─ Function ACKs when done
                              ├─ Failed function retried (exponential)
                              └─ Unhandled → Dead Letter Topic
```

**Delivery Guarantees:**
- **At-least-once:** Messages processed ≥1 times
- **Deduplication:** idempotency keys via Redis (24hr TTL)
- **Deadletter:** Failed messages after 5 retries

**Consequences:**
✅ **Positive:**
- Services decouple completely
- Async jobs scale independently
- Reliable delivery with dedup
- Event sourcing enabled
- Cost efficient (₹0.40 per million)

⚠️ **Tradeoffs:**
- Eventual consistency (~30 second delay)
- Distributed tracing required (debugging complex)
- Cold starts on Cloud Functions (3-5s)
- Deadletter queue manual review

**Approval Status:** ✅ APPROVED  
**Approved By:** Backend Agent + DevOps Agent  
**Approved Date:** April 8, 2026  
**Implementation Date:** Week 4-5, April 30, 2026

---

### ADR-006: Cloud Run Serverless Deployment

**Decision Title:** Deploy API on Google Cloud Run instead of Compute Engine/GKE.

**Context:**
- API utilization highly variable (peak during school hours, silent at night)
- Team size: 1 DevOps engineer (can't manage Kubernetes)
- Cost must scale with usage (no fixed VM costs)
- Global deployments needed (3+regions)
- 99.9% uptime SLA acceptable

**Problem:**
- Compute Engine: manual scaling overhead
- GKE: 40% DevOps burden (node management, tuning)
- Serverless (Cloud Functions): Framework choice limited
- Trade-off: simplicity vs control

**Solution:**
Cloud Run:

**Architecture:**
```
Docker Image (Node.js 20 + Express) 
  → Artifact Registry 
  → Cloud Run (auto-scaled)
     ├─ Concurrency: 80 req/container
     ├─ CPU: 2 vCPU, 2GB RAM
     ├─ Min instances: 1 (always warm)
     ├─ Max instances: 100
     └─ Timeout: 3600s
```

**Scaling:**
```
<500 req/min → 1-2 instances
500-2000 req/min → 3-10
2000-5000 req/min → 10-30
>5000 req/min → alert (scale cap)
```

**Cost Model:**
```
vCPU-seconds: ₹0.0000247
Memory-seconds: ₹0.0000025
Networking: ₹0.12/GB (India)
Example: 1000 req/day, 100ms each ≈ ₹200/month
```

**Consequences:**
✅ **Positive:**
- Zero DevOps for scaling
- Cost ₹2,075-10,000/month (real-time scale)
- Global deployment simple
- Built-in metrics, logging, tracing
- Fast iteration (push → deploy 2min)

⚠️ **Tradeoffs:**
- Cold start: 3-5s after 15min idle
- Resource limits: max 8vCPU, 32GB
- Long-running jobs risky (3600s timeout)
- Latency variance higher
- GCP vendor lock-in

**Cold Start Mitigation:**
- Min instances = 1 (always warm)
- India peaks: min=2 during 8am-6pm
- Background jobs via Cloud Tasks (separate)

**Approval Status:** ✅ APPROVED  
**Approved By:** DevOps Agent + Lead Architect  
**Approved Date:** April 8, 2026  
**Implementation Date:** Week 2, April 16, 2026

---

### ADR-007: Monorepo Architecture

**Decision Title:** Single Git repo: API + Web + Mobile + Shared code using Nx workspace.

**Context:**
- Shared types (Student, Teacher) used across API + frontend + mobile
- Type safety critical (Firestore schema must match React state types)
- Deploy coordination needed (API v1 → Frontend support same commit)
- Team small (4 engineers): single repo reduces overhead
- All apps run locally (`npm start`)

**Problem:**
- Multiple repos:
  - API deploys without frontend check → runtime errors
  - Shared model changes need sync across repos
  - Types drift (Student interface in API ≠ React)
- Polyrepo CD/CI: multiple pipelines, coordination burden

**Solution:**
Nx Monorepo structure:

```yaml
school-erp/                    # Single repo
├── apps/
│   ├── api/                   # Node.js 20 + Express
│   ├── web/                   # React 18 + Vite
│   ├── mobile/                # React Native (future)
│   └── founder/               # Internal dashboard
│
├── packages/
│   ├── shared/                # Types, validators, utils
│   └── design-system/         # Tailwind + UI components
│
├── .github/workflows/         # CI/CD
├── nx.json
├── tsconfig.base.json
└── package.json
```

**Dependency Graph:**
```
api, web, mobile
  ↓ (all depend on)
packages/shared (types, validators)
  ↓ (all depend on)
packages/design-system
```

**Development:**
```bash
npm install                    # All workspaces
npm start                      # Run all apps concurrently
npm test                       # Test changed only (Nx)
npm run build:api              # Build specific app
```

**Shared Types Example:**
```typescript
// packages/shared/src/types/Student.ts
export interface Student {
  _id: string;
  schoolId: string;
  name: string;
  dob: Date;
  class: string;
  status: 'active' | 'inactive';
}

// Both API and Web import from same source ✓
```

**CI/CD:**
```yaml
On push to main:
  ├─ Detect changed apps (Nx)
  ├─ Test changed only
  ├─ Build changed only
  ├─ Deploy if tests pass
  └─ Halt if tests fail
```

**Consequences:**
✅ **Positive:**
- Single source of truth for types (defined once)
- Type safety enforced (API change → Frontend recompile fails)
- Coordinated deployment (same commit hash)
- Atomic refactoring (fix all usages at once)
- Simplified onboarding (clone once)
- Shared CI/CD pipeline

⚠️ **Tradeoffs:**
- Mono-repo tooling overhead (Nx management)
- Single failing test blocks all deploys
- Repo size grows (500MB+)
- Difficult partial repo access (GitHub teams)
- Build cache management

**Breaking Git Boundaries (Rare):**
If mobile needs separate DevOps, extract to new repo post-launch without breaking shared types (copy packages/shared).

**Local Dev:**
```bash
git clone ...
cd school-erp
npm install
npm start
# Runs 3 servers: API:8080, Web:5173, Mobile:ready
```

**Approval Status:** ✅ APPROVED  
**Approved By:** Lead Architect + DevOps Agent + Frontend Agent  
**Approved Date:** April 8, 2026  
**Implementation Date:** Week 1, April 9, 2026

---

## PART 2: C4 DIAGRAMS

### System Context Diagram

```
                          ┌──────────────────────────────────────┐
                          │   School ERP SaaS Platform            │
                          │  (Integrated School Management)       │
                          └──────────────────────────────────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
         ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
         │ Principal/     │  │ Teachers       │  │ Parents        │
         │ Admin          │  │ (Attendance,   │  │ (View grades,  │
         │ (Manage        │  │  Grades,       │  │  Fee status,   │
         │  students,     │  │  Exams)        │  │  Announcements)│
         │  fees, staff)  │  │                │  │                │
         └────────────────┘  └────────────────┘  └────────────────┘
                    │              │              │
                    └──────────────┼──────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────────┐
                    │  Web App (React)                  │
                    │  Mobile App (React Native)        │
                    │  ├─ Tailwind UI                   │
                    │  ├─ Redux state management        │
                    │  ├─ RTK Query API client          │
                    │  └─ Firestore real-time sync      │
                    └──────────────┬───────────────────┘
                                   │
                                   ▼
           ┌─────────────────────────────────────────────────────┐
           │         Google Cloud Platform (GCP)                 │
           │                                                     │
           │  ┌────────────────────────────────────────────┐   │
           │  │  Cloud Run API (Node + Express)            │   │
           │  │  ├─ Authentication / Authorization         │   │
           │  │  ├─ Student APIs                           │   │
           │  │  ├─ Attendance APIs                        │   │
           │  │  ├─ Grades APIs                           │   │
           │  │  ├─ Fees APIs                             │   │
           │  │  ├─ Exams APIs                            │   │
           │  │  └─ Reporting APIs                        │   │
           │  └──────────────┬───────────────────────────┘   │
           │                 │                               │
           │       ┌─────────┼─────────┐                    │
           │       ▼         ▼         ▼                    │
           │  ┌──────────┐ ┌─────────┐ ┌──────────────┐   │
           │  │Firestore │ │BigQuery │ │ Pub/Sub      │   │
           │  │(Primary) │ │(Analytics)│(Events)      │   │
           │  └──────────┘ └─────────┘ └──────────────┘   │
           │                                               │
           │  ┌──────────────────────────────────────┐    │
           │  │ Firebase Services                    │    │
           │  │ ├─ Auth (JWT + claims)              │    │
           │  │ ├─ Cloud Storage (docs, photos)     │    │
           │  │ └─ Cloud Logging                    │    │
           │  └──────────────────────────────────────┘    │
           └─────────────────────────────────────────────┘
```

### Container Diagram

```
Integrations:   Twilio | Exotel | Razorpay | AWS SES | Jio Connectivity
                            │
                ┌───────────┼───────────┐
                │           │           │
                ▼           ▼           ▼
        ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
        │ Web App      │ │ Mobile App   │ │ Admin Dashboard  │
        │ (React+Vite)│ │(React Native)│ │ (Internal)       │
        │             │ │              │ │                  │
        │ Dashboard   │ │ Attendance   │ │ User Management  │
        │ Students    │ │ Marks Entry  │ │ System Config    │
        │ Attendance  │ │ Fees         │ │ Analytics        │
        │ Grades      │ │ Exams        │ │                  │
        │ Fees        │ │              │ │                  │
        │ Reports     │ │              │ │                  │
        └──────────────┘ └──────────────┘ └──────────────────┘
                │              │                  │
                └─────────────┬┼─────────────────┘
                              │ REST API + Firestore listeners
                              ▼
                 ┌──────────────────────────┐
                 │ Cloud Run API Container  │
                 │ (Node.js 20 + Express)   │
                 │                          │
                 │ ├─ Controllers           │
                 │ ├─ Services              │
                 │ ├─ Repositories          │
                 │ └─ Middleware            │
                 └──────────────┬───────────┘
                                │
                ┌───────────────┼───────────────┬──────────────┐
                ▼               ▼               ▼              ▼
           ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────────────┐
           │Firestore│   │BigQuery │   │Pub/Sub  │   │ Cloud      │
           │(Primary)│   │Analytics│   │(Events) │   │ Logging    │
           │         │   │         │   │         │   │(Monitoring)│
           │ Schools │   │ Daily   │   │ Async   │   │ • Traces   │
           │ Students│   │ Snapshots   │ jobs    │   │ • Logs     │
           │ Classes │   │ Reports │   │ Queues  │   │ • Metrics  │
           │ Staff   │   │ KPIs    │   │ Retries │   │            │
           │ Marks   │   │         │   │ DLQ     │   │            │
           │ Exams   │   │         │   │         │   │            │
           │ Fees    │   │         │   │         │   │            │
           └─────────┘   └─────────┘   └─────────┘   └────────────┘
                │
                ▼
           ┌─────────────────────────┐
           │ Cloud Storage           │
           │ (Student docs, PDFs)    │
           └─────────────────────────┘
```

### Component Diagram (API Services)

```
Cloud Run Container:

HTTP Request → Middleware Stack
              ├─ CORS
              ├─ Auth (Firebase JWT)
              ├─ RBAC (Role checks)
              ├─ Logging
              └─ Error handling
                      │
                      ▼
             Route Handlers (Controllers)
             ├─ GET /students
             ├─ POST /students
             ├─ POST /attendance
             ├─ POST /marks
             ├─ GET /reports
             └─ POST /fees
                      │
        ┌─────────────┼─────────────┬────────────┐
        ▼             ▼             ▼            ▼
   StudentService AttendanceService  GradeService  FeeService
   ├─ enroll      ├─ record        ├─ record     ├─ createInvoice
   ├─ update      ├─ getReport     ├─ getTranscript ├─ recordPayment
   ├─ get         ├─ update        ├─ calculateGPA  ├─ getLedger
   ├─ list        └─ bulkImport    └─ generateReport└─ generateReport
   └─ delete
         │              │              │          │
         │              │              │          │
        └─────────────┬─┼──────────────┼──────────┘
                      │ │              │
        ┌─────────────┼─+──────────────┼────────────┐
        ▼             ▼ ▼              ▼            ▼
   FirestoreRepo BigQueryRepo PubSubRepo ExternalServiceRepo
   ├─ create     ├─ insert    ├─ publish ├─ sendSMS
   ├─ get        ├─ query     └─ decode  ├─ sendEmail
   ├─ update     ├─ bulkLoad                └─ processPayment
   ├─ delete     └─ stream
   └─ transaction

Outputs:
   ├─ Firestore (CRUD)
   ├─ BigQuery (Append-only)
   ├─ Pub/Sub Topics (Events)
   └─ External APIs (SMS, Email, Payments)
```

---

## PART 3: DATA FLOWS

### Flow 1: Attendance Recording

```
TEACHER MARKS ATTENDANCE (Mobile)
        │
        ▼
FRONTEND VALIDATION (offline-first)
        │
        ▼
FIRESTORE WRITE (local + sync)
        │
        ▼
API VALIDATION (Cloud Run)
 ├─ Check auth
 ├─ Check biz rules
 └─ Audit log
        │
        ▼
PUBLISH EVENT (Pub/Sub)
 └─ orders.attendance.recorded
        │
    ┌───┬───────────────┐
    ▼   ▼               ▼
  BigQuery Reporting Notifications
  Insert  Update    Send SMS
  ├─ Row  Metadata  ├─ Absent alert
  └┬─────┬────────┘└─ Parent notify
   │     │
   ▼     ▼
 PRINCIPAL DASHBOARD (Real-time)
 ├─ Today's count
 ├─ Trends
 ├─ Class-wise %
 ├─ Absent students
 └─ Auto-SMS alerts

Timeline: T+0s → T+7s (end-to-end)
✅ Attendance visible in:
 • Firestore (instant)
 • API (instant)
 • BigQuery (3-5s)
 • Parent notifications (5-7s)
```

### Flow 2: Grade Entry → Report Generation

```
TEACHER ENTERS MARKS
        │
        ▼
FRONTEND VALIDATION
        │
        ▼
API RECEIVES BULK MARKS
 └─ Transaction: write + validate
        │
        ▼
PUBLISH EVENT (Pub/Sub)
 └─ orders.marks.published
        │
    ┌───┬──────┬───────┐
    ▼   ▼      ▼       ▼
   Transcript Report Analytics Notifications
   Builder    Builder  Update    Send to Parents
   ├─ Update  ├─ PDF   ├─ BQ    └─ Email grades
   └─ Index   └─ Cache └─ Cache
        │       │       │       │
        ▼       ▼       ▼       ▼
   Firestore BigQuery Redis  Email/SMS
   ├─ marks  ├─ agg   ├─ cache│
   └─ data  └─ stats └─ inv  │
                             │
                    ┌────────┘
                    ▼
            PRINCIPAL DASHBOARD
            ├─ Exam stats (avg, pass%)
            ├─ High/low scores
            ├─ At-risk<40%
            ├─ Download reports
            └─ Lock exam

Timeline: T+0s → T+30m (async report generation)
✅ Grades visible in:
 • Firestore (instant)
 • API (instant)
 • BigQuery (3-5s)
 • Parent portal (2-3min)
 • Reports (5-30min)
```

### Flow 3: Fee Collection → Payment Processing

```
DAY 1, 2 AM: FEE CALCULATION (Scheduled)
 ├─ Cloud Scheduler triggers
 ├─ For each student: calculate fees
 └─ Create fee records in Firestore
         │
         ▼
DAY 1, 3 AM: INVOICE GENERATION
 ├─ Generate PDF
 ├─ Store in Cloud Storage
 └─ Publish event: invoices.generated
         │
         ▼
DAY 1, 4 AM: PARENT NOTIFICATION
 ├─ Send SMS
 ├─ Send Email (with PDF)
 └─ Send Push notification
         │
         ▼
DAY 1/2, 8 AM: PARENT PAYS (via portal)
 ├─ Clicks payment link
 ├─ Redirected to Razorpay
 └─ Enters card details
         │
         ▼
DAY 1/2, 8:01 AM: PAYMENT PROCESSING
 ├─ Card charged
 ├─ Webhook received
 └─ Firestore updated (paid)
         │
         ▼
DAY 1/2, 8:02 AM: RECEIPT GENERATION
 ├─ Generate PDF receipt
 ├─ Send via email
 └─ Store for parent download
         │
         ▼
DAY 2, 9 AM: ANALYTICS
 ├─ Insert payment in BigQuery
 ├─ Update collection KPIs
 └─ Refresh dashboards

Timeline: 24-48 hours end-to-end
✅ Payment visible in:
 • Firestore (instantly)
 • API (instantly)
 • Receipt (2-3min)
 • Dashboard (10min)
 • Analytics (next day)
```

---

## PART 4: DEVELOPER ONBOARDING

### 30-Minute Quick Start

**Prerequisites:**
- [ ] Node.js 20 LTS
- [ ] Git
- [ ] Visual Studio Code
- [ ] gcloud CLI (DevOps only)

**Steps:**
```bash
# 1. Clone (2 min)
git clone https://github.com/school-erp/school-erp.git
cd school-erp

# 2. Install (5 min)
npm install

# 3. Environment (3 min)
cp .env.example .env
# Fill with Firebase + GCP credentials

# 4. Start (10 min)
npm start

# 5. Verify (3 min)
# Open http://localhost:5173
# Check http://localhost:8080/health
# Run npm test
```

**Login:**
```
Email:    teacher@demo.school
Password: Demo@12345
```

**Verification:**
- [ ] http://localhost:5173 loads
- [ ] http://localhost:8080/health returns OK
- [ ] DevTools console: no red errors
- [ ] npm test: passes

### Full Setup (Local Development)

**1. Firestore Emulator:**
```bash
npm install -g firebase-tools
firebase emulators:start

# In .env:
FIRESTORE_EMULATOR_HOST=localhost:8080
```

**2. API Server:**
```bash
cd apps/api
npm start
# Port 8080, Firestore connected, Hot-reload enabled
```

**3. Web App:**
```bash
cd apps/web
npm start
# Port 5173, HMR enabled, Tailwind intellisense
```

**4. Optional Extensions:**
- Redux DevTools Chrome Extension
- React Developer Tools

**5. Mobile (React Native):**
```bash
cd apps/mobile
npm start
# Scan QR code with Expo Go
# Hot-reload on file changes
```

### Deployment to Staging

```bash
# 1. Create branch
git checkout -b feature/my-feature

# 2. Make changes + test
npm test
npm run lint

# 3. Commit + push
git add .
git commit -m "fix: ..."
git push origin feature/my-feature

# 4. Create PR (GitHub)
# Link to Jira, add description, request review

# 5. After merge → GitHub Actions:
# ├─ Tests
# ├─ Lint
# ├─ Build Docker
# ├─ Push to Artifact Registry
# └─ Deploy to Cloud Run (staging)

# 6. Verify
curl https://staging-api.schoolerp.in/health

# 7. QA tests on staging

# 8. Production (Manual approval)
```

### Troubleshooting

| Issue | Fix |
|-------|-----|
| `npm install` hangs | `npm cache clean --force` |
| Port 8080 in use | `lsof -i :8080` → kill PID |
| Can't reach Firestore | `firebase emulators:start` |
| TypeScript errors | `npm run build` |
| React blank screen | Check API on 8080 |
| CORS error | Check middleware.ts |
| Tests fail | `npm install` then `npm test` |

---

## PART 5: CODE STANDARDS

### Naming Conventions

**✅ Interfaces:**
```typescript
interface Student { }
interface StudentEnrollmentRequest { }
```

**✅ Components:**
```typescript
export const StudentEnrollmentForm: React.FC = () => { };
```

**✅ Functions:**
```typescript
const calculateTotalFees = (students: Student[]): number => { };
const isStudentEnrolled = (date: Date): boolean => { };
```

**✅ Collections (Firestore):**
```firestore
schools/, students/, attendance/, fees/, exams/
```

**✅ Events (Pub/Sub):**
```
orders.attendance.recorded
orders.marks.published
orders.fees.payment_received
orders.student.enrolled
```

**✅ Environment:**
```
FIREBASE_PROJECT_ID
FIRESTORE_EMULATOR_HOST
VITE_API_URL
```

### Error Handling

**✅ API Errors:**
```json
{
  "success": false,
  "error": {
    "code": "STUDENT_NOT_FOUND",
    "message": "Student not found in school ABC",
    "status": 404,
    "details": { "studentId": "xyz", "schoolId": "abc" }
  }
}
```

**✅ Service Layer:**
```typescript
throw new BadRequestError("schoolId required", { schoolId });
throw new NotFoundError("School not found", { schoolId });
throw new ForbiddenError("Subscription expired", { schoolId });
```

**✅ React Components:**
```typescript
const [error, setError] = useState<string | null>(null);

try {
  const data = await api.getStudents();
  setError(null);
} catch (err) {
  setError(err.message);
}

if (error) return <ErrorBanner message={error} />;
```

### Security Checklist

- [ ] JWT verification on all non-health endpoints
- [ ] RBAC middleware checks role
- [ ] Input validation with Yup/Zod
- [ ] Rate limiting per user
- [ ] HTTPS enforced in production
- [ ] CORS restricted to trusted origins
- [ ] No secrets in logs
- [ ] Firestore rules enforce authorization
- [ ] Database indexes on all queries
- [ ] Sensitive fields encrypted in transit

### Performance Checklist

- [ ] API response <200ms (GET), <500ms (POST)
- [ ] Pagination: max 100 items per request
- [ ] Caching: Redis for high-read endpoints
- [ ] Firestore indexes on all queries
- [ ] Frontend code splitting
- [ ] Image optimization (WebP, compression, lazy load)
- [ ] Bundle size <500KB (gzip)

### Testing Standards

**Unit Tests:**
- 80% coverage for API critical paths
- Jest + mocks for dependencies

**Integration Tests:**
- Jest + Firebase Emulator
- End-to-end workflows

**E2E Tests:**
- Cypress: 10-15% of critical workflows
- Data attributes for selectors

**Coverage:**
```bash
npm run test -- --coverage
# Target: 70%+ for web, 80%+ for API
```

---

**Document Complete**

This 25_ARCHITECTURAL_DECISIONS.md contains:
✅ 7 detailed ADRs with approval status
✅ C4 diagrams (system, container, component)
✅ 3 complete data flows (attendance, grades, fees)
✅ 30-min onboarding checklist + full setup
✅ Code standards (naming, errors, security, performance, testing)

**Next Steps:**
- Review with technical leadership
- Reference in code reviews
- Update Wiki with this documentation
- Use ADRs to prevent re-arguing decisions

