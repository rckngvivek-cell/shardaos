import { useAppDispatch, useAppSelector } from '@/app/hooks'
import { closeSidebar, setRole, toggleSidebar } from '@/features/session/sessionSlice'
import { roles } from '@/data/mockData'

const roleLabels: Record<(typeof roles)[number], string> = {
  principal: 'Principal view',
  teacher: 'Teacher view',
  admin: 'Admin view',
  parent: 'Parent view',
}

export function Header() {
  const dispatch = useAppDispatch()
  const role = useAppSelector((state) => state.session.role)

  return (
    <header className="topbar">
      <div className="topbar__brand">
        <button className="icon-button" type="button" onClick={() => dispatch(toggleSidebar())}>
          <span />
          <span />
          <span />
        </button>
        <div>
          <p className="eyebrow">School ERP</p>
          <h1>Operations cockpit</h1>
        </div>
      </div>

      <div className="topbar__meta">
        <div className="role-switcher" aria-label="Role selector">
          {roles.map((item) => (
            <button
              key={item}
              type="button"
              className={item === role ? 'role-chip role-chip--active' : 'role-chip'}
              onClick={() => {
                dispatch(setRole(item))
                dispatch(closeSidebar())
              }}
            >
              {roleLabels[item]}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
