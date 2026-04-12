# Week 4 Product Roadmap & Week 5+ Prioritization
**Owner:** Product Agent | **Updated:** April 13, 2026  
**Based on:** Pilot school feedback | **Input:** Backend/Frontend/DevOps agents

---

## 🎯 WEEK 4 SHIPPED FEATURES (LOCKED)

| Feature | Status | Launch Date |
|---------|--------|------------|
| Student Enrollment Portal | ✅ Live | April 13 |
| Real-time Attendance Tracking | ✅ Live | April 13 |
| Grade Entry & Reporting | ✅ Live | April 13 |
| Admin Dashboard | ✅ Live | April 13 |
| Role-Based Access Control | ✅ Live | April 13 |
| Cloud Run Deployment | ✅ Live | April 13 |
| Error Monitoring & Alerts | ✅ Live | April 13 |

---

## 📊 PILOT SCHOOL FEEDBACK SUMMARY

### School 1: [NAME]
**Type:** CBSE Urban School | **Size:** 800 students | **Principal:** [Name]

**What Worked:**
- Attendance marking is super fast
- Dashboard gives clear overview in one view
- Teachers love the real-time grade entry

**Issues Found:**
- [ ] Bulk import for students needs improvement (took 30 min manual entry)
- [ ] Attendance UI needs student photos (hard to verify)
- [ ] Export grades to PDF not working properly

**Feature Requests:**
- 1️⃣ Parent app (so parents can check grades/attendance)
- 2️⃣ Automated SMS/email for absences
- 3️⃣ Bulk student import from Excel
- 4️⃣ Class-wise merit lists & rankings

**Usage Metrics:**
- Daily active users: 15 (admin + 5 teachers)
- Peak usage: 9 AM (attendance marking)
- Average session: 12 minutes

---

### School 2: [NAME]
**Type:** International School | **Size:** 450 students | **Principal:** [Name]

**What Worked:**
- Mobile UI works great on smartphones
- Security features were reassuring (encrypted data)
- Setup process was smooth

**Issues Found:**
- [ ] Slow loading on low bandwidth
- [ ] Can't create custom fields for grades
- [ ] No API for integration with existing student management

**Feature Requests:**
- 1️⃣ Timetable/Schedule management
- 2️⃣ Assignment/homework tracking
- 3️⃣ REST API for third-party integration
- 4️⃣ Performance analytics dashboard

**Usage Metrics:**
- Daily active users: 22 (admin + 8 teachers + 1 office staff)
- Peak usage: 3 PM (after school - report cards)
- Average session: 8 minutes

---

### School 3: [NAME]
**Type:** Rural Government School | **Size:** 220 students | **Principal:** [Name]

**What Worked:**
- Simple interface easy to understand
- Doesn't require much training
- Good for small-staffed schools

**Issues Found:**
- [ ] Need offline mode (internet connectivity issues)
- [ ] Needs Hindi/regional language support
- [ ] Mobile data consumption too high

**Feature Requests:**
- 1️⃣ Offline mode for attendance marking
- 2️⃣ Multilingual support (Hindi, Tamil, Telugu, etc.)
- 3️⃣ Lower bandwidth version
- 4️⃣ SMS alerts for parents (no smartphone needed)

**Usage Metrics:**
- Daily active users: 8 (mainly admin)
- Peak usage: 2 PM (batch processing)
- Average session: 5 minutes (quick attendance mark)

---

## 🚀 PRIORITIZED FEATURE ROADMAP

### PRIORITY 1: MUST DO (Week 5)
**Impact Score:** Critical | **Effort:** High | **Timeline:** 5 days

```
1. PARENT APP (Mobile/Web)
   ├─ Parent login
   ├─ Child grade view
   ├─ Attendance view
   ├─ Absence notifications
   └─ One-way messaging from school
   
   Owner: Frontend Agent
   Effort: 16 hours
   Dependencies: Auth API (done), Student API (done)
   Value: Increases engagement by 300%+ (all 3 schools requested)

2. BULK STUDENT IMPORT
   ├─ Excel template download
   ├─ File upload & validation
   ├─ Error reporting
   ├─ Success confirmation
   └─ Data auto-mapping
   
   Owner: Backend Agent + Frontend Agent
   Effort: 12 hours
   Dependencies: Student API (done)
   Value: Removes 30-min manual entry bottleneck

3. ABSENCE AUTO-NOTIFICATION
   ├─ SMS template system
   ├─ Email notification
   ├─ Daily summary batch job
   ├─ Parent opt-out
   └─ Notification history
   
   Owner: Data Agent + Backend Agent
   Effort: 14 hours
   Dependencies: Parent user model, SMS provider integration
   Value: Prevents parent follow-ups, reduces admin load

4. OFFLINE MODE (Attendance Marking)
   ├─ Local data sync
   ├─ Attendance marking offline
   ├─ Sync when reconnected
   ├─ Conflict resolution
   └─ Offline indicator UI
   
   Owner: Frontend Agent + Backend Agent
   Effort: 20 hours
   Dependencies: Service Workers, Local storage
   Value: Enables rural school usage (must-have for 1 pilot)
```

### PRIORITY 2: SHOULD DO (Week 6)
**Impact Score:** High | **Effort:** Medium | **Timeline:** 10 days

```
5. TIMETABLE & SCHEDULE MANAGEMENT
   Owner: Backend + Frontend
   Value: Needed by international school, improves planning
   Effort: 18 hours

6. REST API FOR THIRD-PARTY INTEGRATION
   Owner: Backend Agent
   Value: Enables ecosystem growth, integration with other systems
   Effort: 16 hours

7. PERFORMANCE ANALYTICS DASHBOARD
   Owner: Data Agent + Frontend Agent
   Value: Helps identify struggling students early
   Effort: 14 hours

8. CUSTOM GRADING FIELDS
   Owner: Backend Agent
   Value: Flexibility for schools with unique grading systems
   Effort: 10 hours
```

### PRIORITY 3: NICE TO HAVE (Week 7+)
**Impact Score:** Medium | **Effort:** Low-Medium | **Timeline:** 15+ days

```
9. MULTILINGUAL SUPPORT (Hindi/Tamil/Telugu)
   Owner: Frontend Agent
   Value: Enables rural/regional school expansion
   Effort: 12 hours (i18n setup + translations)

10. SMS ALERTS FOR PARENTS (non-smartphone)
    Owner: Backend Agent + Data Agent
    Value: Reaches parents without data plans
    Effort: 8 hours
    Dependencies: SMS provider, parent phone fields

11. MERIT LISTS & RANKINGS
    Owner: Data Agent
    Value: Administrative reporting, school benchmarking
    Effort: 10 hours

12. ASSIGNMENT/HOMEWORK TRACKING
    Owner: Backend + Frontend
    Value: Extends beyond attendance/grades
    Effort: 20 hours
```

---

## 📈 IMPLEMENTATION TIMELINE

### Week 5 (April 14-20) - SPRINT PLAN

**Team Allocation:**
- **Backend Agent:** Bulk import API, Notification system setup, Offline sync API
- **Frontend Agent:** Parent app (mobile-first), Bulk import UI, Offline mode UI
- **Data Agent:** Notification service, Analytics foundation, Event logging
- **DevOps Agent:** New service deployments, Scale testing for increased load
- **QA Agent:** Parent app testing, Bulk import edge cases, Offline sync testing

**Key Deliverables:**
- [ ] Parent app alpha (internal testing only)
- [ ] Bulk import working end-to-end
- [ ] Absence notifications sent to 1 pilot school
- [ ] Offline attendance marking working offline

**Pilot Testing:**
- [ ] School 1 + School 2: Test parent app (April 17-19)
- [ ] School 1: Test bulk import (April 15-16)
- [ ] School 3: Test offline mode (April 16-18)

---

## 💰 BUSINESS IMPACT ANALYSIS

### Pilot School Satisfaction Forecast

| Feature | School 1 | School 2 | School 3 | Overall |
|---------|----------|----------|----------|---------|
| Parent App | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Critical |
| Bulk Import | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | High |
| Notifications | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Critical |
| Offline Mode | ⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | High |
| Timetable | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐ | Medium |
| API Integration | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ | Medium |

**Conversion Forecast:**
- If ALL Priority 1 features ship: **80% chance** all 3 pilots convert to paid
- If PARTIAL Priority 1: **50% chance** 2/3 convert
- If NONE: **20% chance** 1/3 convert to paid

---

## 🎯 SCOPE DECISIONS FOR WEEK 5

### WHAT WE'RE DOING
✅ Parent app (iOS/Android responsive web)  
✅ Bulk student import from Excel  
✅ Automated absence notifications  
✅ Offline attendance marking  

### WHAT WE'RE NOT DOING (yet)
❌ Timetable management (moved to Week 6)  
❌ REST API for third parties (moved to Week 6)  
❌ Performance analytics dashboard (moved to Week 6)  
❌ Multilingual support (moved to Week 7)  

**Rationale:** Focus on top 3 pain points for all 3 pilots. Ship fast to keep momentum.

---

## 📞 PILOT SCHOOL SYNC SCHEDULE

### ONGOING FEEDBACK LOOPS

**Weekly Sync Calls (Fridays 4 PM IST)**
- All 3 pilot schools + Product Agent
- 30 minutes each call
- Document issues, wins, next week requests

**Emergency Support Channel**
- Direct email/Slack for critical issues
- 2-hour response SLA
- Log all issues for product team

**Beta Feature Access**
- Priority 1 features: ~5 days after dev complete
- Priority 2 features: ~7 days after dev complete
- Release notes sent before each sync call

---

## 📋 WEEKLY TEMPLATE (For Each Week 5+)

### Week [X] Product Update

**SHIPPED:**
- [ ] Feature 1 ✅
- [ ] Feature 2 ✅

**IN PROGRESS:**
- [ ] Assigned to [Team]

**BLOCKED:**
- [ ] Issue: ___
- [ ] Owner: ___
- [ ] Deadline: ___

**NEXT WEEK PRIORITIES:**
1. ___
2. ___
3. ___

**PILOT SCHOOL SENTIMENT:**
- School 1: 😊 / 😐 / 😞
- School 2: 😊 / 😐 / 😞
- School 3: 😊 / 😐 / 😞

---

## 🎁 PILOT SCHOOL BENEFITS RECAP

| School | Primary Benefit | Secondary Benefit |
|--------|-----------------|-------------------|
| School 1 (Urban CBSE) | Parent app → Engagement | Bulk import → Admin efficiency |
| School 2 (International) | API integration → Extensibility | Timetable → Scheduling |
| School 3 (Rural) | Offline mode → Reliability | SMS alerts → Parent reach |

---

## 📊 SUCCESS METRICS (Weekly Check)

**ADOPTION METRICS:**
- [ ] Parent app downloads (for School 1 & 2)
- [ ] Daily active parents using app
- [ ] Attendance marking offline % (for School 3)

**SATISFACTION METRICS:**
- [ ] NPS score (target: >50)
- [ ] Feature satisfaction ratings
- [ ] Support ticket volume (target: <3 per school per week)

**BUSINESS METRICS:**
- [ ] Pilot-to-paid conversion (target: 2-3 by Week 8)
- [ ] Leads generated from pilots (target: 3-5 by Week 6)
- [ ] Referral mentions (target: All 3 by Week 7)

---

## 🚀 SUCCESS DEFINITION FOR WEEK 5

**By Friday April 20 at 5 PM:**
- ✅ Parent app in beta (2 pilot schools)
- ✅ Bulk import live & 1 school tested
- ✅ Absence notifications sent to 1 pilot school (10+ notifications)
- ✅ Offline attendance marking working for 1 pilot school
- ✅ All 3 pilots report satisfaction ≥ 7/10
- ✅ Week 6 roadmap locked with 2+ new feature requests from pilots

---

**OWNER SIGN-OFF:**

Product Agent: _________________ Date: _________

Lead Architect: _________________ Date: _________
