# Runbook: Data Pipeline Operations & Troubleshooting

**Goal:** Monitor and troubleshoot Pub/Sub and BigQuery pipeline  
**Owner:** Data Agent / DevOps Agent  
**Last Updated:** April 10, 2026

## Revision History

| Version | Date | Author | Change |
|---------|------|--------|--------|
| 1.0 | 2026-04-10 | Documentation Agent | Phase 2 data pipeline operations |

---

## Architecture Overview

```
Exam API (Cloud Run)
        │
        ├──► Create Exam ──► Pub/Sub: exam-submissions-topic
        ├──► Submit Exam ──► Pub/Sub: exam-submissions-topic
        ├──► Grade Exam ──► Pub/Sub: exam-results-topic
        │
        └──► BigQuery (via Dataflow)
                 ├─ exam_submissions table
                 ├─ student_performance table
                 ├─ exam_analytics table
                 └─ question_effectiveness table
```

---

## What to Monitor

### 1. Pub/Sub Message Lag

**Healthy Status:**
- Unacked message lag: <1,000
- Acked messages/sec: >10 (during peak), >1 (steady state)
- Push delivery latency: <100ms

**Check Lag:**
```bash
# Set project
export GCP_PROJECT_ID=school-erp-staging

# List subscriptions
gcloud pubsub subscriptions list

# Check specific subscription
gcloud pubsub subscriptions describe exam-submissions-subscription \
  --format='value(pushConfig.pushEndpoint, expirationPolicy, deadLetterPolicy)'

# Get detailed stats (requires Python script)
python3 - << 'EOF'
from google.cloud import pubsub_v1
import json

publisher = pubsub_v1.PublisherClient()
topic_path = publisher.topic_path('school-erp-staging', 'exam-submissions-topic')

# Get topic stats
futures = []
for i in range(10):
    data = f'{{"test": {i}}}'.encode('utf-8')
    futures.append(publisher.publish(topic_path, data))

print(f"Published {len(futures)} test messages")
for future in futures:
    message_id = future.result()
    print(f"Message ID: {message_id}")
EOF
```

**View in Cloud Console:**
1. Go to Pub/Sub > Subscriptions
2. Click `exam-submissions-subscription`
3. Check "Oldest unacked message age"

### 2. Dataflow Job Status

**Healthy Status:**
- Job state: RUNNING
- Elements added: >100/minute during peak
- Elements output: >100/minute (same as added)
- Autoscaling workers: 2-4 (depends on volume)

**Check Job Status:**
```bash
# List all Dataflow jobs
gcloud dataflow jobs list --location=asia-south1

# Expected output:
# NAME                                    TYPE       STATE   CREATED
# exam-events-transform-2026-04-10-xyz    STREAMING  RUNNING 2 days ago
# exam-results-aggregate-2026-04-10-abc   STREAMING  RUNNING 2 days ago

# Get detailed job info
JOB_ID=exam-events-transform-2026-04-10-xyz
gcloud dataflow jobs describe ${JOB_ID} --location=asia-south1 --format=json

# Watch job metrics
watch -n 5 "gcloud dataflow jobs describe ${JOB_ID} --location=asia-south1 --format=value(currentWorkerCount,pipelineDescription)"
```

### 3. BigQuery Load Status

**Healthy Status:**
- Table sizes: exam_submissions >50GB (if healthy)
- Daily load errors: 0
- Load latency: <5 minutes from Pub/Sub
- Partition coverage: 100% (no gaps)

**Check BigQuery Tables:**
```bash
# List datasets
bq ls -d --project_id=school-erp-staging

# List tables in dataset
bq ls --project_id=school-erp-staging school_erp_staging

# Get table size (GB)
bq show --format=json school_erp_staging.exam_submissions | jq '.numBytes / 1024 / 1024 / 1024'

# Count rows in table
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) as row_count FROM \`school-erp-staging.school_erp_staging.exam_submissions\`"

# Check most recent records
bq query --use_legacy_sql=false \
  "SELECT * FROM \`school-erp-staging.school_erp_staging.exam_submissions\` ORDER BY submission_time DESC LIMIT 10"
```

---

## Common Issues & Resolution

### Issue 1: Pub/Sub Message Backlog Growing

**Symptoms:**
- Oldest unacked message age: >1 hour
- Backlog size: >10,000 messages
- API logs show: "Failed to publish message" errors

**Root Cause Analysis:**
```bash
# Check if Dataflow job is stuck
gcloud dataflow jobs list --filter="STATE:STOPPED" --location=asia-south1

# Check job logs
gcloud logging read "resource.type=cloud_dataflow_step AND \
  resource.labels.job_id='exam-events-transform-2026-04-10-xyz'" \
  --limit=50 --format=json | grep -i "error"

# Check if subscription is pulling messages
gcloud pubsub subscriptions pull exam-submissions-subscription --limit=10 --format=json
```

**Resolution A: Restart Subscription**
```bash
# Update push endpoint (restart delivery)
gcloud pubsub subscriptions update exam-submissions-subscription \
  --push-endpoint="https://dataflow.googleapis.com/" \
  --push-auth-service-account=dataflow@school-erp-staging.iam.gserviceaccount.com

# Wait 2 minutes for messages to drain

# Verify backlog cleared
watch -n 5 "gcloud pubsub subscriptions describe exam-submissions-subscription --format='value(expirationPolicy)'"
```

**Resolution B: Increase Dataflow Workers**
```bash
# Get current job details
JOB_ID=exam-events-transform-2026-04-10-xyz
gcloud dataflow jobs describe ${JOB_ID} --location=asia-south1 --format=json | grep -A 5 "workerPool"

# Update max workers (auto-auth required)
gcloud dataflow jobs update ${JOB_ID} \
  --max-workers=10 \
  --location=asia-south1

# If job still stuck, drain and restart
gcloud dataflow jobs drain ${JOB_ID} --location=asia-south1

# Wait for graceful shutdown (5-10 minutes)
gcloud dataflow jobs describe ${JOB_ID} --location=asia-south1 --filter="STATE:DRAINED"

# Restart job with new template
gcloud dataflow jobs create exam-events-transform-restart-$(date +%s) \
  --gcs-location=gs://school-erp-staging-dataflow/templates/exam-transform \
  --region=asia-south1 \
  --service-account-email=dataflow@school-erp-staging.iam.gserviceaccount.com
```

**Resolution C: Replay Messages from Dead Letter Queue**
```bash
# If Dataflow is completely down, drain DLQ to Pub/Sub
DEAD_LETTER_SUB=exam-submissions-dlq

# Get messages from DLQ
bq query --use_legacy_sql=false \
  "SELECT message_id, publish_time, message_data FROM \`school-erp-staging.pubsub_exports.exam_submissions_dlq\` \
   WHERE publish_time > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)"

# Manually republish to exam-submissions-topic
gcloud pubsub topics publish exam-submissions-topic \
  --message="<json_message_data>"
```

---

### Issue 2: BigQuery Schema Mismatch

**Symptoms:**
- Load errors in Dataflow logs: "INVALID_SCHEMA"
- New fields appear in API but not in BigQuery
- Dashboard queries fail: "Field not found"

**Root Cause Analysis:**
```bash
# Compare schema in Dataflow config vs BigQuery table
JOB_ID=exam-events-transform-2026-04-10-xyz

# Current table schema
bq show --schema --format=json school_erp_staging.exam_submissions | jq '.[] | {name, type}'

# Expected schema (from API)
grep -A 20 "exam_submissions" apps/api/src/data/bigquery-schema.ts
```

**Resolution: Add Missing Field to BigQuery**
```bash
# Backup existing data
bq extract school_erp_staging.exam_submissions \
  gs://school-erp-staging/backups/exam_submissions_$(date +%s).json

# Alter table schema
bq update school_erp_staging.exam_submissions \
  --schema="field1:STRING,field2:INTEGER,new_field:STRING"

# OR use schema file
bq update school_erp_staging.exam_submissions \
  --schema_update_options=ALLOW_NULL_FIELD_ADDITION \
  --schema="exam_submission_schema.json"

# Verify schema updated
bq show school_erp_staging.exam_submissions
```

---

### Issue 3: Pub/Sub Topics Not Created

**Symptoms:**
- API startup: "⚠️ Pub/Sub topics initialization skipped"
- Publishing fails: "Topic not found"
- Dataflow has no data: "No subscription to read from"

**Root Cause Analysis:**
```bash
# Check if topics exist
gcloud pubsub topics list

# Check if service account has permission to create topics
gcloud projects get-iam-policy school-erp-staging \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:*"
```

**Resolution: Create Topics Manually**
```bash
# Create exam submissions topic
gcloud pubsub topics create exam-submissions-topic \
  --message-retention-duration=7d \
  --enable-message-ordering=false

# Create exam results topic
gcloud pubsub topics create exam-results-topic \
  --message-retention-duration=7d

# Create subscriptions for Dataflow
gcloud pubsub subscriptions create exam-submissions-subscription \
  --topic=exam-submissions-topic \
  --push-endpoint=https://dataflow.googleapis.com/ \
  --push-auth-service-account=dataflow@school-erp-staging.iam.gserviceaccount.com

# Create dead letter queue
gcloud pubsub subscriptions create exam-submissions-dlq \
  --topic=exam-submissions-topic \
  --dead-letter-topic=exam-submissions-dlq-topic
```

---

### Issue 4: BigQuery Quota Exceeded

**Symptoms:**
- Dataflow logs: "QUOTA_EXCEEDED: Quota exceeded for quota metric"
- BigQuery dashboard: "503 Service Unavailable"
- Load errors: "Cannot create table, quota exceeded"

**Root Cause Analysis:**
```bash
# Check quota usage
bq show --format=json | grep -i quota

# Check table count
bq ls school_erp_staging | wc -l

# Check dataset size
bq show --format=json school_erp_staging | jq '.location, .creationTime'
```

**Resolution: Request Quota Increase**
```bash
# Option 1: Optimize existing tables (delete old partitions)
bq query --use_legacy_sql=false \
  "DELETE FROM \`school-erp-staging.school_erp_staging.exam_submissions\` \
   WHERE submission_time < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)"

# Option 2: Request quota increase in GCP Console
# 1. Go to: APIs & Services > Quotas
# 2. Filter by "BigQuery"
# 3. Select quota (Table creation, Daily storage, etc.)
# 4. Click "Edit Quotas"
# 5. Request increase (usually approved in 24 hours)

# Option 3: Archive old data to Cloud Storage
bq extract school_erp_staging.exam_submissions \
  gs://school-erp-staging/archive/exam-submissions-2026-01.json \
  --compression=GZIP

# Delete after archiving
bq rm school_erp_staging.exam_submissions_backup
```

---

### Issue 5: Cloud Logging Not Capturing Events

**Symptoms:**
- Audit trail gaps: Missing exam submissions
- Logs not appearing: "Log entry not found"
- API continues working but no trace

**Root Cause Analysis:**
```bash
# Check if Cloud Logging is enabled
gcloud logging sinks list

# Check if service account has logging permissions
gcloud projects get-iam-policy school-erp-staging \
  --flatten="bindings[].members" \
  --filter="bindings.roles:logging.logWriter"

# Check logs directly
gcloud logging read "resource.type=cloud_run_revision" \
  --limit=10 --format=json
```

**Resolution: Re-enable Cloud Logging**
```bash
# Create logging sink if missing
gcloud logging sinks create exam-api-logs \
  logging.googleapis.com/projects/school-erp-staging/logs/exam-api \
  --log-filter='resource.type=cloud_run_revision AND resource.labels.service_name=exam-api-v2'

# Grant permissions
gcloud projects add-iam-policy-binding school-erp-staging \
  --member=serviceAccount:exam-api@school-erp-staging.iam.gserviceaccount.com \
  --role=roles/logging.logWriter

# Restart Cloud Run service to re-establish logging
gcloud run deploy exam-api-v2 \
  --image=asia.gcr.io/school-erp-staging/exam-api-v2:latest \
  --region=asia-south1 \
  --no-traffic
```

---

## Monitoring Dashboard

**Create dashboard in Cloud Console:**
```bash
# Using gcloud CLI
gcloud monitoring dashboards create --config-from-file=- << 'EOF'
{
  "displayName": "Exam Data Pipeline",
  "dashboardFilters": [],
  "gridLayout": {
    "widgets": [
      {
        "title": "Pub/Sub Unacked Message Age (minutes)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"pubsub.googleapis.com/subscription/oldest_unacked_message_age\" resource.type=\"pubsub_subscription\"",
                "aggregation": {"alignmentPeriod": "60s"}
              }
            }
          }]
        }
      },
      {
        "title": "Dataflow Job Elements Output",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "metric.type=\"dataflow.googleapis.com/job/element_count\" resource.type=\"dataflow_job\"",
                "aggregation": {"alignmentPeriod": "60s"}
              }
            }
          }]
        }
      }
    ]
  }
}
EOF
```

---

## Performance Baselines

### Expected Metrics

| Metric | Development | Staging | Production |
|--------|-------------|---------|------------|
| Pub/Sub Lag | N/A | <100 messages | <50 messages |
| Message Publish Latency | N/A | <50ms p99 | <100ms p99 |
| Dataflow Job Latency | N/A | <5 min | <5 min |
| BigQuery Load Latency | N/A | <10 min | <10 min |
| Records/sec | N/A | 10-50 | 100-500 |

---

## Daily Checklist

```bash
# Run daily
TIMESTAMP=$(date +%Y-%m-%d)

# 1. Check Pub/Sub lag
echo "=== Pub/Sub Status ===" 
gcloud pubsub subscriptions describe exam-submissions-subscription \
  --format='value(pushConfig.pushEndpoint)' > /dev/null && echo "✅ Subscription active"

# 2. Check Dataflow jobs
echo "=== Dataflow Jobs ==="
gcloud dataflow jobs list --filter="STATE:RUNNING" --location=asia-south1 | head -5

# 3. Check BigQuery row count
echo "=== BigQuery Tables ==="
bq query --use_legacy_sql=false \
  "SELECT COUNT(*) as exam_submissions FROM \`school-erp-staging.school_erp_staging.exam_submissions\` WHERE DATE(submission_time) = CURRENT_DATE()" --format=sparse

# 4. Check for errors in logs
echo "=== Errors (past hour) ==="
gcloud logging read "severity>=ERROR AND resource.type=cloud_run_revision AND resource.labels.service_name=exam-api-v2 AND timestamp>=\"$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S)Z\"" --limit=10 --format=short
```

---

## Quick Reference Commands

```bash
# Pub/Sub
gcloud pubsub topics list
gcloud pubsub subscriptions list
gcloud pubsub subscriptions describe exam-submissions-subscription
gcloud pubsub topics publish exam-submissions-topic --message='{"test": 1}'

# Dataflow
gcloud dataflow jobs list --location=asia-south1
gcloud dataflow jobs describe <JOB_ID> --location=asia-south1
gcloud dataflow jobs drain <JOB_ID> --location=asia-south1

# BigQuery
bq ls
bq show school_erp_staging.exam_submissions
bq query --use_legacy_sql=false "SELECT COUNT(*) FROM \`school-erp-staging.school_erp_staging.exam_submissions\`"

# Cloud Logging
gcloud logging read "resource.type=cloud_run_revision" --limit=50
gcloud logging read "severity>=ERROR" --limit=50
```

---

## Related Documentation

- **[ADR-DATA-PIPELINE-STRATEGY.md](../adr/ADR-DATA-PIPELINE-STRATEGY.md)** - Pipeline architecture decision
- **[STAGING_DEPLOYMENT_RUNBOOK.md](./STAGING_DEPLOYMENT_RUNBOOK.md)** - Deploy Phase 2 API
- **[INCIDENT_RESPONSE.md](./INCIDENT_RESPONSE.md)** - P1 incident procedures
- **[24_DATA_PLATFORM.md](../../24_DATA_PLATFORM.md)** - Data platform design

---

## Escalation

**Data pipeline issues?**
- Slack: #data-pipeline-support
- On-call: @data-agent (week 1-2), @devops-agent (week 3-4)
- Email: data-ops@school-erp.io
