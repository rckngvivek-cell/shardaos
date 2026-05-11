variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "primary_region" {
  description = "Primary region (Asia South)"
  type        = string
  default     = "asia-south1"
}

variable "secondary_region" {
  description = "Secondary region (US Central)"
  type        = string
  default     = "us-central1"
}

variable "tertiary_region" {
  description = "Tertiary region (Europe West)"
  type        = string
  default     = "europe-west1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "deerflow"
}

variable "docker_image_tag" {
  description = "Docker image tag for deployments"
  type        = string
  default     = "latest"
}

variable "backend_service_name" {
  description = "Backend service name"
  type        = string
  default     = "deerflow-backend"
}

variable "frontend_service_name" {
  description = "Frontend service name"
  type        = string
  default     = "deerflow-frontend"
}

# Cloud Run Configuration
variable "cloud_run_min_instances" {
  description = "Minimum Cloud Run instances per region"
  type        = number
  default     = 2
}

variable "cloud_run_max_instances" {
  description = "Maximum Cloud Run instances per region"
  type        = number
  default     = 100
}

variable "cloud_run_timeout" {
  description = "Cloud Run request timeout in seconds"
  type        = number
  default     = 300
}

variable "cloud_run_memory" {
  description = "Cloud Run memory allocation (Mi)"
  type        = string
  default     = "2Gi"
}

variable "cloud_run_cpu" {
  description = "Cloud Run CPU allocation"
  type        = string
  default     = "2"
}

# Database Configuration
variable "cloudsql_instance_tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-n1-highmem-4"
}

variable "cloudsql_backup_location" {
  description = "Cloud SQL backup location"
  type        = string
  default     = "asia-south1"
}

# Monitoring Configuration
variable "alert_email" {
  description = "Email for alert notifications"
  type        = string
}

variable "log_retention_days" {
  description = "Cloud Logging retention in days"
  type        = number
  default     = 90
}

# Security Configuration
variable "enable_waf" {
  description = "Enable Cloud Armor WAF"
  type        = bool
  default     = true
}

variable "enable_vpc_sc" {
  description = "Enable VPC Service Controls"
  type        = bool
  default     = true
}

variable "enable_mtls" {
  description = "Enable mTLS for service-to-service communication"
  type        = bool
  default     = true
}

# Payment Gateway
variable "payment_gateway_mode" {
  description = "Payment gateway mode (sandbox/production)"
  type        = string
  default     = "sandbox"
}

variable "razorpay_key_id" {
  description = "Razorpay API Key ID"
  type        = string
  sensitive   = true
}

variable "razorpay_key_secret" {
  description = "Razorpay API Key Secret"
  type        = string
  sensitive   = true
}

# Notification Configuration
variable "notification_batch_size" {
  description = "Notification batch processing size"
  type        = number
  default     = 1000
}

variable "notification_retry_attempts" {
  description = "Notification retry attempts"
  type        = number
  default     = 3
}

# Load Testing Configuration
variable "load_test_enabled" {
  description = "Enable load testing in CI/CD"
  type        = bool
  default     = true
}

variable "load_test_environment" {
  description = "Load testing target environment"
  type        = string
  default     = "staging"
}

# Tags
variable "common_labels" {
  description = "Common labels for all resources"
  type        = map(string)
  default = {
    environment = "prod"
    app         = "deerflow"
    managed_by  = "terraform"
    team        = "devops"
  }
}
