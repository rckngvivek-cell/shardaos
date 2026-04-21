import type { School } from '@school-erp/shared';
import { SchoolRepository } from './school.repository.js';
import { AppError } from '../../errors/app-error.js';

export class SchoolService {
  private repo = new SchoolRepository();

  async getById(schoolId: string): Promise<School> {
    const school = await this.repo.findById(schoolId);
    if (!school) {
      throw new AppError(404, 'NOT_FOUND', `School ${schoolId} not found`);
    }
    return school;
  }
}
