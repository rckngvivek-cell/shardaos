import type {
  Approval,
  PlatformAuthUser,
  SchoolOnboardingApprovalMetadata,
  SchoolOnboardingRequestInput,
} from '@school-erp/shared';
import {
  getEnabledSchoolServiceKeysForPlan,
  normalizeSchoolServicePlanTier,
} from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { SchoolRepository } from '../../schools/school.repository.js';
import { ApprovalRepository } from '../approvals/approval.repository.js';

export class SchoolOnboardingService {
  private approvalRepository = new ApprovalRepository();
  private schoolRepository = new SchoolRepository();

  async createRequest(
    requestedBy: PlatformAuthUser,
    input: SchoolOnboardingRequestInput,
  ): Promise<Approval> {
    const metadata = this.buildApprovalMetadata(input);
    const existingSchool = await this.schoolRepository.findById(metadata.schoolId);
    if (existingSchool) {
      throw new AppError(409, 'SCHOOL_ALREADY_EXISTS', `School ${metadata.schoolDraft.code} already exists`);
    }

    const now = new Date().toISOString();
    return this.approvalRepository.create({
      type: 'school_onboarding',
      status: 'pending',
      requestedBy: requestedBy.uid,
      requestedByEmail: requestedBy.email,
      title: `Onboard ${metadata.schoolDraft.name}`,
      description: [
        `${metadata.schoolDraft.city}, ${metadata.schoolDraft.state}`,
        `${metadata.servicePlanTier === 'advanced' ? 'Advanced' : 'Basic'} service plan`,
        `${metadata.enabledServiceKeys.length} services`,
      ].join(' • '),
      metadata: metadata as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    });
  }

  private buildApprovalMetadata(input: SchoolOnboardingRequestInput): SchoolOnboardingApprovalMetadata {
    const servicePlanTier = normalizeSchoolServicePlanTier(input.servicePlanTier);
    const enabledServiceKeys = getEnabledSchoolServiceKeysForPlan(servicePlanTier, input.enabledServiceKeys);
    const schoolDraft = {
      name: input.school.name.trim(),
      code: input.school.code.trim().toUpperCase(),
      address: input.school.address.trim(),
      city: input.school.city.trim(),
      state: input.school.state.trim(),
      country: input.school.country.trim(),
      phone: input.school.phone.trim(),
      email: input.school.email.trim().toLowerCase(),
      principalName: input.school.principalName.trim(),
    };

    return {
      schoolId: this.buildSchoolId(schoolDraft.code),
      schoolDraft,
      servicePlanTier,
      enabledServiceKeys,
    };
  }

  private buildSchoolId(code: string): string {
    const slug = code
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!slug) {
      throw new AppError(400, 'VALIDATION_ERROR', 'school.code must contain letters or numbers');
    }

    return `school-${slug}`;
  }
}
