# Database Migration Runbook

**Version:** 1.0  
**Status:** OPERATIONAL (Week 5+)  
**Last Updated:** April 14, 2026  
**On-Call:** Devops Agent (Infrastructure)  
**Escalation:** Backend Agent (Data Schema)

---

## Overview

This runbook handles migrations of Firestore data, including:
- Schema updates (adding/removing fields)
- Data type changes (string → number)
- Collection restructuring (flat → hierarchical)
- Bulk data imports
- Production backups & recovery

**Key Principles:**
1. Always test migrations locally first
2. Backup before executing on production
3. Use Cloud Firestore transactions for consistency
4. Monitor for data loss or corruption
5. Plan rollback strategy beforehand

---

## Migration Types

### Type 1: Add New Field to All Documents

**Scenario:** Add `lastModifiedBy` field to all student documents

#### Step 1: Create Migration Script

```typescript
// scripts/migrations/add-last-modified-by.ts

import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

async function addLastModifiedBy() {
  const schoolsSnapshot = await db.collection('schools').get();
  
  for (const schoolDoc of schoolsSnapshot.docs) {
    const schoolId = schoolDoc.id;
    const studentsRef = db.collection(`schools/${schoolId}/students`);
    
    const studentsSnapshot = await studentsRef.get();
    console.log(`Processing ${studentsSnapshot.size} students in school ${schoolId}`);
    
    // Process in batches of 500
    let batch = db.batch();
    let batchSize = 0;
    
    for (const studentDoc of studentsSnapshot.docs) {
      batch.update(studentDoc.ref, {
        lastModifiedBy: 'system',
        lastModifiedAt: new Date(),
        migrationId: '2026-04-14-add-last-modified-by'
      });
      
      batchSize++;
      
      if (batchSize >= 500) {
        await batch.commit();
        console.log(`Committed batch of ${batchSize}`);
        batch = db.batch();
        batchSize = 0;
      }
    }
    
    if (batchSize > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchSize}`);
    }
  }
  
  console.log('✓ Migration complete');
}

addLastModifiedBy().catch(console.error);
```

#### Step 2: Test Locally

```bash
# Create Firebase Emulator database
firebase emulators:start --only firestore

# In another terminal:
# 1. Load sample data
npm run firebase:seed:local

# 2. Run migration script
FIREBASE_DATABASE_EMULATOR_HOST=localhost:8080 \
npm run migration:add-last-modified-by

# 3. Verify results
firebase firestore:get schools/TEST_SCHOOL/students/STUDENT_ID

# Expected: lastModifiedBy field present
```

#### Step 3: Backup Production

```bash
# Export Firestore before migration
gcloud firestore export \
  gs://school-erp-backups/pre-migration-2026-04-14 \
  --async

# Monitor export progress
gcloud firestore operations list

# Wait for state="DONE"
```

#### Step 4: Run on Staging

```bash
# Deploy to staging environment
gcloud run deploy school-erp-migration \
  --image gcr.io/[PROJECT_ID]/school-erp-migration:latest \
  --region us-central1 \
  --env-vars ENVIRONMENT=staging

# Monitor logs
gcloud logging read \
  "resource.labels.service_name='school-erp-migration'" \
  --limit=50 --format=json
```

#### Step 5: Production Execution

```bash
# Schedule during low-traffic window (e.g., 2 AM UTC)
gcloud scheduler jobs create app-engine migration-schedule \
  --schedule="0 2 * * *" \
  --http-method=POST \
  --uri=https://school-erp-api.cloud.run/admin/migrations/add-last-modified-by

# Or run immediately:
curl -X POST https://school-erp-api.cloud.run/admin/migrations/add-last-modified-by \
  --header "Authorization: Bearer $(gcloud auth print-access-token)"
```

#### Step 6: Verify Migration

```bash
# Check sample documents
for SCHOOL_ID in school-1 school-2 school-3; do
  echo "School: $SCHOOL_ID"
  gcloud firestore documents list \
    --collection-path="schools/$SCHOOL_ID/students" \
    --limit=1 \
    --format=json | jq '.[] | .fields.lastModifiedBy'
done

# Expected: All documents have lastModifiedBy field
```

---

### Type 2: Change Data Type

**Scenario:** Convert `phone` from string to object with country code

#### Before
```json
{
  "name": "John",
  "phone": "9876543210"
}
```

#### After
```json
{
  "name": "John",
  "phone": {
    "countryCode": "+91",
    "number": "9876543210"
  }
}
```

#### Migration Script

```typescript
async function migratePhoneToObject() {
  const parentsRef = db.collection('parents');
  const snapshot = await parentsRef.get();
  
  let batch = db.batch();
  let count = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    if (typeof data.phone === 'string') {
      // Convert string to object
      batch.update(doc.ref, {
        phone: {
          countryCode: '+91',
          number: data.phone
        }
      });
      
      count++;
      if (count % 500 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`✓ Migrated ${count} phone fields`);
}
```

#### Verification

```bash
# Sample documents before/after
gcloud firestore documents get \
  --document="parents/PARENT_ID"

# Expected output changes from string to nested object
```

---

### Type 3: Bulk Data Import

**Scenario:** Import 500 students from CSV file

#### Step 1: Prepare CSV

```csv
firstName,lastName,email,rollNumber,dateOfBirth,schoolId
Raj,Kumar,raj@example.com,001,2010-01-15,school-123
Priya,Singh,priya@example.com,002,2010-02-20,school-123
```

#### Step 2: Create Import Script

```typescript
import * as fs from 'fs';
import * as csv from 'csv-parse';

async function importStudentsFromCSV(filePath: string) {
  const fileStream = fs.createReadStream(filePath);
  
  const parser = fileStream.pipe(csv.parse({
    columns: true,
    skip_empty_lines: true
  }));
  
  let batch = db.batch();
  let count = 0;
  
  for await (const record of parser) {
    const schoolId = record.schoolId;
    const studentRef = db
      .collection(`schools/${schoolId}/students`)
      .doc();
    
    batch.set(studentRef, {
      firstName: record.firstName,
      lastName: record.lastName,
      email: record.email,
      rollNumber: record.rollNumber,
      dateOfBirth: new Date(record.dateOfBirth),
      createdAt: new Date(),
      importBatch: '2026-04-14',
      status: 'active'
    });
    
    count++;
    
    if (count % 100 === 0) {
      await batch.commit();
      console.log(`Committed ${count} records`);
      batch = db.batch();
    }
  }
  
  if (count % 100 !== 0) {
    await batch.commit();
    console.log(`✓ Total imported: ${count}`);
  }
}
```

#### Step 3: Execute

```bash
# Validate CSV format
npm run validate:csv -- students.csv

# Import to staging first
ENVIRONMENT=staging npm run import:students -- students.csv

# Verify import
gcloud firestore documents list \
  --collection-path="schools/school-123/students" \
  --filter='importBatch = "2026-04-14"' | wc -l

# Expected: 500 documents
```

---

### Type 4: Collection Restructuring

**Scenario:** Move `attendance` from subcollection to top-level collection

#### Before
```
schools/
  └─ school-1/
     └─ attendances/
        ├─ doc1
        ├─ doc2
```

#### After
```
attendance/
  ├─ doc1 (with schoolId field)
  ├─ doc2 (with schoolId field)
```

#### Migration Script

```typescript
async function flattenAttendanceCollection() {
  const attendanceRef = db.collection('attendance');
  const schoolsRef = db.collection('schools');
  
  const schoolsSnapshot = await schoolsRef.get();
  
  for (const schoolDoc of schoolsSnapshot.docs) {
    const schoolId = schoolDoc.id;
    
    // Read subcollection
    const subAttendance = await db
      .collection(`schools/${schoolId}/attendances`)
      .get();
    
    console.log(`Migrating ${subAttendance.size} attendance records for ${schoolId}`);
    
    let batch = db.batch();
    let count = 0;
    
    for (const doc of subAttendance.docs) {
      const data = doc.data();
      
      // Create in top-level collection with schoolId
      const newRef = attendanceRef.doc();
      batch.set(newRef, {
        ...data,
        schoolId,
        oldPath: `schools/${schoolId}/attendances/${doc.id}`,
        migratedAt: new Date()
      });
      
      count++;
      
      if (count % 500 === 0) {
        await batch.commit();
        batch = db.batch();
      }
    }
    
    if (count > 0) {
      await batch.commit();
    }
    
    console.log(`✓ Migrated ${count} records for ${schoolId}`);
  }
}
```

#### Verification & Cleanup

```bash
# Verify new collection has all records
gcloud firestore documents list \
  --collection-path="attendance" | wc -l

# Delete old subcollections (AFTER verification)
gcloud firestore documents delete \
  --collection-path="schools/school-1/attendances" \
  --batch-size=500
```

---

## Pre-Migration Checklist

- [ ] Backup created and verified
- [ ]  Script tested locally
- [ ] Staging migration successful
- [ ] QA signed off on data accuracy
- [ ] Rollback plan documented
- [ ] Team notified of migration window
- [ ] Monitoring alerts configured
- [ ] Product approved data changes

---

## During Migration

### Monitor

```bash
# Watch for errors
watch -n 5 'gcloud logging read \
  "severity=ERROR OR severity=CRITICAL" \
  --limit=10 --format=short'

# Check quota usage
watch -n 10 'gcloud firestore locations list \
  --format="table(displayName, quota)"'

# Verify write throughput
watch -n 10 'gcloud monitoring read \
  --metric-type="firestore.googleapis.com/document/write" \
  --format=json | jq ".[0].point.value"'
```

### Abort if Needed

```bash
# Stop scheduled migration
gcloud scheduler jobs pause migration-schedule

# Restore backup
gcloud firestore import gs://school-erp-backups/pre-migration-2026-04-14

# Notify team
@channel Migration aborted due to [error]. Rolling back to backup.
```

---

## Post-Migration Validation

### Data Integrity Checks

```bash
# 1. Verify counts match
ORIGINAL_COUNT=$(gcloud firestore documents list \
  --collection-path="schools/school-1/students" \
  --filter='createdAt >= "2026-01-01"' | wc -l)

echo "Original students: $ORIGINAL_COUNT"

# 2. Verify fields populated
gcloud firestore documents list \
  --collection-path="schools/school-1/students" \
  --format=json | \
  jq '.[] | select(.fields.lastModifiedBy == null)' | wc -l

# Expected: 0 (all have the field)

# 3. Check for orphaned records
gcloud firestore documents list \
  --collection-path="attendance" \
  --filter='schoolId = ""' | wc -l

# Expected: 0 (all have schoolId)
```

### Application Testing

```bash
# 1. API endpoint test
curl -X GET https://school-erp-api.cloud.run/api/v1/students \
  --header "Authorization: Bearer $TOKEN" \
  --header "X-School-ID: school-123"
# Expected: 200 OK

# 2. Check error logs
gcloud logging read \
  "severity=ERROR" \
  --limit=20 --format=short

# Expected: No migration-related errors

# 3. Monitor performance
# Expected: No latency spike post-migration
```

---

## Rollback Procedure

**If issues detected post-migration:**

```bash
# 1. Stop any ongoing writes to migrated data
gcloud run deploy school-erp-api \
  --update-env-vars=ENABLE_WRITES=false

# 2. Restore Firestore from backup
gcloud firestore restore \
  --backup=projects/school-erp/locations/us-central1/backups/pre-2026-04-14 \
  --async

# 3. Verify restoration
gcloud firestore documents get \
  --document="schools/school-1/students/student-1"

# 4. Re-enable writes
gcloud run deploy school-erp-api \
  --update-env-vars=ENABLE_WRITES=true

# 5. Post incident review
# Contact: #incident-postmortem
```

---

## Common Issues

### Issue: Batch Commit Fails

```
Error: Failed to commit batch (10 ABORTED)
```

**Cause:** Concurrent writes to same documents

**Fix:**
```typescript
// Implement exponential backoff
async function commitWithRetry(batch, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await batch.commit();
      return;
    } catch (error) {
      if (error.code === 'ABORTED') {
        const backoff = Math.pow(2, i) * 1000;
        console.log(`Retry ${i + 1}/${maxRetries} after ${backoff}ms`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      } else {
        throw error;
      }
    }
  }
}
```

---

### Issue: Out of Memory During Migration

**Cause:** Loading entire collection into memory

**Fix:**
```typescript
// Process in smaller chunks
async function processMigrationInChunks(
  collectionPath,
  chunkSize = 100
) {
  let lastDoc = null;
  
  while (true) {
    let query = db.collection(collectionPath).limit(chunkSize);
    
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }
    
    const snapshot = await query.get();
    
    if (snapshot.empty) break;
    
    // Process chunk
    await processBatch(snapshot.docs);
    
    // Move to next chunk
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    // Free memory
    gc(); // Requires --expose-gc flag
  }
}
```

---

## Logging & Audit

### Track All Migrations

```bash
# Log every migration to audit collection
async function logMigration(migrationId, details) {
  await db.collection('system/migrations/history').add({
    migrationId,
    executedAt: new Date(),
    executedBy: process.env.USER,
    environment: process.env.ENVIRONMENT,
    details,
    status: 'completed'
  });
}
```

### Generate Migration Report

```bash
# Query all migrations
gcloud firestore documents list \
  --collection-path="system/migrations/history" \
  --format=json | \
  jq '.[] | {migrationId, executedAt, status}'
```

---

