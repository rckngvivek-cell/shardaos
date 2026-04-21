import request from 'supertest';

const mockBootstrapOwner = jest.fn();
const mockCreateOwnerBootstrapSession = jest.fn();
const mockGetOwnerBootstrapStatus = jest.fn();
const mockVerifyOwnerFromBearer = jest.fn();
const mockBeginPlatformLogin = jest.fn();
const mockBeginTenantLogin = jest.fn();
const mockVerifyLoginOtp = jest.fn();
const mockResendLoginOtp = jest.fn();
const mockRefreshSession = jest.fn();
const mockLogout = jest.fn();
const mockGetSessionFromAccessToken = jest.fn();

jest.mock('../../../src/modules/auth/owner-auth.service.js', () => ({
  OwnerAuthService: jest.fn().mockImplementation(() => ({
    bootstrapOwner: mockBootstrapOwner,
    createOwnerBootstrapSession: mockCreateOwnerBootstrapSession,
    getOwnerBootstrapStatus: mockGetOwnerBootstrapStatus,
    verifyOwnerFromBearer: mockVerifyOwnerFromBearer,
  })),
}));

jest.mock('../../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    beginPlatformLogin: mockBeginPlatformLogin,
    beginTenantLogin: mockBeginTenantLogin,
    verifyLoginOtp: mockVerifyLoginOtp,
    resendLoginOtp: mockResendLoginOtp,
    refreshSession: mockRefreshSession,
    logout: mockLogout,
    getSessionFromAccessToken: mockGetSessionFromAccessToken,
  })),
}));

import { AppError } from '../../../src/errors/app-error.js';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';

const app = createApp();
const mutableEnv = env as unknown as { OWNER_BOOTSTRAP_KEY: string; NODE_ENV: string };
const originalBootstrapKey = env.OWNER_BOOTSTRAP_KEY;
const originalNodeEnv = env.NODE_ENV;
const TEST_OWNER_PASSWORD = 'test-owner-password-01';

describe('auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mutableEnv.OWNER_BOOTSTRAP_KEY = 'bootstrap-secret';
    mutableEnv.NODE_ENV = 'test';
    mockCreateOwnerBootstrapSession.mockImplementation(async (bootstrapKey: string) => {
      if (bootstrapKey !== 'bootstrap-secret') {
        throw new AppError(401, 'UNAUTHORIZED', 'Invalid bootstrap key');
      }

      return {
        bootstrapSessionToken: 'session-id.session-secret',
        expiresAt: '2026-04-21T01:00:00.000Z',
      };
    });
    mockGetOwnerBootstrapStatus.mockResolvedValue({
      state: 'available',
      available: true,
      detail: 'Owner bootstrap is available for first-time provisioning only.',
      sessionTtlMinutes: 10,
      passwordPolicy: {
        minLength: 14,
        requiresUppercase: true,
        requiresLowercase: true,
        requiresDigit: true,
        requiresSymbol: true,
      },
    });
  });

  afterAll(() => {
    mutableEnv.OWNER_BOOTSTRAP_KEY = originalBootstrapKey;
    mutableEnv.NODE_ENV = originalNodeEnv;
  });

  it('returns 503 when owner bootstrap is disabled', async () => {
    mutableEnv.OWNER_BOOTSTRAP_KEY = '';

    const res = await request(app)
      .post('/api/auth/owner/bootstrap/session')
      .set('x-owner-bootstrap-key', 'bootstrap-secret')
      .send();

    expect(res.status).toBe(503);
    expect(mockCreateOwnerBootstrapSession).not.toHaveBeenCalled();
    expect(mockBootstrapOwner).not.toHaveBeenCalled();
  });

  it('returns 401 when the bootstrap key is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/owner/bootstrap/session')
      .set('x-owner-bootstrap-key', 'wrong-key')
      .send();

    expect(res.status).toBe(401);
    expect(mockCreateOwnerBootstrapSession).toHaveBeenCalledWith('wrong-key', expect.objectContaining({
      ipAddress: expect.any(String),
      userAgent: expect.any(String),
    }));
    expect(mockBootstrapOwner).not.toHaveBeenCalled();
  });

  it('returns the bootstrap availability contract', async () => {
    const res = await request(app).get('/api/auth/owner/bootstrap');

    expect(res.status).toBe(200);
    expect(mockGetOwnerBootstrapStatus).toHaveBeenCalled();
    expect(res.body.data.available).toBe(true);
  });

  it('creates a short-lived bootstrap session through the secure bootstrap route', async () => {
    mockCreateOwnerBootstrapSession.mockResolvedValue({
      bootstrapSessionToken: 'session-id.session-secret',
      expiresAt: '2026-04-21T01:00:00.000Z',
    });

    const res = await request(app)
      .post('/api/auth/owner/bootstrap/session')
      .set('x-owner-bootstrap-key', 'bootstrap-secret')
      .send();

    expect(res.status).toBe(201);
    expect(mockCreateOwnerBootstrapSession).toHaveBeenCalledWith('bootstrap-secret', expect.objectContaining({
      ipAddress: expect.any(String),
      userAgent: expect.any(String),
    }));
    expect(res.body.data.bootstrapSessionToken).toBe('session-id.session-secret');
  });

  it('creates a new owner credential through the one-time bootstrap route', async () => {
    mockBootstrapOwner.mockResolvedValue({
      uid: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
      schoolId: '',
      displayName: 'Platform Owner',
    });

    const res = await request(app)
      .post('/api/auth/owner/bootstrap')
      .send({
        bootstrapSessionToken: 'session-id.session-secret',
        email: 'owner@example.com',
        password: `${TEST_OWNER_PASSWORD}Aa!`,
        displayName: 'Platform Owner',
      });

    expect(res.status).toBe(201);
    expect(mockBootstrapOwner).toHaveBeenCalledWith(
      {
        bootstrapSessionToken: 'session-id.session-secret',
        email: 'owner@example.com',
        password: `${TEST_OWNER_PASSWORD}Aa!`,
        displayName: 'Platform Owner',
      },
      expect.objectContaining({
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
      }),
    );
  });

  it('rejects a second use after bootstrap has already been consumed', async () => {
    mockBootstrapOwner.mockRejectedValue(new AppError(410, 'BOOTSTRAP_CONSUMED', 'Owner bootstrap has already been consumed'));

    const res = await request(app)
      .post('/api/auth/owner/bootstrap')
      .send({
        bootstrapSessionToken: 'session-id.session-secret',
        email: 'new-owner@example.com',
        password: `${TEST_OWNER_PASSWORD}Aa!`,
      });

    expect(res.status).toBe(410);
  });

  it('returns a platform session for owner sign-in', async () => {
    mockBeginPlatformLogin.mockResolvedValue({
      challengeId: 'otp-challenge-1',
      plane: 'platform',
      deliveryChannel: 'email',
      maskedEmail: 'ow***@example.com',
      expiresAt: '2026-04-21T01:10:00.000Z',
      resendAvailableAt: '2026-04-21T01:01:00.000Z',
      otpLength: 6,
    });

    const res = await request(app)
      .post('/api/auth/platform/login')
      .send({ email: 'owner@example.com', password: TEST_OWNER_PASSWORD });

    expect(res.status).toBe(202);
    expect(mockBeginPlatformLogin).toHaveBeenCalledWith(
      {
        email: 'owner@example.com',
        password: TEST_OWNER_PASSWORD,
      },
      expect.objectContaining({
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
      }),
    );
    expect(res.body.data.challengeId).toBe('otp-challenge-1');
  });

  it('verifies a login OTP and returns a JWT session', async () => {
    mockVerifyLoginOtp.mockResolvedValue({
      user: {
        uid: 'owner-uid-1',
        email: 'owner@example.com',
        role: 'owner',
        plane: 'platform',
        schoolId: '',
      },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresInSeconds: 900,
      refreshTokenExpiresInSeconds: 43200,
    });

    const res = await request(app)
      .post('/api/auth/login/verify')
      .send({ challengeId: 'otp-challenge-1', code: '123456' });

    expect(res.status).toBe(200);
    expect(mockVerifyLoginOtp).toHaveBeenCalledWith(
      { challengeId: 'otp-challenge-1', code: '123456' },
      expect.objectContaining({
        ipAddress: expect.any(String),
        userAgent: expect.any(String),
      }),
    );
    expect(res.body.data.accessToken).toBe('access-token');
  });

  it('resends a login OTP challenge', async () => {
    mockResendLoginOtp.mockResolvedValue({
      challengeId: 'otp-challenge-1',
      plane: 'platform',
      deliveryChannel: 'email',
      maskedEmail: 'ow***@example.com',
      expiresAt: '2026-04-21T01:15:00.000Z',
      resendAvailableAt: '2026-04-21T01:05:00.000Z',
      otpLength: 6,
    });

    const res = await request(app)
      .post('/api/auth/login/resend')
      .send({ challengeId: 'otp-challenge-1' });

    expect(res.status).toBe(202);
    expect(mockResendLoginOtp).toHaveBeenCalledWith({ challengeId: 'otp-challenge-1' });
    expect(res.body.data.expiresAt).toBe('2026-04-21T01:15:00.000Z');
  });

  it('returns the active session profile for a bearer token', async () => {
    mockGetSessionFromAccessToken.mockResolvedValue({
      uid: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
      schoolId: '',
      displayName: 'Platform Owner',
    });

    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer access-token');

    expect(res.status).toBe(200);
    expect(mockGetSessionFromAccessToken).toHaveBeenCalledWith('Bearer access-token');
  });
}
