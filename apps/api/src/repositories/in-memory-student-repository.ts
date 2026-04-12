import type {
  CreateStudentInput,
  Student,
  StudentQuery,
  UpdateStudentInput
} from '../models/student';
import type { StudentRepository } from './student-repository';

const seededStudents: Student[] = [
  {
    studentId: 'std_demo_aarav_sharma',
    schoolId: 'demo-school',
    firstName: 'Aarav',
    lastName: 'Sharma',
    middleName: 'Kumar',
    dob: '2012-05-15',
    gender: 'M',
    aadhar: '123456789012',
    rollNumber: '12501',
    class: 5,
    section: 'A',
    enrollmentDate: '2025-04-01',
    status: 'active',
    contact: {
      parentName: 'Vikram Sharma',
      parentEmail: 'vikram.sharma@example.com',
      parentPhone: '+919876543210',
      emergencyContact: '+919876543211',
      emergencyContactName: 'Priya Sharma'
    },
    address: {
      street: '123 Oak Street',
      city: 'Muzaffarpur',
      state: 'Bihar',
      zipCode: '842001',
      country: 'India'
    },
    medicalInfo: {
      bloodGroup: 'O+',
      allergies: 'Peanuts',
      chronicConditions: 'None'
    },
    documents: {},
    metadata: {
      createdAt: '2026-04-08T10:30:00.000Z',
      updatedAt: '2026-04-08T10:30:00.000Z',
      createdBy: 'seed',
      lastUpdatedBy: 'seed'
    }
  },
  {
    studentId: 'std_demo_zara_khan',
    schoolId: 'demo-school',
    firstName: 'Zara',
    lastName: 'Khan',
    dob: '2011-11-02',
    gender: 'F',
    aadhar: '987654321098',
    rollNumber: '12502',
    class: 5,
    section: 'A',
    enrollmentDate: '2025-04-01',
    status: 'active',
    contact: {
      parentName: 'Farah Khan',
      parentEmail: 'farah.khan@example.com',
      parentPhone: '+919812345678',
      emergencyContact: '+919800000000',
      emergencyContactName: 'Sajid Khan'
    },
    address: {
      street: '42 River Lane',
      city: 'Muzaffarpur',
      state: 'Bihar',
      zipCode: '842002',
      country: 'India'
    },
    medicalInfo: {
      bloodGroup: 'A+',
      allergies: 'None',
      chronicConditions: 'None'
    },
    documents: {},
    metadata: {
      createdAt: '2026-04-08T10:30:00.000Z',
      updatedAt: '2026-04-08T10:30:00.000Z',
      createdBy: 'seed',
      lastUpdatedBy: 'seed'
    }
  }
];

function slugify(parts: string[]) {
  return parts
    .filter(Boolean)
    .join('_')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export class InMemoryStudentRepository implements StudentRepository {
  private readonly schools = new Map<string, Map<string, Student>>();

  constructor() {
    const schoolMap = new Map<string, Student>();
    for (const student of seededStudents) {
      schoolMap.set(student.studentId, student);
    }
    this.schools.set('demo-school', schoolMap);
  }

  async list(schoolId: string, query: StudentQuery) {
    const students = [...(this.schools.get(schoolId)?.values() ?? [])];
    const filtered = students.filter((student) => {
      if (query.class && student.class !== query.class) {
        return false;
      }

      if (query.section && student.section.toLowerCase() !== query.section.toLowerCase()) {
        return false;
      }

      if (query.status && student.status !== query.status) {
        return false;
      }

      if (query.q) {
        const term = query.q.toLowerCase();
        const haystack = [
          student.firstName,
          student.lastName,
          student.rollNumber,
          student.aadhar ?? ''
        ]
          .join(' ')
          .toLowerCase();

        if (!haystack.includes(term)) {
          return false;
        }
      }

      return true;
    });

    const sorted = filtered.sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)
    );

    return {
      items: sorted.slice(query.offset, query.offset + query.limit),
      total: sorted.length
    };
  }

  async get(schoolId: string, studentId: string) {
    return this.schools.get(schoolId)?.get(studentId) ?? null;
  }

  async create(schoolId: string, input: CreateStudentInput, userId: string) {
    const school = this.ensureSchool(schoolId);
    const studentId = `std_${slugify([schoolId, input.firstName, input.lastName, Date.now().toString()])}`;
    const now = new Date().toISOString();

    const student: Student = {
      studentId,
      schoolId,
      firstName: input.firstName,
      middleName: input.middleName,
      lastName: input.lastName,
      dob: input.dob,
      gender: input.gender,
      aadhar: input.aadhar,
      rollNumber: input.rollNumber,
      class: input.class,
      section: input.section,
      enrollmentDate: input.enrollmentDate ?? now.slice(0, 10),
      status: input.status ?? 'active',
      contact: input.contact,
      address: input.address ?? {},
      medicalInfo: input.medicalInfo ?? {},
      documents: input.documents ?? {},
      metadata: {
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        lastUpdatedBy: userId
      }
    };

    school.set(studentId, student);
    return student;
  }

  async update(schoolId: string, studentId: string, input: UpdateStudentInput, userId: string) {
    const school = this.schools.get(schoolId);
    const existing = school?.get(studentId);
    if (!school || !existing) {
      return null;
    }

    const updated: Student = {
      ...existing,
      ...input,
      contact: input.contact ? { ...existing.contact, ...input.contact } : existing.contact,
      address: input.address ? { ...existing.address, ...input.address } : existing.address,
      medicalInfo: input.medicalInfo
        ? { ...existing.medicalInfo, ...input.medicalInfo }
        : existing.medicalInfo,
      documents: input.documents ? { ...existing.documents, ...input.documents } : existing.documents,
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: userId
      }
    };

    school.set(studentId, updated);
    return updated;
  }

  async remove(schoolId: string, studentId: string, userId: string) {
    const school = this.schools.get(schoolId);
    const existing = school?.get(studentId);
    if (!school || !existing) {
      return null;
    }

    const archived: Student = {
      ...existing,
      status: 'deleted',
      archivedAt: new Date().toISOString(),
      metadata: {
        ...existing.metadata,
        updatedAt: new Date().toISOString(),
        lastUpdatedBy: userId
      }
    };

    school.set(studentId, archived);
    return archived;
  }

  private ensureSchool(schoolId: string) {
    let school = this.schools.get(schoolId);
    if (!school) {
      school = new Map<string, Student>();
      this.schools.set(schoolId, school);
    }
    return school;
  }
}
