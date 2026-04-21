import jwt from 'jsonwebtoken';
import type { AuthSession } from '@school-erp/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import type { AuthTokenPayload } from './auth.types.js';

const ISSUER = 'school-erp';
const AUDIENCE = 'school-erp-clients';

function getJwtSecret(secret: string, label: string): string {
  if (secret) {
    return secret;
  }

  if (env.NODE_ENV === 'production') {
    throw new Error(`${label} is required in production`);
  }

  return `local-${label.toLowerCase().replace(/_/g, '-')}-change-me`;
}

export class JwtService {
  private readonly accessSecret = getJwtSecret(env.JWT_ACCESS_SECRET, 'JWT_ACCESS_SECRET');
  private readonly refreshSecret = getJwtSecret(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');

  getAccessTokenTtlSeconds(plane: 'platform' | 'tenant') {
    const minutes = plane === 'platform'
      ? Math.min(env.JWT_ACCESS_TTL_MIN, env.ADMIN_SESSION_TIMEOUT_MIN)
      : env.JWT_ACCESS_TTL_MIN;

    return minutes * 60;
  }

  getRefreshTokenTtlSeconds(plane: 'platform' | 'tenant') {
    return plane === 'platform'
      ? env.JWT_PLATFORM_REFRESH_TTL_HOURS * 60 * 60
      : env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60;
  }

  signAccessToken(payload: Omit<AuthTokenPayload, 'typ'>): string {
    return jwt.sign(
      { ...payload, typ: 'access' },
      this.accessSecret,
      {
        algorithm: 'HS256',
        issuer: ISSUER,
        audience: AUDIENCE,
        expiresIn: this.getAccessTokenTtlSeconds(payload.plane),
      },
    );
  }

  signRefreshToken(payload: Omit<AuthTokenPayload, 'typ'>): string {
    return jwt.sign(
      { ...payload, typ: 'refresh' },
      this.refreshSecret,
      {
        algorithm: 'HS256',
        issuer: ISSUER,
        audience: AUDIENCE,
        expiresIn: this.getRefreshTokenTtlSeconds(payload.plane),
      },
    );
  }

  verifyAccessToken(token: string): AuthTokenPayload {
    return this.verifyToken(token, this.accessSecret, 'access');
  }

  verifyRefreshToken(token: string): AuthTokenPayload {
    return this.verifyToken(token, this.refreshSecret, 'refresh');
  }

  private verifyToken(token: string, secret: string, expectedType: 'access' | 'refresh'): AuthTokenPayload {
    try {
      const decoded = jwt.verify(token, secret, {
        algorithms: ['HS256'],
        issuer: ISSUER,
        audience: AUDIENCE,
      }) as AuthTokenPayload;

      if (decoded.typ !== expectedType) {
        throw new AppError(401, 'UNAUTHORIZED', 'Invalid token type');
      }

      return decoded;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired token');
    }
  }

  getTokenExpiry(session: AuthSession) {
    return {
      accessTokenExpiresInSeconds: session.accessTokenExpiresInSeconds,
      refreshTokenExpiresInSeconds: session.refreshTokenExpiresInSeconds,
    };
  }
}
