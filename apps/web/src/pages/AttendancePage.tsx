import { useState } from 'react';
import { useListAttendanceQuery } from '../features/attendance/attendanceApi';
import { DataTable } from '../components/shared/DataTable';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function AttendancePage() {
  const [date, setDate] = useState(todayStr);
  const { data, isLoading } = useListAttendanceQuery({ date });

  const columns = [
    { header: 'Student ID', accessor: 'studentId' as const },
    { header: 'Status', accessor: 'status' as const },
    { header: 'Date', accessor: 'date' as const },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
        />
      </div>

      <DataTable columns={columns} data={data?.data ?? []} isLoading={isLoading} />
    </div>
  );
}
