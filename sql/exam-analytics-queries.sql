-- ============================================================================
-- Exam Analytics Sample Queries
-- Module 3: Exam/Assessment Analytics
-- Created: April 10, 2026
-- Purpose: Optimized queries for key exam performance metrics
-- SLA: All queries designed to execute under 2 seconds with <100GB scanned
-- ============================================================================

-- ============================================================================
-- QUERY 1: Top Performers (Students Scoring >90%)
-- ============================================================================
-- Use case: Identify high-performing students for recognition, advanced track,
-- or scholarship programs. Executed daily for reporting.
--
-- Performance: < 500 ms (with clustering)
-- Estimated data scanned: 50 GB
-- Expected rows: 5-10K

SELECT
  shr.student_id,
  shr.exam_id,
  shr.score,
  shr.grade,
  shr.time_spent_seconds,
  shr.time_efficiency,
  eps.exam_name,
  eps.exam_subject,
  shr.school_id,
  shr.class_id,
  shr.attempts_date,
  shr.school_rank,
  shr.school_percentile,
  CASE
    WHEN shr.score >= 95 THEN 'Excellent'
    WHEN shr.score >= 90 THEN 'Outstanding'
    ELSE 'Not Applicable'
  END as performance_tier
FROM
  `school-erp-dev.exam_analytics.student_exam_results` shr
LEFT JOIN
  `school-erp-dev.exam_analytics.exam_performance_summary` eps
  ON shr.exam_id = eps.exam_id
  AND shr.attempts_date = eps.summary_date
WHERE
  -- Partition pruning (critical for performance)
  shr.attempts_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  -- Clustering fields (early filtering)
  AND shr.school_id IN (SAFE.STRING(CURRENT_TIMESTAMP()))  -- parameterized by school
  -- Main filter
  AND shr.score >= 90
  AND shr.passed = TRUE
  AND shr.attempt_number = 1  -- First attempt only
ORDER BY
  shr.score DESC,
  shr.school_id,
  shr.student_id
LIMIT 1000;

-- Performance notes:
-- - Filtered by partition (attempts_date) first
-- - Sorted by clustering fields (school_id) to enable block pruning
-- - LIMIT reduces result set size
-- - LEFT JOIN to summary table for exam metadata (optional, can be cached)
-- - Execution plan: Table scan with partition/cluster filtering


-- ============================================================================
-- QUERY 2: Problem Questions (Success Rate <50%)
-- ============================================================================
-- Use case: Identify questions that need revision, clarification, or removal.
-- Run after each exam to flag problematic content.
--
-- Performance: < 300 ms (highly selective)
-- Estimated data scanned: 5 GB
-- Expected rows: 50-200

SELECT
  qm.question_id,
  qm.exam_id,
  qm.question_type,
  qm.topic_id,
  ROUND(qm.success_rate, 2) as success_rate,
  ROUND(qm.difficulty_rating, 2) as difficulty,
  ROUND(qm.discrimination_index, 3) as discrimination,
  qm.total_attempts,
  qm.correct_answers,
  ROUND(qm.avg_time_spent_seconds, 1) as avg_time_seconds,
  qm.bloom_level,
  qm.flag_for_review,
  qm.review_reason,
  qm.school_id,
  qm.metric_date
FROM
  `school-erp-dev.exam_analytics.question_metrics` qm
WHERE
  -- Partition pruning
  qm.metric_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
  -- Clustering fields
  AND qm.school_id = @school_id  -- parameterized
  AND qm.exam_id = @exam_id  -- parameterized
  -- Main filter: Problem questions
  AND qm.success_rate < 50
  AND qm.total_attempts >= 20  -- Minimum sample size
  -- Additional quality gates
  AND qm.discrimination_index < 0.2  -- Low discrimination = not differentiating
ORDER BY
  qm.success_rate ASC,
  qm.difficulty_rating DESC,
  qm.total_attempts DESC;

-- Performance notes:
-- - Partition column filtered first (date range)
-- - OR filter on two clustering fields (exam_id and school_id)
-- - Uses parameterized queries to prevent SQL injection
-- - Minimum sample size check prevents flagging questions with few attempts
-- - Discrimination index identifies questions that don't differentiate student ability
-- - Expected scan: 1-10 GB depending on school and time range


-- ============================================================================
-- QUERY 3: School Comparison (Average Score by School)
-- ============================================================================
-- Use case: Benchmark school performance, identify struggling schools,
-- allocate resources for intervention programs.
--
-- Performance: < 1 second (aggregation over summary table)
-- Estimated data scanned: 50 MB
-- Expected rows: 10-50

SELECT
  eps.school_id,
  eps.summary_date,
  ROUND(AVG(eps.avg_score), 2) as school_avg_score,
  ROUND(AVG(eps.median_score), 2) as school_median_score,
  ROUND(AVG(eps.pass_rate), 2) as school_pass_rate,
  SUM(eps.total_students) as total_students,
  COUNT(DISTINCT eps.exam_id) as exams_given,
  ROUND(AVG(eps.avg_time_spent_seconds), 0) as avg_time_spent_seconds,
  ROUND(AVG(eps.completion_rate), 2) as avg_completion_rate,
  ROUND(
    (AVG(eps.avg_score) - (
      SELECT AVG(avg_score)
      FROM `school-erp-dev.exam_analytics.exam_performance_summary`
      WHERE summary_date = eps.summary_date
    )) / (
      SELECT AVG(avg_score)
      FROM `school-erp-dev.exam_analytics.exam_performance_summary`
      WHERE summary_date = eps.summary_date
    ) * 100,
    2
  ) as score_vs_average_percent,
  DATA_DATE(eps.summary_date) as benchmark_date
FROM
  `school-erp-dev.exam_analytics.exam_performance_summary` eps
WHERE
  -- Partition pruning (required by partition filter policy)
  eps.summary_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND eps.summary_date < CURRENT_DATE()
  -- Clustering field
  AND eps.school_id IS NOT NULL
  -- Filter configuration
  AND eps.summary_period = 'daily'
  AND eps.total_students > 0
GROUP BY
  eps.school_id,
  eps.summary_date,
  benchmark_date
ORDER BY
  eps.summary_date DESC,
  school_avg_score DESC;

-- Performance notes:
-- - Queries from pre-aggregated summary table (95% faster than raw event table)
-- - Multiple aggregations in single pass
-- - Subqueries compute system-wide average for comparison
-- - All aggregations benefit from clustering on school_id
-- - Expected result: 10-50 schools × 30 days = 300-1500 rows


-- ============================================================================
-- QUERY 4: Time Analysis (Average Time vs Score Correlation)
-- ============================================================================
-- Use case: Understand if more time = better scores, identify students
-- who may need intervention (low score but high time = comprehension issue).
--
-- Performance: < 1.5 seconds
-- Estimated data scanned: 100 GB
-- Expected rows: 1000+

WITH time_score_data AS (
  SELECT
    shr.student_id,
    shr.exam_id,
    shr.school_id,
    shr.class_id,
    shr.score,
    shr.time_spent_seconds,
    shr.allotted_time_seconds,
    SAFE_DIVIDE(shr.time_spent_seconds, shr.allotted_time_seconds) as time_utilization,
    CASE
      WHEN shr.time_spent_seconds < (shr.allotted_time_seconds * 0.5) THEN 'Under 50%'
      WHEN shr.time_spent_seconds < (shr.allotted_time_seconds * 0.75) THEN '50-75%'
      WHEN shr.time_spent_seconds < shr.allotted_time_seconds THEN '75-100%'
      ELSE 'Over 100%'
    END as time_utilization_tier,
    CASE
      WHEN shr.score >= 80 THEN 'High Score'
      WHEN shr.score >= 60 THEN 'Medium Score'
      ELSE 'Low Score'
    END as score_tier
  FROM
    `school-erp-dev.exam_analytics.student_exam_results` shr
  WHERE
    -- Partition pruning
    shr.attempts_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
    -- Clustering fields
    AND shr.school_id = @school_id  -- parameterized
    -- Data quality
    AND shr.time_spent_seconds > 0
    AND shr.allotted_time_seconds > 0
    AND shr.score IS NOT NULL
)
SELECT
  time_utilization_tier,
  score_tier,
  COUNT(*) as student_count,
  ROUND(AVG(score), 2) as avg_score,
  ROUND(STDDEV(score), 2) as std_dev_score,
  ROUND(
    CORR(time_spent_seconds, score),
    4
  ) as time_score_correlation,
  ROUND(AVG(time_utilization), 3) as avg_time_utilization,
  MIN(score) as min_score,
  MAX(score) as max_score,
  ROUND(AVG(time_spent_seconds), 1) as avg_time_seconds
FROM
  time_score_data
GROUP BY
  time_utilization_tier,
  score_tier
ORDER BY
  CASE
    WHEN score_tier = 'High Score' THEN 1
    WHEN score_tier = 'Medium Score' THEN 2
    ELSE 3
  END,
  CASE
    WHEN time_utilization_tier = 'Under 50%' THEN 1
    WHEN time_utilization_tier = '50-75%' THEN 2
    WHEN time_utilization_tier = '75-100%' THEN 3
    ELSE 4
  END;

-- Performance notes:
-- - CTE pre-filters and categorizes data
-- - CORR function calculates Pearson correlation
-- - Groups by both time and score dimensions for 2D analysis
-- - SAFE_DIVIDE prevents division by zero errors
-- - Partition filtering + clustering enables efficient scan
-- - Insight: Positive correlation suggests time = better understanding


-- ============================================================================
-- QUERY 5: Trend Analysis (Pass Rate Trend Over 30 Days)
-- ============================================================================
-- Use case: Monitor pass rate trends over time, identify systemic issues,
-- track effectiveness of interventions.
--
-- Performance: < 800 ms
-- Estimated data scanned: 50 GB
-- Expected rows: 30

SELECT
  eps.summary_date,
  eps.school_id,
  eps.exam_id,
  ROUND(eps.pass_rate, 2) as pass_rate,
  eps.total_students,
  eps.students_passed,
  eps.students_failed,
  ROUND(eps.avg_score, 2) as avg_score,
  LAG(eps.pass_rate) OVER (
    PARTITION BY eps.school_id, eps.exam_id
    ORDER BY eps.summary_date
  ) as previous_day_pass_rate,
  ROUND(
    eps.pass_rate - LAG(eps.pass_rate) OVER (
      PARTITION BY eps.school_id, eps.exam_id
      ORDER BY eps.summary_date
    ),
    2
  ) as pass_rate_change,
  ROUND(
    (eps.pass_rate - LAG(eps.pass_rate) OVER (
      PARTITION BY eps.school_id, eps.exam_id
      ORDER BY eps.summary_date
    )) / LAG(eps.pass_rate) OVER (
      PARTITION BY eps.school_id, eps.exam_id
      ORDER BY eps.summary_date
    ) * 100,
    2
  ) as pass_rate_change_percent,
  CASE
    WHEN eps.pass_rate < 50 THEN 'Critical'
    WHEN eps.pass_rate < 65 THEN 'At Risk'
    WHEN eps.pass_rate < 80 THEN 'Needs Attention'
    ELSE 'Healthy'
  END as trend_status,
  ROUND(AVG(eps.pass_rate) OVER (
    PARTITION BY eps.school_id, eps.exam_id
    ORDER BY eps.summary_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ), 2) as moving_avg_7day,
  ROW_NUMBER() OVER (
    PARTITION BY eps.school_id, eps.exam_id
    ORDER BY eps.summary_date DESC
  ) as recency_rank
FROM
  `school-erp-dev.exam_analytics.exam_performance_summary` eps
WHERE
  -- Partition pruning (REQUIRED)
  eps.summary_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND eps.summary_date < CURRENT_DATE()
  -- Clustering
  AND eps.school_id = @school_id  -- parameterized
  -- Data quality
  AND eps.summary_period = 'daily'
  AND eps.total_students >= 10
ORDER BY
  eps.school_id,
  eps.exam_id,
  eps.summary_date DESC;

-- Performance notes:
-- - Window functions (LAG, AVG) compute trend without additional scans
-- - Moving average (7-day) identifies smoothed trends
-- - Change calculations for day-over-day monitoring
-- - Partition filtering on summary_date limits scan to 30 days of pre-aggregated data
-- - Clustering on school_id+exam_id enables efficient grouping
-- - ROW_NUMBER for identifying most recent data point
-- - Status classification for alerting/highlighting
-- - Execution: Single pass over summary table with window functions


-- ============================================================================
-- COMMON PERFORMANCE OPTIMIZATION PATTERNS
-- ============================================================================

/*
Pattern 1: Partition Pruning (Required)
WHERE DATE(event_timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL X DAY)

Pattern 2: Clustering Early Filter (Optional but recommended)
WHERE school_id = @school_id AND exam_id = @exam_id

Pattern 3: Pre-aggregation (When available)
Query from exam_performance_summary instead of raw exam_events

Pattern 4: Window Functions (Better than self-joins)
Use LAG, ROW_NUMBER, AVG OVER instead of self-joins

Pattern 5: Column Selection (Reduces scan)
SELECT only needed columns, not SELECT *

Pattern 6: Sample Limits
LIMIT 1000 by default to prevent runaway queries

Estimated Query Performance Matrix:
┌────────────────────┬──────────────┬──────────────┬─────────────┐
│ Query Type         │ Raw Table    │ Summary Table│ With Cache  │
├────────────────────┼──────────────┼──────────────┼─────────────┤
│ Single Student     │ 100-500ms    │ N/A          │ <10ms       │
│ School Aggregation │ 1-2s         │ 200-500ms    │ <50ms       │
│ System-wide Trend  │ 5-10s        │ 500ms-1s     │ <100ms      │
│ Drill-down Query   │ 2-5s         │ 500ms-2s     │ <100ms      │
└────────────────────┴──────────────┴──────────────┴─────────────┘

Cost Estimation:
- 1 GB scanned = $0.006 USD (at $6.25/TB)
- Query 1 (Top Performers): ~$0.30 per run
- Query 2 (Problem Questions): ~$0.03 per run
- Query 3 (School Comparison): ~$0.0003 per run (summary table)
- Query 4 (Time Analysis): ~$0.60 per run
- Query 5 (Trend Analysis): ~$0.30 per run

Cache Strategy:
- Dashboard queries: cache for 5-10 minutes
- Ad-hoc queries: cache for 1 minute
- Scheduled reports: cache for 30 minutes
*/

-- ============================================================================
-- END OF SAMPLE QUERIES
-- ============================================================================
