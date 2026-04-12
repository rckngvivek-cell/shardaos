import type {
  AttendanceQuery,
  AttendanceRecord,
  CreateAttendanceInput
} from '../models/attendance';

export interface AttendanceRepository {
  list(schoolId: string, query: AttendanceQuery): Promise<AttendanceRecord[]>;
  create(schoolId: string, input: CreateAttendanceInput, userId: string): Promise<AttendanceRecord>;
}
