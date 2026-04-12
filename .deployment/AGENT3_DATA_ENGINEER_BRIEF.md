# AGENT 3: DATA ENGINEER
## Week 7 Day 2 Briefing

**Your Role:** Provision BigQuery + set up real-time data pipeline  
**Setup Time:** 85% = ~6 hours infrastructure  
**Target:** Live streaming from Firestore → BigQuery by 4 PM  

---

## TODAY'S MISSION

```
Provision BigQuery datasets + tables
Set up Pub/Sub topics (exam events)
Create Firestore trigger → Pub/Sub
Deploy Dataflow template for streaming
Connect Data Studio to live BigQuery data
Real-time analytics pipeline LIVE by 4 PM
```

---

## 🎯 DETAILED TASKS

### TASK 1: BigQuery Setup (Provisioning)

**What to Create:**
1. BigQuery datasets (if not exist)
2. Create 5 tables from Day 1 schema
3. Set up partitioning
4. Run DDL scripts

**DDL Scripts to Run:**

```sql
-- Create dataset
CREATE SCHEMA IF NOT EXISTS `exam_analytics`
OPTIONS(
  description="Exam analytics and reporting",
  location="asia-south1",
  default_table_expiration=0
);

-- Table 1: exams (fact table)
CREATE TABLE IF NOT EXISTS `exam_analytics.exams` (
  exam_id STRING NOT NULL,
  title STRING,
  class_id STRING,
  subject_id STRING,
  total_marks INT64,
  duration_minutes INT64,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  created_by STRING,
  created_at TIMESTAMP,
  status STRING,
  updated_at TIMESTAMP,
  
  PRIMARY KEY (exam_id) NOT ENFORCED
)
PARTITION BY DATE(created_at)
CLUSTER BY class_id, subject_id;

-- Table 2: submissions (fact table - high cardinality)
CREATE TABLE IF NOT EXISTS `exam_analytics.submissions` (
  submission_id STRING NOT NULL,
  exam_id STRING NOT NULL,
  student_id STRING NOT NULL,
  submitted_at TIMESTAMP,
  score FLOAT64,
  percentage FLOAT64,
  status STRING,
  grading_status STRING,
  raw_answers ARRAY<STRUCT<
    question_id STRING,
    selected_option STRING,
    is_correct BOOL,
    marks FLOAT64
  >>,
  ingested_at TIMESTAMP,
  
  PRIMARY KEY (submission_id) NOT ENFORCED
)
PARTITION BY DATE(submitted_at)
CLUSTER BY exam_id, student_id;

-- Table 3: daily_metrics (aggregated)
CREATE TABLE IF NOT EXISTS `exam_analytics.daily_metrics` (
  date DATE,
  class_id STRING,
  subject_id STRING,
  total_exams INT64,
  completed_submissions INT64,
  average_score FLOAT64,
  high_score FLOAT64,
  low_score FLOAT64,
  updated_at TIMESTAMP,
  
  PRIMARY KEY (date, class_id, subject_id) NOT ENFORCED
)
PARTITION BY date
CLUSTER BY class_id;

-- Table 4: user_activity (fact table - per submission)
CREATE TABLE IF NOT EXISTS `exam_analytics.user_activity` (
  event_id STRING NOT NULL,
  student_id STRING,
  event_type STRING, -- "exam_started", "exam_submitted", "exam_viewed"
  exam_id STRING,
  event_timestamp TIMESTAMP,
  event_data JSON,
  
  PRIMARY KEY (event_id) NOT ENFORCED
)
PARTITION BY DATE(event_timestamp)
CLUSTER BY student_id, exam_id;

-- Table 5: errors (debugging)
CREATE TABLE IF NOT EXISTS `exam_analytics.errors` (
  error_id STRING NOT NULL,
  error_type STRING,
  error_message STRING,
  service STRING,
  occurred_at TIMESTAMP,
  context JSON,
  resolved BOOL,
  
  PRIMARY KEY (error_id) NOT ENFORCED
)
PARTITION BY DATE(occurred_at)
CLUSTER BY service;
```

**Verification Steps:**
```bash
# List created tables
bq ls --tables exam_analytics

# Check table schema
bq show exam_analytics.submissions

# Verify partitioning
bq show --schema exam_analytics.submissions | grep partitionField
```

**Expected Output:**
```
exams
submissions  
daily_metrics
user_activity
errors

All 5 tables created ✅
```

---

### TASK 2: Pub/Sub Setup

**Create Topics:**
```bash
# Topic 1: Exam submissions (high throughput)
gcloud pubsub topics create exam-submissions \
  --location asia-south1 \
  --message-retention-duration 1h

# Topic 2: Exam events (all events)
gcloud pubsub topics create exam-events \
  --location asia-south1

# Topic 3: Errors (for debugging)
gcloud pubsub topics create errors \
  --location asia-south1

# Create subscriptions (for Dataflow)
gcloud pubsub subscriptions create exam-submissions-subscription \
  --topic exam-submissions \
  --ack-deadline 60

gcloud pubsub subscriptions create exam-events-subscription \
  --topic exam-events
```

**Verify Topics Created:**
```bash
gcloud pubsub topics list
gcloud pubsub subscriptions list
```

---

### TASK 3: Firestore → Pub/Sub Trigger (Cloud Function)

**Cloud Function to Deploy:**

```typescript
// functions/src/firestore-to-pubsub.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const pubsub = new admin.pubsub.PubSub();

// Trigger on submission create
export const onSubmissionCreated = functions
  .region('asia-south1')
  .firestore
  .document('submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    const submission = snap.data();
    
    // Publish event to Pub/Sub
    const topic = pubsub.topic('exam-submissions');
    
    const messageData = JSON.stringify({
      event_id: `EVT-${context.eventId}`,
      submission_id: snap.id,
      exam_id: submission.examId,
      student_id: submission.studentId,
      score: submission.score,
      submitted_at: admin.firestore.Timestamp.now(),
      event_type: 'exam_submitted',
    });
    
    try {
      await topic.publish(Buffer.from(messageData));
      console.log(`Published submission ${snap.id} to Pub/Sub`);
    } catch (err) {
      console.error('Failed to publish:', err);
      // Log to errors table for debugging
      await admin.firestore()
        .collection('logs')
        .add({
          type: 'pubsub_publish_error',
          error: err.message,
          submission_id: snap.id,
          timestamp: admin.firestore.Timestamp.now(),
        });
    }
  });

// Trigger on exam delete (archive events)
export const onExamUpdated = functions
  .region('asia-south1')
  .firestore
  .document('exams/{examId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Only publish if status changed
    if (before.status !== after.status) {
      const topic = pubsub.topic('exam-events');
      const messageData = JSON.stringify({
        exam_id: context.params.examId,
        old_status: before.status,
        new_status: after.status,
        event_type: 'exam_status_changed',
        timestamp: admin.firestore.Timestamp.now(),
      });
      
      await topic.publish(Buffer.from(messageData));
    }
  });
```

**Deploy Function:**
```bash
cd functions
npm run build
firebase deploy --only functions:onSubmissionCreated,functions:onExamUpdated
```

**Verify Deployment:**
```bash
firebase functions:list
# Should show: onSubmissionCreated, onExamUpdated
```

---

### TASK 4: Dataflow Pipeline Setup

**Create Dataflow Job Template:**

```python
# dataflow/exam_analytics_pipeline.py
import apache_beam as beam
from apache_beam import pvalue
from apache_beam.options.pipeline_options import PipelineOptions
import json
from datetime import datetime

class ParsePubSubMessage(beam.DoFn):
  def process(self, element):
    """Parse Pub/Sub message into structured data"""
    try:
      message = json.loads(element)
      yield message
    except Exception as e:
      yield pvalue.TaggedOutput('error', str(e))

class FormatForBigQuery(beam.DoFn):
  def process(self, element):
    """Convert message to BigQuery table format"""
    try:
      output = {
        'submission_id': element.get('submission_id'),
        'exam_id': element.get('exam_id'),
        'student_id': element.get('student_id'),
        'score': float(element.get('score', 0)),
        'submitted_at': element.get('submitted_at'),
        'ingested_at': datetime.utcnow().isoformat(),
      }
      yield output
    except Exception as e:
      yield pvalue.TaggedOutput('error', str(e))

def run_pipeline():
  options = PipelineOptions(
    project='YOUR_GCP_PROJECT',
    runner='DataflowRunner',
    region='asia-south1',
    temp_location='gs://YOUR_BUCKET/temp',
    staging_location='gs://YOUR_BUCKET/staging',
  )
  
  with beam.Pipeline(options=options) as p:
    # Read from Pub/Sub
    input_data = (
      p
      | 'ReadFromPubSub' >> beam.io.ReadFromPubSub(
        topic='projects/YOUR_PROJECT/topics/exam-submissions'
      )
    )
    
    # Parse messages
    parsed = (
      input_data
      | 'ParseMessages' >> beam.ParDo(ParsePubSubMessage()).with_outputs(
        'error', main='main'
      )
    )
    
    # Format for BigQuery
    formatted = (
      parsed['main']
      | 'FormatForBQ' >> beam.ParDo(FormatForBigQuery()).with_outputs(
        'error', main='main'
      )
    )
    
    # Write to BigQuery
    formatted['main'] | 'WriteToBigQuery' >> beam.io.WriteToBigQuery(
      'YOUR_PROJECT:exam_analytics.submissions',
      write_disposition=beam.io.BigQueryDisposition.WRITE_APPEND,
      create_disposition=beam.io.BigQueryDisposition.CREATE_IF_NEEDED,
    )
    
    # Log errors
    (formatted['error'] 
      | 'LogErrors' >> beam.Map(print)
    )

if __name__ == '__main__':
  run_pipeline()
```

**Deploy Dataflow Job:**
```bash
python dataflow/exam_analytics_pipeline.py
```

**Verify Job Running:**
```bash
# In Cloud Console: Dataflow → Jobs
# Should see: exam_analytics_pipeline (Running)
```

---

### TASK 5: Data Studio Dashboard Setup

**Connect BigQuery to Data Studio:**
1. Go to Data Studio (datastudio.google.com)
2. Create → Report
3. Add Data Source → BigQuery
4. Select: `exam_analytics.submissions` table
5. Create 5 visualizations:

**Visualization 1: Total Submissions**
```
Metric: COUNT(submission_id)
Filter: (none)
Target: 45 by EOD
```

**Visualization 2: Average Score Trend**
```
X-axis: DATE(submitted_at)
Y-axis: AVG(score)
Title: "Class Average Score Over Time"
```

**Visualization 3: Score Distribution**
```
Type: Histogram
Measure: score
Buckets: 10
Title: "Score Distribution"
```

**Visualization 4: Top Performers**
```
Dimension: student_id
Metric: AVG(score)
Sort: Descending
Limit: 10
Title: "Top 10 Performers"
```

**Visualization 5: Submission Timeline**
```
Type: Timeline
Date: submitted_at
Count: COUNT(submission_id)
Title: "Submissions Over Time"
```

**Configure Auto-Refresh:**
- Set refresh to every 5 minutes
- Enable scheduled reports (2 AM daily)

---

### TASK 6: Monitoring + Alerts

**Create Dataflow Monitoring:**
```yaml
# In Cloud Monitoring, create alert policy:
Display Name: Dataflow Latency High
Condition: 
  Metric: dataflow.googleapis.com/job/data_watermark_age
  Threshold: > 5 seconds
  Duration: 2 minutes
Notification: Send email to team
```

**Production Metrics to Track:**
- Events processed/second (target: 100+)
- End-to-end latency (target: <5 seconds p95)
- Error rate (target: <0.1%)
- BigQuery row count (should grow every submission)

**Manual Verification Steps (Day 2):**
```bash
# 1. Create test submission in Firestore (manually)
# 2. Wait 10 seconds
# 3. Check Pub/Sub subscription:
gcloud pubsub subscriptions pull exam-submissions-subscription --limit 1

# Expected: Message appears ✅

# 4. Check BigQuery table:
bq query --use_legacy_sql=false '
SELECT COUNT(*) as submissions FROM `exam_analytics.submissions`
LIMIT 1
'

# Expected: Row count increases ✅

# 5. Data Studio dashboard should update (within 5 min refresh)
```

---

## 📦 DEPLOYMENT ARCHITECTURE

```
Firestore (student submits exam)
    ↓
Cloud Function (onSubmissionCreated)
    ↓
Pub/Sub Topic (exam-submissions)
    ↓
Dataflow Job (streaming pipeline)
    ↓
BigQuery Table (submissions)
    ↓
Data Studio Dashboard (real-time visualization)
```

---

## ⏰ YOUR TIMELINE

| Time | Task | Status |
|------|------|--------|
| 9:30-10:00 | Review GCP project + setup authentication | SETUP |
| 10:00-11:00 | Create BigQuery datasets + run DDL | DDL |
| 11:00-12:00 | Create Pub/Sub topics | PUBSUB |
| 12:00-1:00 | LUNCH |
| 1:00-2:00 | Deploy Cloud Functions (Firestore triggers) | CF |
| 2:00-3:00 | Deploy Dataflow pipeline | DF |
| 3:00-4:00 | Connect Data Studio + create dashboards | DS |
| 4:00-4:30 | Manual verification (test end-to-end) | TEST |
| 4:30-5:00 | Setup monitoring + alerts | MONITOR |

---

## ✅ SUCCESS CRITERIA

✅ BigQuery datasets created (5 tables)  
✅ Pub/Sub topics created  
✅ Firestore triggers deployed (Cloud Functions)  
✅ Dataflow job running and processing events  
✅ Data Studio dashboard connected + live  
✅ End-to-end latency <5 seconds  
✅ Error rate <0.1%  

**By 4:00 PM:**
- 1 test submission flows to BigQuery
- Dashboard shows live data
- Alerts configured

**By 5:00 PM:**
- Entire pipeline operational
- Monitored + production-ready

---

**DATA ENGINEER - ANALYTICS PIPELINE LIVE** 📊

**Start:** 9:30 AM  
**Checkpoint:** 4:00 PM (dashboard live)  
**Finish:** 5:00 PM (monitoring ready)

Let's flow data! 🔄
