import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function IndustryLoading() {
  return (
    <div className="space-y-6">
      {/* Client Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-60 bg-slate-200" />
          <Skeleton className="h-4 w-96 mt-2 bg-slate-200" />
        </div>
        <Skeleton className="h-10 w-48 bg-slate-200 rounded-lg" />
      </div>

      {/* Portfolio Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-200 bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <Skeleton className="h-5 w-40 bg-slate-200" />
              <Skeleton className="h-5 w-20 rounded-full bg-slate-200" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-3 w-full bg-slate-200" />
              <Skeleton className="h-2 w-full bg-slate-200 rounded-full" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-24 bg-slate-200" />
                <Skeleton className="h-4 w-24 bg-slate-200" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
