import { useAppSelector } from '../store/hooks';
import { KpiCard } from '../components/shared/KpiCard';
import { useListStudentsQuery } from '../features/students/studentsApi';

export function DashboardPage() {
  const { email } = useAppSelector((s) => s.auth);
  const { data: studentsData, isLoading } = useListStudentsQuery({ page: 1, limit: 1 });
  const totalStudents = studentsData?.meta?.total ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome, {email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard label="Total Students" value={isLoading ? '—' : String(totalStudents)} />
        <KpiCard label="Today's Attendance" value="—" />
        <KpiCard label="Avg Grade" value="—" />
        <KpiCard label="Active Staff" value="—" />
      </div>
    </div>
  );
}
