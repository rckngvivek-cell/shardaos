import type { PlatformAuthUser, PlatformRole } from './user.js';
import type { SchoolServicePlanTier } from './school.js';

// ── Employee (onboarded by Owner) ──

export interface Employee {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  department: string;
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  authProviderDisabled: boolean;
  platformAccessActive: boolean;
  lastLoginAt: string;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
  onboardedBy: string; // uid of the owner who approved
}

export interface CreateEmployeeInput {
  uid: string;
  email: string;
  displayName: string;
  department: string;
}

export interface UpdateEmployeeInput {
  displayName?: string;
  department?: string;
}

// ── Audit Log (every owner/employee action is recorded) ──

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_UPDATED'
  | 'EMPLOYEE_DEACTIVATED'
  | 'EMPLOYEE_REACTIVATED'
  | 'SCHOOL_ONBOARDING_REQUESTED'
  | 'SCHOOL_ONBOARDED'
  | 'SCHOOL_SUSPENDED'
  | 'APPROVAL_GRANTED'
  | 'APPROVAL_DENIED'
  | 'SETTINGS_CHANGED'
  | 'EXAM_SCHEDULED';

export interface AuditLog {
  id: string;
  action: AuditAction;
  performedBy: string; // uid
  performedByEmail: string;
  performedByRole: PlatformRole;
  targetType?: 'employee' | 'school' | 'exam' | 'settings';
  targetId?: string;
  metadata?: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
}

// ── Approval (owner approves critical actions) ──

export type ApprovalStatus = 'pending' | 'approved' | 'denied';

export interface Approval {
  id: string;
  type: 'school_onboarding' | 'employee_onboarding' | 'school_suspension' | 'exam_schedule' | 'admission_launch';
  status: ApprovalStatus;
  requestedBy: string; // employee uid
  requestedByEmail: string;
  approvedBy?: string; // owner uid
  title: string;
  description: string;
  decisionNote?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalDecisionInput {
  decisionNote?: string;
}

// ── Owner dashboard aggregate contract ──

export type OwnerDashboardStatus = 'stable' | 'watch' | 'critical';
export type OwnerDashboardAlertSeverity = 'info' | 'warning' | 'critical';
export type OwnerDashboardActivityTone = 'positive' | 'neutral' | 'warning';

export interface OwnerDashboardOverview {
  pendingApprovals: number;
  approvalsResolvedToday: number;
  activeEmployees: number;
  inactiveEmployees: number;
  mfaCoveragePercent: number;
  staleLogins: number;
  overallStatus: OwnerDashboardStatus;
}

export interface OwnerDashboardAlert {
  id: string;
  severity: OwnerDashboardAlertSeverity;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
}

export interface OwnerDashboardDepartmentLoad {
  department: string;
  total: number;
  active: number;
  inactive: number;
}

export interface OwnerDashboardActivityItem {
  id: string;
  tone: OwnerDashboardActivityTone;
  title: string;
  detail: string;
  occurredAt: string;
  href: string;
}

export interface OwnerDashboardWorkforce {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  mfaEnabledEmployees: number;
  mfaCoveragePercent: number;
  staleLogins: number;
  neverLoggedIn: number;
  departments: OwnerDashboardDepartmentLoad[];
  recentHires: Employee[];
}

export interface OwnerDashboardApprovals {
  pendingCount: number;
  approvedToday: number;
  deniedToday: number;
  queueStatus: OwnerDashboardStatus;
  oldestPendingCreatedAt: string | null;
  priorityQueue: Approval[];
}

export type OwnerDashboardSchoolStatus = 'healthy' | 'watch' | 'onboarding' | 'inactive';

export interface OwnerDashboardSchoolItem {
  schoolId: string;
  name: string;
  code: string;
  city: string;
  state: string;
  servicePlanTier: SchoolServicePlanTier;
  enabledServiceCount: number;
  status: OwnerDashboardSchoolStatus;
  isActive: boolean;
  studentCount: number;
  pendingApprovals: number;
  lastAttendanceRecordedAt: string | null;
  lastGradePublishedAt: string | null;
  lastEnrollmentAt: string | null;
  attentionReason: string;
}

export interface OwnerDashboardSchoolOperations {
  totalSchools: number;
  activeSchools: number;
  inactiveSchools: number;
  onboardingRiskCount: number;
  exceptionCount: number;
  schools: OwnerDashboardSchoolItem[];
  topRisks: OwnerDashboardSchoolItem[];
}

export interface OwnerDashboard {
  generatedAt: string;
  owner: PlatformAuthUser;
  overview: OwnerDashboardOverview;
  alerts: OwnerDashboardAlert[];
  workforce: OwnerDashboardWorkforce;
  approvals: OwnerDashboardApprovals;
  schoolOperations: OwnerDashboardSchoolOperations;
  recentActivity: OwnerDashboardActivityItem[];
}

// ── Owner security center contract ──

export interface OwnerSecurityOverview {
  privilegedActions24h: number;
  riskyEvents24h: number;
  uniqueActors24h: number;
  uniqueIpAddresses24h: number;
  employeesNeedingReview: number;
  disabledIdentities: number;
  mfaCoveragePercent: number;
}

export interface OwnerSecurityFinding {
  id: string;
  severity: OwnerDashboardAlertSeverity;
  title: string;
  detail: string;
  href: string;
  actionLabel: string;
}

export interface OwnerSecurityAccessReviewItem {
  employeeId: string;
  uid: string;
  displayName: string;
  email: string;
  department: string;
  reasons: string[];
  isActive: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  authProviderDisabled: boolean;
  platformAccessActive: boolean;
  lastLoginAt: string;
  lastSyncedAt: string;
}

export interface OwnerSecurityActionCount {
  action: AuditAction;
  count: number;
}

export interface OwnerSecurityTimelineItem {
  id: string;
  action: AuditAction;
  tone: OwnerDashboardActivityTone;
  title: string;
  detail: string;
  performedByEmail: string;
  performedByRole: PlatformRole;
  targetType?: AuditLog['targetType'];
  targetId?: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  metadata?: Record<string, unknown>;
}

export interface OwnerSecurityCenter {
  generatedAt: string;
  owner: PlatformAuthUser;
  overview: OwnerSecurityOverview;
  findings: OwnerSecurityFinding[];
  actionCounts: OwnerSecurityActionCount[];
  accessReviewQueue: OwnerSecurityAccessReviewItem[];
  priorityEvents: OwnerSecurityTimelineItem[];
  auditTimeline: OwnerSecurityTimelineItem[];
}
