import { randomUUID } from "crypto";
import { createMockStudentState } from "../data/mockDatabase";
import { StudentContact, StudentRecord, StudentStatus } from "../types";

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  rollNumber: string;
  class: number;
  section: string;
  status?: StudentStatus;
  contact: StudentContact;
}

export interface StudentRepository {
  listBySchool(schoolId: string, query?: string): StudentRecord[];
  create(schoolId: string, input: CreateStudentInput): StudentRecord;
}

export class InMemoryStudentRepository implements StudentRepository {
  private readonly studentsBySchool = createMockStudentState();

  listBySchool(schoolId: string, query?: string): StudentRecord[] {
    const students = this.studentsBySchool[schoolId] ?? [];
    const trimmedQuery = query?.trim().toLowerCase();

    if (!trimmedQuery) {
      return students;
    }

    return students.filter((student) => {
      return (
        student.displayName.toLowerCase().includes(trimmedQuery) ||
        student.rollNumber.toLowerCase().includes(trimmedQuery)
      );
    });
  }

  create(schoolId: string, input: CreateStudentInput): StudentRecord {
    const now = new Date().toISOString();
    const created: StudentRecord = {
      studentId: `std-${randomUUID().slice(0, 8)}`,
      schoolId,
      firstName: input.firstName,
      lastName: input.lastName,
      displayName: `${input.firstName} ${input.lastName}`.trim(),
      rollNumber: input.rollNumber,
      class: input.class,
      section: input.section,
      status: input.status ?? "active",
      contact: input.contact,
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };

    this.studentsBySchool[schoolId] ??= [];
    this.studentsBySchool[schoolId].unshift(created);

    return created;
  }
}
