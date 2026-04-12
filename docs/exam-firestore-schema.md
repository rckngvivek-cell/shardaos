# Exam/Assessment Module - Firestore Schema Design

**Module 3: Exam & Assessment System**  
**Week 7 Day 1**  
**Status: Foundation Design**

---

## Overview

The Exam/Assessment module manages the complete lifecycle of exams from creation through grading. This document outlines the Firestore collection structure, document schemas, relationships, and indexing requirements.

---

## Collections Architecture

### 1. `exams` Collection

**Purpose**: Stores exam configurations and metadata

**Document ID**: Auto-generated or custom exam UUID

**Schema**:
```json
{
  "id": "exam_uuid",
  "title": "Mathematics Final Exam",
  "subject": "Mathematics",
  "duration": 120,
  "totalQuestions": 50,
  "passingScore": 60,
  "description": "Comprehensive test covering algebra, geometry, and calculus",
  "instructions": "Answer all questions. No calculator allowed...",
  "isPublished": true,
  "createdBy": "teacher_id",
  "createdAt": "2026-04-10T08:00:00Z",
  "updatedAt": "2026-04-10T08:00:00Z",
  "metadata": {
    "category": "academic",
    "semester": "spring_2026",
    "status": "active"
  }
}
```

**Fields**:
- `id` (string): Unique identifier
- `title` (string): Exam name
- `subject` (string): Subject area
- `duration` (number): Duration in minutes
- `totalQuestions` (number): Expected number of questions
- `passingScore` (number): Pass threshold (percentage or points)
- `description` (string): Exam description
- `instructions` (string): Instructions for students
- `isPublished` (boolean): Whether exam is visible to students
- `createdBy` (string): Reference to staff/teacher document
- `createdAt` (timestamp): Creation timestamp
- `updatedAt` (timestamp): Last modification timestamp
- `metadata` (object): Additional exam metadata

---

### 2. `questions` Collection

**Purpose**: Stores all questions (organized by exam via subcollection)

**Path**: `exams/{examId}/questions`

**Document ID**: Auto-generated question UUID

**Schema**:
```json
{
  "id": "question_uuid",
  "text": "What is the capital of France?",
  "options": [
    "London",
    "Paris",
    "Berlin",
    "Madrid"
  ],
  "correctAnswer": 1,
  "explanation": "Paris is the capital and most populous city of France.",
  "marks": 2,
  "difficulty": "easy",
  "type": "multiple-choice",
  "createdAt": "2026-04-10T08:00:00Z",
  "order": 1
}
```

**Fields**:
- `id` (string): Question unique identifier
- `text` (string): Question content
- `options` (array[string]): Possible answers
- `correctAnswer` (number/string): Index or ID of correct option
- `explanation` (string): Explanation of correct answer
- `marks` (number): Points for correct answer
- `difficulty` (string): easy | medium | hard
- `type` (string): Question type (multiple-choice, true-false, short-answer, essay)
- `createdAt` (timestamp): When question was created
- `order` (number): Display order in exam

**Subcollection Rationale**: 
- Questions are tightly coupled to exams
- Enables efficient retrieval of all questions for a specific exam
- Maintains referential integrity

---

### 3. `student_exams` Collection

**Purpose**: Tracks student exam attempts and submissions

**Document ID**: Auto-generated submission UUID

**Schema**:
```json
{
  "id": "submission_uuid",
  "studentId": "student_uuid",
  "examId": "exam_uuid",
  "status": "graded",
  "startTime": "2026-04-10T09:00:00Z",
  "endTime": "2026-04-10T11:00:00Z",
  "answers": [
    {
      "questionId": "question_uuid_1",
      "selectedOption": 1,
      "markedAt": "2026-04-10T09:15:00Z",
      "isCorrect": true,
      "timeSpent": 45
    }
  ],
  "totalTimeSpent": 7200,
  "attemptNumber": 1,
  "createdAt": "2026-04-10T09:00:00Z",
  "updatedAt": "2026-04-10T11:00:00Z"
}
```

**Fields**:
- `id` (string): Submission unique identifier
- `studentId` (string): Reference to student
- `examId` (string): Reference to exam being taken
- `status` (string): not-started | in-progress | submitted | graded | cancelled
- `startTime` (timestamp): When student started exam
- `endTime` (timestamp): When student submitted exam
- `answers` (array): Array of StudentAnswer objects
- `totalTimeSpent` (number): Total time in seconds
- `attemptNumber` (number): Which attempt this is (for retakes)
- `createdAt` (timestamp): Submission creation
- `updatedAt` (timestamp): Last update

**Indexes**:
- Composite: (examId, status)
- Composite: (studentId, examId)

---

### 4. `grades` Collection

**Purpose**: Stores final grade results and feedback

**Document ID**: Auto-generated grade UUID

**Schema**:
```json
{
  "id": "grade_uuid",
  "studentId": "student_uuid",
  "examId": "exam_uuid",
  "studentExamId": "submission_uuid",
  "totalScore": 85,
  "maxScore": 100,
  "percentageScore": 85.0,
  "passingStatus": "pass",
  "grade": "A",
  "gradedAt": "2026-04-10T11:30:00Z",
  "gradedBy": "teacher_uuid",
  "feedback": "Excellent performance! Strong understanding of concepts.",
  "remarks": "Consider exploring advanced topics.",
  "createdAt": "2026-04-10T11:30:00Z"
}
```

**Fields**:
- `id` (string): Grade record unique identifier
- `studentId` (string): Reference to student
- `examId` (string): Reference to exam
- `studentExamId` (string): Reference to student exam submission
- `totalScore` (number): Actual score obtained
- `maxScore` (number): Maximum possible score
- `percentageScore` (number): Calculated percentage
- `passingStatus` (string): pass | fail
- `grade` (string): Letter grade A/B/C/D/F
- `gradedAt` (timestamp): When grading completed
- `gradedBy` (string): Who performed the grading
- `feedback` (string): Teacher's feedback
- `remarks` (string): Additional remarks
- `createdAt` (timestamp): Record creation

**Indexes**:
- Single: studentId
- Single: examId
- Composite: (studentId, examId)

---

## Data Relationships

```
exams (collection)
  ├── examId (document)
  │   ├── questions (subcollection)
  │   │   ├── questionId_1
  │   │   ├── questionId_2
  │   │   └── ...
  │
student_exams (collection)
  ├── submissionId_1
  │   ├── studentId (reference)
  │   ├── examId (reference)
  │   └── answers[*] (StudentAnswer objects)
  │
grades (collection)
  ├── gradeId_1
  │   ├── studentId (reference)
  │   ├── examId (reference)
  │   └── studentExamId (reference)
```

---

## Required Firestore Indexes

### Composite Indexes

| Collection | Fields | Query Purpose |
|-----------|--------|---------------|
| exams | isPublished, createdAt | List active exams by date |
| student_exams | examId, status | Get all submissions for an exam by status |
| student_exams | studentId, createdAt | Get all student's attempts chronologically |
| student_exams | studentId, examId | Get specific student's attempt on exam |
| grades | studentId, examId | Get student's grade for specific exam |
| grades | examId, percentageScore | Ranking students by score on exam |

### Single Field Indexes

| Collection | Field | Query Purpose |
|-----------|-------|---------------|
| exams | subject | Filter exams by subject |
| exams | createdBy | Get exams created by teacher |
| student_exams | studentId | All attempts by student |
| student_exams | examId | All submissions for exam |
| grades | studentId | All grades for student |
| grades | examId | All grades for exam |

---

## Query Patterns

### Common Queries

**Q1**: Get all active exams
```
db.collection('exams')
  .where('isPublished', '==', true)
  .orderBy('createdAt', 'desc')
```

**Q2**: Get specific exam with all questions
```
db.collection('exams').doc(examId)
db.collection('exams').doc(examId).collection('questions').orderBy('order')
```

**Q3**: Get student's submission for an exam
```
db.collection('student_exams')
  .where('studentId', '==', studentId)
  .where('examId', '==', examId)
  .limit(1)
```

**Q4**: Get all grades for a student
```
db.collection('grades')
  .where('studentId', '==', studentId)
  .orderBy('gradedAt', 'desc')
```

**Q5**: Get exam statistics (all submissions)
```
db.collection('student_exams')
  .where('examId', '==', examId)
  .where('status', '==', 'graded')
```

---

## Security Rules

```javascript
match /exams/{document=**} {
  allow read: if request.auth != null;
  allow create: if request.auth.token.role in ['teacher', 'admin'];
  allow update, delete: if request.auth.uid == resource.data.createdBy || request.auth.token.role == 'admin';
}

match /student_exams/{document=**} {
  allow read: if request.auth.uid == resource.data.studentId || request.auth.token.role in ['teacher', 'admin'];
  allow create: if request.auth.uid == request.resource.data.studentId;
  allow update: if request.auth.uid == resource.data.studentId && resource.data.status in ['not-started', 'in-progress'];
  allow delete: if request.auth.token.role == 'admin';
}

match /grades/{document=**} {
  allow read: if request.auth.uid == resource.data.studentId || request.auth.token.role in ['teacher', 'admin'];
  allow create, update: if request.auth.token.role in ['teacher', 'admin'];
  allow delete: if request.auth.token.role == 'admin';
}
```

---

## Performance Considerations

1. **Subcollection for Questions**: Prevents document size limits; enables efficient pagination
2. **Denormalization**: Avoid deep nesting; keep frequently accessed data at document level
3. **Batch Operations**: Use batch writes when creating questions with exam
4. **Indexing**: Pre-create indexes for reported slow queries
5. **Pagination**: Implement cursor-based pagination for large result sets

---

## Scalability Notes

- Expected questions per exam: 50-200 (manageable as subcollection)
- Expected submissions per exam: 1000s (distributed across many documents)
- Expected grades: Same as submissions
- Collection size mitigation: Archive old exams to separate "archived_exams" collection

---

## Migration Path

1. **Phase 1**: Create exams, questions collections
2. **Phase 2**: Add student_exams collection, start tracking submissions
3. **Phase 3**: Implement grading workflow with grades collection
4. **Phase 4**: Add indexing and optimize queries

---

**Document Version**: 1.0  
**Last Updated**: 2026-04-10  
**Status**: APPROVED FOR DEVELOPMENT
