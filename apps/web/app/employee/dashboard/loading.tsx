import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function EmployeeDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Profile Banner Skeleton */}
      <Card className="border-slate-200 bg-white">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-16 w-16 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 bg-slate-200" />
              <Skeleton className="h-4 w-36 bg-slate-200" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid Tabs Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-slate-200 bg-white">
            <CardHeader>
              <Skeleton className="h-5 w-32 bg-slate-200" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full bg-slate-200" />
              <Skeleton className="h-4 w-5/6 bg-slate-200" />
              <Skeleton className="h-4 w-4/6 bg-slate-200" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
