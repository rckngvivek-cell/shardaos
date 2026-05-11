# Enhanced Monitoring and Alerting Configuration - Week 6

# ============================================================================
# MANAGED PROMETHEUS FOR METRICS COLLECTION
# ============================================================================

resource "google_monitoring_monitored_project" "primary" {
  display_name = "School ERP - Primary Monitoring"
  metrics_scope = google_monitoring_metrics_scope.schema.name
}

resource "google_monitoring_metrics_scope" "schema" {
  display_name = "School ERP Metrics Scope"
}

# ============================================================================
# NOTIFICATION CHANNELS FOR ALL ALERT SEVERITIES
# ============================================================================

# Critical Alerts - PagerDuty Integration
resource "google_monitoring_notification_channel" "pagerduty_critical" {
  display_name = "PagerDuty - Critical Incidents"
  type         = "pagerduty"
  enabled      = true

  labels = {
    service_key = var.pagerduty_service_key # Set via environment variable
  }

  user_labels = {
    severity = "critical"
  }
}

# Warning Alerts - Slack Integration
resource "google_monitoring_notification_channel" "slack_warnings" {
  display_name = "Slack - Team Warnings"
  type         = "slack"
  enabled      = true

  labels = {
    channel_name = "#devops-alerts"
  }

  user_labels = {
    severity = "warning"
  }
}

# Email Notifications - All Alerts
resource "google_monitoring_notification_channel" "email_ops" {
  display_name = "Operations Team Email"
  type         = "email"
  enabled      = true

  labels = {
    email_address = var.ops_team_email
  }

  user_labels = {
    severity = "all"
  }
}

# SMS for P0 Critical Alerts (on-call escalation)
resource "google_monitoring_notification_channel" "sms_oncall" {
  display_name = "SMS - On-Call Engineer"
  type         = "sms"
  enabled      = true

  labels = {
    number = var.oncall_phone_number
  }

  user_labels = {
    severity = "critical"
  }
}

# ============================================================================
# SLO CONFIGURATION (99.95% UPTIME TARGET)
# ============================================================================

resource "google_monitoring_slo" "api_availability" {
  display_name        = "API Availability SLO - 99.95% Target"
  goal                = 0.9995  # 99.95% uptime
  rolling_period_days = 7

  service_level_indicator {
    request_based {
      good_filter = <<-EOL
        resource.type="cloud_run_revision"
        AND resource.label.service_name="deerflow-backend"
        AND metric.type="serviceruntime.googleapis.com/api/producer/total_latencies"
        AND (metric.response_code_class="2xx" OR metric.response_code_class="3xx")
      EOL

      total_filter = <<-EOL
        resource.type="cloud_run_revision"
        AND resource.label.service_name="deerflow-backend"
      EOL
    }
  }
}

resource "google_monitoring_slo" "latency_slo" {
  display_name        = "API Latency SLO - P95 < 200ms"
  goal                = 0.99  # 99% of requests meet SLI
  rolling_period_days = 7

  service_level_indicator {
    latency {
      threshold_milli = 200  # 200ms threshold

      good_filter = <<-EOL
        resource.type="cloud_run_revision"
        AND resource.label.service_name="deerflow-backend"
        AND metric.type="serviceruntime.googleapis.com/api/producer/total_latencies"
        AND metric.response_code_class="2xx"
      EOL

      total_filter = <<-EOL
        resource.type="cloud_run_revision"
        AND resource.label.service_name="deerflow-backend"
      EOL
    }
  }
}

# ============================================================================
# CRITICAL ALERT POLICIES (PAGE ON-CALL)
# ============================================================================

resource "google_monitoring_alert_policy" "error_rate_critical" {
  display_name = "🔴 CRITICAL: Error Rate > 0.1%"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.pagerduty_critical.name,
    google_monitoring_notification_channel.sms_oncall.name,
    google_monitoring_notification_channel.email_ops.name
  ]

  conditions {
    display_name = "Error rate exceeds 0.1%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND (metric.response_code_class=\"4xx\" OR metric.response_code_class=\"5xx\")"
      duration        = "300s"  # 5 minutes
      comparison      = "COMPARISON_GT"
      threshold_value = 0.001   # 0.1%

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_FRACTION_TRUE"
      }

      trigger {
        count = 1
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"  # 30 minutes
    notification_rate_limit {
      period = "300s"  # Limit notifications to once per 5 minutes
    }
  }

  documentation {
    content   = "**ERROR RATE CRITICAL**\n\n- Check backend logs immediately\n- Review recent deployments\n- Check database connectivity\n- Look for resource exhaustion\n\nSee runbook: `RUNBOOK_HIGH_ERROR_RATE.md`"
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "uptime_critical" {
  display_name = "🔴 CRITICAL: Uptime < 99.9%"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.pagerduty_critical.name,
    google_monitoring_notification_channel.sms_oncall.name
  ]

  conditions {
    display_name = "Uptime below 99.9%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
      duration        = "600s"  # 10 minutes
      comparison      = "COMPARISON_LT"
      threshold_value = 0.999   # 99.9%

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "**SERVICE DOWNTIME DETECTED**\n\n- Check Cloud Run service status\n- Verify all 3 regions are responding\n- Check load balancer health\n- Verify database availability\n\nSee runbook: `RUNBOOK_SERVICE_DOWNTIME.md`"
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "latency_critical_p95" {
  display_name = "🔴 CRITICAL: Latency P95 > 1000ms"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.pagerduty_critical.name,
    google_monitoring_notification_channel.slack_warnings.name
  ]

  conditions {
    display_name = "P95 latency exceeds 1 second"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\""
      duration        = "600s"  # 10 minutes
      comparison      = "COMPARISON_GT"
      threshold_value = 1000000  # 1000ms in microseconds

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_NONE"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "**HIGH LATENCY ALERT**\n\n- Check database query performance\n- Review active connections\n- Check for slow external API calls\n- Verify backend resource allocation"
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "database_unavailable" {
  display_name = "🔴 CRITICAL: Database Unavailable"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.pagerduty_critical.name,
    google_monitoring_notification_channel.sms_oncall.name
  ]

  conditions {
    display_name = "Persistent store operation failures"

    condition_threshold {
      filter          = "metric.type=\"logging.googleapis.com/user/persistent_store_errors\" AND resource.type=\"cloud_run_revision\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05  # 5% failure rate

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "**DATABASE UNAVAILABLE**\n\n- Trigger regional failover\n- Check persistent store health\n- Verify network connectivity\n- Contact platform support if needed"
    mime_type = "text/markdown"
  }
}

# ============================================================================
# WARNING ALERT POLICIES (EMAIL TEAM)
# ============================================================================

resource "google_monitoring_alert_policy" "cpu_high" {
  display_name = "🟡 WARNING: CPU > 80%"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.slack_warnings.name
  ]

  conditions {
    display_name = "CPU utilization high"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_utilization\" AND resource.label.metric_name=\"cpu\""
      duration        = "180s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8  # 80%

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  alert_strategy {
    auto_close = "900s"
    notification_rate_limit {
      period = "600s"
    }
  }

  documentation {
    content   = "**CPU UTILIZATION HIGH** - Auto-scaling should trigger. Monitor auto-scale behavior."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "memory_high" {
  display_name = "🟡 WARNING: Memory > 85%"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.slack_warnings.name
  ]

  conditions {
    display_name = "Memory utilization high"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_utilization\" AND resource.label.metric_name=\"memory\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85  # 85%

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "**MEMORY UTILIZATION HIGH** - Possible memory leak. Check recent deployments."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "latency_warning_p95" {
  display_name = "🟡 WARNING: Latency P95 > 500ms"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.slack_warnings.name
  ]

  conditions {
    display_name = "P95 latency moderate increase"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\""
      duration        = "600s"
      comparison      = "COMPARISON_GT"
      threshold_value = 500000  # 500ms in microseconds

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_NONE"
      }

      trigger {
        count = 1
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"
    notification_rate_limit {
      period = "900s"
    }
  }

  documentation {
    content   = "**LATENCY TRENDING HIGH** - Monitor for further degradation. Check database queries."
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "error_rate_warning" {
  display_name = "🟡 WARNING: Error Rate > 0.02%"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.slack_warnings.name
  ]

  conditions {
    display_name = "Error rate trending up"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND (metric.response_code_class=\"4xx\" OR metric.response_code_class=\"5xx\")"
      duration        = "900s"  # 15 minutes
      comparison      = "COMPARISON_GT"
      threshold_value = 0.0002  # 0.02%

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_FRACTION_TRUE"
      }

      trigger {
        count = 1
      }
    }
  }

  alert_strategy {
    auto_close = "3600s"
  }

  documentation {
    content   = "**ERROR RATE TRENDING UP** - Early warning. Investigate backend logs."
    mime_type = "text/markdown"
  }
}

# ============================================================================
# MULTI-REGION FAILOVER ALERT
# ============================================================================

resource "google_monitoring_alert_policy" "region_failover" {
  display_name = "⚠️ FAILOVER: Primary Region Down"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.pagerduty_critical.name,
    google_monitoring_notification_channel.sms_oncall.name
  ]

  conditions {
    display_name = "Primary region health check failure"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.label.location=\"asia-south1\" AND metric.type=\"run.googleapis.com/request_count\""
      duration        = "180s"  # 3 minutes
      comparison      = "COMPARISON_LT"
      threshold_value = 1.0     # At least 1 request per second expected

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "**PRIMARY REGION DOWN** - Execute failover procedure:\n1. Verify asia-south1 is down\n2. Update load balancer traffic weights\n3. Page lead architect\n4. Notify customer support\n\nSee runbook: `RUNBOOK_REGION_FAILOVER.md`"
    mime_type = "text/markdown"
  }
}

# ============================================================================
# STATUS AND CUSTOM METRICS (Health Check Endpoints)
# ============================================================================

# This will be implemented in the backend as custom metrics sent to Monitoring API
# Metrics to track:
# - school_revenue_daily
# - active_student_count
# - api_authentication_success_rate
# - data_sync_success_rate
# - persistent_store_read_latency_p95
# - persistent_store_write_latency_p95

