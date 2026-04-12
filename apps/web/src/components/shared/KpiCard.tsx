interface KpiCardProps {
  label: string;
  value: string;
  trend?: string;
}

export function KpiCard({ label, value, trend }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {trend && <p className="text-xs text-gray-400 mt-2">{trend}</p>}
    </div>
  );
}
