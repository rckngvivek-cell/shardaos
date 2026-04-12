# WEEK 3 - DAY 3 PLANNING PREVIEW

**Date:** April 12, 2024  
**Sprint:** Week 3 Staff Portal Launch  
**Status:** 🔄 PLANNING (Awaiting Day 2 Completion)

> **NOTE:** This is a PREVIEW document. Full planning commences after Day 2 QA Sign-Off.

---

## DAY 3 SCOPE

### Objective
Extend staff portal with **Grades Management** (mark, view, report)

### Features to Build
1. **Backend:** Grade Entry Endpoints (3 new endpoints)
2. **Frontend:** Grade Management Page (mark + view grades)
3. **QA:** Grade API Tests (8 new test cases)
4. **DevOps:** Integration with Firestore grades collection

### Volume Estimate
- Backend: 280 lines
- Frontend: 400 lines
- QA: 300 lines
- **Total: ~1,000 lines across 5 files**

---

## DELIVERABLES (DRAFT)

### Backend: Grade API Endpoints
- `POST /api/v1/staff/grades/mark` — Record grade for student
- `GET /api/v1/staff/grades/by-class` — Get all grades for class
- `GET /api/v1/staff/grades/stats` — Grade distribution (avg, median, etc.)

### Frontend: Grade Page Components
- `frontend/src/pages/GradeManagementPage.tsx`
- Updated `frontend/src/api/staffApi.ts` with grade hooks

### QA: Grade Test Suite
- `test/grades.spec.ts` (8 test cases)

### Data Model: Firestore Collection
```
classGrades/
├─ {gradId}
│  ├─ class_id: string
│  ├─ student_id: string
│  ├─ subject: string
│  ├─ score: number (0-100)
│  ├─ grade_letter: "A+" | "A" | "B+" | "B" | "C+"
│  ├─ marked_by: string (staff_id)
│  ├─ marked_at: timestamp
│  └─ notes: string?
```

---

## TENTATIVE TIMELINE

| Phase | Start | Duration | End |
|-------|-------|----------|-----|
| Planning | 8:00 AM | 30 min | 8:30 AM |
| Review | 8:30 AM | 30 min | 9:00 AM |
| Backend Implementation | 9:00 AM | 3 hours | 12:00 PM |
| Frontend Implementation | 12:00 PM | 2.5 hours | 2:30 PM |
| QA Testing | 2:30 PM | 2 hours | 4:30 PM |
| Sign-Off & Day 4 Planning | 4:30 PM | 1.5 hours | 6:00 PM |

---

## DEPENDENCIES

✅ **Day 2 Requirements:**
- Infrastructure deployed (Firestore + Cloud Run)
- Auth system working end-to-end
- Attendance endpoints tested
- Frontend build pipeline operational

**These unlock Day 3 immediately upon completion.**

---

## ARCHITECTURE NOTES

### Grade Calculation Logic
```
Score (0-100) → Letter Grade
├─ 90-100: A+ (Excellent)
├─ 80-89:  A  (Very Good)
├─ 70-79:  B+ (Good)
├─ 60-69:  B  (Satisfactory)
└─ <60:    C+ (Need Improvement)
```

### Batch Grade Entry
- Similar to attendance: Select class → pick semester → bulk edit
- Cell-based editor (student rows × subject columns)
- Calculate letter grades automatically on save
- Prevent negative/over-100 scores

### Grade Statistics
- Average score
- Median score
- Distribution (A+%, A%, B+%, B%, C+%)
- Fail rate
- Class trend (vs previous semester)

---

## NEXT MEETINGS

- **Day 2 End-of-Day Sync:** 5:30 PM (Review attendance completion)
- **Day 3 Morning Planning:** 8:00 AM (Detailed grades scope)
- **Day 3 Mid-Day Review:** 12:00 PM (Backend code review before frontend starts)
- **Day 3 EOD Sync:** 5:30 PM (Grades sign-off + Day 4 preview)

---

## QUESTION FOR ARCHITECTURE REVIEW

1. Should grades allow decimal scores (e.g., 85.5) or integers only?
2. Should teachers be able to edit grades after submission? (consider audit trail)
3. Should failed grades trigger parent notification? (future: Day 8)
4. Should grade calculations support weighted subjects? (future: global backlog)

---

**Status:** 🔄 READY FOR REVIEW (Awaiting Day 2 Completion)  
**Author:** Planning Team  
**Approval Gate:** Lead Architect (must approve before Day 3 starts)

---
