# DevOps Agent - Option A Execution Checklist
# Cloud Run Native Monitoring + Alerts + Auto-scaling
# Date: April 9, 2026, 6:45 PM
# Target Completion: 7:30 PM (45 minutes)

## PRE-FLIGHT CHECKS ✓

- [ ] GCP Project: school-erp-prod
- [ ] gcloud CLI installed and authenticated
- [ ] Kubectl configured for Cloud Run
- [ ] Docker images built and pushed: gcr.io/school-erp-prod/api:latest
- [ ] Service account school-erp-api-sa created with permissions
- [ ] Firestore database initialized
- [ ] Cloud CDN enabled on load balancer
- [ ] CloudArmor security policies in place

## STEP 1: DASHBOARDS (15 minutes) - ETA: 7:00 PM

### 1.1 API Metrics Dashboard
- [ ] Verify api-dashboard.json formatted correctly
- Command: `gcloud monitoring dashboards create --config-from-file=infrastructure/monitoring/dashboards/api-dashboard.json`
- Validates: Request latency (p50, p95, p99), error rate, throughput, CPU/memory usage
- Status: [ ] CREATED

### 1.2 Infrastructure Dashboard
- [ ] Verify infrastructure-dashboard.json formatted correctly
- Command: `gcloud monitoring dashboards create --config-from-file=infrastructure/monitoring/dashboards/infrastructure-dashboard.json`
- Validates: Instance count, response times by region, database connections, storage, network
- Status: [ ] CREATED

### 1.3 Business Dashboard
- [ ] Verify business-dashboard.json formatted correctly
- Command: `gcloud monitoring dashboards create --config-from-file=infrastructure/monitoring/dashboards/business-dashboard.json`
- Validates: Active users, reports generated, revenue, NPS, schools
- Status: [ ] CREATED

### 1.4 Dashboard Verification
- [ ] Open Cloud Monitoring console
- [ ] Confirm all 3 dashboards visible
- [ ] Check data flowing (may take 1-2 minutes for new deployments)
- Status: [ ] VERIFIED

---

## STEP 2: ALERT POLICIES (15 minutes) - ETA: 7:15 PM

### 2.1 Alert 1: High Error Rate
- [ ] alert-high-error-rate.yaml validated
- Condition: error_rate > 0.001 (0.1%)
- Duration: 5 minutes
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-high-error-rate.yaml`

### 2.2 Alert 2: High Latency
- [ ] alert-high-latency.yaml validated
- Condition: p95_latency > 400ms
- Duration: 5 minutes
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-high-latency.yaml`

### 2.3 Alert 3: Low Uptime
- [ ] alert-low-uptime.yaml validated
- Condition: uptime < 99.9%
- Duration: Immediate
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-low-uptime.yaml`

### 2.4 Alert 4: CPU High
- [ ] alert-cpu-high.yaml validated
- Condition: cpu_usage > 80%
- Duration: 2 minutes
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-cpu-high.yaml`

### 2.5 Alert 5: Memory High
- [ ] alert-memory-high.yaml validated
- Condition: memory_usage > 85%
- Duration: 3 minutes
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-memory-high.yaml`

### 2.6 Alert 6: Database Latency
- [ ] alert-database-latency.yaml validated
- Condition: db_latency > 200ms
- Duration: 5 minutes
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-database-latency.yaml`

### 2.7 Alert 7: DDoS Attack
- [ ] alert-ddos-attack.yaml validated
- Condition: blocked_requests > 100/min
- Duration: 1 minute
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-ddos-attack.yaml`

### 2.8 Alert 8: Deployment Failure
- [ ] alert-deployment-failure.yaml validated
- Condition: deployment status = FAILED
- Duration: Immediate
- Status: [ ] DEPLOYED
- Command: `gcloud alpha monitoring policies create --config-from-file=infrastructure/monitoring/alert-policies/alert-deployment-failure.yaml`

### 2.9 Alert Verification
- [ ] List all alert policies: `gcloud alpha monitoring policies list`
- [ ] Confirm 8 policies enabled
- Status: [ ] VERIFIED

---

## STEP 3: AUTO-SCALING CONFIGURATION (10 minutes) - ETA: 7:25 PM

### 3.1 Deploy to us-central1
- [ ] Service image verified: gcr.io/school-erp-prod/api:latest
- Min instances: 2
- Max instances: 50
- Memory: 2Gi
- CPU: 2
- Concurrency: 100
- Status: [ ] DEPLOYED
- Command: `gcloud run deploy school-erp-api --image gcr.io/school-erp-prod/api:latest --region us-central1 --min-instances 2 --max-instances 50 --memory 2Gi --cpu 2 --concurrency 100`

### 3.2 Deploy to asia-south1
- [ ] Service image verified
- Min instances: 3 (higher for primary region)
- Max instances: 30
- Status: [ ] DEPLOYED

### 3.3 Deploy to europe-west1
- [ ] Service image verified
- Min instances: 1
- Max instances: 20
- Status: [ ] DEPLOYED

### 3.4 Verify Auto-scaling Active
- [ ] Run: `gcloud run services describe school-erp-api --region us-central1`
- [ ] Confirm min/max instances in output
- Status: [ ] VERIFIED

---

## STEP 4: TEST HEALTH CHECKS (5 minutes) - ETA: 7:30 PM

### 4.1 Health Endpoint Testing
- [ ] Get service URL: `gcloud run services describe school-erp-api --region us-central1 --format='value(status.url)'`
- [ ] Test health endpoint: `curl https://api.schoolerp.io/health`
- Expected: HTTP 200 OK with {"status": "ok"}
- Status: [ ] PASSING

### 4.2 Verify Metrics Collection
- [ ] List request count metrics: `gcloud monitoring time-series list --filter='metric.type="run.googleapis.com/request_count"'`
- [ ] Data flowing: YES / NO
- Status: [ ] VERIFIED

---

## STEP 5: ON-CALL ROTATION SETUP (5 minutes)

### 5.1 Slack Integration
- [ ] Slack webhook URL configured
- [ ] #alerts channel set up
- [ ] Test message sent
- Status: [ ] ACTIVE

### 5.2 PagerDuty Integration
- [ ] PagerDuty API key configured
- [ ] Escalation policy created
- [ ] On-call schedule set
- Status: [ ] ACTIVE

### 5.3 Notification Channels
- [ ] Level 1: Slack #alerts
- [ ] Level 2: PagerDuty
- [ ] Level 3: SMS alerts
- Status: [ ] CONFIGURED

---

## STEP 6: VERIFY ALL DASHBOARDS LIVE (3 minutes)

### 6.1 Dashboard 1: API Metrics
- [ ] Navigate to dashboard
- [ ] Verify data rendering
- [ ] Check last updated time
- Status: [ ] LIVE

### 6.2 Dashboard 2: Infrastructure
- [ ] Navigate to dashboard
- [ ] Verify instance count showing
- [ ] Check regional data
- Status: [ ] LIVE

### 6.3 Dashboard 3: Business Metrics
- [ ] Navigate to dashboard
- [ ] Verify active users count
- [ ] Check revenue metrics
- Status: [ ] LIVE

---

## STEP 7: CREATE RUNBOOK (2 minutes)

- [ ] Incident response runbook created: /ops/incident-response-cloud-run.md
- [ ] 8 incident scenarios documented
- [ ] Escalation chain defined
- Status: [ ] COMPLETE

---

## POST-DEPLOYMENT VERIFICATION

### Metrics to Monitor (Next 24 hours)

- [ ] Request latency baseline established
- [ ] Error rate stable (<0.01%)
- [ ] Auto-scaling triggered at least once
- [ ] All alerts firing correctly when tested
- [ ] No false positives detected
- [ ] Slack notifications arriving in real-time

### Load Testing (Friday)

- [ ] k6 script prepared: k6/load-test-2000-users.js
- [ ] Test 2,000 concurrent users
- [ ] Verify auto-scaling to 50 instances
- [ ] Confirm error rate remains <0.05%
- [ ] Validate latency maintains <400ms p95

---

## SIGN-OFF

**DevOps Agent Status:** 🟢 LIVE  
**Timestamp Started:** April 9, 2026, 6:45 PM  
**Timestamp Complete:** April 9, 2026, 7:30 PM (Target)  
**Actual Completion:** [TIME]  

**Signed by:** DevOps Agent  
**Approved by:** Lead Architect  
**Next Review:** April 10, 2026, 10:00 AM  

---

## NOTES

- Custom metrics (active_users, revenue_transactions, etc.) need backend implementation
- Health check endpoint must respond in <50ms
- Firestore connection timeout should be <200ms
- Consider enabling multi-region failover after Friday load test
- Monitor for cold start latency on first traffic spike
