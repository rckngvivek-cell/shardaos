# ADR-013: Timetable Conflict Detection

**Status:** ACCEPTED  
**Date:** April 10, 2026  
**Deciders:** Backend Agent, Lead Architect, QA Agent  
**Consulted:** Product Agent, DevOps Agent  
**Informed:** All agents

## Context

Week 5 introduces timetable management for schools. Teachers and administrators need to create and manage class schedules across multiple departments. Data integrity is critical: a single conflict could cascade into student complaints, teacher conflicts, and parent escalations.

**Requirements:**
- Detect 3 types of conflicts in real-time:
  1. **Teacher conflict:** Same teacher teaching 2 classes at same time
  2. **Room conflict:** Same room booked twice at same time
  3. **Class conflict:** Same class with 2 subjects at same time
- Validate on create/update (fail-fast approach)
- Support bulk timetable uploads (CSV import)
- Allow admin override for planned conflicts (split sessions)
- Audit trail for all conflicts detected
- Performance: <500ms validation for typical entry

**Constraints:**
- Must not slow down timetable entry UI (<500ms round trip)
- Firestore queries should be indexed (no full table scans)
- Support multi-day timetables (Mon-Fri, varied periods)
- Batch updates must validate all before persisting any

## Decision

**We implement on-save validation using indexed Firestore queries with in-memory conflict detection.**

### Rationale

#### 1. On-Save vs On-Query Validation

| Aspect | On-Save | On-Query |
|--------|---------|----------|
| **When caught** | At entry time | When viewing timetable |
| **User friction** | High (immediate feedback) | Low (delayed discovery) |
| **Data integrity** | Guaranteed | Probabilistic |
| **Performance** | <500ms (per entry) | <1s (per view) |
| **Audit trail** | Yes (catches error) | No (after-the-fact) |
| **Real-time** | Can prevent bad data | Reactive |

**Decision: On-Save Validation** because:
- Data integrity: Schools expect their timetables to always be valid
- User experience: Immediate feedback → faster corrections
- Compliance: Audit trail useful for accreditation
- Prevention vs cure: Avoid invalid state entirely

#### 2. Conflict Detection Algorithm

**Rule 1: Teacher cannot teach 2 classes at same time**

```
Teacher Schedule:
[09:00-10:00] Class 10A - Math (Room A1)
[09:00-10:00] Class 10B - Science (Room A2)  ← CONFLICT!
                                
Detection Logic:
1. Get all entries for teacher in same day
2. Check each entry against new entry's time window
3. If any overlap: REJECT
```

**Rule 2: Room cannot be booked twice at same time**

```
Room Schedule (Room A1):
[09:00-10:00] Class 10A - Math
[09:00-10:00] Class 10B - English  ← CONFLICT!

Detection Logic:
1. Get all entries for room in same day
2. Check each entry against new entry's time window
3. If any overlap: REJECT
```

**Rule 3: Class cannot have 2 subjects at same time**

```
Class 10A Schedule:
[09:00-10:00] Math (Teacher: A)
[09:00-10:00] English (Teacher: B)  ← CONFLICT!

Detection Logic:
1. Get all entries for class in same day
2. Check each entry against new entry's time window
3. If any overlap: REJECT
```

**Time Window Overlap Logic:**

```typescript
// Two time windows overlap if:
// - Start1 < End2 AND Start2 < End1

function timeWindowsOverlap(
  start1: string,  // "09:00"
  end1: string,    // "10:00"
  start2: string,
  end2: string
): boolean {
  const [h1, m1] = start1.split(':').map(Number);
  const [h2, m2] = end1.split(':').map(Number);
  const [h3, m3] = start2.split(':').map(Number);
  const [h4, m4] = end2.split(':').map(Number);
  
  const min1 = h1 * 60 + m1;
  const min2 = h2 * 60 + m2;
  const min3 = h3 * 60 + m3;
  const min4 = h4 * 60 + m4;
  
  return min1 < min4 && min3 < min2;  // overlap exists
}
```

#### 3. Firestore Query Strategy (Indexed for Performance)

**Collections Structure:**

```
/schools/{schoolId}/timetable-entries/
  {entryId}:
    - day: 'monday'
    - period: 1
    - startTime: '09:00'
    - endTime: '10:00'
    - teacherId: 'teacher-123'
    - classId: 'class-456'
    - roomId: 'room-789'
    - subjectId: 'subject-001'

/schools/{schoolId}/index-teacher-timetable/
  {teacherId}-{day}:
    - entries: [entryId1, entryId2, ...]

/schools/{schoolId}/index-room-timetable/
  {roomId}-{day}:
    - entries: [entryId1, entryId2, ...]

/schools/{schoolId}/index-class-timetable/
  {classId}-{day}:
    - entries: [entryId1, entryId2, ...]
```

**Indexes Required:**

```
Collection: timetable-entries
├─ Index 1: (teacherId, day) - for teacher conflicts
├─ Index 2: (roomId, day) - for room conflicts
└─ Index 3: (classId, day) - for class conflicts
```

**Query Optimization:**

```typescript
async function checkConflicts(entry) {
  const {
    teacherId,
    roomId,
    classId,
    day,
    startTime,
    endTime,
    schoolId
  } = entry;

  // Parallel queries (fast!)
  const [
    teacherEntries,
    roomEntries,
    classEntries
  ] = await Promise.all([
    // Query 1: All entries for this teacher on this day
    db.collection('schools/${schoolId}/timetable-entries')
      .where('teacherId', '==', teacherId)
      .where('day', '==', day)
      .get(),

    // Query 2: All entries for this room on this day
    db.collection('schools/${schoolId}/timetable-entries')
      .where('roomId', '==', roomId)
      .where('day', '==', day)
      .get(),

    // Query 3: All entries for this class on this day
    db.collection('schools/${schoolId}/timetable-entries')
      .where('classId', '==', classId)
      .where('day', '==', day)
      .get()
  ]);

  // In-memory conflict detection (fast!)
  const conflicts = [];

  // Check teacher conflicts
  for (const doc of teacherEntries.docs) {
    if (timeWindowsOverlap(startTime, endTime, doc.startTime, doc.endTime)) {
      conflicts.push({
        type: 'TEACHER_CONFLICT',
        existingEntry: doc.id,
        reason: 'Teacher already teaching another class'
      });
    }
  }

  // Check room conflicts
  for (const doc of roomEntries.docs) {
    if (timeWindowsOverlap(startTime, endTime, doc.startTime, doc.endTime)) {
      conflicts.push({
        type: 'ROOM_CONFLICT',
        existingEntry: doc.id,
        reason: 'Room already booked'
      });
    }
  }

  // Check class conflicts
  for (const doc of classEntries.docs) {
    if (timeWindowsOverlap(startTime, endTime, doc.startTime, doc.endTime)) {
      conflicts.push({
        type: 'CLASS_CONFLICT',
        existingEntry: doc.id,
        reason: 'Class already has another subject'
      });
    }
  }

  return conflicts;
}
```

#### 4. Performance Analysis

**Typical School Timetable:**
- 50 classes
- 30 teachers
- 10 rooms
- 6 periods per day
- Total entries: 50 × 6 = 300 entries per day

**Query Performance:**
- Query 1 (teacher day): 6 docs scanned (teacher teaches 6 classes max) = 10ms
- Query 2 (room day): 6 docs scanned = 10ms
- Query 3 (class day): 1 doc scanned = 5ms
- Parallel: max(10, 10, 5) = 10ms
- In-memory overlap check: 15-20ms
- **Total: <50ms** ✓

**At scale (10,000 schools):**
- Firestore can handle (no degradation with collection size)
- Indexes prevent full table scans

#### 5. Admin Override Mechanism

**Scenario:** School wants split sessions (same teacher, consecutive time slots counted as continuous)

```typescript
// Option 1: Allow teacher for split sessions
POST /api/v1/schools/{schoolId}/timetable-entries
{
  teacherId: 'teacher-123',
  classId: 'class-456',
  startTime: '09:00',
  endTime: '10:00',
  day: 'monday',
  allowTeacherOverlapReason: 'Split session (9-10 for 10A, 10:15-11:15 for 10C)',
  overrideApprovedBy: 'admin-userId',
  overrideComments: 'Approved by HOD'
}
```

**Override Rules:**
- Can only be used 2x per day per teacher (prevents abuse)
- Must include approval + comment
- Logged to audit trail
- Cannot override room conflicts (physical resource limitation)

#### 6. Bulk Upload Validation

**For CSV bulk timetable import:**

```
// Validate ALL rows before inserting ANY
const validation = await validateBulkTimetable(csvData, schoolId);

if (validation.hasConflicts) {
  // Don't insert anything
  return {
    status: 'error',
    errors: [
      { row: 5, error: 'Teacher conflict: Mr. Kumar already teaching at 09:00' },
      { row: 8, error: 'Room conflict: Room A1 already booked' }
    ]
  };
}

// All valid: insert as batch
await db.batch()
  .set(doc1)
  .set(doc2)
  ...
  .commit();
```

## Implementation

### File Structure

```
apps/api/src/modules/timetable/
├── controllers/
│   └── timetable.controller.ts           // GET/POST/PUT/DELETE
├── services/
│   ├── timetable.service.ts              // CRUD operations
│   ├── conflict-detector.service.ts      // Conflict validation
│   └── bulk-uploader.service.ts          // CSV import
├── utils/
│   ├── time-window.ts                    // Overlap detection
│   ├── firestore-queries.ts              // Indexed queries
│   └── conflict-formatter.ts             // Error messages
├── types/
│   └── timetable.types.ts
└── __tests__/
    ├── conflict-detector.test.ts         (<50ms target)
    ├── time-window.test.ts               (overlap logic)
    ├── bulk-uploader.test.ts             (CSV validation)
    └── timetable.integration.test.ts     (end-to-end)
```

### API Contract

```typescript
// POST create timetable entry (immediate validation)
POST /api/v1/schools/{schoolId}/timetable
{
  day: 'monday',
  period: 1,
  startTime: '09:00',
  endTime: '10:00',
  teacherId: 'teacher-123',
  classId: 'class-456',
  roomId: 'room-A1',
  subjectId: 'subject-math'
}

Response (ON CONFLICT):
HTTP 400 Bad Request
{
  success: false,
  error: 'CONFLICT_DETECTED',
  conflicts: [
    {
      type: 'TEACHER_CONFLICT',
      message: 'Teacher Mr. Kumar is already assigned to Class 10C (09:00-10:00)',
      suggestionDetails: 'Try moving to 10:00-11:00 or assigning a different teacher'
    }
  ]
}

Response (SUCCESS):
HTTP 201 Created
{
  success: true,
  entryId: 'entry-uuid',
  timeSlot: '09:00-10:00',
  message: 'Entry created successfully'
}

// PUT update entry (revalidate all 3 rules)
PUT /api/v1/schools/{schoolId}/timetable/{entryId}
{
  startTime: '09:00',
  endTime: '10:00',
  // validates updated entry for conflicts
}

// GET teacher schedule
GET /api/v1/schools/{schoolId}/timetable/teacher/{teacherId}?day=monday
Response:
{
  teacher: { id: 'teacher-123', name: 'Mr. Kumar' },
  schedule: [
    { period: 1, startTime: '09:00', endTime: '10:00', class: '10A', subject: 'Math' },
    { period: 2, startTime: '10:00', endTime: '11:00', class: '10C', subject: 'Math' }
  ],
  hasConflicts: false
}
```

### Example Conflict Scenarios

**Scenario 1: Teacher conflict prevented**
```
Admin tries to create:
- Teacher: Kumar
- Class: 10B
- Time: 09:00-10:00 (Monday)

System checks:
- Query teacher Kumar's Monday entries
- Finds: 10A from 09:00-10:00
- Overlap detected!
- REJECTED: 'Teacher Kumar already teaching 10A'

Admin solution: Move to 10:00-11:00 or assign different teacher
```

**Scenario 2: Room conflict prevented**
```
Entry created:
- Room: A1
- Time: 10:00-11:00
- Tuesday

Later, admin tries to create:
- Room: A1
- Time: 10:15-11:15
- Tuesday

Overlap check: 10:15-11:15 overlaps with 10:00-11:00
REJECTED: 'Room A1 already booked'
```

## Testing Strategy

**Unit Tests: Time Window Logic**
- [09:00, 10:00] overlaps [09:30, 10:30] → true
- [09:00, 10:00] overlaps [10:00, 11:00] → false (no overlap)
- [09:00, 10:00] overlaps [08:30, 09:00] → false (no overlap)
- Edge: Exactly adjacent times → false

**Integration Tests: Full Validation**
- Create entry → valid → persisted
- Create conflicting entry → rejected → not persisted
- Update entry → re-validates all 3 rules
- Bulk CSV → validates all before inserting any

**Performance Tests:**
- Validation on 300-entry timetable: <50ms
- Parallel queries complete in <20ms

## Monitoring & Alerting

**Metrics:**
- Conflict detection rate (% of entries rejected)
- Average validation time (p50, p95)
- Common conflict types distribution

**Alerts:**
- Validation time > 500ms (index issue)
- Conflict rate > 15% (admin entering invalid data)

---

**Consequences & Trade-offs:**

✅ **Positive:**
- Data integrity guaranteed at source
- Fast feedback to users
- Audit trail for compliance

⚠️ **Negative:**
- Can't import invalid timetable for manual review later
- Admin override adds complexity

---

**Next Steps:**
- Day 1: Implement time window overlap logic & unit tests
- Day 2: Implement Firestore queries & integration tests
- Day 3: Implement admin override & bulk upload validation
- Day 4-5: Performance testing at scale
