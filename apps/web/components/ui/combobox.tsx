import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Search, Plus, Edit3 } from 'lucide-react';

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
  error?: string | boolean;
  className?: string;
  allowCustom?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Select or search...',
  error,
  className,
  allowCustom = true,
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
          'flex cursor-pointer items-center justify-between rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#0F172A] shadow-xs hover:border-[#d49b38] transition-all',
          error && 'border-[#B42318]',
          className,
        )}
      >
        <span className="truncate">{selectedOption ? selectedOption.label : (value || placeholder)}</span>
        <Search className="h-4 w-4 text-[#64748B] shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-xl">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type to search or enter custom value..."
            className="mb-1.5 w-full rounded-lg border border-[#E2E8F0] bg-slate-50 p-2 text-xs text-[#0F172A] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
          />
          {filteredOptions.length === 0 ? (
            <div className="p-2 space-y-1">
              <div className="text-center text-xs text-[#64748B]">No matching predefined option</div>
              {allowCustom && search.trim() && (
                <div
                  onClick={() => {
                    onChange(search.trim());
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-all border border-amber-200"
                >
                  <Plus className="h-3.5 w-3.5 text-[#d49b38]" />
                  <span>Use custom value "{search.trim()}"</span>
                </div>
              )}
            </div>
          ) : (
            <>
              {filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={cn(
                    'cursor-pointer rounded-lg px-3 py-1.5 text-xs text-[#0F172A] hover:bg-[#F8FAFC]',
                    opt.value === value && 'bg-[#F8FAFC] font-bold text-[#d49b38]',
                  )}
                >
                  <div>{opt.label}</div>
                  {opt.sublabel && <div className="text-[10px] text-[#64748B]">{opt.sublabel}</div>}
                </div>
              ))}
              {allowCustom && search.trim() && (
                <div
                  onClick={() => {
                    onChange(search.trim());
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition-all border border-amber-200 mt-1"
                >
                  <Plus className="h-3.5 w-3.5 text-[#d49b38]" />
                  <span>Use custom value "{search.trim()}"</span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
