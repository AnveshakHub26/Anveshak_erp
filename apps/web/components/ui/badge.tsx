import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps {
  variant?: 'neutral' | 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, className }) => {
  const styles = {
    neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    success: 'bg-[#EBF5F0] text-[#2F6F52] border-[#A3D9C0]',
    warning: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
    error: 'bg-[#FDF2F2] text-[#B42318] border-[#FECACA]',
    info: 'bg-[#F0F6FA] text-[#356A95] border-[#CBD5E1]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wider uppercase',
        styles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
};
