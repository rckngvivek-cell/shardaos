# Exam Module Data Pipeline - Complete Setup Guide

**Status:** Ready for Deployment  
**Version:** 1.0.0  
**Last Updated:** April 10, 2026  

## Overview

This document provides the complete setup and deployment guide for the School ERP exam module's BigQuery + Pub/Sub data pipeline. The pipeline enables real-time integration of exam events (creation, submissions, results) from the API into BigQuery for analytics and reporting.

## Architecture

```
┌─────────────────────────┐
│   School ERP API        │
│  (exams/submissions/    │
│   results endpoints)    │
└────────────┬────────────┘
             │
             ├──> Firestore (Transactional)
             │
             └──> Pub/Sub publish
                  ├─ exam-submissions-topic
                  └─ exam-results-topic
                       │
                       ├─> Dataflow Pipeline
                       │   └─> Transform & Aggregate
                       │
                       └──> BigQuery
                           ├─ exams_log
                           ├─ submissions_log
                           └─ results_log
                                 │
                                 └──> Analytics & Dashboards
```

## Component Status

### ✅ Completed

- [x] PubSub service implementation (`src/services/pubsub-service.ts`)
- [x] Integration with exam/submission/results routes
- [x] BigQuery schema generation (`scripts/setup-bigquery.ts`)
- [x] Cloud Logging configuration (`src/services/cloud-logging.ts`)
- [x] Dataflow pipeline configuration (`scripts/setup-dataflow.ts`)
- [x] GCP infrastructure setup script (`scripts/setup-gcp-infrastructure.sh`)
- [x] End-to-end verification script (`scripts/verify-pipeline.ts`)
- [x] npm scripts for automation

### 📋 To Be Done

1. Run `setup-gcp` to create infrastructure
2. Build and deploy API
3. Deploy Dataflow pipeline
4. Run end-to-end tests
5. Monitor in production

## Prerequisites

### System Requirements

- **Node.js** >= 16.x
- **TypeScript** >= 5.0
- **gcloud CLI** >= latest
- **BigQuery CLI** (`bq`)
- **Bash** shell
- **GCP Project:** `school-erp-dev` (staging) or `school-erp` (prod)

### GCP Permissions

Your service account (`school-erp-sa`) needs:

- `bigquery.admin` - Create datasets/tables
- `pubsub.admin` - Create topics/subscriptions
- `dataflow.admin` - Deploy pipelines
- `logging.admin` - Configure logging
- `resourcemanager.organizationAdmin` - Enable APIs

### Authentication

```bash
# Login to GCP
gcloud auth login

# Set default project
gcloud config set project school-erp-dev

# Create and download service account key (if needed)
gcloud iam service-accounts keys create key.json \
  --iam-account=school-erp-sa@school-erp-dev.iam.gserviceaccount.com

# Set credential environment variable
export GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/key.json
```

## Step-by-Step Setup

### Step 1: Install Dependencies

```bash
cd apps/api
npm install

# Verify installations
npm run lint
npm run typecheck
```

### Step 2: Setup GCP Infrastructure

This creates BigQuery dataset, Pub/Sub topics, and configures Cloud Logging.

```bash
bash scripts/setup-gcp-infrastructure.sh
```

**What it does:**
- ✓ Creates `school_erp` BigQuery dataset
- ✓ Creates 3 BigQuery tables (exams_log, submissions_log, results_log)
- ✓ Creates 3 Pub/Sub topics
- ✓ Creates subscriptions for testing
- ✓ Exports configuration to `.env.gcp-pipeline`

### Step 3: Setup BigQuery Tables (Alternative)

If the infrastructure script doesn't fully complete:

```bash
npm run setup-bigquery
```

**Output:**
```
✓ Dataset created: school_erp
✓ Table created: school_erp.exams_log
✓ Table created: school_erp.submissions_log
✓ Table created: school_erp.results_log
```

### Step 4: Build API

```bash
npm run build

# Verify build
ls dist/index.js
```

### Step 5: Verify Pipeline Infrastructure

Before starting the server, verify all components are ready:

```bash
npm run verify-pipeline
```

This will:
- ✓ Test Pub/Sub connection
- ✓ Test BigQuery connection
- ✓ Test Cloud Logging connection
- ✓ Publish 3 test messages
- ✓ Generate verification report: `TABLES_VERIFIED.md`

**Expected Output:**
```
✓ Connected to Pub/Sub. Found 5 topics
✓ Connected to BigQuery. Dataset school_erp exists
✓ Connected to Cloud Logging. Found 10 recent entries
✓ Topic found: exam-submissions-topic
✓ Topic found: exam-results-topic
✓ Topic found: exam-pipeline-deadletter
✓ Table found: exams_log
✓ Table found: submissions_log
✓ Table found: results_log
```

### Step 6: Start the API Server

```bash
npm start
```

**Expected Output:**
```
🚀 School ERP API running on http://localhost:8080/api/v1
✓ PubSub initialized for data pipeline
✓ Cloud Logging configured
```

### Step 7: Setup Dataflow Pipeline (Optional but Recommended)

For production streaming, deploy Dataflow:

```bash
npm run setup-dataflow
```

This generates:
- Dataflow configuration: `config/dataflow-config.json`
- Deployment guide: `docs/DATAFLOW_DEPLOYMENT.md`

To deploy:

```bash
gcloud dataflow jobs run exam-data-pipeline \
  --region=asia-south1 \
  --template-location=gs://school-erp-dataflow/templates/exam-to-bigquery \
  --parameters=inputTopic=projects/school-erp-dev/topics/exam-submissions-topic,outputTableExams=school-erp:school_erp.exams_log
```

## Testing the Pipeline

### Test 1: Create Exam and Verify Pub/Sub Message

```bash
# Create exam
curl -X POST http://localhost:8080/api/v1/exams \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school-001",
    "title": "Midterm Math Exam",
    "subject": "Mathematics",
    "totalMarks": 100,
    "durationMinutes": 120,
    "classId": "class-10A",
    "startTime": "2026-04-15T10:00:00Z",
    "endTime": "2026-04-15T12:00:00Z"
  }'

# Expected Response:
# {
#   "success": true,
#   "data": { ... exam details ... },
#   "_metadata": {
#     "requestId": "...",
#     "pubsubMessageId": "123456789"
#   }
# }
```

### Test 2: Submit Exam

```bash
curl -X POST http://localhost:8080/api/v1/submissions \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school-001",
    "examId": "exam-id-from-above",
    "studentId": "student-123",
    "answers": [
      {
        "questionId": "q1",
        "answer": "Pythagorean theorem"
      }
    ],
    "submittedAt": "2026-04-15T11:30:00Z"
  }'
```

### Test 3: Create Result

```bash
curl -X POST http://localhost:8080/api/v1/results \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "school-001",
    "examId": "exam-id-from-above",
    "studentId": "student-123",
    "score": 85,
    "totalMarks": 100,
    "percentage": 85,
    "grade": "A",
    "submittedAt": "2026-04-15T11:30:00Z",
    "gradedAt": "2026-04-15T12:00:00Z"
  }'
```

### Test 4: Verify Data in BigQuery (within 30 seconds)

#### Option A: Using bq CLI

```bash
# Query exams_log
bq query --use_legacy_sql=false '
  SELECT examId, schoolId, title, totalMarks, createdAt 
  FROM `school-erp-dev.school_erp.exams_log` 
  LIMIT 10
'

# Query submissions_log
bq query --use_legacy_sql=false '
  SELECT submissionId, examId, studentId, submittedAt 
  FROM `school-erp-dev.school_erp.submissions_log` 
  LIMIT 10
'

# Query results_log
bq query --use_legacy_sql=false '
  SELECT resultId, examId, studentId, score, percentage, grade 
  FROM `school-erp-dev.school_erp.results_log` 
  LIMIT 10
'
```

#### Option B: Using Google Cloud Console

1. Go to [BigQuery Console](https://console.cloud.google.com/bigquery)
2. Select project: `school-erp-dev`
3. Expand dataset: `school_erp`
4. Click on table: `exams_log`, `submissions_log`, or `results_log`
5. Click "Preview" tab to see recent data

### Test 5: Check Cloud Logging

```bash
# View logs for API
gcloud logging read 'resource.labels.service_name="school-erp-api"' \
  --limit 50 \
  --format json \
  --project school-erp-dev

# Filter for Pub/Sub events
gcloud logging read 'resource.labels.service_name="school-erp-api" AND textPayload=~"Pub/Sub"' \
  --limit 20 \
  --project school-erp-dev
```

## Configuration Files

### Environment Variables

Required in `.env` or `.env.staging`:

```bash
# GCP Configuration
GCP_PROJECT_ID=school-erp-dev
NODE_ENV=staging
LOG_LEVEL=debug

# Pub/Sub Topics (auto-created if missing)
# But API will create them on startup

# BigQuery
# Dataset: school_erp (auto-created)
# Tables: exams_log, submissions_log, results_log (auto-created)
```

### Generated Files

After setup, these files are created:

```
apps/api/
├── .env.gcp-pipeline              # GCP pipeline configuration
├── config/
│   └── dataflow-config.json       # Dataflow pipeline config
├── docs/
│   └── DATAFLOW_DEPLOYMENT.md     # Dataflow deployment guide
└── TABLES_VERIFIED.md             # Pipeline verification report
```

## Monitoring & Debugging

### Check Pub/Sub Topics

```bash
# List all topics
gcloud pubsub topics list

# Describe specific topic
gcloud pubsub topics describe exam-submissions-topic

# View subscriptions
gcloud pubsub topics list-subscriptions exam-submissions-topic
```

### Check BigQuery Tables

```bash
# List tables in dataset
bq ls school_erp

# Show table schema
bq show --schema --format=prettyjson school_erp.exams_log

# Get table statistics
bq show --format=prettyjson school_erp.exams_log | \
  jq '.{createdTime, lastModifiedTime, rowCount}'
```

### View Cloud Logs

```bash
# Real-time log tail
gcloud logging read --follow \
  --format "json(timestamp,textPayload,severity)" \
  'resource.labels.service_name="school-erp-api"'

# Search for errors
gcloud logging read 'severity=ERROR' --limit 50

# Pub/Sub pipeline logs
gcloud dataflow jobs describe exam-data-pipeline \
  --region asia-south1
```

### Common Issues

#### Issue: "Topic not found" error

```bash
# Solution: Verify topics exist
gcloud pubsub topics list | grep exam

# If missing, create manually:
gcloud pubsub topics create exam-submissions-topic
gcloud pubsub topics create exam-results-topic
```

#### Issue: BigQuery table not receiving data

**Check:**
1. Dataflow job is running
2. Pub/Sub has messages (check deadletter topic)
3. BigQuery has write permissions
4. Check Dataflow logs for errors

```bash
# Check Dataflow job status
gcloud dataflow jobs list --region asia-south1

# View job logs
gcloud dataflow jobs describe JOB_ID --region asia-south1
```

#### Issue: Cloud Logging not showing messages

**Check:**
1. Ensure `@google-cloud/logging` is installed
2. Service account has `logging.admin` permission
3. Check if logging service initialized successfully

## Production Deployment Checklist

- [ ] BigQuery dataset created with tables
- [ ] Pub/Sub topics created
- [ ] Service account has correct permissions
- [ ] Cloud Logging configured with 30-day retention
- [ ] Dataflow pipeline deployed and running
- [ ] API server running with `npm start`
- [ ] End-to-end tests passing
- [ ] Monitoring dashboards configured
- [ ] Alerting rules set up for pipeline failures
- [ ] Backup/disaster recovery plan in place

## Rollback Procedure

If the pipeline has issues:

1. **Stop Dataflow job:**
   ```bash
   gcloud dataflow jobs cancel JOB_ID --region asia-south1
   ```

2. **Keep API running** (data cached in Firestore)

3. **Check logs** for root cause

4. **Fix and redeploy** pipeline

5. **Replay messages** if necessary:
   ```bash
   # Messages are retained in Pub/Sub for 7 days
   # Dataflow will reprocess on restart
   ```

## Next Steps

1. **Agent 6 Demo** (2:00 PM) - Showcase data pipeline to stakeholders
2. **Agent 8 Product Analytics** - Use BigQuery data for dashboards
3. **Agent 7 Documentation** - Document data model and queries
4. **Week 7 Day 3** - Stabilize and optimize pipeline

## Support & Documentation

- **Pub/Sub Service:** [src/services/pubsub-service.ts](../src/services/pubsub-service.ts)
- **BigQuery Setup:** [scripts/setup-bigquery.ts](../scripts/setup-bigquery.ts)
- **Cloud Logging:** [src/services/cloud-logging.ts](../src/services/cloud-logging.ts)
- **Dataflow Guide:** See `docs/DATAFLOW_DEPLOYMENT.md`
- **GCP Documentation:** https://cloud.google.com/docs

## Contact

- **Data Pipeline Engineer:** Agent 3
- **DevOps Lead:** Agent 6
- **Project Lead:** Vivek

---

**Status:** ✅ READY FOR DEPLOYMENT

**Last Updated:** April 10, 2026  
**Next Review:** April 15, 2026
