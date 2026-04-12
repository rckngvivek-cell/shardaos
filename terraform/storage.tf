# Cloud Storage buckets for logs, backups, and artifacts
resource "google_storage_bucket" "logs" {
  name          = "${local.app_name}-logs-${var.project_id}"
  location      = var.primary_region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = var.log_retention_days
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.gcs.id
  }

  labels = local.common_labels
}

# Backup bucket
resource "google_storage_bucket" "backups" {
  name          = "${local.app_name}-backups-${var.project_id}"
  location      = var.backup_location
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type          = "SetStorageClass"
      storage_class = "COLDLINE"
    }
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.gcs.id
  }

  labels = local.common_labels
}

# Artifacts bucket for Docker images, build logs
resource "google_storage_bucket" "artifacts" {
  name          = "${local.app_name}-artifacts-${var.project_id}"
  location      = var.primary_region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  encryption {
    default_kms_key_name = google_kms_crypto_key.gcs.id
  }

  labels = local.common_labels
}

# Cloud Logging sink for centralized logging
resource "google_logging_project_sink" "deerflow_sink" {
  name        = "${local.app_name}-cloud-logging-sink"
  destination = "storage.googleapis.com/${google_storage_bucket.logs.name}"
  filter      = "resource.type=cloud_run_revision OR resource.type=cloud_sql_database"
  unique_writer_identity = true
}

# Grant logging service write permission
resource "google_storage_bucket_iam_member" "logging_write" {
  bucket = google_storage_bucket.logs.name
  role   = "roles/storage.objectCreator"
  member = google_logging_project_sink.deerflow_sink.writer_identity
}

output "logs_bucket_name" {
  value = google_storage_bucket.logs.name
}

output "backups_bucket_name" {
  value = google_storage_bucket.backups.name
}

output "artifacts_bucket_name" {
  value = google_storage_bucket.artifacts.name
}
