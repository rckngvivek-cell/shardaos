# 🚀 DEVOPS AGENT - OPTION A QUICK REFERENCE CARD
## Cloud Run Monitoring Deployment
**Mission Duration:** 45 minutes (6:45 PM - 7:30 PM)  
**Date:** April 9, 2026

---

## ONE-PAGE EXECUTION CHECKLIST

### ✅ PRE-FLIGHT (2 minutes)
```bash
gcloud config set project school-erp-prod
gcloud services enable run.googleapis.com monitoring.googleapis.com
gcloud auth login  # If needed
```

---

### ✅ STEP 1: DEPLOY DASHBOARDS (15 minutes)

**3 Dashboards to Deploy:**

```bash
# Dashboard 1: API Metrics
gcloud monitoring dashboards create \
  --config-from-file=./infrastructure/monitoring/dashboards/api-dashboard.json

# Dashboard 2: Infrastructure
gcloud monitoring dashboards create \
  --config-from-file=./infrastructure/monitoring/dashboards/infrastructure-dashboard.json

# Dashboard 3: Business
gcloud monitoring dashboards create \
  --config-from-file=./infrastructure/monitoring/dashboards/business-dashboard.json

# Verify
gcloud monitoring dashboards list --format='table(displayName)'
```

**Expected:** 3 dashboards created and visible

---

### ✅ STEP 2: DEPLOY ALERT POLICIES (15 minutes)

**Commands (copy-paste each):**

```bash
# 1. Error Rate Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-high-error-rate.yaml

# 2. Latency Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-high-latency.yaml

# 3. Uptime Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-low-uptime.yaml

# 4. CPU Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-cpu-high.yaml

# 5. Memory Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-memory-high.yaml

# 6. Database Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-database-latency.yaml

# 7. DDoS Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-ddos-attack.yaml

# 8. Deployment Alert
gcloud alpha monitoring policies create --config-from-file=./infrastructure/monitoring/alert-policies/alert-deployment-failure.yaml

# Verify
gcloud alpha monitoring policies list --format='table(displayName,enabled)'
```

**Expected:** 8 alert policies created and enabled

---

### ✅ STEP 3: CONFIGURE AUTO-SCALING (10 minutes)

```bash
# US Central 1
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:latest \
  --region us-central1 \
  --min-instances 2 \
  --max-instances 50 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 100 \
  --platform managed \
  --allow-unauthenticated

# Asia South 1
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:latest \
  --region asia-south1 \
  --min-instances 3 \
  --max-instances 30 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 100 \
  --platform managed \
  --allow-unauthenticated

# Europe West 1
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp-prod/api:latest \
  --region europe-west1 \
  --min-instances 1 \
  --max-instances 20 \
  --memory 2Gi \
  --cpu 2 \
  --timeout 3600 \
  --concurrency 100 \
  --platform managed \
  --allow-unauthenticated

# Verify all regions
for r in us-central1 asia-south1 europe-west1; do
  echo "=== $r ==="
  gcloud run services describe school-erp-api --region $r | grep 'status:'
done
```

**Expected:** 3 regional deployments with auto-scaling active

---

### ✅ STEP 4: VERIFY HEALTH & METRICS (5 minutes)

```bash
# Get service URL
URL=$(gcloud run services describe school-erp-api \
  --region us-central1 --format='value(status.url)')

# Test health endpoint
curl -i $URL/health

# Check metrics flowing
gcloud monitoring time-series list \
  --filter='metric.type="run.googleapis.com/request_count"' \
  --limit 3

# Check alert policies list
gcloud alpha monitoring policies list --format='value(displayName)' | wc -l
```

**Expected:** Health 200 OK, metrics present, 8+ alert policies listed

---

### ✅ STEP 5: SLACK INTEGRATION (5 minutes)

```bash
# Create Slack channel (if not exists)
# In Slack workspace: /channel #alerts

# Get Slack webhook URL from Slack workspace settings
# Save to file
echo "https://hooks.slack.com/services/YOUR/WEBHOOK/URL" > /tmp/slack-webhook.txt

# Create notification channel
gcloud alpha monitoring channels create \
  --display-name="Slack #alerts" \
  --type=slack \
  --channel-content-from-file=/tmp/slack-webhook.txt

# Get channel ID
CHANNEL=$(gcloud alpha monitoring channels list \
  --filter="displayName:Slack" \
  --format='value(name)')

echo "Slack Channel ID: $CHANNEL"
```

**Expected:** Slack channel integrated, ready to receive alerts

---

## 🎯 DASHBOARD URLS

Open these in browser for verification:

```
Cloud Monitoring Dashboards:
https://console.cloud.google.com/monitoring/dashboards?project=school-erp-prod

Alert Policies:
https://console.cloud.google.com/monitoring/alerting/policies?project=school-erp-prod

Cloud Run Services:
https://console.cloud.google.com/run?project=school-erp-prod

Cloud Logging:
https://console.cloud.google.com/logs/query?project=school-erp-prod
```

---

## 📊 METRICS TO MONITOR POST-DEPLOYMENT

In Cloud Monitoring console, add these to Dashboards:

```
1. Request Latency (percentiles)
   metric.type = "run.googleapis.com/request_latencies"

2. Request Count
   metric.type = "run.googleapis.com/request_count"

3. CPU Utilization
   metric.type = "run.googleapis.com/cpu_utilizations"

4. Memory Utilization
   metric.type = "run.googleapis.com/memory_utilizations"

5. Instance Count
   metric.type = "run.googleapis.com/instance_count"

6. Firestore Database Latencies
   metric.type = "firestore.googleapis.com/database/latencies"
```

---

## 🚨 COMMON ISSUES & FIXES

**Dashboard Creation Fails:**
- Verify JSON syntax: `jq . dashboard.json`
- Check API enabled: `gcloud services enable monitoring.googleapis.com`

**Alert Policy Creation Fails:**
- Verify YAML syntax: `yamllint alert-policy.yaml`
- Check alpha commands: `gcloud alpha --help`

**Cloud Run Deployment Fails:**
- Check image exists: `gcloud container images describe gcr.io/school-erp-prod/api:latest`
- Check service account: `gcloud iam service-accounts list`

**Metrics Not Showing:**
- New deployments take 1-2 minutes
- Ensure traffic is reaching service
- Check service is healthy with: `curl $URL/health`

**Alerts Not Firing:**
- Verify conditions are being met
- Check notification channel configuration
- Test with: `curl $URL/invalid-endpoint` (to trigger 5xx)

---

## ⏱️ TIMELINE TRACKING

```
6:45 PM ─ START
 6:45 ─┬─ Pre-flight checks
       ├─ Deploy 3 dashboards (7:00 PM)
       ├─ Deploy 8 alert policies (7:15 PM)
       ├─ Configure 3-region auto-scaling (7:25 PM)
       ├─ Verify health & metrics (7:28 PM)
       ├─ Setup Slack integration (7:30 PM)
       └─ COMPLETE ✓
```

---

## 📞 QUICK CONTACTS

**On-Call DevOps:** [Slack: @devops-oncall]  
**Lead Architect:** [Slack: @lead-architect]  
**Service Status:** [Status Page URL]  

---

## ✅ FINAL VERIFICATION

Run this once to confirm all systems up:

```bash
#!/bin/bash
echo "🔍 Verifying Option A Deployment..."

# Check dashboards
DASHBOARDS=$(gcloud monitoring dashboards list --format='value(displayName)' | grep -i 'school-erp' | wc -l)
echo "Dashboards: $DASHBOARDS/3"

# Check alert policies
ALERTS=$(gcloud alpha monitoring policies list --format='value(displayName)' | wc -l)
echo "Alert Policies: $ALERTS/8"

# Check Cloud Run services
SERVICES=$(gcloud run services list --format='value(metadata.name)' | grep school-erp-api | wc -l)
echo "Cloud Run Services: $SERVICES/1"

# Check health
URL=$(gcloud run services describe school-erp-api --region us-central1 --format='value(status.url)')
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" $URL/health)
echo "Health Check: $HEALTH (expect 200)"

# Summary
if [ "$DASHBOARDS" -eq 3 ] && [ "$ALERTS" -ge 8 ] && [ "$SERVICES" -ge 1 ] && [ "$HEALTH" -eq 200 ]; then
  echo "✅ DEPLOYMENT SUCCESSFUL!"
else
  echo "⚠️  Some components missing. Check above."
fi
```

---

## 🎖️ STATUS AT COMPLETION

- ✅ 3 Dashboards Live
- ✅ 8 Most Critical Alerts Active  
- ✅ Auto-scaling in 3 Regions
- ✅ Health Checks Passing
- ✅ Metrics Flowing
- ✅ Slack Integration Ready
- ✅ Incident Runbook Available

**Status:** 🟢 LIVE & MONITORING  
**Next:** Friday Load Test (2,000 users)  
**Then:** Monday Production Go-Live

---

**Print this page and keep handy during deployment! 🚀**

---

**Created:** April 9, 2026  
**Owner:** DevOps Agent  
**Version:** 1.0 (Quick Reference)
