# School ERP DevOps Infrastructure - Week 2 Part 2

Complete production-grade DevOps setup for School ERP with multi-region failover, notifications infrastructure, monitoring, and CI/CD pipelines.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Directory Structure](#directory-structure)
3. [Prerequisites](#prerequisites)
4. [Quick Start](#quick-start)
5. [Terraform Deployment](#terraform-deployment)
6. [Deployment Procedures](#deployment-procedures)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Runbooks](#runbooks)
9. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Multi-Region Setup

```
┌─────────────────────────────────────────────────────┐
│           Global Load Balancer + Cloud CDN          │
│               (SSL/TLS Termination)                 │
└──────────┬────────────────┬───────────────┬─────────┘
           │                │               │
    ┌──────▼───┐     ┌──────▼───┐    ┌────▼──────┐
    │ US (Prim)│     │Asia (Hot)│    │ EU (Hot)  │
    │us-central│     │asia-sth1 │    │eur-west1 │
    └─┬────────┘     └─┬────────┘    └────┬──────┘
      │                │                   │
    ┌─▼──────────┐   ┌─▼──────────┐   ┌───▼────────┐
    │ Cloud Run  │   │ Cloud Run  │   │ Cloud Run  │
    │ (2-10)     │   │ (1-5)      │   │ (1-5)      │
    └─┬──────────┘   └─┬──────────┘   └───┬────────┘
      │                │                   │
    ┌─▼──────────┐   ┌─▼──────────┐   ┌───▼────────┐
    │ Firestore  │◄──┤ Firestore  │◄──┤ Firestore  │
    │ Primary    │   │ Replica    │   │ Replica    │
    └────────────┘   └────────────┘   └────────────┘
```

### Key Components

| Component | Region | Count | Purpose |
|-----------|--------|-------|---------|
| Cloud Run API | Primary + Secondary | 4 services | API backends for teachers, admins, notifications |
| Firestore | Global | 1 primary + 2 replicas | Multi-region data sync |
| Cloud Load Balancer | Global | 1 | Geo-routing & failover |
| Pub/Sub | All regions | 1 topic + 1 DLQ | Async notification processing |
| Cloud Functions | Primary | 3+ | SMS, Email, Push dispatch |
| BigQuery | All regions | 1 dataset | Notification analytics |
| Cloud CDN | Global | 1 | Static asset caching |

---

## 📁 Directory Structure

```
apps/infra/
├── terraform/
│   ├── main.tf                 # Main configuration (3-region setup)
│   ├── variables.tf            # Input variables
│   ├── terraform.tfvars.example # Example values
│   └── modules/
│       ├── cloud-run/           # Cloud Run service template
│       ├── firestore/           # Firestore DB + replication
│       ├── global-load-balancer/ # GLB + Cloud Armor
│       ├── monitoring/          # Dashboards + alerts (8+12)
│       └── notifications/       # Pub/Sub, Twilio, SendGrid, FCM
├── scripts/
│   ├── blue-green-deploy.sh     # Blue-green deployment
│   ├── rollback.sh              # Instant rollback
│   └── disaster-recovery.sh     # DR procedures
├── monitoring/
│   ├── k6-load-test.js         # Load testing script
│   └── monitoring-queries.sql   # BigQuery Firestore analysis
├── ci-cd/
│   └── notification-service-deploy.yml # GitHub Actions workflow
└── runbooks/
    ├── INCIDENT_RESPONSE_RUNBOOK.md   # 6 P0/P1 incident procedures
    └── OPERATIONAL_PROCEDURES.md       # Daily ops, maintenance, scaling
```

---

## ✅ Prerequisites

### Required Tools

```bash
# GCP CLI
gcloud --version # >= 450

# Terraform
terraform --version # >= 1.0

# Docker
docker --version # >= 20.10

# Node.js & pnpm
node --version # >= 18
pnpm --version # >= 8

# kubectl (for future Kubernetes)
kubectl version --client # >= 1.28
```

### GCP Setup

```bash
# 1. Create GCP project
GCP_PROJECT="school-erp-prod"
gcloud projects create $GCP_PROJECT

# 2. Enable required APIs
gcloud services enable run.googleapis.com \
  firestore.googleapis.com \
  compute.googleapis.com \
  cloudscheduler.googleapis.com \
  pubsub.googleapis.com \
  cloudfunctions.googleapis.com \
  secretmanager.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  --project=$GCP_PROJECT

# 3. Create Terraform state bucket
gsutil mb -l us-central1 \
  -c STANDARD \
  "gs://school-erp-terraform-state"

# 4. Create service account
gcloud iam service-accounts create school-erp-terraform \
  --display-name="Terraform Service Account" \
  --project=$GCP_PROJECT

# 5. Grant permissions
gcloud projects add-iam-policy-binding $GCP_PROJECT \
  --member="serviceAccount:school-erp-terraform@${GCP_PROJECT}.iam.gserviceaccount.com" \
  --role="roles/owner"

# 6. Create service account key
gcloud iam service-accounts keys create ./gcp-key.json \
  --iam-account=school-erp-terraform@${GCP_PROJECT}.iam.gserviceaccount.com \
  --project=$GCP_PROJECT
```

### Secrets Setup

```bash
# Add credentials to Secret Manager
echo "ACxxxxxxxxxxxx" | gcloud secrets create twilio-account-sid \
  --replication-policy="automatic" \
  --data-file=- \
  --project=$GCP_PROJECT

echo "your_auth_token" | gcloud secrets create twilio-auth-token \
  --replication-policy="automatic" \
  --data-file=- \
  --project=$GCP_PROJECT

echo "SG.xxxxxxxxxxxx" | gcloud secrets create sendgrid-api-key \
  --replication-policy="automatic" \
  --data-file=- \
  --project=$GCP_PROJECT

echo "your_fcm_key" | gcloud secrets create fcm-server-key \
  --replication-policy="automatic" \
  --data-file=- \
  --project=$GCP_PROJECT
```

---

## 🚀 Quick Start

### 1. Initialize Terraform

```bash
cd apps/infra/terraform

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Edit with your values
# vim terraform.tfvars

# Initialize backend
terraform init \
  -backend-config="bucket=school-erp-terraform-state" \
  -backend-config="prefix=week2-prod"

# Validate configuration
terraform validate
```

### 2. Plan Deployment

```bash
terraform plan -out=tfplan.out
```

### 3. Apply Infrastructure

```bash
terraform apply tfplan.out
```

---

## 📦 Terraform Deployment

### Module Details

#### Cloud Run Module
- **Purpose:** Deploy API backend across regions
- **Features:**
  - Auto-scaling (min/max instances)
  - VPC connector for private Firestore access
  - Health checks & startup probes
  - Service account with least-privilege IAM

```bash
terraform apply -target=module.cloud_run_primary
terraform apply -target=module.cloud_run_secondary_asia
terraform apply -target=module.cloud_run_secondary_eu
```

#### Firestore Module
- **Purpose:** Multi-region database replication
- **Features:**
  - Automated daily backups (3 AM IST)
  - Composite indexes for query performance
  - Backup storage with lifecycle policies
  - Replication to asia-south1 & europe-west1

```bash
terraform apply -target=module.firestore_primary

# Manual replication setup (Terraform limited):
gcloud firestore databases replicate FIRESTORE_NATIVE \
  --async \
  --database=school-erp-prod \
  --regions "asia-south1,europe-west1" \
  --project=$GCP_PROJECT
```

#### Global Load Balancer Module
- **Purpose:** Multi-region traffic distribution
- **Features:**
  - Geo-routing (IN→asia-south1, EU→europe-west1)
  - SSL/TLS termination (Google-managed certs)
  - Cloud Armor DDoS protection
  - Cloud CDN for static assets

```bash
terraform apply -target=module.load_balancer
```

#### Monitoring Module
- **Purpose:** 8 dashboards + 12 alert policies
- **Features:**
  - Real-time visualizations
  - Custom metrics per service
  - SLO tracking (99.5% delivery for notifications)
  - Integration with Slack & email

```bash
terraform apply -target=module.monitoring
```

#### Notifications Module
- **Purpose:** Twilio, SendGrid, FCM integration
- **Features:**
  - Pub/Sub topic with dead-letter queue
  - BigQuery analytics dataset
  - Cloud Scheduler for quota reset
  - Service account with minimal permissions

```bash
terraform apply -target=module.notifications
```

---

## 🔄 Deployment Procedures

### Blue-Green Deployment

```bash
# Requires: New Docker image pushed to registry

./scripts/blue-green-deploy.sh gcr.io/school-erp-prod/api:v2024-04-09

# Steps:
# 1. Deploy green revision (no traffic) - 2 min
# 2. Smoke tests @ 10% traffic - 5 min
# 3. Smoke tests @ 30% traffic - 5 min
# 4. Shift 100% traffic - 2 min
# 5. Monitor for 5 min
# Total: ~30 minutes
```

### Instant Rollback

```bash
./scripts/rollback.sh
# or
./scripts/rollback.sh --force
```

---

## 📊 Monitoring & Alerting

### 8 Production Dashboards

1. **API Performance** - Latency, RPS, error rates
2. **Teacher Module** - Attendance, grades operations
3. **Admin Module** - User mgmt, config changes
4. **Notification Service** - SMS, Email, Push, DLQ
5. **Parent Portal** - Active sessions, payments
6. **System Resources** - CPU, Memory, costs
7. **Firestore** - Reads/writes, indexes
8. **Multi-Region** - Regional failover status

### 12 Alert Policies (P0 → P2)

| Alert | Threshold | Severity | Action |
|-------|-----------|----------|--------|
| API P99 Latency | > 1s | P0 | Page on-call |
| Error Rate | > 5% | P0 | Auto-rollback |
| Error Rate | > 2% | P1 | Notify Slack |
| SMS Delivery | < 99% | P1 | Escalate |
| Email Delivery | < 99% | P1 | Escalate |
| DLQ Size | > 100 msgs | P1 | Investigate |
| Memory Usage | > 90% | P1 | Scale up |
| Firestore Quota | Exceeded | P0 | Request increase |
| Zero Traffic | 5 min | P0 | Page on-call |
| Cold Start | > 2s | P2 | Monitor |

### Access Dashboards

```bash
# View dashboard URLs
gcloud monitoring dashboards list --filter="displayName:API" \
  --format="value(name,displayName)"

# Open in browser
open "https://console.cloud.google.com/monitoring/dashboards/custom"
```

---

## 📚 Runbooks

### Incident Response (6 P0/P1 procedures)

```bash
# View runbook
cat runbooks/INCIDENT_RESPONSE_RUNBOOK.md

# Specific scenarios:
# - High Error Rate (P0) → 15 min RTO
# - API Latency Spike (P0) → 10 min RTO
# - Notification Failures (P1) → 20 min RTO
# - Cloud Run Capacity (P1) → 10 min RTO
# - Firestore Quota (P0) → 15 min RTO
# - Zero Traffic/Outage (P0) → 5 min RTO
```

### Operational Procedures

```bash
# View procedures
cat runbooks/OPERATIONAL_PROCEDURES.md

# Includes:
# - Pre-deployment checklist (15 min)
# - Standard deployment (45 min)
# - Emergency rollback (5 min)
# - Secrets rotation (30 min)
# - Backup validation (1 hr weekly)
# - Capacity planning
# - Maintenance windows
# - Cost optimization
```

---

## 🔧 Troubleshooting

### Terraform Issues

```bash
# State lock stuck
terraform force-unlock <LOCK_ID>

# Re-initialize backend
terraform init -reconfigure

# Debug mode
TF_LOG=DEBUG terraform apply
```

### Deployment Issues

```bash
# Check Cloud Run logs
gcloud run services logs read school-erp-api \
  --region us-central1 \
  --limit 100

# Monitor service events
gcloud run services describe school-erp-api \
  --region us-central1 \
  --format="table(status.conditions[].message)"

# Health check endpoint
curl https://api.school-erp.com/health
```

### Firestore Issues

```bash
# Check replication status
gcloud firestore databases describe school-erp-prod \
  --format="table(name,type,locationId)"

# View firestore metrics
gcloud monitoring read \
  'metric.type="firestore.googleapis.com/document/read_operations"' \
  --start-time="1h"

# Check backup history
gsutil ls -l gs://school-erp-firestore-backups-${GCP_PROJECT}/
```

### Notification Issues

```bash
# Check Pub/Sub subscription
gcloud pubsub subscriptions describe school-erp-notifications-sub

# Pull messages from DLQ
gcloud pubsub subscriptions pull \
  school-erp-notifications-dlq-sub \
  --limit 10 \
  --format="table(message.data,message.attributes)"

# Check Cloud Function logs
gcloud functions logs read notify-dispatcher \
  --limit 100 \
  --region us-central1
```

---

## 📞 Support & Escalation

- **Platform Status:** https://status.school-erp.com
- **DevOps On-Call:** PagerDuty rotation
- **GCP Support:** Console.cloud.google.com > Support
- **Incident Channel:** #incidents-prod (Slack)

---

## 📄 File Reference

**Core Terraform:**
- [main.tf](terraform/main.tf) - Main configuration
- [variables.tf](terraform/variables.tf) - Input variables
- [terraform.tfvars.example](terraform/terraform.tfvars.example) - Example values

**Modules:**
- [cloud-run/](terraform/modules/cloud-run/) - Cloud Run deployment
- [firestore/](terraform/modules/firestore/) - Firestore setup
- [global-load-balancer/](terraform/modules/global-load-balancer/) - GLB + CDN
- [monitoring/](terraform/modules/monitoring/) - Dashboards + alerts
- [notifications/](terraform/modules/notifications/) - Notifications infra

**Scripts:**
- [blue-green-deploy.sh](scripts/blue-green-deploy.sh) - Safe deployments
- [rollback.sh](scripts/rollback.sh) - Emergency rollback
- [disaster-recovery.sh](scripts/disaster-recovery.sh) - DR operations

**CI/CD:**
- [notification-service-deploy.yml](ci-cd/notification-service-deploy.yml) - GitHub Actions workflow

**Monitoring:**
- [k6-load-test.js](monitoring/k6-load-test.js) - Load testing script

**Runbooks:**
- [INCIDENT_RESPONSE_RUNBOOK.md](runbooks/INCIDENT_RESPONSE_RUNBOOK.md) - Incident procedures
- [OPERATIONAL_PROCEDURES.md](runbooks/OPERATIONAL_PROCEDURES.md) - Daily operations

---

## 🔐 Security Best Practices

✅ **Implemented:**
- Cloud Armor DDoS protection
- VPC connectors for private Firestore access
- mTLS between services (via service accounts)
- Secret Manager for API credentials
- Automatic secret rotation (Cloud Scheduler)
- Audit logging for admin actions
- Network policies & firewall rules
- TLS 1.2+ enforcement

⚠️ **Before Production:**
- [ ] Rotate all secrets (Sections 2.3)
- [ ] Enable VPC Service Controls
- [ ] Configure organization policies
- [ ] Enable Cloud KMS for encryption keys
- [ ] Set up security monitoring (SCC)
- [ ] Perform security audit

---

## 📈 Cost Estimate (Monthly)

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| Cloud Run (primary) | $200-500 | Scales 2-10 instances |
| Cloud Run (secondary) | $100-200 | Standby: 1-5 instances |
| Firestore | $500-1000 | Multi-region replication |
| Cloud CDN | $100-200 | Static asset caching |
| Pub/Sub | $50-100 | Notification topics |
| Cloud Functions | $50-100 | SMS/Email/Push dispatch |
| BigQuery | $50-100 | Analytics dataset |
| Cloud Load Balancer | $50-100 | Global LB base cost |
| **Total** | **~₹75K-₹150K** | **($900-$1800)** |

---

## 📝 Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-04-09 | 1.0 | Initial Week 2 Part 2 release |
| - | 1.1 (planned) | Kubernetes migration |
| - | 2.0 (planned) | Multi-cloud setup |

---

**Last Updated:** 2026-04-09  
**Maintained By:** DevOps Team  
**Next Review:** 2026-05-09
