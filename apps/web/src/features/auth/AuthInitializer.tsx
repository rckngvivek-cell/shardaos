import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useAppDispatch } from '../../store/hooks';
import { setUser, logout, setLoading } from './authSlice';
import { auth } from '../../lib/firebase';
import type { UserRole } from '@school-erp/shared';

const DEV_SESSION_KEY = 'shardaos_dev_session';

export interface DevSession {
  uid: string;
  email: string;
  role: UserRole;
  schoolId: string;
}

export function saveDevSession(session: DevSession): void {
  try {
    sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify(session));
  } catch {
    // sessionStorage unavailable — ignore
  }
}

export function clearDevSession(): void {
  try {
    sessionStorage.removeItem(DEV_SESSION_KEY);
  } catch {
    // ignore
  }
}

function loadDevSession(): DevSession | null {
  try {
    const raw = sessionStorage.getItem(DEV_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (
      typeof parsed.uid === 'string' &&
      typeof parsed.email === 'string' &&
      typeof parsed.role === 'string' &&
      typeof parsed.schoolId === 'string'
    ) {
      return parsed as unknown as DevSession;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Initialises auth state on app load.
 *
 * - When Firebase is configured: uses `onAuthStateChanged` to restore the session.
 * - When Firebase is NOT configured (local dev): restores from sessionStorage.
 *
 * Must be rendered inside the Redux <Provider>.
 */
export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // ── Firebase mode ──
    if (auth) {
      dispatch(setLoading(true));

      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const tokenResult = await user.getIdTokenResult();
            const claimRole = tokenResult.claims.role ?? tokenResult.claims.custom_role;
            const role = (typeof claimRole === 'string' ? claimRole : 'student') as UserRole;
            const schoolIdClaim = tokenResult.claims.schoolId;
            const schoolId = typeof schoolIdClaim === 'string' ? schoolIdClaim : '';

            dispatch(
              setUser({
                uid: user.uid,
                email: user.email ?? '',
                role,
                schoolId,
              }),
            );
          } catch {
            dispatch(logout());
          }
        } else {
          dispatch(logout());
        }
      });

      return unsubscribe;
    }

    // ── Dev fallback mode (no Firebase) ──
    const devSession = loadDevSession();
    if (devSession) {
      dispatch(setUser(devSession));
    }
    // No session → remain logged out (isLoading stays false)
  }, [dispatch]);

  return <>{children}</>;
}
