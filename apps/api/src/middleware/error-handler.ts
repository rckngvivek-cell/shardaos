import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/app-error.js';
import { errorResponse } from '../lib/api-response.js';
import { logger } from '../lib/logger.js';

const log = logger('error-handler');

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(
      errorResponse(err.code, err.message)
    );
    return;
  }

  log.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    requestId: req.requestId,
    path: req.path,
  });

  res.status(500).json(
    errorResponse('INTERNAL_ERROR', 'An unexpected error occurred')
  );
}
