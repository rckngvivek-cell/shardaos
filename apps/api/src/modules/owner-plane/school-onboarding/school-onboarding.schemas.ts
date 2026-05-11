import { z } from 'zod';
import { SCHOOL_SERVICE_KEYS } from '@school-erp/shared';

const schoolServiceKeySchema = z.enum(SCHOOL_SERVICE_KEYS);

const schoolDraftSchema = z.object({
  name: z.string().trim().min(1),
  code: z.string().trim().min(1),
  address: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().min(1),
  country: z.string().trim().min(1),
  phone: z.string().trim().min(1),
  email: z.string().trim().email(),
  principalName: z.string().trim().min(1),
});

export const schoolOnboardingRequestSchema = z.object({
  school: schoolDraftSchema,
  servicePlanTier: z.enum(['basic', 'advanced']),
  enabledServiceKeys: z.array(schoolServiceKeySchema).optional(),
});

export const schoolOnboardingApprovalMetadataSchema = z.object({
  schoolId: z.string().trim().min(1),
  schoolDraft: schoolDraftSchema,
  servicePlanTier: z.enum(['basic', 'advanced']),
  enabledServiceKeys: z.array(schoolServiceKeySchema),
});
