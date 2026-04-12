import { AppError } from '../lib/app-error';
import {
  createGradeSchema,
  gradeQuerySchema,
  updateGradeSchema
} from '../models/grades';
import type { GradeRepository } from '../repositories/grade-repository';

export class GradeService {
  constructor(private readonly repository: GradeRepository) {}

  async create(schoolId: string, input: unknown) {
    const payload = createGradeSchema.parse(input);
    return this.repository.create(schoolId, payload);
  }

  async get(schoolId: string, gradeId: string) {
    const grade = await this.repository.get(schoolId, gradeId);
    if (!grade) {
      throw new AppError(404, 'GRADE_NOT_FOUND', `Grade with ID '${gradeId}' not found`);
    }
    return grade;
  }

  async update(schoolId: string, gradeId: string, input: unknown) {
    const payload = updateGradeSchema.parse(input);
    const grade = await this.repository.update(schoolId, gradeId, payload);
    if (!grade) {
      throw new AppError(404, 'GRADE_NOT_FOUND', `Grade with ID '${gradeId}' not found`);
    }
    return grade;
  }

  async list(schoolId: string, input: unknown) {
    const query = gradeQuerySchema.parse(input);
    return this.repository.list(schoolId, query);
  }

  async delete(schoolId: string, gradeId: string) {
    return this.repository.delete(schoolId, gradeId);
  }
}
