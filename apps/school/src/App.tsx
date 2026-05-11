import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type {
  AdmissionAnalyticsSummary,
  AdmissionApplicant,
  AdmissionApplicantStage,
  AdmissionSession,
  AdmissionSessionCapacitySummary,
  AdmissionWorkQueueSummary,
  AuthSession,
  ConvertAdmissionApplicantInput,
  CreateAdmissionApplicantInput,
  CreateAdmissionSessionInput,
  IssueAdmissionOfferInput,
  LoginOtpChallenge,
  RecordAdmissionPaymentInput,
  SendAdmissionGuardianCommunicationInput,
  SchoolServiceEntitlement,
  SchoolServiceKey,
  SchoolServicesSummary,
  Student,
  StudentAdmissionSourceType,
  UpdateAdmissionEnrollmentChecklistInput,
  UpdateAdmissionApplicantFollowUpInput,
} from '@school-erp/shared';
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
import {
  acceptAdmissionApplicantOffer,
  closeAdmissionSession,
  convertAdmissionApplicantToStudent,
  createAdmissionApplicant,
  createAdmissionSession,
  issueAdmissionApplicantOffer,
  recordAdmissionApplicantPayment,
  requestAdmissionAnalytics,
  requestAdmissionCapacity,
  requestAdmissionLaunchApproval,
  requestAdmissionApplicants,
  requestAdmissionSessions,
  requestAdmissionWorkQueue,
  requestSchoolServicesSummary,
  requestStudents,
  reopenAdmissionSession,
  updateAdmissionApplicantDocument,
  updateAdmissionEnrollmentChecklist,
  updateAdmissionApplicantFollowUp,
  updateAdmissionApplicantStage,
  updateAdmissionSession,
  sendAdmissionGuardianCommunication,
  updateStudent,
} from './lib/schoolApi';

const schoolNavigation = [
  { label: 'Dashboard', path: '/' },
  { label: 'Services', path: '/services' },
  { label: 'Students', path: '/students' },
  { label: 'Attendance', path: '/attendance' },
  { label: 'Academics', path: '/academics' },
  { label: 'Homework', path: '/homework' },
  { label: 'Notices', path: '/notices' },
  { label: 'Transport', path: '/transport' },
  { label: 'Fees', path: '/fees' },
];

const placeholderServiceRoutes: Array<{ key: SchoolServiceKey; route: string; name: string }> = [
  { key: 'homework', route: '/homework', name: 'Homework' },
  { key: 'lesson_plans', route: '/lesson-plans', name: 'Lesson Plans' },
  { key: 'academic_calendar', route: '/calendar', name: 'Academic Calendar' },
  { key: 'notice_board', route: '/notices', name: 'Digital Notice Board' },
  { key: 'parent_portal', route: '/parents', name: 'Parent Portal' },
  { key: 'communications', route: '/communications', name: 'Communications' },
  { key: 'analytics', route: '/analytics', name: 'Analytics' },
  { key: 'school_staff', route: '/school-staff', name: 'School Staff Management' },
  { key: 'payroll', route: '/payroll', name: 'Payroll' },
  { key: 'library', route: '/library', name: 'Library' },
  { key: 'inventory', route: '/inventory', name: 'Inventory' },
  { key: 'online_exam', route: '/online-exams', name: 'Online Exam' },
  { key: 'report_cards', route: '/report-cards', name: 'Report Cards' },
  { key: 'accounting', route: '/accounting', name: 'Accounting' },
  { key: 'website_manager', route: '/website', name: 'Website Manager' },
  { key: 'e_content', route: '/content', name: 'E-content' },
  { key: 'certificates', route: '/certificates', name: 'Certificates' },
];

const defaultAdmissionForm: CreateAdmissionSessionInput = {
  name: '2026-27 Main Admission Window',
  academicYear: '2026-27',
  opensAt: '2026-05-01',
  closesAt: '2026-07-31',
  classes: [{ grade: 'Nursery', capacity: 60, feePlanCode: 'ADM-NUR-2026' }],
  enquirySourceTags: ['walk-in', 'website'],
  publicSummary: 'Primary admission window for the upcoming academic year.',
};

const defaultApplicantForm: Omit<CreateAdmissionApplicantInput, 'sessionId'> = {
  studentName: 'Aarav Sharma',
  applyingGrade: 'Nursery',
  guardian: {
    name: 'Neha Sharma',
    relationship: 'Mother',
    phone: '+91 9000000001',
    email: 'neha@example.com',
  },
  sourceTag: 'website',
  enquiryNote: 'Guardian asked for Nursery admission and transport availability.',
};

const defaultConversionForm: ConvertAdmissionApplicantInput = {
  firstName: '',
  lastName: '',
  dateOfBirth: '2021-04-05',
  gender: 'male',
  section: 'A',
  rollNumber: 'NUR-001',
  address: 'House 11, Sector 1, Delhi',
  emergencyContact: '+91 9000000001',
  bloodGroup: 'O+',
};

const defaultFollowUpForm: UpdateAdmissionApplicantFollowUpInput = {
  assignedTo: 'Admissions desk',
  followUpAt: '2026-05-08T10:00:00.000Z',
  priority: 'normal',
  status: 'open',
  note: 'Call guardian with document and fee guidance.',
};

const defaultOfferForm: IssueAdmissionOfferInput = {
  feeQuote: {
    currency: 'INR',
    dueDate: '2026-05-20',
    notes: 'Pay the admission fee to reserve the allotted seat.',
    lines: [
      {
        code: 'ADM-FEE',
        label: 'Admission fee',
        amount: 15000,
        frequency: 'one_time',
        mandatory: true,
      },
      {
        code: 'TUITION-Q1',
        label: 'Quarter 1 tuition',
        amount: 30000,
        frequency: 'quarterly',
        mandatory: true,
      },
    ],
  },
  letter: {
    title: 'Admission offer for Nursery',
    body: 'We are pleased to offer admission. Please complete the fee payment by the due date to reserve the allotted seat.',
    expiresAt: '2026-05-25',
  },
  communication: {
    channel: 'email',
    subject: 'Admission offer issued',
    message: 'Your admission offer has been issued with the fee quote and payment due date.',
  },
};

const defaultGuardianCommunicationForm: SendAdmissionGuardianCommunicationInput = {
  channel: 'phone',
  subject: 'Admission document reminder',
  message: 'Called guardian to remind them about pending admission documents.',
};

const defaultPaymentForm: RecordAdmissionPaymentInput = {
  amount: 45000,
  currency: 'INR',
  paidAt: '2026-05-20T10:30:00.000Z',
  method: 'upi',
  referenceNumber: 'UPI-ADM-00001',
  notes: 'Guardian paid the full admission quote.',
};

const defaultEnrollmentChecklistForm: UpdateAdmissionEnrollmentChecklistInput = {
  items: [
    {
      key: 'payment_receipt_verified',
      label: 'Payment receipt verified',
      status: 'complete',
      notes: 'Receipt checked by admissions desk.',
    },
    {
      key: 'guardian_consent',
      label: 'Guardian consent collected',
      status: 'complete',
    },
    {
      key: 'student_profile_ready',
      label: 'Student profile ready',
      status: 'waived',
      notes: 'Profile will be completed during student record conversion.',
    },
  ],
};

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

function formatPlanTier(tier: SchoolServicesSummary['planTier']) {
  return tier === 'advanced' ? 'Advanced' : 'Basic';
}

function getSchoolApiErrorMessage(error: unknown): string {
  if (error instanceof AuthHttpError) {
    if (error.code === 'SESSION_REQUIRED') {
      return 'Sign in again to refresh the school service plan.';
    }

    if (error.code === 'NOT_FOUND') {
      return 'This school workspace was not found in the API data store.';
    }
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (isAuthServiceUnavailable(normalized)) {
    return 'The school app could not reach the service-plan API. Check the local API.';
  }

  return message || 'Unable to load the school service plan.';
}

function useSchoolServicesSummary() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [summary, setSummary] = useState<SchoolServicesSummary | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setStatus('loading');
    setError('');

    void (async () => {
      try {
        const nextSummary = await requestSchoolServicesSummary();
        if (!active) {
          return;
        }

        startTransition(() => {
          setSummary(nextSummary);
          setStatus('ready');
        });
      } catch (loadError) {
        if (!active) {
          return;
        }

        startTransition(() => {
          setSummary(null);
          setError(getSchoolApiErrorMessage(loadError));
          setStatus('error');
        });
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return { status, summary, error };
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

function Notice({ tone, children }: { tone: 'loading' | 'error' | 'info'; children: ReactNode }) {
  const styles = {
    loading: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-slate-200 bg-white text-slate-700',
  };

  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 text-sm leading-6 ${styles[tone]}`}>
      {children}
    </div>
  );
}

function ServiceStatusBadge({ service }: { service: SchoolServiceEntitlement }) {
  const styles = {
    enabled: 'bg-emerald-100 text-emerald-700',
    available: 'bg-sky-100 text-sky-700',
    locked: 'bg-slate-200 text-slate-600',
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles[service.state]}`}>
      {service.state}
    </span>
  );
}

function ServiceCard({ service }: { service: SchoolServiceEntitlement }) {
  const isEnabled = service.state === 'enabled';

  return (
    <article className="flex min-h-56 flex-col justify-between rounded-[1.5rem] border border-emerald-200 bg-white p-5">
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">
              {service.category} service
            </p>
            <h3 className="mt-3 text-xl font-semibold text-slate-950">{service.name}</h3>
          </div>
          <ServiceStatusBadge service={service} />
        </div>
        <p className="mt-4 text-sm leading-6 text-slate-600">{service.description}</p>
        {service.lockedReason ? (
          <p className="mt-3 text-sm font-medium text-slate-500">{service.lockedReason}</p>
        ) : null}
      </div>
      {isEnabled ? (
        <NavLink
          to={service.route}
          className="mt-5 inline-flex w-fit rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white"
        >
          Open {service.shortName}
        </NavLink>
      ) : (
        <span className="mt-5 inline-flex w-fit rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500">
          {service.state === 'available' ? 'Available to enable' : 'Plan upgrade required'}
        </span>
      )}
    </article>
  );
}

function ServiceGroup({ title, services }: { title: string; services: SchoolServiceEntitlement[] }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.key} service={service} />
        ))}
      </div>
    </section>
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
  const { status, summary, error } = useSchoolServicesSummary();
  const enabledCount = summary?.totals.enabled ?? 0;
  const lockedCount = summary?.totals.locked ?? 0;

  return (
    <Shell
      eyebrow="School dashboard"
      title="Run school operations from the purchased service plan."
      description="The school dashboard now reads the tenant service entitlement contract from the API and only opens modules that belong to this school plan."
    >
      {status === 'loading' ? (
        <Notice tone="loading">Loading the school service plan from the API.</Notice>
      ) : null}
      {status === 'error' ? (
        <Notice tone="error">{error}</Notice>
      ) : null}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Tile
          label="Purchased plan"
          value={summary ? formatPlanTier(summary.planTier) : 'Loading'}
          detail={summary ? `${summary.schoolName} is running on the ${formatPlanTier(summary.planTier)} service tier.` : 'Waiting for the school service contract.'}
        />
        <Tile
          label="Enabled modules"
          value={String(enabledCount)}
          detail="Services currently open to this school from the tenant entitlement contract."
        />
        <Tile
          label="Locked modules"
          value={String(lockedCount)}
          detail="Advanced services withheld until the purchased plan allows them."
        />
        <Tile
          label="Workspace status"
          value={summary ? 'Entitled' : status === 'error' ? 'Blocked' : 'Checking'}
          detail="The school app checks the API before exposing service workbenches."
        />
      </section>
      {summary ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <FocusCard
            title="Basic service lane"
            status={`${summary.basicServices.filter((service) => service.state === 'enabled').length} enabled`}
            detail="Students, attendance, academics, homework, lesson plans, calendar, and notices stay available on every school plan."
          />
          <FocusCard
            title="Advanced service lane"
            status={`${summary.advancedServices.filter((service) => service.state === 'enabled').length} enabled`}
            detail="Fees, transport, staff, payroll, library, inventory, exams, reports, admissions, accounting, and publishing open on Advanced."
          />
        </section>
      ) : null}
    </Shell>
  );
}

function ServicesPage() {
  const { status, summary, error } = useSchoolServicesSummary();

  return (
    <Shell
      eyebrow="Service plan"
      title="Basic and Advanced school services"
      description="The school app groups each module by the purchased plan and uses the API entitlement state before opening a workbench."
    >
      {status === 'loading' ? (
        <Notice tone="loading">Loading Basic and Advanced service groups.</Notice>
      ) : null}
      {status === 'error' ? (
        <Notice tone="error">{error}</Notice>
      ) : null}
      {summary ? (
        <div className="space-y-8">
          <section className="grid gap-4 md:grid-cols-3">
            <Tile
              label="School"
              value={summary.schoolName}
              detail={`Service contract loaded for ${summary.schoolId}.`}
            />
            <Tile
              label="Plan"
              value={formatPlanTier(summary.planTier)}
              detail={`${summary.totals.enabled} enabled, ${summary.totals.locked} locked, ${summary.totals.available} available to enable.`}
            />
            <Tile
              label="Advanced access"
              value={summary.planTier === 'advanced' ? 'Open' : 'Locked'}
              detail="Advanced unlocks finance, transport, staff, payroll, library, inventory, exams, report cards, admissions, and publishing."
            />
          </section>
          <ServiceGroup title="Basic services" services={summary.basicServices} />
          <ServiceGroup title="Advanced services" services={summary.advancedServices} />
        </div>
      ) : null}
    </Shell>
  );
}

function findService(summary: SchoolServicesSummary, serviceKey: SchoolServiceKey) {
  return summary.services.find((service) => service.key === serviceKey) ?? null;
}

function ServiceWorkbenchPage({
  serviceKey,
  fallbackTitle,
}: {
  serviceKey: SchoolServiceKey;
  fallbackTitle: string;
}) {
  const { status, summary, error } = useSchoolServicesSummary();
  const service = summary ? findService(summary, serviceKey) : null;
  const pageTitle = service?.name ?? fallbackTitle;
  const workflow = service?.workflow;

  return (
    <Shell
      eyebrow="Service workbench"
      title={pageTitle}
      description="This workbench is opened only after the school plan contract is loaded from the tenant API."
    >
      {status === 'loading' ? (
        <Notice tone="loading">Checking whether this school can use {fallbackTitle}.</Notice>
      ) : null}
      {status === 'error' ? (
        <Notice tone="error">{error}</Notice>
      ) : null}
      {service ? (
        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <ServiceCard service={service} />
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-slate-950">Operational readiness</h2>
              <ServiceStatusBadge service={service} />
            </div>
            {service.state === 'enabled' ? (
              <div className="mt-5 space-y-4 text-sm leading-6 text-slate-600">
                <p>{service.name} is enabled for {summary?.schoolName}. Module access is open for this school plan.</p>
                {workflow ? (
                  <>
                    <p>{workflow.setupSummary}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Data objects</p>
                        <p className="mt-2 text-sm text-slate-700">{workflow.dataObjects.join(', ')}</p>
                      </div>
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Permissions</p>
                        <p className="mt-2 text-sm text-slate-700">{workflow.permissionScopes.join(', ')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700">Workflow</p>
                      <ol className="mt-3 space-y-3">
                        {workflow.steps.map((step, index) => (
                          <li key={step.key} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                                {index + 1}
                              </span>
                              <span className="font-semibold text-slate-950">{step.title}</span>
                              {step.ownerApprovalRequired ? (
                                <span className="rounded-full bg-amber-100 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-amber-800">
                                  Owner review
                                </span>
                              ) : null}
                            </div>
                            <p className="mt-2 text-slate-600">{step.description}</p>
                          </li>
                        ))}
                      </ol>
                    </div>
                    {workflow.ownerApprovalGate ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-semibold text-amber-900">{workflow.ownerApprovalGate.title}</p>
                        <p className="mt-1 text-sm text-amber-800">{workflow.ownerApprovalGate.description}</p>
                      </div>
                    ) : null}
                  </>
                ) : null}
              </div>
            ) : service.state === 'available' ? (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                This service is allowed by the purchased plan but is not enabled in the school service key list yet.
              </p>
            ) : (
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {service.lockedReason} Ask the owner plane to review the school purchase before this module is opened.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}

function TransportPage() {
  return <ServiceWorkbenchPage serviceKey="transport" fallbackTitle="Transport Management" />;
}

function FeeCollectionPage() {
  return <ServiceWorkbenchPage serviceKey="fee_collection" fallbackTitle="Fee Collection" />;
}

function AdmissionCrmPage() {
  const { status, summary, error } = useSchoolServicesSummary();
  const service = summary ? findService(summary, 'admission_crm') : null;
  const [sessions, setSessions] = useState<AdmissionSession[]>([]);
  const [sessionsStatus, setSessionsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [sessionsError, setSessionsError] = useState('');
  const [applicants, setApplicants] = useState<AdmissionApplicant[]>([]);
  const [applicantsStatus, setApplicantsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [applicantsError, setApplicantsError] = useState('');
  const [analytics, setAnalytics] = useState<AdmissionAnalyticsSummary | null>(null);
  const [analyticsStatus, setAnalyticsStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [analyticsError, setAnalyticsError] = useState('');
  const [workQueue, setWorkQueue] = useState<AdmissionWorkQueueSummary | null>(null);
  const [workQueueStatus, setWorkQueueStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [workQueueError, setWorkQueueError] = useState('');
  const [form, setForm] = useState<CreateAdmissionSessionInput>(defaultAdmissionForm);
  const [classGrade, setClassGrade] = useState(defaultAdmissionForm.classes[0].grade);
  const [classSection, setClassSection] = useState(defaultAdmissionForm.classes[0].sections?.[0]?.section ?? 'A');
  const [classCapacity, setClassCapacity] = useState(String(defaultAdmissionForm.classes[0].capacity));
  const [classFeePlanCode, setClassFeePlanCode] = useState(defaultAdmissionForm.classes[0].feePlanCode ?? '');
  const [sourceTags, setSourceTags] = useState(defaultAdmissionForm.enquirySourceTags.join(', '));
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [applicantForm, setApplicantForm] = useState(defaultApplicantForm);
  const [conversionForm, setConversionForm] = useState(defaultConversionForm);
  const [followUpForm, setFollowUpForm] = useState(defaultFollowUpForm);
  const [offerForm, setOfferForm] = useState(defaultOfferForm);
  const [guardianCommunicationForm, setGuardianCommunicationForm] = useState(defaultGuardianCommunicationForm);
  const [paymentForm, setPaymentForm] = useState(defaultPaymentForm);
  const [enrollmentChecklistForm, setEnrollmentChecklistForm] = useState(defaultEnrollmentChecklistForm);
  const [capacitySummary, setCapacitySummary] = useState<AdmissionSessionCapacitySummary | null>(null);
  const [capacityStatus, setCapacityStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [capacityError, setCapacityError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittingApplicant, setSubmittingApplicant] = useState(false);
  const [actioningSessionId, setActioningSessionId] = useState<string | null>(null);
  const [actioningApplicantId, setActioningApplicantId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [applicantMessage, setApplicantMessage] = useState('');
  const activeSessions = sessions.filter((session) => session.status === 'active');
  const applicantSessionId = selectedSessionId || activeSessions[0]?.id || '';
  const visibleApplicants = applicantSessionId
    ? applicants.filter((applicant) => applicant.sessionId === applicantSessionId)
    : applicants;
  const capacityCards = capacitySummary?.classes.flatMap((classSummary) => (
    classSummary.sections.map((section) => ({
      grade: classSummary.grade,
      section: section.section,
      capacity: section.capacity,
      occupiedCount: section.occupiedCount,
      availableSeats: section.availableSeats,
    }))
  )) ?? [];

  useEffect(() => {
    if (service?.state !== 'enabled') {
      setAnalytics(null);
      setAnalyticsStatus('idle');
      setAnalyticsError('');
      setWorkQueue(null);
      setWorkQueueStatus('idle');
      setWorkQueueError('');
      return;
    }

    let cancelled = false;
    setSessionsStatus('loading');
    setSessionsError('');
    setApplicantsStatus('loading');
    setApplicantsError('');
    setAnalyticsStatus('loading');
    setAnalyticsError('');
    setWorkQueueStatus('loading');
    setWorkQueueError('');

    requestAdmissionSessions()
      .then((items) => {
        if (!cancelled) {
          setSessions(items);
          setSelectedSessionId((current) => current || items.find((item) => item.status === 'active')?.id || '');
          setSessionsStatus('ready');
        }
        return Promise.all([
          requestAdmissionApplicants(),
          requestAdmissionAnalytics(),
          requestAdmissionWorkQueue(),
        ] as const);
      })
      .then(([items, analyticsSummary, workQueueSummary]) => {
        if (!cancelled) {
          setApplicants(items);
          setAnalytics(analyticsSummary);
          setWorkQueue(workQueueSummary);
          setApplicantsStatus('ready');
          setAnalyticsStatus('ready');
          setWorkQueueStatus('ready');
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          const loadMessage = loadError instanceof Error ? loadError.message : String(loadError);
          setSessionsError(loadMessage);
          setApplicantsError(loadMessage);
          setAnalyticsError(loadMessage);
          setWorkQueueError(loadMessage);
          setSessionsStatus('error');
          setApplicantsStatus('error');
          setAnalyticsStatus('error');
          setWorkQueueStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [service?.state]);

  useEffect(() => {
    if (service?.state !== 'enabled' || !applicantSessionId) {
      setCapacitySummary(null);
      setCapacityStatus('idle');
      setCapacityError('');
      return;
    }

    let cancelled = false;
    setCapacityStatus('loading');
    setCapacityError('');

    requestAdmissionCapacity(applicantSessionId)
      .then((summary) => {
        if (!cancelled) {
          setCapacitySummary(summary);
          setCapacityStatus('ready');
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setCapacitySummary(null);
          setCapacityError(loadError instanceof Error ? loadError.message : String(loadError));
          setCapacityStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [applicantSessionId, service?.state]);

  function updateForm(
    field: 'name' | 'academicYear' | 'opensAt' | 'closesAt' | 'publicSummary',
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function buildAdmissionInput(): CreateAdmissionSessionInput {
    const capacity = Number.parseInt(classCapacity, 10);
    const normalizedCapacity = Number.isFinite(capacity) ? capacity : 1;
    return {
      ...form,
      classes: [{
        grade: classGrade.trim(),
        capacity: normalizedCapacity,
        sections: [{ section: classSection.trim() || 'A', capacity: normalizedCapacity }],
        feePlanCode: classFeePlanCode.trim() || undefined,
      }],
      enquirySourceTags: sourceTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    };
  }

  function resetAdmissionSessionForm() {
    setForm(defaultAdmissionForm);
    setClassGrade(defaultAdmissionForm.classes[0].grade);
    setClassSection(defaultAdmissionForm.classes[0].sections?.[0]?.section ?? 'A');
    setClassCapacity(String(defaultAdmissionForm.classes[0].capacity));
    setClassFeePlanCode(defaultAdmissionForm.classes[0].feePlanCode ?? '');
    setSourceTags(defaultAdmissionForm.enquirySourceTags.join(', '));
    setEditingSessionId(null);
  }

  function handleEditSession(session: AdmissionSession) {
    const classSeat = session.classes[0];
    const sections = classSeat?.sections ?? [];
    if (!classSeat || session.classes.length !== 1 || sections.length > 1) {
      setMessage('Only single-class, single-section admission sessions can be edited from this form.');
      return;
    }

    const sectionSeat = sections[0] ?? { section: 'A', capacity: classSeat.capacity };
    setForm({
      name: session.name,
      academicYear: session.academicYear,
      opensAt: session.opensAt,
      closesAt: session.closesAt,
      classes: session.classes,
      enquirySourceTags: session.enquirySourceTags,
      publicSummary: session.publicSummary,
    });
    setClassGrade(classSeat.grade);
    setClassSection(sectionSeat.section);
    setClassCapacity(String(sectionSeat.capacity));
    setClassFeePlanCode(classSeat.feePlanCode ?? '');
    setSourceTags(session.enquirySourceTags.join(', '));
    setEditingSessionId(session.id);
    setMessage(`${session.name} is loaded for editing.`);
  }

  function updateApplicantField(field: 'studentName' | 'applyingGrade' | 'sourceTag' | 'enquiryNote', value: string) {
    setApplicantForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateApplicantGuardian(field: keyof CreateAdmissionApplicantInput['guardian'], value: string) {
    setApplicantForm((current) => ({
      ...current,
      guardian: {
        ...current.guardian,
        [field]: value,
      },
    }));
  }

  function updateConversionField(field: keyof ConvertAdmissionApplicantInput, value: string) {
    setConversionForm((current) => ({
      ...current,
      [field]: field === 'gender' ? value as ConvertAdmissionApplicantInput['gender'] : value,
    }));
  }

  function updateFollowUpField(field: keyof UpdateAdmissionApplicantFollowUpInput, value: string) {
    setFollowUpForm((current) => ({
      ...current,
      [field]: value || undefined,
    } as UpdateAdmissionApplicantFollowUpInput));
  }

  function updateOfferField(field: 'currency' | 'dueDate' | 'notes' | 'title' | 'body' | 'expiresAt', value: string) {
    setOfferForm((current) => {
      if (field === 'currency' || field === 'dueDate' || field === 'notes') {
        return {
          ...current,
          feeQuote: {
            ...current.feeQuote,
            [field]: value,
          },
        };
      }

      return {
        ...current,
        letter: {
          ...current.letter,
          [field]: value,
        },
      };
    });
  }

  function updateOfferLineAmount(index: number, value: string) {
    const amount = Number.parseFloat(value);
    setOfferForm((current) => ({
      ...current,
      feeQuote: {
        ...current.feeQuote,
        lines: current.feeQuote.lines.map((line, lineIndex) => (
          lineIndex === index ? { ...line, amount: Number.isFinite(amount) ? amount : 0 } : line
        )),
      },
    }));
  }

  function updateGuardianCommunicationField(
    field: keyof SendAdmissionGuardianCommunicationInput,
    value: string,
  ) {
    setGuardianCommunicationForm((current) => ({
      ...current,
      [field]: value,
    } as SendAdmissionGuardianCommunicationInput));
  }

  function updatePaymentField(field: keyof RecordAdmissionPaymentInput, value: string) {
    setPaymentForm((current) => {
      const nextValue = field === 'amount' ? Number.parseFloat(value) : value;
      return {
        ...current,
        [field]: field === 'amount' ? Number.isFinite(nextValue as number) ? nextValue : 0 : nextValue,
      } as RecordAdmissionPaymentInput;
    });
  }

  function updateChecklistStatus(index: number, value: string) {
    setEnrollmentChecklistForm((current) => ({
      items: current.items.map((item, itemIndex) => (
        itemIndex === index
          ? { ...item, status: value as UpdateAdmissionEnrollmentChecklistInput['items'][number]['status'] }
          : item
      )),
    }));
  }

  async function refreshCapacity(sessionId = applicantSessionId) {
    if (!sessionId) {
      return;
    }

    try {
      const summary = await requestAdmissionCapacity(sessionId);
      setCapacitySummary(summary);
      setCapacityStatus('ready');
      setCapacityError('');
    } catch (loadError) {
      setCapacityError(loadError instanceof Error ? loadError.message : String(loadError));
      setCapacityStatus('error');
    }
  }

  async function handleSaveSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      const input = buildAdmissionInput();
      if (editingSessionId) {
        const updated = await updateAdmissionSession(editingSessionId, input);
        setSessions((current) => current.map((session) => (
          session.id === updated.id ? updated : session
        )));
        setMessage(`${updated.name} session changes were saved.`);
        resetAdmissionSessionForm();
      } else {
        const created = await createAdmissionSession(input);
        setSessions((current) => [created, ...current]);
        setMessage(`${created.name} was saved as a draft admission session.`);
      }
    } catch (saveError) {
      setMessage(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestLaunchApproval(sessionId: string) {
    setMessage('');
    setActioningSessionId(sessionId);

    try {
      const result = await requestAdmissionLaunchApproval(sessionId);
      setSessions((current) => current.map((session) => (
        session.id === result.session.id ? result.session : session
      )));
      setMessage(`Owner approval request ${result.approvalId} is now pending.`);
    } catch (approvalError) {
      setMessage(approvalError instanceof Error ? approvalError.message : String(approvalError));
    } finally {
      setActioningSessionId(null);
    }
  }

  async function handleReopenSession(sessionId: string) {
    setMessage('');
    setActioningSessionId(sessionId);

    try {
      const updated = await reopenAdmissionSession(sessionId);
      setSessions((current) => current.map((session) => (
        session.id === updated.id ? updated : session
      )));
      setMessage(`${updated.name} was reopened as a draft session.`);
    } catch (reopenError) {
      setMessage(reopenError instanceof Error ? reopenError.message : String(reopenError));
    } finally {
      setActioningSessionId(null);
    }
  }

  async function handleCloseSession(sessionId: string) {
    setMessage('');
    setActioningSessionId(sessionId);

    try {
      const updated = await closeAdmissionSession(sessionId);
      setSessions((current) => current.map((session) => (
        session.id === updated.id ? updated : session
      )));
      setSelectedSessionId((current) => (
        current === updated.id ? activeSessions.find((session) => session.id !== updated.id)?.id ?? '' : current
      ));
      setMessage(`${updated.name} intake was closed.`);
    } catch (closeError) {
      setMessage(closeError instanceof Error ? closeError.message : String(closeError));
    } finally {
      setActioningSessionId(null);
    }
  }

  async function handleCreateApplicant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApplicantMessage('');
    if (!applicantSessionId) {
      setApplicantMessage('Open an active admission session before capturing an enquiry.');
      return;
    }

    setSubmittingApplicant(true);
    try {
      const created = await createAdmissionApplicant({
        sessionId: applicantSessionId,
        ...applicantForm,
      });
      setApplicants((current) => [created, ...current]);
      setApplicantMessage(`${created.applicantNumber} was captured for ${created.studentName}.`);
    } catch (createError) {
      setApplicantMessage(createError instanceof Error ? createError.message : String(createError));
    } finally {
      setSubmittingApplicant(false);
    }
  }

  async function handleMoveApplicant(applicant: AdmissionApplicant, stage: AdmissionApplicantStage) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const admittingSection = stage === 'admitted' ? conversionForm.section.trim() || 'A' : undefined;
      const updated = await updateAdmissionApplicantStage(applicant.id, {
        stage,
        section: admittingSection,
        note: admittingSection
          ? `School admissions desk admitted ${applicant.studentName} to section ${admittingSection}.`
          : `School admissions desk moved ${applicant.studentName} to ${formatApplicantStage(stage)}.`,
      });
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} moved to ${formatApplicantStage(updated.stage)}.`);
      if (stage === 'admitted') {
        await refreshCapacity(updated.sessionId);
      }
    } catch (stageError) {
      setApplicantMessage(stageError instanceof Error ? stageError.message : String(stageError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleUpdateFollowUp(applicant: AdmissionApplicant) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const updated = await updateAdmissionApplicantFollowUp(applicant.id, followUpForm);
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} follow-up was updated.`);
    } catch (followUpError) {
      setApplicantMessage(followUpError instanceof Error ? followUpError.message : String(followUpError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleIssueOffer(applicant: AdmissionApplicant) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const updated = await issueAdmissionApplicantOffer(applicant.id, offerForm);
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} admission offer was issued.`);
    } catch (offerError) {
      setApplicantMessage(offerError instanceof Error ? offerError.message : String(offerError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleAcceptOffer(applicant: AdmissionApplicant) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const updated = await acceptAdmissionApplicantOffer(applicant.id);
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} admission offer was accepted.`);
    } catch (offerError) {
      setApplicantMessage(offerError instanceof Error ? offerError.message : String(offerError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleSendGuardianCommunication(applicant: AdmissionApplicant) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const updated = await sendAdmissionGuardianCommunication(applicant.id, guardianCommunicationForm);
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} guardian communication was logged.`);
    } catch (communicationError) {
      setApplicantMessage(communicationError instanceof Error ? communicationError.message : String(communicationError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleRecordPayment(applicant: AdmissionApplicant) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const updated = await recordAdmissionApplicantPayment(applicant.id, paymentForm);
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} payment receipt was recorded.`);
    } catch (paymentError) {
      setApplicantMessage(paymentError instanceof Error ? paymentError.message : String(paymentError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleUpdateEnrollmentChecklist(applicant: AdmissionApplicant) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const updated = await updateAdmissionEnrollmentChecklist(applicant.id, enrollmentChecklistForm);
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} enrollment checklist was updated.`);
    } catch (checklistError) {
      setApplicantMessage(checklistError instanceof Error ? checklistError.message : String(checklistError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleVerifyDocument(applicant: AdmissionApplicant, documentKey: string) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const updated = await updateAdmissionApplicantDocument(applicant.id, documentKey, {
        status: 'verified',
        notes: 'Verified by the school admissions desk.',
      });
      setApplicants((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setApplicantMessage(`${updated.applicantNumber} document checklist updated.`);
    } catch (documentError) {
      setApplicantMessage(documentError instanceof Error ? documentError.message : String(documentError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  async function handleConvertApplicant(applicant: AdmissionApplicant) {
    setApplicantMessage('');
    setActioningApplicantId(applicant.id);

    try {
      const result = await convertAdmissionApplicantToStudent(applicant.id, buildConversionInput(applicant));
      setApplicants((current) => current.map((item) => (
        item.id === result.applicant.id ? result.applicant : item
      )));
      setApplicantMessage(`${result.applicant.applicantNumber} converted to student record ${result.student.id}.`);
      await refreshCapacity(result.applicant.sessionId);
    } catch (conversionError) {
      setApplicantMessage(conversionError instanceof Error ? conversionError.message : String(conversionError));
    } finally {
      setActioningApplicantId(null);
    }
  }

  function buildConversionInput(applicant: AdmissionApplicant): ConvertAdmissionApplicantInput {
    const nameParts = applicant.studentName.trim().split(/\s+/).filter(Boolean);
    const firstName = conversionForm.firstName.trim() || nameParts[0] || applicant.studentName;
    const lastName = conversionForm.lastName.trim() || nameParts.slice(1).join(' ') || 'Student';

    return {
      firstName,
      lastName,
      dateOfBirth: conversionForm.dateOfBirth,
      gender: conversionForm.gender,
      section: conversionForm.section.trim(),
      rollNumber: conversionForm.rollNumber.trim(),
      address: conversionForm.address.trim(),
      emergencyContact: conversionForm.emergencyContact?.trim() || applicant.guardian.phone,
      bloodGroup: conversionForm.bloodGroup?.trim() || undefined,
    };
  }

  return (
    <Shell
      eyebrow="Admission CRM"
      title="Admission session control"
      description="Create school admission windows, capture enquiries, and move applicants through document review."
    >
      {status === 'loading' ? <Notice tone="loading">Checking Admission CRM entitlement.</Notice> : null}
      {status === 'error' ? <Notice tone="error">{error}</Notice> : null}
      {service?.state === 'locked' ? (
        <Notice tone="error">{service.lockedReason ?? 'Admission CRM is locked for this school plan.'}</Notice>
      ) : null}
      {service?.state === 'enabled' ? (
        <div className="space-y-5">
          {analyticsStatus === 'loading' ? <Notice tone="loading">Loading admission analytics for the live dashboard.</Notice> : null}
          {analyticsStatus === 'error' ? <Notice tone="error">{analyticsError}</Notice> : null}
          {analytics ? (
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Tile
                label="Applicants"
                value={formatInteger(analytics.totals.applicants)}
                detail={`${formatInteger(analytics.totals.activeSessions)} active sessions across ${formatInteger(analytics.totals.sessions)} admission windows.`}
              />
              <Tile
                label="Ready to convert"
                value={formatInteger(analytics.totals.readyToConvert)}
                detail={`${formatInteger(analytics.totals.offersAccepted)} accepted offers, ${formatInteger(analytics.totals.paymentsRecorded)} payments recorded.`}
              />
              <Tile
                label="Follow-ups due"
                value={formatInteger(analytics.totals.dueFollowUps)}
                detail={`${formatInteger(analytics.totals.openFollowUps)} open follow-ups are still owned by the admissions desk.`}
              />
              <Tile
                label="Seats available"
                value={formatInteger(analytics.totals.seatsAvailable)}
                detail={`${formatInteger(analytics.totals.seatsOccupied)} occupied of ${formatInteger(analytics.totals.totalSeats)} configured admission seats.`}
              />
            </section>
          ) : null}
          {workQueueStatus === 'loading' ? <Notice tone="loading">Loading admission work queue.</Notice> : null}
          {workQueueStatus === 'error' ? <Notice tone="error">{workQueueError}</Notice> : null}
          {workQueue ? (
            <section className="rounded-[1.5rem] border border-emerald-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950">Admissions work queue</h2>
                  <p className="mt-1 text-sm text-slate-600">Open work items from follow-ups, document review, offers, payments, checklist readiness, and conversion.</p>
                </div>
                <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {workQueue.totalOpenItems} open
                </span>
              </div>
              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {workQueue.buckets.map((bucket) => (
                  <article key={bucket.kind} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-semibold text-slate-950">{bucket.label}</h3>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-700">{bucket.count}</span>
                    </div>
                    {bucket.items.length === 0 ? (
                      <p className="mt-4 text-sm leading-6 text-slate-500">No applicants in this queue.</p>
                    ) : (
                      <div className="mt-4 space-y-3">
                        {bucket.items.map((item) => (
                          <div key={`${bucket.kind}-${item.applicantId}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-950">{item.applicantNumber} | {item.studentName}</p>
                                <p className="mt-1 text-xs text-slate-600">{item.applyingGrade} | {formatApplicantStage(item.stage)}</p>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[0.68rem] font-bold uppercase tracking-[0.14em] text-emerald-700">
                                {item.priority}
                              </span>
                            </div>
                            <p className="mt-2 text-sm leading-5 text-slate-600">{item.detail}</p>
                            {item.dueAt ? <p className="mt-2 text-xs font-semibold text-amber-700">Due {formatShortDateTime(item.dueAt)}</p> : null}
                            <p className="mt-2 text-xs font-semibold text-slate-500">Next: {item.nextActionLabel}</p>
                            <button
                              type="button"
                              onClick={() => setSelectedSessionId(item.sessionId)}
                              className="mt-3 inline-flex rounded-full border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900"
                            >
                              Show in pipeline
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ) : null}
          <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <form onSubmit={handleSaveSession} className="rounded-[1.5rem] border border-emerald-200 bg-white p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label htmlFor="admission-name" className="mb-2 block text-sm font-semibold text-slate-700">Session name</label>
                  <input id="admission-name" value={form.name} onChange={(event) => updateForm('name', event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label htmlFor="admission-year" className="mb-2 block text-sm font-semibold text-slate-700">Academic year</label>
                  <input id="admission-year" value={form.academicYear} onChange={(event) => updateForm('academicYear', event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label htmlFor="admission-grade" className="mb-2 block text-sm font-semibold text-slate-700">Class open</label>
                  <input id="admission-grade" value={classGrade} onChange={(event) => setClassGrade(event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label htmlFor="admission-section" className="mb-2 block text-sm font-semibold text-slate-700">Section open</label>
                  <input id="admission-section" value={classSection} onChange={(event) => setClassSection(event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label htmlFor="admission-opens" className="mb-2 block text-sm font-semibold text-slate-700">Opens on</label>
                  <input id="admission-opens" type="date" value={form.opensAt} onChange={(event) => updateForm('opensAt', event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label htmlFor="admission-closes" className="mb-2 block text-sm font-semibold text-slate-700">Closes on</label>
                  <input id="admission-closes" type="date" value={form.closesAt} onChange={(event) => updateForm('closesAt', event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label htmlFor="admission-capacity" className="mb-2 block text-sm font-semibold text-slate-700">Seat capacity</label>
                  <input id="admission-capacity" type="number" min="1" value={classCapacity} onChange={(event) => setClassCapacity(event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div>
                  <label htmlFor="admission-fee-code" className="mb-2 block text-sm font-semibold text-slate-700">Fee plan code</label>
                  <input id="admission-fee-code" value={classFeePlanCode} onChange={(event) => setClassFeePlanCode(event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="admission-tags" className="mb-2 block text-sm font-semibold text-slate-700">Enquiry source tags</label>
                  <input id="admission-tags" value={sourceTags} onChange={(event) => setSourceTags(event.target.value)} className="w-full rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="admission-summary" className="mb-2 block text-sm font-semibold text-slate-700">Public summary</label>
                  <textarea id="admission-summary" value={form.publicSummary} onChange={(event) => updateForm('publicSummary', event.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-emerald-200 px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="submit" disabled={submitting} className="inline-flex flex-1 justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                  {submitting ? 'Saving...' : editingSessionId ? 'Save session changes' : 'Create admission session'}
                </button>
                {editingSessionId ? (
                  <button
                    type="button"
                    onClick={resetAdmissionSessionForm}
                    className="inline-flex justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
                  >
                    Cancel edit
                  </button>
                ) : null}
              </div>
              {message ? <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
            </form>

            <section className="rounded-[1.5rem] border border-emerald-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-950">Admission sessions</h2>
                <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                  {sessions.length} total
                </span>
              </div>
              {sessionsStatus === 'loading' ? <Notice tone="loading">Loading admission sessions.</Notice> : null}
              {sessionsStatus === 'error' ? <Notice tone="error">{sessionsError}</Notice> : null}
              {sessionsStatus === 'ready' && sessions.length === 0 ? (
                <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No admission sessions have been created yet.</p>
              ) : null}
              <div className="mt-5 space-y-3">
                {sessions.map((session) => (
                  <article key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{session.name}</p>
                        <p className="mt-1 text-xs text-slate-600">{session.academicYear} | {session.opensAt} to {session.closesAt}</p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">{formatAdmissionStatus(session.status)}</span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{session.publicSummary}</p>
                    {session.launchDenialReason ? (
                      <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                        Owner note: {session.launchDenialReason}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-slate-500">
                      {session.classes.map((item) => `${item.grade}: ${item.capacity} seats`).join(', ')}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {session.status === 'draft' || session.status === 'denied' ? (
                        <button
                          type="button"
                          onClick={() => handleEditSession(session)}
                          className="inline-flex rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-900"
                        >
                          {editingSessionId === session.id ? 'Editing' : 'Edit session'}
                        </button>
                      ) : null}
                      {session.status === 'draft' ? (
                        <button
                          type="button"
                          disabled={actioningSessionId === session.id}
                          onClick={() => void handleRequestLaunchApproval(session.id)}
                          className="inline-flex rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
                        >
                          {actioningSessionId === session.id ? 'Requesting...' : 'Request owner launch approval'}
                        </button>
                      ) : null}
                      {session.status === 'denied' ? (
                        <button
                          type="button"
                          disabled={actioningSessionId === session.id}
                          onClick={() => void handleReopenSession(session.id)}
                          className="inline-flex rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                        >
                          {actioningSessionId === session.id ? 'Reopening...' : 'Reopen for edits'}
                        </button>
                      ) : null}
                      {session.status === 'active' ? (
                        <button
                          type="button"
                          disabled={actioningSessionId === session.id}
                          onClick={() => void handleCloseSession(session.id)}
                          className="inline-flex rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-60"
                        >
                          {actioningSessionId === session.id ? 'Closing...' : 'Close intake'}
                        </button>
                      ) : null}
                    </div>
                    {session.launchApprovalId ? (
                      <p className="mt-3 text-xs font-semibold text-slate-500">Approval: {session.launchApprovalId}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            </section>
          </div>

          <section className="rounded-[1.5rem] border border-emerald-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Applicant pipeline</h2>
                <p className="mt-1 text-sm text-slate-600">Capture enquiries only after the owner-approved admission session is active.</p>
              </div>
              <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
                {visibleApplicants.length} visible
              </span>
            </div>
            {capacityStatus === 'loading' ? <Notice tone="loading">Checking live admission seat capacity.</Notice> : null}
            {capacityStatus === 'error' ? <Notice tone="error">{capacityError}</Notice> : null}
            {capacityCards.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {capacityCards.map((item) => (
                  <div key={`${item.grade}-${item.section}`} className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">{item.grade}-{item.section}</p>
                    <p className="mt-2 text-2xl font-semibold text-slate-950">{item.availableSeats}</p>
                    <p className="mt-1 text-xs text-slate-600">{item.occupiedCount} occupied of {item.capacity} seats</p>
                  </div>
                ))}
              </div>
            ) : null}
            {activeSessions.length === 0 ? (
              <Notice tone="info">No active admission session is ready for applicant capture.</Notice>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                <form onSubmit={handleCreateApplicant} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <label htmlFor="applicant-session" className="mb-2 block text-sm font-semibold text-slate-700">Active session</label>
                      <select id="applicant-session" value={applicantSessionId} onChange={(event) => setSelectedSessionId(event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
                        {activeSessions.map((session) => (
                          <option key={session.id} value={session.id}>{session.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="applicant-name" className="mb-2 block text-sm font-semibold text-slate-700">Student name</label>
                      <input id="applicant-name" value={applicantForm.studentName} onChange={(event) => updateApplicantField('studentName', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label htmlFor="applicant-grade" className="mb-2 block text-sm font-semibold text-slate-700">Applying class</label>
                      <input id="applicant-grade" value={applicantForm.applyingGrade} onChange={(event) => updateApplicantField('applyingGrade', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label htmlFor="guardian-name" className="mb-2 block text-sm font-semibold text-slate-700">Guardian name</label>
                      <input id="guardian-name" value={applicantForm.guardian.name} onChange={(event) => updateApplicantGuardian('name', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label htmlFor="guardian-phone" className="mb-2 block text-sm font-semibold text-slate-700">Guardian phone</label>
                      <input id="guardian-phone" value={applicantForm.guardian.phone} onChange={(event) => updateApplicantGuardian('phone', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label htmlFor="guardian-email" className="mb-2 block text-sm font-semibold text-slate-700">Guardian email</label>
                      <input id="guardian-email" value={applicantForm.guardian.email ?? ''} onChange={(event) => updateApplicantGuardian('email', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label htmlFor="source-tag" className="mb-2 block text-sm font-semibold text-slate-700">Source tag</label>
                      <input id="source-tag" value={applicantForm.sourceTag} onChange={(event) => updateApplicantField('sourceTag', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div>
                      <label htmlFor="guardian-relationship" className="mb-2 block text-sm font-semibold text-slate-700">Relationship</label>
                      <input id="guardian-relationship" value={applicantForm.guardian.relationship} onChange={(event) => updateApplicantGuardian('relationship', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                    <div className="md:col-span-2 xl:col-span-1">
                      <label htmlFor="enquiry-note" className="mb-2 block text-sm font-semibold text-slate-700">Enquiry note</label>
                      <textarea id="enquiry-note" value={applicantForm.enquiryNote} onChange={(event) => updateApplicantField('enquiryNote', event.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                    </div>
                  </div>
                  <button type="submit" disabled={submittingApplicant} className="mt-5 inline-flex w-full justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
                    {submittingApplicant ? 'Capturing...' : 'Capture enquiry'}
                  </button>
                  {applicantMessage ? <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{applicantMessage}</p> : null}
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <h3 className="text-sm font-semibold text-slate-950">Student conversion fields</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <label htmlFor="student-first-name" className="mb-2 block text-sm font-semibold text-slate-700">First name override</label>
                        <input id="student-first-name" value={conversionForm.firstName} onChange={(event) => updateConversionField('firstName', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="student-last-name" className="mb-2 block text-sm font-semibold text-slate-700">Last name override</label>
                        <input id="student-last-name" value={conversionForm.lastName} onChange={(event) => updateConversionField('lastName', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="student-dob" className="mb-2 block text-sm font-semibold text-slate-700">Date of birth</label>
                        <input id="student-dob" type="date" value={conversionForm.dateOfBirth} onChange={(event) => updateConversionField('dateOfBirth', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="student-gender" className="mb-2 block text-sm font-semibold text-slate-700">Gender</label>
                        <select id="student-gender" value={conversionForm.gender} onChange={(event) => updateConversionField('gender', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="student-section" className="mb-2 block text-sm font-semibold text-slate-700">Section</label>
                        <input id="student-section" value={conversionForm.section} onChange={(event) => updateConversionField('section', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="student-roll" className="mb-2 block text-sm font-semibold text-slate-700">Roll number</label>
                        <input id="student-roll" value={conversionForm.rollNumber} onChange={(event) => updateConversionField('rollNumber', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div className="md:col-span-2 xl:col-span-1">
                        <label htmlFor="student-address" className="mb-2 block text-sm font-semibold text-slate-700">Address</label>
                        <textarea id="student-address" value={conversionForm.address} onChange={(event) => updateConversionField('address', event.target.value)} rows={2} className="w-full resize-none rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <h3 className="text-sm font-semibold text-slate-950">Follow-up assignment</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <label htmlFor="follow-up-assignee" className="mb-2 block text-sm font-semibold text-slate-700">Assigned to</label>
                        <input id="follow-up-assignee" value={followUpForm.assignedTo ?? ''} onChange={(event) => updateFollowUpField('assignedTo', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="follow-up-at" className="mb-2 block text-sm font-semibold text-slate-700">Follow-up time</label>
                        <input id="follow-up-at" value={followUpForm.followUpAt ?? ''} onChange={(event) => updateFollowUpField('followUpAt', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="follow-up-priority" className="mb-2 block text-sm font-semibold text-slate-700">Priority</label>
                        <select id="follow-up-priority" value={followUpForm.priority ?? 'normal'} onChange={(event) => updateFollowUpField('priority', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
                          <option value="low">Low</option>
                          <option value="normal">Normal</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="follow-up-status" className="mb-2 block text-sm font-semibold text-slate-700">Status</label>
                        <select id="follow-up-status" value={followUpForm.status ?? 'open'} onChange={(event) => updateFollowUpField('status', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
                          <option value="open">Open</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 xl:col-span-1">
                        <label htmlFor="follow-up-note" className="mb-2 block text-sm font-semibold text-slate-700">Follow-up note</label>
                        <textarea id="follow-up-note" value={followUpForm.note ?? ''} onChange={(event) => updateFollowUpField('note', event.target.value)} rows={2} className="w-full resize-none rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <h3 className="text-sm font-semibold text-slate-950">Offer and guardian message</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <label htmlFor="offer-currency" className="mb-2 block text-sm font-semibold text-slate-700">Currency</label>
                        <input id="offer-currency" value={offerForm.feeQuote.currency} onChange={(event) => updateOfferField('currency', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="offer-due-date" className="mb-2 block text-sm font-semibold text-slate-700">Fee due date</label>
                        <input id="offer-due-date" type="date" value={offerForm.feeQuote.dueDate} onChange={(event) => updateOfferField('dueDate', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      {offerForm.feeQuote.lines.map((line, index) => (
                        <div key={line.code}>
                          <label htmlFor={`offer-line-${line.code}`} className="mb-2 block text-sm font-semibold text-slate-700">{line.label}</label>
                          <input id={`offer-line-${line.code}`} type="number" min="0" value={String(line.amount)} onChange={(event) => updateOfferLineAmount(index, event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                        </div>
                      ))}
                      <div>
                        <label htmlFor="offer-expires" className="mb-2 block text-sm font-semibold text-slate-700">Offer expires</label>
                        <input id="offer-expires" type="date" value={offerForm.letter.expiresAt} onChange={(event) => updateOfferField('expiresAt', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div className="md:col-span-2 xl:col-span-1">
                        <label htmlFor="offer-title" className="mb-2 block text-sm font-semibold text-slate-700">Offer title</label>
                        <input id="offer-title" value={offerForm.letter.title} onChange={(event) => updateOfferField('title', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div className="md:col-span-2 xl:col-span-1">
                        <label htmlFor="offer-body" className="mb-2 block text-sm font-semibold text-slate-700">Offer body</label>
                        <textarea id="offer-body" value={offerForm.letter.body} onChange={(event) => updateOfferField('body', event.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="guardian-message-channel" className="mb-2 block text-sm font-semibold text-slate-700">Message channel</label>
                        <select id="guardian-message-channel" value={guardianCommunicationForm.channel} onChange={(event) => updateGuardianCommunicationField('channel', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                          <option value="phone">Phone</option>
                          <option value="whatsapp">WhatsApp</option>
                          <option value="in_person">In person</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="guardian-message-subject" className="mb-2 block text-sm font-semibold text-slate-700">Message subject</label>
                        <input id="guardian-message-subject" value={guardianCommunicationForm.subject} onChange={(event) => updateGuardianCommunicationField('subject', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div className="md:col-span-2 xl:col-span-1">
                        <label htmlFor="guardian-message" className="mb-2 block text-sm font-semibold text-slate-700">Message</label>
                        <textarea id="guardian-message" value={guardianCommunicationForm.message} onChange={(event) => updateGuardianCommunicationField('message', event.target.value)} rows={2} className="w-full resize-none rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-slate-200 pt-5">
                    <h3 className="text-sm font-semibold text-slate-950">Payment and enrollment readiness</h3>
                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-1">
                      <div>
                        <label htmlFor="payment-amount" className="mb-2 block text-sm font-semibold text-slate-700">Payment amount</label>
                        <input id="payment-amount" type="number" min="1" value={String(paymentForm.amount)} onChange={(event) => updatePaymentField('amount', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="payment-currency" className="mb-2 block text-sm font-semibold text-slate-700">Payment currency</label>
                        <input id="payment-currency" value={paymentForm.currency} onChange={(event) => updatePaymentField('currency', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="payment-paid-at" className="mb-2 block text-sm font-semibold text-slate-700">Paid at</label>
                        <input id="payment-paid-at" value={paymentForm.paidAt} onChange={(event) => updatePaymentField('paidAt', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      <div>
                        <label htmlFor="payment-method" className="mb-2 block text-sm font-semibold text-slate-700">Payment method</label>
                        <select id="payment-method" value={paymentForm.method} onChange={(event) => updatePaymentField('method', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
                          <option value="upi">UPI</option>
                          <option value="cash">Cash</option>
                          <option value="bank_transfer">Bank transfer</option>
                          <option value="card">Card</option>
                          <option value="cheque">Cheque</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 xl:col-span-1">
                        <label htmlFor="payment-reference" className="mb-2 block text-sm font-semibold text-slate-700">Reference number</label>
                        <input id="payment-reference" value={paymentForm.referenceNumber ?? ''} onChange={(event) => updatePaymentField('referenceNumber', event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
                      </div>
                      {enrollmentChecklistForm.items.map((item, index) => (
                        <div key={item.key}>
                          <label htmlFor={`checklist-${item.key}`} className="mb-2 block text-sm font-semibold text-slate-700">{item.label}</label>
                          <select id={`checklist-${item.key}`} value={item.status} onChange={(event) => updateChecklistStatus(index, event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500">
                            <option value="pending">Pending</option>
                            <option value="complete">Complete</option>
                            <option value="waived">Waived</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </form>

                <div>
                  {applicantsStatus === 'loading' ? <Notice tone="loading">Loading applicant pipeline.</Notice> : null}
                  {applicantsStatus === 'error' ? <Notice tone="error">{applicantsError}</Notice> : null}
                  {applicantsStatus === 'ready' && visibleApplicants.length === 0 ? (
                    <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No applicants are captured for this admission session yet.</p>
                  ) : null}
                  <div className="space-y-3">
                    {visibleApplicants.map((applicant) => {
                      const nextAction = getNextApplicantAction(applicant.stage);
                      const nextDocument = applicant.documents.find((document) => document.status !== 'verified');
                      return (
                        <article key={applicant.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-slate-950">{applicant.applicantNumber} | {applicant.studentName}</p>
                              <p className="mt-1 text-xs text-slate-600">{applicant.applyingGrade} | {applicant.guardian.name} ({applicant.guardian.relationship})</p>
                            </div>
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">{formatApplicantStage(applicant.stage)}</span>
                          </div>
                          <p className="mt-3 text-sm text-slate-600">{applicant.enquiryNote}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {applicant.documents.map((document) => (
                              <span key={document.key} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                                {document.label}: {document.status}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-slate-600 md:grid-cols-2">
                            {applicant.assignedSection ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">Section: {applicant.assignedSection}</p>
                            ) : null}
                            {applicant.decision ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">Decision: {formatApplicantStage(applicant.decision.status)}</p>
                            ) : null}
                            {applicant.followUp ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                Follow-up: {applicant.followUp.status?.replace(/_/g, ' ') ?? 'open'} / {applicant.followUp.priority ?? 'normal'}
                              </p>
                            ) : null}
                            {applicant.feeQuote ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                Quote: {applicant.feeQuote.currency} {applicant.feeQuote.totalAmount.toLocaleString('en-IN')}
                              </p>
                            ) : null}
                            {applicant.offerLetter ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                Offer: {applicant.offerLetter.status} / expires {applicant.offerLetter.expiresAt}
                              </p>
                            ) : null}
                            {applicant.guardianCommunications?.length ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                Messages: {applicant.guardianCommunications.length}
                              </p>
                            ) : null}
                            {applicant.paymentReceipt ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                Paid: {applicant.paymentReceipt.currency} {applicant.paymentReceipt.amount.toLocaleString('en-IN')}
                              </p>
                            ) : null}
                            {applicant.enrollmentChecklist?.length ? (
                              <p className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                Checklist: {applicant.enrollmentChecklist.filter((item) => item.status !== 'pending').length}/{applicant.enrollmentChecklist.length}
                              </p>
                            ) : null}
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {nextAction ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleMoveApplicant(applicant, nextAction.stage)}
                                className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                              >
                                {nextAction.label}
                              </button>
                            ) : null}
                            {applicant.stage === 'ready_for_review' ? (
                              <>
                                <button
                                  type="button"
                                  disabled={actioningApplicantId === applicant.id}
                                  onClick={() => void handleMoveApplicant(applicant, 'waitlisted')}
                                  className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50 disabled:opacity-60"
                                >
                                  Waitlist
                                </button>
                                <button
                                  type="button"
                                  disabled={actioningApplicantId === applicant.id}
                                  onClick={() => void handleMoveApplicant(applicant, 'rejected')}
                                  className="rounded-full border border-rose-300 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                                >
                                  Reject
                                </button>
                              </>
                            ) : null}
                            {applicant.stage !== 'converted_to_student' && applicant.stage !== 'withdrawn' ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleUpdateFollowUp(applicant)}
                                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                              >
                                Update follow-up
                              </button>
                            ) : null}
                            {applicant.stage === 'admitted' && !applicant.offerLetter ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleIssueOffer(applicant)}
                                className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-60"
                              >
                                Issue offer
                              </button>
                            ) : null}
                            {applicant.offerLetter?.status === 'issued' ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleAcceptOffer(applicant)}
                                className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
                              >
                                Mark offer accepted
                              </button>
                            ) : null}
                            {applicant.stage !== 'converted_to_student' ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleSendGuardianCommunication(applicant)}
                                className="rounded-full border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-50 disabled:opacity-60"
                              >
                                Log guardian message
                              </button>
                            ) : null}
                            {applicant.offerLetter?.status === 'accepted' && !applicant.paymentReceipt ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleRecordPayment(applicant)}
                                className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:opacity-60"
                              >
                                Record payment
                              </button>
                            ) : null}
                            {applicant.offerLetter?.status === 'accepted' ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleUpdateEnrollmentChecklist(applicant)}
                                className="rounded-full border border-indigo-300 bg-white px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-60"
                              >
                                Update checklist
                              </button>
                            ) : null}
                            {nextDocument ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleVerifyDocument(applicant, nextDocument.key)}
                                className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-60"
                              >
                                Verify {nextDocument.label}
                              </button>
                            ) : null}
                            {applicant.stage === 'admitted' ? (
                              <button
                                type="button"
                                disabled={actioningApplicantId === applicant.id}
                                onClick={() => void handleConvertApplicant(applicant)}
                                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
                              >
                                Convert to student
                              </button>
                            ) : null}
                          </div>
                          {applicant.convertedStudentId ? (
                            <p className="mt-3 text-xs font-semibold text-emerald-700">Student record: {applicant.convertedStudentId}</p>
                          ) : null}
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </Shell>
  );
}

function formatAdmissionStatus(statusValue: AdmissionSession['status']) {
  return statusValue.replace(/_/g, ' ');
}

function formatInteger(value: number) {
  return new Intl.NumberFormat('en-IN').format(value);
}

function formatShortDateTime(value: string) {
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatApplicantStage(stage: AdmissionApplicantStage) {
  return stage.replace(/_/g, ' ');
}

function getNextApplicantAction(stage: AdmissionApplicantStage): { stage: AdmissionApplicantStage; label: string } | null {
  if (stage === 'new_enquiry') {
    return { stage: 'contacted', label: 'Mark contacted' };
  }
  if (stage === 'contacted') {
    return { stage: 'application_started', label: 'Start application' };
  }
  if (stage === 'application_started' || stage === 'documents_pending') {
    return { stage: 'ready_for_review', label: 'Ready for review' };
  }
  if (stage === 'ready_for_review') {
    return { stage: 'admitted', label: 'Admit applicant' };
  }
  if (stage === 'waitlisted') {
    return { stage: 'admitted', label: 'Admit from waitlist' };
  }
  return null;
}

function ServicePlaceholderPage({
  serviceKey,
  fallbackTitle,
}: {
  serviceKey: SchoolServiceKey;
  fallbackTitle: string;
}) {
  return <ServiceWorkbenchPage serviceKey={serviceKey} fallbackTitle={fallbackTitle} />;
}

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | StudentAdmissionSourceType>('all');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [allocationSection, setAllocationSection] = useState('');
  const [allocationRollNumber, setAllocationRollNumber] = useState('');
  const [actionStatus, setActionStatus] = useState<'idle' | 'saving'>('idle');
  const [message, setMessage] = useState('');
  const selectedStudent = students.find((student) => student.id === selectedStudentId) ?? students[0] ?? null;
  const admissionStudents = students.filter((student) => student.admissionSourceType === 'admission_crm').length;
  const directStudents = students.filter((student) => student.admissionSourceType !== 'admission_crm').length;

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');

    requestStudents(sourceFilter === 'all' ? undefined : sourceFilter)
      .then((items) => {
        if (!cancelled) {
          setStudents(items);
          const firstStudent = items[0];
          setSelectedStudentId((current) => (
            items.some((student) => student.id === current) ? current : firstStudent?.id ?? ''
          ));
          setAllocationSection((current) => current || firstStudent?.section || '');
          setAllocationRollNumber((current) => current || firstStudent?.rollNumber || '');
          setStatus('ready');
        }
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [sourceFilter]);

  useEffect(() => {
    if (selectedStudent) {
      setAllocationSection(selectedStudent.section);
      setAllocationRollNumber(selectedStudent.rollNumber);
    }
  }, [selectedStudent?.id, selectedStudent?.section, selectedStudent?.rollNumber]);

  async function handleAllocationSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedStudent) {
      return;
    }

    setActionStatus('saving');
    setMessage('');

    try {
      const updated = await updateStudent(selectedStudent.id, {
        section: allocationSection.trim(),
        rollNumber: allocationRollNumber.trim(),
      });
      setStudents((current) => current.map((student) => (
        student.id === updated.id ? updated : student
      )));
      setMessage(`${updated.firstName} ${updated.lastName} moved to ${updated.grade}-${updated.section} with roll ${updated.rollNumber}.`);
    } catch (allocationError) {
      setMessage(allocationError instanceof Error ? allocationError.message : String(allocationError));
    } finally {
      setActionStatus('idle');
    }
  }

  return (
    <Shell
      eyebrow="Student records"
      title="Student roster operations"
      description="Review converted admissions, guardian linkage, and section allocation from the tenant student record."
    >
      <section className="grid gap-4 lg:grid-cols-3">
        <FocusCard title="Roster size" status={`${students.length}`} detail="Active student records returned by the current filter." />
        <FocusCard title="Admission source" status={`${admissionStudents}`} detail="Students converted from the Admission CRM applicant pipeline." />
        <FocusCard title="Direct entries" status={`${directStudents}`} detail="Student records created outside the admission conversion workflow." />
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
        <form onSubmit={handleAllocationSubmit} className="rounded-[1.5rem] border border-emerald-200 bg-white p-5">
          <div className="grid gap-4">
            <div>
              <label htmlFor="student-source-filter" className="mb-2 block text-sm font-semibold text-slate-700">Admission source filter</label>
              <select
                id="student-source-filter"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value as 'all' | StudentAdmissionSourceType)}
                className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                <option value="all">All active students</option>
                <option value="admission_crm">Admission CRM conversions</option>
                <option value="direct">Direct student entries</option>
              </select>
            </div>

            <div>
              <label htmlFor="student-select" className="mb-2 block text-sm font-semibold text-slate-700">Student allocation</label>
              <select
                id="student-select"
                value={selectedStudent?.id ?? ''}
                onChange={(event) => setSelectedStudentId(event.target.value)}
                className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500"
              >
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.firstName} {student.lastName} | {student.grade}-{student.section} | {student.rollNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <label htmlFor="student-section" className="mb-2 block text-sm font-semibold text-slate-700">Section</label>
                <input id="student-section" value={allocationSection} onChange={(event) => setAllocationSection(event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label htmlFor="student-roll-number" className="mb-2 block text-sm font-semibold text-slate-700">Roll number</label>
                <input id="student-roll-number" value={allocationRollNumber} onChange={(event) => setAllocationRollNumber(event.target.value)} className="w-full rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500" />
              </div>
            </div>
          </div>
          <button
            type="submit"
            disabled={!selectedStudent || actionStatus === 'saving'}
            className="mt-5 inline-flex w-full justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {actionStatus === 'saving' ? 'Saving allocation...' : 'Update section allocation'}
          </button>
          {message ? <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
        </form>

        <section className="rounded-[1.5rem] border border-emerald-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-slate-950">Roster records</h2>
            <span className="rounded-full border border-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700">
              {sourceFilter.replace(/_/g, ' ')}
            </span>
          </div>
          {status === 'loading' ? <Notice tone="loading">Loading student records.</Notice> : null}
          {status === 'error' ? <Notice tone="error">{error}</Notice> : null}
          {status === 'ready' && students.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">No student records match this filter.</p>
          ) : null}
          <div className="mt-5 space-y-3">
            {students.map((student) => (
              <article key={student.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{student.firstName} {student.lastName}</p>
                    <p className="mt-1 text-xs text-slate-600">{student.grade}-{student.section} | Roll {student.rollNumber}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-slate-700">
                    {(student.admissionSourceType ?? 'direct').replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  Guardian: {student.guardianProfile?.name ?? student.parentName}
                  {student.guardianProfile?.relationship ? ` (${student.guardianProfile.relationship})` : ''}
                  {' | '}
                  {student.guardianProfile?.phone ?? student.parentPhone}
                </p>
                {student.admissionSource?.type === 'admission_crm' ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    Admission: {student.admissionSource.applicantNumber} | {student.admissionSource.sessionName}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
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
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/academics" element={<AcademicsPage />} />
            <Route path="/transport" element={<TransportPage />} />
            <Route path="/fees" element={<FeeCollectionPage />} />
            <Route path="/admissions" element={<AdmissionCrmPage />} />
            {placeholderServiceRoutes.map((service) => (
              <Route
                key={service.key}
                path={service.route}
                element={<ServicePlaceholderPage serviceKey={service.key} fallbackTitle={service.name} />}
              />
            ))}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </SchoolAuthProvider>
  );
}
