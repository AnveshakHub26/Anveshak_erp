// Shared TypeScript interfaces and domain types for AnveshakHub Enterprise Application

export enum RoleCode {
  ADMIN = 'ADMIN',
  HR = 'HR',
  FINANCE = 'FINANCE',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  PM = 'PM',
  EXPERT = 'EXPERT',
  INTERN = 'INTERN',
  QA = 'QA',
  LEGAL = 'LEGAL',
  ORG_USER = 'ORG_USER',
}

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum OrgStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
}

export enum ProblemStatementStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
  PUBLISHED = 'PUBLISHED',
  ACCEPTED = 'ACCEPTED',
}

export enum ProjectStatus {
  INITIATED = 'INITIATED',
  RESOURCE_ASSIGNMENT = 'RESOURCE_ASSIGNMENT',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum EmployeeCategory {
  EXPERT = 'EXPERT',
  INTERN = 'INTERN',
  STAFF = 'STAFF',
  EXECUTIVE = 'EXECUTIVE',
}

export enum EmploymentType {
  PERMANENT = 'PERMANENT',
  PROBATIONARY = 'PROBATIONARY',
  TEMPORARY = 'TEMPORARY',
  CONTRACT = 'CONTRACT',
  PART_TIME = 'PART_TIME',
}

export enum EmploymentStatus {
  ONBOARDING = 'ONBOARDING',
  PROBATION = 'PROBATION',
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  RESIGNED = 'RESIGNED',
  TERMINATED = 'TERMINATED',
}

export enum NdaStatus {
  PENDING = 'PENDING',
  SIGNED_PHYSICAL = 'SIGNED_PHYSICAL',
  SIGNED_ELECTRONIC = 'SIGNED_ELECTRONIC',
  EXPIRED = 'EXPIRED',
}

export enum RequirementPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum MilestoneStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  OVERDUE = 'OVERDUE',
}

export enum TaskPriority {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED',
}

export enum DeliverableStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  REVISION_REQUESTED = 'REVISION_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface ProjectResourceRequirement {
  id: string;
  projectId: string;
  professionalRole: string;
  category?: EmployeeCategory;
  employmentType?: EmploymentType;
  requiredCount: number;
  allocationPct: number;
  skills: string[];
  technologies: string[];
  startDate?: string;
  endDate?: string;
  priority: RequirementPriority;
  notes?: string;
  isFulfilled: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  requirementId?: string;
  projectRole: string;
  allocationPct: number;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'RELEASED';
  assignedById: string;
  assignedAt: string;
  removedAt?: string;
  employee?: {
    id: string;
    employeeCode: string;
    fullName: string;
    workEmail: string;
    category: EmployeeCategory;
    employmentType: EmploymentType;
    professionalRole: string;
  };
}

export interface ProjectMilestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  sequence: number;
  startDate?: string;
  dueDate: string;
  completedAt?: string;
  status: MilestoneStatus;
  progressPct: number;
  isClientVisible: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  milestoneId?: string;
  assigneeEmployeeId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  startDate?: string;
  dueDate?: string;
  completedAt?: string;
  progressPct: number;
  estimatedHours?: number;
  actualHours?: number;
  isClientVisible: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDeliverable {
  id: string;
  projectId: string;
  milestoneId?: string;
  title: string;
  description?: string;
  status: DeliverableStatus;
  isClientVisible: boolean;
  submittedById: string;
  submittedAt: string;
  reviewedById?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export enum MeetingProvider {
  GOOGLE_MEET = 'GOOGLE_MEET',
  MICROSOFT_TEAMS = 'MICROSOFT_TEAMS',
  ZOOM = 'ZOOM',
  OTHER = 'OTHER',
}

export enum MeetingStatus {
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REQUESTED = 'REQUESTED',
}

export enum ResourceType {
  GIT_REPOSITORY = 'GIT_REPOSITORY',
  DESIGN = 'DESIGN',
  DOCUMENTATION = 'DOCUMENTATION',
  DATASET = 'DATASET',
  API = 'API',
  CLOUD_STORAGE = 'CLOUD_STORAGE',
  PROJECT_MANAGEMENT = 'PROJECT_MANAGEMENT',
  RESEARCH = 'RESEARCH',
  OTHER = 'OTHER',
}

export interface ProjectMeeting {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  meetingUrl: string;
  meetingProvider: MeetingProvider;
  startDateTime: string;
  endDateTime: string;
  status: MeetingStatus;
  isClientVisible: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  participants?: { employeeId: string; employee: { id: string; employeeCode: string; fullName: string } }[];
}

export interface ProjectResourceLink {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  url: string;
  resourceType: ResourceType;
  isClientVisible: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export enum BusinessVerticalCode {
  BV_01 = 'BV-01', // Research-led Projects
  BV_02 = 'BV-02', // IP and Knowledge Management
  BV_03 = 'BV-03', // Startup Ecosystem
  BV_04 = 'BV-04', // Consulting
  BV_05 = 'BV-05', // Design and Development
  BV_06 = 'BV-06', // Upskilling and Workshops
}

export interface UserPayload {
  id: string;
  email: string;
  status: UserStatus;
  roles: RoleCode[];
  permissions: string[];
  organizationId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  correlationId?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  code: string;
  message: string;
  errors?: Record<string, string[]>;
  correlationId?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
