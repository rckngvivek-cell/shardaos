import { randomUUID } from 'node:crypto';

import type { RequestHandler } from 'express';

export const requestIdMiddleware: RequestHandler = (_req, res, next) => {
  const requestId = randomUUID();
  (res.locals as { requestId?: string }).requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};
