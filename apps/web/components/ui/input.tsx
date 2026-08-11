import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="w-full">
        <input
          ref={ref}
          className={cn(
            'w-full rounded border border-[#D7DEE6] bg-white px-3 py-2 text-body text-[#17202A] placeholder-[#5B6673] transition-colors focus:border-[#1F4E79] focus:outline-none focus:ring-1 focus:ring-[#1F4E79]',
            error && 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]',
            className,
          )}
          {...props}
        />
        {error ? <p className="mt-1 text-label text-[#B42318]">{error}</p> : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
