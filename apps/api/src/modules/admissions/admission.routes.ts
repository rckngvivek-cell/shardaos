import { Router } from 'express';
import {
  convertAdmissionApplicantSchema,
  createAdmissionApplicantSchema,
  createAdmissionSessionSchema,
  issueAdmissionOfferSchema,
  recordAdmissionPaymentSchema,
  sendAdmissionGuardianCommunicationSchema,
  updateAdmissionEnrollmentChecklistSchema,
  updateAdmissionApplicantFollowUpSchema,
  updateAdmissionApplicantDocumentSchema,
  updateAdmissionApplicantStageSchema,
  updateAdmissionSessionSchema,
} from '@school-erp/shared';
import { validate } from '../../middleware/validate.js';
import * as controller from './admission.controller.js';

export const admissionRoutes = Router();

admissionRoutes.get('/analytics', controller.getAdmissionAnalytics);
admissionRoutes.get('/work-queue', controller.getAdmissionWorkQueue);
admissionRoutes.get('/sessions', controller.listAdmissionSessions);
admissionRoutes.post('/sessions', validate(createAdmissionSessionSchema), controller.createAdmissionSession);
admissionRoutes.put('/sessions/:id', validate(updateAdmissionSessionSchema), controller.updateAdmissionSession);
admissionRoutes.get('/sessions/:id/capacity', controller.getAdmissionSessionCapacity);
admissionRoutes.post('/sessions/:id/request-launch-approval', controller.requestAdmissionLaunchApproval);
admissionRoutes.post('/sessions/:id/close', controller.closeAdmissionSession);
admissionRoutes.post('/sessions/:id/reopen', controller.reopenDeniedAdmissionSession);

admissionRoutes.get('/applicants', controller.listAdmissionApplicants);
admissionRoutes.post('/applicants', validate(createAdmissionApplicantSchema), controller.createAdmissionApplicant);
admissionRoutes.patch(
  '/applicants/:id/stage',
  validate(updateAdmissionApplicantStageSchema),
  controller.updateAdmissionApplicantStage,
);
admissionRoutes.patch(
  '/applicants/:id/documents/:documentKey',
  validate(updateAdmissionApplicantDocumentSchema),
  controller.updateAdmissionApplicantDocument,
);
admissionRoutes.patch(
  '/applicants/:id/follow-up',
  validate(updateAdmissionApplicantFollowUpSchema),
  controller.updateAdmissionApplicantFollowUp,
);
admissionRoutes.post(
  '/applicants/:id/offer',
  validate(issueAdmissionOfferSchema),
  controller.issueAdmissionApplicantOffer,
);
admissionRoutes.post(
  '/applicants/:id/offer/accept',
  controller.acceptAdmissionApplicantOffer,
);
admissionRoutes.post(
  '/applicants/:id/communications',
  validate(sendAdmissionGuardianCommunicationSchema),
  controller.sendAdmissionGuardianCommunication,
);
admissionRoutes.post(
  '/applicants/:id/payment',
  validate(recordAdmissionPaymentSchema),
  controller.recordAdmissionApplicantPayment,
);
admissionRoutes.patch(
  '/applicants/:id/enrollment-checklist',
  validate(updateAdmissionEnrollmentChecklistSchema),
  controller.updateAdmissionEnrollmentChecklist,
);
admissionRoutes.post(
  '/applicants/:id/convert-to-student',
  validate(convertAdmissionApplicantSchema),
  controller.convertAdmissionApplicantToStudent,
);
