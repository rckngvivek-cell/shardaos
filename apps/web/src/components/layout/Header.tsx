import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logout } from '../../features/auth/authSlice';

export function Header() {
  const { email } = useAppSelector((s) => s.auth);
  const dispatch = useAppDispatch();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h2 className="text-lg font-semibold text-gray-800 lg:hidden">School ERP</h2>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600 hidden sm:block">{email}</span>
        <button
          onClick={() => dispatch(logout())}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
