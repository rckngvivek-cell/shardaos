# WEEK 4 PR #3 PLAN: Security Rules & RBAC

**PR:** #3  
**Owner:** Backend Agent  
**Day:** Wednesday, May 8, 2026  
**Duration:** 2.5 hours  
**Status:** DRAFT - Awaiting Lead Architect Review

---

## 📋 FEATURE SUMMARY

Implement Firestore security rules that enforce role-based access control (RBAC). Define 4 user roles (Admin, Teacher, Student, Parent) with granular permissions. Prevent unauthorized access to school data, ensure students can only see their own grades/attendance, and teachers can only modify records for their assigned school.

---

## 🎯 DELIVERABLES

| Component | Target | Security Level |
|-----------|--------|-----------------|
| Firestore Rules | Role-based RBAC | Critical |
| Unauthorized Tests | 100% rejection | High |
| Data Isolation | School-level | High |
| Student Privacy | Student-level | Critical |

---

## 🔐 ROLE DEFINITION MATRIX

### Role: Admin
- **Permissions:**
  - ✅ Create/update/delete schools
  - ✅ Create/update/delete teachers
  - ✅ View all student data
  - ✅ Mark attendance for any school
  - ✅ Upload grades for any school
  - ✅ View financial reports

- **Restrictions:**
  - ❌ Cannot see other admin user data

---

### Role: Teacher
- **Permissions:**
  - ✅ View students for assigned school
  - ✅ Mark attendance for assigned school
  - ✅ Upload/edit grades for assigned school
  - ✅ View reports for assigned school
  - ✅ View own profile

- **Restrictions:**
  - ❌ Cannot access other schools
  - ❌ Cannot delete student records
  - ❌ Cannot access financial data
  - ❌ Cannot view other teacher data

---

### Role: Student
- **Permissions:**
  - ✅ View own attendance record
  - ✅ View own grades
  - ✅ View own profile
  - ✅ View school announcements

- **Restrictions:**
  - ❌ Cannot see other students' data
  - ❌ Cannot modify any data
  - ❌ Cannot view financial records

---

### Role: Parent
- **Permissions:**
  - ✅ View child's attendance
  - ✅ View child's grades
  - ✅ View child's profile
  - ✅ Send messages to teacher

- **Restrictions:**
  - ❌ Cannot see other parents' data
  - ❌ Cannot see other students' data
  - ❌ Cannot modify any records

---

## 🗂️ FIRESTORE SECURITY RULES

### firestore.rules (Complete Implementation)

```firestore
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ==== UTILITY FUNCTIONS ====
    
    // Get current user doc from users collection
    function getUserDoc() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    // Check if user has role
    function hasRole(role) {
      return getUserDoc().role == role;
    }
    
    // Check if user is admin
    function isAdmin() {
      return hasRole('admin');
    }
    
    // Check if user belongs to school
    function belongsToSchool(schoolId) {
      return getUserDoc().schoolId == schoolId;
    }
    
    // Check if this is same user
    function isUser(userId) {
      return request.auth.uid == userId;
    }
    
    // ==== SCHOOLS COLLECTION ====
    
    match /schools/{schoolId} {
      // Only authenticated users and admins can read school
      allow read: if request.auth != null && 
                     (isAdmin() || belongsToSchool(schoolId));
      
      // Only admins can create schools
      allow create: if isAdmin();
      
      // Only admins can update schools
      allow update: if isAdmin();
      
      // Only admins can delete schools
      allow delete: if isAdmin();
    }
    
    // ==== STUDENTS COLLECTION ====
    
    match /students/{studentId} {
      // Admin: can read all
      // Teacher: can read students from their school
      // Student: can only read themselves
      // Parent: can read their child
      allow read: if request.auth != null && (
        isAdmin() ||
        (hasRole('teacher') && belongsToSchool(resource.data.schoolId)) ||
        (hasRole('student') && isUser(studentId)) ||
        (hasRole('parent') && resource.data.parentId == request.auth.uid)
      );
      
      // Only admins can create students
      allow create: if isAdmin();
      
      // Only admins can update students
      allow update: if isAdmin();
      
      // Only admins can delete students
      allow delete: if isAdmin();
      
      // Index requirement: schoolId, gradeLevel, status
    }
    
    // ==== ATTENDANCE COLLECTION ====
    
    match /attendance/{attendanceId} {
      // Admin: can read all
      // Teacher: can read/write for their school
      // Student: can read own attendance
      allow read: if request.auth != null && (
        isAdmin() ||
        (hasRole('teacher') && belongsToSchool(resource.data.schoolId)) ||
        (hasRole('student') && resource.data.studentId == request.auth.uid)
      );
      
      // Only admin and teacher (for own school) can write
      allow create: if (isAdmin() || 
                        (hasRole('teacher') && 
                         belongsToSchool(request.resource.data.schoolId)));
      
      allow update, delete: if (isAdmin() || 
                               (hasRole('teacher') && 
                                belongsToSchool(resource.data.schoolId)));
    }
    
    // ==== GRADES COLLECTION ====
    
    match /grades/{gradeId} {
      // Admin: can read all
      // Teacher: can read grades for their school
      // Student: can read own grades
      // Parent: can read child's grades
      allow read: if request.auth != null && (
        isAdmin() ||
        (hasRole('teacher') && belongsToSchool(resource.data.schoolId)) ||
        (hasRole('student') && resource.data.studentId == request.auth.uid) ||
        (hasRole('parent') && resource.data.studentId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.childrenIds)
      );
      
      // Only admin and teacher (for own school) can write
      allow create: if (isAdmin() || 
                        (hasRole('teacher') && 
                         belongsToSchool(request.resource.data.schoolId)));
      
      allow update: if (isAdmin() || 
                       (hasRole('teacher') && 
                        belongsToSchool(resource.data.schoolId)));
      
      allow delete: if isAdmin();
    }
    
    // ==== USERS COLLECTION (Sensitive) ====
    
    match /users/{userId} {
      // Users can only read own data OR admin can read all
      allow read: if request.auth != null && (
        isUser(userId) || 
        isAdmin()
      );
      
      // Users can only update own data OR admin updates
      allow update: if (isUser(userId) || isAdmin());
      
      // Only admin can create/delete users
      allow create: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}
```

---

## ✅ TEST CASES (6+ tests)

### Admin Role Tests (1 test)
- [ ] **TC1:** Admin user → Can read all schools, students, attendance, grades

### Teacher Role Tests (2 tests)
- [ ] **TC2:** Teacher marks attendance for own school → Success (201)
- [ ] **TC3:** Teacher attempts attendance for different school → Denied (403)

### Student Role Tests (2 tests)
- [ ] **TC4:** Student views own grades → Success (200)
- [ ] **TC5:** Student attempts to view other student's grades → Denied (403)

### Parent Role Tests (1 test)
- [ ] **TC6:** Parent views child's attendance → Success (200)

### Unauthorized Access Tests (0 - covered above, but explicit)
- [ ] **TC7:** Unauthenticated request to endpoint → Denied (401)
- [ ] **TC1-6:** All test unauthorized scenarios

---

## 🛡️ SECURITY TESTING STRATEGY

### Unit Tests (firestore-security.test.ts - 80 LOC)

```typescript
import * as testing from '@firebase/rules-unit-testing';

const PROJECT_ID = 'test-project';

describe('Firestore Security Rules', () => {
  let db: any;

  beforeAll(async () => {
    // Initialize rules testing environment
    await testing.initializeTestEnvironment({
      projectId: PROJECT_ID,
      firebaseConfig: { /* config */ },
      rules: fs.readFileSync('firestore.rules', 'utf8'),
    });
  });

  afterEach(async () => {
    await testing.clearFirestoreData({ projectId: PROJECT_ID });
  });

  // Define test users with different roles
  const adminUser = testing.testEnv.authenticatedContext('admin-uid', { role: 'admin' });
  const teacherUser = testing.testEnv.authenticatedContext('teacher-uid', { role: 'teacher' });
  const studentUser = testing.testEnv.authenticatedContext('student-uid', { role: 'student' });
  const unauthUser = testing.testEnv.unauthenticatedContext();

  test('Admin can read all schools', async () => {
    const db = adminUser.firestore();
    // Should succeed
    await firebase.assertSucceeds(db.collection('schools').get());
  });

  test('Teacher cannot read schools they do not belong to', async () => {
    const db = teacherUser.firestore();
    // Should fail
    await firebase.assertFails(
      db.collection('schools').doc('school-2').get()
    );
  });

  test('Student cannot view other student grades', async () => {
    const db = studentUser.firestore();
    // Should fail
    await firebase.assertFails(
      db.collection('grades').doc('other-student-grade').get()
    );
  });

  test('Unauthenticated user denied access', async () => {
    const db = unauthUser.firestore();
    // Should fail
    await firebase.assertFails(db.collection('schools').get());
  });
});
```

---

## 🗂️ FILES TO CHANGE

### Create New Files:
- [ ] `firestore.rules` (120 LOC) - Main security rules file
- [ ] `apps/api/tests/firestore-security.test.ts` (80 LOC) - Security rule tests

### Modify Files:
- [ ] `.gitignore` - Ensure firestore.rules is tracked
- [ ] `firebase.json` - Configure rules deployment

### Deploy:
- [ ] Deploy rules to production: `firebase deploy --only firestore:rules`

---

## ⏱️ IMPLEMENTATION TIMELINE

| Task | Time | Owner |
|------|------|-------|
| **PLAN Review** | 15 min | Lead Architect |
| **Security Rules** | 1 hour | Backend |
| **Test Writing** | 45 min | Backend |
| **Code Review** | 15 min | Lead Architect |
| **Deploy to staging** | 10 min | DevOps |
| **Total** | **2.5 hours** | - |

---

## 🎯 SUCCESS CRITERIA

- ✅ All 4 roles defined with clear permissions
- ✅ 6+ security tests passing 100%
- ✅ Unauthorized access rejected (403 Forbidden)
- ✅ Unauthenticated access rejected (401 Unauthorized)
- ✅ No SQL injection or data leakage vulnerabilities
- ✅ Rules deployed to staging Firestore

---

## 📝 NOTES FOR IMPLEMENTATION

1. **Test Environment:** Use Firebase Rules Unit Testing SDK (firebaserulesunitesting) for local testing.
2. **No Hard-Coded User IDs:** Always use `request.auth.uid` to prevent bypasses.
3. **Principle of Least Privilege:** Start restrictive, open only what's needed.
4. **Test Edge Cases:** Ensure cross-school teacher cannot access other school's data.
5. **Logging:** Consider Cloud Logging to track denied access attempts.

---

**Status:** ⏳ AWAITING LEAD ARCHITECT REVIEW  
**Next Steps:** Lead Architect to review. Then begin IMPLEMENT phase.

*Created: 2026-04-09*  
*PR Target:** PR #3, Wednesday May 8, 2026
