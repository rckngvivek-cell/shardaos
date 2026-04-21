import type { Grade, CreateGradeInput } from '@school-erp/shared';
import { GradesRepository } from './grades.repository.js';

interface ListOptions {
  subject?: string;
  examName?: string;
  page: number;
  limit: number;
}

export class GradesService {
  private repo = new GradesRepository();

  async list(schoolId: string, opts: ListOptions): Promise<{ grades: Grade[]; total: number }> {
    return this.repo.findAll(schoolId, opts);
  }

  async getByStudent(schoolId: string, studentId: string): Promise<Grade[]> {
    return this.repo.findByStudent(schoolId, studentId);
  }

  async create(schoolId: string, gradedBy: string, input: CreateGradeInput): Promise<Grade> {
    const gradeLabel = calculateGradeLabel(input.obtainedMarks, input.maxMarks);
    return this.repo.create(schoolId, gradedBy, input, gradeLabel);
  }
}

function calculateGradeLabel(obtained: number, max: number): string {
  const pct = (obtained / max) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}
