import { Router } from 'express';
import { validate } from '../../../middleware/validate.js';
import * as controller from './school-onboarding.controller.js';
import { schoolOnboardingRequestSchema } from './school-onboarding.schemas.js';

export const schoolOnboardingRoutes = Router();

schoolOnboardingRoutes.post(
  '/',
  validate(schoolOnboardingRequestSchema),
  controller.createSchoolOnboardingRequest,
);
