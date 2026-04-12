# Static IPs for Load Balancer
resource "google_compute_address" "global_ip" {
  name          = "${local.app_name}-global-ip"
  address_type  = "EXTERNAL"
  ip_version    = "IPV4"
  location      = "global"
  address       = null
  description   = "Global static IP for load balancer"
  labels        = local.common_labels
}

# Cloud Armor Security Policy with DDoS and WAF rules
resource "google_compute_security_policy" "deerflow_policy" {
  name        = "${local.app_name}-armor-policy"
  description = "Cloud Armor DDoS and WAF policy for DeerFlow"

  # Rule 1: Block traffic from specific countries (deny-list)
  rule {
    action   = "deny(403)"
    priority = "100"
    match {
      versioned_expr = "CEL"
      cel_options {
        expression = "origin.region_code in ['KP', 'IR', 'SY']"
      }
    }
    description = "Block traffic from high-risk countries"
  }

  # Rule 2: Rate limiting - max 100 requests per minute from single IP
  rule {
    action   = "rate_based_ban"
    priority = "110"
    match {
      versioned_expr = "CEL"
      cel_options {
        expression = "true"
      }
    }
    rate_limit_options {
      conform_action           = "allow"
      exceed_action            = "deny(429)"
      enforce_on_key           = "IP"
      enforce_on_key_name      = ""
      ban_duration_sec         = 600
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_threshold_rule {
        count        = 200
        interval_sec = 60
      }
    }
    description = "Rate limiting: 100 req/min per IP"
  }

  # Rule 3: SQL Injection Protection
  rule {
    action   = "deny(403)"
    priority = "120"
    match {
      expr {
        expression = "replacer.replace('.*(?i)(?:union|select|insert|update|delete|drop|create|alter).*(\\s|\\(|$)', 'X') != '#' && evaluatePreconfiguredExpr('sqli-v33-stable', ['owasp-crs-v030001-id942251-sqli', 'owasp-crs-v030001-id942420-sqli', 'owasp-crs-v030001-id942431-sqli'])"
      }
    }
    description = "SQL injection protection"
  }

  # Rule 4: XSS Protection
  rule {
    action   = "deny(403)"
    priority = "130"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-v33-stable', ['owasp-crs-v030001-id941110-xss', 'owasp-crs-v030001-id941120-xss', 'owasp-crs-v030001-id941130-xss'])"
      }
    }
    description = "XSS attack protection"
  }

  # Rule 5: Remote Code Execution (RCE) Protection
  rule {
    action   = "deny(403)"
    priority = "140"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rce-v33-stable', ['owasp-crs-v030001-id930100-rce'])"
      }
    }
    description = "RCE attack protection"
  }

  # Rule 6: Protect specific sensitive endpoints
  rule {
    action   = "deny(403)"
    priority = "150"
    match {
      versioned_expr = "CEL"
      cel_options {
        expression = "request.path.matches('(/admin|/api/admin|/superuser)')"
      }
    }
    description = "Block access to admin endpoints"
  }

  # Rule 7: Geographic routing - Allow main regions
  rule {
    action   = "deny(403)"
    priority = "160"
    match {
      versioned_expr = "CEL"
      cel_options {
        expression = "!origin.region_code in ['IN', 'US', 'GB', 'DE', 'FR', 'CA', 'AU']"
      }
    }
    description = "Allow traffic only from whitelisted regions"
  }

  # Rule 8: Block large requests
  rule {
    action   = "deny(413)"
    priority = "170"
    match {
      versioned_expr = "CEL"
      cel_options {
        expression = "int(request.headers['content-length']) > 10485760"
      }
    }
    description = "Block requests larger than 10MB"
  }

  # Rule 9: Require User-Agent header
  rule {
    action   = "deny(403)"
    priority = "180"
    match {
      versioned_expr = "CEL"
      cel_options {
        expression = "!has(request.headers['user-agent'])"
      }
    }
    description = "Block requests without User-Agent"
  }

  # Default rule - allow
  rule {
    action   = "allow"
    priority = "2147483647"
    match {
      versioned_expr = "CEL"
      cel_options {
        expression = "true"
      }
    }
    description = "Default allow rule"
  }

  labels = local.common_labels
}

# Backend Health Check
resource "google_compute_health_check" "backend" {
  name        = "${local.app_name}-backend-health-check"
  description = "Health check for Cloud Run backend"

  http_health_check {
    port         = 8080
    request_path = "/health/ready"
    proxy_header = "NONE"
  }

  check_interval_sec  = 30
  timeout_sec         = 10
  healthy_threshold   = 2
  unhealthy_threshold = 3
}

# Backend Service for Primary Region
resource "google_compute_backend_service" "backend_primary" {
  name              = "${local.app_name}-backend-primary-bs"
  protocol          = "HTTP2"
  timeout_sec       = 30
  session_affinity  = "NONE"
  affinity_cookie_ttl_sec = 30
  health_checks     = [google_compute_health_check.backend.id]
  security_policy   = google_compute_security_policy.deerflow_policy.id
  load_balancing_scheme = "EXTERNAL"
  custom_request_headers {
    headers = ["X-Client-Region:{client_region}"]
  }

  backend {
    group           = google_compute_network_endpoint_group.backend_primary_neg.id
    balancing_mode  = "RATE"
    max_rate        = 1000
    capacity_scaler = 1.0
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# Backend Service for Secondary Region
resource "google_compute_backend_service" "backend_secondary" {
  name              = "${local.app_name}-backend-secondary-bs"
  protocol          = "HTTP2"
  timeout_sec       = 30
  health_checks     = [google_compute_health_check.backend.id]
  security_policy   = google_compute_security_policy.deerflow_policy.id
  load_balancing_scheme = "EXTERNAL"
  
  backend {
    group           = google_compute_network_endpoint_group.backend_secondary_neg.id
    balancing_mode  = "RATE"
    max_rate        = 800
    capacity_scaler = 1.0
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# Backend Service for Tertiary Region
resource "google_compute_backend_service" "backend_tertiary" {
  name              = "${local.app_name}-backend-tertiary-bs"
  protocol          = "HTTP2"
  timeout_sec       = 30
  health_checks     = [google_compute_health_check.backend.id]
  security_policy   = google_compute_security_policy.deerflow_policy.id
  load_balancing_scheme = "EXTERNAL"
  
  backend {
    group           = google_compute_network_endpoint_group.backend_tertiary_neg.id
    balancing_mode  = "RATE"
    max_rate        = 600
    capacity_scaler = 1.0
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# Network Endpoint Groups (NEGs) for Cloud Run
resource "google_compute_network_endpoint_group" "backend_primary_neg" {
  name                  = "${local.app_name}-backend-primary-neg"
  network_endpoint_type = "SERVERLESS"
  location              = var.primary_region

  cloud_run {
    service = google_cloud_run_service.backend_primary.name
  }
}

resource "google_compute_network_endpoint_group" "backend_secondary_neg" {
  name                  = "${local.app_name}-backend-secondary-neg"
  network_endpoint_type = "SERVERLESS"
  location              = var.secondary_region

  cloud_run {
    service = google_cloud_run_service.backend_secondary.name
  }
}

resource "google_compute_network_endpoint_group" "backend_tertiary_neg" {
  name                  = "${local.app_name}-backend-tertiary-neg"
  network_endpoint_type = "SERVERLESS"
  location              = var.tertiary_region

  cloud_run {
    service = google_cloud_run_service.backend_tertiary.name
  }
}

# URL Map for geo-routing
resource "google_compute_url_map" "deerflow" {
  name            = "${local.app_name}-url-map"
  description     = "URL map with geo-routing"
  default_service = google_compute_backend_service.backend_primary.id

  # Route traffic based on geography
  host_rules {
    hosts        = ["api.deerflow.com", "*.api.deerflow.com"]
    path_matcher = "geo-routing"
  }

  path_matcher {
    name            = "geo-routing"
    default_service = google_compute_backend_service.backend_primary.id

    route_rules {
      priority = 1
      service  = google_compute_backend_service.backend_primary.id
      match_rules {
        origin_region_match = ["asia-south1"]
      }
    }

    route_rules {
      priority = 2
      service  = google_compute_backend_service.backend_secondary.id
      match_rules {
        origin_region_match = ["us-central1"]
      }
    }

    route_rules {
      priority = 3
      service  = google_compute_backend_service.backend_tertiary.id
      match_rules {
        origin_region_match = ["europe-west1"]
      }
    }
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "deerflow" {
  name                             = "${local.app_name}-https-proxy"
  url_map                          = google_compute_url_map.deerflow.id
  ssl_certificates                 = [google_compute_managed_ssl_certificate.deerflow.id]
  ssl_policy                       = google_compute_ssl_policy.deerflow.id
  quic_override                    = "ENABLE"
  server_tls_policy                = null
  certificate_map                  = null
}

# Managed SSL Certificate
resource "google_compute_managed_ssl_certificate" "deerflow" {
  name = "${local.app_name}-ssl-cert"

  managed {
    domains = ["api.deerflow.com"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# SSL Policy for TLS 1.2 minimum
resource "google_compute_ssl_policy" "deerflow" {
  name            = "${local.app_name}-ssl-policy"
  profile         = "RESTRICTED"
  min_tls_version = "TLS_1_2"
}

# Global Forwarding Rule
resource "google_compute_global_forwarding_rule" "deerflow" {
  name                  = "${local.app_name}-forwarding-rule"
  load_balancing_scheme = "EXTERNAL"
  ip_protocol           = "TCP"
  port_range            = "443"
  address               = google_compute_address.global_ip.address
  target                = google_compute_target_https_proxy.deerflow.id
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "${local.app_name}-http-redirect"

  default_url_redirect {
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    https_redirect         = true
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "deerflow" {
  name     = "${local.app_name}-http-proxy"
  url_map  = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http" {
  name                  = "${local.app_name}-http-forwarding-rule"
  load_balancing_scheme = "EXTERNAL"
  ip_protocol           = "TCP"
  port_range            = "80"
  address               = google_compute_address.global_ip.address
  target                = google_compute_target_http_proxy.deerflow.id
}

output "load_balancer_ip" {
  value       = google_compute_address.global_ip.address
  description = "Global static IP for load balancer"
}

output "load_balancer_url" {
  value       = "https://${google_compute_address.global_ip.address}"
  description = "Load balancer URL"
}

output "security_policy_id" {
  value = google_compute_security_policy.deerflow_policy.id
}
