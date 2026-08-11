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
      <div className="flex min-h-screen items-center justify-center bg-[#F7F8FA] p-6 text-label text-[#5B6673]">
        Loading document metadata...
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] px-4 py-16 text-[#17202A]">
        <div className="mx-auto max-w-md rounded border border-[#D7DEE6] bg-white p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F8FA] text-[#1F4E79]">
            <Lock className="h-6 w-6" />
          </div>
          <h1 className="text-section-title font-semibold text-[#17324D]">
            403 Forbidden Access
          </h1>
          <p className="text-label text-[#5B6673]">
            You are not authorized to view or download this private document.
          </p>
          <div className="pt-2 flex justify-center space-x-3">
            <Link href="/search">
              <Button variant="outline" size="sm">
                Return to Search
              </Button>
            </Link>
            <Link href="/">
              <Button variant="primary" size="sm">
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
      <div className="min-h-screen bg-[#F7F8FA] px-4 py-16 text-[#17202A]">
        <div className="mx-auto max-w-md rounded border border-[#D7DEE6] bg-white p-8 text-center shadow-sm space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#F7F8FA] text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="text-section-title font-semibold text-[#17324D]">
            Document Unavailable
          </h1>
          <p className="text-label text-[#5B6673]">
            {serverError || 'The requested document reference does not exist or was deleted.'}
          </p>
          <div className="pt-2 flex justify-center">
            <Link href="/search">
              <Button variant="outline" size="sm">
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
    <div className="min-h-screen bg-[#F7F8FA] px-4 py-8 text-[#17202A]">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/search"
          className="inline-flex items-center text-xs font-medium text-[#1F4E79] hover:underline"
        >
          <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Global Search
        </Link>

        {/* Document Header Card */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 border-b border-[#D7DEE6] pb-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded border border-[#D7DEE6] bg-[#F7F8FA] text-[#1F4E79]">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-page-title font-semibold text-[#17324D]">{doc.type}</h1>
                <p className="text-xs text-[#5B6673]">Entity: {doc.entityType} • Ref: {doc.entityId}</p>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleDownload}
              isLoading={downloading}
              disabled={downloading || !isClean}
            >
              <Download className="mr-2 h-4 w-4" /> Download Document
            </Button>
          </div>

          {/* Security Banner */}
          {isClean ? (
            <div className="flex items-center space-x-2 text-xs font-medium text-[#2F6F52] bg-[#F7F8FA] p-3 rounded border border-[#D7DEE6]">
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
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-section-title font-semibold text-[#17324D] border-b border-[#D7DEE6] pb-3">
            Metadata Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-[#5B6673]">Storage Key Path:</span>
              <p className="font-mono text-[#17202A] mt-0.5 break-all bg-[#F7F8FA] p-2 rounded border border-[#D7DEE6]">
                {doc.storageKey}
              </p>
            </div>
            <div>
              <span className="font-semibold text-[#5B6673]">Visibility Scope:</span>
              <p className="font-medium text-[#17202A] mt-0.5">{doc.visibility}</p>
            </div>
            <div>
              <span className="font-semibold text-[#5B6673]">Uploaded By:</span>
              <p className="font-medium text-[#17202A] mt-0.5">{doc.uploader?.email || doc.uploadedBy}</p>
            </div>
            <div>
              <span className="font-semibold text-[#5B6673]">Upload Timestamp:</span>
              <p className="font-medium text-[#17202A] mt-0.5">
                {new Date(doc.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Version History Table */}
        <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-[#D7DEE6] pb-3">
            <History className="h-4 w-4 text-[#1F4E79]" />
            <h2 className="text-section-title font-semibold text-[#17324D]">
              Version Audit History
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#D7DEE6] bg-[#F7F8FA] text-[#5B6673]">
                  <th className="p-2 font-semibold">Version</th>
                  <th className="p-2 font-semibold">Storage Path</th>
                  <th className="p-2 font-semibold">SHA-256 Checksum</th>
                  <th className="p-2 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {(doc.versions || []).map((ver: any) => (
                  <tr key={ver.id || ver.version} className="border-b border-[#D7DEE6]">
                    <td className="p-2 font-bold text-[#17324D]">v{ver.version}</td>
                    <td className="p-2 font-mono text-[#5B6673]">{ver.storageKey}</td>
                    <td className="p-2 font-mono text-[#5B6673]">{ver.checksum}</td>
                    <td className="p-2 text-[#5B6673]">
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
