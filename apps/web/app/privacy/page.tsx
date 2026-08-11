import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] p-6 text-[#17202A]">
      <div className="w-full max-w-2xl rounded border border-[#D7DEE6] bg-white p-8 shadow-sm">
        <h1 className="text-page-title text-[#17324D] mb-4">Privacy Policy</h1>
        <p className="text-body text-[#5B6673] mb-4">
          AnveshakHub Enterprise Application protects all organizational, personnel, and operational data under enterprise confidentiality standards. All document access and transactional activities are authenticated and audited.
        </p>
        <div className="border-t border-[#D7DEE6] pt-4">
          <Link href="/" className="inline-flex items-center text-label font-medium text-[#1F4E79] hover:underline">
            <ArrowLeft className="mr-1 h-4 w-4" /> Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
