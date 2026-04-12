import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  gender: z.enum(['male', 'female', 'other']),
  grade: z.string().min(1).max(20),
  section: z.string().min(1).max(10),
  rollNumber: z.string().min(1).max(20),
  parentName: z.string().min(1).max(200),
  parentPhone: z.string().min(10).max(15),
  parentEmail: z.string().email().optional(),
  address: z.string().min(1).max(500),
  emergencyContact: z.string().min(10).max(15),
  bloodGroup: z.string().max(5).optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentSchema = z.infer<typeof createStudentSchema>;
export type UpdateStudentSchema = z.infer<typeof updateStudentSchema>;
