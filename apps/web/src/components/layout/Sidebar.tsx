import { NavLink, useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';
import { clearDevSession } from '../../features/auth/AuthInitializer';
import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

const TENANT_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/students', label: 'Students' },
  { to: '/attendance', label: 'Attendance' },
];

const OWNER_LINKS = [
  { to: '/owner', label: 'Dashboard' },
  { to: '/owner/employees', label: 'Employees' },
  { to: '/owner/approvals', label: 'Approvals' },
];

export function Sidebar() {
  const role = useAppSelector((s) => s.auth.role);
  const email = useAppSelector((s) => s.auth.email);
  const isOwner = role === 'owner';
  const links = isOwner ? OWNER_LINKS : TENANT_LINKS;
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      if (auth) await signOut(auth);
    } catch {
      // Firebase signOut may fail if not initialised — continue
    }
    clearDevSession();
    dispatch(logout());
    navigate('/login', { replace: true });
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-white border-r border-gray-200">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <span className="text-xl font-bold text-brand-600">
          {isOwner ? 'ShardaOS Owner' : 'School ERP'}
        </span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/' || link.to === '/owner'}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      {isOwner && (
        <div className="p-4 border-t border-gray-200">
          <span className="block px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Platform Owner
          </span>
        </div>
      )}
      <div className="p-4 border-t border-gray-200">
        {email && (
          <p className="px-3 mb-2 text-xs text-gray-500 truncate" title={email}>
            {email}
          </p>
        )}
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
