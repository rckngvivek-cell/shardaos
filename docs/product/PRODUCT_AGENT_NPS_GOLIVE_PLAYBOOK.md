# NPS TRACKING SYSTEM & GO-LIVE SUPPORT PLAYBOOK

**Date:** April 10, 2026 (Day 3 Setup)  
**Launch:** Friday, April 12, 5 PM (6 hours after go-live)  
**Target:** 9.2+/10 average NPS across 10 schools  
**Timeline:** Setup today (1 hour) → Launch Friday PM → Monitor 24/7

---

## 🎯 MISSION: CAPTURE DELIGHT DAY 1

**Why NPS Day 1?**
- Schools are in honeymoon phase (excitement high)
- Capture the genuine emotional response
- Turn delighted customers into advocates
- Identify any critical issues immediately
- Set baseline for Week 1 improvement tracking

**Success = 9.2+ NPS**
- Score 9-10: Promoter → ask for referrals + testimonials
- Score 7-8: Passive → send thank-you + identify improvement area
- Score 1-6: Detractor → URGENT call within 30 min → fix problem

---

## ⚙️ PART 1: NPS SURVEY SETUP (TODAY, 30 MIN)

### STEP 1: CREATE GOOGLE FORM (15 MIN)

**Access:** Google Forms (forms.google.com)  
**Naming:** "NPS Survey - [School Name]" (create 10 versions)

**Form Fields (In Order):**

```
═════════════════════════════════════════════════════════════

PAGE 1: IDENTIFICATION

FIELD 1: School Name (Required)
Type: Dropdown menu
Options:
- Orchids School, Delhi
- DPS Vasant Kunj, Delhi
- Akshar Academy, Bangalore (all 4 campuses)
- St. Xavier's, Mumbai
- Greenwood International, Delhi
- Cosmos Academy, Bangalore
- Little Angels, Gurgaon
- Central Public School, Pune
- Elite Academy, Hyderabad
- Tech Forward Academy, Bangalore

FIELD 2: Your Role (Required)
Type: Radio buttons
- Principal / Head Master
- Administrator / Office Staff
- Teacher / Faculty
- IT Staff / Technical
- Parent / Guardian
- Other

═════════════════════════════════════════════════════════════

PAGE 2: NPS QUESTION (Most Important)

FIELD 3: "On a scale of 1 to 10, how likely are you to recommend 
          this platform to other schools?" (Required)
Type: Linear scale (1-10)
- 1 = Not at all likely
- 10 = Extremely likely

Help text: "(We use this to measure our success. Be honest!)"

═════════════════════════════════════════════════════════════

PAGE 3: FEEDBACK

FIELD 4: "What's working well so far?" (Required)
Type: Short answer (0-300 characters)
Hint: "What impressed you the most?"

FIELD 5: "What could we do better?" (Required)
Type: Short answer (0-300 characters)
Hint: "What challenged you? What's missing?"

═════════════════════════════════════════════════════════════

PAGE 4: FOLLOW-UP PREFERENCE

FIELD 6: "Can we contact you for follow-up?" (Not required)
Type: Dropdown
- Yes, call me
- Yes, email me
- No, I'll reach out if needed

FIELD 7: "Best phone number to reach you" (Conditional - shows if Yes→Call)
Type: Short answer
Format: Input validation for phone

FIELD 8: "Best email to reach you" (Conditional - shows if Yes→Email)
Type: Email
```

**Customize Form (Appearance):**
- Header image: Your logo or school imagery
- Theme color: Blue (professional, corporate)
- Accent color: Green (positive)
- "Continue to next section" button text: "Next"
- Submit button text: "Send My Feedback"
- Confirmation message: 
  ```
  "Thank you for your feedback! 
  
  Your input helps us improve. We'll review your response 
  within 24 hours and follow up if needed.
  
  - [Your Name]
  Product Lead"
  ```

---

### STEP 2: GENERATE SHAREABLE LINKS (5 MIN)

**For Each School, Create Unique Link:**

```
Base URL: https://forms.gle/[randomID]

LINK #1: Orchids School
Short link: [Setup short URL]: orchids-nps
QR code: [Generate]

LINK #2: DPS Vasant  
Short link: dps-vasant-nps
QR code: [Generate]

... repeat for all 10 schools

Store all links in a centralized spreadsheet (see below)
```

---

### STEP 3: SET UP RESPONSE SHEET (10 MIN)

**Google Sheets - "NPS_Responses_Week5"**

**Columns:**

```
A: Timestamp (auto-populated by form)
B: School Name
C: Respondent Role (Principal/Admin/Teacher/Parent/IT/Other)
D: NPS Score (1-10) [CRITICAL - use for segmentation]
E: Segment (Formula: IF(D10>=9,"Promoter",IF(D7>=7,"Passive","Detractor")))
F: What's Working (verbatim quote)
G: What Could Improve (verbatim quote)
H: Contact Permission (Yes/No)
I: Contact Number
J: Contact Email
K: Severity (Formula: IF(E="Detractor","HIGH",IF(E="Passive","MEDIUM","LOW")))
L: Follow-up Status (Not Started / Called / Resolved / Escalated)
M: Notes (your commentary)
```

**Example Row (Filled):**

```
Timestamp: April 12, 5:34 PM
School: Orchids Delhi
Role: Principal
NPS: 9
Segment: Promoter
Working: "Attendance marking is now 90 seconds vs 20 mins - teachers thrilled"
Improve: "Could we have a mobile app for marks entry?"
Contact: Yes
Phone: +91-9876543210
Email: anil.kumar@orchids.edu
Severity: LOW
Status: Not Started
Notes: Promoter - opportunity for referral + testimonial
```

---

### STEP 4: SET UP AUTO-NOTIFICATION (5 MIN)

**Create Slack Alert (if available):**

```
Webhook to Slack channel: #nps-responses

Format:
┌─────────────────────────────┐
│ 🔔 NEW NPS RESPONSE         │
├─────────────────────────────┤
│ School: [Name]              │
│ Score: [X]/10               │
│ Segment: [Promoter/etc]     │
│ Quote: "[What's working]"   │
│ Severity: [HIGH/MED/LOW]    │
└─────────────────────────────┘

If Score ≤ 6:
  Ping: @product-agent @backend-lead
  Alert: "DETRACTOR - Respond within 30 min"

If Score = 9-10:
  Ping: @product-agent
  Alert: "PROMOTER - Opportunity for testimonial/referral"
```

---

## 📊 PART 2: REAL-TIME NPS DASHBOARD (FRIDAY SETUP)

**Sheet Tab 2: "NPS_DashboardLive_Friday"**

**Live Tracking (Update every 30 minutes starting 5 PM Friday):**

```
═══════════════════════════════════════════════════════════════

SUMMARY METRICS (Top of dashboard)

Total Responses: __/10 schools
Average NPS Score: __/10 (Target: 9.2+)

Promoters (9-10): __ (Goal: 7+)
Passive (7-8): __ (Goal: 2-3)
Detractors (1-6): __ (Goal: 0)

Net Promoter Score: __ (Formula: % Promoters - % Detractors)
Response Rate: __% (Goal: 100% by next morning)

═══════════════════════════════════════════════════════════════

REAL-TIME RESPONSES TABLE

| Time | School | Score | Segment | Key Quote | Status |
|------|--------|-------|---------|-----------|--------|
| 5:34 PM | Orchids | 9 | Promoter | [Quote] | Acknowledged |
| 5:45 PM | DPS | 8 | Passive | [Quote] | Follow-up email sent |
| 6:10 PM | Cosmos | 10 | Promoter | [Quote] | Testimonial request |
| ... | ... | ... | ... | ... | ... |

═══════════════════════════════════════════════════════════════

ESCALATIONS ACTIVE

Any score ≤ 6 (Detractor):
[School Name]: [Issue Description]
↳ Action: CALLED AT [TIME]
↳ Status: INVESTIGATING / RESOLVED
↳ Owner: [Your name / Backend / DevOps]
↳ ETA Fix: [Time estimate]

Example:
Akshar Academy: "SMS not sending to some parents"
↳ Action: Called at 6:15 PM
↳ Status: INVESTIGATING (SMS module checking logs)
↳ Owner: Backend Agent
↳ ETA: 7:00 PM (20 min)

═══════════════════════════════════════════════════════════════

SUCCESS CHECKLIST (Update as you go)

☐ 100% response rate (all 10 schools responded)
☐ 9.2+ average NPS
☐ 0-1 detractors (score ≤ 6)
☐ All detractors called within 30 min
☐ No critical bugs unfixed by 10 PM
☐ 3+ promoters identified for testimonials
☐ Saturday morning comms ready (celebration or apology)

═══════════════════════════════════════════════════════════════
```

---

## 🚨 PART 3: ESCALATION & RESPONSE PROTOCOL

### WHEN RESPONSES COME IN (Friday 5 PM - 11 PM)

**RESPONSE TIME TARGETS:**

```
Score 9-10 (Promoter): Acknowledge within 2 hours
  → Thank-you email
  → Testimonial request
  → Referral program enrollment

Score 7-8 (Passive): Acknowledge within 1 hour
  → Thank-you email
  → Identify improvement area
  → "How can we do better?" follow-up

Score 1-6 (Detractor): ACTION within 15 MINUTES
  → Read response immediately
  → CALL principal within 30 min
  → Listen to issue (5 min)
  → Acknowledge problem (2 min)
  → Commit to timeline (3 min)
  → Update dashboard (1 min)
  → Escalate to escalation team if needed
```

---

### CRITICAL ISSUE RESPONSE SCRIPTS

**SCENARIO 1: "Attendance not syncing to parent app"**

```
CALL SCRIPT:
"Hi [Principal], thanks for the feedback. 

I saw you mentioned attendance not syncing. 

I want to acknowledge: That's critical, and I'm sorry we're having that 
on Day 1.

Here's what I'm doing:
1. Right now: Checking our logs to see what happened
2. Next 30 min: Fix the sync or activate manual workaround
3. 7 PM: Call you back with status

In the meantime: 
- SMS notifications still working? [YES → Good]
- Teachers can mark manually? [YES → OK temporary solution]

I'll fix this within the hour. Are you OK with that timeline?"

IF YES: "Perfect. Hang tight. I'll call at 6:45 PM latest."

IF NO / URGENT: "Understood. I'm escalating to our engineering lead now. 
We'll call you within 15 min with an ETA."

ACTION:
→ Ping Backend Agent: "Attendance sync issue - school needs fix within 1 hour"
→ Check Firestore logs immediately
→ Prepare manual workaround if needed
→ Call back with status at promised time
```

**SCENARIO 2: "Teachers saying it's too complicated"**

```
CALL SCRIPT:
"Hi [Principal], thanks for that honest feedback.

'Too complicated' usually means one of two things:
1. Training gap (they need more hands-on help)
2. UX issue (something's genuinely confusing)

Quick question: Which is it?

[Listen]

If training gap: "Here's what I'm doing: We will run a second 30-min 
focused training on [feature] tomorrow morning. Can you get 3-4 teachers 
involved who are struggling? I'll walk them through step-by-step."

If UX issue: "Tell me specifically what's confusing. I want to understand 
where we're failing and fix it."

[Listen to detail]

"Got it. Here's my plan: [Specific action]. I'll follow up tomorrow 
with a solution.

In the meantime: Everyone keeps using the system - we don't want to lose 
momentum on Day 1. Cool?"
```

**SCENARIO 3: "System crashed / Not working"**

```
CALL SCRIPT:
"Hi [Principal], I just saw that you're having system issues.

I'm treating this as a critical incident.

Right now:
- Our engineering team is investigating the root cause
- I'm here as your direct contact
- We're aiming for [X] minutes to restore

What's not working right now? [Listen]

Temporary solution until we fix: [Provide workaround - manual entry, 
other path, etc.]

[Call them back every 15 min with update]

DO NOT LET THEM THINK YOU'RE IGNORING THEM. Frequent updates > perfect solution.
```

**SCENARIO 4: "Actually, you're amazing!"**

```
RESPONSE EMAIL:

Subject: We're so glad you're thrilled! 

Hi [Name],

Thank you so much for the feedback - and for being a 10!

Seriously, responses like yours make our team's long hours worthwhile. 
Your teachers adopting so quickly, your parents engaging - that's what 
we're building for.

One ask: Would you be willing to speak about your experience briefly 
(30 min video call)? We want to show other schools what's possible.

Plus - referral opportunity: If you know 2 schools in your network who 
could benefit, I'd love an intro. We'll give you ₹25K credit toward your 
next year's fees.

Thanks for being a great partner.

[Your Name]
Product Lead
```

---

## 📞 GO-LIVE SUPPORT PLAYBOOK

### PRE-FLIGHT CHECKLIST (Thursday Evening - 24 hrs before)

**Your Responsibility - Complete by 8 PM Thursday:**

```
═══════════════════════════════════════════════════════════════

CUSTOMER READINESS

☐ All 8-10 schools trained (2-hour Thursday sessions complete)
  What to check:
  - All principals have attendance certificates
  - All IT staff passed login test
  - All teachers marked attendance in demo
  - All parents logged into portal in demo

☐ Support contact list sent to every school
  What to send:
  - Your cell phone (24/7 line)
  - Email: [your email]
  - Slack channel (if available)
  - "Call me first" numbers card

☐ Friday morning timeline shared
  What to send:
  - 9 AM = system goes live
  - 9:30 AM onwards = you're available for calls
  - 5 PM = send NPS survey
  - "We're monitoring 24/7"

☐ Backup contact info shared
  - If you can't answer, they know who to call
  - Backend Agent: [number]
  - DevOps Lead: [number]
  - 24/7 support line (if one exists)

═══════════════════════════════════════════════════════════════

SYSTEM READINESS (DevOps Confirmation)

Get this CHECKLIST from DevOps Lead Thursday 4 PM:

☐ All APIs responding <200ms median latency
☐ 95th percentile latency <500ms
☐ Database queries: <100ms (no slow queries)
☐ SMS gateway tested (100 test messages sent successfully)
☐ Email system tested (100 test emails delivered)
☐ Firestore backups: 3 recent hourly snapshots verified
☐ Monitoring dashboards live
  - API response times (visible real-time)
  - Database performance (CPU, memory, queries)
  - SMS delivery rate (% success)
  - User login volume
☐ Alerting configured
  - Latency spike: Alert if avg >500ms
  - Error rate: Alert if >1%
  - Database connection pool: Alert if >80%
☐ Rollback plan documented
  - Can revert to yesterday's code in <30 min
  - Firestore restore from backup in <60 min
  - Clear decision criteria for rollback

═══════════════════════════════════════════════════════════════

SUPPORT READINESS (Product Agent - You)

☐ 6 critical issue response scripts printed + nearby
  ☐ Attendance sync issue
  ☐ SMS not sending
  ☐ Login failures
  ☐ Data import failed
  ☐ System latency/crashes
  ☐ Parent app not working

☐ Escalation matrix created + shared
  Example:
  Issue → Who to call → Call in (response time)
  - API failure → DevOps Lead → immediately
  - Database down → DevOps Lead → immediately
  - SMS gateway issue → Backend Agent → 5 min
  - UX issue → Frontend Agent → 15 min
  - Feature gap → You (Product Agent) → 30 min

☐ Contact list on multiple places
  - Taped to monitor
  - In phone (top 5 contacts)
  - In Slack pinned message
  - Email signature

☐ Slack channels organized
  - #nps-responses (notifications)
  - #day1-support (escalations)
  - #product-team (coordination)

═══════════════════════════════════════════════════════════════

FINANCIAL READINESS

☐ All 8-10 school contracts signed
☐ 25% deposits in bank account
☐ Invoice tracking sheet prepared
  - Who still owes 75%?
  - Payment due date: [Day 1 go-live]
  - Escalation path if payment delayed

☐ Supporting payments
  - Team bonus tracking (if applicable)
  - Revenue recognition (accounting)

═══════════════════════════════════════════════════════════════
```

---

### FRIDAY MORNING: LAUNCH SEQUENCE (8:30 AM - 9:00 AM)

**15-MINUTE PRE-LAUNCH MEETING:**

```
Attendees: You, Backend Agent, Frontend Agent, DevOps Lead
Duration: 15 min
Location: Zoom + shared screen

AGENDA:

1. SYSTEM STATUS (2 min)
   DevOps: "All green lights? Any overnight issues?"
   → Decision: GO or PAUSE?

2. CUSTOMER STATUS (2 min)
   You: "All schools trained? All logins tested?"
   → Decision: Ready for all 10?

3. SUPPORT STANCE (2 min)
   Review: "Support team available? Messaging sent?"
   → Decision: 24/7 mode activated?

4. SUCCESS CRITERIA (2 min)
   "We're aiming for: 9.2+ NPS, <5 critical issues, 100% uptime"
   → Any concerns?

5. GO DECISION (1 min)
   Lead Architect / You: "Are we launching?"
   → YES = Activate 9 AM go-live

DECISION: GO ✓ / PAUSE ✗ / INVESTIGATE MORE

If GO: Each team member posts in Slack: "System ready - let's go!"

If PAUSE: Escalate to architect immediately. No launch until fixed.
```

---

### FRIDAY 9:00 AM - 6:00 PM: SUPPORT TIMELINE

```
═══════════════════════════════════════════════════════════════

9:00 AM - LAUNCH LIVE

You: Send email to all 10 schools (template below)
DevOps: Monitor dashboards (refresh every 10 min)
Backend: Monitor API logs (ready to debug)
Frontend: Monitor app logs (ready to debug)

EMAIL TO SCHOOLS:
```
TO: [All 10 principals]
SUBJECT: 🎉 We're LIVE! Welcome to [Platform]

Hi [School Name] Leadership,

We're thrilled to announce: Your system is now LIVE!

✓ All teachers can log in
✓ All admins have access
✓ All parents can see portals

WHAT TO EXPECT:
- You'll see live attendance, grades, parent updates
- Teachers should start using the system now
- First feedback will shape our improvements

NEED HELP?
- Call: [Your phone]
- Email: [Your email]
- Response time: <5 min for urgent issues

THANK YOU for being our launch partners!

[Your Name]
Platform Team
```

═══════════════════════════════════════════════════════════════

9:05 AM - 10:00 AM INTENSIVE MONITORING

You: 
- Refresh NPS sheet every 10 min (in case early responses)
- Monitor Slack #day1-support for any issues
- Call DevOps if you see ANY concerning trends

DevOps:
- Monitoring: API latency chart
  - Green: <200ms (excellent)
  - Yellow: 200-400ms (monitor, not urgent)
  - Red: >400ms (escalate now)
- Monitoring: Error rate
  - Green: <0.1%
  - Yellow: 0.1-1%
  - Red: >1% (investigate)
- Monitoring: SMS delivery
  - Green: >95%
  - Yellow: 85-95%
  - Red: <85% (escalate)

If ANY red: Call DevOps. Investigate. Prepare rollback if needed.

═══════════════════════════════════════════════════════════════

10:00 AM - 2:00 PM ACTIVE SUPPORT

Your job: Proactively call 3-5 schools (random selection)

"Hi [Principal], quick check-in. How's Day 1 going?"

[Listen to their experience]

"Anything not working? Anything confusing?"

[Record any issues in escalation sheet]

Why: Catch problems before they complain. Show you care.

═══════════════════════════════════════════════════════════════

2:00 PM - 5:00 PM STEADY STATE

Most issues resolved by now. Operate in "responsive mode."

You: Ready to respond to calls/emails within 5 min
DevOps: Continue monitoring (every 15 min)
Team: Available for escalations

Expected: 0-2 calls during this window (system is stable)

═══════════════════════════════════════════════════════════════

5:00 PM - 6:00 PM NPS WINDOW

5:00 PM: Send NPS survey to all 10 schools

EMAIL:
```
SUBJECT: Quick question - how's Day 1 going?

Hi [Principal],

Your system has been live for 8 hours!

I'd love your honest feedback:
→ [NPS survey link personalized for them]

Takes 3 minutes. Helps us improve.

All feedback appreciated - good or critical.

Thanks!

[Your Name]
```

5:15 PM onwards: NPS responses start coming in
- Update dashboard every 15 min
- Respond to any detractors within 30 min
- Promoters: Send thank-you + testimonial request

6:00 PM: Transition to "night support"
- Phone on silent (20 min check-in queue)
- Email: Check every 30 min
- For emergencies: Have backup contacts handle

═══════════════════════════════════════════════════════════════

AFTER 6:00 PM (Evening):

Call DevOps: "Final status? All systems nominal?"

Create summary report for tomorrow morning:
- Schools live: __/10
- Critical issues: __
- NPS responses: __
- Average score: __/10
- Status: GO / STABLE / INVESTIGATING

Share in Slack #day1-support with the team.

Celebrate (quietly) if you hit targets. Sleep! You earned it.

═══════════════════════════════════════════════════════════════
```

---

## ✅ SUCCESS DEFINITION (Friday EOD)

**HARD TARGETS:**

- [ ] All 10 schools deployed successfully (user logins working)
- [ ] 100% uptime (0 critical system outages >30 min)
- [ ] <5 critical bugs (all resolved same-day)
- [ ] 9.2+/10 average NPS within 6 hours
- [ ] <1 detractor (score ≤ 6)
- [ ] 0% churn (all 10 schools retained)
- [ ] All support calls answered <5 min

**SOFT TARGETS:**

- [ ] 3+ promoters asked for testimonials
- [ ] 2+ referral introductions promised
- [ ] Teachers using system by 5 PM (adoption signal)
- [ ] Parents logging in by 5 PM (engagement signal)
- [ ] No data loss (all student data intact)

**FINANCIAL:**

- [ ] ₹30L+ revenue locked (all contracts signed)
- [ ] ₹6.5L+ deposits received (25%)
- [ ] ₹19.5L+ outstanding (75% due next week/EOD Fri)
- [ ] Revenue recognized in accounting system

---

## 📊 STATUS REPORT TEMPLATE (Submit Friday EOD)

```
PRODUCT AGENT - WEEK 5 LAUNCH STATUS REPORT

Date: Friday, April 12, 2026, 6:30 PM
Submitted by: [Your Name]

═══════════════════════════════════════════════════════════════

LAUNCH RESULTS

Schools Live: __/10
  - Fully operational: __
  - Minor issues: __
  - Critical issues: __
  - Pending: __

System Performance:
  - Uptime: __% (Target: 100%)
  - Avg API latency: __ms (Target: <200ms)
  - SMS delivery rate: __% (Target: >95%)
  - Error rate: __% (Target: <1%)

═══════════════════════════════════════════════════════════════

NPS RESULTS

Responses Received: __/10
Average NPS Score: __/10 (Target: 9.2+)

Promoters (9-10): __ (Goal: 7+)
Passive (7-8): __ (Goal: 2-3)
Detractors (1-6): __ (Goal: 0)

Key Themes:
- Positive: [Top 3 praise points]
- Concerns: [Top 3 issues raised]

═══════════════════════════════════════════════════════════════

REVENUE RESULTS

Schools Signed & Paid:
- 25% deposits collected: ₹ __L (Target: ₹6.5L)
- 75% pending collection: ₹ __L (Target: ₹19.5L)
- Total locked: ₹ __L (Target: ₹26L+)

Status: ON TARGET / AT RISK / EXCEEDED

═══════════════════════════════════════════════════════════════

SUPPORT METRICS

Support Calls Received: __
- Response time: Avg __ min (Target <5 min)
- First-call resolution: __% (Target: >80%)
- Critical issues: __ (all resolved: YES/NO)

Customer Satisfaction: __/10 (from calls)

═══════════════════════════════════════════════════════════════

CRITICAL INCIDENTS (If Any)

| Issue | What Happened | Resolution | Time Taken | Impact |
|-------|---------------|-----------|-----------|--------|
| [If issue 1] | | | | |

═══════════════════════════════════════════════════════════════

NEXT ACTIONS

Weekend:
- [ ] Respond to all NPS feedback (personal calls to detractors)
- [ ] Extract + edit 3 testimonial videos
- [ ] Follow up with detractors (Saturday morning calls)

Week 1 (Mon-Fri):
- [ ] Daily 15-min check-in calls with each school
- [ ] Technical training follow-ups (as needed)
- [ ] Weekly business review prep
- [ ] Upsell opportunities identified

═══════════════════════════════════════════════════════════════

LESSONS LEARNED

What went great:
1. [Top success]
2. [Top success]

What to improve next time:
1. [Lesson 1]
2. [Lesson 2]

═══════════════════════════════════════════════════════════════

OUTLOOK

Week 5 result: ✓ ACHIEVED / ⚠ ON TRACK / ✗ MISSED

Revenue: [Path to ₹30L+]
NPS: [Path to 9.2+]
Team health: [Status]
Customer happiness: [Status]

Ready for Week 6? [YES / NEEDS SUPPORT]
```

---

**FINAL CHECKLIST:**
- [ ] NPS survey created + 10 links ready
- [ ] Response sheet set up (auto-populated from Form)
- [ ] Dashboard template ready (refresh Friday 5 PM)
- [ ] Escalation protocols documented
- [ ] Critical issue scripts printed
- [ ] Support contact list finalized
- [ ] DevOps pre-flight checklist shared
- [ ] Go-live decision criteria documented
- [ ] NPS target: 9.2+/10 confirmed
- [ ] Launch message drafted + approved

**Ready for Friday Launch:** YES ✓
