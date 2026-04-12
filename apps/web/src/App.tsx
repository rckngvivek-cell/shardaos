import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { AttendancePage } from './pages/AttendancePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AuthGuard } from './features/auth/AuthGuard';
import { OwnerGuard } from './features/owner/OwnerGuard';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Tenant routes */}
        <Route element={<AuthGuard />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
          </Route>
        </Route>

        {/* Owner (platform) routes */}
        <Route element={<OwnerGuard />}>
          <Route element={<AppShell />}>
            <Route path="/owner" element={<OwnerDashboardPage />} />
            <Route path="/owner/employees" element={<EmployeesPage />} />
            <Route path="/owner/approvals" element={<ApprovalsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
