import type { AttendanceRecord, MarkAttendanceInput } from '@school-erp/shared';
import { getFirestoreDb } from '../../lib/firebase.js';

const COLLECTION = 'attendance';

function schoolAttendanceRef(schoolId: string) {
  return getFirestoreDb().collection('schools').doc(schoolId).collection(COLLECTION);
}

export class AttendanceRepository {
  async getLatestRecordedAt(schoolId: string): Promise<string | null> {
    const snap = await schoolAttendanceRef(schoolId)
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
    opts: { date?: string; grade?: string; section?: string; page: number; limit: number }
  ): Promise<{ records: AttendanceRecord[]; total: number }> {
    let query: FirebaseFirestore.Query = schoolAttendanceRef(schoolId);

    if (opts.date) query = query.where('date', '==', opts.date);

    const countSnap = await query.count().get();
    const total = countSnap.data().count;

    const snap = await query
      .orderBy('date', 'desc')
      .offset((opts.page - 1) * opts.limit)
      .limit(opts.limit)
      .get();

    const records = snap.docs.map((doc) => ({ id: doc.id, schoolId, ...doc.data() }) as AttendanceRecord);
    return { records, total };
  }

  async create(schoolId: string, markedBy: string, input: MarkAttendanceInput): Promise<AttendanceRecord> {
    const now = new Date().toISOString();
    const data = {
      ...input,
      markedBy,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await schoolAttendanceRef(schoolId).add(data);
    return { id: ref.id, schoolId, ...data } as AttendanceRecord;
  }
}
