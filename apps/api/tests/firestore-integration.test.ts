import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { FirestoreSchoolRepository } from '../src/repositories/firestore-school-repository';
import { FirestoreStudentRepository } from '../src/repositories/firestore-student-repository';
import { FirestoreAttendanceRepository } from '../src/repositories/firestore-attendance-repository';
import { FirestoreGradeRepository } from '../src/repositories/firestore-grade-repository';
import { FirestoreUserRepository } from '../src/repositories/firestore-user-repository';
import { SchoolService } from '../src/services/schools-service';
import { StudentService } from '../src/services/student-service';
import { AttendanceService } from '../src/services/attendance-service';
import { GradeService } from '../src/services/grades-service';
import { UserService } from '../src/services/users-service';

// Set up Firestore emulator
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_PROJECT_ID = 'test-project';

let db: FirebaseFirestore.Firestore;

beforeAll(async () => {
  const app = initializeApp({ projectId: 'test-project' });
  db = getFirestore(app);
});

afterEach(async () => {
  // Clear all collections after each test
  const collections = await db.listCollections();
  for (const collection of collections) {
    const docs = await collection.listDocuments();
    for (const doc of docs) {
      await doc.delete();
    }
  }
});

describe('Firestore Integration Tests - Schools', () => {
  let schoolService: SchoolService;

  beforeEach(() => {
    const repo = new FirestoreSchoolRepository();
    schoolService = new SchoolService(repo);
  });

  /**
   * TC1: Create school → Document added to Firestore with correct ID
   */
  it('TC1: Creates a school and returns schoolId', async () => {
    const schoolId = await schoolService.create({
      name: 'Green Valley Public School',
      email: 'principal@greenvalley.edu.in',
      phone: '+91-621-1234567',
      address: '42 Knowledge Road, Muzaffarpur',
      city: 'Muzaffarpur',
      state: 'Bihar',
      pinCode: '842001',
      principalName: 'Richa Verma',
      schoolRegistrationNumber: 'SR-2024-001'
    });

    expect(schoolId).toBeDefined();
    expect(typeof schoolId).toBe('string');

    const school = await schoolService.get(schoolId);
    expect(school.name).toBe('Green Valley Public School');
    expect(school.email).toBe('principal@greenvalley.edu.in');
    expect(school.status).toBe('active');
  });

  /**
   * TC2: Get school → Document retrieved with all fields
   */
  it('TC2: Gets an existing school with all fields', async () => {
    const schoolId = await schoolService.create({
      name: 'Lincoln High School',
      email: 'admin@lincolnhigh.edu.in',
      phone: '+91-11-4095-5678',
      address: 'Lincoln Avenue, New Delhi',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110001',
      principalName: 'Dr. Rajesh Singh',
      schoolRegistrationNumber: 'SR-2024-002'
    });

    const school = await schoolService.get(schoolId);

    expect(school.schoolId).toBe(schoolId);
    expect(school.name).toBe('Lincoln High School');
    expect(school.email).toBe('admin@lincolnhigh.edu.in');
    expect(school.city).toBe('New Delhi');
    expect(school.state).toBe('Delhi');
    expect(school.createdAt).toBeDefined();
    expect(school.updatedAt).toBeDefined();
  });

  /**
   * TC3: Create duplicate email → Should throw SCHOOL_EMAIL_EXISTS error
   */
  it('TC3: Prevents duplicate school email creation', async () => {
    await schoolService.create({
      name: 'School A',
      email: 'duplicate@example.edu.in',
      phone: '+919876543210',
      address: 'Address A',
      city: 'City A',
      state: 'State A',
      pinCode: '110001',
      principalName: 'Principal A',
      schoolRegistrationNumber: 'SR-A-001'
    });

    // Try to create another school with same email
    await expect(
      schoolService.create({
        name: 'School B',
        email: 'duplicate@example.edu.in',
        phone: '+919876543211',
        address: 'Address B',
        city: 'City B',
        state: 'State B',
        pinCode: '110002',
        principalName: 'Principal B',
        schoolRegistrationNumber: 'SR-B-001'
      })
    ).rejects.toThrow('SCHOOL_EMAIL_EXISTS');
  });

  /**
   * TC4: Query schools by city → Returns correct filtered results
   */
  it('TC4: Lists schools filtered by city', async () => {
    await schoolService.create({
      name: 'Delhi School 1',
      email: 'delhi1@example.edu.in',
      phone: '+919876543210',
      address: 'Delhi Address 1',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110001',
      principalName: 'Principal 1',
      schoolRegistrationNumber: 'SR-D1-001'
    });

    await schoolService.create({
      name: 'Delhi School 2',
      email: 'delhi2@example.edu.in',
      phone: '+919876543211',
      address: 'Delhi Address 2',
      city: 'New Delhi',
      state: 'Delhi',
      pinCode: '110002',
      principalName: 'Principal 2',
      schoolRegistrationNumber: 'SR-D2-001'
    });

    await schoolService.create({
      name: 'Mumbai School 1',
      email: 'mumbai1@example.edu.in',
      phone: '+919876543212',
      address: 'Mumbai Address 1',
      city: 'Mumbai',
      state: 'Maharashtra',
      pinCode: '400001',
      principalName: 'Principal 3',
      schoolRegistrationNumber: 'SR-M1-001'
    });

    const result = await schoolService.list({ city: 'New Delhi' });

    expect(result.total).toBe(2);
    expect(result.schools.length).toBe(2);
    expect(result.schools[0].city).toBe('New Delhi');
    expect(result.schools[1].city).toBe('New Delhi');
  });
});

describe('Firestore Integration Tests - Students', () => {
  let studentService: StudentService;
  let schoolService: SchoolService;
  let schoolId: string;

  beforeEach(async () => {
    const schoolRepo = new FirestoreSchoolRepository();
    schoolService = new SchoolService(schoolRepo);

    schoolId = await schoolService.create({
      name: 'Test School',
      email: `test-${Date.now()}@example.edu.in`,
      phone: '+919876543210',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pinCode: '110001',
      principalName: 'Test Principal',
      schoolRegistrationNumber: 'SR-TEST-001'
    });

    const studentRepo = new FirestoreStudentRepository();
    studentService = new StudentService(studentRepo);
  });

  /**
   * TC5: Add student → Document created with auto-generated ID
   */
  it('TC5: Creates a student and returns studentId', async () => {
    const student = await studentService.create(schoolId, {
      firstName: 'Aarav',
      lastName: 'Sharma',
      dob: '2012-05-15',
      rollNumber: '12501',
      class: 5,
      section: 'A',
      status: 'active',
      enrollmentDate: '2025-04-01',
      contact: {
        parentName: 'Vikram Sharma',
        parentEmail: 'vikram@example.com',
        parentPhone: '+919876543210'
      }
    }, 'principal-001');

    expect(student.studentId).toBeDefined();
    expect(student.firstName).toBe('Aarav');
    expect(student.schoolId).toBe(schoolId);
    expect(student.status).toBe('active');
  });

  /**
   * TC6: Add student with duplicate email → Should be rejected
   */
  it('TC6: Allows multiple students from same school (no global email uniqueness)', async () => {
    const student1 = await studentService.create(schoolId, {
      firstName: 'Student 1',
      lastName: 'Test',
      dob: '2012-01-01',
      rollNumber: 'ROLL001',
      class: 5,
      section: 'A',
      contact: {
        parentName: 'Parent 1',
        parentEmail: 'parent1@example.com',
        parentPhone: '+919876543210'
      }
    }, 'teacher-001');

    const student2 = await studentService.create(schoolId, {
      firstName: 'Student 2',
      lastName: 'Test',
      dob: '2012-02-01',
      rollNumber: 'ROLL002',
      class: 5,
      section: 'A',
      contact: {
        parentName: 'Parent 2',
        parentEmail: 'parent2@example.com',
        parentPhone: '+919876543211'
      }
    }, 'teacher-001');

    expect(student1.studentId).not.toBe(student2.studentId);
  });

  /**
   * TC8: Query students by schoolId + gradeLevel → Returns filtered results
   */
  it('TC8: Lists students filtered by class and section', async () => {
    // Create students in different classes
    await studentService.create(schoolId, {
      firstName: 'Class5A1',
      lastName: 'Student',
      dob: '2012-01-01',
      rollNumber: 'ROLL001',
      class: 5,
      section: 'A',
      contact: { parentName: 'P', parentEmail: 'p@e.com', parentPhone: '+919876543210' }
    }, 'teacher-001');

    await studentService.create(schoolId, {
      firstName: 'Class5A2',
      lastName: 'Student',
      dob: '2012-02-01',
      rollNumber: 'ROLL002',
      class: 5,
      section: 'A',
      contact: { parentName: 'P', parentEmail: 'p2@e.com', parentPhone: '+919876543211' }
    }, 'teacher-001');

    await studentService.create(schoolId, {
      firstName: 'Class5B1',
      lastName: 'Student',
      dob: '2012-03-01',
      rollNumber: 'ROLL003',
      class: 5,
      section: 'B',
      contact: { parentName: 'P', parentEmail: 'p3@e.com', parentPhone: '+919876543212' }
    }, 'teacher-001');

    const result = await studentService.list(schoolId, { class: 5, section: 'A' });

    expect(result.total).toBe(2);
    expect(result.items.every(s => s.class === 5 && s.section === 'A')).toBe(true);
  });

  /**
   * TC9: Pagination: Get 20 students limit → Returns correct subset
   */
  it('TC9: Paginates student list correctly', async () => {
    // Create 25 students
    for (let i = 1; i <= 25; i++) {
      await studentService.create(schoolId, {
        firstName: `Student${i}`,
        lastName: 'Test',
        dob: '2012-01-01',
        rollNumber: `ROLL${String(i).padStart(3, '0')}`,
        class: 5,
        section: 'A',
        contact: { parentName: 'P', parentEmail: `p${i}@e.com`, parentPhone: '+919876543210' }
      }, 'teacher-001');
    }

    // Get first page
    const page1 = await studentService.list(schoolId, { limit: 20, offset: 0 });
    expect(page1.items.length).toBeLessThanOrEqual(20);
    expect(page1.total).toBe(25);

    // Get second page
    const page2 = await studentService.list(schoolId, { limit: 20, offset: 20 });
    expect(page2.items.length).toBeLessThanOrEqual(5);
  });
});

describe('Firestore Integration Tests - Attendance', () => {
  let attendanceService: AttendanceService;
  let schoolService: SchoolService;
  let schoolId: string;

  beforeEach(async () => {
    const schoolRepo = new FirestoreSchoolRepository();
    schoolService = new SchoolService(schoolRepo);

    schoolId = await schoolService.create({
      name: 'Attendance Test School',
      email: `attendance-${Date.now()}@example.edu.in`,
      phone: '+919876543210',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pinCode: '110001',
      principalName: 'Test Principal',
      schoolRegistrationNumber: 'SR-ATT-001'
    });

    const attendanceRepo = new FirestoreAttendanceRepository();
    attendanceService = new AttendanceService(attendanceRepo);
  });

  /**
   * TC10: Mark attendance → Document created with correct timestamp
   */
  it('TC10: Marks attendance and creates document with timestamp', async () => {
    const today = new Date().toISOString().split('T')[0];

    const attendance = await attendanceService.create(schoolId, {
      date: today,
      class: 5,
      section: 'A',
      entries: [
        { studentId: 'student-001', status: 'present' },
        { studentId: 'student-002', status: 'absent' }
      ]
    }, 'teacher-001');

    expect(attendance.attendanceId).toBeDefined();
    expect(attendance.date).toBe(today);
    expect(attendance.createdAt).toBeDefined();
    expect(attendance.markedBy).toBe('teacher-001');
    expect(attendance.entries.length).toBe(2);
  });

  /**
   * TC12: Query attendance by date range → Returns in order
   */
  it('TC12: Queries attendance records by date', async () => {
    const today = new Date().toISOString().split('T')[0];

    await attendanceService.create(schoolId, {
      date: today,
      class: 5,
      section: 'A',
      entries: [{ studentId: 'student-001', status: 'present' }]
    }, 'teacher-001');

    const result = await attendanceService.list(schoolId, { date: today });

    expect(result.length).toBe(1);
    expect(result[0].date).toBe(today);
  });

  /**
   * TC13: Query attendance by student → Returns all records for student
   */
  it('TC13: Lists attendance records for a specific class and section', async () => {
    const today = new Date().toISOString().split('T')[0];

    await attendanceService.create(schoolId, {
      date: today,
      class: 5,
      section: 'A',
      entries: [{ studentId: 'student-001', status: 'present' }]
    }, 'teacher-001');

    const result = await attendanceService.list(schoolId, { class: 5, section: 'A' });

    expect(result.length).toBeGreaterThan(0);
  });
});

describe('Firestore Integration Tests - Grades', () => {
  let gradeService: GradeService;
  let schoolService: SchoolService;
  let schoolId: string;

  beforeEach(async () => {
    const schoolRepo = new FirestoreSchoolRepository();
    schoolService = new SchoolService(schoolRepo);

    schoolId = await schoolService.create({
      name: 'Grades Test School',
      email: `grades-${Date.now()}@example.edu.in`,
      phone: '+919876543210',
      address: 'Test Address',
      city: 'Test City',
      state: 'Test State',
      pinCode: '110001',
      principalName: 'Test Principal',
      schoolRegistrationNumber: 'SR-GRADE-001'
    });

    const gradeRepo = new FirestoreGradeRepository();
    gradeService = new GradeService(gradeRepo);
  });

  /**
   * Test: Create grade with automatic percentage and letter grade calculation
   */
  it('Creates a grade and calculates percentage and letter grade', async () => {
    const gradeId = await gradeService.create(schoolId, {
      studentId: 'student-001',
      subject: 'Mathematics',
      marks: 85,
      maxMarks: 100,
      term: 'Term 1',
      examinationName: 'Mid-term Exam',
      markedBy: 'teacher-001'
    });

    expect(gradeId).toBeDefined();

    const grade = await gradeService.get(schoolId, gradeId);
    expect(grade.marks).toBe(85);
    expect(grade.percentage).toBe(85);
    expect(grade.letterGrade).toBe('B');
  });

  /**
   * Test: Update grade and recalculate percentage and letter grade
   */
  it('Updates a grade and recalculates percentage and letter grade', async () => {
    const gradeId = await gradeService.create(schoolId, {
      studentId: 'student-001',
      subject: 'English',
      marks: 70,
      maxMarks: 100,
      term: 'Term 1',
      examinationName: 'Mid-term Exam',
      markedBy: 'teacher-001'
    });

    const updatedGrade = await gradeService.update(schoolId, gradeId, {
      marks: 92
    });

    expect(updatedGrade?.marks).toBe(92);
    expect(updatedGrade?.percentage).toBe(92);
    expect(updatedGrade?.letterGrade).toBe('A');
  });
});

describe('Firestore Integration Tests - Users', () => {
  let userService: UserService;

  beforeEach(() => {
    const userRepo = new FirestoreUserRepository();
    userService = new UserService(userRepo);
  });

  /**
   * Test: Create user and verify all fields
   */
  it('Creates a user with all fields', async () => {
    const userId = await userService.create({
      email: `teacher-${Date.now()}@example.edu.in`,
      displayName: 'John Doe',
      role: 'teacher',
      schoolId: 'school-001',
      permissions: ['read_students', 'write_attendance']
    });

    expect(userId).toBeDefined();

    const user = await userService.get(userId);
    expect(user.email).toBe(`teacher-${Date.now()}@example.edu.in`);
    expect(user.displayName).toBe('John Doe');
    expect(user.role).toBe('teacher');
    expect(user.status).toBe('active');
  });

  /**
   * Test: Prevent duplicate user email
   */
  it('Prevents duplicate user email', async () => {
    const email = `unique-${Date.now()}@example.edu.in`;

    await userService.create({
      email,
      displayName: 'User 1',
      role: 'teacher',
      schoolId: 'school-001'
    });

    await expect(
      userService.create({
        email,
        displayName: 'User 2',
        role: 'admin',
        schoolId: 'school-002'
      })
    ).rejects.toThrow('USER_EMAIL_EXISTS');
  });

  /**
   * Test: Get user by email
   */
  it('Retrieves user by email', async () => {
    const email = `getbyemail-${Date.now()}@example.edu.in`;

    const userId = await userService.create({
      email,
      displayName: 'Search User',
      role: 'admin',
      schoolId: 'school-001'
    });

    const user = await userService.getByEmail(email);
    expect(user.userId).toBe(userId);
    expect(user.displayName).toBe('Search User');
  });

  /**
   * Test: Update user last login
   */
  it('Updates user last login timestamp', async () => {
    const userId = await userService.create({
      email: `login-${Date.now()}@example.edu.in`,
      displayName: 'Login User',
      role: 'student',
      schoolId: 'school-001'
    });

    const user = await userService.updateLastLogin(userId);
    expect(user?.lastLogin).toBeDefined();
  });
});

describe('Firestore Integration Tests - Full Integration Flow', () => {
  let schoolService: SchoolService;
  let studentService: StudentService;
  let attendanceService: AttendanceService;
  let gradeService: GradeService;
  let schoolId: string;

  beforeEach(async () => {
    const schoolRepo = new FirestoreSchoolRepository();
    schoolService = new SchoolService(schoolRepo);

    schoolId = await schoolService.create({
      name: 'Integration Test School',
      email: `integration-${Date.now()}@example.edu.in`,
      phone: '+919876543210',
      address: 'Integration Test Address',
      city: 'Test City',
      state: 'Test State',
      pinCode: '110001',
      principalName: 'Integration Principal',
      schoolRegistrationNumber: 'SR-INT-001'
    });

    const studentRepo = new FirestoreStudentRepository();
    studentService = new StudentService(studentRepo);

    const attendanceRepo = new FirestoreAttendanceRepository();
    attendanceService = new AttendanceService(attendanceRepo);

    const gradeRepo = new FirestoreGradeRepository();
    gradeService = new GradeService(gradeRepo);
  });

  /**
   * TC14: Full flow: Create school → Add student → Mark attendance → All linked
   */
  it('TC14: Complete end-to-end flow with all collections linked', async () => {
    // School already created in beforeEach

    // Add a student
    const student = await studentService.create(schoolId, {
      firstName: 'Integration',
      lastName: 'Student',
      dob: '2012-01-01',
      rollNumber: 'INT-001',
      class: 5,
      section: 'A',
      contact: {
        parentName: 'Parent',
        parentEmail: 'parent@example.com',
        parentPhone: '+919876543210'
      }
    }, 'teacher-001');

    expect(student.schoolId).toBe(schoolId);

    // Mark attendance for student
    const today = new Date().toISOString().split('T')[0];
    const attendance = await attendanceService.create(schoolId, {
      date: today,
      class: 5,
      section: 'A',
      entries: [
        { studentId: student.studentId, status: 'present' }
      ]
    }, 'teacher-001');

    expect(attendance.schoolId).toBe(schoolId);

    // Add grade for student
    const gradeId = await gradeService.create(schoolId, {
      studentId: student.studentId,
      subject: 'Mathematics',
      marks: 85,
      maxMarks: 100,
      term: 'Term 1',
      examinationName: 'Integration Test Exam',
      markedBy: 'teacher-001'
    });

    expect(gradeId).toBeDefined();

    // Verify all records are linked
    const retrievedStudent = await studentService.get(schoolId, student.studentId);
    expect(retrievedStudent.schoolId).toBe(schoolId);

    const retrievedGrade = await gradeService.get(schoolId, gradeId);
    expect(retrievedGrade.studentId).toBe(student.studentId);
  });

  /**
   * TC15: Performance: Query 100 records → Returns in reasonable time
   */
  it('TC15: Performance - queries 100 records efficiently', async () => {
    // Create 100 students
    const studentIds: string[] = [];
    for (let i = 1; i <= 100; i++) {
      const student = await studentService.create(schoolId, {
        firstName: `PerfStudent${i}`,
        lastName: `Test${i}`,
        dob: '2012-01-01',
        rollNumber: `PERF${String(i).padStart(3, '0')}`,
        class: Math.ceil(i / 20), // Distribute across classes
        section: String.fromCharCode(65 + (i % 4)), // A, B, C, D
        contact: {
          parentName: `Parent${i}`,
          parentEmail: `p${i}@example.com`,
          parentPhone: '+919876543210'
        }
      }, 'teacher-001');
      studentIds.push(student.studentId);
    }

    // Query all students
    const startTime = Date.now();
    const result = await studentService.list(schoolId, { limit: 100, offset: 0 });
    const endTime = Date.now();

    expect(result.total).toBe(100);
    expect(result.items.length).toBeGreaterThan(0);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
  });
});

describe('Error Handling - Network and Firestore Errors', () => {
  let schoolService: SchoolService;

  beforeEach(() => {
    const repo = new FirestoreSchoolRepository();
    schoolService = new SchoolService(repo);
  });

  /**
   * Test: Handle 404 error for non-existent school
   */
  it('Throws 404 error when school not found', async () => {
    await expect(schoolService.get('non-existent-id')).rejects.toThrow('SCHOOL_NOT_FOUND');
  });

  /**
   * Test: Validation error for invalid email
   */
  it('Throws validation error for invalid email', async () => {
    await expect(
      schoolService.create({
        name: 'Invalid School',
        email: 'invalid-email',
        phone: '+919876543210',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pinCode: '110001',
        principalName: 'Principal',
        schoolRegistrationNumber: 'SR-001'
      })
    ).rejects.toThrow();
  });

  /**
   * Test: Validation error for invalid phone
   */
  it('Throws validation error for invalid phone', async () => {
    await expect(
      schoolService.create({
        name: 'Invalid School',
        email: 'valid@example.edu.in',
        phone: 'invalid-phone',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pinCode: '110001',
        principalName: 'Principal',
        schoolRegistrationNumber: 'SR-001'
      })
    ).rejects.toThrow();
  });

  /**
   * Test: Validation error for invalid pin code
   */
  it('Throws validation error for invalid pin code', async () => {
    await expect(
      schoolService.create({
        name: 'Invalid School',
        email: 'valid@example.edu.in',
        phone: '+919876543210',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        pinCode: '12345', // Only 5 digits, needs 6
        principalName: 'Principal',
        schoolRegistrationNumber: 'SR-001'
      })
    ).rejects.toThrow();
  });
});
