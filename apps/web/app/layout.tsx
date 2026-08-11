import '@/styles/globals.css';
import React from 'react';
import { AppProvider } from '@/providers/app-provider';

export const metadata = {
  title: 'AnveshakHub Enterprise Application',
  description: 'Enterprise Management Platform combining CRM and ERP operations.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
