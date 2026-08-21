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
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-[#64748B]">
        Loading document metadata...
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4 space-y-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            You do not have administrative authorization to view or download this security-scoped document.
          </p>
          <Link href="/documents">
            <Button variant="outline" className="mt-2 text-xs font-semibold">
              Return to Document Vault
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl py-12 px-4 space-y-6">
        <Alert variant="error">Document record could not be found or has been purged.</Alert>
      </div>
    );
  }

  const isClean = doc.scanStatus === 'CLEAN';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link
        href="/documents"
        className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-[#d49b38] transition-colors"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5 text-[#d49b38]" /> Back to Document Vault
      </Link>

      {/* Document Header Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{doc.type}</h1>
              <p className="text-xs text-slate-500">Entity: {doc.entityType} • Ref: {doc.entityId}</p>
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
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>Virus Scan Passed: File verified clean for authorized download.</span>
          </div>
        ) : (
          <Alert variant="error">
            <ShieldAlert className="h-4 w-4 mr-2" /> Security Warning: Document failed virus scan. Download is restricted.
          </Alert>
        )}
      </div>

      {/* Document Metadata Specifications */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Metadata Specifications
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-500">Storage Key Path:</span>
            <p className="font-mono text-slate-900 mt-1 break-all bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              {doc.storageKey}
            </p>
          </div>
          <div>
            <span className="font-semibold text-slate-500">Visibility Scope:</span>
            <p className="font-semibold text-slate-900 mt-1">{doc.visibility}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-500">Uploaded By:</span>
            <p className="font-semibold text-slate-900 mt-1">{doc.uploader?.email || doc.uploadedBy}</p>
          </div>
          <div>
            <span className="font-semibold text-slate-500">Upload Timestamp:</span>
            <p className="font-semibold text-slate-900 mt-1">
              {new Date(doc.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Version History Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <History className="h-4 w-4 text-[#d49b38]" />
          <h2 className="text-base font-bold text-slate-900">
            Version Audit History
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-700">
                <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Version</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Storage Path</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">SHA-256 Checksum</th>
                <th className="p-3 font-semibold uppercase tracking-wider text-[11px]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(doc.versions || []).map((ver: any) => (
                <tr key={ver.id || ver.version} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-900">v{ver.version}</td>
                  <td className="p-3 font-mono text-slate-600">{ver.storageKey}</td>
                  <td className="p-3 font-mono text-slate-600">{ver.checksum}</td>
                  <td className="p-3 text-slate-500">
                    {new Date(ver.createdAt || doc.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
