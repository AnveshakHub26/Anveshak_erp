'use client';

import React from 'react';
import { MyAttendanceTab } from '@/components/employee/my-attendance-tab';

export default function EmployeeAttendancePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Employee Attendance Self-Service</h1>
        <p className="text-xs text-[#64748B]">
          Clock in/out, log break intervals, and view your complete attendance record
        </p>
      </div>

      <MyAttendanceTab />
    </div>
  );
}
