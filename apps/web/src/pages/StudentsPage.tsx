import { useState } from 'react';
import type { Student } from '@school-erp/shared';
import { useListStudentsQuery, useDeleteStudentMutation } from '../features/students/studentsApi';
import { DataTable } from '../components/shared/DataTable';

export function StudentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useListStudentsQuery({ page, limit: 20 });
  const [deleteStudent] = useDeleteStudentMutation();

  const columns = [
    { header: 'Name', accessor: (r: Student) => `${r.firstName} ${r.lastName}` },
    { header: 'Grade', accessor: 'grade' as const },
    { header: 'Section', accessor: 'section' as const },
    { header: 'Roll No', accessor: 'rollNumber' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <button className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors">
          + Add Student
        </button>
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        isLoading={isLoading}
        onDelete={(row) => void deleteStudent(row.id).unwrap().catch(() => null)}
      />

      {data?.meta && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Showing page {data.meta.page} of {Math.ceil(data.meta.total / data.meta.limit)}</span>
          <div className="space-x-2">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
            <button disabled={data.data.length < data.meta.limit} onClick={() => setPage(page + 1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
