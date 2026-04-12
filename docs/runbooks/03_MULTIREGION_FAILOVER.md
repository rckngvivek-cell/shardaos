# Operational Runbook: Multi-Region Failover Procedure

**Severity**: P0 | **Affected Users**: All in impacted region | **Estimated MTTR**: 10-15 minutes

## Automatic Failover vs. Manual Intervention

DeerFlow uses **automatic health-based failover** for:
- Individual Cloud Run instances becoming unhealthy
- Regional load balancer detecting backend failures

**Manual intervention required** for:
- Entire region outages (GCP infrastructure)
- Firestore replication lag issues
- Data consistency concerns

## Pre-Failover Checklist

### Is Auto-Failover Active?
```bash
# Check load balancer configuration
gcloud compute backend-services get-health deerflow-backend-primary-bs --region=asia-south1

# All backends showing UP?
# Sample output:
# instance: projects/PROJECT_ID/zones/asia-south1-a/instances/XXX
# healthStatus[]:
#   - ipAddress: 1.2.3.4
#     port: 8080
#     healthState: HEALTHY

# If showing DOWN for > 2 backends, need manual failover
```

## Scenario 1: Automatic Failover (No Action Needed)

### Indicator
- Cloud Run health checks continuously return UNHEALTHY
- Load balancer automatically removes backend from rotation
- Traffic shifts to healthy backends

### Monitor Automatic Failover
```bash
# Watch traffic shift
watch -n 5 'gcloud compute backend-services get-health \
  deerflow-backend-primary-bs --region=asia-south1 --format="table(instance, healthState)"'

# Monitor regional traffic distribution
gcloud monitoring time-series list \
  --filter 'resource.type="global" 
    AND metric.type="compute.googleapis.com/https/request_count"' \
  --format="table(metric.label.forwarding_rule_name,resource.label.region,points[0].value)"

# Alert resolves automatically when health restored
```

## Scenario 2: Manual Failover - Primary Region Down

### Step 1: Confirm Primary Region Failure (0-1 minute)
```bash
# Multiple layers of verification
echo "=== Testing Primary Region (Asia South) ==="
curl -w "\n%{http_code}\n" https://api-asia.deerflow.dev/health/ready

# Check GCP infrastructure status
gcloud compute regions describe asia-south1

# Are ALL backends unhealthy?
gcloud compute backend-services get-health deerflow-backend-primary-bs \
  --region=asia-south1 --format="table(instance,healthState)" | grep UNHEALTHY | wc -l

# If > 3 backends UNHEALTHY, proceed with failover
```

### Step 2: Verify Secondary Region Health (1-2 minutes)
```bash
echo "=== Testing Secondary Region (US Central) ==="
curl -w "\n%{http_code}\n" https://api-us.deerflow.dev/health/ready

gcloud compute backend-services get-health deerflow-backend-secondary-bs \
  --region=us-central1 --format="table(instance,healthState)"

# MUST see healthy backends before failover
# Expected: 3-5 backends showing HEALTHY
```

### Step 3: Update Load Balancer Route (2-4 minutes)
```bash
# Current configuration
gcloud compute url-maps describe deerflow-url-map

# Temporarily update default backend to secondary
gcloud compute url-maps update deerflow-url-map \
  --default-service=deerflow-backend-secondary-bs

# Verify update (may take 30-60 seconds to propagate)
sleep 30
curl https://api.deerflow.dev/health/ready

# Monitor request success
watch -n 5 'gcloud logging read "resource.type=cloud_run_revision 
  AND metric.response_code_class=5xx" --limit 5'
```

### Step 4: Verify Failover Success (4-6 minutes)
```bash
# Traffic should now flow through secondary region
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision" 
    AND resource.labels.service_name="deerflow-backend-secondary" 
    AND metric.type="run.googleapis.com/request_count"' \
  --format="table(points[0].value.int64_value)"

# Test critical endpoints
curl -H "Authorization: Bearer $TEST_TOKEN" \
  https://api.deerflow.dev/api/v1/parents/children

# Check latency from secondary
curl -w "Response time: %{time_total}s\n" \
  https://api.deerflow.dev/api/v1/health/ready
```

### Step 5: Verify Data Consistency (6-8 minutes)
```bash
# Check Firestore replication status
gcloud firestore databases describe --location=asia-south1 | grep "replication"

# Verify writes are replicating to secondary
# Query same document from both regions
gcloud firestore documents get schools/school_001 \
  --collection schools

# Cross-check write timestamp is same across regions
for region in asia-south1 us-central1; do
  echo "Region: $region"
  gcloud firestore documents get schools/school_001 \
    --collection schools \
    --database="(default)" | grep -i "timestamp\|updated"
done
```

## Scenario 3: Tertiary Region Promotion (if secondary also fails)

### Emergency Escalation
```bash
# Only if BOTH primary AND secondary regions fail
# Primary: asia-south1 ✗
# Secondary: us-central1 ✗
# Tertiary: europe-west1 (only option)

# Update load balancer IMMEDIATELY
gcloud compute url-maps update deerflow-url-map \
  --default-service=deerflow-backend-tertiary-bs

# Verify tertiary region is healthy
gcloud compute backend-services get-health deerflow-backend-tertiary-bs \
  --region=europe-west1

# This is EMERGENCY mode - tertiary is not designed for production
# Expected latency: Higher (300-500ms for Asia users)
# Expected cost: Higher (single region)
```

## During Failover: User-Facing Actions

### Communication to Users
```bash
# Update status page
# POST to https://status.deerflow.com/incidents

curl -X POST https://api.deerflow.dev/api/v1/announcements \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "title": "Service Degradation - Regional Maintenance",
    "body": "We are experiencing connectivity issues in some regions. Please refresh your browser.",
    "type": "system",
    "severity": "warning"
  }'

# Send SMS notification to high-value customers (if implemented)
curl -X POST https://api.deerflow.dev/api/v1/notifications/sms-bulk \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "recipient_tier": "premium",
    "message": "DeerFlow Service: Temporary latency increase from India. Investigating."
  }'
```

### Cache Invalidation
```bash
# Clear CDN cache to ensure fresh data
gcloud compute backend-services delete-signed-url-cache-invalidation \
  deerflow-backend-secondary-bs --region=us-central1

# Or full cache flush
gcloud compute url-maps delete deerflow-cache-policy
```

## Post-Failover: Restoration (8-15 minutes)

### Step 1: Investigate Primary Region Issue
```bash
# Collect diagnostics
gcloud logging read "resource.type=cloud_run_revision 
  AND resource.labels.service_name=deerflow-backend-primary 
  AND severity=ERROR" \
  --limit 100 > primary_errors.json

# Check GCP status
gcloud compute regions describe asia-south1

# Is it a localized issue or region-wide?
gcloud compute zones list --filter="region:asia-south1" --format="value(name.status)"
```

### Step 2: Remediation
```bash
# Option A: Restart all instances in primary
gcloud compute instances list --filter="zone:asia-south1*" --format="value(name,zone)" | \
  while read name zone; do
    gcloud compute instances stop $name --zone=$zone
    sleep 30
    gcloud compute instances start $name --zone=$zone
  done

# Option B: Redeploy Cloud Run service
gcloud run deploy deerflow-backend-primary \
  --region=asia-south1 \
  --image=gcr.io/PROJECT_ID/deerflow-backend:latest \
  --no-traffic

# Wait for new revision to spin up
sleep 60

# Test new revision
curl https://api.deerflow.dev/health/ready

# If healthy, restore traffic
gcloud run services update-traffic deerflow-backend-primary \
  --to-revisions LATEST=100 --region=asia-south1
```

### Step 3: Gradual Traffic Shift Back (optional)
```bash
# If concerned about stability, shift gradually
gcloud compute url-maps update deerflow-url-map \
  --default-service=deerflow-backend-primary-bs

# Monitor shortly after
watch -n 5 'gcloud monitoring time-series list \
  --filter "metric.type=run.googleapis.com/request_count" \
  --format="table(resource.labels.service_name,points[0].value)"'

# If errors spike, rollback to secondary
gcloud compute url-maps update deerflow-url-map \
  --default-service=deerflow-backend-secondary-bs
```

### Step 4: Verify Full Recovery
```bash
# All regions healthy again
for region in asia-south1 us-central1 europe-west1; do
  echo "=== Region: $region ==="
  gcloud compute backend-services get-health deerflow-backend-${region}-bs \
    --region=$region | grep -c HEALTHY
done

# Expected output: 3+ HEALTHY backends per region

# Latency metrics return to normal
gcloud monitoring time-series list \
  --filter 'metric.type="serviceruntime.googleapis.com/api/producer/total_latencies"' \
  --format="table(points[0].value.distribution_value)"
```

## Post-Incident Cleanup

### Document Incident
```bash
cat > failover_incident_YYYYMMDD.md << EOF
# Failover Incident Report - YYYYMMDD

## Cause
[Why primary region failed]
- GCP outage? Zone issue? Service crash?

## Response
- Detection time: [0-2 min]
- Failover time: [2-4 min]
- Total downtime: [X min]
- Users impacted: [X%]

## Prevention
1. Implement region health predictor
2. Reduce Firestore replication lag
3. Add cross-region backup for critical data
EOF
```

### Update Runbook
- Document any new findings
- Improve detection triggers

## Failover Metrics & SLOs

| Metric | Target | Actual |
|--------|--------|--------|
| MTTR (Mean Time To Recover) | < 15 min | ___ |
| Detection Time | < 2 min | ___ |
| Failover Time | < 4 min | ___ |
| Data Loss | 0 | ___ |
| User Impact | < 1% | ___ |

## Emergency Contacts

- **On-Call DevOps**: on-call@deerflow.dev
- **Infrastructure Lead**: infra-lead@deerflow.dev
- **VP Engineering**: vp-eng@deerflow.dev
- **Incident Commander**: incident-commander@deerflow.dev
- **War Room**: https://meet.google.com/deerflow-failover-war-room

## Related Procedures

- [High Latency Incident](01_HIGH_LATENCY_INCIDENT.md)
- [Payment Gateway Failure](02_PAYMENT_GATEWAY_FAILURE.md)
- [Data Corruption Recovery](03_DATA_CORRUPTION_RECOVERY.md)
