import { NavLink, Outlet } from 'react-router-dom'

import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { roles } from '@/data/mockData'
import { authModeLabels } from '@/services/auth'
import {
  resetSession,
  setAuthMode,
  setFirebaseIdToken,
  setRole,
} from '@/features/session/sessionSlice'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/students', label: 'Students' },
]

export function AppShell() {
  const dispatch = useAppDispatch()
  const session = useAppSelector((state) => state.session)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">ERP</span>
          <div>
            <p className="eyebrow">Rural-First Pilot</p>
            <h1>School Canvas</h1>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                `nav-link${isActive ? ' is-active' : ''}`
              }
              to={item.to}
              end={item.to === '/'}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <section className="sidebar-card sidebar-card--session">
          <p className="eyebrow">Session</p>
          <strong>{session.displayName}</strong>
          <span>{session.email}</span>
          <span>{session.schoolId}</span>

          <div className="role-switcher" aria-label="Role selector">
            {roles.map((role) => (
              <button
                key={role}
                type="button"
                className={role === session.role ? 'role-chip role-chip--active' : 'role-chip'}
                onClick={() => dispatch(setRole(role))}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="auth-mode-switcher" role="group" aria-label="Auth mode selector">
            {(Object.keys(authModeLabels) as Array<keyof typeof authModeLabels>).map((mode) => (
              <button
                key={mode}
                type="button"
                className={mode === session.authMode ? 'button button--primary' : 'button button--ghost'}
                onClick={() => dispatch(setAuthMode(mode))}
              >
                {authModeLabels[mode]}
              </button>
            ))}
          </div>

          {session.authMode === 'firebase' ? (
            <label className="field field--compact">
              <span>Firebase ID token</span>
              <input
                autoComplete="off"
                placeholder="Paste an ID token to enable Firebase auth"
                value={session.firebaseIdToken ?? ''}
                onChange={(event) => dispatch(setFirebaseIdToken(event.target.value))}
              />
            </label>
          ) : null}

          <div className="session-actions">
            <button className="button button--ghost" type="button" onClick={() => dispatch(resetSession())}>
              Reset demo session
            </button>
          </div>

          <span className="status-badge">
            {session.authMode === 'firebase'
              ? session.firebaseIdToken
                ? 'Firebase token loaded'
                : 'Firebase token missing'
              : 'Local dev session'}
          </span>
        </section>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  )
}
