import { ZodError } from 'zod';

import { fail } from '../lib/api-response';
import { AppError } from '../lib/app-error';

export function notFoundHandler(req: any, res: any) {
  fail(res, 404, 'NOT_FOUND', `Route ${req.path} not found`, req.requestId);
}

export function errorHandler(
  err: unknown,
  req: any,
  res: any,
  _next: any
) {
  if (err instanceof AppError) {
    fail(res, err.statusCode, err.code, err.message, req.requestId, err.details);
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors as Record<string, unknown>;
    fail(res, 400, 'VALIDATION_ERROR', 'Validation failed', req.requestId, fieldErrors);
    return;
  }

  const message = err instanceof Error ? err.message : 'Unexpected server error';
  fail(res, 500, 'INTERNAL_SERVER_ERROR', message, req.requestId);
}
