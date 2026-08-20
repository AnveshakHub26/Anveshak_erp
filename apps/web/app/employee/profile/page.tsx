'use client';

import React from 'react';
import { MyProfileTab } from '@/components/employee/my-profile-tab';

export default function EmployeeProfilePage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#E2E8F0] pb-4">
        <h1 className="text-xl font-bold text-[#0F172A]">Employee Self-Service Profile</h1>
        <p className="text-xs text-[#64748B]">
          Canonical workforce identity, position assignment, contact details, and employment history
        </p>
      </div>

      <MyProfileTab />
    </div>
  );
}
