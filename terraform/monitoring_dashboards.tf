# Monitoring and Logging Configuration

# Notification Channel - Email
resource "google_monitoring_notification_channel" "email" {
  display_name           = "DeerFlow Alert Email"
  type                   = "email"
  enabled                = true
  user_labels = {
    severity = "high"
  }

  labels = {
    email_address = var.alert_email
  }

  force_delete = false
}

# Notification Channel - Slack (if needed)
resource "google_monitoring_notification_channel" "slack" {
  display_name           = "DeerFlow Slack Alerts"
  type                   = "slack"
  enabled                = false
  user_labels = {
    severity = "high"
  }

  labels = {
    channel_name = "#deerflow-alerts"
  }

  force_delete = false
}

# ======================================
# PERFORMANCE DASHBOARD
# ======================================
resource "google_monitoring_dashboard" "performance" {
  dashboard_json = jsonencode({
    displayName = "DeerFlow - Performance Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Request Latency (P50/P95/P99)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Request Rate (QPS)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Error Rate (%)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\" resource.label.service_name=~\"deerflow-backend.*\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Memory Usage (MB)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/instance_memory_utilization\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          yPos   = 8
          width  = 6
          height = 4
          widget = {
            title = "CPU Usage (%)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/instance_cpu_utilization\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 8
          width  = 6
          height = 4
          widget = {
            title = "Concurrent Requests"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })

  depends_on = [google_project_service.required_apis["monitoring.googleapis.com"]]
}

# ======================================
# ERROR & RELIABILITY DASHBOARD
# ======================================
resource "google_monitoring_dashboard" "errors" {
  dashboard_json = jsonencode({
    displayName = "DeerFlow - Errors & Reliability Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 4
          height = 4
          widget = {
            title = "5xx Error Rate"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\" metric.response_code_class=\"5xx\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 4
          width  = 4
          height = 4
          widget = {
            title = "4xx Error Rate"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\" metric.response_code_class=\"4xx\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 8
          width  = 4
          height = 4
          widget = {
            title = "Availability (%)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\" metric.response_code_class=\"2xx\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          yPos   = 4
          width  = 12
          height = 4
          widget = {
            title = "Exception Rate"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/exception_count\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })

  depends_on = [google_project_service.required_apis["monitoring.googleapis.com"]]
}

# ======================================
# SECURITY DASHBOARD
# ======================================
resource "google_monitoring_dashboard" "security" {
  dashboard_json = jsonencode({
    displayName = "DeerFlow - Security Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Cloud Armor Blocked Requests"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"global\" metric.type=\"compute.googleapis.com/security_policy_enforced_rules_count\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "SQL Injection Attempts Blocked"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"global\" metric.type=\"compute.googleapis.com/security_policy/request_count\" resource.label.policy_name=\"deerflow-armor-policy\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "XSS Attempts Blocked"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"global\" metric.type=\"compute.googleapis.com/security_policy/request_count\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Rate Limited Requests"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"global\" metric.type=\"compute.googleapis.com/security_policy/request_count\" metric.policy_rule_priority=\"110\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })

  depends_on = [google_project_service.required_apis["monitoring.googleapis.com"]]
}

# ======================================
# MULTI-REGION DASHBOARD
# ======================================
resource "google_monitoring_dashboard" "multiregion" {
  dashboard_json = jsonencode({
    displayName = "DeerFlow - Multi-Region Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 4
          height = 4
          widget = {
            title = "Asia South (Primary) - Latency (ms)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" resource.label.service_name=\"deerflow-backend-primary\" metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\""
                }
              }
            }
          }
        },
        {
          xPos   = 4
          width  = 4
          height = 4
          widget = {
            title = "US Central (Secondary) - Latency (ms)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" resource.label.service_name=\"deerflow-backend-secondary\" metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\""
                }
              }
            }
          }
        },
        {
          xPos   = 8
          width  = 4
          height = 4
          widget = {
            title = "Europe West (Tertiary) - Latency (ms)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" resource.label.service_name=\"deerflow-backend-tertiary\" metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\""
                }
              }
            }
          }
        },
        {
          yPos   = 4
          width  = 12
          height = 4
          widget = {
            title = "Regional Availability"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"run.googleapis.com/request_count\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })

  depends_on = [google_project_service.required_apis["monitoring.googleapis.com"]]
}

# ======================================
# PAYMENT PROCESSING DASHBOARD
# ======================================
resource "google_monitoring_dashboard" "payments" {
  dashboard_json = jsonencode({
    displayName = "DeerFlow - Payment Processing Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Payment Success Rate (%)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/payment_success_rate\""
                }
              }
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Total Payments Processed"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/payment_count\""
                }
              }
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Payment Latency (ms P99)"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/payment_latency_p99\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Payment Failures"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/payment_failures\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })

  depends_on = [google_project_service.required_apis["monitoring.googleapis.com"]]
}

# ======================================
# NOTIFICATIONS DASHBOARD
# ======================================
resource "google_monitoring_dashboard" "notifications" {
  dashboard_json = jsonencode({
    displayName = "DeerFlow - Notifications Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "Notifications Sent (msg/sec)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/notification_throughput\""
                }
              }
            }
          }
        },
        {
          xPos   = 6
          width  = 6
          height = 4
          widget = {
            title = "Notification Delivery Rate (%)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/notification_delivery_rate\""
                }
              }
            }
          }
        },
        {
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "SMS Queue Depth"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/sms_queue_depth\""
                    }
                  }
                }
              ]
            }
          }
        },
        {
          xPos   = 6
          yPos   = 4
          width  = 6
          height = 4
          widget = {
            title = "Email Queue Depth"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/email_queue_depth\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })

  depends_on = [google_project_service.required_apis["monitoring.googleapis.com"]]
}

# ======================================
# LOAD TESTING DASHBOARD
# ======================================
resource "google_monitoring_dashboard" "load" {
  dashboard_json = jsonencode({
    displayName = "DeerFlow - Load Testing Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 4
          height = 4
          widget = {
            title = "Active Virtual Users"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/active_users\""
                }
              }
            }
          }
        },
        {
          xPos   = 4
          width  = 4
          height = 4
          widget = {
            title = "Failure Rate (%)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/test_failure_rate\""
                }
              }
            }
          }
        },
        {
          xPos   = 8
          width  = 4
          height = 4
          widget = {
            title = "Request Throughput (req/s)"
            scorecard = {
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/test_throughput\""
                }
              }
            }
          }
        },
        {
          yPos   = 4
          width  = 12
          height = 4
          widget = {
            title = "Response Time Distribution"
            xyChart = {
              dataSets = [
                {
                  timeSeriesQuery = {
                    timeSeriesFilter = {
                      filter = "resource.type=\"cloud_run_revision\" metric.type=\"logging.googleapis.com/user/response_time_p50\""
                    }
                  }
                }
              ]
            }
          }
        }
      ]
    }
  })

  depends_on = [google_project_service.required_apis["monitoring.googleapis.com"]]
}

output "notification_channel_id" {
  value = google_monitoring_notification_channel.email.name
}

output "slack_channel_id" {
  value = google_monitoring_notification_channel.slack.name
}
