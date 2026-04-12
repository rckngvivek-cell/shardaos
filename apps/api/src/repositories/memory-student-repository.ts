import { randomUUID } from 'node:crypto';

import type {
  CreateStudentInput,
  PaginatedResult,
  StudentListFilters,
  StudentRecord,
  UpdateStudentInput,
} from '@school-erp/shared';

import type { StudentRepository } from './student-repository';

function nowIso(): string {
  return new Date().toISOString();
}

function mergeStudent(student: StudentRecord, updates: UpdateStudentInput): StudentRecord {
  return {
    ...student,
    ...updates,
    contact: updates.contact ? { ...student.contact, ...updates.contact } : student.contact,
    address: updates.address ? { ...student.address, ...updates.address } : student.address,
    medicalInfo: updates.medicalInfo
      ? { ...student.medicalInfo, ...updates.medicalInfo }
      : student.medicalInfo,
    updatedAt: nowIso(),
  };
}

function studentMatches(student: StudentRecord, filters: StudentListFilters): boolean {
  const matchesQuery = filters.q
    ? `${student.firstName} ${student.lastName} ${student.rollNumber}`
        .toLowerCase()
        .includes(filters.q.toLowerCase())
    : true;

  return (
    matchesQuery &&
    (!filters.class || student.class === filters.class) &&
    (!filters.section || student.section === filters.section) &&
    (!filters.status || student.status === filters.status)
  );
}

export class MemoryStudentRepository implements StudentRepository {
  private readonly data = new Map<string, StudentRecord[]>();

  public constructor() {
    const createdAt = nowIso();
    this.data.set('demo-school', [
      {
        id: 'std_aarav_001',
        schoolId: 'demo-school',
        firstName: 'Aarav',
        lastName: 'Sharma',
        dob: '2012-05-15',
        gender: 'M',
        rollNumber: '12501',
        class: '5',
        section: 'A',
        enrollmentDate: '2025-04-01',
        status: 'active',
        contact: {
          parentName: 'Vikram Sharma',
          parentEmail: 'vikram.sharma@example.com',
          parentPhone: '+91-9876543210',
        },
        address: {
          street: '123 Oak Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001',
          country: 'India',
        },
        medicalInfo: {
          bloodGroup: 'O+',
          allergies: 'None',
          chronicConditions: 'None',
        },
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: 'std_saanvi_002',
        schoolId: 'demo-school',
        firstName: 'Saanvi',
        lastName: 'Patel',
        dob: '2011-11-02',
        gender: 'F',
        rollNumber: '12502',
        class: '5',
        section: 'A',
        enrollmentDate: '2025-04-01',
        status: 'active',
        contact: {
          parentName: 'Mehul Patel',
          parentEmail: 'mehul.patel@example.com',
          parentPhone: '+91-9988776655',
        },
        address: {
          street: '88 Lake View',
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400014',
          country: 'India',
        },
        medicalInfo: {
          bloodGroup: 'A+',
        },
        createdAt,
        updatedAt: createdAt,
      },
    ]);
  }

  public async list(
    schoolId: string,
    filters: StudentListFilters
  ): Promise<PaginatedResult<StudentRecord>> {
    const students = (this.data.get(schoolId) ?? []).filter((student) => studentMatches(student, filters));
    const start = (filters.page - 1) * filters.limit;
    const items = students.slice(start, start + filters.limit);

    return {
      items,
      page: filters.page,
      limit: filters.limit,
      total: students.length,
    };
  }

  public async getById(schoolId: string, studentId: string): Promise<StudentRecord | null> {
    return (this.data.get(schoolId) ?? []).find((student) => student.id === studentId) ?? null;
  }

  public async create(schoolId: string, input: CreateStudentInput): Promise<StudentRecord> {
    const createdAt = nowIso();
    const student: StudentRecord = {
      id: `std_${randomUUID()}`,
      schoolId,
      ...input,
      createdAt,
      updatedAt: createdAt,
    };

    const current = this.data.get(schoolId) ?? [];
    this.data.set(schoolId, [student, ...current]);
    return student;
  }

  public async update(
    schoolId: string,
    studentId: string,
    input: UpdateStudentInput
  ): Promise<StudentRecord | null> {
    const current = this.data.get(schoolId) ?? [];
    const targetIndex = current.findIndex((student) => student.id === studentId);
    if (targetIndex === -1) {
      return null;
    }

    const updated = mergeStudent(current[targetIndex], input);
    current.splice(targetIndex, 1, updated);
    this.data.set(schoolId, current);
    return updated;
  }

  public async archive(schoolId: string, studentId: string): Promise<StudentRecord | null> {
    return this.update(schoolId, studentId, { status: 'archived' });
  }
}
