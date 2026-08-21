'use client';

import React, { useState, useRef, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export interface FileUploadZoneProps {
  entityType: string;
  entityId: string;
  docType?: string;
  allowedTypes?: string[];
  maxSizeBytes?: number;
  onUploadComplete: (doc: {
    id: string;
    storageKey: string;
    filename: string;
    downloadUrl?: string;
  }) => void;
  onUploadError?: (errorMsg: string) => void;
  className?: string;
}

export function FileUploadZone({
  entityType,
  entityId,
  docType = 'GeneralAttachment',
  allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
  ],
  maxSizeBytes = 25 * 1024 * 1024, // 25 MB
  onUploadComplete,
  onUploadError,
  className = '',
}: FileUploadZoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<
    'idle' | 'presigning' | 'uploading' | 'registering' | 'success' | 'error'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredDoc, setRegisteredDoc] = useState<any>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (maxSizeBytes && file.size > maxSizeBytes) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of ${(
        maxSizeBytes /
        (1024 * 1024)
      ).toFixed(0)} MB.`;
    }

    if (allowedTypes && allowedTypes.length > 0) {
      const mime = file.type.toLowerCase();
      const extension = file.name.split('.').pop()?.toLowerCase();

      const isMimeMatch = allowedTypes.some((t) => t.toLowerCase() === mime);
      const isExtMatch = extension && ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'zip'].includes(extension);

      if (!isMimeMatch && !isExtMatch) {
        return `File type '.${extension || 'unknown'}' is not allowed. Please upload a PDF, image, document, or archive.`;
      }
    }

    return null;
  };

  const handleFileSelect = (file: File) => {
    setErrorMsg(null);
    const err = validateFile(file);
    if (err) {
      setErrorMsg(err);
      if (onUploadError) onUploadError(err);
      return;
    }

    setSelectedFile(file);
    setUploadState('idle');
    setProgress(0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const executeUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploadState('presigning');
    setErrorMsg(null);
    setProgress(10);

    try {
      // 1. Get presigned upload URL from backend
      const presignRes = await apiRequest<{
        success: boolean;
        data: { uploadUrl: string; storageKey: string };
      }>('/documents/upload-url', {
        method: 'POST',
        body: JSON.stringify({
          filename: selectedFile.name,
          contentType: selectedFile.type || 'application/octet-stream',
          fileSize: selectedFile.size,
          entityType,
          entityId,
          type: docType,
          visibility: 'PRIVATE',
        }),
      });

      if (!presignRes || !presignRes.data?.uploadUrl) {
        throw new Error('Failed to obtain presigned upload URL from storage service.');
      }

      const { uploadUrl, storageKey } = presignRes.data;
      setUploadState('uploading');
      setProgress(40);

      // 2. Upload binary directly to storage
      const uploadHeaders: Record<string, string> = {};
      if (selectedFile.type) {
        uploadHeaders['Content-Type'] = selectedFile.type;
      }

      let putRes: Response;
      try {
        putRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: uploadHeaders,
          body: selectedFile,
        });
      } catch (err: any) {
        // Safe fallback try POST
        putRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: uploadHeaders,
          body: selectedFile,
        });
      }

      if (!putRes.ok && putRes.status !== 200 && putRes.status !== 204) {
        throw new Error(`Direct storage upload failed with status ${putRes.status}.`);
      }

      setProgress(80);
      setUploadState('registering');

      // 3. Register document metadata
      const registerRes = await apiRequest<{
        success: boolean;
        data: { id: string; storageKey: string; versions: any[] };
      }>('/documents', {
        method: 'POST',
        body: JSON.stringify({
          storageKey,
          entityType,
          entityId,
          type: docType,
          filename: selectedFile.name,
          visibility: 'PRIVATE',
        }),
      });

      if (!registerRes || !registerRes.data) {
        throw new Error('Failed to register document metadata in database.');
      }

      setProgress(100);
      setUploadState('success');
      setRegisteredDoc(registerRes.data);

      onUploadComplete({
        id: registerRes.data.id,
        storageKey: registerRes.data.storageKey,
        filename: selectedFile.name,
      });
    } catch (err: any) {
      const msg = err.message || 'File upload failed. Please try again.';
      setErrorMsg(msg);
      setUploadState('error');
      if (onUploadError) onUploadError(msg);
    }
  }, [selectedFile, entityType, entityId, docType, onUploadComplete, onUploadError]);

  const handleReset = () => {
    setSelectedFile(null);
    setUploadState('idle');
    setProgress(0);
    setErrorMsg(null);
    setRegisteredDoc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`space-y-3 text-xs ${className}`}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Drag and Drop Zone */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-[#d49b38] bg-amber-50/50'
              : 'border-[#E2E8F0] hover:border-[#d49b38] bg-[#F8FAFC]'
          }`}
        >
          <UploadCloud className="h-8 w-8 mx-auto text-[#d49b38] mb-2" />
          <p className="font-bold text-[#0F172A]">
            Click to upload <span className="font-normal text-[#64748B]">or drag and drop file</span>
          </p>
          <p className="text-[11px] text-[#64748B] mt-1">
            Supported formats: PDF, Images, Word, Excel, CSV, ZIP (Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)}MB)
          </p>
        </div>
      )}

      {/* Selected File Card */}
      {selectedFile && (
        <div className="border border-[#E2E8F0] rounded-xl p-4 bg-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 truncate mr-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#151c2e] text-[#d49b38] shrink-0 font-bold">
                <FileText className="h-5 w-5" />
              </div>
              <div className="truncate">
                <strong className="text-[#0F172A] block truncate">{selectedFile.name}</strong>
                <span className="text-[11px] text-[#64748B]">{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {uploadState === 'idle' && (
                <Button variant="primary" size="sm" onClick={executeUpload}>
                  Upload File
                </Button>
              )}
              {uploadState === 'error' && (
                <Button variant="outline" size="sm" onClick={executeUpload}>
                  <RefreshCw className="h-3.5 w-3.5 mr-1" /> Retry
                </Button>
              )}
              <button
                onClick={handleReset}
                disabled={uploadState === 'uploading' || uploadState === 'presigning' || uploadState === 'registering'}
                className="text-[#64748B] hover:text-red-600 p-1 rounded-md transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {(uploadState === 'presigning' || uploadState === 'uploading' || uploadState === 'registering') && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[11px] text-[#64748B]">
                <span className="flex items-center gap-1 font-medium">
                  <Loader2 className="h-3 w-3 animate-spin text-[#d49b38]" />
                  {uploadState === 'presigning' && 'Requesting storage upload URL...'}
                  {uploadState === 'uploading' && 'Uploading binary to storage...'}
                  {uploadState === 'registering' && 'Registering document metadata...'}
                </span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#d49b38] to-[#c48b28] transition-all duration-300 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success Banner */}
          {uploadState === 'success' && (
            <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="font-semibold text-[11px]">
                  Document uploaded and registered successfully.
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleReset} className="h-6 text-[10px] text-emerald-900">
                Upload Another
              </Button>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 text-red-700 rounded-lg border border-red-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <span className="text-[11px]">{errorMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
