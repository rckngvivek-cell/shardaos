variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "primary_region" {
  type        = string
  description = "Primary GCP region"
}

variable "secondary_regions" {
  type        = list(string)
  description = "Secondary regions"
}

variable "notification_email" {
  type        = string
  description = "Email for notifications"
}

variable "slack_webhook_url" {
  type        = string
  description = "Slack webhook URL"
  sensitive   = true
}
