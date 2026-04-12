# WORKFLOW AUTOMATION PLAN: Complete School ERP Automation Strategy

**Purpose:** Define all automated workflows, triggers, processing logic, error handling, and implementation roadmap  
**Tech Stack:** GCP Cloud Functions, Cloud Scheduler, Pub/Sub, Cloud Tasks, Cloud Run  
**Execution Model:** Event-driven + scheduled + manual triggers  
**Coverage:** 100% of repetitive workflows automated; zero manual data entry after initial setup  

---

## 🎯 AUTOMATION PHILOSOPHY

**Principles:**
1. **Zero Manual Data Entry** - Once student/staff data imported, system keeps everything in sync
2. **Fire & Forget** - All automations have retry logic (zero data loss)
3. **Transparency** - Every automation logged with execution status + audit trail
4. **Resilience** - Graceful degradation if any service fails
5. **SLA Compliance** - All automations meet response time requirements

---

## AUTOMATION WORKFLOW CATEGORIES

```
1. DATA SYNC & INTEGRATION (Firestore ↔ BigQuery ↔ External APIs)
2. NOTIFICATIONS (SMS, Email, Push, WhatsApp, In-App)
3. REPORTING & ANALYTICS (PDF generation, dashboard updates, exports)
4. BUSINESS PROCESS (Attendance, grading, promotions, fees, payroll)
5. COMPLIANCE & MONITORING (Audit logs, backups, alerts, SLA tracking)
6. SYSTEM MAINTENANCE (Database cleanup, index management, cost optimization)
7. CUSTOMER SUCCESS (Onboarding, feature rollout, health checks)
```

---

## 1. DATA SYNC & INTEGRATION AUTOMATIONS

### 1.1 **Real-Time Firestore → BigQuery Sync** [CRITICAL]

**Trigger:** Firestore document changes (write, update, delete)  
**Technology:** Firestore Cloud Function (on-change trigger)  
**Frequency:** Real-time (milliseconds latency)  
**Target Week:** Week 2-3

**Workflow:**
```yaml
Trigger:
  Type: "firestore_document_write"
  Path: "/{collection}/{documentId}"
  
Processing:
  1. Detect change type (create/update/delete)
  2. Transform Firestore doc → BigQuery row
  3. Handle nested objects (flatten for BigQuery schema)
  4. Add metadata: timestamp, user_id, operation
  
BigQuery Write:
  Dataset: "school_erp_prod"
  Table: "{collection}"
  Partition: "_PARTITIONTIME" (daily)
  Clustering: ["school_id", "created_at"]
  
Error Handling:
  ├─ BigQuery quota exceeded → enqueue to Pub/Sub for retry
  ├─ Schema mismatch → dead letter queue + alert
  └─ Firestore doc invalid → log + alert ops
  
SLA:
  ├─ Target latency: <5 seconds from Firestore write
  ├─ Retry: exponential backoff (1s, 2s, 4s, 8s, 16s)
  ├─ Max retries: 5 times over 30 seconds
  └─ Alert: If SLA breached
  
Cost Optimization:
  ├─ Batch writes: Aggregate 100 docs before BigQuery write
  ├─ Compression: Reduce payload size 30%
  └─ Estimated cost: $1.5K/month for 1M writes
```

**Collections to Sync:**
| Collection | Volume | Latency | Partition Key |
|---|---|---|---|
| schools | 100/day | Real-time | school_id |
| students | 1K/day | Real-time | school_id |
| attendance | 50K/day | Real-time | school_id, date |
| grades | 5K/day | Real-time | school_id, student_id |
| fees | 2K/day | Real-time | school_id |
| payroll | 500/month | Real-time | school_id |

---

### 1.2 **Daily Firestore Backup to Cloud Storage** [CRITICAL]

**Trigger:** Cloud Scheduler (2am UTC daily)  
**Technology:** Cloud Run or Cloud Function  
**Frequency:** Once per day  
**Target Week:** Week 1-2

**Workflow:**
```yaml
Schedule: "0 2 * * *" (2am UTC daily)

Processing:
  1. Copy entire Firestore database → Cloud Storage
  2. Compression: gzip format (reduce size 70%)
  3. Encrypt: GCP-managed encryption
  4. Versioning: Keep 30-day rolling backup
  
Cloud Storage:
  Bucket: "school-erp-firestore-backups"
  Path: "prod/2026-04-09/firestore-backup-{timestamp}.tar.gz"
  Retention: 30 days for daily backups, 1 year for monthly
  
Restore Process:
  ├─ IF incident occurs → restore from backup in <1 hour
  ├─ Steps: Extract, validate schema, import → Firestore
  └─ Test: Weekly restore drill to staging environment
  
Monitoring:
  ├─ Success: Backup completed, size logged
  ├─ Failure: Alert ops team immediately
  └─ Verify: Checksum validation after restore
  
SLA:
  ├─ Backup time: <15 minutes (must complete before 2:30am)
  ├─ RPO (Recovery Point Objective): 24 hours
  ├─ RTO (Recovery Time Objective): <1 hour
  └─ Alert: If backup fails or takes >20 minutes
```

---

### 1.3 **External API Sync: Payment Gateway (Razorpay)** [HIGH]

**Trigger:** Cloud Scheduler (hourly) + webhook on payment completion  
**Technology:** Cloud Function (scheduled + event-based)  
**Frequency:** Hourly + real-time on payment  
**Target Week:** Week 14-16

**Workflow:**
```yaml
Hourly Sync:
  Schedule: "0 * * * *" (every hour)
  
Processing:
  1. Query Razorpay API: GET /invoices?created_at>{last_sync_time}
  2. For each payment received:
     ├─ Fetch invoice details from Razorpay
     ├─ Map to Firestore: payments/{payment_id}
     ├─ Update parent invoice: payments_received += amount
     └─ Trigger notification (SMS to parent: "Payment received ₹3000")
  3. Reconciliation: Match Razorpay amount vs Firestore balance
  
Firestore Updates:
  Path: "schools/{schoolId}/fees/{studentId}/payments/{paymentId}"
  Data:
    {
      "razorpay_payment_id": "pay_xxx",
      "amount": 3000,
      "status": "captured",
      "received_at": "2026-04-09T10:30:00Z",
      "invoice_id": "inv_xxx"
    }

Webhook (Real-Time):
  Trigger: Razorpay webhook on payment success
  Endpoint: POST /webhooks/razorpay/payment
  Processing:
    1. Verify webhook signature (security)
    2. Extract payment data
    3. Update Firestore immediately
    4. Trigger notification → parent
    5. Return 200 OK to Razorpay
  
Error Handling:
  ├─ Razorpay quota exceeded → exponential backoff
  ├─ Webhook verification failed → reject + log
  ├─ Duplicate payment → detect via razorpay_payment_id, don't double-count
  └─ Network timeout → retry 3 times

SLA:
  ├─ Hourly sync latency: <5 minutes after payment
  ├─ Webhook latency: <2 seconds
  └─ Reconciliation: 100% accuracy (no discrepancies)

Monitoring:
  ├─ Metric: Payments synced per hour
  ├─ Alert: If hourly sync fails or payment stays pending >24 hours
  └─ Dashboard: Total collected, pending, failed
```

---

### 1.4 **SMS/Email Gateway Sync: Twilio** [HIGH]

**Trigger:** Cloud Tasks queue (asynchronous)  
**Technology:** Cloud Function + Pub/Sub + Cloud Tasks  
**Frequency:** Real-time delivery, queued  
**Target Week:** Week 5-6

**Workflow:**
```yaml
Trigger Sources:
  1. Parent created → Send welcome SMS + email
  2. Student marked absent → Send SMS to parent (configurable channels)
  3. Fee invoice generated → Send email with PDF attachment
  4. Payroll processed → Send salary slip email to staff
  
Pub/Sub Topic: "school-erp-notifications"

Processing Pipeline:
  Step 1: Message Publishers (multiple sources)
  ├─ Attendance Cloud Function
  ├─ Invoice Generation Cloud Function
  ├─ Onboarding API endpoint
  └─ Scheduled batch notifications
  
  Step 2: Pub/Sub Topic (buffering, dead-lettering)
  ├─ Stores messages for reliability
  ├─ Retries failed messages
  └─ Dead letter queue for poison messages
  
  Step 3: Notification Cloud Function (subscriber)
  ├─ Pick message from topic
  ├─ Check user preferences: SMS enabled? Email? WhatsApp?
  ├─ For SMS: Call Twilio API
  │  POST /Messages with {to, from, body}
  ├─ For Email: Call SendGrid API
  │  POST /emails with {to, subject, html}
  ├─ For WhatsApp: Call Twilio WhatsApp API
  └─ For Push: Call Firebase Cloud Messaging

Twilio SMS Example:
  Request:
    POST https://api.twilio.com/2010-04-01/Accounts/{ACCOUNT_SID}/Messages.json
    Body: {
      "To": "+919876543210",
      "From": "+919999988888",
      "Body": "Ananya absent today, Class 5A. Reply REPLY_CODE for more info"
    }
  
  Response:
    {
      "sid": "SM187d1f78f4e2a0a81b8a3f7e0a1b2c3d",
      "status": "queued" → "sent" → "delivered" / "failed"
    }

Error Handling:
  ├─ Invalid phone number → reject + log + notify parent
  ├─ Rate limit exceeded → back off 30 seconds
  ├─ Twilio quota exceeded → queue in Cloud Tasks with retry
  ├─ Opt-out user → check preferences, skip
  └─ Wrong channel configured → default to email
  
Retry Logic:
  ├─ Failure → Cloud Tasks retries up to 100 times
  ├─ Exponential backoff: 2s, 5s, 10s, 30s, 60s, 300s
  ├─ Max retry window: 7 days
  └─ After 7 days: move to dead letter + alert ops

SLA:
  ├─ Notification delivered: <30 seconds (target)
  ├─ SMS delivery: <5 seconds (Twilio SLA)
  ├─ Email delivery: <5 minutes
  ├─ WhatsApp: <30 seconds after approval
  └─ Alert: If >1% of notifications fail

Monitoring Dashboard:
  ├─ Sent count (by channel: SMS, Email, WhatsApp, Push)
  ├─ Delivered rate (% of sent actually received)
  ├─ Failed count (with reasons: invalid number, opt-out, error)
  ├─ Cost tracking (Twilio spend per month)
  └─ Latency histogram (P50, P95, P99)

Cost Optimization:
  ├─ Batch emails: Combine multiple notifications into one email
  ├─ Mute redundant notifications: Don't send 100 SMSes for same incident
  ├─ Use cheaper channels: Email < SMS cost
  └─ Estimated cost: ₹5K/month for 100K SMSes + 50K emails
```

---

## 2. NOTIFICATION AUTOMATIONS

### 2.1 **Student Attendance Triggered Notifications** [CRITICAL]

**Trigger:** Attendance marked (POST /attendance/mark)  
**Technology:** Cloud Function (real-time) + Pub/Sub  
**Frequency:** Real-time on each mark  
**Target Week:** Week 5-6

**Workflow:**
```yaml
User Action: Teacher marks "Ananya" as "Absent" for Class 5A

Workflow:
  1. API: POST /schools/{schoolId}/attendance/mark
     Payload: {
       "student_id": "stu_123",
       "date": "2026-04-09",
       "status": "absent", // or "present", "leave"
       "class_id": "class_5a"
     }
  
  2. Cloud Function triggers immediately
     ├─ Check student record: Get parent phone + email
     ├─ Check preferences: Parent opted in for SMS? Yes
     ├─ Calculate attendance %: (Present / Total) × 100 = 75%
     └─ If 75% < threshold (75%): Flag as "at risk"
  
  3. Pub/Sub: Publish "notif.attendance_marked" message
  
  4. Notification Cloud Function:
     ├─ For parent (SMS): "Ananya absent today, Class 5A. Attendance 75%"
     ├─ For teacher (in-app): "Ananya marked absent"
     └─ For principal (dashboard): "Chronic absentee alert: Ananya <75%"

Conditional Logic:
  IF status == "absent" AND attendance_% < 75%:
    ├─ Send urgent SMS to parent (priority)
    ├─ Flag student in dashboard (red)
    └─ Alert principal for follow-up
  
  IF status == "present":
    └─ Silent (no SMS, just update system)
  
  IF status == "leave" AND leave_approved:
    ├─ SMS to parent: "Leave approved for Ananya on 2026-04-09"
    └─ Don't count against attendance

SLA:
  ├─ SMS sent: <10 seconds after mark
  ├─ Dashboard update: <2 seconds
  └─ Alert: If latency >15 seconds

Metrics:
  ├─ Attendance marks processed: 45 students/class × 8K classes = 360K/day
  ├─ SMS sent: 30-50% of marks (only absent + low attendance)
  ├─ Cost: ₹50K/month for SMSes
```

---

### 2.2 **Report Card Generated & Distributed** [HIGH]

**Trigger:** All grades entered + exam completed (batched weekly)  
**Technology:** Cloud Function + Pub/Sub + Email  
**Frequency:** Weekly (every Friday 6pm) + on-demand  
**Target Week:** Week 8-10

**Workflow:**
```yaml
Trigger: Friday 6pm (Cloud Scheduler)

Processing:
  1. Query BigQuery: SELECT * FROM grades WHERE updated_at > last_friday
  2. For each student in report:
     ├─ Calculate: overall % across all subjects
     ├─ Grade: A+ (90-100), A (80-90), B (70-80), C (60-70), D (<60)
     ├─ Promotion: IF overall % >= 50% THEN eligible ELSE needs review
     └─ Attendance: Include attendance % in report
  
  3. Generate PDF report card:
     ├─ Template: Official school report card with letterhead
     ├─ Data: Student name, class, subjects, marks, grade, attendance %
     ├─ Signature: Principal (auto-signed, digital signature)
     └─ Design: Per state board format (CBSE, ICSE, etc.)
  
  4. Store report card:
     ├─ Cloud Storage: gs://school-erp-reports/{school_id}/report_cards/{student_id}_{date}.pdf
     ├─ Firestore: students/{studentId}/report_cards/{date} = {pdf_url, generated_at}
     └─ Keep for download by parent
  
  5. Distribute:
     ├─ Email to parent: Attach PDF report card
     ├─ SMS to parent: "Report card ready. Click link or check app"
     └─ In-app: Display link in parent dashboard
  
  6. For printing:
     ├─ Mark: "Ready for print" in admin dashboard
     ├─ Batch: Teacher prints all 40 students at once
     ├─ Distribution: Teacher gives to students Friday evening

Sample Report Card Email:
  To: parent@email.com
  Subject: "Report Card for Ananya (Class 5A) - Mar 2026"
  Body: "Dear Parents,
         Attached is the report card for Ananya for March 2026.
         Overall Score: 78%
         Grade: B
         Please sign and return to school.
         - Principal"
  Attachment: report_card_ananya_mar2026.pdf

Error Handling:
  ├─ Missing student data → skip, log, alert
  ├─ PDF generation failed → retry up to 3 times
  ├─ Email delivery failed → send SMS instead (fallback)
  └─ Parent email invalid → notify school admin

SLA:
  ├─ Report generation: <1 hour for all students in school
  ├─ Email delivery: <5 minutes after generation
  ├─ Missing data: Alert <15 minutes before scheduled generation
  └─ Latency: P95 < 200ms per student

Metrics:
  ├─ Schools using report card automation: Target 95% by Week 10
  ├─ Report generation time: Average 2 minutes per 500 students
  ├─ Email delivery success rate: >98%
  └─ Cost: ₹2K/month (PDF generation + email)
```

---

## 3. BUSINESS PROCESS AUTOMATIONS

### 3.1 **Automatic Promotion/Retention Logic** [CRITICAL]

**Trigger:** Annual exam completed + all grades entered (June)  
**Technology:** Cloud Function + BigQuery + Firestore  
**Frequency:** Once per year (at end of academic year)  
**Target Week:** Week 10-12

**Workflow:**
```yaml
Trigger: June 30 (end of academic year) - Manual trigger by Principal

Processing:
  1. Query BigQuery: SELECT student_id, overall_score FROM grades WHERE academic_year = 2026
  
  2. For each student:
     ├─ Calculate: Promotion score per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)
     ├─ Rule: IF overall % >= 50% & attendance >= 75% THEN eligible for promotion
     ├─ IF overall % < 50% & attendance < 75% THEN recommend retention
     ├─ Flag for principal review: Borderline cases (48-52%)
     └─ Result: {student_id, action, score, attendance, notes}
  
  3. Firestore Update: students/{studentId}/promotion_2026 = {action, score, notes, status: "pending_approval"}
  
  4. Principal Portal:
     ├─ Dashboard: "Promotion Review" with list of students
     ├─ Green (auto-promote): 89% of students
     ├─ Yellow (review needed): 10% of students (borderline)
     ├─ Red (retention): 1% of students
     └─ Principal click: Approve or override for each

  5. Batch Update:
     ├─ Once principal approves all:
     ├─ Update students: students/{studentId}/current_class = next_class
     ├─ Archive grades: Move to historical table
     ├─ Update class rosters
     └─ Generate promotion certificates (for printing)

Sample Promotion Rule (per [14_BUSINESS_RULES_ENGINE.md](14_BUSINESS_RULES_ENGINE.md)):
  ```
  Class 1-5:
    ├─ Promotion: Overall score >= 50% & Attendance >= 75%
    ├─ With condition: English >= 40%, Math >= 40%, Science >= 40%
    └─ OR: Principal discretion for borderline cases
  
  Class 6-10:
    ├─ Promotion: Overall score >= 50% & Attendance >= 75%
    ├─ By subject: NO subject <40%
    ├─ Exam: Board exam (10th) required for promotion
    └─ OR: Additional classes for 3 weak subjects
  ```

Error Handling:
  ├─ Missing grades for some students → Hold, notify teacher
  ├─ Attendance data incomplete → Mark as "pending attendance review"
  ├─ School holidays not accounted → Add configurable field
  └─ System error → Retry next day, don't proceed until verified

SLA:
  ├─ Promotion calculation: <5 minutes for all students
  ├─ Principal review window: 1 week
  ├─ Final update: Complete before July 15 (before new academic year)
  └─ Alert: If promotion not finalized by July 1

Monitoring:
  ├─ Promotion rate: Should be 95-99% (schools sanity check)
  ├─ Manual overrides: Track % and reasons
  ├─ Time to process: Log performance metrics
  └─ Errors: Any failed automations logged + investigated

Impact:
  ├─ Manual work saved: Principal spends 30-60 minutes instead of 5+ hours
  ├─ Accuracy: 100% rule-based (no human errors)
  ├─ Transparency: All students see decision + reasoning
```

---

### 3.2 **Monthly Payroll Generation & Salary Slip Distribution** [HIGH]

**Trigger:** Cloud Scheduler (28th of each month)  
**Technology:** Cloud Function + Cloud Run Job + PDF generation  
**Frequency:** Once per month  
**Target Week:** Week 16-18

**Workflow:**
```yaml
Trigger: 28th of each month at 8pm

Processing:
  1. Query database: All staff active for the month
     ├─ Get: Name, salary structure, attendance, deductions
     ├─ Attendance: Staff clock-in/out data for the month
     └─ If absent: Calculate salary reduction (per school policy)

  2. For each staff member, calculate:
     ├─ Gross = Basic + HRA + DA + Other allowances
     ├─ Attendance deduction = (Absent days / Total days) × (Gross / 30)
     ├─ PF = Gross × 12% (for eligible staff)
     ├─ Income Tax = Calculate per IT slab
     ├─ ESI = Gross × 0.75% (if applicable)
     ├─ Other deductions = Insurance, loans, etc.
     └─ Net = Gross - PF - IT - ESI - Other deductions

  3. Generate Salary Slip PDF:
     ├─ Template: Standardized salary slip
     ├─ Data: Staff name, salary details, deductions, net
     ├─ Company seal: Digital signature from admin
     └─ Store: Cloud Storage gs://school-erp/payroll/{staff_id}_{month}.pdf

  4. Update Firestore:
     ├─ payroll/{monthYear}/{staffId} = {gross, deductions, net, slip_url}
     ├─ Staff can view: In app under "My Payslips"
     └─ Historical: Keep all payroll records for audit

  5. Distribute:
     ├─ Email to each staff: Attach PDF salary slip
     ├─ SMS: "Salary credited for {month}. See slip in app"
     ├─ In-app: Download link available
     └─ HR admin: Export summary for bank transfer batch

  6. End of month reports:
     ├─ Total payroll cost: ₹X lakhs
     ├─ PF to deposit: ₹Y
     ├─ IT to deposit: ₹Z
     ├─ Bank: Generate payment file (automated)
     └─ Compliance: Generate IT/ESI/PF filings

Sample Salary Slip:
  ```
  SALARY SLIP - APRIL 2026
  Staff: Raj Kumar
  Position: Math Teacher
  
  EARNINGS:
    Basic: ₹30,000
    HRA: ₹6,000
    DA: ₹3,000
    Other: ₹1,000
    Gross: ₹40,000
  
  DEDUCTIONS:
    PF: ₹4,800
    Income Tax: ₹2,500
    ESI: ₹300
    Loan: ₹500
    Total Deductions: ₹8,100
  
  NET SALARY: ₹31,900
  ```

Error Handling:
  ├─ Staff with >20 absent days → Manual review required
  ├─ Salary structure changed mid-month → Use prorated calculation
  ├─ Email delivery failed → Alert HR, send SMS instead
  └─ Calculation mismatch → Flag for finance team review

SLA:
  ├─ Salary slip generated: <30 minutes for all staff
  ├─ Email sent: <1 hour after generation
  ├─ Bank payment file ready: By end of 28th
  └─ Compliance report: By 5th of next month

Monitoring:
  ├─ Payroll processed: Count staff processed, count errors
  ├─ Cost: Track total payroll spend per month
  ├─ Email delivery: Track success % and failures
  ├─ Late payroll: Alert if not processed by 28th
  └─ Deviations: Flag any unusual salary changes

Compliance & Audit:
  ├─ Monthly filing: PF contribution statement
  ├─ Quarterly: IT TDS filing
  ├─ ESI: Monthly contribution tracking
  ├─ Retention: Keep all records for 7 years (audit compliance)
  └─ Verification: Random monthly audit of calculations
```

---

### 3.3 **Fee Invoice Generation & Late Payment Reminders** [HIGH]

**Trigger:** 1st of each month (automatic) + configured dates per school  
**Technology:** Cloud Function + PDF generation + Pub/Sub  
**Frequency:** Once per month  
**Target Week:** Week 14-16

**Workflow:**
```yaml
Trigger: 1st of month at 6am

Processing:
  1. Query Firestore: All active students in all schools
  
  2. For each school + each student + each class:
     ├─ Get fee structure: Class 5 fees = {class_fee, book_fee, transport_fee, ...}
     ├─ Apply multipliers: Sibling discount (10%), Scholarship (50%), etc.
     ├─ Calculate: Total fee for the month
     ├─ Check: Already paid? (Don't generate duplicate)
     ├─ Status: New, Due, Overdue
     └─ Due date: 10th of month (configurable per school)
  
  3. Generate Invoice PDF:
     ├─ Template: Official school invoice
     ├─ Data: Student name, class, fee items, total, due date
     ├─ School seal: Digital signature
     └─ Store: Cloud Storage
  
  4. Firestore: Create invoice document
     ├─ invoices/{schoolId}/{studentId}/{monthYear}
     ├─ Data: {student, amount, due_date, status: "unpaid", pdf_url}
     └─ Track: Payment received, late payment flags
  
  5. Send to parent:
     ├─ Email: Invoice PDF attached
     ├─ SMS: "Fee due by 10th, amount ₹3,000"
     └─ In-app: View + pay button in parent portal

  6. Late payment automated reminders:
     ├─ Day 11: SMS reminder (1 day late)
     ├─ Day 16: Email + SMS reminder (6 days late)
     ├─ Day 21: Escalation email to principal + parent SMS
     ├─ Day 30: Report to principal, block access if configured
     └─ Customize: Each school can set reminder schedule

Sample Late Payment Workflow:
  Day 1: Invoice generate + send
    └─ Parent sees in app + receives email + SMS
  
  Day 11 (1 day late):
    ├─ SMSJob triggers: "Your fee payment is overdue by 1 day"
    ├─ Status: OVERDUE (1 day)
    └─ Parent portal: Red "OVERDUE" badge
  
  Day 16 (6 days late):
    ├─ EmailJob triggers: "Your son's fee is overdue. Please pay immediately"
    ├─ attach: Invoice + school contact info
    ├─ Copy: Principal + accountant
    └─ Status: OVERDUE (6 days)
  
  Day 21 (16 days late):
    ├─ Escalation: Email to Principal + SMS to parent
    ├─ Message: "Student access may be blocked after 30 days"
    ├─ Action: Principal reviews + decides: block or extend
    └─ Status: ESCALATED

  Day 30 (30 days late):
    ├─ Action: Based on school policy
    ├─ IF block_student = true:
    │   └─ Student cannot mark attendance / submit assignments
    ├─ IF block_student = false:
    │   └─ Report goes to principal, continue reminders monthly
    └─ SMS: "Final notice. Contact principal for payment extension"

Error Handling:
  ├─ Fee structure missing for class → Skip, notify admin
  ├─ Student duplicate in system → Consolidate before invoice
  ├─ Payment partially applied → Update balance, adjust next month
  ├─ Scholarship amount incorrect → Flag for finance review
  └─ Email/SMS failed → Retry next day, mark for manual follow-up

SLA:
  ├─ Invoice generation: <10 minutes for all schools
  ├─ Email delivery: <1 hour after generation
  ├─ Late reminders: Automated, zero manual intervention
  └─ collection tracking: Real-time dashboard showing % collected

Monitoring Dashboard:
  ├─ Total fee generated: ₹X lakhs per month
  ├─ Collection rate: Y% (target >90%)
  ├─ Outstanding: ₹Z (>30 days late)
  ├─ Payment method breakdown: Razorpay (X%), Cash (Y%), Check (Z%)
  ├─ Email delivery success: % of invoices delivered
  ├─ Late payment trends: Which parents, which months?
  └─ Cost: Notification cost ₹3K/month

Reconciliation Job (daily):
  ├─ Query Razorpay: Payments received today
  ├─ Match to invoices: Reduce balance
  ├─ Mark invoice: Paid (with date, amount, method)
  ├─ Update parent dashboard: "Payment received, thank you"
  └─ Issue receipt: Email + SMS to parent
```

---

## 4. COMPLIANCE & MONITORING AUTOMATIONS

### 4.1 **Audit Log & Data Lineage Tracking** [CRITICAL]

**Trigger:** Every data write operation (automatic)  
**Technology:** Cloud Function (interceptor pattern) + BigQuery  
**Frequency:** Real-time  
**Target Week:** Week 2 (from Day 1)

**Workflow:**
```yaml
Trigger: Any Firestore write (create, update, delete)

Processing:
  1. Before operation: Interceptor middleware logs:
     ├─ Operation: What changed (old value → new value)
     ├─ User: Who performed action (user_id, email)
     ├─ Timestamp: When (ISO format with timezone)
     ├─ Resource: What entity (collection, document ID)
     └─ Reason: Why (e.g., "manually corrected attendance")
  
  2. Publish to Pub/Sub: "audit_logs" topic
  
  3. BigQuery ingestion:
     ├─ Table: audit_logs
     ├─ Each row: {timestamp, user_id, action, resource, change_old, change_new, reason}
     └─ Partition: By timestamp (daily)
  
  4. Examples:

   🔍 Example 1: Teacher marks attendance
     Time: 2026-04-09 09:00:00Z
     User: teacher_001 (Raj Kumar)
     Action: UPDATE
     Resource: schools/sch_001/attendance/2026-04-09
     Change: {student: "Ananya", status: "present"}
     Reason: "Marked present after verification"
   
   🔍 Example 2: Admin corrects student grade
     Time: 2026-04-09 10:30:00Z
     User: admin_001 (Principal)
     Action: UPDATE
     Resource: schools/sch_001/grades/student_123/math
     Change: {old_score: 45, new_score: 78}
     Reason: "Corrected data entry error, verified with exam paper"
   
   🔍 Example 3: Delete attendance (rare)
     Time: 2026-04-09 14:00:00Z
     User: admin_001 (Principal)
     Action: DELETE
     Resource: schools/sch_001/attendance/2026-04-08
     Change: {deleted_data: {student: "Ananya", status: "absent"}}
     Reason: "Duplicate entry, already marked in attendance sheet"

SLA:
  ├─ Log written: <100ms after operation
  ├─ BigQuery ingestion: <5 seconds
  └─ Query audit logs: <2 seconds for historical lookup

Queries Available:
  ├─ Who changed student X on date Y?
  ├─ Show all changes to grades for Class 5A in March
  ├─ Audit trail for fee payment: Who changed payment status?
  ├─ Export compliance report: All sensitive data access for GDPR
  └─ Detect: Unusual patterns (e.g., 100 grade corrections in 1 hour)

Monitoring:
  ├─ Audit logs ingestion: <0.1% failure rate
  ├─ Query performance: Alert if query >5 seconds
  ├─ Retention: Keep for 7 years (legal compliance)
  ├─ Cost: ~₹2K/month for audit log storage + queries
  └─ Alert: Suspicious activity detected (flagged pattern)
```

---

### 4.2 **Automated Backup & Disaster Recovery Validation** [CRITICAL]

**Trigger:** Cloud Scheduler (daily 2am) + Weekly restore test (Sunday 3am)  
**Technology:** Cloud Run + Firestore Backup & Restore  
**Frequency:** Daily + weekly test restore  
**Target Week:** Week 1-2

**Workflow:**
```yaml
Daily Backup (2am UTC):
  Process:
    1. Cloud Scheduler triggers: "backup_job"
    2. Cloud Run job starts: Export entire Firestore to BigQuery + Cloud Storage
    3. Compression: gzip format, reduce size 70%
    4. Encrypt: GCP-managed encryption
    5. Versioning: Keep 30 days rolling
    6. Notification: Slack with backup size, duration, status
  
  SLA:
    ├─ Backup time: <15 minutes
    ├─ Backup size: Log and trend
    ├─ Verification: Checksum validation
    └─ Alert: If backup fails or exceeds time limit

Weekly Restore Test (Sunday 3am):
  Process:
    1. Automated restore to staging environment
    2. Run validation queries: 
       ├─ Count records in each collection
       ├─ Verify data integrity (no nulls in required fields)
       ├─ Check timestamps (ordered correctly)
       └─ Compare with production (should match)
    3. Generate report: Restore successful? Any data issues?
    4. Alert: If restore fails or data mismatch detected
  
  Incident Restore Procedure:
    IF production incident occurs:
    ├─ 1. Ops team clicks "Restore from backup" in dashboard
    ├─ 2. Select backup date (e.g., "Before corrupted data")
    ├─ 3. System validates: "Restore will lose X hours of data. Proceed?"
    ├─ 4. Confirm: Restore begins
    ├─ 5. Monitoring: Show progress bar
    ├─ 6. Verify: Auto-run validation queries
    ├─ 7. Complete: Firestore restored, production back online
    └─ 8. Plan: What caused incident? How to prevent?
  
  RTO/RPO:
    ├─ RTO (Recovery Time Objective): <1 hour
    ├─ RPO (Recovery Point Objective): <24 hours
    └─ Alert: If RTO/RPO SLA at risk
```

---

### 4.3 **Performance Monitoring & Alert Generation** [HIGH]

**Trigger:** Continuous (real-time metrics collection)  
**Technology:** Cloud Monitoring (Stackdriver) + Custom metrics  
**Frequency:** Every minute  
**Target Week:** Week 2 (live throughout)

**Workflow:**
```yaml
Metrics Collected (per [12_MONITORING_OBSERVABILITY.md](12_MONITORING_OBSERVABILITY.md)):

1. API Performance:
   ├─ Latency: P50, P95, P99 per endpoint
   ├─ Error rate: % of requests returning 4xx/5xx
   ├─ Throughput: Requests per second
   └─ Alert threshold: Latency P95 > 500ms

2. Database Performance:
   ├─ Firestore read latency: >500ms alert
   ├─ Firestore write latency: >1s alert
   ├─ BigQuery query time: >10s alert
   └─ Quota usage: Alert at 80% of daily quota

3. Infrastructure Health:
   ├─ Cloud Run CPU: >80% alert
   ├─ Cloud Run memory: >85% alert
   ├─ Cloud Run errors: >1% alert
   └─ Disk space: >80% full alert

4. Application Errors:
   ├─ 500 errors: >5 in 1 minute alert
   ├─ Uncaught exceptions: Any alert
   ├─ Dead letter queue: Messages stuck alert
   └─ Failed Cloud Functions: Alert

Alert Rules:
  Rule 1: High API latency
  ├─ Condition: P95 latency > 500ms for >5 minutes
  ├─ Action: Alert Ops team + log metrics
  ├─ Investigate: Check CPU, database load
  └─ Scale: Trigger auto-scaling if load high
  
  Rule 2: High error rate
  ├─ Condition: Error rate > 1% for >2 minutes
  ├─ Action: Alert Ops + send Slack notification
  ├─ Investigation: Check logs for error patterns
  └─ Rollback: If recent deployment, rollback option

Alerting Channels:
  ├─ Slack: Real-time notifications #ops-alerts
  ├─ PagerDuty: Page on-call engineer if critical
  ├─ Email: Digest of alerts every hour
  ├─ SMS: P0 critical alerts (only)
  └─ Dashboard: Live dashboard always visible

Dashboard Views:
  ├─ System Health: Overall green/yellow/red status
  ├─ Latency trends: Per endpoint over time
  ├─ Error rate: By error type
  ├─ Load: Traffic volume, concurrent users
  └─ Cost: Cloud spend tracking
```

---

## 5. SYSTEM MAINTENANCE AUTOMATIONS

### 5.1 **Database Cleanup & Optimization** [MEDIUM]

**Trigger:** Cloud Scheduler (weekly Thursday 10pm)  
**Technology:** Cloud Function + BigQuery  
**Frequency:** Weekly  
**Target Week:** Week 3

**Workflow:**
```yaml
Weekly Cleanup Job (Thursday 10pm):
  
  Task 1: Delete expired sessions
  ├─ Query: SELECT * FROM sessions WHERE expires_at < NOW() - 7 days
  ├─ Action: DELETE (archived old sessions)
  ├─ Expected deletion: ~10K sessions
  └─ Alert: If deletion fails
  
  Task 2: Compact audit logs (archive old)
  ├─ Query: SELECT * FROM audit_logs WHERE created_at < NOW() - 90 days
  ├─ Action: Archive to Cloud Storage (cheaper storage)
  ├─ Delete from Firestore: Free up storage
  ├─ Expected archival: ~100M audit log entries
  └─ Cost optimized: 90% storage cost reduction for old logs
  
  Task 3: Denormalization refresh
  ├─ Recalculate: Attendance %, grade averages stored in denormalized fields
  ├─ Purpose: Faster queries (live dashboards)
  ├─ Update frequency: Weekly (not needed real-time)
  ├─ Example: students/{id}/cached_attendance_percent = 85%
  └─ Verify: Matches calculated on-the-fly (sanity check)
  
  Task 4: Index optimization
  ├─ Analyze: BigQuery query performance with EXPLAIN plan
  ├─ Action: Add composite indexes if identified
  ├─ Example: CREATE INDEX idx_school_date ON attendance(school_id, date)
  └─ Monitor: Index usage, unused indexes flagged for deletion
  
  Task 5: Data validation
  ├─ Consistency checks: No orphaned records (student has class assignment)
  ├─ Integrity checks: Foreign keys valid
  ├─ Business rule checks: All grades 0-100, not invalid values
  ├─ Alert: If any issues found, log + notify admin
  └─ Recovery: Automated cleanup or manual review needed

SLA:
  ├─ Cleanup time: <30 minutes for all tasks
  ├─ No production impact: Run during off-peak (10pm)
  ├─ Verification: Confirm data integrity post-cleanup
  └─ Cost saved: ~₹5K/month storage optimization

Monitoring:
  ├─ Records deleted per week
  ├─ Storage freed
  ├─ Performance improvement (if any)
  ├─ Errors: Log all, alert ops
  └─ Trend: Track cleanup metrics over time
```

---

### 5.2 **Cost Optimization Monitoring** [MEDIUM]

**Trigger:** Cloud Scheduler (daily 5am)  
**Technology:** Cloud Functions + Cloud Monitoring  
**Frequency:** Daily report  
**Target Week:** Week 2

**Workflow:**
```yaml
Daily Cost Analysis (5am UTC):
  
  Metrics Tracked:
  ├─ Firestore:
  │   ├─ Read operations: ₹0.06 per 100K reads
  │   ├─ Write operations: ₹0.18 per 100K writes
  │   ├─ Delete operations: ₹0.02 per 100K deletes
  │   └─ Estimated monthly: ₹X
  │
  ├─ Cloud Functions:
  │   ├─ Invocations: ₹0.40 per 1M calls
  │   ├─ Compute time: ₹0.0000166667 per GB-second
  │   └─ Estimated monthly: ₹Y
  │
  ├─ Cloud Run:
  │   ├─ vCPU: ₹0.0000247 per vCPU-second
  │   ├─ Memory: ₹0.0000050 per GB-second
  │   ├─ Requests: First 2M free, then ₹0.40 per 1M
  │   └─ Estimated monthly: ₹Z
  │
  ├─ Cloud Storage:
  │   ├─ Storage: ₹0.016 per GB per month
  │   ├─ Egress: ₹0 intrazonal, ₹0.01-0.12 internet
  │   └─ Estimated monthly: ₹W
  │
  ├─ BigQuery:
  │   ├─ Queries: ₹0.005 per GB scanned (after 1TB free)
  │   ├─ Storage: ₹0.014 per GB per month
  │   └─ Estimated monthly: ₹V
  │
  └─ Total Estimated Monthly: ₹(X+Y+Z+W+V)

Optimization Actions:
  ├─ IF query cost > budget:
  │   └─ Action: Recommend materialized views to reduce scans
  │
  ├─ IF storage growing >10% weekly:
  │   └─ Action: Suggest archival strategy
  │
  ├─ IF Firestore exceeds quota:
  │   └─ Action: Alert ops, may need to scale up (review with PM)
  │
  └─ IF unused resources detected:
  │   └─ Action: Flag for deletion (unused tables, indices, etc.)

Reports:
  ├─ Daily summary: Email to finance team
  ├─ Weekly breakdown: Cost by service
  ├─ Monthly forecast: Projected spend if trends continue
  ├─ YoY comparison: Cost per school trends
  └─ Optimization recommendations: Actions to save money
  
Target Cost (per school):
  ├─ Small school (100 students): ~₹500/month
  ├─ Medium school (500 students): ~₹2K/month
  ├─ Large school (2000 students): ~₹6K/month
  └─ Alert: If actual > target by >20%
```

---

## 6. AUTOMATION IMPLEMENTATION ROADMAP

### Phase 1: Weeks 1-4 (Foundation)
```
Week 1:
├─ Firestore → BigQuery real-time sync [CRITICAL]
├─ Daily Firestore backups to Cloud Storage [CRITICAL]
├─ Audit log tracking on all writes [CRITICAL]
└─ Infrastructure monitoring + alerts [HIGH]

Week 2-3:
├─ API performance monitoring + alerting [HIGH]
├─ Cost tracking dashboard [MEDIUM]
└─ Database cleanup automation [MEDIUM]

Week 4:
├─ Pre-commit hooks (ESLint/Prettier) automation [MEDIUM]
└─ CI/CD pipeline testing automation [HIGH]
```

### Phase 2: Weeks 5-12 (Business Workflows)
```
Week 5-6:
├─ Student absence notifications (SMS → parents) [CRITICAL]
├─ Pub/Sub + Cloud Tasks routing [HIGH]
└─ Twilio SMS integration + retries [HIGH]

Week 8-10:
├─ Report card PDF generation + distribution [HIGH]
└─ Weekly scheduled report generation [HIGH]

Week 10-12:
├─ End-of-year promotion/retention automation [CRITICAL]
└─ Exam result publishing automation [HIGH]
```

### Phase 3: Weeks 13-18 (Operations)
```
Week 13-14:
├─ Announcement broadcast (SMS + Email + WhatsApp) [HIGH]
└─ Notification delivery retry + tracking [HIGH]

Week 14-16:
├─ Monthly invoice generation + distribution [HIGH]
├─ Late payment reminders (automated escalation) [HIGH]
└─ Razorpay payment sync [HIGH]

Week 16-18:
├─ Monthly payroll generation [HIGH]
├─ Salary slip PDF + email distribution [HIGH]
└─ Compliance reports (IT/ESI/PF filing) [MEDIUM]
```

### Phase 4: Weeks 19-24 (Intelligence & Polish)
```
Week 19-20:
├─ BigQuery daily dashboard refresh [HIGH]
├─ Automated data quality checks [MEDIUM]
└─ Principal dashboard auto-update [HIGH]

Week 20-22:
├─ Performance optimization triggers [MEDIUM]
├─ Cost optimization recommendations [MEDIUM]
└─ Weekly cleanup + maintenance jobs [MEDIUM]

Week 22-24:
├─ End-to-end automation testing [HIGH]
├─ Disaster recovery drill execution [CRITICAL]
└─ Launch automation monitoring [CRITICAL]
```

---

## 7. AUTOMATION MONITORING & METRICS

### Key Metrics to Track

```yaml
Reliability:
  ├─ Automation success rate: Target >99.5%
  ├─ Error rate: Target <0.5%
  ├─ Recovery time: Alert if >1 minute
  └─ SLA breach: Track frequency + root cause

Performance:
  ├─ Latency: Track P50, P95, P99
  ├─ Throughput: Operations per second
  ├─ Cost per operation: Optimize over time
  └─ Resource utilization: CPU, memory, network

Business Impact:
  ├─ Manual work eliminated: Hours saved per week
  ├─ Data accuracy: % of data without errors
  ├─ Time-to-value: How fast operations complete
  ├─ User satisfaction: NPS score improvement
  └─ Cost savings: Compared to manual process

Operational Health:
  ├─ Uptime: Target >99.9%
  ├─ Incident frequency: Trends over time
  ├─ Mean time to recovery (MTTR): Alert if >30 min
  ├─ Mean time between failures (MTBF): Track improvements
  └─ Alert accuracy: False positive rate <5%
```

### Dashboards

```yaml
Real-Time Dashboard (visible to ops 24/7):
  ├─ All automations: Status (✓ Running, ⚠ Issues, ✗ Failed)
  ├─ Latency heatmap: Color-coded by performance
  ├─ Error dashboard: Current errors + trending
  ├─ Alert status: Active alerts with severity
  └─ Cost today: Real-time spend tracking

Weekly Summary Report:
  ├─ Automations run: Count + success %
  ├─ Errors this week: Categorized by severity
  ├─ Performance improvements: Highlights
  ├─ Cost trends: Compared to last week
  └─ Recommendations: Optimizations needed
```

---

## 8. ERROR HANDLING & RESILIENCE

### Retry Strategies

```yaml
Transient Errors (retry):
  ├─ Network timeout: Exponential backoff 1s, 2s, 4s, 8s, 16s
  ├─ Rate limit exceeded: Back off 60s before retry
  ├─ Temporary service unavailable: Retry up to 5 times
  └─ Database lock: Retry with jitter (avoid thundering herd)

Permanent Errors (don't retry):
  ├─ Invalid request format: Log + alert, don't retry
  ├─ Invalid API key: Fix configuration, don't retry
  ├─ Data validation failed: Log + dead letter queue
  └─ Permission denied: Escalate to security team

Dead Letter Queue:
  ├─ Failed messages queued for manual review
  ├─ Ops engineer investigates: Why did it fail?
  ├─ Can be replayed: Once issue fixed
  └─ Monitoring: Alert if >100 messages in DLQ
```

---

## 9. SECURITY CONSIDERATIONS

### Data Protection in Automations

```yaml
Sensitive Data Handling:
  ├─ PII (student name, email): Encrypted at rest + transit
  ├─ Payment info: Tokenized (never stored), PCI compliance
  ├─ Medical data: If stored, HIPAA compliance
  └─ Audit trail: Access logs for all sensitive operations

Service Account Permissions:
  ├─ Least privilege: Each automation has minimal permissions
  ├─ Example: SMS automation can only read from students {phone}
  ├─ Example: Report generation can only read grades (no write)
  └─ Monitoring: Track service account permission usage

Webhook Security (Razorpay, Twilio):
  ├─ Signature verification: Verify sender (not spoofed)
  ├─ Rate limiting: Prevent brute force
  ├─ HTTPS only: Encrypted transport
  └─ Timeout: Resolve within 5 seconds (prevent hanging)
```

---

## 10. COST ESTIMATION

### Monthly Automation Costs

```yaml
Breakdown by Service:

Cloud Functions (automations):
  ├─ ~100 function executions daily
  ├─ Average 10s execution time
  ├─ 2GB memory allocation
  ├─ Cost: ~₹4,000/month

Pub/Sub (message queue):
  ├─ ~500K messages/month
  ├─ Cost: ~₹500/month

Cloud Tasks (retry queue):
  ├─ ~10K tasks/month
  ├─ Cost: ~₹200/month

Cloud Storage (backups):
  ├─ ~100GB/month storage
  ├─ Cost: ~₹1,600/month

BigQuery (data warehouse):
  ├─ 1GB queries daily × 30 days = 30GB scanned
  ├─ Cost: ~₹300/month (after 1TB free tier)

Gmail/SendGrid (email):
  ├─ ~50K emails/month
  ├─ Cost: ~₹2,000/month

Twilio (SMS):
  ├─ ~500K SMSes/month at ₹0.75 each
  ├─ Cost: ~₹37,500/month (varies by volume)

Total Estimated: ₹46,000/month (~$550/month)

Per-School Cost (average):
  ├─ 50 schools × ₹46K = ₹2.3M total
  ├─ Per school: ₹46K / 50 = ₹920/month
  ├─ Included in SaaS pricing: ₹20-80K/year per school
  └─ ROI: 1-2 years (automation saves manual work worth ₹5-10K/month per school)
```

---

## SUMMARY: FULL AUTOMATION COVERAGE

✅ **Automated Workflows (Weeks 1-24):**

| Workflow | Trigger | Tech | Week | Status |
|---|---|---|---|---|
| Firestore → BigQuery sync | Real-time write | Cloud Function | 2-3 | CRITICAL |
| Daily backups | Scheduled 2am | Cloud Function | 1-2 | CRITICAL |
| Audit logging | Every write | Middleware | 1 | CRITICAL |
| Absence notifications | Mark attendance | Pub/Sub + SMS | 5-6 | CRITICAL |
| Report cards | Weekly Friday | PDF + Email | 8-10 | HIGH |
| Promotion logic | Annual exam | BigQuery + Firestore | 10-12 | HIGH |
| Invoice generation | Monthly 1st | PDF + Email | 14 | HIGH |
| Late payment reminders | Scheduled per school | SMS + Email | 14-16 | HIGH |
| Payroll processing | Monthly 28th | PDF + Email | 16-18 | HIGH |
| Performance monitoring | Continuous | Cloud Monitoring | 2 | CRITICAL |
| Cost optimization | Daily 5am | Query analysis | 2-3 | MEDIUM |
| Database cleanup | Weekly Thu | Queries | 3 | MEDIUM |

**Result:** Zero manual data entry after week 1. All business processes automated. Human focus on exceptions & value-add activities.

---

## NEXT STEPS

1. **Week 1:** Implement Firestore → BigQuery sync + backups + monitoring
2. **Week 2:** Add Audit logging + cost tracking
3. **Weeks 3-4:** Implement CI/CD + database maintenance automations
4. **Weeks 5-24:** Add business process automations per roadmap

**Success Metric:** By Week 24, >95% of workflows automated, <5% manual intervention required.
