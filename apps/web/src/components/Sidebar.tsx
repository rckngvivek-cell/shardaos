import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/finance', label: 'Finance' },
]

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar__panel">
        <div className="sidebar__title">
          <span className="sidebar__badge">ERP</span>
          <div>
            <h2>School platform</h2>
            <p>Public app shell</p>
          </div>
        </div>

        <nav className="sidebar__nav" aria-label="Primary">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }: { isActive: boolean }) =>
                isActive ? 'nav-item nav-item--active' : 'nav-item'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__note">
          Founder dashboard stays local-only and is not exposed in the public web app.
        </div>
      </div>
    </aside>
  )
}
