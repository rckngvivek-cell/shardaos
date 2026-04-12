provider "google" {
  project = var.project_id
}

# Notification Channel for Email
resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification"
  type         = "email"
  labels = {
    email_address = var.notification_email
  }
  enabled = true
}

# Notification Channel for Slack
resource "google_monitoring_notification_channel" "slack" {
  display_name = "Slack Alert Channel"
  type         = "slack"
  labels = {
    channel_name = "#alerts"
  }
  user_labels = {
    slack_webhook_url = var.slack_webhook_url
  }
  enabled = true
}

# Dashboard 1: API Performance & Latency
resource "google_monitoring_dashboard" "api_performance" {
  dashboard_json = jsonencode({
    displayName = "API Performance (Week 2)"
    mosaicLayout = {
      columns = 12
      tiles = [
        # API Latency (P50, P95, P99)
        {
          width  = 6
          height = 4
          widget = {
            title = "API Latency Percentiles"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/api_latency\" resource.type=\"cloud_run_revision\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_DELTA"
                        crossSeriesReducer = "REDUCE_PERCENTILE_50"
                      }
                    }
                  }
                  plotType = "LINE"
                  targetAxis = "Y1"
                }
              ]
              timeshiftDuration = "0s"
              yAxis = {
                label = "Latency (ms)"
                scale = "LINEAR"
              }
            }
          }
        }
        # Request Rate by Endpoint
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Request Rate by Endpoint"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_RATE"
                        crossSeriesReducer = "REDUCE_SUM"
                        groupByFields = ["metric.label.response_code"]
                      }
                    }
                  }
                  plotType = "STACKED_AREA"
                }
              ]
              yAxis = {
                label = "Requests/sec"
                scale = "LINEAR"
              }
            }
          }
        }
        # Error Rate by Endpoint
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Error Rate by Endpoint"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"run.googleapis.com/request_count\" metric.response_code_class=\"5xx\" resource.type=\"cloud_run_revision\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_RATE"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
              yAxis = {
                label = "Errors/sec"
                scale = "LINEAR"
              }
            }
          }
        }
        # Cold Start Duration
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Cold Start Duration"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/cold_start_duration\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
              yAxis = {
                label = "Duration (ms)"
              }
            }
          }
        }
      ]
    }
  })
}

# Dashboard 2: Teacher Module Analytics
resource "google_monitoring_dashboard" "teacher_module" {
  dashboard_json = jsonencode({
    displayName = "Teacher Module Analytics"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Attendance Marking Operations"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/attendance_marked_count\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_SUM"
                      }
                    }
                  }
                  plotType = "COLUMN"
                }
              ]
              yAxis = {
                label = "Records"
              }
            }
          }
        }
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Grade Entry Operations"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/grades_entered_count\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_SUM"
                      }
                    }
                  }
                  plotType = "COLUMN"
                }
              ]
            }
          }
        }
        {
          yPos   = 4
          width  = 12
          height = 4
          widget = {
            title = "Teacher Portal Errors"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/log_entry_count\" severity=\"ERROR\" resource.labels.service_name=\"school-erp-api\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_SUM"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        }
      ]
    }
  })
}

# Dashboard 3: Admin Module Analytics
resource "google_monitoring_dashboard" "admin_module" {
  dashboard_json = jsonencode({
    displayName = "Admin Module Analytics"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "User Management Operations"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/user_operations_count\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_SUM"
                        groupByFields = ["metric.label.operation_type"]
                      }
                    }
                  }
                  plotType = "STACKED_COLUMN"
                }
              ]
            }
          }
        }
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "School Configuration Changes"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/config_changes_count\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_SUM"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        }
      ]
    }
  })
}

# Dashboard 4: Notification Service Health
resource "google_monitoring_dashboard" "notification_service" {
  dashboard_json = jsonencode({
    displayName = "Notification Service Health"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "SMS Delivery Rate"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/sms_delivery_rate\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
              yAxis = {
                label = "Delivery %"
              }
            }
          }
        }
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Email Delivery Rate"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/email_delivery_rate\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_MEAN"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
            }
          }
        }
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Push Notification Delivery"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/push_delivery_count\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_SUM"
                        groupByFields = ["metric.label.delivery_status"]
                      }
                    }
                  }
                  plotType = "STACKED_AREA"
                }
              ]
            }
          }
        }
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Dead Letter Queue Size"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"pubsub.googleapis.com/subscription/num_unacked_messages\" resource.labels.subscription_id=\"school-erp-notifications-dlq\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_MAX"
                      }
                    }
                  }
                  plotType = "GAUGE"
                }
              ]
            }
          }
        }
      ]
    }
  })
}

# Dashboard 5: Parent Portal Activity
resource "google_monitoring_dashboard" "parent_portal" {
  dashboard_json = jsonencode({
    displayName = "Parent Portal Activity"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Active Parent Sessions"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/parent_portal_active_sessions\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_MAX"
                      }
                    }
                  }
                  plotType = "GAUGE"
                }
              ]
            }
          }
        }
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Fee Payment Transactions"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"custom.googleapis.com/payment_transactions_count\""
                      aggregation = {
                        alignmentPeriod    = "300s"
                        perSeriesAligner   = "ALIGN_SUM"
                        groupByFields = ["metric.label.payment_status"]
                      }
                    }
                  }
                  plotType = "STACKED_COLUMN"
                }
              ]
            }
          }
        }
      ]
    }
  })
}

# Dashboard 6: System Resources
resource "google_monitoring_dashboard" "system_resources" {
  dashboard_json = jsonencode({
    displayName = "System Resources & Costs"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Cloud Run Memory Usage"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"run.googleapis.com/container/memory/utilizations\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_MEAN"
                        crossSeriesReducer = "REDUCE_PERCENTILE_95"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
              yAxis = {
                label = "Memory %"
              }
            }
          }
        }
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Cloud Run CPU Usage"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"run.googleapis.com/container/cpu/utilizations\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_MEAN"
                        crossSeriesReducer = "REDUCE_PERCENTILE_95"
                      }
                    }
                  }
                  plotType = "LINE"
                }
              ]
              yAxis = {
                label = "CPU %"
              }
            }
          }
        }
        {
          yPos   = 4
          width  = 12
          height = 4
          widget = {
            title = "Daily Cloud Costs (USD)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"global\" metric.type=\"custom.googleapis.com/daily_cloud_cost\""
                      aggregation = {
                        alignmentPeriod    = "3600s"
                        perSeriesAligner   = "ALIGN_SUM"
                      }
                    }
                  }
                  plotType = "COLUMN"
                }
              ]
              yAxis = {
                label = "Cost (USD)"
              }
            }
          }
        }
      ]
    }
  })
}

# Dashboard 7: Firestore Performance
resource "google_monitoring_dashboard" "firestore_perf" {
  dashboard_json = jsonencode({
    displayName = "Firestore Performance"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Firestore Read Operations"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"firestore.googleapis.com/document/read_operations\" resource.type=\"firestore_database\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_RATE"
                      }
                    }
                  }
                  plotType = "STACKED_AREA"
                }
              ]
            }
          }
        }
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Firestore Write Operations"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "metric.type=\"firestore.googleapis.com/document/write_operations\" resource.type=\"firestore_database\""
                      aggregation = {
                        alignmentPeriod    = "60s"
                        perSeriesAligner   = "ALIGN_RATE"
                      }
                    }
                  }
                  plotType = "STACKED_AREA"
                }
              ]
            }
          }
        }
      ]
    }
  })
}

# Dashboard 8: Multi-Region Failover Status
resource "google_monitoring_dashboard" "multi_region" {
  dashboard_json = jsonencode({
    displayName = "Multi-Region Failover Status"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 4
          height = 4
          widget = {
            title = "US-Central1 Status"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"run.googleapis.com/request_count\" resource.location=\"us-central1\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_SUM"
                  }
                }
              }
              sparkChartType = "SPARK_BAR"
            }
          }
        }
        {
          xPos   = 4
          width  = 4
          height = 4
          widget = {
            title = "Asia-South1 Status"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"run.googleapis.com/request_count\" resource.location=\"asia-south1\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_SUM"
                  }
                }
              }
              sparkChartType = "SPARK_BAR"
            }
          }
        }
        {
          xPos   = 8
          width  = 4
          height = 4
          widget = {
            title = "Europe-West1 Status"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"run.googleapis.com/request_count\" resource.location=\"europe-west1\""
                  aggregation = {
                    alignmentPeriod    = "60s"
                    perSeriesAligner   = "ALIGN_SUM"
                  }
                }
              }
              sparkChartType = "SPARK_BAR"
            }
          }
        }
      ]
    }
  })
}

# Alert 1: API Latency P99 > 1 second
resource "google_monitoring_alert_policy" "api_latency_p99" {
  display_name = "API P99 Latency > 1s (P0)"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "API P99 Latency > 1 second"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/api_latency\" resource.type=\"cloud_run_revision\" metric.percentile=\"0.99\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 1000
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_DELTA"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id, google_monitoring_notification_channel.slack.id]
}

# Alert 2: Error Rate > 5% (P0)
resource "google_monitoring_alert_policy" "error_rate_high" {
  display_name = "Error Rate > 5% (P0)"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Error Rate > 5%"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.response_code_class=\"5xx\""
      duration        = "180s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Alert 3: API Latency P95 > 500ms (P1)
resource "google_monitoring_alert_policy" "api_latency_p95" {
  display_name = "API P95 Latency > 500ms (P1)"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "API P95 Latency > 500ms"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/api_latency\" resource.type=\"cloud_run_revision\" metric.percentile=\"0.95\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 500
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
}

# Alert 4: Error Rate > 2% (P1)
resource "google_monitoring_alert_policy" "error_rate_medium" {
  display_name = "Error Rate > 2% (P1)"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Error Rate > 2%"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\" metric.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.02
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
}

# Alert 5: SMS Delivery Rate < 99%
resource "google_monitoring_alert_policy" "sms_delivery_low" {
  display_name = "SMS Delivery Rate < 99%"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "SMS Delivery < 99%"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/sms_delivery_rate\""
      duration        = "600s"
      comparison      = "COMPARISON_LT"
      threshold_value = 0.99
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Alert 6: Email Delivery Rate < 99%
resource "google_monitoring_alert_policy" "email_delivery_low" {
  display_name = "Email Delivery Rate < 99%"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Email Delivery < 99%"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/email_delivery_rate\""
      duration        = "600s"
      comparison      = "COMPARISON_LT"
      threshold_value = 0.99
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Alert 7: Notification Queue DLQ > 100 messages
resource "google_monitoring_alert_policy" "dlq_high" {
  display_name = "Dead Letter Queue > 100 messages"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "DLQ > 100 messages"
    condition_threshold {
      filter          = "metric.type=\"pubsub.googleapis.com/subscription/num_unacked_messages\" resource.labels.subscription_id=\"school-erp-notifications-dlq\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 100
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MAX"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Alert 8: Cloud Run Out of Memory
resource "google_monitoring_alert_policy" "cloud_run_memory" {
  display_name = "Cloud Run Memory Usage > 90%"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Memory > 90%"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/container/memory/utilizations\" resource.type=\"cloud_run_revision\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.90
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MAX"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
}

# Alert 9: Firestore Quota Exceeded
resource "google_monitoring_alert_policy" "firestore_quota" {
  display_name = "Firestore Quota Exceeded"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Firestore Quota Alert"
    condition_threshold {
      filter          = "resource.type=\"firestore_database\" AND metric.type=\"firestore.googleapis.com/quota/exceeded\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Alert 10: Zero requests for 5 minutes (potential outage)
resource "google_monitoring_alert_policy" "zero_requests" {
  display_name = "Zero Requests for 5 Minutes (Potential Outage)"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "No traffic for 5 minutes"
    condition_threshold {
      filter          = "metric.type=\"run.googleapis.com/request_count\" resource.type=\"cloud_run_revision\""
      duration        = "300s"
      comparison      = "COMPARISON_LE"
      threshold_value = 0
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_SUM"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.email.id]
}

# Alert 11: API Response Time Spike
resource "google_monitoring_alert_policy" "response_time_spike" {
  display_name = "API Response Time Spike"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "Response time anomaly"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/api_latency\""
      duration        = "180s"
      comparison      = "COMPARISON_GT"
      threshold_value = 2000
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
}

# Alert 12: Cold Start Duration > 2 seconds
resource "google_monitoring_alert_policy" "cold_start_high" {
  display_name = "Cold Start Duration > 2 seconds"
  combiner     = "OR"
  enabled      = true

  conditions {
    display_name = "High cold start"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/cold_start_duration\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 2000
      aggregations {
        alignment_period    = "60s"
        per_series_aligner  = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
}
