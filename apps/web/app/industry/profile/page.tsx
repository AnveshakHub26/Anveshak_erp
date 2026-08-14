'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  Building2,
  Globe,
  MapPin,
  Mail,
  User,
  FileText,
  Download,
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';

interface ProfileData {
  organization: {
    id: string;
    orgNumber: string;
    legalName: string;
    tradeName?: string;
    type: string;
    applicantType: string;
    website?: string;
    address?: string;
    status: string;
    primaryBv?: { code: string; name: string };
    organizationBvs?: { businessVertical: { code: string; name: string }; isPrimary: boolean }[];
  };
  primaryContact: {
    id: string;
    email: string;
    status: string;
  };
  documents: {
    id: string;
    storageKey: string;
    type: string;
    createdAt: string;
  }[];
}

export default function Ind02IndustryProfilePage() {
  const router = useRouter();
  const { hasAnyRole } = usePermissions();

  const [data, setData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest('/industry/profile');
      if (res && res.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load Industry Organization profile.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasAnyRole(['ORG_USER', 'ADMIN'])) {
      loadProfile();
    } else {
      router.push('/unauthorized');
    }
  }, [hasAnyRole, router]);

  const handleDownloadDocument = async (docId: string) => {
    try {
      const res = await apiRequest(`/documents/${docId}/download-url`);
      if (res && res.data) {
        window.open(res.data, '_blank');
      }
    } catch {
      alert('Could not generate presigned download URL for document.');
    }
  };

  if (!hasAnyRole(['ORG_USER', 'ADMIN'])) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/industry" className="rounded-lg border border-[#E2E8F0] p-2 hover:bg-white text-[#64748B]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-[#0F172A]">IND-02 Industry Organization Profile</h1>
              <p className="text-xs text-[#64748B]">Verified corporate classification &amp; governance record</p>
            </div>
          </div>

          {data?.organization?.status && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#137333] flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
              Verified &amp; {data.organization.status}
            </span>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {isLoading ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center text-xs text-[#64748B]">
            Loading organization profile...
          </div>
        ) : !data ? null : (
          <div className="space-y-6">

            {/* Profile Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Card 1: Corporate Legal Information */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center">
                  <Building2 className="h-4 w-4 text-[#d49b38] mr-2" />
                  Corporate Identification
                </h2>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[#64748B]">Legal Organization Name:</span>
                    <p className="font-bold text-[#0F172A] text-sm">{data.organization.legalName}</p>
                  </div>
                  {data.organization.tradeName && (
                    <div>
                      <span className="text-[#64748B]">Trade Name (DBA):</span>
                      <p className="font-semibold text-[#0F172A]">{data.organization.tradeName}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#64748B]">Reference Number:</span>
                      <p className="font-mono font-semibold text-[#d49b38]">{data.organization.orgNumber}</p>
                    </div>
                    <div>
                      <span className="text-[#64748B]">Classification:</span>
                      <p className="font-semibold text-[#0F172A]">{data.organization.applicantType}</p>
                    </div>
                  </div>
                  <div>
                    <span className="text-[#64748B]">Organization Type:</span>
                    <p className="font-semibold text-[#0F172A]">{data.organization.type}</p>
                  </div>
                  {data.organization.website && (
                    <div>
                      <span className="text-[#64748B]">Official Website:</span>
                      <p className="font-medium text-[#d49b38] flex items-center mt-0.5">
                        <Globe className="h-3.5 w-3.5 mr-1" />
                        <a href={data.organization.website} target="_blank" rel="noreferrer" className="underline">
                          {data.organization.website}
                        </a>
                      </p>
                    </div>
                  )}
                  {data.organization.address && (
                    <div>
                      <span className="text-[#64748B]">Registered Address:</span>
                      <p className="font-medium text-[#0F172A] mt-0.5 flex items-start">
                        <MapPin className="h-3.5 w-3.5 text-[#64748B] mr-1 shrink-0 mt-0.5" />
                        {data.organization.address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Contact & Business Vertical Engagements */}
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
                <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center">
                  <User className="h-4 w-4 text-[#d49b38] mr-2" />
                  Primary Personnel &amp; Service Offerings
                </h2>

                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[#64748B]">Authorized Contact Email:</span>
                    <p className="font-semibold text-[#0F172A] flex items-center mt-0.5">
                      <Mail className="h-3.5 w-3.5 text-[#64748B] mr-1" />
                      {data.primaryContact.email}
                    </p>
                  </div>

                  <div>
                    <span className="text-[#64748B]">Primary Business Vertical Offering:</span>
                    <p className="font-bold text-[#0F172A] text-sm mt-0.5">
                      {data.organization.primaryBv ? `${data.organization.primaryBv.code} — ${data.organization.primaryBv.name}` : 'N/A'}
                    </p>
                  </div>

                  {data.organization.organizationBvs && data.organization.organizationBvs.length > 0 && (
                    <div>
                      <span className="text-[#64748B]">All Bound Business Verticals:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {data.organization.organizationBvs.map((bv) => (
                          <span
                            key={bv.businessVertical.code}
                            className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                              bv.isPrimary
                                ? 'bg-[#151c2e] text-white border-[#151c2e]'
                                : 'bg-[#F8FAFC] text-[#0F172A] border-[#E2E8F0]'
                            }`}
                          >
                            {bv.businessVertical.code} {bv.isPrimary ? '(Primary)' : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Compliance & Registration Documents Section */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center">
                <FileText className="h-4 w-4 text-[#d49b38] mr-2" />
                Uploaded Compliance &amp; Verification Documents
              </h2>

              {data.documents && data.documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <FileText className="h-4 w-4 text-[#d49b38] shrink-0" />
                        <span className="font-medium text-[#0F172A] truncate">{doc.storageKey}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadDocument(doc.id)}
                        className="text-xs shrink-0 ml-2"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">No registration compliance documents uploaded.</p>
              )}
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}
