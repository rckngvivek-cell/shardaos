import type { LoginOtpChallenge } from '@school-erp/shared';
import { AuthService } from '../../../src/modules/auth/auth.service.js';
import { hashPassword, hashToken } from '../../../src/modules/auth/password.service.js';
import type { StoredAuthCredential, StoredAuthOtpChallenge, StoredAuthSession } from '../../../src/modules/auth/auth.types.js';

const now = '2026-04-21T10:00:00.000Z';

function buildPlatformCredential(): StoredAuthCredential {
  return {
    id: 'platform:owner@example.com',
    uid: 'owner-uid-1',
    email: 'owner@example.com',
    emailNormalized: 'owner@example.com',
    displayName: 'Platform Owner',
    plane: 'platform',
    role: 'owner',
    schoolId: '',
    passwordHash: hashPassword('OwnerPassword@123'),
    isActive: true,
    passwordUpdatedAt: now,
    lastLoginAt: '',
    createdAt: now,
    updatedAt: now,
  };
}

function buildOtpChallenge(): StoredAuthOtpChallenge {
  return {
    id: 'otp-challenge-1',
    uid: 'owner-uid-1',
    email: 'owner@example.com',
    emailNormalized: 'owner@example.com',
    displayName: 'Platform Owner',
    plane: 'platform',
    role: 'owner',
    schoolId: '',
    codeHash: hashToken('123456'),
    expiresAt: '2026-04-21T10:10:00.000Z',
    resendAvailableAt: '2026-04-21T10:01:00.000Z',
    lastSentAt: now,
    attemptCount: 0,
    maxAttempts: 5,
    resendCount: 0,
    maxResends: 3,
    createdAt: now,
    updatedAt: now,
    consumedAt: null,
    revokedAt: null,
    createdFromIp: '127.0.0.1',
    createdUserAgent: 'jest',
    consumedFromIp: '',
    consumedUserAgent: '',
  };
}

describe('AuthService OTP login flow', () => {
  it('creates an email OTP challenge for platform login', async () => {
    const credential = buildPlatformCredential();
    const loginChallenge: LoginOtpChallenge = {
      challengeId: 'otp-challenge-1',
      plane: 'platform',
      deliveryChannel: 'email',
      maskedEmail: 'ow***@example.com',
      expiresAt: '2026-04-21T10:10:00.000Z',
      resendAvailableAt: '2026-04-21T10:01:00.000Z',
      otpLength: 6,
    };
    const authRepository = {
      findCredentialByEmail: jest.fn().mockResolvedValue(credential),
      revokeActiveOtpChallengesForUid: jest.fn().mockResolvedValue(undefined),
      createOtpChallenge: jest.fn().mockImplementation(async (id: string, payload: Omit<StoredAuthOtpChallenge, 'id'>) => ({
        id,
        ...payload,
      })),
    };
    const emailOtpService = {
      issueLoginOtp: jest.fn().mockResolvedValue({
        codeHash: hashToken('123456'),
        expiresAt: loginChallenge.expiresAt,
        resendAvailableAt: loginChallenge.resendAvailableAt,
        lastSentAt: now,
        deliveryResult: { mode: 'file', hint: 'Development email written to .tools/email-outbox/test.json' },
      }),
      buildChallengeContract: jest.fn().mockReturnValue(loginChallenge),
    };

    const service = new AuthService({
      authRepository: authRepository as never,
      emailOtpService: emailOtpService as never,
    });

    const challenge = await service.beginPlatformLogin(
      { email: 'owner@example.com', password: 'OwnerPassword@123' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(authRepository.findCredentialByEmail).toHaveBeenCalledWith('owner@example.com', 'platform');
    expect(authRepository.revokeActiveOtpChallengesForUid).toHaveBeenCalledWith('owner-uid-1', 'platform');
    expect(authRepository.createOtpChallenge).toHaveBeenCalled();
    expect(emailOtpService.issueLoginOtp).toHaveBeenCalledWith(credential);
    expect(challenge).toEqual(loginChallenge);
  });

  it('verifies a correct OTP and issues a JWT session', async () => {
    const credential = buildPlatformCredential();
    const challenge = buildOtpChallenge();
    const createdSessions: StoredAuthSession[] = [];
    const authRepository = {
      findOtpChallengeById: jest.fn().mockResolvedValue(challenge),
      updateOtpChallenge: jest.fn().mockResolvedValue(undefined),
      findCredentialByUid: jest.fn().mockResolvedValue(credential),
      createSession: jest.fn().mockImplementation(async (id: string, payload: Omit<StoredAuthSession, 'id'>) => {
        const session = { id, ...payload };
        createdSessions.push(session);
        return session;
      }),
      updateCredential: jest.fn().mockResolvedValue(undefined),
    };
    const jwtService = {
      signAccessToken: jest.fn().mockReturnValue('access-token'),
      signRefreshToken: jest.fn().mockReturnValue('refresh-token'),
      getAccessTokenTtlSeconds: jest.fn().mockReturnValue(900),
      getRefreshTokenTtlSeconds: jest.fn().mockReturnValue(43200),
    };
    const emailOtpService = {
      assertChallengeCanBeVerified: jest.fn(),
      isOtpMatch: jest.fn().mockReturnValue(true),
    };

    const service = new AuthService({
      authRepository: authRepository as never,
      jwtService: jwtService as never,
      emailOtpService: emailOtpService as never,
    });

    const session = await service.verifyLoginOtp(
      { challengeId: 'otp-challenge-1', code: '123456' },
      { ipAddress: '127.0.0.1', userAgent: 'jest' },
    );

    expect(authRepository.updateOtpChallenge).toHaveBeenCalledWith(
      'otp-challenge-1',
      expect.objectContaining({
        consumedAt: expect.any(String),
        consumedFromIp: '127.0.0.1',
        consumedUserAgent: 'jest',
      }),
    );
    expect(createdSessions).toHaveLength(1);
    expect(session.accessToken).toBe('access-token');
    expect(session.refreshToken).toBe('refresh-token');
    expect(session.user.email).toBe('owner@example.com');
  });

  it('increments the OTP attempt count when the code is wrong', async () => {
    const authRepository = {
      findOtpChallengeById: jest.fn().mockResolvedValue(buildOtpChallenge()),
      updateOtpChallenge: jest.fn().mockResolvedValue(undefined),
    };
    const emailOtpService = {
      assertChallengeCanBeVerified: jest.fn(),
      isOtpMatch: jest.fn().mockReturnValue(false),
    };

    const service = new AuthService({
      authRepository: authRepository as never,
      emailOtpService: emailOtpService as never,
    });

    await expect(
      service.verifyLoginOtp(
        { challengeId: 'otp-challenge-1', code: '654321' },
        { ipAddress: '127.0.0.1', userAgent: 'jest' },
      ),
    ).rejects.toMatchObject({ code: 'INVALID_OTP' });

    expect(authRepository.updateOtpChallenge).toHaveBeenCalledWith(
      'otp-challenge-1',
      expect.objectContaining({ attemptCount: 1 }),
    );
  });
});
