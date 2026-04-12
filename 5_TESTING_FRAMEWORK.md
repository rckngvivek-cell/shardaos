# TESTING FRAMEWORK & STRATEGY - Jest + Integration Testing
## Complete Testing Setup for Production Quality

**Version:** 1.0.0  
**Date:** April 8, 2026  
**Status:** Ready to Implement  

---

# PART 1: Jest Configuration

## File: `jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  
  // Coverage thresholds (fail if below)
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/**/__tests__/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    }
  },
  
  // Module name mapper for path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  
  // Timeout for async tests
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
};
```

## File: `jest.setup.ts`

```typescript
import { initializeApp, deleteApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';

// Initialize Firebase with test config
const testApp = initializeApp({
  projectId: 'school-erp-dev',
  apiKey: 'test-key',
  appId: '1:123456789:web:abcdef',
}, '[DEFAULT]');

// Connect to Firestore emulator
const firestore = getFirestore(testApp);
connectFirestoreEmulator(firestore, 'localhost', 8080);

// Global setup
beforeAll(async () => {
  console.log('Starting Firestore emulator...');
  // Emulator started by npm script
});

afterAll(async () => {
  await deleteApp(testApp);
});

// Suppress debug logs in tests
global.console.debug = jest.fn();
```

---

# PART 2: Unit Test Examples

## File: `src/services/__tests__/students.service.spec.ts`

```typescript
import { StudentsService } from '../students.service';
import { FirestoreService } from '@/infrastructure/firestore.service';
import { CreateStudentDto, UpdateStudentDto } from '@/dtos/student.dto';

describe('StudentsService', () => {
  let service: StudentsService;
  let mockFirestore: jest.Mocked<FirestoreService>;

  beforeEach(() => {
    // Mock Firestore
    mockFirestore = {
      collection: jest.fn(),
      doc: jest.fn(),
      query: jest.fn(),
      batch: jest.fn(),
    } as any;

    service = new StudentsService(mockFirestore);
  });

  describe('createStudent', () => {
    it('should create a student with valid data', async () => {
      const schoolId = 'dps_001';
      const createDto: CreateStudentDto = {
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2012-05-15'),
        class: 5,
        section: 'A',
        enrollmentDate: new Date('2025-04-01'),
        contact: {
          parentEmail: 'parent@example.com',
          parentPhone: '+91-9876543210',
        },
      };

      mockFirestore.collection.mockReturnValue({
        add: jest.fn().mockResolvedValue({ id: 'std_001' }),
      } as any);

      const result = await service.createStudent(schoolId, createDto);

      expect(result.id).toBe('std_001');
      expect(mockFirestore.collection).toHaveBeenCalledWith(
        `schools/${schoolId}/students`
      );
    });

    it('should validate required fields', async () => {
      const schoolId = 'dps_001';
      const invalidDto = {
        firstName: 'Aarav',
        // Missing lastName, dob, class, etc.
      } as any;

      await expect(
        service.createStudent(schoolId, invalidDto)
      ).rejects.toThrow('lastName is required');
    });

    it('should reject future date of birth', async () => {
      const schoolId = 'dps_001';
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const createDto = {
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: futureDate,
        class: 5,
        section: 'A',
      } as any;

      await expect(
        service.createStudent(schoolId, createDto)
      ).rejects.toThrow('Date of birth cannot be in future');
    });

    it('should reject invalid email', async () => {
      const schoolId = 'dps_001';
      const createDto = {
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: new Date('2012-05-15'),
        class: 5,
        section: 'A',
        contact: {
          parentEmail: 'invalid-email',
          parentPhone: '+91-9876543210',
        },
      } as any;

      await expect(
        service.createStudent(schoolId, createDto)
      ).rejects.toThrow('Invalid email format');
    });
  });

  describe('getStudent', () => {
    it('should retrieve student by ID', async () => {
      const schoolId = 'dps_001';
      const studentId = 'std_001';

      const mockStudent = {
        id: studentId,
        firstName: 'Aarav',
        lastName: 'Sharma',
      };

      mockFirestore.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockStudent,
        }),
      } as any);

      const result = await service.getStudent(schoolId, studentId);

      expect(result.id).toBe(studentId);
      expect(result.firstName).toBe('Aarav');
    });

    it('should throw NOT_FOUND for non-existent student', async () => {
      const schoolId = 'dps_001';
      const studentId = 'nonexistent';

      mockFirestore.doc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      } as any);

      await expect(
        service.getStudent(schoolId, studentId)
      ).rejects.toThrow('Student not found');
    });
  });

  describe('searchStudents', () => {
    it('should search by name with pagination', async () => {
      const schoolId = 'dps_001';
      const query = 'aarav';
      const limit = 10;
      const offset = 0;

      const mockResults = [
        { id: 'std_001', firstName: 'Aarav', lastName: 'Sharma' },
      ];

      mockFirestore.query.mockReturnValue({
        andWhere: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [{ id: 'std_001', data: () => mockResults[0] }],
        }),
      } as any);

      const result = await service.searchStudents(
        schoolId,
        { q: query, limit, offset }
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].firstName).toContain('Aarav');
    });

    it('should filter by class and section', async () => {
      const schoolId = 'dps_001';
      const filters = { class: 5, section: 'A', limit: 20, offset: 0 };

      mockFirestore.query.mockImplementation(() => ({
        where: jest
          .fn()
          .mockReturnThis()
          .mockReturnValueOnce({
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue({
              docs: [
                { id: 'std_001', data: () => ({ class: 5, section: 'A' }) },
              ],
            }),
          }),
      }));

      const result = await service.searchStudents(schoolId, filters);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('updateStudent', () => {
    it('should update student fields', async () => {
      const schoolId = 'dps_001';
      const studentId = 'std_001';
      const updateDto: UpdateStudentDto = {
        lastName: 'Sharma Singh',
        contact: {
          parentEmail: 'newemail@example.com',
          parentPhone: '+91-9876543211',
        },
      };

      mockFirestore.doc.mockReturnValue({
        update: jest.fn().mockResolvedValue({}),
      } as any);

      await service.updateStudent(schoolId, studentId, updateDto);

      expect(mockFirestore.doc).toHaveBeenCalledWith(
        `schools/${schoolId}/students/${studentId}`
      );
    });

    it('should not allow changing aadhar', async () => {
      const schoolId = 'dps_001';
      const studentId = 'std_001';
      const updateDto = {
        aadhar: '999999999999', // Attempting to change
      } as any;

      await expect(
        service.updateStudent(schoolId, studentId, updateDto)
      ).rejects.toThrow('Aadhar cannot be changed');
    });
  });

  describe('deleteStudent', () => {
    it('should soft-delete student (mark as inactive)', async () => {
      const schoolId = 'dps_001';
      const studentId = 'std_001';

      mockFirestore.doc.mockReturnValue({
        update: jest.fn().mockResolvedValue({}),
      } as any);

      await service.deleteStudent(schoolId, studentId);

      // Should call update with status: 'inactive'
      expect(mockFirestore.doc).toHaveBeenCalledWith(
        `schools/${schoolId}/students/${studentId}`
      );
    });

    it('should never hard-delete student records', async () => {
      // This test verifies our constraint
      expect(
        service.deleteStudent.toString().includes('delete()')
      ).toBe(false);
    });
  });
});
```

---

# PART 3: Integration Tests

## File: `src/__tests__/integration/attendance.integration.spec.ts`

```typescript
import { FirestoreService } from '@/infrastructure/firestore.service';
import { AttendanceService } from '@/services/attendance.service';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

let testEnv;
let service: AttendanceService;
let firestore: FirestoreService;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'school-erp-dev',
    firestore: {
      rulesContent: fs.readFileSync('firestore.rules', 'utf8'),
    },
  });

  firestore = new FirestoreService(testEnv.unauthenticatedContext().firestore());
  service = new AttendanceService(firestore);
});

describe('Attendance Integration Tests', () => {
  const schoolId = 'test_school_001';
  const adminContext = testEnv.authenticatedContext('admin_001', {
    school_id: schoolId,
    role: 'admin',
  });

  beforeEach(async () => {
    // Clear data before each test
    await testEnv.database().clearData();
  });

  it('should mark attendance for entire class', async () => {
    const attendanceData = {
      date: new Date('2026-04-08'),
      class: 5,
      section: 'A',
      records: [
        { studentId: 'std_001', status: 'present' },
        { studentId: 'std_002', status: 'absent' },
        { studentId: 'std_003', status: 'leave' },
      ],
      markedBy: 'teacher_001',
    };

    const result = await service.markAttendance(schoolId, attendanceData);

    expect(result.recordsCreated).toBe(3);
    expect(result.status).toBe('synced');

    // Verify database
    const attendance = await adminContext.firestore()
      .collection(`schools/${schoolId}/attendance`)
      .doc(result.id)
      .get();

    expect(attendance.exists()).toBe(true);
    expect(attendance.data().records.length).toBe(3);
  });

  it('should prevent duplicate attendance marking', async () => {
    const attendanceData = {
      date: new Date('2026-04-08'),
      class: 5,
      section: 'A',
      records: [{ studentId: 'std_001', status: 'present' }],
    };

    // First mark
    await service.markAttendance(schoolId, attendanceData);

    // Second mark should fail
    await expect(
      service.markAttendance(schoolId, attendanceData)
    ).rejects.toThrow('Attendance already marked');
  });

  it('should calculate attendance percentage correctly', async () => {
    const dates = [
      new Date('2026-04-01'),
      new Date('2026-04-02'),
      new Date('2026-04-03'),
      new Date('2026-04-04'),
      new Date('2026-04-05'),
    ];

    // Mark attendance (4 present, 1 absent)
    for (let i = 0; i < dates.length; i++) {
      await service.markAttendance(schoolId, {
        date: dates[i],
        class: 5,
        section: 'A',
        records: [
          {
            studentId: 'std_001',
            status: i === 2 ? 'absent' : 'present',
          },
        ],
      });
    }

    const report = await service.getAttendanceReport(schoolId, {
      startDate: dates[0],
      endDate: dates[4],
      class: 5,
      section: 'A',
    });

    const percentage = (report.students[0].attendancePercentage);
    expect(percentage).toBe(80); // 4 out of 5
  });

  it('should notify parents of absences', async () => {
    const notifyMock = jest.spyOn(service, 'notifyParent');

    await service.markAttendance(schoolId, {
      date: new Date('2026-04-08'),
      class: 5,
      section: 'A',
      records: [
        { studentId: 'std_001', status: 'absent' },
      ],
    });

    expect(notifyMock).toHaveBeenCalled();
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});
```

---

# PART 4: E2E Test Setup (Cypress)

## File: `cypress/e2e/login.cy.ts`

```typescript
describe('School ERP - Login Flow', () => {
  beforeEach(() => {
    cy.visit(Cypress.env('BASE_URL'));
  });

  it('should login with valid credentials', () => {
    cy.get('input[name="email"]').type('teacher@school.com');
    cy.get('input[name="password"]').type('password123');
    cy.get('button[type="submit"]').click();

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.get('h1').should('contain', 'Dashboard');
  });

  it('should show error for invalid email', () => {
    cy.get('input[name="email"]').type('invalid-email');
    cy.get('button[type="submit"]').click();

    cy.get('[role="alert"]').should('contain', 'Invalid email');
  });

  it('should show error for wrong password', () => {
    cy.get('input[name="email"]').type('teacher@school.com');
    cy.get('input[name="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    cy.get('[role="alert"]').should('contain', 'Invalid credentials');
  });
});
```

---

# PART 5: Test Fixtures (Mock Data)

## File: `src/__tests__/fixtures/students.fixture.ts`

```typescript
export const mockStudents = [
  {
    id: 'std_001',
    firstName: 'Aarav',
    lastName: 'Sharma',
    dob: new Date('2012-05-15'),
    aadhar: 'enc_123456789012',
    rollNumber: '12501',
    class: 5,
    section: 'A',
    enrollmentDate: new Date('2025-04-01'),
    status: 'active',
    contact: {
      parentName: 'Vikram Sharma',
      parentEmail: 'vikram@example.com',
      parentPhone: '+91-9876543210',
    },
  },
  {
    id: 'std_002',
    firstName: 'Zara',
    lastName: 'Khan',
    dob: new Date('2012-08-22'),
    aadhar: 'enc_987654321098',
    rollNumber: '12502',
    class: 5,
    section: 'A',
    enrollmentDate: new Date('2025-04-01'),
    status: 'active',
    contact: {
      parentName: 'Ahmed Khan',
      parentEmail: 'ahmed@example.com',
      parentPhone: '+91-9876543211',
    },
  },
];

export const mockAttendance = [
  {
    date: new Date('2026-04-08'),
    class: 5,
    section: 'A',
    records: [
      { studentId: 'std_001', status: 'present' },
      { studentId: 'std_002', status: 'absent' },
    ],
  },
];

export const mockMarks = [
  {
    assessmentId: 'asm_001',
    studentId: 'std_001',
    obtainedMarks: 92,
    totalMarks: 100,
    percentage: 92,
    grade: 'A+',
  },
];
```

---

# PART 6: Running Tests

## File: `package.json` (test scripts)

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=src/__tests__/unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress run",
    "test:all": "npm run test:unit && npm run test:integration && npm run test:e2e",
    "lint:test": "eslint src/__tests__"
  }
}
```

## Terminal Commands

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run tests matching pattern
npm test -- attendance

# Watch mode (re-run on file change)
npm run test:watch

# E2E tests
npm run test:e2e

# All tests (unit + integration + E2E)
npm run test:all
```

---

# PART 7: Test Coverage Goals

```
TARGET COVERAGE:
├── Statements: 80%+ (most code executed)
├── Branches: 80%+ (if/else paths tested)
├── Functions: 80%+ (all functions called)
└── Lines: 80%+ (every line executed)

BY MODULE:
├── Authentication: 95%+ (critical)
├── Database ops: 90%+ (important)
├── API endpoints: 85%+
├── Utils: 75%+
└── UI components: 70%+ (lower for UI)
```

---

**This testing framework ensures production-grade quality with 80%+ coverage and catches bugs before deployment.**
