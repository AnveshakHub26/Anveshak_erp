import React from 'react';
import { Button } from './button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  onPageChange,
}) => {
  return (
    <div className="flex items-center justify-between border-t border-[#D7DEE6] bg-white px-4 py-3 text-label">
      <div className="text-[#5B6673]">
        Showing page <span className="font-semibold text-[#17202A]">{page}</span> of{' '}
        <span className="font-semibold text-[#17202A]">{totalPages}</span> ({total} total records)
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
