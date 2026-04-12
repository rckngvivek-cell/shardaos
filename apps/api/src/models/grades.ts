import { z } from 'zod';

export const gradeSchema = z.object({
  gradeId: z.string(),
  schoolId: z.string(),
  studentId: z.string(),
  subject: z.string().trim().min(2).max(50),
  marks: z.number().int().min(0),
  maxMarks: z.number().int().min(1),
  percentage: z.number().min(0).max(100),
  letterGrade: z.string().regex(/^[A-F][+]?$|^F$/),
  term: z.string().trim().min(1).max(50),
  examinationName: z.string().trim().min(2).max(100),
  markedBy: z.string().trim().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const createGradeSchema = gradeSchema
  .omit({
    gradeId: true,
    schoolId: true,
    percentage: true,
    letterGrade: true,
    createdAt: true,
    updatedAt: true
  })
  .extend({
    percentage: z.number().min(0).max(100).optional(),
    letterGrade: z.string().regex(/^[A-F][+]?$|^F$/).optional()
  });

export const updateGradeSchema = createGradeSchema.partial();

export const gradeQuerySchema = z.object({
  studentId: z.string().optional(),
  subject: z.string().trim().optional(),
  term: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type Grade = z.infer<typeof gradeSchema>;
export type CreateGradeInput = z.infer<typeof createGradeSchema>;
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>;
export type GradeQuery = z.infer<typeof gradeQuerySchema>;
