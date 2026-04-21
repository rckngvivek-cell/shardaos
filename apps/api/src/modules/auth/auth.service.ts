import crypto from 'node:crypto';
import type {
  AuthSession,
  AuthSessionUser,
  LoginOtpChallenge,
  LogoutSessionInput,
  OwnerBootstrapSessionGrant,
  OwnerBootstrapStatus,
  PlatformLoginInput,
  ResendLoginOtpInput,
  RefreshSessionInput,
  TenantRole,
  TenantLoginInput,
  VerifyLoginOtpInput,
} from '@school-erp/shared';
import type { PlatformRole } from '@school-erp/shared';
import { isPlatformRole, isTenantRole } from '@school-erp/shared';
import { env } from '../../config/env.js';
import { AppError } from '../../errors/app-error.js';
import { getFirestoreDb } from '../../lib/firebase.js';
import { EmployeeRepository } from '../owner-plane/employees/employee.repository.js';
import { SchoolRepository } from '../schools/school.repository.js';
import { AuthRepository, OWNER_BOOTSTRAP_STATE_DOC_ID } from './auth.repository.js';
import { EmailOtpService } from './email-otp.service.js';
import { JwtService } from './jwt.service.js';
import {
  OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH,
  compareSecret,
  generateTemporaryPassword,
  getOwnerBootstrapPasswordError,
  hashPassword,
  hashToken,
  verifyPassword,
} from './password.service.js';
import type {
  StoredAuthCredential,
  StoredAuthOtpChallenge,
  StoredOwnerBootstrapSession,
  StoredOwnerBootstrapState,
} from './auth.types.js';
import { toSessionUser } from './auth.types.js';

interface BootstrapOwnerInput {
  bootstrapSessionToken: string;
  email: string;
  password: string;
  displayName?: string;
}

interface BootstrapRequestMeta {
  ipAddress: string;
  userAgent: string;
}

interface LoginRequestMeta {
  ipAddress: string;
  userAgent: string;
}

interface AuthServiceDependencies {
  authRepository?: AuthRepository;
  jwtService?: JwtService;
  employeeRepository?: EmployeeRepository;
  schoolRepository?: SchoolRepository;
  emailOtpService?: EmailOtpService;
}

const OWNER_BOOTSTRAP_STATE_MESSAGES = {
  disabled: 'Owner bootstrap is not enabled on this API.',
  available: 'Owner bootstrap is available for first-time provisioning only.',
  consumed: 'Owner bootstrap has already been consumed and is permanently disabled.',
} as const;

export class AuthService {
  private readonly authRepository: AuthRepository;
  private readonly jwtService: JwtService;
  private readonly employeeRepository: EmployeeRepository;
  private readonly schoolRepository: SchoolRepository;
  private readonly emailOtpService: EmailOtpService;

  constructor(dependencies: AuthServiceDependencies = {}) {
    this.authRepository = dependencies.authRepository ?? new AuthRepository();
    this.jwtService = dependencies.jwtService ?? new JwtService();
    this.employeeRepository = dependencies.employeeRepository ?? new EmployeeRepository();
    this.schoolRepository = dependencies.schoolRepository ?? new SchoolRepository();
    this.emailOtpService = dependencies.emailOtpService ?? new EmailOtpService();
  }

  async getOwnerBootstrapStatus(): Promise<OwnerBootstrapStatus> {
    if (!env.OWNER_BOOTSTRAP_KEY) {
      return this.buildOwnerBootstrapStatus('disabled');
    }

    const [state, existingOwner] = await Promise.all([
      this.authRepository.findOwnerBootstrapState(),
      this.authRepository.findOwnerCredential(),
    ]);

    if (state?.consumedAt) {
      return this.buildOwnerBootstrapStatus('consumed', state);
    }

    if (existingOwner) {
      return this.buildOwnerBootstrapStatus('consumed', {
        consumedAt: existingOwner.createdAt || existingOwner.updatedAt,
        consumedByEmail: existingOwner.email,
      });
    }

    return this.buildOwnerBootstrapStatus('available');
  }

  async createOwnerBootstrapSession(
    bootstrapKey: string,
    requestMeta: BootstrapRequestMeta,
  ): Promise<OwnerBootstrapSessionGrant> {
    if (!env.OWNER_BOOTSTRAP_KEY) {
      throw new AppError(503, 'BOOTSTRAP_DISABLED', OWNER_BOOTSTRAP_STATE_MESSAGES.disabled);
    }

    if (!compareSecret(bootstrapKey, env.OWNER_BOOTSTRAP_KEY)) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid bootstrap key');
    }

    const status = await this.getOwnerBootstrapStatus();
    if (!status.available) {
      throw new AppError(410, 'BOOTSTRAP_CONSUMED', OWNER_BOOTSTRAP_STATE_MESSAGES.consumed);
    }

    const sessionId = crypto.randomUUID();
    const sessionSecret = crypto.randomBytes(32).toString('base64url');
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + env.OWNER_BOOTSTRAP_SESSION_TTL_MIN * 60_000).toISOString();

    await this.authRepository.createOwnerBootstrapSession(sessionId, {
      tokenHash: hashToken(sessionSecret),
      createdAt: now,
      updatedAt: now,
      expiresAt,
      createdFromIp: requestMeta.ipAddress,
      createdUserAgent: requestMeta.userAgent,
    });

    return {
      bootstrapSessionToken: `${sessionId}.${sessionSecret}`,
      expiresAt,
    };
  }

  async bootstrapOwner(input: BootstrapOwnerInput, requestMeta: BootstrapRequestMeta): Promise<AuthSessionUser> {
    if (!env.OWNER_BOOTSTRAP_KEY) {
      throw new AppError(503, 'BOOTSTRAP_DISABLED', OWNER_BOOTSTRAP_STATE_MESSAGES.disabled);
    }

    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName?.trim() || 'Owner';
    const passwordError = getOwnerBootstrapPasswordError(input.password);
    if (passwordError) {
      throw new AppError(400, 'WEAK_OWNER_PASSWORD', passwordError);
    }

    const parsedSession = this.parseOwnerBootstrapSessionToken(input.bootstrapSessionToken);
    const now = new Date().toISOString();
    const uid = crypto.randomUUID();
    const credentialId = this.createCredentialId('platform', email);
    const passwordHash = hashPassword(input.password);
    const db = getFirestoreDb();
    const stateRef = db.collection('owner_bootstrap_state').doc(OWNER_BOOTSTRAP_STATE_DOC_ID);
    const sessionRef = db.collection('owner_bootstrap_sessions').doc(parsedSession.sessionId);
    const credentialsQuery = db
      .collection('auth_credentials')
      .where('plane', '==', 'platform')
      .where('role', '==', 'owner')
      .limit(1);
    const credentialRef = db.collection('auth_credentials').doc(credentialId);

    const owner = await db.runTransaction<StoredAuthCredential>(async (transaction) => {
      const [stateDoc, sessionDoc, ownerQuery] = await Promise.all([
        transaction.get(stateRef),
        transaction.get(sessionRef),
        transaction.get(credentialsQuery),
      ]);

      const state = stateDoc.exists
        ? ({ id: stateDoc.id, ...(stateDoc.data() as Omit<StoredOwnerBootstrapState, 'id'>) })
        : null;
      if (state?.consumedAt) {
        throw new AppError(410, 'BOOTSTRAP_CONSUMED', OWNER_BOOTSTRAP_STATE_MESSAGES.consumed);
      }

      if (!sessionDoc.exists) {
        throw new AppError(401, 'INVALID_BOOTSTRAP_SESSION', 'Bootstrap session is missing or expired');
      }

      const bootstrapSession = {
        id: sessionDoc.id,
        ...(sessionDoc.data() as Omit<StoredOwnerBootstrapSession, 'id'>),
      };

      if (new Date(bootstrapSession.expiresAt).getTime() <= Date.now()) {
        throw new AppError(401, 'INVALID_BOOTSTRAP_SESSION', 'Bootstrap session is missing or expired');
      }

      if (hashToken(parsedSession.secret) !== bootstrapSession.tokenHash) {
        throw new AppError(401, 'INVALID_BOOTSTRAP_SESSION', 'Bootstrap session is missing or expired');
      }

      if (!ownerQuery.empty) {
        throw new AppError(410, 'BOOTSTRAP_CONSUMED', OWNER_BOOTSTRAP_STATE_MESSAGES.consumed);
      }

      const payload: Omit<StoredAuthCredential, 'id'> = {
        uid,
        email,
        emailNormalized: email,
        displayName,
        plane: 'platform',
        role: 'owner',
        schoolId: '',
        passwordHash,
        isActive: true,
        passwordUpdatedAt: now,
        lastLoginAt: '',
        createdAt: now,
        updatedAt: now,
      };

      transaction.set(credentialRef, payload);
      transaction.set(
        stateRef,
        {
          createdAt: state?.createdAt ?? now,
          updatedAt: now,
          consumedAt: now,
          consumedByEmail: email,
          consumedByUid: uid,
          consumedFromIp: requestMeta.ipAddress,
          consumedUserAgent: requestMeta.userAgent,
        },
        { merge: true },
      );
      transaction.delete(sessionRef);

      return { id: credentialId, ...payload };
    });

    await this.authRepository.revokeSessionsForUid(owner.uid, 'platform');

    return toSessionUser(owner);
  }

  async beginPlatformLogin(input: PlatformLoginInput, requestMeta: LoginRequestMeta): Promise<LoginOtpChallenge> {
    const email = input.email.trim().toLowerCase();
    const credential = await this.authRepository.findCredentialByEmail(email, 'platform');
    const validCredential = this.assertCredentialForLogin(credential, input.password);

    if (!isPlatformRole(validCredential.role)) {
      throw new AppError(403, 'PLATFORM_ONLY', 'Platform sign-in requires an owner or employee identity');
    }

    if (validCredential.role === 'employee') {
      await this.assertActivePlatformEmployee(validCredential.uid);
    }

    return this.createLoginChallenge(validCredential, requestMeta);
  }

  async beginTenantLogin(input: TenantLoginInput, requestMeta: LoginRequestMeta): Promise<LoginOtpChallenge> {
    const email = input.email.trim().toLowerCase();
    const credential = await this.authRepository.findCredentialByEmail(email, 'tenant');
    const validCredential = this.assertCredentialForLogin(credential, input.password);

    if (!isTenantRole(validCredential.role)) {
      throw new AppError(403, 'TENANT_ONLY', 'Tenant sign-in requires a school-scoped identity');
    }

    if (!validCredential.schoolId) {
      throw new AppError(403, 'SCHOOL_SCOPE_MISSING', 'Tenant credential is missing school scope');
    }

    const school = await this.schoolRepository.findById(validCredential.schoolId);
    if (!school || !school.isActive) {
      throw new AppError(403, 'SCHOOL_INACTIVE', 'This school workspace is not active');
    }

    return this.createLoginChallenge(validCredential, requestMeta);
  }

  async verifyLoginOtp(input: VerifyLoginOtpInput, requestMeta: LoginRequestMeta): Promise<AuthSession> {
    const challenge = await this.getVerifiedChallenge(input.challengeId);
    this.emailOtpService.assertChallengeCanBeVerified(challenge);

    const normalizedCode = input.code.trim();
    if (!this.emailOtpService.isOtpMatch(normalizedCode, challenge)) {
      const attemptCount = challenge.attemptCount + 1;
      const exhausted = attemptCount >= challenge.maxAttempts;
      await this.authRepository.updateOtpChallenge(challenge.id, {
        attemptCount,
        ...(exhausted ? { revokedAt: new Date().toISOString() } : {}),
      });

      if (exhausted) {
        throw new AppError(429, 'OTP_ATTEMPTS_EXCEEDED', 'Too many incorrect verification attempts. Request a new code.');
      }

      throw new AppError(401, 'INVALID_OTP', 'Incorrect verification code.');
    }

    await this.authRepository.updateOtpChallenge(challenge.id, {
      consumedAt: new Date().toISOString(),
      consumedFromIp: requestMeta.ipAddress,
      consumedUserAgent: requestMeta.userAgent,
    });

    const credential = await this.authRepository.findCredentialByUid(challenge.uid, challenge.plane);
    const activeCredential = await this.assertCredentialForChallenge(credential, challenge);
    return this.issueSession(activeCredential);
  }

  async resendLoginOtp(input: ResendLoginOtpInput): Promise<LoginOtpChallenge> {
    const challenge = await this.getVerifiedChallenge(input.challengeId);
    this.emailOtpService.assertChallengeCanBeResent(challenge);

    const credential = await this.authRepository.findCredentialByUid(challenge.uid, challenge.plane);
    const activeCredential = await this.assertCredentialForChallenge(credential, challenge);
    const otp = await this.emailOtpService.issueLoginOtp(activeCredential);

    await this.authRepository.updateOtpChallenge(challenge.id, {
      codeHash: otp.codeHash,
      expiresAt: otp.expiresAt,
      resendAvailableAt: otp.resendAvailableAt,
      lastSentAt: otp.lastSentAt,
      attemptCount: 0,
      resendCount: challenge.resendCount + 1,
    });

    return this.emailOtpService.buildChallengeContract(
      {
        ...challenge,
        codeHash: otp.codeHash,
        expiresAt: otp.expiresAt,
        resendAvailableAt: otp.resendAvailableAt,
        lastSentAt: otp.lastSentAt,
        attemptCount: 0,
        resendCount: challenge.resendCount + 1,
        updatedAt: new Date().toISOString(),
      },
      otp.deliveryResult,
    );
  }

  async refreshSession(input: RefreshSessionInput): Promise<AuthSession> {
    const payload = this.jwtService.verifyRefreshToken(input.refreshToken);
    const session = await this.authRepository.findSessionById(payload.sid);
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      throw new AppError(401, 'UNAUTHORIZED', 'Refresh session is invalid or expired');
    }

    if (hashToken(input.refreshToken) !== session.refreshTokenHash) {
      throw new AppError(401, 'UNAUTHORIZED', 'Refresh session is invalid or expired');
    }

    const credential = await this.authRepository.findCredentialByUid(session.uid, session.plane);
    if (!credential || !credential.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'Auth credential is no longer active');
    }

    if (credential.plane === 'platform' && credential.role === 'employee') {
      await this.assertActivePlatformEmployee(credential.uid);
    }

    return this.issueSession(credential, session.id);
  }

  async logout(input: LogoutSessionInput): Promise<void> {
    const payload = this.jwtService.verifyRefreshToken(input.refreshToken);
    const session = await this.authRepository.findSessionById(payload.sid);
    if (!session) {
      return;
    }

    if (hashToken(input.refreshToken) !== session.refreshTokenHash) {
      throw new AppError(401, 'UNAUTHORIZED', 'Refresh session is invalid or expired');
    }

    await this.authRepository.revokeSession(session.id);
  }

  async getSessionFromAccessToken(authorizationHeader?: string): Promise<AuthSessionUser> {
    const token = this.getBearerToken(authorizationHeader);
    const payload = this.jwtService.verifyAccessToken(token);
    const session = await this.authRepository.findSessionById(payload.sid);
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      throw new AppError(401, 'UNAUTHORIZED', 'Session is invalid or expired');
    }

    const credential = await this.authRepository.findCredentialByUid(payload.sub, payload.plane);
    if (!credential || !credential.isActive) {
      throw new AppError(401, 'UNAUTHORIZED', 'Auth credential is no longer active');
    }

    if (credential.plane === 'platform' && credential.role === 'employee') {
      await this.assertActivePlatformEmployee(credential.uid);
    }

    return toSessionUser(credential);
  }

  async getAccessTokenPayload(authorizationHeader?: string) {
    const token = this.getBearerToken(authorizationHeader);
    const payload = this.jwtService.verifyAccessToken(token);
    const session = await this.authRepository.findSessionById(payload.sid);
    if (!session || session.revokedAt || new Date(session.expiresAt).getTime() <= Date.now()) {
      throw new AppError(401, 'UNAUTHORIZED', 'Session is invalid or expired');
    }

    return payload;
  }

  async upsertCredentialForPlatformUser(input: {
    uid: string;
    email: string;
    displayName: string;
    role: PlatformRole;
    isActive: boolean;
    temporaryPassword?: string;
  }): Promise<{ temporaryPassword: string | null }> {
    const email = input.email.trim().toLowerCase();
    const now = new Date().toISOString();
    const existing = await this.authRepository.findCredentialByUid(input.uid, 'platform');
    const temporaryPassword = input.temporaryPassword ?? generateTemporaryPassword(input.role);

    await this.authRepository.saveCredential(existing?.id ?? this.createCredentialId('platform', email), {
      uid: input.uid,
      email,
      emailNormalized: email,
      displayName: input.displayName.trim(),
      plane: 'platform',
      role: input.role,
      schoolId: '',
      passwordHash: existing?.passwordHash ?? hashPassword(temporaryPassword),
      isActive: input.isActive,
      passwordUpdatedAt: existing?.passwordUpdatedAt ?? now,
      lastLoginAt: existing?.lastLoginAt ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });

    return { temporaryPassword: existing ? null : temporaryPassword };
  }

  async updatePlatformCredentialState(uid: string, isActive: boolean): Promise<void> {
    const credential = await this.authRepository.findCredentialByUid(uid, 'platform');
    if (!credential) {
      return;
    }

    await this.authRepository.updateCredential(credential.id, { isActive });
    await this.authRepository.revokeSessionsForUid(uid, 'platform');
  }

  async syncPlatformCredential(uid: string, patch: {
    email: string;
    displayName: string;
    isActive: boolean;
    role: PlatformRole;
    lastLoginAt: string;
  }): Promise<void> {
    const email = patch.email.trim().toLowerCase();
    const credential = await this.authRepository.findCredentialByUid(uid, 'platform');
    if (!credential) {
      await this.authRepository.saveCredential(this.createCredentialId('platform', email), {
        uid,
        email,
        emailNormalized: email,
        displayName: patch.displayName,
        plane: 'platform',
        role: patch.role,
        schoolId: '',
        passwordHash: hashPassword(generateTemporaryPassword(patch.role)),
        isActive: patch.isActive,
        passwordUpdatedAt: new Date().toISOString(),
        lastLoginAt: patch.lastLoginAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    await this.authRepository.updateCredential(credential.id, {
      email,
      emailNormalized: email,
      displayName: patch.displayName,
      isActive: patch.isActive,
      role: patch.role,
      lastLoginAt: patch.lastLoginAt,
    });
  }

  async upsertTenantCredential(input: {
    uid?: string;
    email: string;
    displayName: string;
    role: TenantRole;
    schoolId: string;
    password: string;
    isActive?: boolean;
  }): Promise<void> {
    const email = input.email.trim().toLowerCase();
    const now = new Date().toISOString();
    const existing = await this.authRepository.findCredentialByEmail(email, 'tenant');
    await this.authRepository.saveCredential(existing?.id ?? this.createCredentialId('tenant', `${input.schoolId}:${email}`), {
      uid: input.uid ?? existing?.uid ?? crypto.randomUUID(),
      email,
      emailNormalized: email,
      displayName: input.displayName.trim(),
      plane: 'tenant',
      role: input.role,
      schoolId: input.schoolId,
      passwordHash: hashPassword(input.password),
      isActive: input.isActive ?? true,
      passwordUpdatedAt: now,
      lastLoginAt: existing?.lastLoginAt ?? '',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
  }

  assertTenantRole(role: string) {
    if (!isTenantRole(role)) {
      throw new AppError(400, 'INVALID_ROLE', 'Invalid tenant role');
    }

    return role;
  }

  private async issueSession(credential: StoredAuthCredential, existingSessionId?: string): Promise<AuthSession> {
    const sessionId = existingSessionId ?? crypto.randomUUID();
    const payload = {
      sub: credential.uid,
      email: credential.email,
      role: credential.role,
      plane: credential.plane,
      schoolId: credential.schoolId || undefined,
      displayName: credential.displayName,
      sid: sessionId,
    };
    const accessToken = this.jwtService.signAccessToken(payload);
    const refreshToken = this.jwtService.signRefreshToken(payload);
    const accessTokenExpiresInSeconds = this.jwtService.getAccessTokenTtlSeconds(credential.plane);
    const refreshTokenExpiresInSeconds = this.jwtService.getRefreshTokenTtlSeconds(credential.plane);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + refreshTokenExpiresInSeconds * 1000).toISOString();

    await this.authRepository.createSession(sessionId, {
      uid: credential.uid,
      email: credential.email,
      displayName: credential.displayName,
      plane: credential.plane,
      role: credential.role,
      schoolId: credential.schoolId,
      refreshTokenHash: hashToken(refreshToken),
      expiresAt,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: now,
      revokedAt: null,
    });

    await this.authRepository.updateCredential(credential.id, { lastLoginAt: now });
    if (credential.plane === 'platform' && credential.role === 'employee') {
      const employee = await this.employeeRepository.findByUid(credential.uid);
      if (employee) {
        await this.employeeRepository.update(employee.id, { lastLoginAt: now, lastSyncedAt: now });
      }
    }

    return {
      user: {
        uid: credential.uid,
        email: credential.email,
        role: credential.role,
        plane: credential.plane,
        schoolId: credential.schoolId,
        displayName: credential.displayName,
      },
      accessToken,
      refreshToken,
      accessTokenExpiresInSeconds,
      refreshTokenExpiresInSeconds,
    };
  }

  private assertCredentialForLogin(credential: StoredAuthCredential | null, password: string): StoredAuthCredential {
    if (!credential || !credential.isActive || !verifyPassword(password, credential.passwordHash)) {
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    return credential;
  }

  private async assertActivePlatformEmployee(uid: string): Promise<void> {
    const employee = await this.employeeRepository.findByUid(uid);
    if (!employee || !employee.isActive || !employee.platformAccessActive || employee.authProviderDisabled) {
      throw new AppError(403, 'EMPLOYEE_ACCESS_DISABLED', 'Platform employee access is disabled');
    }
  }

  private async createLoginChallenge(
    credential: StoredAuthCredential,
    requestMeta: LoginRequestMeta,
  ): Promise<LoginOtpChallenge> {
    await this.authRepository.revokeActiveOtpChallengesForUid(credential.uid, credential.plane);

    const challengeId = crypto.randomUUID();
    const otp = await this.emailOtpService.issueLoginOtp(credential);
    const now = new Date().toISOString();
    const challenge = await this.authRepository.createOtpChallenge(challengeId, {
      uid: credential.uid,
      email: credential.email,
      emailNormalized: credential.emailNormalized,
      displayName: credential.displayName,
      plane: credential.plane,
      role: credential.role,
      schoolId: credential.schoolId,
      codeHash: otp.codeHash,
      expiresAt: otp.expiresAt,
      resendAvailableAt: otp.resendAvailableAt,
      lastSentAt: otp.lastSentAt,
      attemptCount: 0,
      maxAttempts: env.AUTH_OTP_MAX_ATTEMPTS,
      resendCount: 0,
      maxResends: env.AUTH_OTP_MAX_RESENDS,
      createdAt: now,
      updatedAt: now,
      consumedAt: null,
      revokedAt: null,
      createdFromIp: requestMeta.ipAddress,
      createdUserAgent: requestMeta.userAgent,
      consumedFromIp: '',
      consumedUserAgent: '',
    });

    return this.emailOtpService.buildChallengeContract(challenge, otp.deliveryResult);
  }

  private async assertCredentialForChallenge(
    credential: StoredAuthCredential | null,
    challenge: StoredAuthOtpChallenge,
  ): Promise<StoredAuthCredential> {
    if (!credential || !credential.isActive) {
      throw new AppError(401, 'OTP_CHALLENGE_INVALID', 'The verification challenge is no longer valid.');
    }

    if (challenge.plane === 'platform' && credential.role === 'employee') {
      await this.assertActivePlatformEmployee(credential.uid);
    }

    if (challenge.plane === 'tenant') {
      if (!credential.schoolId) {
        throw new AppError(403, 'SCHOOL_SCOPE_MISSING', 'Tenant credential is missing school scope');
      }

      const school = await this.schoolRepository.findById(credential.schoolId);
      if (!school || !school.isActive) {
        throw new AppError(403, 'SCHOOL_INACTIVE', 'This school workspace is not active');
      }
    }

    return credential;
  }

  private buildOwnerBootstrapStatus(
    state: OwnerBootstrapStatus['state'],
    consumedState?: Pick<StoredOwnerBootstrapState, 'consumedAt' | 'consumedByEmail'> | null,
  ): OwnerBootstrapStatus {
    return {
      state,
      available: state === 'available',
      detail: OWNER_BOOTSTRAP_STATE_MESSAGES[state],
      sessionTtlMinutes: env.OWNER_BOOTSTRAP_SESSION_TTL_MIN,
      passwordPolicy: {
        minLength: OWNER_BOOTSTRAP_PASSWORD_MIN_LENGTH,
        requiresUppercase: true,
        requiresLowercase: true,
        requiresDigit: true,
        requiresSymbol: true,
      },
      ...(consumedState?.consumedAt ? { consumedAt: consumedState.consumedAt } : {}),
      ...(consumedState?.consumedByEmail ? { consumedByEmail: consumedState.consumedByEmail } : {}),
    };
  }

  private getBearerToken(authorizationHeader?: string): string {
    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Missing or invalid Authorization header');
    }

    return authorizationHeader.slice(7);
  }

  private parseOwnerBootstrapSessionToken(token: string): { sessionId: string; secret: string } {
    const trimmed = token.trim();
    const delimiterIndex = trimmed.indexOf('.');
    if (delimiterIndex <= 0 || delimiterIndex >= trimmed.length - 1) {
      throw new AppError(401, 'INVALID_BOOTSTRAP_SESSION', 'Bootstrap session is missing or expired');
    }

    return {
      sessionId: trimmed.slice(0, delimiterIndex),
      secret: trimmed.slice(delimiterIndex + 1),
    };
  }

  private createCredentialId(plane: 'platform' | 'tenant', key: string) {
    return `${plane}:${key.trim().toLowerCase().replace(/[^a-z0-9:@._-]+/g, '-')}`;
  }

  private async getVerifiedChallenge(challengeId: string): Promise<StoredAuthOtpChallenge> {
    const challenge = await this.authRepository.findOtpChallengeById(challengeId.trim());
    if (!challenge) {
      throw new AppError(401, 'OTP_CHALLENGE_INVALID', 'The verification challenge is no longer valid.');
    }

    return challenge;
  }
}
