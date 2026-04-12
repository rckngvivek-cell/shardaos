# Operational Runbook: High Latency Incident Response

**Severity**: P1 | **Affected Users**: All | **Estimated MTTR**: 15 minutes

## Incident Detection

- **Alert**: "P0: High Request Latency (P99 > 500ms)"
- **Threshold Triggered**: P99 latency exceeded 500ms for > 5 minutes
- **Notification Channels**: Email, Slack (#devops-alerts)

## Initial Assessment (0-2 minutes)

### Step 1: Verify the Alert
```bash
# SSH into primary region
gcloud compute ssh ops-jumphost-primary --zone=asia-south1-b

# Check Cloud Run metrics
gcloud run services describe deerflow-backend-primary --region=asia-south1

# Verify latency spike
gcloud logging read "resource.type=cloud_run_revision AND 
  resource.labels.service_name=deerflow-backend-primary" \
  --limit 50 --format="table(timestamp,severity,jsonPayload.duration_ms)"
```

### Step 2: Check Service Health
```bash
# Health check endpoint
curl -w "\nResponse Time: %{time_total}s\n" \
  https://api.deerflow.dev/health/ready

# Check all regions
for region in asia-south1 us-central1 europe-west1; do
  echo "Checking $region..."
  gcloud run services describe deerflow-backend-${region} --region=$region
done
```

## Root Cause Analysis (2-5 minutes)

### Database Query Performance
```bash
# Check Firestore read/write latencies
gcloud firestore databases describe --location=asia-south1

# Analyze slow queries
gcloud logging read "resource.type=cloud_run_revision 
  AND jsonPayload.duration_ms > 1000" \
  --limit 100 --format=json | jq '.[] | {query: .jsonPayload.query, duration: .jsonPayload.duration_ms}'
```

### Memory/CPU Constraints
```bash
# Check instance utilization
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision" AND 
    resource.labels.service_name="deerflow-backend-primary" AND 
    metric.type="run.googleapis.com/instance_cpu_utilization"' \
  --format="table(points[0].value.double_value)"

# Memory utilization
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision" AND 
    metric.type="run.googleapis.com/instance_memory_utilization"' \
  --format="table(points[0].value.double_value)"
```

### Network Issues
```bash
# Check load balancer health checks
gcloud compute backend-services get-health deerflow-backend-primary-bs \
  --region=asia-south1

# Network latency
ping -c 10 firestore.googleapis.com | tail -1
```

## Mitigation Steps (5-10 minutes)

### Option 1: Scale Up Instances (Most Common)
```bash
# Increase max instances for primary region
gcloud run services update deerflow-backend-primary \
  --region=asia-south1 \
  --max-instances=300 \
  --min-instances=10

# Verify scaling
gcloud run services describe deerflow-backend-primary \
  --region=asia-south1 --format='value(spec.template.spec.containerConcurrency)'
```

### Option 2: Optimize Database Indexes
```bash
# If slow queries detected on specific collections
# Add index for frequently slow queries
gcloud firestore indexes composite create \
  --collection=students \
  --field-name=schoolId:ASCENDING \
  --field-name=createdAt:DESCENDING

# Monitor index creation
gcloud firestore indexes list --locations=asia-south1
```

### Option 3: Restart Service (if stuck/hung processes)
```bash
# Create new revision without traffic
gcloud run deploy deerflow-backend-primary \
  --region=asia-south1 \
  --image=gcr.io/PROJECT_ID/deerflow-backend:latest \
  --no-traffic

# Monitor new revision
gcloud run revisions list --region=asia-south1 \
  --service=deerflow-backend-primary

# Migrate traffic after verification
gcloud run services update-traffic deerflow-backend-primary \
  --to-revisions LATEST=100 \
  --region=asia-south1
```

### Option 4: Geo-Failover (if primary unhealthy)
```bash
# Route traffic to secondary region
gcloud compute url-maps describe deerflow-url-map | grep -A 20 "path_matcher:"

# Update URL map to fail over
gcloud compute url-maps update deerflow-url-map \
  --default-service deerflow-backend-secondary-bs

# Monitor failover traffic
watch -n 5 'gcloud monitoring time-series list \
  --filter "resource.labels.service_name=deerflow-backend-secondary"'
```

## Verification (10-12 minutes)

### Monitor Recovery
```bash
# Watch latency metrics return to normal
while true; do
  echo "$(date): $(curl -w '%{time_total}\n' -o /dev/null -s https://api.deerflow.dev/health/ready)"
  sleep 10
done

# Track in Cloud Monitoring
gcloud monitoring time-series list \
  --filter 'resource.type="cloud_run_revision" AND 
    metric.type="serviceruntime.googleapis.com/api/producer/total_latencies"' \
  --format="table(points[0].value.distribution_value.mean)"
```

### Error Rate Check
```bash
# Verify error rate remains < 1%
gcloud logging read "resource.type=cloud_run_revision 
  AND severity=ERROR" \
  --limit 100 \
  --format="table(timestamp,severity,jsonPayload.message)"
```

### Load Balancer Health
```bash
# All backends healthy
gcloud compute backend-services get-health deerflow-backend-primary-bs \
  --region=asia-south1 --format='table(instance, healthStatus)'
```

## Post-Incident Actions (12-15 minutes)

### Create Incident Report
```bash
# Document findings
cat > incident_YYYYMMDD_latency.md << EOF
# Incident Report: High Latency - YYYYMMDD

## Timeline
- 14:30 UTC: Alert triggered
- 14:32 UTC: Investigation began
- 14:35 UTC: Root cause identified [DATABASE/CPU/MEMORY]
- 14:38 UTC: Mitigation applied
- 14:42 UTC: Service recovered

## Root Cause
[Provide detailed analysis]

## Resolution
[Describe fix applied]

## Prevention
[Future mitigation strategies]
EOF
```

### Update Runbook
- Document any new findings or procedures
- Update alert thresholds if needed

### Capacity Planning
- If caused by high load: Request additional instances
- If caused by inefficient queries: Schedule optimization
- If infrastructure issue: File with cloud provider

## Escalation Path

1. **On-Call DevOps**: Initial investigation & mitigation
2. **Senior DevOps (if unresolved in 5 min)**: Senior review
3. **Architecture Lead (if unresolved in 10 min)**: Design issues
4. **VP Engineering (if extended outage)**: Business impact

## Contact Information

- **On-Call**: `on-call@deerflow.dev`
- **Slack Channel**: `#deerflow-incidents`
- **War Room**: `https://meet.google.com/deerflow-war-room`
- **Incident Commander**: TBD
