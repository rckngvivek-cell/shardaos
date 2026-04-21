import crypto from 'node:crypto';
import type { LoginOtpChallenge } from '@school-erp/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { hashToken } from './password.service.js';
import type { StoredAuthCredential, StoredAuthOtpChallenge } from './auth.types.js';
import { EmailDeliveryService, type EmailDeliveryResult } from './email-delivery.service.js';

function maskEmailAddress(email: string) {
  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return email;
  }

  const localPrefix = local.length <= 2 ? `${local[0] ?? ''}*` : `${local.slice(0, 2)}${'*'.repeat(Math.max(local.length - 2, 1))}`;
  return `${localPrefix}@${domain}`;
}

function buildOtpCode(length: number) {
  const max = 10 ** length;
  const code = crypto.randomInt(0, max);
  return code.toString().padStart(length, '0');
}

function buildOtpEmail(credential: StoredAuthCredential, code: string) {
  const portalName = credential.plane === 'platform'
    ? credential.role === 'owner'
      ? 'ShardaOS owner app'
      : 'ShardaOS employee app'
    : 'ShardaOS school app';

  const subject = `Your ${portalName} verification code`;
  const text = [
    `Hello ${credential.displayName || credential.email},`,
    '',
    `Your one-time verification code for ${portalName} is ${code}.`,
    `It expires in ${env.AUTH_OTP_TTL_MIN} minutes.`,
    '',
    'If you did not attempt to sign in, ignore this email.',
  ].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a">
      <p>Hello ${credential.displayName || credential.email},</p>
      <p>Your one-time verification code for <strong>${portalName}</strong> is:</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:20px 0;">${code}</p>
      <p>It expires in ${env.AUTH_OTP_TTL_MIN} minutes.</p>
      <p>If you did not attempt to sign in, ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
}

export class EmailOtpService {
  constructor(private readonly deliveryService = new EmailDeliveryService()) {}

  buildChallengeContract(
    challenge: StoredAuthOtpChallenge,
    deliveryResult?: EmailDeliveryResult,
  ): LoginOtpChallenge {
    return {
      challengeId: challenge.id,
      plane: challenge.plane,
      deliveryChannel: 'email',
      maskedEmail: maskEmailAddress(challenge.email),
      expiresAt: challenge.expiresAt,
      resendAvailableAt: challenge.resendAvailableAt,
      otpLength: env.AUTH_OTP_LENGTH,
      ...(deliveryResult?.hint ? { deliveryHint: deliveryResult.hint } : {}),
    };
  }

  async issueLoginOtp(credential: StoredAuthCredential): Promise<{
    codeHash: string;
    expiresAt: string;
    resendAvailableAt: string;
    lastSentAt: string;
    deliveryResult: EmailDeliveryResult;
  }> {
    const code = buildOtpCode(env.AUTH_OTP_LENGTH);
    const now = new Date();
    const lastSentAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + env.AUTH_OTP_TTL_MIN * 60_000).toISOString();
    const resendAvailableAt = new Date(now.getTime() + env.AUTH_OTP_RESEND_COOLDOWN_SEC * 1000).toISOString();
    const emailMessage = buildOtpEmail(credential, code);
    const deliveryResult = await this.deliveryService.sendEmail({
      toEmail: credential.email,
      toName: credential.displayName,
      subject: emailMessage.subject,
      text: emailMessage.text,
      html: emailMessage.html,
    });

    return {
      codeHash: hashToken(code),
      expiresAt,
      resendAvailableAt,
      lastSentAt,
      deliveryResult,
    };
  }

  assertChallengeCanBeVerified(challenge: StoredAuthOtpChallenge) {
    if (challenge.consumedAt || challenge.revokedAt) {
      throw new AppError(401, 'OTP_CHALLENGE_INVALID', 'The verification challenge is no longer valid.');
    }

    if (new Date(challenge.expiresAt).getTime() <= Date.now()) {
      throw new AppError(401, 'OTP_EXPIRED', 'The verification code has expired. Request a new code.');
    }

    if (challenge.attemptCount >= challenge.maxAttempts) {
      throw new AppError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect verification attempts. Request a new code.');
    }
  }

  assertChallengeCanBeResent(challenge: StoredAuthOtpChallenge) {
    if (challenge.consumedAt || challenge.revokedAt) {
      throw new AppError(401, 'OTP_CHALLENGE_INVALID', 'The verification challenge is no longer valid.');
    }

    if (challenge.resendCount >= challenge.maxResends) {
      throw new AppError(429, 'OTP_RESEND_LIMIT_REACHED', 'This sign-in challenge has reached the resend limit.');
    }

    if (new Date(challenge.resendAvailableAt).getTime() > Date.now()) {
      throw new AppError(429, 'OTP_RESEND_NOT_READY', 'Please wait before requesting another verification code.');
    }
  }

  isOtpMatch(code: string, challenge: StoredAuthOtpChallenge) {
    return hashToken(code.trim()) === challenge.codeHash;
  }
}
