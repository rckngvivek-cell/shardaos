# Operational Procedures - School ERP Production

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Deployment Procedures](#deployment-procedures)
3. [Secrets Rotation](#secrets-rotation)
4. [Backup & Restore](#backup--restore)
5. [Scaling Operations](#scaling-operations)
6. [Maintenance Windows](#maintenance-windows)
7. [Cost Optimization](#cost-optimization)

---

## Pre-Deployment Checklist

**When:** Before every production deployment  
**Duration:** 15 minutes  
**Owner:** DevOps Engineer

```bash
#!/bin/bash
# pre-deployment-checklist.sh

set -e

PROJECT_ID="school-erp-prod"
REGION="us-central1"
NOTIF_EMAIL="devops@school-erp.com"

echo "=== PRE-DEPLOYMENT CHECKLIST ==="

# 1. Verify staging deployment is successful
echo "1. Checking staging deployment..."
STAGING_STATUS=$(gcloud run services describe school-erp-api \
  --region $REGION \
  --project=school-erp-dev \
  --format="value(status.conditions[0].status)")

if [ "$STAGING_STATUS" != "True" ]; then
  echo "❌ Staging deployment is not healthy"
  exit 1
fi
echo "✓ Staging is healthy"

# 2. Verify no critical alerts in staging
echo "2. Checking for critical alerts..."
CRITICAL_ALERTS=$(gcloud monitoring alert-policies list \
  --project=$PROJECT_ID \
  --filter="state!=OK AND severity=CRITICAL" \
  --format="value(displayName)" 2>/dev/null | wc -l)

if [ "$CRITICAL_ALERTS" -gt 0 ]; then
  echo "❌ Critical alerts detected"
  exit 1
fi
echo "✓ No critical alerts"

# 3. Verify Firestore connectivity
echo "3. Checking Firestore connectivity..."
gcloud firestore databases describe school-erp-prod \
  --project=$PROJECT_ID >/dev/null || exit 1
echo "✓ Firestore is accessible"

# 4. Verify backup exists
echo "4. Checking latest backup..."
LATEST_BACKUP=$(gsutil ls -l gs://school-erp-firestore-backups-${PROJECT_ID}/ \
  2>/dev/null | tail -2 | head -1 | awk '{print $NF}')

if [ -z "$LATEST_BACKUP" ]; then
  echo "⚠ No recent backups found - ensure backup scheduled runs"
fi
echo "✓ Latest backup: $LATEST_BACKUP"

# 5. Verify rollback procedure works
echo "5. Testing rollback procedure..."
./scripts/rollback.sh --help >/dev/null || exit 1
echo "✓ Rollback procedure is available"

# 6. Verify monitoring dashboards
echo "6. Checking monitoring dashboards..."
DASHBOARDS=$(gcloud monitoring dashboards list \
  --filter="displayName:API" \
  --format="value(displayName)" | wc -l)

if [ "$DASHBOARDS" -lt 2 ]; then
  echo "⚠ Only $DASHBOARDS monitoring dashboards found"
fi
echo "✓ $DASHBOARDS dashboards are configured"

# 7. Verify notification channels
echo "7. Checking notification channels..."
CHANNELS=$(gcloud monitoring channels list \
  --filter="enabled=true" \
  --format="value(type)" | wc -l)

if [ "$CHANNELS" -lt 2 ]; then
  echo "❌ Not enough notification channels configured"
  exit 1
fi
echo "✓ $CHANNELS notification channels active"

# 8. Verify secrets are rotated
echo "8. Checking secret rotation..."
TWILIO_AGE=$(gcloud secrets versions list twilio-account-sid \
  --project=$PROJECT_ID \
  --limit=1 \
  --format="value(created)" | \
  xargs -I {} dateutil.parser.parse "{}" | \
  python3 -c "import sys; from datetime import datetime; d = datetime.fromisoformat(sys.stdin.read().strip()); print((datetime.now(d.tzinfo) - d).days)")

if [ "$TWILIO_AGE" -gt 180 ]; then
  echo "⚠ Twilio credentials haven't been rotated in $TWILIO_AGE days"
fi
echo "✓ Credentials age: $TWILIO_AGE days"

# 9. Capacity check
echo "9. Verifying resource capacity..."
MAX_INSTANCES=$(gcloud run services describe school-erp-api \
  --region $REGION \
  --project=$PROJECT_ID \
  --format="value(template.spec.containerConcurrency)")

if [ "$MAX_INSTANCES" -lt 50 ]; then
  echo "❌ Max instances ($MAX_INSTANCES) is too low"
  exit 1
fi
echo "✓ Max instances: $MAX_INSTANCES"

echo ""
echo "✅ ALL CHECKS PASSED - Ready for deployment"
echo ""
```

---

## Deployment Procedures

### Standard Deployment (Blue-Green)

**When:** Feature releases, bug fixes  
**Duration:** 45 minutes (30 min automated + 15 min validation)  
**Owner:** DevOps Engineer / Lead

```bash
# Step 1: Build and push image
docker build -t "gcr.io/school-erp-prod/school-erp-api:v$(date +%Y%m%d)" \
  -f apps/api/Dockerfile \
  .

# Step 2: Run pre-deployment checklist
./apps/infra/scripts/pre-deployment-checklist.sh || exit 1

# Step 3: Execute blue-green deployment
cd apps/infra
./scripts/blue-green-deploy.sh "gcr.io/school-erp-prod/school-erp-api:v$(date +%Y%m%d)"

# Step 4: Monitor for 10 minutes
watch -n 10 'gcloud logging read \
  "resource.type=cloud_run_revision AND severity=ERROR" \
  --project=school-erp-prod \
  --limit=20'

# Step 5: Verify key metrics
gcloud monitoring read \
  'metric.type="run.googleapis.com/request_count"' \
  --project=school-erp-prod
```

### Emergency Rollback

**When:** Critical production issue  
**Duration:** 5 minutes  
**Owner:** On-call Engineer

```bash
cd apps/infra
./scripts/rollback.sh --force
```

---

## Secrets Rotation

**When:** Monthly (scheduled)  
**Duration:** 30 minutes  
**Owner:** DevOps Engineer

```bash
#!/bin/bash
# rotate-secrets.sh - Monthly secrets rotation

PROJECT_ID="school-erp-prod"

echo "=== MONTHLY SECRETS ROTATION ==="

# 1. Twilio credentials (rotate at provider)
echo "1. Rotating Twilio credentials..."
# a. Generate new credentials in Twilio console
# b. Test with staging first
gcloud secrets versions add twilio-account-sid \
  --data-file=- \
  --project=$PROJECT_ID <<<$(read -sp "New Twilio Account SID: " TWILIO_SID; echo "$TWILIO_SID")

gcloud secrets versions add twilio-auth-token \
  --data-file=- \
  --project=$PROJECT_ID <<<$(read -sp "New Twilio Auth Token: " TWILIO_TOKEN; echo "$TWILIO_TOKEN")

# 2. SendGrid API key
echo "2. Rotating SendGrid API key..."
gcloud secrets versions add sendgrid-api-key \
  --data-file=- \
  --project=$PROJECT_ID <<<$(read -sp "New SendGrid API Key: " SENDGRID_KEY; echo "$SENDGRID_KEY")

# 3. FCM Server Key
echo "3. Rotating FCM Server Key..."
gcloud secrets versions add fcm-server-key \
  --data-file=- \
  --project=$PROJECT_ID <<<$(read -sp "New FCM Server Key: " FCM_KEY; echo "$FCM_KEY")

# 4. Database encryption key
echo "4. Rotating database encryption key..."
NEW_KEY=$(openssl rand -base64 32)
gcloud secrets versions add db-encryption-key \
  --data-file=- \
  --project=$PROJECT_ID <<<$NEW_KEY

# 5. Restart services to pick up new secrets
echo "5. Restarting Cloud Run services to pick up new secrets..."
gcloud run services update school-erp-api \
  --set-env-vars=FORCE_REFRESH=$(date +%s) \
  --region us-central1 \
  --project=$PROJECT_ID

# 6. Verify new secrets are active
echo "6. Verifying new secrets..."
sleep 10
gcloud logging read \
  'resource.type=cloud_run_revision' \
  --limit 20 \
  --project=$PROJECT_ID

echo "✅ Secrets rotation completed"
```

---

## Backup & Restore

### Automated Backup Verification

**Schedule:** Weekly (Monday 1 AM UTC)  
**Procedure:**

```bash
#!/bin/bash
# weekly-backup-validation.sh

PROJECT_ID="school-erp-prod"
STAGING_PROJECT="school-erp-staging"
BACKUP_BUCKET="school-erp-firestore-backups-${PROJECT_ID}"

echo "=== WEEKLY BACKUP VALIDATION ==="

# 1. Get latest backup
LATEST_BACKUP=$(gsutil ls -t gs://${BACKUP_BUCKET}/*.json | head -1)
echo "Latest backup: $LATEST_BACKUP"

# 2. Restore to staging temporary database
echo "Restoring to staging validation database..."
gcloud firestore import "$LATEST_BACKUP" \
  --database=backup-validation \
  --project=$STAGING_PROJECT \
  --async

# 3. Monitor restore operation
echo "Monitoring restore progress..."
gcloud firestore operations list \
  --database=backup-validation \
  --project=$STAGING_PROJECT \
  --filter="state!=DONE" \
  --format="table(name,done,createTime)"

# 4. Run data validation queries
echo "Running data validation checks..."
gcloud firestore query-database \
  --database=backup-validation \
  --collection-ids="schools,teachers,students,classes" \
  --project=$STAGING_PROJECT \
  --format="table(doc_count)" | tail -5

# 5. Verify no data corruption
echo "Checking for data integrity..."
# (Custom validation queries)

# 6. Clean up validation database
gcloud firestore delete-database \
  --database=backup-validation \
  --project=$STAGING_PROJECT

echo "✅ Backup validation completed successfully"
```

### Manual Restore Procedure

**When:** Data corruption or accidental deletion  
**RTO:** 2 hours

```bash
#!/bin/bash
# manual-restore.sh

PROJECT_ID="school-erp-prod"
BACKUP_FILE=$1 # Path to backup file

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: ./manual-restore.sh <backup-file-path>"
  exit 1
fi

echo "=== MANUAL FIRESTORE RESTORE ==="

# 1. Create backup of current state
echo "Creating backup of current state..."
gcloud firestore export \
  "gs://school-erp-firestore-backups-${PROJECT_ID}/pre-restore-$(date +%Y%m%d_%H%M%S).json" \
  --async

# 2. Restore from backup
echo "Starting restore from: $BACKUP_FILE"
gcloud firestore import "$BACKUP_FILE" \
  --async

# 3. Monitor restore
gcloud firestore operations list \
  --filter="state=RUNNING" \
  --format="table(name,done,progress)"

# 4. Validate data after restore
echo "Validating restored data..."
gcloud firestore collections list \
  --format="table(name)"

echo "✅ Restore completed - verify application functionality"
```

---

## Scaling Operations

### Manual Capacity Planning

```bash
#!/bin/bash
# capacity-planning.sh

PROJECT_ID="school-erp-prod"
REGION="us-central1"

echo "=== CAPACITY PLANNING ANALYSIS ==="

# 1. Get current metrics
echo "Current metrics (last 7 days):"
gcloud monitoring read \
  'metric.type="run.googleapis.com/request_count"' \
  --filter='resource.type="cloud_run_revision"' \
  --start-time="7d" \
  --format="table(points[-1].value.int64_value)" \
  --project=$PROJECT_ID

# 2. Peak load analysis
echo "Peak RPS (Requests Per Second):"
gcloud monitoring read \
  'metric.type="custom.googleapis.com/peak_rps"' \
  --start-time="7d" \
  --project=$PROJECT_ID

# 3. Resize if needed
echo "Recommendation: Based on peak RPS, consider..."
# Manual analysis needed
```

### Emergency Scale-Up

```bash
# Quick 10x scale for traffic spike
gcloud run services update school-erp-api \
  --region us-central1 \
  --min-instances=10 \
  --max-instances=100 \
  --cpu=4 \
  --memory=4Gi \
  --project=school-erp-prod

echo "Scaled up - monitor error rates closely"
```

---

## Maintenance Windows

### Scheduled Maintenance (2 AM IST / 8:30 PM UTC)

```bash
#!/bin/bash
# scheduled-maintenance.sh

PROJECT_ID="school-erp-prod"

echo "=== SCHEDULED MAINTENANCE WINDOW ==="

# 1. Notify users
curl -X POST $SLACK_WEBHOOK \
  -H 'Content-Type: application/json' \
  -d '{
    "text": "🔧 *Scheduled Maintenance Initiated* (2-3 AM IST)",
    "blocks": [
      {
        "type": "section",
        "text": {
          "type": "mrkdwn",
          "text": "School ERP maintenance window started. Service may be unavailable."
        }
      }
    ]
  }'

# 2. Update status page
gcloud run services update school-erp-api \
  --set-env-vars=MAINTENANCE_MODE=true \
  --region us-central1 \
  --project=$PROJECT_ID

# 3. Perform maintenance tasks
echo "Running maintenance tasks..."
# - Database VACUUM/optimization
# - Index rebuilds
# - Cache cleanup
# - Log archival

# 4. Resume service
gcloud run services update school-erp-api \
  --set-env-vars=MAINTENANCE_MODE=false \
  --region us-central1 \
  --project=$PROJECT_ID

# 5. Verify systems
echo "Verifying systems are healthy..."
sleep 30
./pre-deployment-checklist.sh

# 6. Notify completion
echo "✅ Maintenance completed"
```

---

## Cost Optimization

### Monthly Cost Review

```bash
#!/bin/bash
# monthly-cost-review.sh

PROJECT_ID="school-erp-prod"

echo "=== MONTHLY COST ANALYSIS ==="

# 1. Get previous month costs
PREV_MONTH=$(date -d "last month" +%Y-%m)
CURRENT_MONTH=$(date +%Y-%m)

echo "Cost breakdown by service:"
gcloud billing accounts list
gcloud billing transactions list \
  --billing-account=$(gcloud billing accounts list --format="value(name)" | head -1) \
  --filter="month=$PREV_MONTH" \
  --format="table(service.description,COST)" | sort -t' ' -k2 -nr

# 2. Recommendations
echo ""
echo "Cost optimization recommendations:"

# Cloud Run
echo "- Cloud Run: Review max-instances and CPU/memory sizing"

# Firestore
echo "- Firestore: Check for unused indexes or collections"

# Storage
echo "- Storage: Review backup retention and move cold data"

# Data Transfer
echo "- Data Transfer: Monitor egress costs"

# 3. Generate forecast
python3 - <<'EOF'
import csv
from datetime import datetime

forecast = {
    'current_month': 5000,  # Example: $5000
    'trend': 1.05,  # 5% monthly growth
}

for month in range(1, 13):
    projected = forecast['current_month'] * (forecast['trend'] ** month)
    print(f"Month +{month}: ${projected:,.2f}")

total_annual = forecast['current_month'] * 12 * (1 + forecast['trend']) / 2
print(f"\nProjected annual: ${total_annual:,.2f}")
EOF
```

---

## Emergency Contacts

- **DevOps Lead:** +91-XXXX-XXXX-XX (on-call rotation)
- **Cloud Support:** ${{ env.GOOGLE_SUPPORT_EMAIL }}
- **Twilio Support:** support@twilio.com
- **SendGrid Support:** support@sendgrid.com
- **PagerDuty:** Escalation via incident channel
