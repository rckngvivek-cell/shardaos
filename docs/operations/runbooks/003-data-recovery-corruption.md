# Runbook 003: Data Recovery from Corruption

**Last Updated:** April 9, 2026  
**Owner:** DevOps Agent + Backend Agent  
**RTO:** 15 minutes (point-in-time recovery)  
**RPO:** 1 hour (last backup)  

---

## Data Corruption Scenarios

**When data corruption is suspected:**

| Symptom | Likely Cause | Recovery | Time |
|---------|---|---|---|
| Duplicate records (school enrolled 2x) | Transaction not atomic | Restore from backup | 15 min |
| Missing attendance (entire day) | Query got corrupted | Restore missed collection | 30 min |
| Grade values wrong (500 instead of 50) | Data entry bug | Point-in-time restore | 20 min |
| Recursive data loop (student → parent → student) | Schema mismatch | Restore + manual fix | 60 min |
| Payment records lost | Delete accidentally issued | Restore from backup | 15 min |

---

## Quick Diagnosis (2 minutes)

### 1. Confirm Corruption is Real (not just UI bug)

```bash
# Query raw Firestore directly
gcloud firestore query --collection students --limit=1 --format=json | jq .

# If data looks wrong → corruption likely
# If data looks OK → probably UI bug, check frontend code
```

### 2. Scope the Damage

```bash
# How many records affected?
gcloud firestore query --collection grades \
  --where "score > 100" --limit=1000 | wc -l

# How old is the corruption?
# Check audit logs
gcloud logging read \
  'resource.labels.service_name=school-erp-api AND resource.type=firestore' \
  --limit=100 --format=json | jq '.[] | .timestamp'
```

### 3. Decision Tree

```
Is corruption in single document?
├─ YES → Manual fix (edit one record) → 5 min
└─ NO → Is it in one collection?
    ├─ YES → Collection-level restore from backup → 20 min
    └─ NO → Full database restore → 30 min

Is data >24 hours old?
├─ NO → Use hourly backup → 15 min
└─ YES → Use daily backup → 60 min (older data more likely)
```

---

## Recovery Method 1: Single Record Fix (5 min)

**Use when:** 1-5 records are corrupted

```bash
# 1. View current bad record
gcloud firestore documents get grades/student-123-math

# Output:
# {
#   "score": 500,     # WRONG (should be 50)
#   "subject": "math"
# }

# 2. Fix it directly
gcloud firestore documents update grades/student-123-math \
  --update score=50

# 3. Verify fix
gcloud firestore documents get grades/student-123-math
# Should show: "score": 50 ✅

# 4. Alert team
# @here Fixed corrupted grade record (student-123-math)
# Before: score=500, After: score=50
```

---

## Recovery Method 2: Collection-Level Restore (20 min)

**Use when:** Entire collection corrupted (e.g., all 2023 grades wrong)

### Prerequisites:
- [ ] Full Firestore backup exists (daily, at 2 AM IST)
- [ ] Backup is recent enough (< 24 hours old)
- [ ] Can tolerate 1-24 hours of data loss

### Recovery Steps:

```bash
# 1. List available backups
gcloud firestore backups list --database=default

# Output:
# NAME                        STATE     CREATE_TIME
# firestore-2026-04-09         READY     2026-04-09T02:00:00Z
# firestore-2026-04-08         READY     2026-04-08T02:00:00Z
# firestore-2026-04-07         READY     2026-04-07T02:00:00Z

# 2. Choose backup (pick most recent before corruption occurred)
BACKUP_ID="firestore-2026-04-09"

# 3. Restore from backup
# WARNING: This overwrites current data
gcloud firestore restore ${BACKUP_ID} --database=default

# Expected output:
# Restoring from backup... (takes 15-20 minutes)
# Status: CREATING
# ...
# Status: READY (done!)

# 4. Verify data restored
gcloud firestore query --collection grades --limit=5

# Should show clean data (from backup)

# 5. Monitor for corruption return
# Re-apply any manual fixes done after backup
```

---

## Recovery Method 3: Point-in-Time Restore (30 min)

**Use when:** Need exact state from specific timestamp

### Prerequisites:
- [ ] Firestore backups enabled (continuous)
- [ ] Know the time when corruption occurred
- [ ] Can afford 30 minutes of downtime

### Recovery Steps:

```bash
# 1. Identify time when corruption started
# Check monitoring alerts / logs
gcloud logging read \
  'resource.labels.service_name=school-erp-api' \
  --format="table(timestamp, textPayload)" | head -20

# Find timestamp just BEFORE corruption
export RESTORE_TIME="2026-04-09T10:00:00Z"

# 2. List backups available BEFORE that time
gcloud firestore backups list \
  --filter="createTime<${RESTORE_TIME}" \
  --sort-by="createTime" \
  --limit=1

# 3. Restore from backup taken right before corruption
gcloud firestore restore firestore-2026-04-09-0900 --database=default

# 4. Meanwhile, extract uncorrupted data from backups
# (Technical team runs this to minimize data loss)

# 5. Monitor restoration progress
watch gcloud firestore operations list --limit=1

# Until status shows: DONE

# 6. Merge any data from AFTER the restore point
# (gradual approach to minimize loss)
```

---

## Recovery Method 4: Manual Data Export & Reimport (60 min)

**Use when:** Corruption is complex, need surgical fix

### Scenario:
Data structure changed incorrectly (e.g., student → parent link created loops)

### Recovery Steps:

```bash
# 1. Export unaffected collections to BigQuery
gcloud firestore export gs://school-erp-backups/export-2026-04-09 \
  --collection-ids=schools,staff
  # Excludes corrupted "grades" collection

# Expected: gs://school-erp-backups/export-2026-04-09/ (in Cloud Storage)

# 2. Manually fix corrupted data in script
python3 fix_grades.py \
  --input gs://school-erp-backups/export-2026-04-08/grades.json \
  --fix-rule "if parent_id == student_id then delete parent_id"

# Output: gs://school-erp-backups/export-2026-04-09/grades-fixed.json

# 3. Delete corrupted collection from live database
gcloud firestore delete-collection grades --database=default

# 4. Reimport fixed data
gcloud firestore import gs://school-erp-backups/export-2026-04-09 \
  --collection-ids=grades

# 5. Verify
gcloud firestore query --collection grades --limit=5

# 6. Spot-check relationships are correct (no loops)
```

---

## Firestore Backup Strategy

### Automated Daily Backups

**Configuration:**
```
Schedule: Daily at 2:00 AM IST (low-traffic window)
Retention: 30 days (automatic cleanup after 30 days)
Location: gs://school-erp-prod-backups/
Include: All collections (schools, students, attendance, grades, fees)
```

**Verify backup exists:**
```bash
gcloud firestore backups list --format="table(name, state, createTime)"
# Should show: firestore-2026-04-09 READY 2026-04-09T02:00:00Z
```

### Spot-Check Backups (Weekly)

**Every Monday morning:**
```bash
# 1. List recent backups
gcloud firestore backups list --limit=7

# 2. Verify most recent backup is healthy
# (Try to restore to staging, verify data integrity)

# 3. If any backup missing, alert DevOps
# (indicates backup service broken)
```

---

## Data Corruption Prevention

### Audit Logging

**All data writes logged:**
```bash
gcloud logging read \
  'resource.labels.service_name=school-erp-api AND resource.type=firestore' \
  --limit=100 \
  --format="table(timestamp, textPayload, severity)"
```

**Alerts if anomalies detected:**
- Large batch deletes (>1000 records)
- Unexpected schema changes
- Failed transaction retries (>10 in 1 min)

### Validation on Write

```javascript
// Backend: Validate before write
const gradeData = { score: 500 };  // WRONG!

// Validation catches this
if (gradeData.score < 0 || gradeData.score > 100) {
  throw new Error('Invalid score: must be 0-100');
}

// Write only proceeds if valid
await db.collection('grades').doc(gradeId).set(gradeData);
```

### Database Constraints

**Planned for Week 7:**
- Composite indexes for data consistency
- Firestore rules that prevent invalid data
- Change stream validation (reject updates if business logic broken)

---

## Incident Response Checklist

### If Data Corruption Suspected:

- [ ] **STOP all writes to affected collection** (disable API endpoints if needed)
- [ ] Confirm corruption is real (query Firestore directly)
- [ ] Scope damage (how many, how old?)
- [ ] Choose recovery method (single record vs. collection vs. full restore)
- [ ] Execute recovery (15-60 min depending on method)
- [ ] Verify data integrity (spot-check records are correct)
- [ ] Resume API endpoints (re-enable writes)
- [ ] Monitor for 1 hour (any repeat corruption?)
- [ ] Write RCA: what caused it, how to prevent?
- [ ] Schedule follow-up (improve validation? change audit?)

---

## Firestore Backup Restore to Staging (Test Recovery)

**Do this monthly to ensure backups work:**

```bash
# 1. Create backup of staging database (if it exists)
# Restore to separate database called "staging-recovered"

gcloud firestore recover firestore-backup-name \
  --destination-database=staging-recovered

# 2. Test recovery (run queries)
gcloud firestore query --collection schools --database=staging-recovered

# 3. Compare with production (spot-check counts match)
BACKUP_DOCS=$(gcloud firestore query --collection students --database backup-prod | wc -l)
PROD_DOCS=$(gcloud firestore query --collection students --database default | wc -l)

if [ "$BACKUP_DOCS" -eq "$PROD_DOCS" ]; then
  echo "✅ Backup integrity verified: $PROD_DOCS records"
else
  echo "❌ ALERT: Backup count mismatch! Backup: $BACKUP_DOCS, Prod: $PROD_DOCS"
fi

# 4. Delete staging-recovered database
gcloud firestore delete-database staging-recovered
```

---

## Recovery Time Summary

| Scenario | Method | Time | Data Loss |
|----------|--------|------|-----------|
| 1-5 records wrong | Manual edit | 5 min | None |
| Single collection corrupted | Restore collection | 20 min | < 1 day |
| Multiple collections corrupted | Full restore | 30 min | < 1 hour |
| Complex data structure broken | Export-fix-import | 60 min | Depends on fix |

---

## When to Escalate

- **Data loss >10,000 records:** Escalate to Lead Architect
- **Data loss >100,000 records:** Activate war room, notify CEO
- **Backup failed >7 days:** Escalate to infrastructure team immediately
- **Unable to restore:** Executive escalation, possible service downtime communication

---

## Related Documents

- [Firestore Security Rules](../database/firestore-security-rules.md)
- [Production Incident Response](./001-production-incident-response.md)
- [Monitoring & Alerting](../monitoring-observability.md)

