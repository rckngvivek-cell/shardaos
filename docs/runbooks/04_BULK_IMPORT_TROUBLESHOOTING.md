# Bulk Import Troubleshooting Guide

**Status:** ACTIVE  
**Last Updated:** April 10, 2026  
**Maintained By:** Backend Agent  
**Audience:** Support team, School admins, School IT leads

---

## Quick Diagnosis

**"Import stuck/not responding"**
→ Check: session status endpoint (see Section 1.1)

**"Imported X records but expected Y"**
→ Check: error report endpoint (see Section 2.1)

**"Data merged incorrectly (duplicates not detected)"**
→ Check: merge strategy review (see Section 3.2)

**"Import file rejected immediately"**
→ Check: file format validation (see Section 4.1)

---

## Section 1: Import Status Checks

### 1.1 Check Import Progress

**Does the import session exist?**
```bash
# Check recent imports
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import?limit=10" \
  -H "Authorization: Bearer {token}"

# Response: List of recent imports with dates, statuses
{
  "imports": [
    {
      "sessionId": "import-uuid-123",
      "status": "processing",
      "createdAt": "2026-04-10T10:35:00Z",
      "recordsDetected": 500,
      "recordsProcessed": 250,
      "progress": 50
    }
  ]
}
```

**Is the import still running?**
```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import/{sessionId}/status" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "sessionId": "import-uuid",
  "status": "processing|completed|failed",
  "progress": {
    "phase": "parsing|deduplicating|persisting",
    "recordsProcessed": 250,
    "recordsPending": 250,
    "eta": 8000  # milliseconds
  }
}
```

**Action if no progress for 30 seconds:**
- Phase 1 (parsing): Check CSV file is valid UTF-8
- Phase 2 (dedup): Check Redis cache is accessible (DevOps alert)
- Phase 3 (persist): Check Firestore quota not exceeded

### 1.2 Import Performance Baseline

| Phase | Records | Target Time | Alert If |
|-------|---------|-------------|----------|
| Parse | 500 | <200ms | >500ms |
| Dedup | 500 | <500ms | >1s |
| Persist | 500 | <5s | >30s |
| **Total** | **500** | **<5s UI** | **>30s** |

**If actual > alert threshold:**
```bash
# Step 1: Identify bottleneck
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import/{sessionId}/metrics" \
  -H "Authorization: Bearer {token}"

# Look at phase durations
{
  "metrics": {
    "parseTime": 150,
    "deduplicateTime": 800,  # ← Too slow! (>500ms)
    "persistTime": 5200
  }
}

# If dedup slow: 
→ Section 2.3 (Duplicate detection issues)

# If persist slow:
→ Check Firestore quota + Section 1.3
```

### 1.3 Firestore Quota Check

**Is Firestore write quota exceeded?**
```bash
# From GCP Console: Firestore → Data → Quotas
# OR from monitoring dashboard
# Alert: "Write operations exceeding quota"

# If yes: 
→ Contact DevOps, quota increase required (1-2 hours)
→ Retry import after quota increase
```

---

## Section 2: Error Analysis

### 2.1 Review Import Errors

**Get detailed error report:**
```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import/{sessionId}/errors" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "sessionId": "import-uuid",
  "status": "completed",
  "recordsProcessed": 500,
  "recordsSuccessful": 495,
  "recordsFailed": 5,
  "errors": [
    {
      "row": 42,
      "field": "email",
      "value": "john@example.com",
      "error": "Invalid email format",
      "action": "SKIPPED"
    },
    {
      "row": 88,
      "field": "phone",
      "value": "9876543210",
      "error": "Phone already exists",
      "action": "MERGED"
    }
  ]
}
```

### 2.2 Common Error Types & Solutions

#### Error: "Invalid email format"
```
Cause: Email doesn't match pattern "user@domain.com"
Examples: "john@" or "john.example.com" or "john@exam ple.com" (space)

Solution:
1. Review row in CSV file
2. Check school's email domain (e.g., all should be @schoolname.edu)
3. Correct CSV and re-upload
4. If many errors: Review entire email column data quality
```

#### Error: "Invalid phone format"
```
Cause: Phone not 10 digits, or contains non-numeric characters
Examples: "98765" (5 digits) or "9876543210x" (contains letter)

Solution:
1. Board expects Indian 10-digit numbers: xxxxxxxxxx
2. Remove country code (+91 or 0 prefix if present)
3. Ensure no spaces or dashes: "9876-543210" → "9876543210"
4. Correct CSV and re-upload
```

#### Error: "Phone already exists (merged)"
```
Cause: Student/teacher with this phone already in system
Action: System automatically merged data (not error, info message)

Review:
→ Get merged records: GET /api/v1/schools/{schoolId}/bulk-import/{sessionId}/merged
→ Check if merge is correct (new data filled gaps in existing)
→ If merge wrong: Manual fix or request rollback
```

#### Error: "Row has missing required field"
```
Cause: CSV missing column (e.g., firstName, email)
Examples: 
- CSV has columns: firstName, email, phone
- Missing: lastName, dateOfBirth

Solution:
1. Add missing column to CSV file
2. Fill in all rows with appropriate data
3. Re-upload

Required fields by import type:
- Students: firstName, lastName, email, phone, class
- Teachers: firstName, lastName, email, phone
- Classes: className, grade, section
```

### 2.3 Duplicate Detection Issues

**Symptom: "Import says 5 duplicates but I only expected 2"**

```bash
# Review what was detected as duplicate
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import/{sessionId}/duplicates" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "duplicates": [
    {
      "row": 88,
      "newRecord": { "email": "john@school.com", "phone": "9876543210" },
      "existingRecord": { "id": "student-123", "email": "john@school.com" },
      "matchType": "email",
      "action": "merged"
    },
    {
      "row": 150,
      "newRecord": { "email": "jane@school.com" },
      "existingRecords": [
        { "id": "student-456", "email": "jane@old.com", "phone": "9876543211" }
      ],
      "reason": "same name + phone match",
      "action": "flagged_for_review"
    }
  ]
}
```

**If duplicates seem wrong (false positives):**

1. **Check duplicate detection strategy:**
   ```
   System checks: EMAIL first, then PHONE
   If both match → merge
   If just email OR phone: merge if existing record is incomplete
   If existing record complete: flag for review, don't auto-merge
   ```

2. **Possible causes of false positives:**
   - Same person has multiple accounts (should merge)
   - Schools with similar names (check schoolId)
   - Common names + same phone number (could be family members)

3. **Solution options:**
   ```
   a) Auto-merge strategy too aggressive?
      → Use mergeStrategy: "skip-duplicate" instead
      → Re-upload with ?mergeStrategy=skip-duplicate
   
   b) Specific merges are wrong?
      → Manually fix: PUT /api/v1/schools/{schoolId}/students/{id}
      → Or: Rollback entire import, fix CSV, re-upload
   
   c) Need smarter logic?
      → Create issue for Backend Agent (rare)
      → Duplicate detection tuning (not in scope)
   ```

---

## Section 3: Fix Strategies

### 3.1 Partial Success (Some records failed)

**Scenario: 500 records, 495 inserted, 5 failed**

```
Strategy 1: Fix errors, re-upload just the failed records
├─ Export error list (CSV format)
├─ Fix the 5 rows
├─ Upload again (dedup will skip already-inserted)
└─ Verify count increased from 495 to 500

Strategy 2: Do nothing (accept 495 records)
├─ Review the 5 errors
├─ If errors unavoidable (e.g., bad data): accept
├─ Manually create the 5 records if critical

Strategy 3: Rollback all, fix CSV, re-upload
├─ Risky: May disrupt other changes in between
├─ Only use if import was first operation
├─ POST /api/v1/schools/{schoolId}/bulk-import/{sessionId}/rollback
```

**Recommended: Strategy 1 (Fix + Re-upload)**

```bash
# 1. Download errors as CSV
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import/{sessionId}/errors?format=csv" \
  -o failed_rows.csv

# 2. Edit failed_rows.csv in spreadsheet (fix the 5 rows)

# 3. Re-upload (system smart enough to skip 495 already inserted)
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import" \
  -F "file=@fixed_rows.csv" \
  -H "Authorization: Bearer {token}"

# 4. Verify: should get 5 new inserts + 495 skipped
```

### 3.2 Merge Conflicts

**Symptom: "System merged records when I didn't want it to"**

Option A: Accept merge (data integrity correct)
```
Example:
Existing: { email: 'john@school.com', firstName: 'John' }
New: { email: 'john@school.com', firstName: 'John', lastName: 'Doe', phone: '987...' }
Result: Existing record updated with lastName + phone ✓ Correct
```

Option B: Reject merge, keep both separate accounts
```
This shouldn't happen (bad data), but if needed:

1. Manual fix: Delete the merged record
2. Create new separate account
3. Adjust duplicate detection strategy for next import
```

Option C: Use different merge strategy
```bash
# Re-upload with different strategy
POST /api/v1/schools/{schoolId}/bulk-import?mergeStrategy=skip-duplicate

# mergeStrategy options:
# - "smart-merge": default, merges incomplete records ✓
# - "skip-duplicate": skip any duplicate, don't merge
# - "error-on-duplicate": fail entire import if any duplicate
```

### 3.3 Rollback (Last Resort)

**Warning: Rollback removes ALL inserted records from this import. Use only if critical error.**

```bash
# Rollback entire import session
curl -X DELETE "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import/{sessionId}" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "sessionId": "import-uuid",
  "status": "rolled-back",
  "recordsReverted": 495,
  "timestamp": "2026-04-10T10:40:00Z"
}

# Consequences:
├─ All 495 inserted records deleted
├─ All 3 merged records reverted to old data
├─ Audit trail shows rollback reason
└─ You must re-upload to restore

# When to use:
├─ Wrong schoolId used (schools mixed)
├─ CSV had incorrect data (all need fixing)
├─ System error caused corrupted inserts (rare)

# When NOT to use:
├─ Just 5 records failed (use Strategy 1 instead)
├─ Duplicates detected (expected, use review instead)
└─ Unsure about merge (check audit trail first)
```

---

## Section 4: Validation & Prevention

### 4.1 CSV File Format Checks

**Before uploading, verify CSV:**

✓ **Encoding:** UTF-8 only
```
If CSV created in Excel on Windows:
1. File → Save As
2. Format: "CSV UTF-8 (Comma delimited)"
3. Not "CSV (Comma delimited)" [Windows-1252]
```

✓ **Header row:** Exact column names match
```
Required for Students: firstName, lastName, email, phone, class
Example:
---
firstName,lastName,email,phone,class
John,Doe,john@school.com,9876543210,10A
Jane,Smith,jane@school.com,9876543211,10A
```

✓ **No extra spaces**
```
Bad: " firstName ", "lastName ", "email"
Good: "firstName", "lastName", "email"

Bad: "John ", "Doe"
Good: "John", "Doe"
```

✓ **File size:** Max 50MB
```
If size > 50MB:
1. Split CSV into multiple files (500 records each)
2. Upload in batches
3. System dedup handles merges across batches
```

✓ **Special characters:** Use UTF-8 encodings
```
OK: Hindi (नमस्ते), Gujarati (નમસ્તે), Tamil (வணக்கம்)
Not OK: Mojibake (corrupted characters)

If seeing corrupted: Check file encoding (likely Windows-1252)
```

### 4.2 Pre-Upload Validation Preview

**Before uploading, get preview (no data inserted):**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/bulk-import/preview" \
  -F "file=@students.csv" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "recordsDetected": 500,
  "errors": [
    {
      "row": 42,
      "field": "email",
      "error": "Invalid email format"
    }
  ],
  "warnings": [
    {
      "row": 15,
      "message": "Phone matches existing student (likely merge needed)"
    }
  ],
  "estimatedDuration": 5000  # milliseconds
}

# If errors: Fix CSV and re-upload
# If warnings: Confirm merge strategy and proceed
# If clean: Proceed with actual import
```

---

## Section 5: Monitoring & Alerts

**Automated alerts triggered:**

| Alert | Trigger | Action |
|-------|---------|--------|
| Import slow | Phase 1 > 500ms | Check CSV encoding |
| Import timeout | Phase 3 > 30s | Check Firestore quota |
| High error rate | \>10% errors | Review data quality |
| Quota exceeded | Write limit hit | Contact DevOps |

**Dashboard:** [Internal Monitoring Link]

---

## Contacts & Escalation

| Issue | Contact | Response Time |
|-------|---------|---|
| CSV upload failing | Support chat | Immediate |
| Data merged incorrectly | Backend Agent | 30 min |
| Import stuck for 1+ min | DevOps Agent | 15 min |
| Need rollback | Lead Architect + DevOps | 30 min |
| Feature request/change | Backend Agent | Planning cycle |

---

## FAQ

**Q: Can I upload same CSV twice to "sync"?**
A: No. System will skip already-inserted records but try to re-merge. Use rollback first if re-uploading.

**Q: Deleted 100 imported students, can I recover?**
A: No. Deletes are permanent. Rollback only works immediately after import, before other changes.

**Q: Can I import 40,000 records?**
A: Technically yes, but recommend splitting: 50x uploads of 800 each. System handles dedup across batches.

**Q: Import "succeeded" but UI shows 0 records?**
A: Check: Correct schoolId? User has permission? Try refresh/clear cache. If persists: Check error report.

