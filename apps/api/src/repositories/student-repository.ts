import type {
  CreateStudentInput,
  Student,
  StudentQuery,
  UpdateStudentInput
} from '../models/student';

export interface StudentRepository {
  list(schoolId: string, query: StudentQuery): Promise<{ items: Student[]; total: number }>;
  get(schoolId: string, studentId: string): Promise<Student | null>;
  create(
    schoolId: string,
    input: CreateStudentInput,
    userId: string
  ): Promise<Student>;
  update(
    schoolId: string,
    studentId: string,
    input: UpdateStudentInput,
    userId: string
  ): Promise<Student | null>;
  remove(schoolId: string, studentId: string, userId: string): Promise<Student | null>;
}
