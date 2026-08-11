import React from 'react';

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
  htmlFor?: string;
}

export const FormField: React.FC<FormFieldProps> = ({ label, required, error, children, hint, htmlFor }) => {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="mb-1.5 flex items-center text-xs font-semibold text-[#0f172a]">
        {label}
        {required && <span className="ml-1 text-[#d49b38] font-bold">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#5B6673]">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-[#B42318]">{error}</p>}
    </div>
  );
};
