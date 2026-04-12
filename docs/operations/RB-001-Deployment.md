# Runbook: Deployment to Production

**Last Updated:** April 9, 2026  
**Runbook ID:** RB-001  
**Severity Level:** High  
**Owner:** DevOps Agent + Backend Lead  
**Escalation Contact:** Lead Architect (Slack: @lead-arch)

---

## 📋 Purpose

Deploy code changes from development → staging → production while maintaining 99.95% uptime and zero data loss.

**When to use this:**
- Completing a feature (merged PR ready to deploy)
- Critical bugfix that needs immediate production release
- Routine weekly deployment cycle

**When NOT to use this:**
- Hotfixes that need emergency deployment (use emergency-deploy runbook instead)
- Database migrations (use schema-migration runbook)
- Infrastructure changes (use infrastructure-deploy runbook)

**Estimated Duration:** 15-20 minutes (staging) + 5-10 minutes (production)  
**Risk Level:** High (potential service interruption)

---

## ✅ Prerequisites

Before deploying, verify:

- [ ] All tests passing in CI/CD (GitHub Actions green)
- [ ] Code reviewed and approved by Lead Architect
- [ ] Release notes written (RELEASE_NOTES_TEMPLATE.md)
- [ ] Rollback plan documented and tested
- [ ] Monitoring dashboard open and watching
- [ ] On-call person available (for issues during deployment)
- [ ] No active incidents in production

**Estimated Duration:** 20-30 minutes
**Risk Level:** High

---

## 🔧 Step-by-Step Procedure

### Phase 1: Pre-deployment Checks (5 minutes)

**Step 1.1: Verify CI/CD Status**
- Go to GitHub repo → Actions tab
- Check latest commit has ✅ All checks passing
- Expected: All green (test, build, lint, security scans)
- ✅ Success: All 4 checks show green status
- ❌ Failed: Fix failing test first, don't proceed

```
Checks needed:
- ✅ unit-tests
- ✅ integration-tests
- ✅ build-docker
- ✅ security-scan
```

**Step 1.2: Review Deployment Checklist**
- Open DEPLOYMENT_CHECKLIST.md from repo root
- Complete pre-deployment section
- Should take ~5 minutes
- ✅ Success: All checklist items signed off
- ❌ Failed: Address missing items before proceeding

**Step 1.3: Notify Team**
- Post to #week6-execution Slack channel:
  ```
  🚀 Starting deployment of PR #XX to staging
  Changes: [Brief summary]
  Estimated completion: [Time]
  ```
- ✅ Success: Team acknowledged
- ⚠️ Warning: If no response in 2 minutes, still proceed (async notification)

### Phase 2: Deploy to Staging (7-10 minutes)

**Step 2.1: Trigger Staging Deployment**
- Open Cloud Run console: https://console.cloud.google.com/run
- Select service: `school-erp-api-staging`
- Click "Deploy new revision"
- Select git branch: `main` (should already be latest)
- Click "Deploy"
- Expected output:
  ```
  Creating revision...
  Deploying application...
  Revision [revision-id] deployed successfully
  ```
- ✅ Success: Status shows "Running" with green indicator
- ❌ Failed: Check logs, fix issue, retry

```bash
# Alternative (CLI method):
gcloud run deploy school-erp-api-staging \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

**Step 2.2: Run Smoke Tests on Staging**
- Open terminal and run:
  ```bash
  npm run test:e2e:staging
  ```
- Expected output:
  ```
  ✅ Login test passed
  ✅ Create student test passed
  ✅ Generate report test passed
  Test suite: 12 passed, 0 failed
  ```
- ✅ Success: All E2E tests pass on staging (2-3 minutes)
- ❌ Failed: Roll back staging deployment, investigate issue

**Step 2.3: Manual Testing on Staging**
- Open https://staging.school-erp.local
- Test 3 critical flows:
  1. Login as school admin
  2. Create a new student
  3. Generate an attendance report
- Expected: All actions complete normally
- ✅ Success: Flows work as expected
- ❌ Failed: Stop deployment, notify backend lead

**Step 2.4: Verify Staging Metrics**
- Open monitoring dashboard: https://console.cloud.google.com/monitoring
- Check staging environment metrics:
  - Error rate: Should be <0.1%
  - Latency (p99): Should be <500ms
  - CPU/memory: Should be normal
- ✅ Success: Metrics look good
- ⚠️ Warning: If metrics degraded, investigate before production

### Phase 3: Deploy to Production (5-10 minutes)

**Step 3.1: Final Production Readiness Check**
- Confirm staging passed all steps above ✅
- Check production monitoring dashboard (baseline metrics)
- Verify on-call person is ready
- Post to #week6-execution:
  ```
  ✅ Staging deployment successful. Starting production deployment.
  ```

**Step 3.2: Trigger Production Deployment**
- Open Cloud Run console
- Select service: `school-erp-api-production`
- Click "Deploy new revision"
- Select git branch: `main`
- Click "Deploy"
- Expected: Revision deploying...
- ✅ Success: Status shows "Running" after 1-2 minutes
- ❌ Failed: DO NOT proceed to step 3.3, use rollback procedure

```bash
# CLI method:
gcloud run deploy school-erp-api-production \
  --source . \
  --region asia-south1 \
  --allow-unauthenticated
```

**Step 3.3: Monitor Deployment for 2 Minutes**
- Watch production metrics dashboard
- Alert conditions to watch for:
  - ⚠️ Error rate spike (>1%)
  - ⚠️ Latency spike (p99 >2 seconds)
  - ⚠️ CPU spike (>80%)
  - ⚠️ Memory spike (>80%)
- Expected: Metrics stable, no spikes
- ✅ Success: No anomalies in first 2 minutes
- ❌ Failed: See "Troubleshooting" section below

**Step 3.4: Smoke Test Production**
- Run automated smoke tests:
  ```bash
  npm run test:e2e:production
  ```
- Expected: 12 tests passing
- ✅ Success: Tests pass
- ❌ Failed: Execute rollback (Step 4.1)

**Step 3.5: Final Verification**
- Check: Production users able to login
- Check: Reports generating without errors
- Check: No error spike in logs
- Check: Monitoring dashboard showing normal metrics
- ✅ Success: All checks passed
- Deployment complete! 🎉

---

## 🐛 Troubleshooting

### Issue 1: Staging Deployment Failed
**Symptoms:**
```
Error: Build failed
BUILD FAILURE: Docker build failed
```
**Root Cause:** Docker image build error or dependency issue
**Resolution:**
1. Check build logs: `gcloud builds log`
2. Look for compilation errors or missing dependencies
3. Fix code locally (run `npm install && npm run build`)
4. Commit fix, push to git
5. Retry deployment

**Verification:** Staging deployment succeeds, E2E tests pass

---

### Issue 2: Smoke Tests Failing on Staging
**Symptoms:**
```
❌ Login test failed: 401 Unauthorized
Connection refused: Unable to reach API
```
**Root Cause:** Staging deployment not ready or API misconfigured
**Resolution:**
1. Give staging 30 seconds more time (cold start)
2. Verify staging endpoint is responding: `curl https://staging-api.school-erp.local/health`
3. If health check fails, rollback staging
4. Investigate: Check Cloud Run logs for errors
5. Fix issue, retry deployment

**Verification:** Health check returns 200, tests pass

---

### Issue 3: Production Error Spike After Deployment
**Symptoms:**
```
🚨 Alert: Error rate jumped from 0.02% to 5%
Logs show: "TypeError: Cannot read property 'x' of undefined"
```
**Root Cause:** Bug introduced in new code, data structure mismatch
**Resolution:**
1. **Immediate:** Trigger rollback (see Step 4.1)
2. **Investigation:** Review code change that caused error
3. **Fix:** Apply hotfix to code
4. **Redeploy:** Follow this runbook again
5. **Postmortem:** Document what went wrong

**Timeline:** Rollback complete within 2 minutes, service restored to previous version

---

### Issue 4: Production Latency Spike
**Symptoms:**
```
⚠️ Alert: P99 latency increased from 200ms to 2 seconds
Users reporting slow dashboard load
```
**Root Cause:** Database query optimization issue or memory leak
**Resolution:**
1. Check new code for database queries (added N+1 query?)
2. Monitor memory usage (is it growing?)
3. If memory growing or queries slow: Trigger rollback
4. If temporary spike: Monitor for 5 minutes (might stabilize)
5. If persists: Rollback, investigate, redeploy

**Verification:** Latency returns to <500ms, users report normal speed

---

## 📞 Escalation

**If stuck after 2 minutes:**
- 🔴 Critical: Page on-call immediately
  - On-call Slack: @on-call-devops
  - Status: Post in #week6-execution "DEPLOYMENT ISSUE - need help"
  - Don't wait for response just page

**If stuck after 5 minutes:**
- 🟠 Escalate to Lead Architect + Backend Lead
  - Email: tech-leads@school-erp.local
  - Slack: @lead-arch @backend-lead

**If production is down 10+ minutes:**
- 🟡 Activate incident response
  - War room: #incident-response Slack
  - Page all service owners (Backend, DevOps, Frontend)
  - Go-no-go decision: Continue deployment or full rollback?

---

## 🔄 Rollback Procedure (If Needed)

**When to rollback:**
- Error rate >1%
- Latency p99 >2 seconds
- Any data corruption (don't proceed)
- Critical feature broken

**How to rollback (5 minutes):**

Step 1: Identify previous working revision
```bash
gcloud run revisions list --service school-erp-api-production
# Find revision before current one, copy its revision ID
```

Step 2: Route 100% traffic to previous revision
```bash
gcloud run services update-traffic school-erp-api-production \
  --to-revisions=[PREVIOUS_REVISION_ID]=100
```

Step 3: Verify rollback successful
```bash
npm run test:e2e:production
# Tests should pass, error rate should drop
```

Step 4: Monitor for 5 minutes
- Confirm error rate <0.05%
- Confirm latency <500ms
- Confirm no new errors

**Rollback complete!** You're back on stable version.

---

## ✅ Post-Deployment Checklist

After successful production deployment:

- [ ] Release notes posted to #announcements Slack
- [ ] Monitoring dashboard bookmarked for quick access
- [ ] Stood up for 30 minutes post-deployment (monitoring)
- [ ] No error spikes detected
- [ ] Production users testing feature (if applicable)
- [ ] Recorded deployment time + notes in log below
- [ ] Slack message: "✅ Deployment complete - production stable"

---

## 📝 Deployment Execution Log

Track all production deployments:

| Date | PR# | Version | By | Status | Issues | Time |
|------|-----|---------|-----|--------|--------|------|
| 2026-04-09 | #9 | 1.2.0 | DevOps | ✅ Success | None | 8 min |
| 2026-04-10 | #10 | 1.2.1 | Backend | ✅ Success | Latency spike | 12 min |
| | | | | | | |

---

## 📚 Related Runbooks

- [RB-002: Incident Response](RB-002-Incident-Response.md)
- [RB-005: Performance Debugging](RB-005-Performance-Debugging.md)
- [RB-004: Failover Procedure](RB-004-Failover.md)

---

## 👥 Ownership & Maintenance

**Process Owner:** DevOps Agent  
**Last Tested:** April 9, 2026  
**Next Review:** April 23, 2026  
**Known Issues:** None
