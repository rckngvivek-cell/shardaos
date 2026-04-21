import type { ApiResponse } from '@school-erp/shared';
import { loadStoredAuthSession, refreshPlatformSession } from './authSession';
import { handleLocalOwnerRequest, shouldUseLocalOwnerFallback } from './devApi';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  bearerToken?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
  expectEmpty?: boolean;
}

function buildRequestUrl(path: string, params?: Record<string, string | undefined>) {
  if (!params) {
    return path;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string' && value.length > 0) {
      searchParams.set(key, value);
    }
  }

  const queryString = searchParams.toString();
  if (!queryString) {
    return path;
  }

  return `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
}

function getApiErrorMessage(status: number, payload: ApiResponse<unknown> | null) {
  return payload?.error?.message || `Request failed with status ${status}`;
}

async function requestApi<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const url = buildRequestUrl(path, options.params);
  let response: Response;
  let activeToken = options.bearerToken;

  async function executeRequest(token = activeToken) {
    const headers = new Headers();

    if (options.body !== undefined) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  }

  try {
    response = await executeRequest();
  } catch (error) {
    if (shouldUseLocalOwnerFallback(path)) {
      return handleLocalOwnerRequest<T>(path, options);
    }

    throw error;
  }

  const rawBody = await response.text();
  let payload: ApiResponse<T> | null = null;

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody) as ApiResponse<T>;
    } catch {
      payload = null;
    }
  }

  if (response.status === 401) {
    const storedSession = loadStoredAuthSession();
    if (storedSession?.refreshToken) {
      try {
        const refreshedSession = await refreshPlatformSession({ refreshToken: storedSession.refreshToken });
        activeToken = refreshedSession.accessToken;
        response = await executeRequest(activeToken);
      } catch {
        // Continue to standard error handling below.
      }
    }
  }

  if (!response.ok) {
    if (shouldUseLocalOwnerFallback(path, response.status)) {
      return handleLocalOwnerRequest<T>(path, options);
    }

    throw new Error(getApiErrorMessage(response.status, payload));
  }

  if (options.expectEmpty || !rawBody) {
    return undefined as T;
  }

  if (!payload?.success || payload.data === undefined) {
    if (shouldUseLocalOwnerFallback(path, response.status)) {
      return handleLocalOwnerRequest<T>(path, options);
    }

    throw new Error(getApiErrorMessage(response.status, payload));
  }

  return payload.data;
}

export function getApiData<T>(
  path: string,
  bearerToken?: string,
  params?: Record<string, string | undefined>,
): Promise<T> {
  return requestApi<T>(path, { bearerToken, params });
}

export function sendApiData<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  bearerToken?: string,
  body?: unknown,
  params?: Record<string, string | undefined>,
): Promise<T> {
  return requestApi<T>(path, { method, bearerToken, body, params });
}

export function sendApiVoid(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  bearerToken?: string,
  body?: unknown,
  params?: Record<string, string | undefined>,
): Promise<void> {
  return requestApi<void>(path, { method, bearerToken, body, params, expectEmpty: true });
}
