import type {
  School,
  SchoolServiceEntitlement,
  SchoolServicesSummary,
  UpdateSchoolServicePlanInput,
} from '@school-erp/shared';
import {
  SCHOOL_SERVICE_CATALOG,
  getEnabledSchoolServiceKeysForPlan,
  getSchoolServiceWorkflow,
  normalizeSchoolServicePlanTier,
} from '@school-erp/shared';
import { SchoolRepository } from './school.repository.js';
import { AppError } from '../../errors/app-error.js';

export class SchoolService {
  private repo = new SchoolRepository();

  async getById(schoolId: string): Promise<School> {
    const school = await this.repo.findById(schoolId);
    if (!school) {
      throw new AppError(404, 'NOT_FOUND', `School ${schoolId} not found`);
    }
    return school;
  }

  async getServicesSummary(schoolId: string): Promise<SchoolServicesSummary> {
    const school = await this.getById(schoolId);
    const planTier = normalizeSchoolServicePlanTier(school.servicePlanTier);
    const enabledServiceKeys = getEnabledSchoolServiceKeysForPlan(planTier, school.enabledServiceKeys);
    const enabledSet = new Set(enabledServiceKeys);

    const services = SCHOOL_SERVICE_CATALOG.map<SchoolServiceEntitlement>((service) => {
      const includedInPlan = service.includedIn.includes(planTier);
      const enabled = includedInPlan && enabledSet.has(service.key);

      return {
        ...service,
        state: enabled ? 'enabled' : includedInPlan ? 'available' : 'locked',
        lockedReason: includedInPlan ? null : 'Requires the Advanced school service plan.',
        workflow: getSchoolServiceWorkflow(service.key),
      };
    });

    return {
      schoolId: school.id,
      schoolName: school.name,
      planTier,
      enabledServiceKeys,
      services,
      basicServices: services.filter((service) => service.category === 'basic'),
      advancedServices: services.filter((service) => service.category === 'advanced'),
      totals: {
        enabled: services.filter((service) => service.state === 'enabled').length,
        available: services.filter((service) => service.state === 'available').length,
        locked: services.filter((service) => service.state === 'locked').length,
      },
    };
  }

  async updateServicePlan(schoolId: string, input: UpdateSchoolServicePlanInput): Promise<School> {
    const school = await this.getById(schoolId);
    const planTier = normalizeSchoolServicePlanTier(input.servicePlanTier);
    const enabledServiceKeys = getEnabledSchoolServiceKeysForPlan(planTier, input.enabledServiceKeys);

    return this.repo.updateServicePlan(school.id, planTier, enabledServiceKeys);
  }
}
