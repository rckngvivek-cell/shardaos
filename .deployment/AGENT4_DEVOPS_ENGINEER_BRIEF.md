# AGENT 4: DEVOPS ENGINEER
## Week 7 Day 2 Briefing

**Your Role:** Maintain SLA, deploy Phase 2 staging, prepare load tests  
**Operations Time:** 70% = ~5.5 hours (continuous monitoring)  
**Target:** 99.95%+ uptime + Phase 2 in staging by 2 PM  

---

## TODAY'S MISSION

```
Monitor production 99.95%+ (Module 2 still live)
Deploy Phase 2 code to staging
Verify end-to-end integration in staging
Prepare load test infrastructure
Zero manual incidents (handle any alerts automatically)
```

---

## 🎯 DETAILED TASKS

### TASK 1: Production Monitoring (Continuous, All Day)

**Your Dashboard:**
- Uptime: status.example.com (0 downtime 100%)
- Error Rate: CloudRun logs (target <0.05%)
- Latency: p95 <200ms
- Database: Firestore read/write latency

**Monitoring Stack (use what's configured):**
```
Google Cloud Console
├─ Cloud Run → Metrics
├─ Firestore → Stats
├─ Cloud Logging → Error logs
└─ Cloud Monitoring → Custom dashboards
```

**Check Points (Every 30 minutes):**
```
9:30 AM: All green ✅
10:00 AM: Check latency (p95 < 200ms)
10:30 AM: Check error rate (<0.05%)
11:00 AM: Check throughput
... (continue every 30 min)
```

**If Incident Detected:**
1. FAIL-SAFE: Immediate escalation to Project Head
2. Assess: Is production down? (p0) or slow? (p3)
3. Decide: Rollback vs. Fix-forward
4. Document: Root cause + timeline

**Acceptable Incidents:** ZERO (99.95%+ = max 2 min downtime/week)

---

### TASK 2: Staging Deployment (Phase 2)

**Current Staging Status:**
- Running: Module 2 (complete, stable)
- New: Module 3 Phase 2 endpoints (from Backend Agent)

**Deployment Steps:**

**Step 1: Code Preparation (wait for Backend PR approval ~3 PM)**
```bash
# In staging branch
git pull origin main  # Get approved Phase 2 code
```

**Step 2: Build Docker Image**
```dockerfile
# Dockerfile (should be in repo)
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only production

COPY . .
EXPOSE 3000

CMD ["npm", "start"]
```

**Build:**
```bash
docker build -t gcr.io/YOUR_PROJECT/exam-backend:v2.0.0-phase2 .
docker push gcr.io/YOUR_PROJECT/exam-backend:v2.0.0-phase2
```

**Step 3: Deploy to Cloud Run (Staging)**
```bash
gcloud run deploy exam-backend-staging \
  --image gcr.io/YOUR_PROJECT/exam-backend:v2.0.0-phase2 \
  --region asia-south1 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 60 \
  --set-env-vars "FIRESTORE_DATABASE=exam-analytics" \
  --service-account exam-backend-sa@YOUR_PROJECT.iam.gserviceaccount.com
```

**Step 4: Frontend Deployment (Staging)**
```bash
# Frontend: Deploy to Cloud Storage + CDN
npm run build
gsutil -m rsync -r -d build/ gs://exam-frontend-staging/

# Update DNS (if applicable)
# exam-staging.example.com → CDN endpoint
```

**Verification:**
```bash
# Test Backend health check
curl -s https://exam-backend-staging-XYZ.a.run.app/health | jq

# Expected:
# { "status": "healthy", "db": "connected" }

# Test Frontend loads
curl -s https://exam-staging.example.com | head -20

# Expected: HTML document loads ✅
```

---

### TASK 3: Smoke Test (Staging)

**Quick 5-minute validation:**

```bash
#!/bin/bash
# tests/smoke-test-staging.sh

BACKEND_URL="https://exam-backend-staging-XYZ.a.run.app"
TOKEN="mock-jwt-token-for-testing"

# Test 1: Health check
echo "Test 1: Health check..."
curl -s $BACKEND_URL/health | grep "healthy" && echo "✅ PASSED" || echo "❌ FAILED"

# Test 2: Create exam
echo "Test 2: Create exam..."
EXAM=$(curl -s -X POST $BACKEND_URL/api/v1/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d @test-payload-exam.json)
EXAM_ID=$(echo $EXAM | jq -r '.examId')

# Test 3: List exams
echo "Test 3: List exams..."
curl -s $BACKEND_URL/api/v1/exams \
  -H "Authorization: Bearer $TOKEN" | grep "$EXAM_ID" && echo "✅ PASSED" || echo "❌ FAILED"

# Test 4: Frontend loads
echo "Test 4: Frontend loads..."
curl -s https://exam-staging.example.com | grep "<html" && echo "✅ PASSED" || echo "❌ FAILED"

echo "All smoke tests complete!"
```

**Run Test:**
```bash
bash tests/smoke-test-staging.sh
```

---

### TASK 4: Load Test Preparation

**Target Date:** April 11 (5 days away)  
**Scenario:** 500 concurrent students taking exams (load spike)  
**Goal:** Validate infrastructure can handle peak load

**Load Test Script (prepared, not run yet):**

```bash
# tests/load-test-exams.sh (from Day 1, already exists)
#!/bin/bash

BACKEND_URL="https://exam-backend-prod.a.run.app"
CONCURRENT_USERS=500
DURATION=300  # 5 minutes
EXAM_ID="EXAM-LOAD-TEST"

# Generate load using Apache Bench
ab -n $((CONCURRENT_USERS * DURATION / 10)) \
   -c $CONCURRENT_USERS \
   -H "Authorization: Bearer $TOKEN" \
   -p submission-payload.json \
   "$BACKEND_URL/api/v1/exams/$EXAM_ID/submissions"

# Generate load using wrk (better for concurrent)
wrk -t 20 \
    -c 500 \
    -d 5m \
    -s load-test-script.lua \
    "$BACKEND_URL/api/v1/exams/$EXAM_ID/submissions"
```

**Load Test Acceptance Criteria (Apr 11):**
- [ ] p99 latency < 800ms
- [ ] Success rate > 95%
- [ ] Error rate < 2%
- [ ] No timeouts
- [ ] Database handles load (no transaction conflicts)

**Infrastructure Readiness Checklist:**
- [ ] Cloud Run auto-scaling configured (min 2, max 100 instances)
- [ ] Firestore read/write capacity scaled up
- [ ] CDN cache warmed (static assets)
- [ ] Monitoring dashboards created
- [ ] Alert thresholds configured

---

### TASK 5: Rollback Procedure Verification

**If Phase 2 breaks production (unlikely, but prepare):**

**Quick Rollback (< 2 minutes):**
```bash
# If production goes down, rollback to Day 1 version
gcloud run deploy exam-backend-prod \
  --image gcr.io/YOUR_PROJECT/exam-backend:v1.0.0 \
  --region asia-south1
```

**Verify Rollback:**
```bash
curl -s https://exam-backend-prod.a.run.app/health | jq '.version'
# Should show: "1.0.0" (rolled back)
```

**Document Any Rollback:**
- What broke?
- When detected?
- When fixed?
- Root cause?
- Preventive for next time?

---

### TASK 6: Infrastructure Cost Optimization

**Current Costs (Week 6):**
- Cloud Run: ~₹2,000/mo
- Firestore: ~₹5,000/mo (read/write ops)
- BigQuery: ~₹500/mo
- Storage: ~₹100/mo
- **Total: ~₹7,600/mo**

**Week 7+ Adjustments (Phase 2):**
- Cloud Run: Scale to 10 instances (peak) → ~₹4,000/mo
- Firestore: Increased throughput → ~₹8,000/mo
- BigQuery: Higher ingestion → ~₹1,000/mo
- **Estimated New: ~₹13,000/mo** (still under ₹50K budget!)

**Cost Controls Day 2:**
- [ ] Verify Cloud Run regional quotas (asia-south1 only)
- [ ] Set up budget alerts ($500/day limit)
- [ ] Use Firestore on-demand pricing (scale automatically)
- [ ] Archive old data (older than 90 days) to cheaper storage

---

## ⏰ YOUR TIMELINE

| Time | Task | Status |
|------|------|--------|
| 9:30-9:45 | Check production health (all systems go?) | CHECK |
| 9:45-10:00 | Review staging checklist | PLAN |
| 10:00-12:00 | Monitor production (ongoing) | MONITOR |
| 12:00-1:00 | LUNCH (with alert system on) |
| 1:00-2:30 | Prepare staging deployment | PREPARE |
| **2:30-3:30** | **WAIT for Backend Phase 2 approval** | WAIT |
| 3:30-4:00 | Deploy Phase 2 to staging | DEPLOY |
| 4:00-4:30 | Run smoke tests + verify integration | TEST |
| 4:30-5:00 | Document deployment + load test prep | DOCS |
| 5:00+ | Monitor production overnight (continuous) | MONITOR |

---

## 🚨 INCIDENT RESPONSE PLAYBOOK

**IF production alert triggers:**
1. Check: Is this real outage or false alarm?
   - Real: Drop everything, escalate
   - False: Silence alert, continue work
2. Assess: Impact?
   - P0 (All users down): Immediate rollback
   - P1 (Core feature down): Check with Lead Architect
   - P2 (Slow): Investigate, don't rollback
3. Fix: Root cause?
   - Code: Rollback + wait for fix
   - Infrastructure: Scale up/restart
   - Database: Check Firestore limits
4. Communicate: Inform team immediately

---

## ✅ SUCCESS CRITERIA

✅ 99.95%+ uptime maintained (0 downtime)  
✅ Phase 2 deployed to staging (ready for E2E test)  
✅ Smoke tests pass  
✅ Load test infrastructure prepared  
✅ Rollback procedure verified  
✅ Cost optimizations implemented  
✅ Monitoring actively watching  

**By 2:00 PM:**
- Phase 2 code ready for staging deployment

**By 4:30 PM:**
- Phase 2 running in staging
- QA can start E2E testing

**By 5:00 PM:**
- All monitoring green
- Load test ready for Apr 11

---

**DEVOPS ENGINEER - INFRASTRUCTURE STABLE** 🏗️

**Start:** 9:30 AM  
**Checkpoint:** 4:30 PM (staging ready)  
**Finish:** 5:00 PM (monitoring)

On guard! 🛡️
