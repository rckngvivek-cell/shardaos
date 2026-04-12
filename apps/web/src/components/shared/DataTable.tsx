interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => string);
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onDelete?: (row: T) => void;
}

export function DataTable<T>({ columns, data, isLoading, onDelete }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
        No records found
      </div>
    );
  }

  function getCellValue(row: T, accessor: Column<T>['accessor']): string {
    if (typeof accessor === 'function') return accessor(row);
    return String((row as Record<string, unknown>)[accessor as string] ?? '');
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {columns.map((col) => (
                <th key={col.header} className="text-left px-4 py-3 font-medium text-gray-600">
                  {col.header}
                </th>
              ))}
              {onDelete && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                {columns.map((col) => (
                  <td key={col.header} className="px-4 py-3 text-gray-800">
                    {getCellValue(row, col.accessor)}
                  </td>
                ))}
                {onDelete && (
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(row)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
