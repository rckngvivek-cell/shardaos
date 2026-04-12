import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';

interface ZodLike {
  safeParse(data: unknown): { success: boolean; data?: unknown; error?: { issues: { path: PropertyKey[]; message: string }[] } };
}

export function validate(schema: ZodLike) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error!.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      throw new AppError(400, 'VALIDATION_ERROR', messages);
    }
    req.body = result.data;
    next();
  };
}
