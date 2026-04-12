import { z } from 'zod';

/**
 * Schemas for PR #1 - Core API Routes
 * These schemas define the exact request/response contracts for the 5 core endpoints
 */

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const pinCodeRegex = /^\d{6}$/;

export const createSchoolSchema = z.object({
  name: z.string().min(3).max(100),
  email: z.string().email(),
  phone: z.string().regex(phoneRegex),
  address: z.string().min(5).max(500),
  city: z.string().min(2).max(50),
  state: z.string().min(2).max(50),
  pinCode: z.string().regex(pinCodeRegex),
  principalName: z.string().min(2).max(100),
  schoolRegistrationNumber: z.string().min(5).max(20),
});

export const schoolResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  pinCode: z.string(),
  principalName: z.string(),
  schoolRegistrationNumber: z.string(),
  createdAt: z.string().datetime(),
  status: z.enum(['active', 'inactive']),
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type SchoolResponse = z.infer<typeof schoolResponseSchema>;
