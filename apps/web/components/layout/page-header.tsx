import React from 'react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, actions }) => {
  return (
    <div className="mb-6 flex flex-col justify-between border-b border-[#D7DEE6] pb-4 sm:flex-row sm:items-center">
      <div>
        <h1 className="text-page-title text-[#17202A]">{title}</h1>
        {description && <p className="mt-1 text-body text-[#5B6673]">{description}</p>}
      </div>
      {actions && <div className="mt-4 flex items-center space-x-3 sm:mt-0">{actions}</div>}
    </div>
  );
};
