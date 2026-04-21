import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { clearStoredAuthSession } from './lib/authSession';

const fetchMock = vi.fn();
const otpChallenge = {
  challengeId: 'otp-challenge-1',
  plane: 'tenant',
  deliveryChannel: 'email',
  maskedEmail: 'pr***@dev.school',
  expiresAt: '2026-04-21T18:40:00.000Z',
  resendAvailableAt: '2026-04-21T18:31:00.000Z',
  otpLength: 6,
  deliveryHint: 'Development email written to .tools/email-outbox/test.json',
};
const schoolSession = {
  accessToken: 'school-access-token',
  refreshToken: 'school-refresh-token',
  user: {
    uid: 'tenant-principal-001',
    email: 'principal@dev.school',
    role: 'principal',
    plane: 'tenant',
    schoolId: 'school-north',
    displayName: 'Dev Principal',
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

describe('school app', () => {
  it('renders the school login route with OTP-first sign-in', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(screen.getByText(/School workspace access/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send verification code/i })).toBeInTheDocument();
  });

  it('redirects protected routes back to login when there is no session', async () => {
    window.history.pushState({}, '', '/students');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Enter your school workspace/i })).toBeInTheDocument();
    });
  });

  it('signs into the school app through email OTP verification', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolSession));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'principal@dev.school');
    await user.type(screen.getByLabelText(/^Password$/i), 'SchoolPassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));

    expect(await screen.findByText(/Verification email sent/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    expect(await screen.findByText(/Run school operations from a dedicated tenant app/i)).toBeInTheDocument();
    expect(screen.getByText(/Dev Principal/i)).toBeInTheDocument();
  });
});
