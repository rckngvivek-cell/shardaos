import type { Approval, SchoolOnboardingRequestInput } from '@school-erp/shared';
import { requestPlatformApi } from './authSession';

export function requestSchoolOnboarding(input: SchoolOnboardingRequestInput): Promise<Approval> {
  return requestPlatformApi<Approval>('/api/owner/school-onboarding', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
}
