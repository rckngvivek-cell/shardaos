import { AppError } from '../lib/app-error';
import {
  attendanceQuerySchema,
  createAttendanceSchema,
  type AttendanceQuery,
  type CreateAttendanceInput
} from '../models/attendance';
import type { AttendanceRepository } from '../repositories/attendance-repository';

export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  async list(schoolId: string, input: unknown) {
    const query = attendanceQuerySchema.parse(input);
    return this.repository.list(schoolId, query);
  }

  async create(schoolId: string, input: unknown, userId: string) {
    const payload = createAttendanceSchema.parse(input);
    return this.repository.create(schoolId, payload, userId);
  }
}
