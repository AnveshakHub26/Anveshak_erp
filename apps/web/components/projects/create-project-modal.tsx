'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiRequest } from '@/lib/api-client';
import { X, Plus, FolderGit2, AlertCircle, Loader2 } from 'lucide-react';

interface OrganizationOption {
  id: string;
  legalName: string;
  orgNumber: string;
}

interface BusinessVerticalOption {
  id: string;
  name: string;
  code: string;
}

export const CreateProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({ isOpen, onClose, onSuccess }) => {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [bvId, setBvId] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [timeline, setTimeline] = useState('');

  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [verticals, setVerticals] = useState<BusinessVerticalOption[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      setIsLoadingDropdowns(true);
      setErrorMsg(null);
      try {
        const [orgRes, bvRes] = await Promise.allSettled([
          apiRequest<{ success: boolean; data: { items: OrganizationOption[] } }>('/organizations?status=APPROVED&limit=100'),
          apiRequest<{ success: boolean; data: BusinessVerticalOption[] }>('/business-verticals'),
        ]);

        if (orgRes.status === 'fulfilled' && orgRes.value?.data?.items) {
          setOrganizations(orgRes.value.data.items);
          if (orgRes.value.data.items.length > 0) {
            setOrganizationId(orgRes.value.data.items[0].id);
          }
        }

        if (bvRes.status === 'fulfilled' && Array.isArray(bvRes.value?.data)) {
          setVerticals(bvRes.value.data);
          if (bvRes.value.data.length > 0) {
            setBvId(bvRes.value.data[0].id);
          }
        }
      } catch (err: any) {
        console.error('Failed to load project creation master options:', err);
      } finally {
        setIsLoadingDropdowns(false);
      }
    };

    fetchOptions();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Project title is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Project description is required.');
      return;
    }
    if (!organizationId) {
      setErrorMsg('Please select a client organization.');
      return;
    }
    if (!bvId) {
      setErrorMsg('Please select a business vertical.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await apiRequest<{ success: boolean; data: { id: string; projectCode: string } }>('/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          organizationId,
          bvId,
          category: category.trim() || undefined,
          budget: budget.trim() || undefined,
          timeline: timeline.trim() || undefined,
        }),
      });

      if (res && res.data && res.data.id) {
        onClose();
        if (onSuccess) onSuccess();
        router.push(`/projects/${res.data.id}`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0F172A]/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-[#E2E8F0] flex flex-col my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-[#F8FAFC] rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#151c2e] to-[#182238] flex items-center justify-center text-[#d49b38] shadow-sm">
              <FolderGit2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#0F172A]">Create New Enterprise Project</h2>
              <p className="text-xs text-[#64748B]">Instantiate project workspace with server-generated project code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="flex items-center space-x-2 rounded-xl bg-red-50 p-3.5 border border-red-200 text-xs text-red-800 font-medium">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Project Title */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Project Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Next-Gen Enterprise AI ERP Core Development"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
            />
          </div>

          {/* Client Org & Business Vertical */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Client Organization <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={organizationId}
                onChange={(e) => setOrganizationId(e.target.value)}
                disabled={isLoadingDropdowns}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
              >
                {organizations.length === 0 ? (
                  <option value="">No approved organizations available</option>
                ) : (
                  organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.legalName} ({org.orgNumber})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Business Vertical <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={bvId}
                onChange={(e) => setBvId(e.target.value)}
                disabled={isLoadingDropdowns}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
              >
                {verticals.length === 0 ? (
                  <option value="">Loading verticals...</option>
                ) : (
                  verticals.map((bv) => (
                    <option key={bv.id} value={bv.id}>
                      {bv.name} ({bv.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1">
              Project Description & Scope <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="Detailed description of objective, technical requirements, and core deliverables..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
            />
          </div>

          {/* Category, Budget, Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Category / Domain</label>
              <input
                type="text"
                placeholder="e.g. AI / Cloud ERP"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Budget Estimate</label>
              <input
                type="text"
                placeholder="e.g. ₹50,00,000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Expected Timeline</label>
              <input
                type="text"
                placeholder="e.g. 6 Months"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#0F172A] focus:border-[#d49b38] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#d49b38]"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-[#E2E8F0]">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#E2E8F0] px-4 py-2.5 text-xs font-semibold text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isLoadingDropdowns}
              className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-[#151c2e] to-[#182238] px-5 py-2.5 text-xs font-bold text-[#d49b38] hover:opacity-95 shadow-md disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating Project...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Create Project</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
