# VPC Network for multi-region setup
resource "google_compute_network" "deerflow_vpc" {
  name                    = "${local.app_name}-vpc-${local.environment}"
  auto_create_subnetworks = false
  routing_mode            = "GLOBAL"
  description             = "DeerFlow VPC for multi-region deployment"

  depends_on = [google_project_service.required_apis["compute.googleapis.com"]]
}

# Primary Region Subnet (Asia South)
resource "google_compute_subnetwork" "primary_subnet" {
  name          = "${local.app_name}-subnet-primary"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.primary_region
  network       = google_compute_network.deerflow_vpc.id
  
  private_ip_google_access = true
  
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_logs_enabled    = true
    metadata             = "INCLUDE_ALL_METADATA"
  }

  labels = merge(
    local.common_labels,
    { region = "primary" }
  )
}

# Secondary Region Subnet (US Central)
resource "google_compute_subnetwork" "secondary_subnet" {
  name          = "${local.app_name}-subnet-secondary"
  ip_cidr_range = "10.1.0.0/20"
  region        = var.secondary_region
  network       = google_compute_network.deerflow_vpc.id
  
  private_ip_google_access = true
  
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_logs_enabled    = true
    metadata             = "INCLUDE_ALL_METADATA"
  }

  labels = merge(
    local.common_labels,
    { region = "secondary" }
  )
}

# Tertiary Region Subnet (Europe West)
resource "google_compute_subnetwork" "tertiary_subnet" {
  name          = "${local.app_name}-subnet-tertiary"
  ip_cidr_range = "10.2.0.0/20"
  region        = var.tertiary_region
  network       = google_compute_network.deerflow_vpc.id
  
  private_ip_google_access = true
  
  log_config {
    aggregation_interval = "INTERVAL_5_SEC"
    flow_logs_enabled    = true
    metadata             = "INCLUDE_ALL_METADATA"
  }

  labels = merge(
    local.common_labels,
    { region = "tertiary" }
  )
}

# Cloud Firewall - Allow internal traffic
resource "google_compute_firewall" "allow_internal" {
  name    = "${local.app_name}-allow-internal"
  network = google_compute_network.deerflow_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "udp"
    ports    = ["0-65535"]
  }

  allow {
    protocol = "icmp"
  }

  source_ranges = ["10.0.0.0/8"]
}

# Cloud Firewall - Allow health checks
resource "google_compute_firewall" "allow_health_check" {
  name    = "${local.app_name}-allow-health-check"
  network = google_compute_network.deerflow_vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080", "8443"]
  }

  source_ranges = ["35.191.0.0/16", "130.211.0.0/22"]
}

# Cloud NAT for outbound traffic
resource "google_compute_router" "primary_router" {
  name    = "${local.app_name}-router-primary"
  region  = var.primary_region
  network = google_compute_network.deerflow_vpc.id

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "primary_nat" {
  name                               = "${local.app_name}-nat-primary"
  router                             = google_compute_router.primary_router.name
  region                             = var.primary_region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Secondary region router and NAT
resource "google_compute_router" "secondary_router" {
  name    = "${local.app_name}-router-secondary"
  region  = var.secondary_region
  network = google_compute_network.deerflow_vpc.id

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "secondary_nat" {
  name                               = "${local.app_name}-nat-secondary"
  router                             = google_compute_router.secondary_router.name
  region                             = var.secondary_region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

# Tertiary region router and NAT
resource "google_compute_router" "tertiary_router" {
  name    = "${local.app_name}-router-tertiary"
  region  = var.tertiary_region
  network = google_compute_network.deerflow_vpc.id

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "tertiary_nat" {
  name                               = "${local.app_name}-nat-tertiary"
  router                             = google_compute_router.tertiary_router.name
  region                             = var.tertiary_region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = true
    filter = "ERRORS_ONLY"
  }
}

output "vpc_id" {
  value = google_compute_network.deerflow_vpc.id
}

output "primary_subnet_id" {
  value = google_compute_subnetwork.primary_subnet.id
}

output "secondary_subnet_id" {
  value = google_compute_subnetwork.secondary_subnet.id
}

output "tertiary_subnet_id" {
  value = google_compute_subnetwork.tertiary_subnet.id
}
