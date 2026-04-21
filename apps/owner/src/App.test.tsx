import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { App } from './App';
import { clearStoredAuthSession } from './lib/authSession';

const fetchMock = vi.fn();
const ownerOtpChallenge = {
  challengeId: 'otp-challenge-1',
  plane: 'platform',
  deliveryChannel: 'email',
  maskedEmail: 'ow***@shardaos.internal',
  expiresAt: '2026-04-21T18:40:00.000Z',
  resendAvailableAt: '2026-04-21T18:31:00.000Z',
  otpLength: 6,
  deliveryHint: 'Development email written to .tools/email-outbox/test.json',
};
const jwtOwnerSession = {
  accessToken: 'owner-access-token',
  refreshToken: 'owner-refresh-token',
  user: {
    uid: 'owner-local-bootstrap',
    email: 'owner.local@shardaos.internal',
    role: 'owner',
    plane: 'platform',
    displayName: 'Local Owner',
  },
};

function mockApiResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
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

function queueSuccessfulLogin() {
  fetchMock.mockResolvedValueOnce(mockApiResponse(buildAvailableBootstrapStatus()));
  fetchMock.mockResolvedValueOnce(mockApiResponse(ownerOtpChallenge));
  fetchMock.mockResolvedValueOnce(mockApiResponse(jwtOwnerSession));
}

function buildOwnerDashboardFixture() {
  return {
    generatedAt: '2026-04-19T16:00:00.000Z',
    owner: {
      uid: 'owner-local-bootstrap',
      email: 'owner.local@shardaos.internal',
      role: 'owner',
      plane: 'platform',
    },
    overview: {
      pendingApprovals: 3,
      approvalsResolvedToday: 2,
      activeEmployees: 4,
      inactiveEmployees: 0,
      mfaCoveragePercent: 75,
      staleLogins: 1,
      overallStatus: 'watch',
    },
    alerts: [],
    workforce: {
      totalEmployees: 4,
      activeEmployees: 4,
      inactiveEmployees: 0,
      mfaEnabledEmployees: 3,
      mfaCoveragePercent: 75,
      staleLogins: 1,
      neverLoggedIn: 0,
      departments: [
        { department: 'Operations', total: 2, active: 2, inactive: 0 },
        { department: 'Finance', total: 1, active: 1, inactive: 0 },
        { department: 'Engineering', total: 1, active: 1, inactive: 0 },
      ],
      recentHires: [],
    },
    approvals: {
      pendingCount: 3,
      approvedToday: 2,
      deniedToday: 0,
      queueStatus: 'watch',
      oldestPendingCreatedAt: '2026-04-19T10:00:00.000Z',
      priorityQueue: [
        {
          id: 'approval-1',
          type: 'school_onboarding',
          status: 'pending',
          requestedBy: 'employee-1',
          requestedByEmail: 'ops@shardaos.internal',
          title: 'North Campus onboarding',
          description: 'Approve the new school onboarding request.',
          metadata: { schoolId: 'north-campus' },
          createdAt: '2026-04-19T10:00:00.000Z',
          updatedAt: '2026-04-19T10:00:00.000Z',
        },
      ],
    },
    schoolOperations: {
      totalSchools: 3,
      activeSchools: 2,
      inactiveSchools: 1,
      onboardingRiskCount: 1,
      exceptionCount: 1,
      schools: [
        {
          schoolId: 'north-campus',
          name: 'North Campus',
          code: 'NC01',
          city: 'Patna',
          state: 'Bihar',
          status: 'watch',
          isActive: true,
          studentCount: 1230,
          pendingApprovals: 1,
          lastAttendanceRecordedAt: '2026-04-18T10:00:00.000Z',
          lastGradePublishedAt: '2026-04-01T10:00:00.000Z',
          lastEnrollmentAt: '2026-04-15T10:00:00.000Z',
          attentionReason: 'Attendance has been stale for 2 days.',
        },
        {
          schoolId: 'riverdale',
          name: 'Riverdale Public School',
          code: 'RV11',
          city: 'Patna',
          state: 'Bihar',
          status: 'onboarding',
          isActive: true,
          studentCount: 800,
          pendingApprovals: 1,
          lastAttendanceRecordedAt: null,
          lastGradePublishedAt: null,
          lastEnrollmentAt: '2026-04-16T10:00:00.000Z',
          attentionReason: 'Onboarding approval is still pending final owner action.',
        },
        {
          schoolId: 'legacy',
          name: 'Legacy Academy',
          code: 'LG09',
          city: 'Gaya',
          state: 'Bihar',
          status: 'inactive',
          isActive: false,
          studentCount: 0,
          pendingApprovals: 0,
          lastAttendanceRecordedAt: null,
          lastGradePublishedAt: null,
          lastEnrollmentAt: null,
          attentionReason: 'School is currently inactive and not serving live traffic.',
        },
      ],
      topRisks: [
        {
          schoolId: 'north-campus',
          name: 'North Campus',
          code: 'NC01',
          city: 'Patna',
          state: 'Bihar',
          status: 'watch',
          isActive: true,
          studentCount: 1230,
          pendingApprovals: 1,
          lastAttendanceRecordedAt: '2026-04-18T10:00:00.000Z',
          lastGradePublishedAt: '2026-04-01T10:00:00.000Z',
          lastEnrollmentAt: '2026-04-15T10:00:00.000Z',
          attentionReason: 'Attendance has been stale for 2 days.',
        },
        {
          schoolId: 'riverdale',
          name: 'Riverdale Public School',
          code: 'RV11',
          city: 'Patna',
          state: 'Bihar',
          status: 'onboarding',
          isActive: true,
          studentCount: 800,
          pendingApprovals: 1,
          lastAttendanceRecordedAt: null,
          lastGradePublishedAt: null,
          lastEnrollmentAt: '2026-04-16T10:00:00.000Z',
          attentionReason: 'Onboarding approval is still pending final owner action.',
        },
      ],
    },
    recentActivity: [
      {
        id: 'activity-1',
        tone: 'warning',
        title: 'North Campus onboarding',
        detail: 'Waiting for decision from ops@shardaos.internal',
        occurredAt: '2026-04-19T10:00:00.000Z',
        href: '/owner/approvals',
      },
      {
        id: 'activity-2',
        tone: 'warning',
        title: 'School portfolio requires attention',
        detail: 'North Campus attendance fell behind expected reporting.',
        occurredAt: '2026-04-19T09:00:00.000Z',
        href: '/owner/schools',
      },
    ],
  };
}

function buildSecurityFixture() {
  return {
    generatedAt: '2026-04-19T16:00:00.000Z',
    owner: {
      uid: 'owner-local-bootstrap',
      email: 'owner.local@shardaos.internal',
      role: 'owner',
      plane: 'platform',
    },
    overview: {
      privilegedActions24h: 8,
      riskyEvents24h: 1,
      uniqueActors24h: 1,
      uniqueIpAddresses24h: 1,
      employeesNeedingReview: 2,
      disabledIdentities: 1,
      mfaCoveragePercent: 75,
    },
    findings: [
      {
        id: 'disabled-identities',
        severity: 'critical',
        title: 'Platform identities are disabled',
        detail: '1 employee identity is disabled.',
        href: '/owner/security',
        actionLabel: 'Open review queue',
      },
    ],
    actionCounts: [],
    accessReviewQueue: [
      {
        employeeId: 'emp-1',
        uid: 'uid-1',
        displayName: 'Aarav Singh',
        email: 'aarav@shardaos.internal',
        department: 'Operations',
        reasons: ['MFA is not enabled'],
        isActive: true,
        emailVerified: true,
        mfaEnabled: false,
        authProviderDisabled: false,
        platformAccessActive: true,
        lastLoginAt: '2026-04-18T10:00:00.000Z',
        lastSyncedAt: '2026-04-18T10:00:00.000Z',
      },
    ],
    priorityEvents: [
      {
        id: 'evt-1',
        action: 'SETTINGS_CHANGED',
        tone: 'warning',
        title: 'Platform settings changed',
        detail: 'owner.local@shardaos.internal changed privileged settings.',
        performedByEmail: 'owner.local@shardaos.internal',
        performedByRole: 'owner',
        timestamp: '2026-04-19T15:00:00.000Z',
        ipAddress: '127.0.0.1',
        userAgent: 'vitest',
      },
    ],
    auditTimeline: [],
  };
}

async function signInThroughUi(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Email$/i), 'owner.local@shardaos.internal');
  await user.type(screen.getByLabelText(/^Password$/i), 'OwnerPassword@123');
  await user.click(screen.getByRole('button', { name: /Send verification code/i }));
  await screen.findByText(/Verification email sent/i);
  await user.type(screen.getByLabelText(/Verification code/i), '123456');
  await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));
}

async function renderProtectedRouteAndSignIn(route: string) {
  const user = userEvent.setup();
  window.history.pushState({}, '', route);
  render(<App />);

  await screen.findByRole('heading', { name: /Use your owner credentials/i });
  await signInThroughUi(user);

  return user;
}

beforeEach(() => {
  window.localStorage.clear();
  clearStoredAuthSession();
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
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

describe('owner app', () => {
  it('renders the owner login route without local session helpers', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(screen.getByText(/Owner control plane/i)).toBeInTheDocument();
    expect(screen.queryByText(/Local owner session entry/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Continue with local owner session/i })).not.toBeInTheDocument();
  });

  it('redirects protected routes back to login when there is no session', async () => {
    window.history.pushState({}, '', '/security');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Use your owner credentials/i })).toBeInTheDocument();
    });
  });

  it('signs in through JWT and keeps login info out of localStorage', async () => {
    queueSuccessfulLogin();
    fetchMock.mockResolvedValueOnce(mockApiResponse(buildSecurityFixture()));

    await renderProtectedRouteAndSignIn('/security');

    expect(await screen.findByText(/Current findings/i)).toBeInTheDocument();
    expect(screen.getByText(/Platform identities are disabled/i)).toBeInTheDocument();
    expect(screen.getByText(/Aarav Singh/i)).toBeInTheDocument();
    expect(window.localStorage.getItem('shardaos-owner-auth-session-v1')).toBeNull();
    expect(window.localStorage.getItem('shardaos-owner-app-session')).toBeNull();
  });

  it('renders the dedicated finance dashboard for the owner app', async () => {
    queueSuccessfulLogin();
    fetchMock.mockResolvedValueOnce(mockApiResponse(buildOwnerDashboardFixture()));

    await renderProtectedRouteAndSignIn('/finance');

    expect(await screen.findByRole('heading', { name: /Finance dashboard for portfolio control, risk, and activation/i })).toBeInTheDocument();
    expect(screen.getByText(/Revenue risk ledger/i)).toBeInTheDocument();
    expect(screen.getByText(/Expansion and unlock pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/Finance operating capacity/i)).toBeInTheDocument();
    expect(screen.getAllByText(/North Campus/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Riverdale Public School/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Healthy commercial coverage/i)).toBeInTheDocument();
    expect(screen.getByText(/Finance owns 25% of the current platform workforce/i)).toBeInTheDocument();
  });

  it('creates an employee from the dedicated owner app', async () => {
    queueSuccessfulLogin();

    fetchMock
      .mockResolvedValueOnce(
        mockApiResponse([
          {
            id: 'emp-1',
            uid: 'uid-1',
            email: 'aarav@shardaos.internal',
            displayName: 'Aarav Singh',
            role: 'employee',
            department: 'Operations',
            isActive: true,
            emailVerified: true,
            mfaEnabled: true,
            authProviderDisabled: false,
            platformAccessActive: true,
            lastLoginAt: '2026-04-18T10:00:00.000Z',
            lastSyncedAt: '2026-04-18T10:00:00.000Z',
            createdAt: '2026-04-17T10:00:00.000Z',
            updatedAt: '2026-04-18T10:00:00.000Z',
            onboardedBy: 'owner-local-bootstrap',
          },
        ]),
      )
      .mockResolvedValueOnce(
        mockApiResponse({
          id: 'emp-2',
          uid: 'uid-2',
          email: 'neha@shardaos.internal',
          displayName: 'Neha Kapoor',
          role: 'employee',
          department: 'Finance',
          isActive: true,
          emailVerified: true,
          mfaEnabled: false,
          authProviderDisabled: false,
          platformAccessActive: true,
          lastLoginAt: '',
          lastSyncedAt: '2026-04-19T16:00:00.000Z',
          createdAt: '2026-04-19T16:00:00.000Z',
          updatedAt: '2026-04-19T16:00:00.000Z',
          onboardedBy: 'owner-local-bootstrap',
        }),
      )
      .mockResolvedValueOnce(
        mockApiResponse([
          {
            id: 'emp-1',
            uid: 'uid-1',
            email: 'aarav@shardaos.internal',
            displayName: 'Aarav Singh',
            role: 'employee',
            department: 'Operations',
            isActive: true,
            emailVerified: true,
            mfaEnabled: true,
            authProviderDisabled: false,
            platformAccessActive: true,
            lastLoginAt: '2026-04-18T10:00:00.000Z',
            lastSyncedAt: '2026-04-18T10:00:00.000Z',
            createdAt: '2026-04-17T10:00:00.000Z',
            updatedAt: '2026-04-18T10:00:00.000Z',
            onboardedBy: 'owner-local-bootstrap',
          },
          {
            id: 'emp-2',
            uid: 'uid-2',
            email: 'neha@shardaos.internal',
            displayName: 'Neha Kapoor',
            role: 'employee',
            department: 'Finance',
            isActive: true,
            emailVerified: true,
            mfaEnabled: false,
            authProviderDisabled: false,
            platformAccessActive: true,
            lastLoginAt: '',
            lastSyncedAt: '2026-04-19T16:00:00.000Z',
            createdAt: '2026-04-19T16:00:00.000Z',
            updatedAt: '2026-04-19T16:00:00.000Z',
            onboardedBy: 'owner-local-bootstrap',
          },
        ]),
      );

    const user = await renderProtectedRouteAndSignIn('/employees');

    expect(await screen.findByText(/Employee access roster/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Add employee/i }));
    await user.type(screen.getByLabelText(/Employee UID/i), 'uid-2');
    await user.type(screen.getByLabelText(/^Email$/i), 'neha@shardaos.internal');
    await user.type(screen.getByLabelText(/Display name/i), 'Neha Kapoor');
    await user.selectOptions(screen.getByLabelText(/Department/i), 'Finance');
    await user.click(screen.getByRole('button', { name: /Create employee/i }));

    await waitFor(() => {
      const createCall = fetchMock.mock.calls.find(
        ([url, init]) => url === '/api/owner/employees' && (init)?.method === 'POST',
      );
      expect(createCall).toBeTruthy();
      expect(JSON.parse(String(createCall?.[1].body))).toEqual({
        uid: 'uid-2',
        email: 'neha@shardaos.internal',
        displayName: 'Neha Kapoor',
        department: 'Finance',
      });
    });

    expect(await screen.findByText(/Neha Kapoor/i)).toBeInTheDocument();
  });

  it('approves a pending request from the dedicated owner app', async () => {
    queueSuccessfulLogin();

    fetchMock
      .mockResolvedValueOnce(
        mockApiResponse([
          {
            id: 'approval-1',
            type: 'school_onboarding',
            status: 'pending',
            requestedBy: 'employee-1',
            requestedByEmail: 'ops@shardaos.internal',
            title: 'North Campus onboarding',
            description: 'Approve the new school onboarding request.',
            metadata: { schoolId: 'north-campus' },
            createdAt: '2026-04-19T10:00:00.000Z',
            updatedAt: '2026-04-19T10:00:00.000Z',
          },
        ]),
      )
      .mockResolvedValueOnce(
        mockApiResponse({
          id: 'approval-1',
          type: 'school_onboarding',
          status: 'approved',
          requestedBy: 'employee-1',
          requestedByEmail: 'ops@shardaos.internal',
          title: 'North Campus onboarding',
          description: 'Approve the new school onboarding request.',
          metadata: { schoolId: 'north-campus' },
          createdAt: '2026-04-19T10:00:00.000Z',
          updatedAt: '2026-04-19T10:05:00.000Z',
        }),
      )
      .mockResolvedValueOnce(mockApiResponse([]));

    const user = await renderProtectedRouteAndSignIn('/approvals');

    const approvalHeading = await screen.findByRole('heading', { name: /North Campus onboarding/i });
    const approvalCard = approvalHeading.closest('article');
    expect(approvalCard).not.toBeNull();
    await user.click(within(approvalCard as HTMLElement).getByRole('button', { name: /Approve North Campus onboarding/i }));

    await waitFor(() => {
      const approveCall = fetchMock.mock.calls.find(
        ([url, init]) => url === '/api/owner/approvals/approval-1/approve' && (init)?.method === 'POST',
      );
      expect(approveCall).toBeTruthy();
    });
  });
});
