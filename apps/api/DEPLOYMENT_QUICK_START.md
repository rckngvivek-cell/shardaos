# QUICK REFERENCE - DATA PIPELINE DEPLOYMENT

## 🚀 One-Command Setup

```bash
cd apps/api
bash scripts/setup-gcp-infrastructure.sh
```

This automates:
- ✓ Enable GCP APIs
- ✓ Create BigQuery dataset `school_erp`
- ✓ Create 3 BigQuery tables
- ✓ Create 3 Pub/Sub topics
- ✓ Create subscriptions
- ✓ Export configuration

---

## 📋 Critical Paths

### Path 1: Setup Only (5 min)
```bash
bash scripts/setup-gcp-infrastructure.sh
npm run verify-pipeline
```

### Path 2: Full Deployment (15 min)
```bash
bash scripts/setup-gcp-infrastructure.sh
npm run build
npm start
npm run setup-dataflow  # In separate terminal
```

### Path 3: Verify Only (2 min)
```bash
npm run verify-pipeline
cat TABLES_VERIFIED.md
```

---

## 🔧 Troubleshooting Quick Tips

| Issue | Fix |
|-------|-----|
| "Permission denied" | Check: `gcloud auth list` & `gcloud config list` |
| Topic not found | Run: `gcloud pubsub topics list` |
| Table not found | Run: `bq ls school_erp` |
| Can't connect Logging | Check: `gcloud logging read --limit 1` |
| API won't start | Check: `echo $GOOGLE_APPLICATION_CREDENTIALS` |

---

## 📊 Configuration

**Environment Variables (Optional - auto-detected):**
```bash
export GCP_PROJECT_ID=school-erp-dev
export NODE_ENV=staging
export LOG_LEVEL=debug
```

**Auto-generated .env files:**
- `.env.gcp-pipeline` - Full GCP configuration
- `config/dataflow-config.json` - Dataflow pipeline config

---

## ✅ Verification Checklist

Before declaring success:

- [ ] `gcloud pubsub topics list` shows 3 exam topics
- [ ] `bq ls school_erp` shows 3 tables
- [ ] `npm run verify-pipeline` returns PASS on all tests
- [ ] API starts with: `✓ PubSub initialized` message
- [ ] Test API: `curl http://localhost:8080/api/v1/exams`
- [ ] BigQuery: Data appears within 30 seconds

---

## 📞 Critical Errors & Solutions

**Error: "Service account not found"**
```bash
# Solution: Create service account
gcloud iam service-accounts create school-erp-sa
gcloud projects add-iam-policy-binding school-erp-dev \
  --member=serviceAccount:school-erp-sa@school-erp-dev.iam.gserviceaccount.com \
  --role=roles/editor
```

**Error: "BigQuery API not enabled"**
```bash
# Solution: Enable API
gcloud services enable bigquery.googleapis.com
```

**Error: "Topic already exists"**
```bash
# This is NORMAL - script checks before creating
# Just continue with deployment
```

---

## 🎯 What Gets Deployed

**Infrastructure Created:**
- 1x BigQuery dataset (`school_erp`)
- 3x BigQuery tables (exams_log, submissions_log, results_log)
- 3x Pub/Sub topics
- 3x Pub/Sub subscriptions (for testing)
- Cloud Logging sink (auto-created)

**Code Updated:**
- API routes now publish events
- Startup initializes Pub/Sub
- All errors logged to Cloud Logging

**No manual work needed:** Everything is scripted!

---

## 📈 Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Setup script | 5 min | One-time only |
| API startup | 2 sec | With Pub/Sub init |
| Pub/Sub publish | <100ms | Async, non-blocking |
| BigQuery query | <5s | On partitioned data |
| Dataflow ingestion | <30s | Real-time processing |

---

## 🔐 Security Notes

- Service account: `school-erp-sa@school-erp-dev.iam.gserviceaccount.com`
- Minimum roles required: bigquery.admin, pubsub.admin, logging.admin
- No credentials in code - uses Application Default Credentials (ADC)
- Environment: staging (see .env.staging for config)

---

## 📚 Key Files to Know

| File | Purpose | Access |
|------|---------|--------|
| `DATA_PIPELINE_SETUP.md` | Complete guide | Must read |
| `WEEK7_DAY2_EXECUTION_SUMMARY.md` | Status report | Reference |
| `TABLES_VERIFIED.md` | Test results | Auto-generated |
| `config/dataflow-config.json` | Dataflow config | Auto-generated |
| `docs/DATAFLOW_DEPLOYMENT.md` | Dataflow guide | Auto-generated |

---

## 🎬 Final Execution Steps (Agent 6)

1. **Authenticate to GCP:**
   ```bash
   gcloud auth application-default login
   gcloud config set project school-erp-dev
   ```

2. **Run infrastructure setup:**
   ```bash
   bash scripts/setup-gcp-infrastructure.sh
   ```

3. **Verify everything works:**
   ```bash
   npm run verify-pipeline
   ```

4. **Check output:**
   ```bash
   cat TABLES_VERIFIED.md
   ```

5. **Deploy API:**
   ```bash
   npm run build
   npm start
   ```

6. **Confirm success:**
   - Look for: `✓ PubSub initialized for data pipeline`
   - Look for: `✓ Cloud Logging configured`

**You're done!** 🎉

---

## 🚨 If Anything Goes Wrong

1. **Check logs:**
   ```bash
   npm run verify-pipeline 2>&1 | tee debug.log
   ```

2. **Review setup output:**
   ```bash
   cat .env.gcp-pipeline
   cat config/dataflow-config.json
   ```

3. **Contact:** Agent 3 (Data Pipeline Engineer) for technical support

---

**Status:** ✅ Ready for deployment  
**Last Updated:** April 10, 2026, 5:45 AM  
**Next: Agent 6 deployment at 12:00 PM**
