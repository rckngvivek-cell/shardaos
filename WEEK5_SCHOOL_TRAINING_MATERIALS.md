# WEEK 5 - SCHOOL TRAINING MATERIALS

**Owner:** Product Agent (Can be co-run with Backend/Frontend/QA support)  
**Duration:** 2 hours per school (Thursday)  
**Goal:** Enable school staff to operate independently by Friday go-live  

---

## 🎯 TRAINING OVERVIEW

### Goals (Per School)
- [ ] All admin staff can log in and navigate dashboard
- [ ] Teachers can mark attendance and enter grades
- [ ] Parents can view child's performance in mobile app
- [ ] Zero critical blockers before Friday go-live
- [ ] Confidence that system is easy to use

### Attendees (Per School)
- 🎓 **Admin (Mandatory):** 1 principal OR school coordinator
- 👨‍🏫 **Teachers (2-3):** Sample from different grades/departments
- 👨‍👩‍👧 **Parents (2-3):** Representative sample (mixed tech comfort)

### Format
- **Live Zoom call** (you screen-share walking through product)
- **Q&A:** Time for questions during walkthrough
- **Hands-on:** They log in to test account and try each feature
- **Promise:** Weekly support calls for first 4 weeks

---

## ⏱️ TRAINING SCHEDULE (2 Hours Per School)

### Block 1: Technical Setup (30 min)
**Presenter:** You + Backend support  
**Attendees:** School admin only

```
9:00-9:10 AM | Intro + Agenda (10 min)
9:10-9:20 AM | User account creation (5 min)
9:20-9:30 AM | Sample data import (10 min)
             | Buffer for technical questions
```

**What Happens:**
1. You create 5 test user accounts:
   - Admin user (principal/coordinator)
   - 2 teacher users (for demo)
   - 2 parent users (for demo)
2. Import 50-100 sample students (5 min)
3. Test SMS gateway (confirm SMS preview working)
4. Activate parent app for testing

### Block 2: Admin Training (30 min)
**Presenter:** You  
**Attendees:** School admin

```
9:30-9:40 AM | Dashboard walkthrough (10 min)
9:40-9:50 AM | User management (10 min)
9:50-10:00 AM| Report generation (10 min)
```

**Key Topics:**

**Dashboard Overview (5 min)**
- Login screen (email + password)
- Home dashboard (KPIs: student count, attendance %, grades avg)
- Left sidebar navigation (Students, Teachers, Reports, Settings)
- What each card shows (active users, upcoming exams, fee pending)

**User Management (10 min)**
- Add new teacher (bulk CSV upload vs. manual)
- Add new parent (SMS OTP login flow)
- Role-based access (admin, teacher, parent, student)
- Password reset flow
- Activity logs (who did what, when)

**Report Generation (10 min)**
- Pre-built reports (Attendance, Grades, Fee Collection)
- Filter by date range, class, subject
- Export formats (PDF, Excel, CSV)
- Schedule report emails (daily, weekly, monthly)
- Demo: Generate attendance report for one class

**Admin Task List (Handout):**
```
Week 1 (Go-Live):
☐ Log in to dashboard (test access)
☐ Create 30-50 test users (teachers, parents)
☐ Import first 100 students (CSV template provided)
☐ Verify parent app downloads mobile app
☐ Review attendance report

Week 2 (Expansion):
☐ Import remaining 500+ students (bulk CSV)
☐ Configure SMS notifications (Twilio API keys)
☐ Set up auto-reports (email to leadership)
☐ Add custom users (new teachers joining)
```

### Block 3: Teacher Training (30 min)
**Presenter:** You + 1 teacher co-present  
**Attendees:** 2-3 sample teachers from school

```
10:00-10:10 AM | Login + dashboard (5 min)
10:10-10:20 AM | Marking attendance (10 min)
10:20-10:30 AM | Entering grades (10 min)
10:30-10:40 AM | Sending parent messages (5 min)
               | Q&A (5 min)
```

**Key Topics:**

**Login & Dashboard (5 min)**
- Email + password login
- My Classes view (list of assigned classes)
- Today's schedule (class times + students expected)
- Quick actions (Mark Attendance, Enter Grades, Message Parents)

**Marking Attendance (10 min)**
- Select class + date
- Two modes:
  - **Calendar View**: Click each day to mark present/absent
  - **Roster View**: Checkbox for each student
- Bulk actions: Mark all present, Clear all, See exceptions
- Submit and confirm (can edit within 24 hours)
- View: Attendance report (per student %)
- Demo: Mark attendance for 1 class, show the report

**Entering Grades (10 min)**
- Select class + subject + exam type
- Enter marks (0-100 scale, with auto-calculate total)
- Batch upload option (Excel template sent Day 4)
- Publish grades (one-click to notify parents via SMS)
- View: Grade book (class view + student view)
- Demo: Enter sample grades, publish, show parent notification

**Sending Parent Messages (5 min)**
- Send message to one parent (for specific student)
- Send bulk message (to all parents of your class)
- Template library (attendance update, grades available, event reminder)
- Delivery tracking (sent, read, delivered)
- Demo: Send sample message to test parent

**Teacher Task List (Handout):**
```
Week 1 (Daily):
☐ Mark attendance (10 min each class)
☐ Review messages from parents
☐ Enter weekend grades (if applicable)
☐ Check assignment submissions (coming soon)

Week 2+ (Weekly):
☐ Enter term grades (Friday afternoon)
☐ Send bulk messages (Monday + after exams)
☐ Review student performance trends
☐ Respond to parent messages
```

### Block 4: Parent Training (30 min)
**Presenter:** You (can have parent + you co-present)  
**Attendees:** 2-3 sample parents from school

```
10:40-10:50 AM | Installation + login (5 min)
10:50-11:00 AM | Child profile + dashboard (10 min)
11:00-11:10 AM | Viewing grades + attendance (10 min)
11:10-11:20 AM | Messaging teacher (5 min)
               | Q&A (5 min)
```

**Key Topics:**

**Installation + Login (5 min)**
- Mobile app download (iOS App Store, Android Google Play)
- First login: Email + OTP (comes via SMS)
- Biometric login setup (optional, but recommended)
- Demo: Install app, show login screen

**Child Profile + Dashboard (10 min)**
- Select child (if multiple kids in family)
- Dashboard view:
  - Child name + photo + grade
  - Attendance % (green if >75%, red if <75%)
  - Grades summary (subjects + recent marks)
  - Recent announcements
  - Upcoming events
- Customization: Pin favorites, set notification preferences
- Demo: Select a child, show full dashboard

**Viewing Grades + Attendance (10 min)**
- Grades tab:
  - All subjects listed
  - Recent exam marks
  - Term performance
  - Compare to class average (optional)
- Attendance tab:
  - Calendar view (green = present, red = absent)
  - Monthly summary
  - Trend chart (is attendance improving?)
- Download options: Print grades, share with grandparents
- Demo: Show sample child's grades + attendance

**Messaging Teacher (5 min)**
- Messages tab (thread-based)
- Start new message (search teacher by name)
- Templates (quick questions like "When is next exam?")
- Notifications (enabled by default)
- Response time expectation: Teachers respond within 24h
- Demo: Send sample message to test teacher

**Parent Task List (Handout):**
```
Week 1 (Setup):
☐ Download app to phone
☐ Add child's profile (if not auto-linked)
☐ Set notification preferences
☐ Enable biometric login
☐ Review first week grades

Week 2+ (Regular):
☐ Check child's attendance weekly
☐ Review grades within 24h of posting
☐ Message teacher about concerns
☐ Attend parent-teacher conferences (via video soon)
```

---

## 📱 PARENT APP WALKTHROUGH (Visual Guide)

### Screen 1: Login
```
┌─────────────────────┐
│    DeerFlow         │
│   Parent Portal     │
│                     │
│ ┌─────────────────┐ │
│ │ Email           │ │
│ │ parent@email... │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ [Get OTP]       │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ OTP (6 digits)  │ │
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ [Sign In]       │ │
│ └─────────────────┘ │
└─────────────────────┘
```

### Screen 2: Dashboard
```
┌─────────────────────┐
│ ☰  DeerFlow    👤  │
├─────────────────────┤
│                     │
│ Aarush Kumar        │
│ Grade 8-A • 14 yrs  │
│                     │
│ ┌───────────────────┐
│ │ Attendance: 85%   │
│ │ ▓▓▓▓▓▓░░░░        │
│ │ Target: 75%  ✓    │
│ └───────────────────┘
│                     │
│ ┌───────────────────┐
│ │ Recent Grades:    │
│ │ Math   88/100     │
│ │ Hindi  90/100     │
│ │ Science 92/100    │
│ └───────────────────┘
│                     │
│ ┌───────────────────┐
│ │ 📢 Announcements  │
│ │ Parent-Teacher Mee│
│ │ on April 20       │
│ └───────────────────┘
│                     │
├─────────────────────┤
│ 📚 Grades  📅 Attend│
│ 💬 Message  ⚙ Acct │
└─────────────────────┘
```

### Screen 3: Grades Detail
```
┌─────────────────────┐
│ ◀ Aarush - Grades   │
├─────────────────────┤
│ Subjects:           │
│                     │
│ Mathematics     [>] │
│ Last: 88/100        │
│ Avg: 85/100         │
│                     │
│ Hindi           [>] │
│ Last: 90/100        │
│ Avg: 87/100         │
│                     │
│ Science         [>] │
│ Last: 92/100        │
│ Avg: 89/100         │
│                     │
│ English         [>] │
│ Last: 86/100        │
│ Avg: 84/100         │
│                     │
│ Class Average: 86   │
│ Aarush Rank: 3/40   │
└─────────────────────┘
```

### Screen 4: Attendance Detail
```
┌─────────────────────┐
│ ◀ Aarush - Attend   │
├─────────────────────┤
│ April 2026          │
│ M T W T F S S       │
│ ● ● ● ○ ● ● ●      │
│ ● ● ● ● ● ○ ●      │
│ ● ● ● ● ● ● ●      │
│                     │
│ Attendance: 34/40   │
│ Percentage: 85%     │
│ Target: 75%  ✓      │
│                     │
│ Absent Days:        │
│ • April 12 (Friday) │
│ • April 19 (Friday) │
│                     │
│ [Download PDF]      │
│ [Share with...]     │
└─────────────────────┘
```

### Screen 5: Messages
```
┌─────────────────────┐
│ ☰  Messages    [+]  │
├─────────────────────┤
│ Conversations:      │
│                     │
│ Ms. Priya (Math)    │
│ "Can Aarush join... │
│ Today 2:45 PM   [>] │
│                     │
│ Mr. Rahul (Science) │
│ "Great exam score!  │
│ Yesterday [>]       │
│                     │
│ Mrs. Anjali (Hindi) │
│ "Can we discuss...  │
│ Apr 12       [>]    │
│                     │
│ [Empty message box]─┤
│ [Type message...] [>│
└─────────────────────┘
```

---

## 📝 TRAINING HANDOUTS (Print for Each School)

### Handout 1: Quick Start Guide (Admin)

**DeerFlow - Administrator Quick Start**

**LOGIN:**
- Email: [admin email]
- Password: [temporary password will be reset]
- 2FA: Enable ASAP in Settings

**FIRST TASKS:**
1. View Dashboard (KPIs)
2. Go to Users → Add Teachers (use CSV template)
3. Go to Students → Import (use CSV template)
4. Go to Settings → Configure School Info
5. Enable SMS notifications

**DAILY TASKS:**
- Check Dashboard (Is system running?)
- Review Support Tickets (Any issues?)
- Export Reports (Attendance, Grades)

**WHEN YOU NEED HELP:**
- Slack: #support-[school-name]
- Email: support@deerflow.io
- Call: +91-9999-xxx-xxxx (your number)

**SUPPORT HOURS:** 9 AM - 6 PM IST (weekdays)

---

### Handout 2: Quick Start Guide (Teacher)

**DeerFlow - Teacher Quick Start**

**LOGIN:**
- Email: [teacher email]
- Password: [temporary, change on first login]

**MARK ATTENDANCE:**
1. Click "Mark Attendance"
2. Select Class + Date
3. Click each student (✓ present, ✗ absent)
4. Click "Submit"
Done! Parents notified instantly.

**ENTER GRADES:**
1. Click "Enter Grades"
2. Select Subject + Exam
3. Enter marks (out of 100)
4. Click "Publish"
Parents see grades in app immediately.

**SEND MESSAGES:**
1. Click "Messages"
2. Search parent by name or class
3. Type message (or use template)
4. Send
Parents reply within 24 hours.

**MY DASHBOARD:**
- Classes: Your assigned classes
- Today: Today's schedule
- Students: View all students data

---

### Handout 3: Quick Start Guide (Parent)

**DeerFlow - Parent Quick Start**

**GET STARTED:**
1. Download app: [iOS link] / [Android link]
2. Register: Email + OTP (SMS sent)
3. Your child's profile auto-linked
4. Enable biometric login (optional)

**CHECK GRADES:**
1. Open app → Grades tab
2. Select subject
3. See latest marks + class average
4. Download/share if needed

**CHECK ATTENDANCE:**
1. Open app → Attendance tab
2. See calendar of present ✓ / absent ✗
3. View percentage vs. target
4. Talk to teacher if below 75%

**MESSAGE TEACHER:**
1. Open app → Messages tab
2. Click [+] New Message
3. Select teacher
4. Type concern/question
5. Teacher replies within 24h

**NOTIFICATIONS:**
- Grade posted → You get SMS + app alert
- Attendance low → Alert if <75%
- Event reminder → Appears in app

**NEED HELP?**
- In-app: Tap help (?) icon
- Email: support@deerflow.io
- Call: School office (they'll escalate)

---

### Handout 4: Common Questions & Answers

**ADMIN FAQs**

Q: Can I upload students in bulk?
A: Yes! Use the CSV template (Students → Import). Upload 500+ students in 2 minutes.

Q: What if a teacher mis-enters grades?
A: You can edit/undo marks within 24 hours (Admin → Edit Grades). After 24h, marks are locked for audit.

Q: How do I reset a user's password?
A: Users → [Select User] → Reset Password. They get SMS link to set new password.

Q: Can I see all attendance/grades reports?
A: Yes! Reports → Select type (Attendance/Grades) → Filter by date/class → Download PDF.

Q: What happens to data if I cancel subscription?
A: Data backed up for 30 days. You can download before cancellation.

---

**TEACHER FAQs**

Q: If I mark attendance wrong, can I fix it?
A: Yes, within 24 hours of marking. Click Edit on the date. After 24h, contact admin.

Q: Do parents see grades immediately?
A: Yes! When you "Publish" grades, parents get SMS + app notification immediately.

Q: What if a student is absent sick?
A: Mark as absent. School admin can add "Sick Leave" note. Note shows on parent app as excused.

Q: Can I see individual student performance?
A: Yes! Click student name → Performance tab. See all marks, attendance %, trends.

---

**PARENT FAQs**

Q: Why can't I see my child's grades yet?
A: Teacher hasn't entered/published grades yet. Contact teacher via Messages tab.

Q: How do I know if my child is falling behind?
A: Check Grades → Compare with class average (see bottom of report). Below average = needs help.

Q: What does "Attendance 85%" mean?
A: Your child was present in 85 out of 100 days. School target is usually 75%. If below target, contact teacher.

Q: How do I message the teacher?
A: Tap Messages tab → [+] New → Select teacher → Type question. Teachers reply within 24 hours.

Q: Is my child's data secure?
A: Yes! Encrypted in transit + at rest. Login uses OTP (more secure than password). Only teacher/parent can see specific child.

---

## 🎤 LIVE DEMO SCRIPTS

### Script 1: Admin Dashboard Demo (5 min)

```
"Let me walk you through the admin dashboard. 

[Screen share]

Here's the home screen. You can see 4 key metrics:
1. Students: 1,200 active students
2. Attendance: 84% average (school-wide)
3. Upcoming Exams: 3 exams this month
4. Fees Pending: ₹5 lakhs pending collection

Below, you see quick actions: Add Users, Import Students, View Reports.

[Click Students menu]

Here's the Students list. Search, filter by class, export to Excel. When you import from CSV, system automatically detects duplicates.

[Click Reports menu]

And here are the reports. You can generate Attendance, Grades, Fee reports for any date range. Download as PDF or Excel. Email automatically sends Monday mornings.

Any questions so far?"
```

### Script 2: Teacher Attendance Demo (5 min)

```
"Now let me show teachers how to mark attendance.

[Screen share]

Click 'Mark Attendance'. Select your class and date. 

[Select Class 8-A, today's date]

You'll see all 40 students. Two ways to mark:
1. Click each student (green checkmark = present, red X = absent)
2. Or use Bulk Actions (Mark all present, then uncheck absentees)

[Demonstrate clicking 3-4 students]

You can see a few are marked. If someone's missing, type ID or name and add them.

[Show Submit button]

Click Submit. System sends SMS to parents immediately: 'Aarush marked present today.'

[Show SMS preview]

If you need to edit later (within 24 hours), click Edit. After 24 hours, it's locked for audit.

Let me show you the Attendance Report too. [Navigate to Reports]

Here's the class attendance summary. You see who's often absent & might need a chat.

Questions?"
```

### Script 3: Parent App Demo (5 min)

```
"Parents, let me show you the app on your phone.

[Screen share mobile app]

First, download from App Store or Google Play - search 'DeerFlow Parent'.

On first login, enter your email. You'll get an OTP via SMS - type those 6 digits.

[Show login flow]

Your child's profile auto-appears. You'll see:
- Attendance: 85% (green means above target)
- Grades: Recent subjects & marks
- Announcements: Upcoming events

[Navigate to Grades tab]

Tap Grades to see all subjects with latest marks. You can see your child scored 88 in Math, class average is 82. That's great!

[Navigate to Attendance tab]

Attendance tab shows a calendar. Green days = present, red = absent. 3 absences this month. If attendance drops below 75%, you get an alert.

[Navigate to Messages tab]

Messages tab - message the teacher anytime. Say 'Aarush seems stressed' or 'When's the next exam?' Teacher responds within 24 hours.

[Navigate back to Dashboard]

You get notifications here & SMS when grades are posted, attendance is low, or events coming up.

Make sense? Any questions?"
```

---

## ✅ GO-LIVE CHECKLIST (Provide to Each School)

```
DeerFlow GO-LIVE CHECKLIST
School: ___________________
Date: ____________________
Admin: ____________________

🔐 ACCESS & LOGIN
☐ Admin can log in (email + password)
☐ 2-factor authentication enabled
☐ Teachers received temporary login (via SMS)
☐ Parents received temporary login (via SMS)

📊 DATA IMPORT
☐ First batch of students imported (100+ records)
☐ No duplicate errors
☐ Teachers linked to classes
☐ Admin verified student names are correct

📱 PARENT APP
☐ 2 parents downloaded iOS or Android app
☐ Parents can log in with OTP
☐ Parents see their child's profile
☐ Parents see sample grades + attendance

📚 TEACHER PORTAL
☐ 2 teachers logged in successfully
☐ Teachers can view their classes
☐ Teachers can mark sample attendance
☐ Teachers understand publish/submission flow

📊 CRITICAL FEATURES TESTED
☐ Attendance marking works (end-to-end)
☐ Grade entry works (end-to-end)
☐ SMS notification delivery confirmed
☐ Parent app shows live data updates
☐ Dashboard shows correct KPIs

❌ NO CRITICAL ISSUES
☐ No bugs preventing attendance
☐ No bugs preventing grade entry
☐ No bugs preventing logins
☐ No data integrity issues
☐ <2 second page load time

🚀 READY FOR GO-LIVE?
☐ School admin confident in operations
☐ 2-3 teachers comfortable with marking
☐ 2-3 parents comfortable with app
☐ Support handoff complete (contact info shared)
☐ Week 1 check-in call scheduled

SIGN-OFF:
Admin Name: _________________ Date: _______
Product Manager: _____________ Date: _______

SUPPORT CONTACT DURING WEEK 1:
Name: [Your name]
Phone: +91-9999-xxx-xxxx
Email: you@deerflow.io
Hours: 9 AM - 11 PM IST (Week 1 intensive support)
```

---

## 📞 FOLLOW-UP SEQUENCE

### Format: Call - Email - Call - Email

**Day 0 (Before Training):**
- [ ] Email: Training agenda + prep materials
- [ ] Call: Confirm attendees, time zone, call link

**Day 1 (Training Day):**
- [ ] Call: 2-hour live training (via Zoom)
- [ ] Collect: Contact info for each attendee

**Day 2 (Post-Training):**
- [ ] Email: Training summary + resource links
- [ ] Include: Handouts, quick-start guides, FAQ

**Day 3-5 (Go-Live Week):**
- [ ] Call: Daily 15-min check-in (same time each day)
- [ ] Slack: Respond to <15 min issues instantly

**Day 6-7 (Post-Launch):**
- [ ] Email: Congratulations + Week 1 summary
- [ ] Include: NPS survey link

**Week 2+:**
- [ ] Call: Weekly business review (Wed 2 PM)
- [ ] Email: Monthly metrics dashboard (1st of month)

---

## 💬 COMMUNICATION TEMPLATES

### Email: Pre-Training Reminder

Subject: Your DeerFlow Training is Tomorrow! [School Name]

Hi [Principal Name],

Excited to onboard [School Name] tomorrow! Here's what to expect:

**Training Details:**
- Date: [Date]
- Time: [Time] IST
- Duration: 2 hours
- Call Link: [Zoom URL]

**Who Should Join:**
- School admin (1 person)
- 2-3 sample teachers
- 2-3 sample parents

**What We'll Cover:**
✓ Technical setup (30 min)
✓ Admin dashboard (30 min)
✓ Teacher workflow (30 min)
✓ Parent app (30 min)

**Before the Call:**
1. Download Zoom (or open in browser)
2. Check your internet connection
3. Gather participant phone numbers (for OTP)

**After the Call:**
You'll be fully ready to go live Friday! We'll handle any issues during week 1.

See you tomorrow!

---

### Email: Day 5 Celebration

Subject: 🎉 Live! Welcome to DeerFlow [School Name]!

Hi [Principal Name],

Congratulations! [School Name] is now live on DeerFlow! 🚀

**What's Active:**
✓ 1,000+ students can log in
✓ Teachers marking attendance
✓ Parents viewing grades in real-time
✓ SMS notifications active

**Week 1 Support:**
I'm your dedicated support contact:
📞 +91-9999-xxx-xxxx (call/WhatsApp)
📧 you@deerflow.io
⏰ 9 AM - 11 PM IST

**Quick Wins to Try:**
1. Check admin dashboard (KPI cards)
2. Review first attendance report
3. Test parent app (encourage 5 parents to download)
4. Send sample SMS (verify delivery)

**Your Week 1 TODO:**
- Bulk import remaining 500+ students by Wednesday
- Get 30% of parents downloading app by Friday
- Log 0 critical issues (we'll fix anything quickly)

**NPS Survey:**
Will send this Friday evening. We want to hear from you! Target: 9.2/10 satisfaction.

Questions? Reach out anytime. We're all in!

Cheers,
[Your Name]

---

**TRAINING MATERIALS READY TO DEPLOY**  
Print these guides for each school attendee. Live demos via Zoom, hands-on testing during call.
