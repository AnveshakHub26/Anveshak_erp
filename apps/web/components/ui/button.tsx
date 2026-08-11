import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-semibold hover:opacity-95 shadow-sm focus:ring-[#d49b38]',
      secondary: 'bg-[#151c2e] text-white hover:bg-[#182238] focus:ring-[#151c2e]',
      outline: 'border border-[#D7DEE6] bg-white text-[#0f172a] hover:bg-[#F8FAFC] focus:ring-[#d49b38]',
      ghost: 'bg-transparent text-[#475569] hover:text-[#0f172a] hover:bg-[#F1F5F9] focus:ring-[#d49b38]',
      danger: 'bg-[#B42318] text-white hover:bg-[#911c13] focus:ring-[#B42318]',
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 h-8',
      md: 'text-body px-4 py-2 h-10',
      lg: 'text-body px-5 py-2.5 h-12',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
