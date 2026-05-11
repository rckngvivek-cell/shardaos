import type { NextFunction, Request, Response } from 'express';
import type {
  ConvertAdmissionApplicantInput,
  CreateAdmissionApplicantInput,
  CreateAdmissionSessionInput,
  IssueAdmissionOfferInput,
  RecordAdmissionPaymentInput,
  SendAdmissionGuardianCommunicationInput,
  UpdateAdmissionApplicantDocumentInput,
  UpdateAdmissionEnrollmentChecklistInput,
  UpdateAdmissionApplicantFollowUpInput,
  UpdateAdmissionApplicantStageInput,
  UpdateAdmissionSessionInput,
} from '@school-erp/shared';
import { successResponse } from '../../lib/api-response.js';
import { AdmissionService } from './admission.service.js';

const service = new AdmissionService();

export async function listAdmissionSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await service.listSessions(req.user!.schoolId);
    res.json(successResponse(sessions));
  } catch (err) {
    next(err);
  }
}

export async function createAdmissionSession(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as CreateAdmissionSessionInput;
    const session = await service.createSession(req.user!.schoolId, req.user!.uid, input);
    res.status(201).json(successResponse(session));
  } catch (err) {
    next(err);
  }
}

export async function updateAdmissionSession(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as UpdateAdmissionSessionInput;
    const session = await service.updateSession(req.user!, req.params.id as string, input);
    res.json(successResponse(session));
  } catch (err) {
    next(err);
  }
}

export async function getAdmissionSessionCapacity(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await service.getCapacitySummary(req.user!.schoolId, req.params.id as string);
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
}

export async function getAdmissionAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await service.getAnalyticsSummary(req.user!.schoolId);
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
}

export async function getAdmissionWorkQueue(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await service.getWorkQueue(req.user!.schoolId);
    res.json(successResponse(summary));
  } catch (err) {
    next(err);
  }
}

export async function listAdmissionApplicants(req: Request, res: Response, next: NextFunction) {
  try {
    const applicants = await service.listApplicants(
      req.user!.schoolId,
      typeof req.query.sessionId === 'string' ? req.query.sessionId : undefined,
    );
    res.json(successResponse(applicants));
  } catch (err) {
    next(err);
  }
}

export async function createAdmissionApplicant(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as CreateAdmissionApplicantInput;
    const applicant = await service.createApplicant(req.user!, input);
    res.status(201).json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function updateAdmissionApplicantStage(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as UpdateAdmissionApplicantStageInput;
    const applicant = await service.updateApplicantStage(req.user!, req.params.id as string, input);
    res.json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function updateAdmissionApplicantDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as UpdateAdmissionApplicantDocumentInput;
    const applicant = await service.updateApplicantDocument(
      req.user!,
      req.params.id as string,
      req.params.documentKey as string,
      input,
    );
    res.json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function updateAdmissionApplicantFollowUp(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as UpdateAdmissionApplicantFollowUpInput;
    const applicant = await service.updateApplicantFollowUp(req.user!, req.params.id as string, input);
    res.json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function issueAdmissionApplicantOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as IssueAdmissionOfferInput;
    const applicant = await service.issueApplicantOffer(req.user!, req.params.id as string, input);
    res.status(201).json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function acceptAdmissionApplicantOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const applicant = await service.acceptApplicantOffer(req.user!, req.params.id as string);
    res.json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function sendAdmissionGuardianCommunication(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as SendAdmissionGuardianCommunicationInput;
    const applicant = await service.sendGuardianCommunication(req.user!, req.params.id as string, input);
    res.status(201).json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function recordAdmissionApplicantPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as RecordAdmissionPaymentInput;
    const applicant = await service.recordApplicantPayment(req.user!, req.params.id as string, input);
    res.status(201).json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function updateAdmissionEnrollmentChecklist(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as UpdateAdmissionEnrollmentChecklistInput;
    const applicant = await service.updateEnrollmentChecklist(req.user!, req.params.id as string, input);
    res.json(successResponse(applicant));
  } catch (err) {
    next(err);
  }
}

export async function convertAdmissionApplicantToStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const input = req.body as ConvertAdmissionApplicantInput;
    const result = await service.convertApplicantToStudent(req.user!, req.params.id as string, input);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function requestAdmissionLaunchApproval(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await service.requestLaunchApproval(req.user!, req.params.id as string);
    res.status(201).json(successResponse(result));
  } catch (err) {
    next(err);
  }
}

export async function closeAdmissionSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await service.closeSession(req.user!, req.params.id as string);
    res.json(successResponse(session));
  } catch (err) {
    next(err);
  }
}

export async function reopenDeniedAdmissionSession(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await service.reopenDeniedSession(req.user!, req.params.id as string);
    res.json(successResponse(session));
  } catch (err) {
    next(err);
  }
}
