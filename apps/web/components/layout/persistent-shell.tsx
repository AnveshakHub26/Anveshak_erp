'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppShell } from './app-shell';

const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/registration-status',
  '/forgot-password',
  '/reset-password',
  '/activate',
  '/privacy',
  '/terms',
  '/support',
  '/unauthorized',
];

export function PersistentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/_not-found') ||
    pathname === '';

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <AppShell>{children}</AppShell>;
}
