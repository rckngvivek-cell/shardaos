variable "project_id" {
  type        = string
  description = "GCP Project ID"
}

variable "name" {
  type        = string
  description = "Name prefix for load balancer resources"
}

variable "domains" {
  type        = list(string)
  default     = ["school-erp.com", "*.school-erp.com", "api.school-erp.com"]
  description = "Domains for SSL certificate"
}

variable "health_check_path" {
  type        = string
  default     = "/health"
  description = "Health check endpoint path"
}

variable "primary_backend_service" {
  type        = string
  description = "Primary backend service ID"
}

variable "secondary_backends" {
  type        = map(string)
  description = "Secondary backend services by region"
  default     = {}
}

variable "ssl_certificate_name" {
  type        = string
  description = "SSL certificate name"
}

variable "cdn_enabled" {
  type        = bool
  default     = true
  description = "Enable Cloud CDN"
}

variable "cache_mode" {
  type        = string
  default     = "CACHE_ALL_STATIC"
  description = "Cache mode for CDN"
}

variable "blocked_countries" {
  type        = list(string)
  default     = []
  description = "ISO-3166-1 country codes to block"
}
