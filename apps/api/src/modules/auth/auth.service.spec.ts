import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { getJwtSecret } from './jwt-secret.helper';

describe('AuthService & Supabase Single Auth Authority Suite', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin@anveshakhub.com',
    status: 'ACTIVE',
    mustChangePassword: true,
    passwordResetToken: 'valid_secret_reset_token_123',
    passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
    passwordResetUsed: false,
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
    jest.clearAllMocks();

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
    expect(mockSupabaseService.signInWithPassword).toHaveBeenCalledWith(
      'admin@anveshakhub.com',
      'SupabaseAdminPassword2026!',
    );
  });

  it('2. should throw UnauthorizedException when Supabase Auth fails credentials', async () => {
    mockSupabaseService.signInWithPassword.mockResolvedValueOnce({
      data: null,
      error: new Error('Invalid credentials'),
    });
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

  describe('H-01 Logout Token Invalidation', () => {
    it('should revoke access token on logout so AuthService.isTokenRevoked returns true', async () => {
      const sampleToken = jwt.sign({ sub: 'user-uuid-1' }, getJwtSecret(), { expiresIn: '1h' });
      expect(AuthService.isTokenRevoked(sampleToken)).toBe(false);

      const mockRes: any = { clearCookie: jest.fn() };
      const mockReq: any = { headers: { authorization: `Bearer ${sampleToken}` } };

      await service.logout(mockRes, mockReq);

      expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token');
      expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(AuthService.isTokenRevoked(sampleToken)).toBe(true);
    });
  });

  describe('H-02 Password Reset Security & Bypass Prevention', () => {
    it('STRICTLY REJECTS password reset when a raw userId (UUID) is supplied instead of a token', async () => {
      // In DB, passwordResetToken is 'valid_secret_reset_token_123'
      mockPrismaService.user.findFirst.mockImplementation(({ where }) => {
        if (where.passwordResetToken === 'valid_secret_reset_token_123') {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      });

      // Passing raw userId ('user-uuid-1') must fail because findFirst queries passwordResetToken='user-uuid-1'
      await expect(service.resetPassword('user-uuid-1', 'NewSecurePass123!')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { passwordResetToken: 'user-uuid-1' },
      });
    });

    it('successfully resets password when a valid single-use passwordResetToken is provided', async () => {
      mockPrismaService.user.findFirst.mockImplementation(({ where }) => {
        if (where.passwordResetToken === 'valid_secret_reset_token_123') {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      });
      mockPrismaService.user.update.mockResolvedValue({ ...mockUser, passwordResetUsed: true });

      const res = await service.resetPassword('valid_secret_reset_token_123', 'NewSecurePass123!');
      expect(res.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'user-uuid-1' },
          data: expect.objectContaining({
            passwordResetUsed: true,
            passwordResetToken: null,
          }),
        }),
      );
    });
  });
});
