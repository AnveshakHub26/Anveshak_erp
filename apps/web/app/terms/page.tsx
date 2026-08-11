import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] p-6 text-[#0F172A]">
      <div className="w-full max-w-2xl rounded-xl border border-[#E2E8F0] bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0F172A] mb-4">Terms of Service</h1>
        <p className="text-xs text-[#64748B] leading-relaxed mb-6">
          Usage of the AnveshakHub Enterprise Application is governed by corporate governance policies. Access permissions are granted based on assigned system roles and organization affiliations.
        </p>
        <div className="border-t border-[#E2E8F0] pt-4">
          <Link href="/" className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#d49b38] transition-colors">
            <ArrowLeft className="mr-1.5 h-4 w-4 text-[#d49b38]" /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
