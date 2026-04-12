# 🎯 WEEK 2 BUILD EXECUTION PLAN (Apr 16-22, 2026)

**Coordinator:** Lead Architect  
**Status:** READY TO DISPATCH  
**Departure Date:** April 15, 2026 EOD  
**Arrival Date:** April 16, 2026 09:00 IST  

---

## WEEK 2 OBJECTIVES

Build production-ready feature implementations on Week 1 foundation. All core modules feature-complete and tested.

| Module | Feature Set | Target Users | Priority |
|--------|---|---|---|
| **Student Module** | Enrollment, Demographics, Search, Import | Admin, Principal | 🔴 P0 |
| **Attendance Module** | Marking, Reports, Analytics, Auto-alerts | Teacher, Principal | 🔴 P0 |
| **Grades Module** | Marks Entry, Transcripts, Reports, Bulk Upload | Teacher, Admin | 🔴 P0 |
| **Fees Module** | Invoice Generation, Payment Collection, Reconciliation | Finance, Parent | 🔴 P0 |
| **Exams Module** | Question Bank, Test Creation, Auto-grading, Results | Teacher, HOD | 🟡 P1 |
| **Analytics Dashboard** | KPIs, Trends, At-Risk Students, Reports | Principal | 🟡 P1 |
| **Parent Portal** | View Grades, Fees, Attendance, Payments | Parent | 🟡 P1 |

---

## ARCHITECTURAL CONSTRAINTS (from Week 1)

- ✅ Firestore schema locked (14 collections, 24+ fields pre-defined)
- ✅ API structure fixed (REST endpoints, response format, error handling)
- ✅ Frontend architecture frozen (Redux slices, RTK Query hooks, Material-UI components)
- ✅ Pub/Sub event contracts signed (attendance.*, marks.*, fees.* topics)
- ✅ BigQuery tables ready (7 main tables, partitioned + clustered)
- ✅ Auth & RBAC finalized (5 roles, permission matrix, JWT claims)
- ✅ DevOps pipelines live (GitHub Actions workflows, Cloud Run ready)

**No re-architecture permitted this week.** Focus: Feature implementation + testing only.

---

## TEAM ASSIGNMENTS (Parallel Execution)

### TEAM 1: Backend Feature Development
**Lead(s):** 2 Backend Engineers  
**Outputs:** 26_BACKEND_FEATURES_PART1.md, 27_BACKEND_FEATURES_PART2.md  
**Monday Kickoff:** 09:00 IST

**Sprints:**
1. **Sprint 2A (Mon-Tue):** Student Module features
   - Enrollment workflow (validation, dedup, auto-assign class)
   - Bulk import (CSV/Excel parsing, transaction handling, rollback)
   - Search & filter (by class, name, status, enrolment date)
   - Denormalization triggers (auto-update parent name, fee status on change)

2. **Sprint 2B (Wed-Thu):** Attendance Module features
   - Bulk attendance marking (transaction per class, validation)
   - Attendance reports (daily/monthly/yearly aggregates)
   - Auto-alerts (SMS to parents if absent, to principal if <75%)
   - Reconciliation (update attendance% in student.metadata)

3. **Sprint 2C (Fri-Sat):** Fees Module features
   - Invoice generation (scheduled job, fee structure calc, dedup)
   - Payment webhook integration (Razorpay callback handling)
   - Reconciliation (auto-match payments to invoices)
   - Financial reports (collection rate, pending amounts, aging)

**Deliverables:**
- Complete TypeScript implementation of all Cloud Functions
- API endpoint handlers (full code, no scaffolding)
- Unit tests (Jest, 80%+ coverage)
- Pub/Sub event publishing for all mutations
- BigQuery ingestion validation

---

### TEAM 2: Frontend Feature Development
**Lead(s):** 2 Frontend Engineers  
**Outputs:** 28_FRONTEND_FEATURES_PART1.md, 29_FRONTEND_FEATURES_PART2.md  
**Monday Kickoff:** 09:00 IST

**Sprints:**
1. **Sprint 2A (Mon-Tue):** Student Management UI
   - Student List (paginated, searchable, sortable by class/name/status)
   - Student Detail Page (view profile, edit demographics, view photo)
   - Student Enrollment Form (multi-step: personal → family → class assignment)
   - Bulk Import UI (CSV upload, preview, confirm, error handling)
   - React components + RTK Query hooks + Redux slices

2. **Sprint 2B (Wed-Thu):** Attendance & Marks Entry UI
   - Attendance Marking Table (class selector, date picker, bulk mark present/absent)
   - Attendance Report View (line charts, class averages, at-risk list)
   - Marks Entry Form (exam selector, marks input with validation, auto-calculate grade)
   - Transcript View (student report card, GPA, subject-wise performance)

3. **Sprint 2C (Fri-Sat):** Fees & Parent Portal
   - Invoice List (pending/paid filter, sort by date, download PDF)
   - Fee Collection Dashboard (total pending, collection %, bar chart)
   - Parent Dashboard (child grades, fees status, attendance %)
   - Payment Integration UI (connect Razorpay, post-payment confirmation)

**Deliverables:**
- React components (TypeScript, Material-UI)
- Redux slices + RTK Query endpoints
- E2E test workflows (Cypress)
- Component tests (React Testing Library)
- Responsive design (mobile + desktop)

---

### TEAM 3: QA & Integration Testing
**Lead(s):** 1 QA Engineer  
**Outputs:** 30_QA_INTEGRATION_TESTS.md  
**Monday Kickoff:** 09:00 IST

**Parallel Testing Tracks:**

1. **Backend Integration Tests:**
   - API endpoint tests (Happy path + error cases)
   - Firestore transaction validation (all-or-nothing writes)
   - Pub/Sub event verification (published correctly, received by subscribers)
   - BigQuery ingestion tests (data arrives within SLA)
   - Database constraint tests (unique indexes, cascade deletes)

2. **Frontend Integration Tests:**
   - Critical user journeys (login → view dashboard → take action)
   - Form submission flows (validation → success → error states)
   - Real-time updates (Firestore listeners trigger re-renders)
   - Offline behavior (queue actions when offline, sync when online)
   - Error recovery (retry failed API calls)

3. **End-to-End Workflows:**
   - Student enrollment → auto-invoice generation → payment → receipt
   - Teacher marks attendance → students see in portal → parents get SMS
   - Exam results published → transcripts generated → emails sent

**Deliverables:**
- Jest + RTL + Cypress test suites (1000+ tests target)
- Performance benchmarks (API <200ms, UI <500ms)
- Coverage reports (80%+ target)
- Regression test suite (locked for future releases)

---

### TEAM 4: DevOps & Infrastructure
**Lead(s):** 1 DevOps Engineer  
**Outputs:** 31_DEPLOYMENT_RUNBOOKS.md  
**Monday Kickoff:** 09:00 IST

**Concurrent Tasks:**

1. **Staging Environment Setup:**
   - Firestore data seeding (1000 test students, 10 schools, sample data)
   - BigQuery table population (historical data for analytics testing)
   - Pub/Sub simulator (mock SMS/Email services for testing)
   - Payment gateway sandbox (Razorpay test credentials)

2. **Deployment Automation:**
   - GitHub Actions workflow: test → build → deploy staging → smoke tests
   - Canary deployment strategy (10% traffic for 30min, then 100%)
   - Rollback automation (detect errors, auto-revert previous version)
   - Database migration scripts (versioned schema changes)

3. **Monitoring & Alerting:**
   - Cloud Monitoring dashboards (API latency, error rate, Firestore throughput)
   - Alerting policies (alert if error rate >1%, latency >500ms, quota exceeded)
   - Log aggregation (Cloud Logging, searchable, traceable by requestId)
   - Distributed tracing (Cloud Trace for request flows across services)

4. **Security Hardening:**
   - Firestore security rules validation (test auth + abac matrix)
   - API rate limiting tests (verify abuse prevention)
   - Secrets rotation (verify no hardcoded credentials)
   - PII data encryption validation (at rest + in transit)

**Deliverables:**
- Staging environment fully operational
- Deployment runbook (step-by-step manual deployment)
- Rollback procedures documented
- Observability dashboards live
- Security audit checklist completed

---

### TEAM 5: Product & Documentation
**Lead(s):** 1 Product Manager + 1 Tech Writer  
**Outputs:** 32_PRODUCT_REQUIREMENTS_SPECS.md, 33_USER_GUIDE_ADMIN.md, 34_USER_GUIDE_TEACHER.md, 35_USER_GUIDE_PARENT.md  
**Monday Kickoff:** 09:00 IST

**Parallel Workstreams:**

1. **Product Requirements (Spec Refinement):**
   - Feature acceptance criteria for each module
   - User story definitions (As a [role], I want [feature], so that [benefit])
   - Edge cases + error scenarios
   - Performance requirements (response time, throughput)
   - Scalability targets (1000 schools, 100k students by end of Q2)

2. **User Documentation:**
   - **Admin Guide:** School setup, user management, system configuration, reporting
   - **Teacher Guide:** Student management, attendance marking, grades entry, dashboards
   - **Parent Guide:** Viewing grades, fees, attendance, payments, support
   - Screenshots + video tutorials (for each major workflow)

3. **Support & Training:**
   - FAQ documentation
   - Troubleshooting guide (common issues + solutions)
   - Support ticket escalation process
   - Training checklist for school implementers

**Deliverables:**
- 100-page comprehensive user guide (PDF + web)
- Video tutorials (YouTube playlist)
- Support knowledge base
- Training materials for customer onboarding

---

## WEEK 2 DELIVERY CHECKLIST

| Item | Owner | Status | Deadline |
|---|---|---|---|
| Backend features (Student, Attendance, Fees modules complete) | Backend | 🔴 PENDING | Sat Apr 20 |
| Frontend features (all pages + forms built) | Frontend | 🔴 PENDING | Sat Apr 20 |
| Integration test suite (1000+ tests) | QA | 🔴 PENDING | Sun Apr 21 |
| Staging deployment (live + tested) | DevOps | 🔴 PENDING | Sat Apr 20 |
| User documentation (admin + teacher + parent guides) | Product/Docs | 🔴 PENDING | Sun Apr 21 |
| Performance benchmarks validated | QA | 🔴 PENDING | Sun Apr 21 |
| Security audit passed | DevOps | 🔴 PENDING | Sun Apr 21 |
| All code merged to main (zero blocked PRs) | Eng Lead | 🔴 PENDING | Sun Apr 21 |

---

## WEEK 2 SUCCESS CRITERIA

**Code Quality:**
- ✅ All PRs peer-reviewed + approved (2 reviewers minimum)
- ✅ Test coverage ≥80% (API) + 70% (Frontend)
- ✅ Zero critical security issues
- ✅ Linting + type checking 100% clean
- ✅ Zero TODO comments (work completed or documented as debt)

**Functionality:**
- ✅ All P0 features complete (Student, Attendance, Grades, Fees)
- ✅ End-to-end workflows functional (enrollment → payment → receipt)
- ✅ Multi-role workflows tested (admin, teacher, principal, parent, finance)
- ✅ Offline functionality working (sync when online)
- ✅ Real-time updates via Firestore listeners

**Deployment:**
- ✅ Staging environment stable (99.9% uptime)
- ✅ CI/CD pipeline automated + reliable
- ✅ Canary deployment successful (10% → 100% traffic)
- ✅ Rollback tested + documented
- ✅ Database migrations versioned + reversible

**Performance:**
- ✅ API endpoints <200ms (median) / <500ms (p95)
- ✅ Frontend pages <1s load (median) / <2s (p95)
- ✅ BigQuery queries <5s
- ✅ Firestore throughput sustainable (within quota)

**Operations:**
- ✅ Production observability live (logging, metrics, tracing)
- ✅ Alert policies validated
- ✅ On-call runbook completed
- ✅ Incident response procedures tested

---

## RISK MITIGATION

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Feature scope creep | HIGH | 🔴 CRITICAL | Fixed scope Monday. Phase 2 for lower features. Spec freeze Tue 9am |
| Backend-Frontend API mismatch | HIGH | 🔴 CRITICAL | Daily sync meetings 6pm IST. Share OpenAPI spec as source of truth |
| Performance bottlenecks discovered late | MEDIUM | 🔴 CRITICAL | Perf testing daily (not Friday). Load test staging Wed |
| Database quota exceeded | MEDIUM | 🟡 HIGH | Monitor throughput hourly. Alert at 70% capacity. Pre-scale Fri morning |
| Firestore transactions fail at scale | LOW | 🟡 HIGH | Load test with 1000 concurrent writes. Fallback to async pattern if needed |
| Team context loss (public holidays) | MEDIUM | 🟡 HIGH | All decisions documented in ADRs. Code comments required. Pairing sessions recorded |

---

## DEPENDENCIES & HANDOFFS

```
Week 1 Outputs (LOCKED)
├─ 19_CLOUD_INFRASTRUCTURE_SETUP (used by all)
├─ 20_BACKEND_IMPLEMENTATION (baseline for features)
├─ 21_FRONTEND_IMPLEMENTATION (baseline for pages)
├─ 22_DEVOPS_PIPELINE (CI/CD templates)
├─ 23_QA_TESTING_STRATEGY (test framework)
├─ 24_DATA_PLATFORM (BigQuery setup)
└─ 25_ARCHITECTURAL_DECISIONS (reference only, don't re-argue)

Week 2 Tasks (PARALLEL)
├─ Backend & Frontend → can run independently (API contract locked)
├─ QA → depends on code ready (can write tests in parallel)
├─ DevOps → depends on code (can prepare staging env in parallel)
└─ Docs → interview engineers daily (can write in parallel)

Week 2 Outputs → Week 3 Input
├─ Staging deployment → Production hardening
├─ Feature code → Optimization + scaling
├─ Documentation → Customer feedback collection
└─ Analytics → Product improvements
```

---

## AGENT DISPATCH SCHEDULE

**Monday, April 16, 2026**

```
09:00 IST - All agents kickoff simultaneous dispatch
├─ Backend Agent: Start 26_BACKEND_FEATURES_PART1
├─ Frontend Agent: Start 28_FRONTEND_FEATURES_PART1
├─ QA Agent: Start 30_QA_INTEGRATION_TESTS
├─ DevOps Agent: Start 31_DEPLOYMENT_RUNBOOKS
└─ Product Agent: Start 32_PRODUCT_REQUIREMENTS_SPECS

15:00 IST - Mid-day sync (all leads + architect)
├─ Review blockers
├─ Confirm dependencies
└─ Adjust schedule if needed

18:00 IST - Daily standup (engineers only)
├─ Code updates
├─ Pair programming sessions
└─ Q&A

Wednesday, April 18, 2026
├─ Sprint 2A → Sprint 2B transition
├─ Mid-week review
└─ Staging deployment checkpoint

Friday, April 20, 2026
├─ Code freeze (no new features)
├─ Intensive testing + bug fixes
└─ Deployment readiness review

Saturday, April 21, 2026
├─ Final testing + deployment to staging
├─ Documentation finalization
└─ Handoff to Week 3

Sunday, April 22, 2026
├─ Optional: On-call engineer on standby
├─ Staging monitoring (24/7)
└─ Prepare Week 3 kickoff
```

---

## ESCALATION CONTACTS

| Blocker | Contact | Escalation |
|---|---|---|
| Technical architecture question | Lead Architect | Slack #arch-decisions |
| API contract mismatch | Backend Lead | Sync meeting 3pm daily |
| Database quota exceeded | DevOps | Page on-call immediately |
| Security issue discovered | Security Lead | Halt sprint, emergency review |
| Scope creep request | Product Manager | Defer to Phase 2, update roadmap |
| Team context lost (sick leave) | HR | Activate backup engineer |

---

**This plan is LOCKED. No modifications without Lead Architect + Product Manager approval.**

Next page: Agent dispatch scripts →
