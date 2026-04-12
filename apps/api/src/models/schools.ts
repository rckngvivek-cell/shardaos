import { z } from 'zod';

const phoneRegex = /^\+?[0-9]{10,15}$/;
const pinCodeRegex = /^[0-9]{6}$/;

export const schoolStatusSchema = z.enum(['active', 'inactive', 'suspended']);

export const schoolSchema = z.object({
  schoolId: z.string(),
  name: z.string().trim().min(3).max(100),
  email: z.string().email(),
  phone: z.string().regex(phoneRegex),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(50),
  state: z.string().trim().min(2).max(50),
  pinCode: z.string().regex(pinCodeRegex),
  principalName: z.string().trim().min(2).max(100),
  schoolRegistrationNumber: z.string().trim().min(5).max(20),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  status: schoolStatusSchema.default('active')
});

export const createSchoolSchema = schoolSchema
  .omit({
    schoolId: true,
    createdAt: true,
    updatedAt: true,
    status: true
  })
  .extend({
    status: schoolStatusSchema.default('active')
  });

export const updateSchoolSchema = createSchoolSchema.partial();

export const schoolQuerySchema = z.object({
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  status: schoolStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type School = z.infer<typeof schoolSchema>;
export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type SchoolQuery = z.infer<typeof schoolQuerySchema>;
