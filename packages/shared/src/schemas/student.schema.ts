import { z } from 'zod';

export const studentAdmissionSourceTypeSchema = z.enum(['direct', 'admission_crm']);

export const studentGuardianProfileSchema = z.object({
  name: z.string().trim().min(1).max(200),
  relationship: z.string().trim().min(1).max(60).optional(),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().optional(),
  sourceApplicantId: z.string().trim().min(1).optional(),
});

export const studentAdmissionSourceSchema = z.object({
  type: studentAdmissionSourceTypeSchema,
  applicantId: z.string().trim().min(1).optional(),
  applicantNumber: z.string().trim().min(1).optional(),
  sessionId: z.string().trim().min(1).optional(),
  sessionName: z.string().trim().min(1).optional(),
  convertedAt: z.string().trim().min(1).optional(),
  convertedBy: z.string().trim().min(1).optional(),
});

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
  guardianProfile: studentGuardianProfileSchema.optional(),
  address: z.string().min(1).max(500),
  emergencyContact: z.string().min(10).max(15),
  bloodGroup: z.string().max(5).optional(),
  admissionSourceType: studentAdmissionSourceTypeSchema.optional(),
  admissionSource: studentAdmissionSourceSchema.optional(),
});

export const updateStudentSchema = createStudentSchema.partial();

export type CreateStudentSchema = z.infer<typeof createStudentSchema>;
export type UpdateStudentSchema = z.infer<typeof updateStudentSchema>;
