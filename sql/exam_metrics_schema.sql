-- ============================================================================
-- BigQuery Exam/Assessment Analytics Schema
-- Module 3: Exam Management & Analytics Foundation
-- Created: April 10, 2026
-- Data Engineer: Week 7 Day 1
-- ============================================================================
-- Purpose: Real-time and batch analytics for exam performance, student results,
-- and question-level metrics across all schools in the ERP system
-- ============================================================================

-- Configuration: Use standard SQL, not legacy SQL
-- Schema timezone: UTC

-- ============================================================================
-- TABLE 1: exam_events
-- ============================================================================
-- Description: Real-time streaming events from Firestore exam interactions
-- Purpose: Raw event log for streaming ingestion via Pub/Sub
-- Partitioning: TIMESTAMP_TRUNC(event_timestamp, DAY)
-- Clustering: school_id, exam_id, student_id
-- SLA: Events appear in BigQuery within 2 seconds (95% percentile)
-- Retention: 90 days (then archived to GCS)

CREATE TABLE IF NOT EXISTS `school-erp-dev.exam_analytics.exam_events` (
  -- Event Identifiers
  event_id STRING NOT NULL OPTIONS(description="Unique event ID from Firestore"),
  event_timestamp TIMESTAMP NOT NULL OPTIONS(description="When event occurred (UTC)"),
  event_type STRING NOT NULL OPTIONS(description="Event type: started, submitted, graded, reviewed, appealed"),
  ingestion_timestamp TIMESTAMP NOT NULL OPTIONS(description="When event was ingested into BigQuery"),

  -- Exam & Content References
  exam_id STRING NOT NULL OPTIONS(description="Unique exam identifier from Firestore"),
  question_id STRING OPTIONS(description="If event is question-level (e.g., time tracking)"),
  
  -- Student & School Context
  student_id STRING NOT NULL OPTIONS(description="Unique student identifier"),
  school_id STRING NOT NULL OPTIONS(description="School the exam belongs to"),
  class_id STRING OPTIONS(description="Class/Grade for the exam"),
  academic_year STRING OPTIONS(description="Academic year (YYYY format)"),
  
  -- Event Payload
  event_data JSON OPTIONS(description="Raw event payload from Firestore"),
  
  -- Processing
  processed_flag BOOL DEFAULT FALSE OPTIONS(description="Flag for batch processing"),
  error_flag BOOL DEFAULT FALSE OPTIONS(description="Error during processing"),
  error_message STRING OPTIONS(description="Error details if processing failed")
)
PARTITION BY TIMESTAMP_TRUNC(event_timestamp, DAY)
CLUSTER BY school_id, exam_id, student_id
OPTIONS(
  description="Real-time exam event stream from Firestore. Used for streaming analytics and aggregation.",
  require_partition_filter=TRUE
);

-- ============================================================================
-- TABLE 2: exam_submissions
-- ============================================================================
-- Description: Aggregated exam submission records
-- Purpose: Deduped, clean records of student exam submissions
-- Partitioning: submission_date (DATE of submission)
-- Clustering: school_id, exam_id, student_id
-- Update frequency: Real-time (from streaming) + nightly reconciliation
-- SLA: Complete within 5 seconds of exam submission

CREATE TABLE IF NOT EXISTS `school-erp-dev.exam_analytics.exam_submissions` (
  -- Submission Identifiers
  submission_id STRING NOT NULL OPTIONS(description="Unique submission ID (exam_id + student_id)"),
  exam_id STRING NOT NULL OPTIONS(description="Reference to exam"),
  student_id STRING NOT NULL OPTIONS(description="Reference to student"),
  
  -- Submission Metadata
  submitted_at TIMESTAMP NOT NULL OPTIONS(description="When exam was submitted"),
  submission_date DATE NOT NULL OPTIONS(description="Date of submission (for partitioning)"),
  school_id STRING NOT NULL OPTIONS(description="School context"),
  class_id STRING OPTIONS(description="Class context"),
  
  -- Scoring
  score FLOAT64 OPTIONS(description="Raw score (0-100)"),
  grade STRING OPTIONS(description="Letter grade (A, B, C, D, F)"),
  passed BOOL OPTIONS(description="Whether student passed (score >= passing_score)"),
  passing_score FLOAT64 OPTIONS(description="School's configured passing score"),
  
  -- Submission Details
  total_questions INT64 OPTIONS(description="Total questions in exam"),
  questions_attempted INT64 OPTIONS(description="Questions student answered"),
  questions_correct INT64 OPTIONS(description="Correctly answered questions"),
  
  -- Time Tracking
  started_at TIMESTAMP OPTIONS(description="When student started exam"),
  time_spent_seconds INT64 OPTIONS(description="Total time spent (seconds)"),
  allowed_time_seconds INT64 OPTIONS(description="Allowed time (seconds)"),
  
  -- Additional Context
  attempt_number INT64 DEFAULT 1 OPTIONS(description="1st attempt, 2nd attempt, etc."),
  submission_status STRING OPTIONS(description="submitted, graded, reviewed, appealed"),
  regrade_requested BOOL DEFAULT FALSE OPTIONS(description="Whether regrade was requested"),
  
  -- Data Quality
  last_updated TIMESTAMP OPTIONS(description="Last update timestamp"),
  data_quality_score FLOAT64 OPTIONS(description="Data completeness score 0-1")
)
PARTITION BY submission_date
CLUSTER BY school_id, exam_id, student_id
OPTIONS(
  description="Aggregated exam submission records. One row per student per attempt per exam.",
  require_partition_filter=TRUE
);

-- ============================================================================
-- TABLE 3: question_metrics
-- ============================================================================
-- Description: Question-level analytics and performance metrics
-- Purpose: Understand which questions are problematic and how students interact with them
-- Partitioning: DATE(metric_calculated_date)
-- Clustering: exam_id, school_id
-- Update frequency: Real-time + nightly rollup
-- SLA: Updates within 10 seconds of exam completion

CREATE TABLE IF NOT EXISTS `school-erp-dev.exam_analytics.question_metrics` (
  -- Identifiers
  question_id STRING NOT NULL OPTIONS(description="Unique question identifier"),
  exam_id STRING NOT NULL OPTIONS(description="Exam this question belongs to"),
  school_id STRING NOT NULL OPTIONS(description="School (for multi-school analysis)"),
  
  -- Aggregation Period
  metric_date DATE NOT NULL OPTIONS(description="Date metrics are calculated for"),
  metric_calculated_at TIMESTAMP OPTIONS(description="When metrics were calculated"),
  
  -- Performance Metrics
  total_attempts INT64 DEFAULT 0 OPTIONS(description="Total times question was attempted"),
  correct_answers INT64 DEFAULT 0 OPTIONS(description="Number of correct answers"),
  incorrect_answers INT64 DEFAULT 0 OPTIONS(description="Number of incorrect answers"),
  partial_credit INT64 DEFAULT 0 OPTIONS(description="Partial credit responses"),
  
  success_rate FLOAT64 OPTIONS(description="% of students who got it right (0-100)"),
  avg_score FLOAT64 OPTIONS(description="Average score for this question (0-100)"),
  
  -- Time Analysis
  avg_time_spent_seconds FLOAT64 OPTIONS(description="Average time students spend on this question"),
  median_time_spent_seconds FLOAT64 OPTIONS(description="Median time spent"),
  std_dev_time_seconds FLOAT64 OPTIONS(description="Standard deviation of time spent"),
  
  -- Difficulty & Discrimination
  difficulty_rating FLOAT64 OPTIONS(description="Calculated difficulty (0=easy, 1=hard)"),
  discrimination_index FLOAT64 OPTIONS(description="Point-biserial correlation with total score"),
  
  -- Question Metadata
  question_type STRING OPTIONS(description="mcq, short_answer, essay, matching, etc."),
  bloom_level STRING OPTIONS(description="Bloom's taxonomy level: knowledge, comprehension, application, analysis, synthesis, evaluation"),
  topic_id STRING OPTIONS(description="Curriculum topic reference"),
  
  -- Flag for Investigation
  flag_for_review BOOL DEFAULT FALSE OPTIONS(description="Low success rate or high discrimination"),
  review_reason STRING OPTIONS(description="Why question is flagged for review")
)
PARTITION BY metric_date
CLUSTER BY exam_id, school_id
OPTIONS(
  description="Question-level performance metrics. Updated in real-time and nightly.",
  require_partition_filter=TRUE
);

-- ============================================================================
-- TABLE 4: student_exam_results
-- ============================================================================
-- Description: Student-level exam performance snapshot
-- Purpose: Quick lookup of how students performed on specific exams
-- Partitioning: attempts_date (DATE student took exam)
-- Clustering: school_id, student_id, exam_id
-- Update frequency: Real-time (streaming) + nightly batch
-- SLA: Complete within 3 seconds of exam grading

CREATE TABLE IF NOT EXISTS `school-erp-dev.exam_analytics.student_exam_results` (
  -- Identifiers
  student_id STRING NOT NULL OPTIONS(description="Student identifier"),
  exam_id STRING NOT NULL OPTIONS(description="Exam identifier"),
  school_id STRING NOT NULL OPTIONS(description="School identifier"),
  class_id STRING OPTIONS(description="Class/Grade identifier"),
  
  -- Result Metadata
  attempts_date DATE NOT NULL OPTIONS(description="Date student took exam"),
  attempted_at TIMESTAMP NOT NULL OPTIONS(description="When exam was submitted"),
  attempt_number INT64 DEFAULT 1 OPTIONS(description="1st, 2nd, 3rd attempt, etc."),
  
  -- Scoring
  score FLOAT64 NOT NULL OPTIONS(description="Final score (0-100)"),
  grade STRING OPTIONS(description="Letter grade"),
  passed BOOL OPTIONS(description="Pass/Fail status"),
  percentage INT64 OPTIONS(description="Score as percentage (0-100)"),
  
  -- Performance Details
  total_questions INT64 OPTIONS(description="Total questions attempted"),
  questions_correct INT64 OPTIONS(description="Number of correct answers"),
  correct_percentage FLOAT64 OPTIONS(description="% of questions correct"),
  
  -- Time Analysis
  time_spent_seconds INT64 OPTIONS(description="Total time spent (seconds)"),
  allotted_time_seconds INT64 OPTIONS(description="Allotted time (seconds)"),
  time_efficiency FLOAT64 OPTIONS(description="Time spent / allotted time ratio"),
  
  -- Benchmarking
  school_rank INT64 OPTIONS(description="Student's rank in school for this exam"),
  class_rank INT64 OPTIONS(description="Student's rank in class for this exam"),
  school_percentile FLOAT64 OPTIONS(description="Student's percentile rank in school"),
  
  -- Academic Context
  academic_year STRING OPTIONS(description="Academic year (YYYY format)"),
  semester STRING OPTIONS(description="Semester/Term"),
  subject_id STRING OPTIONS(description="Subject/Course identifier"),
  
  -- Flags
  needs_remediation BOOL DEFAULT FALSE OPTIONS(description="Score below remediation threshold"),
  high_performer BOOL DEFAULT FALSE OPTIONS(description="Score in top 20%"),
  
  -- Metadata
  last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP() OPTIONS(description="Last update timestamp")
)
PARTITION BY attempts_date
CLUSTER BY school_id, student_id, exam_id
OPTIONS(
  description="Student exam results snapshot. One row per student per exam per attempt.",
  require_partition_filter=TRUE
);

-- ============================================================================
-- TABLE 5: exam_performance_summary
-- ============================================================================
-- Description: Daily aggregated exam performance metrics
-- Purpose: Fast queries for dashboards and reports
-- Partitioning: summary_date (DATE)
-- Clustering: school_id, exam_id
-- Update frequency: Nightly (2 AM UTC) + incremental
-- SLA: Daily summary complete by 2 AM UTC

CREATE TABLE IF NOT EXISTS `school-erp-dev.exam_analytics.exam_performance_summary` (
  -- Identifiers
  summary_date DATE NOT NULL OPTIONS(description="Summary date (start of aggregation period)"),
  exam_id STRING NOT NULL OPTIONS(description="Exam identifier"),
  school_id STRING NOT NULL OPTIONS(description="School identifier"),
  class_id STRING OPTIONS(description="Class identifier (optional granularity)"),
  
  -- Aggregation Window
  summary_period STRING NOT NULL OPTIONS(description="daily, weekly, monthly"),
  summary_generated_at TIMESTAMP NOT NULL OPTIONS(description="When summary was generated"),
  
  -- Student Participation
  total_students INT64 DEFAULT 0 OPTIONS(description="Students who took exam"),
  students_attempted INT64 DEFAULT 0 OPTIONS(description="Students who attempted (same as total for single day)"),
  
  -- Scoring Aggregates
  avg_score FLOAT64 OPTIONS(description="Average score across all students"),
  median_score FLOAT64 OPTIONS(description="Median score"),
  std_dev_score FLOAT64 OPTIONS(description="Standard deviation"),
  min_score FLOAT64 OPTIONS(description="Minimum score"),
  max_score FLOAT64 OPTIONS(description="Maximum score"),
  
  -- Pass/Fail Metrics
  students_passed INT64 DEFAULT 0 OPTIONS(description="Students who passed"),
  students_failed INT64 DEFAULT 0 OPTIONS(description="Students who failed"),
  pass_rate FLOAT64 OPTIONS(description="Pass rate (0-100)"),
  fail_rate FLOAT64 OPTIONS(description="Fail rate (0-100)"),
  
  -- Grade Distribution
  grade_a_count INT64 DEFAULT 0 OPTIONS(description="Count of A grades"),
  grade_b_count INT64 DEFAULT 0 OPTIONS(description="Count of B grades"),
  grade_c_count INT64 DEFAULT 0 OPTIONS(description="Count of C grades"),
  grade_d_count INT64 DEFAULT 0 OPTIONS(description="Count of D grades"),
  grade_f_count INT64 DEFAULT 0 OPTIONS(description="Count of F grades"),
  
  -- Time Analysis
  avg_time_spent_seconds INT64 OPTIONS(description="Average time spent across students"),
  median_time_spent_seconds INT64 OPTIONS(description="Median time spent"),
  avg_allotted_time_seconds INT64 OPTIONS(description="Average allotted time"),
  
  -- Quality Metrics
  completion_rate FLOAT64 OPTIONS(description="% of students who completed exam"),
  average_question_success_rate FLOAT64 OPTIONS(description="Average success rate across questions"),
  
  -- Metadata
  exam_name STRING OPTIONS(description="Human-readable exam name"),
  exam_subject STRING OPTIONS(description="Subject/Course name"),
  data_quality_score FLOAT64 OPTIONS(description="Data completeness 0-1")
)
PARTITION BY summary_date
CLUSTER BY school_id, exam_id
OPTIONS(
  description="Daily aggregated exam performance statistics. Populated nightly for trend analysis.",
  require_partition_filter=TRUE
);

-- ============================================================================
-- INDEXES & VIEWS
-- ============================================================================

-- Performance: Pre-compute common aggregations
CREATE TABLE IF NOT EXISTS `school-erp-dev.exam_analytics.exam_performance_index` (
  school_id STRING NOT NULL,
  exam_id STRING NOT NULL,
  metric_date DATE NOT NULL,
  metric_type STRING NOT NULL,
  metric_value FLOAT64,
  created_at TIMESTAMP
)
CLUSTER BY school_id, exam_id
OPTIONS(description="Index table for fast metric lookups");

-- ============================================================================
-- COMMENTS FOR COLUMN-LEVEL DOCUMENTATION
-- ============================================================================

-- exam_events: Key columns
-- - event_timestamp: Must be within last 90 days for retention
-- - event_type: Controls which aggregation pipeline processes the event
-- - processed_flag: Set to TRUE after successful aggregation

-- exam_submissions: Critical path
-- - submission_id: Composite key: CONCAT(exam_id, '-', student_id, '-', attempt_number)
-- - score: Must be validated against exam max_score in metadata
-- - passed: Depends on school's passing_score configuration

-- question_metrics: Analysis fields
-- - success_rate: (correct_answers / total_attempts) * 100
-- - discrimination_index: Correlation between question score and total exam score
-- - difficulty_rating: Inverse of success_rate, normalized to 0-1

-- student_exam_results: Ranking fields
-- - school_rank: Row number ordered by score DESC within school
-- - school_percentile: (school_rank / total_students_in_school) * 100

-- exam_performance_summary: RLS boundary
-- - school_id: Used for row-level security policies
-- - pass_rate: Must equal (students_passed / total_students) * 100

-- ============================================================================
-- PERFORMANCE TUNING NOTES
-- ============================================================================
/*
PARTITIONING STRATEGY:
- All event tables partitioned by TIMESTAMP_TRUNC(timestamp, DAY)
- Aggregation tables partitioned by DATE
- Benefits: Faster queries, lower cost, automatic archival after 90 days

CLUSTERING STRATEGY:
- Primary: school_id (for multi-tenant organization)
- Secondary: exam_id or student_id (common JOIN keys)
- Benefits: Reduces data scanned by 50-70% for common filtering patterns

QUERY OPTIMIZATION TIPS:
1. Always filter by partition column (exam_date DATE, event_timestamp TIMESTAMP)
2. Use CLUSTER fields in WHERE clauses for early filtering
3. Pre-aggregate in summary tables for dashboard queries
4. Use materialized views for frequently accessed aggregations

ESTIMATED QUERY PERFORMANCE:
- Raw event queries: 5-10 seconds (100M events)
- Aggregated queries: < 1 second (summary tables)
- Drill-down queries: 2-5 seconds (with clustering)

DATA RETENTION POLICY:
- exam_events: 90 days (hot)
- exam_submissions: 1 year (historical analysis)
- exam_performance_summary: 3 years (trend analysis)
- Archives: Move to GCS Nearline after retention period

ESTIMATED STORAGE (for 100K active users, 10 schools):
- exam_events: 500 GB/month
- exam_submissions: 50 GB/month
- question_metrics: 10 GB/month
- student_exam_results: 30 GB/month
- exam_performance_summary: 5 GB/month
- Total: ~600 GB/month (with compression ~150 GB/month)

COST OPTIMIZATION:
- Query cost @ $6.25 per TB: ~$1 per nightly sync (~100 GB)
- Storage cost @ $25 per TB/month: ~$3.75/month
- Recommended: Partitioning + Clustering saves 50% on queries
*/

-- ============================================================================
-- STREAMING INGESTION SUPPORT
-- ============================================================================
/*
Firestore → Pub/Sub → Dataflow → BigQuery

1. Dataflow template reads from Pub/Sub
2. Transforms and deduplicates events
3. Streams to exam_events table in real-time
4. DML writes via Dataflow streaming inserts

Connection details for Firebase Admin SDK:
- Project: school-erp-dev
- Topic: projects/school-erp-dev/topics/exam-events
- Subscription: projects/school-erp-dev/subscriptions/bq-exam-analytics
- Dataflow Job: exam-streaming-pipeline
*/

-- ============================================================================
-- END OF SCHEMA DEFINITION
-- ============================================================================
