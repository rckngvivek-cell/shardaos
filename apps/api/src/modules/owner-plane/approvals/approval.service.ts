import type {
  AdmissionLaunchApprovalMetadata,
  Approval,
  ApprovalStatus,
  SchoolOnboardingApprovalMetadata,
} from '@school-erp/shared';
import { admissionLaunchApprovalMetadataSchema } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { AdmissionRepository } from '../../admissions/admission.repository.js';
import { SchoolRepository } from '../../schools/school.repository.js';
import { ApprovalRepository } from './approval.repository.js';
import { schoolOnboardingApprovalMetadataSchema } from '../school-onboarding/school-onboarding.schemas.js';

export class ApprovalService {
  private repo = new ApprovalRepository();
  private schoolRepository = new SchoolRepository();
  private admissionRepository = new AdmissionRepository();

  async list(status?: ApprovalStatus): Promise<Approval[]> {
    return this.repo.list(status);
  }

  async countPending(): Promise<number> {
    return this.repo.countPending();
  }

  async approve(id: string, ownerUid: string, decisionNote?: string): Promise<Approval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw new AppError(404, 'NOT_FOUND', `Approval ${id} not found`);
    }
    if (approval.status !== 'pending') {
      throw new AppError(409, 'CONFLICT', `Approval ${id} is already ${approval.status}`);
    }

    const normalizedNote = this.normalizeDecisionNote(decisionNote);
    await this.applyApprovalSideEffects(approval, ownerUid);
    await this.repo.updateDecision(id, 'approved', ownerUid, normalizedNote);
    return (await this.repo.findById(id)) as Approval;
  }

  async deny(id: string, ownerUid: string, decisionNote?: string): Promise<Approval> {
    const approval = await this.repo.findById(id);
    if (!approval) {
      throw new AppError(404, 'NOT_FOUND', `Approval ${id} not found`);
    }
    if (approval.status !== 'pending') {
      throw new AppError(409, 'CONFLICT', `Approval ${id} is already ${approval.status}`);
    }

    const normalizedNote = this.normalizeDecisionNote(decisionNote);
    await this.applyDenialSideEffects(approval, ownerUid, normalizedNote);
    await this.repo.updateDecision(id, 'denied', ownerUid, normalizedNote);
    return (await this.repo.findById(id)) as Approval;
  }

  private async applyApprovalSideEffects(approval: Approval, ownerUid: string): Promise<void> {
    if (approval.type === 'school_onboarding') {
      await this.provisionSchoolIfNeeded(approval);
      return;
    }

    if (approval.type === 'admission_launch') {
      const metadata = this.parseAdmissionLaunchMetadata(approval);
      if (!metadata) {
        return;
      }

      await this.admissionRepository.markLaunchApproved(
        metadata.schoolId,
        metadata.sessionId,
        approval.id,
        ownerUid,
      );
    }
  }

  private async applyDenialSideEffects(
    approval: Approval,
    ownerUid: string,
    decisionNote?: string,
  ): Promise<void> {
    if (approval.type !== 'admission_launch') {
      return;
    }

    const metadata = this.parseAdmissionLaunchMetadata(approval);
    if (!metadata) {
      return;
    }

    await this.admissionRepository.markLaunchDenied(
      metadata.schoolId,
      metadata.sessionId,
      approval.id,
      ownerUid,
      decisionNote,
    );
  }

  private normalizeDecisionNote(decisionNote?: string): string | undefined {
    const normalized = decisionNote?.trim();
    return normalized || undefined;
  }

  private async provisionSchoolIfNeeded(approval: Approval): Promise<void> {
    const metadata = this.parseSchoolOnboardingMetadata(approval);
    if (!metadata) {
      return;
    }

    const existingSchool = await this.schoolRepository.findById(metadata.schoolId);
    if (existingSchool) {
      throw new AppError(409, 'SCHOOL_ALREADY_EXISTS', `School ${metadata.schoolDraft.code} already exists`);
    }

    await this.schoolRepository.createFromOnboarding(metadata.schoolId, {
      school: metadata.schoolDraft,
      servicePlanTier: metadata.servicePlanTier,
      enabledServiceKeys: metadata.enabledServiceKeys,
    });
  }

  private parseSchoolOnboardingMetadata(approval: Approval): SchoolOnboardingApprovalMetadata | null {
    const parsed = schoolOnboardingApprovalMetadataSchema.safeParse(approval.metadata);
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  }

  private parseAdmissionLaunchMetadata(approval: Approval): AdmissionLaunchApprovalMetadata | null {
    const parsed = admissionLaunchApprovalMetadataSchema.safeParse(approval.metadata);
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  }
}
