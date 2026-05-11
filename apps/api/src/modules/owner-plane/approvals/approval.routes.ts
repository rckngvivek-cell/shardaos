import { Router } from 'express';
import { approvalDecisionSchema } from '@school-erp/shared';
import { validate } from '../../../middleware/validate.js';
import * as controller from './approval.controller.js';

export const approvalRoutes = Router();

approvalRoutes.get('/', controller.listApprovals);
approvalRoutes.post('/:id/approve', validate(approvalDecisionSchema), controller.approveApproval);
approvalRoutes.post('/:id/deny', validate(approvalDecisionSchema), controller.denyApproval);
