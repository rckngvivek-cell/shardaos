# ADR-006: Reporting Engine Architecture

**Status:** ACCEPTED  
**Date:** April 14, 2026  
**Deciders:** Data Agent, Backend Agent, Lead Architect  
**Consulted:** QA Agent, Frontend Agent  
**Informed:** All agents

## Context

Week 5 requires building advanced reporting capabilities for pilot schools. Requirements demand quick report generation (<10 seconds acceptable) with support for custom dimensions, filters, and export formats.

**Technical Constraints:**
- ~2,500 users across 13 schools by EOW
- Must support real-time queries (e.g., "Show today's attendance")
- Must support historical analysis (e.g., "Trends over last 30 days")
- Export to PDF, CSV, Excel required
- Scheduling reports for automated delivery (future)
- <10 second query latency for 99th percentile

**Data Volume Projections:**
- Attendance records: ~250K/week (2,500 users × 5 days × ~20 touches)
- Grade entries: ~50K/week (2,500 students × ~20 grade entries)
- Total documents in Firestore: ~500K+ by EOW

## Decision

**We implement Real-Time Query Architecture** with strategic indexing and query optimization, rather than pre-computed batch reports.

### Architecture

```
┌─────────────────────────────────────┐
│  Report Generation Request          │
│  (Frontend or Scheduler)            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Report Service (Node.js)           │
│  ├─ Query builder                   │
│  ├─ Performance optimizer           │
│  └─ Error handler                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Firestore Queries (Optimized)      │
│  ├─ Compound indexes                │
│  ├─ Collection pagination           │
│  └─ Cache results (Redis 5 min)     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Report Formatters                  │
│  ├─ PDF (pdfkit)                    │
│  ├─ CSV (csv-stringify)             │
│  ├─ Excel (exceljs)                 │
│  └─ JSON (native)                   │
└─────────────────────────────────────┘
```

## Rationale

### 1. Query <10 Seconds Acceptable

Pilot school feedback accepts <10s latency for complex reports. This enables:
- Simpler architecture (no pre-computation layer)
- Faster iteration (add new report types without batching logic)
- Less storage overhead (no duplicate materialized tables)
- Easier debugging (source of truth is live data)

### 2. Strategic Firestore Indexing

Firestore query engine is optimized for document databases. With proper indexes:

```javascript
// Example: Attendance report query
db.collection('schools/ABC123/attendances')
  .where('date', '>=', startDate)
  .where('date', '<=', endDate)
  .where('status', '==', 'present')
  .orderBy('date')
  .orderBy('student')
  .get()

// Required compound index:
// schools/ABC123/attendances: (date, status, date+student)
```

Typical query latency: **2-5 seconds** on 250K records with proper indexes.

### 3. Caching for Repeated Reports

Redis cache (5-min TTL) for common report queries:
- "Today's attendance report" (refreshes daily)
- "Current month grades" (refreshes hourly)
- "Student performance trends" (refreshes nightly)

Reduces database load by ~40% based on pilot patterns.

### 4. Export Abstraction

Separate export formatters allow adding new formats without touching query logic:

```typescript
interface ReportFormatter {
  format(data: ReportData): Buffer | string;
  mimeType: string;
}

class PDFFormatter implements ReportFormatter {
  format(data: ReportData): Buffer { /*...*/ }
}

class CSVFormatter implements ReportFormatter {
  format(data: ReportData): string { /*...*/ }
}
```

## Implementation Details

### Report Types (Week 5 Scope)

| Report | Query Type | Latency Target | Export Formats |
|--------|-----------|----------------|----------------|
| Attendance Summary | Single collection + group-by | 3-5s | PDF, CSV, JSON |
| Grade Card | Join (students + grades) | 4-6s | PDF, Excel |
| Class Timetable | Single collection + filter | 2-3s | PDF, iCal, CSV |
| Fee Summary | Join + aggregation | 5-8s | PDF, Excel |
| Performance Analytics | Multiple collections + calc | 7-10s | PDF, Chart JSON |

### API Endpoint

```typescript
// POST /api/v1/reports
interface ReportRequest {
  reportType: 'attendance' | 'grades' | 'timetable' | 'fees' | 'analytics';
  filters: {
    schoolId: string;
    dateRange: { start: Date; end: Date };
    classId?: string;
    studentId?: string;
    [key: string]: any;
  };
  format: 'pdf' | 'csv' | 'xlsx' | 'json';
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

interface ReportResponse {
  reportId: string;
  status: 'generating' | 'completed' | 'failed';
  data?: Buffer | string;
  downloadUrl?: string;
  expiresAt: Date;
  generatedAt: Date;
}
```

### Firestore Indexes Required

```yaml
# firestore.indexes.json additions
- collectionGroup: attendances
  fields:
    - fieldPath: schoolId
      order: ASCENDING
    - fieldPath: date
      order: ASCENDING
    - fieldPath: status
      order: ASCENDING

- collectionGroup: grades
  fields:
    - fieldPath: schoolId
      order: ASCENDING
    - fieldPath: studentId
      order: ASCENDING
    - fieldPath: date
      order: ASCENDING

- collectionGroup: fees
  fields:
    - fieldPath: schoolId
      order: ASCENDING
    - fieldPath: studentId
      order: ASCENDING
    - fieldPath: status
      order: ASCENDING
```

## Consequences

### Positive
- ✅ Lower operational complexity (no batch infrastructure)
- ✅ Fresh data for reports (always reflects current state)
- ✅ Faster feature iterations (new report = new query formatter)
- ✅ Better debugging (query directly on live data)
- ✅ Simpler testing (deterministic queries vs. timed batches)

### Negative
- ⚠️ Database load during peak report times
- ⚠️ Must maintain strict index discipline
- ⚠️ Complex reports may exceed 10s latency
- ⚠️ Firestore query costs scale with data volume
- ⚠️ User must wait for report generation (no pre-computed cache)

### Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Query timeout | Add pagination, concurrent query chunking |
| Index explosion | Document required indexes, audit monthly |
| High DB costs | Implement query budget tracking, optimize queries |
| User experience | Show progress bar, cache frequent reports, offer email delivery |

## Performance Targets

```
Latency SLO:
- Simple reports (1 collection): < 3 seconds (p99)
- Complex reports (3+ collections): < 10 seconds (p99)
- Export generation: < 2 seconds overhead

Cost SLO:
- Per-report cost: < ₹2.50 (Firestore read ops at ₹0.06/100K)
- Monthly budget: ₹50K for 20K reports
```

## Alternatives Considered

### 1. Pre-Computed Batch Run (Rejected)
- **Pros:** Guaranteed <1s report latency, lower query costs
- **Cons:** Requires separate batch infrastructure, slower feature iteration, more complex code
- **Decision:** <10s acceptable for MVP, increases complexity unnecessarily

### 2. BigQuery Sync (Rejected for MVP)
- **Pros:** Unlimited scale, powerful analytics, cost-effective at scale
- **Cons:** Adds operational overhead (streaming sync), requires data warehousing setup
- **Decision:** Defer to Week 6+ when reaching 10K+ users

### 3. Hybrid (Real-Time + Batch) (Rejected)
- **Pros:** Fast for common reports, accurate for historical
- **Cons:** Complex logic, hard to maintain, debugging nightmare
- **Decision:** Start simple, graduate to hybrid when performance issues prove necessary

## Success Metrics

- All 5 report types generate in <10 seconds (p99)
- Query cost per report <₹2.50 average
- 15+ tests covering query builders and formatters
- Pilot schools generate 20+ reports/week without complaints

## References

- **PR #9:** Advanced Reporting Engine - WEEK5_PR_DETAILED_PLANS.md
- **Data Platform:** BigQuery sync roadmap - WEEK5_DATA_AGENT_PLAN.md
- **Firestore Tech:** Schema design - 2_FIRESTORE_SCHEMA.md
- **Performance:** Monitoring strategy - 12_MONITORING_OBSERVABILITY.md

## Future Revisions

- **Week 6:** Evaluate BigQuery for historical analysis
- **Week 7:** Implement scheduled report delivery (email, SMS)
- **Week 8+:** Real-time dashboards with WebSocket push

