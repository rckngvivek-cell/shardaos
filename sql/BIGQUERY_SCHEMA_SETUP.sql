/**
 * BigQuery Schema & Data Pipeline Setup
 * Infrastructure for data warehouse and analytics
 * 
 * This is prepared for Week 5 automation but documented here for reference
 */

// ============================================================================
// BIGQUERY TABLES & SCHEMAS
// ============================================================================

/**
 * TABLE 1: analytics.events
 * Fact table storing all raw telemetry events
 * Partitioning: By DATE(timestamp)
 * Clustering: By event_name, user_id
 */

CREATE TABLE IF NOT EXISTS `YOUR_PROJECT.analytics.events` (
  event_id STRING NOT NULL,
  event_name STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  user_id STRING,
  user_role STRING,
  properties JSON,
  context JSON,
  _stored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
  _ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_name, user_id
OPTIONS(
  description="Raw telemetry events from School ERP",
  labels=[("purpose", "analytics"), ("source", "firestore")],
  expiration_ms=7776000000 -- 90 days
);

/**
 * TABLE 2: analytics.daily_metrics
 * Aggregated metrics by day
 * Partitioning: By date
 * Updated daily via scheduled query
 */

CREATE TABLE IF NOT EXISTS `YOUR_PROJECT.analytics.daily_metrics` (
  date DATE NOT NULL,
  metric_type STRING NOT NULL,
  metric_value FLOAT64,
  metric_count INT64,
  user_count INT64,
  event_count INT64,
  _updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
)
PARTITION BY date
OPTIONS(
  description="Daily aggregated metrics",
  labels=[("purpose", "analytics"), ("type", "aggregated")],
  expiration_ms=31536000000 -- 365 days
);

/**
 * TABLE 3: analytics.user_sessions
 * Session-level aggregated data
 * Partitioning: By session_start
 * Clustering: By user_id
 */

CREATE TABLE IF NOT EXISTS `YOUR_PROJECT.analytics.user_sessions` (
  session_id STRING NOT NULL,
  user_id STRING NOT NULL,
  session_start TIMESTAMP NOT NULL,
  session_end TIMESTAMP,
  duration_seconds INT64,
  page_views INT64,
  api_calls INT64,
  errors INT64,
  device_type STRING,
  location STRING,
  _created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
)
PARTITION BY DATE(session_start)
CLUSTER BY user_id
OPTIONS(
  description="User session data",
  labels=[("purpose", "analytics"), ("type", "sessions")],
  expiration_ms=31536000000 -- 365 days
);

/**
 * TABLE 4: analytics.api_performance
 * API endpoint performance metrics
 * Partitioning: By date, Clustering: By endpoint
 */

CREATE TABLE IF NOT EXISTS `YOUR_PROJECT.analytics.api_performance` (
  date DATE NOT NULL,
  endpoint STRING,
  method STRING,
  status_code INT64,
  request_count INT64,
  error_count INT64,
  latency_p50_ms FLOAT64,
  latency_p95_ms FLOAT64,
  latency_p99_ms FLOAT64,
  latency_mean_ms FLOAT64,
  _updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
)
PARTITION BY date
CLUSTER BY endpoint
OPTIONS(
  description="API endpoint performance analytics",
  labels=[("purpose", "observability"), ("type", "performance")],
  expiration_ms=31536000000 -- 365 days
);

/**
 * TABLE 5: analytics.business_events
 * Business-domain events (school created, student enrolled, etc)
 * Partitioning: By timestamp, Clustering: By event_name
 */

CREATE TABLE IF NOT EXISTS `YOUR_PROJECT.analytics.business_events` (
  event_id STRING NOT NULL,
  event_type STRING NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  school_id STRING,
  user_id STRING,
  properties JSON,
  _inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP(),
)
PARTITION BY DATE(timestamp)
CLUSTER BY event_type, school_id
OPTIONS(
  description="Business events (student enrollment, attendance, etc)",
  labels=[("purpose", "business"), ("source", "firestore")],
  expiration_ms=31536000000 -- 365 days
);

// ============================================================================
// SCHEDULED QUERIES FOR AGGREGATION
// ============================================================================

/**
 * Daily Metrics Aggregation
 * Runs daily at 2:00 AM UTC
 * Aggregates API performance metrics by endpoint and status
 */

CREATE OR REPLACE SCHEDULED QUERY `projects/YOUR_PROJECT/locations/us/queries/daily_api_metrics` AS
SELECT
  CURRENT_DATE() as date,
  'api_performance' as metric_type,
  properties.endpoint as endpoint,
  COUNT(*) as request_count,
  COUNTIF(CAST(properties.status_code as INT64) >= 400) as error_count,
  APPROX_QUANTILES(CAST(properties.latency_ms as FLOAT64), 100)[OFFSET(50)] as latency_p50_ms,
  APPROX_QUANTILES(CAST(properties.latency_ms as FLOAT64), 100)[OFFSET(95)] as latency_p95_ms,
  APPROX_QUANTILES(CAST(properties.latency_ms as FLOAT64), 100)[OFFSET(99)] as latency_p99_ms,
  AVG(CAST(properties.latency_ms as FLOAT64)) as latency_mean_ms,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  DATE(timestamp) = CURRENT_DATE() - 1
  AND event_name = 'api_request'
GROUP BY date, endpoint
UNION ALL
SELECT
  CURRENT_DATE() as date,
  'dau' as metric_type,
  'daily_active_users' as endpoint,
  COUNT(DISTINCT user_id) as request_count,
  0 as error_count,
  0 as latency_p50_ms,
  0 as latency_p95_ms,
  0 as latency_p99_ms,
  0 as latency_mean_ms,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  DATE(timestamp) = CURRENT_DATE() - 1
  AND user_id IS NOT NULL;

"
  options: {
    query_parameters: [],
    destination_dataset: "analytics",
    destination_table: "daily_metrics",
    write_disposition: "WRITE_APPEND",
    partitioning_field: "date"
  },
  schedule: "every day 02:00",
  time_zone: "UTC",
  display_name: "Daily API Performance Metrics"
}
*/

/**
 * Session Aggregation
 * Runs every 6 hours
 * Aggregates session data from events
 */

-- Creates session summary from events
SELECT
  CONCAT(user_id, '_', session_id) as session_id,
  user_id,
  MIN(timestamp) as session_start,
  MAX(timestamp) as session_end,
  TIMESTAMP_DIFF(MAX(timestamp), MIN(timestamp), SECOND) as duration_seconds,
  COUNTIF(event_name = 'page_view') as page_views,
  COUNTIF(event_name = 'api_request') as api_calls,
  COUNTIF(event_name = 'api_error') as errors,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  DATE(timestamp) >= CURRENT_DATE() - 1
GROUP BY session_id, user_id;

// ============================================================================
// VIEWS FOR DASHBOARD & REPORTING
// ============================================================================

/**
 * VW: Daily Active Users Trend
 */

CREATE OR REPLACE VIEW `YOUR_PROJECT.analytics.vw_dau_trend` AS
SELECT
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as dau,
  COUNT(DISTINCT user_role) as unique_roles,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  event_name IN ('page_view', 'api_request')
  AND DATE(timestamp) >= CURRENT_DATE() - 30
GROUP BY date
ORDER BY date DESC;

/**
 * VW: Error Rate Over Time
 */

CREATE OR REPLACE VIEW `YOUR_PROJECT.analytics.vw_error_rate` AS
SELECT
  TIMESTAMP_TRUNC(timestamp, HOUR) as hour,
  COUNT(*) as total_requests,
  COUNTIF(event_name = 'api_error') as error_count,
  ROUND(
    COUNTIF(event_name = 'api_error') / COUNT(*) * 100,
    2
  ) as error_rate_pct,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  timestamp >= CURRENT_TIMESTAMP() - INTERVAL 30 DAY
GROUP BY hour
ORDER BY hour DESC;

/**
 * VW: Feature Usage Summary
 */

CREATE OR REPLACE VIEW `YOUR_PROJECT.analytics.vw_feature_usage` AS
SELECT
  DATE(timestamp) as date,
  properties.feature_name as feature,
  properties.action as action,
  COUNT(*) as usage_count,
  COUNT(DISTINCT user_id) as unique_users,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  event_name = 'feature_accessed'
  AND DATE(timestamp) >= CURRENT_DATE() - 30
GROUP BY date, feature, action
ORDER BY date DESC, usage_count DESC;

/**
 * VW: API Latency Distribution
 */

CREATE OR REPLACE VIEW `YOUR_PROJECT.analytics.vw_api_latency` AS
SELECT
  properties.endpoint as endpoint,
  properties.method as method,
  APPROX_QUANTILES(CAST(properties.latency_ms as FLOAT64), 100)[OFFSET(25)] as latency_p25_ms,
  APPROX_QUANTILES(CAST(properties.latency_ms as FLOAT64), 100)[OFFSET(50)] as latency_p50_ms,
  APPROX_QUANTILES(CAST(properties.latency_ms as FLOAT64), 100)[OFFSET(95)] as latency_p95_ms,
  APPROX_QUANTILES(CAST(properties.latency_ms as FLOAT64), 100)[OFFSET(99)] as latency_p99_ms,
  AVG(CAST(properties.latency_ms as FLOAT64)) as latency_mean_ms,
  COUNT(*) as request_count,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  event_name = 'api_request'
  AND timestamp >= CURRENT_TIMESTAMP() - INTERVAL 7 DAY
GROUP BY endpoint, method
ORDER BY latency_p95_ms DESC;

// ============================================================================
// DATA EXPORT SETUP (Firestore → BigQuery)
// ============================================================================

/**
 * Dataflow Pipeline (Cloud Dataflow)
 * Scheduled job that:
 * 1. Reads events from Firestore collection 'analytics_events'
 * 2. Transforms and validates events
 * 3. Writes to BigQuery table 'analytics.events'
 * 4. Runs daily at 3:00 AM UTC
 * 5. Processes events from previous day
 */

-- Dataflow template configuration (JSON)

{
  "name": "firestore-to-bigquery-analytics",
  "description": "Daily sync of analytics events from Firestore to BigQuery",
  "environment": {
    "serviceAccountEmail": "YOUR_DATAFLOW_SA@YOUR_PROJECT.iam.gserviceaccount.com",
    "tempLocation": "gs://YOUR_PROJECT-dataflow-temp/analytics",
    "network": "default",
    "subnetwork": "default"
  },
  "parameters": {
    "firestoreReadOption": "export",
    "exportCollectionSpec": {
      "collectionPath": "analytics_events",
      "filterField": "timestamp",
      "filterComparison": ">=",
      "filterValue": "${CURRENT_DATE_MINUS_1_DAY}"
    },
    "bigQueryWriteDisposition": "WRITE_APPEND",
    "bigQueryTableSpec": "YOUR_PROJECT:analytics.events",
    "createDisposition": "CREATE_IF_NEEDED"
  },
  "schedule": "every day 03:00"
}

// ============================================================================
// COST OPTIMIZATION STRATEGIES
// ============================================================================

/**
 * 1. Firestore TTL (Time-To-Live)
 *    Delete analytics_events documents older than 90 days
 */

-- Enable TTL on analytics_events collection in Firestore Console
-- Or via CLI: gcloud firestore fields patches events_ttl --database='(default)' --ttl

/**
 * 2. BigQuery Partitioning & Clustering
 *    Already configured in table schemas above
 *    - Partition by timestamp (reduces scan cost)
 *    - Cluster by event_type and user_id (improves query performance)
 */

/**
 * 3. Event Sampling
 *    For high-volume events, sample 10% in production:
 */

-- In AnalyticsService, before logging:
if (Math.random() < 0.1 || specialEvent) {
  await this.logEvent(event);
}

/**
 * 4. Aggregate Early
 *    Use Firestore real-time aggregates instead of querying raw events
 */

// Use metrics collection for quick dashboards
db.collection('metrics').doc('daily_2026-05-06').get();

/**
 * 5. Archive to Cloud Storage
 *    Move events > 365 days old to Cloud Storage for backup/compliance
 */

// ============================================================================
// SETUP CHECKLIST FOR WEEK 5
// ============================================================================

/*
DAY 1: BigQuery Infrastructure
[ ] Create BigQuery tables from schemas above
[ ] Set up views for dashboards
[ ] Configure scheduled queries

DAY 2-3: Data Pipeline
[ ] Create Firestore → BigQuery Dataflow template
[ ] Test with 1 day of historical data
[ ] Validate data transformations

DAY 4: Automation & Monitoring
[ ] Schedule daily Dataflow job (3:00 AM UTC)
[ ] Set up BigQuery monitoring alerts
[ ] Create Looker dashboard from views
[ ] Test email notifications

DAY 5: Documentation & Validation
[ ] Document data warehouse schema
[ ] Create runbook for troubleshooting
[ ] Validate cost projections
[ ] Train team on BigQuery queries
*/

// ============================================================================
// EXAMPLE BIGQUERY QUERIES FOR REPORTING
// ============================================================================

// Query 1: Daily Active Users (Last 30 days)
SELECT
  date,
  dau,
  dau - LAG(dau) OVER (ORDER BY date) as dau_change,
  ROUND((dau - LAG(dau) OVER (ORDER BY date)) / LAG(dau) OVER (ORDER BY date) * 100, 2) as dau_change_pct
FROM `YOUR_PROJECT.analytics.vw_dau_trend`
WHERE date >= CURRENT_DATE() - 30
ORDER BY date DESC;

// Query 2: API Performance Scorecard
SELECT
  endpoint,
  method,
  request_count,
  ROUND(latency_p95_ms, 2) as p95_latency_ms,
  ROUND(latency_p99_ms, 2) as p99_latency_ms,
  CASE
    WHEN latency_p95_ms < 200 THEN 'Excellent'
    WHEN latency_p95_ms < 500 THEN 'Good'
    WHEN latency_p95_ms < 1000 THEN 'Fair'
    ELSE 'Poor'
  END as health_status
FROM `YOUR_PROJECT.analytics.vw_api_latency`
ORDER BY latency_p95_ms DESC;

// Query 3: Error Events (Last 24 hours)
SELECT
  TIMESTAMP_TRUNC(timestamp, MINUTE) as minute,
  properties.endpoint as endpoint,
  properties.error_type as error_type,
  COUNT(*) as error_count,
FROM `YOUR_PROJECT.analytics.events`
WHERE
  event_name = 'api_error'
  AND timestamp >= CURRENT_TIMESTAMP() - INTERVAL 24 HOUR
GROUP BY minute, endpoint, error_type
ORDER BY error_count DESC;
