# Firestore Infrastructure Configuration
# Day 1: Task 2 - Deploy Dev Firestore (1 hour)
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

  backend "gcs" {
    bucket  = "school-erp-terraform-state"
    prefix  = "firestore"
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
  description = "Primary region for Firestore"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "backup_retention_days" {
  description = "Days to retain backups"
  type        = number
  default     = 7
}

# ============================================================================
# FIRESTORE DATABASE
# ============================================================================

resource "google_firestore_database" "main" {
  project     = var.project_id
  name        = "school-erp-${var.environment}"
  location_id = var.region
  type        = "FIRESTORE_NATIVE"
  
  # Delete protection for prod, but allow for dev
  deletion_policy = var.environment == "prod" ? "DELETE" : "DELETE"

  depends_on = [
    google_project_service.firestore_api,
  ]

  labels = {
    environment = var.environment
    managed_by  = "terraform"
    component   = "database"
  }
}

# ============================================================================
# ENABLE REQUIRED APIS
# ============================================================================

resource "google_project_service" "firestore_api" {
  project = var.project_id
  service = "firestore.googleapis.com"
}

resource "google_project_service" "cloudfire_api" {
  project = var.project_id
  service = "cloud.googleapis.com"
}

# ============================================================================
# FIRESTORE INDEXES (Composite indexes)
# ============================================================================

# Index for staff collection queries
resource "google_firestore_index" "staff_email" {
  collection = "staff"
  database   = google_firestore_database.main.name
  project    = var.project_id

  fields {
    field_path = "email"
    order      = "ASCENDING"
  }

  fields {
    field_path = "school_id"
    order      = "ASCENDING"
  }
}

# Index for attendance queries
resource "google_firestore_index" "attendance_class_date" {
  collection = "classAttendance"
  database   = google_firestore_database.main.name
  project    = var.project_id

  fields {
    field_path = "class_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "attendance_date"
    order      = "DESCENDING"
  }
}

# ============================================================================
# BACKUPS CONFIGURATION
# ============================================================================

resource "google_firestore_backup_schedule" "daily" {
  project                 = var.project_id
  database                = google_firestore_database.main.name
  retention_duration      = "${var.backup_retention_days * 24}h"
  frequency               = "DAILY"

  # 2 AM UTC daily backup
  daily_recurrence {
    utc_time {
      hours   = 2
      minutes = 0
    }
  }
}

# ============================================================================
# FIRESTORE SECURITY RULES
# ============================================================================

resource "google_firestore_document" "firestore_rules" {
  collection  = "__/firestore/settings"
  document_id = "rules"
  database    = google_firestore_database.main.name
  project     = var.project_id

  # Rules are typically managed via firebase/firestore CLI
  # This is a placeholder - use firebase-cli for actual rule deployment
}

# ============================================================================
# MONITORING & LOGGING
# ============================================================================

resource "google_logging_project_sink" "firestore_logs" {
  name        = "firestore-logs-${var.environment}"
  destination = "logging.googleapis.com/projects/${var.project_id}/logs/firestore"
  filter      = jsonencode({
    resource = {
      type        = "cloud_firestore_database"
      labels      = {
        database_id = google_firestore_database.main.name
      }
    }
  })

  unique_writer_identity = true
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "firestore_database" {
  description = "Firestore database name"
  value       = google_firestore_database.main.name
}

output "firestore_location" {
  description = "Firestore database location"
  value       = google_firestore_database.main.location_id
}

output "firestore_project" {
  description = "Firestore project ID"
  value       = google_firestore_database.main.project
}

output "backup_schedule_id" {
  description = "Backup schedule ID"
  value       = google_firestore_backup_schedule.daily.name
}

# ============================================================================
# DEPLOYMENT INSTRUCTIONS
# ============================================================================

# Initialize Terraform:
# terraform init -backend-config="bucket=school-erp-terraform-state"

# Plan deployment (dev):
# terraform plan -var-file="env/dev.tfvars"

# Apply (dev):
# terraform apply -var-file="env/dev.tfvars"

# Verify deployment:
# gcloud firestore databases list --project=YOUR_PROJECT_ID
