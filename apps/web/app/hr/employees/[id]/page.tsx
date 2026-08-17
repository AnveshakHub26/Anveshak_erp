'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  ChevronLeft,
  UserCheck,
  Building2,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  ShieldCheck,
  FolderGit2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Edit3,
  UserX,
  UserPlus,
  Send,
  FileText,
  History,
  X,
  Plus,
  DollarSign,
} from 'lucide-react';

interface EmployeeDetail {
  id: string;
  employeeCode: string;
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  workEmail: string;
  personalEmail?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  professionalRole: string;
  department: string;
  designation: string;
  category: 'EXPERT' | 'INTERN' | 'STAFF' | 'EXECUTIVE';
  employmentType: 'PERMANENT' | 'PROBATIONARY' | 'TEMPORARY' | 'CONTRACT' | 'PART_TIME';
  status: 'ONBOARDING' | 'PROBATION' | 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED';
  joiningDate: string;
  exitDate?: string;
  skills: string[];
  technologies: string[];
  baseSalary?: number;
  ndaStatus: 'PENDING' | 'SIGNED_PHYSICAL' | 'SIGNED_ELECTRONIC' | 'EXPIRED';
  ndaSignedAt?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    status: string;
    createdAt: string;
  };
  employmentHistory: Array<{
    id: string;
    changeType: string;
    previousStatus?: string;
    newStatus?: string;
    previousDesignation?: string;
    newDesignation?: string;
    previousDepartment?: string;
    newDepartment?: string;
    previousType?: string;
    newType?: string;
    effectiveDate: string;
    remarks?: string;
    createdAt: string;
  }>;
  projectMemberships: Array<{
    id: string;
    role: string;
    allocation: number;
    startDate: string;
    endDate?: string;
    status: string;
    project: {
      id: string;
      projectCode: string;
      title: string;
      status: string;
    };
  }>;
  documents: Array<{
    id: string;
    documentType: string;
    name: string;
    fileUrl: string;
    status: string;
    createdAt: string;
  }>;
}

export default function HREmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;
  const { hasRole } = usePermissions();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const searchParams = useSearchParams();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'skills' | 'nda' | 'history' | 'projects' | 'account'>('profile');

  // Modal States
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRehireModal, setShowRehireModal] = useState(false);
  const [showOffboardModal, setShowOffboardModal] = useState(false);

  useEffect(() => {
    if (!searchParams) return;
    const tabParam = searchParams.get('tab');
    const modalParam = searchParams.get('modal');

    if (tabParam === 'history' || tabParam === 'skills' || tabParam === 'nda' || tabParam === 'projects' || tabParam === 'account') {
      setActiveTab(tabParam as any);
    }
    if (modalParam === 'edit') setShowEditModal(true);
    if (modalParam === 'rehire') setShowRehireModal(true);
    if (modalParam === 'offboard') setShowOffboardModal(true);
  }, [searchParams]);

  // Edit Form State
  const [editForm, setEditForm] = useState<any>({});
  const [submittingAction, setSubmittingAction] = useState(false);

  // Rehire Form State
  const [rehireForm, setRehireForm] = useState({
    joiningDate: new Date().toISOString().split('T')[0],
    employmentType: 'PERMANENT',
    designation: '',
    department: '',
    remarks: 'Employee rehired via HR Portal.',
  });

  // Offboarding Form State
  const [offboardForm, setOffboardForm] = useState({
    status: 'RESIGNED' as 'RESIGNED' | 'TERMINATED',
    exitDate: new Date().toISOString().split('T')[0],
    remarks: 'Employee offboarded via HR Portal.',
  });

  const fetchEmployeeDetail = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: EmployeeDetail }>(`/api/v1/hr/employees/${employeeId}`);
      if (res.data) {
        setEmployee(res.data);
        setEditForm({
          firstName: res.data.firstName,
          lastName: res.data.lastName,
          personalEmail: res.data.personalEmail || '',
          phone: res.data.phone || '',
          dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
          gender: res.data.gender || 'Other',
          address: res.data.address || '',
          professionalRole: res.data.professionalRole,
          department: res.data.department,
          designation: res.data.designation,
          category: res.data.category,
          employmentType: res.data.employmentType,
          status: res.data.status,
          baseSalary: res.data.baseSalary || '',
          ndaStatus: res.data.ndaStatus,
        });
        setRehireForm((prev) => ({
          ...prev,
          designation: res.data.designation,
          department: res.data.department,
        }));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load employee profile.');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    const isAllowed = hasRole('ADMIN') || hasRole('HR');
    if (!isAllowed) {
      router.push('/unauthorized');
      return;
    }
    fetchEmployeeDetail();
  }, [hasRole, router, fetchEmployeeDetail]);

  // Update Profile Handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    setErrorMsg(null);
    try {
      const payload: any = { ...editForm };
      if (payload.baseSalary) payload.baseSalary = parseFloat(payload.baseSalary);
      else delete payload.baseSalary;

      await apiRequest(`/api/v1/hr/employees/${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      setActionSuccess('Employee profile updated successfully.');
      setShowEditModal(false);
      fetchEmployeeDetail();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update employee profile.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Resend Invite Handler
  const handleResendInvite = async () => {
    setSubmittingAction(true);
    setErrorMsg(null);
    try {
      const res = await apiRequest<{ success: boolean; data: any }>(`/api/v1/hr/employees/${employeeId}/resend-invite`, {
        method: 'POST',
      });
      setActionSuccess('Account invitation re-sent to official email.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend activation invitation.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Rehire Handler
  const handleRehireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/api/v1/hr/employees/${employeeId}/rehire`, {
        method: 'POST',
        body: JSON.stringify(rehireForm),
      });

      setActionSuccess(`Employee rehired successfully. Employee Code ${employee?.employeeCode} retained.`);
      setShowRehireModal(false);
      fetchEmployeeDetail();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to rehire employee.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Offboarding Handler
  const handleOffboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAction(true);
    setErrorMsg(null);
    try {
      await apiRequest(`/api/v1/hr/employees/${employeeId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: offboardForm.status,
          exitDate: offboardForm.exitDate,
          remarks: offboardForm.remarks,
        }),
      });

      setActionSuccess(`Employee status updated to ${offboardForm.status}. Account deactivated.`);
      setShowOffboardModal(false);
      fetchEmployeeDetail();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to offboard employee.');
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-[#d49b38]" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-12 text-center text-[#94a3b8]">
        <AlertCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
        <h2 className="text-[#182238] font-bold text-lg">Employee Record Not Found</h2>
        <Link href="/hr">
          <Button className="mt-4 bg-[#d49b38] text-[#151c2e] text-xs">Return to HR Directory</Button>
        </Link>
      </div>
    );
  }

  const isOffboarded = employee.status === 'RESIGNED' || employee.status === 'TERMINATED';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div>
          <Link href="/hr" className="inline-flex items-center text-xs text-[#94a3b8] hover:text-white mb-3 transition-colors">
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to HR Master Directory
          </Link>
        </div>

        {/* Global Notifications */}
        {actionSuccess && (
          <Alert className="border-emerald-500/40 bg-emerald-950/20 text-emerald-400 text-xs flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              <span>{actionSuccess}</span>
            </div>
            <button onClick={() => setActionSuccess(null)} className="hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}

        {errorMsg && (
          <Alert className="border-red-900/50 bg-red-950/30 text-red-400 text-xs flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </Alert>
        )}

        {/* Header Profile Master Banner */}
        <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-[#d49b38] to-[#c48b28] text-[#151c2e] flex items-center justify-center font-black text-xl shadow-lg shadow-[#d49b38]/10 shrink-0">
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-gradient-to-r from-[#d49b38]/20 to-[#c48b28]/10 border border-[#d49b38]/50 px-3 py-1 font-mono font-bold text-[#d49b38] text-sm shadow-sm">
                  {employee.employeeCode}
                </span>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    employee.category === 'EXPERT'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : employee.category === 'INTERN'
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                      : 'bg-gray-500/10 text-gray-300 border border-gray-500/30'
                  }`}
                >
                  {employee.category}
                </span>

                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${
                    employee.employmentType === 'PERMANENT'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}
                >
                  {employee.employmentType}
                </span>

                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    employee.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : employee.status === 'ONBOARDING'
                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                      : employee.status === 'ON_LEAVE'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}
                >
                  {employee.status}
                </span>
              </div>

              <h1 className="text-2xl font-bold text-white tracking-tight">{employee.fullName}</h1>
              <p className="text-xs text-[#94a3b8] flex items-center space-x-2">
                <span>{employee.designation}</span>
                <span>•</span>
                <span>{employee.department}</span>
                <span>•</span>
                <span className="text-[#e2e8f0] font-medium">{employee.professionalRole}</span>
              </p>
            </div>
          </div>

          {/* HR Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowEditModal(true)}
              variant="outline"
              size="sm"
              className="border-[#182238] bg-[#0b101b] text-white hover:bg-[#182238] text-xs"
            >
              <Edit3 className="h-3.5 w-3.5 mr-1.5 text-[#d49b38]" /> Edit Profile
            </Button>

            {employee.user?.status === 'PENDING' && (
              <Button
                onClick={handleResendInvite}
                disabled={submittingAction}
                variant="outline"
                size="sm"
                className="border-[#182238] bg-[#0b101b] text-blue-400 hover:bg-[#182238] text-xs"
              >
                <Send className="h-3.5 w-3.5 mr-1.5" /> Resend Invitation
              </Button>
            )}

            {isOffboarded ? (
              <Button
                onClick={() => setShowRehireModal(true)}
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs shadow-md"
              >
                <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Rehire Employee
              </Button>
            ) : (
              <Button
                onClick={() => setShowOffboardModal(true)}
                variant="outline"
                size="sm"
                className="border-red-900/40 bg-red-950/20 text-red-400 hover:bg-red-900/40 text-xs"
              >
                <UserX className="h-3.5 w-3.5 mr-1.5" /> Offboard Employee
              </Button>
            )}
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center space-x-1 border-b border-[#182238] pb-1 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'profile', label: 'Personal & Employment' },
            { id: 'skills', label: 'Skills & Tech' },
            { id: 'nda', label: 'NDA & Governance' },
            { id: 'history', label: 'Employment History' },
            { id: 'projects', label: 'Projects (Read-Only)' },
            { id: 'account', label: 'Account & Security' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`rounded-t-lg px-4 py-2.5 transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-[#151c2e] text-[#d49b38] border-t-2 border-x border-[#182238] border-t-[#d49b38]'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ========================================== */}
        {/* TAB 1: PERSONAL & PROFESSIONAL DETAILS    */}
        {/* ========================================== */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Details Card */}
            <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
                <UserCheck className="h-4 w-4 text-[#d49b38]" />
                <span>Personal Information</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#94a3b8] block">Full Name</span>
                  <span className="font-semibold text-white">{employee.fullName}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Work Email</span>
                  <span className="font-mono text-white">{employee.workEmail}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Personal Email</span>
                  <span className="text-white">{employee.personalEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Phone</span>
                  <span className="text-white">{employee.phone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Date of Birth</span>
                  <span className="text-white">
                    {employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Gender</span>
                  <span className="text-white">{employee.gender || 'Other'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#94a3b8] block">Residential Address</span>
                  <span className="text-white">{employee.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Professional & Employment Details Card */}
            <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
                <Briefcase className="h-4 w-4 text-[#d49b38]" />
                <span>Professional & Employment Details</span>
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#94a3b8] block">Professional Role</span>
                  <span className="font-semibold text-white">{employee.professionalRole}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Department</span>
                  <span className="font-semibold text-white">{employee.department}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Designation</span>
                  <span className="font-semibold text-white">{employee.designation}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Category</span>
                  <span className="font-semibold text-[#d49b38]">{employee.category}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Employment Type</span>
                  <span className="text-white font-semibold">{employee.employmentType}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Employment Status</span>
                  <span className="text-emerald-400 font-semibold">{employee.status}</span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Joining Date</span>
                  <span className="text-white">
                    {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[#94a3b8] block">Exit Date</span>
                  <span className="text-white">
                    {employee.exitDate ? new Date(employee.exitDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {employee.baseSalary != null && String(employee.baseSalary).trim() !== '' && (
                  <div className="col-span-2 pt-2 border-t border-[#182238] flex items-center justify-between">
                    <span className="text-[#94a3b8]">Base Salary (Confidential):</span>
                    <span className="font-mono font-bold text-[#d49b38] text-sm">
                      ₹{typeof employee.baseSalary === 'number'
                          ? employee.baseSalary.toLocaleString('en-IN')
                          : isNaN(Number(employee.baseSalary))
                          ? employee.baseSalary
                          : Number(employee.baseSalary).toLocaleString('en-IN')} / year
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: SKILLS & TECHNOLOGIES              */}
        {/* ========================================== */}
        {activeTab === 'skills' && (
          <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
              <BadgeCheck className="h-4 w-4 text-[#d49b38]" />
              <span>Skills & Technological Competencies</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[#94a3b8] block mb-2 font-medium">Domain Skills:</span>
                <div className="flex flex-wrap gap-2">
                  {employee.skills.length > 0 ? (
                    employee.skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-blue-400 font-medium"
                      >
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#64748b]">No skills recorded</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#182238]">
                <span className="text-[#94a3b8] block mb-2 font-medium">Technologies & Tools:</span>
                <div className="flex flex-wrap gap-2">
                  {employee.technologies.length > 0 ? (
                    employee.technologies.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-md bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-purple-400 font-medium"
                      >
                        {t}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#64748b]">No technologies recorded</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: NDA & GOVERNANCE                   */}
        {/* ========================================== */}
        {activeTab === 'nda' && (
          <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
              <ShieldCheck className="h-4 w-4 text-[#d49b38]" />
              <span>Non-Disclosure Agreement (NDA) Governance</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#94a3b8] block">Current NDA Status</span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold mt-1 ${
                    employee.ndaStatus === 'SIGNED_ELECTRONIC' || employee.ndaStatus === 'SIGNED_PHYSICAL'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {employee.ndaStatus}
                </span>
              </div>

              <div>
                <span className="text-[#94a3b8] block">Signed Date</span>
                <span className="text-white font-medium mt-1 block">
                  {employee.ndaSignedAt ? new Date(employee.ndaSignedAt).toLocaleDateString() : 'Pending Signature'}
                </span>
              </div>
            </div>

            {/* NDA Documents */}
            <div className="pt-4 border-t border-[#182238] space-y-3">
              <h4 className="text-xs font-semibold text-white">Associated Legal Documents</h4>
              {employee.documents && employee.documents.length > 0 ? (
                <div className="divide-y divide-[#182238] border border-[#182238] rounded-lg bg-[#0b101b]">
                  {employee.documents.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-[#d49b38]" />
                        <span className="text-white font-medium">{doc.name}</span>
                        <span className="text-[10px] text-[#94a3b8]">({doc.documentType})</span>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noreferrer">
                        <Button size="sm" variant="outline" className="border-[#182238] text-xs h-7">
                          Download
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#64748b]">No legal NDA documents attached yet.</div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: EMPLOYMENT HISTORY TIMELINE        */}
        {/* ========================================== */}
        {activeTab === 'history' && (
          <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-sm space-y-6">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
              <History className="h-4 w-4 text-[#d49b38]" />
              <span>Lifelong Employment History & Transition Log</span>
            </h3>

            {employee.employmentHistory && employee.employmentHistory.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 font-mono before:top-2 before:bottom-2 before:w-0.5 before:bg-[#182238]">
                {employee.employmentHistory.map((hist) => (
                  <div key={hist.id} className="relative text-xs space-y-1">
                    <div className="absolute -left-[23px] top-0 h-4 w-4 rounded-full bg-[#d49b38] border-2 border-[#151c2e]" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#d49b38]">{hist.changeType}</span>
                      <span className="text-[11px] text-[#94a3b8]">
                        Effective: {new Date(hist.effectiveDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="text-[#e2e8f0]">
                      {hist.previousStatus && (
                        <span>Status: {hist.previousStatus} → <span className="text-emerald-400 font-semibold">{hist.newStatus}</span></span>
                      )}
                      {hist.previousDesignation && (
                        <span> | Designation: {hist.previousDesignation} → <span className="text-white font-semibold">{hist.newDesignation}</span></span>
                      )}
                      {hist.previousType && (
                        <span> | Type: {hist.previousType} → <span className="text-purple-400 font-semibold">{hist.newType}</span></span>
                      )}
                    </div>

                    {hist.remarks && (
                      <div className="text-[11px] text-[#94a3b8] italic">
                        "{hist.remarks}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#64748b] text-center py-6">No historical transitions recorded yet.</div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: PROJECT ASSIGNMENTS (READ-ONLY)    */}
        {/* ========================================== */}
        {activeTab === 'projects' && (
          <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#182238] pb-3">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
                <FolderGit2 className="h-4 w-4 text-[#d49b38]" />
                <span>Project Resource Allocation History</span>
              </h3>
              <span className="text-[11px] text-[#94a3b8] bg-[#0b101b] px-3 py-1 rounded-full border border-[#182238]">
                Read-Only (Resource Management)
              </span>
            </div>

            <p className="text-xs text-[#94a3b8]">
              Project member allocation is managed exclusively by Project Managers under Project Resource Management.
            </p>

            {employee.projectMemberships && employee.projectMemberships.length > 0 ? (
              <div className="overflow-x-auto rounded-lg border border-[#182238] bg-[#0b101b]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#151c2e] text-[#94a3b8] text-[10px] uppercase border-b border-[#182238]">
                    <tr>
                      <th className="px-4 py-3">Project Code</th>
                      <th className="px-4 py-3">Project Title</th>
                      <th className="px-4 py-3">Assigned Role</th>
                      <th className="px-4 py-3">Allocation %</th>
                      <th className="px-4 py-3">Start Date</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182238] text-white">
                    {employee.projectMemberships.map((pm) => (
                      <tr key={pm.id}>
                        <td className="px-4 py-3 font-mono font-bold text-[#d49b38]">{pm.project.projectCode}</td>
                        <td className="px-4 py-3 font-medium">{pm.project.title}</td>
                        <td className="px-4 py-3">{pm.role}</td>
                        <td className="px-4 py-3 font-mono">{pm.allocation}%</td>
                        <td className="px-4 py-3">{new Date(pm.startDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-emerald-400 font-semibold">{pm.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-xs text-[#64748b] text-center py-8">
                Employee is currently not allocated to any projects.
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: ACCOUNT & SECURITY                  */}
        {/* ========================================== */}
        {activeTab === 'account' && (
          <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 border-b border-[#182238] pb-3">
              <ShieldCheck className="h-4 w-4 text-[#d49b38]" />
              <span>ERP User Account & Security Status</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[#94a3b8] block">User Account ID</span>
                <span className="font-mono text-white">{employee.user?.id}</span>
              </div>
              <div>
                <span className="text-[#94a3b8] block">Official Email</span>
                <span className="font-mono text-white">{employee.user?.email}</span>
              </div>
              <div>
                <span className="text-[#94a3b8] block">Account Status</span>
                <span className="font-bold text-emerald-400">{employee.user?.status}</span>
              </div>
              <div>
                <span className="text-[#94a3b8] block">Account Provisioned Date</span>
                <span className="text-white">
                  {employee.user?.createdAt ? new Date(employee.user.createdAt).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* EDIT PROFILE MODAL                                                  */}
        {/* =================================================================== */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-2xl rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between border-b border-[#182238] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Edit3 className="h-4 w-4 text-[#d49b38]" />
                  <span>Edit Employee Master Profile</span>
                </h3>
                <button onClick={() => setShowEditModal(false)} className="text-[#94a3b8] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#94a3b8] mb-1">First Name</label>
                    <input
                      type="text"
                      value={editForm.firstName || ''}
                      onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94a3b8] mb-1">Last Name</label>
                    <input
                      type="text"
                      value={editForm.lastName || ''}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94a3b8] mb-1">Professional Role</label>
                    <input
                      type="text"
                      value={editForm.professionalRole || ''}
                      onChange={(e) => setEditForm({ ...editForm, professionalRole: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94a3b8] mb-1">Department</label>
                    <input
                      type="text"
                      value={editForm.department || ''}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94a3b8] mb-1">Designation</label>
                    <input
                      type="text"
                      value={editForm.designation || ''}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[#94a3b8] mb-1">Category</label>
                    <select
                      value={editForm.category || 'STAFF'}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    >
                      <option value="EXPERT">EXPERT</option>
                      <option value="INTERN">INTERN</option>
                      <option value="STAFF">STAFF</option>
                      <option value="EXECUTIVE">EXECUTIVE</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#94a3b8] mb-1">Employment Type</label>
                    <select
                      value={editForm.employmentType || 'PERMANENT'}
                      onChange={(e) => setEditForm({ ...editForm, employmentType: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    >
                      <option value="PERMANENT">PERMANENT</option>
                      <option value="TEMPORARY">TEMPORARY</option>
                      <option value="PROBATIONARY">PROBATIONARY</option>
                      <option value="CONTRACT">CONTRACT</option>
                      <option value="PART_TIME">PART TIME</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#94a3b8] mb-1">NDA Status</label>
                    <select
                      value={editForm.ndaStatus || 'PENDING'}
                      onChange={(e) => setEditForm({ ...editForm, ndaStatus: e.target.value })}
                      className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="SIGNED_PHYSICAL">SIGNED PHYSICAL</option>
                      <option value="SIGNED_ELECTRONIC">SIGNED ELECTRONIC</option>
                      <option value="EXPIRED">EXPIRED</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#182238]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowEditModal(false)}
                    className="border-[#182238] bg-[#0b101b] text-white"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingAction} className="bg-[#d49b38] text-[#151c2e] font-semibold">
                    Save Profile Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REHIRE EMPLOYEE MODAL                                               */}
        {/* =================================================================== */}
        {showRehireModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-xl border border-emerald-500/40 bg-[#151c2e] p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-[#182238] pb-3">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <UserPlus className="h-4 w-4 text-emerald-400" />
                  <span>Rehire Former Employee</span>
                </h3>
                <button onClick={() => setShowRehireModal(false)} className="text-[#94a3b8] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-3 text-[11px] text-emerald-400">
                Rehire reuses permanent Employee Code <span className="font-bold font-mono">{employee.employeeCode}</span> and reactivates the existing Employee master record.
              </div>

              <form onSubmit={handleRehireSubmit} className="space-y-3">
                <div>
                  <label className="block text-[#94a3b8] mb-1">Rehire Effective Joining Date *</label>
                  <input
                    type="date"
                    required
                    value={rehireForm.joiningDate}
                    onChange={(e) => setRehireForm({ ...rehireForm, joiningDate: e.target.value })}
                    className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1">Employment Type</label>
                  <select
                    value={rehireForm.employmentType}
                    onChange={(e) => setRehireForm({ ...rehireForm, employmentType: e.target.value })}
                    className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                  >
                    <option value="PERMANENT">PERMANENT</option>
                    <option value="TEMPORARY">TEMPORARY</option>
                    <option value="PROBATIONARY">PROBATIONARY</option>
                    <option value="CONTRACT">CONTRACT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1">Designation</label>
                  <input
                    type="text"
                    value={rehireForm.designation}
                    onChange={(e) => setRehireForm({ ...rehireForm, designation: e.target.value })}
                    className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1">Rehire Remarks</label>
                  <input
                    type="text"
                    value={rehireForm.remarks}
                    onChange={(e) => setRehireForm({ ...rehireForm, remarks: e.target.value })}
                    className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#182238]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowRehireModal(false)}
                    className="border-[#182238] bg-[#0b101b] text-white"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingAction} className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                    Confirm Rehire
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* OFFBOARDING CONFIRMATION MODAL                                      */}
        {/* =================================================================== */}
        {showOffboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="w-full max-w-lg rounded-xl border border-red-900/50 bg-[#151c2e] p-6 shadow-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-red-900/40 pb-3">
                <h3 className="text-sm font-bold text-red-400 flex items-center space-x-2">
                  <UserX className="h-4 w-4" />
                  <span>Offboard Employee</span>
                </h3>
                <button onClick={() => setShowOffboardModal(false)} className="text-[#94a3b8] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-3 text-[11px] text-red-300">
                Offboarding deactivates ERP user login access. All historical records, documents, and permanent Employee Code <span className="font-bold font-mono">{employee.employeeCode}</span> are 100% retained.
              </div>

              <form onSubmit={handleOffboardSubmit} className="space-y-3">
                <div>
                  <label className="block text-[#94a3b8] mb-1">Offboarding Reason *</label>
                  <select
                    value={offboardForm.status}
                    onChange={(e) => setOffboardForm({ ...offboardForm, status: e.target.value as any })}
                    className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                  >
                    <option value="RESIGNED">RESIGNED</option>
                    <option value="TERMINATED">TERMINATED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1">Exit Date *</label>
                  <input
                    type="date"
                    required
                    value={offboardForm.exitDate}
                    onChange={(e) => setOffboardForm({ ...offboardForm, exitDate: e.target.value })}
                    className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                  />
                </div>

                <div>
                  <label className="block text-[#94a3b8] mb-1">Offboarding Remarks</label>
                  <input
                    type="text"
                    value={offboardForm.remarks}
                    onChange={(e) => setOffboardForm({ ...offboardForm, remarks: e.target.value })}
                    className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-3 border-t border-[#182238]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowOffboardModal(false)}
                    className="border-[#182238] bg-[#0b101b] text-white"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submittingAction} className="bg-red-600 hover:bg-red-700 text-white font-semibold">
                    Confirm Offboarding
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
