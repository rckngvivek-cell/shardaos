import type {
  AdmissionAnalyticsSummary,
  AdmissionApplicant,
  AdmissionApplicantDocument,
  AdmissionApplicantStage,
  AdmissionFollowUpPriority,
  AdmissionApplicantTimelineEvent,
  AdmissionFeeQuote,
  AdmissionEnrollmentChecklistItem,
  AdmissionGuardianCommunication,
  AdmissionLaunchApprovalMetadata,
  AdmissionLaunchApprovalRequestResult,
  AdmissionOfferLetter,
  AdmissionPaymentReceipt,
  AdmissionSessionCapacitySummary,
  AdmissionSession,
  AdmissionWorkQueueBucket,
  AdmissionWorkQueueItem,
  AdmissionWorkQueueKind,
  AdmissionWorkQueueSummary,
  ConvertAdmissionApplicantInput,
  CreateAdmissionApplicantInput,
  CreateStudentInput,
  CreateAdmissionSessionInput,
  IssueAdmissionOfferInput,
  RecordAdmissionPaymentInput,
  SendAdmissionGuardianCommunicationInput,
  Student,
  TenantAuthUser,
  UpdateAdmissionApplicantDocumentInput,
  UpdateAdmissionEnrollmentChecklistInput,
  UpdateAdmissionApplicantFollowUpInput,
  UpdateAdmissionApplicantStageInput,
  UpdateAdmissionSessionInput,
} from '@school-erp/shared';
import { AppError } from '../../errors/app-error.js';
import { ApprovalRepository } from '../owner-plane/approvals/approval.repository.js';
import { SchoolService } from '../schools/school.service.js';
import { StudentRepository } from '../students/student.repository.js';
import { AdmissionRepository } from './admission.repository.js';

const ADMISSION_APPLICANT_STAGES: AdmissionApplicantStage[] = [
  'new_enquiry',
  'contacted',
  'application_started',
  'documents_pending',
  'ready_for_review',
  'admitted',
  'waitlisted',
  'converted_to_student',
  'rejected',
  'withdrawn',
];

const ADMISSION_WORK_QUEUE_LABELS: Record<AdmissionWorkQueueKind, string> = {
  due_follow_up: 'Due follow-ups',
  document_review: 'Document review',
  offer_pending: 'Offer pending',
  payment_pending: 'Payment pending',
  checklist_pending: 'Checklist pending',
  ready_to_convert: 'Ready to convert',
};

const ADMISSION_WORK_QUEUE_ORDER: AdmissionWorkQueueKind[] = [
  'due_follow_up',
  'document_review',
  'offer_pending',
  'payment_pending',
  'checklist_pending',
  'ready_to_convert',
];

export class AdmissionService {
  private repo = new AdmissionRepository();
  private approvalRepository = new ApprovalRepository();
  private schoolService = new SchoolService();
  private studentRepository = new StudentRepository();

  async listSessions(schoolId: string): Promise<AdmissionSession[]> {
    await this.requireAdmissionCrm(schoolId);
    return this.repo.listSessions(schoolId);
  }

  async listApplicants(schoolId: string, sessionId?: string): Promise<AdmissionApplicant[]> {
    await this.requireAdmissionCrm(schoolId);
    if (sessionId) {
      await this.getSessionOrThrow(schoolId, sessionId);
    }
    return this.repo.listApplicants(schoolId, sessionId);
  }

  async getCapacitySummary(schoolId: string, sessionId: string): Promise<AdmissionSessionCapacitySummary> {
    await this.requireAdmissionCrm(schoolId);
    const session = await this.getSessionOrThrow(schoolId, sessionId);
    const applicants = await this.repo.listApplicants(schoolId, sessionId);
    return this.buildCapacitySummary(session, applicants);
  }

  async getAnalyticsSummary(schoolId: string): Promise<AdmissionAnalyticsSummary> {
    await this.requireAdmissionCrm(schoolId);
    const sessions = await this.repo.listSessions(schoolId);
    const applicants = await this.repo.listApplicants(schoolId);
    const generatedAt = new Date().toISOString();
    const sessionAnalytics = sessions.map((session) => {
      const sessionApplicants = applicants.filter((applicant) => applicant.sessionId === session.id);
      const capacity = this.buildCapacitySummary(session, sessionApplicants);
      return {
        sessionId: session.id,
        sessionName: session.name,
        academicYear: session.academicYear,
        status: session.status,
        totalApplicants: sessionApplicants.length,
        stages: this.buildStageAnalytics(sessionApplicants),
        offersIssued: sessionApplicants.filter((applicant) => Boolean(applicant.offerLetter)).length,
        offersAccepted: sessionApplicants.filter((applicant) => applicant.offerLetter?.status === 'accepted').length,
        paymentsRecorded: sessionApplicants.filter((applicant) => Boolean(applicant.paymentReceipt)).length,
        checklistReady: sessionApplicants.filter((applicant) => this.isEnrollmentChecklistReady(applicant)).length,
        readyToConvert: sessionApplicants.filter((applicant) => this.isReadyToConvert(applicant)).length,
        converted: sessionApplicants.filter((applicant) => applicant.stage === 'converted_to_student').length,
        openFollowUps: sessionApplicants.filter((applicant) => this.hasOpenFollowUp(applicant)).length,
        dueFollowUps: sessionApplicants.filter((applicant) => this.hasDueFollowUp(applicant, generatedAt)).length,
        capacity,
      };
    });
    const capacityTotals = sessionAnalytics.reduce(
      (totals, item) => this.addCapacityTotals(totals, item.capacity),
      { seatsAvailable: 0, seatsOccupied: 0, totalSeats: 0 },
    );

    return {
      schoolId,
      generatedAt,
      totals: {
        sessions: sessions.length,
        activeSessions: sessions.filter((session) => session.status === 'active').length,
        applicants: applicants.length,
        offersIssued: applicants.filter((applicant) => Boolean(applicant.offerLetter)).length,
        offersAccepted: applicants.filter((applicant) => applicant.offerLetter?.status === 'accepted').length,
        paymentsRecorded: applicants.filter((applicant) => Boolean(applicant.paymentReceipt)).length,
        checklistReady: applicants.filter((applicant) => this.isEnrollmentChecklistReady(applicant)).length,
        readyToConvert: applicants.filter((applicant) => this.isReadyToConvert(applicant)).length,
        converted: applicants.filter((applicant) => applicant.stage === 'converted_to_student').length,
        openFollowUps: applicants.filter((applicant) => this.hasOpenFollowUp(applicant)).length,
        dueFollowUps: applicants.filter((applicant) => this.hasDueFollowUp(applicant, generatedAt)).length,
        ...capacityTotals,
      },
      stages: this.buildStageAnalytics(applicants),
      sessions: sessionAnalytics,
    };
  }

  async getWorkQueue(schoolId: string): Promise<AdmissionWorkQueueSummary> {
    await this.requireAdmissionCrm(schoolId);
    const generatedAt = new Date().toISOString();
    const sessions = await this.repo.listSessions(schoolId);
    const applicants = await this.repo.listApplicants(schoolId);
    const sessionNames = new Map(sessions.map((session) => [session.id, session.name]));
    const items = applicants.flatMap((applicant) => this.buildWorkQueueItems(
      applicant,
      sessionNames.get(applicant.sessionId) ?? applicant.sessionId,
      generatedAt,
    ));

    const buckets: AdmissionWorkQueueBucket[] = ADMISSION_WORK_QUEUE_ORDER.map((kind) => {
      const bucketItems = items
        .filter((item) => item.kind === kind)
        .sort((first, second) => first.sortAt.localeCompare(second.sortAt))
        .slice(0, 5);

      return {
        kind,
        label: ADMISSION_WORK_QUEUE_LABELS[kind],
        count: items.filter((item) => item.kind === kind).length,
        items: bucketItems,
      };
    });

    return {
      schoolId,
      generatedAt,
      totalOpenItems: items.length,
      buckets,
    };
  }

  async createSession(
    schoolId: string,
    createdBy: string,
    input: CreateAdmissionSessionInput,
  ): Promise<AdmissionSession> {
    await this.requireAdmissionCrm(schoolId);
    return this.repo.createSession(schoolId, createdBy, this.normalizeInput(input));
  }

  async updateSession(
    user: TenantAuthUser,
    sessionId: string,
    input: UpdateAdmissionSessionInput,
  ): Promise<AdmissionSession> {
    await this.requireAdmissionCrm(user.schoolId);
    const session = await this.getSessionOrThrow(user.schoolId, sessionId);
    this.requireEditableSession(session);

    return this.repo.updateSession(user.schoolId, session.id, this.normalizeInput(input));
  }

  async requestLaunchApproval(
    user: TenantAuthUser,
    sessionId: string,
  ): Promise<AdmissionLaunchApprovalRequestResult> {
    await this.requireAdmissionCrm(user.schoolId);
    const session = await this.getSessionOrThrow(user.schoolId, sessionId);

    if (session.status === 'pending_owner_approval') {
      throw new AppError(409, 'ADMISSION_LAUNCH_PENDING', 'Admission launch approval is already pending');
    }

    if (session.status === 'active') {
      throw new AppError(409, 'ADMISSION_SESSION_ACTIVE', 'Admission session is already active');
    }

    if (session.status === 'denied') {
      throw new AppError(409, 'ADMISSION_SESSION_REOPEN_REQUIRED', 'Reopen the denied admission session before requesting approval again');
    }

    if (session.status === 'closed') {
      throw new AppError(409, 'ADMISSION_SESSION_CLOSED', 'Closed admission sessions cannot be launched again');
    }

    const metadata = this.buildLaunchApprovalMetadata(session);
    const now = new Date().toISOString();
    const approval = await this.approvalRepository.create({
      type: 'admission_launch',
      status: 'pending',
      requestedBy: user.uid,
      requestedByEmail: user.email ?? user.uid,
      title: `Launch admissions for ${session.name}`,
      description: [
        session.academicYear,
        `${session.classes.length} classes`,
        user.schoolId,
      ].join(' • '),
      metadata: metadata as unknown as Record<string, unknown>,
      createdAt: now,
      updatedAt: now,
    });

    const updatedSession = await this.repo.markLaunchRequested(user.schoolId, session.id, approval.id);
    return {
      session: updatedSession,
      approvalId: approval.id,
    };
  }

  async closeSession(user: TenantAuthUser, sessionId: string): Promise<AdmissionSession> {
    await this.requireAdmissionCrm(user.schoolId);
    const session = await this.getSessionOrThrow(user.schoolId, sessionId);
    if (session.status !== 'active') {
      throw new AppError(409, 'ADMISSION_SESSION_NOT_ACTIVE', 'Only active admission sessions can be closed');
    }

    return this.repo.closeSession(user.schoolId, session.id, user.uid);
  }

  async reopenDeniedSession(user: TenantAuthUser, sessionId: string): Promise<AdmissionSession> {
    await this.requireAdmissionCrm(user.schoolId);
    const session = await this.getSessionOrThrow(user.schoolId, sessionId);
    if (session.status !== 'denied') {
      throw new AppError(409, 'ADMISSION_SESSION_NOT_DENIED', 'Only denied admission sessions can be reopened for edits');
    }

    return this.repo.reopenDeniedSession(user.schoolId, session.id, user.uid);
  }

  async createApplicant(
    user: TenantAuthUser,
    input: CreateAdmissionApplicantInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const session = await this.getSessionOrThrow(user.schoolId, input.sessionId);
    this.requireActiveSession(session);
    this.requireClassOpen(session, input.applyingGrade);

    const normalized = this.normalizeApplicantInput(input);
    return this.repo.createApplicant(user.schoolId, user.uid, normalized, this.normalizeDocuments(normalized.documents));
  }

  async updateApplicantStage(
    user: TenantAuthUser,
    applicantId: string,
    input: UpdateAdmissionApplicantStageInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);
    this.requireAllowedStageTransition(applicant.stage, input.stage);

    if (applicant.stage === input.stage) {
      return applicant;
    }

    const now = new Date().toISOString();
    const metadata: Partial<AdmissionApplicant> = {};
    if (input.stage === 'admitted') {
      const session = await this.getSessionOrThrow(user.schoolId, applicant.sessionId);
      const section = this.normalizeRequiredSection(input.section);
      await this.requireCapacityAvailable(user.schoolId, session, applicant.applyingGrade, section, applicant.id);
      metadata.assignedSection = section;
    }

    if (['admitted', 'rejected', 'waitlisted'].includes(input.stage)) {
      metadata.decision = {
        status: input.stage as 'admitted' | 'rejected' | 'waitlisted',
        decidedAt: now,
        decidedBy: user.uid,
        note: input.note?.trim() || undefined,
      };
    }

    return this.repo.updateApplicantStage(
      user.schoolId,
      applicantId,
      input.stage,
      {
        at: now,
        by: user.uid,
        type: ['admitted', 'rejected', 'waitlisted'].includes(input.stage) ? 'decision_recorded' : 'stage_changed',
        message: input.note?.trim() || `Moved applicant to ${this.formatStage(input.stage)}`,
      },
      metadata,
    );
  }

  async updateApplicantFollowUp(
    user: TenantAuthUser,
    applicantId: string,
    input: UpdateAdmissionApplicantFollowUpInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);
    if (applicant.stage === 'converted_to_student' || applicant.stage === 'withdrawn') {
      throw new AppError(409, 'ADMISSION_APPLICANT_LOCKED', 'Converted or withdrawn admission applicants cannot be assigned follow-up');
    }

    const now = new Date().toISOString();
    const followUp = {
      assignedTo: input.assignedTo?.trim(),
      followUpAt: input.followUpAt,
      priority: input.priority,
      status: input.status,
      note: input.note?.trim() || undefined,
      updatedAt: now,
      updatedBy: user.uid,
    };

    return this.repo.updateApplicantFollowUp(
      user.schoolId,
      applicantId,
      followUp,
      {
        at: now,
        by: user.uid,
        type: 'follow_up_updated',
        message: followUp.note || 'Updated admission follow-up',
      },
    );
  }

  async issueApplicantOffer(
    user: TenantAuthUser,
    applicantId: string,
    input: IssueAdmissionOfferInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);
    if (applicant.stage !== 'admitted') {
      throw new AppError(409, 'ADMISSION_APPLICANT_NOT_ADMITTED', 'Only admitted applicants can receive admission offers');
    }

    const now = new Date().toISOString();
    const feeQuote = this.buildFeeQuote(input, now, user.uid);
    const offerLetter = this.buildOfferLetter(applicant, input, now, user.uid);
    const communication = input.communication
      ? this.buildGuardianCommunication(input.communication, now, user.uid)
      : undefined;

    return this.repo.updateApplicantOffer(
      user.schoolId,
      applicantId,
      feeQuote,
      offerLetter,
      {
        at: now,
        by: user.uid,
        type: 'offer_issued',
        message: `Issued admission offer ${offerLetter.offerNumber}`,
      },
      communication,
    );
  }

  async acceptApplicantOffer(user: TenantAuthUser, applicantId: string): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);
    if (!applicant.offerLetter) {
      throw new AppError(409, 'ADMISSION_OFFER_NOT_ISSUED', 'Admission offer must be issued before acceptance can be recorded');
    }

    if (applicant.offerLetter.status !== 'issued') {
      throw new AppError(409, 'ADMISSION_OFFER_FINALIZED', 'Only issued admission offers can be accepted');
    }

    const now = new Date().toISOString();
    return this.repo.acceptApplicantOffer(
      user.schoolId,
      applicantId,
      now,
      user.uid,
      {
        at: now,
        by: user.uid,
        type: 'offer_accepted',
        message: `Accepted admission offer ${applicant.offerLetter.offerNumber}`,
      },
    );
  }

  async sendGuardianCommunication(
    user: TenantAuthUser,
    applicantId: string,
    input: SendAdmissionGuardianCommunicationInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    await this.getApplicantOrThrow(user.schoolId, applicantId);
    const now = new Date().toISOString();
    const communication = this.buildGuardianCommunication(input, now, user.uid);

    return this.repo.addGuardianCommunication(
      user.schoolId,
      applicantId,
      communication,
      {
        at: now,
        by: user.uid,
        type: 'guardian_communication_sent',
        message: `${communication.channel} communication sent: ${communication.subject}`,
      },
    );
  }

  async recordApplicantPayment(
    user: TenantAuthUser,
    applicantId: string,
    input: RecordAdmissionPaymentInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);
    this.requireAcceptedOffer(applicant);
    this.requirePaymentMatchesQuote(applicant, input);

    const now = new Date().toISOString();
    const paymentReceipt = this.buildPaymentReceipt(applicant, input, now, user.uid);

    return this.repo.recordApplicantPayment(
      user.schoolId,
      applicantId,
      paymentReceipt,
      {
        at: now,
        by: user.uid,
        type: 'payment_recorded',
        message: `Recorded admission payment ${paymentReceipt.receiptNumber}`,
      },
    );
  }

  async updateEnrollmentChecklist(
    user: TenantAuthUser,
    applicantId: string,
    input: UpdateAdmissionEnrollmentChecklistInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);
    this.requireAcceptedOffer(applicant);

    const now = new Date().toISOString();
    const checklist = this.normalizeEnrollmentChecklist(input.items, now, user.uid);

    return this.repo.updateEnrollmentChecklist(
      user.schoolId,
      applicantId,
      checklist,
      {
        at: now,
        by: user.uid,
        type: 'enrollment_checklist_updated',
        message: 'Updated admission enrollment checklist',
      },
    );
  }

  async updateApplicantDocument(
    user: TenantAuthUser,
    applicantId: string,
    documentKey: string,
    input: UpdateAdmissionApplicantDocumentInput,
  ): Promise<AdmissionApplicant> {
    await this.requireAdmissionCrm(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);
    if (['admitted', 'waitlisted', 'converted_to_student', 'rejected', 'withdrawn'].includes(applicant.stage)) {
      throw new AppError(409, 'ADMISSION_APPLICANT_LOCKED', 'Finalized admission applicants cannot be edited');
    }

    const existingDocument = applicant.documents.find((document) => document.key === documentKey);
    if (!existingDocument) {
      throw new AppError(404, 'DOCUMENT_NOT_FOUND', `Admission document ${documentKey} not found`);
    }

    const now = new Date().toISOString();
    const updatedDocument: AdmissionApplicantDocument = {
      ...existingDocument,
      status: input.status,
      notes: input.notes?.trim() || undefined,
      updatedAt: now,
    };
    const updatedDocuments = applicant.documents.map((document) =>
      document.key === documentKey ? updatedDocument : document,
    );
    const nextStage = this.deriveDocumentStage(applicant.stage, updatedDocuments);

    return this.repo.updateApplicantDocument(
      user.schoolId,
      applicantId,
      documentKey,
      updatedDocument,
      nextStage,
      {
        at: now,
        by: user.uid,
        type: 'document_updated',
        message: `${updatedDocument.label} marked ${updatedDocument.status}`,
      },
    );
  }

  async convertApplicantToStudent(
    user: TenantAuthUser,
    applicantId: string,
    input: ConvertAdmissionApplicantInput,
  ): Promise<{ applicant: AdmissionApplicant; student: Student }> {
    await this.requireAdmissionCrm(user.schoolId);
    await this.requireStudentRecords(user.schoolId);
    const applicant = await this.getApplicantOrThrow(user.schoolId, applicantId);

    if (applicant.stage !== 'admitted') {
      throw new AppError(409, 'ADMISSION_APPLICANT_NOT_ADMITTED', 'Only admitted applicants can be converted to student records');
    }

    if (applicant.convertedStudentId) {
      throw new AppError(409, 'ADMISSION_APPLICANT_ALREADY_CONVERTED', 'This admission applicant already has a student record');
    }

    this.requireEnrollmentReady(applicant);

    const normalizedInput = this.normalizeConversionInput(input);
    const session = await this.getSessionOrThrow(user.schoolId, applicant.sessionId);
    if (applicant.assignedSection && applicant.assignedSection.toLowerCase() !== normalizedInput.section.toLowerCase()) {
      throw new AppError(
        409,
        'ADMISSION_SECTION_MISMATCH',
        `Applicant was admitted to section ${applicant.assignedSection}`,
      );
    }

    await this.requireCapacityAvailable(
      user.schoolId,
      session,
      applicant.applyingGrade,
      normalizedInput.section,
      applicant.id,
    );
    const duplicate = await this.studentRepository.findActiveByRollNumber(
      user.schoolId,
      applicant.applyingGrade,
      normalizedInput.section,
      normalizedInput.rollNumber,
    );

    if (duplicate) {
      throw new AppError(
        409,
        'STUDENT_ROLL_NUMBER_EXISTS',
        `Roll number ${normalizedInput.rollNumber} is already assigned in ${applicant.applyingGrade}-${normalizedInput.section}`,
      );
    }

    const convertedAt = new Date().toISOString();
    const studentInput: CreateStudentInput = {
      ...normalizedInput,
      grade: applicant.applyingGrade,
      parentName: applicant.guardian.name,
      parentPhone: applicant.guardian.phone,
      parentEmail: applicant.guardian.email,
      guardianProfile: {
        name: applicant.guardian.name,
        relationship: applicant.guardian.relationship,
        phone: applicant.guardian.phone,
        email: applicant.guardian.email,
        sourceApplicantId: applicant.id,
      },
      emergencyContact: normalizedInput.emergencyContact || applicant.guardian.phone,
      admissionSourceType: 'admission_crm',
      admissionSource: {
        type: 'admission_crm',
        applicantId: applicant.id,
        applicantNumber: applicant.applicantNumber,
        sessionId: applicant.sessionId,
        sessionName: session.name,
        convertedAt,
        convertedBy: user.uid,
      },
    };
    const student = await this.studentRepository.create(user.schoolId, studentInput);
    const convertedApplicant = await this.repo.markApplicantConverted(
      user.schoolId,
      applicantId,
      student.id,
      {
        at: convertedAt,
        by: user.uid,
        type: 'converted_to_student',
        message: `Converted to student record ${student.id}`,
      },
    );

    return { applicant: convertedApplicant, student };
  }

  private async getSessionOrThrow(schoolId: string, sessionId: string): Promise<AdmissionSession> {
    const session = await this.repo.findSessionById(schoolId, sessionId);
    if (!session) {
      throw new AppError(404, 'NOT_FOUND', `Admission session ${sessionId} not found`);
    }
    return session;
  }

  private async getApplicantOrThrow(schoolId: string, applicantId: string): Promise<AdmissionApplicant> {
    const applicant = await this.repo.findApplicantById(schoolId, applicantId);
    if (!applicant) {
      throw new AppError(404, 'NOT_FOUND', `Admission applicant ${applicantId} not found`);
    }
    return applicant;
  }

  private async requireAdmissionCrm(schoolId: string): Promise<void> {
    const summary = await this.schoolService.getServicesSummary(schoolId);
    const admissionService = summary.services.find((service) => service.key === 'admission_crm');
    if (!admissionService || admissionService.state !== 'enabled') {
      throw new AppError(403, 'SERVICE_NOT_ENABLED', 'Admission CRM requires the Advanced school service plan');
    }
  }

  private async requireStudentRecords(schoolId: string): Promise<void> {
    const summary = await this.schoolService.getServicesSummary(schoolId);
    const studentRecords = summary.services.find((service) => service.key === 'student_records');
    if (!studentRecords || studentRecords.state !== 'enabled') {
      throw new AppError(403, 'SERVICE_NOT_ENABLED', 'Student Records must be enabled before admission conversion');
    }
  }

  private normalizeInput(input: CreateAdmissionSessionInput): CreateAdmissionSessionInput {
    return {
      name: input.name.trim(),
      academicYear: input.academicYear.trim(),
      opensAt: input.opensAt,
      closesAt: input.closesAt,
      classes: input.classes.map((item) => ({
        grade: item.grade.trim(),
        capacity: item.capacity,
        sections: this.normalizeSections(item.grade, item.capacity, item.sections),
        feePlanCode: item.feePlanCode?.trim(),
      })),
      enquirySourceTags: Array.from(new Set(input.enquirySourceTags.map((tag) => tag.trim()))),
      publicSummary: input.publicSummary.trim(),
    };
  }

  private normalizeApplicantInput(input: CreateAdmissionApplicantInput): CreateAdmissionApplicantInput {
    return {
      sessionId: input.sessionId.trim(),
      studentName: input.studentName.trim(),
      applyingGrade: input.applyingGrade.trim(),
      guardian: {
        name: input.guardian.name.trim(),
        relationship: input.guardian.relationship.trim(),
        phone: input.guardian.phone.trim(),
        email: input.guardian.email?.trim(),
      },
      sourceTag: input.sourceTag.trim(),
      enquiryNote: input.enquiryNote.trim(),
      documents: input.documents,
    };
  }

  private normalizeDocuments(documents?: AdmissionApplicantDocument[]): AdmissionApplicantDocument[] {
    const source = documents && documents.length > 0 ? documents : [
      { key: 'birth_certificate', label: 'Birth certificate', status: 'pending' as const },
      { key: 'address_proof', label: 'Address proof', status: 'pending' as const },
      { key: 'previous_report_card', label: 'Previous report card', status: 'pending' as const },
    ];

    return source.map((document) => ({
      key: document.key.trim().toLowerCase().replace(/\s+/g, '_'),
      label: document.label.trim(),
      status: document.status,
      notes: document.notes?.trim() || undefined,
      updatedAt: document.updatedAt,
    }));
  }

  private normalizeConversionInput(input: ConvertAdmissionApplicantInput): ConvertAdmissionApplicantInput {
    return {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      section: input.section.trim(),
      rollNumber: input.rollNumber.trim(),
      address: input.address.trim(),
      emergencyContact: input.emergencyContact?.trim(),
      bloodGroup: input.bloodGroup?.trim(),
    };
  }

  private buildFeeQuote(
    input: IssueAdmissionOfferInput,
    generatedAt: string,
    generatedBy: string,
  ): AdmissionFeeQuote {
    const lines = input.feeQuote.lines.map((line) => ({
      code: line.code.trim(),
      label: line.label.trim(),
      amount: line.amount,
      frequency: line.frequency,
      mandatory: line.mandatory,
    }));

    return {
      currency: input.feeQuote.currency.trim().toUpperCase(),
      dueDate: input.feeQuote.dueDate,
      lines,
      totalAmount: lines.reduce((sum, line) => sum + line.amount, 0),
      notes: input.feeQuote.notes?.trim() || undefined,
      generatedAt,
      generatedBy,
    };
  }

  private buildOfferLetter(
    applicant: AdmissionApplicant,
    input: IssueAdmissionOfferInput,
    issuedAt: string,
    issuedBy: string,
  ): AdmissionOfferLetter {
    return {
      offerNumber: `${applicant.applicantNumber}-OFFER-${issuedAt.slice(0, 10).replace(/-/g, '')}`,
      status: 'issued',
      title: input.letter.title.trim(),
      body: input.letter.body.trim(),
      expiresAt: input.letter.expiresAt,
      issuedAt,
      issuedBy,
    };
  }

  private buildGuardianCommunication(
    input: SendAdmissionGuardianCommunicationInput,
    sentAt: string,
    sentBy: string,
  ): AdmissionGuardianCommunication {
    return {
      id: `comm-${sentAt.replace(/[-:.TZ]/g, '')}`,
      channel: input.channel,
      subject: input.subject.trim(),
      message: input.message.trim(),
      status: 'sent',
      sentAt,
      sentBy,
    };
  }

  private buildPaymentReceipt(
    applicant: AdmissionApplicant,
    input: RecordAdmissionPaymentInput,
    recordedAt: string,
    recordedBy: string,
  ): AdmissionPaymentReceipt {
    return {
      receiptNumber: `${applicant.applicantNumber}-PAY-${recordedAt.slice(0, 10).replace(/-/g, '')}`,
      amount: input.amount,
      currency: input.currency.trim().toUpperCase(),
      paidAt: input.paidAt,
      method: input.method,
      referenceNumber: input.referenceNumber?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      recordedAt,
      recordedBy,
    };
  }

  private normalizeEnrollmentChecklist(
    items: AdmissionEnrollmentChecklistItem[],
    updatedAt: string,
    updatedBy: string,
  ): AdmissionEnrollmentChecklistItem[] {
    const seen = new Set<string>();
    return items.map((item) => {
      const key = item.key.trim().toLowerCase().replace(/\s+/g, '_');
      if (seen.has(key)) {
        throw new AppError(400, 'DUPLICATE_ENROLLMENT_CHECKLIST_ITEM', `${item.label.trim()} is duplicated`);
      }
      seen.add(key);
      return {
        key,
        label: item.label.trim(),
        status: item.status,
        notes: item.notes?.trim() || undefined,
        updatedAt,
        updatedBy,
      };
    });
  }

  private requireAcceptedOffer(applicant: AdmissionApplicant): void {
    if (!applicant.offerLetter || applicant.offerLetter.status !== 'accepted') {
      throw new AppError(409, 'ADMISSION_OFFER_NOT_ACCEPTED', 'Admission offer must be accepted before enrollment can proceed');
    }
  }

  private requirePaymentMatchesQuote(applicant: AdmissionApplicant, input: RecordAdmissionPaymentInput): void {
    if (!applicant.feeQuote) {
      throw new AppError(409, 'ADMISSION_FEE_QUOTE_MISSING', 'Admission fee quote must exist before payment can be recorded');
    }

    const currency = input.currency.trim().toUpperCase();
    if (currency !== applicant.feeQuote.currency) {
      throw new AppError(400, 'ADMISSION_PAYMENT_CURRENCY_MISMATCH', `Payment currency must be ${applicant.feeQuote.currency}`);
    }

    if (input.amount < applicant.feeQuote.totalAmount) {
      throw new AppError(409, 'ADMISSION_PAYMENT_INSUFFICIENT', 'Payment amount must cover the issued admission fee quote');
    }
  }

  private requireEnrollmentReady(applicant: AdmissionApplicant): void {
    this.requireAcceptedOffer(applicant);

    if (!applicant.paymentReceipt) {
      throw new AppError(409, 'ADMISSION_PAYMENT_REQUIRED', 'Admission payment receipt is required before student conversion');
    }

    const checklist = applicant.enrollmentChecklist ?? [];
    if (checklist.length === 0 || checklist.some((item) => item.status === 'pending')) {
      throw new AppError(409, 'ADMISSION_CHECKLIST_INCOMPLETE', 'Enrollment checklist must be complete before student conversion');
    }
  }

  private isEnrollmentChecklistReady(applicant: AdmissionApplicant): boolean {
    const checklist = applicant.enrollmentChecklist ?? [];
    return checklist.length > 0 && checklist.every((item) => item.status !== 'pending');
  }

  private isReadyToConvert(applicant: AdmissionApplicant): boolean {
    return applicant.stage === 'admitted' &&
      applicant.offerLetter?.status === 'accepted' &&
      Boolean(applicant.paymentReceipt) &&
      this.isEnrollmentChecklistReady(applicant) &&
      !applicant.convertedStudentId;
  }

  private hasOpenFollowUp(applicant: AdmissionApplicant): boolean {
    const status = applicant.followUp?.status;
    return Boolean(status && status !== 'completed' && status !== 'cancelled');
  }

  private hasDueFollowUp(applicant: AdmissionApplicant, generatedAt: string): boolean {
    if (!this.hasOpenFollowUp(applicant) || !applicant.followUp?.followUpAt) {
      return false;
    }

    const followUpTime = Date.parse(applicant.followUp.followUpAt);
    if (Number.isNaN(followUpTime)) {
      return false;
    }

    return followUpTime <= Date.parse(generatedAt);
  }

  private buildStageAnalytics(applicants: AdmissionApplicant[]) {
    return ADMISSION_APPLICANT_STAGES.map((stage) => ({
      stage,
      count: applicants.filter((applicant) => applicant.stage === stage).length,
    }));
  }

  private addCapacityTotals(
    totals: { seatsAvailable: number; seatsOccupied: number; totalSeats: number },
    summary: AdmissionSessionCapacitySummary,
  ) {
    const next = { ...totals };
    summary.classes.forEach((classSummary) => {
      const sections = classSummary.sections.length > 0
        ? classSummary.sections
        : [{
          capacity: classSummary.capacity,
          occupiedCount: classSummary.occupiedCount,
          availableSeats: classSummary.availableSeats,
        }];
      sections.forEach((section) => {
        next.seatsAvailable += section.availableSeats;
        next.seatsOccupied += section.occupiedCount;
        next.totalSeats += section.capacity;
      });
    });
    return next;
  }

  private buildWorkQueueItems(
    applicant: AdmissionApplicant,
    sessionName: string,
    generatedAt: string,
  ): AdmissionWorkQueueItem[] {
    const items: AdmissionWorkQueueItem[] = [];
    const base = this.buildWorkQueueItemBase(applicant, sessionName);

    if (this.hasDueFollowUp(applicant, generatedAt)) {
      items.push({
        ...base,
        kind: 'due_follow_up',
        priority: applicant.followUp?.priority ?? 'normal',
        dueAt: applicant.followUp?.followUpAt,
        detail: applicant.followUp?.note || 'Follow up with the guardian before this lead goes cold.',
        nextActionLabel: 'Update follow-up',
        sortAt: applicant.followUp?.followUpAt ?? applicant.updatedAt,
      });
    }

    if (applicant.stage === 'ready_for_review') {
      items.push({
        ...base,
        kind: 'document_review',
        detail: 'Documents are ready; record the admission decision.',
        nextActionLabel: 'Decide admission',
        sortAt: applicant.updatedAt,
      });
    }

    if (applicant.stage === 'admitted' && !applicant.offerLetter) {
      items.push({
        ...base,
        kind: 'offer_pending',
        detail: 'Applicant is admitted but the fee quote and offer letter are not issued.',
        nextActionLabel: 'Issue offer',
        sortAt: applicant.updatedAt,
      });
    }

    if (applicant.stage === 'admitted' && applicant.offerLetter?.status === 'accepted' && !applicant.paymentReceipt) {
      items.push({
        ...base,
        kind: 'payment_pending',
        detail: 'Offer is accepted; record the admission payment receipt.',
        nextActionLabel: 'Record payment',
        sortAt: applicant.offerLetter.acceptedAt ?? applicant.updatedAt,
      });
    }

    if (
      applicant.stage === 'admitted' &&
      applicant.offerLetter?.status === 'accepted' &&
      applicant.paymentReceipt &&
      !this.isEnrollmentChecklistReady(applicant)
    ) {
      items.push({
        ...base,
        kind: 'checklist_pending',
        detail: 'Payment is recorded; finish or waive every enrollment checklist item.',
        nextActionLabel: 'Complete checklist',
        sortAt: applicant.paymentReceipt.recordedAt,
      });
    }

    if (this.isReadyToConvert(applicant)) {
      items.push({
        ...base,
        kind: 'ready_to_convert',
        detail: 'Offer, payment, and checklist are complete. Convert this applicant to Student Records.',
        nextActionLabel: 'Convert to student',
        sortAt: applicant.updatedAt,
      });
    }

    return items;
  }

  private buildWorkQueueItemBase(applicant: AdmissionApplicant, sessionName: string) {
    return {
      applicantId: applicant.id,
      applicantNumber: applicant.applicantNumber,
      studentName: applicant.studentName,
      sessionId: applicant.sessionId,
      sessionName,
      applyingGrade: applicant.applyingGrade,
      stage: applicant.stage,
      priority: 'normal' as AdmissionFollowUpPriority,
      sortAt: applicant.updatedAt,
    };
  }

  private normalizeSections(
    grade: string,
    capacity: number,
    sections?: { section: string; capacity: number }[],
  ): { section: string; capacity: number }[] {
    const source = sections && sections.length > 0 ? sections : [{ section: 'A', capacity }];
    const seen = new Set<string>();
    return source.map((item) => {
      const section = item.section.trim();
      const key = section.toLowerCase();
      if (seen.has(key)) {
        throw new AppError(400, 'DUPLICATE_ADMISSION_SECTION', `${grade.trim()} section ${section} is duplicated`);
      }
      seen.add(key);
      return {
        section,
        capacity: item.capacity,
      };
    });
  }

  private normalizeRequiredSection(section?: string): string {
    const normalized = section?.trim();
    if (!normalized) {
      throw new AppError(400, 'ADMISSION_SECTION_REQUIRED', 'Section is required before admitting an applicant');
    }
    return normalized;
  }

  private requireActiveSession(session: AdmissionSession): void {
    if (session.status !== 'active') {
      throw new AppError(409, 'ADMISSION_SESSION_NOT_ACTIVE', 'Applicants can be captured only after owner launch approval');
    }
  }

  private requireEditableSession(session: AdmissionSession): void {
    if (session.status !== 'draft' && session.status !== 'denied') {
      throw new AppError(
        409,
        'ADMISSION_SESSION_LOCKED',
        'Admission sessions can be edited only while draft or denied before owner-approved launch',
      );
    }
  }

  private requireClassOpen(session: AdmissionSession, applyingGrade: string): void {
    const classOpen = session.classes.some((item) => item.grade.toLowerCase() === applyingGrade.trim().toLowerCase());
    if (!classOpen) {
      throw new AppError(400, 'CLASS_NOT_OPEN', `${applyingGrade} is not open in this admission session`);
    }
  }

  private getClassSeat(session: AdmissionSession, grade: string) {
    const classSeat = session.classes.find((item) => item.grade.toLowerCase() === grade.trim().toLowerCase());
    if (!classSeat) {
      throw new AppError(400, 'CLASS_NOT_OPEN', `${grade} is not open in this admission session`);
    }
    return classSeat;
  }

  private getSectionSeat(session: AdmissionSession, grade: string, section: string) {
    const classSeat = this.getClassSeat(session, grade);
    const sections = classSeat.sections && classSeat.sections.length > 0
      ? classSeat.sections
      : [{ section: 'A', capacity: classSeat.capacity }];
    const sectionSeat = sections.find((item) => item.section.toLowerCase() === section.trim().toLowerCase());
    if (!sectionSeat) {
      throw new AppError(400, 'ADMISSION_SECTION_NOT_OPEN', `${grade}-${section} is not open in this admission session`);
    }
    return sectionSeat;
  }

  private async requireCapacityAvailable(
    schoolId: string,
    session: AdmissionSession,
    grade: string,
    section: string,
    excludeApplicantId?: string,
  ): Promise<void> {
    const sectionSeat = this.getSectionSeat(session, grade, section);
    const applicants = await this.repo.listApplicants(schoolId, session.id);
    const occupiedCount = applicants.filter((applicant) =>
      applicant.id !== excludeApplicantId &&
      applicant.applyingGrade.toLowerCase() === grade.trim().toLowerCase() &&
      applicant.assignedSection?.toLowerCase() === section.trim().toLowerCase() &&
      (applicant.stage === 'admitted' || applicant.stage === 'converted_to_student')
    ).length;

    if (occupiedCount >= sectionSeat.capacity) {
      throw new AppError(409, 'ADMISSION_CAPACITY_FULL', `${grade}-${section} admission capacity is full`);
    }
  }

  private requireAllowedStageTransition(
    currentStage: AdmissionApplicantStage,
    nextStage: AdmissionApplicantStage,
  ): void {
    const allowedTransitions: Record<AdmissionApplicantStage, AdmissionApplicantStage[]> = {
      new_enquiry: ['contacted', 'withdrawn'],
      contacted: ['application_started', 'withdrawn'],
      application_started: ['documents_pending', 'ready_for_review', 'withdrawn'],
      documents_pending: ['ready_for_review', 'withdrawn'],
      ready_for_review: ['admitted', 'waitlisted', 'rejected', 'documents_pending'],
      waitlisted: ['admitted', 'rejected', 'withdrawn'],
      admitted: [],
      converted_to_student: [],
      rejected: ['ready_for_review'],
      withdrawn: [],
    };

    if (currentStage === nextStage) {
      return;
    }

    if (!allowedTransitions[currentStage].includes(nextStage)) {
      throw new AppError(
        409,
        'INVALID_ADMISSION_STAGE_TRANSITION',
        `Cannot move admission applicant from ${this.formatStage(currentStage)} to ${this.formatStage(nextStage)}`,
      );
    }
  }

  private deriveDocumentStage(
    currentStage: AdmissionApplicantStage,
    documents: AdmissionApplicantDocument[],
  ): AdmissionApplicantStage {
    if (documents.every((document) => document.status === 'verified')) {
      return 'ready_for_review';
    }

    if (currentStage === 'new_enquiry' || currentStage === 'contacted') {
      return 'application_started';
    }

    return 'documents_pending';
  }

  private timelineEvent(
    by: string,
    type: AdmissionApplicantTimelineEvent['type'],
    message: string,
  ): AdmissionApplicantTimelineEvent {
    return {
      at: new Date().toISOString(),
      by,
      type,
      message,
    };
  }

  private formatStage(stage: AdmissionApplicantStage): string {
    return stage.replace(/_/g, ' ');
  }

  private buildLaunchApprovalMetadata(session: AdmissionSession): AdmissionLaunchApprovalMetadata {
    return {
      schoolId: session.schoolId,
      sessionId: session.id,
      sessionName: session.name,
      academicYear: session.academicYear,
      classesOpen: session.classes.map((item) => item.grade),
    };
  }

  private buildCapacitySummary(
    session: AdmissionSession,
    applicants: AdmissionApplicant[],
  ): AdmissionSessionCapacitySummary {
    return {
      sessionId: session.id,
      schoolId: session.schoolId,
      classes: session.classes.map((classSeat) => {
        const sections = classSeat.sections && classSeat.sections.length > 0
          ? classSeat.sections
          : [{ section: 'A', capacity: classSeat.capacity }];
        const sectionSummaries = sections.map((sectionSeat) => {
          const matching = applicants.filter((applicant) =>
            applicant.applyingGrade.toLowerCase() === classSeat.grade.toLowerCase() &&
            applicant.assignedSection?.toLowerCase() === sectionSeat.section.toLowerCase()
          );
          const admittedCount = matching.filter((applicant) => applicant.stage === 'admitted').length;
          const convertedCount = matching.filter((applicant) => applicant.stage === 'converted_to_student').length;
          const occupiedCount = admittedCount + convertedCount;
          return {
            section: sectionSeat.section,
            capacity: sectionSeat.capacity,
            admittedCount,
            convertedCount,
            occupiedCount,
            availableSeats: Math.max(sectionSeat.capacity - occupiedCount, 0),
          };
        });
        const admittedCount = sectionSummaries.reduce((sum, item) => sum + item.admittedCount, 0);
        const convertedCount = sectionSummaries.reduce((sum, item) => sum + item.convertedCount, 0);
        const occupiedCount = admittedCount + convertedCount;

        return {
          grade: classSeat.grade,
          capacity: classSeat.capacity,
          admittedCount,
          convertedCount,
          occupiedCount,
          availableSeats: Math.max(classSeat.capacity - occupiedCount, 0),
          sections: sectionSummaries,
        };
      }),
    };
  }
}
