import * as testing from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ID = 'school-erp-test';

describe('Firestore Security Rules - RBAC Implementation', () => {
  let testEnv: any;

  beforeAll(async () => {
    // Initialize rules testing environment
    testEnv = await testing.initializeTestEnvironment({
      projectId: PROJECT_ID,
      rules: fs.readFileSync(path.join(__dirname, '../../..', 'firestore.rules'), 'utf8'),
    });
  });

  afterEach(async () => {
    // Clear database after each test
    await testEnv.clearFirestoreData({ projectId: PROJECT_ID });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  // Helper function to set up test data
  async function setupTestData() {
    const adminDb = testEnv.authenticatedContext('admin-uid', {
      uid: 'admin-uid',
      token: { aud: 'test-project' },
    }).firestore();

    // Create users with different roles
    await adminDb.collection('users').doc('admin-uid').set({
      uid: 'admin-uid',
      role: 'admin',
      email: 'admin@school.com',
      schoolId: null,
      createdAt: new Date(),
    });

    await adminDb.collection('users').doc('teacher-uid').set({
      uid: 'teacher-uid',
      role: 'teacher',
      email: 'teacher@school.com',
      schoolId: 'school-001',
      createdAt: new Date(),
    });

    await adminDb.collection('users').doc('student-uid').set({
      uid: 'student-uid',
      role: 'student',
      email: 'student@school.com',
      schoolId: 'school-001',
      createdAt: new Date(),
    });

    await adminDb.collection('users').doc('parent-uid').set({
      uid: 'parent-uid',
      role: 'parent',
      email: 'parent@school.com',
      childrenIds: ['student-uid'],
      createdAt: new Date(),
    });

    await adminDb.collection('users').doc('other-teacher-uid').set({
      uid: 'other-teacher-uid',
      role: 'teacher',
      email: 'other-teacher@school.com',
      schoolId: 'school-002',
      createdAt: new Date(),
    });

    // Create test schools
    await adminDb.collection('schools').doc('school-001').set({
      schoolId: 'school-001',
      name: 'Test School 1',
      createdAt: new Date(),
    });

    await adminDb.collection('schools').doc('school-002').set({
      schoolId: 'school-002',
      name: 'Test School 2',
      createdAt: new Date(),
    });

    // Create test student
    await adminDb.collection('students').doc('student-uid').set({
      studentId: 'student-uid',
      firstName: 'John',
      lastName: 'Doe',
      schoolId: 'school-001',
      parentId: 'parent-uid',
      createdAt: new Date(),
    });

    // Create test attendance record
    await adminDb.collection('attendance').doc('attendance-001').set({
      attendanceId: 'attendance-001',
      studentId: 'student-uid',
      schoolId: 'school-001',
      date: new Date(),
      status: 'present',
      createdAt: new Date(),
    });

    // Create test grade record
    await adminDb.collection('grades').doc('grade-001').set({
      gradeId: 'grade-001',
      studentId: 'student-uid',
      schoolId: 'school-001',
      subject: 'Math',
      grade: 'A',
      createdAt: new Date(),
    });

    return adminDb;
  }

  // ============ TEST CASE 1: Admin Permissions ============

  describe('TC1: Admin Role - Full Access', () => {
    it('should allow admin to read all schools', async () => {
      await setupTestData();

      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await testing.assertSucceeds(adminDb.collection('schools').get());
    });

    it('should allow admin to read all students', async () => {
      await setupTestData();

      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await testing.assertSucceeds(adminDb.collection('students').get());
    });

    it('should allow admin to read all attendance records', async () => {
      await setupTestData();

      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await testing.assertSucceeds(adminDb.collection('attendance').get());
    });

    it('should allow admin to read all grades', async () => {
      await setupTestData();

      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await testing.assertSucceeds(adminDb.collection('grades').get());
    });

    it('should allow admin to create schools', async () => {
      await setupTestData();

      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await testing.assertSucceeds(
        adminDb.collection('schools').doc('new-school').set({
          schoolId: 'new-school',
          name: 'New School',
        })
      );
    });

    it('should allow admin to update schools', async () => {
      await setupTestData();

      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await testing.assertSucceeds(
        adminDb.collection('schools').doc('school-001').update({
          name: 'Updated School',
        })
      );
    });

    it('should allow admin to delete schools', async () => {
      await setupTestData();

      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await testing.assertSucceeds(
        adminDb.collection('schools').doc('school-001').delete()
      );
    });
  });

  // ============ TEST CASE 2 & 3: Teacher Role - Restrictions ============

  describe('TC2: Teacher Role - Own School Access', () => {
    it('should allow teacher to mark attendance for own school', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertSucceeds(
        teacherDb.collection('attendance').doc('new-attendance').set({
          attendanceId: 'new-attendance',
          studentId: 'student-uid',
          schoolId: 'school-001',
          date: new Date(),
          status: 'present',
        })
      );
    });

    it('should allow teacher to upload grades for own school', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertSucceeds(
        teacherDb.collection('grades').doc('new-grade').set({
          gradeId: 'new-grade',
          studentId: 'student-uid',
          schoolId: 'school-001',
          subject: 'English',
          grade: 'B',
        })
      );
    });

    it('should allow teacher to read students from own school', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertSucceeds(
        teacherDb.collection('students').doc('student-uid').get()
      );
    });

    it('should allow teacher to read own profile', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertSucceeds(
        teacherDb.collection('users').doc('teacher-uid').get()
      );
    });
  });

  describe('TC3: Teacher Role - Cross-School Access Denial', () => {
    it('should deny teacher to mark attendance for different school', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertFails(
        teacherDb.collection('attendance').doc('cross-school-attendance').set({
          attendanceId: 'cross-school-attendance',
          studentId: 'student-uid',
          schoolId: 'school-002',
          date: new Date(),
          status: 'present',
        })
      );
    });

    it('should deny teacher to upload grades for different school', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertFails(
        teacherDb.collection('grades').doc('cross-school-grade').set({
          gradeId: 'cross-school-grade',
          studentId: 'student-uid',
          schoolId: 'school-002',
          subject: 'Math',
          grade: 'A',
        })
      );
    });

    it('should deny teacher to access other school data', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertFails(
        teacherDb.collection('schools').doc('school-002').get()
      );
    });

    it('should deny teacher to view other teacher data', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertFails(
        teacherDb.collection('users').doc('other-teacher-uid').get()
      );
    });

    it('should deny teacher to delete student records', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertFails(
        teacherDb.collection('students').doc('student-uid').delete()
      );
    });

    it('should deny teacher to create schools', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      await testing.assertFails(
        teacherDb.collection('schools').doc('new-school').set({
          schoolId: 'new-school',
          name: 'New School',
        })
      );
    });
  });

  // ============ TEST CASE 4 & 5: Student Role - Privacy ============

  describe('TC4: Student Role - Own Data Access', () => {
    it('should allow student to view own grades', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertSucceeds(
        studentDb.collection('grades').doc('grade-001').get()
      );
    });

    it('should allow student to view own attendance', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertSucceeds(
        studentDb.collection('attendance').doc('attendance-001').get()
      );
    });

    it('should allow student to view own profile', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertSucceeds(
        studentDb.collection('users').doc('student-uid').get()
      );
    });

    it('should allow student to view own student record', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertSucceeds(
        studentDb.collection('students').doc('student-uid').get()
      );
    });
  });

  describe('TC5: Student Role - Privacy Enforcement', () => {
    it('should deny student to view other student grades', async () => {
      // Setup second student
      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await adminDb.collection('users').doc('student2-uid').set({
        uid: 'student2-uid',
        role: 'student',
        email: 'student2@school.com',
        schoolId: 'school-001',
      });

      await adminDb.collection('grades').doc('grade-002').set({
        gradeId: 'grade-002',
        studentId: 'student2-uid',
        schoolId: 'school-001',
        subject: 'Math',
        grade: 'B',
      });

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertFails(
        studentDb.collection('grades').doc('grade-002').get()
      );
    });

    it('should deny student to view other student attendance', async () => {
      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await adminDb.collection('users').doc('student2-uid').set({
        uid: 'student2-uid',
        role: 'student',
        email: 'student2@school.com',
        schoolId: 'school-001',
      });

      await adminDb.collection('attendance').doc('attendance-002').set({
        attendanceId: 'attendance-002',
        studentId: 'student2-uid',
        schoolId: 'school-001',
        date: new Date(),
        status: 'absent',
      });

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertFails(
        studentDb.collection('attendance').doc('attendance-002').get()
      );
    });

    it('should deny student to modify any records', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertFails(
        studentDb.collection('grades').doc('grade-001').update({
          grade: 'A+',
        })
      );
    });

    it('should deny student to create records', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertFails(
        studentDb.collection('attendance').doc('fake-attendance').set({
          studentId: 'student-uid',
          status: 'present',
        })
      );
    });

    it('should deny student to view financial records', async () => {
      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await adminDb.collection('financials').doc('financial-001').set({
        financialId: 'financial-001',
        schoolId: 'school-001',
        tuitionFee: 50000,
      });

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertFails(
        studentDb.collection('financials').doc('financial-001').get()
      );
    });
  });

  // ============ TEST CASE 6: Parent Role ============

  describe('TC6: Parent Role - Child Access', () => {
    it('should allow parent to view child attendance', async () => {
      await setupTestData();

      const parentDb = testEnv.authenticatedContext('parent-uid', {
        uid: 'parent-uid',
      }).firestore();

      await testing.assertSucceeds(
        parentDb.collection('attendance').doc('attendance-001').get()
      );
    });

    it('should allow parent to view child grades', async () => {
      await setupTestData();

      const parentDb = testEnv.authenticatedContext('parent-uid', {
        uid: 'parent-uid',
      }).firestore();

      await testing.assertSucceeds(
        parentDb.collection('grades').doc('grade-001').get()
      );
    });

    it('should allow parent to view child profile', async () => {
      await setupTestData();

      const parentDb = testEnv.authenticatedContext('parent-uid', {
        uid: 'parent-uid',
      }).firestore();

      await testing.assertSucceeds(
        parentDb.collection('students').doc('student-uid').get()
      );
    });

    it('should deny parent to view other child data', async () => {
      const adminDb = testEnv.authenticatedContext('admin-uid', {
        uid: 'admin-uid',
      }).firestore();

      await adminDb.collection('users').doc('student2-uid').set({
        uid: 'student2-uid',
        role: 'student',
        email: 'student2@school.com',
        schoolId: 'school-001',
      });

      await adminDb.collection('grades').doc('grade-002').set({
        gradeId: 'grade-002',
        studentId: 'student2-uid',
        schoolId: 'school-001',
        subject: 'Math',
        grade: 'B',
      });

      const parentDb = testEnv.authenticatedContext('parent-uid', {
        uid: 'parent-uid',
      }).firestore();

      await testing.assertFails(
        parentDb.collection('grades').doc('grade-002').get()
      );
    });

    it('should deny parent to modify records', async () => {
      await setupTestData();

      const parentDb = testEnv.authenticatedContext('parent-uid', {
        uid: 'parent-uid',
      }).firestore();

      await testing.assertFails(
        parentDb.collection('grades').doc('grade-001').update({
          grade: 'A+',
        })
      );
    });
  });

  // ============ TEST CASE 7: Unauthorized Access Denial ============

  describe('TC7: Unauthorized & Unauthenticated Access Denial', () => {
    it('should deny unauthenticated access to schools collection', async () => {
      await setupTestData();

      const unauthDb = testEnv.unauthenticatedContext().firestore();

      await testing.assertFails(unauthDb.collection('schools').get());
    });

    it('should deny unauthenticated access to students collection', async () => {
      await setupTestData();

      const unauthDb = testEnv.unauthenticatedContext().firestore();

      await testing.assertFails(unauthDb.collection('students').get());
    });

    it('should deny unauthenticated access to attendance collection', async () => {
      await setupTestData();

      const unauthDb = testEnv.unauthenticatedContext().firestore();

      await testing.assertFails(unauthDb.collection('attendance').get());
    });

    it('should deny unauthenticated access to grades collection', async () => {
      await setupTestData();

      const unauthDb = testEnv.unauthenticatedContext().firestore();

      await testing.assertFails(unauthDb.collection('grades').get());
    });

    it('should deny unauthenticated access to users collection', async () => {
      await setupTestData();

      const unauthDb = testEnv.unauthenticatedContext().firestore();

      await testing.assertFails(unauthDb.collection('users').get());
    });

    it('should deny unauthenticated read of specific document', async () => {
      await setupTestData();

      const unauthDb = testEnv.unauthenticatedContext().firestore();

      await testing.assertFails(
        unauthDb.collection('schools').doc('school-001').get()
      );
    });

    it('should deny unauthenticated write to collection', async () => {
      await setupTestData();

      const unauthDb = testEnv.unauthenticatedContext().firestore();

      await testing.assertFails(
        unauthDb.collection('schools').doc('hack-school').set({
          schoolId: 'hack-school',
          name: 'Hacked School',
        })
      );
    });
  });

  // ============ EDGE CASES ============

  describe('Edge Cases - Security Validation', () => {
    it('should enforce school-level isolation for teachers', async () => {
      await setupTestData();

      const otherTeacherDb = testEnv.authenticatedContext('other-teacher-uid', {
        uid: 'other-teacher-uid',
      }).firestore();

      // Teacher from school-002 should not access students in school-001
      await testing.assertFails(
        otherTeacherDb.collection('students').doc('student-uid').get()
      );
    });

    it('should prevent data leakage via list queries', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      // Student should not be able to list all grades
      const gradesCollection = studentDb.collection('grades');
      const query = gradesCollection.where('schoolId', '==', 'school-001');

      // This would fail if the query returns grades not belonging to student
      await testing.assertFails(query.get());
    });

    it('should deny role escalation attempts', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      await testing.assertFails(
        studentDb.collection('users').doc('student-uid').update({
          role: 'admin',
        })
      );
    });

    it('should enforce user isolation in users collection', async () => {
      await setupTestData();

      const studentDb = testEnv.authenticatedContext('student-uid', {
        uid: 'student-uid',
      }).firestore();

      // Student should not access teacher's user document
      await testing.assertFails(
        studentDb.collection('users').doc('teacher-uid').get()
      );
    });

    it('should enforce least privilege on admin documents', async () => {
      await setupTestData();

      const teacherDb = testEnv.authenticatedContext('teacher-uid', {
        uid: 'teacher-uid',
      }).firestore();

      // Teacher should not access admin's user document
      await testing.assertFails(
        teacherDb.collection('users').doc('admin-uid').get()
      );
    });
  });
});
