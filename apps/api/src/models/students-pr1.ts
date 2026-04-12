import { z } from 'zod';

/**
 * Schemas for PR #1 - Students endpoints
 * Defines request/response contracts for POST /api/v1/students and GET /api/v1/students
 */

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

export const addStudentSchema = z.object({
  schoolId: z.string().uuid(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  phone: z.string().regex(phoneRegex),
  dateOfBirth: z.string().date(), // ISO 8601
  gradeLevel: z.enum(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']),
  rollNumber: z.string().min(1).max(20),
  parentName: z.string().min(2).max(100),
  parentPhone: z.string().regex(phoneRegex),
  parentEmail: z.string().email(),
  enrollmentDate: z.string().datetime(),
});

export const studentResponseSchema = z.object({
  id: z.string().uuid(),
  schoolId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  dateOfBirth: z.string().date(),
  gradeLevel: z.string(),
  rollNumber: z.string(),
  parentName: z.string(),
  parentEmail: z.string(),
  enrollmentDate: z.string().datetime(),
  createdAt: z.string().datetime(),
  status: z.enum(['active', 'inactive', 'graduated']),
});

export const listStudentsQuerySchema = z.object({
  schoolId: z.string().uuid(),
  gradeLevel: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const listStudentsResponseSchema = z.object({
  data: z.array(studentResponseSchema),
  pagination: z.object({
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
    hasMore: z.boolean(),
  }),
});

export type AddStudentInput = z.infer<typeof addStudentSchema>;
export type StudentResponse = z.infer<typeof studentResponseSchema>;
export type ListStudentsQuery = z.infer<typeof listStudentsQuerySchema>;
export type ListStudentsResponse = z.infer<typeof listStudentsResponseSchema>;
