import type { NextFunction, Request, Response } from 'express';
import type {
  LogoutSessionInput,
  PlatformLoginInput,
  RefreshSessionInput,
  ResendLoginOtpInput,
  TenantLoginInput,
  VerifyLoginOtpInput,
} from '@school-erp/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { successResponse } from '../../lib/api-response.js';
import { AuthService } from './auth.service.js';
import { OwnerAuthService } from './owner-auth.service.js';

const service = new OwnerAuthService();
const authService = new AuthService();

export async function bootstrapOwner(req: Request, res: Response, next: NextFunction) {
  try {
    const owner = await service.bootstrapOwner(
      req.body as { bootstrapSessionToken: string; email: string; password: string; displayName?: string },
      {
        ipAddress: req.ip || '',
        userAgent: req.get('user-agent') ?? '',
      },
    );
    res.status(201).json(successResponse(owner));
  } catch (err) {
    next(err);
  }
}

export async function getOwnerBootstrapStatus(_req: Request, res: Response, next: NextFunction) {
  try {
    const status = await service.getOwnerBootstrapStatus();
    res.json(successResponse(status));
  } catch (err) {
    next(err);
  }
}

export async function createOwnerBootstrapSession(req: Request, res: Response, next: NextFunction) {
  try {
    if (!env.OWNER_BOOTSTRAP_KEY) {
      throw new AppError(503, 'BOOTSTRAP_DISABLED', 'Owner bootstrap key is not configured');
    }

    const headerKey = req.headers['x-owner-bootstrap-key'];
    const providedKey = Array.isArray(headerKey) ? headerKey[0] : headerKey;

    if (!providedKey) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid bootstrap key');
    }

    const session = await service.createOwnerBootstrapSession(providedKey, {
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') ?? '',
    });
    res.status(201).json(successResponse(session));
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

export async function loginPlatform(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await authService.beginPlatformLogin(req.body as PlatformLoginInput, {
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') ?? '',
    });
    res.status(202).json(successResponse(challenge));
  } catch (err) {
    next(err);
  }
}

export async function loginTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await authService.beginTenantLogin(req.body as TenantLoginInput, {
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') ?? '',
    });
    res.status(202).json(successResponse(challenge));
  } catch (err) {
    next(err);
  }
}

export async function verifyLoginOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await authService.verifyLoginOtp(req.body as VerifyLoginOtpInput, {
      ipAddress: req.ip || '',
      userAgent: req.get('user-agent') ?? '',
    });
    res.json(successResponse(session));
  } catch (err) {
    next(err);
  }
}

export async function resendLoginOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const challenge = await authService.resendLoginOtp(req.body as ResendLoginOtpInput);
    res.status(202).json(successResponse(challenge));
  } catch (err) {
    next(err);
  }
}

export async function refreshSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await authService.refreshSession(req.body as RefreshSessionInput);
    res.json(successResponse(session));
  } catch (err) {
    next(err);
  }
}

export async function logoutSession(req: Request, res: Response, next: NextFunction) {
  try {
    await authService.logout(req.body as LogoutSessionInput);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await authService.getSessionFromAccessToken(req.headers.authorization);
    res.json(successResponse(session));
  } catch (err) {
    next(err);
  }
}

export async function requestPasswordReset(_req: Request, res: Response, next: NextFunction) {
  try {
    res.status(202).json(successResponse({ accepted: true }));
  } catch (err) {
    next(err);
  }
}
