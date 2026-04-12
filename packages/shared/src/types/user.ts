export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';

export interface AuthUser {
  uid: string;
  email?: string;
  role: UserRole;
  schoolId: string;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  schoolId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
