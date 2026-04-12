import type { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { successResponse } from '../../lib/api-response.js';
import { OwnerAuthService } from './owner-auth.service.js';

const service = new OwnerAuthService();

export async function bootstrapOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const headerKey = req.headers['x-owner-bootstrap-key'];
    const providedKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;

    if (!providedKey || providedKey !== env.OWNER_BOOTSTRAP_KEY) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid bootstrap key');
    }

    const owner = await service.bootstrapOwner(req.body as { email: string; password: string; displayName?: string });
    res.status(201).json(successResponse(owner));
  } catch (err) {
    next(err);
  }
}

export async function getOwnerSession(req: Request, res: Response, next: NextFunction) {
  try {
    const owner = await service.verifyOwnerFromBearer(req.headers.authorization);
    res.json(successResponse(owner));
  } catch (err) {
    next(err);
  }
}
