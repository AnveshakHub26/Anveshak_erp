'use client';

import React from 'react';
import { HRLeaveManagement } from '@/components/hr/hr-leave-management';

export default function HRLeavePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">HR Leave Approvals &amp; Governance</h1>
        <p className="text-xs text-[#64748B]">
          Review, approve, or reject organization-wide employee leave applications
        </p>
      </div>

      <HRLeaveManagement />
    </div>
  );
}
