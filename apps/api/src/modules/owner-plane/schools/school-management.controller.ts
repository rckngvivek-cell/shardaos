import type { Request, Response, NextFunction } from 'express';
import type { UpdateSchoolServicePlanInput } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { successResponse } from '../../../lib/api-response.js';
import { SchoolService } from '../../schools/school.service.js';

const service = new SchoolService();

export async function updateSchoolServicePlan(req: Request, res: Response, next: NextFunction) {
  try {
    const platformUser = req.platformUser;
    if (!platformUser) {
      throw new AppError(401, 'UNAUTHORIZED', 'Platform authentication required');
    }

    const input: UpdateSchoolServicePlanInput = req.body;
    const school = await service.updateServicePlan(req.params.id as string, input);

    await req.audit?.('SETTINGS_CHANGED', 'school', school.id, {
      servicePlanTier: school.servicePlanTier,
      enabledServiceKeys: school.enabledServiceKeys,
      changedBy: platformUser.uid,
    });

    res.json(successResponse(school));
  } catch (err) {
    next(err);
  }
}
