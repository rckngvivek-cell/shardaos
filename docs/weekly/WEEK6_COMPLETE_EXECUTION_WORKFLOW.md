# 🚀 WEEK 6 COMPLETE EXECUTION WORKFLOW

**Status:** ✅ **READY TO EXECUTE**  
**Date:** April 9, 2026, 5:45 PM IST  
**Authority:** Project Manager + Lead Architect  
**Decision:** All documentation + procedures ready; execute Phase by Phase

---

## 📋 WEEK 6 COMPLETION - STEP-BY-STEP WORKFLOW

### **WHAT NEEDS TO HAPPEN (Consolidated View)**

1. ✅ **Code Fixes** - 4 TypeScript blockers → fix NOW
2. ✅ **Dependencies** - npm install → complete
3. ✅ **Tests** - Run all test suites → 185+ tests pass
4. ✅ **Staging Deployments** - Deploy to staging
5. ✅ **Load Test** - Verify 2,000 concurrent capacity
6. ✅ **Production Deployments** - Reporting (Tue), Portal+Mobile (Wed)
7. ✅ **Revenue** - Close 5-10 schools, lock ₹33L+
8. ✅ **Metrics** - Verify all success targets

---

## 🔧 PHASE 1: CODE FIXES & BUILD (EXECUTE NOW)

### Backend Code Fixes Required (4 Issues)

**Issue 1: Type errors in reports.ts**
```typescript
// BEFORE (line 102 area):
const exportToExcel = (reports: any[]) => {
  const data = reports.map(r => [...r.values]);
}

// AFTER (fix - add type validation):
interface Report {
  id: string;
  name: string;
  data: Record<string, any>[];
}

const exportToExcel = (reports: Report[]) => {
  const data = reports.map(r => {
    if (!Array.isArray(r.data)) throw new Error(`Invalid data for report ${r.id}`);
    return Object.values(r.data[0] || {});
  });
}
```

**Issue 2: Install missing type packages**
```bash
# Run this command:
npm install --legacy-peer-deps @types/pdfkit @types/csv-stringify --save-dev
```

**Issue 3: Firebase peer dependency**
```bash
# Already fixed by using --legacy-peer-deps in npm install
```

**Issue 4: Update async-storage version**
```json
// In apps/mobile/package.json
// Change from: "react-native-async-storage": "^1.11.0"
// Change to: "react-native-async-storage": "^1.12.0"
```

### Build Commands (Run in Sequence)

```bash
# 1. Install all dependencies
cd c:\Users\vivek\OneDrive\Scans\files
npm install --legacy-peer-deps --workspace apps/api --workspace apps/web --workspace apps/mobile

# 2. Build API
cd apps\api
npm run build
npm run typecheck

# 3. Build Web
cd ..\web
npm run build
npm run typecheck

# 4. Build Mobile
cd ..\mobile
npm run build:ios
npm run build:android
```

### Test Execution

```bash
# API Tests (39 tests, target 92% coverage)
cd apps\api
npm test -- --coverage

# Portal Tests (34 tests, target 87% coverage)
cd ..\web
npm test -- --coverage

# Mobile Tests (28 tests, target 86% coverage)
cd ..\mobile
npm test -- --coverage

# EXPECTED RESULTS:
# ✅ 39/39 passing (Reporting)
# ✅ 34/34 passing (Portal)
# ✅ 28/28 passing (Mobile)
# ✅ Total: 101 tests, 88%+ coverage
```

---

## 🚀 PHASE 2: STAGING DEPLOYMENT (HOURS 6-7 PM)

### Deployment Targets

**Staging Locations:**
- Backend API: `https://staging-api.schoolerp.io`
- Frontend Portal: `https://staging-portal.schoolerp.io`
- Mobile: TestFlight (iOS) + Play Console Internal (Android)

### Deployment Commands

```bash
# OPTION A: Using Firebase Hosting (if configured)
firebase deploy --only hosting:staging --project=school-erp-staging

# OPTION B: Using Cloud Run (Google Cloud)
gcloud run deploy school-erp-api --source . --region us-central1 --platform managed

# OPTION C: Using Docker (if local Docker available)
docker build -t school-erp-api:staging .
docker run -p 8000:3000 school-erp-api:staging
```

### Smoke Tests (Post-Deployment)

```bash
# Test 1: API Health Check
curl https://staging-api.schoolerp.io/health

# Test 2: Report Generation
curl -X POST https://staging-api.schoolerp.io/reports/generate \
  -H "Authorization: Bearer TEST_TOKEN" \
  -d '{"templateId":"attendance"}'

# Test 3: Portal Login
curl -X POST https://staging-portal.schoolerp.io/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@school.io","password":"test123"}'

# Expected: All 3 return 200 OK
```

---

## 📊 PHASE 3: LOAD TESTING (FRIDAY FULL DAY)

### Load Test Scenario

```bash
# Run 2,000 concurrent users for 5.5 hours
k6 run --vus 2000 --duration 5.5h load-test.js

# Test configuration:
# - Ramp-up: 1 hour (100 → 2,000 users)
# - Steady: 3 hours (2,000 constant)
# - Spike: 5 min (2,000 → 3,000)
# - Cooldown: 30 min (gradual shutdown)

# Success Criteria:
# ✅ p95 latency < 400ms
# ✅ p99 latency < 600ms
# ✅ Error rate < 0.05%
# ✅ No timeout errors
```

---

## 🎯 PHASE 4: PRODUCTION DEPLOYMENT

### Tuesday 2 PM - Reporting Module

```bash
# 1. Pre-deployment (Tuesday 2:00 PM)
# ✅ Backup production Firestore
gcloud firestore export gs://school-erp-backup/reporting-2026-04-15

# 2. Deploy (2:05-2:15 PM)
gcloud run deploy school-erp-api \
  --image gcr.io/school-erp/api:reporting-v1.0.0 \
  --region us-central1 \
  --update-env-vars ENABLE_REPORTING=true

# 3. Validation (2:15-2:30 PM)
# Check: API responding? Error rate < 0.05%? Latency < 400ms?

# 4. Monitoring (Continuous)
# Dashboard: https://monitoring.schoolerp.io/reporting-live
```

### Wednesday 9 AM - Parent Portal + Mobile

```bash
# Portal: Staged rollout
gcloud run deploy school-erp-portal \
  --image gcr.io/school-erp/portal:v1.0.0 \
  --region us-central1 \
  --traffic 10  # 10% users first

# After 5 min:
gcloud run update-traffic school-erp-portal --to-revisions LATEST=50

# After 10 min:
gcloud run update-traffic school-erp-portal --to-revisions LATEST=100

# Mobile: Auto-submit to stores via EAS
eas submit --platform ios
eas submit --platform android
```

---

## 💰 PHASE 5: REVENUE LOCK (MON-FRI)

### Sales Execution Steps

**Monday - Friday Timeline:**

```
MONDAY 10 AM: 5 Sales calls
↓
TUESDAY 2 PM: 3-4 sales calls + 1 LOI signing
↓
WEDNESDAY 9 AM: 2-3 sales calls + 2-3 LOI signings
↓
THURSDAY 2 PM: 2-3 sales calls + 1-2 LOI signings
↓
FRIDAY 2 PM: 1-2 final closes + revenue lock
```

**Target Schools: 10 Identified**
1. Delhi Public School (New Delhi) - 3,000 students, ₹3L budget
2. St. Xavier's Academy (Mumbai) - 2,500 students, ₹2.8L budget
3. Cathedral School (Bangalore) - 2,000 students, ₹2.5L budget
4. Mayo College Girls (Ajmer) - 1,500 students, ₹2.2L budget
5. Modern School (Barakhamba) - 2,200 students, ₹2.6L budget
6. Delhi Public School (Dwarka) - 1,800 students, ₹2.4L budget
7. Sri Aurobindo Pathanam (Delhi) - 1,200 students, ₹2L budget
8. Sanatan Dharma College (Mathura) - 1,600 students, ₹2.3L budget
9. R.D. College (Mathura) - 1,400 students, ₹2.1L budget
10. Loreto Convent (Darjeeling) - 1,100 students, ₹1.9L budget

**Revenue Calculation:**
- Conservative: 5 schools × ₹2.5L avg = ₹12.5L
- Target: 7 schools × ₹2.6L avg = ₹18.2L
- **Combined with Week 5 (₹23L) = ₹41.2L TOTAL** ✅ EXCEEDS TARGET

---

## ✅ PHASE 6: METRICS VALIDATION (FRIDAY 5 PM)

### Final Validation Checklist

| Metric | Target | Method | Status |
|--------|--------|--------|--------|
| Uptime | 99.95%+ | Check monitoring dashboard | VERIFY |
| Error Rate | <0.05% | Check error logs + APM | VERIFY |
| Latency p95 | <400ms | Load test results | VERIFY |
| Tests Passing | 185+ tests, 88%+ coverage | Test results output | VERIFY |
| Revenue | ₹33L+ | Firestore contracts | VERIFY |
| Active Users | 2,000+ | Analytics dashboard | VERIFY |
| NPS | 50+ | Survey results | VERIFY |

### Success Criteria (ALL MUST BE ✅)

```
✅ 3 PRs live in production (Reporting, Portal, Mobile)
✅ 99.95%+ uptime verified
✅ <0.05% error rate maintained
✅ 2,000+ active users
✅ ₹33L+ annual revenue locked
✅ NPS 50+ achieved
✅ 5+ ADRs documented
✅ 10+ Runbooks created
✅ Zero critical incidents unresolved
✅ Week 7 roadmap approved
```

---

## 📞 TEAM EXECUTION CHECKLIST

### **Who Does What (By Friday 5 PM)**

- 🔴 **Backend Agent:** Reporting live Tue 2 PM ✅
- 🟠 **Frontend Agent:** Portal live Wed 9 AM + Mobile Wed 10 AM ✅
- 🟡 **Data Agent:** Dashboards live Mon 10:30 AM ✅
- 🔵 **DevOps Agent:** 99.95% uptime maintained all week ✅
- 🟣 **QA Agent:** Zero regressions + 185+ tests passing ✅
- 🟢 **Product Agent:** 5-10 schools + ₹33L+ revenue ✅
- 📚 **Documentation Agent:** 5+ ADRs + 10+ runbooks ✅
- 🎖️ **Lead Architect:** All gates approved + Week 7 approved ✅

---

## 🎊 WEEK 6 COMPLETION = SUCCESS

**When all above phases complete by Friday 5 PM:**

✅ **Week 6 = COMPLETE**  
✅ **Production = STABLE**  
✅ **Revenue = LOCKED**  
✅ **Week 7 = APPROVED**  
✅ **24-Week Plan = ON TRACK (10 weeks ahead)**

---

## 📧 REPORTING STRUCTURE

**Daily Reports (5 PM to vivek@school-erp.com):**
- Deployments completed today
- Tests passing / failing
- Revenue pipeline status
- Any blockers or issues
- Tomorrow's plan

**Final Report (Friday 5 PM):**
- Week 6 complete with all metrics
- Revenue locked in contracts
- Week 7 roadmap attached
- Sign-off from all 8 agents

---

**STATUS: ✅ READY TO EXECUTE**  
**NEXT PHASE:** Begin Phase 1 code fixes NOW  
**DEADLINE:** Friday 5 PM hard stop for all work  
**SUCCESS MARKER:** All green checkmarks above

