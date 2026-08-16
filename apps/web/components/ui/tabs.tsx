'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface TabsProps {
  tabs?: TabItem[];
  activeTab?: string;
  onChange?: (id: string) => void;
  defaultValue?: string;
  className?: string;
  children?: React.ReactNode;
}

const TabsContext = createContext<{
  activeTab: string;
  setActiveTab: (id: string) => void;
}>({
  activeTab: '',
  setActiveTab: () => {},
});

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  defaultValue,
  className,
  children,
}) => {
  const [selectedTab, setSelectedTab] = useState(defaultValue || (tabs && tabs[0]?.id) || '');
  const currentTab = activeTab !== undefined ? activeTab : selectedTab;

  const handleTabChange = (id: string) => {
    setSelectedTab(id);
    onChange?.(id);
  };

  if (tabs) {
    return (
      <div className={cn('border-b border-[#E2E8F0] overflow-x-auto scrollbar-none', className)}>
        <nav className="flex space-x-2 sm:space-x-4 min-w-max pb-px" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === currentTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
                      isActive ? 'bg-[#151c2e] text-[#d49b38]' : 'bg-[#F1F5F9] text-[#64748B]',
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
  }

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={cn('flex space-x-1 border-b border-slate-200 overflow-x-auto', className)}>{children}</div>
);

export const TabsTrigger: React.FC<{ value: string; className?: string; children: React.ReactNode }> = ({
  value,
  className,
  children,
}) => {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        'px-4 py-2 text-xs font-bold rounded-lg transition-all focus:outline-none',
        isActive ? 'bg-[#151c2e] text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
        className,
      )}
    >
      {children}
    </button>
  );
};

export const TabsContent: React.FC<{ value: string; className?: string; children: React.ReactNode }> = ({
  value,
  className,
  children,
}) => {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) return null;
  return <div className={cn('pt-4', className)}>{children}</div>;
};
