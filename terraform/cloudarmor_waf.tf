# CloudArmor WAF Configuration - Week 6

# ============================================================================
# CLOUD ARMOR POLICY FOR DDoS PROTECTION
# ============================================================================

resource "google_compute_security_policy" "school_erp_waf" {
  name            = "school-erp-cloudarmor-waf"
  description     = "Cloud Armor WAF for School-ERP API - DDoS and attack protection"
  provider        = google

  # Rule 1: Rate Limiting (MAX 1000 REQ/MIN per IP)
  rule {
    action   = "rate-based-ban"
    priority = 100
    description = "Rate limit: max 1000 requests per minute per IP"

    match {
      versioned_expr = "v1"
      expr {
        expression = "true"
      }
    }

    rate_limit_options {
      conform_action = "allow"
      exceed_action = "deny-429"

      rate_limit_key_v2 = [
        {
          key = "IP"
        },
        {
          key_name = "API_KEY"
          header_name = "x-api-key"
        }
      ]

      banDurationSec = 300  # 5 minute ban after rate limit exceeded

      enforce_on_key_configs {
        enforce_on_key = "IP"
      }

      enforce_on_key_configs {
        enforce_on_key = "HTTP_HEADER"
        enforce_on_key_name = "x-api-key"
      }

      ban_threshold_count = 1000
      ban_duration_sec = 300
    }
  }

  # Rule 2: Block Large Request Bodies (> 10MB)
  rule {
    action   = "deny(403)"
    priority = 200
    description = "Block requests with body > 10MB (potential DDoS)"

    match {
      versioned_expr = "v1"
      expr {
        expression = "int(origin.region_code) == 0 && int(size(request.body)) > 10485760"
      }
    }
  }

  # Rule 3: SQL Injection Prevention
  rule {
    action   = "deny(403)"
    priority = 300
    description = "Block common SQL injection patterns"

    match {
      versioned_expr = "MANAGED_RULES"
      managed_rule_set {
        name = "owasp-crs-v3-0-1-sqli-v33-stable"
        version = "preview-1"
      }
    }
  }

  # Rule 4: XSS Prevention
  rule {
    action   = "deny(403)"
    priority = 400
    description = "Block cross-site scripting (XSS) attacks"

    match {
      versioned_expr = "MANAGED_RULES"
      managed_rule_set {
        name = "owasp-crs-v3-0-1-xss-stable"
        version = "preview-1"
      }
    }
  }

  # Rule 5: Bad Robots / Bot Management
  rule {
    action   = "deny(403)"
    priority = 500
    description = "Block known malicious bots"

    match {
      versioned_expr = "MANAGED_RULES"
      managed_rule_set {
        name = "json-policy-crbt-v0-1-stable"
        version = "preview-1"
      }
    }
  }

  # Rule 6: Protocol Attack Prevention
  rule {
    action   = "deny(403)"
    priority = 600
    description = "Block protocol attacks and malformed requests"

    match {
      versioned_expr = "v1"
      expr {
        expression = <<-EOL
          // Block requests with invalid methods
          request.method !~ '^(GET|HEAD|POST|PUT|PATCH|DELETE|OPTIONS)$'
          // Block requests with invalid headers
          || args.size() > 200  // More than 200 query parameters
          || has(request.headers['x-forwarded-for']) && len(request.headers['x-forwarded-for']) > 1000
        EOL
      }
    }
  }

  # Rule 7: Geographic Restrictions (Optional - Allow all for now)
  rule {
    action   = "allow"
    priority = 700
    description = "Allow all geographic origins (global service)"

    match {
      versioned_expr = "v1"
      expr {
        expression = "true"
      }
    }
  }

  # Rule 8: Whitelisting Internal Traffic
  rule {
    action   = "allow"
    priority = 800
    description = "Whitelist internal IPs and CDN edges"

    match {
      versioned_expr = "v1"
      expr {
        expression = <<-EOL
          // Google Cloud CDN IPs
          inIpRange(origin.ip, '35.191.0.0/16')
          || inIpRange(origin.ip, '130.211.0.0/22')
          // Internal VPC IPs
          || inIpRange(origin.ip, '10.0.0.0/8')
          // Health check IPs
          || inIpRange(origin.ip, '35.191.0.0/16')
          || inIpRange(origin.ip, '130.211.0.0/22')
        EOL
      }
    }
  }

  # Rule 9: Custom API Validation Rules
  rule {
    action   = "deny(403)"
    priority = 900
    description = "Validate API request format"

    match {
      versioned_expr = "v1"
      expr {
        expression = <<-EOL
          // Require Content-Type for POST/PUT
          (request.method == 'POST' || request.method == 'PUT')
          && !has(request.headers['content-type'])
        EOL
      }
    }
  }

  # Default Rule: Allow all other traffic
  rule {
    action   = "allow"
    priority = 65535
    description = "Default rule - allow all traffic"

    match {
      versioned_expr = "v1"
      expr {
        expression = "true"
      }
    }
  }

  # Advanced Options
  adaptive_protection_config {
    layer_7_ddos_defense_config {
      enable = true
      rule_visibility = "STANDARD"
    }
  }

  # Logging Configuration
  log_config {
    enable = true
    sample_rate = 0.1  # Log 10% of requests
  }
}

# ============================================================================
# CLOUD ARMOR POLICIES FOR EACH BACKEND SERVICE
# ============================================================================

resource "google_compute_backend_service" "deerflow_backend_armored" {
  name = "deerflow-backend-armored"
  enable_cdn = true
  security_policy = google_compute_security_policy.school_erp_waf.id

  custom_request_headers {
    headers = ["X-Client-Region:{client_region}"]
  }

  custom_response_headers {
    headers = [
      "X-Cloud-Armor:enabled",
      "X-Response-Time:{response_time}"
    ]
  }

  # Health check configuration for all regions
  health_checks = [
    google_compute_health_check.https_health_check.id
  ]

  session_affinity = "NONE"

  timeout_sec = 30

  # Backend configuration for Cloud Run services
  backends {
    group = google_compute_instance_group_manager.asia_south1.instance_group
    balancing_mode = "RATE"
    max_rate_per_endpoint = 1000
  }

  backends {
    group = google_compute_instance_group_manager.us_central1.instance_group
    balancing_mode = "RATE"
    max_rate_per_endpoint = 1000
  }

  backends {
    group = google_compute_instance_group_manager.europe_west1.instance_group
    balancing_mode = "RATE"
    max_rate_per_endpoint = 1000
  }

  log_config {
    enable = true
    sample_rate = 0.1
  }
}

# ============================================================================
# MONITORING FOR WAF ACTIVITY
# ============================================================================

resource "google_monitoring_alert_policy" "waf_ddos_attack" {
  display_name = "🔴 SECURITY: DDoS Attack Detected"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.pagerduty_critical.name,
    google_monitoring_notification_channel.sms_oncall.name
  ]

  conditions {
    display_name = "Cloud Armor triggered rate limiting"

    condition_threshold {
      filter          = "metric.type=\"compute.googleapis.com/security_policy/request_count\" AND metric.response_code_class=\"429\""
      duration        = "180s"
      comparison      = "COMPARISON_GT"
      threshold_value = 100  # More than 100 429 responses in 3 minutes

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_SUM"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "**DDoS ATTACK DETECTED**\n\n- Check Cloud Armor logs\n- Review blocked IPs\n- Consider updating WAF rules\n- Contact GCP DDoS Response Team if severe\n\nCloud Armor Dashboard: https://console.cloud.google.com/security/command-center"
    mime_type = "text/markdown"
  }
}

resource "google_monitoring_alert_policy" "waf_sql_injection" {
  display_name = "🔴 SECURITY: SQL Injection Attempt Blocked"
  combiner     = "OR"
  enabled      = true

  notification_channels = [
    google_monitoring_notification_channel.email_ops.name
  ]

  conditions {
    display_name = "SQL injection pattern matched"

    condition_threshold {
      filter          = "metric.type=\"compute.googleapis.com/security_policy/request_count\" AND metric.policy_name=\"school-erp-cloudarmor-waf\" AND metric.rule_priority=\"300\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 10

      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_SUM"
      }

      trigger {
        count = 1
      }
    }
  }

  documentation {
    content   = "SQL injection attempts detected and blocked by Cloud Armor."
    mime_type = "text/markdown"
  }
}

