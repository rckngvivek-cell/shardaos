import { z } from 'zod';

const isoDateSchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD');
const admissionApplicantStageSchema = z.enum([
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
]);
const admissionDocumentStatusSchema = z.enum(['pending', 'received', 'verified', 'rejected']);
const admissionFollowUpPrioritySchema = z.enum(['low', 'normal', 'high', 'urgent']);
const admissionFollowUpStatusSchema = z.enum(['open', 'in_progress', 'completed', 'cancelled']);
const admissionFeeQuoteFrequencySchema = z.enum(['one_time', 'monthly', 'quarterly', 'annual']);
const admissionGuardianCommunicationChannelSchema = z.enum(['email', 'sms', 'phone', 'whatsapp', 'in_person']);
const admissionPaymentMethodSchema = z.enum(['cash', 'bank_transfer', 'upi', 'card', 'cheque', 'online']);
const admissionEnrollmentChecklistStatusSchema = z.enum(['pending', 'complete', 'waived']);

export const admissionSectionCapacitySchema = z.object({
  section: z.string().trim().min(1).max(10),
  capacity: z.number().int().min(1).max(300),
});

export const admissionClassSeatSchema = z.object({
  grade: z.string().trim().min(1).max(40),
  capacity: z.number().int().min(1).max(500),
  sections: z.array(admissionSectionCapacitySchema).min(1).max(20).optional(),
  feePlanCode: z.string().trim().min(1).max(60).optional(),
}).refine((input) => !input.sections || input.sections.reduce((sum, section) => sum + section.capacity, 0) <= input.capacity, {
  path: ['sections'],
  message: 'Section capacity total must not exceed class capacity',
});

export const createAdmissionSessionSchema = z.object({
  name: z.string().trim().min(3).max(120),
  academicYear: z.string().trim().min(4).max(20),
  opensAt: isoDateSchema,
  closesAt: isoDateSchema,
  classes: z.array(admissionClassSeatSchema).min(1).max(30),
  enquirySourceTags: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  publicSummary: z.string().trim().min(10).max(1000),
}).refine((input) => input.closesAt >= input.opensAt, {
  path: ['closesAt'],
  message: 'Must be on or after opensAt',
});

export const updateAdmissionSessionSchema = createAdmissionSessionSchema;

export const admissionLaunchApprovalMetadataSchema = z.object({
  schoolId: z.string().trim().min(1),
  sessionId: z.string().trim().min(1),
  sessionName: z.string().trim().min(1),
  academicYear: z.string().trim().min(1),
  classesOpen: z.array(z.string().trim().min(1)).min(1),
});

export const admissionGuardianContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  relationship: z.string().trim().min(2).max(60),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(160).optional(),
});

export const admissionApplicantDocumentSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(2).max(120),
  status: admissionDocumentStatusSchema,
  notes: z.string().trim().max(500).optional(),
  updatedAt: z.string().trim().optional(),
});

export const createAdmissionApplicantSchema = z.object({
  sessionId: z.string().trim().min(1),
  studentName: z.string().trim().min(2).max(140),
  applyingGrade: z.string().trim().min(1).max(40),
  guardian: admissionGuardianContactSchema,
  sourceTag: z.string().trim().min(1).max(40),
  enquiryNote: z.string().trim().min(3).max(1000),
  documents: z.array(admissionApplicantDocumentSchema).max(20).optional(),
});

export const updateAdmissionApplicantStageSchema = z.object({
  stage: admissionApplicantStageSchema,
  section: z.string().trim().min(1).max(10).optional(),
  note: z.string().trim().max(500).optional(),
});

export const updateAdmissionApplicantDocumentSchema = z.object({
  status: admissionDocumentStatusSchema,
  notes: z.string().trim().max(500).optional(),
});

export const updateAdmissionApplicantFollowUpSchema = z.object({
  assignedTo: z.string().trim().min(1).max(120).optional(),
  followUpAt: z.string().trim().datetime().optional(),
  priority: admissionFollowUpPrioritySchema.optional(),
  status: admissionFollowUpStatusSchema.optional(),
  note: z.string().trim().max(500).optional(),
}).refine((input) => Object.values(input).some((value) => value !== undefined), {
  message: 'At least one follow-up field is required',
});

export const admissionFeeQuoteLineSchema = z.object({
  code: z.string().trim().min(1).max(40),
  label: z.string().trim().min(2).max(120),
  amount: z.number().min(0).max(10_000_000),
  frequency: admissionFeeQuoteFrequencySchema,
  mandatory: z.boolean(),
});

export const issueAdmissionOfferSchema = z.object({
  feeQuote: z.object({
    currency: z.string().trim().length(3),
    dueDate: isoDateSchema,
    notes: z.string().trim().max(500).optional(),
    lines: z.array(admissionFeeQuoteLineSchema).min(1).max(30),
  }),
  letter: z.object({
    title: z.string().trim().min(3).max(160),
    body: z.string().trim().min(20).max(5000),
    expiresAt: isoDateSchema,
  }),
  communication: z.object({
    channel: admissionGuardianCommunicationChannelSchema,
    subject: z.string().trim().min(3).max(160),
    message: z.string().trim().min(10).max(2000),
  }).optional(),
}).refine((input) => input.letter.expiresAt >= input.feeQuote.dueDate, {
  path: ['letter', 'expiresAt'],
  message: 'Offer expiry must be on or after fee due date',
});

export const sendAdmissionGuardianCommunicationSchema = z.object({
  channel: admissionGuardianCommunicationChannelSchema,
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(2000),
});

export const recordAdmissionPaymentSchema = z.object({
  amount: z.number().positive().max(10_000_000),
  currency: z.string().trim().length(3),
  paidAt: z.string().trim().datetime(),
  method: admissionPaymentMethodSchema,
  referenceNumber: z.string().trim().min(1).max(120).optional(),
  notes: z.string().trim().max(500).optional(),
});

export const admissionEnrollmentChecklistItemSchema = z.object({
  key: z.string().trim().min(1).max(80),
  label: z.string().trim().min(2).max(160),
  status: admissionEnrollmentChecklistStatusSchema,
  notes: z.string().trim().max(500).optional(),
});

export const updateAdmissionEnrollmentChecklistSchema = z.object({
  items: z.array(admissionEnrollmentChecklistItemSchema).min(1).max(30),
});

export const convertAdmissionApplicantSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  dateOfBirth: isoDateSchema,
  gender: z.enum(['male', 'female', 'other']),
  section: z.string().trim().min(1).max(10),
  rollNumber: z.string().trim().min(1).max(20),
  address: z.string().trim().min(1).max(500),
  emergencyContact: z.string().trim().min(6).max(30).optional(),
  bloodGroup: z.string().trim().max(5).optional(),
});

export type CreateAdmissionSessionSchema = z.infer<typeof createAdmissionSessionSchema>;
export type UpdateAdmissionSessionSchema = z.infer<typeof updateAdmissionSessionSchema>;
export type CreateAdmissionApplicantSchema = z.infer<typeof createAdmissionApplicantSchema>;
export type UpdateAdmissionApplicantStageSchema = z.infer<typeof updateAdmissionApplicantStageSchema>;
export type UpdateAdmissionApplicantDocumentSchema = z.infer<typeof updateAdmissionApplicantDocumentSchema>;
export type UpdateAdmissionApplicantFollowUpSchema = z.infer<typeof updateAdmissionApplicantFollowUpSchema>;
export type IssueAdmissionOfferSchema = z.infer<typeof issueAdmissionOfferSchema>;
export type SendAdmissionGuardianCommunicationSchema = z.infer<typeof sendAdmissionGuardianCommunicationSchema>;
export type RecordAdmissionPaymentSchema = z.infer<typeof recordAdmissionPaymentSchema>;
export type UpdateAdmissionEnrollmentChecklistSchema = z.infer<typeof updateAdmissionEnrollmentChecklistSchema>;
export type ConvertAdmissionApplicantSchema = z.infer<typeof convertAdmissionApplicantSchema>;
