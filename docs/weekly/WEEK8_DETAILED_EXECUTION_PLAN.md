# 🗺️ VISUAL ROADMAP & WEEK 8 EXECUTION PLAN

## 24-Week Launch Timeline Visual

```
WEEK 1-4        WEEK 5-12         WEEK 13-18        WEEK 19-24
Foundation      Core Workflows    Operations        Intelligence
                                  & Scale           & Launch
  |                |                 |                  |
  v                v                 v                  v
┌──────────────┐┌──────────────────┐┌────────────────┐┌──────────────┐
│   Phase 1    ││    Phase 2       ││    Phase 3     ││    Phase 4   │
│              ││                  ││                ││              │
│ • API Setup  ││ • Attendance     ││ • Messaging    ││ • Analytics  │
│ • Students   ││ • Grades         ││ • Finance      ││ • Testing    │
│ • Frontend   ││ • Exams          ││ • HR/Payroll   ││ • Launch     │
│              ││                  ││                ││              │
│ ✅ DONE      ││ ⏭️ NEXT         ││ TBD            ││ TBD          │
└──────────────┘└──────────────────┘└────────────────┘└──────────────┘
     ✅              ⏭️                  (10 weeks)      (6 weeks)
   (4 weeks)     (8 weeks)
               
Revenue Status:
  ₹0             ₹10-15L           ₹50-75L          ₹200-300L
  (foundation)   (pilot locked)    (expansion)      (launch run rate)
  
Date: Apr 10    Apr 14            May 26           Jul 28          Sep 29
       ✅        ↓                 ↓
```

---

## WEEK 8 DETAILED EXECUTION PLAN (April 14-18)

### Monday, April 14 - PROJECT KICKOFF

#### 9:00 AM - Team Standup (30 minutes)
**Location**: Virtual meeting (Slack + Zoom)  
**Attendees**: All 9 agents + Lead Architect

**Agenda**:
```
1. Welcome to Week 5! ✅
2. Phase 2 Completion Review (5 min)
   - 92 tests, 94.3% coverage
   - ₹10-15L pilot contract locked
   - API demo executed successfully
   
3. Week 5-6 Objectives (5 min)
   - Build Attendance Module Phase 1
   - Complete by Friday with pilot school testing
   
4. PRI Framework Reminder (10 min)
   - Plan → Review → Implement
   - Every PR reviewed before coding
   - No exceptions (Spec #17)
   
5. Q&A (10 min)
```

#### 10:00 AM - Technical Architecture Review (60 minutes)
**Lead**: Agent 1 (Backend) + Agent 0 (Senior Leader)  
**Attendees**: Backend, Frontend, QA, DevOps

**Agenda**:
```
1. Attendance API Design (25 min)
   - Endpoint: POST /schools/{schoolId}/attendance/mark
   - Request/Response format
   - Error cases: Offline, multi-tenant isolation, duplicate marks
   - Database schema review
   
2. Offline-Sync Architecture (20 min)
   - IndexedDB (web) vs SQLite (mobile, future)
   - Background sync every 10 seconds
   - Retry logic + error handling
   - Performance: <5s to upload 100 marks
   
3. SMS Integration (10 min)
   - Twilio API review
   - Rate limiting: 1 SMS per mark
   - Fallback if SMS fails
   
4. Questions & Clarifications (5 min)
```

#### 11:00 AM - PLAN Phase (Backend Task)
**Owner**: Agent 1 (Backend)  
**Duration**: 90 minutes  
**Deliverable**: PR with PLAN document

**Task**:
Create PR draft with PLAN document covering:

```markdown
## PLAN: Attendance Marking API

### Overview
Build endpoint POST /schools/{schoolId}/attendance/mark
to mark individual student attendance with offline-sync support

### Files to Create/Modify
- `/apps/api/src/routes/attendance.ts` (NEW)
- `/apps/api/src/services/attendance-service.ts` (NEW)
- `/apps/api/src/middleware/attendance-validator.ts` (NEW)
- `/apps/api/src/app.ts` (MODIFY - add route)
- `/apps/api/tests/attendance.test.ts` (NEW)

### Database Schema
Collection: /schools/{schoolId}/attendance
Document: {
  id: "uuid",
  classId: "string",
  studentId: "string",
  date: "2026-04-14",
  status: "present | absent | leave",
  markedAt: "2026-04-14T09:30:00Z",
  markedBy: "teacher-id",
  synced: boolean,
  offlineId: "optional-uuid" (for offline tracking)
}

### Test Cases (8 unit, 4 integration)
1. Mark single student present ✅
2. Mark student absent ✅
3. Mark student on leave ✅
4. Duplicate mark detection (same student, same date) ✅
5. Unauthorized access (teacher from different school) ✅
6. Multi-tenant isolation verified ✅
7. Offline mode: Store in IndexedDB ✅
8. Sync mode: Upload to Firestore ✅
9. Integration: Mark → Firestore stored → SMS sent ✅
10. Integration: Offline mark → WiFi detected → Synced ✅
11. Integration: Bulk sync 100 marks in <5s ✅
12. Performance: <200ms per mark endpoint ✅

### Error Handling (per Spec #8)
- 400 Bad Request: Invalid status value
- 401 Unauthorized: Invalid token
- 403 Forbidden: Access denied (different school)
- 409 Conflict: Duplicate mark detected
- 500 Internal Server Error: Database write failed

### Performance Requirements
- Single mark: <200ms p95
- Bulk sync 100 marks: <5s
- SMS sending: Async (non-blocking)

### Success Criteria
- All 12 tests passing
- >80% code coverage
- <200ms latency verified
- Staging deployment success
- Zero production incidents Week 1
```

**During 11:00 AM - 12:30 PM**:
- [ ] Write PLAN document (30 min)
- [ ] Review with Backend Lead (15 min)
- [ ] Create PR draft (15 min)
- [ ] Post in Slack #week5-attendance (5 min)
- [ ] Ready for REVIEW phase (12:30 PM)

#### 1:00 PM - REVIEW Phase (Team Review)
**Lead**: Agent 0 (Senior Leader)  
**Duration**: 30 minutes  
**Attendees**: Backend, Frontend, QA, DevOps

**Review Criteria**:
- [ ] All files listed are necessary?
- [ ] Database schema correct (multi-tenant)?
- [ ] Test cases sufficient?
- [ ] Error handling complete (per Spec #8)?
- [ ] Performance targets realistic?
- [ ] Security (Firestore rules ready)?

**Feedback**:
```
✅ Approved as-is, OR
🔄 Requested changes (list them), OR
❌ Rejected (major changes needed)
```

**Post-Review (if approved)**:
- [ ] Check "Ready for Implementation" checkbox
- [ ] Assign to Agent 1 (Backend)
- [ ] Notify: "Approved, proceed with IMPLEMENT phase"

#### 2:00 PM - IMPLEMENT Phase Begins (Backend Task)
**Owner**: Agent 1 (Backend)  
**Duration**: 3 hours (until 5:00 PM)  
**Method**: Follow PLAN exactly

**Checklist**:
- [ ] Create `/apps/api/src/routes/attendance.ts`
  ```typescript
  import express from 'express';
  import { attendanceService } from '../services/attendance-service';
  
  export const attendanceRouter = express.Router();
  
  attendanceRouter.post('/:schoolId/mark', async (req, res) => {
    // Validate input
    // Check auth token
    // Mark attendance
    // Send SMS
    // Return response
  });
  ```

- [ ] Create `/apps/api/src/services/attendance-service.ts`
  ```typescript
  export class AttendanceService {
    async markAttendance(schoolId, classId, studentId, status, date) {
      // Validate
      // Check duplicate
      // Store in Firestore
      // Trigger SMS notification
      // Return result
    }
    
    async calculateAttendancePercentage(schoolId, studentId) {
      // Query all marks for student
      // Calculate percentage
      // Return % + trend data
    }
  }
  ```

- [ ] Write tests (Jest)
  ```typescript
  describe('AttendanceService', () => {
    it('should mark student present', async () => { ... });
    it('should prevent duplicate marks', async () => { ... });
    // ... 12 tests total
  });
  ```

- [ ] Git commit with message
  ```
  feat: attendance marking API with offline-sync support
  
  - POST endpoint for marking attendance
  - IndexedDB offline storage
  - Background sync to Firestore
  - SMS notifications via Twilio
  - >80% test coverage
  
  Closes #[PR-NUMBER]
  ```

- [ ] Push to branch: `feature/attendance-marking-week5`

#### 3:30 PM - Code Review Session
**Owner**: Agent 5 (QA) + Agent 1 (Backend)  
**Duration**: 30 minutes

**Review Focus**:
- [ ] Code quality (ESLint, Prettier - Spec #6)
- [ ] Test coverage >80% (Spec #5)
- [ ] Error handling complete (Spec #8)
- [ ] Security: Firestore rules applied (Spec #4)
- [ ] Performance: <200ms verified (load test)

**Feedback Loop**:
```
If issues found:
  1. Agent 1 fixes code
  2. Re-run tests
  3. Re-push to branch
  4. Done when: All tests passing + no review comments
```

#### 4:30 PM - Merge & Deploy to Staging
**Owner**: Agent 4 (DevOps)  
**Duration**: 30 minutes

**Steps**:
- [ ] PR approved (all reviewers sign off)
- [ ] Merge to `main` branch
- [ ] CI/CD pipeline triggers (GCP Cloud Build)
- [ ] Tests run automatically
- [ ] Deploy to staging environment
- [ ] Smoke test: `curl http://staging-api/health` → 200 OK
- [ ] Deploy confirmation in Slack

#### 5:00 PM - EOD Sync & Friday Plan
**Duration**: 15 minutes  
**Format**: Slack async update (post before 6 PM)

**Post**:
```
🎉 Week 5 Monday Complete!

✅ What Shipped:
- Attendance marking API (POST endpoint)
- Offline-sync mechanism
- SMS notifications
- 12 tests (>80% coverage)
- Deployed to staging

📊 Metrics:
- Code committed: 342 lines
- Tests written: 12
- Coverage: 88%
- API latency: 145ms p95
- Staging status: ✅ Green

🎯 Tomorrow (Tuesday):
- Frontend: AttendanceMarker.tsx component
- QA: Integration tests (API + database + SMS)
- DevOps: Performance testing (1000 marks/day simulation)
- Pilot school: Early access to staging API

Questions? Ask in #week5-attendance
```

---

### Tuesday, April 15 - Frontend Task

#### 10:00 AM - Frontend Task (Agent 2)
**Task**: Build AttendanceMarker React component

**PLAN Phase (1.5 hours)**:
```markdown
## PLAN: AttendanceMarker Component

### Overview
React component for teachers to mark attendance
with single-click interface and offline support

### Files
- `/apps/web/src/components/AttendanceMarker.tsx` (NEW)
- `/apps/web/src/store/attendance-slice.ts` (NEW - Redux)
- `/apps/web/src/components/AttendanceMarker.test.tsx` (NEW)
- `/apps/web/src/hooks/useAttendanceSync.ts` (NEW)

### Component Props
- classId: string
- students: Student[]
- onSync: () => void

### UI Features
- Table: Student name, roll, current status
- Buttons: Present, Absent, Leave (per student)
- Sync status indicator: Synced ✅ / Pending ⏳
- Offline badge: 🔴 Offline mode active

### Redux State
- state.attendance.marks = { studentId: status }
- state.attendance.syncStatus = "synced" | "pending"
- state.attendance.isOffline = boolean

### IndexedDB Storage
- Table: "attendance_marks"
- Stores: { studentId, status, timestamp, synced }

### Test Cases (6 tests)
1. Render with students list
2. Click Present button → Redux state updated
3. Offline mode: Store in IndexedDB
4. Online mode: Send to API
5. Sync pending marks when WiFi detected
6. Display sync status indicator

### Success Criteria
- Component renders in <100ms
- Mark student in <50ms
- IndexedDB stores marks offline
- Auto-sync when WiFi detected
```

**REVIEW Phase (30 min)**:
- Team reviews design + Redux integration
- Approval: "Proceed with implementation"

**IMPLEMENT Phase (2-3 hours)**:
```typescript
// /apps/web/src/components/AttendanceMarker.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markAttendance, syncMarks } from '../store/attendance-slice';
import './AttendanceMarker.scss';

export const AttendanceMarker: React.FC<Props> = ({ classId, students, onSync }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const marks = useSelector(state => state.attendance.marks);
  const syncStatus = useSelector(state => state.attendance.syncStatus);
  const dispatch = useDispatch();

  useEffect(() => {
    const handleOnline = async () => {
      setIsOffline(false);
      // Trigger sync of pending marks
      await dispatch(syncMarks());
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [dispatch]);

  const handleMark = (studentId: string, status: 'present' | 'absent' | 'leave') => {
    dispatch(markAttendance({
      studentId,
      status,
      classId,
      date: new Date().toISOString().split('T')[0]
    }));
  };

  return (
    <div className="attendance-marker">
      <h2>{classId} - Mark Attendance</h2>
      
      {isOffline && <div className="offline-badge">🔴 Offline Mode</div>}
      <div className="sync-status">{syncStatus}</div>
      
      <table>
        <thead>
          <tr>
            <th>Roll</th>
            <th>Student Name</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(student => (
            <tr key={student.id}>
              <td>{student.rollNumber}</td>
              <td>{student.name}</td>
              <td>{marks[student.id] || '—'}</td>
              <td>
                <button onClick={() => handleMark(student.id, 'present')}
                  className={marks[student.id] === 'present' ? 'active' : ''}>
                  Present
                </button>
                <button onClick={() => handleMark(student.id, 'absent')}
                  className={marks[student.id] === 'absent' ? 'active' : ''}>
                  Absent
                </button>
                <button onClick={() => handleMark(student.id, 'leave')}
                  className={marks[student.id] === 'leave' ? 'active' : ''}>
                  Leave
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

**CODE REVIEW** (30 min):
- ESLint/Prettier check
- Test coverage >80%
- Performance verified

**MERGE & DEPLOY** (30 min):
- Merge to main
- Deploy to staging
- Component tested with mock API

---

### Wednesday, April 16 - QA Integration Testing

**Task**: Full integration test (API + Frontend + Firestore + SMS)

**Test Scenario**:
```
1. Teacher logs in → Sees classroom
2. Teacher clicks "Mark Attendance"
3. Teacher marks 50 students present (1 minute)
4. Verify: All marks in Firestore
5. Verify: 50 SMS sent to parents (tracking)
6. Verify: Attendance % calculated correctly
7. Verify: Parent sees child marked present in dashboard
8. Verify: Database query for stats: <500ms
```

**Expected**: ✅ All green

---

### Thursday, April 17 - Pilot School Testing

**Action**: Provide early access to staging API

**Pilot School Task**:
- [ ] 10 teachers test marking attendance
- [ ] Mark 500 students total across all classes
- [ ] Collect feedback: Speed, UI, offline sync
- [ ] Report bugs in Slack #week5-attendance

**Expected Feedback**:
- "UI is intuitive, fast to mark students"
- "Offline sync worked when WiFi disconnected"
- "SMS arrived within 30 seconds"

---

### Friday, April 18 - Week 5 Wrap-up & Week 6 Planning

#### 2:00 PM - Sprint Review
**Duration**: 60 minutes  
**Format**: Team standup + retro

**Agenda**:
```
1. Week 5 Deliverables Review (15 min)
   ✅ Attendance marking API live
   ✅ AttendanceMarker component
   ✅ Offline-sync working
   ✅ SMS notifications sent
   ✅ 12+ tests passing
   ✅ Deployed to staging
   
2. Metrics (10 min)
   - Velocity: 40 story points
   - Test coverage: 88%
   - Zero P0 bugs
   - Pilot school feedback: Positive
   
3. Retro: What went well? What could improve? (15 min)
   - Positive: PRI Framework worked well
   - Improvement: Frontend tests took longer
   - Action: Template attendance tests for next features
   
4. Week 6 Preview (10 min)
   - Attendance Phase 2: Reports + analytics
   - Start Grades Module Phase 1
   - Continue expanding team
   
5. Q&A (10 min)
```

#### 3:30 PM - Week 6 Planning Session
**Duration**: 60 minutes

**Next Week Objectives**:
```
1. Attendance Reports
   - Generate monthly PDF reports
   - Email to parents
   - Expected: 30 story points

2. Attendance Analytics
   - BigQuery sync setup
   - Query: "Get attendance % by student"
   - Expected: 20 story points

3. Grades Phase 1 Kickoff
   - Grade entry API
   - Weighted average calculation
   - Expected: 25 story points
   
Total: 75 story points (vs. 40 this week - need +1 engineer!)
```

**Action Items**:
- [ ] Start hiring Junior Backend Engineer (Monday)
- [ ] Design Grades schema before coding
- [ ] Setup BigQuery dataset
- [ ] Pre-test Razorpay integration (needed Week 14)

---

## 📊 WEEK 8 SUCCESS METRICS

### Shipping Metrics
- [ ] Attendance marking API deployed
- [ ] AttendanceMarker component merged
- [ ] 12+ tests passing (>80% coverage)
- [ ] Deployed to staging environment
- [ ] Pilot school early access enabled

### Performance Metrics
- [ ] Mark student: <200ms p95
- [ ] Bulk sync 100 marks: <5s
- [ ] SMS delivery: <30 seconds
- [ ] AttendanceMarker component: <100ms render
- [ ] Firestore query: <500ms for stats

### Quality Metrics
- [ ] Zero P0 bugs in production
- [ ] All code reviews passed
- [ ] ESLint + Prettier compliant
- [ ] Test coverage: >80%
- [ ] Main branch always deployable

### Business Metrics
- [ ] Pilot school 1 marked attendance all week
- [ ] Zero support tickets
- [ ] Feedback collected positive
- [ ] Ready for Week 6 scaling

### Team Metrics
- [ ] All team members familiar with PRI Framework
- [ ] Zero merge conflicts
- [ ] Code review time: <1 hour average
- [ ] Standup participation: 100%

---

## 🚀 GO/NO-GO DECISION (Friday 3 PM)

**GO Decision** (proceed to Week 6):
- ✅ Attendance marking working in production
- ✅ Tests passing
- ✅ Pilot school satisfied
- ✅ Team velocity on track
- ✅ No P0 blockers

**NO-GO Decision** (extend Week 5):
- ❌ Critical bugs found
- ❌ Performance not meeting targets
- ❌ Test coverage <80%
- ❌ Pilot school blocking issue
- ❌ Team overloaded

**Expected Outcome**: ✅ GO (all systems green)

---

## 📞 ESCALATION & SUPPORT

**Daily Standup**: 9:00 AM Slack (async updates)  
**Weekly Sync**: Friday 2:00 PM (team meeting + retro)  
**Escalation**: Slack #week5-attendance (real-time help)  

**On-Call**: Agent 0 (Senior Leader) - resolve blockers same-day

---

**WEEK 8 is the start of our 24-week sprint. Execute flawlessly. Track metrics daily. Celebrate Friday! 🎉**

*Plan: April 14-18, 2026*  
*Target Outcome: Attendance Module Phase 1 COMPLETE*  
*Team Readiness: ✅ Go/No-Go Green*
