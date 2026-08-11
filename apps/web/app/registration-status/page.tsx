'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
import { useSearchParams } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { CheckCircle, ArrowLeft, Clock, ShieldCheck, AlertCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { StatusBadge } from '@/components/ui/status-badge';
import { PublicShell } from '@/components/layout/public-shell';

interface RegistrationStatusData {
  orgNumber: string;
  legalName: string;
  status: string;
  createdAt: string;
}

function StatusContent() {
  const searchParams = useSearchParams();
  const orgNumberParam = searchParams.get('orgNumber') || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<RegistrationStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatus() {
      if (!orgNumberParam) {
        setLoading(false);
        setError('No registration reference was provided in the request.');
        return;
      }

      try {
        const res = await apiRequest(`/organizations/registration-status/${encodeURIComponent(orgNumberParam)}`);
        if (res && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        if (err.status === 404) {
          setError(`Registration reference '${orgNumberParam}' was not found.`);
        } else {
          setError(err.message || 'Failed to retrieve registration status from server.');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStatus();
  }, [orgNumberParam]);

  if (loading) {
    return (
      <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm">
        <div className="text-sm text-[#64748B]">Verifying registration status with server...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF2F2] text-[#B42318] border border-[#FECACA]">
            <AlertCircle className="h-8 w-8" />
          </div>
        </div>
        <h1 className="text-center text-xl font-bold text-[#0F172A]">
          Registration Reference Not Found
        </h1>
        <Alert variant="error" className="my-6">
          {error || 'Unable to load registration details.'}
        </Alert>
        <div className="flex flex-col space-y-3">
          <Link href="/register" className="w-full">
            <Button variant="primary" className="w-full bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
              Register Organization
            </Button>
          </Link>
          <Link href="/" className="w-full">
            <Button variant="outline" className="w-full border-[#E2E8F0] text-[#0F172A]">
              <ArrowLeft className="mr-2 h-4 w-4 text-[#d49b38]" /> Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(data.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-lg rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
      {/* Icon based on status */}
      <div className="mb-6 flex justify-center">
        {data.status === 'APPROVED' || data.status === 'ACTIVE' ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF5F0] text-[#2F6F52]">
            <CheckCircle className="h-10 w-10" />
          </div>
        ) : data.status === 'REJECTED' ? (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FECDCA] text-[#B42318]">
            <XCircle className="h-10 w-10" />
          </div>
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FEF0C7] text-[#A56A00]">
            <Clock className="h-10 w-10" />
          </div>
        )}
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="mb-2">
          <StatusBadge status={data.status} />
        </div>
        <h1 className="text-page-title font-semibold text-[#17324D]">
          {data.legalName}
        </h1>
        <p className="mt-1 text-label text-[#5B6673]">
          Reference ID: <strong className="font-semibold text-[#17202A]">{data.orgNumber}</strong>
        </p>
      </div>

      {/* Details Box */}
      <div className="my-6 rounded border border-[#D7DEE6] bg-[#F7F8FA] p-4 text-label space-y-3">
        <div className="flex justify-between border-b border-[#D7DEE6] pb-2 text-xs">
          <span className="text-[#5B6673]">Submitted Date</span>
          <span className="font-medium text-[#17202A]">{formattedDate}</span>
        </div>

        {data.status === 'SUBMITTED' && (
          <div className="flex items-start space-x-3 pt-1">
            <Clock className="h-5 w-5 shrink-0 text-[#A56A00]" />
            <div>
              <h5 className="font-semibold text-[#17202A]">Status: SUBMITTED</h5>
              <p className="text-[#5B6673]">
                Your organization registration request is in queue. Platform administrators will review your corporate credentials.
              </p>
            </div>
          </div>
        )}

        {data.status === 'UNDER_REVIEW' && (
          <div className="flex items-start space-x-3 pt-1">
            <Clock className="h-5 w-5 shrink-0 text-[#1F4E79]" />
            <div>
              <h5 className="font-semibold text-[#17202A]">Status: UNDER REVIEW</h5>
              <p className="text-[#5B6673]">
                Administrative verification is currently in progress for your primary contact and organization details.
              </p>
            </div>
          </div>
        )}

        {(data.status === 'APPROVED' || data.status === 'ACTIVE') && (
          <div className="flex items-start space-x-3 pt-1">
            <ShieldCheck className="h-5 w-5 shrink-0 text-[#2F6F52]" />
            <div>
              <h5 className="font-semibold text-[#2F6F52]">Status: APPROVED</h5>
              <p className="text-[#5B6673]">
                Your organization registration has been approved. You may sign in with your primary contact credentials.
              </p>
            </div>
          </div>
        )}

        {data.status === 'REJECTED' && (
          <div className="flex items-start space-x-3 pt-1">
            <AlertCircle className="h-5 w-5 shrink-0 text-[#B42318]" />
            <div>
              <h5 className="font-semibold text-[#B42318]">Status: REJECTED</h5>
              <p className="text-[#5B6673]">
                Your registration application was not approved. Please contact system support for further guidance.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3">
        <Link href="/login" className="w-full">
          <Button variant="primary" className="w-full">
            Proceed to Login Portal
          </Button>
        </Link>
        <Link href="/" className="w-full">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" /> Return to Home
          </Button>
        </Link>
      </div>

      {/* Footer */}
      <div className="mt-6 border-t border-[#D7DEE6] pt-4 text-center text-xs text-[#5B6673]">
        AnveshakHub v3.0 Master • Real-Time Registration Tracking
      </div>
    </div>
  );
}

export default function RegistrationStatusPage() {
  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-[#F8FAFC] px-4 py-8">
        <Suspense fallback={<div className="text-center text-xs text-[#64748B]">Loading registration status...</div>}>
          <StatusContent />
        </Suspense>
      </div>
    </PublicShell>
  );
}
