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
  legalName: z.string().min(2, 'Legal name is required'),
  tradeName: z.string().optional(),
  type: z.string().min(1, 'Organization type is required'),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  primaryContactName: z.string().min(2, 'Primary contact name is required'),
  designation: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().min(8, 'Phone number is required'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string(),
  primaryBvCode: z.string().min(1, 'Primary Business Vertical is required'),
  additionalBvCodes: z.array(z.string()).optional(),
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
