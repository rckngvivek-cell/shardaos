# WEEK 7 ADR ROADMAP: Module 3 (Exam & Assessment System) - Architectural Decisions

**Status:** IN PROGRESS  
**Week:** April 21-25, 2026  
**Lead:** Documentation Agent  
**Target:** 7 ADRs completed by Friday EOD

## Completed ADRs

### ✅ ADR-7-1: Exam Schema Design (Firestore vs BigTable) - DELIVERED
- **Status**: APPROVED
- **File**: [docs/adr/ADR-7-1-exam-schema-design.md](docs\adr\ADR-7-1-exam-schema-design.md)
- **Date**: April 21, 2026
- **Key Decision**: Firestore collections + BigQuery for analytics (NOT BigTable)
- **Rationale**: Scales to 10K+ concurrent students, reduces ops burden, linear cost growth
- **Impact**: Enables real-time exam submissions with <2s analytics latency
- **Approvers**: Backend Architect, Data Architect
- **Signed Off**: ✓ Lead Architect

### ✅ ADR-7-2: Concurrent Submission Handling (Queue vs Direct) - DELIVERED
- **Status**: APPROVED
- **File**: [docs/adr/ADR-7-2-concurrent-submission-handling.md](docs\adr\ADR-7-2-concurrent-submission-handling.md)
- **Date**: April 21, 2026
- **Key Decision**: Direct processing with Firestore transactions (NO message queue)
- **Rationale**: <1s latency for student feedback, simpler ops, no queue complexity
- **Impact**: Students see grades instantly (UX-critical for exams)
- **Approvers**: Backend Architect, Lead Architect
- **Signed Off**: ✓ Lead Architect, QA Agent

---

## Week 7 ADR Schedule

### DAY 1 (April 21) - COMPLETE ✓
- ✓ **ADR-7-1**: Exam Schema Design
- ✓ **ADR-7-2**: Concurrent Submission Handling
- ✓ **Roadmap**: This document

---

### DAY 2 (April 22) - REAL-TIME ANALYTICS & GRADING

#### ADR-7-3: Real-Time Analytics Pipeline Architecture
**Due by 2:00 PM | Owner**: Data Agent

**Context:**
- Teachers need instant dashboards showing exam performance
- School admin needs class/section analytics within 5 minutes
- National board needs aggregated pan-India results daily
- BigQuery queries must complete <2 seconds for interactive dashboards

**Decision Points to Address:**
1. **Streaming vs Batch**: Pub/Sub streaming (instant) vs daily batch (cost-efficient)?
   - **Likely Decision**: Hybrid approach
   - *Streaming*: Real-time metrics (pass rate, avg score) via Pub/Sub → BigQuery Streaming Inserts
   - *Batch*: Final aggregates (percentile, discrimination index) via Dataflow jobs (hourly)
   - *Rationale*: Instant insights for teachers (streaming), cost-efficient aggregations (batch)

2. **Data Refresh Strategy**: Incremental updates vs full rebuild?
   - *Decision*: Incremental with daily snapshots (idempotent design)

3. **Real-time Dashboard Updates**: WebSocket + API polling?
   - *Decision*: Pub/Sub Direct→Frontend (Server-Sent Events) for <1 second update latency

**Key Metrics:**
- Dashboard query latency: p99 <2 seconds
- Analytics freshness: <5 minutes for real-time metrics
- Cost per exam: <$0.05 analytics compute

**Artifacts:**
- Pub/Sub topic configuration
- Dataflow job templates (hourly aggregation)
- BigQuery materialized views for dashboard queries
- SSE implementation for live dashboard updates

---

#### ADR-7-4: Exam Grading Strategy (Auto vs Manual vs Hybrid)
**Due by 5:00 PM | Owner**: Backend Agent

**Context:**
- MCQ/True-False questions: Must auto-grade instantly (0.1s per answer)
- Short-answer questions: Can auto-grade with keyword matching (needs teacher review)
- Essay questions: Require teacher grading (assign to queue, expect 24-48h)
- Grading scale: Teachers should customize (% thresholds → A/B/C/D/F)

**Decision Points to Address:**
1. **Question Type → Grading Method Mapping**
   - MCQ → Auto-grade (instant, 100% confident)
   - True/False → Auto-grade (instant)
   - Multiple-answer MCQ → Auto-grade (all must match)
   - Short-answer → Flag for teacher review but show provisional grade
   - Essay/Long-answer → Queue for teacher assignment
   - Matching/Drag-drop → Auto-grade with tolerance

2. **Grading Scale Customization**
   - Simple percentage-based (80%=A, 70%=B, etc.)
   - Matrix grading (per-question rubric)
   - Custom formulas (e.g., "Hindi 30% + Maths 50% + Science 20%")
   - *Decision*: Support all three, defaulting to percentage-based for MVP

3. **Partial Credit**
   - Allow fractional scores (e.g., 1.5/2 on True-False)?
   - *Decision*: No (keep scores atomic), support only in teacher grading

4. **Curve/Adjustment**
   - Admin ability to curve grades post-submission?
   - *Decision*: Yes, via admin UI (recalculate and notify students)

**Key Metrics:**
- Auto-grade accuracy: >99% (validated against manual grading sample)
- Auto-grade latency: p99 <100ms
- Teacher review turnaround: 24-48 hours SLA

**Artifacts:**
- Grading algorithm pseudocode
- Question type → method mapping table
- Rubric template library (essay grading)
- Teacher assignment queue design

---

### DAY 3 (April 23) - DATA ORGANIZATION & EXPORT

#### ADR-7-5: Question Bank Organization Strategy
**Due by 2:00 PM | Owner**: Backend Agent + Data Agent

**Context:**
- 10,000+ questions across subjects, grades, difficulty levels
- Teachers need to search/filter by: subject, topic, difficulty, learning standard
- Board exams require sectioned question papers (Section A: MCQ, Section B: Essay)
- Reusability: Same question should appear in multiple exams

**Decision Points to Address:**
1. **Hierarchical Organization**
   - Option A: Strict hierarchy (Grade → Subject → Chapter → Topic → Question) 
     - *Pro*: Clear navigation
     - *Con*: Question fits only one place; limits reuse
   - Option B: Flat with tags (single collection, multiple tags per question)
     - *Pro*: Single question can have: [12th, Physics, Quantum Mechanics, Hard, JEE]
     - *Con*: Search/filter complexity increases
   - **Decision**: Flat with tags (ADR-7-5)

2. **Tag Schema**
   ```json
   {
     "id": "q-001",
     "tags": {
       "grade": ["12th"],
       "subject": ["Physics"],
       "chapter": ["Quantum Mechanics"],
       "difficulty": ["Hard"],
       "standard": ["CBSE", "ICSE"],
       "learningObjective": ["CO2", "CO3"],
       "skillLevel": ["Application", "Analysis"],
       "bloomLevel": ["3-Apply", "4-Analyze"],
       "custom": ["VerbalAbility", "CriticalThinking"]
     }
   }
   ```

3. **Sectioning Strategy** (for exam papers)
   - Create virtual "sections" at exam level (not question level)
   - Section references subset of questions with order
   ```json
   {
     "sectionId": "sec-001",
     "name": "Section A: Objective",
     "questionIds": ["q-001", "q-002", "q-003"],
     "instructions": "Answer all questions",
     "markingScheme": { "type": "per-question", "marks": 1 }
   }
   ```

**Key Metrics:**
- Search latency: p99 <500ms for 10K questions
- Filter combinations: >1000 unique tag combinations (analytics)
- Reuse rate: 40% of questions appear in 2+ exams

**Artifacts:**
- Tag taxonomy definition
- Firestore collection schema with indexes
- Search algorithm (Algolia vs Firestore full-text)
- Section template library (exam paper formats)

---

#### ADR-7-6: Student Result Export Strategy (Formats & Frequency)
**Due by 5:00 PM | Owner**: Backend Agent + Frontend Agent

**Context:**
- Teachers export results for grade entry (CSV/Excel)
- Parents download result cards (PDF)
- Schools bulk-export for official records (Excel)
- BigQuery can generate reports but export format negotiation needed

**Decision Points to Address:**
1. **Export Formats**
   - CSV: Simple, bulk-import friendly (for grade entry)
   - Excel (XLSX): Rich formatting, formulas, multiple sheets
   - PDF: Formatted result card (single student or batch)
   - JSON: API response format (for integrations)
   - **Decision**: Support all four; default to Excel for teachers

2. **Export Frequency**
   - Real-time: Export immediately after grading (any time)
   - Scheduled: Auto-export daily at 11:59 PM
   - **Decision**: Real-time on-demand only (no scheduled, reduces storage)

3. **Privacy in Exports**
   - Anonymize student names in classroom exports?
   - Redact parental email from parent-facing exports?
   - **Decision**: Full data for authenticated users; mask data in shared links

4. **Scale Limits**
   - Max rows per export: 10,000 (avoid timeouts)
   - Queue large exports (>10K rows) to background job
   - **Decision**: Sync up to 5K, queue beyond

```typescript
// Export API endpoint
POST /api/v1/exams/{examId}/results/export
Body: { format: "xlsx", filter: { classId: "...", anonymize: false } }
Response: { exportId: "exp-001", status: "pending", downloadUrl: "..." }
```

**Key Metrics:**
- Export generation latency: p99 <5 seconds for 1000 rows
- Success rate: >99.5%
- File size efficiency: <50KB per 1000 rows (Excel compression)

**Artifacts:**
- Export template specs for each format
- Privacy masking rules per export type
- PDF template (result card design)
- Background job configuration for large exports

---

### DAY 4 (April 24) - INTERNATIONALIZATION & MOBILE

#### ADR-7-7: Multi-Language Support Strategy (App-level vs DB-level)
**Due by 2:00 PM | Owner**: Frontend Agent + Backend Agent

**Context:**
- India is multilingual: English, Hindi, Tamil, Telugu, Marathi, etc.
- Teachers may teach in regional language; exams available in mother tongue
- Student can switch language mid-exam (maintain progress)
- Audit trail must record language chosen (for compliance)

**Decision Points to Address:**
1. **Translation Storage**
   - Option A: DB-level (translate questions/content in Firestore)
     - *Pro*: Single source of truth
     - *Con*: Document size grows; search complexity (search in multiple languages)
   - Option B: App-level (store base content in English, translate on-the-fly)
     - *Pro*: Smaller documents, simpler search, CDN-friendly (cache translations)
     - *Con*: Translation library dependency, fallback needed if key missing
   - **Decision**: App-level with i18n library (Vue i18n or React I18next)

2. **Translation Management**
   - Who translates: In-house team? Crowdsourced? Third-party (Google Translate API)?
   - **Decision**: In-house for critical paths (quiz instructions, grades); crowdsourced for question content

3. **RTL Language Support** (Arabic, Urdu if added later)
   - CSS flexbox RTL handling
   - Form field alignment
   - **Decision**: Not MVP; design for future (BEM CSS namespacing ready)

4. **Locale Fallback Chain**
   - User picks: Ta-IN (Tamil, India)
   - Missing in Ta-IN? Fall back to Ta (Tamil, generic)
   - Missing in Ta? Fall back to En (English)
   - **Decision**: Three-tier fallback (language-region → language → English)

```typescript
// Frontend i18n configuration
const messages = {
  'en': { exam: { submit: 'Submit Exam' } },
  'hi': { exam: { submit: 'परीक्षा जमा करें' } },
  'ta': { exam: { submit: 'தேர்வு சமர்ப்பிக்கவும்' } }
};

const i18n = createI18n({
  locale: userPreference.language,
  fallbackLocale: 'en',
  messages
});

// Usage in template
{{ $t('exam.submit') }} // Auto-fallback to 'en' if missing
```

**Key Metrics:**
- Translation coverage: >95% of UI strings (other 5% tech terms)
- Language switch latency: <100ms (page re-render)
- Bundle size per language: <50KB (gzipped)

**Artifacts:**
- i18n library configuration
- Translation file structure (JSON/YAML)
- Locale selector UI component
- Language support roadmap (priority languages)

---

### DAY 5 (April 25) - SECURITY & QUALITY

#### ADR-7-8: Proctoring & Academic Integrity (Out of Scope for MVP; Placeholder)
**Due by 2:00 PM (Optional for Day 5) | Owner**: Security Architect (TBD)

**Context:**
- Future requirement: Detect cheating via camera/screen monitoring
- Use ML to flag suspicious patterns (identical answers, unusual timing)
- Generate compliance report for schools

**Note**: Module 3 MVP does NOT include proctoring. This ADR documents future architecture.

**Placeholder Decisions** (for Phase 2):
1. **Proctoring Backend**: Proctortrack vs custom OpenCV solution?
2. **Data Privacy**: Where to store video (encrypted storage)?
3. **Alert Thresholds**: Sensitivity tuning (false-positive vs false-negative trade-off)

---

## ADR Review & Approval Process

### Draft → Submitted → Approved Workflow

| ADR | Owner | Due | Review Lead | Status | Approval | Notes |
|-----|-------|-----|-------------|--------|----------|-------|
| ADR-7-1 | Backend | 4/21 | Lead Arch | ✓ Delivered | ✓ Approved | Signed off by Backend + Data |
| ADR-7-2 | Backend | 4/21 | Lead Arch | ✓ Delivered | ✓ Approved | Signed off by Backend + QA |
| ADR-7-3 | Data | 4/22 | Lead Arch | — Pending | — Pending | Due 2 PM |
| ADR-7-4 | Backend | 4/22 | Lead Arch | — Pending | — Pending | Due 5 PM |
| ADR-7-5 | Backend | 4/23 | Lead Arch | — Pending | — Pending | Due 2 PM |
| ADR-7-6 | Backend | 4/23 | Lead Arch | — Pending | — Pending | Due 5 PM |
| ADR-7-7 | Frontend | 4/24 | Lead Arch | — Pending | — Pending | Due 2 PM |
| ADR-7-8 | Security | 4/25 | Lead Arch | — Optional | — Optional | Future (placeholder) |

### Approval Criteria

Each ADR must have:
- [ ] Problem statement clearly articulated
- [ ] At least 3 alternatives considered & rejected with reasoning
- [ ] Chosen decision with clear rationale
- [ ] Consequences (positive & negative)
- [ ] Implementation roadmap with code samples
- [ ] Cost/performance impact analysis
- [ ] Testing strategy
- [ ] Sign-off from 2+ technical leads
- [ ] Links to related documents

### Sign-off Authority

- **Technical Decision**: Backend Architect, Data Architect, DevOps Lead
- **Security Decision**: Security Architect, Compliance Lead
- **Final Approval**: Lead Architect (veto/approve on PRI review)
- **Communication**: Documentation Agent sends approval notification to all agents

---

## Output Checklist

### Week 7 Deliverables

By **Friday 5:00 PM (April 25)**:

- [x] ADR-7-1: Exam Schema Design (APPROVED)
- [x] ADR-7-2: Concurrent Submission Handling (APPROVED)
- [ ] ADR-7-3: Real-Time Analytics Pipeline (TBD)
- [ ] ADR-7-4: Grading Strategy (TBD)
- [ ] ADR-7-5: Question Bank Organization (TBD)
- [ ] ADR-7-6: Result Export (TBD)
- [ ] ADR-7-7: Multi-Language Support (TBD)
- [x] ADR Roadmap & Schedule (THIS DOCUMENT)

### File Locations
```
docs/adr/
  ├── ADR-7-1-exam-schema-design.md ✓
  ├── ADR-7-2-concurrent-submission-handling.md ✓
  ├── ADR-7-3-real-time-analytics-pipeline.md
  ├── ADR-7-4-grading-strategy.md
  ├── ADR-7-5-question-bank-organization.md
  ├── ADR-7-6-result-export-strategy.md
  ├── ADR-7-7-multi-language-support.md
  └── ADR-7-8-proctoring-academic-integrity.md (optional)

docs/
  └── WEEK7_ADR_ROADMAP.md (this file) ✓
```

### Index Updates
- [x] Update [docs/adr/.../ADR_INDEX.md](docs/ADR_INDEX.md) with Week 7 links
- [ ] Send approval notifications to #documentation Slack channel
- [ ] Archive completed ADRs to docs/adr/archive/ (for searchability)

---

## Technical References

Related documents informing these ADRs:

- [2_FIRESTORE_SCHEMA.md](2_FIRESTORE_SCHEMA.md) - Current schema design
- [24_DATA_PLATFORM.md](24_DATA_PLATFORM.md) - BigQuery configuration
- [45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md](45_WEEK3_MASTER_IMPLEMENTATION_GUIDE.md) - Exam module architecture
- [5_TESTING_FRAMEWORK.md](5_TESTING_FRAMEWORK.md) - QA strategy reference
- [8_ERROR_HANDLING.md](8_ERROR_HANDLING.md) - Error classification for ADR-7-2

---

## Dependencies & Blockers

### Week 7 Blockers (None identified)

**Green Light**: All ADRs can proceed independently; no cross-dependencies.

### Handoff to Week 8

By end of Week 7:
- 7 ADRs approved and merged to main branch
- All agents updated on architectural decisions
- Implementation ready to start (Feature flags, code generation templates)

---

## Contact & Questions

| Role | Slack | Availability |
|------|-------|--------------|
| Documentation Agent (ADR Lead) | @docagent | Daily 9 AM-5 PM IST |
| Lead Architect (Approver) | @leadarch | Daily 10 AM-6 PM IST |
| Backend Agent | @backendagent | Daily 9 AM-5 PM IST |
| Data Agent | @dataagent | Daily 10 AM-4 PM IST |

---

## Revision History

| Date | Change | Author |
|------|--------|--------|
| 2026-04-21 | Initial roadmap created; ADR-7-1 & 7-2 delivered | Documentation Agent |
| 2026-04-22 | ADR-7-3 & 7-4 due (pending) | — |
| 2026-04-23 | ADR-7-5 & 7-6 due (pending) | — |
| 2026-04-24 | ADR-7-7 due (pending) | — |
| 2026-04-25 | ADR-7-8 optional (pending) | — |

---

**Status**: 2 of 7 ADRs APPROVED ✓ | 5 ADRs IN PROGRESS | On track for Friday 5PM deadline
