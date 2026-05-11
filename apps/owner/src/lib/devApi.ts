import type {
  ApiResponse,
  Approval,
  ApprovalStatus,
  AuditAction,
  AuditLog,
  Employee,
  OwnerDashboard,
  OwnerDashboardActivityItem,
  OwnerDashboardAlert,
  OwnerDashboardActivityTone,
  OwnerDashboardSchoolItem,
  OwnerDashboardStatus,
  OwnerSecurityActionCount,
  OwnerSecurityCenter,
  OwnerSecurityFinding,
  OwnerSecurityTimelineItem,
  PlatformAuthUser,
  UpdateSchoolServicePlanInput,
  UpdateEmployeeInput,
} from '@school-erp/shared';

interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  bearerToken?: string;
  body?: unknown;
  params?: Record<string, string | undefined>;
  expectEmpty?: boolean;
}

interface OwnerLocalDataState {
  employees: Employee[];
  approvals: Approval[];
  schools: OwnerDashboardSchoolItem[];
  auditLogs: AuditLog[];
}

const DEV_OWNER_EMAIL = (import.meta.env.VITE_DEV_OWNER_EMAIL ?? 'owner.local@shardaos.internal').toLowerCase();
const OWNER_STATE_STORAGE_KEY = 'shardaos-owner-app-local-data';
const OWNER_UID = import.meta.env.VITE_DEV_OWNER_UID ?? 'owner-local-bootstrap';
const DEV_BASIC_SERVICE_KEYS = [
  'student_records',
  'attendance',
  'academics',
  'homework',
  'lesson_plans',
  'academic_calendar',
  'notice_board',
] as const;
const DEV_ADVANCED_SERVICE_KEYS = [
  ...DEV_BASIC_SERVICE_KEYS,
  'transport',
  'fee_collection',
  'parent_portal',
  'communications',
  'analytics',
  'school_staff',
  'payroll',
  'library',
  'inventory',
  'online_exam',
  'report_cards',
  'admission_crm',
  'accounting',
  'website_manager',
  'e_content',
  'certificates',
] as const;

function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function getDevEnabledServiceCount(servicePlanTier: 'basic' | 'advanced', configuredKeys?: unknown[]) {
  const allowedKeys = servicePlanTier === 'advanced' ? DEV_ADVANCED_SERVICE_KEYS : DEV_BASIC_SERVICE_KEYS;
  const allowed = new Set<string>(allowedKeys);
  const configured = Array.isArray(configuredKeys)
    ? configuredKeys.filter((key): key is string => typeof key === 'string' && allowed.has(key))
    : [];

  return configured.length > 0 ? configured.length : allowedKeys.length;
}

function createOwnerProfile(): PlatformAuthUser {
  return {
    uid: OWNER_UID,
    email: DEV_OWNER_EMAIL,
    role: 'owner',
    plane: 'platform',
  };
}

function createSeedState(): OwnerLocalDataState {
  return {
    employees: [
      {
        id: 'emp-ops-1',
        uid: 'uid-ops-1',
        email: 'aarav@shardaos.internal',
        displayName: 'Aarav Singh',
        role: 'employee',
        department: 'Operations',
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        authProviderDisabled: false,
        platformAccessActive: true,
        lastLoginAt: hoursAgo(6),
        lastSyncedAt: hoursAgo(2),
        createdAt: daysAgo(40),
        updatedAt: hoursAgo(2),
        onboardedBy: OWNER_UID,
      },
      {
        id: 'emp-fin-1',
        uid: 'uid-fin-1',
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
        lastSyncedAt: hoursAgo(3),
        createdAt: daysAgo(18),
        updatedAt: hoursAgo(3),
        onboardedBy: OWNER_UID,
      },
      {
        id: 'emp-eng-1',
        uid: 'uid-eng-1',
        email: 'rohan@shardaos.internal',
        displayName: 'Rohan Das',
        role: 'employee',
        department: 'Engineering',
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        authProviderDisabled: false,
        platformAccessActive: true,
        lastLoginAt: daysAgo(19),
        lastSyncedAt: hoursAgo(5),
        createdAt: daysAgo(52),
        updatedAt: hoursAgo(5),
        onboardedBy: OWNER_UID,
      },
      {
        id: 'emp-sup-1',
        uid: 'uid-sup-1',
        email: 'meera@shardaos.internal',
        displayName: 'Meera Sharma',
        role: 'employee',
        department: 'Support',
        isActive: false,
        emailVerified: false,
        mfaEnabled: false,
        authProviderDisabled: true,
        platformAccessActive: false,
        lastLoginAt: daysAgo(31),
        lastSyncedAt: daysAgo(2),
        createdAt: daysAgo(68),
        updatedAt: daysAgo(2),
        onboardedBy: OWNER_UID,
      },
    ],
    approvals: [
      {
        id: 'approval-admission-riverdale',
        type: 'admission_launch',
        status: 'pending',
        requestedBy: 'school-user-riverdale',
        requestedByEmail: 'admissions@riverdale.school',
        title: 'Launch admissions for 2026 Primary intake',
        description: '2026-27 • 2 classes • school-riverdale',
        metadata: {
          schoolId: 'school-riverdale',
          sessionId: 'admission-session-riverdale',
          sessionName: '2026 Primary intake',
          academicYear: '2026-27',
          classesOpen: ['Nursery', 'KG'],
        },
        createdAt: hoursAgo(12),
        updatedAt: hoursAgo(12),
      },
      {
        id: 'approval-school-riverdale',
        type: 'school_onboarding',
        status: 'pending',
        requestedBy: 'uid-ops-1',
        requestedByEmail: 'aarav@shardaos.internal',
        title: 'Riverdale onboarding release',
        description: 'Approve Riverdale for full activation on the owner plane.',
        metadata: { schoolId: 'school-riverdale' },
        createdAt: hoursAgo(10),
        updatedAt: hoursAgo(10),
      },
      {
        id: 'approval-school-north',
        type: 'school_suspension',
        status: 'pending',
        requestedBy: 'uid-ops-1',
        requestedByEmail: 'aarav@shardaos.internal',
        title: 'North Campus commercial review',
        description: 'Review the stale operating signals before finance escalation.',
        metadata: { schoolId: 'school-north' },
        createdAt: hoursAgo(8),
        updatedAt: hoursAgo(8),
      },
      {
        id: 'approval-employee-finance',
        type: 'employee_onboarding',
        status: 'pending',
        requestedBy: 'uid-fin-1',
        requestedByEmail: 'neha@shardaos.internal',
        title: 'Finance analyst activation',
        description: 'Approve the next finance operator for portfolio expansion coverage.',
        metadata: { department: 'Finance' },
        createdAt: hoursAgo(5),
        updatedAt: hoursAgo(5),
      },
      {
        id: 'approval-exam-1',
        type: 'exam_schedule',
        status: 'approved',
        requestedBy: 'uid-eng-1',
        requestedByEmail: 'rohan@shardaos.internal',
        approvedBy: OWNER_UID,
        title: 'Exam schedule release',
        description: 'Published after owner review.',
        metadata: { schoolId: 'school-greenwood' },
        createdAt: daysAgo(1),
        updatedAt: hoursAgo(20),
      },
    ],
    schools: [
      {
        schoolId: 'school-north',
        name: 'North Campus',
        code: 'NC01',
        city: 'Patna',
        state: 'Bihar',
        servicePlanTier: 'basic',
        enabledServiceCount: getDevEnabledServiceCount('basic'),
        status: 'watch',
        isActive: true,
        studentCount: 1230,
        pendingApprovals: 1,
        lastAttendanceRecordedAt: daysAgo(2),
        lastGradePublishedAt: daysAgo(18),
        lastEnrollmentAt: daysAgo(5),
        attentionReason: 'Attendance and grading signals have drifted beyond the finance comfort window.',
      },
      {
        schoolId: 'school-riverdale',
        name: 'Riverdale Public School',
        code: 'RV11',
        city: 'Patna',
        state: 'Bihar',
        servicePlanTier: 'advanced',
        enabledServiceCount: getDevEnabledServiceCount('advanced'),
        status: 'onboarding',
        isActive: true,
        studentCount: 800,
        pendingApprovals: 1,
        lastAttendanceRecordedAt: null,
        lastGradePublishedAt: null,
        lastEnrollmentAt: daysAgo(4),
        attentionReason: 'Owner approval is still required before the school is treated as a healthy live account.',
      },
      {
        schoolId: 'school-greenwood',
        name: 'Greenwood Academy',
        code: 'GW07',
        city: 'Ranchi',
        state: 'Jharkhand',
        servicePlanTier: 'advanced',
        enabledServiceCount: getDevEnabledServiceCount('advanced'),
        status: 'healthy',
        isActive: true,
        studentCount: 980,
        pendingApprovals: 0,
        lastAttendanceRecordedAt: hoursAgo(8),
        lastGradePublishedAt: daysAgo(3),
        lastEnrollmentAt: daysAgo(6),
        attentionReason: 'Commercial and operational reporting are currently within expected ranges.',
      },
      {
        schoolId: 'school-legacy',
        name: 'Legacy Academy',
        code: 'LG09',
        city: 'Gaya',
        state: 'Bihar',
        servicePlanTier: 'basic',
        enabledServiceCount: getDevEnabledServiceCount('basic'),
        status: 'inactive',
        isActive: false,
        studentCount: 0,
        pendingApprovals: 0,
        lastAttendanceRecordedAt: null,
        lastGradePublishedAt: null,
        lastEnrollmentAt: null,
        attentionReason: 'This account is inactive and outside the live commercial portfolio.',
      },
    ],
    auditLogs: [
      {
        id: 'audit-1',
        action: 'SETTINGS_CHANGED',
        performedBy: OWNER_UID,
        performedByEmail: DEV_OWNER_EMAIL,
        performedByRole: 'owner',
        targetType: 'settings',
        targetId: 'platform',
        metadata: { area: 'security' },
        ipAddress: '127.0.0.1',
        userAgent: 'local-dev',
        timestamp: hoursAgo(2),
      },
      {
        id: 'audit-2',
        action: 'APPROVAL_GRANTED',
        performedBy: OWNER_UID,
        performedByEmail: DEV_OWNER_EMAIL,
        performedByRole: 'owner',
        targetType: 'school',
        targetId: 'school-greenwood',
        metadata: { approvalId: 'approval-exam-1' },
        ipAddress: '127.0.0.1',
        userAgent: 'local-dev',
        timestamp: hoursAgo(20),
      },
      {
        id: 'audit-3',
        action: 'EMPLOYEE_DEACTIVATED',
        performedBy: OWNER_UID,
        performedByEmail: DEV_OWNER_EMAIL,
        performedByRole: 'owner',
        targetType: 'employee',
        targetId: 'emp-sup-1',
        metadata: { department: 'Support' },
        ipAddress: '127.0.0.1',
        userAgent: 'local-dev',
        timestamp: daysAgo(2),
      },
    ],
  };
}

function cloneState(state: OwnerLocalDataState): OwnerLocalDataState {
  return JSON.parse(JSON.stringify(state)) as OwnerLocalDataState;
}

function readLocalState(): OwnerLocalDataState {
  const raw = window.localStorage.getItem(OWNER_STATE_STORAGE_KEY);
  if (!raw) {
    const seeded = createSeedState();
    window.localStorage.setItem(OWNER_STATE_STORAGE_KEY, JSON.stringify(seeded));
    return cloneState(seeded);
  }

  try {
    return JSON.parse(raw) as OwnerLocalDataState;
  } catch {
    const seeded = createSeedState();
    window.localStorage.setItem(OWNER_STATE_STORAGE_KEY, JSON.stringify(seeded));
    return cloneState(seeded);
  }
}

function persistLocalState(state: OwnerLocalDataState) {
  window.localStorage.setItem(OWNER_STATE_STORAGE_KEY, JSON.stringify(state));
}

function createApiEnvelope<T>(data: T): ApiResponse<T> {
  return { success: true, data };
}

function requiresOwnerReview(employee: Employee) {
  if (!employee.isActive) {
    return true;
  }

  if (!employee.platformAccessActive || employee.authProviderDisabled) {
    return true;
  }

  if (!employee.emailVerified || !employee.mfaEnabled) {
    return true;
  }

  return !employee.lastLoginAt;
}

function getReviewReasons(employee: Employee): string[] {
  const reasons: string[] = [];

  if (!employee.isActive) {
    reasons.push('Record is inactive');
  }

  if (!employee.platformAccessActive) {
    reasons.push('Platform access is disabled');
  }

  if (employee.authProviderDisabled) {
    reasons.push('Identity access is disabled');
  }

  if (!employee.emailVerified) {
    reasons.push('Email is unverified');
  }

  if (!employee.mfaEnabled) {
    reasons.push('MFA is not enabled');
  }

  if (!employee.lastLoginAt) {
    reasons.push('No login has been recorded yet');
  }

  return reasons;
}

function isWithinLast24Hours(value: string) {
  return new Date(value).getTime() >= Date.now() - 24 * 60 * 60 * 1000;
}

function isToday(value: string) {
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear()
    && date.getMonth() === now.getMonth()
    && date.getDate() === now.getDate()
  );
}

function resolveQueueStatus(pendingCount: number): OwnerDashboardStatus {
  if (pendingCount >= 3) {
    return 'critical';
  }

  if (pendingCount > 0) {
    return 'watch';
  }

  return 'stable';
}

function resolveActivityTone(action: AuditAction): OwnerDashboardActivityTone {
  if (action === 'APPROVAL_GRANTED' || action === 'EMPLOYEE_REACTIVATED' || action === 'EMPLOYEE_CREATED') {
    return 'positive';
  }

  if (
    action === 'APPROVAL_DENIED'
    || action === 'EMPLOYEE_DEACTIVATED'
    || action === 'SCHOOL_ONBOARDING_REQUESTED'
    || action === 'SETTINGS_CHANGED'
  ) {
    return 'warning';
  }

  return 'neutral';
}

function formatActionTitle(action: AuditAction, targetId?: string) {
  switch (action) {
    case 'APPROVAL_GRANTED':
      return 'Owner approved a blocked action';
    case 'APPROVAL_DENIED':
      return 'Owner denied a pending action';
    case 'EMPLOYEE_CREATED':
      return 'Platform employee added';
    case 'EMPLOYEE_UPDATED':
      return 'Platform employee updated';
    case 'EMPLOYEE_DEACTIVATED':
      return 'Platform employee deactivated';
    case 'EMPLOYEE_REACTIVATED':
      return 'Platform employee reactivated';
    case 'SCHOOL_ONBOARDING_REQUESTED':
      return 'School onboarding requested';
    case 'SCHOOL_ONBOARDED':
      return 'School onboarded';
    case 'SETTINGS_CHANGED':
      return 'Platform settings changed';
    default:
      return targetId ? `${action} on ${targetId}` : action;
  }
}

function formatActionDetail(action: AuditAction, targetId?: string) {
  switch (action) {
    case 'APPROVAL_GRANTED':
      return 'A pending owner-plane blocker was resolved.';
    case 'APPROVAL_DENIED':
      return 'A pending owner-plane request was denied and requires follow-through.';
    case 'EMPLOYEE_CREATED':
      return 'A new employee record was added to the owner plane.';
    case 'EMPLOYEE_UPDATED':
      return 'An employee record was updated in the owner plane.';
    case 'EMPLOYEE_DEACTIVATED':
      return 'Platform access was disabled for an employee record.';
    case 'EMPLOYEE_REACTIVATED':
      return 'Platform access was restored for an employee record.';
    case 'SCHOOL_ONBOARDING_REQUESTED':
      return 'A platform employee requested owner approval for a new school.';
    case 'SCHOOL_ONBOARDED':
      return 'A school was activated after owner approval.';
    case 'SETTINGS_CHANGED':
      return 'Sensitive owner-plane settings were changed.';
    default:
      return targetId ? `Owner-plane action executed for ${targetId}.` : 'Owner-plane action executed.';
  }
}

function appendAuditLog(
  state: OwnerLocalDataState,
  action: AuditAction,
  targetType?: AuditLog['targetType'],
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  state.auditLogs.unshift({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    performedBy: OWNER_UID,
    performedByEmail: DEV_OWNER_EMAIL,
    performedByRole: 'owner',
    targetType,
    targetId,
    metadata,
    ipAddress: '127.0.0.1',
    userAgent: 'owner-app-local-fallback',
    timestamp: new Date().toISOString(),
  });
}

function buildDashboard(state: OwnerLocalDataState): OwnerDashboard {
  const owner = createOwnerProfile();
  const employees = [...state.employees].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const approvals = [...state.approvals].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const schools = [...state.schools].sort((left, right) => right.studentCount - left.studentCount);
  const activeEmployees = employees.filter((employee) => employee.isActive);
  const inactiveEmployees = employees.filter((employee) => !employee.isActive);
  const mfaEnabledEmployees = activeEmployees.filter((employee) => employee.mfaEnabled).length;
  const staleLogins = activeEmployees.filter((employee) => employee.lastLoginAt && new Date(employee.lastLoginAt).getTime() < Date.now() - 14 * 24 * 60 * 60 * 1000).length;
  const neverLoggedIn = activeEmployees.filter((employee) => !employee.lastLoginAt).length;
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');
  const approvedToday = approvals.filter((approval) => approval.status === 'approved' && isToday(approval.updatedAt)).length;
  const deniedToday = approvals.filter((approval) => approval.status === 'denied' && isToday(approval.updatedAt)).length;
  const schoolRisks = schools.filter((school) => school.status !== 'healthy' && school.isActive);

  const departments = new Map<string, { total: number; active: number; inactive: number }>();
  for (const employee of employees) {
    const current = departments.get(employee.department) ?? { total: 0, active: 0, inactive: 0 };
    current.total += 1;
    if (employee.isActive) {
      current.active += 1;
    } else {
      current.inactive += 1;
    }
    departments.set(employee.department, current);
  }

  const alerts: OwnerDashboardAlert[] = [];
  if (pendingApprovals.length > 0) {
    alerts.push({
      id: 'pending-approvals',
      severity: pendingApprovals.length >= 3 ? 'critical' : 'warning',
      title: 'Owner approvals are blocking portfolio flow',
      detail: `${pendingApprovals.length} requests still need owner action.`,
      href: '/owner/approvals',
      actionLabel: 'Resolve approvals',
    });
  }

  if (schoolRisks.length > 0) {
    alerts.push({
      id: 'school-risk',
      severity: schoolRisks.length >= 2 ? 'warning' : 'info',
      title: 'Schools need finance-facing attention',
      detail: `${schoolRisks.length} active schools are outside the healthy commercial lane.`,
      href: '/owner/schools',
      actionLabel: 'Inspect school risk',
    });
  }

  if (activeEmployees.length > 0 && mfaEnabledEmployees < activeEmployees.length) {
    alerts.push({
      id: 'mfa-coverage',
      severity: 'warning',
      title: 'Platform MFA coverage is incomplete',
      detail: `${activeEmployees.length - mfaEnabledEmployees} active employees still need MFA coverage.`,
      href: '/owner/security',
      actionLabel: 'Review security',
    });
  }

  const recentActivity: OwnerDashboardActivityItem[] = state.auditLogs
    .slice()
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .slice(0, 5)
    .map((log) => ({
      id: log.id,
      tone: resolveActivityTone(log.action),
      title: formatActionTitle(log.action, log.targetId),
      detail: formatActionDetail(log.action, log.targetId),
      occurredAt: log.timestamp,
      href:
        log.targetType === 'employee'
          ? '/owner/employees'
          : log.targetType === 'school'
            ? '/owner/schools'
            : log.action.startsWith('APPROVAL')
              ? '/owner/approvals'
              : '/owner/security',
    }));

  return {
    generatedAt: new Date().toISOString(),
    owner,
    overview: {
      pendingApprovals: pendingApprovals.length,
      approvalsResolvedToday: approvedToday + deniedToday,
      activeEmployees: activeEmployees.length,
      inactiveEmployees: inactiveEmployees.length,
      mfaCoveragePercent: activeEmployees.length === 0 ? 0 : Math.round((mfaEnabledEmployees / activeEmployees.length) * 100),
      staleLogins: staleLogins + neverLoggedIn,
      overallStatus: schoolRisks.length > 1 || pendingApprovals.length > 2 ? 'critical' : schoolRisks.length > 0 || pendingApprovals.length > 0 ? 'watch' : 'stable',
    },
    alerts,
    workforce: {
      totalEmployees: employees.length,
      activeEmployees: activeEmployees.length,
      inactiveEmployees: inactiveEmployees.length,
      mfaEnabledEmployees,
      mfaCoveragePercent: activeEmployees.length === 0 ? 0 : Math.round((mfaEnabledEmployees / activeEmployees.length) * 100),
      staleLogins,
      neverLoggedIn,
      departments: [...departments.entries()]
        .map(([department, counts]) => ({
          department,
          total: counts.total,
          active: counts.active,
          inactive: counts.inactive,
        }))
        .sort((left, right) => right.total - left.total || left.department.localeCompare(right.department)),
      recentHires: employees.slice(0, 5),
    },
    approvals: {
      pendingCount: pendingApprovals.length,
      approvedToday,
      deniedToday,
      queueStatus: resolveQueueStatus(pendingApprovals.length),
      oldestPendingCreatedAt: pendingApprovals.length > 0 ? pendingApprovals[pendingApprovals.length - 1].createdAt : null,
      priorityQueue: pendingApprovals.slice(0, 5),
    },
    schoolOperations: {
      totalSchools: schools.length,
      activeSchools: schools.filter((school) => school.isActive).length,
      inactiveSchools: schools.filter((school) => !school.isActive).length,
      onboardingRiskCount: schools.filter((school) => school.status === 'onboarding').length,
      exceptionCount: schoolRisks.length,
      schools,
      topRisks: schoolRisks.slice(0, 5),
    },
    recentActivity,
  };
}

function buildSecurity(state: OwnerLocalDataState): OwnerSecurityCenter {
  const owner = createOwnerProfile();
  const accessReviewQueue = state.employees
    .filter((employee) => requiresOwnerReview(employee))
    .map((employee) => ({
      employeeId: employee.id,
      uid: employee.uid,
      displayName: employee.displayName,
      email: employee.email,
      department: employee.department,
      reasons: getReviewReasons(employee),
      isActive: employee.isActive,
      emailVerified: employee.emailVerified,
      mfaEnabled: employee.mfaEnabled,
      authProviderDisabled: employee.authProviderDisabled,
      platformAccessActive: employee.platformAccessActive,
      lastLoginAt: employee.lastLoginAt,
      lastSyncedAt: employee.lastSyncedAt,
    }));

  const auditLogs24h = state.auditLogs.filter((log) => isWithinLast24Hours(log.timestamp));
  const actionCountsMap = new Map<AuditAction, number>();
  for (const log of auditLogs24h) {
    actionCountsMap.set(log.action, (actionCountsMap.get(log.action) ?? 0) + 1);
  }

  const actionCounts: OwnerSecurityActionCount[] = [...actionCountsMap.entries()]
    .map(([action, count]) => ({ action, count }))
    .sort((left, right) => right.count - left.count || left.action.localeCompare(right.action));

  const timeline: OwnerSecurityTimelineItem[] = state.auditLogs
    .slice()
    .sort((left, right) => right.timestamp.localeCompare(left.timestamp))
    .map((log) => ({
      id: log.id,
      action: log.action,
      tone: resolveActivityTone(log.action),
      title: formatActionTitle(log.action, log.targetId),
      detail: formatActionDetail(log.action, log.targetId),
      performedByEmail: log.performedByEmail,
      performedByRole: log.performedByRole,
      targetType: log.targetType,
      targetId: log.targetId,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      metadata: log.metadata,
    }));

  const findings: OwnerSecurityFinding[] = [];
  const disabledIdentities = state.employees.filter((employee) => employee.authProviderDisabled).length;
  const employeesNeedingReview = accessReviewQueue.length;

  if (disabledIdentities > 0) {
    findings.push({
      id: 'disabled-identities',
      severity: 'critical',
      title: 'Platform identities are disabled in the local owner plane',
      detail: `${disabledIdentities} employee identities are disabled and need review.`,
      href: '/owner/security',
      actionLabel: 'Open review queue',
    });
  }

  if (employeesNeedingReview > 0) {
    findings.push({
      id: 'review-queue',
      severity: 'warning',
      title: 'Employees still need access review',
      detail: `${employeesNeedingReview} employee records still have unresolved security or access flags.`,
      href: '/owner/employees',
      actionLabel: 'Review employees',
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    owner,
    overview: {
      privilegedActions24h: auditLogs24h.length,
      riskyEvents24h: auditLogs24h.filter((log) => log.action === 'SETTINGS_CHANGED' || log.action === 'APPROVAL_DENIED').length,
      uniqueActors24h: new Set(auditLogs24h.map((log) => log.performedBy)).size,
      uniqueIpAddresses24h: new Set(auditLogs24h.map((log) => log.ipAddress)).size,
      employeesNeedingReview,
      disabledIdentities,
      mfaCoveragePercent:
        state.employees.filter((employee) => employee.isActive).length === 0
          ? 0
          : Math.round(
              (state.employees.filter((employee) => employee.isActive && employee.mfaEnabled).length
                / state.employees.filter((employee) => employee.isActive).length) * 100,
            ),
    },
    findings,
    actionCounts,
    accessReviewQueue,
    priorityEvents: timeline.slice(0, 5),
    auditTimeline: timeline,
  };
}

function parseEmployeeId(pathname: string) {
  const match = pathname.match(/^\/api\/owner\/employees\/([^/]+)(?:\/(activate|sync))?$/);
  if (!match) {
    return null;
  }

  return { employeeId: match[1], action: match[2] };
}

function parseApprovalAction(pathname: string) {
  const match = pathname.match(/^\/api\/owner\/approvals\/([^/]+)\/(approve|deny)$/);
  if (!match) {
    return null;
  }

  return { approvalId: match[1], action: match[2] };
}

function parseSchoolServicePlan(pathname: string) {
  const match = pathname.match(/^\/api\/owner\/schools\/([^/]+)\/service-plan$/);
  if (!match) {
    return null;
  }

  return { schoolId: match[1] };
}

function createEmployee(state: OwnerLocalDataState, body: unknown) {
  const input = body as { uid?: string; email?: string; displayName?: string; department?: string };
  const timestamp = new Date().toISOString();
  const employee: Employee = {
    id: `emp-${Date.now()}`,
    uid: input.uid ?? `uid-${Date.now()}`,
    email: (input.email ?? '').trim().toLowerCase(),
    displayName: input.displayName ?? 'New Employee',
    role: 'employee',
    department: input.department ?? 'Operations',
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    authProviderDisabled: false,
    platformAccessActive: true,
    lastLoginAt: '',
    lastSyncedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    onboardedBy: OWNER_UID,
  };

  state.employees.unshift(employee);
  appendAuditLog(state, 'EMPLOYEE_CREATED', 'employee', employee.id, { uid: employee.uid, department: employee.department });
  persistLocalState(state);
  return employee;
}

function updateEmployee(state: OwnerLocalDataState, employeeId: string, body: unknown) {
  const input = body as UpdateEmployeeInput;
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  if (typeof input.displayName === 'string' && input.displayName.trim().length > 0) {
    employee.displayName = input.displayName.trim();
  }

  if (typeof input.department === 'string' && input.department.trim().length > 0) {
    employee.department = input.department.trim();
  }

  employee.updatedAt = new Date().toISOString();
  appendAuditLog(state, 'EMPLOYEE_UPDATED', 'employee', employee.id, { department: employee.department });
  persistLocalState(state);
  return employee;
}

function deactivateEmployee(state: OwnerLocalDataState, employeeId: string) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  employee.isActive = false;
  employee.platformAccessActive = false;
  employee.updatedAt = new Date().toISOString();
  appendAuditLog(state, 'EMPLOYEE_DEACTIVATED', 'employee', employee.id);
  persistLocalState(state);
}

function activateEmployee(state: OwnerLocalDataState, employeeId: string) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  employee.isActive = true;
  employee.platformAccessActive = true;
  employee.authProviderDisabled = false;
  employee.updatedAt = new Date().toISOString();
  appendAuditLog(state, 'EMPLOYEE_REACTIVATED', 'employee', employee.id);
  persistLocalState(state);
}

function syncEmployee(state: OwnerLocalDataState, employeeId: string) {
  const employee = state.employees.find((item) => item.id === employeeId);
  if (!employee) {
    throw new Error('Employee not found');
  }

  employee.lastSyncedAt = new Date().toISOString();
  employee.emailVerified = true;
  employee.authProviderDisabled = false;
  employee.updatedAt = employee.lastSyncedAt;
  appendAuditLog(state, 'SETTINGS_CHANGED', 'employee', employee.id, { sync: true });
  persistLocalState(state);
  return employee;
}

function updateSchoolServicePlan(state: OwnerLocalDataState, schoolId: string, body: unknown) {
  const input = body as UpdateSchoolServicePlanInput;
  const school = state.schools.find((item) => item.schoolId === schoolId);
  if (!school) {
    throw new Error('School not found');
  }

  const servicePlanTier = input.servicePlanTier === 'advanced' ? 'advanced' : 'basic';
  school.servicePlanTier = servicePlanTier;
  school.enabledServiceCount = getDevEnabledServiceCount(servicePlanTier, input.enabledServiceKeys);

  appendAuditLog(state, 'SETTINGS_CHANGED', 'school', school.schoolId, {
    servicePlanTier,
    enabledServiceCount: school.enabledServiceCount,
  });
  persistLocalState(state);
  return school;
}

function decideApproval(state: OwnerLocalDataState, approvalId: string, status: ApprovalStatus, body?: unknown) {
  const approval = state.approvals.find((item) => item.id === approvalId);
  if (!approval) {
    throw new Error('Approval not found');
  }

  const input = body as { decisionNote?: string } | undefined;
  const decisionNote = input?.decisionNote?.trim();
  approval.status = status;
  approval.approvedBy = OWNER_UID;
  approval.decisionNote = decisionNote || undefined;
  approval.updatedAt = new Date().toISOString();

  const schoolId = typeof approval.metadata?.schoolId === 'string' ? approval.metadata.schoolId : undefined;
  if (schoolId) {
    const school = state.schools.find((item) => item.schoolId === schoolId);
    if (school) {
      school.pendingApprovals = Math.max(0, school.pendingApprovals - 1);
      if (approval.type === 'school_onboarding' && status === 'approved') {
        school.status = 'healthy';
        school.attentionReason = 'Owner approval landed and the school can now operate as a healthy live account.';
        school.lastAttendanceRecordedAt = hoursAgo(12);
        school.lastGradePublishedAt = daysAgo(2);
      }

      if (approval.type === 'school_onboarding' && status === 'denied') {
        school.status = 'watch';
        school.attentionReason = 'Owner denied the latest onboarding release; finance follow-through is required.';
      }
    }
  }

  appendAuditLog(
    state,
    status === 'approved' ? 'APPROVAL_GRANTED' : 'APPROVAL_DENIED',
    schoolId ? 'school' : undefined,
    schoolId,
    { approvalId, decisionNote: approval.decisionNote },
  );
  persistLocalState(state);
  return approval;
}

function isLocalOwnerRoute(path: string) {
  return path.startsWith('/api/owner/') || path === '/api/auth/owner/session' || path === '/api/auth/session';
}

export function shouldUseLocalOwnerFallback(path: string, status?: number) {
  if (!import.meta.env.DEV || !isLocalOwnerRoute(path)) {
    return false;
  }

  if (status === undefined) {
    return true;
  }

  return status >= 500 || status === 404;
}

export function handleLocalOwnerRequest<T>(path: string, options: ApiRequestOptions = {}): T {
  const url = new URL(path, 'http://localhost');
  const pathname = url.pathname;
  const method = options.method ?? 'GET';
  const state = readLocalState();

  if (pathname === '/api/auth/owner/session' && method === 'GET') {
    return createOwnerProfile() as T;
  }

  if (pathname === '/api/auth/session' && method === 'GET') {
    return createOwnerProfile() as T;
  }

  if (pathname === '/api/owner/owner/dashboard' && method === 'GET') {
    return buildDashboard(state) as T;
  }

  if (pathname === '/api/owner/owner/security' && method === 'GET') {
    return buildSecurity(state) as T;
  }

  if (pathname === '/api/owner/employees' && method === 'GET') {
    return [...state.employees].sort((left, right) => right.createdAt.localeCompare(left.createdAt)) as T;
  }

  if (pathname === '/api/owner/employees' && method === 'POST') {
    return createEmployee(state, options.body) as T;
  }

  const employeeMatch = parseEmployeeId(pathname);
  if (employeeMatch && method === 'PATCH') {
    return updateEmployee(state, employeeMatch.employeeId, options.body) as T;
  }

  if (employeeMatch && method === 'DELETE' && !employeeMatch.action) {
    deactivateEmployee(state, employeeMatch.employeeId);
    return undefined as T;
  }

  if (employeeMatch?.action === 'activate' && method === 'POST') {
    activateEmployee(state, employeeMatch.employeeId);
    return undefined as T;
  }

  if (employeeMatch?.action === 'sync' && method === 'POST') {
    return syncEmployee(state, employeeMatch.employeeId) as T;
  }

  if (pathname === '/api/owner/approvals' && method === 'GET') {
    const status = url.searchParams.get('status');
    const approvals =
      status && status !== 'all'
        ? state.approvals.filter((approval) => approval.status === status)
        : state.approvals;
    return approvals.slice().sort((left, right) => right.createdAt.localeCompare(left.createdAt)) as T;
  }

  const approvalMatch = parseApprovalAction(pathname);
  if (approvalMatch && method === 'POST') {
    return decideApproval(
      state,
      approvalMatch.approvalId,
      approvalMatch.action === 'approve' ? 'approved' : 'denied',
      options.body,
    ) as T;
  }

  const schoolServicePlanMatch = parseSchoolServicePlan(pathname);
  if (schoolServicePlanMatch && method === 'PATCH') {
    return updateSchoolServicePlan(state, schoolServicePlanMatch.schoolId, options.body) as T;
  }

  throw new Error(`No local owner fallback exists for ${method} ${pathname}`);
}

export function createLocalOwnerApiResponse<T>(path: string, options: ApiRequestOptions = {}): ApiResponse<T> {
  return createApiEnvelope(handleLocalOwnerRequest<T>(path, options));
}
