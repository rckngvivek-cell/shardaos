import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { clearStoredAuthSession } from './lib/authSession';

const fetchMock = vi.fn();

function mockApiResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

function mockApiError(status: number, code: string, message: string) {
  return {
    ok: false,
    status,
    text: async () => JSON.stringify({ success: false, error: { code, message } }),
  };
}

function buildAvailableBootstrapStatus() {
  return {
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
  };
}

function buildConsumedBootstrapStatus() {
  return {
    state: 'consumed',
    available: false,
    detail: 'Owner bootstrap has already been consumed and is permanently disabled.',
    sessionTtlMinutes: 10,
    passwordPolicy: {
      minLength: 14,
      requiresUppercase: true,
      requiresLowercase: true,
      requiresDigit: true,
      requiresSymbol: true,
    },
    consumedAt: '2026-04-21T00:00:00.000Z',
    consumedByEmail: 'owner@example.com',
  };
}

describe('owner bootstrap UI', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearStoredAuthSession();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockImplementation((url, init) => {
      if (url === '/api/auth/owner/bootstrap' && (!(init as RequestInit | undefined)?.method || (init as RequestInit | undefined)?.method === 'GET')) {
        return Promise.resolve(mockApiResponse(buildAvailableBootstrapStatus()));
      }

      return Promise.reject(new Error(`Unhandled fetch: ${String(url)}`));
    });
  });

  afterEach(() => {
    cleanup();
    clearStoredAuthSession();
    vi.unstubAllGlobals();
  });

  it('links to the bootstrap flow from the owner login page', async () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    const link = await screen.findByRole('link', { name: /Open owner bootstrap/i });
    expect(link).toHaveAttribute('href', '/bootstrap');
  });

  it('bootstraps real owner credentials through the UI', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(
      mockApiResponse(buildAvailableBootstrapStatus()),
    );
    fetchMock.mockResolvedValueOnce(
      mockApiResponse({
        bootstrapSessionToken: 'bootstrap-session-id.bootstrap-secret-token',
        expiresAt: '2026-04-21T01:00:00.000Z',
      }),
    );
    fetchMock.mockResolvedValueOnce(
      mockApiResponse({
        uid: 'owner-uid-1',
        email: 'owner@example.com',
        role: 'owner',
        plane: 'platform',
        schoolId: '',
        displayName: 'Platform Owner',
      }),
    );

    window.history.pushState({}, '', '/bootstrap');
    render(<App />);

    const formReady = await screen.findByLabelText(/Bootstrap key/i);
    expect(formReady).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Bootstrap key/i), 'bootstrap-secret');
    await user.type(screen.getByLabelText(/Owner email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/Display name/i), 'Platform Owner');
    await user.type(screen.getByLabelText(/New owner password/i), 'OwnerPassword@123');
    await user.type(screen.getByLabelText(/Confirm password/i), 'OwnerPassword@123');
    await user.click(screen.getByRole('button', { name: /Bootstrap owner credentials/i }));

    await waitFor(() => {
      const sessionCall = fetchMock.mock.calls.find(
        ([url, init]) => url === '/api/auth/owner/bootstrap/session' && (init as RequestInit | undefined)?.method === 'POST',
      );
      expect(sessionCall).toBeTruthy();
      expect((sessionCall?.[1] as RequestInit).headers).toMatchObject({
        'x-owner-bootstrap-key': 'bootstrap-secret',
      });

      const bootstrapCall = fetchMock.mock.calls.find(
        ([url, init]) => url === '/api/auth/owner/bootstrap' && (init as RequestInit | undefined)?.method === 'POST',
      );
      expect(bootstrapCall).toBeTruthy();
      expect((bootstrapCall?.[1] as RequestInit).headers).toMatchObject({
        'Content-Type': 'application/json',
      });
      expect(JSON.parse(String((bootstrapCall?.[1] as RequestInit).body))).toEqual({
        bootstrapSessionToken: 'bootstrap-session-id.bootstrap-secret-token',
        email: 'owner@example.com',
        password: 'OwnerPassword@123',
        displayName: 'Platform Owner',
      });
    });

    expect(await screen.findByText(/Owner credentials are ready/i)).toBeInTheDocument();
    expect(screen.getByText(/owner@example.com/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Return to owner sign-in/i })).toBeInTheDocument();
  });

  it('shows a clear error when the bootstrap key is invalid', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValueOnce(mockApiResponse(buildAvailableBootstrapStatus()));
    fetchMock.mockResolvedValueOnce(mockApiError(401, 'UNAUTHORIZED', 'Invalid bootstrap key'));

    window.history.pushState({}, '', '/bootstrap');
    render(<App />);

    await screen.findByLabelText(/Bootstrap key/i);

    await user.type(screen.getByLabelText(/Bootstrap key/i), 'wrong-key');
    await user.type(screen.getByLabelText(/Owner email/i), 'owner@example.com');
    await user.type(screen.getByLabelText(/New owner password/i), 'OwnerPassword@123');
    await user.type(screen.getByLabelText(/Confirm password/i), 'OwnerPassword@123');
    await user.click(screen.getByRole('button', { name: /Bootstrap owner credentials/i }));

    expect(await screen.findByText(/bootstrap key is incorrect/i)).toBeInTheDocument();
  });

  it('hides the login bootstrap link once bootstrap has already been consumed', async () => {
    fetchMock.mockImplementation((url, init) => {
      if (url === '/api/auth/owner/bootstrap' && (!(init as RequestInit | undefined)?.method || (init as RequestInit | undefined)?.method === 'GET')) {
        return Promise.resolve(mockApiResponse(buildConsumedBootstrapStatus()));
      }

      return Promise.reject(new Error(`Unhandled fetch: ${String(url)}`));
    });

    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(await screen.findByText(/Bootstrap was consumed on/i)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Open owner bootstrap/i })).not.toBeInTheDocument();
  });

  it('locks the bootstrap page after the one-time flow has already been consumed', async () => {
    fetchMock.mockImplementation((url, init) => {
      if (url === '/api/auth/owner/bootstrap' && (!(init as RequestInit | undefined)?.method || (init as RequestInit | undefined)?.method === 'GET')) {
        return Promise.resolve(mockApiResponse(buildConsumedBootstrapStatus()));
      }

      return Promise.reject(new Error(`Unhandled fetch: ${String(url)}`));
    });

    window.history.pushState({}, '', '/bootstrap');
    render(<App />);

    expect(await screen.findByText(/Bootstrap is no longer available/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Bootstrap owner credentials/i })).not.toBeInTheDocument();
    expect(screen.getByText(/owner@example.com/i)).toBeInTheDocument();
  });
});
