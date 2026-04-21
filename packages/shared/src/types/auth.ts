import type { PlatformRole, TenantRole, UserRole } from './user.js';

export type AuthPlane = 'platform' | 'tenant';

export interface AuthSessionUser {
  uid: string;
  email: string;
  role: UserRole;
  plane: AuthPlane;
  schoolId: string;
  displayName?: string;
}

export interface JwtSessionTokens {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
}

export interface AuthSession extends JwtSessionTokens {
  user: AuthSessionUser;
}

export interface PlatformLoginInput {
  email: string;
  password: string;
}

export interface TenantLoginInput {
  email: string;
  password: string;
}

export interface LoginOtpChallenge {
  challengeId: string;
  plane: AuthPlane;
  deliveryChannel: 'email';
  maskedEmail: string;
  expiresAt: string;
  resendAvailableAt: string;
  otpLength: number;
  deliveryHint?: string;
}

export interface VerifyLoginOtpInput {
  challengeId: string;
  code: string;
}

export interface ResendLoginOtpInput {
  challengeId: string;
}

export interface RefreshSessionInput {
  refreshToken: string;
}

export interface LogoutSessionInput {
  refreshToken: string;
}

export type OwnerBootstrapState = 'disabled' | 'available' | 'consumed';

export interface OwnerBootstrapPasswordPolicy {
  minLength: number;
  requiresUppercase: boolean;
  requiresLowercase: boolean;
  requiresDigit: boolean;
  requiresSymbol: boolean;
}

export interface OwnerBootstrapStatus {
  state: OwnerBootstrapState;
  available: boolean;
  detail: string;
  sessionTtlMinutes: number;
  passwordPolicy: OwnerBootstrapPasswordPolicy;
  consumedAt?: string;
  consumedByEmail?: string;
}

export interface OwnerBootstrapSessionGrant {
  bootstrapSessionToken: string;
  expiresAt: string;
}

export interface PlatformCredentialRecord {
  id: string;
  uid: string;
  email: string;
  role: PlatformRole;
  plane: 'platform';
  displayName: string;
  isActive: boolean;
  passwordUpdatedAt: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantCredentialRecord {
  id: string;
  uid: string;
  email: string;
  role: TenantRole;
  schoolId: string;
  plane: 'tenant';
  displayName: string;
  isActive: boolean;
  passwordUpdatedAt: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthCredentialRecord = PlatformCredentialRecord | TenantCredentialRecord;
