import { Router } from 'express';
import { requirePlatformRole } from '../../middleware/owner-plane/index.js';
import { ownerRoutes } from './owner/owner.routes.js';
import { employeeRoutes } from './employees/employee.routes.js';
import { approvalRoutes } from './approvals/approval.routes.js';
import { schoolManagementRoutes } from './schools/school-management.routes.js';
import { schoolOnboardingRoutes } from './school-onboarding/school-onboarding.routes.js';

export const ownerPlaneRoutes = Router();

// Owner-plane rollout: employees can request work, owners retain final authority.
ownerPlaneRoutes.use('/owner', requirePlatformRole('owner'), ownerRoutes);
ownerPlaneRoutes.use('/employees', requirePlatformRole('owner'), employeeRoutes);
ownerPlaneRoutes.use('/school-onboarding', requirePlatformRole('employee'), schoolOnboardingRoutes);
ownerPlaneRoutes.use('/approvals', requirePlatformRole('owner'), approvalRoutes);
ownerPlaneRoutes.use('/schools', requirePlatformRole('owner'), schoolManagementRoutes);
