'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { HelpCircle, Mail, User, MessageSquare, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { PublicShell } from '@/components/layout/public-shell';

const SupportSchema = z.object({
  category: z.string().min(1, 'Support category is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  contactEmail: z.string().email('Valid email address is required'),
  subject: z.string().min(3, 'Subject is required'),
  message: z.string().min(10, 'Message details are required'),
});

type SupportFormData = z.infer<typeof SupportSchema>;

export default function Fnd11SupportPage() {
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SupportFormData>({
    resolver: zodResolver(SupportSchema),
    defaultValues: {
      category: 'General Support',
      contactName: '',
      contactEmail: '',
      subject: '',
      message: '',
    },
  });

  const onSubmit = async (data: SupportFormData) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await apiRequest('/admin/support', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (res && res.data) {
        setTicketResult(res.data);
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to submit support request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicShell>
    <div className="bg-[#F8FAFC] px-4 py-8 text-[#0F172A]">
      <div className="mx-auto max-w-2xl space-y-6">

        {/* Header */}
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0F172A]">
                Contact Administration & Technical Support
              </h1>
              <p className="text-xs text-[#64748B]">
                Official Platform Technical Support & Assistance Entry Point
              </p>
            </div>
          </div>
        </div>

        {serverError && <Alert variant="error">{serverError}</Alert>}

        {ticketResult ? (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center shadow-sm space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EBF5F0] text-[#2F6F52] border border-[#A3D9C0]">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-[#0F172A]">
              Support Request Submitted
            </h2>
            <p className="text-xs text-[#0F172A]">
              Your support ticket reference is{' '}
              <strong className="font-mono text-[#d49b38] bg-[#F8FAFC] px-2 py-0.5 rounded border border-[#E2E8F0]">{ticketResult.ticketId}</strong>.
            </p>
            <p className="text-xs text-[#64748B]">
              An administrator will review your submission and respond to your registered contact email address.
            </p>
            <div className="pt-2">
              <Link href="/">
                <Button variant="primary" size="sm" className="bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                  Return to Home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField label="Support Category" required error={errors.category?.message} htmlFor="category">
                <select
                  id="category"
                  {...register('category')}
                  className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
                >
                  <option value="General Support">General Support</option>
                  <option value="Account Access">Account Access & Recovery</option>
                  <option value="Organization Onboarding">Organization Onboarding & BV Verification</option>
                  <option value="Technical Bug">Technical System Bug</option>
                  <option value="Billing / Invoicing">Billing / Invoicing Query</option>
                </select>
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Your Full Name" required error={errors.contactName?.message} htmlFor="contactName">
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
                    <Input id="contactName" error={errors.contactName?.message} {...register('contactName')} className="pl-9" placeholder="John Doe" />
                  </div>
                </FormField>

                <FormField label="Contact Email" required error={errors.contactEmail?.message} htmlFor="contactEmail">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#64748B]" />
                    <Input id="contactEmail" type="email" error={errors.contactEmail?.message} {...register('contactEmail')} className="pl-9" placeholder="john@company.com" />
                  </div>
                </FormField>
              </div>

              <FormField label="Subject" required error={errors.subject?.message} htmlFor="subject">
                <Input id="subject" error={errors.subject?.message} {...register('subject')} placeholder="Brief summary of request..." />
              </FormField>

              <FormField label="Detailed Message" required error={errors.message?.message} htmlFor="message">
                <textarea
                  id="message"
                  {...register('message')}
                  rows={5}
                  className={`w-full rounded-lg border bg-white p-3 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none focus:ring-1 focus:ring-[#d49b38] ${
                    errors.message ? 'border-[#B42318]' : 'border-[#E2E8F0]'
                  }`}
                  placeholder="Describe your query or issue in detail..."
                />
              </FormField>

              <Button type="submit" variant="primary" isLoading={submitting} disabled={submitting} className="w-full sm:w-auto bg-gradient-to-r from-[#d49b38] to-[#c48b28] text-[#151c2e] font-bold">
                Submit Support Request
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
    </PublicShell>
  );
}
