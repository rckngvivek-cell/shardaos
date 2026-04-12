# COMPLETE MULTI-LEVEL DASHBOARD ARCHITECTURE
## Founder → School Owner → Staff → Students → Parents
## Enterprise-Grade Role-Based Access Control Sistema

---

# PART 1: SYSTEM ARCHITECTURE OVERVIEW

## Access Control Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│              SCHOOLERP FOUNDER (1 USER)                     │
│  • Super admin dashboard (local-only, metrics for all)      │
│  • Approve new schools                                       │
│  • Manage company operations (pricing, features)            │
│  • View financial dashboards (all schools)                  │
│  • Emergency controls (disable schools, revoke access)      │
└────────────┬──────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────────────
             │
    SCHOOL OWNERS (Per School × Unlimited)
             │
             ├─ Senior School Owner (full school control)
             │   └─── SCHOOL ADMIN (Per School, 1-3 users)
             │        │
             │        ├─ PRINCIPAL (1-2 per school)
             │        │   │ Can: Manage teachers, view analytics
             │        │   │ Cannot: Delete school, change pricing
             │        │   │
             │        │   └─────── TEACHERS (1-100+)
             │        │            │ Can: Mark attendance, enter grades
             │        │            │ Cannot: Manage other teachers
             │        │            │
             │        │            └─ STUDENTS (10-5000)
             │        │                 │ Can: View own grades, submit work
             │        │                 │ Cannot: View other students' data
             │        │                 │
             │        │                 └─ PARENTS (Per student)
             │        │                      Can: View child's data
             │        │                      Cannot: View other children
             │        │
             │        └─ REGISTRAR/ACCOUNTANT (1-2)
             │             Can: Manage student records, invoices
             │             Cannot: Access academic grades
             │
             └─ Other School Admins (no access to School 1 data)
```

---

# PART 2: FOUNDER DASHBOARD (COMPANY CONTROL)

## Access Method: Local-Only (CLI + Localhost)

**Never public internet.** Only founder can access via:
1. `founder-cli` terminal commands
2. `http://localhost:3001` (local web browser on founder's machine)
3. SSH tunnel for remote access (founder's home IP only)

### Dashboard MUI Layout (Ultra-Advanced)

```
┌─────────────────────────────────────────────────────────────┐
│  🏢 SchoolERP Founder Control Center    [Settings] [Logout] │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  KPI OVERVIEW (4-card row, responsive)
│  ┌──────────────┬──────────────┬──────────────┬────────────┐
│  │ Active       │ Total        │ Monthly      │ Pending    │
│  │ Schools      │ Students     │ Revenue      │ School     │
│  │              │              │              │ Approvals  │
│  │ 47           │ 47,250       │ ₹95.3L       │ 2          │
│  │ ↑ +3 mo      │ ↑ +2,100     │ ↑ +15% YoY   │ 1 urgent   │
│  │ ✓ Healthy    │ ✓ Growing    │ ✓ On track   │ ⚠️ Action  │
│  └──────────────┴──────────────┴──────────────┴────────────┘
│
│  NAVIGATION TABS
│  [📊 Dashboard] [🏫 Schools] [💰 Revenue] [🎯 Features] 
│  [🎫 Support] [👥 Users] [⚙️ Settings]
│
│  ─── DASHBOARD TAB (SHOWING) ─────────────────────────────
│
│  Two-Column Layout (Desktop) / Stacked (Mobile)
│
│  LEFT COLUMN:
│
│  📈 Monthly Revenue Trend (12 months)
│  ╔════════════════════════════════════════════════════════╗
│  │ ₹100L │                                    ✓           │
│  │ ₹80L  │                           ✓  ✓                │
│  │ ₹60L  │                    ✓   ✓                       │
│  │ ₹40L  │             ✓  ✓                              │
│  │ ₹20L  │      ✓                                         │
│  │   0   └─────────────────────────── Month              │
│  │  Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep  Oct  Nov │
│  ╚════════════════════════════════════════════════════════╝
│  Insight: Revenue growing 8-12% month-over-month ✓
│
│  📊 School Distribution (Bar chart)
│  Free tier:  15 schools  ████░░░░░░░░░░
│  Basic:      22 schools  ██████░░░░░░░░░
│  Premium:    10 schools  ███░░░░░░░░░░░░
│
│  ⚠️  System Alerts
│  ├─ Churn Rate: 2.3% (Target: <2%) ⚠️  Above target
│  ├─ API Latency: 180ms (Target: <200ms) ✓ OK
│  ├─ Downtime: 0h this month ✓ Excellent
│  └─ Support Response: 4.2h avg (Target: <4h) ⚠️ Slight delay
│
│  RIGHT COLUMN:
│
│  🏫 Top 10 Schools by Revenue
│  ┌─────┬────────────────┬──────────┬──────────────┐
│  │ #   │ School Name    │ City     │ Monthly Rev. │
│  ├─────┼────────────────┼──────────┼──────────────┤
│  │ 1   │ DPS Mumbai     │ Mumbai   │ ₹4.9L        │
│  │ 2   │ Campion Delhi  │ Delhi    │ ₹3.8L        │
│  │ 3   │ Cathedral Blr  │ Blr      │ ₹3.3L        │
│  │ 4   │ Delhi Public   │ Delhi    │ ₹2.8L        │
│  │ 5   │ MES Pune       │ Pune     │ ₹2.5L        │
│  │ ...  │ ...            │ ...      │ ...          │
│  │ 10  │ Vidya Niketan  │ Hyd      │ ₹1.2L        │
│  └─────┴────────────────┴──────────┴──────────────┘
│  [Click to view details] [Drill down by teacher/student]
│
│  ─── SCHOOLS TAB ─────────────────────────────────────────
│
│  Actions Bar
│  [+ Approve New School] [Bulk Upgrade] [Export CSV] 
│  [Messaging] [Analytics]
│
│  Filter Bar
│  [Status: All ▼] [Tier: All ▼] [City: All ▼] [Search: ___]
│
│  Interactive School Table
│  ┌──────┬──────────────────┬────────┬──────────┬───────────┐
│  │ ID   │ School Name      │ City   │ Tier     │ Students  │
│  ├──────┼──────────────────┼────────┼──────────┼───────────┤
│  │ S1   │ DPS Mumbai       │ Mumbai │ Premium  │ 2,450     │
│  │ S2   │ Campion Delhi    │ Delhi  │ Premium  │ 1,890     │
│  │ S3   │ Cathedral Blr    │ Blr    │ Basic    │ 1,650     │
│  │ ...                                                     │
│  └──────┴──────────────────┴────────┴──────────┴───────────┘
│
│  Table Features:
│  • Click row → Expand inline panel (detail view)
│  • Swipe right → Action buttons (Edit, Upgrade, Disable, Delete)
│  • Sort by: Name, City, Tier, Students, Revenue
│  • Pagination: 10/25/50 per page
│
│  School Detail Panel (Inline expansion):
│    Name: DPS Mumbai
│    Owner: Rajesh Kumar (rajesh@dps.edu.in)
│    Tier: Premium (₹80K/month)
│    Students: 2,450
│    Active Teachers: 89
│    Monthly Revenue: ₹4.9L
│    Join Date: 15 Jan 2026
│    Status: ✓ Active
│    Last Activity: Today 2:15 PM
│    
│    [Edit Details] [Upgrade Tier] [View Analytics] [Suspend] [Delete]
│
│  ─── REVENUE TAB ──────────────────────────────────────────
│
│  Revenue Summary
│  This Month: ₹95.3L (98.5% collected)
│  This Year: ₹420L (projected)
│  Unpaid Invoices: ₹2.1L (2.2%)
│
│  Sub-tabs: [Monthly Report] [Annual Projection] [Collections]
│             [Invoices] [Refunds] [Churn Analysis]
│
│  Monthly Revenue Table
│  ┌─────────┬────────────┬──────────┬──────────┬──────────┐
│  │ Month   │ Invoice    │ Paid     │ Unpaid   │ Trend    │
│  ├─────────┼────────────┼──────────┼──────────┼──────────┤
│  │ Jan 26  │ ₹42.6L     │ ₹42.2L   │ ₹400K    │ Baseline │
│  │ Feb 26  │ ₹58.3L     │ ₹57.8L   │ ₹500K    │ ↑ +37%   │
│  │ Mar 26  │ ₹75.2L     │ ₹74.5L   │ ₹700K    │ ↑ +29%   │
│  │ Apr 26  │ ₹95.3L     │ ₹94.1L   │ ₹2.1L    │ ↑ +27%   │
│  └─────────┴────────────┴──────────┴──────────┴──────────┘
│
│  ─── FEATURES TAB ────────────────────────────────────────
│
│  Global Feature Flags (Enable/Disable for all schools)
│
│  Feature              │ Status    │ Rollout % │ Beta Schools
│  ─────────────────────┼───────────┼───────────┼──────────────
│  Exam Module          │ Enabled   │ 100%      │ All schools
│  Analytics Dashboard  │ Enabled   │ 85%       │ 40 schools
│  Mobile App (iOS)     │ Beta      │ 30%       │ 15 schools
│  AI Grading Helper    │ Coming    │ 0%        │ Not available
│  SMS Notifications    │ Enabled   │ 100%      │ All schools
│
│  [Edit Feature] [Release Notes] [Beta Testers] [Rollback]
│
│  ─── SUPPORT TAB ─────────────────────────────────────────
│
│  Open Tickets: 7 (1 Critical, 3 High, 3 Medium)
│
│  [All Tickets] [By Priority] [By School] [By Category]
│
│  Ticket Queue
│  ┌────┬──────────┬──────────┬─────────┬───────────┬──────────┐
│  │ ID │ School   │ Issue    │ Priority│ Opened    │ Status   │
│  ├────┼──────────┼──────────┼─────────┼───────────┼──────────┤
│  │ T1 │ DPS Delhi│ Login    │ Critical│ Today 11am│ Assigned │
│  │ T2 │ Campion  │ Report   │ High    │ Today 9am │ In prog  │
│  │ T3 │ Cathedral│ Fee bug  │ High    │ Yesterday │ In prog  │
│  │ ...                                                      │
│  └────┴──────────┴──────────┴─────────┴───────────┴──────────┘
│
│  [Resolve] [Assign to team] [Escalate] [Send update]
│
│  ─── USERS TAB ───────────────────────────────────────────
│
│  Create New Founder Admin
│  [+ New User] [Invite via email]
│
│  Global Users (Founder & School Admins)
│  ┌──────┬──────────────┬─────────────┬──────────┐
│  │ ID   │ Name         │ Email       │ Role     │
│  ├──────┼──────────────┼─────────────┼──────────┤
│  │ U1   │ Rajesh Kumar │ rajesh@...  │ Admin    │
│  │ U2   │ Priya Sharma │ priya@...   │ Admin    │
│  │ ...                                         │
│  └──────┴──────────────┴─────────────┴──────────┘
│
│  ─── SETTINGS TAB ────────────────────────────────────────
│
│  Global Settings
│  • Pricing Tiers (update costs, terms)
│  • Branding (logo, colors)
│  • Email Templates (notifications, invoices)
│  • Integrations (SMS, Payment gateway)
│  • Compliance (GDPR, data retention)
│
│  BOTTOM NAVIGATION (Mobile)
│  [📊 Dashboard] [🏫 Schools] [💰 Revenue] [🎯 Features] [⚙️ More]
│
└─────────────────────────────────────────────────────────────┘
```

---

# PART 3: SCHOOL OWNER DASHBOARD

## School Owner: Full School Control (Web + 2FA)

**Access:** https://app.schoolerp.in/owner (requires 2-factor authentication)

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  DPS Mumbai Dashboard         [Profile] [Settings] [Logout]  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SCHOOL BANNER
│  School: DPS Mumbai  |  Owner: Rajesh Kumar  |  Tier: Premium
│
│  KPI CARDS (School-level)
│  ┌──────────────┬──────────────┬──────────────┬────────────┐
│  │ Total        │ Active       │ Monthly      │ Fee        │
│  │ Students     │ Teachers     │ Collection % │ Pending    │
│  │ 2,450        │ 89           │ 98.5%        │ ₹12.5L     │
│  │ ↑ +120 Y1    │ ↑ +5 Y1      │ ↑ +2% Y1     │ ↓ -₹3L Y1  │
│  └──────────────┴──────────────┴──────────────┴────────────┘
│
│  TABS: [Dashboard] [Staff] [Students] [Finance] [Settings]
│
│  ─── DASHBOARD TAB ────────────────────────────────────────
│
│  Two-Column Layout:
│
│  LEFT (Academic Metrics):
│    📚 Student Enrollment Trend (12 months)
│      2,500 │                       ✓
│      2,400 │                ✓
│      2,300 │        ✓
│      2,200 │
│             └────────────────────────
│
│    👥 Teachers by Department
│       Math: 12, English: 10, Science: 18, SST: 8, Arts: 4
│
│    🎯 Student Performance (Grade Distribution)
│       A+: 15%, A: 22%, B+: 28%, B: 20%, C+: 10%, C: 5%
│
│  RIGHT (Action Items):
│    ⚠️  5 students with <75% attendance
│        [Send SMS to parents] [View details]
│
│    ⚠️  3 teachers haven't submitted grades for Unit Test 3
│        [Send reminder] [Deadline: Today 5 PM] [View pending]
│
│    ✅ All April fees collected (100%)
│        [View breakdown] [Send receipt summary]
│
│    📢 3 new support tickets
│        [View queue] [Assign to team]
│
│  ───────────────────────────────────────────────────────────
│
│  ─── STAFF TAB ────────────────────────────────────────────
│
│  Action Buttons
│  [+ Add New Staff] [Import CSV] [Export] [Audit Log]
│
│  Filter: [Role ▼] [Department ▼] [Status ▼] [Search: ___]
│
│  Staff Directory (Interactive)
│  ┌───┬──────────────┬──────────┬────────────┬──────────────┐
│  │ # │ Name         │ Role     │ Department │ Contact      │
│  ├───┼──────────────┼──────────┼────────────┼──────────────┤
│  │ 1 │ Mr. Sharma   │ Principal│ Admin      │ Mobile/Email │
│  │ 2 │ Ms. Mehta    │ Admin    │ Admin      │ Mobile/Email │
│  │ 3 │ Mr. Rao      │ Teacher  │ Math       │ Mobile/Email │
│  │ 4 │ Ms. Gupta    │ Teacher  │ Science    │ Mobile/Email │
│  │ ...                                                    │
│  └───┴──────────────┴──────────┴────────────┴──────────────┘
│
│  Click staff → Detail panel (edit, reassign, suspend, remove)
│
│  ──────────────────────────────────────────────────────────
│
│  ─── STUDENTS TAB ──────────────────────────────────────────
│
│  Filter Bar
│  [Class ▼] [Attendance ▼] [Status ▼] [Fee Status ▼] [Search: ___]
│
│  Class Group View
│  ├─ Class 10-A (62 students)
│  │   • Raj Kumar - Attendance 95%, Average Grade: A
│  │   • Priya Sharma - Attendance 88%, Average Grade: A
│  │   • Aditya Patel - Attendance 72%, Average Grade: B ⚠️
│  │   [Expand] [Export] [Send message]
│  │
│  ├─ Class 10-B (58 students)
│  │   ...
│  │
│  └─ Class 11-A (Lab) (45 students)
│     ...
│
│  ──────────────────────────────────────────────────────────
│
│  ─── FINANCE TAB ──────────────────────────────────────────
│
│  This Month: ₹24.25L collected, ₹350K pending (98.5%)
│
│  Sub-tabs:
│  [Monthly Summary] [Invoice Log] [Payment Collection]
│  [Outstanding] [Analytics]
│
│  Monthly Collection Status
│  April 2026: Total ₹24.6L
│    • Invoiced: ₹24.6L
│    • Collected: ₹24.25L (98.5%)
│    • Pending: ₹350K (1.5%)
│    • Overdue: ₹0 (0%) ✓
│
│  Breakdown by Class
│  Class 10-A (62 students × ₹40K): ₹24.8L sent, ₹24.5L collected
│  Class 10-B (58 students × ₹40K): ₹23.2L sent, ₹22.8L collected
│  Class 11-A (45 students × ₹50K): ₹22.5L sent, ₹22.1L collected
│
│  Outstanding Payments (>2 weeks)
│  ┌──────┬──────────┬──────────┬─────────┬──────────┐
│  │ ID   │ Student  │ Amount   │ Due     │ Days PD  │
│  ├──────┼──────────┼──────────┼─────────┼──────────┤
│  │ 1    │ Aditya P │ ₹40,000  │ 15/04   │ 8 days   │
│  │ 2    │ Deepak S │ ₹50,000  │ 10/04   │ 13 days  │
│  │ ...                                           │
│  └──────┴──────────┴──────────┴─────────┴──────────┘
│
│  [Send reminder] [Record payment] [Adjust invoice]
│
│  Revenue Trend (6 months)
│  Apr 26: ₹24.25L │ ████████████████████
│  Mar 26: ₹23.90L │ ████████████████████
│  Feb 26: ₹23.15L │ ███████████████████░
│  Jan 26: ₹22.30L │ ██████████████████░░
│
│  ─── SETTINGS TAB ────────────────────────────────────────
│
│  School Updates
│  • Name: DPS Mumbai
│  • Address: Powai, Mumbai
│  • Logo: [Upload] [Current logo]
│  • Contact: +91 22 XXXX XXXX
│  • Email: admin@dps.edu.in
│
│  Subscription
│  • Current Tier: Premium (₹80K/month)
│  • Next Payment: 15/05/2026
│  • [Upgrade to Enterprise] [Change payment method]
│
│  Integrations
│  • SMS Gateway: [Configure] [Test]
│  • Payment: [Razorpay connected] [Reconnect]
│  • Email: [SMTP configured] [Test email]
│
│ BOTTOM NAVIGATION (Mobile)
│  [📊 Dashboard] [👥 Staff] [📚 Students] [💰 Finance] [⚙️ Settings]
│
└─────────────────────────────────────────────────────────────┘
```

---

# PART 4: ROLE-BASED DASHBOARDS (DETAILED)

## Principal Dashboard (Academic Leadership)

```
┌─────────────────────────────────────────────────────────────┐
│  DPS Mumbai - Principal     [Messages] [Notifications] [Help]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Welcome back, Mr. Sharma!                                   │
│
│  TODAY'S SNAPSHOT
│  ┌──────────────┬──────────────┬──────────┐
│  │ Today's      │ Teachers on  │ Classes  │
│  │ Attendance   │ Leave        │ Today    │
│  │ 2,380/2,450  │ 4/89         │ 18       │
│  │ 97.1%        │ Covered      │ ✓        │
│  └──────────────┴──────────────┴──────────┘
│
│  QUICK ACTIONS (Colored cards)
│  ┌──────────────┬──────────────┬────────────┬──────────────┐
│  │ 📚 Today's   │ 👥 Teacher   │ 📊 Academic│ 📢 Announce │
│  │ Classes &    │ Management   │ Reports    │ To All Staff │
│  │ Attendance   │              │            │              │
│  │              │              │            │              │
│  │ [Mark/View]  │ [Manage]     │ [View]     │ [Create]     │
│  └──────────────┴──────────────┴────────────┴──────────────┘
│
│  ALERTS & ACTION ITEMS
│  ⚠️  5 students with <75% attendance (trend alert)
│     [View list] [Send SMS] [Set as priority]
│
│  ⚠️  3 teachers pending grade submission for Unit Test 3
│     [Send reminder] [Deadline: Today 5 PM]
│
│  ✅ All attendance marked for today (so far)
│  📢 1 new support request from student
│     [View] [Forward to teacher]
│
│  CHARTS (Academic dashboard)
│
│  LEFT: 30-Day Attendance Trend           RIGHT: Grade Distribution
│  100% ─────────────────────────────      A+: 15%, A: 22%,
│  95%  ─────────────────────────         B+: 28%, B: 20%,
│  90%  ─────────────────────             C+: 10%, C: 5%
│        Week 1 Week 2 Week 3 Week 4
│
│  MAIN CONTENT AREA
│  
│  Classes (List / Grid toggle)
│  ┌─ Class 10-A
│  │  62 students | 2 teachers | Math, English, Science
│  │  Today: All present ✓ | 5 classes today
│  │  [View details] [Manage] [View attendance] [View grades]
│  │
│  ├─ Class 10-B
│  │  58 students | 2 teachers | Math, English, Science
│  │  Today: 56 present, 2 absent | 4 classes today
│  │  [View details] [Manage] [View attendance] [View grades]
│  │
│  └─ Class 11-A (Lab)
│     45 students | 3 teachers | Physics Lab, Chemistry Lab
│     Today: Lab practice (4 PM)
│     [View details] [Manage]
│
│  TEACHER WORKLOAD VIEW
│  ┌─ Mr. Rao (Math)
│  │  Classes: 10-A, 10-B, 11-A | Workload: 12 hrs/week
│  │  Subjects: Math, Additional Math
│  │  [View assignment] [Check workload] [Reassign if needed]
│  │
│  ├─ Ms. Gupta (Science)
│  │  Classes: 10-A, 10-B, 11-B | Workload: 14 hrs/week
│  │  Subjects: Physics, Chemistry, Biology
│  │
│  └─ (More teachers...)
│
│ BOTTOM NAVIGATION (Mobile)
│  [📊 Dashboard] [📚 Classes] [👥 Teachers] [📋 Attendance] [⚙️ More]
│
└─────────────────────────────────────────────────────────────┘
```

## Teacher Dashboard (Teaching & Grading)

```
┌─────────────────────────────────────────────────────────────┐
│  DPS Mumbai - Your Dashboard       [Schedule] [Messages] [Help]│
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Good morning, Mr. Rao!                                      │
│  Schedule today:  9:00-10:00 Math 10-A (Room 101)          │
│                   10:15-11:15 Math 10-B (Room 105)         │
│                                                               │
│  ACTION ITEMS (Always visible, prioritized)
│  ⚠️  Mark Attendance: Math 10-A [Do Now]
│      Class starts in 5 minutes
│
│  ⚠️  Grade Entry: Unit Test 3 results (3 teachers pending)
│      Deadline: Today 5 PM
│
│  ✅ Last attendance marked: Today 10:15 AM Math 10-B
│  📧 3 student questions in Q&A forum (awaiting response)
│
│  FEATURE CARDS (Large, touchable)
│  ┌─────────────┬──────────────┬─────────────┬──────────────┐
│  │ ✏️ Mark     │ 📊 Enter     │ 📧 Message  │ 📋 View      │
│  │ Attendance  │ Grades       │ Students &  │ Assignments  │
│  │             │              │ Parents     │              │
│  │ Quick       │ Quick        │ Quick task  │ View pending │
│  │ access      │ access       │ entry       │ submissions  │
│  │             │              │             │              │
│  │ [Mark Now]  │ [Enter]      │ [Compose]   │ [View]       │
│  └─────────────┴──────────────┴─────────────┴──────────────┘
│
│  MY CLASSES (Today & upcoming)
│  ├─ Math 10-A
│  │  62 students | 09:00-10:00 | Room 101
│  │  Attendance: Not yet marked
│  │  [Mark Attendance] [View class] [Send message to class]
│  │
│  ├─ Math 10-B
│  │  58 students | 10:15-11:15 | Room 105
│  │  Attendance: ✓ Marked (56/58 present)
│  │  [View attendance] [View grades] [Send message]
│  │
│  └─ Advisory (Class 10-A)
│     Class mentor duties | 15:00-15:30 | Staff Room
│
│  ─────────────────────────────────────────────────────────
│
│  MARK ATTENDANCE FLOW (Shown when clicked)
│  
│  Date: [Today ▼]  Class: [10-A ▼]  Period: [1 ▼]
│  
│  Quick Buttons: [Mark All Present] [Mark All Absent]
│  
│  ┌──────┬──────────────┬──────────────────┐
│  │ Roll │ Student      │ Status           │
│  ├──────┼──────────────┼──────────────────┤
│  │ 1    │ Raj Kumar    │ [Present ✓] [Abs]│
│  │ 2    │ Priya Sharma │ [Present ✓] [Abs]│
│  │ 3    │ Aditya Patel │ [Present] [Absent✓]│ Absent reason: Leave
│  │ ...                                      │
│  │ 62   │ Zara Khan    │ [Present ✓] [Abs]│
│  └──────┴──────────────┴──────────────────┘
│  
│  [Save] [Save & Continue to next class] [Cancel]
│  
│  ─────────────────────────────────────────────────────────
│
│  VIEW GRADES (Enter grades interface)
│  
│  Class: [10-A ▼]  Subject: [Math ▼]  Term: [Term 1 ▼]
│  
│  Components (weights can be configured):
│  • Assignment (20%)
│  • Test (30%)
│  • Exam (50%)
│  
│  ┌──────┬──────────────┬──────┬────┬────┬────┬────────────┐
│  │ Roll │ Name         │ Assg │Test│Exam│Grade│ Grade      │
│  ├──────┼──────────────┼──────┼────┼────┼────┼────────────┤
│  │ 1    │ Raj Kumar    │ 20   │ 28 │ 48 │ 96 │ A+ (96%)   │
│  │ 2    │ Priya Sharma │ 19   │ 27 │ 46 │ 92 │ A  (92%)   │
│  │ 3    │ Aditya Patel │ 16   │ 24 │ 42 │ 82 │ B+ (82%)   │
│  │ ...                                                    │
│  └──────┴──────────────┴──────┴────┴────┴────┴────────────┘
│
│  [Download as PDF] [Email grades to parents] [Print]
│
│  ─────────────────────────────────────────────────────────
│
│  MESSAGE PARENTS/STUDENTS
│  
│  Send to: [Select class ▼] / [Select student ▼]
│  
│  Template: [Attendance alert] [Grade update] [General message]
│  [Create custom]
│  
│  Message Preview:
│  ┌──────────────────────────────────────────────────────┐
│  │ Dear Parents,                                         │
│  │                                                       │
│  │ Raj has missed 2 classes this week. Please speak     │
│  │ with him about regular attendance.                   │
│  │                                                       │
│  │ Best regards,                                         │
│  │ Mr. Rao                                              │
│  └──────────────────────────────────────────────────────┘
│  
│  Send via: [SMS] [WhatsApp] [Email] [In-app message]
│  
│  [Send] [Cancel] [Save as template]
│
│  ─────────────────────────────────────────────────────────
│
│  BOTTOM NAVIGATION (Mobile)
│  [Today] [Attendance] [Grades] [Messages] [Q&A] [My Settings]
│
└─────────────────────────────────────────────────────────────┘
```

## Student Dashboard (Learning & Progress)

```
┌─────────────────────────────────────────────────────────────┐
│  DPS Mumbai - Student                   [Messages] [Help]    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Hello, Raj Kumar!                                           │
│  Class: 10-A  |  Roll: 1  |  School: DPS Mumbai            │
│                                                               │
│  YOUR SCORE SUMMARY (Cards)
│  ┌──────────────┬──────────────┬──────────────┐
│  │ Current      │ This Month   │ Attendance   │
│  │ Average      │ Avg          │ This Month   │
│  │ Grade        │ Performance  │              │
│  │              │              │              │
│  │ A (92%)      │ ↑ +2%        │ 90%          │
│  │ ✓ Excellent  │ ✓ Improving  │ ✓ Good       │
│  └──────────────┴──────────────┴──────────────┘
│
│  TODAY'S SCHEDULE
│  09:00 │ ████ │ Math (Room 101) | Attendance: Not marked yet
│  10:15 │ ████ │ English (Library) | Attendance: ✓
│  11:30 │ ████ │ Science Lab | Check in soon (30 mins)
│  12:45 │ ☕️ │ Lunch break
│  14:00 │ ████ │ Social Studies (Room 205) | Offline class today
│
│  GRADES (Current term breakdown)
│
│  Term 1 (Oct-Dec 2025) - Final
│  ┌─────────────┬────────┐
│  │ Math        │ 95/100 │  Top performer! 🏆
│  │ English     │ 88/100 │
│  │ Science     │ 92/100 │
│  │ Social Std  │ 90/100 │
│  │ Hindi       │ 86/100 │
│  │ Avg: 90.2%  │ Grade B+│
│  └─────────────┴────────┘
│  
│  Term 2 (Jan-Mar 2026) - In Progress
│  ┌─────────────┬────────┐
│  │ Math        │ 93/100 │  ↓ -2 (slight dip from Term 1)
│  │ English     │ 91/100 │  ↑ +3 (improving!)
│  │ Science     │ 94/100 │  ↑ +2 (excellent)
│  │ Social Std  │ 91/100 │  ↑ +1
│  │ Hindi       │ 88/100 │  ↑ +2
│  │ Avg: 91.4%  │ Grade A │
│  └─────────────┴────────┘
│  
│  [View detailed breakdown] [View teacher feedback]
│
│  ASSIGNMENTS & TASKS (Sorted by due date)
│  
│  ⚠️ URGENT (Due today)
│  ┌─────────────────────────────────────────────────────────┐
│  │ Science: "Lab Report - Photosynthesis"                 │
│  │ Assigned by: Ms. Gupta                                 │
│  │ Due: Today 5:00 PM (2 hours left) ⚠️  URGENT          │
│  │ Progress: Section 1 ✓ | Section 2 ✓ | Section 3 ⚠️ | Section 4 ⚠️
│  │ [Continue working] [View requirements] [Ask for help]  │
│  └─────────────────────────────────────────────────────────┘
│
│  THIS WEEK
│  ┌─────────────────────────────────────────────────────────┐
│  │ Math: "Probability Problems Set 3"                      │
│  │ Due: Tomorrow 11:59 PM (20 hours left)                 │
│  │ Progress: 8/10 problems completed                       │
│  │ [Continue] [Submit] [View solutions]                    │
│  │                                                         │
│  │ English: "Short Story Writing"                          │
│  │ Due: 15/05/2026 (5 days left)                          │
│  │ Progress: Not yet started                              │
│  │ [Start writing] [View prompt] [View examples]          │
│  └─────────────────────────────────────────────────────────┘
│
│  MESSAGES FROM TEACHERS
│  [📧 Math teacher] "Good work on Unit Test! Consider..."
│  [📧 English teacher] "8/10 on assignment. Well done..."
│  [📧 Science teacher] "See me about practical exam..."
│  [View all messages]
│
│  RESOURCES & SUPPORT
│  [📚 Textbooks & notes] [📹 Video lessons] [❓ Q&A Forum]
│  [📖 Study guides] [🔗 External links]
│
│  ATTENDANCE
│  This Month: 18/20 days (90%)
│  This Year: 182/200 days (91%)
│  Trend: ◆ Consistent (no concerns)
│
│  BOTTOM NAVIGATION (Mobile)
│  [Home] [Grades] [Tasks] [Messages] [Attendance] [Me]
│
└─────────────────────────────────────────────────────────────┘
```

## Parent Dashboard (Child Monitoring)

```
┌─────────────────────────────────────────────────────────────┐
│  DPS Mumbai - Parent Portal           [My Children] [Help]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Welcome, Mrs. Sharma!                                       │
│  You have 1 child in the school: Raj Kumar (Class 10-A)    │
│
│  QUICK PERFORMANCE SUMMARY
│  ┌──────────────┬──────────────┬──────────────┐
│  │ This Month   │ This Year    │ Attendance   │
│  │ Avg: 91.4%   │ Avg: 90.8%   │ 90% overall  │
│  │ Grade: A     │ Grade: B+    │ ✓ Good       │
│  │ ✓ Excellent  │ ✓ Solid      │ ✓ Reliable   │
│  └──────────────┴──────────────┴──────────────┘
│
│  OVERALL ASSESSMENT FOR THIS MONTH
│  ✅ Academics: Performing very well. Math improved.
│  ✅ Attendance: 18/20 days (90%) - consistent
│  ✅ Assignments: 95% on-time submission rate
│  ✅ Behavior: Good participation in class discussions
│  Recommendation: Keep up the excellent work!
│
│  ─────────────────────────────────────────────────────────
│
│  DETAILED GRADES (Term-by-term)
│
│  Term 1 (Oct-Dec 2025) - Final
│  Math: 95 | English: 88 | Science: 92 | Social: 90 | Hindi: 86
│  Average: 90.2% | Grade: B+ | Rank: Top 5 in class
│  [View detailed feedback] [Download report card]
│
│  Term 2 (Jan-Mar 2026) - In Progress (50% complete)
│  Math: 93 | English: 91 | Science: 94 | Social: 91 | Hindi: 88
│  Current Average: 91.4% | Grade: A | On track!
│  [View tentative report] [View teacher comments]
│
│  GRADE TREND (Visual timeline)
│  ↑ Slightly declining in Math (95→93)
│  ↑ Strong improvement in English (88→91)
│  ↑ Excellent growth in Science (92→94)
│  ↑ Consistent improvement overall 📈
│
│  ─────────────────────────────────────────────────────────
│
│  ATTENDANCE (Detailed view)
│
│  This month: 18/20 days (90%)
│  This year: 182/200 days (91%)
│  Last absent: 02/05/2026 (3 days ago, marked Leave)
│  Trend: ◆ Consistent, healthy attendance pattern
│
│  Monthly breakdown:
│  April 2026: 20 days (expected) | 18 attended (90%)
│  March 2026: 20 days | 20 attended (100%)
│  February 2026: 19 days | 18 attended (95%)
│
│  [View detailed daily logs] [Set low-attendance alert]
│
│  ─────────────────────────────────────────────────────────
│
│  UPCOMING COMMITMENTS & DEADLINES
│
│  ⚠️  TODAY (Due 5 PM)
│  Science: Lab Report finalizations
│  [Remind child] [View assignment]
│
│  THIS WEEK
│  Math: Problem Set 3 (Due tomorrow)
│  English: Short Story (Due 15/05)
│
│  SCHOOL EVENTS
│  [📢 Annual sports meet - 20/05/2026]
│  [📢 Parent-teacher conference - 18/05/2026]
│     You have a slot: Sunday 14:30-14:45 with Mr. Rao (Math)
│     [Confirm attendance] [Reschedule] [Message teacher]
│  [📢 Summer vacation schedule released]
│
│  ─────────────────────────────────────────────────────────
│
│  RECENT COMMUNICATIONS
│
│  From Teachers:
│  📧 Mr. Rao (Math) - 05/05, Yesterday
│     "Great unit test performance! Keep this up."
│
│  📧 Ms. Gupta (Science) - 03/05, 2 days ago
│     "Excellent practical exam performance. A grade."
│
│  📧 Ms. Sharma (English) - 01/05, 4 days ago
│     "Feedback: 8/10 on assignment. Improve concluding paragraph."
│
│  From School:
│  📢 Principal - 04/05, Yesterday
│     "School announcing annual sports month. Registration open."
│
│  📢 Admin - 30/04, 5 days ago
│     "May fee receipt attached. Payment received."
│
│  ─────────────────────────────────────────────────────────
│
│  FEES & PAYMENTS
│
│  Current Status: ✅ All fees paid, no dues
│
│  Recent Transactions:
│  April 2026: ₹40,000 (Tuition) - Paid on 05/05/2026 ✓
│  May 2026: ₹40,000 (Due on 01/05/2026) ✓ Paid
│  June 2026: ₹40,000 (Due on 01/06/2026) - Upcoming
│
│  [View all invoices] [Download receipts] [Payment history]
│  [Set payment reminders]
│
│  ─────────────────────────────────────────────────────────
│
│  MESSAGING & SUPPORT
│
│  [Send message to teacher] [Schedule parent-teacher chat]
│  [View school announcements] [Contact school admin]
│
│  BOTTOM NAVIGATION (Mobile)
│  [Home] [Grades] [Attendance] [Tasks] [Messages] [Account]
│
└─────────────────────────────────────────────────────────────┘
```

---

# PART 5: GOOGLE CLOUD FIRESTORE SCHEMA

## Multi-Tenant Database Structure

```
schoolerp/ (root database)
│
├─── foundational collections
│    ├─ meta/
│    │   ├─ config (global pricing, features, status)
│    │   ├─ audit_log (system-wide actions, immutable)
│    │   └─ pricing_history (historical pricing records)
│    │
│    ├─ users/ (global user registry)
│    │   ├─ {userId}/
│    │   │   ├─ email
│    │   │   ├─ firebase_uid
│    │   │   ├─ role_type (founder_admin / school_owner / staff / student / parent)
│    │   │   ├─ school_assignments (array: [{schoolId, role, department}])
│    │   │   ├─ phone_number
│    │   │   ├─ profile_photo_url
│    │   │   └─ created_at, updated_at
│    │   │
│    │   └─ (more users...)
│    │
│    ├─ founder/ (company-level data, never shared with users)
│    │   ├─ dashboard_metrics (aggregated KPIs)
│    │   ├─ pending_approvals (new schools awaiting founder approval)
│    │   ├─ support_queue (all global support tickets)
│    │   ├─ emergency_log (disable commands, etc)
│    │   └─ recurring_tasks (monthly billing, etc)
│    │
│    └─ notifications/ (message queue, time-series)
│        └─ {userId}/ (subcollection)
│           ├─ {notificationId}/
│           │   ├─ type (attendance_alert, grade_update, fee_reminder)
│           │   ├─ title,message, action_url
│           │   ├─ read (boolean)
│           │   ├─ created_at, expires_at
│           │   └─ (more notifications)
│           │
│           └─ (more users)
│
└─── schools/ (multi-tenant collection, isolated by schoolId)
     │
     ├─ {schoolId}/ (school document with metadata)
     │   ├─ metadata
     │   │   ├─ name, city, address
     │   │   ├─ owner_email, phone
     │   │   ├─ tier (free / basic / premium / enterprise)
     │   │   ├─ student_count, teacher_count
     │   │   ├─ status (pending_approval / active / suspended)
     │   │   ├─ updated_at, joined_at
     │   │   └─ logo_url
     │   │
     │   ├─ subscription
     │   │   ├─ current_tier
     │   │   ├─ payment_method
       ├─ renewal_date
     │   │   └─ billing_email
     │   │
     │   ├─ settings
     │   │   ├─ branding (colors, logo, school name text)
     │   │   ├─ sms_gateway_config (Twilio / MSG91)
     │   │   ├─ payment_gateway (Razorpay / PayU)
     │   │   ├─ smtp_config (email relay)
     │   │   ├─ academic_year (start_date, end_date)
     │   │   └─ grade_scale (A=90-100, B=80-89, etc)
     │   │
     │   ├─ audit_log (school-specific actions)
     │   │   └─ {timestamp} / action, user, details
     │   │
     │   ├─ staff/ (subcollection)
     │   │   ├─ {staffId}/
     │   │   │   ├─ firebase_uid, email
     │   │   │   ├─ role (principal / teacher / admin / accountant)
     │   │   │   ├─ full_name, phone
     │   │   │   ├─ permissions (array)
     │   │   │   ├─ classes_assigned (teachers only)
     │   │   │   ├─ subjects_taught
     │   │   │   ├─ department (Math / Science / English)
     │   │   │   ├─ status (active / suspended / left)
     │   │   │   ├─ joined_date, last_login_date
     │   │   │   └─ created_at
     │   │   │
     │   │   └─ (more staff members)
     │   │
     │   ├─ students/ (subcollection)
     │   │   ├─ {studentId}/
     │   │   │   ├─ full_name, dob, photo_url
     │   │   │   ├─ roll_number, class (e.g., "10_A")
     │   │   │   ├─ parent_uids (array of parent IDs)
     │   │   │   ├─ contact_info (address, phone)
     │   │   │   ├─ enrollment_date, status (active / left)
     │   │   │   ├─ class (class name reference)
     │   │   │   └─ created_at, updated_at
     │   │   │
     │   │   └─ (more students)
     │   │
     │   ├─ classes/ (subcollection, by class name)
     │   │   ├─ {classId}/ (e.g., "10_A", "11_Science")
     │   │   │   ├─ class_name, grade_level, division
     │   │   │   ├─ student_count, teacher_count
     │   │   │   ├─ teacher_uids (array)
     │   │   │   ├─ subjects (array: ["Math", "English", "Science"])
     │   │   │   └─ academic_year
     │   │   │
     │   │   └─ (more classes)
     │   │
     │   ├─ attendance/ (subcollection, date-partitioned)
     │   │   ├─ {date}/ (e.g., "2026_05_08")
     │   │   │   ├─ {classId}/
     │   │   │   │   ├─ {studentId}/
     │   │   │   │   │   ├─ status (present / absent / leave)
     │   │   │   │   │   ├─ period (1, 2, 3, All-day)
     │   │   │   │   │   ├─ teacher_uid
     │   │   │   │   │   └─ timestamp
     │   │   │   │   │
     │   │   │   │   └─ (more students)
     │   │   │   │
     │   │   │   └─ (more classes)
     │   │   │
     │   │   └─ (more dates)
     │   │
     │   ├─ grades/ (subcollection)
     │   │   ├─ {academicYear}/ (e.g., "2025_26")
     │   │   │   ├─ {term}/ (e.g., "term_1")
     │   │   │   │   ├─ {subjectId}/ (e.g., "math_10_a")
     │   │   │   │   │   ├─ {classId}/
     │   │   │   │   │   │   ├─ {studentId}/
     │   │   │   │   │   │   │   ├─ components
     │   │   │   │   │   │   │   │   ├─ assignment (score, weight)
     │   │   │   │   │   │   │   │   ├─ test (score, weight)
     │   │   │   │   │   │   │   │   └─ exam (score, weight)
     │   │   │   │   │   │   │   ├─ final_grade (auto-calculated)
     │   │   │   │   │   │   │   ├─ entered_by (teacher_uid)
     │   │   │   │   │   │   │   └─ timestamp
     │   │   │   │   │   │   │
     │   │   │   │   │   │   └─ (more students)
     │   │   │   │   │   │
     │   │   │   │   │   └─ (more classes)
     │   │   │   │   │
     │   │   │   │   └─ (more subjects)
     │   │   │   │
     │   │   │   └─ (more terms)
     │   │   │
     │   │   └─ (more academic years)
     │   │
     │   ├─ invoices/ (subcollection)
     │   │   ├─ {invoiceId}/
     │   │   │   ├─ amount, description
     │   │   │   ├─ due_date, issued_date, paid_date
     │   │   │   ├─ student_ids (array)
     │   │   │   ├─ status (pending / paid / overdue)
     │   │   │   ├─ payment_method, txn_id
     │   │   │   └─ created_at
     │   │   │
     │   │   └─ (more invoices)
     │   │
     │   ├─ announcements/ (subcollection)
     │   │   ├─ {announcementId}/
     │   │   │   ├─ title, content
     │   │   │   ├─ target_audience (all_staff / all_parents / class_10_a)
     │   │   │   ├─ posted_by, posted_date, expiry_date
     │   │   │   └─ (more announcements)
     │   │   │
     │   │   └─ (more announcements)
     │   │
     │   └─ assignments/ (subcollection)
     │       ├─ {assignmentId}/
     │       │   ├─ title, description
     │       │   ├─ classId, subject, teacher_uid
     │       │   ├─ due_date, created_date
     │       │   ├─ student_submissions (array: [{studentId, submitted_at, content_url}])
     │       │   ├─ grading_rubric (optional)
     │       │   └─ (more assignments)
     │       │
     │       └─ (more assignments)
     │
     └─ (more schools...)
```

---

# PART 6: AUTHENTICATION FLOW

## Login Flow with Role-Based Routing

```
1. USER VISITS: https://app.schoolerp.in/login

2. SYSTEM DETERMINES CONTEXT:
   ├─ If URL has ?school=S1 → Direct to school login
   ├─ If user was logged in before → Skip school selection
   ├─ If new user → Show school picker first
   └─ If Founder IP → Redirect to http://localhost:3001 (local)

3. USER SELECTS SCHOOL (if not in URL):
   "Which school are you from?"
   ├─ Shows list of schools where user has accounts
   ├─ Founder sees: "System Admin (Local Only)" option
   └─ Others see: Regular school list

4. USER ENTERS CREDENTIALS:
   └─ Email + Password
   └─ OR Google OAuth
   └─ OR Microsoft SSO

5. FIREBASE VERIFIES:
   ├─ Checks email/password or OAuth token
   ├─ Returns: Firebase ID token (JWT)
   ├─ Token includes: uid, email, email_verified
   └─ Token valid: 1 hour (auto-refresh before expiry)

6. BACKEND ENRICHES TOKEN:
   POST /auth/login
   Input: {firebase_idToken, selectedSchoolId}
   
   Validates:
   ├─ User exists in users/ collection
   ├─ User has access to selectedSchoolId
   ├─ User's role in this school
   └─ User's permissions in this school
   
   Returns custom JWT:
   {
     uid: "user123",
     email: "teacher@school.edu.in",
     role: "teacher",
     schoolId: "dps_mumbai",
     permissions: ["attendance.mark", "grades.enter", "messages.send"],
     permissions: ["student.view"],
     school_name: "DPS Mumbai",
     school_tier: "premium"
   }

 7. FRONTEND STORES TOKEN:
   ├─ localStorage (non-sensitive apps)
   ├─ SessionStorage (sensitive + will be cleared on close)
   ├─ HTTP-only Cookie (most secure, if backend sets it)
   └─ IndexedDB (if using offline sync)

8. EVERY API REQUEST INCLUDES TOKEN:
   Authorization: Bearer {customJWT}

9. BACKEND MIDDLEWARE VALIDATES:
   ├─ Signature exists and is valid
   ├─ Token not expired
   ├─ User uid exists in database
   ├─ User has role in requested school
   ├─ User has permission for this action
   └─ Attach user to req.user object

10. POST-LOGIN DASHBOARD ROUTING:
    ├─ Founder: http://localhost:3001/dashboard
    ├─ School owner: /owner/dps_mumbai/dashboard
    ├─ Principal: /principal/dps_mumbai/dashboard
    ├─ Teacher: /teacher/dps_mumbai/dashboard
    ├─ Student: /student/dps_mumbai/Raj-Kumar/dashboard
    └─ Parent: /parent/Raj-Kumar/dashboard
```

## Authorization Matrix

```
ACTION                          │ Founder │ Owner │ Principal │ Teacher │ Student │ Parent
────────────────────────────────┼─────────┼───────┼───────────┼─────────┼─────────┼────────
View founder dashboard          │    ✓    │   ✗   │     ✗     │    ✗    │    ✗    │   ✗
Approve new school              │    ✓    │   ✗   │     ✗     │    ✗    │    ✗    │   ✗
View school metrics (all)       │    ✓    │   ✗   │     ✗     │    ✗    │    ✗    │   ✗
View school metrics (own)       │    ✗    │   ✓   │     ✓     │    ✗    │    ✗    │   ✗
Create new staff                │    ✗    │   ✓   │     ✗     │    ✗    │    ✗    │   ✗
Edit staff details              │    ✗    │   ✓   │     ✗     │    ✗    │    ✗    │   ✗
Mark attendance                 │    ✗    │   ✗   │     ✗     │    ✓    │    ✗    │   ✗
View attendance (own class)     │    ✗    │   ✗   │     ✗     │    ✓    │    ✗    │   ✗
View attendance (own)           │    ✗    │   ✗   │     ✗     │    ✓    │    ✓    │   ✓*
Enter grades                    │    ✗    │   ✗   │     ✗     │    ✓    │    ✗    │   ✗
View grades (own class)         │    ✗    │   ✗   │     ✗     │    ✓    │    ✗    │   ✗
View grades (own)               │    ✗    │   ✗   │     ✗     │    ✓    │    ✓    │   ✓*
Message class parents           │    ✗    │   ✗   │     ✗     │    ✓    │    ✗    │   ✗
Pay fees                        │    ✗    │   ✓   │     ✗     │    ✗    │    ✗    │   ✓
View invoice (own child)        │    ✗    │   ✓   │     ✗     │    ✗    │    ✗    │   ✓
View school config              │    ✗    │   ✓   │     ✗     │    ✗    │    ✗    │   ✗
View fee reports                │    ✗    │   ✓   │     ✓     │    ✗    │    ✗    │   ✗
View financial projections      │    ✓    │   ✗   │     ✗     │    ✗    │    ✗    │   ✗
Disable school (emergency)      │    ✓    │   ✗   │     ✗     │    ✗    │    ✗    │   ✗

* Parent can only view their own child's data
```

---

# PART 7: WEEK-BY-WEEK IMPLEMENTATION (24 WEEKS)

## Weeks 1-4: Foundation & Authentication
```
✓ Firebase Auth setup (email/password/Google OAuth)
✓ User roles & permissions table
✓ JWT token generation & validation
✓ Middleware for role-based access
✓ Firestore security rules
✓ Test user creation (all 6 roles)
```

## Weeks 5-8: Founder Dashboard (Local-Only)
```
✓ Founder dashboard backend (30+ endpoints)
✓ Founder dashboard frontend (overview, schools, revenue, support)
✓ CLI tool implementation (`founder-cli`)
✓ Docker isolation (localhost only)
✓ SSH tunnel documentation
✓ Emergency controls (disable school, revoke access)
```

## Weeks 9-12: School Owner & Principal Dashboards
```
✓ School owner dashboard (staff, students, finance, settings)
✓ Principal dashboard (classes, teachers, attendance, reports)
✓ Staff creation & assignment flows
✓ Student list management
✓ Class configuration
```

## Weeks 13-16: Teacher & Student Dashboards
```
✓ Teacher dashboard (mark attendance, enter grades, message parents)
✓ Student dashboard (view grades, assignments, attendance, schedule)
✓ Attendance marking interface
✓ Grade entry interface
✓ Student-teacher messaging
```

## Weeks 17-20: Parent & Advanced Features
```
✓ Parent dashboard (view child's data only)
✓ Parent-teacher messaging
✓ Fee payment in parent dashboard
✓ Analytics & reporting (all roles)
✓ Real-time notifications
✓ Role-based access control enforcement (all endpoints)
```

## Weeks 21-24: Security, Testing, Launch
```
✓ Security audit (WCAG accessibility, GDPR, FERPA compliance)
✓ End-to-end testing with beta schools
✓ Performance optimization
✓ Bug fixes & UI polish
✓ Documentation for school owners
✓ Soft launch with 5 pilot schools
```

---

# PART 8: SECURITY CHECKLIST

```
Authentication:
□ Firebase Auth multi-provider (email, Google, Microsoft)
□ Custom JWT claims (role, schoolId, permissions)
□ Token refresh before expiry
□ HTTPS enforcement on all endpoints
□ CORS properly configured

Authorization:
□ Role-based access control (RBAC) at every endpoint
□ Permission matrix enforced
□ School-level isolation (school_id in request path & JWT)
□ Firestore security rules matching API logic
□ Admin cannot access other schools' data

Data Privacy:
□ GDPR compliance (data export, deletion)
□ FERPA compliance (student records protected)
□ Parent data isolated (only their child's data visible)
□ Encryption at rest (Firestore default)
□ Encryption in transit (HTTPS)

Infrastructure:
□ Founder dashboard on localhost only (0.0.0.0 NOT allowed)
□ Nginx blocking /founder paths on public API
□ AWS Security Group: Port 3001 has empty CIDR blocks
□ SSH key-based authentication for remote access
□ Public IP restricted to required ranges only

Audit & Monitoring:
□ All actions logged in audit_log (founder, school, user level)
□ Read logs non-repudiable (timestamps, user IDs)
□ Daily monitoring of security metrics
□ Alert on suspicious activity (mass deletion, unusual access patterns)
□ Regular security scanning (OWASP Top 10)
```

---

This architecture ensures:
✅ Founder has complete company control (secure, isolated)
✅ School owners manage everything for their school
✅ Each role has a modern, tailored dashboard
✅ Multi-tenant isolation at every level (Firestore paths, JWT, API middleware)
✅ Enterprise-grade security (RBAC, audit logs, encryption)
✅ Scales to 1000+ schools with GCP (serverless, auto-scaling)
✅ Ready for Week 1 development (April 15, 2026)
