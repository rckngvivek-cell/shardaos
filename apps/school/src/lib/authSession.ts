import type {
  ApiResponse,
  AuthSession,
  LoginOtpChallenge,
  RefreshSessionInput,
  ResendLoginOtpInput,
  TenantLoginInput,
  VerifyLoginOtpInput,
} from '@school-erp/shared';

let activeAuthSession: AuthSession | null = null;

export class AuthHttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'AuthHttpError';
  }
}

function isValidAuthSession(session: AuthSession | null): session is AuthSession {
  return Boolean(
    session
      && typeof session.accessToken === 'string'
      && typeof session.refreshToken === 'string'
      && typeof session.user?.uid === 'string'
      && session.user?.plane === 'tenant',
  );
}

export function loadStoredAuthSession(): AuthSession | null {
  if (!isValidAuthSession(activeAuthSession)) {
    activeAuthSession = null;
    return null;
  }

  return activeAuthSession;
}

export function saveStoredAuthSession(session: AuthSession) {
  activeAuthSession = session;
}

export function clearStoredAuthSession() {
  activeAuthSession = null;
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
    throw new AuthHttpError(message, response.status, payload?.error?.code);
  }

  return payload.data;
}

export async function requestTenantApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const storedSession = loadStoredAuthSession();
  if (!storedSession) {
    throw new AuthHttpError('School session is required', 401, 'SESSION_REQUIRED');
  }

  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${storedSession.accessToken}`);

  const response = await fetch(path, {
    ...init,
    headers,
  });
  const payload = await parseApiPayload<T>(response);

  if (!response.ok || !payload?.success || payload.data === undefined) {
    const message = payload?.error?.message ?? `Request failed with status ${response.status}`;
    throw new AuthHttpError(message, response.status, payload?.error?.code);
  }

  return payload.data;
}

export function requestTenantLoginChallenge(input: TenantLoginInput): Promise<LoginOtpChallenge> {
  return requestAuth<LoginOtpChallenge>('/api/auth/tenant/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function verifyTenantLoginOtp(input: VerifyLoginOtpInput): Promise<AuthSession> {
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

export function resendTenantLoginOtp(input: ResendLoginOtpInput): Promise<LoginOtpChallenge> {
  return requestAuth<LoginOtpChallenge>('/api/auth/login/resend', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export async function refreshTenantSession(input: RefreshSessionInput): Promise<AuthSession> {
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

export async function restoreTenantSession(): Promise<AuthSession | null> {
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
      throw new AuthHttpError('Unable to restore school session', response.status);
    }
  } catch (error) {
    if (!(error instanceof AuthHttpError)) {
      throw error;
    }
  }

  try {
    return await refreshTenantSession({ refreshToken: storedSession.refreshToken });
  } catch {
    clearStoredAuthSession();
    return null;
  }
}

export async function logoutTenantSession(): Promise<void> {
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
