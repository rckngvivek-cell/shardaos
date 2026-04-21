import type { Student, CreateStudentInput, UpdateStudentInput } from '@school-erp/shared';
import { StudentRepository } from './student.repository.js';
import { AppError } from '../../errors/app-error.js';

interface ListOptions {
  page: number;
  limit: number;
  grade?: string;
  section?: string;
}

export class StudentService {
  private repo = new StudentRepository();

  async list(schoolId: string, opts: ListOptions): Promise<{ students: Student[]; total: number }> {
    return this.repo.findAll(schoolId, opts);
  }

  async getById(schoolId: string, id: string): Promise<Student> {
    const student = await this.repo.findById(schoolId, id);
    if (!student) {
      throw new AppError(404, 'NOT_FOUND', `Student ${id} not found`);
    }
    return student;
  }

  async create(schoolId: string, input: CreateStudentInput): Promise<Student> {
    return this.repo.create(schoolId, input);
  }

  async update(schoolId: string, id: string, input: UpdateStudentInput): Promise<Student> {
    const existing = await this.repo.findById(schoolId, id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Student ${id} not found`);
    }
    return this.repo.update(schoolId, id, input);
  }

  async delete(schoolId: string, id: string): Promise<void> {
    const existing = await this.repo.findById(schoolId, id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Student ${id} not found`);
    }
    await this.repo.delete(schoolId, id);
  }
}
