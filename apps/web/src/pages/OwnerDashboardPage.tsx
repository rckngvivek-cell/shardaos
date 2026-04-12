import { Link } from 'react-router-dom';
import { useGetOwnerSummaryQuery } from '../features/owner/ownerApi';
import { KpiCard } from '../components/shared/KpiCard';

export function OwnerDashboardPage() {
  const { data, isLoading, refetch } = useGetOwnerSummaryQuery();
  const summary = data?.data;

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Owner Dashboard</h1>
          <p className="text-gray-500 mt-1">Platform overview</p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-brand-600 hover:text-brand-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <KpiCard
          label="Pending Approvals"
          value={isLoading ? '—' : String(summary?.pendingApprovals ?? 0)}
          trend="Requires your decision"
        />
        <KpiCard
          label="Active Employees"
          value={isLoading ? '—' : String(summary?.activeEmployees ?? 0)}
          trend="Platform staff"
        />
        <KpiCard
          label="Last Refreshed"
          value={
            isLoading
              ? '—'
              : summary?.generatedAt
                ? new Date(summary.generatedAt).toLocaleTimeString()
                : '—'
          }
        />
      </div>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Quick Actions</h2>
          <p className="text-sm text-gray-500 mb-4">Common owner tasks</p>
          <div className="space-y-2">
            <Link
              to="/owner/employees"
              className="block px-4 py-3 rounded-lg bg-brand-50 text-brand-700 text-sm font-medium hover:bg-brand-100 transition-colors"
            >
              → Manage Employees
            </Link>
            <Link
              to="/owner/approvals"
              className="block px-4 py-3 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              → Review Approvals{' '}
              {summary?.pendingApprovals ? `(${summary.pendingApprovals} pending)` : ''}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-1">Platform Health</h2>
          <p className="text-sm text-gray-500 mb-4">System status at a glance</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Employee Capacity</span>
              <span className="font-medium text-gray-900">{summary?.activeEmployees ?? '—'} active</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Approval Queue</span>
              <span className={`font-medium ${(summary?.pendingApprovals ?? 0) > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {summary?.pendingApprovals ?? '—'} pending
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
