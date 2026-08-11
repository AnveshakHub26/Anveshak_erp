import React from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Info, XCircle } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ variant = 'info', title, children, className }) => {
  const styles = {
    info: 'bg-[#F0F6FA] text-[#356A95] border-[#356A95]',
    success: 'bg-[#EBF5F0] text-[#2F6F52] border-[#2F6F52]',
    warning: 'bg-[#FFF8E6] text-[#A56A00] border-[#A56A00]',
    error: 'bg-[#FDF2F2] text-[#B42318] border-[#B42318]',
  };

  const icons = {
    info: <Info className="h-5 w-5 shrink-0 text-[#356A95]" />,
    success: <CheckCircle className="h-5 w-5 shrink-0 text-[#2F6F52]" />,
    warning: <AlertTriangle className="h-5 w-5 shrink-0 text-[#A56A00]" />,
    error: <XCircle className="h-5 w-5 shrink-0 text-[#B42318]" />,
  };

  return (
    <div role="alert" className={cn('flex items-start space-x-3 rounded border p-4 text-body', styles[variant], className)}>
      {icons[variant]}
      <div>
        {title && <h5 className="font-semibold">{title}</h5>}
        <div className="text-table">{children}</div>
      </div>
    </div>
  );
};
