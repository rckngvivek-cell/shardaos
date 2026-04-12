import { env, type StorageDriver } from '../config/env';
import { FirestoreAttendanceRepository } from './firestore-attendance-repository';
import { FirestoreStudentRepository } from './firestore-student-repository';
import { FirestoreSchoolRepository } from './firestore-school-repository';
import { FirestoreGradeRepository } from './firestore-grade-repository';
import { FirestoreUserRepository } from './firestore-user-repository';
import { InMemoryAttendanceRepository } from './in-memory-attendance-repository';
import { InMemoryStudentRepository } from './in-memory-student-repository';
import type { AttendanceRepository } from './attendance-repository';
import type { StudentRepository } from './student-repository';
import type { SchoolRepository } from './school-repository';
import type { GradeRepository } from './grade-repository';
import type { UserRepository } from './user-repository';

export function createStudentRepository(
  storageDriver: StorageDriver = env.STORAGE_DRIVER
): StudentRepository {
  return storageDriver === 'firestore'
    ? new FirestoreStudentRepository()
    : new InMemoryStudentRepository();
}

export function createAttendanceRepository(
  storageDriver: StorageDriver = env.STORAGE_DRIVER
): AttendanceRepository {
  return storageDriver === 'firestore'
    ? new FirestoreAttendanceRepository()
    : new InMemoryAttendanceRepository();
}

export function createSchoolRepository(
  storageDriver: StorageDriver = env.STORAGE_DRIVER
): SchoolRepository {
  return new FirestoreSchoolRepository();
}

export function createGradeRepository(
  storageDriver: StorageDriver = env.STORAGE_DRIVER
): GradeRepository {
  return new FirestoreGradeRepository();
}

export function createUserRepository(
  storageDriver: StorageDriver = env.STORAGE_DRIVER
): UserRepository {
  return new FirestoreUserRepository();
}
