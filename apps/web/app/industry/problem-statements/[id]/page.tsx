'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  FileText,
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Download,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Tag,
} from 'lucide-react';

interface ProblemStatementDetail {
  id: string;
  code: string;
  title: string;
  description: string;
  category?: string;
  budgetEstimate?: string;
  expectedTimeline?: string;
  status: string;
  createdAt: string;
  businessVertical: { code: string; name: string };
  organization: { id: string; legalName: string; orgNumber: string; type: string };
  createdBy: { id: string; email: string };
  documents: {
    id: string;
    storageKey: string;
    type: string;
    createdAt: string;
  }[];
}

export default function Ind04ProblemStatementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { hasAnyRole } = usePermissions();

  const [data, setData] = useState<ProblemStatementDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDetail() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiRequest(`/industry/problem-statements/${id}`);
        if (res && res.data) {
          setData(res.data);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load problem statement details.');
      } finally {
        setIsLoading(false);
      }
    }

    if (hasAnyRole(['ORG_USER', 'ADMIN'])) {
      loadDetail();
    } else {
      router.push('/unauthorized');
    }
  }, [id, hasAnyRole, router]);

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

  const statusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
      case 'ACCEPTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#E6F4EA] text-[#137333]">Published</span>;
      case 'SUBMITTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#E8F0FE] text-[#1A73E8]">Submitted</span>;
      case 'UNDER_REVIEW':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#F3E8FD] text-[#9333EA]">Under Review</span>;
      case 'DRAFT':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FEF7E0] text-[#B06000]">Draft</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#FCE8E6] text-[#C5221F]">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[#F1F5F9] text-[#64748B]">{status}</span>;
    }
  };

  if (!hasAnyRole(['ORG_USER', 'ADMIN'])) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/industry/problem-statements" className="rounded-lg border border-[#E2E8F0] p-2 hover:bg-white text-[#64748B]">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-[#d49b38]">{data?.code}</span>
                <span className="text-[#64748B]">•</span>
                <h1 className="text-xl font-bold text-[#0F172A]">{data?.title || 'IND-04 Problem Statement Details'}</h1>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">Submitted by {data?.organization.legalName}</p>
            </div>
          </div>

          {data?.status && statusBadge(data.status)}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        {isLoading ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-12 text-center text-xs text-[#64748B]">
            Loading problem statement details...
          </div>
        ) : !data ? null : (
          <div className="space-y-6">

            {/* Metadata Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-1">
                <span className="text-[#64748B] flex items-center">
                  <Tag className="h-3.5 w-3.5 text-[#d49b38] mr-1.5" />
                  Business Vertical &amp; Category
                </span>
                <p className="font-bold text-[#0F172A]">{data.businessVertical.code} — {data.businessVertical.name}</p>
                <p className="text-[#64748B]">Category: {data.category || 'General'}</p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-1">
                <span className="text-[#64748B] flex items-center">
                  <Clock className="h-3.5 w-3.5 text-[#d49b38] mr-1.5" />
                  Budget &amp; Timeline
                </span>
                <p className="font-bold text-[#0F172A]">Budget: {data.budgetEstimate || 'Unspecified'}</p>
                <p className="text-[#64748B]">Target Timeline: {data.expectedTimeline || 'Unspecified'}</p>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm space-y-1">
                <span className="text-[#64748B] flex items-center">
                  <Calendar className="h-3.5 w-3.5 text-[#d49b38] mr-1.5" />
                  Submission Metadata
                </span>
                <p className="font-bold text-[#0F172A]">
                  {new Date(data.createdAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-[#64748B]">Created By: {data.createdBy.email}</p>
              </div>
            </div>

            {/* Full Technical Description */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-2 flex items-center">
                <FileText className="h-4 w-4 text-[#d49b38] mr-2" />
                Technical Requirement &amp; Problem Description
              </h2>

              <p className="text-xs text-[#0F172A] leading-relaxed whitespace-pre-wrap">
                {data.description}
              </p>
            </div>

            {/* Attached Technical Documents */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-3">
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center">
                <Paperclip className="h-4 w-4 text-[#d49b38] mr-2" />
                Attached Specifications &amp; Supplementary Documents
              </h2>

              {data.documents && data.documents.length > 0 ? (
                <div className="space-y-2">
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
                        className="text-xs"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Download Document
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#64748B]">No technical documents attached to this problem statement.</p>
              )}
            </div>

          </div>
        )}

      </div>
  );
}
