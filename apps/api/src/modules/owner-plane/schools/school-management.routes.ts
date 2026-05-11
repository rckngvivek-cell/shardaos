import { Router } from 'express';
import { z } from 'zod';
import { SCHOOL_SERVICE_KEYS } from '@school-erp/shared';
import { validate } from '../../../middleware/validate.js';
import * as controller from './school-management.controller.js';

const schoolServiceKeySchema = z.enum(SCHOOL_SERVICE_KEYS);

const updateSchoolServicePlanSchema = z.object({
  servicePlanTier: z.enum(['basic', 'advanced']),
  enabledServiceKeys: z.array(schoolServiceKeySchema).optional(),
});

export const schoolManagementRoutes = Router();

schoolManagementRoutes.patch(
  '/:id/service-plan',
  validate(updateSchoolServicePlanSchema),
  controller.updateSchoolServicePlan,
);
