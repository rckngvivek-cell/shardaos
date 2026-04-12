# AGENT 7: DOCUMENTATION ENGINEER
## Week 7 Day 2 Briefing

**Your Role:** Write ADRs + operational runbooks for Phase 2  
**Documentation Time:** 60% = ~4.5 hours writing  
**Target:** 2 ADRs drafted, 4 runbooks created by 5 PM  

---

## TODAY'S MISSION

```
Write ADR-7-3: Real-Time Analytics Pipeline (Pub/Sub + BigQuery)
Write ADR-7-4: Grading Algorithm (Auto-score + Manual review)
Create 4 operational runbooks (how to operate Phase 2)
Update existing docs with Day 2 progress
Package knowledge for onboarding (for schools coming online)
```

---

## 📄 ADR-7-3: REAL-TIME ANALYTICS PIPELINE

**File:** `docs/adr/ADR-7-3-REALTIME_ANALYTICS.md`

```markdown
# ADR-7-3: Real-Time Analytics Pipeline

**Date:** 2026-04-22  
**Status:** ACCEPTED  
**Context:** Week 7 Day 2  

## Problem Statement

We need exam submission data flowing to analytics dashboards with:
- Real-time visibility (< 5 second latency)
- 99.9%+ reliability (no data loss)
- Scalability to 50K+ submissions/day
- Cost-effective at 2-10K submissions/day (pilot) → 100K/day (mature)

Options considered:
1. Direct BigQuery ingestion (slow, unscalable)
2. Firestore → Dataflow (our hybrid choice)
3. BigQuery Streaming API (expensive at scale)
4. Kafka (overkill for our throughput)

## Decision

**CHOSEN: Pub/Sub Streaming + Dataflow + BigQuery**

Architecture:
```
Firestore (submission created)
    ↓
Cloud Function (publishes event)
    ↓
Pub/Sub Topic (exam-submissions)
    ↓
Dataflow Pipeline (transforms + loads)
    ↓
BigQuery Table (submissions)
    ↓
Data Studio (dashboards)
```

## Rationale

1. **Real-time:** Pub/Sub streaming = <2 second latency
2. **Reliable:** Cloud Function retries, Dataflow deadletter queue
3. **Scalable:** Auto-scales to 100K events/second
4. **Cost-effective:** 
   - 10K events/day = ~$50/month
   - 50K events/day = ~$200/month
   - 100K events/day = ~$400/month
5. **Operational:** Fully managed (no infra to maintain)

## Trade-offs

**PRO:**
- Automatic scaling
- Built-in monitoring + alerting
- No custom infrastructure code

**CON:**
- Eventual consistency (not real-time)
  - Mitigated: <5 second latency acceptable for analytics
- Slightly higher operations learning curve
  - Mitigated: Cloud documentation excellent

## Cost Projection

| Events/Day | Pub/Sub | Dataflow | BigQuery | Total |
|-----------|---------|----------|----------|-------|
| 10K | $0 | $10 | $5 | $15 |
| 50K | $100 | $60 | $50 | $210 |
| 100K | $200 | $100 | $100 | $400 |

All within ₹50K/mo budget.

## Implementation

Done in Week 7 Day 2.
- Cloud Function deployed (triggers on submission create)
- Dataflow job running (continuous streaming)
- BigQuery tables populated (real data flowing)
- Data Studio dashboard live (refreshes every 5 min)

## Monitoring

Alert if:
- Dataflow error rate > 1%
- Pub/Sub queue depth > 1000 messages (latency > 30s)
- BigQuery ingestion latency > 10 seconds

## Timeline

- [ ] Deploy Cloud Function (done Day 2)
- [ ] Start Dataflow job (done Day 2)
- [ ] Create BigQuery schema (done Day 2)
- [ ] Dashboard live (done Day 2)
- [ ] Scale test (done Apr 11 load test)
- [ ] Production go-live (done Week 8)

## Future Enhancements

- Option 1: Nightly batch aggregation (for cost optimization)
- Option 2: Real-time BigQuery BI Engine cache (faster queries)
- Option 3: Data warehouse federated query (if we add Postgres later)

---

**Authors:** Data Engineer, Lead Architect  
**Reviewed by:** Lead Architect  
**Approved by:** Project Head
```

---

## 📄 ADR-7-4: GRADING ALGORITHM

**File:** `docs/adr/ADR-7-4-GRADING_ALGORITHM.md`

```markdown
# ADR-7-4: Exam Grading Algorithm

**Date:** 2026-04-22  
**Status:** ACCEPTED (Phase 1)  
**Context:** Week 7 Day 2  

## Problem Statement

Exam grading must:
- Grade 80% of questions instantly (multiple choice)
- Flag 20% for manual review (essays, subjective)
- Provide feedback to students immediately
- Aggregate scores for class analytics
- Scale to 1000+ concurrent submissions

## Decision

**PHASE 1 (This Week):** Auto-grade multiple choice only
**PHASE 2 (Week 8):** Add manual review UI for teachers

### Grading Algorithm

```
For each submission:
  For each question:
    IF type == MULTIPLE_CHOICE:
      Calculate: studentAnswer == correctAnswer
      Score = (isCorrect) ? questionMarks : 0
    ELSE IF type == SHORT_TEXT | ESSAY:
      Flag for manual review
      Score = 0 (temporarily)
  
  Total Score = SUM(all question scores)
  Percentage = (Total Score / Total Marks) * 100
  
  # Provide feedback
  FOR each question:
    IF type == MULTIPLE_CHOICE:
      Show:
        - Student answer (what they chose)
        - Correct answer (what was right)
        - Explanation (why correct)
        - Marks awarded
```

### Example Calculation

Exam: 100 marks total
- Q1 (MC): 10 marks → Student correct → +10
- Q2 (MC): 20 marks → Student wrong → +0
- Q3 (Essay): 30 marks → Flagged for manual → +0 (pending)
- Q4 (MC): 40 marks → Student correct → +40

Auto Score: 50/60 (MC questions): 83.3%
Pending: 30 marks (waiting teacher review)
Final Score: 50/100 (50%) [until teacher grades essay]

## Rationale

1. **Speed:** MC grades in <1 second
2. **Fairness:** Teachers manually grade subjective questions
3. **Scalability:** Can handle 1000+ concurrent submits
4. **Student Experience:** Instant feedback on 80% of work

## Trade-offs

**PRO:**
- Simple to implement (Boolean comparison)
- Scalable (no AI/ML needed)
- Students get instant feedback
- Teachers focus on important questions

**CON:**
- Essays not graded initially (manual process)
- Requires teacher follow-up (not fully automated)

**Mitigation:**
- Implement teacher UI in Week 8
- Until then: Teachers mark essays manually in spreadsheet
- We provide import feature (upload grades back to system)

## Implementation Details

```typescript
// services/grading-service.ts

export class GradingService {
  async gradeSubmission(submission: Submission): Promise<Grade> {
    let totalScore = 0;
    let maxMarks = 0;
    const questionResults = [];
    
    for (const answer of submission.answers) {
      const question = await this.getQuestion(answer.questionId);
      
      if (question.type === 'MULTIPLE_CHOICE') {
        const isCorrect = answer.selectedOption === question.correctAnswer;
        const marks = isCorrect ? question.marks : 0;
        
        totalScore += marks;
        questionResults.push({
          questionId: answer.questionId,
          studentAnswer: answer.selectedOption,
          correctAnswer: question.correctAnswer,
          isCorrect: isCorrect,
          marksAwarded: marks,
          explanation: question.explanation,
          status: 'GRADED'
        });
      } else {
        // Essay/short text - flag for manual
        questionResults.push({
          questionId: answer.questionId,
          studentAnswer: answer.selectedOption,
          status: 'PENDING_MANUAL_REVIEW',
          marksAwarded: 0
        });
      }
      
      maxMarks += question.marks;
    }
    
    return {
      submissionId: submission.id,
      studentId: submission.studentId,
      examId: submission.examId,
      score: totalScore,
      maxMarks: maxMarks,
      percentage: (totalScore / maxMarks) * 100,
      questionResults: questionResults,
      status: 'PARTIALLY_GRADED' // or 'FULLY_GRADED' if no essays
    };
  }
}
```

## Testing

- Unit tests: 20+ covering all question types
- Integration tests: Test full submission → grading flow
- Performance tests: Grade 1000 concurrent submissions (<2s p95)

## Timeline

- [x] Auto-grade MC questions (done Day 2)
- [ ] Manual review UI (Week 8)
- [ ] Bulk import teacher grades (Week 8)
- [ ] AI essay grading (negotiated Phase 3)

## Future Enhancements

- ML-based essay scoring (if budget allows)
- Plagiarism detection (for typed essays)
- Rubric-based scoring (for assignments)

---

**Authors:** Backend Engineer, QA Engineer  
**Reviewed by:** Lead Architect  
**Approved by:** Project Head
```

---

## 📚 4 OPERATIONAL RUNBOOKS

### RUNBOOK 1: Phase 2 Implementation Guide

**File:** `docs/runbooks/PHASE2_IMPLEMENTATION.md`

```markdown
# Phase 2 Implementation Runbook

## What is Phase 2?

Module 3 (Exams) with 4 core endpoints:
1. Create exam
2. List exams  
3. Submit answers
4. View results

## Prerequisites

- Node 18+
- Firebase Admin SDK
- Firestore emulator (local dev)
- Postman or cURL

## Local Setup (For Developers)

### Step 1: Start Firestore Emulator
```bash
firebase emulators:start --only firestore
# Output: Firestore emulator listening on localhost:8080
```

### Step 2: Run Tests
```bash
npm test -- exams.test.ts

# Expected: 12/12 tests pass ✅
```

### Step 3: Start Backend Server
```bash
npm run dev

# Output: Server running on port 3000
```

### Step 4: Test Locally
```bash
curl -X GET http://localhost:3000/api/v1/exams \
  -H "Authorization: Bearer mock-token"
```

## Debugging Common Issues

**Issue:** "Firestore connection refused"
- [ ] Check: `firebase emulators:start` is running
- [ ] Fix: Kill and restart emulator

**Issue:** "Token validation failed"
- [ ] Check: Use valid JWT format for Authorization header
- [ ] Fix: Use test token from test setup

**Issue:** "Query too slow"
- [ ] Check: Composite indexes created (check Firestore console)
- [ ] Fix: Run: `gcloud firestore indexes create --config=firestore.indexes.json`

## Production Deployment

See `docs/deployment/PHASE2_TO_PROD.md`
```

### RUNBOOK 2: BigQuery Setup Guide

**File:** `docs/runbooks/BIGQUERY_SETUP.md`

```markdown
# BigQuery Setup Runbook

## Overview

BigQuery provisioning for analytics dashboards.

## Step 1: Create Project

```bash
gcloud config set project YOUR_PROJECT
```

## Step 2: Create Datasets + Tables

Run DDL script (provided in `scripts/bigquery-schema.sql`):

```bash
bq query --use_legacy_sql=false < scripts/bigquery-schema.sql
```

## Step 3: Verify Tables

```bash
bq ls --tables exam_analytics

# Output:
# exams
# submissions
# daily_metrics
# user_activity
# errors
```

## Step 4: Connect Data Studio

1. Go to datastudio.google.com
2. Create → Report
3. Add Data Source → BigQuery → Select `exam_analytics.submissions`
4. Create visualizations

## Troubleshooting

**Dataset not found?**
- Verify project ID is correct
- Verify dataset in correct region (asia-south1)

**Quota exceeded?**
- Check: Free tier limits (1TB/month query, 10GB/month storage)
- Inspect: Active queries running (`bq ls -j`)

---

See `docs/deployment/BIGQUERY_SCALING.md` for production settings.
```

### RUNBOOK 3: Staging Deployment Guide

**File:** `docs/runbooks/STAGING_DEPLOYMENT.md`

```markdown
# Staging Deployment Runbook

## When to Deploy to Staging

- After Phase 2 code is approved by Architect
- Before production deployment
- For E2E testing with real Backend + Frontend

## Prerequisites

- Docker installed
- Gcloud CLI configured
- Access to Cloud Run staging account

## Deployment Steps

### Step 1: Build Docker Image

```bash
docker build -t gcr.io/YOUR_PROJECT/exam-backend:staging-v2.0.0 .
```

### Step 2: Push to Registry

```bash
docker push gcr.io/YOUR_PROJECT/exam-backend:staging-v2.0.0
```

### Step 3: Deploy to Cloud Run

```bash
gcloud run deploy exam-backend-staging \
  --image gcr.io/YOUR_PROJECT/exam-backend:staging-v2.0.0 \
  --region asia-south1 \
  --memory 512Mi \
  --cpu 1
```

### Step 4: Verify Deployment

```bash
# Get service URL
gcloud run services describe exam-backend-staging --region asia-south1

# Test health
curl https://exam-backend-staging-XYZ.a.run.app/health
```

## Rollback

```bash
# Deploy previous version
gcloud run deploy exam-backend-staging \
  --image gcr.io/YOUR_PROJECT/exam-backend:staging-v1.0.0 \
  --region asia-south1
```

## Monitoring Staging

```bash
# View logs
gcloud run logs read exam-backend-staging

# View metrics (error rate, latency)
gcloud monitoring dashboards list
```

---

See `docs/deployment/PROD_DEPLOYMENT.md` for production guidance.
```

### RUNBOOK 4: Troubleshooting Integration Issues

**File:** `docs/runbooks/TROUBLESHOOTING_INTEGRATION.md`

```markdown
# Troubleshooting Integration Issues

## Scenario 1: Backend returns 500 error

**Symptom:** Frontend calls backend, gets 500 error

**Steps:**
1. Check Backend logs:
   ```bash
   gcloud run logs read exam-backend
   ```
2. Look for error message + stack trace
3. Common causes:
   - Firestore transaction conflict (retry)
   - Missing environment variable (check `.env`)
   - Database connection lost (restart server)

**Fix:**
- [ ] For Firestore conflicts: Automatic retry in client
- [ ] For env variables: Add to Cloud Run deployment
- [ ] For connection: Restart Cloud Run service

## Scenario 2: Frontend doesn't connect to Backend

**Symptom:** Frontend shows "Cannot reach API" error

**Steps:**
1. Check CORS headers:
   ```bash
   curl -i -X OPTIONS http://localhost:3000/api/v1/exams
   # Should show: Access-Control-Allow-Origin: *
   ```
2. Check network tab in browser DevTools
3. Check backend URL in Frontend config

**Fix:**
- [ ] Add CORS middleware to Backend (if missing)
- [ ] Update Frontend `.env` with correct API URL
- [ ] Check firewall rules (no port blocking)

## Scenario 3: Data doesn't appear in BigQuery

**Symptom:** Submit exam, but data doesn't appear in BigQuery table

**Steps:**
1. Check Pub/Sub topic has messages:
   ```bash
   gcloud pubsub subscriptions pull SUBSCRIPTION_NAME --limit 1
   ```
2. Check Dataflow job is running:
   ```bash
   gcloud dataflow jobs list
   ```
3. Check for errors in Dataflow logs

**Fix:**
- [ ] Restart Dataflow job
- [ ] Verify Firestore trigger is deployed (Cloud Functions)
- [ ] Check IAM permissions (Dataflow → BigQuery access)

... (more scenarios)

---

For complex issues, escalate to DevOps + Data Engineer.
```

---

## 📊 UPDATE EXISTING DOCS

**Files to Update:**

### Update: docs/WEEK7_ADR_ROADMAP.md
```markdown
## Week 7 ADR Progress

- [x] ADR-7-1: Module 3 Architecture (Done Day 1)
- [x] ADR-7-2: Student Module UX (Done Day 1)
- [x] ADR-7-3: Real-Time Analytics (Done Day 2) ← NEW
- [x] ADR-7-4: Grading Algorithm (Done Day 2) ← NEW
- [ ] ADR-7-5: Email Notifications (Planned Day 3)
- [ ] ADR-7-6: Metrics SLA (Planned Day 4)
```

### Update: docs/exam-ux-flow.md
```markdown
## Exam UX Flow (Updated with Real Screenshots - Day 2)

### Student View
[Screenshot of real exam UI from Frontend - once running]

### Teacher View
[Screenshot of real results dashboard - once running]

### Admin View
[Screenshot of analytics - once DataStudio connected]
```

### Update: docs/exam-analytics-pipeline.md
```markdown
## Full Implementation Path (As of Day 2)

- [x] Cloud Function deployed (exam submission trigger)
- [x] Pub/Sub topic created (exam-submissions)
- [x] Dataflow job running (streaming pipeline)
- [x] BigQuery tables populated (real data flowing)
- [x] Data Studio dashboard live
- [ ] Load test (Apr 11)
- [ ] Production scale (Week 8)
```

---

## ⏰ YOUR TIMELINE

| Time | Task | Status |
|------|------|--------|
| 9:30-10:30 | Draft ADR-7-3 (Analytics) | WRITE |
| 10:30-11:30 | Draft ADR-7-4 (Grading) | WRITE |
| 11:30-12:00 | Review both ADRs | REVIEW |
| 12:00-1:00 | LUNCH |
| 1:00-2:00 | Write Runbook 1 (Phase 2 Implementation) | WRITE |
| 2:00-3:00 | Write Runbook 2 (BigQuery Setup) | WRITE |
| 3:00-4:00 | Write Runbook 3 (Staging) + Runbook 4 (Troubleshooting) | WRITE |
| 4:00-4:30 | Update existing docs (ADR roadmap, UX flow, analytics) | UPDATE |
| 4:30-5:00 | Final review + push all to repo | FINAL |

---

## ✅ SUCCESS CRITERIA

✅ ADR-7-3 written (Analytics pipeline decision)  
✅ ADR-7-4 written (Grading algorithm)  
✅ 4 runbooks created (Implementation, BigQuery, Staging, Troubleshooting)  
✅ Existing docs updated with Day 2 progress  
✅ All docs reviewed by Lead Architect  
✅ Ready for onboarding new schools (docs complete)  

**By 4:30 PM:**
- All ADRs reviewed + approved
- All runbooks drafted
- Existing docs updated

**By 5:00 PM:**
- All documentation merged to repo
- Available for team reference

---

**DOCUMENTATION ENGINEER - KNOWLEDGE CAPTURED** 📚

**Start:** 9:30 AM  
**Checkpoint:** 4:30 PM (all docs ready)  
**Finish:** 5:00 PM (merged)

Document that! 📝
