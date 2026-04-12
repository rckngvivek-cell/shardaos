variable "gcp_project" {
  type        = string
  description = "GCP Project ID"
}

variable "primary_region" {
  type        = string
  default     = "us-central1"
  description = "Primary GCP region"
}

variable "replica_regions" {
  type        = list(string)
  default     = ["asia-south1", "europe-west1"]
  description = "Secondary regions for replication"
}

variable "container_image" {
  type        = string
  description = "Container image URI"
  # Example: gcr.io/project-id/school-erp-api:latest
}

variable "min_instances_primary" {
  type        = number
  default     = 2
  description = "Minimum Cloud Run instances in primary region"
}

variable "max_instances_primary" {
  type        = number
  default     = 10
  description = "Maximum Cloud Run instances in primary region"
}

variable "min_instances_secondary" {
  type        = number
  default     = 1
  description = "Minimum Cloud Run instances in secondary regions"
}

variable "max_instances_secondary" {
  type        = number
  default     = 5
  description = "Maximum Cloud Run instances in secondary regions"
}

variable "cloud_run_cpu" {
  type        = string
  default     = "2"
  description = "Cloud Run CPU allocation"
}

variable "cloud_run_memory" {
  type        = string
  default     = "2Gi"
  description = "Cloud Run memory allocation"
}

variable "environment_vars" {
  type        = map(string)
  description = "Environment variables for Cloud Run"
  default     = {}
}

variable "secrets" {
  type = map(object({
    key     = string
    version = string
  }))
  description = "Secret Manager references"
  default     = {}
  sensitive   = true
}

variable "alert_email" {
  type        = string
  description = "Email for alert notifications"
}

variable "slack_webhook_url" {
  type        = string
  description = "Slack webhook URL for alerts"
  sensitive   = true
}

variable "twilio_account_sid" {
  type        = string
  description = "Twilio Account SID"
  sensitive   = true
}

variable "twilio_auth_token" {
  type        = string
  description = "Twilio Auth Token"
  sensitive   = true
}

variable "sendgrid_api_key" {
  type        = string
  description = "SendGrid API Key"
  sensitive   = true
}

variable "fcm_server_key" {
  type        = string
  description = "Firebase Cloud Messaging Server Key"
  sensitive   = true
}

variable "backup_retention_days" {
  type        = number
  default     = 90
  description = "Number of days to retain backups"
}

variable "enable_disaster_recovery" {
  type        = bool
  default     = true
  description = "Enable automated disaster recovery"
}
