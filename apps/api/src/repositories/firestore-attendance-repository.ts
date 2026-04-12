import type { CollectionReference } from 'firebase-admin/firestore';

import { getDb } from '../lib/firebase';
import type {
  AttendanceQuery,
  AttendanceRecord,
  CreateAttendanceInput
} from '../models/attendance';
import type { AttendanceRepository } from './attendance-repository';

function matchesQuery(record: AttendanceRecord, query: AttendanceQuery): boolean {
  return (
    (!query.date || record.date === query.date) &&
    (!query.class || record.class === query.class) &&
    (!query.section || record.section.toLowerCase() === query.section.toLowerCase())
  );
}

function sortAttendanceRecords(records: AttendanceRecord[]) {
  return records.sort((a, b) => {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export class FirestoreAttendanceRepository implements AttendanceRepository {
  private collection(schoolId: string) {
    return getDb().collection(`schools/${schoolId}/attendance`) as CollectionReference<AttendanceRecord>;
  }

  async list(schoolId: string, query: AttendanceQuery) {
    let ref = this.collection(schoolId) as FirebaseFirestore.Query<AttendanceRecord>;

    if (query.date) {
      ref = ref.where('date', '==', query.date);
    }

    if (query.class) {
      ref = ref.where('class', '==', query.class);
    }

    if (query.section) {
      ref = ref.where('section', '==', query.section);
    }

    const snapshot = await ref.get();
    const items = sortAttendanceRecords(
      snapshot.docs
        .map((doc) => doc.data())
        .filter((record) => matchesQuery(record, query))
    );

    return items;
  }

  async create(schoolId: string, input: CreateAttendanceInput, userId: string) {
    const doc = this.collection(schoolId).doc();
    const now = new Date().toISOString();

    const record: AttendanceRecord = {
      attendanceId: doc.id,
      schoolId,
      date: input.date,
      class: input.class,
      section: input.section,
      period: input.period,
      entries: input.entries,
      markedBy: userId,
      createdAt: now,
      updatedAt: now
    };

    await doc.set(record);
    return record;
  }
}
