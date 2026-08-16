import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string | boolean;
  options?: { label: string; value: string; disabled?: boolean }[];
  value?: string;
  onValueChange?: (val: string) => void;
  placeholder?: string;
  children?: React.ReactNode;
}

// Helper to extract option items recursively from React children tree
function extractOptions(children: React.ReactNode): { label: string; value: string; disabled?: boolean }[] {
  const options: { label: string; value: string; disabled?: boolean }[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const typeName = (child.type as any)?.displayName || (child.type as any)?.name || '';

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
  ...props
}) => {
  const parsedOptions = providedOptions || (children ? extractOptions(children) : []);

  return (
    <div className="w-full relative">
      <select
        value={value ?? ''}
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.value)}
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
        {parsedOptions.map((opt, idx) => (
          <option key={opt.value || idx} value={opt.value} disabled={opt.disabled}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
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
