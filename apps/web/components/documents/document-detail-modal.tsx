'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Download,
  Eye,
  ShieldCheck,
  ShieldAlert,
  Clock,
  User,
  Building2,
  Folder,
  CheckCircle2,
  ExternalLink,
  FileIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/api-client';

export interface DocumentDetailModalProps {
  document: any | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DocumentDetailModal({ document: doc, isOpen, onClose }: DocumentDetailModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen || !doc) return null;

  const storageKey = doc.storageKey || '';
  const fileName = storageKey.split('/').pop() || doc.name || 'document.pdf';
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await apiRequest<{ success: boolean; data: { url: string } }>(
        `/documents/${doc.id}/download-url`,
      );
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      } else {
        const streamUrl = `/api/v1/documents/file-stream?key=${encodeURIComponent(storageKey)}`;
        window.open(streamUrl, '_blank');
      }
    } catch {
      const streamUrl = `/api/v1/documents/file-stream?key=${encodeURIComponent(storageKey)}`;
      window.open(streamUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  const isPreviewable = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt'].includes(extension);
  const previewUrl = `/api/v1/documents/file-stream?key=${encodeURIComponent(storageKey)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-200">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 line-clamp-1">{fileName}</h3>
              <p className="text-xs text-slate-500 font-mono">
                Type: {doc.type || extension.toUpperCase() || 'DOCUMENT'} • {formatFileSize(doc.fileSize)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Status Badges Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                doc.scanStatus === 'CLEAN'
                  ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                  : doc.scanStatus === 'INFECTED'
                  ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
                  : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              }`}
            >
              {doc.scanStatus === 'CLEAN' ? (
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              )}
              Scan Status: {doc.scanStatus || 'CLEAN'}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              Visibility: {doc.visibility || 'PRIVATE'}
            </span>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200">
              Entity Scope: {doc.entityType || 'Enterprise'}
            </span>
          </div>

          {/* Document Properties Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Entity Scope ID</span>
              <p className="text-xs font-semibold font-mono text-slate-900 mt-0.5 truncate">{doc.entityId || 'N/A'}</p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Folder Location</span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                <Folder className="h-3.5 w-3.5 text-indigo-500" />
                {doc.folder?.name || 'Root Folder'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Uploaded By</span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                <User className="h-3.5 w-3.5 text-slate-500" />
                {doc.uploader?.email || doc.uploadedBy || 'System Administrator'}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upload Date</span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-500" />
                {doc.createdAt ? new Date(doc.createdAt).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div className="sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Cloud Storage Key</span>
              <p className="text-xs font-mono bg-white p-2 rounded border border-slate-200 text-slate-700 break-all mt-0.5">
                {storageKey}
              </p>
            </div>
          </div>

          {/* Inline Preview Toggle */}
          {isPreviewable && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Document Preview</span>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {showPreview ? 'Hide Inline Preview' : 'Show Inline Preview'}
                </button>
              </div>

              {showPreview && (
                <div className="overflow-hidden rounded-xl border border-slate-300 bg-slate-100 h-96">
                  {extension === 'pdf' ? (
                    <iframe src={previewUrl} className="h-full w-full border-none" title={fileName} />
                  ) : ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(extension) ? (
                    <div className="flex h-full items-center justify-center p-4">
                      {/* eslint-disable-next-html-element-suppress */}
                      <img src={previewUrl} alt={fileName} className="max-h-full max-w-full rounded object-contain" />
                    </div>
                  ) : (
                    <iframe src={previewUrl} className="h-full w-full border-none font-mono text-xs p-4 bg-white" title={fileName} />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button variant="outline" onClick={onClose} className="text-xs">
            Close
          </Button>

          <Button
            onClick={handleDownload}
            isLoading={downloading}
            className="bg-[#d49b38] hover:bg-[#b8832a] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Download className="h-4 w-4" />
            Download Document
          </Button>
        </div>
      </div>
    </div>
  );
}
