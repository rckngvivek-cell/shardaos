import type { CollectionReference } from 'firebase-admin/firestore';

import { getDb } from '../lib/firebase';
import type {
  CreateGradeInput,
  Grade,
  GradeQuery,
  UpdateGradeInput
} from '../models/grades';
import { AppError } from '../lib/app-error';
import type { GradeRepository } from './grade-repository';

function calculateLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

export class FirestoreGradeRepository implements GradeRepository {
  private collection(schoolId: string) {
    return getDb().collection(`schools/${schoolId}/grades`) as CollectionReference<Grade>;
  }

  async create(schoolId: string, input: CreateGradeInput): Promise<string> {
    const doc = this.collection(schoolId).doc();
    const now = new Date().toISOString();

    const percentage = (input.marks / input.maxMarks) * 100;
    const letterGrade = calculateLetterGrade(percentage);

    const grade: Grade = {
      gradeId: doc.id,
      schoolId,
      studentId: input.studentId,
      subject: input.subject,
      marks: input.marks,
      maxMarks: input.maxMarks,
      percentage: Math.round(percentage * 100) / 100,
      letterGrade,
      term: input.term,
      examinationName: input.examinationName,
      markedBy: input.markedBy,
      createdAt: now,
      updatedAt: now
    };

    await doc.set(grade);
    return doc.id;
  }

  async get(schoolId: string, gradeId: string): Promise<Grade | null> {
    const doc = await this.collection(schoolId).doc(gradeId).get();
    return doc.exists ? (doc.data() ?? null) : null;
  }

  async update(schoolId: string, gradeId: string, input: UpdateGradeInput): Promise<Grade | null> {
    const existing = await this.get(schoolId, gradeId);
    if (!existing) {
      throw new AppError(404, 'GRADE_NOT_FOUND', `Grade with ID '${gradeId}' not found`);
    }

    let percentage = existing.percentage;
    let letterGrade = existing.letterGrade;

    if (input.marks !== undefined || input.maxMarks !== undefined) {
      const marks = input.marks ?? existing.marks;
      const maxMarks = input.maxMarks ?? existing.maxMarks;
      percentage = Math.round((marks / maxMarks) * 10000) / 100;
      letterGrade = calculateLetterGrade(percentage);
    }

    const updated: Grade = {
      ...existing,
      ...input,
      percentage,
      letterGrade,
      updatedAt: new Date().toISOString()
    };

    await this.collection(schoolId).doc(gradeId).set(updated);
    return updated;
  }

  async list(schoolId: string, query: GradeQuery): Promise<{ grades: Grade[]; total: number }> {
    let ref = this.collection(schoolId) as FirebaseFirestore.Query<Grade>;

    if (query.studentId) {
      ref = ref.where('studentId', '==', query.studentId);
    }

    if (query.subject) {
      ref = ref.where('subject', '==', query.subject);
    }

    if (query.term) {
      ref = ref.where('term', '==', query.term);
    }

    const snapshot = await ref.get();
    let grades = snapshot.docs.map((doc) => doc.data());

    // Sort by creation date descending
    grades.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const total = grades.length;
    const paginated = grades.slice(query.offset, query.offset + query.limit);

    return { grades: paginated, total };
  }

  async delete(schoolId: string, gradeId: string): Promise<boolean> {
    const existing = await this.get(schoolId, gradeId);
    if (!existing) {
      throw new AppError(404, 'GRADE_NOT_FOUND', `Grade with ID '${gradeId}' not found`);
    }

    await this.collection(schoolId).doc(gradeId).delete();
    return true;
  }
}
