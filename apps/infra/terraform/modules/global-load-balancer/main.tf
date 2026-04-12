provider "google" {
  project = var.project_id
}

# Global Static IP
resource "google_compute_global_address" "web_ip" {
  name            = "${var.name}-ip"
  project         = var.project_id
  address_type    = "EXTERNAL"
  ip_version      = "IPV4"
}

# SSL/TLS Certificate (Google-managed)
resource "google_compute_managed_ssl_certificate" "default" {
  name            = var.ssl_certificate_name
  project         = var.project_id
  managed {
    domains = var.domains
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Health Check
resource "google_compute_health_check" "global" {
  name            = "${var.name}-health-check"
  project         = var.project_id
  check_interval_sec  = 10
  timeout_sec         = 5
  unhealthy_threshold = 3
  healthy_threshold   = 2

  https_health_check {
    port               = "443"
    request_path       = var.health_check_path
    response           = "OK"
  }
}

# URL Map for routing (geo-based + path-based)
resource "google_compute_url_map" "global" {
  name            = "${var.name}-url-map"
  project         = var.project_id
  default_service = var.primary_backend_service

  host_rule {
    hosts        = var.domains
    path_matcher = "default"
  }

  path_matcher {
    name            = "default"
    default_service = var.primary_backend_service

    # Static files routed to CDN
    path_rule {
      paths   = ["/static/*", "/assets/*", "*.css", "*.js"]
      service = google_compute_backend_bucket.static_cache.id
    }

    # API routes
    path_rule {
      paths   = ["/api/*", "/graphql"]
      service = var.primary_backend_service
    }
  }
}

# Backend Bucket for static content (CDN)
resource "google_compute_backend_bucket" "static_cache" {
  name            = "${var.name}-static-bucket"
  project         = var.project_id
  bucket_name     = google_storage_bucket.static_assets.name
  enable_cdn      = true
  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    default_ttl       = 3600
    max_ttl           = 86400
    client_ttl        = 3600
    negative_caching  = true
    negative_caching_policy {
      code = 404
      ttl  = 120
    }

    custom_response_headers = {
      "Cache-Control" = "public, max-age=3600"
      "Strict-Transport-Security" = "max-age=31536000; includeSubDomains"
    }
  }
}

resource "google_storage_bucket" "static_assets" {
  name            = "school-erp-static-assets-${var.project_id}"
  project         = var.project_id
  location        = "US"
  storage_class   = "STANDARD"
  force_destroy   = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age_days = 90
    }
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

# HTTPS Proxy with security headers
resource "google_compute_target_https_proxy" "default" {
  name             = "${var.name}-https-proxy"
  project          = var.project_id
  url_map          = google_compute_url_map.global.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]

  ssl_policy = google_compute_ssl_policy.modern.id

  depends_on = [
    google_compute_managed_ssl_certificate.default
  ]
}

# Modern SSL Policy (TLS 1.2+)
resource "google_compute_ssl_policy" "modern" {
  name            = "${var.name}-ssl-policy"
  project         = var.project_id
  profile         = "MODERN"
  min_tls_version = "TLS_1_2"
}

# Global Forwarding Rule
resource "google_compute_global_forwarding_rule" "https" {
  name                = "${var.name}-https"
  project             = var.project_id
  load_balancing_scheme = "EXTERNAL"
  ip_protocol         = "TCP"
  port_range          = "443"
  target_https_proxy  = google_compute_target_https_proxy.default.id
  address             = google_compute_global_address.web_ip.id
}

# HTTP -> HTTPS Redirect
resource "google_compute_url_map" "http_redirect" {
  name            = "${var.name}-http-redirect"
  project         = var.project_id
  default_url_redirect {
    redirect_response_code = "301"
    https_redirect         = true
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "http_redirect" {
  name            = "${var.name}-http-proxy"
  project         = var.project_id
  url_map         = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http" {
  name                  = "${var.name}-http"
  project               = var.project_id
  load_balancing_scheme = "EXTERNAL"
  ip_protocol           = "TCP"
  port_range            = "80"
  target_http_proxy     = google_compute_target_http_proxy.http_redirect.id
  address               = google_compute_global_address.web_ip.id
}

# Cloud Armor Security Policy
resource "google_compute_security_policy" "policy" {
  name    = "${var.name}-armor-policy"
  project = var.project_id

  # Rate limiting: 100 req/min per IP
  rule {
    action   = "rate_based_ban"
    priority = 1
    match {
      versioned_expr = "RESOURCE_BASED_CEP"
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"

      ban_duration_sec           = 3600
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_threshold_percent = 0.5
    }
    preview = false
  }

  # Geo-blocking: block access from specific countries
  dynamic "rule" {
    for_each = var.blocked_countries
    content {
      action   = "deny(403)"
      priority = rule.key + 100
      match {
        expr {
          expression = "origin.region_code == '${rule.value}'"
        }
      }
      preview = false
    }
  }

  # Allow health checks
  rule {
    action   = "allow"
    priority = 1000
    match {
      versioned_expr = "RESOURCE_BASED_CEP"
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable')"
      }
    }
    preview = true
  }

  # Default allow
  rule {
    action   = "allow"
    priority = 65535
    match {
      versioned_expr = "RESOURCE_BASED_CEP"
    }
  }
}

# Attach Security Policy to Load Balancer
resource "google_compute_backend_service" "with_armor" {
  name            = "${var.name}-armor-backend"
  project         = var.project_id
  security_policy = google_compute_security_policy.policy.id
}

output "external_ip" {
  value       = google_compute_global_address.web_ip.address
  description = "Global Load Balancer IP address"
}

output "url_map_id" {
  value       = google_compute_url_map.global.id
  description = "URL Map ID"
}

output "static_bucket_name" {
  value       = google_storage_bucket.static_assets.name
  description = "Static assets bucket name"
}
