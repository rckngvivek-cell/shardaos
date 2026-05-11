terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket  = "deerflow-terraform-state"
    prefix  = "prod"
    encryption_key = "terraform-state-encryption-key"
  }
}

provider "google" {
  project = var.project_id
  region  = var.primary_region
}

provider "google-beta" {
  project = var.project_id
  region  = var.primary_region
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "compute.googleapis.com",
    "run.googleapis.com",
    "monitoring.googleapis.com",
    "logging.googleapis.com",
    "cloudarmor.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudkms.googleapis.com",
    "sql-component.googleapis.com",
    "sqladmin.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iam.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "container.googleapis.com",
    "servicemesh.googleapis.com",
    "trafficdirector.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}

# Locals for environment
locals {
  environment = "prod"
  app_name    = "deerflow"
  
  regions = {
    primary   = var.primary_region
    secondary = var.secondary_region
    tertiary  = var.tertiary_region
  }

  regional_configs = {
    asia-south1 = {
      name       = "asia"
      location   = "asia-south1"
      cpu_max    = 1000
      memory_max = 8
    }
    us-central1 = {
      name       = "us"
      location   = "us-central1"
      cpu_max    = 800
      memory_max = 6
    }
    europe-west1 = {
      name       = "eu"
      location   = "europe-west1"
      cpu_max    = 600
      memory_max = 4
    }
  }

  common_labels = {
    environment = local.environment
    app         = local.app_name
    managed_by  = "terraform"
    team        = "devops"
  }
}

# KMS Keyring for encryption
resource "google_kms_key_ring" "deerflow" {
  name     = "${local.app_name}-keyring-${local.environment}"
  location = var.primary_region

  depends_on = [google_project_service.required_apis["cloudkms.googleapis.com"]]
}

# KMS Key for Cloud SQL
resource "google_kms_crypto_key" "cloudsql" {
  name            = "${local.app_name}-cloudsql-key"
  key_ring        = google_kms_key_ring.deerflow.id
  rotation_period = "7776000s"
  labels          = local.common_labels

  depends_on = [google_project_service.required_apis["cloudkms.googleapis.com"]]
}

# KMS Key for GCS buckets
resource "google_kms_crypto_key" "gcs" {
  name            = "${local.app_name}-gcs-key"
  key_ring        = google_kms_key_ring.deerflow.id
  rotation_period = "7776000s"
  labels          = local.common_labels

  depends_on = [google_project_service.required_apis["cloudkms.googleapis.com"]]
}

output "kms_keyring_name" {
  value = google_kms_key_ring.deerflow.name
}

output "cloudsql_key_name" {
  value = google_kms_crypto_key.cloudsql.name
}

output "gcs_key_name" {
  value = google_kms_crypto_key.gcs.name
}
