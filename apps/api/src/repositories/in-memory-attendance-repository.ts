import { randomUUID } from 'node:crypto';

import type {
  AttendanceQuery,
  AttendanceRecord,
  CreateAttendanceInput
} from '../models/attendance';
import type { AttendanceRepository } from './attendance-repository';

function nowIso(): string {
  return new Date().toISOString();
}

function matchesQuery(record: AttendanceRecord, query: AttendanceQuery): boolean {
  return (
    (!query.date || record.date === query.date) &&
    (!query.class || record.class === query.class) &&
    (!query.section || record.section.toLowerCase() === query.section.toLowerCase())
  );
}

export class InMemoryAttendanceRepository implements AttendanceRepository {
  private readonly records = new Map<string, AttendanceRecord[]>();

  public constructor() {
    const now = nowIso();
    const seeded: AttendanceRecord = {
      attendanceId: 'att_demo_20260408_5a',
      schoolId: 'demo-school',
      date: '2026-04-08',
      class: 5,
      section: 'A',
      period: 1,
      entries: [
        { studentId: 'std_demo_aarav_sharma', status: 'present' },
        { studentId: 'std_demo_zara_khan', status: 'absent', remarks: 'Sick leave' }
      ],
      markedBy: 'seed',
      createdAt: now,
      updatedAt: now
    };

    this.records.set('demo-school', [seeded]);
  }

  public async list(schoolId: string, query: AttendanceQuery): Promise<AttendanceRecord[]> {
    const schoolRecords = this.records.get(schoolId) ?? [];
    return schoolRecords.filter((record) => matchesQuery(record, query));
  }

  public async create(
    schoolId: string,
    input: CreateAttendanceInput,
    userId: string
  ): Promise<AttendanceRecord> {
    const now = nowIso();
    const record: AttendanceRecord = {
      attendanceId: `att_${randomUUID()}`,
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

    const existing = this.records.get(schoolId) ?? [];
    this.records.set(schoolId, [record, ...existing]);
    return record;
  }
}
