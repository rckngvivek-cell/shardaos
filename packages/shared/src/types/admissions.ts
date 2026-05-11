export type AdmissionSessionStatus = 'draft' | 'pending_owner_approval' | 'active' | 'denied' | 'closed';
export type AdmissionApplicantStage =
  | 'new_enquiry'
  | 'contacted'
  | 'application_started'
  | 'documents_pending'
  | 'ready_for_review'
  | 'admitted'
  | 'waitlisted'
  | 'converted_to_student'
  | 'rejected'
  | 'withdrawn';
export type AdmissionDocumentStatus = 'pending' | 'received' | 'verified' | 'rejected';
export type AdmissionDecisionStatus = 'admitted' | 'rejected' | 'waitlisted';
export type AdmissionFollowUpPriority = 'low' | 'normal' | 'high' | 'urgent';
export type AdmissionFollowUpStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';
export type AdmissionOfferStatus = 'issued' | 'accepted' | 'declined' | 'expired';
export type AdmissionFeeQuoteFrequency = 'one_time' | 'monthly' | 'quarterly' | 'annual';
export type AdmissionGuardianCommunicationChannel = 'email' | 'sms' | 'phone' | 'whatsapp' | 'in_person';
export type AdmissionGuardianCommunicationStatus = 'sent' | 'failed';
export type AdmissionPaymentMethod = 'cash' | 'bank_transfer' | 'upi' | 'card' | 'cheque' | 'online';
export type AdmissionEnrollmentChecklistStatus = 'pending' | 'complete' | 'waived';
export type AdmissionWorkQueueKind =
  | 'due_follow_up'
  | 'document_review'
  | 'offer_pending'
  | 'payment_pending'
  | 'checklist_pending'
  | 'ready_to_convert';

export interface AdmissionSectionCapacity {
  section: string;
  capacity: number;
}

export interface AdmissionClassSeat {
  grade: string;
  capacity: number;
  sections?: AdmissionSectionCapacity[];
  feePlanCode?: string;
}

export interface AdmissionSectionCapacitySummary extends AdmissionSectionCapacity {
  admittedCount: number;
  convertedCount: number;
  occupiedCount: number;
  availableSeats: number;
}

export interface AdmissionClassCapacitySummary {
  grade: string;
  capacity: number;
  admittedCount: number;
  convertedCount: number;
  occupiedCount: number;
  availableSeats: number;
  sections: AdmissionSectionCapacitySummary[];
}

export interface AdmissionSessionCapacitySummary {
  sessionId: string;
  schoolId: string;
  classes: AdmissionClassCapacitySummary[];
}

export interface AdmissionStageAnalytics {
  stage: AdmissionApplicantStage;
  count: number;
}

export interface AdmissionAnalyticsTotals {
  sessions: number;
  activeSessions: number;
  applicants: number;
  offersIssued: number;
  offersAccepted: number;
  paymentsRecorded: number;
  checklistReady: number;
  readyToConvert: number;
  converted: number;
  openFollowUps: number;
  dueFollowUps: number;
  seatsAvailable: number;
  seatsOccupied: number;
  totalSeats: number;
}

export interface AdmissionSessionAnalytics {
  sessionId: string;
  sessionName: string;
  academicYear: string;
  status: AdmissionSessionStatus;
  totalApplicants: number;
  stages: AdmissionStageAnalytics[];
  offersIssued: number;
  offersAccepted: number;
  paymentsRecorded: number;
  checklistReady: number;
  readyToConvert: number;
  converted: number;
  openFollowUps: number;
  dueFollowUps: number;
  capacity: AdmissionSessionCapacitySummary;
}

export interface AdmissionAnalyticsSummary {
  schoolId: string;
  generatedAt: string;
  totals: AdmissionAnalyticsTotals;
  stages: AdmissionStageAnalytics[];
  sessions: AdmissionSessionAnalytics[];
}

export interface AdmissionWorkQueueItem {
  kind: AdmissionWorkQueueKind;
  applicantId: string;
  applicantNumber: string;
  studentName: string;
  sessionId: string;
  sessionName: string;
  applyingGrade: string;
  stage: AdmissionApplicantStage;
  priority: AdmissionFollowUpPriority;
  dueAt?: string;
  detail: string;
  nextActionLabel: string;
  sortAt: string;
}

export interface AdmissionWorkQueueBucket {
  kind: AdmissionWorkQueueKind;
  label: string;
  count: number;
  items: AdmissionWorkQueueItem[];
}

export interface AdmissionWorkQueueSummary {
  schoolId: string;
  generatedAt: string;
  totalOpenItems: number;
  buckets: AdmissionWorkQueueBucket[];
}

export interface CreateAdmissionSessionInput {
  name: string;
  academicYear: string;
  opensAt: string;
  closesAt: string;
  classes: AdmissionClassSeat[];
  enquirySourceTags: string[];
  publicSummary: string;
}

export interface UpdateAdmissionSessionInput extends CreateAdmissionSessionInput {}

export interface AdmissionSession extends CreateAdmissionSessionInput {
  id: string;
  schoolId: string;
  status: AdmissionSessionStatus;
  launchApprovalId?: string;
  launchRequestedAt?: string;
  launchApprovedAt?: string;
  launchDeniedAt?: string;
  launchDecidedBy?: string;
  launchDenialReason?: string;
  closedAt?: string;
  closedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionLaunchApprovalMetadata {
  schoolId: string;
  sessionId: string;
  sessionName: string;
  academicYear: string;
  classesOpen: string[];
}

export interface AdmissionLaunchApprovalRequestResult {
  session: AdmissionSession;
  approvalId: string;
}

export interface AdmissionGuardianContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
}

export interface AdmissionApplicantDocument {
  key: string;
  label: string;
  status: AdmissionDocumentStatus;
  notes?: string;
  updatedAt?: string;
}

export interface AdmissionApplicantTimelineEvent {
  at: string;
  by: string;
  type:
    | 'created'
    | 'stage_changed'
    | 'document_updated'
    | 'decision_recorded'
    | 'follow_up_updated'
    | 'offer_issued'
    | 'offer_accepted'
    | 'guardian_communication_sent'
    | 'payment_recorded'
    | 'enrollment_checklist_updated'
    | 'converted_to_student';
  message: string;
}

export interface CreateAdmissionApplicantInput {
  sessionId: string;
  studentName: string;
  applyingGrade: string;
  guardian: AdmissionGuardianContact;
  sourceTag: string;
  enquiryNote: string;
  documents?: AdmissionApplicantDocument[];
}

export interface UpdateAdmissionApplicantStageInput {
  stage: AdmissionApplicantStage;
  section?: string;
  note?: string;
}

export interface UpdateAdmissionApplicantDocumentInput {
  status: AdmissionDocumentStatus;
  notes?: string;
}

export interface UpdateAdmissionApplicantFollowUpInput {
  assignedTo?: string;
  followUpAt?: string;
  priority?: AdmissionFollowUpPriority;
  status?: AdmissionFollowUpStatus;
  note?: string;
}

export interface AdmissionFeeQuoteLine {
  code: string;
  label: string;
  amount: number;
  frequency: AdmissionFeeQuoteFrequency;
  mandatory: boolean;
}

export interface AdmissionFeeQuote {
  currency: string;
  dueDate: string;
  lines: AdmissionFeeQuoteLine[];
  totalAmount: number;
  notes?: string;
  generatedAt: string;
  generatedBy: string;
}

export interface AdmissionOfferLetter {
  offerNumber: string;
  status: AdmissionOfferStatus;
  title: string;
  body: string;
  expiresAt: string;
  issuedAt: string;
  issuedBy: string;
  acceptedAt?: string;
  acceptedBy?: string;
  declinedAt?: string;
  declinedBy?: string;
}

export interface IssueAdmissionOfferInput {
  feeQuote: {
    currency: string;
    dueDate: string;
    notes?: string;
    lines: AdmissionFeeQuoteLine[];
  };
  letter: {
    title: string;
    body: string;
    expiresAt: string;
  };
  communication?: {
    channel: AdmissionGuardianCommunicationChannel;
    subject: string;
    message: string;
  };
}

export interface AdmissionGuardianCommunication {
  id: string;
  channel: AdmissionGuardianCommunicationChannel;
  subject: string;
  message: string;
  status: AdmissionGuardianCommunicationStatus;
  sentAt: string;
  sentBy: string;
}

export interface SendAdmissionGuardianCommunicationInput {
  channel: AdmissionGuardianCommunicationChannel;
  subject: string;
  message: string;
}

export interface AdmissionPaymentReceipt {
  receiptNumber: string;
  amount: number;
  currency: string;
  paidAt: string;
  method: AdmissionPaymentMethod;
  referenceNumber?: string;
  notes?: string;
  recordedAt: string;
  recordedBy: string;
}

export interface RecordAdmissionPaymentInput {
  amount: number;
  currency: string;
  paidAt: string;
  method: AdmissionPaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export interface AdmissionEnrollmentChecklistItem {
  key: string;
  label: string;
  status: AdmissionEnrollmentChecklistStatus;
  notes?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface UpdateAdmissionEnrollmentChecklistInput {
  items: AdmissionEnrollmentChecklistItem[];
}

export interface ConvertAdmissionApplicantInput {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  section: string;
  rollNumber: string;
  address: string;
  emergencyContact?: string;
  bloodGroup?: string;
}

export interface AdmissionApplicant extends CreateAdmissionApplicantInput {
  id: string;
  schoolId: string;
  applicantNumber: string;
  stage: AdmissionApplicantStage;
  assignedSection?: string;
  decision?: {
    status: AdmissionDecisionStatus;
    decidedAt: string;
    decidedBy: string;
    note?: string;
  };
  followUp?: UpdateAdmissionApplicantFollowUpInput & {
    updatedAt: string;
    updatedBy: string;
  };
  feeQuote?: AdmissionFeeQuote;
  offerLetter?: AdmissionOfferLetter;
  guardianCommunications?: AdmissionGuardianCommunication[];
  paymentReceipt?: AdmissionPaymentReceipt;
  enrollmentChecklist?: AdmissionEnrollmentChecklistItem[];
  documents: AdmissionApplicantDocument[];
  timeline: AdmissionApplicantTimelineEvent[];
  convertedStudentId?: string;
  convertedAt?: string;
  convertedBy?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
