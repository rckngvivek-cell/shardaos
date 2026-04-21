import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  bootstrapOwner,
  createOwnerBootstrapSession,
  getOwnerBootstrapStatus,
  getOwnerSession,
  getSession,
  loginPlatform,
  resendLoginOtp,
  loginTenant,
  logoutSession,
  requestPasswordReset,
  refreshSession,
  verifyLoginOtp,
} from './owner-auth.controller.js';

const bootstrapOwnerSchema = z.object({
  bootstrapSessionToken: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(14),
  displayName: z.string().min(2).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const verifyLoginOtpSchema = z.object({
  challengeId: z.string().min(1),
  code: z.string().trim().regex(/^\d{4,8}$/),
});

const resendLoginOtpSchema = z.object({
  challengeId: z.string().min(1),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email(),
  audience: z.enum(['employee', 'owner']),
});

export const authRoutes = Router();

authRoutes.get('/owner/bootstrap', getOwnerBootstrapStatus);
authRoutes.post('/owner/bootstrap/session', createOwnerBootstrapSession);
authRoutes.post('/owner/bootstrap', validate(bootstrapOwnerSchema), bootstrapOwner);
authRoutes.post('/platform/login', validate(loginSchema), loginPlatform);
authRoutes.post('/tenant/login', validate(loginSchema), loginTenant);
authRoutes.post('/login/verify', validate(verifyLoginOtpSchema), verifyLoginOtp);
authRoutes.post('/login/resend', validate(resendLoginOtpSchema), resendLoginOtp);
authRoutes.post('/refresh', validate(refreshSchema), refreshSession);
authRoutes.post('/logout', validate(refreshSchema), logoutSession);
authRoutes.post('/password-reset/request', validate(passwordResetRequestSchema), requestPasswordReset);
authRoutes.get('/session', getSession);
authRoutes.get('/owner/session', getOwnerSession);
