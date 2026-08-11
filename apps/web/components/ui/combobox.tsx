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
          'flex cursor-pointer items-center justify-between rounded border border-[#D7DEE6] bg-white px-3 py-2 text-body text-[#17202A]',
          error && 'border-[#B42318]',
          className,
        )}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <Search className="h-4 w-4 text-[#5B6673]" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded border border-[#D7DEE6] bg-white p-1 shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="mb-1 w-full rounded border border-[#D7DEE6] p-1.5 text-table focus:outline-none focus:ring-1 focus:ring-[#1F4E79]"
          />
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-center text-label text-[#5B6673]">No options found</div>
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
                  'cursor-pointer px-3 py-1.5 text-table hover:bg-[#F7F8FA]',
                  opt.value === value && 'bg-[#F7F8FA] font-semibold text-[#1F4E79]',
                )}
              >
                <div>{opt.label}</div>
                {opt.sublabel && <div className="text-xs text-[#5B6673]">{opt.sublabel}</div>}
              </div>
            ))
          )}
        </div>
      )}
      {error && <p className="mt-1 text-label text-[#B42318]">{error}</p>}
    </div>
  );
};
