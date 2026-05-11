import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { clearStoredAuthSession } from './lib/authSession';

const fetchMock = vi.fn();
const otpChallenge = {
  challengeId: 'otp-challenge-1',
  plane: 'tenant',
  deliveryChannel: 'email',
  maskedEmail: 'pr***@dev.school',
  expiresAt: '2026-04-21T18:40:00.000Z',
  resendAvailableAt: '2026-04-21T18:31:00.000Z',
  otpLength: 6,
  deliveryHint: 'Development email written to .tools/email-outbox/test.json',
};
const schoolSession = {
  accessToken: 'school-access-token',
  refreshToken: 'school-refresh-token',
  user: {
    uid: 'tenant-principal-001',
    email: 'principal@dev.school',
    role: 'principal',
    plane: 'tenant',
    schoolId: 'school-north',
    displayName: 'Dev Principal',
  },
};
const admissionWorkflow = {
  setupSummary: 'Prepare admission sessions, qualify enquiries, convert applicants, and hand approved admissions to student records.',
  primaryActor: 'school_admission_operator',
  dataObjects: ['admission_session', 'enquiry', 'applicant_profile'],
  permissionScopes: ['school:admissions:manage', 'owner:admissions:approve_launch'],
  steps: [
    {
      key: 'session_setup',
      title: 'Set up admission session',
      description: 'Define the academic year and classes open for admission.',
      ownerApprovalRequired: false,
    },
    {
      key: 'launch_review',
      title: 'Request launch approval',
      description: 'Send the campaign to owner review before publishing.',
      ownerApprovalRequired: true,
    },
  ],
  ownerApprovalGate: {
    approver: 'owner',
    title: 'Admission launch approval',
    description: 'Owner approval is required before publishing the admission campaign.',
  },
};
const schoolServicesSummary = {
  schoolId: 'school-north',
  schoolName: 'Dev School',
  planTier: 'advanced',
  enabledServiceKeys: [
    'student_records',
    'attendance',
    'academics',
    'transport',
    'fee_collection',
    'parent_portal',
    'communications',
    'analytics',
    'admission_crm',
  ],
  services: [],
  basicServices: [
    {
      key: 'student_records',
      category: 'basic',
      name: 'Student Records',
      shortName: 'Students',
      description: 'Maintain student profiles.',
      route: '/students',
      includedIn: ['basic', 'advanced'],
      state: 'enabled',
      lockedReason: null,
    },
    {
      key: 'attendance',
      category: 'basic',
      name: 'Attendance',
      shortName: 'Attendance',
      description: 'Collect daily attendance.',
      route: '/attendance',
      includedIn: ['basic', 'advanced'],
      state: 'enabled',
      lockedReason: null,
    },
    {
      key: 'academics',
      category: 'basic',
      name: 'Academics',
      shortName: 'Academics',
      description: 'Run assessments.',
      route: '/academics',
      includedIn: ['basic', 'advanced'],
      state: 'enabled',
      lockedReason: null,
    },
  ],
  advancedServices: [
    {
      key: 'transport',
      category: 'advanced',
      name: 'Transport Management',
      shortName: 'Transport',
      description: 'Manage routes.',
      route: '/transport',
      includedIn: ['advanced'],
      state: 'enabled',
      lockedReason: null,
    },
    {
      key: 'fee_collection',
      category: 'advanced',
      name: 'Fee Collection',
      shortName: 'Fees',
      description: 'Manage collections.',
      route: '/fees',
      includedIn: ['advanced'],
      state: 'enabled',
      lockedReason: null,
    },
    {
      key: 'admission_crm',
      category: 'advanced',
      name: 'Admission CRM',
      shortName: 'Admissions',
      description: 'Run admissions.',
      route: '/admissions',
      includedIn: ['advanced'],
      state: 'enabled',
      lockedReason: null,
      workflow: admissionWorkflow,
    },
  ],
  totals: {
    enabled: 6,
    available: 0,
    locked: 0,
  },
};
schoolServicesSummary.services = [
  ...schoolServicesSummary.basicServices,
  ...schoolServicesSummary.advancedServices,
];
const createdAdmissionSession = {
  id: 'admission-session-1',
  schoolId: 'school-north',
  name: '2026-27 Main Admission Window',
  academicYear: '2026-27',
  opensAt: '2026-05-01',
  closesAt: '2026-07-31',
  classes: [{ grade: 'Nursery', capacity: 60, feePlanCode: 'ADM-NUR-2026' }],
  enquirySourceTags: ['walk-in', 'website'],
  publicSummary: 'Primary admission window for the upcoming academic year.',
  status: 'draft',
  createdBy: 'tenant-principal-001',
  createdAt: '2026-05-07T09:00:00.000Z',
  updatedAt: '2026-05-07T09:00:00.000Z',
};
const pendingAdmissionSession = {
  ...createdAdmissionSession,
  status: 'pending_owner_approval',
  launchApprovalId: 'approval-admission-1',
  launchRequestedAt: '2026-05-07T09:05:00.000Z',
  updatedAt: '2026-05-07T09:05:00.000Z',
};
const activeAdmissionSession = {
  ...createdAdmissionSession,
  status: 'active',
  launchApprovalId: 'approval-admission-1',
  launchApprovedAt: '2026-05-07T09:10:00.000Z',
  launchDecidedBy: 'owner-uid-1',
  updatedAt: '2026-05-07T09:10:00.000Z',
};
const updatedAdmissionSession = {
  ...createdAdmissionSession,
  name: '2026-27 Edited Admission Window',
  publicSummary: 'Edited admission campaign summary for the upcoming academic year.',
  updatedAt: '2026-05-07T09:08:00.000Z',
};
const deniedAdmissionSession = {
  ...createdAdmissionSession,
  id: 'admission-session-denied',
  status: 'denied',
  launchApprovalId: 'approval-admission-denied',
  launchRequestedAt: '2026-05-07T09:02:00.000Z',
  launchDeniedAt: '2026-05-07T09:04:00.000Z',
  launchDecidedBy: 'owner-uid-1',
  launchDenialReason: 'Add section-wise capacity evidence before launch.',
  updatedAt: '2026-05-07T09:04:00.000Z',
};
const reopenedAdmissionSession = {
  ...deniedAdmissionSession,
  status: 'draft',
  launchApprovalId: undefined,
  launchRequestedAt: undefined,
  launchDeniedAt: undefined,
  launchDecidedBy: undefined,
  launchDenialReason: undefined,
  reopenedBy: 'tenant-principal-001',
  reopenedAt: '2026-05-07T09:09:00.000Z',
  updatedAt: '2026-05-07T09:09:00.000Z',
};
const closedAdmissionSession = {
  ...activeAdmissionSession,
  status: 'closed',
  closedBy: 'tenant-principal-001',
  closedAt: '2026-05-07T09:12:00.000Z',
  updatedAt: '2026-05-07T09:12:00.000Z',
};
const admissionCapacitySummary = {
  sessionId: activeAdmissionSession.id,
  schoolId: 'school-north',
  classes: [
    {
      grade: 'Nursery',
      capacity: 60,
      admittedCount: 0,
      convertedCount: 0,
      occupiedCount: 0,
      availableSeats: 60,
      sections: [
        {
          section: 'A',
          capacity: 60,
          admittedCount: 0,
          convertedCount: 0,
          occupiedCount: 0,
          availableSeats: 60,
        },
      ],
    },
  ],
};
const admissionAnalyticsSummary = {
  schoolId: 'school-north',
  generatedAt: '2026-05-07T09:40:00.000Z',
  totals: {
    sessions: 1,
    activeSessions: 1,
    applicants: 1,
    offersIssued: 1,
    offersAccepted: 1,
    paymentsRecorded: 1,
    checklistReady: 1,
    readyToConvert: 1,
    converted: 0,
    openFollowUps: 1,
    dueFollowUps: 0,
    seatsAvailable: 60,
    seatsOccupied: 0,
    totalSeats: 60,
  },
  stages: [
    { stage: 'new_enquiry', count: 0 },
    { stage: 'contacted', count: 0 },
    { stage: 'application_started', count: 0 },
    { stage: 'documents_pending', count: 0 },
    { stage: 'ready_for_review', count: 0 },
    { stage: 'admitted', count: 1 },
    { stage: 'waitlisted', count: 0 },
    { stage: 'converted_to_student', count: 0 },
    { stage: 'rejected', count: 0 },
    { stage: 'withdrawn', count: 0 },
  ],
  sessions: [
    {
      sessionId: activeAdmissionSession.id,
      sessionName: activeAdmissionSession.name,
      academicYear: activeAdmissionSession.academicYear,
      status: activeAdmissionSession.status,
      totalApplicants: 1,
      stages: [
        { stage: 'admitted', count: 1 },
      ],
      offersIssued: 1,
      offersAccepted: 1,
      paymentsRecorded: 1,
      checklistReady: 1,
      readyToConvert: 1,
      converted: 0,
      openFollowUps: 1,
      dueFollowUps: 0,
      capacity: admissionCapacitySummary,
    },
  ],
};
const admissionWorkQueueSummary = {
  schoolId: 'school-north',
  generatedAt: '2026-05-07T09:40:00.000Z',
  totalOpenItems: 2,
  buckets: [
    {
      kind: 'due_follow_up',
      label: 'Due follow-ups',
      count: 1,
      items: [
        {
          kind: 'due_follow_up',
          applicantId: 'applicant-1',
          applicantNumber: 'ADM-00001',
          studentName: 'Aarav Sharma',
          sessionId: activeAdmissionSession.id,
          sessionName: activeAdmissionSession.name,
          applyingGrade: 'Nursery',
          stage: 'contacted',
          priority: 'urgent',
          dueAt: '2026-05-07T08:00:00.000Z',
          detail: 'Call guardian before the review window closes.',
          nextActionLabel: 'Update follow-up',
          sortAt: '2026-05-07T08:00:00.000Z',
        },
      ],
    },
    {
      kind: 'document_review',
      label: 'Document review',
      count: 0,
      items: [],
    },
    {
      kind: 'offer_pending',
      label: 'Offer pending',
      count: 0,
      items: [],
    },
    {
      kind: 'payment_pending',
      label: 'Payment pending',
      count: 0,
      items: [],
    },
    {
      kind: 'checklist_pending',
      label: 'Checklist pending',
      count: 0,
      items: [],
    },
    {
      kind: 'ready_to_convert',
      label: 'Ready to convert',
      count: 1,
      items: [
        {
          kind: 'ready_to_convert',
          applicantId: 'applicant-1',
          applicantNumber: 'ADM-00001',
          studentName: 'Aarav Sharma',
          sessionId: activeAdmissionSession.id,
          sessionName: activeAdmissionSession.name,
          applyingGrade: 'Nursery',
          stage: 'admitted',
          priority: 'normal',
          detail: 'Offer, payment, and checklist are complete. Convert this applicant to Student Records.',
          nextActionLabel: 'Convert to student',
          sortAt: '2026-05-07T09:36:00.000Z',
        },
      ],
    },
  ],
};
const emptyAdmissionWorkQueueSummary = {
  ...admissionWorkQueueSummary,
  totalOpenItems: 0,
  buckets: admissionWorkQueueSummary.buckets.map((bucket) => ({
    ...bucket,
    count: 0,
    items: [],
  })),
};
const createdApplicant = {
  id: 'applicant-1',
  schoolId: 'school-north',
  sessionId: activeAdmissionSession.id,
  applicantNumber: 'ADM-00001',
  studentName: 'Aarav Sharma',
  applyingGrade: 'Nursery',
  guardian: {
    name: 'Neha Sharma',
    relationship: 'Mother',
    phone: '+91 9000000001',
    email: 'neha@example.com',
  },
  sourceTag: 'website',
  enquiryNote: 'Guardian asked for Nursery admission and transport availability.',
  stage: 'new_enquiry',
  documents: [
    { key: 'birth_certificate', label: 'Birth certificate', status: 'pending' },
    { key: 'address_proof', label: 'Address proof', status: 'pending' },
  ],
  timeline: [],
  createdBy: 'tenant-principal-001',
  createdAt: '2026-05-07T09:15:00.000Z',
  updatedAt: '2026-05-07T09:15:00.000Z',
};
const contactedApplicant = {
  ...createdApplicant,
  stage: 'contacted',
  updatedAt: '2026-05-07T09:20:00.000Z',
};
const documentUpdatedApplicant = {
  ...createdApplicant,
  stage: 'application_started',
  documents: [
    { key: 'birth_certificate', label: 'Birth certificate', status: 'verified' },
    { key: 'address_proof', label: 'Address proof', status: 'pending' },
  ],
  updatedAt: '2026-05-07T09:25:00.000Z',
};
const admittedApplicant = {
  ...createdApplicant,
  stage: 'admitted',
  assignedSection: 'A',
  decision: {
    status: 'admitted',
    decidedAt: '2026-05-07T09:30:00.000Z',
    decidedBy: 'tenant-principal-001',
    note: 'Admission desk accepted the applicant after document review.',
  },
  documents: [
    { key: 'birth_certificate', label: 'Birth certificate', status: 'verified' },
    { key: 'address_proof', label: 'Address proof', status: 'verified' },
  ],
  updatedAt: '2026-05-07T09:30:00.000Z',
};
const followUpUpdatedApplicant = {
  ...contactedApplicant,
  followUp: {
    assignedTo: 'Admissions desk',
    followUpAt: '2026-05-08T10:00:00.000Z',
    priority: 'normal',
    status: 'open',
    note: 'Call guardian with document and fee guidance.',
    updatedAt: '2026-05-07T09:22:00.000Z',
    updatedBy: 'tenant-principal-001',
  },
  updatedAt: '2026-05-07T09:22:00.000Z',
};
const convertedStudent = {
  id: 'student-1',
  schoolId: 'school-north',
  firstName: 'Aarav',
  lastName: 'Sharma',
  dateOfBirth: '2021-04-05',
  gender: 'male',
  grade: 'Nursery',
  section: 'A',
  rollNumber: 'NUR-001',
  parentName: 'Neha Sharma',
  parentPhone: '+91 9000000001',
  parentEmail: 'neha@example.com',
  guardianProfile: {
    name: 'Neha Sharma',
    relationship: 'Mother',
    phone: '+91 9000000001',
    email: 'neha@example.com',
    sourceApplicantId: 'applicant-1',
  },
  address: 'House 11, Sector 1, Delhi',
  emergencyContact: '+91 9000000001',
  bloodGroup: 'O+',
  admissionSourceType: 'admission_crm',
  admissionSource: {
    type: 'admission_crm',
    applicantId: 'applicant-1',
    applicantNumber: 'ADM-00001',
    sessionId: activeAdmissionSession.id,
    sessionName: activeAdmissionSession.name,
    convertedAt: '2026-05-07T09:35:00.000Z',
    convertedBy: 'tenant-principal-001',
  },
  isActive: true,
  enrollmentDate: '2026-05-07T09:35:00.000Z',
  createdAt: '2026-05-07T09:35:00.000Z',
  updatedAt: '2026-05-07T09:35:00.000Z',
};
const directStudent = {
  ...convertedStudent,
  id: 'student-2',
  firstName: 'Isha',
  lastName: 'Mehra',
  section: 'B',
  rollNumber: 'NUR-002',
  parentName: 'Rohit Mehra',
  parentPhone: '+91 9000000002',
  parentEmail: 'rohit@example.com',
  guardianProfile: undefined,
  admissionSourceType: 'direct',
  admissionSource: undefined,
};
const allocatedConvertedStudent = {
  ...convertedStudent,
  section: 'C',
  rollNumber: 'NUR-010',
  updatedAt: '2026-05-07T09:45:00.000Z',
};
const convertedApplicant = {
  ...admittedApplicant,
  stage: 'converted_to_student',
  convertedStudentId: convertedStudent.id,
  convertedAt: '2026-05-07T09:35:00.000Z',
  convertedBy: 'tenant-principal-001',
  updatedAt: '2026-05-07T09:35:00.000Z',
};
const offeredApplicant = {
  ...admittedApplicant,
  feeQuote: {
    currency: 'INR',
    dueDate: '2026-05-20',
    lines: [
      {
        code: 'ADM-FEE',
        label: 'Admission fee',
        amount: 15000,
        frequency: 'one_time',
        mandatory: true,
      },
      {
        code: 'TUITION-Q1',
        label: 'Quarter 1 tuition',
        amount: 30000,
        frequency: 'quarterly',
        mandatory: true,
      },
    ],
    totalAmount: 45000,
    notes: 'Pay the admission fee to reserve the allotted seat.',
    generatedAt: '2026-05-07T09:32:00.000Z',
    generatedBy: 'tenant-principal-001',
  },
  offerLetter: {
    offerNumber: 'ADM-00001-OFFER-20260507',
    status: 'issued',
    title: 'Admission offer for Nursery',
    body: 'We are pleased to offer admission.',
    expiresAt: '2026-05-25',
    issuedAt: '2026-05-07T09:32:00.000Z',
    issuedBy: 'tenant-principal-001',
  },
  guardianCommunications: [
    {
      id: 'comm-1',
      channel: 'email',
      subject: 'Admission offer issued',
      message: 'Your admission offer has been issued with the fee quote and payment due date.',
      status: 'sent',
      sentAt: '2026-05-07T09:32:00.000Z',
      sentBy: 'tenant-principal-001',
    },
  ],
  updatedAt: '2026-05-07T09:32:00.000Z',
};
const offerAcceptedApplicant = {
  ...offeredApplicant,
  offerLetter: {
    ...offeredApplicant.offerLetter,
    status: 'accepted',
    acceptedAt: '2026-05-07T09:33:00.000Z',
    acceptedBy: 'tenant-principal-001',
  },
  updatedAt: '2026-05-07T09:33:00.000Z',
};
const messagedApplicant = {
  ...offerAcceptedApplicant,
  guardianCommunications: [
    ...offerAcceptedApplicant.guardianCommunications,
    {
      id: 'comm-2',
      channel: 'phone',
      subject: 'Admission document reminder',
      message: 'Called guardian to remind them about pending admission documents.',
      status: 'sent',
      sentAt: '2026-05-07T09:34:00.000Z',
      sentBy: 'tenant-principal-001',
    },
  ],
  updatedAt: '2026-05-07T09:34:00.000Z',
};
const paidApplicant = {
  ...messagedApplicant,
  paymentReceipt: {
    receiptNumber: 'ADM-00001-PAY-20260507',
    amount: 45000,
    currency: 'INR',
    paidAt: '2026-05-20T10:30:00.000Z',
    method: 'upi',
    referenceNumber: 'UPI-ADM-00001',
    notes: 'Guardian paid the full admission quote.',
    recordedAt: '2026-05-07T09:35:00.000Z',
    recordedBy: 'tenant-principal-001',
  },
  updatedAt: '2026-05-07T09:35:00.000Z',
};
const checklistReadyApplicant = {
  ...paidApplicant,
  enrollmentChecklist: [
    {
      key: 'payment_receipt_verified',
      label: 'Payment receipt verified',
      status: 'complete',
      notes: 'Receipt checked by admissions desk.',
      updatedAt: '2026-05-07T09:36:00.000Z',
      updatedBy: 'tenant-principal-001',
    },
    {
      key: 'guardian_consent',
      label: 'Guardian consent collected',
      status: 'complete',
      updatedAt: '2026-05-07T09:36:00.000Z',
      updatedBy: 'tenant-principal-001',
    },
    {
      key: 'student_profile_ready',
      label: 'Student profile ready',
      status: 'waived',
      notes: 'Profile will be completed during student record conversion.',
      updatedAt: '2026-05-07T09:36:00.000Z',
      updatedBy: 'tenant-principal-001',
    },
  ],
  updatedAt: '2026-05-07T09:36:00.000Z',
};

function mockApiResponse(data: unknown) {
  return {
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ success: true, data }),
  };
}

beforeEach(() => {
  clearStoredAuthSession();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  clearStoredAuthSession();
  vi.unstubAllGlobals();
});

describe('school app', () => {
  it('renders the school login route with OTP-first sign-in', () => {
    window.history.pushState({}, '', '/login');
    render(<App />);

    expect(screen.getByText(/School workspace access/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send verification code/i })).toBeInTheDocument();
  });

  it('redirects protected routes back to login when there is no session', async () => {
    window.history.pushState({}, '', '/students');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Enter your school workspace/i })).toBeInTheDocument();
    });
  });

  it('signs into the school app through email OTP verification', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'principal@dev.school');
    await user.type(screen.getByLabelText(/^Password$/i), 'SchoolPassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));

    expect(await screen.findByText(/Verification email sent/i)).toBeInTheDocument();
    await user.type(screen.getByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    expect(await screen.findByText(/Run school operations from the purchased service plan/i)).toBeInTheDocument();
    expect(await screen.findByText(/Dev School is running on the Advanced service tier/i)).toBeInTheDocument();
    expect(screen.getByText(/Dev Principal/i)).toBeInTheDocument();
  });

  it('renders service groups from the school services API', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse([]));
    fetchMock.mockResolvedValueOnce(mockApiResponse([]));
    fetchMock.mockResolvedValueOnce(mockApiResponse({
      ...admissionAnalyticsSummary,
      totals: {
        ...admissionAnalyticsSummary.totals,
        sessions: 0,
        activeSessions: 0,
        applicants: 0,
        offersIssued: 0,
        offersAccepted: 0,
        paymentsRecorded: 0,
        checklistReady: 0,
        readyToConvert: 0,
        converted: 0,
        openFollowUps: 0,
        dueFollowUps: 0,
        seatsAvailable: 0,
        seatsOccupied: 0,
        totalSeats: 0,
      },
      sessions: [],
    }));
    fetchMock.mockResolvedValueOnce(mockApiResponse(emptyAdmissionWorkQueueSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(createdAdmissionSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse({
      session: pendingAdmissionSession,
      approvalId: 'approval-admission-1',
    }));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'principal@dev.school');
    await user.type(screen.getByLabelText(/^Password$/i), 'SchoolPassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));
    await user.type(await screen.findByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    await user.click(await screen.findByRole('link', { name: /Services/i }));

    expect(await screen.findByRole('heading', { name: /Basic and Advanced school services/i })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: /Transport Management/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Fee Collection/i })).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Open Admissions/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /Admission session control/i })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: /Create admission session/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Create admission session/i }));

    expect(await screen.findByText(/was saved as a draft admission session/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Request owner launch approval/i }));

    expect(await screen.findByText(/Owner approval request approval-admission-1 is now pending/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/sessions'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/sessions/admission-session-1/request-launch-approval'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
  });

  it('edits, reopens, and closes admission sessions from the school CRM', async () => {
    const lifecycleActiveAdmissionSession = {
      ...activeAdmissionSession,
      id: 'admission-session-active',
    };
    const lifecycleClosedAdmissionSession = {
      ...closedAdmissionSession,
      id: 'admission-session-active',
    };
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse([
      createdAdmissionSession,
      deniedAdmissionSession,
      lifecycleActiveAdmissionSession,
    ]));
    fetchMock.mockResolvedValueOnce(mockApiResponse([]));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionAnalyticsSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionWorkQueueSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionCapacitySummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(updatedAdmissionSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(reopenedAdmissionSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(lifecycleClosedAdmissionSession));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'principal@dev.school');
    await user.type(screen.getByLabelText(/^Password$/i), 'SchoolPassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));
    await user.type(await screen.findByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    await user.click(await screen.findByRole('link', { name: /Services/i }));
    await user.click(await screen.findByRole('link', { name: /Open Admissions/i }));

    expect(await screen.findByText(/Owner note: Add section-wise capacity evidence before launch/i)).toBeInTheDocument();
    await user.click((await screen.findAllByRole('button', { name: /Edit session/i }))[0]);
    await user.clear(screen.getByLabelText(/Session name/i));
    await user.type(screen.getByLabelText(/Session name/i), '2026-27 Edited Admission Window');
    await user.click(screen.getByRole('button', { name: /Save session changes/i }));
    expect(await screen.findByText(/session changes were saved/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Reopen for edits/i }));
    expect(await screen.findByText(/was reopened as a draft session/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Close intake/i }));
    expect(await screen.findByText(/intake was closed/i)).toBeInTheDocument();

    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/sessions/admission-session-1'
      && (init as RequestInit | undefined)?.method === 'PUT'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/sessions/admission-session-denied/reopen'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/sessions/admission-session-active/close'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
  });

  it('captures and works an Admission CRM applicant pipeline', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse([activeAdmissionSession]));
    fetchMock.mockResolvedValueOnce(mockApiResponse([]));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionAnalyticsSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionWorkQueueSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionCapacitySummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(createdApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse(contactedApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse(followUpUpdatedApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse(documentUpdatedApplicant));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'principal@dev.school');
    await user.type(screen.getByLabelText(/^Password$/i), 'SchoolPassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));
    await user.type(await screen.findByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    await user.click(await screen.findByRole('link', { name: /Services/i }));
    await user.click(await screen.findByRole('link', { name: /Open Admissions/i }));

    expect(await screen.findByRole('heading', { name: /Applicant pipeline/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Admissions work queue/i })).toBeInTheDocument();
    expect(screen.getByText(/Due follow-ups/i)).toBeInTheDocument();
    expect(screen.getByText(/Call guardian before the review window closes/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ready to convert/i).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Capture enquiry/i }));

    expect(await screen.findByText(/ADM-00001 was captured for Aarav Sharma/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Mark contacted/i }));
    expect(await screen.findByText(/ADM-00001 moved to contacted/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Update follow-up/i }));
    expect(await screen.findByText(/ADM-00001 follow-up was updated/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Verify Birth certificate/i }));
    expect(await screen.findByText(/ADM-00001 document checklist updated/i)).toBeInTheDocument();
    expect(await screen.findByText(/0 occupied of 60 seats/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/stage'
      && (init as RequestInit | undefined)?.method === 'PATCH'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/documents/birth_certificate'
      && (init as RequestInit | undefined)?.method === 'PATCH'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/follow-up'
      && (init as RequestInit | undefined)?.method === 'PATCH'
    ))).toBe(true);
  });

  it('converts an admitted applicant into a Student Records entry', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse([activeAdmissionSession]));
    fetchMock.mockResolvedValueOnce(mockApiResponse([admittedApplicant]));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionAnalyticsSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionWorkQueueSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(admissionCapacitySummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse(offeredApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse(offerAcceptedApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse(messagedApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse(paidApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse(checklistReadyApplicant));
    fetchMock.mockResolvedValueOnce(mockApiResponse({
      applicant: convertedApplicant,
      student: convertedStudent,
    }));
    fetchMock.mockResolvedValueOnce(mockApiResponse({
      ...admissionCapacitySummary,
      classes: [
        {
          ...admissionCapacitySummary.classes[0],
          convertedCount: 1,
          occupiedCount: 1,
          availableSeats: 59,
          sections: [
            {
              ...admissionCapacitySummary.classes[0].sections[0],
              convertedCount: 1,
              occupiedCount: 1,
              availableSeats: 59,
            },
          ],
        },
      ],
    }));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'principal@dev.school');
    await user.type(screen.getByLabelText(/^Password$/i), 'SchoolPassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));
    await user.type(await screen.findByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    await user.click(await screen.findByRole('link', { name: /Services/i }));
    await user.click(await screen.findByRole('link', { name: /Open Admissions/i }));

    expect((await screen.findAllByText(/ADM-00001 | Aarav Sharma/i)).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Issue offer/i }));
    expect(await screen.findByText(/ADM-00001 admission offer was issued/i)).toBeInTheDocument();
    expect(await screen.findByText(/Quote: INR 45,000/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Mark offer accepted/i }));
    expect(await screen.findByText(/ADM-00001 admission offer was accepted/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Log guardian message/i }));
    expect(await screen.findByText(/ADM-00001 guardian communication was logged/i)).toBeInTheDocument();
    expect(await screen.findByText(/Messages: 2/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Record payment/i }));
    expect(await screen.findByText(/ADM-00001 payment receipt was recorded/i)).toBeInTheDocument();
    expect(await screen.findByText(/Paid: INR 45,000/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Update checklist/i }));
    expect(await screen.findByText(/ADM-00001 enrollment checklist was updated/i)).toBeInTheDocument();
    expect(await screen.findByText(/Checklist: 3\/3/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Convert to student/i }));

    expect(await screen.findByText(/ADM-00001 converted to student record student-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Student record: student-1/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/offer'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/offer/accept'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/communications'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/payment'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/enrollment-checklist'
      && (init as RequestInit | undefined)?.method === 'PATCH'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => (
      url === '/api/admissions/sessions/admission-session-1/capacity'
    ))).toBe(true);
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/admissions/applicants/applicant-1/convert-to-student'
      && (init as RequestInit | undefined)?.method === 'POST'
    ))).toBe(true);
  });

  it('filters admission-origin students and updates section allocation', async () => {
    fetchMock.mockResolvedValueOnce(mockApiResponse(otpChallenge));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolSession));
    fetchMock.mockResolvedValueOnce(mockApiResponse(schoolServicesSummary));
    fetchMock.mockResolvedValueOnce(mockApiResponse([convertedStudent, directStudent]));
    fetchMock.mockResolvedValueOnce(mockApiResponse([convertedStudent]));
    fetchMock.mockResolvedValueOnce(mockApiResponse(allocatedConvertedStudent));

    window.history.pushState({}, '', '/login');
    render(<App />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^Email$/i), 'principal@dev.school');
    await user.type(screen.getByLabelText(/^Password$/i), 'SchoolPassword@123');
    await user.click(screen.getByRole('button', { name: /Send verification code/i }));
    await user.type(await screen.findByLabelText(/Verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /Verify code and continue/i }));

    await user.click(await screen.findByRole('link', { name: /Students/i }));

    expect(await screen.findByRole('heading', { name: /Student roster operations/i })).toBeInTheDocument();
    expect(await screen.findByText(/Admission: ADM-00001/i)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/Admission source filter/i), 'admission_crm');
    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([url]) => url === '/api/students?source=admission_crm')).toBe(true);
    });

    await user.clear(screen.getByLabelText(/^Section$/i));
    await user.type(screen.getByLabelText(/^Section$/i), 'C');
    await user.clear(screen.getByLabelText(/Roll number/i));
    await user.type(screen.getByLabelText(/Roll number/i), 'NUR-010');
    await user.click(screen.getByRole('button', { name: /Update section allocation/i }));

    expect(await screen.findByText(/Aarav Sharma moved to Nursery-C with roll NUR-010/i)).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url, init]) => (
      url === '/api/students/student-1'
      && (init as RequestInit | undefined)?.method === 'PUT'
    ))).toBe(true);
  });
});
