variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "region" {
  type        = string
  description = "GCP region for primary database"
}

variable "database_id" {
  type        = string
  description = "Firestore database ID"
}

variable "backup_retention_days" {
  type        = number
  default     = 90
  description = "Number of days to retain backups"
}

variable "replica_regions" {
  type        = list(string)
  description = "List of regions for Firestore replicas"
  default     = []
}

variable "enable_replication" {
  type        = bool
  default     = true
  description = "Enable multi-region replication"
}
