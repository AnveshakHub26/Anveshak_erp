import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  const styles = {
    neutral: 'bg-[#F7F8FA] text-[#5B6673] border-[#D7DEE6]',
    success: 'bg-[#EBF5F0] text-[#2F6F52] border-[#2F6F52]',
    warning: 'bg-[#FFF8E6] text-[#A56A00] border-[#A56A00]',
    error: 'bg-[#FDF2F2] text-[#B42318] border-[#B42318]',
    info: 'bg-[#F0F6FA] text-[#356A95] border-[#356A95]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
