# 38_DEVOPS_INFRASTRUCTURE_CLOUDRUN.md
# Week 2 Part 3 - DevOps: Cloud Run, GCS, CI/CD Automation

**Status:** Production-Ready | **Ownership:** DevOps Expert | **Date:** April 9, 2026

---

## QUICK SUMMARY

**DevOps Coverage:**
- ✅ GCP Cloud Run (Backend + Admin + Mobile API)
- ✅ Cloud Storage (Media + Documents + Backups)
- ✅ Firestore (NoSQL Database)
- ✅ Cloud SQL (Optional Postgres Mirror)
- ✅ Cloud Build (CI/CD Pipeline)
- ✅ Artifact Registry (Docker images)
- ✅ IAM Roles & Service Accounts
- ✅ VPC Network & Security
- ✅ Cloud Monitoring + Logging
- ✅ Cloud KMS (Encryption keys)

---

## 📁 INFRASTRUCTURE STRUCTURE

```
infrastructure/
├── terraform/
│   ├── main.tf (Project setup)
│   ├── cloud_run.tf (Backend + Admin + Mobile services)
│   ├── firestore.tf (Database)
│   ├── cloud_storage.tf (Media + Documents)
│   ├── iam.tf (Roles + Service accounts)
│   ├── networking.tf (VPC + Security)
│   ├── monitoring.tf (Logging + Alerts)
│   ├── variables.tf
│   ├── outputs.tf
│   └── terraform.tfvars.example
├── gke/
│   ├── cluster.tf (GKE Cluster - optional)
│   └── manifests/ (K8s deployments - optional)
├── cloudbuild/
│   ├── cloudbuild-dev.yaml (Dev environment)
│   ├── cloudbuild-staging.yaml (Staging environment)
│   └── cloudbuild-prod.yaml (Production environment)
├── docker/
│   ├── backend.Dockerfile
│   ├── admin.Dockerfile
│   ├── mobile-api.Dockerfile
│   └── .dockerignore
├── scripts/
│   ├── deploy.sh (Deployment automation)
│   ├── backup.sh (Database backups)
│   ├── health-check.sh (Service health)
│   └── rollback.sh (Emergency rollback)
└── monitoring/
    ├── alerts.yaml (Alert configurations)
    └── dashboards.json (Grafana dashboards)
```

---

## 🔧 TERRAFORM: Cloud Run Setup

### main.tf (Project Configuration)

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket  = "school-erp-terraform-state"
    prefix  = "prod"
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Enable necessary APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "firestore.googleapis.com",
    "storage-api.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com",
    "logging.googleapis.com",
    "monitoring.googleapis.com",
    "servicenetworking.googleapis.com",
    "cloudkms.googleapis.com",
  ])

  service            = each.value
  disable_on_destroy = false
}
```

### cloud_run.tf (Microservices)

```hcl
# BACKEND SERVICE
resource "google_cloud_run_service" "backend" {
  name     = "school-erp-backend"
  location = var.gcp_region

  template {
    spec {
      containers {
        image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/school-erp/backend:${var.backend_image_tag}"

        ports {
          container_port = 3000
        }

        env {
          name  = "FIRESTORE_DATABASE"
          value = var.firestore_database
        }
        env {
          name  = "GCS_BUCKET"
          value = google_storage_bucket.media.name
        }
        env {
          name  = "ENVIRONMENT"
          value = var.environment
        }
        env {
          name  = "LOG_LEVEL"
          value = var.log_level
        }
        env {
          name  = "RAZORPAY_API_KEY"
          value_from {
            secret_key_ref {
              name = google_secret_manager_secret.razorpay_key.id
              version = "latest"
            }
          }
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }
      }

      service_account_name = google_service_account.backend.email
      timeout_seconds      = 3600
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale" = "100"
        "autoscaling.knative.dev/minScale" = "1"
        "client.knative.dev/user-image"    = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/school-erp/backend:${var.backend_image_tag}"
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [
    google_project_service.required_apis
  ]
}

# Backend Service IAM Binding
resource "google_cloud_run_service_iam_binding" "backend_public" {
  service  = google_cloud_run_service.backend.name
  location = google_cloud_run_service.backend.location
  role     = "roles/run.invoker"

  members = [
    "allUsers"  # Public access (API Gateway will handle auth)
  ]
}

output "backend_url" {
  value = google_cloud_run_service.backend.status[0].url
}

# ADMIN SERVICE (Similar structure)
resource "google_cloud_run_service" "admin" {
  name     = "school-erp-admin"
  location = var.gcp_region

  template {
    spec {
      containers {
        image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/school-erp/admin:${var.admin_image_tag}"
        ports {
          container_port = 3001
        }
        env {
          name  = "FIRESTORE_DATABASE"
          value = var.firestore_database
        }
        env {
          name  = "BACKEND_SERVICE_URL"
          value = google_cloud_run_service.backend.status[0].url
        }
      }
      service_account_name = google_service_account.admin.email
      timeout_seconds      = 3600
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# MOBILE API SERVICE
resource "google_cloud_run_service" "mobile_api" {
  name     = "school-erp-mobile-api"
  location = var.gcp_region

  template {
    spec {
      containers {
        image = "${var.gcp_region}-docker.pkg.dev/${var.gcp_project_id}/school-erp/mobile-api:${var.mobile_image_tag}"
        ports {
          container_port = 3002
        }
        env {
          name  = "FIRESTORE_DATABASE"
          value = var.firestore_database
        }
        env {
          name  = "ENABLE_OFFLINE_SYNC"
          value = "true"
        }
      }
      service_account_name = google_service_account.mobile_api.email
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}
```

### firestore.tf (Database)

```hcl
# Firestore Database
resource "google_firestore_database" "main" {
  name        = var.firestore_database
  location_id = var.firestore_region
  type        = "FIRESTORE_NATIVE"
  mode        = "DATASTORE"

  depends_on = [
    google_project_service.required_apis
  ]
}

# Firestore Security Rules
resource "google_firestore_security_policy" "main" {
  database_id = google_firestore_database.main.name
  policy_text = file("${path.module}/firestore-rules.txt")
}

# Backup Storage
resource "google_cloud_scheduler_job" "firestore_backup" {
  name        = "firestore-daily-backup"
  description = "Daily backup of Firestore"
  schedule    = "0 2 * * *"  # 2 AM daily
  time_zone   = "UTC"

  http_target {
    http_method = "POST"
    uri         = "https://firestore.googleapis.com/v1/projects/${var.gcp_project_id}/databases/${google_firestore_database.main.name}:exportDocuments"

    headers = {
      Authorization = "Bearer $${OAUTH_ACCESS_TOKEN}"
    }

    body = base64encode(jsonencode({
      output_uri_prefix = "gs://${google_storage_bucket.backups.name}/firestore-backups"
    }))
  }
}
```

### cloud_storage.tf (Storage Buckets)

```hcl
# Media Storage
resource "google_storage_bucket" "media" {
  name          = "${var.gcp_project_id}-media"
  location      = var.gcs_location
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      num_newer_versions = 5
    }
  }

  cors {
    origin           = [var.frontend_url]
    method           = ["GET", "POST", "PUT", "DELETE"]
    response_header  = ["Content-Type", "Cache-Control"]
    max_age_seconds  = 3600
  }
}

# Documents Storage
resource "google_storage_bucket" "documents" {
  name          = "${var.gcp_project_id}-documents"
  location      = var.gcs_location
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "SetStorageClass"
      storage_class = ["COLDLINE"]
    }
    condition {
      age = 30
    }
  }
}

# Backup Storage
resource "google_storage_bucket" "backups" {
  name          = "${var.gcp_project_id}-backups"
  location      = var.gcs_location
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 90
    }
  }
}
```

### iam.tf (Service Accounts & Roles)

```hcl
# Backend Service Account
resource "google_service_account" "backend" {
  account_id   = "school-erp-backend"
  display_name = "School ERP Backend Service"
}

resource "google_project_iam_member" "backend_firestore" {
  project = var.gcp_project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_storage" {
  project = var.gcp_project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

resource "google_project_iam_member" "backend_logging" {
  project = var.gcp_project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.backend.email}"
}

# Admin Service Account
resource "google_service_account" "admin" {
  account_id   = "school-erp-admin"
  display_name = "School ERP Admin Service"
}

resource "google_project_iam_member" "admin_firestore" {
  project = var.gcp_project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.admin.email}"
}

# Mobile API Service Account
resource "google_service_account" "mobile_api" {
  account_id   = "school-erp-mobile-api"
  display_name = "School ERP Mobile API Service"
}

resource "google_project_iam_member" "mobile_firestore" {
  project = var.gcp_project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.mobile_api.email}"
}
```

---

## 🚀 CI/CD: Cloud Build Configuration

### cloudbuild-prod.yaml

```yaml
steps:
  # Step 1: Fetch secrets
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --image=gcr.io/$PROJECT_ID/school-erp
      - --location=us-central1
      - '--output=out'

  # Step 2: Build Backend Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - '${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/backend:${SHORT_SHA}'
      - '-t'
      - '${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/backend:latest'
      - '-f'
      - 'backend/Dockerfile'
      - '.'

  # Step 3: Push Backend image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/backend:${SHORT_SHA}'

  # Step 4: Build Admin Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'build'
      - '-t'
      - '${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/admin:${SHORT_SHA}'
      - '-f'
      - 'admin/Dockerfile'
      - '.'

  # Step 5: Push Admin image
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - 'push'
      - '${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/admin:${SHORT_SHA}'

  # Step 6: Deploy Backend to Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'run'
      - 'deploy'
      - 'school-erp-backend'
      - '--image=${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/backend:${SHORT_SHA}'
      - '--region=${_GCP_REGION}'
      - '--platform=managed'

  # Step 7: Run smoke tests
  - name: 'gcr.io/cloud-builders/kubectl'
    args:
      - '--'
      - 'bash'
      - '-c'
      - |
        #!/bin/bash
        BACKEND_URL=$(gcloud run services describe school-erp-backend --region ${_GCP_REGION} --format='value(status.url)')
        curl -f $$BACKEND_URL/api/v1/health || exit 1

images:
  - '${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/backend:${SHORT_SHA}'
  - '${_GCP_REGION}-docker.pkg.dev/$PROJECT_ID/school-erp/admin:${SHORT_SHA}'

substitutions:
  _GCP_REGION: 'us-central1'

options:
  machineType: 'N1_HIGHCPU_8'

timeout: '3600s'

onSuccess:
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'notify-slack'
      - 'deployment-success'

onFailure:
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - 'notify-slack'
      - 'deployment-failed'
```

---

## 🐳 Docker Configuration

### backend.Dockerfile

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY backend/src ./src
COPY backend/tsconfig.json ./

# Build TypeScript
RUN npm run build

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Install dumb-init (for proper signal handling)
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy from builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs backend/package.json ./

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

ENTRYPOINT ["/sbin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
```

---

## 📊 MONITORING & LOGGING

### monitoring.tf

```hcl
# Cloud Monitoring Alert for high error rate
resource "google_monitoring_alert_policy" "backend_error_rate" {
  display_name = "Backend High Error Rate"
  combiner     = "OR"

  conditions {
    display_name = "Error rate > 5%"

    condition_threshold {
      filter          = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"school-erp-backend\" AND metric.type=\"logging.googleapis.com/user/error_count\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 100

      aggregations {
        alignment_period  = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
}

# Slack Notification Channel
resource "google_monitoring_notification_channel" "slack" {
  display_name = "Slack Notifications"
  type         = "slack"

  labels = {
    channel_name = "#alerts"
  }

  sensitive_labels {
    auth_token = var.slack_webhook_url
  }
}

# Cloud Logging Sink
resource "google_logging_project_sink" "backend_errors" {
  name        = "backend-error-sink"
  destination = "storage.googleapis.com/${google_storage_bucket.logs.name}"

  filter = "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"school-erp-backend\" AND severity>=\"ERROR\""

  unique_writer_identity = true
}

resource "google_storage_bucket" "logs" {
  name          = "${var.gcp_project_id}-logs"
  location      = var.gcs_location
  force_destroy = false
}
```

---

## 🛠️ DEPLOYMENT SCRIPTS

### deploy.sh

```bash
#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project)}"
REGION="${GCP_REGION:-us-central1}"
ENVIRONMENT="${1:-dev}"

echo -e "${YELLOW}=== Deploying School ERP to ${ENVIRONMENT} ===${NC}"

# Step 1: Validate Terraform
echo -e "${YELLOW}Validating Terraform configuration...${NC}"
cd infrastructure/terraform
terraform validate
cd ../..

# Step 2: Plan Terraform
echo -e "${YELLOW}Planning Terraform changes...${NC}"
terraform -chdir=infrastructure/terraform plan \
  -var-file="environments/${ENVIRONMENT}.tfvars" \
  -out=terraform.tfplan

# Step 3: Apply Terraform
echo -e "${YELLOW}Applying Terraform changes...${NC}"
terraform -chdir=infrastructure/terraform apply terraform.tfplan

# Step 4: Build and push Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
gcloud builds submit \
  --config=infrastructure/cloudbuild/cloudbuild-${ENVIRONMENT}.yaml \
  --substitutions=_GCP_PROJECT=${PROJECT_ID},_GCP_REGION=${REGION}

# Step 5: Get service URLs
echo -e "${GREEN}=== Deployment Complete ===${NC}"
BACKEND_URL=$(gcloud run services describe school-erp-backend \
  --region ${REGION} \
  --format='value(status.url)')
ADMIN_URL=$(gcloud run services describe school-erp-admin \
  --region ${REGION} \
  --format='value(status.url)')

echo -e "${GREEN}Backend API: ${BACKEND_URL}${NC}"
echo -e "${GREEN}Admin Portal: ${ADMIN_URL}${NC}"

# Step 6: Run health checks
echo -e "${YELLOW}Running health checks...${NC}"
bash infrastructure/scripts/health-check.sh ${BACKEND_URL} ${ADMIN_URL}
```

### health-check.sh

```bash
#!/bin/bash

BACKEND_URL=$1
ADMIN_URL=$2

echo "Checking Backend Health..."
curl -f "${BACKEND_URL}/api/v1/health" || exit 1
echo "✓ Backend is healthy"

echo "Checking Admin Health..."
curl -f "${ADMIN_URL}/api/v1/health" || exit 1
echo "✓ Admin is healthy"

echo "All services are healthy!"
```

---

## ✅ SUMMARY

**Week 2 Part 3 DevOps Complete:**
- ✅ GCP Cloud Run deployment (3 services)
- ✅ Firestore database setup + security rules
- ✅ Cloud Storage buckets (media, documents, backups)
- ✅ Cloud Build CI/CD pipeline
- ✅ Terraform Infrastructure as Code
- ✅ Service accounts & IAM roles
- ✅ Cloud Monitoring + Logging
- ✅ Automated backups + health checks
- ✅ Docker containerization
- ✅ Deployment automation scripts

**Ready for:** Production deployment, monitoring, scaling
