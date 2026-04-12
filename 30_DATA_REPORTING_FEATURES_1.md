# 30_DATA_REPORTING_FEATURES_1.md - Week 2 BigQuery Analytics & Reporting

**Sprint:** Week 2  
**Date:** April 9, 2026  
**Module:** Data Platform & Reporting (Analytics)  
**Owner:** Data Agent

---

## Executive Summary

Week 2 data platform expansion delivers comprehensive BigQuery reporting infrastructure:
- Principal dashboard with real-time KPIs
- 9 specialized report types (student performance, attendance, fees, exams)
- 30+ pre-built SQL analytics queries
- Materialized views for sub-second query response
- PDF/Excel/CSV export with email delivery
- Looker Studio BI dashboards
- Scheduled reports via Cloud Scheduler
- Real-time alerts and notifications

**Target Metrics:**
- Dashboard load time <1s (materialized views)
- Report generation <30s
- 70%+ BigQuery queries <5s
- Zero data inconsistencies (Firestore ↔ BigQuery)

---

## 1. Principal Dashboard Reporting

### Real-Time KPI Cards

**School Overview:**
```sql
SELECT 
  COUNT(DISTINCT student_id) as total_students,
  COUNT(DISTINCT staff_id) as total_staff,
  COUNT(DISTINCT class_id) as classes,
  SUM(CASE WHEN status='ACTIVE' THEN 1 ELSE 0 END) / COUNT(*) as active_rate
FROM schools_daily_snapshot
WHERE date = CURRENT_DATE()
```

**Attendance Metrics:**
- School-wide avg attendance %: `AVG(attendance_pct)` from `attendance_daily_summary`
- At-risk students (<75%): Count + drill-down list
- 7-day trend: Improving ↑, declining ↓, stable →

**Academic Metrics:**
- Pass rate: Percentage of students scoring >40%
- GPA distribution: A (%), B (%), C (%), D (%), F (%)
- Top performing subject: Subject with highest avg score
- Bottom performer: Subject needing intervention

**Financial Metrics:**
```sql
SELECT 
  SUM(amount) as total_collected,
  COUNT(CASE WHEN status='PAID' THEN 1 END) / COUNT(*) as collection_rate,
  SUM(CASE WHEN status='PENDING' THEN amount ELSE 0 END) as pending_fees
FROM invoices
WHERE month = CURRENT_MONTH()
```

**Engagement:**
- Classes conducted this month
- Exams scheduled next 30 days
- Announcements sent this week
- Active users (students logged in last 7 days)

### Materialized View: `principal_dashboard_summary`
- Refresh: Every 1 hour
- Queries on view: <100ms response time
- Schema: (school_id, date, attendance_pct, at_risk_count, pass_rate, fees_collected, engagement_score)

---

## 2. Student Performance Reports

**Individual Transcript:**
```sql
SELECT 
  s.student_name,
  s.class,
  g.subject,
  g.exam_name,
  g.marks,
  g.total_marks,
  g.grade,
  g.score_percentage,
  g.exam_date
FROM students s
JOIN grades g ON s.student_id = g.student_id
WHERE s.student_id = ?
ORDER BY g.exam_date DESC
```

**Performance Trajectory Chart:**
- X-axis: Exam date
- Y-axis: Score percentage
- Last 10 exams: Line chart showing trend
- Trend indicator: 📈 Improving (slope >2%), 📉 Declining, → Stable

**Comparative Analysis:**
```sql
SELECT 
  percentile_rank() OVER (PARTITION BY class ORDER BY gpa) * 100 as percentile,
  student_name,
  gpa,
  class
FROM student_performance_profile
WHERE class = ?
```

**Strong Areas (>85% avg):**
- Subject list with average scores
- Recommendation: "Explore advanced topics in Math"

**Improvement Areas (<60% avg):**
- Subject list with average scores
- Recommendation: "Schedule tutoring in Science"

---

## 3. Attendance Analytics

**School Attendance by Month:**
```sql
SELECT 
  EXTRACT(MONTH FROM date) as month,
  ROUND(AVG(attendance_pct), 2) as avg_attendance
FROM attendance_daily_summary
WHERE EXTRACT(YEAR FROM date) = 2026
GROUP BY month
ORDER BY month
```

**Class-Wise Comparison (Radar Chart):**
- Axes: Class 4A, 4B, 5A, 5B, 5C
- Values: Attendance % for each class
- Identifies low-performing classes

**At-Risk Students Report:**
```sql
SELECT 
  student_id,
  student_name,
  class,
  attendance_pct,
  days_absent,
  days_total,
  status
FROM student_attendance_risk
WHERE attendance_pct < 75
ORDER BY attendance_pct ASC
LIMIT 50
```
- Action: "Send attendance notice to parent" (automated via Pub/Sub)

**Attendance Trends:**
- Is school attendance improving? Linear regression
- Slope >0: Improving, Slope <0: Declining
- Alert: "Attendance declined 5% last week"

**Absenteeism Drivers (Top 10 Absent Students):**
- Identify patterns: Day of week (Mondays?), specific classes (4A?), individuals
- Action: "Schedule counseling session with Rahul (15 absences)"

---

## 4. Fee Collection Analysis

**Collection vs Expected (Current Month):**
```sql
SELECT 
  SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END) as collected,
  SUM(amount) as expected,
  ROUND(SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END) / SUM(amount) * 100, 2) as collection_rate
FROM invoices
WHERE MONTH(invoice_date) = CURRENT_MONTH()
```

**Collection by Class:**
```sql
SELECT 
  s.class,
  ROUND(COUNT(CASE WHEN i.status='PAID' THEN 1 END) / COUNT(*) * 100, 2) as paid_rate,
  COUNT(*) as total_invoices
FROM invoices i
JOIN students s ON i.student_id = s.student_id
GROUP BY s.class
ORDER BY paid_rate DESC
```

**Overdue Invoices:**
```sql
SELECT 
  student_id,
  student_name,
  amount,
  due_date,
  DATEDIFF(CURRENT_DATE(), due_date) as days_overdue
FROM invoices
WHERE status='PENDING' AND due_date < CURRENT_DATE()
ORDER BY days_overdue DESC
LIMIT 100
```

**Payment Method Breakdown:**
- Cash: 30% of transactions
- Card (Razorpay): 50%
- Cheque: 15%
- Bank Transfer: 5%

**Quarterly Trend:**
```sql
SELECT 
  EXTRACT(QUARTER FROM invoice_date) as quarter,
  ROUND(AVG(collection_rate), 2) as avg_collection_rate
FROM fee_collection_summary
WHERE EXTRACT(YEAR FROM invoice_date) = 2026
GROUP BY quarter
ORDER BY quarter
```

---

## 5. Exam Performance Analysis

**Exam-Wise Comparison:**
```sql
SELECT 
  exam_name,
  subject,
  ROUND(AVG(score_percentage), 2) as avg_score,
  COUNT(*) as students_appeared,
  COUNT(CASE WHEN score_percentage >= 40 THEN 1 END) / COUNT(*) * 100 as pass_rate
FROM grades
GROUP BY exam_name, subject
ORDER BY exam_name, avg_score DESC
```

**Grade Distribution (Bar Chart):**
- A (>90%): 15% of students
- B (75-90%): 35%
- C (60-74%): 35%
- D (40-59%): 10%
- F (<40%): 5%

**Subject Performance Heatmap:**
```sql
SELECT 
  subject,
  grade,
  COUNT(*) as count
FROM grades
WHERE exam_name = ?
GROUP BY subject, grade
PIVOT grade -> count
```

**Question-Level Analysis (If available):**
- Most missed questions: Question ID + percentage of students
- Most aced questions: Question ID + percentage correct

**Outliers (Suspicious Scores):**
```sql
SELECT 
  student_name,
  subject,
  score,
  class_avg,
  STDDEV_POP(score) OVER (PARTITION BY subject) as std_dev,
  ABS(score - class_avg) as deviation
FROM grades
WHERE ABS(score - class_avg) > 3 * STDDEV_POP(score) OVER (PARTITION BY subject)
ORDER BY deviation DESC
```

---

## 6. Financial Summary Reports

**School Revenue:**
```sql
SELECT 
  'Tuition' as fee_type,
  SUM(amount) as revenue
FROM invoices
WHERE fee_type='TUITION' AND status='PAID'
UNION ALL
SELECT 'Transport', SUM(amount) FROM invoices WHERE fee_type='TRANSPORT' AND status='PAID'
UNION ALL
SELECT 'Misc', SUM(amount) FROM invoices WHERE fee_type='MISC' AND status='PAID'
```

**Expense Breakdown (from Payroll):**
- Staff salaries: ₹X
- Maintenance: ₹Y
- Supplies: ₹Z

**Profit Margin:**
```
= (Revenue - Expenses) / Revenue
= (₹45,00,000 - ₹22,50,000) / ₹45,00,000 = 50%
```

**Per-Student Revenue:**
```
= Total Revenue / Total Students
= ₹45,00,000 / 600 = ₹7,500
```

**Comparative (vs Region Average):**
- Your school: ₹7,500 per student
- Regional average: ₹6,200 per student
- Status: Above average ✓

---

## 7. Export Reports (PDF, Excel, CSV)

**Report Generator Cloud Function:**
```typescript
// POST /api/admin/reports/generate
interface GenerateReportRequest {
  type: 'ATTENDANCE' | 'ACADEMIC' | 'FINANCIAL' | 'STUDENT_PERFORMANCE';
  format: 'PDF' | 'EXCEL' | 'CSV';
  filters: {
    dateRange: { start: Date; end: Date };
    class?: string;
    subject?: string;
  };
  email?: string; // Optional: email report to recipient
}

// Returns: { reportId, downloadUrl, expiresAt }
```

**Formats:**
- **PDF:** Headless Chrome (puppeteer) with styled template + charts
- **Excel:** node-xlsx with multiple sheets (summary, details, charts as images)
- **CSV:** Papa Parse with headers + data rows

**Email Delivery:**
- Pub/Sub trigger: "Report generated"
- Send email with signed URL (expires in 7 days)
- Subject: "Your Attendance Report (April 2026)"

**Shared Reports:**
- Principal downloads report → gets signed URL
- Share URL with teacher/parent (view-only)
- Expires in 7 days (for security)

---

## 8. BI Integrations (Looker Studio)

**Dashboard 1: Attendance Trends**
- Line chart: Daily attendance % (x: date, y: %)
- Heat map: Attendance by class + day of week
- Filters: Date range, class, section

**Dashboard 2: Academic Performance**
- Grade distribution bar chart
- GPA histogram (x: GPA bucket 3.0-3.25, y: count of students)
- Subject performance table (subject, avg score, pass rate)
- Top/bottom performers lists
- Filters: Subject, exam type, class

**Dashboard 3: Financial Health**
- Revenue vs expenses (side-by-side bars)
- Collection rate % (gauge chart: 0-100%)
- Overdue invoices (table: student, amount, days overdue)
- Payment method pie chart
- Filters: Month, class

**Dashboard 4: Operational**
- Classes conducted (calendar view)
- Exams scheduled (timeline)
- Staff utilization (classes per teacher)
- Engagement metrics (active users, logins, interactions)

**Interactivity:**
- Click school → drill down to class-level data
- Filter by date → refresh all charts
- Click student name → view individual transcript

---

## 9. Scheduled Reports (Cloud Scheduler)

**Weekly Report (Every Monday 9 AM IST):**
```yaml
schedule: ' 0 9 * * 1'  # Monday 9 AM
function: generateWeeklyReport
recipient: principal@school.in
content:
  - Last week attendance %
  - Students absent >2 days
  - Exams this week
```

**Monthly Report (End of month, 6 PM IST):**
```yaml
schedule: '0 18 L * *'  # Last day of month 6 PM
function: generateMonthlyReport
recipient: principal@school.in
content:
  - Monthly attendance summary
  - Monthly fee collection report
  - Student performance rankings
  - Action items for next month
```

**Daily SMS Alert (Every day 7 AM IST):**
```yaml
schedule: '0 7 * * *'
function: sendDailyAlert
recipient: [principal's phone]
message: '✓ ₹{collected} collected yesterday. {pending} pending. {at_risk} students at-risk.'
```

---

## 10. BigQuery Materialized Views

**MV 1: attendance_daily_summary**
```sql
SELECT 
  school_id,
  date,
  ROUND(COUNT(CASE WHEN status='PRESENT' THEN 1 END) / COUNT(*) * 100, 2) as attendance_pct,
  COUNT(CASE WHEN status='ABSENT' THEN 1 END) as absent_count,
  COUNT(CASE WHEN ROUND(attendance_pct) < 75 THEN 1 END) as at_risk_count
FROM attendance
GROUP BY school_id, date
```

**MV 2: grade_subject_summary**
```sql
SELECT 
  school_id,
  subject,
  ROUND(AVG(score_percentage), 2) as avg_score,
  COUNT(CASE WHEN score_percentage >= 40 THEN 1 END) / COUNT(*) * 100 as pass_rate,
  APPROX_QUANTILES(score_percentage, 100) as percentile_distribution
FROM grades
GROUP BY school_id, subject
```

**MV 3: fee_collection_summary**
```sql
SELECT 
  school_id,
  DATE_TRUNC(invoice_date, MONTH) as month,
  SUM(CASE WHEN status='PAID' THEN amount ELSE 0 END) as collected,
  SUM(amount) as expected,
  ROUND(SUM(CASE WHEN status='PAID' THEN 1 END) / COUNT(*) * 100, 2) as collection_rate
FROM invoices
GROUP BY school_id, month
```

**Refresh Schedule:**
```bash
# Run every 1 hour
0 * * * * bq query --use_legacy_sql=false < refresh_mv.sql
```

---

## 30+ Analytics Queries (Available in Dashboard)

1. ✅ Top 10 performing students by GPA
2. ✅ Bottom 10 students needing support (<2.0 GPA)
3. ✅ Attendance trends by month (6-month lookback)
4. ✅ Fee collection rate by class
5. ✅ Subject performance ranking (avg score)
6. ✅ At-risk students (<40% score or <75% attendance)
7. ✅ Most improved students (this month vs baseline)
8. ✅ Teacher performance (avg marks assigned, grading consistency)
9. ✅ Class size vs staff ratio (adequacy check)
10. ✅ Exam scheduling conflicts detection
11. ✅ Student enrollment vs staff ratio by grade
12. ✅ Exam pass rate by subject (trending)
13. ✅ Attendance by day of week (Monday highest absence?)
14. ✅ Fee payment timeline (how fast do students pay after invoice?)
15. ✅ Late submission rate (exams, assignments)
16. ✅ Repeat failures (students failing same subject >2x)
17. ✅ Peer performance analysis (students with similar profiles)
18. ✅ Parent engagement (portal logins, announcement views)
19. ✅ Class performance comparison matrix
20. ✅ GPA distribution percentiles
21. ✅ Monthly revenue trend
22. ✅ Student lifetime value (total fees potential)
23. ✅ Churning risk students (declining grades >10% drop)
24. ✅ Overdue payment aging (30-60-90 day buckets)
25. ✅ Outstanding fees by class
26. ✅ Exam question difficulty analysis
27. ✅ Staff utilization rate (classes per teacher)
28. ✅ Class capacity utilization
29. ✅ New student retention (still active after X days)
30. ✅ Seasonal patterns (attendance drops around holidays?)
31. ✅ Cumulative GPA ranking (all-time performance)
32. ✅ Peer comparison tool (student vs class avg)
...and more custom queries available

---

## Success Criteria (Week 2)

- [ ] Principal dashboard loads in <1s
- [ ] All 9 report types generated successfully
- [ ] PDF/Excel/CSV exports created in <30s
- [ ] Email delivery working (Pub/Sub → Cloud Function → SendGrid)
- [ ] Looker Studio dashboards responsive + interactive
- [ ] All 30+ queries returning results in <5s
- [ ] Materialized views refreshing hourly
- [ ] Real-time alerts functioning
- [ ] Zero data inconsistencies (Firestore ↔ BigQuery sync <5s)
- [ ] Scheduled reports sent on schedule (Cloud Scheduler working)

**Results:** Full reporting infrastructure ready April 16, 2026.

