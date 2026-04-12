# Cloud SQL database for backup/secondary data store
resource "google_sql_database_instance" "primary" {
  provider             = google-beta
  name                 = "${local.app_name}-db-primary"
  region               = var.primary_region
  database_version     = "POSTGRES_15"
  instance_type        = "CLOUD_SQL_INSTANCE"
  deletion_protection  = true

  settings {
    tier              = var.cloudsql_instance_tier
    availability_type = "HIGH_AVAILABILITY"
    disk_type         = "PD_SSD"
    disk_size         = 100
    disk_autoresize   = true

    backup_configuration {
      enabled                        = true
      start_time                     = "02:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7
      backup_retention_settings {
        retained_backups = 30
        retention_unit   = "COUNT"
      }
    }

    ip_configuration {
      ipv4_enabled    = false
      private_network = google_compute_network.deerflow_vpc.id
      require_ssl     = true
    }

    location_preference {
      zone = "${var.primary_region}-a"
    }

    database_flags {
      name  = "cloudsql_iam_authentication"
      value = "on"
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "ssl"
      value = "on"
    }

    insights_config {
      query_insights_enabled  = true
      query_plans_per_minute  = 5
      query_string_length     = 1024
      record_application_tags = true
    }
  }

  depends_on = [google_project_service.required_apis["sqladmin.googleapis.com"]]
}

# Database
resource "google_sql_database" "deerflow_db" {
  name     = "deerflow_prod"
  instance = google_sql_database_instance.primary.name
}

# Database user (IAM authenticated)
resource "google_sql_user" "app_user" {
  name     = "deerflow-app@${var.project_id}.iam"
  instance = google_sql_database_instance.primary.name
  type     = "CLOUD_IAM_SERVICE_ACCOUNT"
}

output "cloud_sql_instance_name" {
  value = google_sql_database_instance.primary.name
}

output "cloud_sql_connection_name" {
  value = google_sql_database_instance.primary.connection_name
}
