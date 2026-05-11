import type { Request, Response, NextFunction } from 'express';
import { SchoolService } from './school.service.js';
import { successResponse } from '../../lib/api-response.js';

const service = new SchoolService();

export async function getMySchool(req: Request, res: Response, next: NextFunction) {
  try {
    const school = await service.getById(req.user!.schoolId);
    res.json(successResponse(school));
  } catch (err) {
    next(err);
  }
}

export async function getMySchoolServices(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await service.getServicesSummary(req.user!.schoolId);
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
}
