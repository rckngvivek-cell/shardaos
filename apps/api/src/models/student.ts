import { z } from 'zod';

const phoneRegex = /^\+?[0-9]{10,15}$/;
const aadharRegex = /^[0-9]{12}$/;

const optionalString = z.string().trim().min(1).optional();

export const studentStatusSchema = z.enum([
  'active',
  'inactive',
  'transferred',
  'left',
  'deleted'
]);

export const studentSchema = z.object({
  studentId: z.string(),
  schoolId: z.string(),
  firstName: z.string().trim().min(1),
  middleName: optionalString,
  lastName: z.string().trim().min(1),
  dob: z.string().date(),
  gender: z.enum(['M', 'F', 'O']).optional(),
  aadhar: z.string().regex(aadharRegex).optional(),
  rollNumber: z.string().trim().min(1),
  class: z.number().int().min(1).max(12),
  section: z.string().trim().min(1),
  enrollmentDate: z.string().date(),
  status: studentStatusSchema.default('active'),
  contact: z.object({
    parentName: z.string().trim().min(1),
    parentEmail: z.string().email().optional(),
    parentPhone: z.string().regex(phoneRegex),
    emergencyContact: optionalString,
    emergencyContactName: optionalString
  }),
  address: z.object({
    street: optionalString,
    city: optionalString,
    state: optionalString,
    zipCode: optionalString,
    country: optionalString
  }).default({}),
  medicalInfo: z.object({
    bloodGroup: optionalString,
    allergies: optionalString,
    chronicConditions: optionalString
  }).default({}),
  documents: z.object({
    birthCertificate: optionalString,
    aadharCopy: optionalString,
    parentIdProof: optionalString,
    transferCertificate: optionalString
  }).default({}),
  archivedAt: z.string().datetime().optional(),
  metadata: z.object({
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    createdBy: z.string(),
    lastUpdatedBy: z.string()
  })
});

export const createStudentSchema = studentSchema
  .omit({
    studentId: true,
    schoolId: true,
    archivedAt: true,
    metadata: true
  })
  .extend({
    status: studentStatusSchema.default('active'),
    enrollmentDate: z.string().date().optional()
  });

export const updateStudentSchema = createStudentSchema.partial();

export const studentQuerySchema = z.object({
  q: z.string().trim().optional(),
  class: z.coerce.number().int().min(1).max(12).optional(),
  section: z.string().trim().optional(),
  status: studentStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

export type Student = z.infer<typeof studentSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type StudentQuery = z.infer<typeof studentQuerySchema>;
