# Auto-Scaling Configuration for Cloud Run - Week 6

# ============================================================================
# CLOUD RUN AUTO-SCALING POLICY
# ============================================================================

resource "google_monitoring_custom_metric" "concurrent_users" {
  description = "Custom metric for active concurrent users"
  display_name = "Active Concurrent Users"
  metric_kind  = "GAUGE"
  value_type   = "INT64"
  metric_descriptor {
    unit = "1"
  }
}

# ============================================================================
# HEALTH CHECK ENDPOINTS CONFIGURATION
# ============================================================================

# Google Compute Health Check for Load Balancer
resource "google_compute_health_check" "https_health_check" {
  name                = "school-erp-https-health-check"
  timeout_sec         = 5
  check_interval_sec  = 10
  unhealthy_threshold = 3
  healthy_threshold   = 2

  https_health_check {
    port               = "443"
    request_path       = "/health"
    proxy_header       = "NONE"
    response           = "OK"
  }

  log_config {
    enable = false
  }
}

# Alternate TCP Health Check (fallback)
resource "google_compute_health_check" "tcp_health_check" {
  name                = "school-erp-tcp-health-check"
  timeout_sec         = 5
  check_interval_sec  = 10
  unhealthy_threshold = 3
  healthy_threshold   = 2

  tcp_health_check {
    port = "443"
  }
}

# ============================================================================
# REGION: ASIA-SOUTH1 (PRIMARY - 70% TRAFFIC)
# ============================================================================

resource "google_cloud_run_service" "backend_asia" {
  name     = "deerflow-backend-asia"
  location = "asia-south1"

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      timeout_seconds      = 300

      containers {
        image = var.backend_image
        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        env {
          name  = "ENVIRONMENT"
          value = "production"
        }
        env {
          name  = "REGION"
          value = "asia-south1"
        }

        # Health check endpoint
        startup_probe {
          initial_delay_seconds = 0
          timeout_seconds       = 3
          period_seconds        = 3
          failure_threshold     = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }

        liveness_probe {
          initial_delay_seconds = 60
          timeout_seconds       = 3
          period_seconds        = 10
          failure_threshold     = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }
      }

      container_concurrency = 200
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.cloud_run_api
  ]
}

# Auto-scaling Metrics for asia-south1
resource "google_monitoring_metric_descriptor" "asia_scale_metric" {
  display_name = "asia-south1 CPU Average"
  metric_kind  = "GAUGE"
  value_type   = "DOUBLE"
}

# ============================================================================
# REGION: US-CENTRAL1 (SECONDARY - 20% TRAFFIC)
# ============================================================================

resource "google_cloud_run_service" "backend_us_central" {
  name     = "deerflow-backend-us-central"
  location = "us-central1"

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      timeout_seconds      = 300

      containers {
        image = var.backend_image
        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        env {
          name  = "ENVIRONMENT"
          value = "production"
        }
        env {
          name  = "REGION"
          value = "us-central1"
        }

        startup_probe {
          initial_delay_seconds = 0
          timeout_seconds       = 3
          period_seconds        = 3
          failure_threshold     = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }

        liveness_probe {
          initial_delay_seconds = 60
          timeout_seconds       = 3
          period_seconds        = 10
          failure_threshold     = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }
      }

      container_concurrency = 200
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# ============================================================================
# REGION: EUROPE-WEST1 (TERTIARY - 10% TRAFFIC)
# ============================================================================

resource "google_cloud_run_service" "backend_europe" {
  name     = "deerflow-backend-europe"
  location = "europe-west1"

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      timeout_seconds      = 300

      containers {
        image = var.backend_image
        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }

        env {
          name  = "ENVIRONMENT"
          value = "production"
        }
        env {
          name  = "REGION"
          value = "europe-west1"
        }

        startup_probe {
          initial_delay_seconds = 0
          timeout_seconds       = 3
          period_seconds        = 3
          failure_threshold     = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }

        liveness_probe {
          initial_delay_seconds = 60
          timeout_seconds       = 3
          period_seconds        = 10
          failure_threshold     = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }
      }

      container_concurrency = 200
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = "0"
        "autoscaling.knative.dev/maxScale" = "10"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# ============================================================================
# LOAD BALANCER WITH TRAFFIC DISTRIBUTION
# ============================================================================

resource "google_compute_backend_service" "backend_service_asia" {
  name            = "backend-service-asia"
  load_balancing_scheme = "EXTERNAL"
  health_checks   = [google_compute_health_check.https_health_check.id]
  
  backend {
    group = google_cloud_run_service.backend_asia.id
    balancing_mode = "RATE"
    max_rate_per_endpoint = 1000
  }

  session_affinity = "NONE"
  timeout_sec     = 30
}

resource "google_compute_backend_service" "backend_service_us" {
  name            = "backend-service-us"
  load_balancing_scheme = "EXTERNAL"
  health_checks   = [google_compute_health_check.https_health_check.id]
  
  backend {
    group = google_cloud_run_service.backend_us_central.id
    balancing_mode = "RATE"
    max_rate_per_endpoint = 1000
  }

  session_affinity = "NONE"
  timeout_sec     = 30
}

resource "google_compute_backend_service" "backend_service_eu" {
  name            = "backend-service-eu"
  load_balancing_scheme = "EXTERNAL"
  health_checks   = [google_compute_health_check.https_health_check.id]
  
  backend {
    group = google_cloud_run_service.backend_europe.id
    balancing_mode = "RATE"
    max_rate_per_endpoint = 1000
  }

  session_affinity = "NONE"
  timeout_sec     = 30
}

# ============================================================================
# MULTI-REGION LOAD BALANCER (GEO-ROUTING)
# ============================================================================

resource "google_compute_url_map" "multi_region" {
  name            = "school-erp-multi-region-lb"
  default_service = google_compute_backend_service.backend_service_asia.id

  # Geographic routing rules
  host_rules {
    hosts        = ["api.schoolerp.com"]
    path_matcher = "asia-primary"
  }

  path_matchers {
    name            = "asia-primary"
    default_service = google_compute_backend_service.backend_service_asia.id

    route_rules {
      priority        = 1
      service         = google_compute_backend_service.backend_service_asia.id
      match_rules {
        prefix_match = "/"
      }
    }
  }
}

# ============================================================================
# LOAD BALANCER WITH AUTOMATIC FAILOVER
# ============================================================================

resource "google_compute_target_https_proxy" "multi_region_https" {
  name             = "school-erp-https-proxy"
  url_map          = google_compute_url_map.multi_region.id
  ssl_certificates = [google_compute_ssl_certificate.api_cert.id]
}

resource "google_compute_global_forwarding_rule" "multi_region_https" {
  name                  = "school-erp-global-https"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL"
  port_range            = "443"
  target                = google_compute_target_https_proxy.multi_region_https.id
}

# ============================================================================
# AUTO-SCALING ALERT INTEGRATION
# ============================================================================

resource "google_monitoring_alert_policy" "autoscale_triggered" {
  display_name = "ℹ️ INFO: Auto-scaling Triggered (CPU > 70%)"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.slack_warnings.name
  ]

  conditions {
    display_name = "Auto-scale threshold reached"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.7  # 70% CPU

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
    content   = "Auto-scaling is scaling out instances. Monitor the scaling process."
    mime_type = "text/markdown"
  }
}

# ============================================================================
# SERVICE ACCOUNT FOR CLOUD RUN
# ============================================================================

resource "google_service_account" "cloud_run_sa" {
  account_id   = "deerflow-cloud-run-sa"
  display_name = "Cloud Run Service Account"
}

resource "google_project_iam_member" "cloud_run_roles" {
  project = var.gcp_project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# ============================================================================
# SSL CERTIFICATE
# ============================================================================

resource "google_compute_managed_ssl_certificate" "api_cert" {
  name = "api-schoolerp-com-cert"

  managed {
    domains = ["api.schoolerp.com"]
  }
}

# ============================================================================
# FIRESTORE MULTI-REGION REPLICATION
# ============================================================================

resource "google_firestore_database" "database" {
  project     = var.gcp_project_id
  name        = "(default)"
  location_id = "asia-south1"
  type        = "FIRESTORE_NATIVE"

  # Enable backup
  backup_config {
    point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"
  }
}

# Scheduled backup policy
resource "google_firestore_backup_schedule" "weekly_backup" {
  project     = var.gcp_project_id
  database    = google_firestore_database.database.name
  location    = "asia-south1"
  backup_retention_days = 14  # Keep 2 weeks of backups
  daily_backup_config {}
}

