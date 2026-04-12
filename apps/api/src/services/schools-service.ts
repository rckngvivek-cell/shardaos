import { AppError } from '../lib/app-error';
import {
  createSchoolSchema,
  schoolQuerySchema,
  updateSchoolSchema
} from '../models/schools';
import type { SchoolRepository } from '../repositories/school-repository';

export class SchoolService {
  constructor(private readonly repository: SchoolRepository) {}

  async create(input: unknown) {
    const payload = createSchoolSchema.parse(input);
    return this.repository.create(payload);
  }

  async get(schoolId: string) {
    const school = await this.repository.get(schoolId);
    if (!school) {
      throw new AppError(404, 'SCHOOL_NOT_FOUND', `School with ID '${schoolId}' not found`);
    }
    return school;
  }

  async update(schoolId: string, input: unknown) {
    const payload = updateSchoolSchema.parse(input);
    const school = await this.repository.update(schoolId, payload);
    if (!school) {
      throw new AppError(404, 'SCHOOL_NOT_FOUND', `School with ID '${schoolId}' not found`);
    }
    return school;
  }

  async list(input: unknown) {
    const query = schoolQuerySchema.parse(input);
    return this.repository.list(query);
  }

  async delete(schoolId: string) {
    return this.repository.delete(schoolId);
  }
}
