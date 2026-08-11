import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded border border-[#D7DEE6] bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-[#D7DEE6] pb-3">
          <h3 className="text-section-title text-[#17202A]">{title}</h3>
          <button onClick={onClose} className="text-[#5B6673] hover:text-[#17202A]">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};
