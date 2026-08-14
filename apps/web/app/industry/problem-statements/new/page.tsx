'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateProblemStatementSchema, CreateProblemStatementInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import {
  FileText,
  Upload,
  ArrowLeft,
  Save,
  Send,
  Building2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Paperclip,
} from 'lucide-react';

interface BusinessVertical {
  id: string;
  code: string;
  name: string;
}

export default function Ind05SubmitProblemStatementPage() {
  const router = useRouter();
  const { hasAnyRole } = usePermissions();

  const [businessVerticals, setBusinessVerticals] = useState<BusinessVertical[]>([]);
  const [uploadedStorageKeys, setUploadedStorageKeys] = useState<string[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Fetch Business Verticals master data
  useEffect(() => {
    async function loadBvs() {
      try {
        const res = await apiRequest('/business-verticals');
        if (res && res.data) {
          setBusinessVerticals(res.data);
        }
      } catch {
        // Fallback default business verticals
        setBusinessVerticals([
          { id: 'bv-01', code: 'BV-01', name: 'Research-led Projects' },
          { id: 'bv-02', code: 'BV-02', name: 'Product Commercialization' },
          { id: 'bv-[#03]', code: 'BV-03', name: 'Testing & Validation' },
          { id: 'bv-[#04]', code: 'BV-04', name: 'Consultancy & Advisory' },
          { id: 'bv-[#05]', code: 'BV-05', name: 'Skill Development' },
          { id: 'bv-[#06]', code: 'BV-06', name: 'Incubation & Acceleration' },
        ]);
      }
    }
    if (hasAnyRole(['ORG_USER', 'ADMIN'])) {
      loadBvs();
    } else {
      router.push('/unauthorized');
    }
  }, [hasAnyRole, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateProblemStatementInput>({
    resolver: zodResolver(CreateProblemStatementSchema),
    defaultValues: {
      title: '',
      description: '',
      bvId: '',
      category: 'R&D',
      budgetEstimate: '',
      expectedTimeline: '',
      isDraft: false,
    },
  });

  // Handle Document Upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDoc(true);
    try {
      const presignedRes = await apiRequest('/documents/presigned-upload-url', {
        method: 'POST',
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || 'application/pdf',
        }),
      });

      if (presignedRes && presignedRes.data) {
        const { uploadUrl, storageKey } = presignedRes.data;
        const uploadAttempt = await fetch(uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type || 'application/pdf' },
          body: file,
        });

        if (!uploadAttempt.ok) {
          throw new Error('Failed to upload file to storage bucket.');
        }

        setUploadedStorageKeys((prev) => [...prev, storageKey]);
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading document.');
    } finally {
      setIsUploadingDoc(false);
      e.target.value = '';
    }
  };

  const handleFormSubmit = async (data: CreateProblemStatementInput, isDraftSubmit: boolean) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const payload = {
        title: data.title.trim(),
        description: data.description.trim(),
        bvId: data.bvId,
        category: data.category?.trim() || undefined,
        budgetEstimate: data.budgetEstimate?.trim() || undefined,
        expectedTimeline: data.expectedTimeline?.trim() || undefined,
        documentStorageKeys: uploadedStorageKeys.length > 0 ? uploadedStorageKeys : undefined,
        isDraft: isDraftSubmit,
      };

      const res = await apiRequest('/industry/problem-statements', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res && res.data) {
        router.push(`/industry/problem-statements/${res.data.id}`);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit problem statement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!hasAnyRole(['ORG_USER', 'ADMIN'])) {
    return null;
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center space-x-3">
          <Link href="/industry/problem-statements" className="rounded-lg border border-[#E2E8F0] p-2 hover:bg-white text-[#64748B]">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-[#0F172A]">IND-05 Submit Technical Problem Statement</h1>
            <p className="text-xs text-[#64748B]">Define your technical requirement, budget, timeline, and specifications</p>
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm space-y-6">

          <form className="space-y-5" noValidate>

            {/* Title */}
            <FormField label="Problem Statement Title" required htmlFor="title" error={errors.title?.message}>
              <Input
                id="title"
                placeholder="e.g. High-Efficiency Thermal Dissipation Coating for Micro-Power Modules"
                error={errors.title?.message}
                {...register('title')}
              />
            </FormField>

            {/* Business Vertical & Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Business Vertical Alignment" required htmlFor="bvId" error={errors.bvId?.message}>
                <select
                  id="bvId"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  {...register('bvId')}
                >
                  <option value="">Select Primary Business Vertical...</option>
                  {businessVerticals.map((bv) => (
                    <option key={bv.id} value={bv.id}>
                      {bv.code} — {bv.name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Category / Engagement Type" htmlFor="category">
                <select
                  id="category"
                  className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                  {...register('category')}
                >
                  <option value="R&D">Research &amp; Development (R&amp;D)</option>
                  <option value="Testing & Validation">Testing &amp; Validation</option>
                  <option value="Product Commercialization">Product Commercialization</option>
                  <option value="Consultancy & Advisory">Consultancy &amp; Advisory</option>
                  <option value="Upskilling & Training">Upskilling &amp; Training</option>
                </select>
              </FormField>
            </div>

            {/* Detailed Description */}
            <FormField label="Detailed Problem Statement & Requirements" required htmlFor="description" error={errors.description?.message}>
              <textarea
                id="description"
                rows={6}
                placeholder="Provide comprehensive details of the technical problem, desired performance metrics, constraints, and research context..."
                className="w-full rounded-lg border border-[#E2E8F0] p-3 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
                {...register('description')}
              />
            </FormField>

            {/* Budget & Timeline Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Estimated Budget Range (Optional)" htmlFor="budgetEstimate">
                <Input
                  id="budgetEstimate"
                  placeholder="e.g. ₹5,00,000 - ₹10,00,000"
                  {...register('budgetEstimate')}
                />
              </FormField>

              <FormField label="Expected Timeline / Target Duration" htmlFor="expectedTimeline">
                <Input
                  id="expectedTimeline"
                  placeholder="e.g. 6 Months / Q3 2026"
                  {...register('expectedTimeline')}
                />
              </FormField>
            </div>

            {/* Document Uploader */}
            <div className="space-y-2 border-t border-[#E2E8F0] pt-4">
              <label className="block text-xs font-semibold text-[#0F172A]">
                Attach Technical Specifications / Supplementary Files
              </label>

              <div className="flex items-center space-x-3">
                <label className="flex items-center justify-center rounded-lg border border-dashed border-[#CBD5E1] bg-[#F8FAFC] px-4 py-2 text-xs font-semibold text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A] cursor-pointer transition-colors">
                  <Upload className="h-4 w-4 mr-2 text-[#d49b38]" />
                  {isUploadingDoc ? 'Uploading...' : 'Choose File to Attach'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploadingDoc}
                    onChange={handleFileUpload}
                  />
                </label>
                <span className="text-[11px] text-[#64748B]">PDF, DOCX, CAD (Max 15MB)</span>
              </div>

              {uploadedStorageKeys.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {uploadedStorageKeys.map((key, idx) => (
                    <div key={idx} className="flex items-center space-x-2 text-xs text-[#0F172A] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                      <Paperclip className="h-3.5 w-3.5 text-[#d49b38]" />
                      <span className="font-mono text-[11px] truncate">{key}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submission Actions */}
            <div className="border-t border-[#E2E8F0] pt-5 flex items-center justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                onClick={handleSubmit((data) => handleFormSubmit(data, true))}
                className="text-xs font-semibold border-[#64748B]"
              >
                <Save className="h-3.5 w-3.5 mr-1.5" />
                Save as Draft
              </Button>

              <Button
                type="button"
                variant="primary"
                isLoading={isSubmitting}
                disabled={isSubmitting}
                onClick={handleSubmit((data) => handleFormSubmit(data, false))}
                className="text-xs font-bold bg-[#10B981] hover:bg-[#059669]"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Submit Problem Statement
              </Button>
            </div>

          </form>

        </div>

      </div>
    </AppShell>
  );
}
