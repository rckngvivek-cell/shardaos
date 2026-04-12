# 📅 WEEK 8 PRODUCTION DEPLOYMENT PLAN

**Phase**: 3 - Production Launch  
**Sprint**: Week 8 (April 14-18, 2026)  
**Revenue Trigger**: Pilot contract signed (April 10 demo)  
**Go-Live Target**: April 21 (Week 9 Monday)

---

## 🎯 WEEK 8 OBJECTIVES

### Primary Goal
Transition from demo-ready API to production-deployed system at pilot school

### Success Metrics
- ✅ Production database configured (Firestore with real school data)
- ✅ Teacher training completed (2 sessions)
- ✅ API deployed to Cloud Run (or stable local alternative)
- ✅ Monitoring & alerting active
- ✅ Support infrastructure ready

### Revenue Impact
- Pilot contract execution → ₹10-15L revenue (locked in from demo)
- Go-live schedule determines payment milestone

---

## 📊 WEEK 8 WORKSTREAMS

### Workstream 1: Production Infrastructure (Agent 4 - DevOps) [30 points]

**Tasks**:
1. **Enable GCP Billing** (Prerequisite)
   - Contact: GCP account admin
   - Action: Enable billing on `dps-school-system-486911` project
   - Result: Unblock Cloud Run deployment
   - Dependency: Billing account setup
   - **Timeline**: Monday 9 AM
   - **Owner**: Lead Architect (approval)

2. **Deploy to Cloud Run** 
   - Source: Dockerfile + deployment scripts (Agent 4 deliverables)
   - Destination: Cloud Run service
   - Configuration: Environment variables for production
   - Database: Connect to Firestore (requires credentials)
   - **Timeline**: Monday-Tuesday
   - **Owner**: Agent 4 (DevOps)

3. **Setup Production Monitoring**
   - Cloud Logging: Structured JSON logs for all requests
   - Cloud Monitoring: Alerts for error rates, latency, CPU
   - Application Insights: Custom metrics tracking
   - **Timeline**: Wednesday
   - **Owner**: Agent 4 (DevOps)

4. **Configure SSL/TLS**
   - Cloud Run auto-provides HTTPS
   - Domain: `school-erp-api.your-domain.com` (or gcloud-managed)
   - Certificates: Auto-renewed
   - **Timeline**: Tuesday
   - **Owner**: Agent 4 (DevOps)

### Workstream 2: Data Migration (Agent 3 - Data) [25 points]

**Tasks**:
1. **Extract School Data from CSV**
   - Source: School's existing student/exam records
   - Format: Students, Exams, Teachers, Classes
   - Validation: No duplicates, required fields present
   - **Timeline**: Monday
   - **Owner**: Agent 6 (Sales) + Agent 3 (Data)

2. **Import to Firestore**
   - Script: Auto-import tool (built by Agent 3)
   - Collections: students, exams, results, submissions
   - Validation: All imports successful
   - Backup: Original CSV retained
   - **Timeline**: Tuesday
   - **Owner**: Agent 3 (Data)

3. **Setup BigQuery Sync**
   - BigQuery table: school-erp.exams_analytics
   - Schedule: Daily sync at 2 AM
   - Monitoring: Sync lag alerts
   - **Timeline**: Wednesday
   - **Owner**: Agent 3 (Data)

4. **Initialize Pub/Sub Topics**
   - Topics: exam-events, result-events, attendance-events
   - Subscriptions: BigQuery push, Cloud Logging
   - Monitoring: Message lag tracking
   - **Timeline**: Thursday
   - **Owner**: Agent 3 (Data)

### Workstream 3: Teacher Training (Agent 6 - Sales / Agent 7 - Docs) [20 points]

**Tasks**:
1. **Prepare Training Materials**
   - Slides: 30-minute overview of exam module
   - Demo: Live walkthrough of student exam flow
   - FAQs: 2 page quick reference
   - Videos: 5-minute intro (optional)
   - **Timeline**: Today (April 10) preparation complete
   - **Owner**: Agent 7 (Docs) + Agent 6 (Sales)

2. **Execute Training Session 1** 
   - When: Wednesday 10 AM
   - Who: Math teachers (4-5 teachers)
   - Duration: 1 hour
   - Content: How to create exams, set deadlines, view results
   - **Owner**: Agent 6 (Sales) + pilot school contact
   - **Materials**: [TEACHER_TRAINING_SESSION_1.md](TEACHER_TRAINING_SESSION_1.md)

3. **Execute Training Session 2**
   - When: Thursday 2 PM
   - Who: Science teachers + admin (6-7 teachers)
   - Duration: 1 hour
   - Content: Advanced features, reporting, troubleshooting
   - **Owner**: Agent 6 (Sales) + pilot school contact
   - **Materials**: [TEACHER_TRAINING_SESSION_2.md](TEACHER_TRAINING_SESSION_2.md)

4. **Setup Support Channel**
   - Email: support@school-erp.[domain]
   - WhatsApp: +91-[Agent 6 contact]
   - Slack: school-erp-pilot channel
   - Response time: <4 hours during school hours
   - **Timeline**: Monday
   - **Owner**: Agent 6 (Sales)

### Workstream 4: Feature Completion (Agent 1-2 - Backend/Frontend) [40 points]

**Tasks - Attendance Module**:
1. **Backend: Attendance API** (Backend Agent)
   - Endpoint: `POST /api/v1/attendance` - Mark attendance
   - Endpoint: `GET /api/v1/attendance/:classId` - Get class attendance
   - Endpoint: `GET /api/v1/attendance/report/:studentId` - Attendance percentage
   - Database: Firestore collection `attendance`
   - **Timeline**: Tuesday-Wednesday
   - **Tests**: 8 new tests
   - **Owner**: Agent 1 (Backend)

2. **Frontend: Attendance UI** (Frontend Agent)
   - Component: `AttendanceMarker.tsx` - Quick-check UI for roll call
   - Component: `AttendanceReport.tsx` - Student attendance dashboard
   - Integration: Redux store + RTK Query
   - **Timeline**: Wednesday-Thursday
   - **Tests**: 6 new tests
   - **Owner**: Agent 2 (Frontend)

3. **WhatsApp Parent Notification** (Backend Agent)
   - Integration: Twilio WhatsApp API
   - Trigger: Daily attendance report for parents
   - Message: "Hi {parent}, {student} marked present today. Marks: {score}"
   - Schedule: 5 PM (end of school day)
   - **Timeline**: Friday (optional for Week 8, Phase 4 ready)
   - **Owner**: Agent 1 (Backend)

---

## 📅 WEEK 8 DAILY TIMELINE

### Monday, April 14
- 9:00 AM: Agent 4 begins GCP billing enablement
- 10:00 AM: Agent 3 extracts school data (CSV import prep)
- 11:00 AM: Agent 6 sets up support channels
- 2:00 PM: Agent 4 deploys to Cloud Run
- 4:00 PM: Smoke tests on production API
- 5:00 PM: Brief: All workstreams on track

### Tuesday, April 15
- 9:00 AM: Agent 3 imports data to Firestore
- 10:00 AM: Agent 1 starts attendance API implementation
- 2:00 PM: Agent 4 configures production monitoring
- 3:00 PM: Agent 2 starts AttendanceMarker component
- 5:00 PM: Check: Data migration validation passed

### Wednesday, April 16
- 9:00 AM: **Teacher Training Session 1** (4-5 math teachers)
- 11:00 AM: Agent 3 validates BigQuery sync
- 2:00 PM: Agent 1 completes attendance API + tests
- 3:00 PM: Attendance API smoke testing
- 4:00 PM: Agent 2 continues frontend work
- 6:00 PM: EOD checklist for Thursday readiness

### Thursday, April 17
- 9:00 AM: Agent 2 completes AttendanceReport component + tests
- 10:00 AM: Full integration testing (attendance flow)
- 2:00 PM: **Teacher Training Session 2** (6-7 science & admin)
- 4:00 PM: Post-training Q&A + troubleshooting
- 5:00 PM: Final go-live readiness checklist

### Friday, April 18
- 9:00 AM: Final production verification
- 10:00 AM: Deploy latest attendance features to production
- 11:00 AM: Teacher staff meeting (final confirmation)
- 2:00 PM: **GO-LIVE PREPARATION COMPLETE** ✅
- Ready for: Monday April 21 go-live

---

## 🔗 BLOCKING DEPENDENCIES

### Critical Path Items (Must Complete Before Go-Live)

1. **GCP Billing Enabled** ← Monday 9 AM blocker
   - Without: Cannot deploy to Cloud Run
   - Workaround: Local API + ngrok (if billing delayed)
   - Impact: 2-3 hour deployment delay per day delayed

2. **School Data CSV Export** ← Monday blocker  
   - Without: Cannot import to Firestore
   - Workaround: Use demo data for testing
   - Impact: Teacher training uses demo data (acceptable short-term)

3. **Teacher Training Completion** ← Thursday blocker
   - Without: Teachers unprepared for Monday go-live
   - Impact: Higher support load, change management risk
   - Mitigation: Video tutorials available

### Non-Critical (Can Defer to Phase 4)
- WhatsApp parent notifications (post-launch feature)
- Advanced analytics dashboard (post-launch feature)
- Mobile app (future phase)

---

## ✅ WEEK 8 GO/NO-GO CHECKLIST

### Infrastructure Ready [Agent 4]
- [ ] Cloud Run deployment successful
- [ ] HTTPS/SSL working
- [ ] Monitoring alerts active
- [ ] Logging to Cloud Logging
- [ ] Performance: API response <250ms P95

### Data Ready [Agent 3]
- [ ] School data imported to Firestore
- [ ] BigQuery sync configured
- [ ] Pub/Sub topics initialized
- [ ] Data validation complete
- [ ] Backup procedures documented

### Features Ready [Agent 1-2]
- [ ] Attendance API 100% complete + tested
- [ ] AttendanceMarker component 100% complete + tested
- [ ] AttendanceReport component 100% complete + tested
- [ ] Feature integration tested end-to-end
- [ ] Performance: UI renders <100ms

### Training Complete [Agent 6-7]
- [ ] Session 1 completed (math teachers)
- [ ] Session 2 completed (science teachers + admin)
- [ ] Support channel operational
- [ ] FAQ document published
- [ ] Post-training feedback collected

### Rollout Ready [All Agents]
- [ ] Release notes prepared (Agent 7)
- [ ] Emergency runbook reviewed (Agent 7)
- [ ] Team on standby Monday 8 AM
- [ ] Customer notification sent (Agent 6)
- [ ] Go-live ceremony scheduled (Optional)

---

## 🚨 CONTINGENCY PLANS

### If Cloud Run Deployment Fails
- **Fallback 1**: Keep local API + ngrok tunnel for 1 week
- **Fallback 2**: Deploy to virtual machine (GCE instance)
- **Fallback 3**: Use Firebase Hosting + Cloud Functions

### If Teacher Training Attendance Low
- **Fallback 1**: Record sessions for on-demand viewing
- **Fallback 2**: One-on-one training for absent teachers
- **Fallback 3**: Extend pilot timeline by 1 week

### If School Data Import Has Issues
- **Fallback 1**: Manual data entry (1-2 days)
- **Fallback 2**: Use demo data for go-live, real data by Day 3
- **Fallback 3**: Stagger go-live (exams only first, attendance later)

---

## 📞 ESCALATION CONTACTS

| Issue | Contact | Phone | Email |
|-------|---------|-------|-------|
| Production Emergency | Lead Architect | [phone] | [email] |
| GCP Billing/Infra | Agent 4 (DevOps) | [phone] | [email] |
| Data Issues | Agent 3 (Data) | [phone] | [email] |
| Teacher Support | Agent 6 (Sales) | [phone] | [email] |
| Feature Bugs | Agent 1-2 (Backend/Frontend) | [phone] | [email] |

---

## 📈 SUCCESS METRICS FOR WEEK 8

| Metric | Target | Measure | Owner |
|--------|--------|---------|-------|
| Cloud Run Uptime | 99.9% | Monitoring dashboard | Agent 4 |
| API Response Time | <250ms P95 | New Relic / Cloud Monitoring | Agent 4 |
| Data Import Success | 100% | Record count match | Agent 3 |
| Teacher Training Attendance | 100% | Sign in sheets | Agent 6 |
| Feature Test Coverage | >90% | pytest / vitest | Agent 1-2 |
| Zero Critical Bugs | 0 | Bug tracking system | All agents |
| Go-Live Readiness | 100% | Checklist completion | Lead Architect |

---

## 🎯 WEEK 8 OWNER & PRIORITIES

| Agent | Priority Tasks | Commitment (hrs/week) |
|-------|----------------|----------------------|
| **Agent 1 (Backend)** | Attendance API, WhatsApp integration | 20 hrs |
| **Agent 2 (Frontend)** | AttendanceMarker, AttendanceReport UI | 15 hrs |
| **Agent 3 (Data)** | School data import, BigQuery sync | 25 hrs |
| **Agent 4 (DevOps)** | Cloud Run deployment, production monitoring | 30 hrs |
| **Agent 5 (QA)** | Regression testing, go-live validation | 20 hrs |
| **Agent 6 (Sales)** | Teacher training, support setup | 10 hrs |
| **Agent 7 (Docs)** | Training materials, go-live runbook | 8 hrs |
| **Agent 8 (Product)** | Backlog refinement for Phase 4 | 5 hrs |

**Total Team Commitment**: 133 hours (Week 8 focused sprint)

---

## 🔄 HANDOFF TO WEEK 9 (Go-Live Week)

**Monday, April 21**:
- ✅ API deployed and stable
- ✅ Teachers trained and confident
- ✅ Data migrated and validated  
- ✅ Monitoring active and alerts configured
- ✅ 24/7 support team on standby

**Go-Live Actions**:
1. Announce: "School ERP is live!"
2. Students access system for first time
3. Teachers monitor usage with Agent 6 on call
4. Collect real-time feedback for Day 1 fixes
5. Track: Student adoption rates, system stability

**Revenue Recognition**:
- Pilot contract: ₹10-15L
- Payment: Milestone 1 at go-live (50%)
- Milestone 2: After 2 weeks of stable operation (50%)

---

*Phase 3 Plan Complete - Ready for Execution*  
*Lead Architect: Review & Approve*  
*Generated: April 10, 2026*
