# Runbook: Data Recovery - Restore from Backup

**Last Updated:** April 9, 2026  
**Runbook ID:** RB-003  
**Severity Level:** Critical  
**Owner:** DevOps Agent + Database Admin  
**Escalation Contact:** Lead Architect

---

## 📋 Purpose

Recover data from Firestore and CloudSQL backups after data corruption, accidental deletion, or catastrophic failure. Goal: Restore only deleted/corrupted data while preserving newer data.

**When to use this:**
- Accidental table/collection deletion
- Data corruption detected (malformed data)
- Ransomware attack suspected
- User accidentally deleted critical records
- Database restore from point-in-time

**When NOT to use this:**
- Performance issues (use RB-005: Performance Debugging)
- Deployment issues (use RB-001: Deployment)
- Lost database credentials (use IT security procedures)

**Estimated Duration:** 15-30 minutes (depending on data size)  
**Risk Level:** Critical (can cause data loss if done wrong)

---

## ✅ Prerequisites

Before performing data recovery:

- [ ] Backup location verified (Firestore backups enabled)
- [ ] Database access credentials available
- [ ] Staging environment ready (test restore here first)
- [ ] Data restore validation plan prepared
- [ ] Affected users identified
- [ ] Rollback plan if restore goes wrong

---

## 🔧 Data Recovery Procedures

### Firestore Data Recovery (Collections/Documents)

**Step 1.1: Identify Lost/Corrupted Data**
```bash
# Export affected collection to examine:
bq query --use_legacy_sql=false '
  SELECT * FROM school_erp_prod.firestore_export
  WHERE collection = "students"
  AND timestamp > TIMESTAMP("2026-04-09 12:00:00")
'
```
- ✅ Success: Can see sample Records
- ❌ Failed: Check BigQuery export pipeline

**Step 1.2: Locate Latest Good Backup**
- Open GCS bucket: `gs://school-erp-backups/firestore/`
- List backups by date:
  ```bash
  gsutil ls -L gs://school-erp-backups/firestore/
  ```
- Find: Latest backup BEFORE corruption occurred
- Example: `backup-2026-04-09-12-00-backup-complete`
- ✅ Success: Backup location identified
- ❌ Failed: Contact Google Cloud to restore from older snapshot

**Step 1.3: Restore to Staging First (ALWAYS TEST)**
⚠️ **DO NOT restore directly to production!**

```bash
# Restore backup to staging Firestore:
gcloud firestore import gs://school-erp-backups/firestore/backup-2026-04-09-12-00 \
  --database school-erp-staging \
  --region asia-south1
```
- Expected output: "Firestore import job created"
- Monitor progress:
  ```bash
  gcloud firestore operations list --database school-erp-staging
  ```
- ✅ Success: Restore completes after 5-10 minutes
- ❌ Failed: If error occurs on staging, investigate before production

**Step 1.4: Validate Recovered Data in Staging**
```bash
# Test critical queries:
1. Count students: SELECT COUNT(*) FROM students
   Expected: ~5,000 students
2. Latest exam marks: SELECT * FROM marks ORDER BY created DESC LIMIT 5
   Expected: Marks from before corruption
3. Attendance data: SELECT COUNT(*) FROM attendance WHERE date = "2026-04-09"
   Expected: Normal attendance count
```
- ✅ Success: Data appears correct, complete
- ❌ Failed: Corrupted data still present, restore older backup

**Step 1.5: Production Restore (After Validation)**
```bash
# Once staging validation complete:
gcloud firestore import gs://school-erp-backups/firestore/backup-2026-04-09-12-00 \
  --database school-erp-production \
  --region asia-south1
```
- ⚠️ WARNING: This modifies production data
- Expected: Production Firestore restored to backup point
- Timeline: 5-15 minutes depending on data size
- ✅ Success: Import job complete, data restored
- ❌ Failed: Immediately contact Google Cloud support

**Step 1.6: Verify Production Data Restored**
- Test same queries in production
- Confirm affected records now present
- Confirm no data loss worse than expected
- ✅ Success: Production data validated

---

### CloudSQL (Application Database) Recovery

**Step 2.1: Identify Backup Point**
```bash
# List recent backups:
gcloud sql backups list --instance school-erp-prod-db --limit 10

# Output shows:
# NAME           WINDOW_START_TIME       WINDOW_END_TIME         STATUS
# bkp_20260409   2026-04-09T12:00:00Z    2026-04-09T13:00:00Z    DONE
```
- Find: Backup taken before corruption
- ✅ Success: Backup identified

**Step 2.2: Restore to Staging Instance**
```bash
# Create temporary staging instance from backup:
gcloud sql backups restore bkp_20260408 \
  --backup-instance school-erp-prod-db \
  --backup-configuration school-erp-prod-backup-config
```
- Expected: Staging database created with backup data
- Duration: 5-10 minutes
- ✅ Success: Staging restore complete

**Step 2.3: Test Queries on Staging**
```bash
# Connect to staging:
gcloud sql connect school-erp-staging-db

# Run validation queries:
SELECT COUNT(*) FROM fees WHERE collection_date >= '2026-04-09';
SELECT COUNT(*) FROM students WHERE school_id = 'SC001';
```
- ✅ Success: Data intact, queries work
- ❌ Failed: Use older backup date

**Step 2.4: Production Restore**
⚠️ **This will interrupt cloudSQL service for ~10 minutes**

```bash
# Announce maintenance window first:
# "Scheduled maintenance: database restore 2:00-2:15 PM"

# Perform restore:
gcloud sql backups restore bkp_20260408 \
  --backup-instance school-erp-prod-db \
  --backup-configuration school-erp-prod-backup-config
```
- Duration: 10-15 minutes
- During restore: Application will see connection errors
- Monitoring: Watch error rate increase then decrease
- ✅ Success: Database restored, connections resume

---

## 🔄 Point-in-Time Recovery (For Firestore)

**If you need data from specific timestamp (not full database):**

**Step 3.1: Export specific time range**
```bash
# Export from BigQuery with time filter:
bq extract \
  --destination_format NEWLINE_DELIMITED_JSON \
  school_analytics.firestore_read_2026_04_09 \
  gs://restore-bucket/point-in-time-export.json \
  --where "timestamp = TIMESTAMP('2026-04-09 2:30:00')"
```

**Step 3.2: Import specific documents**
- Parse JSON export
- Identify specific documents to restore
- Re-import only those documents to Firestore
- ✅ Success: Only needed data restored, rest unchanged

---

## 🐛 Troubleshooting

### Issue 1: Restore Operation Fails with "Permission Denied"
**Symptoms:**
```
Error: Permission denied (403)
IAM role: roles/firestore.editor not found
```
**Root Cause:** Service account doesn't have backup restore permissions
**Resolution:**
1. Grant role: `roles/firestore.admin` to service account
2. Grant role: `roles/iam.securityAdmin` if needed
3. Retry restore operation
4. Contact GCP support if persists

---

### Issue 2: Backup Too Old - Data Loss Accepted
**Symptoms:**
```
Error: Backup from 2 days ago, will lose 2 days of data
Decision needed: Restore from 2-day-old backup?
```
**Root Cause:** Only old backups available
**Resolution:**
1. Assess impact: How many records affected?
2. Can you reconstruct data? (from exports, logs)
3. Decision: Restore from old backup OR manual reconstruction
4. Notify affected users of data loss
5. Document lessons learned (backup frequency issue?)

---

### Issue 3: Restored Data Includes Corruption
**Symptoms:**
```
After restore: Still seeing corrupted records
Example: Student with invalid email: "abc@@@"
```
**Root Cause:** Corruption happened before backup was taken
**Resolution:**
1. Restore even older backup (further back in time)
2. Or: Manually clean corrupted data (post-restore)
3. Identify: Root cause of corruption
4. Prevent: Fix code/process to prevent recurrence

---

## 📞 Escalation

**If restore operation stalls (hung for 10+ min):**
- Page DevOps lead + Database admin
- Stop operation if safe (command + C won't harm backups)
- Contact Google Cloud support: "Firestore restore job stalled"

**If data loss confirmed after restore:**
- Notify Lead Architect immediately
- Prepare communication to affected schools
- Activate incident response (RB-002)
- Plan how to rebuild lost data

---

## 📊 Backup Schedule

**Current backup frequency:**
- Firestore: Automated daily at 2:00 AM IST
- CloudSQL: Automated daily at 3:00 AM IST
- BigQuery: Real-time streaming
- Object Storage: All files auto-replicated

**Retention policy:**
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months

**Tested recovery:** Last drill April 2, 2026 ✅

---

## 📝 Recovery Log

Log every data recovery performed:

| Date | Issue | Data Recovered | Duration | Validated | By |
|------|-------|-----------------|----------|-----------|-----|
| 2026-04-09 | Accidental delete | 50 students | 12 min | ✅ | DevOps |
| | | | | | |

---

## 📚 Related Runbooks

- [RB-002: Incident Response](RB-002-Incident-Response.md)
- [RB-004: Failover Procedure](RB-004-Failover.md)

---

## 👥 Ownership

**Process Owner:** DevOps Agent  
**Last Tested:** March 15, 2026  
**Next Test:** April 30, 2026 (monthly drill)
