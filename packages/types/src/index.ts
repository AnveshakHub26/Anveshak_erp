// Shared TypeScript interfaces and domain types for AnveshakHub Enterprise Application

export enum RoleCode {
  ADMIN = 'ADMIN',
  HR = 'HR',
  FINANCE = 'FINANCE',
  SALES = 'SALES',
  PURCHASE = 'PURCHASE',
  CRM_STAFF = 'CRM_STAFF',
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
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
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
