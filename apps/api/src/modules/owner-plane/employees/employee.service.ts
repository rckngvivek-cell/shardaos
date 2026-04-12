import type { CreateEmployeeInput, Employee } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { EmployeeRepository } from './employee.repository.js';

export class EmployeeService {
  private repo = new EmployeeRepository();

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
    return this.repo.create({
      uid: input.uid,
      email,
      displayName: input.displayName.trim(),
      role: 'employee',
      department: input.department.trim(),
      isActive: true,
      mfaEnabled: false,
      lastLoginAt: '',
      createdAt: now,
      updatedAt: now,
      onboardedBy: ownerUid,
    });
  }

  async deactivate(id: string): Promise<void> {
    const employee = await this.repo.findById(id);
    if (!employee) {
      throw new AppError(404, 'NOT_FOUND', `Employee ${id} not found`);
    }
    if (employee.role === 'owner') {
      throw new AppError(403, 'OWNER_ONLY', 'Owner accounts cannot be deactivated');
    }

    await this.repo.deactivate(id);
  }
}
