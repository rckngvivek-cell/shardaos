export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  principalName: string;
  studentCount: number;
  servicePlanTier?: SchoolServicePlanTier;
  enabledServiceKeys?: SchoolServiceKey[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSchoolInput {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  principalName: string;
}

export interface SchoolOnboardingRequestInput {
  school: CreateSchoolInput;
  servicePlanTier: SchoolServicePlanTier;
  enabledServiceKeys?: SchoolServiceKey[];
}

export interface SchoolOnboardingApprovalMetadata {
  schoolId: string;
  schoolDraft: CreateSchoolInput;
  servicePlanTier: SchoolServicePlanTier;
  enabledServiceKeys: SchoolServiceKey[];
}

export interface UpdateSchoolServicePlanInput {
  servicePlanTier: SchoolServicePlanTier;
  enabledServiceKeys?: SchoolServiceKey[];
}

export type SchoolServicePlanTier = 'basic' | 'advanced';

export type SchoolServiceCategory = 'basic' | 'advanced';

export type SchoolServiceKey =
  | 'student_records'
  | 'attendance'
  | 'academics'
  | 'homework'
  | 'lesson_plans'
  | 'academic_calendar'
  | 'notice_board'
  | 'transport'
  | 'fee_collection'
  | 'parent_portal'
  | 'communications'
  | 'analytics'
  | 'school_staff'
  | 'payroll'
  | 'library'
  | 'inventory'
  | 'online_exam'
  | 'report_cards'
  | 'admission_crm'
  | 'accounting'
  | 'website_manager'
  | 'e_content'
  | 'certificates';

export type SchoolServiceState = 'enabled' | 'available' | 'locked';

export interface SchoolServiceWorkflowStep {
  key: string;
  title: string;
  description: string;
  ownerApprovalRequired: boolean;
}

export interface SchoolServiceApprovalGate {
  approver: 'owner';
  title: string;
  description: string;
}

export interface SchoolServiceWorkflowBlueprint {
  setupSummary: string;
  primaryActor: string;
  dataObjects: string[];
  permissionScopes: string[];
  steps: SchoolServiceWorkflowStep[];
  ownerApprovalGate: SchoolServiceApprovalGate | null;
}

export interface SchoolServiceCatalogItem {
  key: SchoolServiceKey;
  category: SchoolServiceCategory;
  name: string;
  shortName: string;
  description: string;
  route: string;
  includedIn: SchoolServicePlanTier[];
}

export interface SchoolServiceEntitlement extends SchoolServiceCatalogItem {
  state: SchoolServiceState;
  lockedReason: string | null;
  workflow: SchoolServiceWorkflowBlueprint;
}

export interface SchoolServicesSummary {
  schoolId: string;
  schoolName: string;
  planTier: SchoolServicePlanTier;
  enabledServiceKeys: SchoolServiceKey[];
  services: SchoolServiceEntitlement[];
  basicServices: SchoolServiceEntitlement[];
  advancedServices: SchoolServiceEntitlement[];
  totals: {
    enabled: number;
    available: number;
    locked: number;
  };
}
