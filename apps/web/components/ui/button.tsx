import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, type, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 shrink-0';

    const variants = {
      primary:
        'bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] hover:opacity-95 shadow-sm focus:ring-[#d49b38]',
      secondary:
        'bg-[#151c2e] text-white hover:bg-[#182238] focus:ring-[#151c2e]',
      outline:
        'border border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#d49b38] focus:ring-[#d49b38]',
      ghost:
        'bg-transparent text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] focus:ring-[#d49b38]',
      danger:
        'bg-[#B42318] text-white hover:bg-[#911c13] focus:ring-[#B42318]',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[32px]',
      md: 'text-xs sm:text-sm px-4 py-2 min-h-[40px]',
      lg: 'text-xs sm:text-sm px-5 py-2.5 min-h-[48px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
        type={type || 'button'}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
