import { useState } from 'react';
import {
  useListApprovalsQuery,
  useApproveApprovalMutation,
  useDenyApprovalMutation,
  type Approval,
  type ApprovalStatus,
} from '../features/owner/ownerApi';

type StatusFilter = ApprovalStatus | 'all';

const STATUS_BADGE: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  denied: 'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: ApprovalStatus }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[status]}`}>
      {status}
    </span>
  );
}

export function ApprovalsPage() {
  const [filter, setFilter] = useState<StatusFilter>('pending');
  const [actionId, setActionId] = useState<string | null>(null);

  const { data, isLoading } = useListApprovalsQuery(filter === 'all' ? undefined : { status: filter });
  const [approveApproval] = useApproveApprovalMutation();
  const [denyApproval] = useDenyApprovalMutation();

  const approvals = data?.data ?? [];

  async function handleApprove(row: Approval) {
    setActionId(row.id);
    await approveApproval(row.id).unwrap().catch(() => null);
    setActionId(null);
  }

  async function handleDeny(row: Approval) {
    setActionId(row.id);
    await denyApproval(row.id).unwrap().catch(() => null);
    setActionId(null);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
        <p className="text-gray-500 mt-1">Review and decide on platform requests</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(['pending', 'approved', 'denied', 'all'] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === s
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Custom table with action buttons */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          Loading…
        </div>
      ) : approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
          No {filter === 'all' ? '' : filter} approvals found
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Request</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Requested By</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {approvals.map((row) => {
                  const schoolIdValue = row.metadata?.schoolId;
                  const schoolId = typeof schoolIdValue === 'string' ? schoolIdValue : null;
                  const requestType = row.type.replace(/_/g, ' ');

                  return (
                    <tr key={row.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-800">
                        <div className="font-medium capitalize">{requestType}</div>
                        <div className="text-gray-600">{row.title}</div>
                        {row.description ? (
                          <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate" title={row.description}>
                            {row.description}
                          </div>
                        ) : null}
                        {schoolId ? (
                          <div className="text-xs text-gray-400 mt-0.5">School: {schoolId}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-800">{row.requestedByEmail}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        {row.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(row)}
                              disabled={actionId === row.id}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeny(row)}
                              disabled={actionId === row.id}
                              className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
