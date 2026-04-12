# ADR-7-1: Exam/Assessment Schema Design: Firestore Collections vs BigTable

**Status:** APPROVED  
**Date:** April 21, 2026  
**Deciders:** Backend Architect, Data Architect  
**Consulted:** DevOps Agent, QA Agent  
**Informed:** All agents

## Context

Module 3 (Exam & Assessment System) requires designing a schema to support:

- **500+ concurrent exam submissions** during peak times (board exams, competitive exams)
- **10,000+ simultaneous students** accessing exam portal during national-level assessments
- **Pan-India availability** with <2s latency for analytics queries
- **Real-time analytics** on exam performance, student progress, and question effectiveness
- **Audit trail** for compliance and academic integrity
- **Historical data retention** for 7+ years (regulatory requirement)

The current system volume: ~50,000 submissions/day across pilot schools. Expected growth to 500K+ submissions/day by Year 2.

## Decision

We adopt **Firestore with subcollections for real-time data + BigQuery for analytics**, enabling:

### 1. Firestore Collections (Real-time & Master Data)
```
exams/
  {examId}/
    - title, status, startTime, endTime, duration, totalQuestions, maxScore
    - createdBy (teacher ID)
    - schoolId, classId
    - gradeTemplate (A/B/C/D/F mapping)
    - securitySettings (IP restrictions, proctoring mode)
    
  {examId}/questions/
    - {questionId}: { type, content, options[], correctAnswer, score, order }
    - Organized by section/topic
    
  {examId}/student_exams/
    - {studentExamId}: { studentId, startTime, status, IP, sessionToken }
    - Tracks active/completed student exam sessions
    
student_exams/
  {studentExamId}/
    - studentId, examId, schoolId, classId
    - startTime, endTime, duration, status (in_progress, submitted, graded)
    - score, grade, percentile
    - attemptCount, reviewStatus
    - createdAt, updatedAt
    
  {studentExamId}/submissions/
    - {questionId}: { answer, answerTime, lastModified, ipAddress }
    - Real-time capture for audit trail
    
grades/
  {gradeId}/
    - studentExamId, examId, studentId
    - rawScore, percentScore, grade
    - feedback, rubricScores (for subjective)
    - gradedBy (teacher ID), gradedAt
    - reviewStatus, reviewedBy

question_bank/
  {questionId}/
    - type (MCQ, Short Answer, Essay, Match)
    - content, options[], correctAnswer, explanation
    - difficulty (Easy/Medium/Hard)
    - tags[], categories[], standards[] (CBSE/ICSE)
    - createdBy, schoolId
    - usageCount, avgCorrectRate
```

### 2. BigQuery Tables (Analytics & Reporting)

```
exam_submissions
├── submission_id (pk)
├── student_id, exam_id, school_id, class_id
├── submission_time, start_time, end_time, duration_seconds
├── raw_score, percent_score, grade
├── attempts, review_count, ipaddresses (array)
├── question_responses (STRUCT array with qid, response, time, correct boolean)

question_analytics
├── question_id (pk)
├── exam_id, school_id, created_by_id
├── question_text, question_type, difficulty
├── correct_answer_rate (float), avg_time_seconds
├── discrimination_index, point_biserial
├── tags (array), standards (array)

student_exam_results
├── student_id, exam_id, school_id, class_id
├── grade, percentile, score, max_possible
├── time_to_complete, review_count
├── question_results (STRUCT array)

class_performance_aggregate
├── class_id, exam_id, school_id, date
├── avg_score, median_score, std_dev
├── pass_rate, distinction_rate
├── question_difficulty_analysis
```

### 3. Real-time Sync Strategy

- **Firestore → BigQuery Pipeline**: Cloud Pub/Sub + Dataflow (5-minute batches for analytics)
- **Trigger**: Firestore Cloud Functions on submission completion
- **Latency**: <10 seconds from submission to BigQuery availability
- **Backup**: Daily snapshots to Cloud Storage (Parquet format)

## Alternatives Considered

### Option A: SQL Relational Database (PostgreSQL/Cloud SQL)
**Decision: REJECTED**
- **Pros**: Complex join queries, ACID guarantees, mature ecosystem
- **Cons**: 
  - Heavy sharding complexity for 10K concurrent writes
  - Replication lag during peak traffic (500+ submissions/second)
  - Fixed schema changes require downtime
  - Admin overhead for connection pooling, replication tuning
  - Cost: ~$2500/month for HA setup

### Option B: Google BigTable
**Decision: REJECTED**
- **Pros**: Designed for billions of rows, extreme throughput
- **Cons**:
  - Overkill for current phase (100K submissions/day is fraction of capacity)
  - No real-time analytics (requires separate ETL to BigQuery)
  - High operational complexity: cluster sizing, rebalancing, monitoring
  - Steep learning curve vs. managed Firestore
  - Cost: ~$3000+/month minimum

### Option C: NoSQL Managed (Cloud Firestore) + Analytics Warehouse (BigQuery) ← **CHOSEN**
- **Pros**:
  - Automatic scaling to 100K+ writes/second
  - Real-time submissions with instant acknowledgment
  - BigQuery seamless for analytics without additional ETL complexity
  - Serverless (no ops overhead)
  - Cost: ~$500-800/month at 50K submissions/day
- **Cons**:
  - No complex SQL joins (mitigate via denormalization + BigQuery)
  - Document size limit (1MB, non-issue for exam data)

## Consequences

### Positive Consequences
1. **Immediate Scaling**: Auto-scales to 10K+ concurrent requests without intervention
2. **Real-time Feedback**: Students see grades <1s after auto-grading completes
3. **Built-in Analytics**: BigQuery supports interactive dashboards for teachers/admins
4. **Simple Operations**: Firestore handles replication, backups, security rules
5. **Cost Efficient**: Linear cost growth with usage (pay-per-operation model)

### Negative Consequences
1. **Schema Denormalization**: Cannot use JOIN; must denormalize data (mitigated by denormalization strategy)
2. **Complex Transactions**: Multi-document transactions limited to 500 documents (non-issue: each exam submission is 1-3 docs)
3. **Query Language**: Limited to Firestore query capabilities (partially mitigated by BigQuery for reporting)
4. **Vendor Lock-in**: Moving away requires rewriting data layer (acceptable: multi-year commitment to GCP)

## Implementation Details

### 1. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Students can only read their own exam sessions
    match /student_exams/{docId} {
      allow read: if request.auth.uid == resource.data.studentId;
      allow write: if false; // Only backend can write
    }
    
    // Teachers can read exams they created
    match /exams/{docId} {
      allow read: if request.auth.token.role == 'teacher' 
                   && resource.data.createdBy == request.auth.uid
                   || request.auth.token.role == 'admin';
      allow write: if request.auth.token.role == 'admin';
    }
    
    // Admins can read all
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
  }
}
```

### 2. BigQuery Schema with Partitioning
```sql
CREATE OR REPLACE TABLE `project.dataset.exam_submissions`
PARTITION BY DATE(submission_time)
CLUSTER BY student_id, exam_id
AS
SELECT
  GENERATE_UUID() as submission_id,
  student_id,
  exam_id,
  submission_time,
  TIMESTAMP_DIFF(end_time, start_time, SECOND) as duration_seconds,
  score,
  ROUND(score / max_possible * 100, 2) as percent_score,
  ARRAY(SELECT AS STRUCT qid, response, correct FROM UNNEST(answers)) as responses
FROM source;
```

### 3. Real-time Submission Flow
```typescript
// Backend pseudocode
async function submitExam(studentExamId, answers) {
  return await db.runTransaction(async (transaction) => {
    // 1. Read current submission
    const submission = await transaction.get(
      db.collection('student_exams').doc(studentExamId)
    );
    
    // 2. Validate submission state
    if (submission.data().status !== 'in_progress') {
      throw new InvalidStateError();
    }
    
    // 3. Grade automatically (if auto-grading is enabled)
    const grade = autoGrade(answers, submission.data().examId);
    
    // 4. Write atomically
    transaction.update(
      db.collection('student_exams').doc(studentExamId),
      {
        status: 'submitted',
        endTime: new Date(),
        score: grade.score,
        grade: grade.letter
      }
    );
    
    // 5. Publish event for analytics pipeline
    await pubsub.topic('exam-submissions').publish({
      studentExamId, examId, score: grade.score, timestamp: Date.now()
    });
  });
}
```

### 4. Dataflow Pipeline Configuration
```python
# Dataflow job: BigQuery sink for real-time analytics
def run_pipeline(project, dataset):
  pipeline = beam.Pipeline()
  
  (pipeline
    | 'Read Pub/Sub' >> beam.io.ReadFromPubSub(topic='exam-submissions')
    | 'Parse JSON' >> beam.Map(json.loads)
    | 'Window 5min' >> beam.WindowInto(beam.window.FixedWindows(300))
    | 'Aggregate' >> beam.CombineGlobally(sum_scores)
    | 'Write BigQuery' >> beam.io.WriteToBigQuery(
        f'{project}:{dataset}.exam_submissions',
        schema=SCHEMA,
        write_disposition=WRITE_APPEND
      ))
  
  result = pipeline.run()
  result.wait_until_finish()
```

## Cost Analysis

### Firestore (per month at peak: 50K submissions/day)

| Operation | Volume | Cost |
|-----------|--------|------|
| Write (submission) | 50,000 | $0.24 |
| Read (grade fetch) | 50,000 | $0.10 |
| Update (grade write) | 50,000 | $0.24 |
| **Firestore Subtotal** | | **$0.58/day** (~$17/month) |

### BigQuery

| Operation | Volume | Cost |
|-----------|--------|------|
| Data ingestion | 50,000 rows/day | $0.05/day |
| Query (analytics) | ~100 queries/day | $1.50/day |
| Storage | 50K × 365 days = 18.25M rows | $0.10/day |
| **BigQuery Subtotal** | | **$1.65/day** (~$50/month) |

**Total estimated cost at 50K submissions/day: ~$70/month**

Scaling to 500K/day: ~$700/month (linear cost, no ops overhead)

## Monitoring & Observability

### Key Metrics
```
firestore_write_latency_p99: target <100ms
firestore_transaction_conflicts: target <0.1%
bigquery_ingestion_lag: target <10s
exam_submission_success_rate: target >99.5%
auto_grade_latency_p99: target <500ms
```

### Alerts
- Write latency >500ms (Firestore throttling)
- Transaction conflict rate >1% (schema redesign needed)
- BigQuery lag >60s (pipeline backlog)
- Firestore storage >10GB (data warehouse migration)

## Security Considerations

### Row-Level Security (Firestore)
- Students access only their own submissions via UID-based rules
- Teachers access only exams in their classes
- Admins access all data

### Data Classification
- Exam content: CONFIDENTIAL (encrypted at-rest, HTTPS transit)
- Student responses: RESTRICTED (audit trail, RBAC)
- Analytics results: INTERNAL (aggregated, de-identified)

### Compliance
- FERPA compliance: PII separated from performance data
- Audit trail: 12-month retention with immutable writes
- Data residency: India region (Cloud Firestore us-central1 → us-east1 → asia-south1 mapping)

## Testing Strategy

### Unit Tests
```typescript
describe('Exam Submission Validation Rules', () => {
  it('should enforce row-level security for student access', async () => {
    // Test security rules
  });
  
  it('should auto-grade MCQ questions correctly', async () => {
    // Test grading logic
  });
});
```

### Integration Tests
- Concurrent submission of 500+ students → latency <5s
- Grade calculation accuracy across different question types
- BigQuery data reaches analytics dashboard within 10s

### Load Tests (k6 script)
```javascript
export default function () {
  http.post('https://api/exams/submit', {
    studentExamId: __VU,
    answers: generateRandomAnswers()
  });
}

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up
    { duration: '10m', target: 500 },  // Peak load
    { duration: '2m', target: 0 },     // Ramp down
  ],
};
```

## Rationale

1. **Firestore** handles real-time submissions with automatic scaling, providing <1s feedback to students
2. **BigQuery** enables powerful analytics without ETL complexity, allowing teachers to see insights instantly
3. **Separation of concerns**: Real-time data (Firestore) vs. analytical data (BigQuery) prevents analytics queries from impacting submission latency
4. **Cost predictability**: Linear cost model scales efficiently from 10K to 10M submissions/day
5. **Operational simplicity**: Serverless model eliminates database administration overhead crucial for early-stage teams
6. **Future-proof**: Hybrid approach allows migration to BigTable (if needed) without full rewrite

## Revision History

- **2026-04-21**: Initial approval post Week 7 architecture review
- **2026-05-15**: Updated cost analysis with Year 2 projections
