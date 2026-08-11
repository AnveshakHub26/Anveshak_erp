import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="mb-6 flex flex-col justify-between border-b border-[#E2E8F0] pb-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">{title}</h1>
        {description && <p className="mt-1 text-xs text-[#64748B]">{description}</p>}
      </div>
      {actions && <div className="mt-4 flex items-center space-x-3 sm:mt-0">{actions}</div>}
    </div>
  );
};
