'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { apiRequest } from '@/lib/api-client';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import {
  UserPlus,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Download,
  X,
  Plus,
  ShieldCheck,
  Building2,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Layers,
} from 'lucide-react';

export default function HROnboardPage() {
  const router = useRouter();
  const { hasRole } = usePermissions();

  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');

  // ==========================================
  // SINGLE ONBOARDING WIZARD STATE
  // ==========================================
  const [step, setStep] = useState(1);
  const [singleForm, setSingleForm] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    personalEmail: '',
    phone: '',
    dateOfBirth: '',
    gender: 'Other',
    address: '',
    professionalRole: 'Developer',
    department: 'Research & Development',
    designation: 'Software Developer',
    category: 'STAFF' as 'EXPERT' | 'INTERN' | 'STAFF' | 'EXECUTIVE',
    employmentType: 'PERMANENT' as 'PERMANENT' | 'PROBATIONARY' | 'TEMPORARY' | 'CONTRACT' | 'PART_TIME',
    joiningDate: new Date().toISOString().split('T')[0],
    baseSalary: '',
    ndaStatus: 'PENDING' as 'PENDING' | 'SIGNED_PHYSICAL' | 'SIGNED_ELECTRONIC' | 'EXPIRED',
  });

  const [skills, setSkills] = useState<string[]>(['Thermal Coatings', 'CAD Design']);
  const [newSkill, setNewSkill] = useState('');
  const [technologies, setTechnologies] = useState<string[]>(['React', 'NestJS', 'Python']);
  const [newTech, setNewTech] = useState('');

  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);
  const [singleSuccess, setSingleSuccess] = useState<any | null>(null);

  // ==========================================
  // BULK ONBOARDING STATE
  // ==========================================
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [bulkRows, setBulkRows] = useState<any[]>([]);
  const [bulkErrors, setBulkErrors] = useState<string[]>([]);
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<any[] | null>(null);

  useEffect(() => {
    const isAllowed = hasRole('ADMIN') || hasRole('HR');
    if (!isAllowed) {
      router.push('/unauthorized');
    }
  }, [hasRole, router]);

  // Skill & Tech Tag Handlers
  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (tag: string) => {
    setSkills(skills.filter((s) => s !== tag));
  };

  const addTech = () => {
    if (newTech.trim() && !technologies.includes(newTech.trim())) {
      setTechnologies([...technologies, newTech.trim()]);
      setNewTech('');
    }
  };

  const removeTech = (tag: string) => {
    setTechnologies(technologies.filter((t) => t !== tag));
  };

  // Step 1 Validation
  const validateStep1 = () => {
    if (!singleForm.firstName.trim() || !singleForm.lastName.trim()) {
      setSingleError('First Name and Last Name are required.');
      return false;
    }
    if (!singleForm.workEmail.trim() || !singleForm.workEmail.includes('@')) {
      setSingleError('A valid official Work Email is required.');
      return false;
    }
    setSingleError(null);
    return true;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!singleForm.professionalRole.trim()) {
      setSingleError('Professional Role is required.');
      return false;
    }
    if (!singleForm.department.trim()) {
      setSingleError('Department is required.');
      return false;
    }
    if (!singleForm.designation.trim()) {
      setSingleError('Designation is required.');
      return false;
    }
    if (!singleForm.joiningDate) {
      setSingleError('Joining Date is required.');
      return false;
    }
    setSingleError(null);
    return true;
  };

  // Single Form Submit Handler
  const handleSingleSubmit = async () => {
    setSubmittingSingle(true);
    setSingleError(null);
    try {
      const payload = {
        ...singleForm,
        skills,
        technologies,
      };

      const res = await apiRequest<{ success: boolean; data: any }>('/api/v1/hr/employees', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.data) {
        setSingleSuccess(res.data);
      }
    } catch (err: any) {
      setSingleError(err.message || 'Failed to onboard employee.');
    } finally {
      setSubmittingSingle(false);
    }
  };

  // CSV Template Downloader
  const downloadCsvTemplate = () => {
    const headers = [
      'firstName',
      'lastName',
      'workEmail',
      'personalEmail',
      'phone',
      'dateOfBirth',
      'gender',
      'address',
      'professionalRole',
      'department',
      'designation',
      'category',
      'employmentType',
      'joiningDate',
      'skills',
      'technologies',
    ];
    const sampleRow = [
      'Rahul',
      'Sharma',
      'rahul.sharma@anveshak.com',
      'rahul.personal@gmail.com',
      '+919876543210',
      '1992-05-15',
      'Male',
      'Bangalore, India',
      'Researcher',
      'R&D',
      'Senior Scientist',
      'EXPERT',
      'PERMANENT',
      '2026-08-15',
      'Thermal Coatings;CAD',
      'ANSYS;Python',
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), sampleRow.join(',')].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'anveshak_hr_bulk_onboarding_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV File Upload & Parser
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setBulkErrors([]);
    setBulkSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) {
        setBulkErrors(['CSV file is empty or missing data rows.']);
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim());
      const parsedRows: any[] = [];
      const validationErrors: string[] = [];
      const emailSet = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        const rowObj: any = {};

        headers.forEach((h, idx) => {
          rowObj[h] = values[idx] || '';
        });

        const email = rowObj.workEmail?.toLowerCase();
        if (!email || !email.includes('@')) {
          validationErrors.push(`Row ${i}: Invalid or missing workEmail.`);
        } else if (emailSet.has(email)) {
          validationErrors.push(`Row ${i}: Duplicate workEmail '${email}' inside CSV.`);
        } else {
          emailSet.add(email);
        }

        if (!rowObj.firstName || !rowObj.lastName) {
          validationErrors.push(`Row ${i}: Missing firstName or lastName.`);
        }
        if (!rowObj.professionalRole || !rowObj.department || !rowObj.designation) {
          validationErrors.push(`Row ${i}: Missing professionalRole, department, or designation.`);
        }

        rowObj._skillsArray = rowObj.skills ? rowObj.skills.split(';').map((s: string) => s.trim()) : [];
        rowObj._techArray = rowObj.technologies ? rowObj.technologies.split(';').map((t: string) => t.trim()) : [];

        parsedRows.push(rowObj);
      }

      if (parsedRows.length > 50) {
        validationErrors.push('Bulk onboarding limit is 50 employees per batch.');
      }

      setBulkRows(parsedRows);
      setBulkErrors(validationErrors);
    };

    reader.readAsText(file);
  };

  // Bulk Submit Handler
  const handleBulkSubmit = async () => {
    if (bulkErrors.length > 0) return;
    setSubmittingBulk(true);
    try {
      const employeesPayload = bulkRows.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        workEmail: r.workEmail,
        personalEmail: r.personalEmail || undefined,
        phone: r.phone || undefined,
        dateOfBirth: r.dateOfBirth || undefined,
        gender: r.gender || 'Other',
        address: r.address || undefined,
        professionalRole: r.professionalRole,
        department: r.department,
        designation: r.designation,
        category: (r.category as any) || 'STAFF',
        employmentType: (r.employmentType as any) || 'PERMANENT',
        joiningDate: r.joiningDate || new Date().toISOString().split('T')[0],
        skills: r._skillsArray,
        technologies: r._techArray,
        ndaStatus: 'PENDING',
      }));

      const res = await apiRequest<{ success: boolean; data: any[] }>('/api/v1/hr/employees/bulk-onboard', {
        method: 'POST',
        body: JSON.stringify({ employees: employeesPayload }),
      });

      if (res.data) {
        setBulkSuccess(res.data);
      }
    } catch (err: any) {
      setBulkErrors([err.message || 'Failed to process bulk onboarding batch.']);
    } finally {
      setSubmittingBulk(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#182238] pb-6">
          <div>
            <Link
              href="/hr"
              className="inline-flex items-center text-xs text-[#94a3b8] hover:text-white mb-2 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to HR Directory
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center space-x-3">
              <UserPlus className="h-6 w-6 text-[#d49b38]" />
              <span>Employee Workforce Onboarding</span>
            </h1>
            <p className="text-xs text-[#94a3b8] mt-1">
              Onboard individual employees or provision bulk workforce joiners with automatic permanent ID generation
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center space-x-1 rounded-xl bg-[#0b101b] p-1 border border-[#182238]">
            <button
              onClick={() => setActiveTab('single')}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'single'
                  ? 'bg-[#d49b38] text-[#151c2e] shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Single Onboarding</span>
            </button>
            <button
              onClick={() => setActiveTab('bulk')}
              className={`flex items-center space-x-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                activeTab === 'bulk'
                  ? 'bg-[#d49b38] text-[#151c2e] shadow-md'
                  : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Bulk CSV Onboarding</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: SINGLE EMPLOYEE ONBOARDING WIZARD                            */}
        {/* =================================================================== */}
        {activeTab === 'single' && (
          <div className="space-y-6">
            {/* Success State Screen */}
            {singleSuccess ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-8 text-center space-y-6 shadow-xl">
                <div className="h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <CheckCircle2 className="h-8 w-8" />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-white">Employee Onboarded & Account Provisioned!</h2>
                  <p className="text-xs text-[#94a3b8] mt-1">
                    An activation invitation has been generated and dispatched to the official email.
                  </p>
                </div>

                <div className="max-w-md mx-auto rounded-xl border border-[#182238] bg-[#0b101b] p-5 text-left text-xs space-y-3 font-mono">
                  <div className="flex justify-between border-b border-[#182238] pb-2">
                    <span className="text-[#94a3b8]">Permanent Employee ID:</span>
                    <span className="font-bold text-[#d49b38] text-sm">{singleSuccess.employeeCode}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#182238] pb-2">
                    <span className="text-[#94a3b8]">Employee Name:</span>
                    <span className="text-white font-semibold">{singleSuccess.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#182238] pb-2">
                    <span className="text-[#94a3b8]">Work Email:</span>
                    <span className="text-white">{singleSuccess.workEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#94a3b8]">Provisioning Status:</span>
                    <span className="text-emerald-400 font-semibold">{singleSuccess.provisioningStatus}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-4 pt-4">
                  <Link href="/hr">
                    <Button variant="outline" className="border-[#182238] bg-[#151c2e] text-white hover:bg-[#182238] text-xs">
                      View HR Directory
                    </Button>
                  </Link>
                  <Button
                    onClick={() => {
                      setSingleSuccess(null);
                      setStep(1);
                    }}
                    className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-semibold text-xs"
                  >
                    Onboard Another Employee
                  </Button>
                </div>
              </div>
            ) : (
              /* Wizard Steps Indicator */
              <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-sm space-y-6">
                <div className="grid grid-cols-5 gap-2 border-b border-[#182238] pb-4">
                  {[
                    { num: 1, label: '1. Personal' },
                    { num: 2, label: '2. Professional' },
                    { num: 3, label: '3. Skills & Tech' },
                    { num: 4, label: '4. Governance' },
                    { num: 5, label: '5. Review & Submit' },
                  ].map((s) => (
                    <div
                      key={s.num}
                      className={`text-center py-2 text-xs font-semibold rounded-lg transition-colors ${
                        step === s.num
                          ? 'bg-[#d49b38] text-[#151c2e]'
                          : step > s.num
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-[#0b101b] text-[#94a3b8]'
                      }`}
                    >
                      {s.label}
                    </div>
                  ))}
                </div>

                {singleError && (
                  <Alert className="border-red-900/50 bg-red-950/30 text-red-400 text-xs">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span>{singleError}</span>
                  </Alert>
                )}

                {/* STEP 1: Personal Information */}
                {step === 1 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="text-sm font-semibold text-white">Step 1: Personal & Contact Information</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#94a3b8] mb-1">First Name *</label>
                        <input
                          type="text"
                          required
                          value={singleForm.firstName}
                          onChange={(e) => setSingleForm({ ...singleForm, firstName: e.target.value })}
                          placeholder="e.g. John"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Last Name *</label>
                        <input
                          type="text"
                          required
                          value={singleForm.lastName}
                          onChange={(e) => setSingleForm({ ...singleForm, lastName: e.target.value })}
                          placeholder="e.g. Doe"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Official Work Email *</label>
                        <input
                          type="email"
                          required
                          value={singleForm.workEmail}
                          onChange={(e) => setSingleForm({ ...singleForm, workEmail: e.target.value })}
                          placeholder="john.doe@anveshak.com"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Personal Email (Optional)</label>
                        <input
                          type="email"
                          value={singleForm.personalEmail}
                          onChange={(e) => setSingleForm({ ...singleForm, personalEmail: e.target.value })}
                          placeholder="john.personal@gmail.com"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Phone Number</label>
                        <input
                          type="text"
                          value={singleForm.phone}
                          onChange={(e) => setSingleForm({ ...singleForm, phone: e.target.value })}
                          placeholder="+91 98765 43210"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Date of Birth</label>
                        <input
                          type="date"
                          value={singleForm.dateOfBirth}
                          onChange={(e) => setSingleForm({ ...singleForm, dateOfBirth: e.target.value })}
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Gender</label>
                        <select
                          value={singleForm.gender}
                          onChange={(e) => setSingleForm({ ...singleForm, gender: e.target.value })}
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Residential Address</label>
                        <input
                          type="text"
                          value={singleForm.address}
                          onChange={(e) => setSingleForm({ ...singleForm, address: e.target.value })}
                          placeholder="City, Country"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={() => {
                          if (validateStep1()) setStep(2);
                        }}
                        className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-semibold text-xs"
                      >
                        Next: Professional Info <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Professional Information */}
                {step === 2 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="text-sm font-semibold text-white">Step 2: Professional Role & Classification</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[#94a3b8] mb-1">Professional Role *</label>
                        <input
                          type="text"
                          required
                          value={singleForm.professionalRole}
                          onChange={(e) => setSingleForm({ ...singleForm, professionalRole: e.target.value })}
                          placeholder="e.g. Professor, PhD Scholar, Developer, Researcher, Engineer, Scientist"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                        <div className="text-[10px] text-[#64748b] mt-1">
                          Presets: Professor, PhD Scholar, Developer, Researcher, Engineer, Scientist
                        </div>
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Department *</label>
                        <input
                          type="text"
                          required
                          value={singleForm.department}
                          onChange={(e) => setSingleForm({ ...singleForm, department: e.target.value })}
                          placeholder="e.g. Research & Development, Engineering, IT"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Designation *</label>
                        <input
                          type="text"
                          required
                          value={singleForm.designation}
                          onChange={(e) => setSingleForm({ ...singleForm, designation: e.target.value })}
                          placeholder="e.g. Lead Scientist, Senior Software Developer"
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Employee Category *</label>
                        <select
                          value={singleForm.category}
                          onChange={(e) => setSingleForm({ ...singleForm, category: e.target.value as any })}
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        >
                          <option value="EXPERT">EXPERT (Domain Specialist)</option>
                          <option value="INTERN">INTERN (Trainee/Scholar)</option>
                          <option value="STAFF">STAFF (Regular Operations)</option>
                          <option value="EXECUTIVE">EXECUTIVE (Leadership)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Employment Type *</label>
                        <select
                          value={singleForm.employmentType}
                          onChange={(e) => setSingleForm({ ...singleForm, employmentType: e.target.value as any })}
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        >
                          <option value="PERMANENT">PERMANENT</option>
                          <option value="TEMPORARY">TEMPORARY</option>
                          <option value="PROBATIONARY">PROBATIONARY</option>
                          <option value="CONTRACT">CONTRACT</option>
                          <option value="PART_TIME">PART TIME</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[#94a3b8] mb-1">Joining Date *</label>
                        <input
                          type="date"
                          required
                          value={singleForm.joiningDate}
                          onChange={(e) => setSingleForm({ ...singleForm, joiningDate: e.target.value })}
                          className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(1)}
                        className="border-[#182238] bg-[#0b101b] text-[#94a3b8] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button
                        onClick={() => {
                          if (validateStep2()) setStep(3);
                        }}
                        className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-semibold text-xs"
                      >
                        Next: Skills & Tech <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Skills & Technologies */}
                {step === 3 && (
                  <div className="space-y-6 text-xs">
                    <h3 className="text-sm font-semibold text-white">Step 3: Core Skills & Technologies</h3>
                    <p className="text-[#94a3b8]">
                      These competency tags will be used by Project Managers for automated resource matching & project team assignment.
                    </p>

                    {/* Skills Tag Input */}
                    <div>
                      <label className="block text-[#94a3b8] mb-1">Domain Skills & Competencies</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          placeholder="e.g. Thermal Coatings, Finite Element Analysis, Project Management"
                          className="flex-1 rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                        <Button type="button" onClick={addSkill} className="bg-[#182238] text-white hover:bg-[#202c48]">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {skills.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-blue-400"
                          >
                            {s}
                            <button onClick={() => removeSkill(s)} className="ml-1.5 hover:text-red-400">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Technologies Tag Input */}
                    <div>
                      <label className="block text-[#94a3b8] mb-1">Technologies & Tools</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newTech}
                          onChange={(e) => setNewTech(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTech())}
                          placeholder="e.g. ANSYS, Python, React, MATLAB"
                          className="flex-1 rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                        />
                        <Button type="button" onClick={addTech} className="bg-[#182238] text-white hover:bg-[#202c48]">
                          <Plus className="h-4 w-4 mr-1" /> Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-1">
                        {technologies.map((t) => (
                          <span
                            key={t}
                            className="inline-flex items-center rounded-md bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 text-purple-400"
                          >
                            {t}
                            <button onClick={() => removeTech(t)} className="ml-1.5 hover:text-red-400">
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(2)}
                        className="border-[#182238] bg-[#0b101b] text-[#94a3b8] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button
                        onClick={() => setStep(4)}
                        className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-semibold text-xs"
                      >
                        Next: NDA Governance <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 4: NDA & Governance */}
                {step === 4 && (
                  <div className="space-y-4 text-xs">
                    <h3 className="text-sm font-semibold text-white">Step 4: NDA Governance & Legal Status</h3>

                    <div>
                      <label className="block text-[#94a3b8] mb-1">Non-Disclosure Agreement (NDA) Status</label>
                      <select
                        value={singleForm.ndaStatus}
                        onChange={(e) => setSingleForm({ ...singleForm, ndaStatus: e.target.value as any })}
                        className="w-full rounded-lg border border-[#182238] bg-[#0b101b] px-3 py-2 text-white focus:border-[#d49b38] focus:outline-none"
                      >
                        <option value="PENDING">PENDING (Electronic Invite to be sent)</option>
                        <option value="SIGNED_PHYSICAL">SIGNED PHYSICALLY (Hardcopy signed in office)</option>
                        <option value="SIGNED_ELECTRONIC">SIGNED ELECTRONICALLY (e-Signature complete)</option>
                        <option value="EXPIRED">EXPIRED</option>
                      </select>
                    </div>

                    <div className="rounded-lg border border-[#182238] bg-[#0b101b] p-4 text-[11px] text-[#94a3b8]">
                      <ShieldCheck className="h-5 w-5 text-[#d49b38] mb-2" />
                      <p>
                        HR can record physical paper signatures or dispatch an electronic NDA invitation. Signed documents will be linked directly to the employee profile.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(3)}
                        className="border-[#182238] bg-[#0b101b] text-[#94a3b8] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                      </Button>
                      <Button
                        onClick={() => setStep(5)}
                        className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-semibold text-xs"
                      >
                        Next: Review Summary <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* STEP 5: Review & Submit */}
                {step === 5 && (
                  <div className="space-y-6 text-xs">
                    <h3 className="text-sm font-semibold text-white">Step 5: Review Summary & Submit</h3>

                    <div className="rounded-xl border border-[#182238] bg-[#0b101b] p-5 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[#94a3b8] block">Full Name:</span>
                          <span className="font-semibold text-white">{singleForm.firstName} {singleForm.lastName}</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8] block">Official Work Email:</span>
                          <span className="font-semibold text-white">{singleForm.workEmail}</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8] block">Professional Role:</span>
                          <span className="font-semibold text-white">{singleForm.professionalRole}</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8] block">Department & Designation:</span>
                          <span className="font-semibold text-white">{singleForm.designation} ({singleForm.department})</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8] block">Category & Type:</span>
                          <span className="font-semibold text-[#d49b38]">{singleForm.category} — {singleForm.employmentType}</span>
                        </div>
                        <div>
                          <span className="text-[#94a3b8] block">NDA Status:</span>
                          <span className="font-semibold text-emerald-400">{singleForm.ndaStatus}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#182238]">
                        <span className="text-[#94a3b8] block mb-1">Skills:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {skills.map((s) => (
                            <span key={s} className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setStep(4)}
                        disabled={submittingSingle}
                        className="border-[#182238] bg-[#0b101b] text-[#94a3b8] hover:text-white"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Edit Information
                      </Button>
                      <Button
                        onClick={handleSingleSubmit}
                        disabled={submittingSingle}
                        className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-bold text-xs shadow-lg"
                      >
                        {submittingSingle ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Provisioning ERP Account...
                          </>
                        ) : (
                          <>
                            Submit & Provision Account <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: BULK CSV ONBOARDING                                          */}
        {/* =================================================================== */}
        {activeTab === 'bulk' && (
          <div className="space-y-6">
            {bulkSuccess ? (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-6 space-y-4 shadow-xl text-xs">
                <div className="flex items-center space-x-3 text-emerald-400 font-bold text-base border-b border-emerald-500/30 pb-3">
                  <CheckCircle2 className="h-6 w-6" />
                  <span>Bulk Onboarding Completed Successfully!</span>
                </div>
                <p className="text-[#94a3b8]">
                  Total {bulkSuccess.length} employee accounts provisioned atomically with unique sequential EMP-YYYY-NNNNNN IDs.
                </p>

                <div className="overflow-x-auto rounded-lg border border-[#182238] bg-[#0b101b]">
                  <table className="w-full text-left font-mono">
                    <thead className="bg-[#151c2e] text-[#94a3b8] text-[10px] uppercase">
                      <tr>
                        <th className="px-4 py-2">Assigned Employee Code</th>
                        <th className="px-4 py-2">Work Email</th>
                        <th className="px-4 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#182238] text-white text-[11px]">
                      {bulkSuccess.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 font-bold text-[#d49b38]">{item.employeeCode}</td>
                          <td className="px-4 py-2">{item.workEmail}</td>
                          <td className="px-4 py-2 text-emerald-400">{item.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <Link href="/hr">
                    <Button className="bg-[#d49b38] text-[#151c2e] font-semibold text-xs">
                      Return to HR Directory
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#182238] bg-[#151c2e] p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#182238] pb-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">Bulk Employee Provisioning Portal</h2>
                    <p className="text-xs text-[#94a3b8] mt-0.5">
                      Upload a formatted CSV file to onboard up to 50 employees atomically.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCsvTemplate}
                    className="border-[#182238] bg-[#0b101b] text-[#d49b38] hover:bg-[#182238] text-xs"
                  >
                    <Download className="h-4 w-4 mr-2" /> Download CSV Template
                  </Button>
                </div>

                {/* File Dropzone */}
                <div className="rounded-xl border-2 border-dashed border-[#182238] bg-[#0b101b] p-8 text-center space-y-3 hover:border-[#d49b38]/50 transition-colors">
                  <Upload className="h-8 w-8 mx-auto text-[#d49b38]" />
                  <div className="text-xs text-white font-medium">
                    {csvFile ? csvFile.name : 'Select or Drop CSV File here'}
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label htmlFor="csv-file-input">
                    <Button type="button" size="sm" className="bg-[#182238] text-white hover:bg-[#202c48] text-xs">
                      Browse File
                    </Button>
                  </label>
                </div>

                {/* Validation Errors Box */}
                {bulkErrors.length > 0 && (
                  <Alert className="border-red-900/50 bg-red-950/30 text-red-400 text-xs">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <div className="space-y-1">
                      <div className="font-semibold">Batch Validation Failed — Please resolve before submission:</div>
                      <ul className="list-disc pl-4 space-y-0.5">
                        {bulkErrors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  </Alert>
                )}

                {/* Preview Table */}
                {bulkRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-white font-semibold">
                      <span>Batch Preview ({bulkRows.length} Joiners)</span>
                      <span className="text-[#94a3b8] font-normal text-[11px]">
                        Valid rows ready for atomic creation
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-[#182238] bg-[#0b101b]">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#151c2e] text-[#94a3b8] text-[10px] uppercase">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Work Email</th>
                            <th className="px-3 py-2">Role</th>
                            <th className="px-3 py-2">Dept</th>
                            <th className="px-3 py-2">Category</th>
                            <th className="px-3 py-2">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#182238] text-white text-[11px]">
                          {bulkRows.map((r, i) => (
                            <tr key={i} className="hover:bg-[#182238]/40">
                              <td className="px-3 py-2 text-[#94a3b8]">{i + 1}</td>
                              <td className="px-3 py-2 font-medium">{r.firstName} {r.lastName}</td>
                              <td className="px-3 py-2 font-mono text-[#d49b38]">{r.workEmail}</td>
                              <td className="px-3 py-2">{r.professionalRole}</td>
                              <td className="px-3 py-2">{r.department}</td>
                              <td className="px-3 py-2">{r.category}</td>
                              <td className="px-3 py-2">{r.employmentType}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-3">
                      <Button
                        onClick={handleBulkSubmit}
                        disabled={submittingBulk || bulkErrors.length > 0}
                        className="bg-[#d49b38] hover:bg-[#c48b28] text-[#151c2e] font-bold text-xs shadow-lg"
                      >
                        {submittingBulk ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Provisioning Batch...
                          </>
                        ) : (
                          <>
                            Confirm & Provision Batch ({bulkRows.length}) <ArrowRight className="h-4 w-4 ml-1" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
  );
}
