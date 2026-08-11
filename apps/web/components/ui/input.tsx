import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string | boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-[#D7DEE6] bg-white px-3.5 py-2 text-body text-[#0f172a] placeholder-[#94a3b8] transition-colors focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38]',
            error && 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]',
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = 'Input';
