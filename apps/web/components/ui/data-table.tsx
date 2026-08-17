import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './button';

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
  error?: string | null | any;
  onRetry?: () => void;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  isLoading,
  error,
  onRetry,
  emptyMessage = 'No records found.',
}: DataTableProps<T>) {
  const getErrorMessage = (err: any): string => {
    if (!err) return '';
    if (typeof err === 'string') return err;
    if (err.status === 429 || err.code === 'TOO_MANY_REQUESTS') {
      return 'Too many requests. Please wait a moment and try again.';
    }
    if (err.status === 403 || err.status === 401) {
      return 'Access denied. You do not have permission to view these records.';
    }
    return err.message || 'Unable to load records. Please try again.';
  };

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-[#E2E8F0] bg-white shadow-xs">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
            {columns.map((col, idx) => (
              <th key={idx} className={cn('px-4 py-3 font-semibold uppercase tracking-wider text-[11px]', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E2E8F0]">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#64748B]">
                <div className="flex items-center justify-center space-x-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#d49b38] border-t-transparent" />
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-2 text-xs">
                  <div className="flex items-center space-x-2 text-red-600 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{getErrorMessage(error)}</span>
                  </div>
                  {onRetry && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onRetry}
                      className="mt-2 text-xs font-semibold text-[#0F172A]"
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5 text-[#d49b38]" />
                      Retry
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-[#64748B]">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-[#F8FAFC] transition-colors">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn('px-4 py-3 text-[#0F172A]', col.className)}>
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
