import type { PlatformRole } from './user.js';

// ── Employee (onboarded by Owner) ──

export interface Employee {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  department: string;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string;
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

// ── Audit Log (every owner/employee action is recorded) ──

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'EMPLOYEE_CREATED'
  | 'EMPLOYEE_DEACTIVATED'
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
  type: 'school_onboarding' | 'employee_onboarding' | 'school_suspension' | 'exam_schedule';
  status: ApprovalStatus;
  requestedBy: string; // employee uid
  requestedByEmail: string;
  approvedBy?: string; // owner uid
  title: string;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
