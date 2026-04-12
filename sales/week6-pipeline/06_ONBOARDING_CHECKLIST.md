# ✅ 2-DAY ONBOARDING CHECKLIST (Go-Live Procedure)

**Timeline:** 2 business days (Monday-Tuesday) from contract signing  
**Guarantee:** Live + running by EOD Tuesday  
**Success Rate:** 95%+ (20+ schools deployed)  

---

## 🎯 MISSION

Transform paper + Excel → live, production system in 48 hours  
Target: 1 class live by EOD Day 1, all classes live by EOD Day 2

---

## ⏱️ DAY 1 (MONDAY) - SETUP & MIGRATION

### Phase 1: Pre-Day Setup (Friday EOD, before contract signs)
**Owner:** Backend Agent + DevOps Agent
**Time:** 2 hours

- [ ] Provision Firestore project (school-specific)
- [ ] Create admin accounts (Principal, IT Manager)
- [ ] Configure SMS gateway + mail service
- [ ] Set up CloudSQL backup (daily auto-backup config)
- [ ] Prepare data import templates (Excel sheets for school to fill)
- [ ] Send login credentials + import instructions to school

**Deliverable:** School receives email with:
```
Subject: [School Name] - Login Details + Data Import Instructions

Hi [Principal Name],

Your School ERP is ready! Here's how to get started:

ADMIN CREDENTIALS:
  Email: admin@schoolname.in
  Password: [Temporary, change immediately]
  Access: https://schoolerp.com/[school-slug]

DATA IMPORT INSTRUCTIONS:
  1. Download attached Excel templates:
     - student_import.xlsx (columns: admission_no, name, class, email_parent)
     - teacher_import.xlsx (columns: emp_id, name, subjects, phone)
     - parent_import.xlsx (columns: student_id, parent_name, phone, email)
     
  2. Fill in your data (Google Drive template link also available)
  
  3. Send back to us by Sunday 5 PM for Monday upload
  
DATA MAPPING (We handle automatically):
  - Classes → Format as "Class IX A"
  - Subjects → Standardized list (Math, Science, English, etc.)
  - Phone → Validated + formatted for SMS
  
TIMELINE:
  - Monday 9 AM: Onboarding call (1 hour)
  - Monday 10 AM - 2 PM: Data upload + user creation
  - Monday 2 PM - 5 PM: Admin training + first test
  - Monday 5 PM: 1 pilot class goes live
  
TUESDAY:
  - All classes go live
  - Full UAT (user acceptance testing)
  - Teacher training (2 hours)
  - Parent SMS launch
  
Questions? Reply to this email or call +91-XXXXXX-XXXXX

Looking forward to launching your School ERP!

Best regards,
[Onboarding Specialist Name]
```

**Checkpoint:** School confirms data ready by Sunday 5 PM

---

### Phase 2: DAY 1 MORNING (9:00-10:30 AM IST)

**Owner:** Onboarding Specialist + Backend Agent  
**Duration:** 1.5 hours  
**Attendees:** Principal, IT Manager (admin), maybe Finance Head

#### Pre-call Checklist:
- [ ] Test Firestore connectivity (ensure no firewall issues)
- [ ] Prepare screen-share demo (15-min platform tour)
- [ ] Have sample data imported (for demo walkthrough)
- [ ] Prepare admin training slides (5-page guide)

#### Call Agenda:
```
9:00-9:15 (15 min): Platform overview + admin dashboard
  - "Here's your real-time dashboard"
  - "You'll see students, teachers, classes, attendance"
  - "All data is yours—exportable anytime"
  
9:15-9:30 (15 min): Data mapping verification
  - "Let's confirm your data structure"
  - "How many classes? How many students per class?"
  - "Subject mapping (we auto-standardize)"
  - "Teacher allocation (confirm T:S ratios)"
  
9:30-10:00 (30 min): Admin setup
  - Create Principal account + reset password
  - Create IT Person account (for data uploads)
  - Create Accountant/Finance account (if needed)
  - Assign roles + permissions
  - Show permission model (what each role can see/do)
  
10:00-10:30 (30 min): Data import walkthrough
  - "Here's your uploaded data (if ready)"
  - Show bulk user creation (10 click → 2,000 users created)
  - Show teacher-class mapping
  - "Anything look wrong? We fix now, not later"
```

**Checkpoint:** All 4 admin accounts created + verified working + data mapped

---

### Phase 3: DAY 1 AFTERNOON (11:00 AM - 2:00 PM)

**Owner:** Backend Agent + Onboarding Specialist  
**Duration:** 3 hours  
**Parallel:** School filling out any missing data in Excel sheets

#### Data Batch Upload (Automated):
- [ ] Validate student data (check for duplicates, missing fields)
- [ ] Create 2,000+ student records (batch API call, <30 seconds)
- [ ] Create teacher records (validate email addresses)
- [ ] Assign teachers to classes + subjects
- [ ] Create parent accounts (link to students)
- [ ] Generate one-time parent login links + WhatsApp to parents

**Database state after Phase 3:**
```
Students: ✅ 2,000+ records in Firestore
Teachers: ✅ 150+ accounts created
Parents: ✅ 2,000+ parent accounts generated
Classes: ✅ 50+ class codes auto-generated
Attendance: ✅ Templates ready (0 attendance recorded yet)
```

**Checkpoint:** All master data loaded. Dashboard shows non-zero student count.

---

### Phase 4: DAY 1 LATE AFTERNOON (2:00 PM - 5:00 PM)

**Owner:** Onboarding Specialist + QA Agent  
**Duration:** 3 hours

#### Admin Training (2 hours):
- [ ] Show dashboard (explaining each KPI)
- [ ] Teach admin to generate sample reports
- [ ] Show user management (create new teachers/parents mid-year)
- [ ] Teach SMS sending (manual send for testing)
- [ ] Show backup + data export (admin comfort on data safety)
- [ ] Introduce WhatsApp support group (paste link)

**Training Deliverable:** Admin receives 1 printed manual + 1 PDF guide

#### Pilot Class Go-Live (1 hour):
- [ ] Pick 1 class (e.g., Class IX A - 30 students)
- [ ] 1 teacher enters attendance live (Onboarding Specialist screens)
- [ ] Students log in (on their phones/web) → see their attendance
- [ ] Parents get SMS: "Your child marked present on April 14"
- [ ] Admin checks dashboard → sees attendance reflected
- [ ] Teacher enters 1 test grade → parents see it in portal
- [ ] **Full end-to-end test: Working** ✅

**Checkpoint:** 1 class is live + working. Parents received SMS. Data is flowing.

---

## 📅 DAY 2 (TUESDAY) - FULL LAUNCH & TRAINING

### Phase 5: DAY 2 MORNING (9:00 AM - 12:00 PM)

**Owner:** Onboarding Specialist + QA Agent  
**Duration:** 3 hours

#### Teacher Training (1.5 hours):
**Format:** In-person at school or Zoom (split into 3 groups: 1 hour each)
- [ ] Group 1 (9:00-10:00 AM): Sections A-C teachers
- [ ] Group 2 (10:15-11:15 AM): Sections D-F teachers  
- [ ] Group 3 (11:30 AM-12:30 PM): Staff + Admin

**Training Agenda:**
```
[Each group, 1 hour]:

0-10 min: Platform overview
  - "Everything is simpler now. No more Excel."
  - "Your job: Enter attendance + grades. We do the rest."
  
10-30 min: Attendance entry (hands-on)
  - "Start class. Take attendance (2 clicks per student)."
  - "Click SAVE. Done. Parents notified in 30 seconds."
  - "Demo: I'm entering attendance live. Show me your phones—SMS coming!"
  - [Parents in classroom show their phone receiving SMS]
  - Magical moment → Teachers think "This is awesome!"
  
30-50 min: Grades + assessment
  - "Enter a test score (next class test, enter now for practicing)"
  - "System auto-calculates class average, topper, weakest"
  - "Parents can't see individual grades until you mark 'publish'"
  - "API shows grade distribution → identify struggling students"
  
50-60 min: Q&A + live support
  - "What questions?"
  - Show them WhatsApp group (paste link)
  - "SMS us. We respond within 2 hours. We're here for you."
```

**Checkpoint:** All teachers trained + confident + WhatsApp support active

#### Parent Communication (1.5 hours):
- [ ] Send email + SMS to all parents:
  ```
  Subject: [School Name] - New Parent Portal + Grades Access
  
  Dear Parents,
  
  Great news! [School Name] has launched a modern parent portal.
  
  Starting TODAY (April 15), you can:
  ✅ See your child's daily attendance
  ✅ Check test scores in real-time
  ✅ Get SMS alerts for important events
  ✅ Message teachers directly
  
  HOW TO SIGN IN:
  Email: [parent email]
  Link: https://schoolerp.com/parent/[school-slug]
  First time? Ask your principal for password reset link.
  
  IMPORTANT: This is NOT replacing school calls. We'll still call for emergencies.
  This is just to keep you informed + reduce manual reporting!
  
  Questions? Visit [FAQ Link] or reply to this email.
  
  Best regards,
  [School Name] Management
  ```
- [ ] Validate 50 parent logins (spot-check: password reset working)
- [ ] Send 1 test SMS to parents (verify SMS delivery)

**Checkpoint:** 80%+ parents aware + can access portal

---

### Phase 6: DAY 2 AFTERNOON (1:00 PM - 5:00 PM)

**Owner:** QA Agent + Backend Agent  
**Duration:** 4 hours

#### Full System UAT (User Acceptance Testing):
Team of 5 testers (volunteer teachers + admin):
- [ ] Student attendance entry × 50 students (test data entry performance)
- [ ] Grade entry × 100 grades (test calculation accuracy)
- [ ] Report generation × 5 different report types (verify output)
- [ ] Parent portal login × 30 parents (check data visibility)
- [ ] SMS sending × 500 SMS (verify delivery + billing)
- [ ] Mobile app tests (iOS + Android, 5 devices each)
- [ ] Performance test (load = 500 concurrent users, measure response time)

**UAT Template** (checklist):
```
TEST CASE: Student Attendance Entry
  ✅ Click "Mark Attendance"
  ✅ Select Class IX A (30 students)
  ✅ Mark 28 present, 2 absent
  ✅ Click SUBMIT
  ✅ System shows "Success"
  ✅ Check dashboard → shows 93% attendance
  ✅ Check parent portal → SMS sent to parents
  ✅ PASS/FAIL: PASS ✅

TEST CASE: Grade Entry + Calculation
  ✅ Enter Math test (100 max, 30 students)
  ✅ Grades: 45, 67, 78, 89, 92, (...28 more)
  ✅ System auto-calculates: avg=72.3, max=92, min=45
  ✅ Parents see grades within 30 seconds
  ✅ PASS/FAIL: PASS ✅
```

**UAT Go/No-Go Decision (4:00 PM):**
- If UAT PASS rate ≥ 95%: **GO LIVE** ✅
- If UAT PASS rate < 95%: Fix critical bugs + retest (usually <30 min)

**Checkpoint:** System validated + production-ready

---

### Phase 7: DAY 2 GO-LIVE (4:00 PM - 5:00 PM)

**Owner:** DevOps Agent + Backend Agent  
**Duration:** 1 hour  
**Status Page:** All staff + parents notified

#### Pre-Go-Live Checklist:
- [ ] Firestore backups running (test backup restored successfully)
- [ ] Monitoring alerts configured (CPU, error rate, API latency)
- [ ] On-call team assigned (Friday-Monday 24/7 for emergency support)
- [ ] Incident response runbook ready (if something breaks, step-by-step fix)
- [ ] Parent communication prepared (SMS/email: "System is live!")

#### Go-Live Checklist:
- [ ] 4:00 PM: Stop allowing new data entry in old system (Excel)
- [ ] 4:05 PM: Send SMS to all parents: "Parent portal is live! Log in now"
- [ ] 4:10 PM: Send email to all teachers: "System is live! Enter grades + attendance"
- [ ] 4:15 PM: Onboarding specialist calls principal: "How are you seeing it? Any issues?"
- [ ] 4:30 PM: Monitor first 30 minutes (watch error logs, API latency, Firestore load)
- [ ] 5:00 PM: Go-live complete ✅

**Checkpoint:** All systems live + monitoring active

---

## 🎬 END OF DAY 2 (5:00 PM)

**School Status:**
- ✅ 2,000+ students in system
- ✅ 150+ teachers trained + active
- ✅ 2,000+ parents with portal access
- ✅ Daily attendance active
- ✅ Grade entry working
- ✅ SMS alerts live
- ✅ All classes running (not phased, but fully live)

**Onboarding Team Status:**
- ✅ Handed off to WhatsApp support (24-hour response)
- ✅ Success metrics documented
- ✅ Post-launch check-in scheduled for Day 3 (Wednesday)

---

## 📋 POST-LAUNCH SUPPORT (Week 1)

**Days 3-5 (Wed-Fri):** Follow-up calls
- [ ] Wednesday: "How's it going? Any teacher issues?"
- [ ] Thursday: "Any parent portal questions?"
- [ ] Friday: Generate first week data (show impact)

**Week 1 Metrics Capture:**
- [ ] % attendance entries (should be 90%+ by Friday)
- [ ] % teacher adoption (should be 85%+ by Friday)
- [ ] % parent portal logins (should be 70%+ by Friday)
- [ ] SMS delivery rate (should be 98%+)
- [ ] App downloads (should be 50%+ by Friday)

---

## 🎯 SUCCESS CRITERIA (End of Week 1)

✅ 0 critical bugs (all issues resolved within hours)
✅ 95%+ system uptime
✅ 85%+ teacher adoption
✅ 50%+ parent portal usage
✅ SMS delivery: 98%+
✅ Student satisfaction: Can access grades + attendance
✅ Admin time reduction: Visible by Friday

---

## 📞 ESCALATION CONTACTS

**During Onboarding:**
- **Technical Issues:** Onboarding Specialist ([phone])
- **Data Questions:** Backend Agent ([phone])
- **System Down:** DevOps Agent ([phone])
- **Emergency:** Lead Architect ([phone])

**Post-Launch:**
- **WhatsApp Group:** [Paste link]
- **Email:** support@schoolerp.com
- **Emergency Line:** +91-XXXXX-XXXXX (24/7)

---

## 🏆 RETENTION METRIC

**If school completes 2-day onboarding successfully:**
- Year 1 retention: 95%+ (contracts usually auto-renew)
- Upsell to PRO tier: 60% probability (within 6 months)
- Referral rate: 40% (each school refers 1-2 others)

**Critical:** On-time, high-quality 2-day launch = customer satisfaction → retention → referrals → ₹100L+ lifetime value per school

