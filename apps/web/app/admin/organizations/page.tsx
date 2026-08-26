'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminOrganizationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/approvals');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="mt-3 text-xs font-semibold text-slate-600">Opening Admin Organization Control Center...</p>
      </div>
    </div>
  );
}
