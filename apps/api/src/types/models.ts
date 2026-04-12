/**
 * Comprehensive TypeScript Models and Interfaces for Firestore Collections
 * All 5 collections: schools, students, attendance, grades, users
 */

// ============================================================================
// SCHOOLS COLLECTION
// ============================================================================

export interface School {
  schoolId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  principalName: string;
  schoolRegistrationNumber: string;
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
  status: 'active' | 'inactive' | 'suspended';
}

export interface CreateSchoolInput {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pinCode: string;
  principalName: string;
  schoolRegistrationNumber: string;
}

export interface UpdateSchoolInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  principalName?: string;
  schoolRegistrationNumber?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

export interface SchoolQuery {
  city?: string;
  state?: string;
  status?: 'active' | 'inactive' | 'suspended';
  limit: number;
  offset: number;
}

// ============================================================================
// STUDENTS COLLECTION (under /schools/{schoolId}/students)
// ============================================================================

export interface Student {
  studentId: string;
  schoolId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string; // ISO 8601 date (YYYY-MM-DD)
  gender?: 'M' | 'F' | 'O';
  aadhar?: string; // 12-digit Aadhar number
  rollNumber: string;
  class: number; // 1-12
  section: string; // A, B, C, etc.
  enrollmentDate: string; // ISO 8601 date
  status: 'active' | 'inactive' | 'transferred' | 'left' | 'deleted';
  contact: {
    parentName: string;
    parentEmail?: string;
    parentPhone: string;
    emergencyContact?: string;
    emergencyContactName?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  medicalInfo?: {
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
  };
  documents?: {
    birthCertificate?: string;
    aadharCopy?: string;
    parentIdProof?: string;
    transferCertificate?: string;
  };
  archivedAt?: string; // ISO 8601 timestamp
  metadata: {
    createdAt: string; // ISO 8601 timestamp
    updatedAt: string; // ISO 8601 timestamp
    createdBy: string; // userId
    lastUpdatedBy: string; // userId
  };
}

export interface CreateStudentInput {
  firstName: string;
  middleName?: string;
  lastName: string;
  dob: string;
  gender?: 'M' | 'F' | 'O';
  aadhar?: string;
  rollNumber: string;
  class: number;
  section: string;
  enrollmentDate?: string;
  status?: 'active' | 'inactive' | 'transferred' | 'left' | 'deleted';
  contact: {
    parentName: string;
    parentEmail?: string;
    parentPhone: string;
    emergencyContact?: string;
    emergencyContactName?: string;
  };
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  medicalInfo?: {
    bloodGroup?: string;
    allergies?: string;
    chronicConditions?: string;
  };
  documents?: {
    birthCertificate?: string;
    aadharCopy?: string;
    parentIdProof?: string;
    transferCertificate?: string;
  };
}

export interface UpdateStudentInput {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dob?: string;
  gender?: 'M' | 'F' | 'O';
  aadhar?: string;
  rollNumber?: string;
  class?: number;
  section?: string;
  enrollmentDate?: string;
  status?: 'active' | 'inactive' | 'transferred' | 'left' | 'deleted';
  contact?: Partial<Student['contact']>;
  address?: Partial<Student['address']>;
  medicalInfo?: Partial<Student['medicalInfo']>;
  documents?: Partial<Student['documents']>;
}

export interface StudentQuery {
  q?: string; // Search query (name, rollNumber, aadhar)
  class?: number;
  section?: string;
  status?: 'active' | 'inactive' | 'transferred' | 'left' | 'deleted';
  limit: number;
  offset: number;
}

// ============================================================================
// ATTENDANCE COLLECTION (under /schools/{schoolId}/attendance)
// ============================================================================

export type AttendanceStatus = 'present' | 'absent' | 'leave' | 'late';

export interface AttendanceEntry {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  schoolId: string;
  date: string; // ISO 8601 date (YYYY-MM-DD)
  class: number; // 1-12
  section: string;
  period?: number; // Period number (1-12)
  entries: AttendanceEntry[];
  markedBy: string; // userId of teacher/admin who marked
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface CreateAttendanceInput {
  date: string;
  class: number;
  section: string;
  period?: number;
  entries: AttendanceEntry[];
}

export interface AttendanceQuery {
  date?: string;
  class?: number;
  section?: string;
}

// ============================================================================
// GRADES COLLECTION (under /schools/{schoolId}/grades)
// ============================================================================

export type LetterGrade = 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';

export interface Grade {
  gradeId: string;
  schoolId: string;
  studentId: string;
  subject: string;
  marks: number;
  maxMarks: number;
  percentage: number;
  letterGrade: LetterGrade;
  term: string; // e.g., "Term 1", "Semester 1"
  examinationName: string; // e.g., "Mid-term Exam", "Final Exam"
  markedBy: string; // userId of teacher who marked
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

export interface CreateGradeInput {
  studentId: string;
  subject: string;
  marks: number;
  maxMarks: number;
  term: string;
  examinationName: string;
  markedBy: string;
  percentage?: number; // Optional, will be calculated
  letterGrade?: LetterGrade; // Optional, will be calculated
}

export interface UpdateGradeInput {
  subject?: string;
  marks?: number;
  maxMarks?: number;
  term?: string;
  examinationName?: string;
  markedBy?: string;
  percentage?: number;
  letterGrade?: LetterGrade;
}

export interface GradeQuery {
  studentId?: string;
  subject?: string;
  term?: string;
  limit: number;
  offset: number;
}

// ============================================================================
// USERS COLLECTION (Auth/Identity Management)
// ============================================================================

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';
export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId: string; // Reference to school
  permissions: string[]; // Fine-grained permissions
  createdAt: string; // ISO 8601 timestamp
  lastLogin?: string; // ISO 8601 timestamp
  status: UserStatus;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  role: UserRole;
  schoolId: string;
  permissions?: string[];
  status?: UserStatus;
}

export interface UpdateUserInput {
  displayName?: string;
  permissions?: string[];
  status?: UserStatus;
  lastLogin?: string;
}

export interface UserQuery {
  schoolId?: string;
  role?: UserRole;
  status?: UserStatus;
  limit: number;
  offset: number;
}

// ============================================================================
// FIRESTORE DOCUMENT SCHEMAS (Summary)
// ============================================================================

/**
 * FIRESTORE COLLECTION STRUCTURE:
 *
 * schools/
 *   {schoolId}
 *     ├─ name: string
 *     ├─ email: string (unique)
 *     ├─ city: string (indexed)
 *     ├─ state: string (indexed)
 *     ├─ createdAt: timestamp (indexed, descending)
 *     ├─ status: string (indexed)
 *     └─ ... (other fields)
 *
 * schools/{schoolId}/students/
 *   {studentId}
 *     ├─ schoolId: string (indexed)
 *     ├─ email: string (indexed)
 *     ├─ class: number (composite index with status)
 *     ├─ status: string (indexed)
 *     ├─ enrollmentDate: date (composite index)
 *     └─ ... (other fields)
 *
 * schools/{schoolId}/attendance/
 *   {attendanceId}
 *     ├─ schoolId: string (indexed)
 *     ├─ studentId: string (indexed)
 *     ├─ date: date (composite index, descending)
 *     └─ ... (other fields)
 *
 * schools/{schoolId}/grades/
 *   {gradeId}
 *     ├─ schoolId: string (indexed)
 *     ├─ studentId: string (composite index with term)
 *     ├─ term: string (indexed)
 *     └─ ... (other fields)
 *
 * users/
 *   {userId}
 *     ├─ email: string (unique, indexed)
 *     ├─ schoolId: string (composite index with role)
 *     ├─ role: string (indexed)
 *     ├─ status: string (indexed)
 *     └─ ... (other fields)
 */

// ============================================================================
// COMPOSITE INDEXES (Required Firestore Indexes)
// ============================================================================

/**
 * Composite Indexes to create in Firestore:
 *
 * 1. schools/{schoolId}/students: (schoolId, gradeLevel, status)
 * 2. schools/{schoolId}/students: (schoolId, enrollmentDate DESC)
 * 3. schools/{schoolId}/attendance: (schoolId, date DESC)
 * 4. schools/{schoolId}/attendance: (studentId, date DESC)
 * 5. schools/{schoolId}/grades: (schoolId, studentId, term)
 * 6. users: (schoolId, role, status)
 */
