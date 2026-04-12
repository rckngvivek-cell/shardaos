import type { Student, CreateStudentInput, UpdateStudentInput } from '@school-erp/shared';
import { getFirestoreDb } from '../../lib/firebase.js';

const COLLECTION = 'students';

function schoolStudentsRef(schoolId: string) {
  return getFirestoreDb().collection('schools').doc(schoolId).collection(COLLECTION);
}

export class StudentRepository {
  async findAll(
    schoolId: string,
    opts: { page: number; limit: number; grade?: string; section?: string }
  ): Promise<{ students: Student[]; total: number }> {
    let query: FirebaseFirestore.Query = schoolStudentsRef(schoolId)
      .where('isActive', '==', true);

    if (opts.grade) query = query.where('grade', '==', opts.grade);
    if (opts.section) query = query.where('section', '==', opts.section);

    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    const snap = await query
      .orderBy('lastName')
      .offset((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .get();

    const students = snap.docs.map((doc) => ({ id: doc.id, schoolId, ...doc.data() }) as Student);
    return { students, total };
  }

  async findById(schoolId: string, id: string): Promise<Student | null> {
    const doc = await schoolStudentsRef(schoolId).doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, schoolId, ...doc.data() } as Student;
  }

  async create(schoolId: string, input: CreateStudentInput): Promise<Student> {
    const now = new Date().toISOString();
    const data = {
      ...input,
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
