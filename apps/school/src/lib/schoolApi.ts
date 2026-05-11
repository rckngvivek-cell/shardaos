import type {
  AdmissionAnalyticsSummary,
  AdmissionApplicant,
  AdmissionLaunchApprovalRequestResult,
  AdmissionSession,
  AdmissionSessionCapacitySummary,
  AdmissionWorkQueueSummary,
  ConvertAdmissionApplicantInput,
  CreateAdmissionApplicantInput,
  CreateAdmissionSessionInput,
  IssueAdmissionOfferInput,
  RecordAdmissionPaymentInput,
  SendAdmissionGuardianCommunicationInput,
  Student,
  StudentAdmissionSourceType,
  SchoolServicesSummary,
  UpdateAdmissionApplicantDocumentInput,
  UpdateAdmissionEnrollmentChecklistInput,
  UpdateAdmissionApplicantFollowUpInput,
  UpdateAdmissionApplicantStageInput,
  UpdateAdmissionSessionInput,
  UpdateStudentInput,
} from '@school-erp/shared';
import { requestTenantApi } from './authSession';

export function requestSchoolServicesSummary(): Promise<SchoolServicesSummary> {
  return requestTenantApi<SchoolServicesSummary>('/api/schools/me/services');
}

export function requestAdmissionSessions(): Promise<AdmissionSession[]> {
  return requestTenantApi<AdmissionSession[]>('/api/admissions/sessions');
}

export function requestAdmissionAnalytics(): Promise<AdmissionAnalyticsSummary> {
  return requestTenantApi<AdmissionAnalyticsSummary>('/api/admissions/analytics');
}

export function requestAdmissionWorkQueue(): Promise<AdmissionWorkQueueSummary> {
  return requestTenantApi<AdmissionWorkQueueSummary>('/api/admissions/work-queue');
}

export function createAdmissionSession(input: CreateAdmissionSessionInput): Promise<AdmissionSession> {
  return requestTenantApi<AdmissionSession>('/api/admissions/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateAdmissionSession(
  sessionId: string,
  input: UpdateAdmissionSessionInput,
): Promise<AdmissionSession> {
  return requestTenantApi<AdmissionSession>(`/api/admissions/sessions/${sessionId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function requestAdmissionLaunchApproval(sessionId: string): Promise<AdmissionLaunchApprovalRequestResult> {
  return requestTenantApi<AdmissionLaunchApprovalRequestResult>(
    `/api/admissions/sessions/${sessionId}/request-launch-approval`,
    { method: 'POST' },
  );
}

export function closeAdmissionSession(sessionId: string): Promise<AdmissionSession> {
  return requestTenantApi<AdmissionSession>(`/api/admissions/sessions/${sessionId}/close`, {
    method: 'POST',
  });
}

export function reopenAdmissionSession(sessionId: string): Promise<AdmissionSession> {
  return requestTenantApi<AdmissionSession>(`/api/admissions/sessions/${sessionId}/reopen`, {
    method: 'POST',
  });
}

export function requestAdmissionCapacity(sessionId: string): Promise<AdmissionSessionCapacitySummary> {
  return requestTenantApi<AdmissionSessionCapacitySummary>(
    `/api/admissions/sessions/${sessionId}/capacity`,
  );
}

export function requestAdmissionApplicants(sessionId?: string): Promise<AdmissionApplicant[]> {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return requestTenantApi<AdmissionApplicant[]>(`/api/admissions/applicants${query}`);
}

export function createAdmissionApplicant(input: CreateAdmissionApplicantInput): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>('/api/admissions/applicants', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateAdmissionApplicantStage(
  applicantId: string,
  input: UpdateAdmissionApplicantStageInput,
): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(`/api/admissions/applicants/${applicantId}/stage`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateAdmissionApplicantDocument(
  applicantId: string,
  documentKey: string,
  input: UpdateAdmissionApplicantDocumentInput,
): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(
    `/api/admissions/applicants/${applicantId}/documents/${encodeURIComponent(documentKey)}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

export function updateAdmissionApplicantFollowUp(
  applicantId: string,
  input: UpdateAdmissionApplicantFollowUpInput,
): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(`/api/admissions/applicants/${applicantId}/follow-up`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function issueAdmissionApplicantOffer(
  applicantId: string,
  input: IssueAdmissionOfferInput,
): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(`/api/admissions/applicants/${applicantId}/offer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function acceptAdmissionApplicantOffer(applicantId: string): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(`/api/admissions/applicants/${applicantId}/offer/accept`, {
    method: 'POST',
  });
}

export function sendAdmissionGuardianCommunication(
  applicantId: string,
  input: SendAdmissionGuardianCommunicationInput,
): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(`/api/admissions/applicants/${applicantId}/communications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function recordAdmissionApplicantPayment(
  applicantId: string,
  input: RecordAdmissionPaymentInput,
): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(`/api/admissions/applicants/${applicantId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function updateAdmissionEnrollmentChecklist(
  applicantId: string,
  input: UpdateAdmissionEnrollmentChecklistInput,
): Promise<AdmissionApplicant> {
  return requestTenantApi<AdmissionApplicant>(`/api/admissions/applicants/${applicantId}/enrollment-checklist`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}

export function convertAdmissionApplicantToStudent(
  applicantId: string,
  input: ConvertAdmissionApplicantInput,
): Promise<{ applicant: AdmissionApplicant; student: Student }> {
  return requestTenantApi<{ applicant: AdmissionApplicant; student: Student }>(
    `/api/admissions/applicants/${applicantId}/convert-to-student`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );
}

export function requestStudents(source?: StudentAdmissionSourceType): Promise<Student[]> {
  const query = source ? `?source=${encodeURIComponent(source)}` : '';
  return requestTenantApi<Student[]>(`/api/students${query}`);
}

export function updateStudent(studentId: string, input: UpdateStudentInput): Promise<Student> {
  return requestTenantApi<Student>(`/api/students/${studentId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}
