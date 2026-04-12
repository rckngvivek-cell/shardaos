# Report Generation Errors Runbook

**Version:** 1.0  
**Status:** OPERATIONAL (Week 5)  
**Last Updated:** April 14, 2026  
**On-Call:** Data Agent  
**Escalation:** Lead Architect (Architecture Impact)

---

## Report Service Overview

**Architecture:**
- Endpoint: `POST /api/v1/reports`
- Engine: Real-time Firestore queries
- Formats: PDF, CSV, Excel, JSON
- SLA: <10s for complex queries

**Dependencies:**
- Firestore (data source)
- Redis (query cache, 5-min TTL)
- PDFKit / ExcelJS (export)
- Cloud Logging (audit)

---

## Quick Diagnostics

### Report Generation Failed?

**Check 1: Verify Firestore Connectivity**
```bash
# Test Firestore connection
gcloud firestore collections list --database=production

# Expected: List of collections (schools, users, etc.)
# If error: Network or auth issue
```

**Check 2: Verify Firestore Indexes**
```bash
# List all indexes
gcloud firestore indexes composite list

# Required indexes should be present:
# - (schoolId, date, status)
# - (schoolId, studentId, date)
# - etc. (see ADR-006)
```

**Check 3: Check Report Service Logs**
```bash
# View recent errors
gcloud logging read \
  "resource.type='cloud_run_revision' AND \
   jsonPayload.operation='report_generation' AND \
   severity=ERROR" \
  --limit=20 --format=json
```

**Check 4: Redis Cache Status**
```bash
# Verify Redis connection
redis-cli ping
# Expected: PONG

# Check cache hit rate
redis-cli info stats | grep keyspace_hits
# Expected: High hit ratio (>70%) if many reports recurring
```

---

## Common Issues & Fixes

### Issue: "Query Timeout - Exceeded 10 seconds"

**Symptom:** Report request returns 504 after ~10 seconds

**Error Log:**
```json
{
  "severity": "ERROR",
  "message": "Query timeout: Exceeded timeout of 10000ms",
  "operation": "report_generation",
  "reportType": "attendance",
  "queryTime": 10234,
  "status": "TIMEOUT"
}
```

**Possible Causes & Solutions:**

#### 1. Missing Firestore Index

```bash
# Check if required index exists
gcloud firestore indexes composite list | \
  grep -i "schoolId.*date.*status"

# If not found: Index creation in progress or failed
gcloud firestore indexes composite list --format=json | \
  jq '.[] | select(.name | contains("sms_logs"))'
```

**Fix:**
```bash
# Recreate index manually
gcloud firestore indexes composite create \
  --collection-id=attendances \
  --field-config=fieldPath="schoolId",order=ASCENDING \
  --field-config=fieldPath="date",order=ASCENDING \
  --field-config=fieldPath="status",order=ASCENDING

# Wait for indexing to complete (~5-30 min)
gcloud firestore indexes composite list --filter='state:CREATING'
```

#### 2. Large Dataset Without Pagination

```bash
# Check query parameters
# If filtering: schools/LARGE_SCHOOL/attendances
# For 250K records: Query likely to timeout

# Solution: Client-side pagination implemented?
# Report request should include:
# - limit: 1000 (max records per query)
# - offset: 0, 1000, 2000... (page through results)
```

**Fix:**
```typescript
// Implement pagination in report service
async function queryWithPagination(query, pageSize = 1000) {
  const results = [];
  let cursor = null;
  
  while (true) {
    const pageQuery = query.limit(pageSize);
    if (cursor) {
      pageQuery.startAfter(cursor);
    }
    
    const snapshot = await pageQuery.get();
    if (snapshot.empty) break;
    
    results.push(...snapshot.docs);
    cursor = snapshot.docs[snapshot.docs.length - 1];
    
    if (snapshot.docs.length < pageSize) break;
  }
  
  return results;
}
```

#### 3. Complex Report (Multiple Collection Joins)

```bash
# Identify which report type is slow
gcloud logging read \
  "jsonPayload.operation='report_generation' AND \
   jsonPayload.queryTime > 5000" \
  --limit=20 --format=json | \
  jq '.[] | {reportType: .jsonPayload.reportType, queryTime: .jsonPayload.queryTime}'

# Typical times:
# - Simple (attendance): 2-3s ✓
# - Complex (grades + student): 4-6s ✓
# - Very complex (fees + linked students): 7-10s ⚠️ (at limit)
```

**Fix: Optimize Query Logic**
```typescript
// Instead of:
// 1. Get all attendances → 1-2s
// 2. For each, get student details → 5-8s
// Total: 7-10s ❌

// Do:
// 1. Batch query student details (once) → 1s
// 2. Query attendances → 1-2s
// 3. Merge in memory → <100ms
// Total: 2-3s ✓

async function optimalAttendanceReport(schoolId, dateRange) {
  // Batch fetch all students (1 query)
  const students = await db
    .collection(`schools/${schoolId}/classes`)
    .get()
    .then(classDocs => 
      Promise.all(classDocs.docs.map(c => 
        c.ref.collection('students').get()
      ))
    )
    .then(studentDocs => 
      studentDocs.flatMap(doc => doc.docs.map(d => ({
        id: d.id,
        name: d.data().name
      })))
    ); // 1 second

  // Single query for attendances
  const attendance = await db
    .collection(`schools/${schoolId}/attendances`)
    .where('date', '>=', dateRange.start)
    .where('date', '<=', dateRange.end)
    .get(); // 1 second

  // Merge in-memory
  const report = attendance.docs.map(doc => ({
    ...doc.data(),
    studentName: students.find(s => s.id === doc.data().studentId)?.name
  })); // <100ms

  return report; // Total: 2s
}
```

---

### Issue: "Firestore Document Quota Exceeded"

**Symptom:** Error when accessing report data

**Error Log:**
```json
{
  "severity": "ERROR",
  "message": "Quota exceeded: Document read operations",
  "code": "RESOURCE_EXHAUSTED"
}
```

**Cause:** Firestore read quota exceeded for the day

**Firestore Quota Limits:**
- Reads per day: 50 billion (for standard tier)
- For pilot schools: Should never hit this
- Typical usage: <1 billion reads/month

**Diagnostics:**
```bash
# Check quota usage
gcloud firestore locations list

# View detailed metrics
gcloud monitoring time-series list \
  --filter='metric.type="firestore.googleapis.com/operation/read"'

# Expected: <1% of quota used
```

**Fix:**
```bash
# If quota exceeded, file support ticket
# Usually indicates:
# 1. Inefficient query (N+1 problem)
# 2. Rate limiting configured incorrectly
# 3. Monitoring/test queries too aggressive

# Temporary mitigation: Enable caching
const redis = new Redis();
async function getCachedReport(reportType, filters) {
  const cacheKey = `report:${reportType}:${JSON.stringify(filters)}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Query if not cached
  const report = await generateReport(reportType, filters);
  
  // Cache for 5 minutes
  await redis.setex(cacheKey, 300, JSON.stringify(report));
  
  return report;
}
```

---

### Issue: "Export Format Error - PDF Generation Failed"

**Symptom:** Report generated but PDF export fails

**Error Log:**
```json
{
  "severity": "ERROR",
  "message": "Error generating PDF export",
  "format": "pdf",
  "pdfkitError": "Font not found: Arial"
}
```

**Possible Causes & Solutions:**

#### 1. Missing Font Files

```bash
# Check PDFKit font directory
ls -la /app/fonts/

# Expected: Arial.ttf, Helvetica.ttf, etc.

# If missing:
# Install fonts in Docker image
docker exec school-erp-api \
  apt-get install fonts-liberation
```

**Fix:**
```dockerfile
# Dockerfile: Add font installation
FROM node:18
RUN apt-get update && \
    apt-get install -y fonts-liberation fonts-dejavu && \
    rm -rf /var/lib/apt/lists/*
COPY . .
RUN npm ci --production
CMD ["npm", "start"]
```

#### 2. Invalid Data for PDF Export

```bash
# Check report data structure
gcloud logging read \
  "jsonPayload.reportType='performance' AND \
   jsonPayload.format='pdf'" \
  --limit=5 --format=json | \
  jq '.[] | {data: .jsonPayload.data, error: .jsonPayload.error}'

# Look for: incomplete data, null values, etc.
```

**Fix:**
```typescript
// Validate data before PDF export
function validateReportData(data) {
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('Report data is empty');
  }
  
  // Check for required fields
  const requiredFields = ['studentName', 'marks', 'date'];
  data.forEach((row, idx) => {
    requiredFields.forEach(field => {
      if (!(field in row)) {
        throw new Error(`Missing field '${field}' in row ${idx}`);
      }
    });
  });
  
  return true;
}
```

#### 3. Memory Limit During PDF Generation

```bash
# Check Cloud Run memory
gcloud run services describe school-erp-api

# Look for: memory: 512Mi (default)
# Large reports may exceed this

# If generating 50K-row report → need 1-2GB RAM
```

**Fix:**
```bash
# Increase Cloud Run memory
gcloud run deploy school-erp-api \
  --memory=2Gi \
  --cpu=2
```

---

### Issue: "Incorrect Report Data - Wrong Calculations"

**Symptom:** Report shows wrong totals or percentages

**Example:**
```
Attendance Report:
- Student: Raj Kumar
- Presents: 45 (Should be 40)
- Percentage: 92% (Should be 82%)
```

**Diagnostics:**
```bash
# Compare with raw Firestore data
gcloud firestore documents list \
  --collection-path='schools/SCHOOL_ID/attendances' \
  --filter='studentId = "STUDENT_ID" AND date >= 2026-04-01'

# Manually count present records
gcloud firestore documents list \
  --collection-path='schools/SCHOOL_ID/attendances' \
  --filter='studentId = "STUDENT_ID" AND status = "present"' | \
  wc -l

# Compare with report total
```

**Fix: Debug Report Generation Logic**
```typescript
// Add detailed logging
async function generateAttendanceReport(schoolId, studentId, dateRange) {
  // 1. Get attendance records
  const query = db
    .collection(`schools/${schoolId}/attendances`)
    .where('studentId', '==', studentId)
    .where('date', '>=', dateRange.start)
    .where('date', '<=', dateRange.end);
  
  const snapshot = await query.get();
  console.log(`Total records: ${snapshot.size}`);
  
  // 2. Count by status
  const byStatus = {};
  snapshot.docs.forEach(doc => {
    const status = doc.data().status;
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  console.log('By status:', byStatus);
  
  // 3. Calculate percentage
  const presents = byStatus['present'] || 0;
  const total = snapshot.size;
  const percentage = (presents / total) * 100;
  
  console.log(`Present: ${presents}/${total} = ${percentage.toFixed(1)}%`);
  
  return {
    presents,
    total,
    percentage
  };
}

// Call and verify
const report = await generateAttendanceReport(...);
console.log('Final report:', report);
```

**Common Calculation Bugs:**
```typescript
// ❌ Wrong: Including only 'present', forgetting 'absent'
const presents = data.filter(d => d.status === 'present').length;
const total = data.length; // Includes 'leave', 'medical leave', etc.
const percentage = (presents / total) * 100; // Wrong denominator

// ✓ Correct: Define clearly what counts
const presentCount = data.filter(d => d.status === 'present').length;
const presentCount = data.filter(d => d.status === 'absent').length;
const totalSchoolDays = data.length - leaveCount; // Exclude leaves
const percentage = (presentCount / totalSchoolDays) * 100;
```

---

### Issue: "Excel Export - Corrupted File"

**Symptom:** Excel file downloads but won't open; corruption error

**Cause:** ExcelJS encoding issue or incomplete write

**Fix:**
```typescript
// Ensure Excel file is properly flushed
async function generateExcelReport(data) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report');

  // Add headers
  worksheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
  ];

  // Add rows
  data.forEach(row => {
    worksheet.addRow(row);
  });

  // CRITICAL: Write to buffer completely
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Verify buffer size
  if (buffer.length === 0) {
    throw new Error('Excel buffer is empty');
  }

  return buffer;
}
```

---

## Performance Optimization

### Slow Report But Not Timing Out

**Symptom:** Report takes 8-9 seconds (acceptable but slow)

```bash
# Profile query performance
gcloud logging read \
  "jsonPayload.operation='report_generation'" \
  --format=json | \
  jq '.[] | select(.jsonPayload.queryTime > 5000) | 
    {reportType, queryTime, cacheHit}'

# If cacheHit=false consistently: Queries not reusing cache
```

**Optimization:**
```typescript
// 1. Enable caching for common reports
const CACHE_TTL = {
  'daily_attendance': 3600,      // 1 hour
  'monthly_grades': 7200,        // 2 hours
  'annual_performance': 86400    // 1 day
};

// 2. Implement query batching
async function batchReports(reportIds) {
  // Instead of individual queries:
  const allData = await Promise.all(
    reportIds.map(id => generateReport(id))
  );
  return allData;
}

// 3. Use Firestore collection group queries
// Instead of subdocuments, use top-level collection for index efficiency
// Schools might have: schools/S1/attendances/doc1
// Re-index if needed: attendance collection at root level
```

---

## Monitoring Dashboard

**Key Metrics:**

```yaml
Report Generation SLO:
  p50 (median): <3 seconds
  p95: <8 seconds
  p99: <10 seconds
  Success rate: 99%+

Export Format Distribution:
  PDF: 40%
  CSV: 35%
  Excel: 20%
  JSON: 5%

Error Breakdown:
  Timeout (<2%): With index optimization
  Format error (<1%): With font fixes
  Query error (<1%): With validation
```

---

## Escalation

### Level 1: Troubleshoot (10 min)

Use diagnostics above.

### Level 2: Check Firestore (15 min)

```bash
# Check Firestore dashboard
# https://console.cloud.google.com/firestore

# View query performance metrics
gcloud monitoring read \
  --metric-type=firestore.googleapis.com/operation_latencies
```

### Level 3: Escalate (30 min+)

Contact Data Agent if:
- Query performance degrading
- Firestore quota exceeded
- Data inconsistency detected

---

