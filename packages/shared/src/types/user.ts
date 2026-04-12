// ── Platform Plane (ShardaOS internal — never public) ──
export type PlatformRole = 'owner' | 'employee';

// ── Tenant Plane (per school — public facing) ──
export type TenantRole =
  | 'school_owner'
  | 'school_admin'
  | 'principal'
  | 'exam_controller'
  | 'teacher'
  | 'parent'
  | 'student';

// Union of all roles (used sparingly — prefer plane-specific types)
export type UserRole = PlatformRole | TenantRole;

// ── Auth payloads ──

/** Platform user (owner / employee) — no schoolId, cross-tenant access */
export interface PlatformAuthUser {
  uid: string;
  email: string;
  role: PlatformRole;
  plane: 'platform';
}

/** Tenant user — always scoped to a single school */
export interface TenantAuthUser {
  uid: string;
  email?: string;
  role: TenantRole;
  schoolId: string;
  plane: 'tenant';
}

/** Discriminated union — middleware sets one or the other */
export type AuthUser = PlatformAuthUser | TenantAuthUser;

// ── Full profile documents ──

export interface PlatformUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: PlatformRole;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenantUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: TenantRole;
  schoolId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** @deprecated Use PlatformUser or TenantUser instead */
export type User = TenantUser;
