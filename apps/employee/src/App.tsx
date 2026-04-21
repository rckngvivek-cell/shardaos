import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AuthSession, LoginOtpChallenge } from '@school-erp/shared';
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  AuthHttpError,
  clearStoredAuthSession,
  loadStoredAuthSession,
  logoutPlatformSession,
  requestPlatformLoginChallenge,
  resendPlatformLoginOtp,
  restorePlatformSession,
  verifyPlatformLoginOtp,
} from './lib/authSession';

const employeeNavigation = [
  { label: 'Operations hub', path: '/' },
  { label: 'Queue', path: '/queue' },
  { label: 'Schools', path: '/schools' },
  { label: 'Incidents', path: '/incidents' },
];

type EmployeeSession = {
  uid: string;
  email: string;
  role: 'employee';
  plane: 'platform';
  displayName: string;
};

interface EmployeeAuthContextValue {
  status: 'loading' | 'ready';
  session: EmployeeSession | null;
  completeSignIn: (session: AuthSession) => void;
  signOut: () => Promise<void>;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextValue | null>(null);

function isAuthServiceUnavailable(message: string) {
  return (
    message.includes('network')
    || message.includes('econnrefused')
    || message.includes('failed to fetch')
    || message.includes('fetch failed')
  );
}

function getAuthErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid credential') || normalized.includes('invalid_credentials')) {
    return 'The employee email or password is incorrect.';
  }

  if (normalized.includes('employee_only') || normalized.includes('employee account required')) {
    return 'This login is restricted to the ShardaOS employee app.';
  }

  if (isAuthServiceUnavailable(normalized)) {
    return 'The employee app could not reach the auth service. Check the local API.';
  }

  return message || 'Unable to start employee sign-in.';
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
      return 'Too many incorrect codes were entered. Start the employee sign-in flow again.';
    }

    if (error.code === 'OTP_RESEND_NOT_READY') {
      return 'Please wait a moment before requesting another verification code.';
    }

    if (error.code === 'OTP_RESEND_LIMIT_REACHED') {
      return 'This sign-in attempt has reached the resend limit. Start again from the login form.';
    }

    if (error.code === 'OTP_CHALLENGE_INVALID') {
      return 'This verification step is no longer valid. Start the employee sign-in flow again.';
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (isAuthServiceUnavailable(normalized)) {
    return 'The employee app could not reach the OTP verification service. Check the local API.';
  }

  return message || 'Unable to verify the email OTP.';
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function buildEmployeeSession(authSession: AuthSession): EmployeeSession {
  if (authSession.user.role !== 'employee' || authSession.user.plane !== 'platform') {
    throw new Error('EMPLOYEE_ONLY');
  }

  return {
    uid: authSession.user.uid,
    email: authSession.user.email,
    role: 'employee',
    plane: 'platform',
    displayName: authSession.user.displayName ?? 'Platform Employee',
  };
}

function EmployeeAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [session, setSession] = useState<EmployeeSession | null>(null);

  useEffect(() => {
    let active = true;
    clearStoredAuthSession();

    void (async () => {
      try {
        const restoredSession = await restorePlatformSession();
        if (!active) {
          return;
        }

        startTransition(() => {
          setSession(restoredSession ? buildEmployeeSession(restoredSession) : null);
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
    const employeeSession = buildEmployeeSession(authSession);
    startTransition(() => {
      setSession(employeeSession);
      setStatus('ready');
    });
  }

  async function signOut() {
    await logoutPlatformSession();
    startTransition(() => {
      setSession(null);
      setStatus('ready');
    });
  }

  return (
    <EmployeeAuthContext.Provider value={{ status, session, completeSignIn, signOut }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
}

function useEmployeeAuth() {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error('Employee auth context is not available');
  }

  return context;
}

function Shell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { session, signOut } = useEmployeeAuth();

  return (
    <div className="min-h-screen px-5 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-amber-200/70 bg-white/80 px-6 py-5 shadow-[0_24px_80px_rgba(120,53,15,0.10)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-amber-700">Platform employee</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <nav className="flex flex-wrap gap-2">
                {employeeNavigation.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-amber-500 text-white'
                          : 'border border-amber-200 bg-white text-slate-700 hover:border-amber-400 hover:text-slate-950'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="rounded-full border border-amber-200 bg-white px-4 py-2">
                  <span className="font-semibold text-slate-950">{session?.displayName ?? 'Employee'}</span>
                  <span className="ml-2">{session?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void signOut();
                  }}
                  className="rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-amber-400 hover:text-slate-950"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs font-medium uppercase tracking-[0.22em] text-slate-400">{eyebrow}</p>
        </header>
        <main className="mt-6">{children}</main>
      </div>
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[1.75rem] border border-amber-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function LaneCard({ title, state, detail }: { title: string; state: string; detail: string }) {
  return (
    <article className="rounded-[1.5rem] border border-amber-200 bg-white/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          {state}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function EmployeeLoginPage() {
  const { session, status, completeSignIn } = useEmployeeAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const redirectPath = requestedPath && requestedPath !== '/login' ? requestedPath : '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpChallenge, setOtpChallenge] = useState<LoginOtpChallenge | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);

  if (status === 'ready' && session) {
    return <Navigate to={redirectPath} replace />;
  }

  async function handleCredentialSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-amber-200 bg-white/85 p-8 shadow-[0_24px_80px_rgba(120,53,15,0.10)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-700">Operations plane</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950">Platform employee operations</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            This app is for internal ShardaOS operators who keep onboarding, approvals, and school support moving without exposing owner-only controls.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <LaneCard title="Approval handling" state="shared queue" detail="Work across onboarding tasks, follow-ups, and operational reviews with clear handoff lanes." />
            <LaneCard title="School support" state="live ops" detail="Surface tenant issues, stale activity, and rollout blockers before they escalate to the owner plane." />
          </div>
        </section>
        <section className="rounded-[2rem] border border-amber-200 bg-slate-950 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-300">Employee sign-in</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {otpChallenge ? 'Verify your employee email code' : 'Enter the operations hub'}
          </h2>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {!otpChallenge ? (
            <form onSubmit={handleCredentialSubmit} className="mt-6 space-y-4" autoComplete="off">
              <div>
                <label htmlFor="employee-email" className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input id="employee-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@company.com" autoComplete="off" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300" />
              </div>
              <div>
                <label htmlFor="employee-password" className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input id="employee-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="off" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300" />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
              >
                {submitting ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4" autoComplete="off">
              <div className="rounded-[1.5rem] border border-amber-400/20 bg-amber-500/10 p-4 text-sm text-amber-50">
                <p className="font-semibold text-white">Verification email sent</p>
                <p className="mt-2 leading-6">
                  Enter the {otpChallenge.otpLength}-digit code sent to <span className="font-semibold text-white">{otpChallenge.maskedEmail}</span>.
                </p>
                <p className="mt-2 leading-6 text-amber-100">Code expires at {formatTimestamp(otpChallenge.expiresAt)}.</p>
                {otpChallenge.deliveryHint ? <p className="mt-2 leading-6 text-amber-100">{otpChallenge.deliveryHint}</p> : null}
              </div>
              <div>
                <label htmlFor="employee-otp" className="mb-2 block text-sm font-medium text-slate-200">Verification code</label>
                <input
                  id="employee-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, otpChallenge.otpLength))}
                  placeholder="Enter the email OTP"
                  autoComplete="one-time-code"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-amber-300"
                />
              </div>
              <button
                type="submit"
                disabled={verifyingOtp}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:opacity-60"
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
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-amber-300/40 hover:text-white disabled:opacity-60"
                >
                  {resendingOtp ? 'Sending again…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtpChallenge(null);
                    setOtpCode('');
                    setError('');
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-amber-300/40 hover:text-white"
                >
                  Use a different email
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}

function RequireEmployeeSession() {
  const { session, status } = useEmployeeAuth();
  const location = useLocation();

  if (status === 'loading') {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function EmployeeDashboardPage() {
  return (
    <Shell
      eyebrow="Operations hub"
      title="Run the internal platform workforce from a separate employee app."
      description="This surface is for ShardaOS employees who need queues, school operations, and incident context without direct owner-plane authority."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="Open queue" value="18" detail="Combined onboarding, support, and follow-up tasks assigned across the operations team." />
        <Metric label="Escalated schools" value="5" detail="Schools that need immediate platform action today." />
        <Metric label="Pending handoffs" value="3" detail="Items that require owner review after employee triage." />
        <Metric label="Resolved today" value="11" detail="Operational tasks closed by the internal employee team." />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <LaneCard title="Rollout readiness" state="watch" detail="Two newly onboarded schools still need timetable and roster verification." />
        <LaneCard title="Approvals backlog" state="active" detail="Most pending approvals are in identity verification and can be resolved without owner intervention." />
        <LaneCard title="Support coverage" state="stable" detail="The current employee roster covers implementation, support, and monitoring shifts today." />
      </section>
    </Shell>
  );
}

function QueuePage() {
  return (
    <Shell
      eyebrow="Queue management"
      title="Approval and operations queue"
      description="Employees work the shared queue here before escalating only the small subset that truly requires an owner decision."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <LaneCard title="Identity review" state="8 pending" detail="Validate employee access posture and tenant claims before school activation." />
        <LaneCard title="Onboarding setup" state="6 pending" detail="Complete domain, school profile, and staff initialization tasks for new tenants." />
        <LaneCard title="Billing follow-up" state="2 pending" detail="Collect missing information and update rollout readiness notes for the owner team." />
        <LaneCard title="Escalation prep" state="2 pending" detail="Package the right evidence and notes before sending any item to the owner plane." />
      </section>
    </Shell>
  );
}

function SchoolsPage() {
  return (
    <Shell
      eyebrow="School operations"
      title="Schools needing employee follow-up"
      description="This app gives platform employees a clear school-by-school work surface without exposing owner-only governance controls."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <LaneCard title="Lotus Public School" state="watch" detail="Attendance data has not synced in the last two school days." />
        <LaneCard title="Bright Future Academy" state="setup" detail="Staff invitation and section roster import still need employee action." />
        <LaneCard title="Riverdale Senior Secondary" state="healthy" detail="No operational blockers are open across enrollment, academics, or support." />
      </section>
    </Shell>
  );
}

function IncidentsPage() {
  return (
    <Shell
      eyebrow="Incident follow-up"
      title="Operational and incident review"
      description="Track the support, rollout, and operational exceptions that platform employees are expected to resolve before they become owner-plane issues."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <LaneCard title="Transport data sync" state="investigating" detail="One school integration is missing route metadata after the latest import cycle." />
        <LaneCard title="Payroll cutover" state="planned" detail="Employee follow-up is needed before the school can move payroll operations fully into the platform." />
        <LaneCard title="Parent portal wave" state="queued" detail="Two schools are waiting on employee-led launch sequencing and communication support." />
        <LaneCard title="Security follow-through" state="stable" detail="No unresolved internal incidents are waiting on the employee app today." />
      </section>
    </Shell>
  );
}

function NotFoundPage() {
  return (
    <Shell
      eyebrow="Employee routing"
      title="Page not found"
      description="This employee app only exposes the routes needed by internal operations staff."
    >
      <NavLink to="/" className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white">
        Return to operations hub
      </NavLink>
    </Shell>
  );
}

export function App() {
  return (
    <EmployeeAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<EmployeeLoginPage />} />
          <Route element={<RequireEmployeeSession />}>
            <Route path="/" element={<EmployeeDashboardPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/schools" element={<SchoolsPage />} />
            <Route path="/incidents" element={<IncidentsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </EmployeeAuthProvider>
  );
}
