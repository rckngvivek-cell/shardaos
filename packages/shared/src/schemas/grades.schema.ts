import { z } from 'zod';

export const createGradeSchema = z.object({
  studentId: z.string().min(1),
  subject: z.string().min(1).max(100),
  examName: z.string().min(1).max(200),
  examDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  maxMarks: z.number().int().positive().max(1000),
  obtainedMarks: z.number().int().min(0),
  remarks: z.string().max(500).optional(),
}).refine(
  (data) => data.obtainedMarks <= data.maxMarks,
  { message: 'Obtained marks cannot exceed max marks', path: ['obtainedMarks'] }
);

export type CreateGradeSchema = z.infer<typeof createGradeSchema>;
