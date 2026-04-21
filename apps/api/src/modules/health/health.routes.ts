import { Router } from 'express';

export const healthRoutes = Router();

/**
 * Keeps app-facing and infrastructure-facing health checks on the same
 * response contract so smoke tests, load balancers, and Cloud Run probes
 * do not drift independently.
 */
function sendHealthyResponse(res: { json: (body: unknown) => void }) {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}

healthRoutes.get('/', (_req, res) => sendHealthyResponse(res));
healthRoutes.get('/live', (_req, res) => sendHealthyResponse(res));
healthRoutes.get('/ready', (_req, res) => sendHealthyResponse(res));
