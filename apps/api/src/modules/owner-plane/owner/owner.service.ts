import type { PlatformAuthUser } from '@school-erp/shared';
import { EmployeeService } from '../employees/employee.service.js';
import { ApprovalService } from '../approvals/approval.service.js';

export interface OwnerSummary {
  pendingApprovals: number;
  activeEmployees: number;
  generatedAt: string;
}

export class OwnerService {
  private employeeService = new EmployeeService();
  private approvalService = new ApprovalService();

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
}
