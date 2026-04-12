# Exam Analytics ETL Pipeline Design
**Module 3: Exam/Assessment Analytics**  
**Created:** April 10, 2026  
**Data Engineer:** Week 7 Day 1  
**Version:** 1.0  

---

## Executive Summary

This document outlines the complete ETL (Extract, Transform, Load) pipeline for the School ERP exam analytics system. The pipeline ingests real-time exam events from Firestore, aggregates data through multiple transformation layers, and populates BigQuery for real-time dashboards and historical analysis.

**Key SLAs:**
- **Real-time streaming:** 95% of events within 2 seconds of exam submission
- **Nightly batch:** Daily aggregation complete by 2:00 AM UTC
- **Query performance:** All dashboard queries under 2 seconds
- **System availability:** 99.5% uptime during school hours

---

## 1. Architecture Overview

### 1.1 High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     EXAM EVENT SOURCES                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Firestore  │  │  Student App │  │ Staff Portal │          │
│  │   Database   │  │  (Real-time)  │  │ (Monitoring) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└────────┬────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              STREAMING COLLECTION LAYER (Real-time)             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Google Cloud Pub/Sub                                      │ │
│  │  Topic: projects/school-erp-dev/topics/exam-events         │ │
│  │  Subscription: projects/school-erp-dev/subscriptions/...   │ │
│  └────────────────────────────────────────────────────────────┘ │
└────────┬────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────┬─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│   DATAFLOW JOB   │      │  DATAFLOW JOB    │      │  CLOUD FUNCTIONS │
│  Real-time Stream │      │ Batch Aggregat. │      │  Monitoring      │
│  (Continuous)    │      │  (Nightly)       │      │                  │
└────────┬─────────┘      └────────┬─────────┘      └────────┬─────────┘
         │                         │                         │
         ├─────────────────────────┼─────────────────────────┤
         ▼                         ▼                         ▼
┌──────────────────────────────────────────────────────────────────┐
│                     BIGQUERY DATASETS                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  * exam_events (raw stream ingestion)                    │   │
│  │  * exam_submissions (deduped transactions)               │   │
│  │  * question_metrics (performance aggregates)             │   │
│  │  * student_exam_results (user-level snapshots)           │   │
│  │  * exam_performance_summary (daily aggregates)           │   │
│  │  * staging_tables (intermediate processing)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ├─────────────────────────┬─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐      ┌────────────────┐      ┌──────────────────┐
│  Data Studio    │      │  BI Tools      │      │  Scheduled       │
│  Dashboards     │      │  (Looker, etc) │      │  Reports (PDF)   │
│  (Real-time)    │      │                │      │  (Daily, Weekly) │
└─────────────────┘      └────────────────┘      └──────────────────┘
```

### 1.2 System Components

| Component | Technology | Purpose | SLA |
|-----------|-----------|---------|-----|
| Event Source | Firestore | Real-time exam data store | - |
| Ingestion | Pub/Sub | Event streaming hub | <1 sec latency |
| Stream Processing | Dataflow | Real-time transformations | 2 sec end-to-end |
| Batch Processing | Dataflow + Cloud Scheduler | Nightly aggregations | By 2 AM UTC |
| Data Warehouse | BigQuery | Analytics & reporting | <2 sec query |
| Visualization | Data Studio | Real-time dashboards | 5 min refresh |
| Alerting | Cloud Functions | Monitoring & SLA checks | 1 min latency |

---

## 2. Streaming Ingestion (Real-time Layer)

### 2.1 Firestore to Pub/Sub

**Trigger:** Firestore triggers on exam-related document changes
- Path: `/schools/{school_id}/exams/{exam_id}/submissions/{student_id}`
- Operations: CREATE, UPDATE (submission status changes)
- Event payload: Transform into Pub/Sub message

**Implementation:**
```json
{
  "event_id": "evt_20260410_001",
  "event_type": "exam_submitted",
  "exam_id": "exam_20260410_math101",
  "student_id": "std_12345",
  "school_id": "sch_789",
  "class_id": "cls_10a",
  "timestamp": "2026-04-10T14:30:00Z",
  "payload": {
    "score": 85,
    "submitted_at": "2026-04-10T14:30:00Z",
    "time_spent_seconds": 1800,
    "questions_attempted": 50,
    "questions_correct": 42
  }
}
```

**Pub/Sub Configuration:**
- Topic: `exam-events`
- Message retention: 7 days
- Partition key: `school_id` (for ordered processing per school)
- Publishing rate: Expected 100-500 events/second during peak hours

### 2.2 Dataflow Streaming Pipeline

**Job:** `exam-streaming-pipeline`  
**Type:** Continuous (always running)  
**Autoscaling:** 2-20 workers based on backlog  

**Processing Steps:**

1. **Read from Pub/Sub**
   - Consumer group: `bq-exam-analytics`
   - Error handling: DLQ for unparseable messages
   - Deduplication window: 10 minutes

2. **Validation & Enrichment**
   ```
   Input → Schema Validation → Data Enrichment → Deduplication
   - Validate required fields (exam_id, student_id, school_id)
   - Add processing metadata (ingestion_timestamp)
   - Enrich with school context (name, timezone)
   - Detect duplicates (same event_id within 5 minutes)
   ```

3. **Real-time Aggregations**
   ```
   Sliding Window: 1-minute window with 10-second slides
   - Count: Events per school per exam
   - State: Maintain running totals
   - Watermarking: Allowed lateness = 5 minutes
   ```

4. **Streaming Insert to BigQuery**
   - Destination: `school-erp-dev.exam_analytics.exam_events`
   - Method: Storage Write API (optimized for streaming)
   - Buffer: 1000 records or 10 seconds (whichever first)
   - Retry logic: Exponential backoff (max 3 retries)

**Dataflow Configuration:**
```python
# Pseudocode
pipeline = beam.Pipeline(options=PipelineOptions())

(pipeline
  | 'Read from Pub/Sub' >> beam.io.ReadFromPubSub(topic=TOPIC)
  | 'Parse JSON' >> beam.Map(lambda x: json.loads(x))
  | 'Validate' >> beam.ParDo(ValidateEventFn())
  | 'Deduplicate' >> beam.Partition(DedupPartitionFn, 4)
  | 'Enrich' >> beam.ParDo(EnrichEventFn())
  | 'Add Session Window' >> beam.WindowInto(beam.window.Sessions(10 * 60))
  | 'Write to BigQuery' >> beam.io.WriteToBigQuery(
      table=EVENTS_TABLE,
      use_storage_write_api=True)
)

pipeline.run()
```

**Error Handling:**
- Invalid JSON → DLQ topic `exam-events-dlq`
- Missing fields → Log warning, include in events table with null values
- Duplicate detection → Skip, log occurrence
- BigQuery write failures → Retry buffer, alert if exceeded

---

## 3. Batch Processing (Nightly Aggregation)

### 3.1 Nightly Batch Pipeline

**Trigger:** Cloud Scheduler  
**Schedule:** Daily at 1:30 AM UTC (30-minute buffer before 2 AM SLA)  
**Job Name:** `exam-nightly-aggregation`  
**Estimated Duration:** 15-20 minutes

**Processing Flow:**

```
1:30 AM → Start nightly batch
  ├─ Stage 1: Raw event aggregation (5 min)
  │   └─ Read today's exam_events
  │   └─ Aggregate to exam_submissions
  │   └─ Write staging table
  │
  ├─ Stage 2: Performance calculations (5 min)
  │   └─ Calculate per-student metrics
  │   └─ Update student_exam_results
  │   └─ Compute percentiles
  │
  ├─ Stage 3: Question analysis (5 min)
  │   └─ Group by question
  │   └─ Calculate success rates
  │   └─ Update question_metrics
  │
  ├─ Stage 4: School aggregation (3 min)
  │   └─ Roll up to school level
  │   └─ Calculate daily summary
  │   └─ Update exam_performance_summary
  │
  └─ 2:00 AM → Complete
```

### 3.2 Transformation Logic

#### Transformation A: Raw Events → Exam Submissions

**Source:** `exam_events` (today's records)  
**Destination:** `exam_submissions`  
**SQL Template:**
```sql
INSERT INTO `school-erp-dev.exam_analytics.exam_submissions`
SELECT
  CONCAT(exam_id, '-', student_id, '-', attempt_number) as submission_id,
  exam_id,
  student_id,
  TIMESTAMP(event_timestamp) as submitted_at,
  DATE(event_timestamp) as submission_date,
  school_id,
  class_id,
  -- Extract from event_data JSON
  CAST(JSON_EXTRACT_SCALAR(event_data, '$.score') AS FLOAT64) as score,
  CASE
    WHEN CAST(JSON_EXTRACT_SCALAR(event_data, '$.score') AS FLOAT64) >= 70 THEN 'A'
    WHEN CAST(JSON_EXTRACT_SCALAR(event_data, '$.score') AS FLOAT64) >= 60 THEN 'B'
    -- etc
  END as grade,
  CAST(JSON_EXTRACT_SCALAR(event_data, '$.score') AS FLOAT64) >= 70 as passed,
  70 as passing_score,  -- configurable per school
  CAST(JSON_EXTRACT_SCALAR(event_data, '$.total_questions') AS INT64) as total_questions,
  CAST(JSON_EXTRACT_SCALAR(event_data, '$.questions_attempted') AS INT64) as questions_attempted,
  CAST(JSON_EXTRACT_SCALAR(event_data, '$.questions_correct') AS INT64) as questions_correct,
  CAST(JSON_EXTRACT_SCALAR(event_data, '$.time_spent_seconds') AS INT64) as time_spent_seconds,
  CAST(JSON_EXTRACT_SCALAR(event_data, '$.allowed_time_seconds') AS INT64) as allowed_time_seconds,
  1 as attempt_number,
  'submitted' as submission_status,
  CURRENT_TIMESTAMP() as last_updated,
  1.0 as data_quality_score
FROM `school-erp-dev.exam_analytics.exam_events`
WHERE
  DATE(event_timestamp) = CURRENT_DATE() - 1
  AND event_type = 'submitted'
  AND processed_flag = FALSE
ON CONFLICT (submission_id) DO UPDATE SET
  last_updated = CURRENT_TIMESTAMP(),
  score = EXCLUDED.score,
  passed = EXCLUDED.passed;
```

**Deduplication Strategy:**
- Use submission_id as primary key
- If duplicate detected, keep latest based on `event_timestamp`
- Log duplicates for monitoring

#### Transformation B: Submissions → Exam Performance Summary

**Source:** `exam_submissions` (aggregated)  
**Destination:** `exam_performance_summary`  
**SQL Template:**
```sql
INSERT INTO `school-erp-dev.exam_analytics.exam_performance_summary`
SELECT
  submission_date as summary_date,
  exam_id,
  school_id,
  class_id,
  'daily' as summary_period,
  CURRENT_TIMESTAMP() as summary_generated_at,
  COUNT(DISTINCT student_id) as total_students,
  COUNT(DISTINCT student_id) as students_attempted,
  ROUND(AVG(score), 2) as avg_score,
  ROUND(APPROX_QUANTILES(score, 100)[OFFSET(50)], 2) as median_score,
  ROUND(STDDEV(score), 2) as std_dev_score,
  MIN(score) as min_score,
  MAX(score) as max_score,
  COUNTIF(passed = TRUE) as students_passed,
  COUNTIF(passed = FALSE) as students_failed,
  ROUND(COUNTIF(passed = TRUE) / COUNT(*) * 100, 2) as pass_rate,
  ROUND(COUNTIF(passed = FALSE) / COUNT(*) * 100, 2) as fail_rate,
  -- Grade distribution
  COUNTIF(grade = 'A') as grade_a_count,
  COUNTIF(grade = 'B') as grade_b_count,
  COUNTIF(grade = 'C') as grade_c_count,
  COUNTIF(grade = 'D') as grade_d_count,
  COUNTIF(grade = 'F') as grade_f_count,
  ROUND(AVG(time_spent_seconds), 0) as avg_time_spent_seconds,
  ROUND(APPROX_QUANTILES(time_spent_seconds, 100)[OFFSET(50)], 0) as median_time_spent_seconds,
  ROUND(AVG(allowed_time_seconds), 0) as avg_allotted_time_seconds,
  ROUND(COUNT(*) / COUNT(DISTINCT student_id), 4) as completion_rate,
  ROUND(AVG(questions_correct / total_questions), 2) * 100 as average_question_success_rate,
  'Exam Name' as exam_name,
  'Subject' as exam_subject,
  1.0 as data_quality_score
FROM `school-erp-dev.exam_analytics.exam_submissions`
WHERE submission_date = CURRENT_DATE() - 1
GROUP BY submission_date, exam_id, school_id, class_id
ON CONFLICT (summary_date, exam_id, school_id) DO UPDATE SET
  students_passed = EXCLUDED.students_passed,
  pass_rate = EXCLUDED.pass_rate,
  avg_score = EXCLUDED.avg_score;
```

#### Transformation C: Events → Question Metrics

**Source:** `exam_events` + `exam_submissions`  
**Destination:** `question_metrics`  
**Logic:**
```
For each question_id in today's exams:
  1. Group all question responses by question_id
  2. Calculate success_rate = correct_answers / total_attempts
  3. Calculate difficulty = 1 - (correct_answers / total_attempts)
  4. Compute time statistics (avg, median, std_dev)
  5. Calculate discrimination index (point-biserial correlation)
  6. Apply flags if:
     - success_rate < 30% (hard question)
     - success_rate > 95% (too easy)
     - discrimination_index < 0.2 (not differentiating)
  7. Update question_metrics table with today's snapshot
```

**Discrimination Index Calculation:**
```sql
-- Point-biserial correlation: correlation between binary answer (correct/incorrect)
-- and continuous total score
WITH question_answers AS (
  SELECT
    question_id,
    student_id,
    (correct_on_question)::INT AS correct_binary,
    student_total_score
  FROM exam_question_responses
)
SELECT
  CORR(correct_binary, student_total_score) as discrimination_index
FROM question_answers
GROUP BY question_id;
```

### 3.3 Cloud Scheduler Orchestration

**Configuration:**
```yaml
name: "exam-nightly-aggregation"
schedule: "30 1 * * *"  # 1:30 AM UTC daily
timezone: "UTC"
http_target:
  uri: "https://dataflow.googleapis.com/v1b3/projects/school-erp-dev/templates/exam-nightly-batch"
  http_method: POST
  auth_header:
    add_auth_header: true
  body:
    job_name: "exam-nightly-aggregation"
    parameters:
      maxWorkers: 20
      numWorkers: 2
      machineType: "n1-standard-4"
```

---

## 4. Data Quality & Monitoring

### 4.1 Validation Rules

**Ingestion-stage validation:**
- exam_id format: `exam_YYYYMMDD_*` (required)
- student_id format: `std_*` (required)
- school_id must exist in schools table (required)
- score: 0-100 range (required)
- timestamp: within last 24 hours (required)
- time_spent > 0 (conditional)

**Processing-stage validation:**
- Duplicate detection: Same (exam_id, student_id) within 5 minutes
- Completeness: At least 80% of fields populated
- Consistency: score >= 0, time_spent_seconds >= 0
- Referential integrity: school_id exists in schools dimension

### 4.2 SLA Monitoring

**Real-time Streaming SLA:**
```
Target: 95% of events in BigQuery within 2 seconds

Measurement:
  event_latency = (ingestion_timestamp - event_timestamp)
  SLA_met = COUNT(event_latency < 2s) / COUNT(*) >= 0.95

Alert if: SLA_met < 0.95 for 5 consecutive minutes
Action: Page on-call, investigate Dataflow lag
```

**Daily Batch SLA:**
```
Target: Daily summary complete by 2:00 AM UTC

Measurement:
  batch_duration = (batch_end_time - batch_start_time)
  completion_time = batch_end_time
  SLA_met = completion_time <= "02:00 AM UTC"

Alert if: batch_end_time > 02:00 AM UTC
Action: Investigate slow queries, scale Dataflow workers
```

### 4.3 Error Handling & Retry Logic

**Dataflow Streaming:**
- **Transient errors** (network timeout, rate limits):
  - Retry strategy: exponential backoff (1s, 2s, 4s, 8s, max 10 retries)
  - Dead letter treatment: After 10 retries, send to DLQ topic
  
- **Data errors** (invalid JSON, missing fields):
  - Skip processing, log to Pub/Sub DLQ
  - Include in BigQuery events table with error_flag = TRUE, error_message
  - Daily reconciliation job retrieves from DLQ
  
- **BigQuery write errors:**
  - Invalid schema: Log error, skip row (quota exceeded scenario)
  - Rate limiting: Implement adaptive throttling (backpressure)
  - Quota exceeded: Retry with exponential backoff up to 1 hour

**Batch Pipeline:**
- **SQL errors:** Fail fast, alert, require manual investigation
- **Data quality failures:** Insert into `failed_aggregations` table with reason
- **Incomplete aggregations:** Re-run on next cycle with broader time window

### 4.4 Monitoring Queries

**Check streaming latency:**
```sql
SELECT
  TIMESTAMP_DIFF(ingestion_timestamp, event_timestamp, SECOND) as latency_seconds,
  COUNT(*) as event_count,
  APPROX_QUANTILES(
    TIMESTAMP_DIFF(ingestion_timestamp, event_timestamp, SECOND),
    100
  )[OFFSET(95)] as p95_latency_seconds
FROM `school-erp-dev.exam_analytics.exam_events`
WHERE event_timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
GROUP BY latency_seconds
ORDER BY event_count DESC;
```

**Check aggregation completion:**
```sql
SELECT
  summary_date,
  exam_id,
  school_id,
  summary_generated_at,
  TIMESTAMP_DIFF(summary_generated_at, TIMESTAMP(CURRENT_DATE()), HOUR) as hours_since_day_start
FROM `school-erp-dev.exam_analytics.exam_performance_summary`
WHERE summary_date = CURRENT_DATE() - 1
ORDER BY summary_generated_at DESC
LIMIT 100;
```

---

## 5. Infrastructure & Deployment

### 5.1 GCP Resources

**Pub/Sub:**
- Topic: `exam-events` (multi-region zone: us-central1)
- Subscriptions: 
  - `bq-exam-analytics` (Dataflow consumer)
  - `monitoring-alerts` (Cloud Functions)
- Message retention: 7 days
- Publish rate: 100-500 msgs/sec (peak capacity: 10K msgs/sec)

**Dataflow:**
- Project: `school-erp-dev`
- Region: `us-central1`
- **Streaming Job:**
  - Template: `exam-streaming-pipeline-template`
  - Workers: 2-20 (autoscaling)
  - Machine type: `n1-standard-4` (4 CPU, 15 GB RAM)
  - Estimated cost: $200-300/month
  
- **Batch Job:**
  - Template: `exam-nightly-batch-template`
  - Workers: 2-10 (as needed)
  - Machine type: `n1-standard-8` (8 CPU, 30 GB RAM)
  - Estimated cost: $20/month

**BigQuery:**
- Project: `school-erp-dev`
- Dataset: `exam_analytics`
- Tables: 5 (total ~50-100 GB/month)
- Estimated monthly cost:
  - Storage: $25-50/month (at $25/TB with compression)
  - Queries: $100-200/month (at $6.25/TB, 16-32 TB scanned daily)

**Cloud Scheduler:**
- Job: `exam-nightly-aggregation`
- Frequency: Daily at 1:30 AM UTC
- Cost: Negligible (<$1/month)

### 5.2 Deployment Procedure

**1. Deploy Dataflow Streaming Template**
```bash
# Create template
gcloud dataflow flex-template build \
  gs://school-erp-dev-templates/exam-streaming-template.json \
  --image-gcr-path gcr.io/school-erp-dev/exam-streaming-pipeline:latest \
  --sdk-language PYTHON \
  --flex-template-base-image PYTHON3
```

**2. Deploy Batch Template**
```bash
# Similar process for batch template
```

**3. Create Cloud Scheduler Job**
```bash
gcloud scheduler jobs create pubsub exam-nightly-aggregation \
  --schedule="30 1 * * *" \
  --topic=exam-aggregation-trigger \
  --location=us-central1
```

**4. Set up monitoring alerts**
```yaml
alert_policy:
  - name: streaming-latency-sla
    condition: p95_latency > 2s for 5 minutes
    notification_channels: [slack, email]
  - name: batch-completion-sla
    condition: batch_end_time > 02:00 AM UTC
    notification_channels: [pagerduty]
```

### 5.3 Cost Optimization

| Component | Current | Optimized | Annual Savings |
|-----------|---------|-----------|-----------------|
| Dataflow streaming | $250/mo | $150/mo | $1,200 |
| BigQuery queries | $150/mo | $75/mo | $900 |
| BigQuery storage | $40/mo | $20/mo | $240 |
| **Total** | **$440/mo** | **$245/mo** | **$2,340** |

**Optimization strategies:**
1. Materialize common aggregates (save 60% on query costs)
2. Archive old events to GCS (save 50% on storage)
3. Use partitioning/clustering (reduce scanned data by 70%)
4. Scale batch job concurrency (reduce compute time/cost)

---

## 6. Future Enhancements (Post-MVP)

### 6.1 Advanced Analytics
- Machine learning for predictive performance modeling
- Anomaly detection (unusual score patterns)
- Recommendation engine for struggling students

### 6.2 Advanced Visualizations
- Real-time heatmaps of class performance
- Interactive drill-down to student question responses
- Predictive analytics dashboards

### 6.3 System Integration
- Integration with student information system (SIS)
- Two-way sync with Google Classroom
- API endpoints for third-party integrations

### 6.4 Data Governance
- Data lineage tracking (Data Catalog)
- Automated data quality monitoring (Cloud DQ)
- Row-level security (RLS) policies per school
- GDPR compliance (data retention, PII handling)

---

## 7. Deployment Checklist

- [ ] BigQuery dataset and tables created
- [ ] Firestore collection paths verified
- [ ] Pub/Sub topic and subscriptions configured
- [ ] Dataflow templates built and deployed
- [ ] Test streaming injection (10 test events)
- [ ] Verify real-time latency < 2 seconds
- [ ] Deploy batch job and test
- [ ] Verify nightly aggregation completes by 2 AM
- [ ] Set up monitoring dashboards
- [ ] Configure alerting thresholds
- [ ] Document runbooks and escalation procedures
- [ ] Performance baseline established
- [ ] Cost monitoring enabled
- [ ] Security audit completed (IAM, encryption)
- [ ] Disaster recovery procedure documented

---

## 8. Runbooks & Troubleshooting

### 8.1 Streaming Pipeline Not Processing Events

**Symptoms:** Events not appearing in BigQuery within 2 minutes

**Diagnosis:**
```bash
# Check Pub/Sub subscription backlog
gcloud pubsub subscriptions pull bq-exam-analytics \
  --auto-ack --limit=10

# Check Dataflow job status
gcloud dataflow jobs list --status=active --region us-central1

# Check BigQuery table for recent data
SELECT MAX(ingestion_timestamp) FROM exam_events;
```

**Resolution:**
1. Check Pub/Sub subscription has Active consumers
2. Restart Dataflow job if stuck (drain then replace)
3. Verify IAM permissions (BigQuery write)

### 8.2 Nightly Batch Not Completing by SLA

**Symptoms:** Daily summary not complete by 2 AM UTC

**Diagnosis:**
```sql
-- Check job duration
SELECT
  TIMESTAMP_DIFF(summary_generated_at, CURRENT_TIMESTAMP(), MINUTE) as duration_minutes
FROM exam_performance_summary
WHERE summary_date = CURRENT_DATE() - 1
LIMIT 1;

-- Check for query bottlenecks
SELECT * FROM INFORMATION_SCHEMA.JOBS_BY_PROJECT
WHERE creation_time >= CURRENT_TIMESTAMP() - INTERVAL 1 HOUR
ORDER BY total_slot_ms DESC;
```

**Resolution:**
1. Increase worker count for Batch Dataflow job (up to 20)
2. Optimize slow SQL queries (add clustering hints)
3. Investigate if exam_events table has anomalously high volume

### 8.3 Data Quality Issues (Duplicates, Nulls)

**Symptoms:** Inconsistent aggregation metrics or duplicate submissions

**Diagnosis:**
```sql
-- Check for duplicates
SELECT submission_id, COUNT(*) as cnt
FROM exam_submissions
WHERE DATE(last_updated) = CURRENT_DATE()
GROUP BY submission_id
HAVING COUNT(*) > 1;

-- Check for null scores
SELECT COUNT(*) FROM exam_submissions
WHERE score IS NULL AND last_updated >= CURRENT_TIMESTAMP() - INTERVAL 1 HOUR;
```

**Resolution:**
1. Review DLQ messages for parse errors
2. Adjust deduplication window if needed
3. Re-run aggregation with error correction

---

## 9. Contact & Support

- **Data Engineer On-Call:** [Slack: #data-engineering]
- **Escalation:** CTO (cto@erp.com)
- **Documentation:** [Confluence link]
- **Monitoring Dashboard:** [Grafana link]

---

**Document Status:** APPROVED  
**Last Updated:** April 10, 2026  
**Next Review:** April 17, 2026  

