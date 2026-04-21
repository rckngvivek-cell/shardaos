# Service Account for Cloud Run
resource "google_service_account" "cloud_run" {
  account_id   = "${local.app_name}-cloud-run"
  display_name = "Cloud Run Service Account for DeerFlow"
  description  = "Service account for Cloud Run deployments"

  depends_on = [google_project_service.required_apis["iam.googleapis.com"]]
}

# Service Account for Firestore access
resource "google_service_account" "firestore_accessor" {
  account_id   = "${local.app_name}-firestore-accessor"
  display_name = "Firestore Database Accessor"
  description  = "Service account for Firestore database access"
}

# IAM Binding - Cloud Run Service Account
resource "google_project_iam_member" "cloud_run_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_gcs" {
  project = var.project_id
  role    = "roles/storage.objectUser"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

resource "google_project_iam_member" "cloud_run_trace" {
  project = var.project_id
  role    = "roles/cloudtrace.agent"
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Cloud Run Service - Backend (Primary Region - Asia South)
resource "google_cloud_run_service" "backend_primary" {
  name     = "${local.app_name}-backend-primary"
  location = var.primary_region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email
      
      containers {
        image = "gcr.io/${var.project_id}/${var.backend_service_name}:${var.docker_image_tag}"
        
        env {
          name  = "ENVIRONMENT"
          value = local.environment
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "REGION"
          value = var.primary_region
        }
        
        env {
          name  = "LOG_LEVEL"
          value = "INFO"
        }
        
        env {
          name  = "ENABLE_PROFILING"
          value = "true"
        }
        
        resources {
          limits = {
            cpu    = var.cloud_run_cpu
            memory = var.cloud_run_memory
          }
        }
        
        ports {
          container_port = 8080
          name           = "http1"
        }
        
        liveness_probe {
          http_get {
            path = "/health/live"
            port = 8080
          }
          initial_delay_seconds = 10
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 3
        }
        
        startup_probe {
          http_get {
            path = "/health/ready"
            port = 8080
          }
          initial_delay_seconds = 0
          period_seconds        = 10
          timeout_seconds       = 5
          failure_threshold     = 3
        }
      }
      
      timeout_seconds       = var.cloud_run_timeout
      min_instances         = var.cloud_run_min_instances
      max_instances         = var.cloud_run_max_instances
      concurrency           = 100
      revision_auto_scaling {
        max_concurrency = 100
        min_instances   = var.cloud_run_min_instances
      }
    }

    metadata {
      labels = local.common_labels
      annotations = {
        "autoscaling.knative.dev/minScale" = var.cloud_run_min_instances
        "autoscaling.knative.dev/maxScale" = var.cloud_run_max_instances
      }
    }
  }

  # Traffic management
  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.required_apis["run.googleapis.com"],
    google_service_account.cloud_run
  ]
}

# Cloud Run Service - Backend (Secondary Region - US Central)
resource "google_cloud_run_service" "backend_secondary" {
  name     = "${local.app_name}-backend-secondary"
  location = var.secondary_region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email
      
      containers {
        image = "gcr.io/${var.project_id}/${var.backend_service_name}:${var.docker_image_tag}"
        
        env {
          name  = "ENVIRONMENT"
          value = local.environment
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "REGION"
          value = var.secondary_region
        }
        
        resources {
          limits = {
            cpu    = var.cloud_run_cpu
            memory = var.cloud_run_memory
          }
        }
        
        ports {
          container_port = 8080
          name           = "http1"
        }
      }
      
      timeout_seconds       = var.cloud_run_timeout
      min_instances         = var.cloud_run_min_instances
      max_instances         = var.cloud_run_max_instances
      concurrency           = 100
    }

    metadata {
      labels = local.common_labels
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.required_apis["run.googleapis.com"],
    google_service_account.cloud_run
  ]
}

# Cloud Run Service - Backend (Tertiary Region - Europe West)
resource "google_cloud_run_service" "backend_tertiary" {
  name     = "${local.app_name}-backend-tertiary"
  location = var.tertiary_region

  template {
    spec {
      service_account_name = google_service_account.cloud_run.email
      
      containers {
        image = "gcr.io/${var.project_id}/${var.backend_service_name}:${var.docker_image_tag}"
        
        env {
          name  = "ENVIRONMENT"
          value = local.environment
        }
        
        env {
          name  = "GCP_PROJECT_ID"
          value = var.project_id
        }
        
        env {
          name  = "REGION"
          value = var.tertiary_region
        }
        
        resources {
          limits = {
            cpu    = var.cloud_run_cpu
            memory = var.cloud_run_memory
          }
        }
        
        ports {
          container_port = 8080
          name           = "http1"
        }
      }
      
      timeout_seconds       = var.cloud_run_timeout
      min_instances         = var.cloud_run_min_instances
      max_instances         = var.cloud_run_max_instances
      concurrency           = 100
    }

    metadata {
      labels = local.common_labels
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.required_apis["run.googleapis.com"],
    google_service_account.cloud_run
  ]
}

# Cloud Run IAM - Public Access
data "google_iam_policy" "noauth" {
  binding {
    role = "roles/run.invoker"
    members = [
      "serviceAccount:${google_service_account.cloud_run.email}",
    ]
  }
}

resource "google_cloud_run_service_iam_policy" "backend_primary_noauth" {
  service     = google_cloud_run_service.backend_primary.name
  location    = google_cloud_run_service.backend_primary.location
  policy_data = data.google_iam_policy.noauth.policy_data
}

resource "google_cloud_run_service_iam_policy" "backend_secondary_noauth" {
  service     = google_cloud_run_service.backend_secondary.name
  location    = google_cloud_run_service.backend_secondary.location
  policy_data = data.google_iam_policy.noauth.policy_data
}

resource "google_cloud_run_service_iam_policy" "backend_tertiary_noauth" {
  service     = google_cloud_run_service.backend_tertiary.name
  location    = google_cloud_run_service.backend_tertiary.location
  policy_data = data.google_iam_policy.noauth.policy_data
}

output "backend_primary_url" {
  value = google_cloud_run_service.backend_primary.status[0].url
}

output "backend_secondary_url" {
  value = google_cloud_run_service.backend_secondary.status[0].url
}

output "backend_tertiary_url" {
  value = google_cloud_run_service.backend_tertiary.status[0].url
}

output "cloud_run_service_account_email" {
  value = google_service_account.cloud_run.email
}
