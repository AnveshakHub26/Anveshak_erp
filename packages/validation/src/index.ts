import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  rememberMe: z.boolean().optional(),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data: { newPassword?: string; confirmPassword?: string }) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

export const RegisterOrganizationSchema = z.object({
  applicantType: z.enum(['Company', 'Industry']),
  legalName: z.string().min(2, 'Legal name is required'),
  tradeName: z.string().optional(),
  type: z.string().min(1, 'Organization type is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  address: z.string().min(5, 'Registered address is required'),
  primaryContactName: z.string().min(2, 'Primary contact name is required'),
  designation: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
  primaryBvCode: z.string().min(1, 'Primary Business Vertical is required'),
  additionalBvCodes: z.array(z.string()).optional(),
  documentStorageKeys: z.array(z.string()).optional(),
  termsConsent: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data: { password?: string; confirmPassword?: string }) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type RegisterOrganizationInput = z.infer<typeof RegisterOrganizationSchema>;

export const GlobalSearchSchema = z.object({
  q: z.string().min(3, 'Search query must be at least 3 characters'),
  type: z.string().optional(),
  bv: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
});

export type GlobalSearchInput = z.infer<typeof GlobalSearchSchema>;

export const VerifyInvitationSchema = z.object({
  token: z.string().min(1, 'Activation token is required'),
});

export type VerifyInvitationInput = z.infer<typeof VerifyInvitationSchema>;

export const ActivateAccountSchema = z.object({
  token: z.string().min(1, 'Activation token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  termsConsent: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data: { newPassword?: string; confirmPassword?: string }) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type ActivateAccountInput = z.infer<typeof ActivateAccountSchema>;

export const CreateProblemStatementSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long'),
  description: z.string().min(20, 'Description must be at least 20 characters long'),
  bvId: z.string().min(1, 'Business Vertical is required'),
  category: z.string().optional(),
  budgetEstimate: z.string().optional(),
  expectedTimeline: z.string().optional(),
  documentStorageKeys: z.array(z.string()).optional(),
  isDraft: z.boolean().optional(),
});

export type CreateProblemStatementInput = z.infer<typeof CreateProblemStatementSchema>;

export const AdminDecisionSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'REQUEST_CHANGES']),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if ((data.decision === 'REJECT' || data.decision === 'REQUEST_CHANGES') && (!data.reason || !data.reason.trim())) {
      return false;
    }
    return true;
  },
  {
    message: 'A mandatory reason/comment must be provided for Rejection or Change Requests',
    path: ['reason'],
  },
);

export type AdminDecisionInput = z.infer<typeof AdminDecisionSchema>;

export const ProjectQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.string().optional(),
});

export type ProjectQueryInput = z.infer<typeof ProjectQuerySchema>;

export const CreateEmployeeSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  workEmail: z.string().email('Valid work email is required'),
  personalEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  dateOfBirth: z.string().optional().or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  professionalRole: z.string().min(1, 'Professional role (e.g. Professor, Engineer, Developer) is required'),
  department: z.string().min(1, 'Department is required'),
  designation: z.string().min(1, 'Designation is required'),
  category: z.enum(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE']).default('STAFF'),
  employmentType: z.enum(['PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT', 'PART_TIME']).default('PERMANENT'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  skills: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  baseSalary: z.string().optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters long').optional().or(z.literal('')),
  ndaStatus: z.enum(['PENDING', 'SIGNED_PHYSICAL', 'SIGNED_ELECTRONIC', 'EXPIRED']).optional().default('PENDING'),
});

export type CreateEmployeeInput = z.infer<typeof CreateEmployeeSchema>;

export const UpdateEmployeeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  workEmail: z.string().email().optional(),
  personalEmail: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  joiningDate: z.string().optional(),
  address: z.string().optional(),
  professionalRole: z.string().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  category: z.enum(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE']).optional(),
  employmentType: z.enum(['PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT', 'PART_TIME']).optional(),
  status: z.enum(['ONBOARDING', 'PROBATION', 'ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED']).optional(),
  skills: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  baseSalary: z.string().optional(),
  ndaStatus: z.enum(['PENDING', 'SIGNED_PHYSICAL', 'SIGNED_ELECTRONIC', 'EXPIRED']).optional(),
  ndaSignedAt: z.string().optional(),
  password: z.string().optional(),
  remarks: z.string().optional(),
});

export type UpdateEmployeeInput = z.infer<typeof UpdateEmployeeSchema>;

export const RehireEmployeeSchema = z.object({
  joiningDate: z.string().min(1, 'New joining date is required'),
  employmentType: z.enum(['PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT', 'PART_TIME']).default('PERMANENT'),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  remarks: z.string().optional(),
});

export type RehireEmployeeInput = z.infer<typeof RehireEmployeeSchema>;

export const ProjectMemberAssignSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  requirementId: z.string().optional(),
  projectRole: z.string().min(1, 'Project role is required'),
  allocationPct: z.number().min(1).max(100).optional().default(100),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type ProjectMemberAssignInput = z.infer<typeof ProjectMemberAssignSchema>;

export const CreateProjectResourceRequirementSchema = z.object({
  professionalRole: z.string().min(1, 'Professional role is required'),
  category: z.enum(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE']).optional(),
  employmentType: z.enum(['PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT', 'PART_TIME']).optional(),
  requiredCount: z.number().int().min(1, 'Required count must be at least 1').default(1),
  allocationPct: z.number().gt(0, 'Allocation percentage must be greater than 0').lte(100, 'Allocation percentage cannot exceed 100').default(100),
  skills: z.array(z.string()).optional().default([]),
  technologies: z.array(z.string()).optional().default([]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).default('HIGH'),
  notes: z.string().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'End date must not precede start date',
    path: ['endDate'],
  },
);

export type CreateProjectResourceRequirementInput = z.infer<typeof CreateProjectResourceRequirementSchema>;

export const UpdateProjectResourceRequirementSchema = z.object({
  professionalRole: z.string().optional(),
  category: z.enum(['EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE']).optional(),
  employmentType: z.enum(['PERMANENT', 'PROBATIONARY', 'TEMPORARY', 'CONTRACT', 'PART_TIME']).optional(),
  requiredCount: z.number().int().min(1).optional(),
  allocationPct: z.number().gt(0).lte(100).optional(),
  skills: z.array(z.string()).optional(),
  technologies: z.array(z.string()).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  notes: z.string().optional(),
  isFulfilled: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return new Date(data.endDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'End date must not precede start date',
    path: ['endDate'],
  },
);

export type UpdateProjectResourceRequirementInput = z.infer<typeof UpdateProjectResourceRequirementSchema>;

export const CreateProjectMilestoneSchema = z.object({
  title: z.string().min(1, 'Milestone title is required'),
  description: z.string().optional(),
  sequence: z.number().int().min(1, 'Sequence must be at least 1').optional().default(1),
  startDate: z.string().optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  isClientVisible: z.boolean().optional().default(true),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return new Date(data.dueDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'Due date must not precede start date',
    path: ['dueDate'],
  },
);

export type CreateProjectMilestoneInput = z.infer<typeof CreateProjectMilestoneSchema>;

export const UpdateProjectMilestoneSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  sequence: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE']).optional(),
  progressPct: z.number().min(0).max(100).optional(),
  isClientVisible: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return new Date(data.dueDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'Due date must not precede start date',
    path: ['dueDate'],
  },
);

export type UpdateProjectMilestoneInput = z.infer<typeof UpdateProjectMilestoneSchema>;

export const CreateProjectTaskSchema = z.object({
  milestoneId: z.string().optional(),
  assigneeEmployeeId: z.string().min(1, 'Assignee Employee ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional().default('MEDIUM'),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  estimatedHours: z.number().min(0, 'Estimated hours must be non-negative').optional(),
  isClientVisible: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return new Date(data.dueDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'Due date must not precede start date',
    path: ['dueDate'],
  },
);

export type CreateProjectTaskInput = z.infer<typeof CreateProjectTaskSchema>;

export const UpdateProjectTaskSchema = z.object({
  milestoneId: z.string().optional(),
  assigneeEmployeeId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']).optional(),
  startDate: z.string().optional(),
  dueDate: z.string().optional(),
  completedAt: z.string().optional(),
  progressPct: z.number().min(0).max(100).optional(),
  estimatedHours: z.number().min(0).optional(),
  actualHours: z.number().min(0).optional(),
  isClientVisible: z.boolean().optional(),
}).refine(
  (data) => {
    if (data.startDate && data.dueDate) {
      return new Date(data.dueDate) >= new Date(data.startDate);
    }
    return true;
  },
  {
    message: 'Due date must not precede start date',
    path: ['dueDate'],
  },
);

export type UpdateProjectTaskInput = z.infer<typeof UpdateProjectTaskSchema>;

export const CreateProjectDeliverableSchema = z.object({
  milestoneId: z.string().optional(),
  title: z.string().min(1, 'Deliverable title is required'),
  description: z.string().optional(),
  isClientVisible: z.boolean().optional().default(true),
});

export type CreateProjectDeliverableInput = z.infer<typeof CreateProjectDeliverableSchema>;

export const UpdateProjectDeliverableSchema = z.object({
  milestoneId: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED']).optional(),
  isClientVisible: z.boolean().optional(),
  reviewNotes: z.string().optional(),
});

export type UpdateProjectDeliverableInput = z.infer<typeof UpdateProjectDeliverableSchema>;

export const CreateProjectMeetingSchema = z.object({
  title: z.string().min(1, 'Meeting title is required'),
  description: z.string().optional(),
  meetingUrl: z.string().url('Please enter a valid meeting URL'),
  meetingProvider: z.enum(['GOOGLE_MEET', 'MICROSOFT_TEAMS', 'ZOOM', 'OTHER']).optional().default('GOOGLE_MEET'),
  startDateTime: z.string().min(1, 'Start date and time is required'),
  endDateTime: z.string().min(1, 'End date and time is required'),
  isClientVisible: z.boolean().optional().default(false),
  participantEmployeeIds: z.array(z.string()).optional().default([]),
}).refine(
  (data) => {
    if (data.startDateTime && data.endDateTime) {
      return new Date(data.endDateTime) > new Date(data.startDateTime);
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endDateTime'],
  },
);

export type CreateProjectMeetingInput = z.infer<typeof CreateProjectMeetingSchema>;

export const UpdateProjectMeetingSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  meetingUrl: z.string().url().optional(),
  meetingProvider: z.enum(['GOOGLE_MEET', 'MICROSOFT_TEAMS', 'ZOOM', 'OTHER']).optional(),
  startDateTime: z.string().optional(),
  endDateTime: z.string().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).optional(),
  isClientVisible: z.boolean().optional(),
  participantEmployeeIds: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.startDateTime && data.endDateTime) {
      return new Date(data.endDateTime) > new Date(data.startDateTime);
    }
    return true;
  },
  {
    message: 'End time must be after start time',
    path: ['endDateTime'],
  },
);

export type UpdateProjectMeetingInput = z.infer<typeof UpdateProjectMeetingSchema>;

export const CreateProjectResourceLinkSchema = z.object({
  title: z.string().min(1, 'Resource title is required'),
  description: z.string().optional(),
  url: z.string().url('Please enter a valid resource URL'),
  resourceType: z.enum(['GIT_REPOSITORY', 'DESIGN', 'DOCUMENTATION', 'DATASET', 'API', 'CLOUD_STORAGE', 'PROJECT_MANAGEMENT', 'RESEARCH', 'OTHER']).optional().default('OTHER'),
  isClientVisible: z.boolean().optional().default(false),
});

export type CreateProjectResourceLinkInput = z.infer<typeof CreateProjectResourceLinkSchema>;

export const UpdateProjectResourceLinkSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  url: z.string().url().optional(),
  resourceType: z.enum(['GIT_REPOSITORY', 'DESIGN', 'DOCUMENTATION', 'DATASET', 'API', 'CLOUD_STORAGE', 'PROJECT_MANAGEMENT', 'RESEARCH', 'OTHER']).optional(),
  isClientVisible: z.boolean().optional(),
});

export type UpdateProjectResourceLinkInput = z.infer<typeof UpdateProjectResourceLinkSchema>;
