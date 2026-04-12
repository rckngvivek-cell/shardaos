variable "project_id" {
  type        = string
  description = "GCP Project ID"
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

variable "pubsub_topic_name" {
  type        = string
  default     = "school-erp-notifications"
  description = "Pub/Sub topic name"
}

variable "dead_letter_topic_name" {
  type        = string
  default     = "school-erp-notifications-dlq"
  description = "Dead Letter Queue topic name"
}

variable "max_delivery_attempts" {
  type        = number
  default     = 5
  description = "Maximum delivery attempts before sending to DLQ"
}

variable "default_ack_deadline_sec" {
  type        = number
  default     = 60
  description = "Acknowledgement deadline in seconds"
}

variable "notification_cloud_function_url" {
  type        = string
  description = "URL of notification dispatch Cloud Function"
}
