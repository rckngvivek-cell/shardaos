# Phase 3-4 High Priority Backlog (Weeks 8-11)

**Date**: April 10, 2024  
**Prepared By**: Product Agent  
**Baseline**: 4 agents working in parallel (Backend, Frontend, Data, DevOps)  
**Velocity**: ~8 story points/week per agent  
**Revenue Driver**: Yes—pilot school expansion features

---

## Week 8: Pilot School Launch & Attendance Completion

### P0: Production Pilot School Deployment (Blocker for Revenue)
**Objective**: Migrate pilot school from staging → production, import real data

| Item | Owner | Points | Days | Demo Ready |
|------|-------|--------|------|-----------|
| **08-BE-001**: Prod DB schema replication (Firestore) | Backend (Agent 1) | 5 | 2 | Yes |
| **08-FE-001**: Production environment config (URLs, auth tokens) | Frontend (Agent 2) | 2 | 1 | Yes |
| **08-DO-001**: Production SSL cert + DNS setup | DevOps (Agent 4) | 3 | 1 | Yes |
| **08-QA-001**: Production smoke test suite (15 critical paths) | QA (Agent 5) | 5 | 2 | Yes |

**Acceptance Criteria**:
- ✅ All 500+ pilot students imported from school ERP extract
- ✅ Staff login works (50+ staff accounts)
- ✅ School admin can access dashboard
- ✅ <250ms P90 response time (production load)
- ✅ Availability >99.9% over 48-hour test window
- ✅ Zero security findings in penetration scan

**Revenue Impact**: ₹2-3L additional for implementation services (this week)

---

### P1: Attendance Module Completion (Core Revenue Feature)
**Objective**: Complete attendance workflow - mark, view history, export, notify

#### 08-BE-002: Attendance Analytics & Export API
- **Owner**: Backend (Agent 1)
- **Points**: 8
- **Description**: 
  - GET /schools/:id/attendance/summary (daily, weekly, monthly stats)
  - POST /schools/:id/attendance/export (CSV export, async)
  - GET /schools/:id/attendance/export/:jobId (check export status)
- **AC**:
  - ✅ Handles 1000+ students without timeout
  - ✅ Export completes <30s for 1000 records
  - ✅ Monthly attendance accuracy: 100% (validation against source)
  - ✅ API returns timestamp, user tracking (who marked, when)

#### 08-FE-002: Attendance Reports & Visualization
- **Owner**: Frontend (Agent 2)
- **Points**: 8  
- **Description**:
  - Attendance dashboard: Class-level heatmap (present/absent/leave)
  - Date range picker: Filter by week/month/term
  - Export button: Trigger CSV download
  - Parent view: "My child's attendance" (read-only)
- **AC**:
  - ✅ Page loads <2s with 500+ students
  - ✅ Heatmap renders <1s after data fetch
  - ✅ Mobile responsive (portrait mode 320px+)
  - ✅ Accessibility: WCAG 2.1 AA (keyboard nav, screen reader)

#### 08-DA-001: Attendance Analytics Pipeline  
- **Owner**: Data (Agent 3)
- **Points**: 5
- **Description**:
  - Pub/Sub: Daily attendance snapshot → BigQuery
  - Schema: Date, ClassId, StudentId, Status, Timestamp
  - Aggregate table: Attendance_Monthly_Summary
- **AC**:
  - ✅ Latency <5s (Firestore → BigQuery)
  - ✅ Zero data loss verification
  - ✅ Ready for analytics dashboard (week 9)

#### 08-QA-002: Attendance Module Integration Tests  
- **Owner**: QA (Agent 5)
- **Points**: 5
- **Description**:
  - E2E: Mark 100 students present in 1 request → verify results
  - E2E: Export trigger → file generated → download → validate CSV
  - E2E: Parent views child attendance (permission check)
  - Load: 1000 students mark/unmark concurrently
- **AC**:
  - ✅ 50+ test cases, ≥90% coverage
  - ✅ Zero flaky tests (runs 10x reliably)

---

### P1: WhatsApp Parent Engagement (Feature, Weeks 8-9 prep)
**Objective**: Prepare WhatsApp integration for launch (week 9 full sprint)

#### 08-BE-003: WhatsApp API Integration Layer (Design Only)
- **Owner**: Backend (Agent 1)
- **Points**: 3
- **Description**:
  - Design: WhatsApp Business API adapter (abstract interface)
  - Error handling: Graceful degradation (if WhatsApp unavailable)
  - Rate limiting: Max 100 messages/minute per school
  - Queuing: Async job for bulk parent notifications
- **AC**:
  - ✅ OpenAPI spec complete & reviewed
  - ✅ Works without WhatsApp credentials (local mode)
  - ✅ Can plug in 3rd-party provider easily (Twilio, WhatsApp Business API)

#### 08-DO-002: Secrets Management for WhatsApp Keys
- **Owner**: DevOps (Agent 4)
- **Points**: 2
- **Description**:
  - Google Secret Manager setup for WhatsApp API key
  - Prod vs staging key isolation
  - Key rotation policy (90-day cycle)
- **AC**:
  - ✅ Prod keys never in code/logs
  - ✅ CI can access staging keys (not prod)

**Total Week 8 Effort**: 45 story points (10 per agent, feasible in 1 sprint)

---

## Week 9: Marks Management & Parent Portal

### P1: Marks Module Build-Out
**Objective**: Enable teachers to enter marks, calculate grades, parents view progress

#### 09-BE-001: Marks Entry & Calculation API
- **Owner**: Backend (Agent 1)
- **Points**: 10
- **Description**:
  - POST /schools/:id/marks/{termId}/{subjectId} (bulk entry)
  - GET /students/:id/marks (gradebook for one student)
  - POST /marks/calculate (auto-calculate grades based on school rules)
  - PUT /marks/{id}/approve (teacher approval workflow)
- **AC**:
  - ✅ Bulk entry for 1000 students <60s
  - ✅ Grade calculation: 100% accurate vs. school rubric
  - ✅ Audit trail: Every change logged (who, when, old→new value)

#### 09-FE-001: Marks Entry UI (Spreadsheet-Like)
- **Owner**: Frontend (Agent 2)  
- **Points**: 10
- **Description**:
  - Spreadsheet grid: Student rows × Subject columns
  - In-cell editing: Click to edit, Enter to save
  - Undo/redo support
  - Bulk copy-paste from Excel
  - Calculated columns: Auto-sum, grade display
- **AC**:
  - ✅ Enter 1000 marks <5 minutes
  - ✅ Input validation real-time (bounds checks)
  - ✅ Works on tablet (touch-friendly)

#### 09-FE-002: Parent Portal - Marks View  
- **Owner**: Frontend (Agent 2)
- **Points**: 6
- **Description**:
  - Parent-only view: Child's marks across subjects
  - Term-wise breakdown (current + past terms)
  - Performance trend chart (line graph: marks over time)
  - Notification badge: "New marks entered" alert
- **AC**:
  - ✅ Load <2s with historical data
  - ✅ Compare same subject across 3 prior terms

#### 09-DA-001: Marks Analytics & Trends  
- **Owner**: Data (Agent 3)
- **Points**: 8
- **Description**:
  - BigQuery table: StudentMarks with timestamp, subject, score, grade
  - Aggregate: Class performance by subject
  - Pivot: Student performance over time
  - Ready for BI dashboard (week 10)
- **AC**:
  - ✅ Historical data query <2s
  - ✅ Supports "Top 10 students" + "At-risk students" queries

#### 09-QA-001: Marks Module Testing
- **Owner**: QA (Agent 5)
- **Points**: 8
- **Description**:
  - E2E: Teacher enters 100 marks → system calculates grades → parent sees results
  - Bulk import: CSV upload → parsed → validated → stored
  - Permission tests: Parent cannot edit marks, only view
  - Load: 500 concurrent mark entries
- **AC**:
  - ✅ 60+ test cases
  - ✅ Audit trail verified for each change

### P1: WhatsApp Parent Engagement (Full Implementation)
#### 09-BE-002: WhatsApp Notification Sender
- **Owner**: Backend (Agent 1)
- **Points**: 8
- **Description**:
  - Event: AttendanceMarked → trigger parent WhatsApp
  - Event: MarksEntered → trigger parent WhatsApp
  - Template: "Hi Raj's attendance: Present" (customizable)
  - Retry logic: 3 attempts if delivery fails
- **AC**:
  - ✅ Messages sent within 30s of event
  - ✅ Delivery rate >98%
  - ✅ Gracefully fails if WhatsApp API down (retries, doesn't crash)

#### 09-FE-001: WhatsApp Opt-In UI
- **Owner**: Frontend (Agent 2)
- **Points**: 3
- **Description**:
  - Parent settings: Toggle "Attendance notifications", "Marks alerts"
  - Store phone number: WhatsApp validation
  - Test message: Send sample to verify number
- **AC**:
  - ✅ Phone number validated (India format +91)
  - ✅ One-tap opt-in/out

#### 09-DA-002: WhatsApp Engagement Analytics
- **Owner**: Data (Agent 3)
- **Points**: 3
- **Description**:
  - Track: Messages sent, delivered, failed, opened
  - Dashboard query: "Parent engagement by school"
- **AC**:
  - ✅ Real-time event tracking
  - ✅ Can measure campaign effectiveness (Week 11 step)

**Total Week 9 Effort**: 54 story points (13/14 per agent—challenging sprint, needs focus)

**Note**: Week 9 is heavier than typical due to 2-feature launch (Marks + WhatsApp). Consider splitting if velocity drops.

---

## Week 10: Performance & Analytics Dashboard

### P2: Performance Optimization for Scale (2000+ students)
#### 10-BE-001: Query Optimization & Caching  
- **Owner**: Backend (Agent 1)
- **Points**: 8
- **Description**:
  - Profile top 5 slow queries (Firestore)
  - Add composite indexes where needed
  - Redis cache layer for student list (TTL 5min on hot data)
  - Benchmark: Sub-100ms response at 1000 concurrent students
- **AC**:
  - ✅ P90 <100ms (vs. current 240ms)
  - ✅ No change to API contract (caching transparent)
  - ✅ Cache eviction working (verified with TTL test)

#### 10-FE-001: Bundle Size & Lazy Route Loading
- **Owner**: Frontend (Agent 2)
- **Points**: 5
- **Description**:
  - Split routes: Attendance, Marks, Reports into separate chunks
  - Code splitting: Each feature ~150KB (vs. 890KB total today)
  - Measure: Initial JS load <200KB at start
- **AC**:
  - ✅ First paint <1.5s (vs. 2.5s today)
  - ✅ Interactive ready <3s

#### 10-QA-001: Load Testing (1000-2000 Concurrent)
- **Owner**: QA (Agent 5)
- **Points**: 5
- **Description**:
  - Load test: 1000 students opening app simultaneously
  - Spike test: 100→500 users in 10 seconds
  - Measure P50, P90, P99 latencies
- **AC**:
  - ✅ P99 <500ms under 1000 user load
  - ✅ Zero errors under normal operation

### P2: Analytics Dashboard & School Admin Reporting
#### 10-DA-001: BI Dashboard Layer  
- **Owner**: Data (Agent 3)
- **Points**: 8
- **Description**:
  - BigQuery + Looker Studio integration
  - Pre-built dashboards:
    - Attendance trends by class/subject
    - Performance by student/demographic
    - Operational metrics (API uptime, load trends)
  - Row-level security: Each school sees only their data
- **AC**:
  - ✅ Dashboard loads <5s
  - ✅ Drill-down works (click class → see students)
  - ✅ Export to PDF works

#### 10-FE-002: In-App Analytics Page
- **Owner**: Frontend (Agent 2)
- **Points**: 6
- **Description**:
  - Embed Looker dashboard in React app
  - School admin view: "Your school's analytics"
  - Show: Class performance, attendance trends, upcoming students
- **AC**:
  - ✅ Embedded dashboard loads within app
  - ✅ Real-time data (refreshes hourly)

**Total Week 10 Effort**: 35 story points (feasible, focuses on scale)

---

## Week 11: Mobile App POC & Operationalization

### P3: Mobile App Proof-of-Concept (One-Week Sprint)
#### 11-FE-001: React Native Attendance Module (Mobile)
- **Owner**: Frontend (Agent 2)
- **Points**: 10  
- **Description**:
  - Cross-platform: iOS + Android
  - Core: Attendance mark/unmark, today's view
  - Offline: Flag records when offline, sync when restored
  - Biometric: Fingerprint unlock support
- **AC**:
  - ✅ App runs on Android 12+ and iOS 15+
  - ✅ 100MS latency for mark/unmark
  - ✅ Can work offline, syncs correctly

#### 11-BE-001: Mobile API Optimizations
- **Owner**: Backend (Agent 1)
- **Points**: 5
- **Description**:
  - GraphQL endpoint for mobile (smaller payloads than REST)
  - Pagination: max 50 records per request
  - Compression: Reduce payload by 60% vs. REST
  - HTTP/2: Enable for mobile clients
- **AC**:
  - ✅ Mobile payload <50KB queries
  - ✅ Battery consumption profiled (target <5% per 1-hour session)

#### 11-QA-001: Mobile Testing (Beta)
- **Owner**: QA (Agent 5)
- **Points**: 5
- **Description**:
  - E2E: Mark attendance on phone, sync to cloud
  - Network: Test on 4G, 3G, WiFi (latency simulation)
  - Stress: 1-week continuous use without app crash
- **AC**:
  - ✅ Zero crashes in week-long test
  - ✅ Data integrity: All marks synced correctly

#### 11-DO-001: Operational Runbooks & Monitoring
- **Owner**: DevOps (Agent 4)
- **Points**: 5
- **Description**:
  - Runbook: "How to deploy a hotfix" (step-by-step)
  - Metric dashboards: API health, error rates, user activity
  - Alert thresholds: Notify on-call when P99 > 500ms
  - Incident response: War room setup, postmortem template
- **AC**:
  - ✅ Hotfix process <30min end-to-end
  - ✅ Alerts configurable per school

**Total Week 11 Effort**: 25 story points (POC sprint, lower load)

---

## Backlog by Priority

### Revenue-Directly-Generating (P0-P1): 99 story points
- Week 8 Pilot Launch: 45 points
- Week 9 Marks + WhatsApp: 54 points

### Retention-Driving (P2): 35 story points
- Week 10 Performance + Analytics: 35 points

### Platform/Expansion (P3): 25 story points
- Week 11 Mobile POC: 25 story points

---

## Resource Allocation & Pacing

| Week | Backend | Frontend | Data | DevOps | QA | Total |
|------|---------|----------|------|--------|-----|-------|
| 8 | 10 | 10 | 5 | 3 | 5 | 33 |
| 9 | 18 | 19 | 11 | 2 | 8 | 58 |
| 10 | 8 | 11 | 8 | 2 | 5 | 34 |
| 11 | 5 | 10 | 0 | 5 | 5 | 25 |

**Notes**:
- Week 9 is hard sprint—may need overlap with week 8 (finish items Friday, start week 9 Monday)
- Week 10 reduces load (optimization, not new features) for quality focus
- Week 11 is experimental (mobile POC), lower commitment

---

## Go/No-Go Milestones

| Gate | Week | Criteria | Owner |
|------|------|----------|-------|
| **Pilot Production Ready** | End of W8 | <250ms P90, 99.9% availability, zero security issues | Product Agent + QA |
| **Marks Feature Launch** | End of W9 | Teachers can enter 1000 marks in <5 min, parents see results | Backend + Frontend |
| **WhatsApp Live** | End of W9 | >95% delivery rate, <30s latency, graceful failover | Backend + Data |
| **Performance Target Hit** | End of W10 | P99 <500ms at 1000 users, sub-100ms at 2000 | DevOps + QA |
| **Mobile MVP Stable** | End of W11 | Zero crashes over 7-day beta, offline sync 100% | Frontend + QA |

---

## Review Checklist

- [x] All items have estimated story points
- [x] Items align with Phase 2 retrospective (lessons applied)
- [x] Revenue impact identified (P0/P1 focus)
- [x] Resource leveling reasonable (no agent >15 points/week sustained)
- [x] Dependencies identified (e.g., BE→FE→QA chain)
- [x] Risk assessment included (W9 heavy sprint flagged)

**Approved By**: Product Agent | **Date**: April 10, 2024

---

## Next: [BACKLOG_PRIORITIZATION_FRAMEWORK.md](BACKLOG_PRIORITIZATION_FRAMEWORK.md)
