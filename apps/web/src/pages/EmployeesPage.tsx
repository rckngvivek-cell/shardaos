import { useState } from 'react';
import {
  useListEmployeesQuery,
  useCreateEmployeeMutation,
  useDeactivateEmployeeMutation,
  type Employee,
  type CreateEmployeeInput,
} from '../features/owner/ownerApi';
import { DataTable } from '../components/shared/DataTable';

const DEPARTMENTS = ['Engineering', 'Operations', 'Support', 'Finance', 'HR'];

const COLUMNS = [
  { header: 'Name', accessor: 'displayName' as keyof Employee },
  { header: 'Email', accessor: 'email' as keyof Employee },
  { header: 'Department', accessor: 'department' as keyof Employee },
  { header: 'Status', accessor: (row: Employee) => (row.isActive ? 'Active' : 'Inactive') },
  { header: 'Joined', accessor: (row: Employee) => new Date(row.createdAt).toLocaleDateString() },
];

const EMPTY_FORM: CreateEmployeeInput = { uid: '', email: '', displayName: '', department: '' };

export function EmployeesPage() {
  const { data, isLoading } = useListEmployeesQuery();
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [deactivateEmployee] = useDeactivateEmployeeMutation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateEmployeeInput>(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const employees = data?.data ?? [];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    try {
      await createEmployee(form).unwrap();
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err: unknown) {
      const message = (err as { data?: { message?: string } })?.data?.message ?? 'Failed to create employee';
      setFormError(message);
    }
  }

  async function handleDeactivate(row: Employee) {
    if (!confirm(`Deactivate ${row.displayName}?`)) return;
    await deactivateEmployee(row.id).unwrap().catch(() => null);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Platform staff management</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(''); }}
          className="px-4 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Onboard New Employee</h2>
          {formError && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{formError}</div>
          )}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Firebase UID</label>
              <input
                name="uid"
                required
                value={form.uid}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Firebase user UID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="employee@domain.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input
                name="displayName"
                required
                minLength={2}
                value={form.displayName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department"
                required
                value={form.department}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={isCreating}
                className="px-6 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 disabled:opacity-60 transition-colors"
              >
                {isCreating ? 'Creating…' : 'Create Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={COLUMNS}
        data={employees}
        isLoading={isLoading}
        onDelete={handleDeactivate}
      />
    </div>
  );
}
