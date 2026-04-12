provider "google" {
  region  = var.region
  project = var.project_id
}

resource "google_cloud_run_service" "api" {
  name     = var.service_name
  location = var.region
  project  = var.project_id

  template {
    spec {
      service_account_name = google_service_account.cloud_run_sa.email
      containers {
        image = var.image
        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = var.cpu
            memory = var.memory
          }
        }

        dynamic "env" {
          for_each = var.environment_vars
          content {
            name  = env.key
            value = env.value
          }
        }

        dynamic "env" {
          for_each = var.secrets
          content {
            name = env.key
            value_from {
              secret_key_ref {
                name = env.value.key
                key  = env.value.version
              }
            }
          }
        }

        startup_probe {
          initial_delay_seconds = 30
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }

        liveness_probe {
          period_seconds    = 30
          timeout_seconds   = 5
          failure_threshold = 3
          http_get {
            path = "/health"
            port = 8080
          }
        }
      }

      timeout_seconds       = 300
      service_account_name  = google_service_account.cloud_run_sa.email
      max_instances        = var.max_instances
      min_instances        = var.min_instances

      vpc_access_connector {
        name = var.vpc_connector
      }
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/minScale" = var.min_instances
        "autoscaling.knative.dev/maxScale" = var.max_instances
        "run.googleapis.com/vpc-access-connector" = var.vpc_connector
        "run.googleapis.com/client-name" = "cloud-console"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_cloud_run_service_iam_member.allow_unauthenticated
  ]
}

resource "google_cloud_run_service_iam_member" "allow_unauthenticated" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

resource "google_service_account" "cloud_run_sa" {
  account_id   = "${var.service_name}-sa"
  display_name = "Service Account for ${var.service_name}"
  project      = var.project_id
}

# Grant necessary permissions
resource "google_project_iam_member" "cloud_run_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_trace" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

resource "google_project_iam_member" "cloud_run_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.publisher"
  member  = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}

# Cloud Run Backend Service for Load Balancer
resource "google_compute_backend_service" "cloud_run_backend" {
  name                = "${var.service_name}-backend"
  project             = var.project_id
  health_checks       = [google_compute_health_check.cloud_run_health.id]
  session_affinity    = "CLIENT_IP"
  timeout_sec         = 30
  load_balancing_scheme = "EXTERNAL"
  protocol            = "HTTPS"

  backend {
    group           = google_compute_neg.cloud_run_neg.id
    balancing_mode  = "RATE"
    max_rate_per_endpoint = 1000
  }
}

resource "google_compute_network_endpoint_group" "cloud_run_neg" {
  name                  = "${var.service_name}-neg"
  project               = var.project_id
  network_endpoint_type = "SERVERLESS"
  region                = var.region
  cloud_run_service {
    service = google_cloud_run_service.api.name
  }
}

resource "google_compute_health_check" "cloud_run_health" {
  name        = "${var.service_name}-health-check"
  project     = var.project_id
  check_interval_sec  = 10
  timeout_sec         = 5
  unhealthy_threshold = 3
  healthy_threshold   = 2

  https_health_check {
    port               = "443"
    request_path       = "/health"
    response           = "OK"
  }
}

output "service_url" {
  value       = google_cloud_run_service.api.status[0].url
  description = "Cloud Run service URL"
}

output "backend_service" {
  value       = google_compute_backend_service.cloud_run_backend.id
  description = "Backend service ID for load balancer"
}

output "service_account_email" {
  value       = google_service_account.cloud_run_sa.email
  description = "Cloud Run service account email"
}
