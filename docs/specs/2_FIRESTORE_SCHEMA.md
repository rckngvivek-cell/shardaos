# FIRESTORE SCHEMA - Detailed Production Design
## Complete Database Structure with Indexes, Constraints & Optimization

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Production-Ready  

---

# TABLE OF CONTENTS
1. Database Structure Overview
2. Complete Collection Schemas
3. Index Strategy
4. Security Rules Requirements
5. Data Types & Constraints
6. Capacity Planning

---

# SECTION 1: DATABASE STRUCTURE OVERVIEW

## Multi-Tenant Architecture
```
Root Collections (global):
├── schools/              (all school metadata)
├── users/                (user accounts across all schools)
├── audit_log/            (system-wide audit trail)
└── feature_flags/        (feature toggles)

School-scoped (each school has own):
└── schools/{schoolId}/
    ├── students/         (all students in school)
    ├── classes/          (class definitions)
    ├── staff/            (teachers & admin)
    ├── attendance/       (daily attendance records)
    ├── assessments/      (tests, quizzes, exams)
    ├── marks/            (student marks per assessment)
    ├── exams/            (exam definitions)
    ├── fees/             (billing & invoices)
    ├── communications/   (SMS, email logs)
    └── metadata/         (school config, settings)
```

---

# SECTION 2: COMPLETE COLLECTION SCHEMAS

## Collection 1: schools/

```firestore
schools/{schoolId}
├── name: string (required, indexed)
│   Example: "Delhi Public School, Mumbai"
│
├── email: string (required, unique across schools, indexed)
│   Example: "principal@dpsmumbai.edu.in"
│
├── phone: string (required)
│   Example: "+91-22-12345678"
│   Constraint: Matches regex: ^\+?[0-9]{10,15}$
│
├── city: string (required, indexed)
│   Example: "Mumbai"
│
├── state: string (required, indexed)
│   Example: "Maharashtra"
│
├── address: object
│   ├── street: string
│   ├── zipCode: string
│   └── country: string
│
├── principal: object
│   ├── name: string (required)
│   ├── email: string (required)
│   ├── phone: string (required)
│   └── uid: string (reference to users/{uid})
│
├── subscription: object
│   ├── tier: enum ["free", "basic", "premium", "enterprise"]
│   ├── status: enum ["active", "paused", "cancelled"]
│   ├── monthlyFee: number (required)
│   │   Values: Free=0, Basic=20000, Premium=60000, Enterprise=custom
│   ├── nextBillingDate: timestamp
│   ├── billingEmail: string
│   └── cancellationDate: timestamp (null if active)
│
├── features: array[string] (enabled modules)
│   Example: ["students", "attendance", "exams", "fees", "communication"]
│   Valid values: All 8 modules
│
├── settings: object
│   ├── timezone: string (required)
│   │   Example: "Asia/Kolkata"
│   ├── language: enum ["en", "hi", "ta", "te", "kn"]
│   ├── academicYear: string
│   │   Format: "2025-2026"
│   │   Constraint: YYYY-YYYY format
│   ├── theme: enum ["light", "dark"]
│   ├── dailyNotificationTime: string
│   │   Format: "HH:MM" (24-hour)
│   └── adminApprovalRequired: boolean (for marks entry)
│
├── metadata: object
│   ├── studentCount: number (cached, updated daily)
│   ├── staffCount: number
│   ├── createdAt: timestamp (server timestamp, indexed)
│   ├── updatedAt: timestamp (server timestamp)
│   ├── lastLoginAt: timestamp
│   ├── lastActiveDate: timestamp
│   └── provider: string (who setup the school: "founder_manual", "web_signup")
│
├── billing: object
│   ├── totalInvoices: number
│   ├── totalDue: number (in paise)
│   ├── totalPaid: number (in paise)
│   └── lastPaymentDate: timestamp
│
└── status: enum ["pending_approval", "active", "suspended", "cancelled"]
    (indexed for founder dashboard)

Indexes Required:
1. Single: { status, createdAt }
2. Single: { city }
3. Single: { state }
4. Composite: { subscription.status, subscription.nextBillingDate }
5. Composite: { metadata.lastActiveDate } (for churn detection)
```

## Collection 2: schools/{schoolId}/students/

```firestore
students/{studentId}
├── firstName: string (required)
├── middleName: string (optional)
├── lastName: string (required)
├── displayName: string (computed: firstName + lastName, indexed)
│
├── dob: date (required, indexed)
│   Constraint: Must be between 1 Jan 1990 and today
│   Used for: Age calculation, eligibility
│
├── gender: enum ["M", "F", "O"]
│
├── aadhar: string (optional, encrypted, unique per school, indexed)
│   Constraint: 12-digit number
│   Encryption: Use Cloud KMS
│   Note: Do NOT store without encryption
│
├── rollNumber: string (required, unique per school & class)
│   Example: "12501"
│   Constraint: Numeric or alphanumeric per school choice
│
├── academic: object
│   ├── class: number (required, indexed)
│   │   Values: 1-12
│   ├── section: string (required, indexed)
│   │   Example: "A", "B", "C"
│   ├── enrollmentDate: date (required)
│   ├── promotionDate: date (optional)
│   └── currentGPA: number (calculated, range: 0-4.0, updated daily)
│
├── status: enum ["active", "inactive", "transferred", "left"] (indexed)
│   Default: "active"
│
├── contact: object
│   ├── parentName: string (required)
│   ├── parentEmail: string (indexed)
│   ├── parentPhone: string (required, indexed, for SMS)
│   │   Constraint: ^\+?[0-9]{10,15}$
│   ├── emergencyContact: string
│   └── emergencyContactName: string
│
├── address: object
│   ├── street: string
│   ├── city: string
│   ├── state: string
│   ├── zipCode: string
│   └── country: string
│
├── medicalInfo: object
│   ├── bloodGroup: enum ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
│   ├── allergies: string (free text)
│   └── chronicConditions: string
│
├── documents: object
│   ├── birthCertificate: string (Cloud Storage path)
│   ├── aadharCopy: string (encrypted path)
│   ├── parentIdProof: string (path)
│   └── transferCertificate: string (path)
│
├── siblings: array[string]
│   Example: ["std_dps_001_xyz", "std_dps_001_abc"]
│   Used for: Family linking, fee discounts
│
├── metadata: object
│   ├── createdAt: timestamp (indexed)
│   ├── updatedAt: timestamp
│   ├── createdBy: string (user UID)
│   └── lastUpdatedBy: string (user UID)
│
└── syncStatus: enum ["synced", "pending", "failed"]
    (for offline sync tracking)

Indexes Required:
1. Single: { displayName }
2. Single: { enrollmentDate }
3. Single: { parentPhone }
4. Composite: { class, section, status }
5. Composite: { class, section, displayName }
```

## Collection 3: schools/{schoolId}/classes/

```firestore
classes/{classId}
├── number: number (required)
│   Values: 1-12
│
├── section: string (required)
│   Example: "A", "B", "C"
│
├── name: string (computed: "Class 5-A", indexed)
│
├── classTeacher: object
│   ├── name: string
│   ├── email: string
│   └── uid: string (reference to users/{uid})
│
├── studentCount: number (cached, updated when student added/removed)
│
├── schedule: object
│   ├── startTime: string (HH:MM)
│   ├── endTime: string (HH:MM)
│   └── workingDays: array[string]
│       Example: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
│
├── subjects: array[object]
│   └── [{
│       name: string (e.g., "Mathematics")
│       code: string (e.g., "MATH")
│       teacherName: string
│       teacherUid: string
│     }]
│
└── metadata: object
    ├── createdAt: timestamp
    └── updatedAt: timestamp

Indexes: Single { number, section }
```

## Collection 4: schools/{schoolId}/staff/

```firestore
staff/{staffId}
├── firstName: string (required)
├── lastName: string (required)
├── displayName: string (computed, indexed)
│
├── email: string (required, unique per school, indexed)
│
├── phone: string (required)
├── dob: date
│
├── role: enum ["principal", "admin", "teacher", "accountant", "exam_coordinator"]
│   (indexed for permission checks)
│
├── designation: string
│   Example: "Math Teacher", "Vice Principal"
│
├── department: string (optional)
│   Example: "Science", "Commerce"
│
├── subjects: array[string] (for teachers)
│   Example: ["Mathematics", "Physics"]
│
├── classes: array[enum]
│   Example: [1, 2, 3] (classes assigned to teacher)
│
├── joinDate: date (required)
│
├── status: enum ["active", "inactive", "on_leave"]
│
├── metadata: object
│   ├── createdAt: timestamp
│   └── updatedAt: timestamp
│
└── uid: string (reference to users/{uid}, indexed)

Indexes:
1. Single: { displayName }
2. Single: { role }
```

## Collection 5: schools/{schoolId}/attendance/

```firestore
attendance/{attendanceId}
├── date: date (required, indexed)
│   Constraint: Cannot be future date
│
├── class: number (required, indexed)
├── section: string (required)
│
├── records: array[object] (up to 200 records per doc, then split)
│   └── [{
│       studentId: string (required, indexed)
│       status: enum ["present", "absent", "leave"]
│       remarks: string (optional)
│     }]
│
├── markedAt: timestamp (server timestamp)
├── markedBy: string (teacher UID)
│
├── syncStatus: enum ["synced", "pending", "failed"]
│   (for offline-first tracking)
│
├── syncAttempts: number
│
└── metadata: object
    ├── totalStudents: number (cached)
    └── updatedAt: timestamp

Indexes:
1. Composite: { date, class, section }
    (Used for: "Get attendance for Class 5-A on 2026-04-08")
2. Single: { date }
3. Single: { class, section }

Performance Note:
- Attendance records grow fastest (~500-1000 docs/month per school)
- Use Firestore subcollections for daily sharding to avoid hotspots
- Consider auto-archiving old attendance to BigQuery after 6 months
```

## Collection 6: schools/{schoolId}/assessments/

```firestore
assessments/{assessmentId}
├── name: string (required, indexed)
│   Example: "Half-Yearly Exam", "Math Quiz 1"
│
├── type: enum ["exam", "quiz", "assignment", "project"]
│   (indexed for filtering)
│
├── class: number (required)
├── section: string
├── subject: string
│
├── totalMarks: number (required)
│   Constraint: > 0
│
├── passingMarks: number
│   Constraint: <= totalMarks
│
├── weightage: number
│   Range: 0-100 (% contribution to final grade)
│
├── date: date (required)
├── dueDate: date
│
├── status: enum ["draft", "active", "locked"]
│   States:
│   - draft: Can edit, marks can be entered/edited
│   - active: Marks entry open, cannot modify assessment
│   - locked: Marks frozen, no changes allowed
│
├── marks: object (embedded or subcollection)
│   ├── submitted: number (count)
│   ├── pending: number (count)
│   └── flags: array[string] (anomalies detected)
│
├── metadata: object
│   ├── createdAt: timestamp
│   ├── createdBy: string
│   └── updatedAt: timestamp
│
└── statistics: object (calculated)
    ├── highestMarks: number
    ├── lowestMarks: number
    ├── averageMarks: number
    └── stdDeviation: number

Indexes:
1. Composite: { class, subject, date }
2. Composite: { status, classArray (for multi-class exams) }
```

## Collection 7: schools/{schoolId}/marks/ (Subcollection under assessments)

```firestore
assessments/{assessmentId}/marks/{studentId}
├── studentId: string (indexed)
├── studentName: string
│
├── obtainedMarks: number (required)
│   Constraint: 0 <= obtainedMarks <= totalMarks
│
├── percentage: number (calculated)
│   Formula: (obtainedMarks / totalMarks) * 100
│
├── grade: string (calculated)
│   Logic: Based on percentage + school's grading scale
│   Examples: "A+", "A", "B+", "B", "C", "D", "F"
│
├── status: enum ["submitted", "under_review", "approved", "flagged"]
│
├── remarks: string (optional)
│   Max length: 500 chars
│
├── anomalyScore: number (0-100)
│   Calculated by AI:
│   - Suspiciously high (vs. student's usual performance)
│   - Suspiciously low (sudden drop)
│   - Outlier (vs. class average)
│   Triggers: If > 75, mark as "flagged" for admin review
│
├── markedAt: timestamp
├── markedBy: string (teacher UID)
│
├── approvedAt: timestamp (nullable)
├── approvedBy: string (admin UID, nullable)
│
├── syncStatus: enum ["synced", "pending"]
│   (for offline-first)
│
└── metadata: object
    ├── attempt: number (in case of resubmission)
    └── previousMarks: number (if edited)

Index: { studentId }
```

## Collection 8: schools/{schoolId}/exams/

```firestore
exams/{examId}
├── name: string (required, indexed)
│   Example: "Quarterly Exam Q1 2025"
│
├── academicYear: string (required, indexed)
│   Format: "2025-2026"
│
├── term: enum ["first", "second", "annual"]
│
├── startDate: date (required)
├── endDate: date (required)
│
├── classes: array[number]
│   Example: [1, 2, 3, 4, 5]
│
├── status: enum ["draft", "active", "locked", "published"]
│   - draft: Can edit, no results shown
│   - active: Marks entry open
│   - locked: No mark changes allowed
│   - published: Results visible to parents
│
├── schedule: array[object] (exam timetable)
│   └── [{
│       date: date
│       class: number
│       section: string
│       subject: string
│       startTime: string (HH:MM)
│       endTime: string (HH:MM)
│       room: string (optional)
│       invigilator: string (teacher UID)
│     }]
│
├── resultPublishedAt: timestamp (nullable)
│
├── results: object
│   ├── totalStudents: number
│   ├── marksSubmitted: number
│   ├── pendingMarks: number
│   └── averagePerformance: number
│
└── metadata: object
    ├── createdAt: timestamp
    └── updateAt: timestamp

Indexes:
1. Composite: { academicYear, term, status }
2. Composite: { startDate, status }
```

## Collection 9: schools/{schoolId}/fees/

```firestore
fees/{feeId}
├── studentId: string (required, indexed)
├── month: enum ["January", "February", ..., "December"]
├── year: number
│
├── invoiceNumber: string (required, unique per school)
│   Format: "DPS/2026/04/001"
│
├── invoiceDate: date (required)
├── dueDate: date (required)
│
├── breakdown: array[object]
│   └── [{
│       category: string ("Tuition", "Transport", "Activities", etc.)
│       description: string (optional)
│       amount: number (in paise for precision)
│       quantity: number (optional)
│     }]
│
├── subtotal: number (sum of breakdown, in paise)
│
├── discounts: object
│   ├── type: enum ["percentage", "amount"]
│   ├── value: number
│   └── reason: string
│
├── taxes: object
│   ├── gst: number (in paise)
│   └── otherTaxes: number
│
├── totalAmount: number (in paise, indexed)
│   Formula: subtotal - discounts + taxes
│
├── paymentStatus: enum ["unpaid", "partial", "paid", "overdue"] (indexed)
│
├── paymentHistory: array[object]
│   └── [{
│       paymentDate: date
│       amount: number (in paise)
│       method: enum ["bank_transfer", "cash", "cheque", "online"]
│       transactionId: string
│     }]
│
├── amountPaid: number (sum of payments, in paise)
│
├── amountDue: number (calculated: totalAmount - amountPaid)
│
└── metadata: object
    ├── createdAt: timestamp
    └── updatedAt: timestamp

Indexes:
1. Composite: { studentId, month, year }
2. Composite: { paymentStatus, dueDate }
3. Single: { invoiceDate }
```

## Collection 10: schools/{schoolId}/communications/

```firestore
communications/{communicationId}
├── type: enum ["sms", "email", "in_app", "whatsapp"]
│
├── recipients: object
│   ├── type: enum ["class", "individual", "role"]
│   ├── class: number (if type="class")
│   ├── studentId: string (if type="individual")
│   ├── role: string (if type="role", e.g., "parent")
│   └── recipientCount: number (cached)
│
├── content: object
│   ├── title: string
│   ├── message: string (max 160 chars for SMS)
│   └── actionUrl: string (optional)
│
├── sentAt: timestamp
├── sentBy: string (user UID)
│
├── status: enum ["draft", "scheduled", "sent", "failed"]
│
├── deliveryStatus: object
│   ├── sent: number
│   ├── delivered: number
│   └── failed: number
│
└── metadata: object
    ├── createdAt: timestamp
    └── templates: array[string]

Indexes:
1. Composite: { type, sentAt }
2. Single: { status }
```

---

# SECTION 3: INDEX STRATEGY

## Critical Indexes (Build First)

```
STUDENTS COLLECTION:
1. { class, section, status } - Most frequent query
2. { parentPhone } - SMS lookup
3. { displayName } - Search by name
4. { class, displayName } - Search within class

ATTENDANCE COLLECTION:
1. { date, class, section } - Daily attendance queries
2. { class, section } - All attendance for class

ASSESSMENTS + MARKS:
1. { class, subject, date } - Grade sheet queries
2. { studentId } - Student's all marks

FEES COLLECTION:
1. { studentId, month, year } - Invoice lookup
2. { paymentStatus, dueDate } - Overdue tracking

SCHOOLS COLLECTION:
1. { subscription.status, nextBillingDate } - Billing automation
2. { status } - Founder dashboard
```

## Composite Index Examples

```firestore
// For query: Get all students in Class 5, Section A, who are active
Index: { class: Ascending, section: Ascending, status: Ascending }

// For query: Get all absent students in last 7 days
Index: { date: Descending, status: Ascending }

// For query: Get all overdue fees for a student
Index: { studentId: Ascending, paymentStatus: Ascending, dueDate: Ascending }
```

## Cost Optimization

```
DON'T INDEX:
- Boolean fields (low cardinality) → Use WHERE status IN [...] instead
- Rare fields (indexed=expensive)
- Encrypted fields (decryption cost higher than filtering)

AUTO-INDEX:
- Firestore auto-indexes single fields
- Manual composite indexes only when > 100K docs or complex queries

MONITORING:
- Track index cost in GCP Console
- Review unused indexes quarterly
- Expected: 10-15 indexes per school
```

---

# SECTION 4: SECURITY RULES REQUIREMENTS

**These are enforced at the database layer:**

```firestore
- No document readable without explicit permission
- Multi-tenancy: Student data readable only by their school's staff/parents
- Encryption: Aadhar + medical data encrypted (Cloud KMS)
- Deletion: Soft delete (status="inactive"), hard delete after 1 year
- Audit: All writes logged to audit_log collection
```

---

# SECTION 5: DATA TYPES & CONSTRAINTS

| Field Type | Firestore Type | Validation | Example |
|------------|---|---|---|
| Name | String | 1-100 chars | "Aarav Sharma" |
| Date | Timestamp | Valid date | 2026-04-08 |
| Phone | String | Regex match | "+91-9876543210" |
| Email | String | RFC 5322 | "abc@school.in" |
| Number | Number | Range | 100 (marks) |
| Enum | String | Allowed values | "active" |
| URL | String | Valid URL | "https://..." |
| Encrypted | String | Encrypted | "enc_xyz..." |

---

# SECTION 6: CAPACITY PLANNING

```
FOR A 500-SCHOOL DEPLOYMENT (Year 1):

Students: 500 schools × 2,000 avg = 1M docs
Attendance: 1M students × 250 work days = 250M docs
Marks: 1M students × 8 assessments/year = 8M docs
Fees: 1M students × 12 months = 12M docs

Total: ~280M docs

Firestore Pricing:
- Reads: 280M × 0.06 queries/doc = $1M/month (expensive!)
- Optimization: Cache reads in Redis, batch queries
- Expected real cost: $100-200K/month for 500 schools
  (with optimization: $20-40K/month)

Disk Storage: ~500GB (uncompressed)
  - Estimate: 1KB per document average
  - 280M docs × 1KB = 280GB
  - With backups & replication: 500GB total
```

---

**This schema scales to 10,000+ schools with proper indexing and optimization. Use BigQuery for analytics queries (OLAP), Firestore for real-time (OLTP).**
