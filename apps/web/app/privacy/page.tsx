import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PublicShell } from '@/components/layout/public-shell';

export default function PrivacyPage() {
  return (
    <PublicShell>
      <div className="flex min-h-[calc(100vh-128px)] flex-col items-center justify-center bg-[#F8FAFC] p-6">
        <div className="w-full max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Privacy Policy</h1>
          <p className="text-sm text-[#64748B] leading-relaxed mb-6">
            AnveshakHub Enterprise Application protects all organizational, personnel, and operational data under enterprise confidentiality standards. All document access and transactional activities are authenticated and audited.
          </p>
          <div className="border-t border-[#E2E8F0] pt-4">
            <Link href="/" className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#d49b38] transition-colors">
              <ArrowLeft className="mr-1.5 h-4 w-4 text-[#d49b38]" /> Return to Home
            </Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
