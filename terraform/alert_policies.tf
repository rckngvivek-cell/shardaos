# Alert Policies for DeerFlow

# ======= P0 ALERTS (Critical) =======

# Alert 1: High Request Latency (P99 > 500ms)
resource "google_monitoring_alert_policy" "high_latency_p99" {
  display_name          = "P0: High Request Latency (P99 > 500ms)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "P99 Latency exceeds 500ms"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\" AND resource.label.service_name=~\"deerflow-backend.*\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 500000 # 500ms in microseconds
      
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_PERCENTILE_99"
        cross_series_reducer = "REDUCE_NONE"
      }

      trigger {
        count = 1
      }
    }
  }

  alert_strategy {
    auto_close = "1800s"
  }

  documentation {
    content   = "Response latency P99 exceeded 500ms. Check backend performance, database queries, and external service calls."
    mime_type = "text/markdown"
  }
}

# Alert 2: Service Downtime (unavailable > 5%)
resource "google_monitoring_alert_policy" "service_downtime" {
  display_name          = "P0: Service Downtime (Availability < 95%)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Availability below 95%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND resource.label.service_name=~\"deerflow-backend.*\""
      duration        = "180s"
      comparison      = "COMPARISON_LT"
      threshold_value = 0.95

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
    content   = "Service availability dropped below 95%. Investigate Cloud Run service status, network connectivity, and health checks."
    mime_type = "text/markdown"
  }
}

# Alert 3: Error Rate (5xx > 5%)
resource "google_monitoring_alert_policy" "high_error_rate_5xx" {
  display_name          = "P0: High 5xx Error Rate (> 5%)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "5xx error rate exceeds 5%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05

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
    content   = "Server error rate exceeded 5%. Check application logs, database connections, and external API failures."
    mime_type = "text/markdown"
  }
}

# Alert 4: Payment Processing Down
resource "google_monitoring_alert_policy" "payment_gateway_failure" {
  display_name          = "P0: Payment Gateway Failure"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Payment success rate below 95%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/payment_success_rate\""
      duration        = "120s"
      comparison      = "COMPARISON_LT"
      threshold_value = 0.95

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_NONE"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "Payment processing success rate dropped. Check Razorpay API, network connectivity, and verification logic."
    mime_type = "text/markdown"
  }
}

# Alert 5: Multi-region Failover Required (Primary Down)
resource "google_monitoring_alert_policy" "primary_region_down" {
  display_name          = "P0: Primary Region Downtime"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Primary region request rate drops to zero"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.label.service_name=\"deerflow-backend-primary\" AND metric.type=\"run.googleapis.com/request_count\""
      duration        = "180s"
      comparison      = "COMPARISON_LT"
      threshold_value = 10

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_NONE"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "Primary region (Asia South) is experiencing downtime. Initiate manual failover to secondary/tertiary regions."
    mime_type = "text/markdown"
  }
}

# ======= P1 ALERTS (High Priority) =======

# Alert 6: High CPU Usage (> 80%)
resource "google_monitoring_alert_policy" "high_cpu_usage" {
  display_name          = "P1: High CPU Usage (> 80%)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "CPU usage exceeds 80%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/instance_cpu_utilization\" AND resource.label.service_name=~\"deerflow-backend.*\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.80

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "CPU usage exceeded 80% average. Consider scaling up Cloud Run instances or optimizing code."
    mime_type = "text/markdown"
  }
}

# Alert 7: High Memory Usage (> 85%)
resource "google_monitoring_alert_policy" "high_memory_usage" {
  display_name          = "P1: High Memory Usage (> 85%)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Memory usage exceeds 85%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/instance_memory_utilization\" AND resource.label.service_name=~\"deerflow-backend.*\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "Memory usage exceeded 85% average. Check for memory leaks or increase Cloud Run memory allocation."
    mime_type = "text/markdown"
  }
}

# Alert 8: High 4xx Error Rate (> 10%)
resource "google_monitoring_alert_policy" "high_4xx_errors" {
  display_name          = "P1: High 4xx Error Rate (> 10%)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "4xx error rate exceeds 10%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.response_code_class=\"4xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.10

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
    content   = "Client error rate exceeded 10%. Check API endpoint validation, request parameters, and client behavior."
    mime_type = "text/markdown"
  }
}

# Alert 9: Notification Delivery Failures (< 98%)
resource "google_monitoring_alert_policy" "notification_failures" {
  display_name          = "P1: Notification Delivery Failures (< 98%)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Notification delivery rate below 98%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/notification_delivery_rate\""
      duration        = "300s"
      comparison      = "COMPARISON_LT"
      threshold_value = 0.98

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "Notification delivery fell below 98%. Check email/SMS provider status and notification queue depth."
    mime_type = "text/markdown"
  }
}

# Alert 10: DDoS Attack (high blocked requests)
resource "google_monitoring_alert_policy" "ddos_attack" {
  display_name          = "P1: Potential DDoS Attack"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Cloud Armor blocked requests spike"

    condition_threshold {
      filter          = "resource.type=\"global\" AND metric.type=\"compute.googleapis.com/security_policy/request_count\" AND metric.policy_rule_priority=\"100\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1000

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_NONE"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "Cloud Armor blocked more than 1000 requests/min. Review attack pattern and update security policies if needed."
    mime_type = "text/markdown"
  }
}

# ======= P2 ALERTS (Medium Priority) =======

# Alert 11: Latency P95 > 300ms
resource "google_monitoring_alert_policy" "high_latency_p95" {
  display_name          = "P2: High Request Latency (P95 > 300ms)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "P95 Latency exceeds 300ms"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\" AND resource.label.service_name=~\"deerflow-backend.*\""
      duration        = "600s"
      comparison      = "COMPARISON_GT"
      threshold_value = 300000 # 300ms in microseconds

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_PERCENTILE_95"
        cross_series_reducer = "REDUCE_NONE"
      }

      trigger {
        count = 2
      }
    }
  }

  documentation {
    content   = "Response latency P95 exceeded 300ms. Monitor database performance and consider optimization."
    mime_type = "text/markdown"
  }
}

# Alert 12: Low Availability (95-99%)
resource "google_monitoring_alert_policy" "low_availability" {
  display_name          = "P2: Low Availability (90-95%)"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Availability between 90-95%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
      duration        = "600s"
      comparison      = "COMPARISON_LT"
      threshold_value = 0.95

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_MEAN"
      }

      trigger {
        count = 2
      }
    }
  }

  documentation {
    content   = "Service availability dropped between 90-95%. Monitor service status and resource utilization."
    mime_type = "text/markdown"
  }
}

# Alert 14: Long-running Queries (> 5 seconds)
resource "google_monitoring_alert_policy" "long_running_queries" {
  display_name          = "P2: Long-running Queries Detected"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Query execution time exceeds 5 seconds"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/query_duration_ms\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5000

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_PERCENTILE_99"
        cross_series_reducer = "REDUCE_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "Long-running queries detected (>5s). Optimize database indexes and query patterns."
    mime_type = "text/markdown"
  }
}

# Alert 15: Notification Queue Buildup
resource "google_monitoring_alert_policy" "notification_queue_buildup" {
  display_name          = "P2: Notification Queue Buildup"
  combiner              = "OR"
  enabled               = true
  notification_channels = [google_monitoring_notification_channel.email.name]

  conditions {
    display_name = "Notification queue depth exceeds 10k"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"logging.googleapis.com/user/notification_queue_depth\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10000

      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
        cross_series_reducer = "REDUCE_MEAN"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "Notification queue has 10k+ pending messages. Scale notification processing or check for delivery issues."
    mime_type = "text/markdown"
  }
}

output "alert_policies" {
  value = [
    google_monitoring_alert_policy.high_latency_p99.name,
    google_monitoring_alert_policy.service_downtime.name,
    google_monitoring_alert_policy.high_error_rate_5xx.name,
    google_monitoring_alert_policy.payment_gateway_failure.name,
    google_monitoring_alert_policy.primary_region_down.name,
    google_monitoring_alert_policy.high_cpu_usage.name,
    google_monitoring_alert_policy.high_memory_usage.name,
    google_monitoring_alert_policy.high_4xx_errors.name,
    google_monitoring_alert_policy.notification_failures.name,
    google_monitoring_alert_policy.ddos_attack.name,
    google_monitoring_alert_policy.high_latency_p95.name,
    google_monitoring_alert_policy.low_availability.name,
    google_monitoring_alert_policy.long_running_queries.name,
    google_monitoring_alert_policy.notification_queue_buildup.name,
  ]
}
