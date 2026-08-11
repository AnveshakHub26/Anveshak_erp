import React from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => {
  return (
    <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
      <div className="mb-4 border-b border-[#E2E8F0] pb-3">
        <h4 className="text-base font-bold text-[#0F172A]">{title}</h4>
        {description && <p className="mt-1 text-xs text-[#64748B]">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
};
