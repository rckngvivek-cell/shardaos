# 🚀 DEPLOYMENT QUICK START - Week 7 Day 2 Phase 2

**DEADLINE:** 1:30 PM IST (30 min buffer before 2 PM demo)  
**Time Now:** April 10, 2026, 10:15 AM IST  
**Time Available:** ~3.5 hours  

---

## ✅ PRE-DEPLOYMENT CHECKLIST (5 min)

```bash
# 1. Verify gcloud installed
gcloud --version

# 2. Authenticate to GCP
gcloud config set project school-erp-dev
gcloud auth login

# 3. Configure Docker auth
gcloud auth configure-docker gcr.io

# 4. Verify Docker running
docker ps

# 5. Check dist folders
ls apps/api/dist/
ls apps/web/dist/
```

**If any step fails:** See DEPLOYMENT_GUIDE_WEEK7_DAY2.md for fixes

---

## 🚀 ONE-COMMAND DEPLOYMENT (5-8 min)

### Windows PowerShell
```powershell
# Navigate to workspace
cd c:\Users\vivek\OneDrive\Scans\files

# Run deployment script
.\deploy-to-cloudrun.ps1
```

### macOS/Linux
```bash
cd /path/to/workspace
bash deploy-to-cloudrun.sh
```

**Output will include:**
- ✓ Docker images built
- ✓ Images pushed to GCR
- ✓ Services deployed to Cloud Run
- ✓ Health checks passed
- ✓ Final URLs printed

---

## 📊 EXPECTED OUTPUT

```
Backend API Service:
  Name: exam-api-staging
  URL:  https://exam-api-staging-xxxxxxx.run.app
  Health: https://exam-api-staging-xxxxxxx.run.app/health
  API:   https://exam-api-staging-xxxxxxx.run.app/api/v1

Frontend Web Service:
  Name: exam-web-staging
  URL:  https://exam-web-staging-yyyyyyy.run.app
```

**Save these URLs!** Share with Agent 6 for demo.

---

## 📋 QUICK TEST (2 min)

```bash
# Backend health
curl https://exam-api-staging-xxxxxxx.run.app/health
# Expected: 200 OK

# Frontend load
curl https://exam-web-staging-yyyyyyy.run.app/
# Expected: 200 OK (HTML response)

# API test
curl "https://exam-api-staging-xxxxxxx.run.app/api/v1/exams?schoolId=test-1"
# Expected: 200 OK (JSON array)
```

---

## 🆘 TROUBLESHOOTING (Quick Fixes)

| Problem | Fix |
|---------|-----|
| `gcloud: command not found` | Install from https://cloud.google.com/sdk/docs/install |
| `docker: command not found` | Install Docker Desktop from https://docs.docker.com/install |
| Auth error | Run: `gcloud auth login` |
| Build fails | Check Windows admin privileges, Docker daemon running |
| Deploy fails | Check: `gcloud logging read \| head -20` for error details |
| Can't find dist/ | Run: `npm run build` in /apps/api and /apps/web first |

---

## 📈 MONITORING (Real-Time)

```bash
# Watch backend logs
gcloud run logs read exam-api-staging --follow

# Watch frontend logs
gcloud run logs read exam-web-staging --follow

# Check for errors
gcloud logging read "severity=ERROR" --limit=5
```

---

## 🔄 ROLLBACK (If Needed)

```bash
# Emergency: Revert to previous version
gcloud run deploy exam-api-staging \
  --image=gcr.io/school-erp-dev/api:latest \
  --region=us-central1

# Same for frontend
gcloud run deploy exam-web-staging \
  --image=gcr.io/school-erp-dev/web:latest \
  --region=us-central1
```

---

## 📞 WHEN TO ESCALATE

| Issue | Action |
|-------|--------|
| Health check failing (5+ min) | Check logs: `gcloud logging read` |
| 500 errors in API | Check backend environment: `gcloud run services describe exam-api-staging` |
| CORS errors in browser | Check nginx config in apps/web/ |
| Demo time approaching, deployment incomplete | Escalate to Lead Architect |

---

## 🎯 SUCCESS CHECKLIST

- [ ] Deployment script executed
- [ ] No errors in output
- [ ] URLs captured
- [ ] Health checks pass (200 OK)
- [ ] URLs shared with Agent 6
- [ ] Ready for 2:00 PM demo

---

## 📁 DOCUMENTATION

| Document | Purpose |
|----------|---------|
| DEPLOYMENT_GUIDE_WEEK7_DAY2.md | Full step-by-step guide |
| DEPLOYMENT_URLS.md | Final URLs for demo |
| CLOUDRUN_MAINTENANCE_PLAYBOOK.md | Operations & maintenance |
| deploy-to-cloudrun.ps1 | Automated deployment (Windows) |
| deploy-to-cloudrun.sh | Automated deployment (Linux/macOS) |

---

## ⏱️ TIMELINE

| Time | Task |
|------|------|
| 10:15 AM | ✅ Pre-deployment checklist |
| 10:20 AM | ⏳ Run deployment script |
| 10:30 AM | ⏳ Health checks pass |
| 10:35 AM | ⏳ Capture and save URLs |
| 10:40 AM - 1:00 PM | ⏳ Monitor & prepare demo |
| 1:00 PM - 1:30 PM | ⏳ Final verification & buffer |
| 1:30 PM - 2:00 PM | ⏳ Ready for Agent 6 demo |
| 2:00 PM | 🎯 DEMO TIME! |

---

## 🎯 AGENT 6 DEMO SCRIPT (5 minutes)

1. **Show Backend URL:**
   ```
   echo "Backend Health: https://exam-api-staging-xxxxxxx.run.app/health"
   curl https://exam-api-staging-xxxxxxx.run.app/health
   ```

2. **Show Frontend:**
   ```
   echo "Open in browser: https://exam-web-staging-yyyyyyy.run.app/"
   ```

3. **Show API Data:**
   ```
   curl "https://exam-api-staging-xxxxxxx.run.app/api/v1/exams?schoolId=test-1"
   ```

4. **Create New Exam:**
   ```
   curl -X POST https://exam-api-staging-xxxxxxx.run.app/api/v1/exams \
     -H "Content-Type: application/json" \
     -d '{"name":"Chemistry Test","schoolId":"test-1"}'
   ```

5. **Verify in UI:**
   ```
   Refresh browser → show new exam in the list
   ```

---

**Created:** April 10, 2026, 10:15 AM IST  
**Status:** READY FOR DEPLOYMENT ✅  
**DevOps Agent:** Ready to execute  
