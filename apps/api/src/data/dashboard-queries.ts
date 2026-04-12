/**
 * BigQuery Dashboard Queries - 4 Core Metrics
 * Data Agent - Phase 1 Analytics
 * 
 * These queries power the real-time dashboards
 * Pre-tested and optimized for performance (<5s)
 */

// =============================================
// QUERY 1: ACTIVE USERS TREND
// =============================================
export const QUERY_ACTIVE_USERS = `
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(DISTINCT school_id) as schools_active
FROM \`school_erp_analytics.events\`
WHERE 
  event_type IN ('user_login', 'dashboard_viewed', 'api_call')
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
`;

// =============================================
// QUERY 2: REPORTS GENERATED DAILY
// =============================================
export const QUERY_REPORTS_GENERATED = `
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as reports_count,
  COUNT(DISTINCT school_id) as schools,
  APPROX_QUANTILES(CAST(JSON_EXTRACT_SCALAR(data, '$.generation_time_ms') AS INT64), 100)[OFFSET(50)] as median_generation_time_ms
FROM \`school_erp_analytics.events\`
WHERE 
  event_type = 'report_generated'
  AND DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
`;

// =============================================
// QUERY 3: REVENUE TREND (Daily)
// =============================================
export const QUERY_REVENUE_TREND = `
SELECT 
  date,
  SUM(amount) as daily_revenue,
  COUNT(*) as transaction_count,
  COUNT(DISTINCT school_id) as schools,
  COUNTIF(status = 'completed') as successful_transactions,
  COUNTIF(status = 'failed') as failed_transactions,
  ROUND(COUNTIF(status = 'completed') / COUNT(*) * 100, 2) as success_rate_percent
FROM \`school_erp_analytics.revenue_transactions\`
WHERE 
  date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  AND status IN ('completed', 'failed')
GROUP BY date
ORDER BY date DESC;
`;

// =============================================
// QUERY 4: ERROR RATE DAILY
// =============================================
export const QUERY_ERROR_RATE = `
SELECT 
  DATE(timestamp) as date,
  COUNT(*) as total_events,
  SUM(IF(event_type LIKE '%error%', 1, 0)) as error_events,
  ROUND(SUM(IF(event_type LIKE '%error%', 1, 0)) / COUNT(*) * 100, 3) as error_rate_percent,
  COUNT(DISTINCT school_id) as affected_schools
FROM \`school_erp_analytics.events\`
WHERE 
  DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY date
ORDER BY date DESC;
`;

// =============================================
// BONUS QUERIES
// =============================================

// School Performance Rankings
export const QUERY_SCHOOL_PERFORMANCE = `
SELECT 
  school_id,
  DATE(CURRENT_DATE()) as snapshot_date,
  active_students,
  avg_attendance,
  ROUND(avg_grade, 2) as avg_grade,
  total_students,
  ROUND(active_students / total_students * 100, 1) as active_percent
FROM \`school_erp_analytics.students_aggregate\`
WHERE date = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
ORDER BY active_students DESC;
`;

// NPS Trend (Weekly)
export const QUERY_NPS_TREND = `
SELECT 
  DATE_TRUNC(DATE(timestamp), WEEK) as week,
  ROUND(AVG(response_value), 2) as weekly_nps,
  COUNT(*) as responses,
  COUNT(DISTINCT school_id) as schools,
  MIN(response_value) as min_score,
  MAX(response_value) as max_score
FROM \`school_erp_analytics.nps_responses\`
WHERE DATE(timestamp) >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 WEEK)
GROUP BY week
ORDER BY week DESC;
`;

// System Health Status
export const QUERY_SYSTEM_HEALTH = `
SELECT 
  CURRENT_TIMESTAMP() as check_time,
  ROUND(AVG(api_latency_ms), 1) as avg_latency_ms,
  MAX(api_latency_ms) as max_latency_ms,
  ROUND(AVG(error_rate_percent), 3) as avg_error_rate,
  MAX(active_connections) as peak_connections,
  ROUND(AVG(database_size_gb), 2) as avg_db_size_gb
FROM \`school_erp_analytics.system_health\`
WHERE 
  DATE(timestamp) = CURRENT_DATE()
  AND TIMESTAMP(timestamp) >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 24 HOUR);
`;

// Top Event Types (Usage Analysis)
export const QUERY_EVENT_DISTRIBUTION = `
SELECT 
  event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT school_id) as schools,
  ROUND(COUNT(*) / SUM(COUNT(*)) OVER () * 100, 2) as percent_of_total
FROM \`school_erp_analytics.events\`
WHERE DATE(timestamp) = CURRENT_DATE() - 1
GROUP BY event_type
ORDER BY event_count DESC
LIMIT 20;
`;

// Revenue by School
export const QUERY_REVENUE_BY_SCHOOL = `
SELECT 
  school_id,
  SUM(amount) as total_revenue,
  COUNT(*) as transaction_count,
  COUNTIF(status = 'completed') as successful_tx,
  ROUND(COUNTIF(status = 'completed') / COUNT(*) * 100, 1) as success_rate,
  MIN(date) as first_transaction_date,
  MAX(date) as last_transaction_date
FROM \`school_erp_analytics.revenue_transactions\`
WHERE DATE(date) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY school_id
ORDER BY total_revenue DESC;
`;

// All queries indexed for fast retrieval
export const ALL_DASHBOARD_QUERIES = {
  activeUsers: {
    name: 'Active Users Trend',
    query: QUERY_ACTIVE_USERS,
    refreshInterval: 3600, // 1 hour
    cacheKey: 'metrics_active_users_30d',
  },
  reportsGenerated: {
    name: 'Reports Generated',
    query: QUERY_REPORTS_GENERATED,
    refreshInterval: 3600,
    cacheKey: 'metrics_reports_30d',
  },
  revenueTrend: {
    name: 'Revenue Trend',
    query: QUERY_REVENUE_TREND,
    refreshInterval: 3600,
    cacheKey: 'metrics_revenue_30d',
  },
  errorRate: {
    name: 'Error Rate',
    query: QUERY_ERROR_RATE,
    refreshInterval: 1800, // 30 minutes
    cacheKey: 'metrics_errors_30d',
  },
  schoolPerformance: {
    name: 'School Performance',
    query: QUERY_SCHOOL_PERFORMANCE,
    refreshInterval: 86400, // 24 hours
    cacheKey: 'school_performance_snapshot',
  },
  npsTrend: {
    name: 'NPS Trend',
    query: QUERY_NPS_TREND,
    refreshInterval: 3600,
    cacheKey: 'metrics_nps_12w',
  },
  systemHealth: {
    name: 'System Health',
    query: QUERY_SYSTEM_HEALTH,
    refreshInterval: 300, // 5 minutes
    cacheKey: 'system_health_current',
  },
  eventDistribution: {
    name: 'Event Types',
    query: QUERY_EVENT_DISTRIBUTION,
    refreshInterval: 3600,
    cacheKey: 'event_distribution_daily',
  },
  revenueBySchool: {
    name: 'Revenue by School',
    query: QUERY_REVENUE_BY_SCHOOL,
    refreshInterval: 3600,
    cacheKey: 'revenue_by_school_30d',
  },
} as const;

export interface DashboardQueryConfig {
  name: string;
  query: string;
  refreshInterval: number; // seconds
  cacheKey: string;
}

export interface DashboardMetrics {
  activeUsers: Array<{ date: string; active_users: number; schools_active: number }>;
  reportsGenerated: Array<{ date: string; reports_count: number; schools: number; median_generation_time_ms: number }>;
  revenueTrend: Array<{ date: string; daily_revenue: number; transaction_count: number; schools: number; successful_transactions: number; failed_transactions: number; success_rate_percent: number }>;
  errorRate: Array<{ date: string; total_events: number; error_events: number; error_rate_percent: number; affected_schools: number }>;
}
