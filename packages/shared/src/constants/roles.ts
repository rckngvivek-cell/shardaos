import type { UserRole } from '../types/user.js';

export const ROLES: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  school_admin: 'School Admin',
  teacher: 'Teacher',
  parent: 'Parent',
  student: 'Student',
};

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  school_admin: 80,
  teacher: 60,
  parent: 20,
  student: 10,
};

export function hasPermission(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}
