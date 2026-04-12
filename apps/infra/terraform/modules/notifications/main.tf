provider "google" {
  project = var.project_id
}

# Pub/Sub Topic for Notifications
resource "google_pubsub_topic" "notifications" {
  name            = var.pubsub_topic_name
  project         = var.project_id
  retention_duration = "86400s" # 24 hours
}

# Dead Letter Topic
resource "google_pubsub_topic" "notifications_dlq" {
  name    = var.dead_letter_topic_name
  project = var.project_id
}

# Pub/Sub Subscription with Dead Letter Queue
resource "google_pubsub_subscription" "notifications" {
  name            = "school-erp-notifications-sub"
  project         = var.project_id
  topic           = google_pubsub_topic.notifications.name
  push_config {
    push_endpoint = "https://${var.notification_cloud_function_url}/dispatch"
    oidc_token_audience = "https://${var.notification_cloud_function_url}"
  }
  ack_deadline_seconds = var.default_ack_deadline_sec

  dead_letter_policy {
    dead_letter_topic            = google_pubsub_topic.notifications_dlq.id
    max_delivery_attempts        = var.max_delivery_attempts
  }

  enable_message_ordering = false
  filter                  = "attributes.notification_type:*"
}

# DLQ Subscription (for manual processing)
resource "google_pubsub_subscription" "notifications_dlq_sub" {
  name            = "school-erp-notifications-dlq-sub"
  project         = var.project_id
  topic           = google_pubsub_topic.notifications_dlq.name
  ack_deadline_seconds = 60
}

# Service Account for Cloud Functions
resource "google_service_account" "notifications_sa" {
  account_id   = "school-erp-notifications"
  display_name = "Service Account for Notifications"
  project      = var.project_id
}

# Permissions for Cloud Functions
resource "google_project_iam_member" "notifications_pubsub" {
  project = var.project_id
  role    = "roles/pubsub.subscriber"
  member  = "serviceAccount:${google_service_account.notifications_sa.email}"
}

resource "google_project_iam_member" "notifications_secrets" {
  project = var.project_id
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.notifications_sa.email}"
}

resource "google_project_iam_member" "notifications_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.notifications_sa.email}"
}

resource "google_project_iam_member" "notifications_bigquery" {
  project = var.project_id
  role    = "roles/bigquery.dataEditor"
  member  = "serviceAccount:${google_service_account.notifications_sa.email}"
}

# Secret Manager - Twilio Credentials
resource "google_secret_manager_secret" "twilio_account_sid" {
  secret_id = "twilio-account-sid"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "twilio_account_sid" {
  secret      = google_secret_manager_secret.twilio_account_sid.id
  secret_data = var.twilio_account_sid
}

resource "google_secret_manager_secret" "twilio_auth_token" {
  secret_id = "twilio-auth-token"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "twilio_auth_token" {
  secret      = google_secret_manager_secret.twilio_auth_token.id
  secret_data = var.twilio_auth_token
}

# Secret Manager - SendGrid API Key
resource "google_secret_manager_secret" "sendgrid_api_key" {
  secret_id = "sendgrid-api-key"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "sendgrid_api_key" {
  secret      = google_secret_manager_secret.sendgrid_api_key.id
  secret_data = var.sendgrid_api_key
}

# Secret Manager - FCM Server Key
resource "google_secret_manager_secret" "fcm_server_key" {
  secret_id = "fcm-server-key"
  project   = var.project_id

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret_version" "fcm_server_key" {
  secret      = google_secret_manager_secret.fcm_server_key.id
  secret_data = var.fcm_server_key
}

# BigQuery Dataset for Notification Analytics
resource "google_bigquery_dataset" "notifications_analytics" {
  dataset_id            = "notifications_analytics"
  friendly_name         = "Notification Analytics"
  description           = "Analytics data for notifications"
  project               = var.project_id
  location              = "US"
  default_table_expiration_ms = 7776000000 # 90 days
  delete_contents_on_destroy = false

  access {
    role          = "OWNER"
    user_by_email = google_service_account.notifications_sa.email
  }
}

# BigQuery Table for SMS Events
resource "google_bigquery_table" "sms_events" {
  dataset_id = google_bigquery_dataset.notifications_analytics.dataset_id
  table_id   = "sms_events"
  project    = var.project_id

  schema = jsonencode([
    { name = "event_id", type = "STRING", mode = "REQUIRED" },
    { name = "timestamp", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "phone_number", type = "STRING", mode = "REQUIRED" },
    { name = "message_sid", type = "STRING", mode = "NULLABLE" },
    { name = "status", type = "STRING", mode = "NULLABLE" },
    { name = "cost", type = "NUMERIC", mode = "NULLABLE" },
    { name = "error_message", type = "STRING", mode = "NULLABLE" }
  ])

  time_partitioning {
    type          = "DAY"
    field         = "timestamp"
    expiration_ms = 7776000000
  }
}

# BigQuery Table for Email Events
resource "google_bigquery_table" "email_events" {
  dataset_id = google_bigquery_dataset.notifications_analytics.dataset_id
  table_id   = "email_events"
  project    = var.project_id

  schema = jsonencode([
    { name = "event_id", type = "STRING", mode = "REQUIRED" },
    { name = "timestamp", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "recipient_email", type = "STRING", mode = "REQUIRED" },
    { name = "message_id", type = "STRING", mode = "NULLABLE" },
    { name = "status", type = "STRING", mode = "NULLABLE" },
    { name = "bounce_type", type = "STRING", mode = "NULLABLE" },
    { name = "error_message", type = "STRING", mode = "NULLABLE" }
  ])

  time_partitioning {
    type          = "DAY"
    field         = "timestamp"
    expiration_ms = 7776000000
  }
}

# BigQuery Table for Push Notifications
resource "google_bigquery_table" "push_events" {
  dataset_id = google_bigquery_dataset.notifications_analytics.dataset_id
  table_id   = "push_events"
  project    = var.project_id

  schema = jsonencode([
    { name = "event_id", type = "STRING", mode = "REQUIRED" },
    { name = "timestamp", type = "TIMESTAMP", mode = "REQUIRED" },
    { name = "device_token", type = "STRING", mode = "REQUIRED" },
    { name = "platform", type = "STRING", mode = "NULLABLE" },
    { name = "status", type = "STRING", mode = "NULLABLE" },
    { name = "error_code", type = "STRING", mode = "NULLABLE" }
  ])

  time_partitioning {
    type          = "DAY"
    field         = "timestamp"
    expiration_ms = 7776000000
  }
}

# Cloud Scheduler for SMS Rate Limiting Reset (Daily 12 AM UTC)
resource "google_cloud_scheduler_job" "sms_quota_reset" {
  name            = "sms-quota-reset"
  description     = "Reset SMS quota daily"
  schedule        = "0 0 * * *" # 12 AM UTC
  time_zone       = "UTC"
  attempt_deadline = "320s"
  project         = var.project_id

  http_target {
    http_method = "POST"
    uri         = "https://${var.notification_cloud_function_url}/reset-sms-quota"
    oidc_token_audience = "https://${var.notification_cloud_function_url}"
  }
}

# Cloud Scheduler for DLQ Processing (Every 1 hour)
resource "google_cloud_scheduler_job" "dlq_processor" {
  name            = "notification-dlq-processor"
  description     = "Process dead letter queue"
  schedule        = "0 * * * *" # Every hour
  time_zone       = "UTC"
  attempt_deadline = "320s"
  project         = var.project_id

  http_target {
    http_method = "POST"
    uri         = "https://${var.notification_cloud_function_url}/process-dlq"
    oidc_token_audience = "https://${var.notification_cloud_function_url}"
  }
}

output "notifications_topic_id" {
  value       = google_pubsub_topic.notifications.id
  description = "Notifications Pub/Sub topic ID"
}

output "dlq_topic_id" {
  value       = google_pubsub_topic.notifications_dlq.id
  description = "Dead Letter Queue topic ID"
}

output "notifications_sa_email" {
  value       = google_service_account.notifications_sa.email
  description = "Service account email for notifications"
}

output "analytics_dataset_id" {
  value       = google_bigquery_dataset.notifications_analytics.dataset_id
  description = "BigQuery dataset ID for analytics"
}
