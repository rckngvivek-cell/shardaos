# Cloud Run Service Configuration
# Day 1: Task 3 - Cloud Run Readiness (1 hour)
# Author: DevOps Team
# Status: In Development

terraform {
  required_version = ">= 1.5"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# ============================================================================
# VARIABLES
# ============================================================================

variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Cloud Run region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "school-erp-api"
}

variable "container_image" {
  description = "Container image URI"
  type        = string
  default     = "gcr.io/school-erp/api:latest"
}

variable "memory" {
  description = "Memory allocation (Mi)"
  type        = string
  default     = "512Mi"
}

variable "cpu" {
  description = "CPU allocation"
  type        = string
  default     = "1"
}

variable "max_instances" {
  description = "Maximum service instances"
  type        = number
  default     = 100
}

variable "min_instances" {
  description = "Minimum service instances (for dev: 0, prod: higher)"
  type        = number
  default     = 0
}

# ============================================================================
# ENABLE REQUIRED APIS
# ============================================================================

resource "google_project_service" "run_api" {
  project            = var.project_id
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry_api" {
  project            = var.project_id
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "cloudbuild_api" {
  project            = var.project_id
  service            = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

# ============================================================================
# SERVICE ACCOUNT FOR CLOUD RUN
# ============================================================================

resource "google_service_account" "cloudrun_sa" {
  project      = var.project_id
  account_id   = "school-erp-run-${var.environment}"
  display_name = "Cloud Run service account for School ERP ${var.environment}"
}

# Grant necessary IAM roles
resource "google_project_iam_member" "cloudrun_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.editor"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_project_iam_member" "cloudrun_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# ============================================================================
# ARTIFACT REGISTRY (For container images)
# ============================================================================

resource "google_artifact_registry_repository" "docker" {
  project      = var.project_id
  location     = var.region
  repository_id = "school-erp"
  format       = "DOCKER"
  description  = "Docker container registry for School ERP"

  depends_on = [
    google_project_service.artifactregistry_api,
  ]
}

# ============================================================================
# CLOUD RUN SERVICE
# ============================================================================

resource "google_cloud_run_service" "api" {
  project = var.project_id
  name    = "${var.service_name}-${var.environment}"
  location = var.region

  template {
    spec {
      service_account_name = google_service_account.cloudrun_sa.email

      containers {
        image = var.container_image

        ports {
          name           = "http"
          container_port = 3001
        }

        resources {
          limits = {
            memory = var.memory
            cpu    = var.cpu
          }
        }

        # Environment variables
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }

        env {
          name  = "NODE_ENV"
          value = var.environment == "prod" ? "production" : "development"
        }

        env {
          name  = "GOOGLE_CLOUD_PROJECT"
          value = var.project_id
        }

        # Secrets should be passed via Cloud Secret Manager
        # env_from: [secret_ref]
      }

      timeout_seconds = 60
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = var.max_instances
        "autoscaling.knative.dev/minScale" = var.min_instances
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.run_api,
  ]

  lifecycle {
    ignore_changes = [template[0].metadata[0].generation]
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    component   = "api-server"
  }
}

# ============================================================================
# CLOUD RUN SERVICE AUTOSCALING
# ============================================================================

resource "google_cloud_scheduler_job" "keep_warm" {
  count            = var.environment == "dev" ? 1 : 0  # Keep-warm for dev only
  project          = var.project_id
  name             = "keep-warm-${google_cloud_run_service.api.name}"
  description      = "Keeps Cloud Run service warm"
  schedule         = "*/15 * * * *"  # Every 15 minutes
  time_zone        = "UTC"
  region           = var.region
  attempt_deadline = "320s"

  http_target {
    http_method = "GET"
    uri         = "${google_cloud_run_service.api.status[0].url}/health"

    oidc_token {
      service_account_email = google_service_account.cloudrun_sa.email
    }
  }
}

# ============================================================================
# IAM CONFIGURATION
# ============================================================================

# Allow unauthenticated access (can be restricted later)
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.api.name
  location = google_cloud_run_service.api.location
  role     = "roles/run.invoker"
  member   = "allUsers"

  depends_on = [google_cloud_run_service.api]
}

# ============================================================================
# MONITORING & ALERTS
# ============================================================================

resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High error rate on ${google_cloud_run_service.api.name}"
  combiner     = "OR"
  project      = var.project_id

  conditions {
    display_name = "Error rate > 5%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metadata.response_code_class=\"5xx\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.05

      aggregations {
        alignment_period  = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [] # Add your notification channels here

  enabled = true
}

resource "google_monitoring_alert_policy" "high_latency" {
  display_name = "High latency on ${google_cloud_run_service.api.name}"
  combiner     = "OR"
  project      = var.project_id

  conditions {
    display_name = "P99 latency > 5s"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5000  # milliseconds

      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_99"
      }
    }
  }

  enabled = true
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "service_name" {
  description = "Cloud Run service name"
  value       = google_cloud_run_service.api.name
}

output "service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_service.api.status[0].url
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.cloudrun_sa.email
}

output "artifact_registry_url" {
  description = "Artifact Registry repository URL"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.docker.name}"
}

# ============================================================================
# DEPLOYMENT INSTRUCTIONS
# ============================================================================

# Initialize:
# terraform init -backend-config="bucket=school-erp-terraform-state"

# Plan (dev):
# terraform plan -var-file="env/dev.tfvars"

# Apply (dev):
# terraform apply -var-file="env/dev.tfvars"

# Build and push container:
# gcloud builds submit --tag gcr.io/YOUR_PROJECT/api:latest

# Verify deployment:
# gcloud run services list --region=us-central1
# gcloud run services describe school-erp-api-dev --region=us-central1
