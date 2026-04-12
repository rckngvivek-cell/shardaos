import { AppError } from '../lib/app-error';
import {
  createStudentSchema,
  studentQuerySchema,
  updateStudentSchema
} from '../models/student';
import type { StudentRepository } from '../repositories/student-repository';

export class StudentService {
  constructor(private readonly repository: StudentRepository) {}

  async list(schoolId: string, input: unknown) {
    const query = studentQuerySchema.parse(input);
    return this.repository.list(schoolId, query);
  }

  async get(schoolId: string, studentId: string) {
    const student = await this.repository.get(schoolId, studentId);
    if (!student) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', `Student with ID '${studentId}' not found`);
    }
    return student;
  }

  async create(schoolId: string, input: unknown, userId: string) {
    const payload = createStudentSchema.parse(input);
    return this.repository.create(schoolId, payload, userId);
  }

  async update(schoolId: string, studentId: string, input: unknown, userId: string) {
    const payload = updateStudentSchema.parse(input);
    const student = await this.repository.update(schoolId, studentId, payload, userId);
    if (!student) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', `Student with ID '${studentId}' not found`);
    }
    return student;
  }

  async remove(schoolId: string, studentId: string, userId: string) {
    const student = await this.repository.remove(schoolId, studentId, userId);
    if (!student) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', `Student with ID '${studentId}' not found`);
    }
    return student;
  }
}
