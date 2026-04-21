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
  logoutTenantSession,
  requestTenantLoginChallenge,
  resendTenantLoginOtp,
  restoreTenantSession,
  verifyTenantLoginOtp,
} from './lib/authSession';

const schoolNavigation = [
  { label: 'Dashboard', path: '/' },
  { label: 'Students', path: '/students' },
  { label: 'Attendance', path: '/attendance' },
  { label: 'Academics', path: '/academics' },
];

type SchoolSession = {
  uid: string;
  email: string;
  role: AuthSession['user']['role'];
  plane: 'tenant';
  schoolId: string;
  displayName: string;
};

interface SchoolAuthContextValue {
  status: 'loading' | 'ready';
  session: SchoolSession | null;
  completeSignIn: (session: AuthSession) => void;
  signOut: () => Promise<void>;
}

const SchoolAuthContext = createContext<SchoolAuthContextValue | null>(null);

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
    return 'The school email or password is incorrect.';
  }

  if (normalized.includes('tenant_only') || normalized.includes('school scope')) {
    return 'This login is restricted to school-scoped users.';
  }

  if (normalized.includes('school_inactive')) {
    return 'This school workspace is currently inactive.';
  }

  if (isAuthServiceUnavailable(normalized)) {
    return 'The school app could not reach the auth service. Check the local API.';
  }

  return message || 'Unable to start school sign-in.';
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
      return 'Too many incorrect codes were entered. Start the school sign-in flow again.';
    }

    if (error.code === 'OTP_RESEND_NOT_READY') {
      return 'Please wait a moment before requesting another verification code.';
    }

    if (error.code === 'OTP_RESEND_LIMIT_REACHED') {
      return 'This sign-in attempt has reached the resend limit. Start again from the login form.';
    }

    if (error.code === 'OTP_CHALLENGE_INVALID') {
      return 'This verification step is no longer valid. Start the school sign-in flow again.';
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (isAuthServiceUnavailable(normalized)) {
    return 'The school app could not reach the OTP verification service. Check the local API.';
  }

  return message || 'Unable to verify the email OTP.';
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function buildSchoolSession(authSession: AuthSession): SchoolSession {
  if (authSession.user.plane !== 'tenant' || !authSession.user.schoolId) {
    throw new Error('TENANT_ONLY');
  }

  return {
    uid: authSession.user.uid,
    email: authSession.user.email,
    role: authSession.user.role,
    plane: 'tenant',
    schoolId: authSession.user.schoolId,
    displayName: authSession.user.displayName ?? 'School User',
  };
}

function SchoolAuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');
  const [session, setSession] = useState<SchoolSession | null>(null);

  useEffect(() => {
    let active = true;
    clearStoredAuthSession();

    void (async () => {
      try {
        const restoredSession = await restoreTenantSession();
        if (!active) {
          return;
        }

        startTransition(() => {
          setSession(restoredSession ? buildSchoolSession(restoredSession) : null);
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
    const schoolSession = buildSchoolSession(authSession);
    startTransition(() => {
      setSession(schoolSession);
      setStatus('ready');
    });
  }

  async function signOut() {
    await logoutTenantSession();
    startTransition(() => {
      setSession(null);
      setStatus('ready');
    });
  }

  return (
    <SchoolAuthContext.Provider value={{ status, session, completeSignIn, signOut }}>
      {children}
    </SchoolAuthContext.Provider>
  );
}

function useSchoolAuth() {
  const context = useContext(SchoolAuthContext);
  if (!context) {
    throw new Error('School auth context is not available');
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
  const { session, signOut } = useSchoolAuth();

  return (
    <div className="min-h-screen px-5 py-6 text-slate-900 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[2rem] border border-emerald-200/80 bg-white/85 px-6 py-5 shadow-[0_24px_80px_rgba(15,118,110,0.12)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">School workspace</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-950">{title}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <nav className="flex flex-wrap gap-2">
                {schoolNavigation.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `rounded-full px-4 py-2 text-sm font-semibold transition ${
                        isActive
                          ? 'bg-emerald-500 text-white'
                          : 'border border-emerald-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-slate-950'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <div className="rounded-full border border-emerald-200 bg-white px-4 py-2">
                  <span className="font-semibold text-slate-950">{session?.displayName ?? 'School User'}</span>
                  <span className="ml-2">{session?.email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    void signOut();
                  }}
                  className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-400 hover:text-slate-950"
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

function Tile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[1.75rem] border border-emerald-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function FocusCard({ title, status, detail }: { title: string; status: string; detail: string }) {
  return (
    <article className="rounded-[1.5rem] border border-emerald-200 bg-white/90 p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
    </article>
  );
}

function SchoolLoginPage() {
  const { session, status, completeSignIn } = useSchoolAuth();
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
      const challenge = await requestTenantLoginChallenge({
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
      const authSession = await verifyTenantLoginOtp({
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
      const refreshedChallenge = await resendTenantLoginOtp({
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
        <section className="rounded-[2rem] border border-emerald-200 bg-white/90 p-8 shadow-[0_24px_80px_rgba(15,118,110,0.12)]">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-700">School ERP</p>
          <h1 className="mt-4 text-4xl font-semibold text-slate-950">School workspace access</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">
            This separate school app is for principals, school admins, teachers, and exam teams who need a focused tenant workspace without internal platform navigation.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <FocusCard title="Daily operations" status="live" detail="Attendance, students, and academic workflow stay anchored in the school-facing experience." />
            <FocusCard title="Role-aware landing" status="school only" detail="The navigation and priorities adapt to school work instead of owner or platform operations tasks." />
          </div>
        </section>
        <section className="rounded-[2rem] border border-emerald-200 bg-slate-950 p-8">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">School sign-in</p>
          <h2 className="mt-4 text-3xl font-semibold text-white">
            {otpChallenge ? 'Verify your school email code' : 'Enter your school workspace'}
          </h2>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          {!otpChallenge ? (
            <form onSubmit={handleCredentialSubmit} className="mt-6 space-y-4" autoComplete="off">
              <div>
                <label htmlFor="school-email" className="mb-2 block text-sm font-medium text-slate-200">Email</label>
                <input id="school-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@school.edu" autoComplete="off" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300" />
              </div>
              <div>
                <label htmlFor="school-password" className="mb-2 block text-sm font-medium text-slate-200">Password</label>
                <input id="school-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="off" className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300" />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
              >
                {submitting ? 'Sending code…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="mt-6 space-y-4" autoComplete="off">
              <div className="rounded-[1.5rem] border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                <p className="font-semibold text-white">Verification email sent</p>
                <p className="mt-2 leading-6">
                  Enter the {otpChallenge.otpLength}-digit code sent to <span className="font-semibold text-white">{otpChallenge.maskedEmail}</span>.
                </p>
                <p className="mt-2 leading-6 text-emerald-100">Code expires at {formatTimestamp(otpChallenge.expiresAt)}.</p>
                {otpChallenge.deliveryHint ? <p className="mt-2 leading-6 text-emerald-100">{otpChallenge.deliveryHint}</p> : null}
              </div>
              <div>
                <label htmlFor="school-otp" className="mb-2 block text-sm font-medium text-slate-200">Verification code</label>
                <input
                  id="school-otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={otpCode}
                  onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, otpChallenge.otpLength))}
                  placeholder="Enter the email OTP"
                  autoComplete="one-time-code"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none transition focus:border-emerald-300"
                />
              </div>
              <button
                type="submit"
                disabled={verifyingOtp}
                className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
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
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/40 hover:text-white disabled:opacity-60"
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
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-emerald-300/40 hover:text-white"
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

function RequireSchoolSession() {
  const { session, status } = useSchoolAuth();
  const location = useLocation();

  if (status === 'loading') {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

function SchoolDashboardPage() {
  return (
    <Shell
      eyebrow="School dashboard"
      title="Run school operations from a dedicated tenant app."
      description="This app isolates school workflows from the internal ShardaOS owner and employee surfaces so staff only see the routes that belong to their school work."
    >
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Tile label="Students" value="842" detail="Active student records currently visible in the school workspace." />
        <Tile label="Attendance due" value="5 classes" detail="Class sections still missing today’s attendance submission." />
        <Tile label="Assessments" value="12" detail="Assessments waiting for mark entry, review, or publication." />
        <Tile label="School status" value="Active" detail="The tenant profile is healthy and available to all school roles." />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <FocusCard title="Principal priorities" status="live" detail="Monitor school health, pending attendance, and unresolved academic actions from one landing surface." />
        <FocusCard title="Teacher workflow" status="ready" detail="Jump into classes, student records, and grade workflows without platform-plane distractions." />
        <FocusCard title="Exam control" status="watch" detail="Assessment publishing and review still need final approval for two grade groups." />
      </section>
    </Shell>
  );
}

function StudentsPage() {
  return (
    <Shell
      eyebrow="Student records"
      title="Student roster workspace"
      description="The dedicated school app keeps roster management close to the tenant context instead of mixing it with owner or platform employee tools."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <FocusCard title="Admissions follow-up" status="3 pending" detail="Three new applications are waiting for section allocation and guardian verification." />
        <FocusCard title="Transfer certificates" status="1 pending" detail="One transfer certificate request is still awaiting document review." />
        <FocusCard title="Section balancing" status="stable" detail="Current section capacity across classes stays within the planned threshold." />
      </section>
    </Shell>
  );
}

function AttendancePage() {
  return (
    <Shell
      eyebrow="Attendance operations"
      title="Daily attendance and follow-up"
      description="Attendance collection remains a school-owned workflow, so this app keeps it inside the tenant experience with direct links to staff priorities."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <FocusCard title="Today’s submissions" status="92%" detail="Most classes have submitted attendance, with five sections still outstanding." />
        <FocusCard title="Absence monitoring" status="watch" detail="Repeated absence signals are elevated for two students who need parent follow-up." />
        <FocusCard title="Transport mismatch" status="1 route" detail="One route roster needs reconciliation before the afternoon departure run." />
        <FocusCard title="Morning closure" status="on track" detail="The school is still on pace to close attendance before the operational cutoff." />
      </section>
    </Shell>
  );
}

function AcademicsPage() {
  return (
    <Shell
      eyebrow="Academic workflows"
      title="Assessments, grades, and academic review"
      description="Academic operations belong in the school-facing app so grade review, exam control, and publishing stay close to the school team."
    >
      <section className="grid gap-4 lg:grid-cols-2">
        <FocusCard title="Grade publication" status="review" detail="Two assessments are waiting for final exam-controller review before publication." />
        <FocusCard title="Teacher mark entry" status="active" detail="Mark entry is in progress for the current weekly assessment cycle." />
        <FocusCard title="Results analysis" status="healthy" detail="Term-level analytics are available for school leadership review." />
        <FocusCard title="Academic exceptions" status="none" detail="No unresolved academic publishing blockers are open in the school workspace." />
      </section>
    </Shell>
  );
}

function NotFoundPage() {
  return (
    <Shell
      eyebrow="School routing"
      title="Page not found"
      description="This school app only exposes the tenant routes that belong to school staff."
    >
      <NavLink to="/" className="inline-flex rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white">
        Return to the school dashboard
      </NavLink>
    </Shell>
  );
}

export function App() {
  return (
    <SchoolAuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<SchoolLoginPage />} />
          <Route element={<RequireSchoolSession />}>
            <Route path="/" element={<SchoolDashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/academics" element={<AcademicsPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SchoolAuthProvider>
  );
}
