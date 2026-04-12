import { Router } from 'express';

import { env } from '../../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.json({
    success: true,
    data: {
      status: 'ok',
      authMode: env.authMode,
      dataProvider: env.dataProvider,
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: env.apiVersion,
      requestId: response.locals.requestId,
    },
  });
});
