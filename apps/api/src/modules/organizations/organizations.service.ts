import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  private async generateOrgNumber(): Promise<string> {
    const count = await this.prisma.organization.count();
    const nextSeq = (count + 1).toString().padStart(6, '0');
    return `ORG-${nextSeq}`;
  }

  async registerOrganization(data: {
    legalName: string;
    tradeName?: string;
    type: string;
    website?: string;
    address?: string;
    primaryContactName: string;
    designation?: string;
    email: string;
    phone: string;
    password: string;
    primaryBvId: string;
    additionalBvIds?: string[];
  }) {
    const emailLower = data.email.toLowerCase().trim();

    // 1. Check duplicate user email
    const existingUser = await this.prisma.user.findUnique({ where: { email: emailLower } });
    if (existingUser) {
      throw new ConflictException('An account with this email address already exists.');
    }

    // 2. Check duplicate organization legal name
    const existingOrg = await this.prisma.organization.findFirst({
      where: { legalName: { equals: data.legalName.trim(), mode: 'insensitive' } },
    });
    if (existingOrg) {
      throw new ConflictException('An organization with this legal name is already registered.');
    }

    // 3. Resolve ORG_USER role
    const orgUserRole = await this.prisma.role.findUnique({ where: { code: 'ORG_USER' } });
    if (!orgUserRole) {
      throw new BadRequestException('System configuration error: ORG_USER role not found.');
    }

    // 4. Hash password with Argon2id
    const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });

    // 5. Generate human-readable Organization Number
    const orgNumber = await this.generateOrgNumber();

    // 6. Execute atomic creation transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: emailLower,
          passwordHash,
          status: 'PENDING',
          mustChangePassword: false,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: orgUserRole.id,
        },
      });

      const organization = await tx.organization.create({
        data: {
          orgNumber,
          legalName: data.legalName.trim(),
          tradeName: data.tradeName?.trim() || null,
          type: data.type,
          website: data.website || null,
          address: data.address || null,
          primaryBvId: data.primaryBvId,
          status: 'SUBMITTED',
          organizationBvs: {
            create: [
              { bvId: data.primaryBvId, isPrimary: true },
              ...(data.additionalBvIds || []).map((bvId) => ({
                bvId,
                isPrimary: false,
              })),
            ],
          },
        },
        include: {
          primaryBv: true,
          organizationBvs: { include: { businessVertical: true } },
        },
      });

      await tx.organizationUser.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          orgRole: 'PRIMARY_CONTACT',
          status: 'PENDING',
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'REGISTER_ORGANIZATION',
          entityType: 'ORGANIZATION',
          entityId: organization.id,
          afterJson: {
            orgNumber: organization.orgNumber,
            legalName: organization.legalName,
            status: organization.status,
          },
        },
      });

      return { user, organization };
    });

    return {
      orgNumber: result.organization.orgNumber,
      legalName: result.organization.legalName,
      status: result.organization.status,
      primaryContactEmail: result.user.email,
      createdAt: result.organization.createdAt,
    };
  }

  async getRegistrationStatus(orgNumber: string) {
    const org = await this.prisma.organization.findUnique({
      where: { orgNumber: orgNumber.trim() },
      select: {
        orgNumber: true,
        legalName: true,
        status: true,
        createdAt: true,
      },
    });

    if (!org) {
      throw new NotFoundException(`Registration request reference '${orgNumber}' was not found.`);
    }

    return org;
  }

  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { legalName: { contains: search, mode: 'insensitive' as const } },
            { orgNumber: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          primaryBv: true,
          organizationBvs: { include: { businessVertical: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organization.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        primaryBv: true,
        organizationBvs: { include: { businessVertical: true } },
        organizationUsers: { include: { user: true } },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return org;
  }

  async create(data: {
    legalName: string;
    tradeName?: string;
    type: string;
    website?: string;
    address?: string;
    primaryBvId: string;
    additionalBvIds?: string[];
  }) {
    const orgNumber = await this.generateOrgNumber();

    return this.prisma.organization.create({
      data: {
        orgNumber,
        legalName: data.legalName,
        tradeName: data.tradeName,
        type: data.type,
        website: data.website,
        address: data.address,
        primaryBvId: data.primaryBvId,
        status: 'DRAFT',
        organizationBvs: {
          create: [
            { bvId: data.primaryBvId, isPrimary: true },
            ...(data.additionalBvIds || []).map((bvId) => ({
              bvId,
              isPrimary: false,
            })),
          ],
        },
      },
      include: {
        primaryBv: true,
        organizationBvs: true,
      },
    });
  }
}
