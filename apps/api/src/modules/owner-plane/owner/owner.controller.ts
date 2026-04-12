import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../errors/app-error.js';
import { successResponse } from '../../../lib/api-response.js';
import { OwnerService } from './owner.service.js';

const service = new OwnerService();

export async function getOwnerProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const platformUser = req.platformUser;
    if (!platformUser) {
      throw new AppError(401, 'UNAUTHORIZED', 'Platform authentication required');
    }

    res.json(successResponse(service.getProfile(platformUser)));
  } catch (err) {
    next(err);
  }
}

export async function getOwnerSummary(_req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await service.getSummary();
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
}
