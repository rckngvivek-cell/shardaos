import type {
  AdmissionApplicant,
  AdmissionApplicantDocument,
  AdmissionApplicantStage,
  AdmissionApplicantTimelineEvent,
  AdmissionFeeQuote,
  AdmissionPaymentReceipt,
  AdmissionGuardianCommunication,
  AdmissionOfferLetter,
  AdmissionEnrollmentChecklistItem,
  AdmissionSession,
  CreateAdmissionApplicantInput,
  CreateAdmissionSessionInput,
  UpdateAdmissionApplicantFollowUpInput,
  UpdateAdmissionSessionInput,
} from '@school-erp/shared';
import { getDocumentStore } from '../../lib/document-store.js';

const SESSIONS_COLLECTION = 'admission_sessions';
const APPLICANTS_COLLECTION = 'admission_applicants';

function schoolAdmissionSessionsRef(schoolId: string) {
  return getDocumentStore().collection('schools').doc(schoolId).collection(SESSIONS_COLLECTION);
}

function schoolAdmissionApplicantsRef(schoolId: string) {
  return getDocumentStore().collection('schools').doc(schoolId).collection(APPLICANTS_COLLECTION);
}

export class AdmissionRepository {
  async listSessions(schoolId: string): Promise<AdmissionSession[]> {
    const snap = await schoolAdmissionSessionsRef(schoolId)
      .orderBy('updatedAt', 'desc')
      .get();

    return snap.docs.map((doc) => ({ id: doc.id, schoolId, ...doc.data() }) as AdmissionSession);
  }

  async findSessionById(schoolId: string, sessionId: string): Promise<AdmissionSession | null> {
    const doc = await schoolAdmissionSessionsRef(schoolId).doc(sessionId).get();
    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, schoolId, ...doc.data() } as AdmissionSession;
  }

  async createSession(
    schoolId: string,
    createdBy: string,
    input: CreateAdmissionSessionInput,
  ): Promise<AdmissionSession> {
    const now = new Date().toISOString();
    const data = {
      ...input,
      status: 'draft' as const,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await schoolAdmissionSessionsRef(schoolId).add(data);
    return { id: ref.id, schoolId, ...data };
  }

  async updateSession(
    schoolId: string,
    sessionId: string,
    input: UpdateAdmissionSessionInput,
  ): Promise<AdmissionSession> {
    const now = new Date().toISOString();
    await schoolAdmissionSessionsRef(schoolId).doc(sessionId).update({
      ...input,
      updatedAt: now,
    });

    return (await this.findSessionById(schoolId, sessionId)) as AdmissionSession;
  }

  async markLaunchRequested(schoolId: string, sessionId: string, approvalId: string): Promise<AdmissionSession> {
    const now = new Date().toISOString();
    await schoolAdmissionSessionsRef(schoolId).doc(sessionId).update({
      status: 'pending_owner_approval',
      launchApprovalId: approvalId,
      launchRequestedAt: now,
      updatedAt: now,
    });

    return (await this.findSessionById(schoolId, sessionId)) as AdmissionSession;
  }

  async markLaunchApproved(
    schoolId: string,
    sessionId: string,
    approvalId: string,
    ownerUid: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await schoolAdmissionSessionsRef(schoolId).doc(sessionId).update({
      status: 'active',
      launchApprovalId: approvalId,
      launchApprovedAt: now,
      launchDecidedBy: ownerUid,
      updatedAt: now,
    });
  }

  async markLaunchDenied(
    schoolId: string,
    sessionId: string,
    approvalId: string,
    ownerUid: string,
    decisionNote?: string,
  ): Promise<void> {
    const now = new Date().toISOString();
    await schoolAdmissionSessionsRef(schoolId).doc(sessionId).update({
      status: 'denied',
      launchApprovalId: approvalId,
      launchDeniedAt: now,
      launchDecidedBy: ownerUid,
      launchDenialReason: decisionNote,
      updatedAt: now,
    });
  }

  async closeSession(schoolId: string, sessionId: string, closedBy: string): Promise<AdmissionSession> {
    const now = new Date().toISOString();
    await schoolAdmissionSessionsRef(schoolId).doc(sessionId).update({
      status: 'closed',
      closedAt: now,
      closedBy,
      updatedAt: now,
    });

    return (await this.findSessionById(schoolId, sessionId)) as AdmissionSession;
  }

  async reopenDeniedSession(schoolId: string, sessionId: string, reopenedBy: string): Promise<AdmissionSession> {
    const session = await this.findSessionById(schoolId, sessionId);
    if (!session) {
      throw new Error(`Admission session ${sessionId} not found`);
    }

    const now = new Date().toISOString();
    const {
      id: _id,
      schoolId: _schoolId,
      launchApprovalId: _launchApprovalId,
      launchRequestedAt: _launchRequestedAt,
      launchApprovedAt: _launchApprovedAt,
      launchDeniedAt: _launchDeniedAt,
      launchDecidedBy: _launchDecidedBy,
      launchDenialReason: _launchDenialReason,
      ...sessionData
    } = session;

    await schoolAdmissionSessionsRef(schoolId).doc(sessionId).set({
      ...sessionData,
      status: 'draft',
      reopenedAt: now,
      reopenedBy,
      updatedAt: now,
    });

    return (await this.findSessionById(schoolId, sessionId)) as AdmissionSession;
  }

  async listApplicants(schoolId: string, sessionId?: string): Promise<AdmissionApplicant[]> {
    let query = schoolAdmissionApplicantsRef(schoolId).orderBy('updatedAt', 'desc');
    if (sessionId) {
      query = query.where('sessionId', '==', sessionId).orderBy('updatedAt', 'desc');
    }

    const snap = await query.get();
    return snap.docs.map((doc) => ({ id: doc.id, schoolId, ...doc.data() }) as AdmissionApplicant);
  }

  async findApplicantById(schoolId: string, applicantId: string): Promise<AdmissionApplicant | null> {
    const doc = await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).get();
    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, schoolId, ...doc.data() } as AdmissionApplicant;
  }

  async createApplicant(
    schoolId: string,
    createdBy: string,
    input: CreateAdmissionApplicantInput,
    documents: AdmissionApplicantDocument[],
  ): Promise<AdmissionApplicant> {
    const now = new Date().toISOString();
    const applicantNumber = await this.nextApplicantNumber(schoolId, input.sessionId);
    const timeline: AdmissionApplicantTimelineEvent[] = [{
      at: now,
      by: createdBy,
      type: 'created',
      message: `Captured enquiry for ${input.studentName}`,
    }];
    const data = {
      ...input,
      applicantNumber,
      documents,
      stage: 'new_enquiry' as const,
      timeline,
      createdBy,
      createdAt: now,
      updatedAt: now,
    };

    const ref = await schoolAdmissionApplicantsRef(schoolId).add(data);
    return { id: ref.id, schoolId, ...data };
  }

  async updateApplicantStage(
    schoolId: string,
    applicantId: string,
    stage: AdmissionApplicantStage,
    event: AdmissionApplicantTimelineEvent,
    metadata: Partial<AdmissionApplicant> = {},
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      stage,
      ...metadata,
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async updateApplicantFollowUp(
    schoolId: string,
    applicantId: string,
    followUp: UpdateAdmissionApplicantFollowUpInput & { updatedAt: string; updatedBy: string },
    event: AdmissionApplicantTimelineEvent,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      followUp,
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async updateApplicantOffer(
    schoolId: string,
    applicantId: string,
    feeQuote: AdmissionFeeQuote,
    offerLetter: AdmissionOfferLetter,
    event: AdmissionApplicantTimelineEvent,
    communication?: AdmissionGuardianCommunication,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      feeQuote,
      offerLetter,
      guardianCommunications: communication
        ? [...(applicant.guardianCommunications ?? []), communication]
        : applicant.guardianCommunications ?? [],
      timeline: [
        ...applicant.timeline,
        event,
        ...(communication ? [{
          at: communication.sentAt,
          by: communication.sentBy,
          type: 'guardian_communication_sent' as const,
          message: `${communication.channel} communication sent: ${communication.subject}`,
        }] : []),
      ],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async acceptApplicantOffer(
    schoolId: string,
    applicantId: string,
    acceptedAt: string,
    acceptedBy: string,
    event: AdmissionApplicantTimelineEvent,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      offerLetter: {
        ...applicant.offerLetter,
        status: 'accepted',
        acceptedAt,
        acceptedBy,
      },
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async addGuardianCommunication(
    schoolId: string,
    applicantId: string,
    communication: AdmissionGuardianCommunication,
    event: AdmissionApplicantTimelineEvent,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      guardianCommunications: [...(applicant.guardianCommunications ?? []), communication],
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async recordApplicantPayment(
    schoolId: string,
    applicantId: string,
    paymentReceipt: AdmissionPaymentReceipt,
    event: AdmissionApplicantTimelineEvent,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      paymentReceipt,
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async updateEnrollmentChecklist(
    schoolId: string,
    applicantId: string,
    enrollmentChecklist: AdmissionEnrollmentChecklistItem[],
    event: AdmissionApplicantTimelineEvent,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      enrollmentChecklist,
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async updateApplicantDocument(
    schoolId: string,
    applicantId: string,
    documentKey: string,
    document: AdmissionApplicantDocument,
    nextStage: AdmissionApplicantStage,
    event: AdmissionApplicantTimelineEvent,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      documents: applicant.documents.map((item) => (item.key === documentKey ? document : item)),
      stage: nextStage,
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  async markApplicantConverted(
    schoolId: string,
    applicantId: string,
    studentId: string,
    event: AdmissionApplicantTimelineEvent,
  ): Promise<AdmissionApplicant> {
    const applicant = await this.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new Error(`Admission applicant ${applicantId} not found`);
    }

    await schoolAdmissionApplicantsRef(schoolId).doc(applicantId).update({
      stage: 'converted_to_student',
      convertedStudentId: studentId,
      convertedAt: event.at,
      convertedBy: event.by,
      timeline: [...applicant.timeline, event],
      updatedAt: event.at,
    });

    return (await this.findApplicantById(schoolId, applicantId)) as AdmissionApplicant;
  }

  private async nextApplicantNumber(schoolId: string, sessionId: string): Promise<string> {
    const snap = await schoolAdmissionApplicantsRef(schoolId)
      .where('sessionId', '==', sessionId)
      .count()
      .get();

    return `ADM-${String(snap.data().count + 1).padStart(5, '0')}`;
  }
}
