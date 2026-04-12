import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

export function OwnerGuard() {
  const { isAuthenticated, isLoading, role } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  if (!isAuthenticated || role !== 'owner') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
