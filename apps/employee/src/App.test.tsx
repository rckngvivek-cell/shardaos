import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getEnabledSchoolServiceKeysForPlan } from '@school-erp/shared';
import { App } from './App';
import { clearStoredAuthSession } from './lib/authSession';

const fetchMock = vi.fn();
const advancedServiceKeys = getEnabledSchoolServiceKeysForPlan('advanced');
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
const schoolApproval = {
  id: 'approval-school-rps',
  type: 'school_onboarding',
  status: 'pending',
  requestedBy: 'employee-uid-1',
  requestedByEmail: 'ops@shardaos.internal',
  title: 'Onboard Riverdale Public School',
  description: `Patna, Bihar • Advanced service plan • ${advancedServiceKeys.length} services`,
  metadata: {
    schoolId: 'school-rps',
    servicePlanTier: 'advanced',
    enabledServiceKeys: advancedServiceKeys,
  },
  createdAt: '2026-04-21T18:35:00.000Z',
  updatedAt: '2026-04-21T18:35:00.000Z',
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

  it('submits a school onboarding request for owner approval', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(employeeSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolApproval));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'ops@shardaos.internal');
    await user.type(screen.getByLabelText(/^Password$/i), 'EmployeePassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));
    await user.type(await screen.findByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    await user.click(await screen.findByRole('link', { name: /Schools/i }));
    await user.type(screen.getByLabelText(/School name/i), 'Riverdale Public School');
    await user.type(screen.getByLabelText(/School code/i), 'rps');
    await user.type(screen.getByLabelText(/Principal name/i), 'Riya Sharma');
    await user.type(screen.getByLabelText(/School email/i), 'office@riverdale.example');
    await user.type(screen.getByLabelText(/School phone/i), '+91-9000000001');
    await user.clear(screen.getByLabelText(/Country/i));
    await user.type(screen.getByLabelText(/Country/i), 'India');
    await user.type(screen.getByLabelText(/City/i), 'Patna');
    await user.type(screen.getByLabelText(/State/i), 'Bihar');
    await user.type(screen.getByLabelText(/Address/i), '14 River Road');
    await user.click(screen.getByRole('button', { name: /Advanced plan/i }));
    await user.click(screen.getByRole('button', { name: /Submit for owner approval/i }));

    expect(await screen.findByText(/Request sent to owner approvals as Onboard Riverdale Public School/i)).toBeInTheDocument();

    const [, requestInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(fetchMock.mock.calls[2][0]).toBe('/api/owner/school-onboarding');
    expect(requestInit.method).toBe('POST');
    expect((requestInit.headers as Headers).get('Authorization')).toBe('Bearer employee-access-token');
    expect(JSON.parse(requestInit.body as string)).toEqual(
      expect.objectContaining({
        servicePlanTier: 'advanced',
        school: expect.objectContaining({
          name: 'Riverdale Public School',
          code: 'RPS',
          email: 'office@riverdale.example',
        }),
        enabledServiceKeys: expect.arrayContaining(['transport', 'fee_collection']),
      }),
    );
  });
});
