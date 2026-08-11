import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto rounded border border-[#D7DEE6] bg-white">
      <table className="w-full border-collapse text-left text-table">
        <thead>
          <tr className="border-b border-[#D7DEE6] bg-[#F7F8FA] text-[#5B6673]">
            {columns.map((col, idx) => (
              <th key={idx} className={cn('px-4 py-3 font-semibold', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#D7DEE6]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#5B6673]">
                <div className="flex items-center justify-center space-x-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1F4E79] border-t-transparent" />
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#5B6673]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-[#F7F8FA]">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn('px-4 py-3 text-[#17202A]', col.className)}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? '')
                      : null}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
