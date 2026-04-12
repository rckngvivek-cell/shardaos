# Timetable Conflict Validation Runbook

**Status:** ACTIVE  
**Last Updated:** April 10, 2026  
**Maintained By:** Backend Agent  
**Audience:** School admins, Timetable coordinators, Principals

---

## Quick Diagnosis

**"Can't create timetable entry - getting error"**
→ Check: Conflict type (Section 1), Resolution steps (Section 2)

**"Entry created but shows multiple teachers for same class"**
→ Check: Validation wasn't run, may need manual fix (Section 2.3)

**"Import rejected - too many conflicts"**
→ Check: CSV validation, conflict resolution (Section 3)

**"Need to override validation for split sessions"**
→ Check: Admin override procedure (Section 4)

**"Report shows 3 conflicts but I only need to fix 1"**
→ Check: Conflict visualization, investigate root cause (Section 1.4)

---

## Section 1: Understanding Conflicts

### 1.1 Three Conflict Types

**Type 1: Teacher Conflict**
```
Same teacher teaching 2+ classes at exact same time

❌ CONFLICT EXAMPLE:
├─ Teacher: Mr. Kumar
├─ Period: 09:00-10:00, Monday
├─ Existing: Class 10A (Math) - Room A1
└─ Trying to add: Class 10B (Science) - Room A2
   → ERROR: Teacher already teaching 10A at this time!

✓ RESOLUTION:
├─ Option A: Change new entry to 10:00-11:00 (different time)
├─ Option B: Assign different teacher to 10B
└─ Option C: Use 15-min overlap if split session planned
```

**Type 2: Room Conflict**
```
Same room booked twice at exact same time

❌ CONFLICT EXAMPLE:
├─ Room: A1
├─ Period: 09:00-10:00, Monday
├─ Existing: Class 10A (Math) with Mr. Kumar
└─ Trying to add: Class 10B (English) with Mr. Patel
   → ERROR: Room A1 already booked!

✓ RESOLUTION:
├─ Option A: Move new entry to different room (A2, A3, etc)
├─ Option B: Move existing entry to different time
└─ Option C: Move existing entry to different room
```

**Type 3: Class Conflict**
```
Same class with 2+ subjects at exact same time

❌ CONFLICT EXAMPLE:
├─ Class: 10A
├─ Period: 09:00-10:00, Monday
├─ Existing: Math with Mr. Kumar
└─ Trying to add: English with Mrs. Singh
   → ERROR: Class 10A already has Math!

✓ RESOLUTION:
├─ Option A: Change new entry time to 10:00-11:00 (different period)
├─ Option B: Remove/reschedule existing entry
└─ Option C: This shouldn't happen if all entries provided together
```

### 1.2 Check Current Timetable

**View all entries:**
```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable?day=monday" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "day": "monday",
  "entries": [
    {
      "id": "entry-001",
      "period": 1,
      "startTime": "09:00",
      "endTime": "10:00",
      "teacherId": "teacher-123",
      "teacherName": "Mr. Kumar",
      "classId": "class-456",
      "className": "10A",
      "roomId": "room-A1",
      "subjectId": "subject-math",
      "status": "active"
    }
  ]
}
```

**View schedule for specific teacher:**
```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/teacher/teacher-123?day=monday" \
  -H "Authorization: Bearer {token}"

# Response shows all classes this teacher is assigned
```

**View schedule for specific class:**
```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/class/class-456?day=monday" \
  -H "Authorization: Bearer {token}"

# Response shows all periods for this class
```

### 1.3 Conflict Checker (Before Creating Entry)

**Before committing, preview conflicts (dry-run validation):**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/validate" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "day": "monday",
    "period": 1,
    "startTime": "09:00",
    "endTime": "10:00",
    "teacherId": "teacher-123",
    "classId": "class-456",
    "roomId": "room-A1",
    "subjectId": "subject-math"
  }

# Response (NO CONFLICT):
{
  "valid": true,
  "conflicts": []
}

# Response (CONFLICT FOUND):
{
  "valid": false,
  "conflicts": [
    {
      "type": "TEACHER_CONFLICT",
      "severity": "ERROR",
      "message": "Teacher Mr. Kumar already assigned to Class 10A (09:00-10:00)",
      "existingEntryId": "entry-001",
      "suggestion": "Try 10:00-11:00 or assign different teacher"
    }
  ]
}
```

### 1.4 Conflict Report

**Generate report of all conflicts in timetable:**

```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/conflicts" \
  -H "Authorization: Bearer {token}"

# Response (if school has conflicts):
{
  "totalConflicts": 3,
  "conflicts": [
    {
      "id": "conflict-001",
      "type": "TEACHER_CONFLICT",
      "entries": ["entry-042", "entry-087"],
      "description": "Mr. Kumar (teacher-123) has 2 classes in same period",
      "affectedEntries": {
        "entry-042": "Class 10A, 09:00-10:00, Room A1",
        "entry-087": "Class 10B, 09:00-10:00, Room A2"
      },
      "detectedAt": "2026-04-10T10:00:00Z",
      "status": "active",
      "fixSuggested": "Move Class 10B to 10:00-11:00"
    }
  ]
}

# Response (if clean):
{
  "totalConflicts": 0,
  "conflicts": [],
  "message": "No conflicts detected in timetable"
}
```

---

## Section 2: Fixing Conflicts

### 2.1 Step-by-Step Resolution

**Scenario 1: Teacher conflict (Mr. Kumar teaching 2 classes same time)**

```
Current:
├─ 09:00-10:00: Class 10A, Mr. Kumar, Room A1
└─ 09:00-10:00: Class 10B, Mr. Kumar, Room A2  ← CONFLICT!

Option A (Recommended): Reschedule Period 2
├─ Update entry for Class 10B
├─ Change time from 09:00-10:00 → 10:00-11:00
└─ New entry for Class 10B (same teacher, different time) ✓

Command:
PUT /api/v1/schools/{schoolId}/timetable/entry-087
{
  "startTime": "10:00",
  "endTime": "11:00"
}

Response (if valid):
{
  "success": true,
  "entry": { "entry-087": "Class 10B now 10:00-11:00, Mr. Kumar" }
}
```

**Scenario 2: Room conflict (Room A1 booked twice)**

```
Current:
├─ 09:00-10:00: Class 10A, Mr. Kumar, Room A1, Math
└─ 09:00-10:00: Class 10C, Mr. Patel, Room A1, English  ← CONFLICT!

Option A (Recommended): Move class to different room
├─ Check available rooms: A2, A3 (check allocation)
├─ Update Class 10C entry to use A3
└─ New entry: Class 10C in Room A3 ✓

Command:
PUT /api/v1/schools/{schoolId}/timetable/entry-089
{
  "roomId": "room-A3"
}

Response:
{
  "success": true,
  "entry": { "entry-089": "Class 10C now in Room A3" }
}
```

**Scenario 3: Class conflict (10A has 2 subjects same time)**

```
Current:
├─ 09:00-10:00: Class 10A, Mr. Kumar, Math
└─ 09:00-10:00: Class 10A, Mr. Singh, English  ← CONFLICT!

Option A: Reschedule English to next period
├─ Update entry for English
├─ Change time from 09:00-10:00 → 10:00-11:00 ✓
└─ Class 10A now has correct schedule

Command:
PUT /api/v1/schools/{schoolId}/timetable/entry-091
{
  "startTime": "10:00",
  "endTime": "11:00"
}
```

### 2.2 Create Fixed Entry

**After fixing, create new valid entry:**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "day": "monday",
    "period": 2,
    "startTime": "10:00",
    "endTime": "11:00",
    "teacherId": "teacher-123",
    "classId": "class-456",
    "roomId": "room-A1",
    "subjectId": "subject-math"
  }

# Response on SUCCESS:
HTTP 201 Created
{
  "success": true,
  "entryId": "entry-092",
  "message": "Entry created successfully (no conflicts detected)"
}

# Response if STILL INVALID:
HTTP 400 Conflict
{
  "success": false,
  "error": "CONFLICT_DETECTED",
  "conflicts": [...]  # List specific conflicts
}
```

### 2.3 Batch Entry Management

**Delete conflicting entry to start fresh:**

```bash
curl -X DELETE "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/entry-087" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "success": true,
  "deletedEntry": "entry-087",
  "message": "Entry deleted. Verify no other entries depend on this."
}

# Then add new entry with correct time/assignment
```

**Update existing entry:**

```bash
curl -X PUT "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/entry-087" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "startTime": "10:00",
    "endTime": "11:00"
    # Other fields can also be updated
  }

# Validates updated entry against all 3 conflict rules
# Returns error if new time/assignment still has conflicts
```

---

## Section 3: Bulk Upload Validation

### 3.1 Import Timetable from CSV

**CSV format:**
```csv
day,period,startTime,endTime,className,teacherName,roomNumber,subjectName
monday,1,09:00,10:00,10A,Mr. Kumar,A1,Math
monday,2,10:00,11:00,10A,Mr. Singh,A1,English
monday,1,09:00,10:00,10B,Mrs. Patel,A2,Science
```

**Validate before importing:**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/import/validate" \
  -F "file=@timetable.csv" \
  -H "Authorization: Bearer {token}"

# Response (if valid):
{
  "valid": true,
  "recordsDetected": 50,
  "conflicts": [],
  "message": "CSV is valid. Safe to import."
}

# Response (if conflicts):
{
  "valid": false,
  "recordsDetected": 50,
  "conflicts": [
    {
      "row": 5,
      "type": "TEACHER_CONFLICT",
      "description": "Mr. Kumar scheduled for 2 classes at 09:00 on Monday",
      "details": {
        "row1": "Class 10A, Room A1",
        "row2": "Class 10B, Room A2"
      }
    },
    {
      "row": 12,
      "type": "ROOM_CONFLICT",
      "description": "Room A1 booked twice on Monday 14:00-15:00"
    }
  ]
}
```

### 3.2 Import if Valid

**Once CSV validated (no conflicts), import:**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/import" \
  -F "file=@timetable.csv" \
  -H "Authorization: Bearer {token}"

# Response (on success):
{
  "success": true,
  "imported": 50,
  "message": "All 50 timetable entries imported successfully"
}

# Now all entries exist and are conflict-free
```

### 3.3 Resolve and Re-upload

**If CSV has conflicts:**

```
Step 1: Download the error report with specific conflicts
Step 2: Edit CSV to fix conflicting rows
Step 3: Re-run validation (should pass)
Step 4: Re-upload CSV

Example fix:
BEFORE:
monday,1,09:00,10:00,10A,Mr. Kumar,A1,Math
monday,1,09:00,10:00,10B,Mr. Kumar,A2,Science  ← Conflict!

AFTER:
monday,1,09:00,10:00,10A,Mr. Kumar,A1,Math
monday,2,10:00,11:00,10B,Mr. Kumar,A2,Science  ← Fixed (period 2)
```

---

## Section 4: Admin Overrides

### 4.1 When to Use Override

**Legitimate reasons for split sessions (overlapping times allowed):**

```
✓ Split Session Model:
├─ Teacher teaches multiple periods in succession
├─ Example: 09:00-10:00 Class 10A, then 10:00-11:00 Class 10B
├─ 15-minute overlap acceptable (prep/transition time)

How system allows this:
└─ Use allowTeacherOverlapReason field to explain
```

**NOT for:**
```
✗ Classes can never have 2 subjects same time
✗ Rooms can never be double-booked
✗ "Just ignore the conflicts" approaches
```

### 4.2 Allow Teacher Overlap

**For split sessions with 15-min transition:**

```bash
curl -X POST "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d {
    "day": "monday",
    "startTime": "10:00",
    "endTime": "11:00",
    "teacherId": "teacher-123",
    "classId": "class-789",
    "roomId": "room-A3",
    "subjectId": "subject-science",
    "allowTeacherOverlap": true,
    "overlapReason": "Split session - teacher moves from 10B to 10C with transition time",
    "overriddenBy": "admin-user-123"
  }

# System validates:
├─ Teacher conflict? Allow if within 15 min
├─ Room conflict? REJECT (can't override)
├─ Class conflict? REJECT (can't override)

# Response:
{
  "success": true,
  "entryId": "entry-093",
  "message": "Entry created with teacher overlap approved",
  "auditLog": {
    "reason": "Split session - teacher moves 10B→10C",
    "approvedBy": "admin-user-123",
    "timestamp": "2026-04-10T10:00:00Z"
  }
}
```

### 4.3 Audit Trail for Overrides

**View all approved overrides:**

```bash
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/overrides" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "overrides": [
    {
      "entryId": "entry-093",
      "reason": "Split session - teacher moves 10B→10C",
      "approvedBy": "admin-user-123",
      "adminName": "Principal Mr. Sharma",
      "timestamp": "2026-04-10T10:00:00Z",
      "status": "active"
    }
  ]
}
```

---

## Section 5: Performance & Optimization

### 5.1 Validation Performance

**Baseline expectations (per entry):**

```
Validation Time Target: <500ms

Breakdown:
├─ Teacher lookup (Firestore): 50ms
├─ Room lookup (Firestore): 50ms
├─ Class lookup (Firestore): 50ms
├─ Conflict detection (in-memory): 10ms
└─ Total: ~160ms ✓ (well under 500ms limit)
```

### 5.2 Check Validation Speed

**If validation slow (>500ms):**

```bash
# Check performance metrics
curl -X GET "https://api.schoolerp.app/api/v1/schools/{schoolId}/timetable/metrics" \
  -H "Authorization: Bearer {token}"

# Response:
{
  "metrics": {
    "validationTimeP50": 120,  # ✓ Good
    "validationTimeP95": 380,  # ✓ Good
    "validationTimeP99": 550,  # ⚠️ Slow at p99
    "queryCacheHitRate": 92    # ✓ Good
  }
}

# If p99 > 500ms:
# → Firestore index issue (alert DevOps)
# → Index rebuild on: (day, teacherId), (day, roomId), (day, classId)
```

---

## Section 6: Troubleshooting

### 6.1 "Entry created but system shows conflict later"

```
Checklist:
1. Did validation run when you created entry?
   → GET /timetable/conflicts (check if conflict reported)
   
2. Was entry created via API or manual database change?
   → If DB change: Bypassed validation! Use API endpoint instead
   
3. Did someone else update timetable between your check and create?
   → Race condition possible (system handles on next full check)
   
Action:
├─ Use validate endpoint BEFORE always creating entry
├─ Don't bypass validation by editing database directly
└─ In race conditions: Delete + recreate entry via API
```

### 6.2 "Can't import CSV - conflicts detected on every row"

```
Checklist:
1. Is CSV format correct?
   → Headers: day, period, startTime, endTime, className, teacherName, roomNumber, subjectName
   
2. Are teacher/room/class names valid?
   → Check exact spelling (case-sensitive, whitespace matters)
   
3. Is data actually conflicting or format issue?
   → Run: POST /timetable/import/validate (get detailed errors)

If many conflicting rows:
├─ Likely CSV format issue (headers wrong, missing columns)
├─ Or teacher/room names don't exist in system
├─ Fix and re-validate
```

### 6.3 "Deleted entry but timetable still shows it"

```
Checklist:
1. Refresh the page (browser cache issue)
2. Check API directly:
   GET /timetable?day=monday
   (verify entry not in response)
   
3. Verify you deleted correct entry ID
   (copy ID from GET response, not from UI text)
   
If persists:
└─ Likely browser cache; clear and refresh
```

---

## Section 7: Best Practices

### 7.1 Conflict-Free Timetable Design

**Design principles:**

```
1. Plan teacher availability first
   ├─ Map full teacher availability (40 hours/week typical)
   └─ Ensure no teacher overloaded
   
2. Plan room availability second  
   ├─ Map room bookings (avoid double-booking)
   └─ Consider prep rooms, labs, etc.
   
3. Assign classes third
   ├─ Map class requirements (20-30 periods/week typical)
   └─ Ensure balanced across week
   
4. Fill gaps with validation
   ├─ Use validation API before committing
   └─ Fix conflicts immediately (not later)
```

### 7.2 Import Strategy

**For initial timetable load:**

```
Step 1: Prepare CSV with full week (Mon-Fri)
Step 2: Validate CSV (no conflicts)
Step 3: Import all at once (atomic, all-or-nothing)
Step 4: Spot-check results (sample 10 entries)
Step 5: Go live

DO:
├─ Validate before importing
├─ Test with small subset first (if unsure)
└─ Import during low-traffic time

DON'T:
├─ Bypass validation by editing database
├─ Import multiple times (conflicting duplicates)
└─ Import large file without testing first
```

---

## Contacts & Escalation

| Issue | Contact | Response Time |
|-------|---------|---|
| Conflict not detected | Backend Agent | 30 min |
| Validation taking >500ms | DevOps Agent | 15 min |
| Can't import large CSV | Backend Agent | 1 hour |
| Need validation rule changed | Backend Agent + Product | Planning cycle |

---

## FAQ

**Q: Can I have overlapping class periods (e.g., 09:00-10:15 and 10:00-11:15)?**
A: No, the system requires exact non-overlapping times. Split both into discrete periods or use separate rooms/classes.

**Q: What if two teachers share a class?**
A: System supports max 1 teacher per class, per period. Split into separate periods or create separate class sections.

**Q: Can I disable conflict detection?**
A: No, it's always active. Use admin override only for legitimate split sessions with documented reasons.

**Q: How far in advance should we plan timetable?**
A: At least 1 week. Validate and import before start of term/week. Changes mid-week cause cascading conflicts.

