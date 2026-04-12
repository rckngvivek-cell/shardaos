terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket  = "school-erp-terraform-state"
    prefix  = "week2-prod"
    encryption_key = "TERRAFORM_KEY_BASE64" # Set via environment: TF_VAR_encryption_key
  }
}

provider "google" {
  project = var.gcp_project
  region  = var.primary_region
}

provider "google-beta" {
  project = var.gcp_project
  region  = var.primary_region
}

# Primary Region: US-Central1
module "cloud_run_primary" {
  source = "./modules/cloud-run"

  region              = var.primary_region
  project_id          = var.gcp_project
  service_name        = "school-erp-api"
  image               = var.container_image
  min_instances       = var.min_instances_primary
  max_instances       = var.max_instances_primary
  cpu                 = var.cloud_run_cpu
  memory              = var.cloud_run_memory
  environment_vars    = var.environment_vars
  secrets             = var.secrets
  vpc_connector       = google_vpc_access_connector.private.id

  depends_on = [
    module.firestore_primary
  ]
}

module "firestore_primary" {
  source = "./modules/firestore"

  project_id         = var.gcp_project
  region             = var.primary_region
  database_id        = "school-erp-prod"
  enable_replication = true
  replica_regions    = var.replica_regions
}

module "load_balancer" {
  source = "./modules/global-load-balancer"

  project_id           = var.gcp_project
  name                 = "school-erp-global-lb"
  health_check_path    = "/health"
  primary_backend_service = module.cloud_run_primary.backend_service
  secondary_backends   = {
    asia-south1 = module.cloud_run_secondary_asia.backend_service
    europe-west1 = module.cloud_run_secondary_eu.backend_service
  }
  ssl_certificate_name = "school-erp-ssl-cert"
  cdn_enabled          = true
  cache_mode          = "CACHE_ALL_STATIC"
}

# Secondary Region: Asia-South1 (India)
module "cloud_run_secondary_asia" {
  source = "./modules/cloud-run"

  region              = "asia-south1"
  project_id          = var.gcp_project
  service_name        = "school-erp-api-asia"
  image               = var.container_image
  min_instances       = var.min_instances_secondary
  max_instances       = var.max_instances_secondary
  cpu                 = var.cloud_run_cpu
  memory              = var.cloud_run_memory
  environment_vars    = var.environment_vars
  secrets             = var.secrets
  vpc_connector       = google_vpc_access_connector.private_asia.id
}

# Tertiary Region: Europe-West1 (Belgium)
module "cloud_run_secondary_eu" {
  source = "./modules/cloud-run"

  region              = "europe-west1"
  project_id          = var.gcp_project
  service_name        = "school-erp-api-eu"
  image               = var.container_image
  min_instances       = var.min_instances_secondary
  max_instances       = var.max_instances_secondary
  cpu                 = var.cloud_run_cpu
  memory              = var.cloud_run_memory
  environment_vars    = var.environment_vars
  secrets             = var.secrets
  vpc_connector       = google_vpc_access_connector.private_eu.id
}

# Production Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  project_id          = var.gcp_project
  primary_region      = var.primary_region
  secondary_regions   = var.replica_regions
  notification_email  = var.alert_email
  slack_webhook_url   = var.slack_webhook_url
}

# Notifications Infrastructure
module "notifications" {
  source = "./modules/notifications"

  project_id              = var.gcp_project
  twilio_account_sid      = var.twilio_account_sid
  twilio_auth_token       = var.twilio_auth_token
  sendgrid_api_key        = var.sendgrid_api_key
  fcm_server_key          = var.fcm_server_key
  pubsub_topic_name       = "school-erp-notifications"
  dead_letter_topic_name  = "school-erp-notifications-dlq"
  max_delivery_attempts   = 5
  default_ack_deadline_sec = 60
}

# VPC Connectors for Private Firestore Access
resource "google_vpc_access_connector" "private" {
  name          = "school-erp-connector-us"
  region        = var.primary_region
  ip_cidr_range = "10.8.0.0/28"
  network       = google_compute_network.private.name
}

resource "google_vpc_access_connector" "private_asia" {
  name          = "school-erp-connector-asia"
  region        = "asia-south1"
  ip_cidr_range = "10.9.0.0/28"
  network       = google_compute_network.private.name
}

resource "google_vpc_access_connector" "private_eu" {
  name          = "school-erp-connector-eu"
  region        = "europe-west1"
  ip_cidr_range = "10.10.0.0/28"
  network       = google_compute_network.private.name
}

resource "google_compute_network" "private" {
  name                    = "school-erp-private-net"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "private_us" {
  name          = "school-erp-subnet-us"
  network       = google_compute_network.private.name
  region        = var.primary_region
  ip_cidr_range = "10.0.0.0/20"
}

resource "google_compute_subnetwork" "private_asia" {
  name          = "school-erp-subnet-asia"
  network       = google_compute_network.private.name
  region        = "asia-south1"
  ip_cidr_range = "10.1.0.0/20"
}

resource "google_compute_subnetwork" "private_eu" {
  name          = "school-erp-subnet-eu"
  network       = google_compute_network.private.name
  region        = "europe-west1"
  ip_cidr_range = "10.2.0.0/20"
}

# Outputs
output "global_load_balancer_ip" {
  value       = module.load_balancer.external_ip
  description = "Global Load Balancer IP address"
}

output "primary_cloud_run_url" {
  value       = module.cloud_run_primary.service_url
  description = "Primary Cloud Run service URL"
}

output "firestore_database_id" {
  value       = module.firestore_primary.database_id
  description = "Firestore database ID"
}
