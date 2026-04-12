import type { Grade, CreateGradeInput } from '@school-erp/shared';
import { getFirestoreDb } from '../../lib/firebase.js';

const COLLECTION = 'grades';

function schoolGradesRef(schoolId: string) {
  return getFirestoreDb().collection('schools').doc(schoolId).collection(COLLECTION);
}

export class GradesRepository {
  async findAll(
    schoolId: string,
    opts: { subject?: string; examName?: string; page: number; limit: number }
  ): Promise<{ grades: Grade[]; total: number }> {
    let query: FirebaseFirestore.Query = schoolGradesRef(schoolId);

    if (opts.subject) query = query.where('subject', '==', opts.subject);
    if (opts.examName) query = query.where('examName', '==', opts.examName);

    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    const snap = await query
      .orderBy('examDate', 'desc')
      .offset((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .get();

    const grades = snap.docs.map((doc) => ({ id: doc.id, schoolId, ...doc.data() }) as Grade);
    return { grades, total };
  }

  async findByStudent(schoolId: string, studentId: string): Promise<Grade[]> {
    const snap = await schoolGradesRef(schoolId)
      .where('studentId', '==', studentId)
      .orderBy('examDate', 'desc')
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, schoolId, ...doc.data() }) as Grade);
  }

  async create(schoolId: string, gradedBy: string, input: CreateGradeInput, gradeLabel: string): Promise<Grade> {
    const now = new Date().toISOString();
    const data = {
      ...input,
      grade: gradeLabel,
      gradedBy,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await schoolGradesRef(schoolId).add(data);
    return { id: ref.id, schoolId, ...data } as Grade;
  }
}
