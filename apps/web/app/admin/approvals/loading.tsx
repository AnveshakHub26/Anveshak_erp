import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminApprovalsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-52 bg-slate-200" />
        <Skeleton className="h-4 w-80 mt-2 bg-slate-200" />
      </div>

      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <Skeleton className="h-5 w-48 bg-slate-200" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
              <div className="space-y-2">
                <Skeleton className="h-4 w-60 bg-slate-200" />
                <Skeleton className="h-3 w-40 bg-slate-200" />
              </div>
              <div className="flex items-center space-x-2">
                <Skeleton className="h-8 w-20 bg-slate-200 rounded-lg" />
                <Skeleton className="h-8 w-20 bg-slate-200 rounded-lg" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
