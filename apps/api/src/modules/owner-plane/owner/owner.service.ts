import type {
  AuditAction,
  AuditLog,
  Approval,
  Employee,
  OwnerDashboard,
  OwnerDashboardActivityItem,
  OwnerDashboardAlert,
  OwnerDashboardApprovals,
  OwnerDashboardOverview,
  OwnerDashboardSchoolItem,
  OwnerDashboardSchoolOperations,
  OwnerDashboardStatus,
  OwnerDashboardWorkforce,
  OwnerSecurityAccessReviewItem,
  OwnerSecurityActionCount,
  OwnerSecurityCenter,
  OwnerSecurityFinding,
  OwnerSecurityOverview,
  OwnerSecurityTimelineItem,
  PlatformAuthUser,
  School,
} from '@school-erp/shared';
import { EmployeeService } from '../employees/employee.service.js';
import { ApprovalService } from '../approvals/approval.service.js';
import { SchoolRepository } from '../../schools/school.repository.js';
import { StudentRepository } from '../../students/student.repository.js';
import { AttendanceRepository } from '../../attendance/attendance.repository.js';
import { GradesRepository } from '../../grades/grades.repository.js';
import { AuditLogRepository } from './audit-log.repository.js';

const SCHOOL_ATTENDANCE_RISK_DAYS = 3;
const SCHOOL_GRADES_RISK_DAYS = 21;
const SCHOOL_ONBOARDING_WINDOW_DAYS = 14;
const SECURITY_LOOKBACK_HOURS = 24;

export interface OwnerSummary {
  pendingApprovals: number;
  activeEmployees: number;
  generatedAt: string;
}

export class OwnerService {
  private employeeService = new EmployeeService();
  private approvalService = new ApprovalService();
  private schoolRepository = new SchoolRepository();
  private studentRepository = new StudentRepository();
  private attendanceRepository = new AttendanceRepository();
  private gradesRepository = new GradesRepository();
  private auditLogRepository = new AuditLogRepository();

  getProfile(platformUser: PlatformAuthUser): PlatformAuthUser {
    return platformUser;
  }

  async getSummary(): Promise<OwnerSummary> {
    const [pendingApprovals, activeEmployees] = await Promise.all([
      this.approvalService.countPending(),
      this.employeeService.countActive(),
    ]);

    return {
      pendingApprovals,
      activeEmployees,
      generatedAt: new Date().toISOString(),
    };
  }

  async getDashboard(platformUser: PlatformAuthUser): Promise<OwnerDashboard> {
    const [employees, approvals, schools] = await Promise.all([
      this.employeeService.list(),
      this.approvalService.list(),
      this.schoolRepository.findAll(),
    ]);

    const generatedAt = new Date().toISOString();
    const workforce = this.buildWorkforce(employees);
    const approvalsSnapshot = this.buildApprovalsSnapshot(approvals);
    const schoolOperations = await this.buildSchoolOperations(schools, approvals);
    const overview = this.buildOverview(workforce, approvalsSnapshot, schoolOperations);

    return {
      generatedAt,
      owner: platformUser,
      overview,
      alerts: this.buildAlerts(workforce, approvalsSnapshot, schoolOperations),
      workforce,
      approvals: approvalsSnapshot,
      schoolOperations,
      recentActivity: this.buildRecentActivity(employees, approvals),
    };
  }

  async getSecurityCenter(platformUser: PlatformAuthUser): Promise<OwnerSecurityCenter> {
    const generatedAt = new Date().toISOString();
    const sinceIso = new Date(Date.now() - SECURITY_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

    const [employees, recentAuditLogs, auditLogs24h] = await Promise.all([
      this.employeeService.list(),
      this.auditLogRepository.listRecent(),
      this.auditLogRepository.listSince(sinceIso),
    ]);

    const accessReviewQueue = this.buildSecurityAccessReview(employees);
    const actionCounts = this.buildSecurityActionCounts(auditLogs24h);
    const overview = this.buildSecurityOverview(employees, accessReviewQueue, auditLogs24h);

    return {
      generatedAt,
      owner: platformUser,
      overview,
      findings: this.buildSecurityFindings(overview, accessReviewQueue, auditLogs24h, actionCounts),
      actionCounts,
      accessReviewQueue,
      priorityEvents: this.buildSecurityPriorityEvents(recentAuditLogs),
      auditTimeline: this.buildSecurityTimeline(recentAuditLogs),
    };
  }

  private buildOverview(
    workforce: OwnerDashboardWorkforce,
    approvals: OwnerDashboardApprovals,
    schoolOperations: OwnerDashboardSchoolOperations,
  ): OwnerDashboardOverview {
    return {
      pendingApprovals: approvals.pendingCount,
      approvalsResolvedToday: approvals.approvedToday + approvals.deniedToday,
      activeEmployees: workforce.activeEmployees,
      inactiveEmployees: workforce.inactiveEmployees,
      mfaCoveragePercent: workforce.mfaCoveragePercent,
      staleLogins: workforce.staleLogins + workforce.neverLoggedIn,
      overallStatus: this.resolveOverallStatus(workforce, approvals, schoolOperations),
    };
  }

  private buildWorkforce(employees: Employee[]): OwnerDashboardWorkforce {
    const departments = new Map<string, { total: number; active: number; inactive: number }>();
    let activeEmployees = 0;
    let inactiveEmployees = 0;
    let mfaEnabledEmployees = 0;
    let staleLogins = 0;
    let neverLoggedIn = 0;

    for (const employee of employees) {
      const departmentKey = employee.department || 'Unassigned';
      const department = departments.get(departmentKey) ?? { total: 0, active: 0, inactive: 0 };
      department.total += 1;

      if (employee.isActive) {
        activeEmployees += 1;
        department.active += 1;
      } else {
        inactiveEmployees += 1;
        department.inactive += 1;
      }

      if (employee.mfaEnabled) {
        mfaEnabledEmployees += 1;
      }

      if (!employee.lastLoginAt) {
        neverLoggedIn += 1;
      } else if (this.isOlderThanDays(employee.lastLoginAt, 14)) {
        staleLogins += 1;
      }

      departments.set(departmentKey, department);
    }

    const totalEmployees = employees.length;
    const coverageBase = activeEmployees || totalEmployees;

    return {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      mfaEnabledEmployees,
      mfaCoveragePercent: coverageBase === 0 ? 0 : Math.round((mfaEnabledEmployees / coverageBase) * 100),
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
      recentHires: [...employees]
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 5),
    };
  }

  private buildApprovalsSnapshot(approvals: Approval[]): OwnerDashboardApprovals {
    const pendingQueue = approvals.filter((approval) => approval.status === 'pending');
    const approvedToday = approvals.filter(
      (approval) => approval.status === 'approved' && this.isToday(approval.updatedAt),
    ).length;
    const deniedToday = approvals.filter(
      (approval) => approval.status === 'denied' && this.isToday(approval.updatedAt),
    ).length;

    return {
      pendingCount: pendingQueue.length,
      approvedToday,
      deniedToday,
      queueStatus: this.resolveQueueStatus(pendingQueue.length),
      oldestPendingCreatedAt: pendingQueue.length
        ? pendingQueue.reduce((oldest, approval) =>
            approval.createdAt < oldest ? approval.createdAt : oldest,
          pendingQueue[0].createdAt)
        : null,
      priorityQueue: pendingQueue.slice(0, 5),
    };
  }

  private buildAlerts(
    workforce: OwnerDashboardWorkforce,
    approvals: OwnerDashboardApprovals,
    schoolOperations: OwnerDashboardSchoolOperations,
  ): OwnerDashboardAlert[] {
    const alerts: OwnerDashboardAlert[] = [];

    // Thresholds are intentionally explicit so queue pressure stays predictable for operators.
    if (approvals.pendingCount >= 5) {
      alerts.push({
        id: 'approval-queue-critical',
        severity: 'critical',
        title: 'Approval queue needs attention',
        detail: `${approvals.pendingCount} requests are waiting for an owner decision.`,
        href: '/owner/approvals',
        actionLabel: 'Review approvals',
      });
    } else if (approvals.pendingCount > 0) {
      alerts.push({
        id: 'approval-queue-watch',
        severity: 'warning',
        title: 'Approval queue is active',
        detail: `${approvals.pendingCount} pending requests are still open.`,
        href: '/owner/approvals',
        actionLabel: 'Open queue',
      });
    }

    const staleCoverage = workforce.staleLogins + workforce.neverLoggedIn;
    if (staleCoverage > 0) {
      alerts.push({
        id: 'workforce-stale-access',
        severity: 'warning',
        title: 'Employee access posture is drifting',
        detail: `${staleCoverage} employees need a login or access review.`,
        href: '/owner/employees',
        actionLabel: 'Inspect workforce',
      });
    }

    if (workforce.totalEmployees > 0 && workforce.mfaCoveragePercent < 100) {
      alerts.push({
        id: 'workforce-mfa-gap',
        severity: 'info',
        title: 'MFA coverage is incomplete',
        detail: `${workforce.mfaCoveragePercent}% of current staff are marked as MFA-enabled.`,
        href: '/owner/employees',
        actionLabel: 'Review employee access',
      });
    }

    if (schoolOperations.onboardingRiskCount > 0) {
      alerts.push({
        id: 'school-onboarding-risk',
        severity: 'warning',
        title: 'School onboarding still needs follow-through',
        detail: `${schoolOperations.onboardingRiskCount} schools are in onboarding risk or awaiting first operational activity.`,
        href: '/owner/schools',
        actionLabel: 'Inspect school health',
      });
    }

    if (schoolOperations.exceptionCount > 0) {
      alerts.push({
        id: 'school-ops-exceptions',
        severity: schoolOperations.exceptionCount >= 3 ? 'critical' : 'warning',
        title: 'School operations need attention',
        detail: `${schoolOperations.exceptionCount} schools show stale attendance, grading, or approval-driven exceptions.`,
        href: '/owner/schools',
        actionLabel: 'Open exception queue',
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        id: 'ops-clear',
        severity: 'info',
        title: 'Operations are stable',
        detail: 'No queue pressure or access drift is currently detected.',
        href: '/owner',
        actionLabel: 'Stay on dashboard',
      });
    }

    return alerts.slice(0, 4);
  }

  private async buildSchoolOperations(
    schools: School[],
    approvals: Approval[],
  ): Promise<OwnerDashboardSchoolOperations> {
    // School health is derived from live student, attendance, and grading activity
    // so the owner dashboard reflects operational reality instead of static flags.
    const schoolItems = await Promise.all(
      schools.map((school) => this.buildSchoolHealthItem(school, approvals)),
    );

    const orderedSchools = [...schoolItems].sort(
      (left, right) =>
        this.schoolStatusWeight(right.status) - this.schoolStatusWeight(left.status) ||
        left.name.localeCompare(right.name),
    );

    return {
      totalSchools: orderedSchools.length,
      activeSchools: orderedSchools.filter((school) => school.isActive).length,
      inactiveSchools: orderedSchools.filter((school) => school.status === 'inactive').length,
      onboardingRiskCount: orderedSchools.filter((school) => school.status === 'onboarding').length,
      exceptionCount: orderedSchools.filter((school) => school.status === 'watch').length,
      schools: orderedSchools,
      topRisks: orderedSchools
        .filter((school) => school.status !== 'healthy')
        .slice(0, 5),
    };
  }

  private async buildSchoolHealthItem(
    school: School,
    approvals: Approval[],
  ): Promise<OwnerDashboardSchoolItem> {
    const relatedApprovals = approvals.filter(
      (approval) =>
        approval.status === 'pending' &&
        this.extractSchoolIdFromMetadata(approval.metadata) === school.id,
    );

    const [studentCount, lastEnrollmentAt, lastAttendanceRecordedAt, lastGradePublishedAt] = await Promise.all([
      this.studentRepository.countActive(school.id),
      this.studentRepository.getLatestEnrollmentAt(school.id),
      this.attendanceRepository.getLatestRecordedAt(school.id),
      this.gradesRepository.getLatestPublishedAt(school.id),
    ]);

    const { status, attentionReason } = this.resolveSchoolHealthStatus({
      school,
      studentCount,
      relatedApprovals,
      lastEnrollmentAt,
      lastAttendanceRecordedAt,
      lastGradePublishedAt,
    });

    return {
      schoolId: school.id,
      name: school.name,
      code: school.code,
      city: school.city,
      state: school.state,
      status,
      isActive: school.isActive,
      studentCount,
      pendingApprovals: relatedApprovals.length,
      lastAttendanceRecordedAt,
      lastGradePublishedAt,
      lastEnrollmentAt,
      attentionReason,
    };
  }

  private buildRecentActivity(
    employees: Employee[],
    approvals: Approval[],
  ): OwnerDashboardActivityItem[] {
    const employeeEvents: OwnerDashboardActivityItem[] = employees.map((employee) => ({
      id: `employee-${employee.id}`,
      tone: employee.isActive ? 'positive' : 'warning',
      title: `${employee.displayName} joined the platform team`,
      detail: `${employee.department} • ${employee.email}`,
      occurredAt: employee.createdAt,
      href: '/owner/employees',
    }));

    const approvalEvents: OwnerDashboardActivityItem[] = approvals.map((approval) => {
      if (approval.status === 'pending') {
        return {
          id: `approval-pending-${approval.id}`,
          tone: 'warning',
          title: approval.title,
          detail: `Waiting for decision from ${approval.requestedByEmail}`,
          occurredAt: approval.createdAt,
          href: '/owner/approvals',
        };
      }

      return {
        id: `approval-${approval.status}-${approval.id}`,
        tone: approval.status === 'approved' ? 'positive' : 'neutral',
        title: approval.title,
        detail: `${approval.status} request from ${approval.requestedByEmail}`,
        occurredAt: approval.updatedAt,
        href: '/owner/approvals',
      };
    });

    return [...employeeEvents, ...approvalEvents]
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, 8);
  }

  private buildSecurityOverview(
    employees: Employee[],
    accessReviewQueue: OwnerSecurityAccessReviewItem[],
    auditLogs24h: AuditLog[],
  ): OwnerSecurityOverview {
    const activeEmployees = employees.filter((employee) => employee.isActive).length;
    const mfaEnabledEmployees = employees.filter((employee) => employee.isActive && employee.mfaEnabled).length;
    const actorKeys = new Set(auditLogs24h.map((entry) => entry.performedBy));
    const ipKeys = new Set(auditLogs24h.map((entry) => entry.ipAddress).filter(Boolean));

    return {
      privilegedActions24h: auditLogs24h.filter((entry) => this.isPrivilegedAuditAction(entry.action)).length,
      riskyEvents24h: auditLogs24h.filter((entry) => this.isRiskAuditAction(entry.action)).length,
      uniqueActors24h: actorKeys.size,
      uniqueIpAddresses24h: ipKeys.size,
      employeesNeedingReview: accessReviewQueue.length,
      disabledIdentities: accessReviewQueue.filter((item) => item.authProviderDisabled).length,
      mfaCoveragePercent: activeEmployees === 0 ? 0 : Math.round((mfaEnabledEmployees / activeEmployees) * 100),
    };
  }

  private buildSecurityFindings(
    overview: OwnerSecurityOverview,
    accessReviewQueue: OwnerSecurityAccessReviewItem[],
    auditLogs24h: AuditLog[],
    actionCounts: OwnerSecurityActionCount[],
  ): OwnerSecurityFinding[] {
    const findings: OwnerSecurityFinding[] = [];
    const settingsChanges = actionCounts.find((entry) => entry.action === 'SETTINGS_CHANGED')?.count ?? 0;
    const accessDisabledCount = accessReviewQueue.filter(
      (item) => !item.platformAccessActive || item.authProviderDisabled,
    ).length;

    if (overview.disabledIdentities > 0) {
      findings.push({
        id: 'disabled-identities',
        severity: 'critical',
        title: 'Platform identities are disabled',
        detail: `${overview.disabledIdentities} employee identities are disabled and need owner review before platform access can resume.`,
        href: '/owner/security',
        actionLabel: 'Open review queue',
      });
    }

    if (accessDisabledCount > 0) {
      findings.push({
        id: 'access-drift',
        severity: 'warning',
        title: 'Platform access is out of policy for part of the workforce',
        detail: `${accessDisabledCount} employee records have platform access disabled or blocked by identity state.`,
        href: '/owner/employees',
        actionLabel: 'Inspect employee access',
      });
    }

    if (overview.employeesNeedingReview > 0 && overview.mfaCoveragePercent < 100) {
      findings.push({
        id: 'mfa-gaps',
        severity: 'warning',
        title: 'MFA coverage is incomplete',
        detail: `${overview.mfaCoveragePercent}% of active platform employees are marked as MFA-enabled.`,
        href: '/owner/employees',
        actionLabel: 'Review workforce posture',
      });
    }

    if (settingsChanges > 0) {
      findings.push({
        id: 'recent-settings-change',
        severity: 'info',
        title: 'Privileged configuration changed recently',
        detail: `${settingsChanges} settings change events were recorded in the last ${SECURITY_LOOKBACK_HOURS} hours.`,
        href: '/owner/security',
        actionLabel: 'Inspect audit timeline',
      });
    }

    if (overview.uniqueIpAddresses24h > 1) {
      findings.push({
        id: 'multi-ip-admin-footprint',
        severity: 'info',
        title: 'Privileged activity came from multiple IP addresses',
        detail: `${overview.uniqueIpAddresses24h} source IP addresses produced privileged audit activity in the last ${SECURITY_LOOKBACK_HOURS} hours.`,
        href: '/owner/security',
        actionLabel: 'Review source footprint',
      });
    }

    if (findings.length === 0) {
      findings.push({
        id: 'security-stable',
        severity: 'info',
        title: 'Security posture is stable',
        detail: auditLogs24h.length
          ? 'Recent privileged activity looks consistent and no employee access risks are currently open.'
          : 'No recent privileged activity is recorded and no employee access risks are currently open.',
        href: '/owner/security',
        actionLabel: 'Stay on security center',
      });
    }

    return findings.slice(0, 5);
  }

  private buildSecurityAccessReview(employees: Employee[]): OwnerSecurityAccessReviewItem[] {
    return employees
      .map((employee) => ({
        employeeId: employee.id,
        uid: employee.uid,
        displayName: employee.displayName,
        email: employee.email,
        department: employee.department,
        reasons: this.getSecurityReviewReasons(employee),
        isActive: employee.isActive,
        emailVerified: employee.emailVerified,
        mfaEnabled: employee.mfaEnabled,
        authProviderDisabled: employee.authProviderDisabled,
        platformAccessActive: employee.platformAccessActive,
        lastLoginAt: employee.lastLoginAt,
        lastSyncedAt: employee.lastSyncedAt,
      }))
      .filter((item) => item.reasons.length > 0)
      .sort((left, right) => this.getSecurityReviewWeight(right) - this.getSecurityReviewWeight(left) || left.displayName.localeCompare(right.displayName));
  }

  private buildSecurityActionCounts(auditLogs24h: AuditLog[]): OwnerSecurityActionCount[] {
    const counts = new Map<AuditAction, number>();

    for (const entry of auditLogs24h) {
      counts.set(entry.action, (counts.get(entry.action) ?? 0) + 1);
    }

    return [...counts.entries()]
      .map(([action, count]) => ({ action, count }))
      .sort((left, right) => right.count - left.count || left.action.localeCompare(right.action))
      .slice(0, 6);
  }

  private buildSecurityPriorityEvents(auditLogs: AuditLog[]): OwnerSecurityTimelineItem[] {
    const prioritized = auditLogs.filter((entry) => this.isPrivilegedAuditAction(entry.action));
    const source = prioritized.length > 0 ? prioritized : auditLogs;

    return source
      .slice(0, 6)
      .map((entry) => this.buildSecurityTimelineItem(entry));
  }

  private buildSecurityTimeline(auditLogs: AuditLog[]): OwnerSecurityTimelineItem[] {
    return auditLogs
      .slice(0, 20)
      .map((entry) => this.buildSecurityTimelineItem(entry));
  }

  private buildSecurityTimelineItem(entry: AuditLog): OwnerSecurityTimelineItem {
    const actor = entry.performedByEmail || 'Unknown actor';
    const targetLabel = typeof entry.targetId === 'string' && entry.targetId.length > 0
      ? entry.targetId
      : entry.targetType ?? 'platform';
    const detailSuffix = this.buildAuditMetadataDetail(entry.metadata);

    switch (entry.action) {
      case 'EMPLOYEE_CREATED':
        return {
          ...entry,
          tone: 'positive',
          title: 'Employee onboarding completed',
          detail: `${actor} created ${targetLabel}.${detailSuffix}`,
        };
      case 'EMPLOYEE_UPDATED':
        return {
          ...entry,
          tone: 'neutral',
          title: 'Employee record updated',
          detail: `${actor} updated ${targetLabel}.${detailSuffix}`,
        };
      case 'EMPLOYEE_DEACTIVATED':
        return {
          ...entry,
          tone: 'warning',
          title: 'Employee access deactivated',
          detail: `${actor} disabled platform access for ${targetLabel}.${detailSuffix}`,
        };
      case 'EMPLOYEE_REACTIVATED':
        return {
          ...entry,
          tone: 'positive',
          title: 'Employee access reactivated',
          detail: `${actor} restored platform access for ${targetLabel}.${detailSuffix}`,
        };
      case 'SETTINGS_CHANGED':
        return {
          ...entry,
          tone: 'warning',
          title: 'Platform settings changed',
          detail: `${actor} changed privileged settings.${detailSuffix}`,
        };
      case 'APPROVAL_GRANTED':
        return {
          ...entry,
          tone: 'positive',
          title: 'Approval granted',
          detail: `${actor} approved ${targetLabel}.${detailSuffix}`,
        };
      case 'APPROVAL_DENIED':
        return {
          ...entry,
          tone: 'warning',
          title: 'Approval denied',
          detail: `${actor} denied ${targetLabel}.${detailSuffix}`,
        };
      case 'SCHOOL_ONBOARDED':
        return {
          ...entry,
          tone: 'positive',
          title: 'School onboarded',
          detail: `${actor} onboarded ${targetLabel}.${detailSuffix}`,
        };
      case 'SCHOOL_SUSPENDED':
        return {
          ...entry,
          tone: 'warning',
          title: 'School suspension recorded',
          detail: `${actor} suspended ${targetLabel}.${detailSuffix}`,
        };
      case 'LOGIN':
        return {
          ...entry,
          tone: 'neutral',
          title: 'Privileged session started',
          detail: `${actor} signed in to the platform plane.${detailSuffix}`,
        };
      case 'LOGOUT':
        return {
          ...entry,
          tone: 'neutral',
          title: 'Privileged session ended',
          detail: `${actor} signed out of the platform plane.${detailSuffix}`,
        };
      case 'EXAM_SCHEDULED':
        return {
          ...entry,
          tone: 'neutral',
          title: 'Exam schedule changed',
          detail: `${actor} scheduled ${targetLabel}.${detailSuffix}`,
        };
      default:
        return {
          ...entry,
          tone: 'neutral',
          title: entry.action,
          detail: `${actor} recorded ${String(entry.action).toLowerCase()}.${detailSuffix}`,
        };
    }
  }

  private buildAuditMetadataDetail(metadata?: Record<string, unknown>): string {
    if (!metadata) {
      return '';
    }

    const fragments: string[] = [];
    const department = metadata.department;
    const syncType = metadata.syncType;
    const path = metadata.path;
    const requestId = metadata.requestId;

    if (typeof department === 'string' && department.length > 0) {
      fragments.push(`Department ${department}`);
    }

    if (typeof syncType === 'string' && syncType.length > 0) {
      fragments.push(`Sync ${syncType}`);
    }

    if (typeof path === 'string' && path.length > 0) {
      fragments.push(`Route ${path}`);
    }

    if (typeof requestId === 'string' && requestId.length > 0) {
      fragments.push(`Request ${requestId}`);
    }

    return fragments.length > 0 ? ` ${fragments.join(' • ')}.` : '';
  }

  private getSecurityReviewReasons(employee: Employee): string[] {
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

  private getSecurityReviewWeight(item: OwnerSecurityAccessReviewItem): number {
    let weight = item.reasons.length;

    if (item.authProviderDisabled) {
      weight += 20;
    }
    if (!item.platformAccessActive) {
      weight += 15;
    }
    if (!item.emailVerified) {
      weight += 10;
    }
    if (!item.mfaEnabled) {
      weight += 8;
    }
    if (!item.lastLoginAt) {
      weight += 6;
    }
    if (!item.isActive) {
      weight += 4;
    }

    return weight;
  }

  private isPrivilegedAuditAction(action: AuditAction): boolean {
    return action !== 'LOGIN' && action !== 'LOGOUT';
  }

  private isRiskAuditAction(action: AuditAction): boolean {
    return action === 'EMPLOYEE_DEACTIVATED' || action === 'APPROVAL_DENIED' || action === 'SETTINGS_CHANGED' || action === 'SCHOOL_SUSPENDED';
  }

  private resolveQueueStatus(pendingCount: number): OwnerDashboardStatus {
    if (pendingCount >= 5) {
      return 'critical';
    }
    if (pendingCount > 0) {
      return 'watch';
    }
    return 'stable';
  }

  private resolveOverallStatus(
    workforce: OwnerDashboardWorkforce,
    approvals: OwnerDashboardApprovals,
    schoolOperations: OwnerDashboardSchoolOperations,
  ): OwnerDashboardStatus {
    if (approvals.queueStatus === 'critical' || schoolOperations.exceptionCount >= 3) {
      return 'critical';
    }
    if (
      approvals.queueStatus === 'watch' ||
      schoolOperations.onboardingRiskCount > 0 ||
      schoolOperations.exceptionCount > 0 ||
      workforce.staleLogins + workforce.neverLoggedIn > 0 ||
      (workforce.totalEmployees > 0 && workforce.mfaCoveragePercent < 100)
    ) {
      return 'watch';
    }
    return 'stable';
  }

  private isToday(value: string): boolean {
    if (!value) {
      return false;
    }

    const input = new Date(value);
    const now = new Date();

    return (
      input.getFullYear() === now.getFullYear() &&
      input.getMonth() === now.getMonth() &&
      input.getDate() === now.getDate()
    );
  }

  private isOlderThanDays(value: string, days: number): boolean {
    if (!value) {
      return false;
    }

    const input = new Date(value);
    const ageMs = Date.now() - input.getTime();
    return ageMs > days * 24 * 60 * 60 * 1000;
  }

  private isCreatedWithinDays(value: string, days: number): boolean {
    if (!value) {
      return false;
    }

    const input = new Date(value);
    const ageMs = Date.now() - input.getTime();
    return ageMs <= days * 24 * 60 * 60 * 1000;
  }

  private extractSchoolIdFromMetadata(metadata?: Record<string, unknown>): string | null {
    const schoolId = metadata?.schoolId;
    return typeof schoolId === 'string' ? schoolId : null;
  }

  private resolveSchoolHealthStatus({
    school,
    studentCount,
    relatedApprovals,
    lastEnrollmentAt,
    lastAttendanceRecordedAt,
    lastGradePublishedAt,
  }: {
    school: School;
    studentCount: number;
    relatedApprovals: Approval[];
    lastEnrollmentAt: string | null;
    lastAttendanceRecordedAt: string | null;
    lastGradePublishedAt: string | null;
  }): Pick<OwnerDashboardSchoolItem, 'status' | 'attentionReason'> {
    if (!school.isActive) {
      return {
        status: 'inactive',
        attentionReason: 'School is currently inactive and not serving live traffic.',
      };
    }

    const hasSuspensionApproval = relatedApprovals.some((approval) => approval.type === 'school_suspension');
    if (hasSuspensionApproval) {
      return {
        status: 'watch',
        attentionReason: 'A suspension request is pending owner review.',
      };
    }

    const hasOnboardingApproval = relatedApprovals.some((approval) => approval.type === 'school_onboarding');
    if (hasOnboardingApproval) {
      return {
        status: 'onboarding',
        attentionReason: 'Onboarding approval is still pending final owner action.',
      };
    }

    if (studentCount === 0 && this.isCreatedWithinDays(school.createdAt, SCHOOL_ONBOARDING_WINDOW_DAYS)) {
      return {
        status: 'onboarding',
        attentionReason: 'School was created recently but student enrollment has not started yet.',
      };
    }

    if (studentCount === 0) {
      return {
        status: 'watch',
        attentionReason: 'School has no active students enrolled yet.',
      };
    }

    if (!lastAttendanceRecordedAt) {
      return {
        status: 'watch',
        attentionReason: 'Attendance has not been recorded yet for this school.',
      };
    }

    if (this.isOlderThanDays(lastAttendanceRecordedAt, SCHOOL_ATTENDANCE_RISK_DAYS)) {
      return {
        status: 'watch',
        attentionReason: `Attendance has been stale for ${this.daysSince(lastAttendanceRecordedAt)} days.`,
      };
    }

    if (!lastGradePublishedAt && lastEnrollmentAt) {
      return {
        status: 'onboarding',
        attentionReason: 'Student enrollment is active, but grading has not started yet.',
      };
    }

    if (lastGradePublishedAt && this.isOlderThanDays(lastGradePublishedAt, SCHOOL_GRADES_RISK_DAYS)) {
      return {
        status: 'watch',
        attentionReason: `Grades have not been published for ${this.daysSince(lastGradePublishedAt)} days.`,
      };
    }

    return {
      status: 'healthy',
      attentionReason: 'Attendance and grading activity are flowing normally.',
    };
  }

  private daysSince(value: string): number {
    const input = new Date(value);
    const ageMs = Date.now() - input.getTime();
    return Math.max(1, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
  }

  private schoolStatusWeight(status: OwnerDashboardSchoolItem['status']): number {
    switch (status) {
      case 'watch':
        return 4;
      case 'onboarding':
        return 3;
      case 'inactive':
        return 2;
      case 'healthy':
      default:
        return 1;
    }
  }
}
