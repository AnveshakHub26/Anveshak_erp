import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select or search...',
  error,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter(
    (o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="relative w-full">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex cursor-pointer items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#0F172A]',
          error && 'border-[#B42318]',
          className,
        )}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <Search className="h-4 w-4 text-[#64748B]" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[#E2E8F0] bg-white p-1 shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="mb-1 w-full rounded border border-[#E2E8F0] p-1.5 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
          />
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-center text-xs text-[#64748B]">No options found</div>
          ) : (
            filteredOptions.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                  setSearch('');
                }}
                className={cn(
                  'cursor-pointer px-3 py-1.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC]',
                  opt.value === value && 'bg-[#F8FAFC] font-semibold text-[#d49b38]',
                )}
              >
                <div>{opt.label}</div>
                {opt.sublabel && <div className="text-xs text-[#64748B]">{opt.sublabel}</div>}
              </div>
            ))
          )}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-[#B42318]">{error}</p>}
    </div>
  );
};
