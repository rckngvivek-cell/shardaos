import type { AuthPlane, AuthSessionUser, UserRole } from '@school-erp/shared';

export interface StoredAuthCredential {
  id: string;
  uid: string;
  email: string;
  emailNormalized: string;
  displayName: string;
  plane: AuthPlane;
  role: UserRole;
  schoolId: string;
  passwordHash: string;
  isActive: boolean;
  passwordUpdatedAt: string;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAuthSession {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  plane: AuthPlane;
  role: UserRole;
  schoolId: string;
  refreshTokenHash: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string;
  revokedAt: string | null;
}

export interface StoredAuthOtpChallenge {
  id: string;
  uid: string;
  email: string;
  emailNormalized: string;
  displayName: string;
  plane: AuthPlane;
  role: UserRole;
  schoolId: string;
  codeHash: string;
  expiresAt: string;
  resendAvailableAt: string;
  lastSentAt: string;
  attemptCount: number;
  maxAttempts: number;
  resendCount: number;
  maxResends: number;
  createdAt: string;
  updatedAt: string;
  consumedAt: string | null;
  revokedAt: string | null;
  createdFromIp: string;
  createdUserAgent: string;
  consumedFromIp: string;
  consumedUserAgent: string;
}

export interface StoredOwnerBootstrapState {
  id: string;
  createdAt: string;
  updatedAt: string;
  consumedAt: string | null;
  consumedByEmail: string;
  consumedByUid: string;
  consumedFromIp: string;
  consumedUserAgent: string;
}

export interface StoredOwnerBootstrapSession {
  id: string;
  tokenHash: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  createdFromIp: string;
  createdUserAgent: string;
}

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
  plane: AuthPlane;
  schoolId?: string;
  displayName?: string;
  sid: string;
  typ: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export function toSessionUser(credential: StoredAuthCredential): AuthSessionUser {
  return {
    uid: credential.uid,
    email: credential.email,
    role: credential.role,
    plane: credential.plane,
    schoolId: credential.schoolId,
    displayName: credential.displayName,
  };
}
