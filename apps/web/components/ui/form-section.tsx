import React from 'react';

export interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export const FormSection: React.FC<FormSectionProps> = ({ title, description, children }) => {
  return (
    <div className="mb-6 rounded border border-[#D7DEE6] bg-white p-6">
      <div className="mb-4 border-b border-[#D7DEE6] pb-3">
        <h4 className="text-section-title text-[#17202A]">{title}</h4>
        {description && <p className="mt-1 text-label text-[#5B6673]">{description}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
};
