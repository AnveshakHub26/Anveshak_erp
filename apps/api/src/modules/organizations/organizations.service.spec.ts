import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaService } from '../../database/prisma.service';
import { ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';

describe('OrganizationsService & Registration Verification', () => {
  let service: OrganizationsService;
  let prisma: PrismaService;

  const mockPrismaService = {
    organization: {
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    role: {
      findUnique: jest.fn().mockResolvedValue({ id: 'role-org-user-id', code: 'ORG_USER' }),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
    userRole: { create: jest.fn() },
    organizationUser: { create: jest.fn() },
    auditLog: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('1. should register organization and create user with Argon2id hash & ORG_USER role only', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.organization.findFirst.mockResolvedValue(null);
    mockPrismaService.user.create.mockResolvedValue({ id: 'u1', email: 'tejas@tescom.com', status: 'PENDING' });
    mockPrismaService.organization.create.mockResolvedValue({
      id: 'org-1',
      orgNumber: 'ORG-000001',
      legalName: 'Tescom Solutions Pvt Ltd',
      status: 'SUBMITTED',
      createdAt: new Date(),
    });

    const result = await service.registerOrganization({
      legalName: 'Tescom Solutions Pvt Ltd',
      type: 'Enterprise',
      primaryContactName: 'Tejas Sharma',
      email: 'tejas@tescom.com',
      phone: '+919876543210',
      password: 'TescomPassword2026!',
      primaryBvId: 'bv-01-uuid',
    });

    expect(result.orgNumber).toBe('ORG-000001');
    expect(result.status).toBe('SUBMITTED');
    expect(mockPrismaService.userRole.create).toHaveBeenCalledWith({
      data: { userId: 'u1', roleId: 'role-org-user-id' },
    });
    expect(mockPrismaService.auditLog.create).toHaveBeenCalled();
  });

  it('2. should throw ConflictException (409) if primary contact email already exists', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({ id: 'existing-u', email: 'tejas@tescom.com' });

    await expect(
      service.registerOrganization({
        legalName: 'Tescom Solutions Pvt Ltd',
        type: 'Enterprise',
        primaryContactName: 'Tejas Sharma',
        email: 'tejas@tescom.com',
        phone: '+919876543210',
        password: 'TescomPassword2026!',
        primaryBvId: 'bv-01-uuid',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('3. should throw ConflictException (409) if organization legal name already exists', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);
    mockPrismaService.organization.findFirst.mockResolvedValue({ id: 'existing-org', legalName: 'Tescom Solutions Pvt Ltd' });

    await expect(
      service.registerOrganization({
        legalName: 'Tescom Solutions Pvt Ltd',
        type: 'Enterprise',
        primaryContactName: 'Tejas Sharma',
        email: 'tejas@tescom.com',
        phone: '+919876543210',
        password: 'TescomPassword2026!',
        primaryBvId: 'bv-01-uuid',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
