import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';

describe('AuthService & Supabase Single Auth Authority Suite', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin@anveshakhub.com',
    status: 'ACTIVE',
    mustChangePassword: true,
    userRoles: [
      {
        role: {
          code: 'ADMIN',
          rolePermissions: [{ permission: { code: 'organization:read' } }],
        },
      },
    ],
    orgUsers: [],
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockSupabaseService = {
    isOperational: true,
    signInWithPassword: jest.fn().mockResolvedValue({
      data: {
        user: { id: 'user-uuid-1', email: 'admin@anveshakhub.com' },
        session: { access_token: 'supa_access_token', refresh_token: 'supa_refresh_token' },
      },
      error: null,
    }),
    resetPasswordForEmail: jest.fn().mockResolvedValue({ data: {}, error: null }),
    updateUserPassword: jest.fn().mockResolvedValue({ data: {}, error: null }),
    ensureSupabaseAuthUser: jest.fn().mockResolvedValue({ id: 'user-uuid-1', email: 'admin@anveshakhub.com' }),
    auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: SupabaseService, useValue: mockSupabaseService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('1. should perform successful single Supabase Auth login', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
    mockPrismaService.user.update.mockResolvedValue(mockUser);

    const result = await service.login({
      email: 'admin@anveshakhub.com',
      password: 'SupabaseAdminPassword2026!',
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('admin@anveshakhub.com');
    expect(result.mustChangePassword).toBe(true);
    expect(mockSupabaseService.signInWithPassword).toHaveBeenCalledWith('admin@anveshakhub.com', 'SupabaseAdminPassword2026!');
  });

  it('2. should throw UnauthorizedException when Supabase Auth fails credentials', async () => {
    mockSupabaseService.signInWithPassword.mockResolvedValueOnce({ data: null, error: new Error('Invalid credentials') });
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'admin@anveshakhub.com', password: 'WrongPassword123!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('3. should handle forgot-password using Supabase Auth recovery API', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const res = await service.forgotPassword('admin@anveshakhub.com');
    expect(res.message).toContain('If an account exists');
    expect(mockSupabaseService.resetPasswordForEmail).toHaveBeenCalledWith('admin@anveshakhub.com');
  });

  it('4. should reject invalid password reset request', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword('invalid_reset_token', 'NewPassword2026!'),
    ).rejects.toThrow(BadRequestException);
  });
});
