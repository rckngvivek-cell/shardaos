import type { CreateEmployeeInput, Employee, UpdateEmployeeInput } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { AuthService } from '../../auth/auth.service.js';
import { EmployeeRepository } from './employee.repository.js';

export class EmployeeService {
  private readonly repo = new EmployeeRepository();
  private readonly authService = new AuthService();

  async list(): Promise<Employee[]> {
    return this.repo.findAll();
  }

  async countActive(): Promise<number> {
    return this.repo.countActive();
  }

  async create(ownerUid: string, input: CreateEmployeeInput): Promise<Employee> {
    const email = input.email.trim().toLowerCase();

    const existingByUid = await this.repo.findByUid(input.uid);
    if (existingByUid) {
      throw new AppError(409, 'CONFLICT', `Employee with uid ${input.uid} already exists`);
    }

    const existingByEmail = await this.repo.findByEmail(email);
    if (existingByEmail) {
      throw new AppError(409, 'CONFLICT', `Employee with email ${email} already exists`);
    }

    const now = new Date().toISOString();
    const employee = await this.repo.create({
      uid: input.uid,
      email,
      displayName: input.displayName.trim(),
      role: 'employee',
      department: input.department.trim(),
      isActive: true,
      emailVerified: true,
      mfaEnabled: false,
      authProviderDisabled: false,
      platformAccessActive: true,
      lastLoginAt: '',
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
      onboardedBy: ownerUid,
    });

    await this.authService.upsertCredentialForPlatformUser({
      uid: employee.uid,
      email: employee.email,
      displayName: employee.displayName,
      role: 'employee',
      isActive: true,
    });

    return employee;
  }

  async deactivate(id: string): Promise<void> {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', `Employee ${id} not found`);
    }
    if (employee.role === 'owner') {
      throw new AppError(403, 'OWNER_ONLY', 'Owner accounts cannot be deactivated');
    }

    await this.repo.update(id, {
      isActive: false,
      platformAccessActive: false,
      authProviderDisabled: true,
      lastSyncedAt: new Date().toISOString(),
    });
    await this.authService.updatePlatformCredentialState(employee.uid, false);
  }

  async update(id: string, input: UpdateEmployeeInput): Promise<Employee> {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', `Employee ${id} not found`);
    }

    const nextDisplayName = input.displayName?.trim();
    const nextDepartment = input.department?.trim();
    const patch: UpdateEmployeeInput = {};

    if (nextDisplayName && nextDisplayName !== employee.displayName) {
      patch.displayName = nextDisplayName;
    }

    if (nextDepartment && nextDepartment !== employee.department) {
      patch.department = nextDepartment;
    }

    if (Object.keys(patch).length === 0) {
      return employee;
    }

    await this.repo.update(id, patch);
    const updatedEmployee = {
      ...employee,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    await this.authService.syncPlatformCredential(updatedEmployee.uid, {
      email: updatedEmployee.email,
      displayName: updatedEmployee.displayName,
      isActive: updatedEmployee.isActive && updatedEmployee.platformAccessActive && !updatedEmployee.authProviderDisabled,
      role: updatedEmployee.role,
      lastLoginAt: updatedEmployee.lastLoginAt,
    });

    return updatedEmployee;
  }

  async activate(id: string): Promise<void> {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', `Employee ${id} not found`);
    }

    if (employee.isActive && employee.platformAccessActive && !employee.authProviderDisabled) {
      return;
    }

    const now = new Date().toISOString();
    await this.repo.update(id, {
      isActive: true,
      authProviderDisabled: false,
      platformAccessActive: true,
      lastSyncedAt: now,
    });

    await this.authService.upsertCredentialForPlatformUser({
      uid: employee.uid,
      email: employee.email,
      displayName: employee.displayName,
      role: employee.role,
      isActive: true,
    });
  }

  async syncIdentity(id: string): Promise<Employee> {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', `Employee ${id} not found`);
    }

    const syncedEmployee: Employee = {
      ...employee,
      authProviderDisabled: !employee.isActive || !employee.platformAccessActive,
      lastSyncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.repo.update(id, {
      authProviderDisabled: syncedEmployee.authProviderDisabled,
      lastSyncedAt: syncedEmployee.lastSyncedAt,
    });

    await this.authService.syncPlatformCredential(employee.uid, {
      email: employee.email,
      displayName: employee.displayName,
      isActive: syncedEmployee.isActive && syncedEmployee.platformAccessActive && !syncedEmployee.authProviderDisabled,
      role: employee.role,
      lastLoginAt: employee.lastLoginAt,
    });

    return syncedEmployee;
  }
}
