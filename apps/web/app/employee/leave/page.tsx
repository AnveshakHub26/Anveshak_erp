'use client';

import React from 'react';
import { MyLeaveTab } from '@/components/employee/my-leave-tab';

export default function EmployeeLeavePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Employee Leave Self-Service</h1>
        <p className="text-xs text-[#64748B]">
          Check leave entitlement balances, apply for leave, and view request status
        </p>
      </div>

      <MyLeaveTab />
    </div>
  );
}
