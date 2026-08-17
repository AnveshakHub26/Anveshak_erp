import '@/styles/globals.css';
import React from 'react';
import type { Metadata, Viewport } from 'next';
import { AppProvider } from '@/providers/app-provider';
import { PersistentShell } from '@/components/layout/persistent-shell';

// ── CRITICAL: viewport meta tag for correct mobile/tablet rendering ──────────
// Without this, browsers use a virtual 980px viewport and scale it down,
// which makes every mobile breakpoint useless.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata: Metadata = {
  title: 'AnveshakHub Enterprise Application',
  description:
    'Enterprise Management Platform combining CRM, ERP, HR, and Project operations for Anveshak Hub.',
  keywords: ['ERP', 'CRM', 'HR Management', 'Enterprise', 'AnveshakHub'],
  authors: [{ name: 'AnveshakHub Technical Team' }],
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
