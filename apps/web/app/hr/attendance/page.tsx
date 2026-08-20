'use client';

import React from 'react';
import { HRAttendanceManagement } from '@/components/hr/hr-attendance-management';

export default function HRAttendancePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">HR Attendance Audit &amp; Governance</h1>
        <p className="text-xs text-[#64748B]">
          Organization-wide workforce clock logs, break interval analysis, and worked duration tracking
        </p>
      </div>

      <HRAttendanceManagement />
    </div>
  );
}
