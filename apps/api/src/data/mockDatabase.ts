import { SchoolRecord, StudentRecord } from "../types";

const timestamp = "2026-04-09T09:00:00.000Z";

export const mockSchools: Record<string, SchoolRecord> = {
  "school-demo": {
    schoolId: "school-demo",
    name: "Riverstone Public School",
    city: "Patna",
    state: "Bihar",
    principalName: "Aditi Verma",
    studentCount: 1248,
    activeModules: ["students", "attendance", "exams", "fees"],
  },
};

const studentsBySchool: Record<string, StudentRecord[]> = {
  "school-demo": [
    {
      studentId: "std-riverstone-001",
      schoolId: "school-demo",
      firstName: "Aarav",
      lastName: "Sharma",
      displayName: "Aarav Sharma",
      rollNumber: "5A-001",
      class: 5,
      section: "A",
      status: "active",
      contact: {
        parentName: "Vikram Sharma",
        parentEmail: "vikram.sharma@example.com",
        parentPhone: "+91-9876543210",
      },
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    {
      studentId: "std-riverstone-002",
      schoolId: "school-demo",
      firstName: "Mira",
      lastName: "Sinha",
      displayName: "Mira Sinha",
      rollNumber: "5A-014",
      class: 5,
      section: "A",
      status: "active",
      contact: {
        parentName: "Neha Sinha",
        parentEmail: "neha.sinha@example.com",
        parentPhone: "+91-9812345678",
      },
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
    {
      studentId: "std-riverstone-003",
      schoolId: "school-demo",
      firstName: "Kabir",
      lastName: "Ali",
      displayName: "Kabir Ali",
      rollNumber: "6B-006",
      class: 6,
      section: "B",
      status: "active",
      contact: {
        parentName: "Sana Ali",
        parentEmail: "sana.ali@example.com",
        parentPhone: "+91-9822001122",
      },
      metadata: {
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    },
  ],
};

export function createMockStudentState(): Record<string, StudentRecord[]> {
  return Object.fromEntries(
    Object.entries(studentsBySchool).map(([schoolId, students]) => [
      schoolId,
      students.map((student) => ({
        ...student,
        contact: { ...student.contact },
        metadata: { ...student.metadata },
      })),
    ]),
  );
}

