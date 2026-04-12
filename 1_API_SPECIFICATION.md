# API SPECIFICATION - School ERP
## Complete OpenAPI 3.0 Schema for All Endpoints

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Production-Ready  

---

# TABLE OF CONTENTS
1. API Overview & Authentication
2. Schools API (Multi-tenancy)
3. Students API (CRUD + Search)
4. Attendance API
5. Academic/Grades API
6. Exams API
7. Financial API
8. Communication API
9. Error Responses
10. Rate Limiting & Pagination

---

# SECTION 1: API OVERVIEW

## Base URL
```
Development:  http://localhost:8080/api/v1
Staging:      https://staging-api.schoolerp.in/api/v1
Production:   https://api.schoolerp.in/api/v1
```

## Authentication
All endpoints (except `/health` and `/auth/login`) require:
```
Authorization: Bearer {idToken}
```

Where `idToken` is a Firebase JWT token obtained from Firebase Auth.

## Response Format (All endpoints)
```json
{
  "success": true,
  "data": { /* actual payload */ },
  "meta": {
    "timestamp": "2026-04-08T10:30:00Z",
    "version": "1.0.0"
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_SCHOOL_ID",
    "message": "School not found",
    "status": 404,
    "details": { /* optional debugging info */ }
  },
  "meta": {
    "timestamp": "2026-04-08T10:30:00Z",
    "requestId": "req_abc123xyz"
  }
}
```

---

# SECTION 2: SCHOOLS API

## 2.1 Get School Details
```
GET /schools/{schoolId}

Headers:
  Authorization: Bearer {idToken}

Response (200 OK):
{
  "success": true,
  "data": {
    "schoolId": "dps_mumbai_001",
    "name": "Delhi Public School, Mumbai",
    "email": "principal@dpsmumbai.edu.in",
    "phone": "+91-22-12345678",
    "city": "Mumbai",
    "state": "Maharashtra",
    "address": "123 School Road, Bandra, Mumbai",
    "principalName": "Rajesh Kumar",
    "principalEmail": "rajesh@dpsmumbai.edu.in",
    "studentCount": 2450,
    "staffCount": 180,
    "subscription": {
      "tier": "premium",
      "status": "active",
      "renewalDate": "2026-10-08",
      "monthlyFee": 60000,
      "currency": "INR"
    },
    "features": [
      "students",
      "attendance",
      "exams",
      "fees",
      "communication",
      "staff"
    ],
    "settings": {
      "timezone": "Asia/Kolkata",
      "language": "en",
      "academicYear": "2025-2026"
    },
    "metadata": {
      "createdAt": "2025-10-20T08:00:00Z",
      "updatedAt": "2026-04-08T10:30:00Z",
      "lastLoginAt": "2026-04-08T09:15:00Z"
    }
  }
}

Error (401 Unauthorized):
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "status": 401
  }
}

Error (404 Not Found):
{
  "success": false,
  "error": {
    "code": "SCHOOL_NOT_FOUND",
    "message": "School with ID 'invalid_id' not found",
    "status": 404
  }
}
```

## 2.2 Update School Settings
```
PATCH /schools/{schoolId}

Request Body:
{
  "principalName": "Rajesh Kumar Singh",
  "principalEmail": "rajesh.singh@dpsmumbai.edu.in",
  "phone": "+91-22-87654321",
  "settings": {
    "timezone": "Asia/Kolkata",
    "language": "hi",
    "academicYear": "2025-2026"
  }
}

Response (200 OK):
{
  "success": true,
  "data": {
    "schoolId": "dps_mumbai_001",
    "updated": true,
    "changes": {
      "principalName": "Rajesh Kumar Singh",
      "principalEmail": "rajesh.singh@dpsmumbai.edu.in"
    }
  }
}
```

---

# SECTION 3: STUDENTS API

## 3.1 Create Student
```
POST /schools/{schoolId}/students

Headers:
  Authorization: Bearer {idToken}
  Content-Type: application/json

Request Body:
{
  "firstName": "Aarav",
  "middleName": "Kumar",
  "lastName": "Sharma",
  "dob": "2012-05-15",
  "gender": "M",
  "aadhar": "123456789012",
  "rollNumber": "12501",
  "class": 5,
  "section": "A",
  "enrollmentDate": "2025-04-01",
  "status": "active",
  "contact": {
    "parentName": "Vikram Sharma",
    "parentEmail": "vikram.sharma@email.com",
    "parentPhone": "+91-9876543210",
    "emergencyContact": "+91-9876543211",
    "emergencyContactName": "Priya Sharma"
  },
  "address": {
    "street": "123 Oak Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "zipCode": "400001",
    "country": "India"
  },
  "medicalInfo": {
    "bloodGroup": "O+",
    "allergies": "Peanuts",
    "chronicConditions": "None"
  },
  "documents": {
    "birthCertificate": "birth_cert_aarav.pdf",
    "aadharCopy": "aadhar_aarav.pdf",
    "parentIdProof": "parent_id_aarav.pdf"
  }
}

Response (201 Created):
{
  "success": true,
  "data": {
    "studentId": "std_dps_001_aarav_sharma",
    "schoolId": "dps_mumbai_001",
    "firstName": "Aarav",
    "lastName": "Sharma",
    "rollNumber": "12501",
    "class": 5,
    "section": "A",
    "status": "active",
    "metadata": {
      "createdAt": "2026-04-08T10:30:00Z",
      "createdBy": "principal_001"
    }
  }
}

Error (400 Bad Request):
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "status": 400,
    "details": {
      "firstName": "First name is required",
      "dob": "Date of birth must be valid date",
      "parentPhone": "Invalid phone number format"
    }
  }
}
```

## 3.2 Get Student
```
GET /schools/{schoolId}/students/{studentId}

Response (200 OK):
{
  "success": true,
  "data": {
    "studentId": "std_dps_001_aarav_sharma",
    "firstName": "Aarav",
    "lastName": "Sharma",
    "dob": "2012-05-15",
    "enrollmentDate": "2025-04-01",
    "class": 5,
    "section": "A",
    "rollNumber": "12501",
    "status": "active",
    "contact": { /* full contact info */ },
    "address": { /* full address */ },
    "documents": { /* doc URLs */ },
    "academic": {
      "currentGPA": 3.8,
      "attendancePercentage": 94.5,
      "totalAbsences": 3,
      "totalPresent": 52
    },
    "metadata": {
      "createdAt": "2026-04-08T08:00:00Z",
      "updatedAt": "2026-04-08T10:30:00Z"
    }
  }
}
```

## 3.3 Search Students
```
GET /schools/{schoolId}/students/search?q=aarav&class=5&section=A&limit=10&offset=0

Query Parameters:
  q: string (name, roll number, or aadhar - optional)
  class: number (optional)
  section: string (optional)
  status: "active" | "inactive" | "transferred" (optional)
  enrolledAfter: ISO date (optional)
  enrolledBefore: ISO date (optional)
  limit: number (default: 20, max: 100)
  offset: number (default: 0)

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "studentId": "std_dps_001_aarav_sharma",
      "firstName": "Aarav",
      "lastName": "Sharma",
      "rollNumber": "12501",
      "class": 5,
      "section": "A",
      "status": "active"
    }
  ],
  "meta": {
    "total": 1,
    "limit": 10,
    "offset": 0,
    "hasMore": false
  }
}
```

## 3.4 Update Student
```
PATCH /schools/{schoolId}/students/{studentId}

Request Body (any fields):
{
  "parentEmail": "vikram.new@email.com",
  "status": "inactive",
  "class": 6,
  "section": "B"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "studentId": "std_dps_001_aarav_sharma",
    "updated": true,
    "changes": {
      "parentEmail": "vikram.new@email.com",
      "class": 6
    }
  }
}
```

## 3.5 Delete Student (Soft Delete)
```
DELETE /schools/{schoolId}/students/{studentId}

Response (200 OK):
{
  "success": true,
  "data": {
    "studentId": "std_dps_001_aarav_sharma",
    "deleted": true,
    "archivedAt": "2026-04-08T10:30:00Z"
  }
}
```

---

# SECTION 4: ATTENDANCE API

## 4.1 Mark Attendance (Batch)
```
POST /schools/{schoolId}/attendance/mark

Request Body:
{
  "date": "2026-04-08",
  "class": 5,
  "section": "A",
  "attendance": [
    {
      "studentId": "std_dps_001_aarav_sharma",
      "status": "present",
      "remarks": "On time"
    },
    {
      "studentId": "std_dps_001_raj_patel",
      "status": "absent",
      "remarks": "Medical emergency"
    },
    {
      "studentId": "std_dps_001_zara_khan",
      "status": "leave",
      "remarks": "Approved leave"
    }
  ],
  "markedBy": "teacher_001",
  "markedAt": "2026-04-08T10:45:00Z"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "attendanceId": "atnd_dps_20260408_5a",
    "date": "2026-04-08",
    "class": 5,
    "section": "A",
    "recordsCreated": 35,
    "recordsUpdated": 0,
    "syncStatus": "pending",
    "markedAt": "2026-04-08T10:45:00Z"
  }
}

Error (409 Conflict - Already marked):
{
  "success": false,
  "error": {
    "code": "ATTENDANCE_ALREADY_MARKED",
    "message": "Attendance for 2026-04-08, Class 5A already marked at 10:30 AM",
    "status": 409,
    "details": {
      "markedAt": "2026-04-08T10:30:00Z",
      "markedBy": "teacher_002"
    }
  }
}
```

## 4.2 Get Attendance Report
```
GET /schools/{schoolId}/attendance/report?startDate=2026-04-01&endDate=2026-04-08&class=5&section=A

Query Parameters:
  startDate: ISO date (required)
  endDate: ISO date (required)
  class: number (optional)
  section: string (optional)
  studentId: string (optional - for single student report)

Response (200 OK):
{
  "success": true,
  "data": {
    "school": "dps_mumbai_001",
    "class": 5,
    "section": "A",
    "period": {
      "startDate": "2026-04-01",
      "endDate": "2026-04-08",
      "totalWorkingDays": 6
    },
    "students": [
      {
        "studentId": "std_dps_001_aarav_sharma",
        "name": "Aarav Sharma",
        "rollNumber": "12501",
        "present": 6,
        "absent": 0,
        "leave": 0,
        "attendancePercentage": 100.0
      },
      {
        "studentId": "std_dps_001_raj_patel",
        "name": "Raj Patel",
        "rollNumber": "12502",
        "present": 5,
        "absent": 1,
        "leave": 0,
        "attendancePercentage": 83.33
      }
    ],
    "summary": {
      "totalStudents": 35,
      "classAverageAttendance": 94.5,
      "criticalAbsentees": ["std_dps_001_xyz"] // <75% attendance
    }
  }
}
```

---

# SECTION 5: ACADEMIC/GRADES API

## 5.1 Create Assessment
```
POST /schools/{schoolId}/assessments

Request Body:
{
  "name": "Half-Yearly Exam",
  "type": "exam", // exam, quiz, assignment, project
  "class": 5,
  "section": "A",
  "subject": "Mathematics",
  "totalMarks": 100,
  "passingMarks": 40,
  "weightage": 30, // % contribution to final grade
  "date": "2026-04-15",
  "dueDate": "2026-05-01",
  "status": "draft" // draft, active, locked
}

Response (201 Created):
{
  "success": true,
  "data": {
    "assessmentId": "asm_dps_20260415_math_5a",
    "name": "Half-Yearly Exam",
    "class": 5,
    "section": "A",
    "totalMarks": 100,
    "createdAt": "2026-04-08T10:30:00Z"
  }
}
```

## 5.2 Submit Marks
```
POST /schools/{schoolId}/assessments/{assessmentId}/marks

Request Body:
{
  "marks": [
    {
      "studentId": "std_dps_001_aarav_sharma",
      "obtainedMarks": 92,
      "status": "submitted",
      "remarks": "Excellent work"
    },
    {
      "studentId": "std_dps_001_raj_patel",
      "obtainedMarks": 75,
      "status": "submitted",
      "remarks": "Good"
    },
    {
      "studentId": "std_dps_001_zara_khan",
      "obtainedMarks": 58,
      "status": "submitted",
      "remarks": "Needs improvement"
    }
  ],
  "submittedBy": "teacher_001",
  "submittedAt": "2026-04-08T14:30:00Z"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "assessmentId": "asm_dps_20260415_math_5a",
    "marksSubmitted": 35,
    "anomaliesDetected": 1, // marks suspiciously high/low
    "status": "under_review"
  }
}
```

## 5.3 Get Student Grades
```
GET /schools/{schoolId}/students/{studentId}/grades?class=5&term=first

Response (200 OK):
{
  "success": true,
  "data": {
    "studentId": "std_dps_001_aarav_sharma",
    "name": "Aarav Sharma",
    "class": 5,
    "term": "first",
    "subjects": [
      {
        "subject": "Mathematics",
        "assessments": [
          {
            "name": "Quiz 1",
            "obtainedMarks": 18,
            "totalMarks": 20,
            "percentage": 90.0,
            "date": "2026-03-15"
          },
          {
            "name": "Half-Yearly",
            "obtainedMarks": 92,
            "totalMarks": 100,
            "percentage": 92.0,
            "date": "2026-04-15"
          }
        ],
        "overallPercentage": 91.0,
        "grade": "A+",
        "ranking": 1
      }
    ],
    "overallGPA": 3.9,
    "classRanking": 1
  }
}
```

---

# SECTION 6: EXAMS API

## 6.1 Create Exam
```
POST /schools/{schoolId}/exams

Request Body:
{
  "name": "Quarterly Exam - Q1",
  "academicYear": "2025-2026",
  "term": "first",
  "startDate": "2026-04-15",
  "endDate": "2026-05-01",
  "classes": [1, 2, 3, 4, 5, 6],
  "status": "draft"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "examId": "exm_dps_q1_2025",
    "name": "Quarterly Exam - Q1",
    "status": "draft"
  }
}
```

## 6.2 Publish Exam Results
```
POST /schools/{schoolId}/exams/{examId}/publish

Request Body:
{
  "publishDate": "2026-05-10",
  "notifyParents": true,
  "notificationChannel": ["email", "sms", "in-app"]
}

Response (200 OK):
{
  "success": true,
  "data": {
    "examId": "exm_dps_q1_2025",
    "publishedAt": "2026-05-10T09:00:00Z",
    "status": "published",
    "notificationsSent": {
      "email": 2450,
      "sms": 2350,
      "in_app": 2450
    }
  }
}
```

---

# SECTION 7: FINANCIAL API

## 7.1 Create Fee Invoice
```
POST /schools/{schoolId}/fees/invoices

Request Body:
{
  "studentId": "std_dps_001_aarav_sharma",
  "month": "April",
  "invoiceDate": "2026-04-01",
  "dueDate": "2026-04-15",
  "feeBreakdown": [
    {
      "category": "Tuition Fee",
      "amount": 15000
    },
    {
      "category": "Transport",
      "amount": 3000
    },
    {
      "category": "Activities",
      "amount": 1000
    }
  ],
  "totalAmount": 19000,
  "discounts": {
    "percentage": 0,
    "amount": 0
  },
  "status": "draft"
}

Response (201 Created):
{
  "success": true,
  "data": {
    "invoiceId": "inv_dps_202604_aarav_001",
    "studentId": "std_dps_001_aarav_sharma",
    "totalAmount": 19000,
    "dueDate": "2026-04-15",
    "status": "draft"
  }
}
```

---

# SECTION 8: COMMUNICATION API

## 8.1 Send Notification
```
POST /schools/{schoolId}/communications/notify

Request Body:
{
  "type": "attendance_alert", // attendance_alert, grades_published, fee_reminder
  "recipients": {
    "type": "class", // class, individual, role
    "class": 5,
    "section": "A"
  },
  "content": {
    "title": "Attendance Alert",
    "message": "Your child was absent today",
    "actionUrl": "/attendance"
  },
  "channels": ["sms", "email", "in-app"],
  "scheduleFor": "2026-04-08T09:00:00Z" // optional, for scheduling
}

Response (201 Created):
{
  "success": true,
  "data": {
    "notificationId": "notif_dps_20260408_001",
    "recipientCount": 35,
    "channels": ["sms", "email", "in-app"],
    "status": "sent"
  }
}
```

---

# SECTION 9: ERROR RESPONSES

## Standard Error Codes

| Code | HTTP Status | Meaning |
|------|------------|---------|
| UNAUTHORIZED | 401 | Invalid/expired token |
| FORBIDDEN | 403 | User lacks permission |
| NOT_FOUND | 404 | Resource doesn't exist |
| VALIDATION_ERROR | 400 | Invalid input data |
| CONFLICT | 409 | Resource already exists |
| RATE_LIMIT_EXCEEDED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

---

# SECTION 10: RATE LIMITING & PAGINATION

## Rate Limits
```
Standard tier: 100 requests/minute per API key
Premium tier: 1,000 requests/minute per API key

Headers indicate:
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 87
  X-RateLimit-Reset: 1712566200
```

## Pagination
```
All list endpoints support:
  limit: 1-100 (default: 20)
  offset: 0+ (default: 0)

Response includes:
  {
    "data": [...],
    "meta": {
      "total": 2450,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
```

---

**This OpenAPI spec covers all MVP endpoints for Weeks 1-4. Additional endpoints for Weeks 5-24 will follow same patterns.**
