provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Primary Firestore Database
resource "google_firestore_database" "primary" {
  project             = var.project_id
  name                = var.database_id
  location_id         = var.region
  type                = "FIRESTORE_NATIVE"
  concurrency_mode    = "OPTIMISTIC"
  delete_protection_enabled = true

  depends_on = [
    google_firestore_index.teacher_by_school,
    google_firestore_index.student_by_class
  ]
}

# Firestore Composite Indexes for performance
resource "google_firestore_index" "teacher_by_school" {
  project   = var.project_id
  database  = google_firestore_database.primary.name
  collection = "teachers"
  query_scope = "COLLECTION"

  fields {
    field_path = "school_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "student_by_class" {
  project   = var.project_id
  database  = google_firestore_database.primary.name
  collection = "students"
  query_scope = "COLLECTION"

  fields {
    field_path = "class_id"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }
}

# Backup scheduled for daily at 3 AM IST (10:30 PM UTC)
resource "google_firestore_backup_schedule" "daily" {
  project             = var.project_id
  database            = google_firestore_database.primary.name
  retention_duration  = "${var.backup_retention_days * 24}h"
  daily_recurrence {
    hour = 22
  }

  depends_on = [
    google_firestore_database.primary
  ]
}

# Backup for multi-region replication
resource "google_firestore_backup_schedule" "replication" {
  project             = var.project_id
  database            = google_firestore_database.primary.name
  retention_duration  = "720h" # 30 days for replication testing
  weekly_recurrence {
    day = "SUNDAY"
  }

  depends_on = [
    google_firestore_database.primary
  ]
}

# Firestore Replication Configuration (Cloud Config)
# NOTE: Deployment via Terraform limited; configure via gcloud after:
# gcloud firestore databases replicate FIRESTORE_NATIVE \
#   --async \
#   --region=asia-south1 \
#   --region=europe-west1

# Service Account for backup automation
resource "google_service_account" "firestore_backup_sa" {
  account_id   = "school-erp-firestore-backup"
  display_name = "Service Account for Firestore backup"
  project      = var.project_id
}

resource "google_project_iam_member" "firestore_backup" {
  project = var.project_id
  role    = "roles/datastore.admin"
  member  = "serviceAccount:${google_service_account.firestore_backup_sa.email}"
}

resource "google_project_iam_member" "firestore_backup_reader" {
  project = var.project_id
  role    = "roles/datastore.viewer"
  member  = "serviceAccount:${google_service_account.firestore_backup_sa.email}"
}

# Cloud Storage bucket for backups
resource "google_storage_bucket" "firestore_backups" {
  project           = var.project_id
  name              = "school-erp-firestore-backups-${var.project_id}"
  location          = upper(var.region)
  storage_class     = "STANDARD"
  force_destroy     = false
  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 5
      age_days           = var.backup_retention_days
    }
    action {
      type          = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      age_days = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }
}

resource "google_storage_bucket_iam_member" "firestore_backup_access" {
  bucket = google_storage_bucket.firestore_backups.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.firestore_backup_sa.email}"
}

# Firestore Security Rules
resource "google_firestore_security_rules" "rules" {
  project     = var.project_id
  database    = google_firestore_database.primary.name
  ruleset     = file("${path.module}/firestore.rules")
}

output "database_id" {
  value       = google_firestore_database.primary.name
  description = "Firestore database ID"
}

output "database_url" {
  value       = "https://console.firebase.google.com/project/${var.project_id}/firestore/data"
  description = "Firestore console URL"
}

output "backup_bucket_name" {
  value       = google_storage_bucket.firestore_backups.name
  description = "Backup storage bucket name"
}
