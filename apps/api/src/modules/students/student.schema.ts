import { z } from 'zod';

export const createStudentSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  dob: z.string().date(),
  gender: z.string().optional(),
  rollNumber: z.string().min(1),
  class: z.coerce.number().int().min(1).max(12),
  section: z.string().min(1),
  status: z.enum(['active', 'inactive', 'deleted']).default('active'),
  enrollmentDate: z.string().date(),
  contact: z.object({
    parentName: z.string().min(1),
    parentEmail: z.string().email().optional(),
    parentPhone: z.string().min(7),
    emergencyContact: z.string().optional(),
    emergencyContactName: z.string().optional(),
  }),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zipCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  medicalInfo: z
    .object({
      bloodGroup: z.string().optional(),
      allergies: z.string().optional(),
      chronicConditions: z.string().optional(),
    })
    .optional(),
});
