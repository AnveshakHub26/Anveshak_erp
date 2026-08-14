'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterOrganizationSchema, RegisterOrganizationInput } from '@anveshak/validation';
import { apiRequest } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { Alert } from '@/components/ui/alert';
import { FormField } from '@/components/ui/form-field';
import { FormSection } from '@/components/ui/form-section';
import { PublicShell } from '@/components/layout/public-shell';
import {
  Building2,
  Factory,
  User,
  Lock,
  Mail,
  Phone,
  Globe,
  MapPin,
  Eye,
  EyeOff,
  ShieldCheck,
  UploadCloud,
  FileText,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function Fnd03RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bvs, setBvs] = useState<{ id: string; code: string; name: string }[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<{ key: string; name: string; size: number }[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch Business Verticals master data on mount
  useEffect(() => {
    async function loadBvs() {
      try {
        const res = await apiRequest('/business-verticals');
        if (res && res.data) {
          setBvs(res.data);
        }
      } catch {
        setBvs([
          { id: 'bv-01-uuid', code: 'BV-01', name: 'Research-led Projects' },
          { id: 'bv-02-uuid', code: 'BV-02', name: 'IP and Knowledge Management' },
          { id: 'bv-03-uuid', code: 'BV-03', name: 'Startup Ecosystem' },
          { id: 'bv-04-uuid', code: 'BV-04', name: 'Consulting' },
          { id: 'bv-05-uuid', code: 'BV-05', name: 'Design and Development' },
          { id: 'bv-06-uuid', code: 'BV-06', name: 'Upskilling and Workshops' },
        ]);
      }
    }
    loadBvs();
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterOrganizationInput>({
    resolver: zodResolver(RegisterOrganizationSchema),
    defaultValues: {
      applicantType: 'Company',
      legalName: '',
      tradeName: '',
      type: 'Enterprise',
      website: '',
      address: '',
      primaryContactName: '',
      designation: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      primaryBvCode: '',
      additionalBvCodes: [],
      documentStorageKeys: [],
      termsConsent: false,
    },
  });

  const applicantType = watch('applicantType');
  const selectedPrimaryBvCode = watch('primaryBvCode');
  const selectedAdditionalBvCodes = watch('additionalBvCodes') || [];
  const termsConsent = watch('termsConsent');

  const bvComboboxOptions = bvs.map((bv) => ({
    value: bv.id,
    label: `${bv.code} — ${bv.name}`,
  }));

  const orgTypeOptions = [
    { label: 'Enterprise / Corporate', value: 'Enterprise' },
    { label: 'Academic / Research Institution', value: 'Institution' },
    { label: 'Startup / Incubatee', value: 'Startup' },
    { label: 'Government Agency', value: 'Government' },
    { label: 'NGO / Non-Profit', value: 'NGO' },
  ];

  // Handle mock file upload into Storage key tracking
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setTimeout(() => {
      const newUploads = Array.from(files).map((file) => ({
        key: `registration-docs/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
        name: file.name,
        size: file.size,
      }));

      const updated = [...uploadedFiles, ...newUploads];
      setUploadedFiles(updated);
      setValue('documentStorageKeys', updated.map((u) => u.key));
      setIsUploading(false);
    }, 600);
  };

  const removeUploadedFile = (key: string) => {
    const updated = uploadedFiles.filter((f) => f.key !== key);
    setUploadedFiles(updated);
    setValue('documentStorageKeys', updated.map((u) => u.key));
  };

  const toggleAdditionalBv = (bvId: string) => {
    const current = selectedAdditionalBvCodes;
    const exists = current.includes(bvId);
    const updated = exists ? current.filter((id) => id !== bvId) : [...current, bvId];
    setValue('additionalBvCodes', updated);
  };

  const onSubmit = async (data: RegisterOrganizationInput) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const response = await apiRequest('/organizations/registration', {
        method: 'POST',
        body: JSON.stringify({
          applicantType: data.applicantType,
          legalName: data.legalName.trim(),
          tradeName: data.tradeName?.trim() || undefined,
          type: data.type,
          website: data.website?.trim() || undefined,
          address: data.address?.trim() || undefined,
          primaryContactName: data.primaryContactName.trim(),
          designation: data.designation?.trim() || undefined,
          email: data.email.trim(),
          phone: data.phone.trim(),
          password: data.password,
          primaryBvId: data.primaryBvCode,
          additionalBvIds: data.additionalBvCodes,
          documentStorageKeys: data.documentStorageKeys,
        }),
      });

      if (response && response.data) {
        router.push(`/registration-status?orgNumber=${encodeURIComponent(response.data.orgNumber)}`);
      }
    } catch (err: any) {
      if (err.status === 409) {
        setServerError(err.message || 'An organization or account with these credentials already exists.');
      } else {
        setServerError(err.message || 'An unexpected error occurred during organization registration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicShell>
      <div className="bg-[#F8FAFC] px-4 py-10 text-[#0F172A]">
        <div className="mx-auto max-w-3xl">

          {/* Header Banner */}
          <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-xl shadow-sm">
                AH
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                  Company / Industry Onboarding
                </h1>
                <p className="mt-0.5 text-xs text-[#64748B]">
                  PDS v4.0 FND-03 Canonical Enterprise & Industry Registration Portal
                </p>
              </div>
            </div>
          </div>

          {serverError && (
            <Alert variant="error" className="mb-6">
              {serverError}
            </Alert>
          )}

          <form method="POST" onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* SECTION 1: APPLICANT TYPE & ENTITY DETAILS */}
            <FormSection
              title="1. Entity Classification & Details"
              description="Classification and legal parameters of the registering organization or industry partner."
            >
              {/* Applicant Type Selection */}
              <div className="col-span-1 md:col-span-2">
                <FormField label="Applicant Type" required htmlFor="applicantType">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('applicantType', 'Company')}
                      className={`flex items-center justify-center space-x-2.5 rounded-lg border p-3.5 text-xs font-semibold transition-all cursor-pointer ${
                        applicantType === 'Company'
                          ? 'border-[#d49b38] bg-[#FFFBF0] text-[#0F172A] shadow-sm ring-1 ring-[#d49b38]'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <Building2 className={`h-4 w-4 ${applicantType === 'Company' ? 'text-[#d49b38]' : 'text-[#64748B]'}`} />
                      <span>Company / Enterprise</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setValue('applicantType', 'Industry')}
                      className={`flex items-center justify-center space-x-2.5 rounded-lg border p-3.5 text-xs font-semibold transition-all cursor-pointer ${
                        applicantType === 'Industry'
                          ? 'border-[#d49b38] bg-[#FFFBF0] text-[#0F172A] shadow-sm ring-1 ring-[#d49b38]'
                          : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                      }`}
                    >
                      <Factory className={`h-4 w-4 ${applicantType === 'Industry' ? 'text-[#d49b38]' : 'text-[#64748B]'}`} />
                      <span>Industry Partner</span>
                    </button>
                  </div>
                </FormField>
              </div>

              <FormField label="Legal Name" required htmlFor="legalName" error={errors.legalName?.message}>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="legalName"
                    placeholder="e.g. Tescom Solutions Pvt Ltd"
                    className="pl-9"
                    error={errors.legalName?.message}
                    {...register('legalName')}
                  />
                </div>
              </FormField>

              <FormField label="Trade Name (DBA)" htmlFor="tradeName" error={errors.tradeName?.message}>
                <Input
                  id="tradeName"
                  placeholder="e.g. Tescom Systems"
                  error={errors.tradeName?.message}
                  {...register('tradeName')}
                />
              </FormField>

              <FormField label="Organization Type" required htmlFor="type" error={errors.type?.message}>
                <Select id="type" options={orgTypeOptions} error={errors.type?.message} {...register('type')} />
              </FormField>

              <FormField label="Website Domain" htmlFor="website" error={errors.website?.message}>
                <div className="relative">
                  <Globe className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://www.tescom.com"
                    className="pl-9"
                    error={errors.website?.message}
                    {...register('website')}
                  />
                </div>
              </FormField>

              <div className="col-span-1 md:col-span-2">
                <FormField label="Registered Address" required htmlFor="address" error={errors.address?.message}>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                    <textarea
                      id="address"
                      rows={2}
                      placeholder="e.g. Plot 42, Tech Park Phase II, Electronic City, Bengaluru, Karnataka 560100"
                      className="w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-9 pr-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38] focus:bg-white transition-colors"
                      {...register('address')}
                    />
                  </div>
                  {errors.address && (
                    <p className="mt-1 text-xs text-[#EF4444]">{errors.address.message}</p>
                  )}
                </FormField>
              </div>

              {/* Business Verticals */}
              <div className="col-span-1 md:col-span-2">
                <FormField label="Primary Business Vertical" required htmlFor="primaryBvCode" error={errors.primaryBvCode?.message}>
                  <Combobox
                    options={bvComboboxOptions}
                    value={selectedPrimaryBvCode}
                    onChange={(val) => setValue('primaryBvCode', val, { shouldValidate: true })}
                    placeholder="Select primary Business Vertical (BV-01 to BV-06)..."
                    error={errors.primaryBvCode?.message}
                  />
                </FormField>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-2">
                  Additional Business Verticals (Optional)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bvs.filter((bv) => bv.id !== selectedPrimaryBvCode).map((bv) => {
                    const isSelected = selectedAdditionalBvCodes.includes(bv.id);
                    return (
                      <button
                        type="button"
                        key={bv.id}
                        onClick={() => toggleAdditionalBv(bv.id)}
                        className={`flex items-center space-x-2.5 rounded-lg border px-3 py-2 text-xs text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#d49b38] bg-[#FFFBF0] text-[#0F172A] font-semibold'
                            : 'border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#CBD5E1]'
                        }`}
                      >
                        <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-[#d49b38] bg-[#d49b38] text-white' : 'border-[#CBD5E1] bg-white'
                        }`}>
                          {isSelected && <CheckCircle2 className="h-3 w-3" />}
                        </div>
                        <span className="truncate">{bv.code} — {bv.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FormSection>

            {/* SECTION 2: PRIMARY CONTACT PERSON */}
            <FormSection
              title="2. Primary Contact & Account Provisioning"
              description="Representative contact information and master account login credentials."
            >
              <FormField label="Primary Contact Name" required htmlFor="primaryContactName" error={errors.primaryContactName?.message}>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="primaryContactName"
                    placeholder="e.g. Tejas Sharma"
                    className="pl-9"
                    error={errors.primaryContactName?.message}
                    {...register('primaryContactName')}
                  />
                </div>
              </FormField>

              <FormField label="Designation / Title" htmlFor="designation" error={errors.designation?.message}>
                <Input id="designation" placeholder="e.g. Director of Procurement" {...register('designation')} />
              </FormField>

              <FormField label="Email Address" required htmlFor="email" error={errors.email?.message}>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tejas@tescom.com"
                    className="pl-9"
                    error={errors.email?.message}
                    {...register('email')}
                  />
                </div>
              </FormField>

              <FormField label="Phone Number" required htmlFor="phone" error={errors.phone?.message}>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="pl-9"
                    error={errors.phone?.message}
                    {...register('phone')}
                  />
                </div>
              </FormField>

              <FormField label="Account Password" required htmlFor="password" error={errors.password?.message}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    error={errors.password?.message}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-[#5B6673] hover:text-[#17202A]"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormField>

              <FormField label="Confirm Password" required htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#5B6673]" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9"
                    error={errors.confirmPassword?.message}
                    {...register('confirmPassword')}
                  />
                </div>
              </FormField>
            </FormSection>

            {/* SECTION 3: REGISTRATION DOCUMENTS & CONSENT */}
            <FormSection
              title="3. Registration Documents & Verification Consent"
              description="Upload incorporation, GST, or compliance certificates for ADMIN approval review."
            >
              <div className="col-span-1 md:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Compliance / Registration Documents (Optional)
                </label>
                <div className="rounded-lg border-2 border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-5 text-center hover:border-[#d49b38] transition-colors">
                  <UploadCloud className="mx-auto h-8 w-8 text-[#94A3B8]" />
                  <p className="mt-2 text-xs font-medium text-[#0F172A]">
                    Click to select or drag incorporation / GST certificates
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64748B]">PDF, PNG, JPG or DOCX up to 10MB per file</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.docx"
                    onChange={handleFileUpload}
                    className="mt-3 block w-full text-xs text-[#64748B] file:mr-4 file:rounded-md file:border-0 file:bg-[#151c2e] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#182238] cursor-pointer"
                  />
                </div>

                {isUploading && (
                  <p className="mt-2 text-xs text-[#d49b38] font-medium animate-pulse">
                    Uploading document to private storage...
                  </p>
                )}

                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-[#0F172A]">Attached Documents:</p>
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.key}
                        className="flex items-center justify-between rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <FileText className="h-4 w-4 text-[#d49b38] shrink-0" />
                          <span className="font-medium text-[#0F172A] truncate">{file.name}</span>
                          <span className="text-[10px] text-[#64748B]">({(file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeUploadedFile(file.key)}
                          className="text-[#94A3B8] hover:text-[#EF4444] transition-colors"
                          title="Remove file"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="col-span-1 md:col-span-2 pt-2">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-[#CBD5E1] text-[#d49b38] focus:ring-[#d49b38]"
                    {...register('termsConsent')}
                  />
                  <span className="text-xs text-[#64748B] leading-relaxed">
                    I confirm that I am an authorized representative of this entity and that all submitted corporate information and documentation are accurate and legitimate. I accept the{' '}
                    <Link href="/terms" className="text-[#d49b38] underline hover:text-[#c48b28]" target="_blank">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-[#d49b38] underline hover:text-[#c48b28]" target="_blank">
                      Privacy Policy
                    </Link>.
                  </span>
                </label>
                {errors.termsConsent && (
                  <p className="mt-1 text-xs text-[#EF4444]">{errors.termsConsent.message}</p>
                )}
              </div>
            </FormSection>

            {/* SUBMIT BUTTON & CONSENT */}
            <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center space-x-2 text-xs text-[#64748B]">
                <ShieldCheck className="h-4 w-4 text-[#10B981] shrink-0" />
                <span>
                  Submitted onboardings enter <strong>SUBMITTED</strong> state and are queued for ADMIN verification & approval.
                </span>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold text-sm"
                isLoading={isLoading}
                disabled={isLoading || isUploading}
              >
                Submit Onboarding Request for Admin Approval
              </Button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center text-xs text-[#64748B]">
            AnveshakHub v4.0 Master • Secure Canonical Company & Industry Onboarding
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
