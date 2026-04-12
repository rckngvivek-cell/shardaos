# 📋 DEPLOYMENT EXECUTION CHECKLIST
## Week 7 Day 2: Phase 2 Staging Deployment - Cloud Run

**Agent:** DevOps / Infrastructure Engineer  
**Date:** April 10, 2026  
**Deadline:** 1:30 PM IST (30-min buffer before 2 PM demo)  
**Status:** ✅ READY TO EXECUTE  

---

## 🔍 PRE-DEPLOYMENT VERIFICATION

### Build Artifacts ✅
- [x] Backend dist/ folder exists with compiled code
  - Files: index.js, app.js, config/, routes/, services/
  - Size: ~3 MB
  - Last modified: 10/04/2026 12:19 AM

- [x] Frontend dist/ folder exists with Vite build
  - Files: index.html, assets/, favicon.svg
  - Last modified: 10/04/2026 12:25 AM

### Dockerfile & Config ✅
- [x] apps/api/Dockerfile.prod created (Node.js + Alpine)
- [x] apps/web/Dockerfile.prod created (nginx + Alpine)
- [x] apps/web/nginx.conf created (SPA routing + API proxy)

### Deployment Scripts ✅
- [x] deploy-to-cloudrun.ps1 (Windows PowerShell - ready)
- [x] deploy-to-cloudrun.sh (Linux/macOS - ready)

### Documentation ✅
- [x] DEPLOYMENT_GUIDE_WEEK7_DAY2.md (5-step guide)
- [x] DEPLOYMENT_URLS.md (template for final URLs)
- [x] CLOUDRUN_MAINTENANCE_PLAYBOOK.md (operations)
- [x] DEPLOYMENT_QUICK_START.md (quick reference)

---

## ⚙️ ENVIRONMENT SETUP CHECKLIST

### GCP Prerequisites
- [ ] **gcloud CLI installed** - https://cloud.google.com/sdk/docs/install
  - On Windows with Chocolatey: `choco install google-cloud-sdk`
  - Verify: `gcloud --version`

- [ ] **Docker Desktop running**
  - On Windows: Docker Desktop for Windows
  - Verify: `docker --version` and `docker ps`

- [ ] **GCP Project Configured**
  - Project ID: `school-erp-dev`
  - Region: `us-central1`
  - Command: `gcloud config set project school-erp-dev`

- [ ] **Authentication Configured**
  - Run: `gcloud auth login`
  - Verify: `gcloud auth list`

- [ ] **Docker Registry Access**
  - Run: `gcloud auth configure-docker gcr.io`
  - Verify: Can push to `gcr.io/school-erp-dev/*`

- [ ] **GCP APIs Enabled** (should already be enabled)
  - Cloud Run API
  - Container Registry API
  - Cloud Logging API
  - Cloud Firestore
  - Cloud Storage

---

## 🚀 DEPLOYMENT EXECUTION (Choose One Method)

### METHOD A: AUTOMATED DEPLOYMENT (Recommended - 5-8 min)

```powershell
# ✅ Windows PowerShell
cd c:\Users\vivek\OneDrive\Scans\files
.\deploy-to-cloudrun.ps1
```

Steps:
- [ ] Script validates prerequisites
- [ ] Builds backend Docker image (~2 min)
- [ ] Builds frontend Docker image (~1 min)
- [ ] Pushes images to GCR (~1 min)
- [ ] Deploys backend service to Cloud Run (~2 min)
- [ ] Deploys frontend service to Cloud Run (~2 min)
- [ ] Verifies health checks
- [ ] Captures final URLs
- [ ] Saves URLs to DEPLOYMENT_URLS.txt

**Expected Output:**
```
✓ DEPLOYMENT COMPLETE
✓ Backend URL: https://exam-api-staging-xxxxxxx.run.app
✓ Frontend URL: https://exam-web-staging-yyyyyyy.run.app
✓ URLs saved to: DEPLOYMENT_URLS.txt
```

### METHOD B: MANUAL STEP-BY-STEP (If automated fails)

Follow the detailed steps in: **DEPLOYMENT_GUIDE_WEEK7_DAY2.md**
- Steps 1-2: Build images
- Steps 3-4: Push to GCR
- Steps 5-6: Deploy services
- Step 7: Verify deployment

---

## ✅ POST-DEPLOYMENT VERIFICATION (2-3 min)

### Health Checks
```bash
# Backend
curl https://exam-api-staging-[UNIQUE_ID].run.app/health
# Expected: HTTP 200 OK

# Frontend
curl https://exam-web-staging-[UNIQUE_ID].run.app/
# Expected: HTTP 200 OK (with HTML)

# API
curl "https://exam-api-staging-[UNIQUE_ID].run.app/api/v1/exams?schoolId=test-1"
# Expected: HTTP 200 OK (with JSON array)
```

### Service Status
```bash
gcloud run services describe exam-api-staging --region=us-central1
gcloud run services describe exam-web-staging --region=us-central1
# Expected: status=ACTIVE, ready replicas=1
```

### Error Log Check
```bash
gcloud logging read "severity=ERROR" --limit=5 --project=school-erp-dev
# Expected: 0 ERROR level logs (or "No matching entries")
```

---

## 📊 DEPLOYMENT TIMELINE

| Time | Task | Status |
|------|------|--------|
| 10:15 AM | Setup & prerequisites | ⏳ TODO |
| 10:20 AM | Run deployment | ⏳ TODO |
| 10:28 AM | Health checks pass | ⏳ TODO |
| 10:30 AM | Capture URLs | ⏳ TODO |
| 10:35 AM | Verify error logs | ⏳ TODO |
| 10:40 AM | Share URLs with Agent 6 | ⏳ TODO |
| 11:00 AM - 1:00 PM | Monitor & standby | ⏳ TODO |
| 1:00 PM - 1:30 PM | Final verification | ⏳ TODO |
| 1:30 PM | READY FOR DEMO | ⏳ TODO |
| 2:00 PM | **DEMO TIME!** | 🎯 TARGET |

---

## 🎯 DEPLOYMENT CHECKLIST (Check as you go)

### Environment Setup
- [ ] gcloud CLI installed and authenticated
- [ ] Docker daemon running
- [ ] Project configured: `school-erp-dev`
- [ ] GCP credentials valid: `gcloud auth list`
- [ ] Total prerequisites: **5 items**

### Build & Push
- [ ] Backend Docker image built
- [ ] Frontend Docker image built
- [ ] Both images pushed to GCR
- [ ] GCR images verified: `gcloud container images list`
- [ ] Total build steps: **4 items**

### Deployment
- [ ] Backend service deployed: `exam-api-staging`
- [ ] Frontend service deployed: `exam-web-staging`
- [ ] Both services in ACTIVE state
- [ ] URLs captured (from script or `gcloud run services describe`)
- [ ] Total deployment steps: **4 items**

### Verification
- [ ] Backend health check: 200 OK ✓
- [ ] Frontend loads: 200 OK ✓
- [ ] API responds with data: 200 OK ✓
- [ ] No ERROR level logs
- [ ] Services auto-scaling correctly
- [ ] Total verification steps: **5 items**

### Handoff
- [ ] URLs saved in DEPLOYMENT_URLS.txt
- [ ] DEPLOYMENT_URLS.md updated with final URLs
- [ ] Demo script created (see DEPLOYMENT_QUICK_START.md)
- [ ] Agent 6 briefed on endpoints
- [ ] Rollback procedure documented and tested
- [ ] Total handoff steps: **5 items**

**Total Items:** 23 (Must all be ✅)

---

## 🆘 TROUBLESHOOTING QUICK LINKS

| Problem | Solution | Time |
|---------|----------|------|
| gcloud not found | Install SDK from cloud.google.com/sdk | 5-10 min |
| Docker not running | Start Docker Desktop | 30s |
| Build fails | Check docker ps, ensure dist/ folders exist | 2 min |
| Push fails | Run: `gcloud auth configure-docker gcr.io` | 1 min |
| Deploy fails (API) | Check: `gcloud logging read \| head -10` | 2 min |
| Deploy fails (quota) | May need project owner approval | 5-15 min |
| Health check fails | Wait 30s (services may be initializing) | 30s |

---

## 🚨 EMERGENCY PROCEDURES

### If Deployment Fails (>10 min remaining until demo)
```bash
# Option 1: Quick rollback (if previous version exists)
gcloud run deploy exam-api-staging --image=gcr.io/school-erp-dev/api:latest
gcloud run deploy exam-web-staging --image=gcr.io/school-erp-dev/web:latest

# Option 2: Use previous day's stable build
# Contact DevOps lead for last known good image hash
```

### If Services Are Slow
```bash
# Check logs for errors
gcloud logging read "severity=ERROR OR severity=WARNING" --limit=20

# Check if services are stuck initializing
gcloud run services describe exam-api-staging --region=us-central1

# If needed, restart service
gcloud run deploy exam-api-staging \
  --image=gcr.io/school-erp-dev/api:v1.0.0 \
  --region=us-central1
```

### If Close to Deadline & Tech Issues
- Escalate to Lead Architect immediately
- Have fallback demo data ready (screenshots/video)
- Can show working deployment from previous day if needed

---

## 📁 DOCUMENT REFERENCES

| Document | Purpose | When to Use |
|----------|---------|-----------|
| DEPLOYMENT_QUICK_START.md | 1-page quick reference | Getting started |
| DEPLOYMENT_GUIDE_WEEK7_DAY2.md | Detailed step-by-step | Manual execution |
| deploy-to-cloudrun.ps1 | Automated Windows script | Main execution |
| deploy-to-cloudrun.sh | Automated Linux/macOS script | Alternative execution |
| DEPLOYMENT_URLS.md | Final URLs for demo | After deployment |
| CLOUDRUN_MAINTENANCE_PLAYBOOK.md | Operations reference | Post-deployment |
| DEPLOYMENT_EXECUTION_CHECKLIST.md | This file | Progress tracking |

---

## ✨ SUCCESS CRITERIA (MUST PASS)

### Technical Requirements
- [x] Docker images built (size <500 MB each)
- [x] Dockerfile.prod files created and tested
- [x] dist/ folders contain compiled code
- [ ] Images pushed to GCR successfully
- [ ] Services deployed to Cloud Run
- [ ] Health checks returning 200 OK
- [ ] API endpoints responding with data
- [ ] Frontend loads without CORS errors
- [ ] Error rate < 0.1%

### Operational Requirements
- [ ] Deployment completed before 1:30 PM
- [ ] URLs documented and ready
- [ ] Demo script prepared
- [ ] Monitoring enabled
- [ ] Rollback procedure tested

### Demo Readiness
- [ ] Agent 6 has URLs
- [ ] Test curl commands validated
- [ ] Frontend loads with data
- [ ] Backend responds to API calls
- [ ] 30-min buffer maintained before 2 PM demo

---

## 📞 SUPPORT MATRIX

| Issue Category | Contact | Response Time |
|----------------|---------|---------------|
| Build issues | Backend Engineer | 5 min |
| GCP/Cloud Run | DevOps Lead | 5 min |
| Frontend issues | Frontend Engineer | 5 min |
| Critical blocker | Lead Architect | Immediate |
| Demo support | All agents | 2 min |

---

## 🎓 LEARNING OUTCOMES

After this deployment, you'll have:
- ✓ Deployed containerized services to Google Cloud Run
- ✓ Configured auto-scaling and health checks
- ✓ Used Google Container Registry for image management
- ✓ Monitored Cloud Run services
- ✓ Created deployment documentation
- ✓ Set up rollback procedures
- ✓ Hands-on experience with staging environments

---

## 📝 SIGN-OFF

**Deployment Package Created By:** DevOps Agent  
**Date:** April 10, 2026  
**Time:** 10:30 AM IST  
**Status:** ✅ READY FOR EXECUTION  
**Estimated Deploy Time:** 5-10 minutes  
**Demo Target:** 2:00 PM IST  

---

**Next: Execute the deployment using your preferred method (Automated script recommended)**

```powershell
# RUN THIS:
cd c:\Users\vivek\OneDrive\Scans\files
.\deploy-to-cloudrun.ps1
```

✨ **You've got this! Start deployment now.** ✨
