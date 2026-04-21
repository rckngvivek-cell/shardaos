import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { clearStoredAuthSession } from './lib/authSession';

const fetchMock = vi.fn();
const otpChallenge = {
  challengeId: 'otp-challenge-1',
  plane: 'platform',
  deliveryChannel: 'email',
  maskedEmail: 'em***@shardaos.internal',
  expiresAt: '2026-04-21T18:40:00.000Z',
  resendAvailableAt: '2026-04-21T18:31:00.000Z',
  otpLength: 6,
  deliveryHint: 'Development email written to .tools/email-outbox/test.json',
};
const employeeSession = {
  accessToken: 'employee-access-token',
  refreshToken: 'employee-refresh-token',
  user: {
    uid: 'employee-uid-1',
    email: 'ops@shardaos.internal',
    role: 'employee',
    plane: 'platform',
    schoolId: '',
    displayName: 'Operations Lead',
  },
};

function mockApiResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

beforeEach(() => {
  clearStoredAuthSession();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  clearStoredAuthSession();
  vi.unstubAllGlobals();
});

describe('employee app', () => {
  it('renders the employee login route with OTP-first sign-in', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(screen.getByText(/Platform employee operations/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send verification code/i })).toBeInTheDocument();
  });

  it('redirects protected routes back to login when there is no session', async () => {
    window.history.pushState({}, '', '/queue');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Enter the operations hub/i })).toBeInTheDocument();
    });
  });

  it('signs into the employee app through email OTP verification', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(employeeSession));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'ops@shardaos.internal');
    await user.type(screen.getByLabelText(/^Password$/i), 'EmployeePassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));

    expect(await screen.findByText(/Verification email sent/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    expect(await screen.findByText(/Run the internal platform workforce from a separate employee app/i)).toBeInTheDocument();
    expect(screen.getByText(/Operations Lead/i)).toBeInTheDocument();
  });
});
