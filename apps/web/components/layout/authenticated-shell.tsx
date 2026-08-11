'use client';

import React from 'react';
import { Sidebar } from './sidebar';
import { TopNav } from './top-nav';

export interface AuthenticatedShellProps {
  children: React.ReactNode;
}

export const AuthenticatedShell: React.FC<AuthenticatedShellProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F7F8FA]">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};
