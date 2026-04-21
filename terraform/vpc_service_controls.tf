# VPC Service Controls for security perimeter
resource "google_access_context_manager_access_policy" "policy" {
  parent = "organizations/${data.google_client_config.current.organization}"
  title  = "DeerFlow VPC-SC Policy"
}

# Access Level for corporate networks
resource "google_access_context_manager_access_level" "corp_network" {
  parent      = "accessPolicies/${google_access_context_manager_access_policy.policy.name}"
  name        = "accessLevels/corp_network"
  title       = "Corp Network"
  description = "DeerFlow office networks"

  basic {
    conditions {
      ip_subnetworks = [
        "203.0.113.0/24",  # Example office IP range
      ]
    }
  }
}

# Service Perimeter for Firestore and Cloud Run
resource "google_access_context_manager_service_perimeter" "deerflow" {
  parent         = "accessPolicies/${google_access_context_manager_access_policy.policy.name}"
  name           = "accessPolicies/${google_access_context_manager_access_policy.policy.name}/servicePerimeters/deerflow_perimeter"
  title          = "DeerFlow Perimeter"
  description    = "Service perimeter for DeerFlow infrastructure"
  perimeter_type = "PERIMETER_TYPE_REGULAR"

  status {
    restricted_services = [
      "storage.googleapis.com",
      "firestore.googleapis.com",
      "cloudresourcemanager.googleapis.com",
    ]

    access_levels = [
      google_access_context_manager_access_level.corp_network.name,
    ]

    ingress_policies {
      ingress_from {
        identity_type = "ANY_IDENTITY"
      }
      ingress_to {
        resources = ["*"]
      }
    }

    egress_policies {
      egress_from {
        identity_type = "ANY_IDENTITY"
      }
      egress_to {
        resources = ["*"]
      }
    }
  }

  depends_on = [
    google_access_context_manager_access_level.corp_network
  ]
}

data "google_client_config" "current" {}

output "access_policy_name" {
  value = google_access_context_manager_access_policy.policy.name
}

output "service_perimeter_name" {
  value = google_access_context_manager_service_perimeter.deerflow.name
}
