variable "region" {
  type        = string
  description = "GCP region"
}

variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "service_name" {
  type        = string
  description = "Cloud Run service name"
}

variable "image" {
  type        = string
  description = "Container image URI"
}

variable "min_instances" {
  type        = number
  default     = 1
  description = "Minimum number of instances"
}

variable "max_instances" {
  type        = number
  default     = 10
  description = "Maximum number of instances"
}

variable "cpu" {
  type        = string
  default     = "2"
  description = "CPU allocation"
}

variable "memory" {
  type        = string
  default     = "2Gi"
  description = "Memory allocation"
}

variable "environment_vars" {
  type        = map(string)
  default     = {}
  description = "Environment variables"
}

variable "secrets" {
  type = map(object({
    key     = string
    version = string
  }))
  default     = {}
  description = "Secret Manager references"
}

variable "vpc_connector" {
  type        = string
  description = "VPC Connector resource name for private Firestore access"
}
