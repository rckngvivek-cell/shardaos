import type { AttendanceRecord, MarkAttendanceInput, BulkAttendanceInput } from '@school-erp/shared';
import { AttendanceRepository } from './attendance.repository.js';

interface ListOptions {
  date?: string;
  grade?: string;
  section?: string;
  page: number;
  limit: number;
}

export class AttendanceService {
  private repo = new AttendanceRepository();

  async list(schoolId: string, opts: ListOptions): Promise<{ records: AttendanceRecord[]; total: number }> {
    return this.repo.findAll(schoolId, opts);
  }

  async mark(schoolId: string, markedBy: string, input: MarkAttendanceInput): Promise<AttendanceRecord> {
    return this.repo.create(schoolId, markedBy, input);
  }

  async markBulk(
    schoolId: string,
    markedBy: string,
    input: BulkAttendanceInput
  ): Promise<AttendanceRecord[]> {
    const records: AttendanceRecord[] = [];
    for (const rec of input.records) {
      const record = await this.repo.create(schoolId, markedBy, {
        studentId: rec.studentId,
        date: input.date,
        status: rec.status,
        remarks: rec.remarks,
      });
      records.push(record);
    }
    return records;
  }
}
