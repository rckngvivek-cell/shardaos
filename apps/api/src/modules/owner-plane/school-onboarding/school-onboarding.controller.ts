import type { NextFunction, Request, Response } from 'express';
import type { SchoolOnboardingRequestInput } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { successResponse } from '../../../lib/api-response.js';
import { SchoolOnboardingService } from './school-onboarding.service.js';

const service = new SchoolOnboardingService();

export async function createSchoolOnboardingRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const platformUser = req.platformUser;
    if (!platformUser) {
      throw new AppError(401, 'UNAUTHORIZED', 'Platform authentication required');
    }

    const approval = await service.createRequest(platformUser, req.body as SchoolOnboardingRequestInput);
    const schoolId = typeof approval.metadata?.schoolId === 'string' ? approval.metadata.schoolId : approval.id;

    await req.audit?.('SCHOOL_ONBOARDING_REQUESTED', 'school', schoolId, {
      approvalId: approval.id,
      requestedBy: platformUser.uid,
      servicePlanTier: approval.metadata?.servicePlanTier,
      enabledServiceKeys: approval.metadata?.enabledServiceKeys,
    });

    res.status(201).json(successResponse(approval));
  } catch (err) {
    next(err);
  }
}
