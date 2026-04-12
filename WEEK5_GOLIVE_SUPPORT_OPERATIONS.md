# WEEK 5 - GO-LIVE SUPPORT & OPERATIONS GUIDE

**Owner:** Product Agent (with Backend/Frontend/QA support)  
**Timeline:** Thursday Evening through Friday Evening (36-hour intensive support)  
**Goal:** All 10 schools go-live Friday EOD with zero critical issues  

---

## 🚀 GO-LIVE COORDINATION

### Pre-Go-Live (Thursday Evening)

**Thursday 5 PM - Pre-Flight Checklist**
- [ ] Backend confirms all APIs stable (100% uptime)
- [ ] Frontend confirms web + mobile apps tested
- [ ] QA confirms all critical tests passing
- [ ] DevOps confirms monitoring dashboards live
- [ ] Database backups verified (hourly schedule)

**Thursday 6 PM - Brief All Support Teams**
```
Team Briefing Agenda:
- Go-live timeline (Friday 9 AM sharp)
- On-call roles (who handles what)
- Escalation paths (when to involve senior devs)
- Communication channels (Slack + email)
- Support SLA (critical: <15 min response)
```

**Thursday 7 PM - Final Handoff**
- [ ] Create shared Slack channel: #week5-golive
- [ ] Post SLA document (remind everyone of 24/7 support)
- [ ] Confirm all support team members available
- [ ] Test communication channels (Slack, email, calls)

---

## 📅 FRIDAY GO-LIVE TIMELINE (Hour-by-Hour)

### 9:00 AM - Go-Live Activation

**Your Actions:**
- [ ] 9:00 AM: "All 10 schools - you're LIVE! 🚀"
- [ ] Activate all school environments (flip switch)
- [ ] Monitor all 10 school dashboards
- [ ] Post in Slack: "Go-live commencement - all systems green"

**Typical Startup Time:** 5-10 minutes (systems warmup)

**Monitor:**
- API response times (<300ms target)
- Database load (should be minimal at first)
- User login success rate (should be 100%)
- SMS delivery confirmation (first tests)

---

### 9:30 AM - First User Logins

**Your Actions:**
- [ ] Confirm: Schools report successful logins
- [ ] Check: Admin dashboards load
- [ ] Monitor: First attendance marking attempts
- [ ] Watch: First grade entries (test data)

**If Issues Arise:**
- Login errors → Backend debug (JWT tokens, Firestore auth)
- Dashboard slow → Frontend debug (state management, API calls)
- SMS not arriving → Backend debug (Twilio integration)

**Response Time:** <5 minutes (escalate immediately)

---

### 10:00 AM - Regular User Activity

**Expected Activity:**
- Teachers marking sample attendance (10-20% of teachers)
- Parents downloading mobile app (30-40% of parents)
- Admins importing real student data (bulk CSV)
- Students accessing dashboard (checking dashboard)

**Your Monitoring:**
- [ ] Check each school's dashboard (usage metrics)
- [ ] Monitor API response times (should remain <300ms)
- [ ] Watch for error patterns (log aggregation)
- [ ] Confirm SMS delivery working

**If Performance Drops:**
- <400ms p95 latency is acceptable
- >500ms p95 latency → Alert backend (possible query optimization)
- >1s response → Escalate (possible load issue)

---

### 12:00 PM - Midday Checkpoint

**Your Actions:**
- [ ] Call each school: "How's it going?"
- [ ] Ask: "Any issues, questions?"
- [ ] Review: Attendance marked? Grades entered?
- [ ] Log: Any requests or concerns

**Schools Report:**
- 8/10 schools: Smooth sailing ✓
- 1-2 schools: Minor issues (SMS delay, UI confusion)
- 0 schools: Critical blockers (rare if well-tested)

**If Issues Found:**
- Non-critical → Log for Day 1 PM fix
- Critical (attendance breaking) → PAGE BACKEND (urgent)

**Escalation Trigger:**
- Any teacher can't mark attendance → CRITICAL
- Any parent can't see grades → CRITICAL
- SMS not sending → HIGH (but workaround: email)
- UI confusing → MEDIUM (log for Day 1 PM)

---

### 2:00 PM - Early Adoption Phase

**What's Happening:**
- More teachers are now marking attendance (cumulative adoption)
- More parents are downloading mobile app
- Admin staff importing real bulk student data
- First waves of students accessing portals

**Your Monitoring:**
- [ ] Database write load (Firestore writes should scale)
- [ ] API throughput (should handle 100+ concurrent users)
- [ ] Error rates in logs (should be <0.1%)
- [ ] SMS queue depth (should be <100 pending)

**Performance Targets:**
```
Concurrent Users: 100-200 (normal for 2 PM, Friday)
API latency p50: <100ms
API latency p95: <300ms
Error rate: <0.1%
SMS delivery: <30 seconds
Database CPU: <40%
```

---

### 4:00 PM - Peak Usage Phase

**What's Happening:**
- End-of-day attendance marking (final push)
- Grade completion (teachers finishing session work)
- Peak parent app downloads (evening usage)
- Bulk student import completion

**Your Actions:**
- [ ] Monitor peak load (should be highest today)
- [ ] Check API performance (should remain <300ms)
- [ ] Verify no cascading failures (one school issue shouldn't affect others)
- [ ] Review error logs (any patterns?)

**If Performance Degrades:**
- <400ms p95: Acceptable (peak load)
- 400-500ms p95: Warning (monitor closely, may need optimization)
- >500ms p95: Issue (escalate, possible optimization or capacity needed)

---

### 5:00 PM - Evening Summary & NPS Launch

**Your Actions:**
- [ ] Brief BackEnd/Frontend teams: "Excellent day, here's what we saw"
- [ ] Celebrate small wins in Slack ("First 100 attendance marks! 🎉")
- [ ] Launch NPS survey (all 500+ users)
- [ ] Log any remaining issues (for Day 1 follow-up)

**NPS Survey Message:**
```
Subject: You're live! Quick 2-min feedback? 🎉

We've had a smooth first day of DeerFlow at your school! 
While everything is fresh, would you take 2 minutes to rate your experience?

[NPS Link]

Your feedback will directly shape what we build next. Thank you!
```

---

### 6:00 PM - Close of Day 1

**Your Actions:**
- [ ] Final support window (30 min, respond to any urgent questions)
- [ ] Compile Day 1 summary:
  - Schools live: 10/10 ✓
  - Critical issues: 0
  - High issues: 0-2
  - Low issues: 5-10 (normal)
- [ ] Post in Slack:
    ```
    🎉 DAY 1 COMPLETE 🎉
    
    ✅ 10 schools live
    ✅ 2,647 users active
    ✅ 156 attendance marks recorded
    ✅ 48 grades entered
    ✅ 287 parents downloading app
    ✅ 0 critical issues
    ✅ 98% uptime
    
    Excellent work, team!
    ```

- [ ] Teams stand down (no all-nighter needed if all is well)
- [ ] Agree on Day 2 standup time (9 AM)

---

## 🎯 CRITICAL SUPPORT ISSUES (Escalation Protocol)

### Issue #1: Login Failures

**Symptom:** Users can't log in (jwt errors, Firestore auth failures)  
**Impact:** CRITICAL (blocks entire school)  
**Your Response:**
1. Confirm: Is it all schools or just one?
2. If all: Backend PAGE (possible Firestore auth outage)
3. If one school: Check student data (duplicate emails, encoding issues)
4. Workaround: Provide backup login (different auth method)
5. Time to fix: <15 minutes

---

### Issue #2: Attendance Marking Broken

**Symptom:** Teachers can't save attendance (API error)  
**Impact:** CRITICAL (core feature blocked)  
**Your Response:**
1. Test yourself (reproduce in screenshot)
2. Check backend logs for API errors
3. Page Backend immediately (likely Firestore write issue)
4. Workaround: Manual CSV upload (if possible)
5. Time to fix: <30 minutes

---

### Issue #3: Grades Not Visible to Parents

**Symptom:** Parents see "No grades available" in app  
**Impact:** CRITICAL (revenue-threatening)  
**Your Response:**
1. Check database (are grades actually saved?)
2. Check API endpoint (is data being returned?)
3. Check frontend (is UI bug?)
4. Page Frontend immediately (likely state management issue)
5. Workaround: Show grades via web (let parents use browser)
6. Time to fix: <20 minutes

---

### Issue #4: SMS Not Sending

**Symptom:** SMS notifications not arriving at parents' phones  
**Impact:** HIGH (non-core, but parent-facing)  
**Your Response:**
1. Check Twilio integration (API keys correct?)
2. Test with sample number (does it work manually?)
3. Check queue depth (are messages stuck?)
4. Page Backend (likely Twilio API issue or quota)
5. Workaround: Send email instead (fallback)
6. Time to fix: <45 minutes

---

### Issue #5: Mobile App Crashing

**Symptom:** Parents' app crashes on login/dashboard  
**Impact:** MEDIUM (mobile users blocked, but web still works)  
**Your Response:**
1. Reproduce on device (Android vs. iOS?)
2. Check frontend logs (crash stacktrace)
3. Page Frontend immediately (likely React Native issue)
4. Workaround: Use web browser (should work fine)
5. Time to fix: <1 hour (may need app store update)

---

### Issue #6: Database Performance Degradation

**Symptom:** All API calls slow (>500ms response time)  
**Impact:** HIGH (affects all schools)  
**Your Response:**
1. Check database CPU/memory (approaching capacity?)
2. Check query performance (any slow queries?)
3. Page Backend + DevOps (likely needs DB optimization)
4. Possible fix: Rebuild indexes, horizontal scaling
5. Time to resolve: 30-60 minutes

---

## 📊 MONITORING DASHBOARD (Real-Time)

### What to Watch on Friday

```
SYSTEM HEALTH DASHBOARD (Auto-refresh every 30 seconds)

🟢 API Status: UP
   ├─ Response Time (p95): 142ms ✓
   ├─ Error Rate: 0.02% ✓
   └─ Throughput: 2,847 RPS ✓

🟢 Database: HEALTHY
   ├─ Firestore Writes: 1,284/min ✓
   ├─ Read Latency (p95): 87ms ✓
   └─ CPU Usage: 23% ✓

🟢 Mobile App: LIVE
   ├─ Active Sessions: 287 users (iOS 156, Android 131)
   ├─ Crash Rate: 0.1% ✓
   └─ Latest Build: v1.0 (no errors)

🟢 SMS Notifications: DELIVERING
   ├─ Queue: 34 pending (normal)
   ├─ Delivery Rate: 99.3% ✓
   └─ Avg Latency: 8.3 seconds ✓

🟡 Parent Email: AVAILABLE
   ├─ Sent Today: 156 emails
   ├─ Bounce Rate: 1.2% (normal)
   └─ Open Rate: 67% ✓

SCHOOL STATUS:
├─ Greenfield (Delhi): LIVE ✓ (156 active users)
├─ English School (Mumbai): LIVE ✓ (287 active)
├─ B.S. Intl (Bangalore): LIVE ✓ (198 active)
├─ AIT School (Pune): LIVE ✓ (145 active)
├─ Vibgyor (Hyderabad): LIVE ✓ (223 active)
├─ Vidyapith (Chennai): LIVE ✓ (128 active)
├─ Orchids (Kolkata): LIVE ✓ (312 active)
├─ DPS East (Gurgaon): LIVE ✓ (298 active)
├─ Akshar (Indore): LIVE ✓ (89 active)
└─ Wisdom Valley (Ahmedabad): LIVE ✓ (173 active)

TOTAL: 2,009 active users (target: 2,500+ by EOD)

🟢 SLA Status:
   ├─ Support Response: <5 min avg
   ├─ Issue Resolution: 0 critical (all high resolved <30 min)
   └─ Uptime: 99.98% ✓
```

---

## 📞 SUPPORT ESCALATION MATRIX

### Who To Call (Production Issues)

```
ISSUE TYPE          | Primary Contact      | Backup Contact
───────────────────────────────────────────────────────────
Login Failures      | Backend Agent        | Lead Architect
Attendance Bug      | Backend Agent        | QA Agent
Grades Not Showing  | Frontend Agent       | Backend Agent
Mobile App Crash    | Frontend Agent       | DevOps Agent
SMS Not Sending     | Backend Agent        | DevOps Agent
Database Slow       | DevOps Agent         | Backend Agent
API Down            | Backend Agent        | DevOps Agent
All Systems Down    | Lead Architect       | Your escalation
───────────────────────────────────────────────────────────
```

### Escalation Phrases (Copy-Paste)

**To Backend (API Issue):**
```
Subject: CRITICAL - [School Name] - API Issue

Symptom: [Teachers can't save attendance / Grades not visible / Login failing]

Error: [Paste error from logs]

Impact: [10 schools affected / 1 school / specific feature]

Can you investigate immediately? I'll stay on the line.
```

**To Frontend (Mobile/Web Issue):**
```
Subject: CRITICAL - [School Name] - UI/App Issue

Symptom: [Parents can't access app / Dashboard not loading / UI crashed]

Device: [iPhone 12 / Android Pixel / Web Chrome]

Error: [Paste console error]

Can you check this? I have a school on hold.
```

**To DevOps (Infrastructure):**
```
Subject: CRITICAL - Database/Infrastructure Issue

Symptom: [All APIs responding slow / Database down / CDN issue]

Metrics: [API latency 1200ms / Error rate 5% / DB CPU 95%]

Can you investigate capacity/performance immediately?
```

---

## 🎓 TRAINING REMINDER (Thursday Evening)

### For Support Team (Before Friday)

**Prepare:**
- [ ] Know the product features cold (demo it yourself Thursday)
- [ ] Have FAQ ready (copy-paste responses for common Q&A)
- [ ] Bookmark monitoring dashboards
- [ ] Test your phone/Slack setup (will you receive pages?)
- [ ] Know who to escalate to (save contact info)

**Practice:**
- [ ] How to log into each school's account (test access)
- [ ] How to mark attendance + enter grades (replicate issue if needed)
- [ ] How to view error logs (understand debugging)
- [ ] How to check database (verify data integrity)

**Mental Prep:**
- This is the biggest day yet (10 schools, 2,500+ users going live)
- Issues will happen (normal, expected, manageable)
- You are prepared (tested extensively, support team ready)
- Schools are excited (not angry if you respond in <15 min)

---

## 🎯 SUCCESS TARGETS (Friday EOD)

### Hard Targets
- [ ] 10/10 schools live (100% success rate)
- [ ] Uptime: 99%+ (max 14 min downtime for day)
- [ ] Critical issues: 0 (no attendance/grades/login failures)
- [ ] Support response time: <10 min average
- [ ] User satisfaction: 9.2+/10 NPS

### Soft Targets
- [ ] 2,500+ active users by EOD (50%+ adoption Day 1)
- [ ] 300+ attendance submissions (proof of use)
- [ ] 200+ grade entries (proof of value)
- [ ] 400+ parent app downloads (70%+ penetration)
- [ ] <20 support issues logged (mostly questions, not bugs)

### Revenue Targets
- [ ] 10 schools signed ✓ (done by Thu)
- [ ] ₹7.5L deposits received (25% × ₹30L) ✓
- [ ] ₹22.5L due on go-live (75% × ₹30L) → Collect by Friday EOD

---

## 🔄 POST-GOLIVE (WEEK 1-2 TASKS)

### Day 1 Post-Golive (Saturday)
- [ ] NPS survey analysis (responses arriving)
- [ ] Support ticket review (learn what went wrong/right)
- [ ] Performance analysis (did we scale well?)
- [ ] User adoption report (which features most used?)

### Week 1 (April 21-25)
- [ ] Daily check-in calls with each school (30 min each)
- [ ] Monitor user adoption (should reach 60%+ by Wed)
- [ ] Collect feature requests (log in product backlog)
- [ ] Celebrate wins (first 1,000 attendance marks!)

### Week 2 (April 28-May 2)
- [ ] Business review calls (show ROI metrics)
- [ ] Finalize case studies (3 pilot schools)
- [ ] Begin referral program (reach out to promoters)
- [ ] Plan Week 6 feature launch

---

## 📋 GO-LIVE CHECKLIST (FINAL)

**Thursday Evening:**
- [ ] All APIs tested, stable, monitoring active
- [ ] Mobile apps submitted/approved (or ready to deploy)
- [ ] Firestore backups scheduled (hourly)
- [ ] Database indexes optimized
- [ ] Support team briefed + on-call
- [ ] Communication channels ready (Slack, email)
- [ ] Monitoring dashboards live + screens configured
- [ ] Escalation matrix shared + confirmed
- [ ] All stakeholders aligned (what is success?)

**Friday 8:30 AM:**
- [ ] You're at your computer (30 min early)
- [ ] Monitor dashboards open + ready
- [ ] Slack channel #week5-golive created
- [ ] School contact list handy (for troubleshooting)
- [ ] All team members confirmed (ready to support)
- [ ] Deep breath 🧘 (you've got this)

**Friday 9:00 AM:**
- [ ] 🚀 LAUNCH! All 10 schools go live

---

**WEEK 5 GO-LIVE MOTTO:**
> "Prepared, focused, supportive. We've trained for this. Now we execute with excellence and delight our customers."

**You've got this. Let's go-live! 🚀**
