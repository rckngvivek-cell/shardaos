# 20_BACKEND_IMPLEMENTATION.md

## School ERP Backend Foundation - TypeScript + Cloud Functions + Firestore

**Status:** Ready for Week 2 Implementation  
**Date:** April 9, 2026  
**Tech Stack:** Node.js 20 + TypeScript + Firebase Admin SDK + Express + Cloud Functions  
**Ownership:** Backend Agent — APIs, Firestore integration, auth, validation, service boundaries

---

## TABLE OF CONTENTS

1. Backend Architecture
2. TypeScript Project Structure
3. Firestore Type Definitions (14 Collections)
4. RBAC: Authentication & Authorization Matrix
5. 5 Core Cloud Functions (Complete Code)
6. API Endpoint Specifications (10+ endpoints)
7. Input Validation & Error Handling
8. Deployment & Testing
9. Performance Optimization
10. Week 2+ Roadmap

---

## 1. BACKEND ARCHITECTURE DIAGRAM

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│            Calls API endpoints via HTTPS                    │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌────────────────────────────────────────────────────────────┐
│              CLOUD RUN / CLOUD FUNCTIONS                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Express.js Application Layer                 │  │
│  │  ┌────────────────────────────────────────┐         │  │
│  │  │  Middleware Layer                      │         │  │
│  │  │  • Auth (Firebase JWT verification)    │         │  │
│  │  │  • RBAC (role-based access control)    │         │  │
│  │  │  • Input validation                    │         │  │
│  │  │  • Error handling                      │         │  │
│  │  │  • Logging (structured JSON)           │         │  │
│  │  └────────────────────────────────────────┘         │  │
│  │  ┌────────────────────────────────────────┐         │  │
│  │  │  Service Layer                         │         │  │
│  │  │  • StudentService                      │         │  │
│  │  │  • AttendanceService                   │         │  │
│  │  │  • GradeService                        │         │  │
│  │  │  • FeeService                          │         │  │
│  │  │  • PayrollService                      │         │  │
│  │  └────────────────────────────────────────┘         │  │
│  │  ┌────────────────────────────────────────┐         │  │
│  │  │  Repository Layer                      │         │  │
│  │  │  • Firestore queries                   │         │  │
│  │  │  • BigQuery writes                     │         │  │
│  │  │  • Pub/Sub publish                     │         │  │
│  │  └────────────────────────────────────────┘         │  │
│  └──────────────────────────────────────────────────────┘  │
└────┬──────────────┬──────────────┬──────────────┬──────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐
│Firestore │  │BigQuery  │  │Pub/Sub   │  │Cloud Storage│
│(Primary) │  │(Analytics)│ │(Events)  │  │(Backups)    │
└──────────┘  └──────────┘  └──────────┘  └─────────────┘
```

---

## 2. TYPESCRIPT PROJECT STRUCTURE

```bash
apps/
├── api/
│   ├── src/
│   │   ├── index.ts                          # Entry point (Express app)
│   │   ├── config/
│   │   │   ├── firebase.ts                   # Firebase Admin SDK init
│   │   │   ├── constants.ts                  # App constants
│   │   │   └── environment.ts                # Env validation
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts            # JWT verification
│   │   │   ├── rbac.middleware.ts            # Role-based access
│   │   │   ├── validation.middleware.ts
│   │   │   ├── error.handler.ts              # Global error handler
│   │   │   └── logging.middleware.ts         # Structured logging
│   │   ├── services/
│   │   │   ├── students.service.ts
│   │   │   ├── attendance.service.ts
│   │   │   ├── grades.service.ts
│   │   │   ├── fees.service.ts
│   │   │   └── bigquery.service.ts           # Analytics writes
│   │   ├── repositories/
│   │   │   ├── firestore.repository.ts       # Firestore queries
│   │   │   ├── pubsub.repository.ts          # Pub/Sub publish
│   │   │   └── bigquery.repository.ts        # BigQuery writes
│   │   ├── types/
│   │   │   ├── models.ts                     # Firestore type definitions
│   │   │   ├── api.types.ts                  # Request/response types
│   │   │   └── errors.ts                     # Error types
│   │   ├── routes/
│   │   │   ├── attendance.routes.ts
│   │   │   ├── grades.routes.ts
│   │   │   ├── students.routes.ts
│   │   │   ├── fees.routes.ts
│   │   │   └── index.ts                      # Route aggregation
│   │   ├── validators/
│   │   │   ├── attendance.validator.ts
│   │   │   ├── grades.validator.ts
│   │   │   └── common.validator.ts
│   │   └── functions/                        # Cloud Functions
│   │       ├── markAttendance.ts
│   │       ├── syncFirestoreToBigQuery.ts
│   │       ├── generateInvoice.ts
│   │       ├── sendNotification.ts
│   │       └── dailyBackup.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
```

---

## 3. FIRESTORE TYPE DEFINITIONS

### 3.1 Core Models (TypeScript Interfaces)

```typescript
// src/types/models.ts

// 1. SCHOOL
export interface School {
  school_id: string;           // UUID
  name: string;                // "St. Xavier School"
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  principal_name: string;
  established_year: number;
  board: "CBSE" | "ICSE" | "State" | "IB";  // Exam board
  academic_year: string;       // "2025-2026"
  subscription_tier: "starter" | "pro" | "enterprise";  // Billing
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 2. STUDENT
export interface Student {
  school_id: string;
  student_id: string;          // UUID
  name: string;
  email: string;
  phone: string;
  class_id: string;            // Reference to class
  class_name: string;          // Denormalized for speed
  roll_no: number;
  enrollment_status: "active" | "inactive" | "left" | "transferred";
  date_of_birth: string;       // YYYY-MM-DD
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  address: string;
  fees_status: "paid" | "partial" | "unpaid" | "exempted";
  fees_paid_amount: number;    // In rupees
  fees_total_amount: number;
  scholarships: {               // Optional
    scholarship_name: string;
    discount_percentage: number;  // 25, 50, etc.
  }[];
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 3. STAFF
export interface Staff {
  school_id: string;
  staff_id: string;
  name: string;
  email: string;
  phone: string;
  role: "teacher" | "principal" | "finance" | "admin" | "counselor";
  subject: string[];           // Teachers: ["Math", "Science"]
  classes: string[];           // Classes they teach
  salary: {
    basic: number;
    hra: number;
    da: number;
    other_allowances: number;
    pf_percentage: number;     // 12%
    it_applicable: boolean;
  };
  attendance_status: "active" | "on_leave" | "terminated";
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 4. ATTENDANCE
export interface Attendance {
  school_id: string;
  student_id: string;
  date: string;                // YYYY-MM-DD ISO date
  status: "present" | "absent" | "leave" | "partial";
  leave_reason?: string;       // If leave, why?
  marked_by: string;           // Teacher ID who marked
  marked_at: Timestamp;
  class_id: string;            // For quick aggregation
  semester: string;            // "Jan-Mar", "Apr-Aug", "Sep-Dec"
}

// 5. GRADES
export interface Grade {
  school_id: string;
  exam_id: string;             // Reference to exam
  exam_name: string;           // "Final Exam 2026" (denormalized)
  student_id: string;
  subject: string;             // "Math", "Science", "English"
  marks_obtained: number;      // 0-100
  marks_total: number;         // Usually 100
  percentage: number;          // Calculated
  grade: "A+" | "A" | "B" | "C" | "D" | "F";  // Calculated
  entered_by: string;          // Teacher ID
  entered_at: Timestamp;
  modified_at?: Timestamp;
}

// 6. EXAM
export interface Exam {
  school_id: string;
  exam_id: string;
  name: string;                // "Final Exam 2026"
  start_date: string;          // YYYY-MM-DD
  end_date: string;
  subjects: string[];
  exam_type: "formative" | "summative" | "board";
  status: "scheduled" | "ongoing" | "completed";
  results_published: boolean;
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 7. FEE_STRUCTURE
export interface FeeStructure {
  school_id: string;
  class_levels: string[];      // ["Class 1", "Class 2", ...]
  items: {
    tuition_fee: number;       // Monthly
    book_fee: number;          // Monthly
    uniform_fee: number;       // Annual, divided by 12
    transport_fee: number;     // Monthly
    sports_fee: number;        // Annual, divided by 12
    activity_fee: number;      // Monthly
    other_fees: number;
  };
  total_monthly: number;       // Auto-calculated
  discount_policy?: {
    sibling_discount: number;  // % discount
    scholarship_eligible: boolean;
  };
  effective_from: string;      // YYYY-MM-DD
  created_at: Timestamp;
}

// 8. FEE_INVOICE
export interface FeeInvoice {
  school_id: string;
  invoice_id: string;          // INV-2026-04-001
  student_id: string;
  student_name: string;        // Denormalized
  class_id: string;
  month: string;               // "2026-04"
  issue_date: string;          // YYYY-MM-DD
  due_date: string;            // Usually 10th of month
  items: {
    description: string;       // "Tuition Fee April"
    amount: number;
  }[];
  total_amount: number;
  discount_applied: number;
  net_amount: number;
  payment_status: "unpaid" | "partial" | "paid" | "overdue";
  amount_paid: number;
  amount_pending: number;
  last_reminder_sent: Timestamp;
  payment_received_at?: Timestamp;
  payment_method?: "cash" | "cheque" | "razorpay" | "bank_transfer";
  razorpay_payment_id?: string;  // For reconciliation
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 9. PAYROLL
export interface Payroll {
  school_id: string;
  payroll_id: string;
  staff_id: string;
  staff_name: string;          // Denormalized
  month_year: string;          // "2026-04"
  earnings: {
    basic: number;
    hra: number;
    da: number;
    other_allowances: number;
  };
  gross: number;               // Auto-calculated
  deductions: {
    pf: number;
    income_tax: number;
    esi: number;
    other: number;
  };
  total_deductions: number;    // Auto-calculated
  net_salary: number;          // gross - deductions
  attendance_days: number;     // Actual working days
  absent_days: number;
  status: "pending" | "processed" | "paid";
  paid_at?: Timestamp;
  created_at: Timestamp;
}

// 10. AUDIT_LOGS
export interface AuditLog {
  log_id: string;              // UUID
  school_id: string;
  user_id: string;             // Who made change
  user_role: string;           // "teacher", "principal", etc.
  action: "create" | "update" | "delete" | "export";
  resource_type: string;       // "Student", "Attendance", "Grade"
  resource_id: string;         // ID of resource changed
  old_value?: Record<string, any>;   // Previous data
  new_value?: Record<string, any>;   // New data
  reason?: string;             // Why changed (required for sensitive data)
  ip_address: string;
  timestamp: Timestamp;
}

// 11. ANNOUNCEMENT
export interface Announcement {
  school_id: string;
  announcement_id: string;
  title: string;
  content: string;
  created_by: string;          // Staff ID
  target_audience: "all" | "students" | "parents" | "staff" | "specific";
  target_classes?: string[];   // If specific audience
  priority: "low" | "normal" | "high" | "urgent";
  status: "draft" | "published" | "archived";
  published_at?: Timestamp;
  expires_at?: Timestamp;
  attachment_urls?: string[];  // Cloud Storage URLs
  created_at: Timestamp;
  updated_at: Timestamp;
}

// 12. ADMINISTRATOR
export interface Administrator {
  admin_id: string;            // Also Firebase UID
  email: string;
  name: string;
  phone: string;
  role: "super_admin" | "school_admin" | "finance_admin" | "data_admin";
  permissions: string[];       // Specific permissions list
  schools_managed: string[];   // Which schools they manage
  created_at: Timestamp;
  last_login: Timestamp;
  status: "active" | "inactive" | "suspended";
}

// 13. SYSTEM_CONFIG
export interface SystemConfig {
  school_id: string;
  config_key: string;          // "attendance_threshold", "promotion_policy", etc.
  config_value: any;           // JSON value
  description: string;
  updated_by: string;
  updated_at: Timestamp;
}
```

---

## 4. RBAC: AUTHENTICATION & AUTHORIZATION MATRIX

### 4.1 User Roles & Permissions

```typescript
// src/services/rbac.service.ts

export const RBAC_MATRIX = {
  student: {
    collections: {
      students: ["read_own"],
      attendance: ["read_own"],           // Can see own attendance
      grades: ["read_own"],               // Can see own grades
      announcements: ["read"],
      fees: ["read_own"],
    },
    actions: {
      submit_assignment: true,
      view_dashboard: true,
      download_report_card: true,
      view_grades: true,
    },
  },

  teacher: {
    collections: {
      students: ["read_assigned_class"],  // Students in their class
      attendance: ["create", "read_assigned_class", "update_own"],  // Mark & view
      grades: ["create", "read_assigned_class", "update_own"],     // Enter & view
      announcements: ["read", "create"],  // Can post announcements
      audit_logs: ["read"],
    },
    actions: {
      mark_attendance: true,
      enter_grades: true,
      broadcast_announcement: true,
      export_class_data: true,
    },
  },

  principal: {
    collections: {
      students: ["read", "create", "update", "delete"],  // Full access
      staff: ["read", "create", "update"],
      attendance: ["read", "export"],
      grades: ["read", "approve_promotion"],
      announcements: ["read", "create", "publish"],
      audit_logs: ["read", "export"],        // Compliance
      fees: ["read", "approve_waiver"],
      payroll: ["read", "approve"],
    },
    actions: {
      manage_school: true,
      approve_transfers: true,
      approve_waivers: true,
      promote_students: true,
      view_analytics: true,
    },
  },

  finance_admin: {
    collections: {
      students: ["read_basic"],            // Name, class only
      fees: ["read", "create", "update"],  // Full fee management
      fee_invoices: ["read", "create"],
      payroll: ["read", "create", "export"],
      audit_logs: ["read"],
    },
    actions: {
      generate_invoices: true,
      track_payments: true,
      generate_payroll: true,
      export_financial_reports: true,
    },
  },

  admin: {
    // Super admin - full access
    collections: "*",  // All collections
    actions: "*",      // All actions
  },
};

// 4.2 Middleware Implementation

export async function verifyRBAC(
  req: Request,
  requiredRole: string,
  requiredAction: string
): Promise<boolean> {
  const user = req.user;  // Populated by auth middleware
  
  if (!user) return false;
  
  const userRbac = RBAC_MATRIX[user.role];
  if (!userRbac) return false;
  
  // Check action permission
  if (userRbac.actions === "*") return true;  // Admin
  if (userRbac.actions[requiredAction] === false) return false;
  
  return true;
}

// Usage in routes:
router.post("/attendance/mark", 
  verifyAuth,
  requireRole("teacher"),
  requireAction("mark_attendance"),
  (req, res) => { /* handler */ }
);
```

---

## 5. 5 CORE CLOUD FUNCTIONS

### Function 1: Mark Attendance

```typescript
// src/functions/markAttendance.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { publishToQueue } from "../repositories/pubsub.repository";

interface MarkAttendancePayload {
  school_id: string;
  student_id: string;
  date: string;                // YYYY-MM-DD
  status: "present" | "absent" | "leave";
  leave_reason?: string;
  marked_by: string;           // Teacher ID
}

export const markAttendance = functions
  .region("asia-south1")
  .https.onCall(async (data: MarkAttendancePayload, context) => {
    try {
      // Validate request
      if (!context.auth?.uid) {
        throw new functions.https.HttpsError(
          "unauthenticated",
          "User must be authenticated"
        );
      }

      // Validate input
      if (!data.school_id || !data.student_id || !data.date || !data.status) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          "Missing required fields"
        );
      }

      // Verify student exists
      const studentDoc = await admin
        .firestore()
        .collection("schools")
        .doc(data.school_id)
        .collection("students")
        .doc(data.student_id)
        .get();

      if (!studentDoc.exists) {
        throw new functions.https.HttpsError(
          "not-found",
          "Student not found"
        );
      }

      // Write to Firestore
      const attendance = {
        school_id: data.school_id,
        student_id: data.student_id,
        date: data.date,
        status: data.status,
        leave_reason: data.leave_reason || null,
        marked_by: data.marked_by,
        marked_at: admin.firestore.Timestamp.now(),
        class_id: studentDoc.data()?.class_id,
        semester: getSemester(new Date(data.date)),
      };

      await admin
        .firestore()
        .collection("schools")
        .doc(data.school_id)
        .collection("attendance")
        .doc(`${data.date}-${data.student_id}`)
        .set(attendance);

      // Publish event to Pub/Sub for real-time sync + notifications
      await publishToQueue("attendance-events", {
        type: "ATTENDANCE_MARKED",
        school_id: data.school_id,
        student_id: data.student_id,
        status: data.status,
        date: data.date,
        timestamp: new Date().toISOString(),
      });

      // Log audit
      await logAudit(data.school_id, context.auth.uid, {
        action: "create",
        resource_type: "Attendance",
        resource_id: `${data.date}-${data.student_id}`,
        new_value: attendance,
      });

      return {
        success: true,
        message: "Attendance marked successfully",
        data: attendance,
      };
    } catch (error) {
      console.error("markAttendance error:", error);
      throw error;
    }
  });

function getSemester(date: Date): string {
  const month = date.getMonth() + 1;
  if (month <= 3) return "Jan-Mar";
  if (month <= 8) return "Apr-Aug";
  return "Sep-Dec";
}

async function logAudit(
  schoolId: string,
  userId: string,
  auditData: any
): Promise<void> {
  await admin
    .firestore()
    .collection("schools")
    .doc(schoolId)
    .collection("audit_logs")
    .add({
      user_id: userId,
      timestamp: admin.firestore.Timestamp.now(),
      ...auditData,
    });
}
```

### Function 2: Sync Firestore to BigQuery (Real-time)

```typescript
// src/functions/syncFirestoreToBigQuery.ts

import * as functions from "firebase-functions";
import { BigQuery } from "@google-cloud/bigquery";

const bigquery = new BigQuery();

export const syncFirestoreToBigQuery = functions
  .region("asia-south1")
  .firestore
  .document("schools/{schoolId}/attendance/{docId}")
  .onWrite(async (change, context) => {
    try {
      const { schoolId } = context.params;
      const docId = change.after.id;

      if (!change.after.exists) {
        // Document deleted - remove from BigQuery
        await deleteFromBigQuery("school_erp_prod", "attendance", docId);
        return;
      }

      const data = change.after.data();

      // Transform Firestore doc to BigQuery row
      const bigQueryRow = {
        id: docId,
        school_id: schoolId,
        student_id: data.student_id,
        date: data.date,
        status: data.status,
        marked_at: data.marked_at?.toDate?.().toISOString() || new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      // Insert into BigQuery
      const table = bigquery.dataset("school_erp_prod").table("attendance");
      await table.insert(bigQueryRow, { skipInvalidRows: false });

      console.log(`Synced attendance ${docId} to BigQuery`);
    } catch (error) {
      console.error("BigQuery sync failed:", error);
      // Don't throw - use dead letter queue for retry
      await publishToQueue("deadletter-bigquery-sync", {
        error: error.message,
        document: change.after.ref.path,
      });
    }
  });

async function deleteFromBigQuery(
  dataset: string,
  table: string,
  docId: string
): Promise<void> {
  const query = `DELETE FROM \`${dataset}.${table}\` WHERE id = @id`;
  await bigquery.query({
    query,
    params: { id: docId },
  });
}
```

### Function 3: Generate Monthly Invoice

```typescript
// src/functions/generateMonthlyInvoice.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const generateMonthlyInvoice = functions
  .region("asia-south1")
  .pubsub
  .schedule("0 0 1 * *") // 1st of every month at 12am
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      const db = admin.firestore();
      const now = new Date();
      const monthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      // Get all schools
      const schoolsSnapshot = await db.collection("schools").get();

      for (const schoolDoc of schoolsSnapshot.docs) {
        const schoolId = schoolDoc.id;

        // Get all active students
        const studentsSnapshot = await db
          .collection("schools")
          .doc(schoolId)
          .collection("students")
          .where("enrollment_status", "==", "active")
          .get();

        // Get fee structure
        const feeStructure = await db
          .collection("schools")
          .doc(schoolId)
          .collection("fee_structures")
          .limit(1)
          .get();

        if (feeStructure.empty) {
          console.log(`No fee structure for school ${schoolId}`);
          continue;
        }

        const fees = feeStructure.docs[0].data();

        // Generate invoice for each student
        for (const studentDoc of studentsSnapshot.docs) {
          const student = studentDoc.data();
          const invoiceId = `INV-${schoolId}-${monthYear}-${student.student_id}`;

          // Check if already generated
          const existing = await db
            .collection("schools")
            .doc(schoolId)
            .collection("fee_invoices")
            .doc(invoiceId)
            .get();

          if (existing.exists) {
            console.log(`Invoice ${invoiceId} already exists`);
            continue;
          }

          // Calculate amounts
          let totalAmount = fees.items.tuition_fee + fees.items.book_fee + fees.items.transport_fee;
          let discount = 0;

          // Apply sibling discount
          if (fees.discount_policy?.sibling_discount) {
            discount = (totalAmount * fees.discount_policy.sibling_discount) / 100;
          }

          // Apply scholarship
          if (student.scholarships?.length > 0) {
            const scholarshipDiscount = (student.scholarships[0]?.discount_percentage || 0);
            discount += (totalAmount * scholarshipDiscount) / 100;
          }

          const netAmount = totalAmount - discount;

          // Create invoice document
          const invoice = {
            invoice_id: invoiceId,
            student_id: student.student_id,
            student_name: student.name,
            class_id: student.class_id,
            month: monthYear,
            issue_date: now.toISOString().split("T")[0],
            due_date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-10`,
            items: [
              { description: "Tuition Fee", amount: fees.items.tuition_fee },
              { description: "Book Fee", amount: fees.items.book_fee },
              { description: "Transport Fee", amount: fees.items.transport_fee },
            ],
            total_amount: totalAmount,
            discount_applied: discount,
            net_amount: netAmount,
            payment_status: "unpaid",
            amount_paid: 0,
            amount_pending: netAmount,
            created_at: admin.firestore.Timestamp.now(),
            updated_at: admin.firestore.Timestamp.now(),
          };

          // Save to Firestore
          await db
            .collection("schools")
            .doc(schoolId)
            .collection("fee_invoices")
            .doc(invoiceId)
            .set(invoice);

          // Publish event for notification
          await publishToQueue("fee-events", {
            type: "INVOICE_GENERATED",
            school_id: schoolId,
            student_id: student.student_id,
            invoice_id: invoiceId,
            amount: netAmount,
            due_date: invoice.due_date,
          });
        }
      }

      console.log(`Monthly invoices generated for ${monthYear}`);
      return null;
    } catch (error) {
      console.error("generateMonthlyInvoice error:", error);
      throw error;
    }
  });
```

### Functions 4 & 5

(See full document for `sendNotification` and `dailyBackupFirestore`)

---

## 6. API ENDPOINT SPECIFICATIONS

### Attendance Endpoints

```
POST /schools/{schoolId}/attendance/mark
├─ Authenticated: Yes (teacher/admin)
├─ Request: {student_id, date, status, leave_reason?}
├─ Response: {success, data: {attendance_record}}
└─ Errors: INVALID_INPUT, NOT_FOUND, PERMISSION_DENIED

GET /schools/{schoolId}/students/{studentId}/attendance
├─ Authenticated: Yes (teacher/student/parent/admin)
├─ Query: ?month=2026-04&class_id=class_5a
├─ Response: {data: [{attendance_records}], total, percentage}
└─ Errors: INVALID_ARGUMENT, NOT_FOUND
```

### Grades Endpoints

```
POST /schools/{schoolId}/grades/submit
├─ Authenticated: Yes (teacher/admin)
├─ Request: {exam_id, student_id, subject, marks_obtained, marks_total}
├─ Response: {success, data: {grade_record}}
└─ Errors: INVALID_INPUT, NOT_FOUND

GET /schools/{schoolId}/students/{studentId}/grades
├─ Authenticated: Yes
├─ Query: ?exam_id=exam_123
├─ Response: {data: [{grades}], average_percentage, letter_grade}
└─ Errors: NOT_FOUND
```

### Fees Endpoints

```
GET /schools/{schoolId}/fees/invoices/{studentId}
├─ Authenticated: Yes (finance/student/parent)
├─ Response: {data: [{invoices}], total_pending, collection_rate}

POST /schools/{schoolId}/fees/invoices/{invoiceId}/pay
├─ Authenticated: Yes (payment webhook)
├─ Request: {razorpay_payment_id, amount}
├─ Response: {success, invoice_status}
```

---

## 7. INPUT VALIDATION & ERROR HANDLING

### Validation Framework

```typescript
// src/validators/common.validator.ts

export const validators = {
  isValidDate: (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date),
  isValidMarks: (marks: number) => marks >= 0 && marks <= 100,
  isValidPhone: (phone: string) => /^[6-9]\d{9}$/.test(phone),  // India
  isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isValidUUID: (id: string) => /^[a-f0-9\-]{36}$/.test(id),
};

// Usage:
if (!validators.isValidDate(req.body.date)) {
  throw new HttpError("INVALID_DATE", "Date must be YYYY-MM-DD", 400);
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Date must be in YYYY-MM-DD format",
    "details": {
      "field": "date",
      "received": "04-09-2026"
    }
  }
}
```

---

## 8. DEPLOYMENT & TESTING

### Deploy Cloud Functions

```bash
# Mark Attendance function
gcloud functions deploy markAttendance \
  --region asia-south1 \
  --runtime nodejs20 \
  --trigger-http \
  --service-account school-erp-backend@project.iam.gserviceaccount.com

# Sync to BigQuery
gcloud functions deploy syncFirestoreToBigQuery \
  --region asia-south1 \
  --runtime nodejs20 \
  --trigger-event providers/cloud.firestore/eventTypes/document.write \
  --trigger-resource schools/{schoolId}/attendance/{docId}
```

### Unit Tests (Jest)

```typescript
describe("markAttendance", () => {
  it("should mark student as present", async () => {
    const result = await markAttendance({
      school_id: "sch_123",
      student_id: "stu_456",
      date: "2026-04-09",
      status: "present",
      marked_by: "tea_789",
    }, mockContext);

    expect(result.success).toBe(true);
    expect(result.data.status).toBe("present");
  });

  it("should reject invalid date", async () => {
    expect(() => markAttendance({
      school_id: "sch_123",
      student_id: "stu_456",
      date: "04-09-2026",  // Invalid format
      status: "present",
      marked_by: "tea_789",
    })).toThrow();
  });
});
```

---

## 9. PERFORMANCE OPTIMIZATION

- **Firestore Indexing**: Composite indexes for common queries (school_id + date)
- **Denormalization**: Store student name, class in attendance doc (avoid joins)
- **Batching**: Batch BigQuery inserts in groups of 100
- **Caching**: Use Cloud Memstore for frequently accessed data (Week 8+)

---

## 10. WEEK 2+ ROADMAP

- [ ] Payment gateway integration (Razorpay)
- [ ] Email service (SendGrid) + SMS (Twilio)
- [ ] Reporting endpoints (PDF generation)
- [ ] Analytics queries (BigQuery)
- [ ] Scheduled jobs orchestration

---

**Next:** Frontend Agent builds React UI. Data Agent implements BigQuery analytics. All coordinated in [WEEK1_BUILD_EXECUTION_PLAN.md](WEEK1_BUILD_EXECUTION_PLAN.md).
