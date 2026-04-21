import type { Approval, ApprovalStatus } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { ApprovalRepository } from './approval.repository.js';

export class ApprovalService {
  private repo = new ApprovalRepository();

  async list(status?: ApprovalStatus): Promise<Approval[]> {
    return this.repo.list(status);
  }

  async countPending(): Promise<number> {
    return this.repo.countPending();
  }

  async approve(id: string, ownerUid: string): Promise<Approval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw new AppError(404, 'NOT_FOUND', `Approval ${id} not found`);
    }
    if (approval.status !== 'pending') {
      throw new AppError(409, 'CONFLICT', `Approval ${id} is already ${approval.status}`);
    }

    await this.repo.updateDecision(id, 'approved', ownerUid);
    return (await this.repo.findById(id)) as Approval;
  }

  async deny(id: string, ownerUid: string): Promise<Approval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw new AppError(404, 'NOT_FOUND', `Approval ${id} not found`);
    }
    if (approval.status !== 'pending') {
      throw new AppError(409, 'CONFLICT', `Approval ${id} is already ${approval.status}`);
    }

    await this.repo.updateDecision(id, 'denied', ownerUid);
    return (await this.repo.findById(id)) as Approval;
  }
}
