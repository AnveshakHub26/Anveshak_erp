import React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('border-b border-[#E2E8F0] overflow-x-auto scrollbar-none', className)}>
      <nav className="flex space-x-2 sm:space-x-4 min-w-max pb-px" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center space-x-2 border-b-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap focus:outline-none',
                isActive
                  ? 'border-[#d49b38] text-[#151c2e]'
                  : 'border-transparent text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A]',
              )}
            >
              {Icon && <Icon className={cn('h-4 w-4', isActive ? 'text-[#d49b38]' : 'text-[#64748B]')} />}
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-bold',
                    isActive
                      ? 'bg-[#151c2e] text-[#d49b38]'
                      : 'bg-[#F1F5F9] text-[#64748B]',
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
