import { Router } from 'express';

import { env } from '../config/env';
import { ok } from '../lib/api-response';

export function createHealthRouter() {
  const router = Router();

  router.get('/health', (_req: any, res: any) => {
    ok(res, {
      status: 'ok',
      env: env.NODE_ENV,
      authMode: env.AUTH_MODE,
      storageDriver: env.STORAGE_DRIVER
    });
  });

  return router;
}
