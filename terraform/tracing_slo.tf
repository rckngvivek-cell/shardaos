# Cloud Trace configuration for distributed tracing
resource "google_monitoring_custom_service" "deerflow" {
  display_name = "${local.app_name}-service"
  telemetry_type = "PROMETHEUS"
  user_labels = local.common_labels
}

# Service Monitoring SLO for API latency
resource "google_monitoring_slo" "api_latency_slo" {
  service_level_indicator {
    request_based_slo {
      good_filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"serviceruntime.googleapis.com/api/producer/total_latencies\" AND metric.response_code_class=\"2xx\""
      total_filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\""
    }
  }

  goal                = 0.99  # 99% of requests should succeed
  duration            = "2592000s"  # 30 days
  display_name        = "API Latency SLO"
  service_level_indicator_type = "REQUEST_BASED"
}

# Service Monitoring SLO for availability
resource "google_monitoring_slo" "availability_slo" {
  service_level_indicator {
    windows_based_slo {
      window_duration = "86400s"  # 1 day
      good_bad_filter = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.response_code_class=\"2xx\""
    }
  }

  goal         = 0.999  # 99.9% availability
  duration     = "2592000s"  # 30 days
  display_name = "System Availability SLO"
}

# Uptime check for primary endpoint
resource "google_monitoring_uptime_check_config" "primary_api" {
  display_name         = "${local.app_name}-primary-uptime-check"
  timeout              = "10s"
  period               = "60s"
  selected_regions     = ["USA", "EUROPE", "ASIA_PACIFIC"]

  http_check {
    request_method = "GET"
    port           = 443
    use_ssl        = true
    path           = "/health/ready"
    accept_language = ""
    validate_ssl   = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = "api.deerflow.dev"
    }
  }
}

# Uptime check for secondary endpoint
resource "google_monitoring_uptime_check_config" "secondary_api" {
  display_name         = "${local.app_name}-secondary-uptime-check"
  timeout              = "10s"
  period               = "60s"
  selected_regions     = ["USA", "EUROPE", "ASIA_PACIFIC"]

  http_check {
    request_method = "GET"
    port           = 443
    use_ssl        = true
    path           = "/health/ready"
    validate_ssl   = true
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      host = "api-us.deerflow.dev"
    }
  }
}

# Synthetic transaction monitoring
resource "google_cloud_scheduler_job" "synthetic_txn" {
  name        = "${local.app_name}-synthetic-transaction"
  description = "Synthetic transaction monitoring"
  schedule    = "*/5 * * * *"  # Every 5 minutes
  time_zone   = "UTC"

  http_target {
    http_method = "POST"
    uri         = "https://api.deerflow.dev/api/v1/synthetic-tests"
    body        = base64encode(jsonencode({
      test_type = "full_user_flow"
      operations = [
        "login",
        "get_dashboard",
        "get_grades",
        "initiate_payment"
      ]
    }))

    headers = {
      "Content-Type" = "application/json"
    }

    oauth_token {
      service_account_email = google_service_account.cloud_run.email
    }
  }
}

# Trace Span metrics
resource "google_monitoring_custom_metric" "trace_latency_histogram" {
  metric_descriptor {
    metric_kind = "DISTRIBUTION"
    value_type  = "DISTRIBUTION"

    display_name = "Request Latency Distribution"
    type         = "custom.googleapis.com/deerflow/request_latency"

    labels {
      key         = "endpoint"
      value_type  = "STRING"
      description = "API endpoint"
    }

    labels {
      key         = "region"
      value_type  = "STRING"
      description = "Geographic region"
    }

    unit = "ms"
  }
}

output "slo_api_latency" {
  value = google_monitoring_slo.api_latency_slo.name
}

output "slo_availability" {
  value = google_monitoring_slo.availability_slo.name
}

output "uptime_check_primary_id" {
  value = google_monitoring_uptime_check_config.primary_api.uptime_check_id
}
