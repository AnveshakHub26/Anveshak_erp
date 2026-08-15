import '@/styles/globals.css';
import React from 'react';
import { AppProvider } from '@/providers/app-provider';
import { PersistentShell } from '@/components/layout/persistent-shell';

export const metadata = {
  title: 'AnveshakHub Enterprise Application',
  description: 'Enterprise Management Platform combining CRM and ERP operations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <PersistentShell>{children}</PersistentShell>
        </AppProvider>
      </body>
    </html>
  );
}
