'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/hooks/useAuth';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes cache
            refetchOnWindowFocus: false, // Prevent window focus refetch storms
            refetchOnMount: false, // Prevent mounting refetch storms
            refetchOnReconnect: false, // Prevent network reconnect refetch storms
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    useAuthStore.getState().initializeSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
