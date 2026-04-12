import type { CollectionReference } from 'firebase-admin/firestore';

import { getDb } from '../lib/firebase';
import type {
  CreateStudentInput,
  Student,
  StudentQuery,
  UpdateStudentInput
} from '../models/student';
import type { StudentRepository } from './student-repository';

export class FirestoreStudentRepository implements StudentRepository {
  private collection(schoolId: string) {
    return getDb().collection(`schools/${schoolId}/students`) as CollectionReference<Student>;
  }

  async list(schoolId: string, query: StudentQuery) {
    let ref = this.collection(schoolId) as FirebaseFirestore.Query<Student>;

    if (query.class) {
      ref = ref.where('class', '==', query.class);
    }

    if (query.section) {
      ref = ref.where('section', '==', query.section);
    }

    if (query.status) {
      ref = ref.where('status', '==', query.status);
    }

    const snapshot = await ref.get();
    let items = snapshot.docs.map((doc) => doc.data());

    if (query.q) {
      const term = query.q.toLowerCase();
      items = items.filter((student) =>
        `${student.firstName} ${student.lastName} ${student.rollNumber} ${student.aadhar ?? ''}`
          .toLowerCase()
          .includes(term)
      );
    }

    items.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));

    return {
      items: items.slice(query.offset, query.offset + query.limit),
      total: items.length
    };
  }

  async get(schoolId: string, studentId: string) {
    const doc = await this.collection(schoolId).doc(studentId).get();
    return doc.exists ? doc.data() ?? null : null;
  }

  async create(schoolId: string, input: CreateStudentInput, userId: string) {
    const doc = this.collection(schoolId).doc();
    const now = new Date().toISOString();
    const student: Student = {
      studentId: doc.id,
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

    await doc.set(student);
    return student;
  }

  async update(schoolId: string, studentId: string, input: UpdateStudentInput, userId: string) {
    const existing = await this.get(schoolId, studentId);
    if (!existing) {
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

    await this.collection(schoolId).doc(studentId).set(updated);
    return updated;
  }

  async remove(schoolId: string, studentId: string, userId: string) {
    const existing = await this.get(schoolId, studentId);
    if (!existing) {
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

    await this.collection(schoolId).doc(studentId).set(archived);
    return archived;
  }
}
