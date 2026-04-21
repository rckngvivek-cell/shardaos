import { Router } from 'express';
import { requirePlatformRole } from '../../middleware/owner-plane/index.js';
import { ownerRoutes } from './owner/owner.routes.js';
import { employeeRoutes } from './employees/employee.routes.js';
import { approvalRoutes } from './approvals/approval.routes.js';

export const ownerPlaneRoutes = Router();

// Owner-first rollout: all routes are owner-only.
ownerPlaneRoutes.use('/owner', requirePlatformRole('owner'), ownerRoutes);
ownerPlaneRoutes.use('/employees', requirePlatformRole('owner'), employeeRoutes);
ownerPlaneRoutes.use('/approvals', requirePlatformRole('owner'), approvalRoutes);
