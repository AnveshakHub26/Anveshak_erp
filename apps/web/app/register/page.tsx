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
import { Building2, User, Lock, Mail, Phone, Globe, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function Fnd03RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [bvs, setBvs] = useState<{ id: string; code: string; name: string }[]>([]);

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
    },
  });

  const selectedPrimaryBvCode = watch('primaryBvCode');

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

  const onSubmit = async (data: RegisterOrganizationInput) => {
    setServerError(null);
    setIsLoading(true);

    try {
      const response = await apiRequest('/organizations/registration', {
        method: 'POST',
        body: JSON.stringify({
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

        {/* Form Card Header */}
        <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] font-bold text-[#151c2e] text-xl shadow-sm">
              AH
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
                Organization Registration
              </h1>
              <p className="mt-0.5 text-xs text-[#64748B]">
                Canonical Enterprise Onboarding Self-Registration
              </p>
            </div>
          </div>
        </div>

        {serverError && (
          <Alert variant="error" className="mb-6">
            {serverError}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* SECTION 1: ORGANIZATION DETAILS */}
          <FormSection
            title="1. Organization Details"
            description="Legal and administrative classification of your business entity."
          >
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
          </FormSection>

          {/* SECTION 2: PRIMARY CONTACT PERSON */}
          <FormSection
            title="2. Primary Contact & Account Provisioning"
            description="Credentials and identity of the registering organization representative."
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

          {/* SUBMIT BUTTON & CONSENT */}
          <div className="rounded border border-[#D7DEE6] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center space-x-2 text-xs text-[#5B6673]">
              <ShieldCheck className="h-4 w-4 text-[#2F6F52]" />
              <span>
                By submitting registration, you confirm authorization to represent this organization.
              </span>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Submit Organization Registration
            </Button>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-[#5B6673]">
          AnveshakHub v3.0 Master • Secure Canonical Organization Onboarding
        </div>
      </div>
    </div>
    </PublicShell>
  );
}
