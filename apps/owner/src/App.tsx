import {
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  Approval,
  ApprovalStatus,
  AuthSession,
  LoginOtpChallenge,
  CreateEmployeeInput,
  Employee,
  OwnerBootstrapStatus,
  OwnerDashboard,
  OwnerDashboardAlertSeverity,
  OwnerDashboardSchoolItem,
  OwnerSecurityCenter,
  PlatformAuthUser,
  UpdateEmployeeInput,
} from '@school-erp/shared';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { getApiData, sendApiData, sendApiVoid } from './lib/api';
import {
  AuthHttpError,
  bootstrapOwnerCredential,
  createOwnerBootstrapSession,
  getOwnerBootstrapStatus,
  loadStoredAuthSession,
  logoutPlatformSession,
  requestPlatformLoginChallenge,
  resendPlatformLoginOtp,
  restorePlatformSession,
  verifyPlatformLoginOtp,
} from './lib/authSession';

const ownerNavigation = [
  { label: 'Command center', path: '/' },
  { label: 'Finance', path: '/finance' },
  { label: 'Schools', path: '/schools' },
  { label: 'Employees', path: '/employees' },
  { label: 'Approvals', path: '/approvals' },
  { label: 'Security', path: '/security' },
];

const DEPARTMENTS = ['Engineering', 'Operations', 'Support', 'Finance', 'HR'];
const EMPTY_CREATE_FORM: CreateEmployeeInput = { uid: '', email: '', displayName: '', department: '' };
const EMPTY_EDIT_FORM: UpdateEmployeeInput = { displayName: '', department: '' };
const EMPLOYEE_FILTERS = ['all', 'active', 'inactive', 'review'] as const;
const APPROVAL_FILTERS = ['pending', 'approved', 'denied', 'all'] as const;
const DEV_OWNER_DISPLAY_NAME = import.meta.env.VITE_DEV_OWNER_DISPLAY_NAME ?? 'Local Owner';
const LEGACY_OWNER_SESSION_STORAGE_KEY = 'shardaos-owner-app-session';

type EmployeeFilter = (typeof EMPLOYEE_FILTERS)[number];
type ApprovalFilter = (typeof APPROVAL_FILTERS)[number];

type OwnerSession = PlatformAuthUser & {
  displayName: string;
  mode: 'jwt';
};

type ResourceState<T> =
  | { status: 'loading'; data: null; error: string }
  | { status: 'ready'; data: T; error: string }
  | { status: 'error'; data: null; error: string };

interface OwnerAuthContextValue {
  status: 'loading' | 'ready';
  session: OwnerSession | null;
  completeSignIn: (session: AuthSession) => void;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | undefined>;
  refreshData: () => void;
  dataVersion: number;
}

const OwnerAuthContext = createContext<OwnerAuthContextValue | null>(null);

type BootstrapAvailabilityState =
  | { status: 'loading'; data: null; error: string }
  | { status: 'ready'; data: OwnerBootstrapStatus; error: string }
  | { status: 'error'; data: null; error: string };

function clearLegacyOwnerSessionStorage() {
  try {
    window.localStorage.removeItem(LEGACY_OWNER_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage cleanup failures in restricted browser contexts.
  }
}

function isAuthServiceUnavailable(normalized: string) {
  return (
    normalized.includes('network') ||
    normalized.includes('econnrefused') ||
    normalized.includes('failed to fetch') ||
    normalized.includes('fetch failed')
  );
}

function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('owner_only') || normalized.includes('owner account required')) {
    return 'This login is restricted to the ShardaOS owner plane.';
  }

  if (
    normalized.includes('invalid-login-credentials') ||
    normalized.includes('invalid credential') ||
    normalized.includes('invalid email') ||
    normalized.includes('invalid password') ||
    normalized.includes('invalid_credentials')
  ) {
    return 'The owner email or password is incorrect.';
  }

  if (isAuthServiceUnavailable(normalized)) {
    return 'The owner app could not reach the auth service. Check the local API.';
  }

  return message || 'Unable to sign in to the owner app.';
}

function getOtpErrorMessage(error: unknown): string {
  if (error instanceof AuthHttpError) {
    if (error.code === 'INVALID_OTP') {
      return 'The verification code is incorrect.';
    }

    if (error.code === 'OTP_EXPIRED') {
      return 'The verification code expired. Request a new code.';
    }

    if (error.code === 'OTP_ATTEMPTS_EXCEEDED') {
      return 'Too many incorrect codes were entered. Start the sign-in flow again.';
    }

    if (error.code === 'OTP_RESEND_NOT_READY') {
      return 'Please wait a moment before requesting another verification code.';
    }

    if (error.code === 'OTP_RESEND_LIMIT_REACHED') {
      return 'This sign-in attempt has reached the resend limit. Start again from the login form.';
    }

    if (error.code === 'OTP_CHALLENGE_INVALID') {
      return 'This verification step is no longer valid. Start the sign-in flow again.';
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (isAuthServiceUnavailable(normalized)) {
    return 'The owner app could not reach the OTP verification service. Check the local API.';
  }

  return message || 'Unable to verify the email OTP.';
}

function getBootstrapErrorMessage(error: unknown): string {
  if (error instanceof AuthHttpError) {
    if (error.code === 'UNAUTHORIZED') {
      return 'The bootstrap key is incorrect.';
    }

    if (error.code === 'BOOTSTRAP_DISABLED') {
      return 'Owner bootstrap is disabled on the API. Configure OWNER_BOOTSTRAP_KEY, OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET, or OWNER_BOOTSTRAP_KEY_FILE first.';
    }

    if (error.code === 'BOOTSTRAP_CONSUMED') {
      return 'Bootstrap has already been consumed. This owner app will not allow another bootstrap.';
    }

    if (error.code === 'INVALID_BOOTSTRAP_SESSION') {
      return 'The secure bootstrap session expired. Start the bootstrap flow again with the offline key.';
    }

    if (error.code === 'WEAK_OWNER_PASSWORD') {
      return error.message;
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (isAuthServiceUnavailable(normalized)) {
    return 'The owner app could not reach the bootstrap service. Check the local API.';
  }

  return message || 'Unable to bootstrap owner credentials.';
}

function getBootstrapStatusErrorMessage(error: unknown): string {
  if (error instanceof AuthHttpError && error.status === 404) {
    return 'The owner API is running without the new bootstrap routes. Restart the API process and reload this page.';
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (isAuthServiceUnavailable(normalized)) {
    return 'Bootstrap availability could not be verified because the local API is unreachable.';
  }

  return message || 'Bootstrap availability could not be verified.';
}

function getOperationErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function getSeverityClasses(severity: OwnerDashboardAlertSeverity) {
  switch (severity) {
    case 'critical':
      return 'border-rose-400/40 bg-rose-500/15 text-rose-200';
    case 'warning':
      return 'border-amber-400/40 bg-amber-500/15 text-amber-200';
    case 'info':
    default:
      return 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200';
  }
}

function getOwnerAppHref(href: string) {
  if (href.startsWith('/owner/finance')) {
    return '/finance';
  }

  if (href.startsWith('/owner/employees')) {
    return '/employees';
  }

  if (href.startsWith('/owner/approvals')) {
    return '/approvals';
  }

  if (href.startsWith('/owner/security')) {
    return '/security';
  }

  if (href.startsWith('/owner/schools')) {
    return '/schools';
  }

  return '/';
}

function getReviewReasons(employee: Employee): string[] {
  const reasons: string[] = [];

  if (!employee.isActive) {
    reasons.push('record is inactive');
  }

  if (!employee.platformAccessActive) {
    reasons.push('platform access is disabled');
  }

  if (employee.authProviderDisabled) {
    reasons.push('identity access is disabled');
  }

  if (!employee.emailVerified) {
    reasons.push('email is not verified');
  }

  if (!employee.mfaEnabled) {
    reasons.push('MFA is not enabled');
  }

  if (!employee.lastLoginAt) {
    reasons.push('employee has never logged in');
  }

  return reasons;
}

function requiresOwnerReview(employee: Employee) {
  return getReviewReasons(employee).length > 0;
}

function formatTimestamp(value?: string | null): string {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatRelativeTime(value?: string | null): string {
  if (!value) {
    return 'No activity yet';
  }

  const deltaMs = new Date(value).getTime() - Date.now();
  const deltaHours = Math.round(deltaMs / (60 * 60 * 1000));
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, 'hour');
  }

  return formatter.format(Math.round(deltaHours / 24), 'day');
}

function formatLastLogin(value: string): string {
  if (!value) {
    return 'No login recorded';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatSyncTime(value: string): string {
  if (!value) {
    return 'Never synced';
  }

  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

function buildJwtOwnerSession(session: AuthSession): OwnerSession {
  if (session.user.role !== 'owner' || session.user.plane !== 'platform') {
    throw new Error('OWNER_ONLY');
  }

  return {
    uid: session.user.uid,
    email: session.user.email,
    role: 'owner',
    plane: 'platform',
    displayName: session.user.displayName ?? DEV_OWNER_DISPLAY_NAME,
    mode: 'jwt',
  };
}

function OwnerAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [session, setSession] = useState<OwnerSession | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  useEffect(() => {
    let active = true;
    clearLegacyOwnerSessionStorage();

    void (async () => {
      try {
        const restoredSession = await restorePlatformSession();
        if (!active) {
          return;
        }

        startTransition(() => {
          setSession(restoredSession ? buildJwtOwnerSession(restoredSession) : null);
          setStatus('ready');
        });
      } catch {
        if (!active) {
          return;
        }

        startTransition(() => {
          setSession(null);
          setStatus('ready');
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  function completeSignIn(authSession: AuthSession) {
    const ownerSession = buildJwtOwnerSession(authSession);
    startTransition(() => {
      setSession(ownerSession);
      setStatus('ready');
    });
  }

  async function signOut() {
    clearLegacyOwnerSessionStorage();
    await logoutPlatformSession();

    startTransition(() => {
      setSession(null);
      setStatus('ready');
    });
  }

  async function getAccessToken(): Promise<string | undefined> {
    return loadStoredAuthSession()?.accessToken;
  }

  function refreshData() {
    setDataVersion((current) => current + 1);
  }

  return (
    <OwnerAuthContext.Provider
      value={{ status, session, completeSignIn, signOut, getAccessToken, refreshData, dataVersion }}
    >
      {children}
    </OwnerAuthContext.Provider>
  );
}

function useOwnerAuth() {
  const context = useContext(OwnerAuthContext);
  if (!context) {
    throw new Error('Owner auth context is not available');
  }
  return context;
}

function useOwnerBootstrapAvailability() {
  const [state, setState] = useState<BootstrapAvailabilityState>({
    status: 'loading',
    data: null,
    error: '',
  });

  useEffect(() => {
    let ignore = false;

    void (async () => {
      try {
        const status = await getOwnerBootstrapStatus();
        if (ignore) {
          return;
        }

        startTransition(() => {
          setState({ status: 'ready', data: status, error: '' });
        });
      } catch (error) {
        if (ignore) {
          return;
        }

        startTransition(() => {
          setState({
            status: 'error',
            data: null,
            error: getBootstrapStatusErrorMessage(error),
          });
        });
      }
    })();

    return () => {
      ignore = true;
    };
  }, []);

  return state;
}

function useOwnerResource<T>(path: string): ResourceState<T> {
  const { session, status, dataVersion } = useOwnerAuth();
  const [state, setState] = useState<ResourceState<T>>({
    status: 'loading',
    data: null,
    error: '',
  });

  useEffect(() => {
    if (status !== 'ready' || !session) {
      return;
    }

    let ignore = false;

    void (async () => {
      startTransition(() => {
        setState({ status: 'loading', data: null, error: '' });
      });

      try {
        const token = loadStoredAuthSession()?.accessToken;
        const data = await getApiData<T>(path, token);
        if (ignore) {
          return;
        }

        startTransition(() => {
          setState({ status: 'ready', data, error: '' });
        });
      } catch (error) {
        if (ignore) {
          return;
        }

        setState({
          status: 'error',
          data: null,
          error: error instanceof Error ? error.message : 'Unable to load owner data.',
        });
      }
    })();

    return () => {
      ignore = true;
    };
  }, [dataVersion, path, session, status]);

  return state;
}

function LoadingState({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-8 text-center">
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-cyan-300">Loading</p>
      <h2 className="mt-4 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
    </section>
  );
}

function ErrorState({ title, detail }: { title: string; detail: string }) {
  return (
    <section className="rounded-[1.75rem] border border-rose-400/30 bg-rose-500/10 p-8">
      <p className="text-xs font-bold uppercase tracking-[0.26em] text-rose-200">Action required</p>
      <h2 className="mt-4 text-2xl font-semibold text-white">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-rose-100">{detail}</p>
    </section>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </article>
  );
}

function SurfaceCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">{eyebrow}</p>
      <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/60 px-5 py-5 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.55)]">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function SecuritySignal({
  label,
  healthy,
  healthyText,
  reviewText,
}: {
  label: string;
  healthy: boolean;
  healthyText: string;
  reviewText: string;
}) {
  return (
    <div className="rounded-2xl bg-white/10 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className={`mt-2 text-sm font-semibold ${healthy ? 'text-emerald-300' : 'text-amber-300'}`}>
        {healthy ? healthyText : reviewText}
      </p>
    </div>
  );
}

function EmployeeStatusBadge({ employee }: { employee: Employee }) {
  const tone = employee.isActive
    ? 'bg-emerald-500/15 text-emerald-200'
    : 'bg-rose-500/15 text-rose-200';

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${tone}`}>
      {employee.isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function OwnerShell() {
  const { session, signOut } = useOwnerAuth();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] px-5 py-6 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-white/10 bg-white/5 px-6 py-5 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-300">ShardaOS owner</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Dedicated owner control plane</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                Founder-only command surface for cross-tenant approvals, workforce controls, and security review.
              </p>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <nav className="flex flex-wrap gap-2">
                {ownerNavigation.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-cyan-400 text-slate-950'
                          : 'border border-white/10 bg-slate-900/60 text-slate-200 hover:border-cyan-300/40 hover:text-white'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <div className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2">
                  <span className="font-semibold text-white">{session?.displayName ?? 'Owner'}</span>
                  <span className="ml-2 text-slate-400">{session?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void signOut();
                  }}
                  className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:text-white"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="mt-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function OwnerLoginPage() {
  const { session, status, completeSignIn } = useOwnerAuth();
  const bootstrapStatus = useOwnerBootstrapAvailability();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const redirectPath = requestedPath && requestedPath !== '/login' ? requestedPath : '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<LoginOtpChallenge | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  if (status === 'ready' && session) {
    return <Navigate to={redirectPath} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const challenge = await requestPlatformLoginChallenge({
        email: email.trim().toLowerCase(),
        password,
      });
      setOtpChallenge(challenge);
      setOtpCode('');
      setPassword('');
    } catch (submissionError) {
      setError(getAuthErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!otpChallenge) {
      return;
    }

    setError('');
    setVerifyingOtp(true);

    try {
      const authSession = await verifyPlatformLoginOtp({
        challengeId: otpChallenge.challengeId,
        code: otpCode,
      });
      completeSignIn(authSession);
      navigate(redirectPath, { replace: true });
    } catch (verificationError) {
      setError(getOtpErrorMessage(verificationError));
    } finally {
      setVerifyingOtp(false);
    }
  }

  async function handleResendOtp() {
    if (!otpChallenge) {
      return;
    }

    setError('');
    setResendingOtp(true);

    try {
      const refreshedChallenge = await resendPlatformLoginOtp({
        challengeId: otpChallenge.challengeId,
      });
      setOtpChallenge(refreshedChallenge);
      setOtpCode('');
    } catch (resendError) {
      setError(getOtpErrorMessage(resendError));
    } finally {
      setResendingOtp(false);
    }
  }

  function resetOtpFlow() {
    setOtpChallenge(null);
    setOtpCode('');
    setError('');
  }


  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] px-5 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Owner control plane</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Enter the internal plane</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            This app uses the live owner auth and owner-plane APIs. Sign in with the real owner identity once the one-time bootstrap has been completed.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SurfaceCard title="Cross-tenant control" eyebrow="Founder only">
              <p className="text-sm leading-6 text-slate-300">
                Keep school onboarding, platform staffing, and approvals outside the public school workspace.
              </p>
            </SurfaceCard>
            <SurfaceCard title="Route-complete owner surface" eyebrow="Dedicated app">
              <p className="text-sm leading-6 text-slate-300">
                Dashboard, schools, employees, approvals, and security are all available in this owner app now.
              </p>
            </SurfaceCard>
          </div>
        </section>
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Owner sign-in</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {otpChallenge ? 'Verify your sign-in email code' : 'Use your owner credentials'}
          </h2>


          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {!otpChallenge ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
              <div>
                <label htmlFor="owner-email" className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input
                  id="owner-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="owner@your-org.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="off"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="owner-password" className="block text-sm font-medium text-slate-200">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <input
                  id="owner-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Owner credential"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="off"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4" autoComplete="off">
              <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-50">
                <p className="font-semibold text-white">Verification email sent</p>
                <p className="mt-2 leading-6">
                  Enter the {otpChallenge.otpLength}-digit code sent to <span className="font-semibold text-white">{otpChallenge.maskedEmail}</span>.
                </p>
                <p className="mt-2 leading-6 text-cyan-100">
                  Code expires at {formatTimestamp(otpChallenge.expiresAt)}.
                </p>
                {otpChallenge.deliveryHint ? (
                  <p className="mt-2 leading-6 text-cyan-100">{otpChallenge.deliveryHint}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="owner-otp" className="mb-2 block text-sm font-medium text-slate-200">Verification code</label>
                <input
                  id="owner-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, otpChallenge.otpLength))}
                  placeholder="Enter the email OTP"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="one-time-code"
                />
              </div>
              <button
                type="submit"
                disabled={verifyingOtp}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifyingOtp ? 'Verifying…' : 'Verify code and continue'}
              </button>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    void handleResendOtp();
                  }}
                  disabled={resendingOtp}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:text-white disabled:opacity-60"
                >
                  {resendingOtp ? 'Sending again…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={resetOtpFlow}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-300/40 hover:text-white"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Bootstrap status</p>
            {bootstrapStatus.status === 'loading' ? (
              <p className="mt-2 text-sm leading-6 text-slate-300">Checking whether first-time owner bootstrap is still available…</p>
            ) : null}
            {bootstrapStatus.status === 'error' ? (
              <p className="mt-2 text-sm leading-6 text-amber-100">{bootstrapStatus.error}</p>
            ) : null}
            {bootstrapStatus.status === 'ready' ? (
              <>
                <p className="mt-2 text-sm leading-6 text-slate-300">{bootstrapStatus.data.detail}</p>
                {bootstrapStatus.data.available ? (
                  <>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      The bootstrap route is single-use only and will remove itself immediately after the first successful owner provisioning.
                    </p>
                    <NavLink
                      to="/bootstrap"
                      className="mt-4 inline-flex rounded-full border border-cyan-300/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-200 hover:text-white"
                    >
                      Open owner bootstrap
                    </NavLink>
                  </>
                ) : (
                  <p className="mt-2 text-sm leading-6 text-emerald-100">
                    {bootstrapStatus.data.consumedAt
                      ? `Bootstrap was consumed on ${formatTimestamp(bootstrapStatus.data.consumedAt)}.`
                      : 'Bootstrap is not available in this environment.'}
                  </p>
                )}
              </>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function BootstrapOwnerPage() {
  const { session, status } = useOwnerAuth();
  const bootstrapAvailability = useOwnerBootstrapAvailability();
  const navigate = useNavigate();
  const [bootstrapKey, setBootstrapKey] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showBootstrapKey, setShowBootstrapKey] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bootstrappedOwner, setBootstrappedOwner] = useState<{ email: string; displayName: string } | null>(null);

  if (status === 'ready' && session) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (bootstrapAvailability.status !== 'ready' || !bootstrapAvailability.data.available) {
      setError('Bootstrap is no longer available for this environment.');
      return;
    }

    const normalizedBootstrapKey = bootstrapKey.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim();
    const minPasswordLength = bootstrapAvailability.data.passwordPolicy.minLength;

    if (!normalizedBootstrapKey) {
      setError('Bootstrap key is required.');
      return;
    }

    if (password.length < minPasswordLength) {
      setError(`Owner password must be at least ${minPasswordLength} characters long.`);
      return;
    }

    if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Owner password must include uppercase, lowercase, number, and symbol characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);

    try {
      const bootstrapSession = await createOwnerBootstrapSession(normalizedBootstrapKey);
      const owner = await bootstrapOwnerCredential({
        bootstrapSessionToken: bootstrapSession.bootstrapSessionToken,
        email: normalizedEmail,
        password,
        ...(normalizedDisplayName ? { displayName: normalizedDisplayName } : {}),
      });
      setBootstrappedOwner({
        email: owner.email,
        displayName: owner.displayName ?? (normalizedDisplayName || 'Owner'),
      });
      setBootstrapKey('');
      setEmail('');
      setDisplayName('');
      setPassword('');
      setConfirmPassword('');
    } catch (submissionError) {
      setError(getBootstrapErrorMessage(submissionError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] px-5 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.28)] backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Owner bootstrap</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">Provision the real owner credentials once</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            This route opens a short-lived secure bootstrap session from the offline bootstrap key and then permanently consumes the owner bootstrap on first success. After that, the option is removed from the owner app automatically.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <SurfaceCard title="Offline bootstrap key" eyebrow="Protected action">
              <p className="text-sm leading-6 text-slate-300">
                The bootstrap key is used only to mint a short-lived secure bootstrap session. The final owner-creation call uses that ephemeral session instead of reusing the raw key.
              </p>
            </SurfaceCard>
            <SurfaceCard title="Single-use enforcement" eyebrow="Owner rules">
              <p className="text-sm leading-6 text-slate-300">
                There is no owner-password rotation through bootstrap anymore. Once the first real owner is created, bootstrap is permanently disabled and removed from the login screen.
              </p>
            </SurfaceCard>
          </div>
        </section>
        <section className="rounded-[2rem] border border-white/10 bg-slate-950/70 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-cyan-300">Secure bootstrap</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">Create the first owner access</h2>

          {bootstrapAvailability.status === 'loading' ? (
            <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
              Checking bootstrap availability and policy…
            </div>
          ) : null}

          {bootstrapAvailability.status === 'error' ? (
            <div className="mt-6 rounded-[1.5rem] border border-amber-400/30 bg-amber-500/10 p-5 text-sm text-amber-50">
              {bootstrapAvailability.error}
            </div>
          ) : null}

          {bootstrapAvailability.status === 'ready' && !bootstrapAvailability.data.available ? (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-50">
              <p className="text-lg font-semibold text-white">Bootstrap is no longer available</p>
              <p className="mt-3 leading-6">{bootstrapAvailability.data.detail}</p>
              {bootstrapAvailability.data.consumedByEmail ? (
                <p className="mt-3 leading-6 text-emerald-100">
                  Real owner access is already bound to <span className="font-semibold text-white">{bootstrapAvailability.data.consumedByEmail}</span>.
                </p>
              ) : null}
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="mt-5 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Return to owner sign-in
              </button>
            </div>
          ) : null}

          {bootstrappedOwner ? (
            <div className="mt-6 rounded-[1.5rem] border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-50">
              <p className="text-lg font-semibold text-white">Owner credentials are ready</p>
              <p className="mt-3 leading-6">
                <span className="font-semibold text-white">{bootstrappedOwner.displayName}</span> can now sign in as <span className="font-semibold text-white">{bootstrappedOwner.email}</span>.
              </p>
              <p className="mt-3 leading-6 text-emerald-100">
                Bootstrap has now been permanently consumed. The login page will stop exposing the bootstrap option automatically.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login', { replace: true })}
                className="mt-5 inline-flex rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                Return to owner sign-in
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {!bootstrappedOwner && bootstrapAvailability.status === 'ready' && bootstrapAvailability.data.available ? (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4" autoComplete="off">
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="owner-bootstrap-key" className="block text-sm font-medium text-slate-200">Bootstrap key</label>
                  <button
                    type="button"
                    onClick={() => setShowBootstrapKey((current) => !current)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"
                  >
                    {showBootstrapKey ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  id="owner-bootstrap-key"
                  type={showBootstrapKey ? "text" : "password"}
                  value={bootstrapKey}
                  onChange={(event) => setBootstrapKey(event.target.value)}
                  placeholder="Enter the offline bootstrap key"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label htmlFor="owner-bootstrap-email" className="mb-2 block text-sm font-medium text-slate-200">Owner email</label>
                <input
                  id="owner-bootstrap-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="owner@your-org.com"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="off"
                  required
                />
              </div>
              <div>
                <label htmlFor="owner-bootstrap-display-name" className="mb-2 block text-sm font-medium text-slate-200">Display name</label>
                <input
                  id="owner-bootstrap-display-name"
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Platform Owner"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="off"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="owner-bootstrap-password" className="block text-sm font-medium text-slate-200">New owner password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  id="owner-bootstrap-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create an ultra-strong owner password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="off"
                  minLength={bootstrapAvailability.data.passwordPolicy.minLength}
                  required
                />
                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Minimum {bootstrapAvailability.data.passwordPolicy.minLength} characters with uppercase, lowercase, number, and symbol.
                </p>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label htmlFor="owner-bootstrap-password-confirm" className="block text-sm font-medium text-slate-200">Confirm password</label>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300"
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <input
                  id="owner-bootstrap-password-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat the new password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-cyan-300"
                  autoComplete="off"
                  minLength={bootstrapAvailability.data.passwordPolicy.minLength}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Creating secure bootstrap session…' : 'Bootstrap owner credentials'}
              </button>
            </form>
          ) : null}

          <div className="mt-6">
            <NavLink
              to="/login"
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:text-white"
            >
              Back to owner sign-in
            </NavLink>
          </div>
        </section>
      </div>
    </div>
  );
}

function RequireOwnerSession() {
  const { session, status } = useOwnerAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <LoadingState title="Checking owner session" detail="Validating the current owner identity before loading the control plane." />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <OwnerShell />;
}

function DashboardPage() {
  const state = useOwnerResource<OwnerDashboard>('/api/owner/owner/dashboard');

  if (state.status === 'loading') {
    return <LoadingState title="Loading the command center" detail="Pulling the live owner dashboard from the platform API." />;
  }

  if (state.status === 'error') {
    return <ErrorState title="Owner dashboard is unavailable" detail={state.error} />;
  }

  const dashboard = state.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending approvals" value={String(dashboard.overview.pendingApprovals)} detail="Requests still waiting for direct owner action." />
        <StatCard label="Active employees" value={String(dashboard.overview.activeEmployees)} detail="Platform staff currently carrying active access." />
        <StatCard label="MFA coverage" value={`${dashboard.overview.mfaCoveragePercent}%`} detail="Current MFA coverage across active owner-plane staff." />
        <StatCard label="Stale logins" value={String(dashboard.overview.staleLogins)} detail="Employee identities needing login or access review." />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {dashboard.alerts.map((alert) => (
          <article key={alert.id} className={`rounded-[1.5rem] border p-5 ${getSeverityClasses(alert.severity)}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em]">{alert.severity}</p>
            <h3 className="mt-3 text-lg font-semibold text-white">{alert.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-100">{alert.detail}</p>
            <NavLink to={getOwnerAppHref(alert.href)} className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white">
              {alert.actionLabel}
            </NavLink>
          </article>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <SurfaceCard title="Priority approvals" eyebrow="Queue">
          <ul className="space-y-3">
            {dashboard.approvals.priorityQueue.length > 0 ? (
              dashboard.approvals.priorityQueue.map((approval) => (
                <li key={approval.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="font-semibold text-white">{approval.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{approval.description}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Requested {formatRelativeTime(approval.createdAt)}
                  </p>
                </li>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-300">No approvals are waiting right now.</p>
            )}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="School risk snapshot" eyebrow="Operations">
          <ul className="space-y-3">
            {dashboard.schoolOperations.topRisks.length > 0 ? (
              dashboard.schoolOperations.topRisks.map((school) => (
                <li key={school.schoolId} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white">{school.name}</p>
                    <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
                      {school.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{school.attentionReason}</p>
                </li>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-300">All schools are reporting healthy operations.</p>
            )}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Recent activity" eyebrow="Audit view">
          <ul className="space-y-3">
            {dashboard.recentActivity.map((item) => (
              <li key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {formatTimestamp(item.occurredAt)}
                </p>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </section>
    </div>
  );
}

function FinancePage() {
  const state = useOwnerResource<OwnerDashboard>('/api/owner/owner/dashboard');

  if (state.status === 'loading') {
    return <LoadingState title="Loading owner finance view" detail="Translating the live portfolio into finance signals for the owner plane." />;
  }

  if (state.status === 'error') {
    return <ErrorState title="Finance dashboard is unavailable" detail={state.error} />;
  }

  const dashboard = state.data;
  const liveSchools = dashboard.schoolOperations.schools.filter((school) => school.isActive);
  const managedStudentBase = liveSchools.reduce((total, school) => total + school.studentCount, 0);
  const revenueRiskSchools = liveSchools.filter((school) => school.status !== 'healthy');
  const revenueRiskStudents = revenueRiskSchools.reduce((total, school) => total + school.studentCount, 0);
  const schoolsWaitingApproval = dashboard.schoolOperations.schools.filter((school) => school.pendingApprovals > 0);
  const onboardingPipeline = dashboard.schoolOperations.schools.filter((school) => school.status === 'onboarding');
  const healthySchools = liveSchools.filter((school) => school.status === 'healthy');
  const healthyStudentBase = healthySchools.reduce((total, school) => total + school.studentCount, 0);
  const financeDepartment = dashboard.workforce.departments.find(
    (department) => department.department.toLowerCase() === 'finance',
  );
  const financeHeadcount = financeDepartment?.total ?? 0;
  const financeSharePercent =
    dashboard.workforce.totalEmployees === 0
      ? 0
      : Math.round((financeHeadcount / dashboard.workforce.totalEmployees) * 100);
  const schoolsPerFinanceOperator =
    financeHeadcount === 0
      ? null
      : Number((dashboard.schoolOperations.activeSchools / financeHeadcount).toFixed(1));
  const averageStudentsPerLiveSchool =
    liveSchools.length === 0 ? 0 : Math.round(managedStudentBase / liveSchools.length);
  const riskCoveragePercent =
    managedStudentBase === 0 ? 0 : Math.round((revenueRiskStudents / managedStudentBase) * 100);
  const approvalBlockedStudents = schoolsWaitingApproval.reduce((total, school) => total + school.studentCount, 0);
  const financeActivity = dashboard.recentActivity.filter(
    (item) =>
      item.href === '/owner/approvals' ||
      item.href === '/owner/schools' ||
      item.href === '/owner/employees',
  );
  const watchlist = [...revenueRiskSchools].sort(
    (left, right) =>
      right.studentCount - left.studentCount ||
      right.pendingApprovals - left.pendingApprovals ||
      left.name.localeCompare(right.name),
  );
  const financePriorities = [
    {
      label: 'Risk exposure',
      value: `${formatInteger(revenueRiskStudents)} students`,
      detail:
        revenueRiskSchools.length > 0
          ? `${formatInteger(revenueRiskSchools.length)} active schools are still degrading collections or expansion readiness.`
          : 'No active school currently sits in the commercial risk lane.',
    },
    {
      label: 'Approval block',
      value: `${formatInteger(approvalBlockedStudents)} students`,
      detail:
        schoolsWaitingApproval.length > 0
          ? `${formatInteger(schoolsWaitingApproval.length)} schools are waiting on owner decisions before clean progression.`
          : 'No live school is currently blocked by owner approvals.',
    },
    {
      label: 'Healthy base',
      value: `${formatInteger(healthyStudentBase)} students`,
      detail: `${formatInteger(healthySchools.length)} schools are operating without finance-facing exceptions right now.`,
    },
    {
      label: 'Team capacity',
      value: financeHeadcount === 0 ? 'Unstaffed' : `${financeHeadcount} operator${financeHeadcount === 1 ? '' : 's'}`,
      detail:
        financeHeadcount === 0
          ? 'Finance work is currently being absorbed by non-finance departments.'
          : `${schoolsPerFinanceOperator} live schools per finance operator at the current portfolio size.`,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2.25rem] border border-emerald-300/15 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),linear-gradient(160deg,rgba(2,6,23,0.98)_0%,rgba(15,23,42,0.96)_52%,rgba(20,83,45,0.72)_100%)] px-6 py-6 text-white shadow-[0_44px_140px_-84px_rgba(16,185,129,0.45)] sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-5">
            <div className="inline-flex rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100">
              Owner finance command deck
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Finance dashboard for portfolio control, risk, and activation.</h2>
              <p className="max-w-3xl text-sm leading-6 text-emerald-50/85 sm:text-base">
                This is a separate owner dashboard focused on commercial health. It surfaces the parts of the portfolio
                that can distort collections, expansion, and finance workload before those issues become operating debt.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {financePriorities.map((priority) => (
                <article key={priority.label} className="rounded-3xl border border-white/10 bg-black/20 px-5 py-4 backdrop-blur">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/80">{priority.label}</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{priority.value}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-200">{priority.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-slate-950/45 p-5 backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-100/80">Control tower</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Today&apos;s commercial operating picture</h3>
              </div>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                {riskCoveragePercent}% exposed
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Student base</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatInteger(managedStudentBase)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Current live-school commercial proxy.</p>
              </div>
              <div className="rounded-3xl bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Average live-school scale</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatInteger(averageStudentsPerLiveSchool)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Average students per active school account.</p>
              </div>
              <div className="rounded-3xl bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Schools blocked by approvals</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatInteger(schoolsWaitingApproval.length)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Owner decisions still constraining commercial flow.</p>
              </div>
              <div className="rounded-3xl bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Finance staffing share</p>
                <p className="mt-3 text-3xl font-semibold text-white">{financeSharePercent}%</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Share of the owner-plane workforce allocated to finance.</p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <NavLink
                to="/approvals"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
              >
                Resolve approval blockers
              </NavLink>
              <NavLink
                to="/schools"
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Inspect school risk
              </NavLink>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Revenue risk ledger</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Accounts needing finance attention now</h3>
            </div>
            <div className="rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
              {formatInteger(revenueRiskSchools.length)} schools • {formatInteger(revenueRiskStudents)} students at risk
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {watchlist.length > 0 ? (
              watchlist.map((school) => (
                <article key={school.schoolId} className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{school.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {school.city}, {school.state} • {school.code}
                      </p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-emerald-100">
                      {school.status}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{school.attentionReason}</p>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
                    <p>
                      Student exposure: <span className="font-semibold text-white">{formatInteger(school.studentCount)}</span>
                    </p>
                    <p>
                      Pending approvals: <span className="font-semibold text-white">{formatInteger(school.pendingApprovals)}</span>
                    </p>
                    <p>
                      Attendance freshness: <span className="font-semibold text-white">{formatRelativeTime(school.lastAttendanceRecordedAt)}</span>
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-300">
                No active schools are currently inside the finance risk ledger.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Activation queue</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Expansion and unlock pipeline</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-950/55 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Schools awaiting owner action</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatInteger(schoolsWaitingApproval.length)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{formatInteger(approvalBlockedStudents)} students are sitting behind approval blockers.</p>
              </div>
              <div className="rounded-3xl bg-slate-950/55 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Onboarding pipeline</p>
                <p className="mt-3 text-3xl font-semibold text-white">{formatInteger(onboardingPipeline.length)}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Schools not yet converted into healthy live accounts.</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {onboardingPipeline.length > 0 ? (
                onboardingPipeline.map((school) => (
                  <article key={school.schoolId} className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-white">{school.name}</p>
                      <span className="text-sm text-slate-300">{formatInteger(school.studentCount)} students</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{school.attentionReason}</p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-300">No schools are currently sitting in the onboarding finance queue.</p>
              )}
            </div>
          </article>

          <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Team bandwidth</p>
            <h3 className="mt-2 text-2xl font-semibold text-white">Finance operating capacity</h3>
            <div className="mt-5 space-y-3">
              {dashboard.workforce.departments.map((department) => (
                <div
                  key={department.department}
                  className={`rounded-[1.5rem] border px-4 py-4 ${
                    department.department.toLowerCase() === 'finance'
                      ? 'border-emerald-300/30 bg-emerald-500/10'
                      : 'border-white/10 bg-slate-950/55'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-white">{department.department}</p>
                    <span className="text-sm text-slate-300">{formatInteger(department.total)} total</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {formatInteger(department.active)} active • {formatInteger(department.inactive)} inactive
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-[1.5rem] border border-white/10 bg-slate-950/55 px-4 py-4 text-sm leading-6 text-slate-300">
              Finance owns {financeSharePercent}% of the current platform workforce.
              {financeHeadcount > 0
                ? ` ${formatInteger(financeHeadcount)} operator${financeHeadcount === 1 ? '' : 's'} currently support the finance lane, which means ${schoolsPerFinanceOperator} live schools per operator.`
                : ' No operator is currently assigned to the finance lane.'}
            </div>
          </article>
        </section>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Finance scorecard</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Owner-level commercial ratios</h3>
          <div className="mt-5 space-y-3">
            <div className="rounded-[1.5rem] bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Healthy commercial coverage</p>
              <p className="mt-3 text-3xl font-semibold text-white">
                {managedStudentBase === 0 ? '0%' : `${Math.round((healthyStudentBase / managedStudentBase) * 100)}%`}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Share of the current student base attached to healthy live-school accounts.</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Risk concentration</p>
              <p className="mt-3 text-3xl font-semibold text-white">{riskCoveragePercent}%</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Share of the live student base currently exposed to finance-facing school risk.</p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-950/55 px-4 py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approval-locked growth</p>
              <p className="mt-3 text-3xl font-semibold text-white">{formatInteger(approvalBlockedStudents)}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Students currently parked behind owner approvals across the school portfolio.</p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-200">Commercial signals</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Recent items with direct finance impact</h3>
          <ul className="mt-5 space-y-3">
            {financeActivity.length > 0 ? (
              financeActivity.map((item) => (
                <li key={item.id} className="rounded-[1.5rem] border border-white/10 bg-slate-950/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-semibold text-white">{item.title}</p>
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{formatTimestamp(item.occurredAt)}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.detail}</p>
                </li>
              ))
            ) : (
              <li className="rounded-[1.5rem] border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-300">
                No recent owner activity currently maps to finance follow-through.
              </li>
            )}
          </ul>
        </article>
      </section>
    </div>
  );
}

function SchoolsPage() {
  const state = useOwnerResource<OwnerDashboard>('/api/owner/owner/dashboard');

  if (state.status === 'loading') {
    return <LoadingState title="Loading school operations" detail="Gathering the live school portfolio for the owner plane." />;
  }

  if (state.status === 'error') {
    return <ErrorState title="School operations are unavailable" detail={state.error} />;
  }

  const schools = state.data.schoolOperations;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total schools" value={String(schools.totalSchools)} detail="Schools currently represented in the platform portfolio." />
        <StatCard label="Active schools" value={String(schools.activeSchools)} detail="Schools actively serving tenant traffic." />
        <StatCard label="Onboarding risk" value={String(schools.onboardingRiskCount)} detail="Schools still in onboarding or awaiting first operational activity." />
        <StatCard label="Operational exceptions" value={String(schools.exceptionCount)} detail="Schools showing stale attendance, grading, or approval issues." />
      </section>

      <SurfaceCard title="Portfolio health" eyebrow="Schools">
        <div className="grid gap-4 lg:grid-cols-2">
          {schools.schools.map((school) => (
            <SchoolCard key={school.schoolId} school={school} />
          ))}
        </div>
      </SurfaceCard>
    </div>
  );
}

function SchoolCard({ school }: { school: OwnerDashboardSchoolItem }) {
  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-slate-950/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{school.name}</p>
          <p className="text-sm text-slate-400">
            {school.city}, {school.state} • {school.code}
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-cyan-200">
          {school.status}
        </span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{school.attentionReason}</p>
      <div className="mt-4 grid gap-3 text-sm text-slate-300 sm:grid-cols-2">
        <p>Students: <span className="font-semibold text-white">{school.studentCount}</span></p>
        <p>Pending approvals: <span className="font-semibold text-white">{school.pendingApprovals}</span></p>
        <p>Attendance: <span className="font-semibold text-white">{formatRelativeTime(school.lastAttendanceRecordedAt)}</span></p>
        <p>Grades: <span className="font-semibold text-white">{formatRelativeTime(school.lastGradePublishedAt)}</span></p>
      </div>
    </article>
  );
}

function EmployeesPage() {
  const state = useOwnerResource<Employee[]>('/api/owner/employees');
  const { getAccessToken, refreshData } = useOwnerAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateEmployeeInput>(EMPTY_CREATE_FORM);
  const [editEmployeeId, setEditEmployeeId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<UpdateEmployeeInput>(EMPTY_EDIT_FORM);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<EmployeeFilter>('all');
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actioningEmployeeId, setActioningEmployeeId] = useState<string | null>(null);
  const [syncingEmployeeId, setSyncingEmployeeId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());

  if (state.status === 'loading') {
    return <LoadingState title="Loading platform staff" detail="Pulling the current owner-plane employee roster." />;
  }

  if (state.status === 'error') {
    return <ErrorState title="Employee data is unavailable" detail={state.error} />;
  }

  const employees = state.data;
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((employee) => employee.isActive).length;
  const needsReviewCount = employees.filter(requiresOwnerReview).length;
  const identityIssuesCount = employees.filter(
    (employee) => !employee.emailVerified || employee.authProviderDisabled || !employee.platformAccessActive,
  ).length;
  const mfaCoverage = totalEmployees === 0
    ? 0
    : Math.round((employees.filter((employee) => employee.mfaEnabled).length / totalEmployees) * 100);

  const filteredEmployees = employees.filter((employee) => {
    if (filter === 'active' && !employee.isActive) {
      return false;
    }

    if (filter === 'inactive' && employee.isActive) {
      return false;
    }

    if (filter === 'review' && !requiresOwnerReview(employee)) {
      return false;
    }

    if (!deferredSearch) {
      return true;
    }

    return [employee.displayName, employee.email, employee.department, employee.uid]
      .some((value) => value.toLowerCase().includes(deferredSearch));
  });

  function handleCreateChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setCreateForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function handleEditChange(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setEditForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function startEditing(employee: Employee) {
    setEditEmployeeId(employee.id);
    setEditError('');
    setEditForm({
      displayName: employee.displayName,
      department: employee.department,
    });
  }

  async function handleCreateSubmit(event: React.FormEvent) {
    event.preventDefault();
    setCreateError('');
    setIsCreating(true);

    try {
      const token = await getAccessToken();
      await sendApiData<Employee>('/api/owner/employees', 'POST', token, createForm);
      refreshData();
      setCreateForm(EMPTY_CREATE_FORM);
      setShowCreateForm(false);
    } catch (error) {
      setCreateError(getOperationErrorMessage(error, 'Failed to create employee'));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleEditSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!editEmployeeId) {
      return;
    }

    setEditError('');
    setIsUpdating(true);

    const body: UpdateEmployeeInput = {};
    const nextDisplayName = editForm.displayName?.trim();
    const nextDepartment = editForm.department?.trim();

    if (nextDisplayName) {
      body.displayName = nextDisplayName;
    }

    if (nextDepartment) {
      body.department = nextDepartment;
    }

    if (!body.displayName && !body.department) {
      setEditError('Enter at least one field to update.');
      setIsUpdating(false);
      return;
    }

    try {
      const token = await getAccessToken();
      await sendApiData<Employee>(`/api/owner/employees/${editEmployeeId}`, 'PATCH', token, body);
      refreshData();
      setEditEmployeeId(null);
      setEditForm(EMPTY_EDIT_FORM);
    } catch (error) {
      setEditError(getOperationErrorMessage(error, 'Failed to update employee'));
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleToggleEmployee(employee: Employee) {
    const actionLabel = employee.isActive ? 'deactivate' : 'reactivate';
    if (!window.confirm(`${employee.isActive ? 'Deactivate' : 'Reactivate'} ${employee.displayName}?`)) {
      return;
    }

    setActionError('');
    setActioningEmployeeId(employee.id);

    try {
      const token = await getAccessToken();
      if (employee.isActive) {
        await sendApiVoid(`/api/owner/employees/${employee.id}`, 'DELETE', token);
      } else {
        await sendApiVoid(`/api/owner/employees/${employee.id}/activate`, 'POST', token);
      }
      refreshData();
    } catch (error) {
      setActionError(getOperationErrorMessage(error, `Failed to ${actionLabel} employee`));
    } finally {
      setActioningEmployeeId(null);
    }
  }

  async function handleSyncIdentity(employee: Employee) {
    setActionError('');
    setSyncingEmployeeId(employee.id);

    try {
      const token = await getAccessToken();
      await sendApiData<Employee>(`/api/owner/employees/${employee.id}/sync`, 'POST', token);
      refreshData();
    } catch (error) {
      setActionError(getOperationErrorMessage(error, 'Failed to sync employee identity'));
    } finally {
      setSyncingEmployeeId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-slate-950 px-6 py-6 text-white shadow-[0_36px_120px_-72px_rgba(15,23,42,0.9)] sm:px-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-200">
              Workforce control
            </span>
            <div className="space-y-2">
              <h2 className="text-3xl font-semibold tracking-tight">Manage platform staff, department ownership, and access posture.</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Owners can onboard new staff, correct employee records, and control who is active on the platform plane from one surface.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm((current) => !current);
                  setCreateError('');
                }}
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-slate-100"
              >
                {showCreateForm ? 'Close onboarding form' : 'Add employee'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilter('review');
                  setSearch('');
                }}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Focus access review
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard label="Total staff" value={String(totalEmployees)} detail="Platform employees under owner control." />
            <SummaryCard label="Active" value={String(activeEmployees)} detail="Staff currently enabled on the platform plane." />
            <SummaryCard label="Needs review" value={String(needsReviewCount)} detail="Missing MFA, no login, or currently inactive." />
            <SummaryCard label="MFA coverage" value={`${mfaCoverage}%`} detail="Coverage across the current employee roster." />
            <SummaryCard label="Identity issues" value={String(identityIssuesCount)} detail="Email verification, disabled identities, or claim drift." />
          </div>
        </div>
      </section>

      {showCreateForm ? (
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="mb-5 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Onboarding</p>
            <h3 className="text-xl font-semibold text-white">Create platform employee</h3>
            <p className="max-w-2xl text-sm text-slate-300">Add the platform employee record that the owner plane will manage.</p>
          </div>

          {createError ? (
            <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {createError}
            </div>
          ) : null}

          <form onSubmit={handleCreateSubmit} className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Employee UID</span>
              <input
                name="uid"
                required
                value={createForm.uid}
                onChange={handleCreateChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300"
                placeholder="Platform user UID"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Email</span>
              <input
                name="email"
                type="email"
                required
                value={createForm.email}
                onChange={handleCreateChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300"
                placeholder="employee@domain.com"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Display name</span>
              <input
                name="displayName"
                required
                minLength={2}
                value={createForm.displayName}
                onChange={handleCreateChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300"
                placeholder="Full name"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Department</span>
              <select
                name="department"
                required
                value={createForm.department}
                onChange={handleCreateChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end lg:col-span-2">
              <button
                type="submit"
                disabled={isCreating}
                className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
              >
                {isCreating ? 'Creating…' : 'Create employee'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      {editEmployeeId ? (
        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.55)] backdrop-blur">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Edit employee</p>
              <h3 className="text-xl font-semibold text-white">Update staffing record</h3>
              <p className="max-w-2xl text-sm text-slate-300">Correct display name or transfer department ownership without recreating the employee record.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditEmployeeId(null);
                setEditForm(EMPTY_EDIT_FORM);
                setEditError('');
              }}
              className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10"
            >
              Close editor
            </button>
          </div>

          {editError ? (
            <div className="mb-4 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {editError}
            </div>
          ) : null}

          <form onSubmit={handleEditSubmit} className="grid gap-4 lg:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Display name</span>
              <input
                name="displayName"
                required
                minLength={2}
                value={editForm.displayName ?? ''}
                onChange={handleEditChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-200">Department</span>
              <select
                name="department"
                required
                value={editForm.department ?? ''}
                onChange={handleEditChange}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((department) => (
                  <option key={department} value={department}>{department}</option>
                ))}
              </select>
            </label>
            <div className="flex justify-end lg:col-span-2">
              <button
                type="submit"
                disabled={isUpdating}
                className="rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-300 disabled:opacity-60"
              >
                {isUpdating ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-400">Roster</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Employee access roster</h3>
            <p className="mt-1 text-sm text-slate-300">Search staff, isolate inactive records, and focus attention on access posture.</p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:w-auto lg:flex-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, department, or UID"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition-colors focus:border-cyan-300 lg:w-80"
            />
            <div className="flex flex-wrap gap-2">
              {EMPLOYEE_FILTERS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                    filter === option
                      ? 'bg-cyan-400 text-slate-950'
                      : 'bg-slate-900/70 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {option === 'all' ? 'All staff' : option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {actionError ? (
          <div className="mt-5 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {actionError}
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee) => (
              <article key={employee.id} className="rounded-3xl border border-white/10 bg-slate-950/50 px-5 py-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-lg font-semibold text-white">{employee.displayName}</h4>
                      <EmployeeStatusBadge employee={employee} />
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-300">
                        {employee.role}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm text-slate-300">
                      <p>{employee.email}</p>
                      <p>{employee.department} • UID {employee.uid}</p>
                    </div>
                    {requiresOwnerReview(employee) ? (
                      <p className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                        Owner review: {getReviewReasons(employee).join(', ')}.
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Last login</p>
                      <p className="mt-2 text-sm font-semibold text-white">{formatLastLogin(employee.lastLoginAt)}</p>
                    </div>
                    <SecuritySignal label="MFA" healthy={employee.mfaEnabled} healthyText="Enabled" reviewText="Review required" />
                    <SecuritySignal label="Email" healthy={employee.emailVerified} healthyText="Verified" reviewText="Unverified" />
                    <SecuritySignal
                      label="Platform access"
                      healthy={employee.platformAccessActive && !employee.authProviderDisabled}
                      healthyText="In policy"
                      reviewText={employee.authProviderDisabled ? 'Identity disabled' : 'Claim disabled'}
                    />
                    <div className="rounded-2xl bg-white/10 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Identity sync</p>
                      <p className="mt-2 text-sm font-semibold text-white">{formatSyncTime(employee.lastSyncedAt)}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEditing(employee)}
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/15"
                  >
                    Edit employee
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleSyncIdentity(employee);
                    }}
                    disabled={syncingEmployeeId === employee.id}
                    className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/15 disabled:opacity-60"
                  >
                    {syncingEmployeeId === employee.id ? 'Syncing…' : 'Sync identity'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleToggleEmployee(employee);
                    }}
                    disabled={actioningEmployeeId === employee.id || syncingEmployeeId === employee.id}
                    className={`rounded-full px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-60 ${
                      employee.isActive ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {actioningEmployeeId === employee.id
                      ? employee.isActive ? 'Deactivating…' : 'Reactivating…'
                      : employee.isActive ? 'Deactivate access' : 'Reactivate access'}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-slate-300">
              No employees match the current filters.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ApprovalsPage() {
  const { getAccessToken, refreshData } = useOwnerAuth();
  const [filter, setFilter] = useState<ApprovalFilter>('pending');
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const state = useOwnerResource<Approval[]>(
    filter === 'all' ? '/api/owner/approvals' : `/api/owner/approvals?status=${filter}`,
  );

  if (state.status === 'loading') {
    return <LoadingState title="Loading approvals" detail="Pulling the current approval queue for the owner plane." />;
  }

  if (state.status === 'error') {
    return <ErrorState title="Approval data is unavailable" detail={state.error} />;
  }

  const approvals = state.data;

  async function handleDecision(approval: Approval, decision: 'approve' | 'deny') {
    setActionError('');
    setActionId(approval.id);

    try {
      const token = await getAccessToken();
      const suffix = decision === 'approve' ? 'approve' : 'deny';
      await sendApiData<Approval>(`/api/owner/approvals/${approval.id}/${suffix}`, 'POST', token);
      refreshData();
    } catch (error) {
      setActionError(getOperationErrorMessage(error, `Failed to ${decision} approval`));
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] bg-slate-950 px-6 py-6 text-white shadow-[0_36px_120px_-72px_rgba(15,23,42,0.9)] sm:px-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-300">Approval queue</p>
        <h2 className="mt-2 text-3xl font-semibold">Review and decide on platform requests.</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Use the dedicated owner app to clear onboarding, suspension, employee, and exam approval requests without switching back to the combined web surface.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {APPROVAL_FILTERS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setFilter(option)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                filter === option
                  ? 'bg-cyan-400 text-slate-950'
                  : 'border border-white/15 bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </section>

      {actionError ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {actionError}
        </div>
      ) : null}

      {approvals.length === 0 ? (
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-12 text-center text-sm text-slate-300">
          No {filter === 'all' ? '' : filter} approvals found.
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const schoolIdValue = approval.metadata?.schoolId;
            const schoolId = typeof schoolIdValue === 'string' ? schoolIdValue : null;

            return (
              <article key={approval.id} className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_-56px_rgba(15,23,42,0.55)] backdrop-blur">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{approval.title}</h3>
                      <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${approval.status === 'pending' ? 'border-amber-400/30 bg-amber-500/10 text-amber-200' : approval.status === 'approved' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200' : 'border-rose-400/30 bg-rose-500/10 text-rose-200'}`}>
                        {approval.status}
                      </span>
                      <span className="rounded-full border border-white/10 bg-slate-900/60 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-300">
                        {approval.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-300">{approval.description}</p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-400">
                      <span>Requested by {approval.requestedByEmail}</span>
                      <span>Created {formatTimestamp(approval.createdAt)}</span>
                      {schoolId ? <span>School {schoolId}</span> : null}
                    </div>
                  </div>

                  {approval.status === 'pending' ? (
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        aria-label={`Approve ${approval.title}`}
                        onClick={() => {
                          void handleDecision(approval, 'approve');
                        }}
                        disabled={actionId === approval.id}
                        className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-60"
                      >
                        {actionId === approval.id ? 'Working…' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Deny ${approval.title}`}
                        onClick={() => {
                          void handleDecision(approval, 'deny');
                        }}
                        disabled={actionId === approval.id}
                        className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:opacity-60"
                      >
                        {actionId === approval.id ? 'Working…' : 'Deny'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SecurityPage() {
  const state = useOwnerResource<OwnerSecurityCenter>('/api/owner/owner/security');

  if (state.status === 'loading') {
    return <LoadingState title="Loading the security center" detail="Reading the latest privileged access posture for the owner plane." />;
  }

  if (state.status === 'error') {
    return <ErrorState title="Security center is unavailable" detail={state.error} />;
  }

  const security = state.data;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Privileged actions" value={String(security.overview.privilegedActions24h)} detail="High-signal owner-plane actions captured in the last 24 hours." />
        <StatCard label="Risky events" value={String(security.overview.riskyEvents24h)} detail="Events that need direct owner attention or follow-up." />
        <StatCard label="Review queue" value={String(security.overview.employeesNeedingReview)} detail="Employee records currently needing access review." />
        <StatCard label="MFA coverage" value={`${security.overview.mfaCoveragePercent}%`} detail="Coverage across active platform employees." />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <SurfaceCard title="Current findings" eyebrow="Findings">
          <ul className="space-y-3">
            {security.findings.map((finding) => (
              <li key={finding.id} className={`rounded-2xl border p-4 ${getSeverityClasses(finding.severity)}`}>
                <p className="font-semibold text-white">{finding.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-100">{finding.detail}</p>
              </li>
            ))}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Access review queue" eyebrow="Employee posture">
          <ul className="space-y-3">
            {security.accessReviewQueue.length > 0 ? (
              security.accessReviewQueue.map((item) => (
                <li key={item.employeeId} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                  <p className="font-semibold text-white">{item.displayName}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.email}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.reasons.join(', ')}</p>
                </li>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-300">No employee records currently need review.</p>
            )}
          </ul>
        </SurfaceCard>

        <SurfaceCard title="Audit timeline" eyebrow="Recent events">
          <ul className="space-y-3">
            {security.priorityEvents.map((event) => (
              <li key={event.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <p className="font-semibold text-white">{event.title}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{event.detail}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  {formatTimestamp(event.timestamp)}
                </p>
              </li>
            ))}
          </ul>
        </SurfaceCard>
      </section>
    </div>
  );
}

function NotFoundPage() {
  return (
    <SurfaceCard title="Page not found" eyebrow="Owner routing">
      <p className="text-sm leading-6 text-slate-300">
        This owner app only exposes the internal routes that belong to the founder control plane.
      </p>
      <NavLink to="/" className="mt-4 inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
        Return to command center
      </NavLink>
    </SurfaceCard>
  );
}

export function App() {
  return (
    <OwnerAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<OwnerLoginPage />} />
          <Route path="/bootstrap" element={<BootstrapOwnerPage />} />
          <Route element={<RequireOwnerSession />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/staff" element={<Navigate to="/employees" replace />} />
            <Route path="/approvals" element={<ApprovalsPage />} />
            <Route path="/security" element={<SecurityPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </OwnerAuthProvider>
  );
}

