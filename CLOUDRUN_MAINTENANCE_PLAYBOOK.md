# 🔧 Cloud Run Maintenance & Rollback Playbook
## Week 7 Day 2 Phase 2 Staging Deployment

**Last Updated:** April 10, 2026, 10:30 AM IST  
**Environment:** Staging (exam-api-staging, exam-web-staging)  
**Project:** school-erp-dev  
**Region:** us-central1  

---

## 📋 QUICK REFERENCE

| Task | Command | Time |
|------|---------|------|
| View service status | `gcloud run services describe exam-api-staging --region=us-central1` | 2s |
| Tail logs | `gcloud run logs read exam-api-staging --follow` | Real-time |
| List revisions | `gcloud run revisions list --service=exam-api-staging --region=us-central1` | 2s |
| Rollback to previous | `gcloud run services update-traffic exam-api-staging --to-revisions LATEST=0,PREVIOUS=100 --region=us-central1` | 5s |
| Update environment | `gcloud run services update exam-api-staging --update-env-vars LOG_LEVEL=info --region=us-central1` | 10s |
| Scale instances | `gcloud run services update exam-api-staging --min-instances=2 --max-instances=20 --region=us-central1` | 10s |

---

## 🚨 EMERGENCY PROCEDURES

### Immediate Rollback (Service Down)
1. **Identify last working revision:**
   ```bash
   gcloud run revisions list --service=exam-api-staging --region=us-central1 | head -5
   ```

2. **Revert traffic to previous revision:**
   ```bash
   gcloud run services update-traffic exam-api-staging \
     --to-revisions exam-api-staging-001=100 \
     --region=us-central1
   ```

3. **Verify health:**
   ```bash
   curl https://exam-api-staging-[ID].run.app/health
   ```

4. **Alert team:**
   - Slack: #critical-incidents
   - Email: devops-team@school-erp.com

---

## 🔍 MONITORING & DIAGNOSTICS

### Check Service Health
```bash
# Get current service configuration
gcloud run services describe exam-api-staging --region=us-central1

# Check recent revisions
gcloud run revisions list --service=exam-api-staging --region=us-central1

# View memory/CPU usage
gcloud logging read "resource.type=cloud_run_revision" \
  --format="table(timestamp, severity, jsonPayload.message)" \
  --limit=50
```

### Real-Time Log Viewing
```bash
# Backend logs (follow mode)
gcloud run logs read exam-api-staging --region=us-central1 --follow

# Frontend logs (follow mode)
gcloud run logs read exam-web-staging --region=us-central1 --follow

# Filter errors only
gcloud logging read "resource.type=cloud_run_revision AND severity=ERROR" \
  --limit=20 \
  --format="table(timestamp, jsonPayload.message)"
```

### Performance Metrics
```bash
# CPU and memory usage
gcloud monitoring read \
  --filter 'metric.type=run.googleapis.com/request_count AND resource.service_name=exam-api-staging' \
  --format=table

# Request latency
gcloud monitoring read \
  --filter 'metric.type=run.googleapis.com/request_latencies AND resource.service_name=exam-api-staging' \
  --format=table
```

---

## 🔄 DEPLOYMENT UPDATES

### Update to New Image Version
```bash
# Build new image
docker build -f apps/api/Dockerfile.prod -t gcr.io/school-erp-dev/api:v1.0.1 .

# Push new image
docker push gcr.io/school-erp-dev/api:v1.0.1

# Deploy update (Cloud Run creates new revision automatically)
gcloud run deploy exam-api-staging \
  --image=gcr.io/school-erp-dev/api:v1.0.1 \
  --region=us-central1
```

### Update Environment Variables
```bash
# Single variable
gcloud run services update exam-api-staging \
  --update-env-vars LOG_LEVEL=debug \
  --region=us-central1

# Multiple variables
gcloud run services update exam-api-staging \
  --update-env-vars LOG_LEVEL=debug,DB_TIMEOUT=45 \
  --region=us-central1

# Remove variable
gcloud run services update exam-api-staging \
  --remove-env-vars OLD_VAR \
  --region=us-central1

# Verify changes
gcloud run services describe exam-api-staging --region=us-central1 | grep -A 10 "containers"
```

### Update Resource Limits
```bash
# Increase memory for high-load scenarios
gcloud run services update exam-api-staging \
  --memory=1Gi \
  --cpu=4 \
  --region=us-central1

# Restore default
gcloud run services update exam-api-staging \
  --memory=512Mi \
  --cpu=2 \
  --region=us-central1
```

### Scale Instances
```bash
# Increase min instances for always-on performance
gcloud run services update exam-api-staging \
  --min-instances=2 \
  --max-instances=20 \
  --region=us-central1

# Standard settings
gcloud run services update exam-api-staging \
  --min-instances=1 \
  --max-instances=10 \
  --region=us-central1
```

---

## 🔐 SECURITY & ACCESS CONTROL

### Manage Public Access
```bash
# Allow public (current setting for demo)
gcloud run services add-iam-policy-binding exam-api-staging \
  --member=allUsers \
  --role=roles/run.invoker \
  --region=us-central1

# Restrict to authenticated users (for production)
gcloud run services remove-iam-policy-binding exam-api-staging \
  --member=allUsers \
  --role=roles/run.invoker \
  --region=us-central1

# Allow specific service account
gcloud run services add-iam-policy-binding exam-api-staging \
  --member=serviceAccount:frontend-app@school-erp-dev.iam.gserviceaccount.com \
  --role=roles/run.invoker \
  --region=us-central1
```

### Add VPC Connector (For Private Backend)
```bash
# Create VPC connector
gcloud compute networks vpc-access connectors create vpc-connector-prod \
  --region=us-central1 \
  --subnet=default

# Update service to use VPC
gcloud run services update exam-api-staging \
  --vpc-connector=vpc-connector-prod \
  --region=us-central1
```

---

## 🔄 TRAFFIC MANAGEMENT

### Gradual Rollout (Canary Deployment)
```bash
# Deploy new version
gcloud run deploy exam-api-staging \
  --image=gcr.io/school-erp-dev/api:v1.0.1 \
  --no-traffic \
  --region=us-central1

# Get the new revision name
NEW_REVISION=$(gcloud run revisions list --service=exam-api-staging --format='value(name)' --limit=1)

# Send 10% traffic to new version
gcloud run services update-traffic exam-api-staging \
  --to-revisions $NEW_REVISION=10,LATEST=90 \
  --region=us-central1

# Monitor for 5 minutes...

# If good: increase to 50%
gcloud run services update-traffic exam-api-staging \
  --to-revisions $NEW_REVISION=50,LATEST=50 \
  --region=us-central1

# If still good: full rollout
gcloud run services update-traffic exam-api-staging \
  --to-revisions $NEW_REVISION=100 \
  --region=us-central1
```

### Blue-Green Deployment
```bash
# Keep running service as "blue"
# New version deployed as "green"

# Deploy as no-traffic initially
gcloud run deploy exam-api-staging-green \
  --image=gcr.io/school-erp-dev/api:v1.0.1 \
  --region=us-central1

# Test the green service

# Switch all traffic at once
gcloud run deploy exam-api-staging \
  --image=gcr.io/school-erp-dev/api:v1.0.1 \
  --region=us-central1
```

---

## 📊 OPTIMIZATION

### Reduce Cold Start Times
```bash
# Increase min instances
gcloud run services update exam-api-staging \
  --min-instances=2 \
  --region=us-central1

# This prevents instances from scaling to zero
# Cost consideration: ~$2-3/month per additional instance
```

### Optimize Memory Usage
```bash
# Monitor current usage
gcloud logging read "resource.type=cloud_run_revision AND resource.service_name=exam-api-staging" \
  --format="table(timestamp, labels.container_name, text_payload)" \
  --limit=20

# Reduce if heavily overprovisioned
gcloud run services update exam-api-staging \
  --memory=256Mi \
  --region=us-central1
```

### Enable VPC for Private Database Access
```bash
gcloud run services update exam-api-staging \
  --vpc-connector=projects/school-erp-dev/locations/us-central1/connectors/prod-vpc \
  --region=us-central1
```

---

## 🧪 TESTING & VALIDATION

### Load Testing
```bash
# Install Apache Bench (if not present)
# macOS: brew install httpd
# Linux: sudo apt install apache2-utils

# Run load test
ab -n 1000 -c 10 https://exam-api-staging-[ID].run.app/health

# Run with custom headers
ab -n 1000 -c 10 -H "Authorization: Bearer token" \
  https://exam-api-staging-[ID].run.app/api/v1/exams
```

### Smoke Tests
```bash
# Health check
curl -i https://exam-api-staging-[ID].run.app/health

# API endpoints
curl https://exam-api-staging-[ID].run.app/api/v1/exams?schoolId=test-1

# Frontend
curl -i https://exam-web-staging-[ID].run.app/
```

### End-to-End Test
```bash
# 1. Create exam
EXAM_ID=$(curl -X POST https://exam-api-staging-[ID].run.app/api/v1/exams \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Exam","schoolId":"test-1"}' \
  | jq -r '.data.id')

# 2. Retrieve exam
curl https://exam-api-staging-[ID].run.app/api/v1/exams/$EXAM_ID

# 3. Update exam
curl -X PUT https://exam-api-staging-[ID].run.app/api/v1/exams/$EXAM_ID \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Test Exam"}'

# 4. Delete exam
curl -X DELETE https://exam-api-staging-[ID].run.app/api/v1/exams/$EXAM_ID
```

---

## 📋 DAILY CHECKLIST

### Morning (9:00 AM)
- [ ] Check service health: `curl https://exam-api-staging-[ID].run.app/health`
- [ ] Review overnight logs: `gcloud run logs read exam-api-staging --limit=20`
- [ ] Verify error rate: `gcloud logging read "severity=ERROR"` (should be 0)
- [ ] Check instance count: Not scaling to zero unintentionally

### Afternoon (2:00 PM)
- [ ] Monitor demo load
- [ ] Watch error logs in real-time
- [ ] Be ready for immediate rollback if needed
- [ ] Team communication channel open

### Evening (5:00 PM)
- [ ] Summarize day's metrics
- [ ] Note any issues encountered
- [ ] Plan any required updates
- [ ] Document actions taken

---

## 🎯 SUCCESS METRICS

### Target SLOs
- **Availability:** 99.95%+ uptime
- **Error Rate:** <0.1% (< 1 error per 1000 requests)
- **P95 Latency:** <500ms
- **P99 Latency:** <2000ms
- **Cold Start:** <5s (if min instances > 0)

### Monitoring URLs
- **Cloud Run Dashboard:** https://console.cloud.google.com/run
- **Logs:** https://console.cloud.google.com/logs
- **Metrics:** https://console.cloud.google.com/monitoring

---

## 📞 ESCALATION CHAIN

1. **First Response:** Check logs, restart service
2. **Level 2:** Backend Engineer (possible code issue)
3. **Level 3:** Database Engineer (Firestore issue)
4. **Level 4:** Lead Architect (architectural decision needed)
5. **Critical:** Page on-call DevOps lead immediately

---

## 📝 NOTES FOR TEAM

- Staging environment is for demos and pre-release testing only
- Production deployment uses different project and stricter controls
- Always test updates on staging before deploying to production
- Keep rollback procedure documented and tested
- Monitor cost (Cloud Run charges per 100ms and vCPU-seconds)

---

**Document Owner:** DevOps Agent  
**Last Updated:** April 10, 2026  
**Next Review:** April 17, 2026  
**Status:** ACTIVE ✅
