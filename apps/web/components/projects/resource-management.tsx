'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  Calendar,
  XCircle,
  Edit2,
  UserCheck,
  UserMinus,
  Lock,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface Requirement {
  id: string;
  projectId: string;
  professionalRole: string;
  category?: string;
  employmentType?: string;
  requiredCount: number;
  allocationPct: number;
  skills: string[];
  technologies: string[];
  startDate?: string;
  endDate?: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string;
  isFulfilled: boolean;
  fulfilledCount: number;
}

interface Candidate {
  id: string;
  employeeCode: string;
  fullName: string;
  professionalRole: string;
  department: string;
  designation: string;
  category: string;
  employmentType: string;
  status?: string;
  skills: string[];
  technologies: string[];
  currentAllocationPct: number;
  availableCapacityPct: number;
  matchScore: number;
}

interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  requirementId?: string;
  projectRole: string;
  allocationPct: number;
  startDate?: string;
  endDate?: string;
  assignedAt: string;
  removedAt?: string;
  status: string;
  employee: {
    id: string;
    employeeCode: string;
    fullName: string;
    professionalRole: string;
    department: string;
    designation: string;
    category: string;
    employmentType: string;
  };
}

interface ResourceManagementProps {
  projectId: string;
  projectCode: string;
  projectStatus: string;
  members?: ProjectMember[];
  onRefreshProject?: () => void;
}

export function ResourceManagementTab({
  projectId,
  projectCode,
  projectStatus,
  members = [],
  onRefreshProject,
}: ResourceManagementProps) {
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('ADMIN');
  const isHr = hasRole('HR');
  const isPm = hasRole('PM');
  const isLocked = projectStatus === 'COMPLETED' || projectStatus === 'CANCELLED';

  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoadingReqs, setIsLoadingReqs] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Requirement Modal State
  const [isReqModalOpen, setIsReqModalOpen] = useState(false);
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [reqForm, setReqForm] = useState({
    professionalRole: '',
    category: '',
    employmentType: '',
    requiredCount: 1,
    allocationPct: 100,
    skillsInput: '',
    techInput: '',
    startDate: '',
    endDate: '',
    priority: 'HIGH' as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
    notes: '',
  });

  // Candidate Finder State
  const [isCandidateDrawerOpen, setIsCandidateDrawerOpen] = useState(false);
  const [selectedReqForCandidate, setSelectedReqForCandidate] = useState<Requirement | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');

  // Assignment Modal State
  const [assigningCandidate, setAssigningCandidate] = useState<Candidate | null>(null);
  const [assignForm, setAssignForm] = useState({
    projectRole: '',
    allocationPct: 100,
    startDate: '',
    endDate: '',
  });

  // Edit Allocation Modal State
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);
  const [editAllocPct, setEditAllocPct] = useState(100);

  // Release Dialog State
  const [releasingMember, setReleasingMember] = useState<ProjectMember | null>(null);
  const [releaseReason, setReleaseReason] = useState('');

  // Assignment Modal local state (error/loading shown INSIDE the modal)
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [assignSubmitError, setAssignSubmitError] = useState<string | null>(null);

  const loadRequirements = useCallback(async () => {
    setIsLoadingReqs(true);
    setError(null);
    try {
      const res = await apiRequest(`/projects/${projectId}/requirements`);
      if (res && res.data) {
        setRequirements(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load project requirements.');
    } finally {
      setIsLoadingReqs(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadRequirements();
  }, [loadRequirements]);

  const loadCandidates = useCallback(async (reqId?: string, search?: string) => {
    setIsLoadingCandidates(true);
    try {
      let url = `/projects/${projectId}/candidates?`;
      if (reqId) url += `requirementId=${reqId}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await apiRequest(url);
      if (res && res.data) {
        setCandidates(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load matching candidates.');
    } finally {
      setIsLoadingCandidates(false);
    }
  }, [projectId]);

  // Handle Requirement Creation / Update
  const handleSaveRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const payload = {
        professionalRole: reqForm.professionalRole,
        category: reqForm.category || undefined,
        employmentType: reqForm.employmentType || undefined,
        requiredCount: Number(reqForm.requiredCount),
        allocationPct: Number(reqForm.allocationPct),
        skills: reqForm.skillsInput.split(',').map((s) => s.trim()).filter(Boolean),
        technologies: reqForm.techInput.split(',').map((t) => t.trim()).filter(Boolean),
        startDate: reqForm.startDate || undefined,
        endDate: reqForm.endDate || undefined,
        priority: reqForm.priority,
        notes: reqForm.notes || undefined,
      };

      if (editingReq) {
        await apiRequest(`/projects/${projectId}/requirements/${editingReq.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Resource requirement updated successfully.');
      } else {
        await apiRequest(`/projects/${projectId}/requirements`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setSuccessMsg('Resource requirement created successfully.');
      }

      setIsReqModalOpen(false);
      loadRequirements();
    } catch (err: any) {
      setError(err.message || 'Failed to save requirement.');
    }
  };

  const openAddReqModal = () => {
    setEditingReq(null);
    setReqForm({
      professionalRole: '',
      category: '',
      employmentType: '',
      requiredCount: 1,
      allocationPct: 100,
      skillsInput: '',
      techInput: '',
      startDate: '',
      endDate: '',
      priority: 'HIGH',
      notes: '',
    });
    setIsReqModalOpen(true);
  };

  const openEditReqModal = (req: Requirement) => {
    setEditingReq(req);
    setReqForm({
      professionalRole: req.professionalRole,
      category: req.category || '',
      employmentType: req.employmentType || '',
      requiredCount: req.requiredCount,
      allocationPct: req.allocationPct,
      skillsInput: req.skills.join(', '),
      techInput: req.technologies.join(', '),
      startDate: req.startDate ? new Date(req.startDate).toISOString().split('T')[0] : '',
      endDate: req.endDate ? new Date(req.endDate).toISOString().split('T')[0] : '',
      priority: req.priority,
      notes: req.notes || '',
    });
    setIsReqModalOpen(true);
  };

  // Open Candidate Finder Drawer
  const openCandidateFinder = (req?: Requirement) => {
    setSelectedReqForCandidate(req || null);
    setCandidateSearch('');
    setIsCandidateDrawerOpen(true);
    loadCandidates(req?.id, '');
  };

  // Handle Candidate Assignment Submit
  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningCandidate) return;
    setAssignSubmitError(null);
    setAssignSubmitting(true);
    try {
      await apiRequest(`/projects/${projectId}/members`, {
        method: 'POST',
        body: JSON.stringify({
          employeeId: assigningCandidate.id,
          requirementId: selectedReqForCandidate?.id || undefined,
          projectRole: assignForm.projectRole || selectedReqForCandidate?.professionalRole || assigningCandidate.professionalRole,
          allocationPct: Number(assignForm.allocationPct),
          startDate: assignForm.startDate || undefined,
          endDate: assignForm.endDate || undefined,
        }),
      });

      setSuccessMsg(`Assigned ${assigningCandidate.fullName} (${assigningCandidate.employeeCode}) to ${projectCode}.`);
      setAssigningCandidate(null);
      setAssignSubmitError(null);
      setIsCandidateDrawerOpen(false);
      loadRequirements();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      // Show error INSIDE the modal, not just at the top of the page
      setAssignSubmitError(err.message || 'Failed to assign employee to project.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  // Handle Allocation Update Submit
  const handleUpdateAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setError(null);
    try {
      await apiRequest(`/projects/${projectId}/members/${editingMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ allocationPct: Number(editAllocPct) }),
      });

      setSuccessMsg(`Updated allocation for ${editingMember.employee.fullName} to ${editAllocPct}%.`);
      setEditingMember(null);
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      setError(err.message || 'Failed to update member allocation.');
    }
  };

  // Handle Member Release Submit
  const handleConfirmRelease = async () => {
    if (!releasingMember) return;
    setError(null);
    try {
      await apiRequest(`/projects/${projectId}/members/${releasingMember.id}/release`, {
        method: 'POST',
        body: JSON.stringify({ reason: releaseReason || undefined }),
      });

      setSuccessMsg(`Released ${releasingMember.employee.fullName} (${releasingMember.employee.employeeCode}) from project.`);
      setReleasingMember(null);
      setReleaseReason('');
      loadRequirements();
      if (onRefreshProject) onRefreshProject();
    } catch (err: any) {
      setError(err.message || 'Failed to release member.');
    }
  };

  // Staffing Metrics Computations
  const totalRequiredHeadcount = requirements.reduce((sum, r) => sum + r.requiredCount, 0);
  const activeMembers = members.filter((m) => m.status === 'ACTIVE');
  const assignedHeadcount = activeMembers.length;
  const unfilledCount = Math.max(0, totalRequiredHeadcount - assignedHeadcount);
  const staffingPct = totalRequiredHeadcount > 0 ? Math.min(100, Math.round((assignedHeadcount / totalRequiredHeadcount) * 100)) : 100;

  return (
    <div className="space-y-6 text-xs">

      {/* Alerts */}
      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-xs font-bold underline ml-2">Dismiss</button>
        </Alert>
      )}
      {successMsg && (
        <Alert variant="success" className="flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-bold underline ml-2">Dismiss</button>
        </Alert>
      )}

      {/* Project Status Lock Banner */}
      {isLocked && (
        <div className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] p-4 flex items-center space-x-3 text-[#92400E]">
          <Lock className="h-5 w-5 shrink-0 text-[#D97706]" />
          <div>
            <p className="font-bold text-xs">Resource Management Locked</p>
            <p className="text-[11px] text-[#B45309]">
              This project is currently <span className="font-bold">{projectStatus}</span>. Resource requirement creation, assignment, and release controls are disabled.
            </p>
          </div>
        </div>
      )}

      {/* 1. Staffing Metrics Overview Header */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-1 shadow-sm">
          <span className="text-[#64748B] text-[11px] flex items-center">
            <Layers className="h-3.5 w-3.5 text-[#d49b38] mr-1.5" /> Total Requirements
          </span>
          <p className="text-xl font-bold text-[#0F172A]">{requirements.length}</p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-1 shadow-sm">
          <span className="text-[#64748B] text-[11px] flex items-center">
            <Users className="h-3.5 w-3.5 text-[#3B82F6] mr-1.5" /> Required Headcount
          </span>
          <p className="text-xl font-bold text-[#0F172A]">{totalRequiredHeadcount}</p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-1 shadow-sm">
          <span className="text-[#64748B] text-[11px] flex items-center">
            <UserCheck className="h-3.5 w-3.5 text-[#10B981] mr-1.5" /> Assigned Active
          </span>
          <p className="text-xl font-bold text-[#0F172A]">{assignedHeadcount}</p>
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-1 shadow-sm">
          <span className="text-[#64748B] text-[11px] flex items-center">
            <UserMinus className="h-3.5 w-3.5 text-[#EF4444] mr-1.5" /> Unfilled Positions
          </span>
          <p className="text-xl font-bold text-[#0F172A]">{unfilledCount}</p>
        </div>

        <div className="col-span-2 md:col-span-1 rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-1 shadow-sm">
          <span className="text-[#64748B] text-[11px] flex items-center">
            <Sparkles className="h-3.5 w-3.5 text-[#8B5CF6] mr-1.5" /> Overall Staffing
          </span>
          <div className="flex items-center space-x-2">
            <p className="text-xl font-bold text-[#0F172A]">{staffingPct}%</p>
            <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${staffingPct >= 100 ? 'bg-[#10B981]' : staffingPct > 50 ? 'bg-[#3B82F6]' : 'bg-[#F59E0B]'}`}
                style={{ width: `${staffingPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Resource Requirements Panel Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div>
          <h2 className="text-sm font-bold text-[#0F172A] flex items-center">
            <Briefcase className="h-4 w-4 text-[#d49b38] mr-2" /> Project Resource Requirements
          </h2>
          <p className="text-[11px] text-[#64748B]">Staffing roles, skill specifications, and allocation targets</p>
        </div>

        {isAdmin && !isLocked && (
          <Button size="sm" onClick={openAddReqModal} className="bg-[#0F172A] hover:bg-[#1E293B] text-xs">
            <UserPlus className="h-3.5 w-3.5 mr-1.5 text-[#d49b38]" /> Add Requirement
          </Button>
        )}
      </div>

      {/* Resource Requirements List Grid */}
      {isLoadingReqs ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center text-[#64748B]">
          Loading project resource requirements...
        </div>
      ) : requirements.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-8 text-center space-y-2">
          <p className="text-xs font-medium text-[#64748B]">No resource requirements defined for this project yet.</p>
          {isAdmin && !isLocked && (
            <Button size="sm" variant="outline" onClick={openAddReqModal} className="text-xs">
              Create First Requirement
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requirements.map((req) => (
            <div
              key={req.id}
              className={`rounded-xl border bg-white p-5 shadow-sm space-y-3 transition-all ${
                req.isFulfilled ? 'border-[#10B981]/30 bg-[#F0FDF4]/30' : 'border-[#E2E8F0]'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-[#0F172A]">{req.professionalRole}</h3>
                    {req.priority === 'CRITICAL' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#DC2626]">CRITICAL</span>
                    )}
                    {req.priority === 'HIGH' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#D97706]">HIGH</span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Category: <span className="font-semibold text-[#0F172A]">{req.category || 'Any'}</span> • Type:{' '}
                    <span className="font-semibold text-[#0F172A]">{req.employmentType || 'Any'}</span>
                  </p>
                </div>

                {req.isFulfilled ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#D1FAE5] text-[#065F46]">
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-[#059669]" /> FULFILLED
                  </span>
                ) : req.fulfilledCount > 0 ? (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEF3C7] text-[#92400E]">
                    <Clock className="h-3.5 w-3.5 mr-1 text-[#D97706]" /> PARTIALLY FULFILLED
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#F1F5F9] text-[#64748B]">
                    UNFULFILLED
                  </span>
                )}
              </div>

              {/* Requirement Fulfillment Progress Bar */}
              <div className="space-y-1 bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#64748B]">Fulfillment Ratio:</span>
                  <span className="font-bold text-[#0F172A]">
                    {req.fulfilledCount} / {req.requiredCount} Assigned ({req.allocationPct}% allocation each)
                  </span>
                </div>
                <div className="w-full bg-[#E2E8F0] rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${req.isFulfilled ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}
                    style={{ width: `${Math.min(100, (req.fulfilledCount / req.requiredCount) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Skills & Technologies Tags */}
              <div className="space-y-1.5">
                {req.skills && req.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-[#64748B] self-center mr-1">Skills:</span>
                    {req.skills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1E40AF] text-[10px] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                {req.technologies && req.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-[#64748B] self-center mr-1">Tech:</span>
                    {req.technologies.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-[#F3E8FF] text-[#6B21A8] text-[10px] font-medium">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {req.notes && <p className="text-[11px] text-[#64748B] italic">"{req.notes}"</p>}

              {/* Requirement Card Actions */}
              {isAdmin && !isLocked && (
                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#E2E8F0]">
                  <Button size="sm" variant="outline" onClick={() => openEditReqModal(req)} className="text-xs h-8">
                    <Edit2 className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" onClick={() => openCandidateFinder(req)} className="bg-[#0F172A] hover:bg-[#1E293B] text-xs h-8">
                    <Search className="h-3 w-3 mr-1 text-[#d49b38]" /> Find Candidates
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 3. Active Project Team Roster Panel */}
      <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center">
              <UserCheck className="h-4 w-4 text-[#10B981] mr-2" /> Active Project Team Roster
            </h2>
            <p className="text-[11px] text-[#64748B]">Assigned workforce members and current project allocation</p>
          </div>

          {isAdmin && !isLocked && (
            <Button size="sm" variant="outline" onClick={() => openCandidateFinder()} className="text-xs">
              <UserPlus className="h-3.5 w-3.5 mr-1" /> Assign Member
            </Button>
          )}
        </div>

        <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden shadow-sm">
          {activeMembers.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">No active team members assigned to this project yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Employee ID</th>
                    <th className="px-4 py-3 font-semibold">Name &amp; Role</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Project Role</th>
                    <th className="px-4 py-3 font-semibold">Allocation %</th>
                    <th className="px-4 py-3 font-semibold">Assigned Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    {isAdmin && !isLocked && <th className="px-4 py-3 font-semibold text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                  {activeMembers.map((m) => (
                    <tr key={m.id} className="hover:bg-[#F8FAFC]">
                      <td className="px-4 py-3 font-mono font-bold text-[#d49b38]">{m.employee.employeeCode}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold">{m.employee.fullName}</p>
                        <p className="text-[11px] text-[#64748B]">
                          {m.employee.professionalRole} • {m.employee.department}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded bg-[#F1F5F9] font-medium text-[10px]">
                          {m.employee.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold">{m.projectRole}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-[#3B82F6]">{m.allocationPct}%</span>
                      </td>
                      <td className="px-4 py-3 text-[#64748B]">
                        {new Date(m.assignedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#D1FAE5] text-[#065F46]">
                          ACTIVE
                        </span>
                      </td>
                      {isAdmin && !isLocked && (
                        <td className="px-4 py-3 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingMember(m);
                              setEditAllocPct(m.allocationPct);
                            }}
                            className="text-xs font-semibold text-[#3B82F6] hover:underline"
                          >
                            Edit Alloc
                          </button>
                          <button
                            onClick={() => setReleasingMember(m)}
                            className="text-xs font-semibold text-[#EF4444] hover:underline"
                          >
                            Release
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          MODALS & DRAWERS
         ========================================================================= */}

      {/* A. Add / Edit Resource Requirement Modal */}
      <Modal
        isOpen={isReqModalOpen}
        onClose={() => setIsReqModalOpen(false)}
        title={editingReq ? 'Edit Resource Requirement' : 'Create Resource Requirement'}
      >
        <form onSubmit={handleSaveRequirement} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Professional Role *</label>
            <Input
              required
              value={reqForm.professionalRole}
              onChange={(e) => setReqForm({ ...reqForm, professionalRole: e.target.value })}
              placeholder="e.g. Lead Researcher, Fullstack Developer, Data Scientist"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Employee Category</label>
              <select
                value={reqForm.category}
                onChange={(e) => setReqForm({ ...reqForm, category: e.target.value })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
              >
                <option value="">Any Category</option>
                <option value="EXPERT">EXPERT</option>
                <option value="INTERN">INTERN</option>
                <option value="STAFF">STAFF</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Employment Type</label>
              <select
                value={reqForm.employmentType}
                onChange={(e) => setReqForm({ ...reqForm, employmentType: e.target.value })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
              >
                <option value="">Any Employment Type</option>
                <option value="PERMANENT">PERMANENT</option>
                <option value="TEMPORARY">TEMPORARY</option>
                <option value="CONTRACT">CONTRACT</option>
                <option value="PROBATIONARY">PROBATIONARY</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Required Count *</label>
              <Input
                type="number"
                min={1}
                required
                value={reqForm.requiredCount}
                onChange={(e) => setReqForm({ ...reqForm, requiredCount: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Allocation % Each *</label>
              <Input
                type="number"
                min={1}
                max={100}
                required
                value={reqForm.allocationPct}
                onChange={(e) => setReqForm({ ...reqForm, allocationPct: Number(e.target.value) })}
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Priority</label>
              <select
                value={reqForm.priority}
                onChange={(e: any) => setReqForm({ ...reqForm, priority: e.target.value })}
                className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-[#0F172A] focus:border-[#d49b38] focus:outline-none"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Required Skills (Comma separated)</label>
            <Input
              value={reqForm.skillsInput}
              onChange={(e) => setReqForm({ ...reqForm, skillsInput: e.target.value })}
              placeholder="e.g. Thermal Coatings, ANSYS, CAD"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Required Technologies (Comma separated)</label>
            <Input
              value={reqForm.techInput}
              onChange={(e) => setReqForm({ ...reqForm, techInput: e.target.value })}
              placeholder="e.g. React, Python, NestJS"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Start Date</label>
              <Input
                type="date"
                value={reqForm.startDate}
                onChange={(e) => setReqForm({ ...reqForm, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">End Date</label>
              <Input
                type="date"
                value={reqForm.endDate}
                onChange={(e) => setReqForm({ ...reqForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Notes / Description</label>
            <Input
              value={reqForm.notes}
              onChange={(e) => setReqForm({ ...reqForm, notes: e.target.value })}
              placeholder="Additional specification notes for recruitment/assignment"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#E2E8F0]">
            <Button type="button" variant="outline" onClick={() => setIsReqModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0F172A] hover:bg-[#1E293B]">
              {editingReq ? 'Update Requirement' : 'Create Requirement'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* B. Candidate Finder Drawer Modal */}
      <Modal
        isOpen={isCandidateDrawerOpen}
        onClose={() => setIsCandidateDrawerOpen(false)}
        title={`Candidate Search Engine ${selectedReqForCandidate ? `— ${selectedReqForCandidate.professionalRole}` : ''}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center space-x-2">
            <Input
              value={candidateSearch}
              onChange={(e) => setCandidateSearch(e.target.value)}
              placeholder="Search active candidates by name, code, skill..."
              className="text-xs"
            />
            <Button
              size="sm"
              onClick={() => loadCandidates(selectedReqForCandidate?.id, candidateSearch)}
              className="bg-[#0F172A]"
            >
              Search
            </Button>
          </div>

          {isLoadingCandidates ? (
            <div className="p-8 text-center text-[#64748B]">Calculating candidate match scores &amp; capacity...</div>
          ) : candidates.length === 0 ? (
            <div className="p-8 text-center text-[#64748B]">No active candidates match the specified criteria.</div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {candidates.map((cand) => {
                const targetAlloc = selectedReqForCandidate?.allocationPct || 100;
                const canAssign = cand.availableCapacityPct >= targetAlloc;

                return (
                  <div key={cand.id} className="rounded-xl border border-[#E2E8F0] bg-white p-4 space-y-2 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-[#d49b38] text-xs">{cand.employeeCode}</span>
                          <span className="font-bold text-[#0F172A]">{cand.fullName}</span>
                          <span className="px-2 py-0.5 rounded bg-[#F1F5F9] text-[10px] font-semibold">{cand.category}</span>
                          {cand.status && cand.status !== 'ACTIVE' && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold">
                              {cand.status}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#64748B] mt-0.5">
                          {cand.professionalRole} • {cand.department} ({cand.designation})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-[#E0E7FF] text-[#3730A3]">
                          Match: {cand.matchScore}%
                        </span>
                      </div>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
                      <div>
                        <span className="text-[#64748B]">Current Allocated: </span>
                        <span className="font-bold text-[#0F172A]">{cand.currentAllocationPct}%</span>
                      </div>
                      <div>
                        <span className="text-[#64748B]">Available Capacity: </span>
                        <span className={`font-bold ${cand.availableCapacityPct >= targetAlloc ? 'text-[#10B981]' : 'text-amber-600'}`}>
                          {cand.availableCapacityPct}%
                        </span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex flex-wrap gap-1 max-w-[65%]">
                        {cand.skills?.slice(0, 3).map((s, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[9px] text-[#475569]">
                            {s}
                          </span>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          setAssigningCandidate(cand);
                          setAssignForm({
                            projectRole: selectedReqForCandidate?.professionalRole || cand.professionalRole,
                            allocationPct: targetAlloc,
                            startDate: selectedReqForCandidate?.startDate ? new Date(selectedReqForCandidate.startDate).toISOString().split('T')[0] : '',
                            endDate: selectedReqForCandidate?.endDate ? new Date(selectedReqForCandidate.endDate).toISOString().split('T')[0] : '',
                          });
                        }}
                        className="bg-[#10B981] hover:bg-[#059669] text-xs h-7 shrink-0"
                      >
                        ASSIGN MEMBER
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* C. Assignment Confirmation Modal */}
      {assigningCandidate && (
        <Modal
          isOpen={!!assigningCandidate}
          onClose={() => { setAssigningCandidate(null); setAssignSubmitError(null); }}
          title={`Confirm Project Assignment — ${assigningCandidate.fullName}`}
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] space-y-1">
              <p><span className="text-[#64748B]">Employee:</span> <span className="font-bold">{assigningCandidate.fullName} ({assigningCandidate.employeeCode})</span></p>
              <p><span className="text-[#64748B]">Target Project:</span> <span className="font-mono font-bold text-[#d49b38]">{projectCode}</span></p>
              {selectedReqForCandidate && (
                <p><span className="text-[#64748B]">Requirement:</span> <span className="font-bold text-[#0F172A]">{selectedReqForCandidate.professionalRole}</span></p>
              )}
            </div>

            {/* Error shown INSIDE the modal — visible to user */}
            {assignSubmitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <span>{assignSubmitError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Project Role *</label>
              <Input
                required
                value={assignForm.projectRole}
                onChange={(e) => setAssignForm({ ...assignForm, projectRole: e.target.value })}
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Allocation Percentage (%) *</label>
              <Input
                type="number"
                min={1}
                max={assigningCandidate.availableCapacityPct}
                required
                value={assignForm.allocationPct}
                onChange={(e) => setAssignForm({ ...assignForm, allocationPct: Number(e.target.value) })}
              />
              <p className="text-[10px] text-[#64748B] mt-0.5">Max available capacity: {assigningCandidate.availableCapacityPct}%</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Start Date</label>
                <Input
                  type="date"
                  value={assignForm.startDate}
                  onChange={(e) => setAssignForm({ ...assignForm, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">End Date</label>
                <Input
                  type="date"
                  value={assignForm.endDate}
                  onChange={(e) => setAssignForm({ ...assignForm, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#E2E8F0]">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setAssigningCandidate(null); setAssignSubmitError(null); }}
                disabled={assignSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#10B981] hover:bg-[#059669] min-w-[160px]"
                disabled={assignSubmitting}
              >
                {assignSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Assigning...
                  </span>
                ) : (
                  'Confirm & Assign Member'
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* D. Edit Member Allocation Modal */}
      {editingMember && (
        <Modal
          isOpen={!!editingMember}
          onClose={() => setEditingMember(null)}
          title={`Modify Member Allocation — ${editingMember.employee.fullName}`}
        >
          <form onSubmit={handleUpdateAllocation} className="space-y-4 text-xs">
            <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0] space-y-1">
              <p><span className="text-[#64748B]">Employee:</span> <span className="font-bold">{editingMember.employee.fullName} ({editingMember.employee.employeeCode})</span></p>
              <p><span className="text-[#64748B]">Current Allocation:</span> <span className="font-bold text-[#3B82F6]">{editingMember.allocationPct}%</span></p>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">New Allocation Percentage (%) *</label>
              <Input
                type="number"
                min={1}
                max={100}
                required
                value={editAllocPct}
                onChange={(e) => setEditAllocPct(Number(e.target.value))}
              />
              <p className="text-[10px] text-[#64748B] mt-0.5">Enforces strict server-side 100% maximum capacity rule.</p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-4 border-t border-[#E2E8F0]">
              <Button type="button" variant="outline" onClick={() => setEditingMember(null)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-[#0F172A] hover:bg-[#1E293B]">
                Update Allocation
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* E. Member Release Confirmation Dialog */}
      {releasingMember && (
        <ConfirmationDialog
          isOpen={!!releasingMember}
          onClose={() => setReleasingMember(null)}
          onConfirm={handleConfirmRelease}
          title={`Release Employee from Project?`}
          message={`Are you sure you want to release ${releasingMember.employee.fullName} (${releasingMember.employee.employeeCode}) from project ${projectCode}? The assignment record will transition to RELEASED state and their allocation capacity will be freed.`}
          confirmLabel="Release Member"
          isDangerous={true}
        />
      )}

    </div>
  );
}
