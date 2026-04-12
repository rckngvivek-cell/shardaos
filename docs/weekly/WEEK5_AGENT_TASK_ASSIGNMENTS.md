# WEEK 5 - AGENT TASK ASSIGNMENTS & EXECUTION PROTOCOL

**Master Plan:** WEEK5_MASTER_PLAN.md  
**Detailed PRs:** WEEK5_PR_DETAILED_PLANS.md  
**Status:** 🟢 READY FOR IMMEDIATE EXECUTION (ALL AGENTS)

---

## 📋 AGENT ASSIGNMENTS (8 Agents, 6 PRs, Parallel Execution)

### BACKEND AGENT
**Responsibility:** 3 PRs (Bulk Import, SMS, Timetable)  
**Team Size:** 2 engineers (suggested)  
**Timeline:** Days 1-5  
**Deliverables:** 40+ tests | 2,000+ LOC

#### PR #7: Bulk Import Engine
- CSV parser module
- Batch insert handler (50 records at a time)
- Duplicate detection logic
- Error handling + rollback
- 15+ tests (parse, validate, batch, API)
- Performance target: <30 seconds for 500 records

**Key Decisions:**
- Use Firestore batch writes (max 500 per batch)
- Implement dry-run mode for testing
- Store import history in "imports" collection

#### PR #8: SMS Notifications
- Twilio SDK integration
- 4 message templates (attendance, grades, announcement, fee)
- Event-driven triggers (subscribe to Firestore changes)
- Audit trail logging
- Cost tracking dashboard
- 10+ tests

**Key Decisions:**
- Use Firebase Cloud Tasks for reliability
- Rate limit: 5 SMS/hour per phone
- Store SMS logs in "sms_logs" collection

#### PR #11: Timetable Management
- Timetable CRUD API (GET, POST, PUT, DELETE)
- Conflict detection engine
- CSV bulk upload
- Export formats (PDF, iCal, CSV, HTML)
- 12+ tests

**Key Decisions:**
- Validate conflicts on save, not on retrieve
- Store as flat collection with indexes
- Use compound query for class+day filtering

**Definition of Done (Backend):**
- [ ] All 40+ tests passing
- [ ] All 3 PRs code reviewed & approved
- [ ] Load tested (100 concurrent)
- [ ] Monitoring alerts configured
- [ ] APIs documented (OpenAPI/Swagger)

---

### FRONTEND AGENT
**Responsibility:** 3 PRs (Mobile, Portal, Support)  
**Team Size:** 2 engineers (suggested)  
**Timeline:** Days 1-5  
**Deliverables:** 27+ tests | 2,500+ LOC

#### PR #6: Mobile App Foundation (React Native)
- LoginScreen (SMS OTP + email)
- DashboardScreen (attendance %, grades summary)
- AttendanceScreen (calendar view + pie chart)
- GradesScreen (subjects + marks)
- ProfileScreen (edit profile + settings)
- Navigation setup (React Navigation)
- Redux store for state management
- 15+ tests (unit + integration)

**Key Decisions:**
- Use React Native Paper for Material Design
- AsyncStorage for offline caching (24-hour cache)
- RTK Query for API synchronization (same as web)
- Expo CLI for iOS/Android builds

**Responsive Targets:**
- iOS: iPhone 12 (390×844), iPhone SE (375×667)
- Android: Pixel 4a (393×851), Pixel 5 (540×720)

#### PR #10: Parent Portal MVP
- LoginPage (email + OTP)
- ChildrenDashboard (select child, name, photo, attendance %)
- AttendanceDetail (calendar view + pie chart)
- GradesDetail (subjects, marks, chart)
- AnnouncementsPage (list, by date)
- MessagesPage (teacher conversations, send message)
- FeesCard (balance, due dates, pay button)
- Settings (email, phone, language)
- 12+ tests (unit + responsive)

**Key Decisions:**
- Material-UI 5 for design system
- Redux Toolkit for state
- RTK Query for API calls
- Razorpay integration for payments

**Responsive Targets:**
- Mobile: 375px minimum
- Tablet: 768px to 1024px
- Desktop: 1920px maximum

#### Support & PR #6 Refinement
- Bug fixes on mobile app
- Performance optimization
- UI polish based on pilot feedback

**Definition of Done (Frontend):**
- [ ] All 27+ tests passing
- [ ] All pages load <2 seconds
- [ ] 100% responsive (mobile/tablet/desktop)
- [ ] Accessibility audit passed (WCAG 2.1 AA)
- [ ] 85%+ code coverage
- [ ] Storybook documentation ready

---

### DEVOPS AGENT
**Responsibility:** 1 PR (CI/CD + Monitoring) + Performance  
**Team Size:** 1 engineer  
**Timeline:** Days 1-5 (parallel)  
**Deliverables:** Mobile CI/CD, monitoring, load testing

#### PR #12: DevOps CI/CD & Monitoring
- Fastlane setup (iOS + Android builds)
- GitHub Actions workflows (automated)
- Mobile app CI/CD pipeline
- Cloud Monitoring for mobile apps
- Load testing infrastructure (1000 concurrent)
- Database migration framework
- SLA dashboard
- 16+ tests

**Key Decisions:**
- Use GitHub Actions (already in use)
- Fastlane for mobile build automation
- JMeter for load testing
- Cloud Monitoring for metrics

**Load Testing Targets:**
- p95 latency: <400ms
- Error rate: <0.1%
- Throughput: >5,000 RPS
- Sustained: 1000 concurrent users

#### Infrastructure Expansion
- Add mobile monitoring to dashboards
- Expand alert rules (new services)
- Database indexing optimization
- Cost tracking for new services

**Definition of Done (DevOps):**
- [ ] iOS CI/CD fully automated
- [ ] Android CI/CD fully automated
- [ ] Load test: 1000 concurrent ✅
- [ ] All monitoring dashboards live
- [ ] SLA dashboard showing uptime
- [ ] 16+ tests passing

---

### QA AGENT
**Responsibility:** Cross-cutting test strategy & verification  
**Team Size:** 1 engineer  
**Timeline:** Days 1-7 (through deployment)  
**Deliverables:** 95 new tests | 107 total tests

#### Test Strategy (6 PRs × 95 tests)
- Unit tests: 50+ (Jest, fast)
- Integration tests: 30+ (API contracts)
- E2E tests: 10+ (full workflows)
- Performance tests: 3+ (latency, throughput)
- Security tests: 2+ (RBAC, data isolation)

#### Test Coverage Targets
```
Overall:        85%+ coverage
Critical paths: 100% coverage
APIs:           95%+ coverage
UI:             80%+ coverage
```

#### Release Gates (8 Total)
1. [ ] All 95 new tests passing
2. [ ] Code coverage ≥85%
3. [ ] Zero critical bugs
4. [ ] Security audit passed
5. [ ] Performance test passed (1000 RPS)
6. [ ] Load test passed
7. [ ] Pilot school UAT approved
8. [ ] Lead Architect sign-off

#### Test Artifacts
- Test matrix (coverage by PR)
- Regression test suite (carry-forward)
- Performance baseline
- Security checklist

**Definition of Done (QA):**
- [ ] 95 new tests written & passing
- [ ] 107 total tests at 100% pass rate
- [ ] All 8 release gates ✅
- [ ] Zero flaky tests
- [ ] Test report generated
- [ ] Release sign-off given

---

### DATA AGENT
**Responsibility:** Reporting engine & analytics expansion  
**Team Size:** 1 engineer  
**Timeline:** Days 2-5  
**Deliverables:** 15+ tests | Reporting system

#### PR #9: Advanced Reporting Engine
- Report builder API
- 20+ pre-built templates
- Export formats (PDF, Excel, CSV)
- Report scheduling (email delivery)
- 15+ tests

**Reporting Templates:**
```
ATTENDANCE (5): Daily, Monthly, Trends, Absent Today, Leaves
GRADES (5): Term, Subject, Student, Class Performance, Toppers
FEES (3): Collection, Pending, Late Payments
TEACHER (3): Classes, Lesson Plan, Exams
SUMMARY (4): KPI Dashboard, Performance, Enrollment, Trends
```

#### Analytics Expansion
- Event tracking for new features (mobile, imports, SMS)
- BigQuery integration (ready for sync)
- Weekly analytics dashboard
- Cost analysis (SMS, bandwidth)
- User engagement metrics

#### Report Performance
- 500 students, 5 subjects → <10 seconds
- 10,000 records export → <15 seconds
- PDF generation → <5 seconds (using pdfkit)

**Definition of Done (Data):**
- [ ] 20+ templates implemented
- [ ] All export formats working
- [ ] Scheduling emails sent
- [ ] 15+ tests passing
- [ ] Performance <10 seconds
- [ ] Analytics dashboard live

---

### PRODUCT AGENT
**Responsibility:** Business & school onboarding  
**Team Size:** 1 engineer  
**Timeline:** Days 1-7 (concurrent)  
**Deliverables:** 10 schools | ₹30L+ revenue

#### School Onboarding Pipeline

**Week 5 Schools (10 Total Target):**
1. Greenfield High School (Delhi)
2. The English School (Mumbai)
3. B.S. International (Bangalore)
4. AIT School (Pune)
5. Vibgyor High (Hyderabad)
6. Vidyapith Academy (Chennai)
7. Orchids International (Kolkata)
8. DPS East (Gurgaon)
9. Akshar Academy (Indore)
10. Wisdom Valley (Ahmedabad)

**Per School (3L/year = ₹25,000/month):**
- Initial setup (1 hour)
- Training session (2 hours)
- Go-live support (3 hours)
- Monthly check-ins

**Feature Requests Tracking:**
- Log all school requests
- Prioritize for Week 6
- Build into product roadmap

**Customer Success:**
- Weekly check-in calls
- NPS tracking (target 9.2/10)
- Support ticket SLA (4 hours response)
- Case study publication

#### Revenue Projection
```
3 pilot schools:    ₹0 (free pilots)
7 premium schools:  ₹14L (₹2L each, conservative)
3 projected:        ₹9L (expected closures)
Week 5 pipeline:    ₹30+ L annual value
```

**Definition of Done (Product):**
- [ ] 10 schools signed
- [ ] ₹30L+ revenue locked (annual contracts)
- [ ] All schools go-live by Friday
- [ ] 9.2/10 average satisfaction
- [ ] Zero churn (retention 100%)
- [ ] 1 case study published

---

### DOCUMENTATION AGENT
**Responsibility:** Knowledge capture & team enablement  
**Team Size:** 0.5 engineer  
**Timeline:** Days 1-7 (concurrent)  
**Deliverables:** 6 ADRs + runbooks

#### ADRs (Architectural Decision Records)
```
ADR-005: Mobile App Technology Choice (React Native vs Flutter)
ADR-006: Reporting Engine Architecture (Real-time vs Scheduled)
ADR-007: SMS Integration (Twilio vs AWS SNS)
ADR-008: Timetable Conflict Detection (On-save vs On-query)
ADR-009: Parent Portal Authentication (Email OTP vs SMS OTP)
ADR-010: CI/CD Strategy for Mobile (Fastlane vs Codemagic)
```

#### Runbook Updates
- Mobile app release procedure
- SMS notification troubleshooting
- Report generation errors
- Database migration rollback

#### Team Documentation
- Updated architecture diagram (8 components now)
- API documentation (OpenAPI v3)
- Database schema changes
- Deployment procedures
- Crisis playbook

#### Weekly Communication
- Friday summary email (team achievements)
- Sunday planning doc (next week)
- Weekly metrics dashboard
- Retro notes & actions

**Definition of Done (Documentation):**
- [ ] 6 ADRs published (decisions documented)
- [ ] Runbooks updated (all procedures)
- [ ] API docs auto-generated (OpenAPI)
- [ ] Architecture diagram updated
- [ ] Team email sent (weekly summary)
- [ ] Next week planned

---

### LEAD ARCHITECT
**Responsibility:** Strategic direction & blocker resolution  
**Team Size:** 1 (you)  
**Timeline:** Days 1-7 (always available)  
**Deliverables:** Plan approval | PR reviews | Blocker resolution

#### Day-by-Day Responsibilities

**Day 1:**
- [ ] Review all 6 PR plans (this document)
- [ ] Approve or request changes
- [ ] Kickoff meeting with all 8 agents
- [ ] Confirm team understanding

**Days 2-5:**
- [ ] Daily 15-min standup (check blockers)
- [ ] Code review each completed PR (12-hour SLA)
- [ ] Escalate blockers if >30 minutes
- [ ] Keep master timeline on track

**Day 6:**
- [ ] Final code reviews
- [ ] Performance validation
- [ ] Security audit sign-off
- [ ] Release readiness gate

**Day 7:**
- [ ] Deployment sign-off
- [ ] Production monitoring
- [ ] Post-deploy verification
- [ ] Team celebration + retrospective

#### Blocker Resolution Protocol
```
<15 min  → Slack resolution (any agent helps)
15-30 min → 10 min call (pair with blocker owner)
>30 min  → Escalate (pivot task or replan)

Critical blockers → Drop all else, resolve immediately
```

**Definition of Done (Lead Architect):**
- [ ] All 6 PRs reviewed & approved
- [ ] Zero blockers lasting >30 minutes
- [ ] Team morale high
- [ ] Quality targets met (85%+)
- [ ] Deployment successful (zero downtime)
- [ ] Post-deploy stable (24 hours)

---

## 🚀 EXECUTION PROTOCOL

### Daily Standup (9:00 AM IST)
```
Duration: 15 minutes
Attendees: All 8 agents + Lead Architect
Format:
- Each agent: 1-2 min update
- Blockers: Any >15 min old?
- Adjustments: Any pivots needed?
- Lead Architect: Final word
```

### Code Review SLA
```
PR submitted → Reviewed within 12 hours
Feedback → 4 hours to address
Re-review → 8 hours
Pattern: Quick feedback loops (not batch reviews)
```

### PR Merge Criteria
```
✅ All tests passing (100%)
✅ Coverage ≥85%
✅ Code reviewed & approved
✅ No merge conflicts
✅ Lead Architect sign-off
✅ Deployment ready
```

### Production Deployment (Day 7)
```
Gates:
1. All PRs merged to main ✅
2. QA sign-off (all tests passing) ✅
3. Staging tested (UAT passed) ✅
4. Database migration ready ✅
5. Rollback plan ready ✅
6. Lead Architect approval ✅

Deployment:
- Blue-green strategy (same as Week 4)
- Phase 1: Canary 10% (5 min monitoring)
- Phase 2: Gradual 50% (5 min monitoring)
- Phase 3: Full 100% (10 min monitoring)
- Total time: 20 minutes
```

### Quality Checkpoints
```
Unit Test Coverage:  ≥85% (tracked by PR)
Integration Tests:   30+ tests moving
E2E Tests:          10+ tests passing
Performance:        <400ms p95 latency
Security:           0 vulnerabilities
Accessibility:      WCAG 2.1 AA
```

---

## 📊 SUCCESS METRICS (EOW - End of Week)

### Code Delivery
```
✅ 6 PRs merged to production
✅ 95 new tests written
✅ 107 total tests (100% passing)
✅ 85%+ code coverage
✅ 5,000+ LOC delivered
✅ 0 critical bugs
```

### Features Live
```
✅ Mobile app (iOS + Android):     Ready for TestFlight/Play
✅ Bulk import:                     500 students in 25 seconds
✅ SMS notifications:               <5 second send time
✅ Advanced reporting:              <10 second generation
✅ Parent portal:                   Mobile responsive, live
✅ Timetable management:            Drag-drop, conflict detection
```

### Performance
```
✅ API p95 latency:                 <400ms (vs <500ms target)
✅ Mobile app startup:              <2 seconds
✅ Report generation:               <10 seconds
✅ Bulk import:                     <30 seconds (500 records)
✅ Load test:                       1000 concurrent, 0 errors
```

### Business
```
✅ Schools onboarded:               10+ schools (13 total)
✅ Total users:                     2,500+
✅ Revenue locked:                  ₹30+ lakh annual value
✅ Customer satisfaction:           9.2/10 average
✅ Production incidents:            0
```

### Team
```
✅ All agents executing flawlessly  8/8 ✓
✅ Blockers resolved:               100% <30 min resolution
✅ Knowledge captured:              6 ADRs, runbooks
✅ Process improvements:            Documented
✅ Team morale:                     High (celebration Friday)
```

---

## 🎯 IMMEDIATE NEXT STEPS

### NOW (Activate All Agents)
1. [ ] Lead Architect: Review this assignment doc
2. [ ] Each agent: Read WEEK5_MASTER_PLAN.md + your PR details (WEEK5_PR_DETAILED_PLANS.md)
3. [ ] All together: 30-min kickoff meeting
4. [ ] Each agent: Start Day 1 planning phase

### By EOD Monday
- [ ] All 6 PR plans reviewed & approved
- [ ] Dev environments set up
- [ ] Test frameworks ready
- [ ] First code commits made
- [ ] Daily standup scheduled

### By EOW Friday
- [ ] 6 PRs production ready
- [ ] 10 schools live
- [ ] ₹30L revenue locked
- [ ] Team celebration 🎉

---

## 📝 AGENT CHECKLIST

### Backend Agent
- [ ] Read PR #7, #8, #11 detailed specs
- [ ] Set up dev environment (Node.js, Firestore emulator)
- [ ] Create feature branches (bulk-import, sms-notifications, timetable-mgmt)
- [ ] Start Day 1 API design work
- [ ] Plan database changes

### Frontend Agent
- [ ] Read PR #6, #10 detailed specs
- [ ] Set up React Native environment (Expo, simulators)
- [ ] Set up React environment (parent portal)
- [ ] Create feature branches (mobile-app, parent-portal)
- [ ] Start UI mockups

### DevOps Agent
- [ ] Read PR #12 detailed specs
- [ ] Set up Fastlane for iOS/Android
- [ ] Configure GitHub Actions for mobile CI/CD
- [ ] Set up load testing environment
- [ ] Create monitoring dashboards

### QA Agent
- [ ] Read all PR detailed specs
- [ ] Expand Jest test framework
- [ ] Create test matrix (coverage by PR)
- [ ] Set up CI/CD test automation
- [ ] Define release gates

### Data Agent
- [ ] Read PR #9 detailed specs
- [ ] Design reporting database schema
- [ ] Create report templates (20 templates)
- [ ] Set up BigQuery integration
- [ ] Plan analytics expansion

### Product Agent
- [ ] Read 10-school pipeline
- [ ] Create outreach list (10 schools)
- [ ] Prepare onboarding materials
- [ ] Schedule demo calls
- [ ] Set up customer success tracking

### Documentation Agent
- [ ] Create ADR template (6 new ADRs planned)
- [ ] Update architecture diagram
- [ ] Set up OpenAPI documentation
- [ ] Create weekly email template
- [ ] Plan runbook updates

### Lead Architect
- [ ] Review all 6 PR plans and approve
- [ ] Schedule kickoff meeting (30 min, all 8 agents)
- [ ] Confirm team readiness
- [ ] Start daily standup schedule
- [ ] Prepare deployment procedure

---

**STATUS: 🟢 WEEK 5 EXECUTION READY**

**Date Created:** April 14, 2026  
**All Agents:** Standing by for kickoff  
**Next Event:** 30-min kickoff meeting (all 8 agents)  

**LET'S SHIP WEEK 5! 🚀**

---
