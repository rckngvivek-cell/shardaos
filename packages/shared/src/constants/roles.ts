import type { PlatformRole, TenantRole, UserRole } from '../types/user.js';

// ── Platform plane roles (internal) ──

export const PLATFORM_ROLES: Record<PlatformRole, string> = {
  owner: 'Owner',
  employee: 'Employee',
};

export const PLATFORM_HIERARCHY: Record<PlatformRole, number> = {
  owner: 1000,
  employee: 500,
};

// ── Tenant plane roles (per school) ──

export const TENANT_ROLES: Record<TenantRole, string> = {
  school_owner: 'School Owner / Director',
  school_admin: 'School Admin',
  principal: 'Principal',
  exam_controller: 'Exam Controller',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

export const TENANT_HIERARCHY: Record<TenantRole, number> = {
  school_owner: 100,
  school_admin: 80,
  principal: 70,
  exam_controller: 65,
  teacher: 60,
  parent: 20,
  student: 10,
};

// ── Combined (for display only — never use for cross-plane permission checks) ──

export const ROLES: Record<UserRole, string> = {
  ...PLATFORM_ROLES,
  ...TENANT_ROLES,
};

// ── Permission helpers ──

/** Check platform-plane permissions (owner > employee) */
export function hasPlatformPermission(userRole: PlatformRole, requiredRole: PlatformRole): boolean {
  return PLATFORM_HIERARCHY[userRole] >= PLATFORM_HIERARCHY[requiredRole];
}

/** Check tenant-plane permissions within a school */
export function hasTenantPermission(userRole: TenantRole, requiredRole: TenantRole): boolean {
  return TENANT_HIERARCHY[userRole] >= TENANT_HIERARCHY[requiredRole];
}

/** @deprecated Use hasPlatformPermission or hasTenantPermission instead */
export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy = { ...PLATFORM_HIERARCHY, ...TENANT_HIERARCHY } as Record<UserRole, number>;
  return (hierarchy[userRole] ?? 0) >= (hierarchy[requiredRole] ?? 0);
}

/** Type guards */
export function isPlatformRole(role: string): role is PlatformRole {
  return role in PLATFORM_ROLES;
}

export function isTenantRole(role: string): role is TenantRole {
  return role in TENANT_ROLES;
}
