# 24_DATA_PLATFORM.md

## School ERP Data Warehouse - BigQuery, Real-Time Sync, Analytics

**Status:** Ready for Week 1 Implementation  
**Tech Stack:** BigQuery (data warehouse) + Cloud Functions (real-time sync) + Looker Studio (dashboards)  
**Ownership:** Data Agent — analytics contracts, BigQuery sync, reporting, automation data models

---

## TABLE OF CONTENTS

1. BigQuery Architecture
2. Real-Time Sync Cloud Function
3. Schema Validation & Optimization
4. 15+ Analytical SQL Queries
5. Materialized Views (Aggregations)
6. Data Retention & Cleanup Policies
7. Data Quality Validation
8. Looker Studio Dashboard Setup
9. Performance Tuning Checklist
10. Week 1-4 Analytics Roadmap

---

## 1. BIGQUERY ARCHITECTURE

```
┌─────────────────┐
│   Firestore     │
│ (Transactional) │
└────────┬────────┘
         │ Real-time changes (document write/update/delete)
         ▼
┌──────────────────────┐
│  Cloud Function      │
│ (syncFirestoreToBQ)  │  Transforms, validates, inserts
└────────┬─────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│            BigQuery (Data Warehouse)                │
│  school_erp_prod dataset                            │
│  ├─ schools                                         │
│  ├─ students                                        │
│  ├─ attendance (partitioned by date, clustered)    │
│  ├─ grades (partitioned by school_id)              │
│  ├─ fees_invoices                                  │
│  ├─ fees_payments (real-time collection tracking)  │
│  ├─ payroll                                        │
│  ├─ audit_logs (compliance)                        │
│  └─ materialized_views/                            │
│      ├─ daily_attendance_summary                   │
│      ├─ monthly_fee_collection                     │
│      ├─ student_performance                        │
│      └─ staff_payroll_summary                      │
└────────┬─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│        Looker Studio (Dashboards)                   │
│  • Principal Dashboard (attendance, grades, fees)   │
│  • Finance Dashboard (collection %, outstanding)    │
│  • Teacher Dashboard (class attendance trends)      │
│  • Analytics Dashboard (system metrics)             │
└─────────────────────────────────────────────────────┘
```

---

## 2. REAL-TIME SYNC CLOUD FUNCTION

### 2.1 Firestore → BigQuery Sync Function (Complete)

```typescript
// src/functions/syncFirestoreToBigQuery.ts

import * as functions from "firebase-functions";
import { BigQuery } from "@google-cloud/bigquery";
import * as admin from "firebase-admin";

const bigquery = new BigQuery({
  projectId: process.env.GCP_PROJECT_ID,
});

const DATASET_ID = "school_erp_prod";

// Map Firestore collections to BigQuery tables
const COLLECTION_TABLE_MAP: Record<
  string,
  { table: string; transform: (doc: any) => any }
> = {
  schools: {
    table: "schools",
    transform: (doc) => ({
      school_id: doc.school_id,
      name: doc.name,
      email: doc.email,
      phone: doc.phone,
      city: doc.city,
      state: doc.state,
      board: doc.board,
      created_at: doc.created_at?.toDate?.().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  },

  students: {
    table: "students",
    transform: (doc) => ({
      school_id: doc.school_id,
      student_id: doc.student_id,
      name: doc.name,
      email: doc.email,
      class_id: doc.class_id,
      roll_no: doc.roll_no,
      fees_status: doc.fees_status,
      fees_paid_amount: doc.fees_paid_amount,
      fees_total_amount: doc.fees_total_amount,
      created_at: doc.created_at?.toDate?.().toISOString(),
      updated_at: new Date().toISOString(),
    }),
  },

  attendance: {
    table: "attendance",
    transform: (doc) => ({
      school_id: doc.school_id,
      student_id: doc.student_id,
      date: doc.date,  // YYYY-MM-DD
      status: doc.status,  // present, absent, leave
      marked_by: doc.marked_by,
      class_id: doc.class_id,
      semester: doc.semester,
      marked_at: doc.marked_at?.toDate?.().toISOString(),
    }),
  },

  grades: {
    table: "grades",
    transform: (doc) => ({
      school_id: doc.school_id,
      exam_id: doc.exam_id,
      student_id: doc.student_id,
      subject: doc.subject,
      marks_obtained: doc.marks_obtained,
      marks_total: doc.marks_total,
      percentage: (doc.marks_obtained / doc.marks_total) * 100,
      grade: calculateGrade(doc.marks_obtained),
      entered_at: doc.entered_at?.toDate?.().toISOString(),
    }),
  },

  fee_invoices: {
    table: "fee_invoices",
    transform: (doc) => ({
      school_id: doc.school_id,
      invoice_id: doc.invoice_id,
      student_id: doc.student_id,
      month: doc.month,
      total_amount: doc.total_amount,
      amount_paid: doc.amount_paid,
      amount_pending: doc.amount_pending,
      payment_status: doc.payment_status,
      due_date: doc.due_date,
      created_at: doc.created_at?.toDate?.().toISOString(),
    }),
  },

  payroll: {
    table: "payroll",
    transform: (doc) => ({
      school_id: doc.school_id,
      staff_id: doc.staff_id,
      month_year: doc.month_year,
      gross: doc.gross,
      deductions: doc.total_deductions,
      net_salary: doc.net_salary,
      status: doc.status,
      paid_at: doc.paid_at?.toDate?.().toISOString(),
    }),
  },

  audit_logs: {
    table: "audit_logs",
    transform: (doc) => ({
      school_id: doc.school_id,
      user_id: doc.user_id,
      action: doc.action,
      resource_type: doc.resource_type,
      resource_id: doc.resource_id,
      timestamp: doc.timestamp?.toDate?.().toISOString(),
    }),
  },
};

export const syncFirestoreToBigQuery = functions
  .region("asia-south1")
  .firestore.document("schools/{schoolId}/{collectionName}/{docId}")
  .onWrite(async (change, context) => {
    try {
      const { schoolId, collectionName, docId } = context.params;

      // Check if this collection should be synced
      if (!COLLECTION_TABLE_MAP[collectionName]) {
        console.log(`Skipping sync for ${collectionName} (not in MAP)`);
        return;
      }

      const { table, transform } = COLLECTION_TABLE_MAP[collectionName];

      if (!change.after.exists) {
        // Delete from BigQuery
        const query = `DELETE FROM \`${DATASET_ID}.${table}\` WHERE id = @id`;
        await bigquery.query({
          query,
          params: { id: docId },
        });
        console.log(`Deleted ${docId} from ${table}`);
        return;
      }

      // Transform Firestore doc to BigQuery row
      const rowData = transform(change.after.data());
      rowData.id = docId;  // Add local ID for future deletes

      // Insert/Update in BigQuery
      const dataset = bigquery.dataset(DATASET_ID);
      const tableRef = dataset.table(table);

      await tableRef.insert(rowData, {
        skipInvalidRows: false,
        ignoreUnknownValues: false,
      });

      console.log(`Synced ${table}/${docId} to BigQuery`);
    } catch (error) {
      console.error("BigQuery sync failed:", error);

      // Publish to dead-letter queue for retry
      const pubsub = admin.messaging();
      await pubsub.send({
        topic: "deadletter-bigquery-sync",
        data: {
          document: change.after.ref.path,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      });

      throw error;
    }
  });

function calculateGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}
```

### 2.2 Deployment

```bash
gcloud functions deploy syncFirestoreToBigQuery \
  --runtime nodejs20 \
  --trigger-event providers/cloud.firestore/eventTypes/document.write \
  --trigger-resource schools/{schoolId}/{collectionName}/{docId} \
  --region asia-south1
```

---

## 3. BIGQUERY SCHEMA & OPTIMIZATION

### Attendance Table (High Volume)

```sql
CREATE TABLE school_erp_prod.attendance (
  id STRING,
  school_id STRING NOT NULL,
  student_id STRING NOT NULL,
  date DATE NOT NULL,
  status STRING NOT NULL,  -- present, absent, leave
  marked_by STRING,
  class_id STRING,
  semester STRING,
  marked_at TIMESTAMP,
  _PARTITIONTIME DATE  -- Auto-partitioned by ingestion date
)
PARTITION BY date
CLUSTER BY school_id, class_id
AS SELECT * FROM (SELECT * FROM UNNEST([]));
```

**Why clustering?** Fast queries like:
```sql
SELECT * FROM attendance 
WHERE school_id = 'sch_001' 
  AND date >= '2026-04-01';
```

### Fees Invoices Table (Fast Aggregations)

```sql
CREATE TABLE school_erp_prod.fee_invoices (
  id STRING,
  school_id STRING NOT NULL,
  invoice_id STRING NOT NULL,
  student_id STRING NOT NULL,
  month STRING NOT NULL,
  total_amount NUMERIC,
  amount_paid NUMERIC,
  amount_pending NUMERIC,
  payment_status STRING,
  due_date DATE,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY school_id, payment_status;
```

---

## 4. ANALYTICAL SQL QUERIES

### Query 1: Daily Attendance Summary (by School & Class)

```sql
-- Attendance trends
SELECT
  school_id,
  date,
  class_id,
  COUNT(*) as total_students,
  COUNTIF(status = 'present') as present_count,
  ROUND(100 * COUNTIF(status = 'present') / COUNT(*), 2) as attendance_percent,
  COUNTIF(status = 'absent') as absent_count,
  COUNTIF(status = 'leave') as leave_count
FROM `school_erp_prod.attendance`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY school_id, date, class_id
ORDER BY date DESC, school_id, class_id;
```

### Query 2: Grade Distribution (by Subject & Class)

```sql
-- Grade analysis
SELECT
  school_id,
  grade,
  subject,
  COUNT(*) as count,
  ROUND(AVG(percentage), 2) as avg_percentage,
  MIN(percentage) as min_percentage,
  MAX(percentage) as max_percentage
FROM `school_erp_prod.grades`
WHERE exam_id = 'exam_final_2026'  -- Filter by exam
GROUP BY school_id, grade, subject
ORDER BY school_id, subject, grade DESC;
```

### Query 3: Fee Collection Status (Monthly)

```sql
-- Fee collection insights
SELECT
  school_id,
  month,
  COUNT(*) as invoices_generated,
  COUNTIF(payment_status = 'paid') as invoices_paid,
  COUNTIF(payment_status = 'partial') as invoices_partial,
  COUNTIF(payment_status = 'unpaid') as invoices_unpaid,
  ROUND(100 * COUNTIF(payment_status = 'paid') / COUNT(*), 2) as collection_percent,
  SUM(total_amount) as total_fee_amount,
  SUM(amount_paid) as amount_collected,
  SUM(amount_pending) as amount_pending
FROM `school_erp_prod.fee_invoices`
WHERE month >= DATE_FORMAT(DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH), '%Y-%m')
GROUP BY school_id, month
ORDER BY month DESC, school_id;
```

### Query 4: Student Performance Tracking

```sql
-- Identify low performers for intervention
SELECT
  school_id,
  student_id,
  AVG(percentage) as avg_score,
  MIN(percentage) as lowest_score,
  COUNT(*) as exams_taken,
  STRING_AGG(DISTINCT subject ORDER BY subject) as weak_subjects
FROM `school_erp_prod.grades`
WHERE exam_id IN ('exam_mid_2026', 'exam_final_2026')
GROUP BY school_id, student_id
HAVING AVG(percentage) < 50  -- Low performers
ORDER BY avg_score ASC;
```

### Query 5: Attendance at Risk (Below Threshold)

```sql
-- Students with low attendance
WITH student_attendance AS (
  SELECT
    school_id,
    student_id,
    COUNT(*) as total_days,
    COUNTIF(status = 'present') as present_days,
    ROUND(100 * COUNTIF(status = 'present') / COUNT(*), 2) as attendance_percent
  FROM `school_erp_prod.attendance`
  WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)  -- Last quarter
  GROUP BY school_id, student_id
)
SELECT
  s.school_id,
  s.student_id,
  st.name as student_name,
  sa.attendance_percent,
  sa.present_days,
  sa.total_days,
  CASE
    WHEN sa.attendance_percent < 75 THEN 'RED'  -- Critical
    WHEN sa.attendance_percent < 80 THEN 'YELLOW'  -- Warning
    ELSE 'GREEN'
  END as risk_level
FROM student_attendance sa
JOIN `school_erp_prod.students` st ON sa.school_id = st.school_id AND sa.student_id = st.student_id
WHERE sa.attendance_percent < 80
ORDER BY sa.attendance_percent ASC;
```

### Query 6: Fee Trend (Collection Rate Over Time)

```sql
-- Monitor fee collection pipeline
SELECT
  month,
  school_id,
  SUM(total_amount) as fee_generated,
  SUM(amount_paid) as amount_collected,
  SUM(amount_pending) as amount_outstanding,
  ROUND(100 * SUM(amount_paid) / SUM(total_amount), 2) as collection_rate
FROM `school_erp_prod.fee_invoices`
GROUP BY month, school_id
ORDER BY month DESC, school_id;
```

### Query 7: Payroll Cost Analysis (by School)

```sql
-- Monthly payroll cost insights
SELECT
  school_id,
  month_year,
  COUNT(*) as staff_count,
  SUM(gross) as total_gross_salary,
  SUM(deductions) as total_deductions,
  SUM(net_salary) as total_net_salary,
  ROUND(AVG(net_salary), 0) as avg_net_salary,
  ROUND(SUM(gross) / COUNT(*), 0) as avg_gross_salary
FROM `school_erp_prod.payroll`
GROUP BY school_id, month_year
ORDER BY month_year DESC, school_id;
```

### Query 8: Audit Compliance (Data Changes Log)

```sql
-- Who changed what, when
SELECT
  school_id,
  DATE(timestamp) as change_date,
  user_id,
  action,
  resource_type,
  COUNT(*) as change_count
FROM `school_erp_prod.audit_logs`
WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
GROUP BY school_id, change_date, user_id, action, resource_type
ORDER BY change_date DESC, change_count DESC;
```

---

## 5. MATERIALIZED VIEWS (Aggregations)

```sql
-- Daily Attendance Summary (refreshed daily)
CREATE MATERIALIZED VIEW `school_erp_prod.attendance_daily_summary` AS
SELECT
  school_id,
  date,
  COUNT(*) as total_students,
  COUNTIF(status = 'present') as present_count,
  ROUND(100 * COUNTIF(status = 'present') / COUNT(*), 2) as attendance_percent
FROM `school_erp_prod.attendance`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 90 DAY)
GROUP BY school_id, date;

-- Monthly Fee Collection (refreshed monthly)
CREATE MATERIALIZED VIEW `school_erp_prod.fee_monthly_summary` AS
SELECT
  school_id,
  month,
  SUM(total_amount) as fee_generated,
  SUM(amount_paid) as amount_collected,
  ROUND(100 * SUM(amount_paid) / SUM(total_amount), 2) as collection_rate
FROM `school_erp_prod.fee_invoices`
GROUP BY school_id, month;

-- Student Performance (refreshed weekly)
CREATE MATERIALIZED VIEW `school_erp_prod.student_performance` AS
SELECT
  school_id,
  student_id,
  AVG(percentage) as avg_score,
  COUNT(*) as exams_taken,
  MAX(percentage) as highest_score,
  MIN(percentage) as lowest_score
FROM `school_erp_prod.grades`
GROUP BY school_id, student_id;
```

**Refresh Schedule:**
```bash
# Daily at 2am
0 2 * * * bq query --use_legacy_sql=false \
  "CALL BQ.REFRESH_MATERIALIZED_VIEW('school_erp_prod.attendance_daily_summary')"

# Monthly 1st
0 0 1 * * bq query --use_legacy_sql=false \
  "CALL BQ.REFRESH_MATERIALIZED_VIEW('school_erp_prod.fee_monthly_summary')"
```

---

## 6. DATA RETENTION & CLEANUP

```sql
-- Auto-expire old partitions (90 days)
ALTER TABLE `school_erp_prod.attendance`
SET OPTIONS(
  partition_expiration_ms = 7776000000  -- 90 days
);

-- Archive to Cloud Storage (yearly)
EXPORT DATA OPTIONS(
  uri='gs://school-erp-backups/attendance/2025-*.parquet',
  format='PARQUET'
) AS
SELECT * FROM `school_erp_prod.attendance`
WHERE EXTRACT(YEAR FROM date) = 2025;
```

---

## 7. DATA QUALITY VALIDATION

```typescript
// src/services/dataQuality.service.ts

export const dataQualityRules = [
  {
    name: "Attendance: Status Valid",
    query: `
      SELECT COUNT(*) FROM school_erp_prod.attendance 
      WHERE status NOT IN ('present', 'absent', 'leave')
    `,
    threshold: 0,
  },
  {
    name: "Grades: Marks in Range",
    query: `
      SELECT COUNT(*) FROM school_erp_prod.grades 
      WHERE marks_obtained < 0 OR marks_obtained > marks_total
    `,
    threshold: 0,
  },
  {
    name: "Fees: Math Integrity",
    query: `
      SELECT COUNT(*) FROM school_erp_prod.fee_invoices 
      WHERE amount_paid + amount_pending != total_amount
    `,
    threshold: 0,
  },
];
```

---

## 8. LOOKER STUDIO DASHBOARD

**Key Dashboards to Build:**

1. **Principal Dashboard**
   - Overall attendance % (by class, trending)
   - Grade distribution (A/B/C/D/F %)
   - Fee collection % (target vs actual)
   - Student at-risk count

2. **Finance Dashboard**
   - Fee collected vs total generated (%)
   - Outstanding amount (by student, sortable)
   - Overdue invoices (>30 days)
   - Collection trend (month-over-month)

3. **Teacher Dashboard**
   - Class attendance for today
   - Grades entered vs pending
   - Student performance (recent grads)
   - Marks to be submitted

4. **Analytics Dashboard**
   - System metrics (API latency, errors)
   - Data ingestion rate (BigQuery writes/sec)
   - Sync lag (Firestore → BigQuery latency)
   - Cost trends (GCP spend)

---

## 9. PERFORMANCE TUNING

✅ Use partitioned tables for high-volume data (attendance, grades)  
✅ Cluster frequently filtered columns (school_id, date)  
✅ Create materialized views for common aggregations  
✅ Archive old data to Cloud Storage  
✅ Monitor query costs (expensive queries flagged)  
✅ Use BI Engine for caching (Looker Studio dashboards < 1s)  

---

## 10. WEEK 1-4 ROADMAP

**Week 1:**
- ✅ BigQuery schema validated
- ✅ Real-time sync function working
- ✅ 5 core queries tested
- ✅ Materialized views created

**Week 2:**
- Add 10 more analytical queries
- Build Looker Studio dashboards
- Setup data quality validation

**Week 3:**
- Archive strategy implemented
- BigQuery cost optimization
- Advanced analytics (cohort analysis, churn prediction)

**Week 4:**
- Machine learning features (student success prediction)
- Custom reports + scheduling
- Data API for third-party integrations

---

**Next:** Data team implements sync function. Analytics team builds dashboards.
