'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { FileText, Download, ShieldCheck, ShieldAlert, ArrowLeft, History, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function Fnd10DocumentViewerPage() {
  const params = useParams();
  const docId = params?.id as string;

  const [doc, setDoc] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    async function loadDocument() {
      if (!docId) return;
      setLoading(true);
      setServerError(null);
      setIsUnauthorized(false);

      try {
        const res = await apiRequest(`/documents/${docId}`);
        if (res && res.data) {
          setDoc(res.data);
        }
      } catch (err: any) {
        if (err.status === 403 || err.message?.includes('Access denied')) {
          setIsUnauthorized(true);
        } else {
          setServerError(err.message || 'Failed to load document metadata.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadDocument();
  }, [docId]);

  const handleDownload = async () => {
    setDownloading(true);
    setServerError(null);

    try {
      const res = await apiRequest(`/documents/${docId}/download-url`);
      if (res && res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to generate signed download URL.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6 text-sm text-[#64748B]">
        Loading document metadata...
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-[#151c2e] px-4 py-16 text-[#f8fafc] flex items-center justify-center relative overflow-hidden">
        <div className="pointer-events-none absolute -top-40 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-[#d49b38]/10 blur-3xl"></div>

        <div className="relative mx-auto max-w-md rounded-2xl border border-[#d49b38]/25 bg-[#182238]/90 p-8 text-center shadow-2xl backdrop-blur-md space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#d49b38]/10 text-[#d49b38] border border-[#d49b38]/30">
            <Lock className="h-7 w-7 text-[#d49b38]" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            403 Forbidden Access
          </h1>
          <p className="text-xs text-[#94a3b8]">
            You are not authorized to view or download this private document.
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            <Link href="/search">
              <Button variant="outline" size="sm" className="border-[#d49b38]/40 bg-[#151c2e] text-white hover:bg-[#182238]">
                Return to Search
              </Button>
            </Link>
            <Link href="/">
              <Button variant="primary" size="sm" className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (serverError || !doc) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-16 text-[#0F172A] flex items-center justify-center">
        <div className="mx-auto max-w-md rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#FDF2F2] text-[#B42318] border border-[#FECACA]">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-[#0F172A]">
            Document Unavailable
          </h1>
          <p className="text-xs text-[#64748B]">
            {serverError || 'The requested document reference does not exist or was deleted.'}
          </p>
          <div className="pt-2 flex justify-center">
            <Link href="/search">
              <Button variant="outline" size="sm" className="border-[#E2E8F0] text-[#0F172A]">
                Back to Search
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isClean = doc.scanStatus === 'CLEAN';

  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#0F172A]">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/search"
          className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#d49b38] transition-colors"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5 text-[#d49b38]" /> Back to Global Search
        </Link>

        {/* Document Header Card */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 border-b border-[#E2E8F0] pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0F172A]">{doc.type}</h1>
                <p className="text-xs text-[#64748B]">Entity: {doc.entityType} • Ref: {doc.entityId}</p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleDownload}
              isLoading={downloading}
              disabled={downloading || !isClean}
              className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold"
            >
              <Download className="mr-2 h-4 w-4" /> Download Document
            </Button>
          </div>

          {/* Security Banner */}
          {isClean ? (
            <div className="flex items-center space-x-2 text-xs font-semibold text-[#2F6F52] bg-[#EBF5F0] p-3 rounded-lg border border-[#A3D9C0]">
              <ShieldCheck className="h-4 w-4 shrink-0 text-[#2F6F52]" />
              <span>Virus Scan Passed: File verified clean for authorized download.</span>
            </div>
          ) : (
            <Alert variant="error">
              <ShieldAlert className="h-4 w-4 mr-2" /> Security Warning: Document failed virus scan. Download is restricted.
            </Alert>
          )}
        </div>

        {/* Document Metadata Specifications */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#0F172A] border-b border-[#E2E8F0] pb-3">
            Metadata Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-[#64748B]">Storage Key Path:</span>
              <p className="font-mono text-[#0F172A] mt-0.5 break-all bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                {doc.storageKey}
              </p>
            </div>
            <div>
              <span className="font-semibold text-[#64748B]">Visibility Scope:</span>
              <p className="font-semibold text-[#0F172A] mt-0.5">{doc.visibility}</p>
            </div>
            <div>
              <span className="font-semibold text-[#64748B]">Uploaded By:</span>
              <p className="font-semibold text-[#0F172A] mt-0.5">{doc.uploader?.email || doc.uploadedBy}</p>
            </div>
            <div>
              <span className="font-semibold text-[#64748B]">Upload Timestamp:</span>
              <p className="font-semibold text-[#0F172A] mt-0.5">
                {new Date(doc.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Version History Table */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#E2E8F0] pb-3">
            <History className="h-4 w-4 text-[#d49b38]" />
            <h2 className="text-lg font-bold text-[#0F172A]">
              Version Audit History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B]">
                  <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Version</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Storage Path</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">SHA-256 Checksum</th>
                  <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {(doc.versions || []).map((ver: any) => (
                  <tr key={ver.id || ver.version} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="p-3 font-bold text-[#0F172A]">v{ver.version}</td>
                    <td className="p-3 font-mono text-[#64748B]">{ver.storageKey}</td>
                    <td className="p-3 font-mono text-[#64748B]">{ver.checksum}</td>
                    <td className="p-3 text-[#64748B]">
                      {new Date(ver.createdAt || doc.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
