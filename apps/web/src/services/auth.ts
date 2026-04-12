import type { SessionState } from '@/features/session/sessionSlice'

export type SessionHeaders = Record<string, string>

export const authModeLabels: Record<SessionState['authMode'], string> = {
  dev: 'Dev session',
  firebase: 'Firebase token',
}

export function buildSessionHeaders(session: SessionState): SessionHeaders {
  const headers: SessionHeaders = {
    'x-auth-mode': session.authMode,
    'x-school-id': session.schoolId,
  }

  if (session.authMode === 'firebase') {
    if (session.firebaseIdToken) {
      headers.authorization = `Bearer ${session.firebaseIdToken}`
    }

    return headers
  }

  headers.authorization = `Bearer ${session.userId}`
  headers['x-user-id'] = session.userId
  headers['x-user-email'] = session.email
  headers['x-user-role'] = session.role

  return headers
}
