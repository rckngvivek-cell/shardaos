import { Router } from 'express';
import * as controller from './approval.controller.js';

export const approvalRoutes = Router();

approvalRoutes.get('/', controller.listApprovals);
approvalRoutes.post('/:id/approve', controller.approveApproval);
approvalRoutes.post('/:id/deny', controller.denyApproval);
