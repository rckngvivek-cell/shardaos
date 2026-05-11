import type { Student, CreateStudentInput, StudentAdmissionSourceType, UpdateStudentInput } from '@school-erp/shared';
import { StudentRepository } from './student.repository.js';
import { AppError } from '../../errors/app-error.js';

interface ListOptions {
  page: number;
  limit: number;
  grade?: string;
  section?: string;
  source?: StudentAdmissionSourceType;
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
    await this.assertRollNumberAvailable(schoolId, input.grade, input.section, input.rollNumber);
    return this.repo.create(schoolId, input);
  }

  async update(schoolId: string, id: string, input: UpdateStudentInput): Promise<Student> {
    const existing = await this.repo.findById(schoolId, id);
    if (!existing) {
      throw new AppError(404, 'NOT_FOUND', `Student ${id} not found`);
    }
    const nextGrade = input.grade ?? existing.grade;
    const nextSection = input.section ?? existing.section;
    const nextRollNumber = input.rollNumber ?? existing.rollNumber;
    const allocationChanged = (
      nextGrade !== existing.grade
      || nextSection !== existing.section
      || nextRollNumber !== existing.rollNumber
    );
    if (allocationChanged) {
      await this.assertRollNumberAvailable(schoolId, nextGrade, nextSection, nextRollNumber, id);
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

  private async assertRollNumberAvailable(
    schoolId: string,
    grade: string,
    section: string,
    rollNumber: string,
    currentStudentId?: string,
  ): Promise<void> {
    const existing = await this.repo.findActiveByRollNumber(schoolId, grade, section, rollNumber);
    if (existing && existing.id !== currentStudentId) {
      throw new AppError(
        409,
        'STUDENT_ROLL_NUMBER_EXISTS',
        `Roll number ${rollNumber} is already assigned in ${grade}-${section}`,
      );
    }
  }
}
