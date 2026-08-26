'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, getDefaultRedirectForUser } from '@/hooks/useAuth';

export default function OrganizationsRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isInitializing } = useAuthStore();

  useEffect(() => {
    if (!isInitializing) {
      if (isAuthenticated && user) {
        const roles = user.roles || [];
        if (roles.includes('ADMIN')) {
          router.replace('/admin/approvals');
        } else if (roles.includes('ORG_USER')) {
          router.replace('/industry');
        } else {
          router.replace(getDefaultRedirectForUser(user));
        }
      } else {
        router.replace('/login');
      }
    }
  }, [isInitializing, isAuthenticated, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-3 text-xs font-semibold text-slate-600">Redirecting to Organization Management Portal...</p>
      </div>
    </div>
  );
}
