// @school-erp/shared — types, schemas, and constants shared across all apps

export * from './types/index.js';
export * from './schemas/index.js';
export * from './constants/index.js';
export {
  DEFAULT_SCHOOL_SERVICES_BY_PLAN,
  SCHOOL_SERVICE_CATALOG,
  SCHOOL_SERVICE_KEYS,
  SCHOOL_SERVICE_PLANS,
  SCHOOL_SERVICE_WORKFLOW_OVERRIDES,
  getSchoolServiceWorkflow,
  getEnabledSchoolServiceKeysForPlan,
  isSchoolServiceKey,
  normalizeSchoolServicePlanTier,
} from './constants/school-services.js';
