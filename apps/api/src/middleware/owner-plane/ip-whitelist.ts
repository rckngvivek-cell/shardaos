import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { logger } from '../../lib/logger.js';

const log = logger('ip-whitelist');

/**
 * IP whitelist middleware for admin routes.
 * Rejects requests from IPs not in ADMIN_ALLOWED_IPS before any auth processing.
 *
 * In dev mode (empty ADMIN_ALLOWED_IPS): allows all.
 * In production: MUST have ADMIN_ALLOWED_IPS set.
 */
export function ipWhitelist(req: Request, _res: Response, next: NextFunction): void {
  const allowedRaw = env.ADMIN_ALLOWED_IPS;

  // In dev, if no IPs configured, allow all
  if (!allowedRaw && env.NODE_ENV !== 'production') {
    return next();
  }

  // In production with no IPs configured, block everything (fail-closed)
  if (!allowedRaw && env.NODE_ENV === 'production') {
    log.error('ADMIN_ALLOWED_IPS not configured in production — blocking all admin access');
    return next(new AppError(403, 'IP_NOT_ALLOWED', 'Admin access is not configured'));
  }

  const allowed = allowedRaw
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean);

  // Extract client IP (handles proxies via x-forwarded-for)
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? req.ip ?? '';

  if (!allowed.includes(clientIp)) {
    log.warn('Blocked admin access from non-whitelisted IP', {
      ip: clientIp,
      path: req.path,
      allowed: allowed.length,
    });
    return next(new AppError(403, 'IP_NOT_ALLOWED', 'Access denied from this network'));
  }

  next();
}
