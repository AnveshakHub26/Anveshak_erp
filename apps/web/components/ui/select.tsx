import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Edit3 } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | boolean;
  options?: { label: string; value: string; disabled?: boolean }[];
  value?: string;
  onValueChange?: (val: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
  allowOther?: boolean;
  otherPlaceholder?: string;
}

// Helper to extract option items recursively from React children tree
function extractOptions(children: React.ReactNode): { label: string; value: string; disabled?: boolean }[] {
  const options: { label: string; value: string; disabled?: boolean }[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === 'option') {
      options.push({
        label: String(child.props.children || child.props.value || ''),
        value: String(child.props.value || ''),
        disabled: child.props.disabled,
      });
    } else if (child.props?.value !== undefined && child.props?.children !== undefined) {
      options.push({
        label: String(child.props.children || child.props.value || ''),
        value: String(child.props.value || ''),
        disabled: child.props.disabled,
      });
    } else if (child.props?.children) {
      options.push(...extractOptions(child.props.children));
    }
  });

  return options;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  className,
  children,
  options: providedOptions,
  disabled,
  placeholder,
  allowOther = true,
  otherPlaceholder = 'Type custom value if not listed above...',
  ...props
}) => {
  const parsedOptions = providedOptions || (children ? extractOptions(children) : []);

  // Check if current value matches predefined options
  const isPredefined = parsedOptions.some((opt) => opt.value === value);
  const isOtherSelected = value === 'OTHER' || (!!value && !isPredefined);

  const [customValue, setCustomValue] = useState(isOtherSelected && value !== 'OTHER' ? value : '');

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedVal = e.target.value;
    if (selectedVal === 'OTHER') {
      onValueChange?.(customValue || 'OTHER');
    } else {
      onValueChange?.(selectedVal);
    }
  };

  const handleCustomInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const typed = e.target.value;
    setCustomValue(typed);
    onValueChange?.(typed || 'OTHER');
  };

  // Append 'OTHER' option if allowOther is true and not already present
  const hasOtherOption = parsedOptions.some((opt) => opt.value === 'OTHER');
  const finalOptions =
    allowOther && !hasOtherOption
      ? [...parsedOptions, { label: 'Other / Type Custom Value...', value: 'OTHER' }]
      : parsedOptions;

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full">
        <select
          value={isOtherSelected ? 'OTHER' : (value ?? '')}
          disabled={disabled}
          onChange={handleSelectChange}
          className={cn(
            'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-xs font-medium text-slate-900 focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38] disabled:bg-slate-100 disabled:cursor-not-allowed appearance-none cursor-pointer shadow-sm',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}
          {finalOptions.map((opt, idx) => (
            <option key={opt.value || idx} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
      </div>

      {isOtherSelected && (
        <div className="relative flex items-center animate-fadeIn">
          <Edit3 className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-[#d49b38] z-10" />
          <input
            type="text"
            value={customValue}
            onChange={handleCustomInputChange}
            placeholder={otherPlaceholder}
            className="w-full rounded-lg border border-[#d49b38]/50 bg-amber-50/30 py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 placeholder-slate-400 focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d49b38]/20 transition-all shadow-xs"
          />
        </div>
      )}
    </div>
  );
};

export const SelectTrigger: React.FC<any> = ({ children }) => <>{children}</>;

export const SelectValue: React.FC<{ placeholder?: string }> = ({ placeholder }) => {
  if (!placeholder) return null;
  return <option value="" disabled hidden>{placeholder}</option>;
};

export const SelectContent: React.FC<any> = ({ children }) => <>{children}</>;

export const SelectItem: React.FC<{ value: string; children: React.ReactNode; disabled?: boolean }> = ({
  value,
  children,
  disabled,
}) => (
  <option value={value} disabled={disabled}>
    {children}
  </option>
);
