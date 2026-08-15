import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function HRLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-56 bg-slate-200" />
          <Skeleton className="h-4 w-80 mt-2 bg-slate-200" />
        </div>
        <Skeleton className="h-10 w-44 bg-slate-200 rounded-lg" />
      </div>

      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-28 bg-slate-200" />
              <Skeleton className="h-5 w-5 rounded-full bg-slate-200" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-7 w-14 bg-slate-200" />
              <Skeleton className="h-3 w-36 mt-2 bg-slate-200" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table Directory Skeleton */}
      <Card className="border-slate-200 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-5 w-40 bg-slate-200" />
          <Skeleton className="h-9 w-64 bg-slate-200 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 bg-slate-200" />
                  <Skeleton className="h-3 w-32 bg-slate-200" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full bg-slate-200" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
