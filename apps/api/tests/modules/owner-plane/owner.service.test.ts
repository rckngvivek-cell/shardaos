const mockListEmployees = jest.fn();
const mockListApprovals = jest.fn();
const mockListSchools = jest.fn();
const mockCountStudents = jest.fn();
const mockLatestEnrollmentAt = jest.fn();
const mockLatestAttendanceAt = jest.fn();
const mockLatestGradesAt = jest.fn();
const mockListRecentAuditLogs = jest.fn();
const mockListAuditLogsSince = jest.fn();

jest.mock('../../../src/modules/owner-plane/employees/employee.service.js', () => ({
  EmployeeService: jest.fn().mockImplementation(() => ({
    list: mockListEmployees,
    countActive: jest.fn(),
  })),
}));

jest.mock('../../../src/modules/owner-plane/approvals/approval.service.js', () => ({
  ApprovalService: jest.fn().mockImplementation(() => ({
    list: mockListApprovals,
    countPending: jest.fn(),
  })),
}));

jest.mock('../../../src/modules/schools/school.repository.js', () => ({
  SchoolRepository: jest.fn().mockImplementation(() => ({
    findAll: mockListSchools,
  })),
}));

jest.mock('../../../src/modules/students/student.repository.js', () => ({
  StudentRepository: jest.fn().mockImplementation(() => ({
    countActive: mockCountStudents,
    getLatestEnrollmentAt: mockLatestEnrollmentAt,
  })),
}));

jest.mock('../../../src/modules/attendance/attendance.repository.js', () => ({
  AttendanceRepository: jest.fn().mockImplementation(() => ({
    getLatestRecordedAt: mockLatestAttendanceAt,
  })),
}));

jest.mock('../../../src/modules/grades/grades.repository.js', () => ({
  GradesRepository: jest.fn().mockImplementation(() => ({
    getLatestPublishedAt: mockLatestGradesAt,
  })),
}));

jest.mock('../../../src/modules/owner-plane/owner/audit-log.repository.js', () => ({
  AuditLogRepository: jest.fn().mockImplementation(() => ({
    listRecent: mockListRecentAuditLogs,
    listSince: mockListAuditLogsSince,
  })),
}));

import { OwnerService } from '../../../src/modules/owner-plane/owner/owner.service.js';

describe('OwnerService school operations dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-04-16T12:00:00.000Z'));
    mockListRecentAuditLogs.mockResolvedValue([]);
    mockListAuditLogsSince.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('derives onboarding risk and exception queues from live school activity', async () => {
    mockListEmployees.mockResolvedValue([]);
    mockListApprovals.mockResolvedValue([
      {
        id: 'approval-east',
        type: 'school_onboarding',
        status: 'pending',
        requestedBy: 'employee-1',
        requestedByEmail: 'ops@example.com',
        title: 'Onboard East Campus',
        description: 'Awaiting owner decision',
        metadata: { schoolId: 'school-east' },
        createdAt: '2026-04-14T02:00:00.000Z',
        updatedAt: '2026-04-14T02:00:00.000Z',
      },
    ]);

    mockListSchools.mockResolvedValue([
      {
        id: 'school-east',
        name: 'East Campus',
        code: 'EAST',
        address: '1 East Road',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India',
        phone: '111',
        email: 'east@example.com',
        principalName: 'East Principal',
        studentCount: 0,
        isActive: true,
        createdAt: '2026-04-13T04:00:00.000Z',
        updatedAt: '2026-04-13T04:00:00.000Z',
      },
      {
        id: 'school-west',
        name: 'West Campus',
        code: 'WEST',
        address: '2 West Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        phone: '222',
        email: 'west@example.com',
        principalName: 'West Principal',
        studentCount: 480,
        isActive: true,
        createdAt: '2026-03-01T04:00:00.000Z',
        updatedAt: '2026-03-01T04:00:00.000Z',
      },
      {
        id: 'school-north',
        name: 'North Campus',
        code: 'NORTH',
        address: '3 North Road',
        city: 'Pune',
        state: 'Maharashtra',
        country: 'India',
        phone: '333',
        email: 'north@example.com',
        principalName: 'North Principal',
        studentCount: 620,
        isActive: true,
        createdAt: '2026-02-01T04:00:00.000Z',
        updatedAt: '2026-02-01T04:00:00.000Z',
      },
    ]);

    mockCountStudents.mockImplementation(async (schoolId: string) => {
      switch (schoolId) {
        case 'school-east':
          return 0;
        case 'school-west':
          return 480;
        case 'school-north':
          return 620;
        default:
          return 0;
      }
    });

    mockLatestEnrollmentAt.mockImplementation(async (schoolId: string) => {
      switch (schoolId) {
        case 'school-east':
          return null;
        case 'school-west':
          return '2026-04-01T04:00:00.000Z';
        case 'school-north':
          return '2026-04-10T04:00:00.000Z';
        default:
          return null;
      }
    });

    mockLatestAttendanceAt.mockImplementation(async (schoolId: string) => {
      switch (schoolId) {
        case 'school-east':
          return null;
        case 'school-west':
          return '2026-04-09T04:00:00.000Z';
        case 'school-north':
          return '2026-04-14T02:00:00.000Z';
        default:
          return null;
      }
    });

    mockLatestGradesAt.mockImplementation(async (schoolId: string) => {
      switch (schoolId) {
        case 'school-east':
          return null;
        case 'school-west':
          return '2026-04-10T04:00:00.000Z';
        case 'school-north':
          return '2026-04-12T04:00:00.000Z';
        default:
          return null;
      }
    });

    const service = new OwnerService();
    const dashboard = await service.getDashboard({
      uid: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
    });

    expect(dashboard.schoolOperations.totalSchools).toBe(3);
    expect(dashboard.schoolOperations.onboardingRiskCount).toBe(1);
    expect(dashboard.schoolOperations.exceptionCount).toBe(1);
    expect(dashboard.schoolOperations.topRisks).toEqual([
      expect.objectContaining({
        schoolId: 'school-west',
        status: 'watch',
      }),
      expect.objectContaining({
        schoolId: 'school-east',
        status: 'onboarding',
      }),
    ]);
    expect(dashboard.alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'school-onboarding-risk' }),
        expect.objectContaining({ id: 'school-ops-exceptions' }),
      ]),
    );
    expect(dashboard.overview.overallStatus).toBe('watch');
  });

  it('derives the owner security center from audit logs and employee access posture', async () => {
    const auditLogFixture = [
      {
        id: 'audit-1',
        action: 'EMPLOYEE_DEACTIVATED',
        performedBy: 'owner-uid-1',
        performedByEmail: 'owner@example.com',
        performedByRole: 'owner',
        targetType: 'employee',
        targetId: 'employee-1',
        metadata: { path: '/employees/employee-1', requestId: 'req-1' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        timestamp: '2026-04-16T04:00:00.000Z',
      },
      {
        id: 'audit-2',
        action: 'SETTINGS_CHANGED',
        performedBy: 'owner-uid-1',
        performedByEmail: 'owner@example.com',
        performedByRole: 'owner',
        targetType: 'settings',
        targetId: 'platform-settings',
        metadata: { path: '/settings', requestId: 'req-2' },
        ipAddress: '10.0.0.2',
        userAgent: 'jest',
        timestamp: '2026-04-16T03:30:00.000Z',
      },
      {
        id: 'audit-3',
        action: 'EMPLOYEE_UPDATED',
        performedBy: 'owner-uid-2',
        performedByEmail: 'security@example.com',
        performedByRole: 'owner',
        targetType: 'employee',
        targetId: 'employee-1',
        metadata: { syncType: 'identity', requestId: 'req-3' },
        ipAddress: '10.0.0.3',
        userAgent: 'jest',
        timestamp: '2026-04-16T03:15:00.000Z',
      },
    ];

    mockListEmployees.mockResolvedValue([
      {
        id: 'employee-1',
        uid: 'uid-1',
        email: 'ops@example.com',
        displayName: 'Ops Lead',
        role: 'employee',
        department: 'Operations',
        isActive: true,
        emailVerified: false,
        mfaEnabled: false,
        authProviderDisabled: true,
        platformAccessActive: false,
        lastLoginAt: '',
        lastSyncedAt: '2026-04-16T03:55:00.000Z',
        createdAt: '2026-04-12T04:00:00.000Z',
        updatedAt: '2026-04-16T03:55:00.000Z',
        onboardedBy: 'owner-uid-1',
      },
      {
        id: 'employee-2',
        uid: 'uid-2',
        email: 'finance@example.com',
        displayName: 'Finance Lead',
        role: 'employee',
        department: 'Finance',
        isActive: true,
        emailVerified: true,
        mfaEnabled: true,
        authProviderDisabled: false,
        platformAccessActive: true,
        lastLoginAt: '2026-04-16T02:00:00.000Z',
        lastSyncedAt: '2026-04-16T03:00:00.000Z',
        createdAt: '2026-04-10T04:00:00.000Z',
        updatedAt: '2026-04-16T03:00:00.000Z',
        onboardedBy: 'owner-uid-1',
      },
    ]);
    mockListRecentAuditLogs.mockResolvedValue(auditLogFixture);
    mockListAuditLogsSince.mockResolvedValue(auditLogFixture);

    const service = new OwnerService();
    const securityCenter = await service.getSecurityCenter({
      uid: 'owner-uid-1',
      email: 'owner@example.com',
      role: 'owner',
      plane: 'platform',
    });

    expect(securityCenter.overview).toEqual(expect.objectContaining({
      privilegedActions24h: 3,
      riskyEvents24h: 2,
      uniqueActors24h: 2,
      uniqueIpAddresses24h: 3,
      employeesNeedingReview: 1,
      disabledIdentities: 1,
      mfaCoveragePercent: 50,
    }));
    expect(securityCenter.findings).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: 'disabled-identities',
        severity: 'critical',
      }),
      expect.objectContaining({
        id: 'recent-settings-change',
        severity: 'info',
      }),
    ]));
    expect(securityCenter.accessReviewQueue).toEqual([
      expect.objectContaining({
        employeeId: 'employee-1',
        reasons: expect.arrayContaining([
          'identity access is disabled',
          'platform access is disabled',
          'email is not verified',
          'MFA is not enabled',
        ]),
      }),
    ]);
    expect(securityCenter.priorityEvents[0]).toEqual(expect.objectContaining({
      action: 'EMPLOYEE_DEACTIVATED',
      title: 'Employee access deactivated',
    }));
    expect(securityCenter.actionCounts).toEqual(expect.arrayContaining([
      expect.objectContaining({ action: 'SETTINGS_CHANGED', count: 1 }),
    ]));
  });
});
