/**
 * Centralized Firestore Service
 * Handles all database operations for School ERP system
 * 
 * Supports 5 collections:
 * - schools (root level)
 * - students (under schools/{schoolId})
 * - attendance (under schools/{schoolId})
 * - grades (under schools/{schoolId})
 * - users (root level)
 */

import { getDb } from '../lib/firebase';
import { FirestoreSchoolRepository } from '../repositories/firestore-school-repository';
import { FirestoreStudentRepository } from '../repositories/firestore-student-repository';
import { FirestoreAttendanceRepository } from '../repositories/firestore-attendance-repository';
import { FirestoreGradeRepository } from '../repositories/firestore-grade-repository';
import { FirestoreUserRepository } from '../repositories/firestore-user-repository';
import type { SchoolRepository } from '../repositories/school-repository';
import type { StudentRepository } from '../repositories/student-repository';
import type { AttendanceRepository } from '../repositories/attendance-repository';
import type { GradeRepository } from '../repositories/grade-repository';
import type { UserRepository } from '../repositories/user-repository';

/**
 * Centralized Firestore Service Factory
 * Provides unified access to all repositories
 */
export class FirestoreService {
  private schools: SchoolRepository;
  private students: StudentRepository;
  private attendance: AttendanceRepository;
  private grades: GradeRepository;
  private users: UserRepository;

  constructor() {
    this.schools = new FirestoreSchoolRepository();
    this.students = new FirestoreStudentRepository();
    this.attendance = new FirestoreAttendanceRepository();
    this.grades = new FirestoreGradeRepository();
    this.users = new FirestoreUserRepository();
  }

  /**
   * Get schools repository
   * Operations: create, get, update, list, delete
   */
  getSchools(): SchoolRepository {
    return this.schools;
  }

  /**
   * Get students repository
   * Operations: create, get, update, list, remove
   */
  getStudents(): StudentRepository {
    return this.students;
  }

  /**
   * Get attendance repository
   * Operations: create, list
   */
  getAttendance(): AttendanceRepository {
    return this.attendance;
  }

  /**
   * Get grades repository
   * Operations: create, get, update, list, delete
   */
  getGrades(): GradeRepository {
    return this.grades;
  }

  /**
   * Get users repository
   * Operations: create, get, getByEmail, update, list, updateLastLogin, delete
   */
  getUsers(): UserRepository {
    return this.users;
  }

  /**
   * Get raw Firestore database instance for advanced operations
   */
  getDb() {
    return getDb();
  }

  /**
   * Health check - verify Firestore connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const db = getDb();
      const testRef = db.collection('_healthcheck').doc('ping');
      await testRef.set({ timestamp: new Date().toISOString() });
      await testRef.delete();
      return true;
    } catch (error) {
      console.error('Firestore health check failed:', error);
      return false;
    }
  }
}

/**
 * Singleton instance of FirestoreService
 * Use this to access Firestore repositories throughout the application
 */
export const firestoreService = new FirestoreService();

/**
 * Export all repositories for direct import if needed
 */
export {
  FirestoreSchoolRepository,
  FirestoreStudentRepository,
  FirestoreAttendanceRepository,
  FirestoreGradeRepository,
  FirestoreUserRepository
};

/**
 * Export repository types
 */
export type {
  SchoolRepository,
  StudentRepository,
  AttendanceRepository,
  GradeRepository,
  UserRepository
};
