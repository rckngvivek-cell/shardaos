import { z } from 'zod';

export const studentStatusSchema = z.enum(['active', 'inactive', 'archived']);

export const contactInfoSchema = z.object({
  parentName: z.string().min(2).max(120),
  parentEmail: z.email(),
  parentPhone: z.string().min(8).max(24),
  emergencyContact: z.string().min(8).max(24).optional(),
  emergencyContactName: z.string().min(2).max(120).optional(),
});

export const addressSchema = z.object({
  street: z.string().min(2).max(160),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(80),
  zipCode: z.string().min(3).max(16),
  country: z.string().min(2).max(80),
});

export const createStudentInputSchema = z.object({
  firstName: z.string().min(2).max(80),
  middleName: z.string().max(80).optional(),
  lastName: z.string().min(2).max(80),
  dob: z.iso.date(),
  gender: z.enum(['M', 'F', 'O']),
  aadhar: z.string().min(12).max(16).optional(),
  rollNumber: z.string().min(1).max(24),
  class: z.string().min(1).max(32),
  section: z.string().min(1).max(8),
  enrollmentDate: z.iso.date(),
  status: studentStatusSchema.default('active'),
  contact: contactInfoSchema,
  address: addressSchema,
  medicalInfo: z
    .object({
      bloodGroup: z.string().max(8).optional(),
      allergies: z.string().max(240).optional(),
      chronicConditions: z.string().max(240).optional(),
    })
    .optional(),
});

export const updateStudentInputSchema = createStudentInputSchema.partial();

export const studentRecordSchema = createStudentInputSchema.extend({
  id: z.string(),
  schoolId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const studentListFiltersSchema = z.object({
  q: z.string().optional(),
  class: z.string().optional(),
  section: z.string().optional(),
  status: studentStatusSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type StudentStatus = z.infer<typeof studentStatusSchema>;
export type ContactInfo = z.infer<typeof contactInfoSchema>;
export type Address = z.infer<typeof addressSchema>;
export type CreateStudentInput = z.infer<typeof createStudentInputSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;
export type StudentRecord = z.infer<typeof studentRecordSchema>;
export type StudentListFilters = z.infer<typeof studentListFiltersSchema>;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: {
    timestamp: string;
    version: string;
    requestId?: string;
  };
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    status: number;
    details?: Record<string, unknown>;
  };
  meta: {
    timestamp: string;
    requestId?: string;
  };
}
