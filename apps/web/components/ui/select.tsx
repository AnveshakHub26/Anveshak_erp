import React from 'react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | boolean;
  options?: { label: string; value: string }[];
  value?: string;
  onValueChange?: (val: string) => void;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, className, children, options, ...props }) => {
  if (options) {
    return (
      <div className="w-full">
        <select
          value={value}
          onChange={(e) => onValueChange?.(e.target.value)}
          className={cn(
            'w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38]',
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="w-full relative">
      <select
        value={value}
        onChange={(e) => onValueChange?.(e.target.value)}
        className={cn(
          'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38] appearance-none cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export const SelectTrigger: React.FC<any> = ({ className, children }) => <>{children}</>;
export const SelectValue: React.FC<any> = ({ placeholder }) => <option value="" disabled hidden>{placeholder}</option>;
export const SelectContent: React.FC<any> = ({ children }) => <>{children}</>;
export const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <option value={value}>{children}</option>
);
