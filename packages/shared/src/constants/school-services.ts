import type {
  SchoolServiceCatalogItem,
  SchoolServiceKey,
  SchoolServicePlanTier,
  SchoolServiceWorkflowBlueprint,
} from '../types/school.js';

export const SCHOOL_SERVICE_PLANS: Record<SchoolServicePlanTier, string> = {
  basic: 'Basic',
  advanced: 'Advanced',
};

export const SCHOOL_SERVICE_KEYS = [
  'student_records',
  'attendance',
  'academics',
  'homework',
  'lesson_plans',
  'academic_calendar',
  'notice_board',
  'transport',
  'fee_collection',
  'parent_portal',
  'communications',
  'analytics',
  'school_staff',
  'payroll',
  'library',
  'inventory',
  'online_exam',
  'report_cards',
  'admission_crm',
  'accounting',
  'website_manager',
  'e_content',
  'certificates',
] as const satisfies readonly SchoolServiceKey[];

export const SCHOOL_SERVICE_CATALOG: SchoolServiceCatalogItem[] = [
  {
    key: 'student_records',
    category: 'basic',
    name: 'Student Records',
    shortName: 'Students',
    description: 'Maintain student profiles, admissions records, guardians, classes, and sections.',
    route: '/students',
    includedIn: ['basic', 'advanced'],
  },
  {
    key: 'attendance',
    category: 'basic',
    name: 'Attendance',
    shortName: 'Attendance',
    description: 'Collect daily attendance and track class-level follow-up inside the school workspace.',
    route: '/attendance',
    includedIn: ['basic', 'advanced'],
  },
  {
    key: 'academics',
    category: 'basic',
    name: 'Academics',
    shortName: 'Academics',
    description: 'Run assessments, marks entry, grades, and publication review for school teams.',
    route: '/academics',
    includedIn: ['basic', 'advanced'],
  },
  {
    key: 'homework',
    category: 'basic',
    name: 'Homework',
    shortName: 'Homework',
    description: 'Assign class homework, track submissions, and keep school-side follow-up in one workbench.',
    route: '/homework',
    includedIn: ['basic', 'advanced'],
  },
  {
    key: 'lesson_plans',
    category: 'basic',
    name: 'Lesson Plans',
    shortName: 'Lessons',
    description: 'Prepare topic plans, daily teaching coverage, and academic progress records for each class.',
    route: '/lesson-plans',
    includedIn: ['basic', 'advanced'],
  },
  {
    key: 'academic_calendar',
    category: 'basic',
    name: 'Academic Calendar',
    shortName: 'Calendar',
    description: 'Publish sessions, holidays, events, exams, and academic milestones for school operations.',
    route: '/calendar',
    includedIn: ['basic', 'advanced'],
  },
  {
    key: 'notice_board',
    category: 'basic',
    name: 'Digital Notice Board',
    shortName: 'Notices',
    description: 'Share school notices and simple announcements without enabling paid communication automation.',
    route: '/notices',
    includedIn: ['basic', 'advanced'],
  },
  {
    key: 'transport',
    category: 'advanced',
    name: 'Transport Management',
    shortName: 'Transport',
    description: 'Manage routes, vehicle assignments, route rosters, and transport exceptions.',
    route: '/transport',
    includedIn: ['advanced'],
  },
  {
    key: 'fee_collection',
    category: 'advanced',
    name: 'Fee Collection',
    shortName: 'Fees',
    description: 'Manage fee heads, billing cycles, collections, concessions, and dues follow-up.',
    route: '/fees',
    includedIn: ['advanced'],
  },
  {
    key: 'parent_portal',
    category: 'advanced',
    name: 'Parent Portal',
    shortName: 'Parents',
    description: 'Expose school-approved attendance, academic, fee, and communication updates to guardians.',
    route: '/parents',
    includedIn: ['advanced'],
  },
  {
    key: 'communications',
    category: 'advanced',
    name: 'Communications',
    shortName: 'Messages',
    description: 'Coordinate school notices, targeted messages, and parent follow-up from one channel.',
    route: '/communications',
    includedIn: ['advanced'],
  },
  {
    key: 'analytics',
    category: 'advanced',
    name: 'Analytics',
    shortName: 'Analytics',
    description: 'Review cross-module operating signals for school leadership and platform support.',
    route: '/analytics',
    includedIn: ['advanced'],
  },
  {
    key: 'school_staff',
    category: 'advanced',
    name: 'School Staff Management',
    shortName: 'School Staff',
    description: 'Manage tenant school staff profiles, assignments, attendance, leave, and school-scoped roles.',
    route: '/school-staff',
    includedIn: ['advanced'],
  },
  {
    key: 'payroll',
    category: 'advanced',
    name: 'Payroll',
    shortName: 'Payroll',
    description: 'Run salary structures, payroll periods, deductions, approvals, and payout-ready payroll reports.',
    route: '/payroll',
    includedIn: ['advanced'],
  },
  {
    key: 'library',
    category: 'advanced',
    name: 'Library',
    shortName: 'Library',
    description: 'Manage books, members, issue-return activity, fines, and library inventory visibility.',
    route: '/library',
    includedIn: ['advanced'],
  },
  {
    key: 'inventory',
    category: 'advanced',
    name: 'Inventory',
    shortName: 'Inventory',
    description: 'Track vendors, requisitions, stock, school assets, purchase flow, and inventory exceptions.',
    route: '/inventory',
    includedIn: ['advanced'],
  },
  {
    key: 'online_exam',
    category: 'advanced',
    name: 'Online Exam',
    shortName: 'Online Exam',
    description: 'Create online tests, manage question papers, collect submissions, and publish exam outcomes.',
    route: '/online-exams',
    includedIn: ['advanced'],
  },
  {
    key: 'report_cards',
    category: 'advanced',
    name: 'Report Cards',
    shortName: 'Report Cards',
    description: 'Design scholastic and co-scholastic report formats, calculate results, and publish final cards.',
    route: '/report-cards',
    includedIn: ['advanced'],
  },
  {
    key: 'admission_crm',
    category: 'advanced',
    name: 'Admission CRM',
    shortName: 'Admissions',
    description: 'Run enquiry capture, admission follow-up, applicant conversion, and onboarding handoff.',
    route: '/admissions',
    includedIn: ['advanced'],
  },
  {
    key: 'accounting',
    category: 'advanced',
    name: 'Accounting',
    shortName: 'Accounts',
    description: 'Coordinate vouchers, ledgers, receipts, reconciliation, and finance reporting alongside fees.',
    route: '/accounting',
    includedIn: ['advanced'],
  },
  {
    key: 'website_manager',
    category: 'advanced',
    name: 'Website Manager',
    shortName: 'Website',
    description: 'Manage public school content, website notices, page sections, media, and publishing review.',
    route: '/website',
    includedIn: ['advanced'],
  },
  {
    key: 'e_content',
    category: 'advanced',
    name: 'E-content',
    shortName: 'Content',
    description: 'Organize learning resources, digital materials, class content, and controlled content access.',
    route: '/content',
    includedIn: ['advanced'],
  },
  {
    key: 'certificates',
    category: 'advanced',
    name: 'Certificates',
    shortName: 'Certificates',
    description: 'Generate and review transfer, bonafide, character, and other school certificate workflows.',
    route: '/certificates',
    includedIn: ['advanced'],
  },
];

export const DEFAULT_SCHOOL_SERVICES_BY_PLAN: Record<SchoolServicePlanTier, SchoolServiceKey[]> = {
  basic: SCHOOL_SERVICE_CATALOG
    .filter((service) => service.category === 'basic')
    .map((service) => service.key),
  advanced: SCHOOL_SERVICE_CATALOG.map((service) => service.key),
};

const DEFAULT_SCHOOL_SERVICE_WORKFLOW: SchoolServiceWorkflowBlueprint = {
  setupSummary: 'Configure school-owned setup records, operate the module, then review exceptions before publishing updates.',
  primaryActor: 'school_admin',
  dataObjects: ['setup_profile', 'operational_record', 'review_note', 'audit_event'],
  permissionScopes: ['school:module:manage', 'school:module:review'],
  steps: [
    {
      key: 'configure',
      title: 'Configure module setup',
      description: 'Capture the minimum school-specific setup records required before live module work starts.',
      ownerApprovalRequired: false,
    },
    {
      key: 'operate',
      title: 'Run daily operations',
      description: 'Create and update module records from the school workspace with tenant-scoped permissions.',
      ownerApprovalRequired: false,
    },
    {
      key: 'review',
      title: 'Review exceptions',
      description: 'Resolve missing data, stale records, and school-side exceptions before final publication.',
      ownerApprovalRequired: false,
    },
  ],
  ownerApprovalGate: null,
};

export const SCHOOL_SERVICE_WORKFLOW_OVERRIDES: Partial<Record<SchoolServiceKey, SchoolServiceWorkflowBlueprint>> = {
  admission_crm: {
    setupSummary: 'Prepare admission sessions, qualify enquiries, convert applicants, and hand approved admissions to student records.',
    primaryActor: 'school_admission_operator',
    dataObjects: [
      'admission_session',
      'enquiry',
      'applicant_profile',
      'follow_up_activity',
      'conversion_decision',
      'student_onboarding_handoff',
    ],
    permissionScopes: [
      'school:admissions:manage',
      'school:admissions:review',
      'owner:admissions:approve_launch',
      'school:students:create_from_admission',
    ],
    steps: [
      {
        key: 'session_setup',
        title: 'Set up admission session',
        description: 'Define academic year, classes open for admission, intake capacity, fee linkage, and enquiry source tags.',
        ownerApprovalRequired: false,
      },
      {
        key: 'launch_review',
        title: 'Request launch approval',
        description: 'Send the admission session, public copy, and conversion rules to the owner plane before publishing.',
        ownerApprovalRequired: true,
      },
      {
        key: 'enquiry_capture',
        title: 'Capture and qualify enquiries',
        description: 'Record guardian details, target class, source, notes, documents, and next follow-up date.',
        ownerApprovalRequired: false,
      },
      {
        key: 'applicant_conversion',
        title: 'Convert applicant',
        description: 'Move a qualified enquiry into applicant review and prepare the student record handoff.',
        ownerApprovalRequired: false,
      },
      {
        key: 'student_handoff',
        title: 'Create student onboarding handoff',
        description: 'Create the student profile only after school-side review and required approval evidence are present.',
        ownerApprovalRequired: false,
      },
    ],
    ownerApprovalGate: {
      approver: 'owner',
      title: 'Admission launch approval',
      description: 'Owner approval is required before a school publishes an admission campaign or activates conversion rules.',
    },
  },
};

export function getSchoolServiceWorkflow(serviceKey: SchoolServiceKey): SchoolServiceWorkflowBlueprint {
  return SCHOOL_SERVICE_WORKFLOW_OVERRIDES[serviceKey] ?? DEFAULT_SCHOOL_SERVICE_WORKFLOW;
}

export function isSchoolServiceKey(value: string): value is SchoolServiceKey {
  return SCHOOL_SERVICE_CATALOG.some((service) => service.key === value);
}

export function normalizeSchoolServicePlanTier(value: unknown): SchoolServicePlanTier {
  return value === 'advanced' ? 'advanced' : 'basic';
}

export function getEnabledSchoolServiceKeysForPlan(
  planTier: SchoolServicePlanTier,
  configuredKeys?: unknown[],
): SchoolServiceKey[] {
  const allowed = new Set<SchoolServiceKey>(DEFAULT_SCHOOL_SERVICES_BY_PLAN[planTier]);
  const configured = Array.isArray(configuredKeys)
    ? configuredKeys.filter((key): key is SchoolServiceKey =>
      typeof key === 'string' && isSchoolServiceKey(key) && allowed.has(key))
    : [];

  return configured.length > 0 ? configured : DEFAULT_SCHOOL_SERVICES_BY_PLAN[planTier];
}
