import type {
  CreateGradeInput,
  Grade,
  GradeQuery,
  UpdateGradeInput
} from '../models/grades';

export interface GradeRepository {
  create(schoolId: string, input: CreateGradeInput): Promise<string>;
  get(schoolId: string, gradeId: string): Promise<Grade | null>;
  update(schoolId: string, gradeId: string, input: UpdateGradeInput): Promise<Grade | null>;
  list(schoolId: string, query: GradeQuery): Promise<{ grades: Grade[]; total: number }>;
  delete(schoolId: string, gradeId: string): Promise<boolean>;
}
