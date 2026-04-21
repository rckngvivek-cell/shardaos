import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { clearStoredAuthSession, loadStoredAuthSession } from './lib/authSession';

describe('owner app authenticated mode', () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearStoredAuthSession();
    window.history.pushState({}, '', '/login');

    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:3000')));
  });

  afterEach(() => {
    cleanup();
    clearStoredAuthSession();
    vi.unstubAllGlobals();
  });

  it('shows an auth error and does not persist login info when the API is unreachable', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText(/Email/i), 'owner.local@shardaos.internal');
    await user.type(screen.getByLabelText(/Password/i), 'any-password');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));

    expect(await screen.findByText(/could not reach the auth service/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(loadStoredAuthSession()).toBeNull();
      expect(window.localStorage.getItem('shardaos-owner-auth-session-v1')).toBeNull();
      expect(window.localStorage.getItem('shardaos-owner-app-session')).toBeNull();
    });
  });
});
