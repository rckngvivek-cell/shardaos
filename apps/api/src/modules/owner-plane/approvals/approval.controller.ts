import type { Request, Response, NextFunction } from 'express';
import type { ApprovalDecisionInput, ApprovalStatus, AuditLog } from '@school-erp/shared';
import { AppError } from '../../../errors/app-error.js';
import { successResponse } from '../../../lib/api-response.js';
import { ApprovalService } from './approval.service.js';

const service = new ApprovalService();

export async function listApprovals(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as ApprovalStatus | undefined;
    const approvals = await service.list(status);
    res.json(successResponse(approvals));
  } catch (err) {
    next(err);
  }
}

export async function approveApproval(req: Request, res: Response, next: NextFunction) {
  try {
    const platformUser = req.platformUser;
    if (!platformUser) {
      throw new AppError(401, 'UNAUTHORIZED', 'Platform authentication required');
    }

    const input = req.body as ApprovalDecisionInput;
    const approval = await service.approve(req.params.id as string, platformUser.uid, input.decisionNote);
    const targetType = mapApprovalTargetType(approval.type);

    await req.audit?.('APPROVAL_GRANTED', targetType, approval.id, {
      approvalType: approval.type,
      requestedBy: approval.requestedBy,
      decisionNote: approval.decisionNote,
    });

    if (approval.type === 'school_onboarding') {
      const schoolId = typeof approval.metadata?.schoolId === 'string' ? approval.metadata.schoolId : undefined;
      await req.audit?.('SCHOOL_ONBOARDED', 'school', schoolId, {
        approvalId: approval.id,
        requestedBy: approval.requestedBy,
        servicePlanTier: approval.metadata?.servicePlanTier,
      });
    }

    res.json(successResponse(approval));
  } catch (err) {
    next(err);
  }
}

export async function denyApproval(req: Request, res: Response, next: NextFunction) {
  try {
    const platformUser = req.platformUser;
    if (!platformUser) {
      throw new AppError(401, 'UNAUTHORIZED', 'Platform authentication required');
    }

    const input = req.body as ApprovalDecisionInput;
    const approval = await service.deny(req.params.id as string, platformUser.uid, input.decisionNote);
    const targetType = mapApprovalTargetType(approval.type);

    await req.audit?.('APPROVAL_DENIED', targetType, approval.id, {
      approvalType: approval.type,
      requestedBy: approval.requestedBy,
      decisionNote: approval.decisionNote,
    });

    res.json(successResponse(approval));
  } catch (err) {
    next(err);
  }
}

function mapApprovalTargetType(type: string): AuditLog['targetType'] {
  if (type === 'employee_onboarding') return 'employee';
  if (type === 'exam_schedule') return 'exam';
  if (type === 'school_onboarding' || type === 'school_suspension' || type === 'admission_launch') return 'school';
  return 'settings';
}
