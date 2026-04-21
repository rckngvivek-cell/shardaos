const mockFindAll = jest.fn();
const mockCountActive = jest.fn();
const mockFindById = jest.fn();
const mockFindByUid = jest.fn();
const mockFindByEmail = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDeactivate = jest.fn();
const mockActivate = jest.fn();

const mockUpsertCredentialForPlatformUser = jest.fn();
const mockUpdatePlatformCredentialState = jest.fn();
const mockSyncPlatformCredential = jest.fn();

jest.mock('../../../src/modules/owner-plane/employees/employee.repository.js', () => ({
  EmployeeRepository: jest.fn().mockImplementation(() => ({
    findAll: mockFindAll,
    countActive: mockCountActive,
    findById: mockFindById,
    findByUid: mockFindByUid,
    findByEmail: mockFindByEmail,
    create: mockCreate,
    update: mockUpdate,
    deactivate: mockDeactivate,
    activate: mockActivate,
  })),
}));

jest.mock('../../../src/modules/auth/auth.service.js', () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    upsertCredentialForPlatformUser: mockUpsertCredentialForPlatformUser,
    updatePlatformCredentialState: mockUpdatePlatformCredentialState,
    syncPlatformCredential: mockSyncPlatformCredential,
  })),
}));

import { AppError } from '../../../src/errors/app-error.js';
import { EmployeeService } from '../../../src/modules/owner-plane/employees/employee.service.js';

describe('EmployeeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a platform employee and provisions a matching platform credential', async () => {
    mockFindByUid.mockResolvedValue(null);
    mockFindByEmail.mockResolvedValue(null);
    mockCreate.mockImplementation(async (data) => ({ id: 'employee-1', ...data }));

    const service = new EmployeeService();
    const created = await service.create('owner-1', {
      uid: 'uid-1',
      email: 'ops@example.com',
      displayName: 'Ops Lead',
      department: 'Operations',
    });

    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'uid-1',
      email: 'ops@example.com',
      displayName: 'Ops Lead',
      emailVerified: true,
      mfaEnabled: false,
      authProviderDisabled: false,
      platformAccessActive: true,
      role: 'employee',
    }));
    expect(mockUpsertCredentialForPlatformUser).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'uid-1',
      email: 'ops@example.com',
      displayName: 'Ops Lead',
      role: 'employee',
      isActive: true,
    }));
    expect(created).toEqual(expect.objectContaining({
      id: 'employee-1',
      email: 'ops@example.com',
      emailVerified: true,
      mfaEnabled: false,
      platformAccessActive: true,
    }));
  });

  it('updates an employee display name and department', async () => {
    mockFindById.mockResolvedValue({
      id: 'employee-1',
      uid: 'uid-1',
      email: 'ops@example.com',
      displayName: 'Ops Lead',
      role: 'employee',
      department: 'Operations',
      isActive: true,
      emailVerified: true,
      mfaEnabled: false,
      authProviderDisabled: false,
      platformAccessActive: true,
      lastLoginAt: '',
      lastSyncedAt: '2026-04-16T10:00:00.000Z',
      createdAt: '2026-04-16T10:00:00.000Z',
      updatedAt: '2026-04-16T10:00:00.000Z',
      onboardedBy: 'owner-1',
    });

    const service = new EmployeeService();
    const updated = await service.update('employee-1', {
      displayName: 'Operations Lead',
      department: 'Support',
    });

    expect(mockUpdate).toHaveBeenCalledWith('employee-1', {
      displayName: 'Operations Lead',
      department: 'Support',
    });
    expect(mockSyncPlatformCredential).toHaveBeenCalledWith('uid-1', expect.objectContaining({
      displayName: 'Operations Lead',
      role: 'employee',
    }));
    expect(updated).toEqual(expect.objectContaining({
      id: 'employee-1',
      displayName: 'Operations Lead',
      department: 'Support',
    }));
  });

  it('reactivates an inactive employee', async () => {
    mockFindById.mockResolvedValue({
      id: 'employee-2',
      uid: 'uid-2',
      email: 'inactive@example.com',
      displayName: 'Inactive Employee',
      role: 'employee',
      department: 'Operations',
      isActive: false,
      emailVerified: true,
      mfaEnabled: false,
      authProviderDisabled: true,
      platformAccessActive: false,
      lastLoginAt: '',
      lastSyncedAt: '2026-04-16T10:00:00.000Z',
      createdAt: '2026-04-16T10:00:00.000Z',
      updatedAt: '2026-04-16T10:00:00.000Z',
      onboardedBy: 'owner-1',
    });

    const service = new EmployeeService();
    await service.activate('employee-2');

    expect(mockUpdate).toHaveBeenCalledWith('employee-2', expect.objectContaining({
      isActive: true,
      platformAccessActive: true,
      authProviderDisabled: false,
    }));
    expect(mockUpsertCredentialForPlatformUser).toHaveBeenCalledWith(expect.objectContaining({
      uid: 'uid-2',
      email: 'inactive@example.com',
      role: 'employee',
      isActive: true,
    }));
  });

  it('rejects reactivation when the employee record is missing', async () => {
    mockFindById.mockResolvedValue(null);

    const service = new EmployeeService();

    await expect(service.activate('missing-employee')).rejects.toEqual(
      new AppError(404, 'NOT_FOUND', 'Employee missing-employee not found'),
    );
  });

  it('syncs identity metadata into the auth credential store', async () => {
    mockFindById.mockResolvedValue({
      id: 'employee-3',
      uid: 'uid-3',
      email: 'staff@example.com',
      displayName: 'Staff Member',
      role: 'employee',
      department: 'Support',
      isActive: true,
      emailVerified: true,
      mfaEnabled: true,
      authProviderDisabled: false,
      platformAccessActive: true,
      lastLoginAt: '2026-04-16T10:00:00.000Z',
      lastSyncedAt: '2026-04-16T10:00:00.000Z',
      createdAt: '2026-04-15T10:00:00.000Z',
      updatedAt: '2026-04-16T10:00:00.000Z',
      onboardedBy: 'owner-1',
    });

    const service = new EmployeeService();
    const synced = await service.syncIdentity('employee-3');

    expect(mockUpdate).toHaveBeenCalledWith('employee-3', expect.objectContaining({
      authProviderDisabled: false,
    }));
    expect(mockSyncPlatformCredential).toHaveBeenCalledWith('uid-3', expect.objectContaining({
      email: 'staff@example.com',
      displayName: 'Staff Member',
      isActive: true,
      role: 'employee',
    }));
    expect(synced).toEqual(expect.objectContaining({
      id: 'employee-3',
      authProviderDisabled: false,
      platformAccessActive: true,
    }));
  });
}
