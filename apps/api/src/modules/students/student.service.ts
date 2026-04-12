import { nanoid } from 'nanoid';

import { AppError } from '../../errors/app-error.js';
import type { AuthUser } from '../auth/auth.types.js';
import { createStudentSchema } from './student.schema.js';
import type { CreateStudentInput } from './student.types.js';
import { createStudentsRepository } from '../../repositories/student-repository.js';

const studentsRepository = createStudentsRepository();

export class StudentsService {
  async listStudents(schoolId: string) {
    return studentsRepository.listBySchool(schoolId);
  }

  async getStudent(schoolId: string, studentId: string) {
    const student = await studentsRepository.getById(schoolId, studentId);

    if (!student) {
      throw new AppError(404, 'STUDENT_NOT_FOUND', 'Student not found');
    }

    return student;
  }

  async createStudent(
    schoolId: string,
    actor: AuthUser,
    payload: CreateStudentInput,
  ) {
    const parsed = createStudentSchema.safeParse(payload);

    if (!parsed.success) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Validation failed', {
        issues: parsed.error.flatten(),
      });
    }

    const now = new Date().toISOString();
    const student = {
      ...parsed.data,
      studentId: `std_${nanoid(10)}`,
      schoolId,
      createdBy: actor.uid,
      createdAt: now,
      updatedAt: now,
    };

    return studentsRepository.create(student);
  }
}
