import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('AuthService & Security Verification Suite', () => {
  let service: AuthService;
  let prisma: PrismaService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin@anveshakhub.com',
    passwordHash: '',
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

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock_jwt_access_token'),
  };

  beforeAll(async () => {
    mockUser.passwordHash = await argon2.hash('Admin@Anveshak2026!', { type: argon2.argon2id });
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('1. should verify Argon2id password hashing and successful login', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const result = await service.login({
      email: 'admin@anveshakhub.com',
      password: 'Admin@Anveshak2026!',
    });

    expect(result.success).toBe(true);
    expect(result.user.email).toBe('admin@anveshakhub.com');
    expect(result.mustChangePassword).toBe(true);
    // Verify accessToken is NOT in the response body (HttpOnly cookie only)
    expect((result as any).accessToken).toBeUndefined();
  });

  it('2. should throw UnauthorizedException on invalid password', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      service.login({ email: 'admin@anveshakhub.com', password: 'WrongPassword123!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('3. should throw UnauthorizedException when email is not found', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'nonexistent@anveshakhub.com', password: 'Password123!' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('4. should handle forgot-password with non-leaking security message', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
    mockPrismaService.user.update.mockResolvedValue(mockUser);

    const res = await service.forgotPassword('admin@anveshakhub.com');
    expect(res.message).toContain('If an account exists');
  });

  it('5. should reject invalid password reset token', async () => {
    mockPrismaService.user.findFirst.mockResolvedValue(null);

    await expect(
      service.resetPassword('invalid_reset_token', 'NewPassword2026!'),
    ).rejects.toThrow(BadRequestException);
  });
});
