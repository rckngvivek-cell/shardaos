import type { Student, CreateStudentInput, StudentAdmissionSourceType, UpdateStudentInput } from '@school-erp/shared';
import { getDocumentStore } from '../../lib/document-store.js';

const COLLECTION = 'students';

function schoolStudentsRef(schoolId: string) {
  return getDocumentStore().collection('schools').doc(schoolId).collection(COLLECTION);
}

export class StudentRepository {
  async countActive(schoolId: string): Promise<number> {
    const snap = await schoolStudentsRef(schoolId)
      .where('isActive', '==', true)
      .count()
      .get();

    return snap.data().count;
  }

  async getLatestEnrollmentAt(schoolId: string): Promise<string | null> {
    const snap = await schoolStudentsRef(schoolId)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (snap.empty) {
      return null;
    }

    const value = snap.docs[0].get('createdAt');
    return typeof value === 'string' ? value : null;
  }

  async findAll(
    schoolId: string,
    opts: { page: number; limit: number; grade?: string; section?: string; source?: StudentAdmissionSourceType }
  ): Promise<{ students: Student[]; total: number }> {
    let query = schoolStudentsRef(schoolId)
      .where('isActive', '==', true);

    if (opts.grade) query = query.where('grade', '==', opts.grade);
    if (opts.section) query = query.where('section', '==', opts.section);
    if (opts.source === 'admission_crm') query = query.where('admissionSourceType', '==', opts.source);

    if (opts.source === 'direct') {
      const snap = await query.orderBy('lastName').get();
      const allStudents = snap.docs
        .map((doc) => ({ id: doc.id, schoolId, admissionSourceType: 'direct', ...doc.data() }) as Student)
        .filter((student) => student.admissionSourceType !== 'admission_crm');
      const start = (opts.page - 1) * opts.limit;

      return {
        students: allStudents.slice(start, start + opts.limit),
        total: allStudents.length,
      };
    }

    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    const snap = await query
      .orderBy('lastName')
      .offset((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .get();

    const students = snap.docs.map((doc) => ({ id: doc.id, schoolId, admissionSourceType: 'direct', ...doc.data() }) as Student);
    return { students, total };
  }

  async findById(schoolId: string, id: string): Promise<Student | null> {
    const doc = await schoolStudentsRef(schoolId).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, schoolId, admissionSourceType: 'direct', ...doc.data() } as Student;
  }

  async findActiveByRollNumber(
    schoolId: string,
    grade: string,
    section: string,
    rollNumber: string,
  ): Promise<Student | null> {
    const snap = await schoolStudentsRef(schoolId)
      .where('isActive', '==', true)
      .where('grade', '==', grade)
      .where('section', '==', section)
      .where('rollNumber', '==', rollNumber)
      .limit(1)
      .get();

    if (snap.empty) {
      return null;
    }

    const doc = snap.docs[0];
    return { id: doc.id, schoolId, admissionSourceType: 'direct', ...doc.data() } as Student;
  }

  async create(schoolId: string, input: CreateStudentInput): Promise<Student> {
    const now = new Date().toISOString();
    const data = {
      ...input,
      admissionSourceType: input.admissionSourceType ?? input.admissionSource?.type ?? 'direct',
      isActive: true,
      enrollmentDate: now,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await schoolStudentsRef(schoolId).add(data);
    return { id: ref.id, schoolId, ...data } as Student;
  }

  async update(schoolId: string, id: string, input: UpdateStudentInput): Promise<Student> {
    const data = { ...input, updatedAt: new Date().toISOString() };
    await schoolStudentsRef(schoolId).doc(id).update(data);
    const updated = await this.findById(schoolId, id);
    return updated!;
  }

  async delete(schoolId: string, id: string): Promise<void> {
    await schoolStudentsRef(schoolId).doc(id).update({
      isActive: false,
      updatedAt: new Date().toISOString(),
    });
  }
}
