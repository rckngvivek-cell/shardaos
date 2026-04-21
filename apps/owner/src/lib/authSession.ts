import type {
  ApiResponse,
  AuthSession,
  AuthSessionUser,
  LoginOtpChallenge,
  OwnerBootstrapSessionGrant,
  OwnerBootstrapStatus,
  PlatformLoginInput,
  RefreshSessionInput,
  ResendLoginOtpInput,
  VerifyLoginOtpInput,
} from '@school-erp/shared';

const AUTH_SESSION_STORAGE_KEY = 'shardaos-owner-auth-session-v1';
let activeAuthSession: AuthSession | null = null;

export interface OwnerBootstrapInput {
  bootstrapSessionToken: string;
  email: string;
  password: string;
  displayName?: string;
}

class AuthHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthHttpError';
  }
}

function clearLegacyAuthSessionStorage() {
  try {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures in non-browser or restricted contexts.
  }
}

function isValidAuthSession(session: AuthSession | null): session is AuthSession {
  return Boolean(
    session
      && typeof session.accessToken === 'string'
      && typeof session.refreshToken === 'string'
      && typeof session.user?.uid === 'string'
      && session.user?.plane === 'platform',
  );
}

export function loadStoredAuthSession(): AuthSession | null {
  clearLegacyAuthSessionStorage();

  if (!isValidAuthSession(activeAuthSession)) {
    activeAuthSession = null;
    return null;
  }

  return activeAuthSession;
}

export function saveStoredAuthSession(session: AuthSession) {
  activeAuthSession = session;
  clearLegacyAuthSessionStorage();
}

export function clearStoredAuthSession() {
  activeAuthSession = null;
  clearLegacyAuthSessionStorage();
}

async function parseApiPayload<T>(response: Response): Promise<ApiResponse<T> | null> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ApiResponse<T>;
  } catch {
    return null;
  }
}

async function requestAuth<T>(path: string, init: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const payload = await parseApiPayload<T>(response);

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const message = payload?.error?.message ?? `Request failed with status ${response.status}`;
    const code = payload?.error?.code;
    throw new AuthHttpError(message, response.status, code);
  }

  return payload.data;
}

export async function bootstrapOwnerCredential(input: OwnerBootstrapInput): Promise<AuthSessionUser> {
  const owner = await requestAuth<AuthSessionUser>('/api/auth/owner/bootstrap', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      bootstrapSessionToken: input.bootstrapSessionToken,
      email: input.email,
      password: input.password,
      ...(input.displayName ? { displayName: input.displayName } : {}),
    }),
  });

  if (owner.role !== 'owner' || owner.plane !== 'platform') {
    throw new AuthHttpError('Bootstrap returned an unexpected owner contract', 500, 'INVALID_OWNER_BOOTSTRAP_RESPONSE');
  }

  return owner;
}

export async function getOwnerBootstrapStatus(): Promise<OwnerBootstrapStatus> {
  return requestAuth<OwnerBootstrapStatus>('/api/auth/owner/bootstrap', {
    method: 'GET',
  });
}

export async function createOwnerBootstrapSession(bootstrapKey: string): Promise<OwnerBootstrapSessionGrant> {
  return requestAuth<OwnerBootstrapSessionGrant>('/api/auth/owner/bootstrap/session', {
    method: 'POST',
    headers: {
      'x-owner-bootstrap-key': bootstrapKey,
    },
  });
}

export async function requestPlatformLoginChallenge(input: PlatformLoginInput): Promise<LoginOtpChallenge> {
  return requestAuth<LoginOtpChallenge>('/api/auth/platform/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function verifyPlatformLoginOtp(input: VerifyLoginOtpInput): Promise<AuthSession> {
  const session = await requestAuth<AuthSession>('/api/auth/login/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  saveStoredAuthSession(session);
  return session;
}

export async function resendPlatformLoginOtp(input: ResendLoginOtpInput): Promise<LoginOtpChallenge> {
  return requestAuth<LoginOtpChallenge>('/api/auth/login/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function refreshPlatformSession(input: RefreshSessionInput): Promise<AuthSession> {
  const session = await requestAuth<AuthSession>('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  saveStoredAuthSession(session);
  return session;
}

export async function restorePlatformSession(): Promise<AuthSession | null> {
  const storedSession = loadStoredAuthSession();
  if (!storedSession) {
    return null;
  }

  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${storedSession.accessToken}`,
      },
    });

    if (response.ok) {
      return storedSession;
    }

    if (response.status !== 401) {
      throw new AuthHttpError('Unable to restore owner session', response.status);
    }
  } catch (error) {
    if (!(error instanceof AuthHttpError)) {
      throw error;
    }
  }

  try {
    return await refreshPlatformSession({ refreshToken: storedSession.refreshToken });
  } catch {
    clearStoredAuthSession();
    return null;
  }
}

export async function logoutPlatformSession(): Promise<void> {
  const storedSession = loadStoredAuthSession();
  if (!storedSession) {
    clearStoredAuthSession();
    return;
  }

  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: storedSession.refreshToken }),
    });
  } finally {
    clearStoredAuthSession();
  }
}

export { AuthHttpError };
