import { Injectable, NotFoundException, ConflictException, BadRequestException, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { EmailService } from '../../common/email/email.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

@Injectable()
export class OrganizationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
    @Optional() private emailService?: EmailService,
  ) {}

  private async generateOrgNumber(): Promise<string> {
    const count = await this.prisma.organization.count();
    const nextSeq = (count + 1).toString().padStart(6, '0');
    return `ORG-${nextSeq}`;
  }

  async registerOrganization(data: {
    applicantType?: string;
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
    documentStorageKeys?: string[];
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

    // 3. Check duplicate website domain if provided
    if (data.website && data.website.trim()) {
      const cleanWebsite = data.website.trim().toLowerCase();
      const existingDomain = await this.prisma.organization.findFirst({
        where: { website: { equals: cleanWebsite, mode: 'insensitive' } },
      });
      if (existingDomain) {
        throw new ConflictException('An organization with this website domain is already registered.');
      }
    }

    // 4. Resolve ORG_USER role
    const orgUserRole = await this.prisma.role.findUnique({ where: { code: 'ORG_USER' } });
    if (!orgUserRole) {
      throw new BadRequestException('System configuration error: ORG_USER role not found.');
    }

    // 5. Hash password with Argon2id
    const passwordHash = await argon2.hash(data.password, { type: argon2.argon2id });

    // 6. Generate human-readable Organization Number
    const orgNumber = await this.generateOrgNumber();

    // 7. Execute atomic creation transaction
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
          applicantType: data.applicantType || 'Company',
          type: data.type,
          website: data.website?.trim() || null,
          address: data.address?.trim() || null,
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

      // Link any uploaded registration documents to the organization entity
      if (data.documentStorageKeys && data.documentStorageKeys.length > 0) {
        for (const storageKey of data.documentStorageKeys) {
          await tx.document.create({
            data: {
              entityType: 'Organization',
              entityId: organization.id,
              type: 'Registration',
              storageKey,
              visibility: 'PRIVATE',
              uploadedBy: user.id,
            },
          });
        }
      }

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
            applicantType: data.applicantType || 'Company',
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

  async findAll(page = 1, limit = 20, search?: string, status?: string, type?: string) {
    const skip = (page - 1) * limit;
    const whereAnd: any[] = [];

    if (search && search.trim()) {
      whereAnd.push({
        OR: [
          { legalName: { contains: search.trim(), mode: 'insensitive' as const } },
          { orgNumber: { contains: search.trim(), mode: 'insensitive' as const } },
          { tradeName: { contains: search.trim(), mode: 'insensitive' as const } },
        ],
      });
    }

    if (status && status.trim()) {
      whereAnd.push({ status: status.trim() as any });
    }

    if (type && type.trim()) {
      whereAnd.push({ type: { equals: type.trim(), mode: 'insensitive' as const } });
    }

    const where = whereAnd.length > 0 ? { AND: whereAnd } : {};

    const [items, total] = await Promise.all([
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        include: {
          primaryBv: true,
          organizationBvs: { include: { businessVertical: true } },
          organizationUsers: { include: { user: true } },
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

    // Fetch attached compliance/registration documents for this organization
    const documents = await this.prisma.document.findMany({
      where: { entityType: 'Organization', entityId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...org,
      documents,
    };
  }

  async processDecision(
    id: string,
    adminUserId: string,
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    reason?: string,
  ) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: { organizationUsers: { include: { user: true } } },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }

    // State transition guard: block decisions on applications already in final states
    if (org.status === 'APPROVED' || org.status === 'REJECTED') {
      throw new BadRequestException(
        `Cannot process decision on organization '${org.legalName}' because it is already in final state '${org.status}'.`,
      );
    }

    if (decision === 'REJECT' && (!reason || !reason.trim())) {
      throw new BadRequestException('A reason is mandatory when rejecting an organization onboarding request.');
    }

    if (decision === 'REQUEST_CHANGES' && (!reason || !reason.trim())) {
      throw new BadRequestException('A detailed comment is mandatory when requesting changes on an onboarding request.');
    }

    const primaryOrgUser = org.organizationUsers.find((ou) => ou.orgRole === 'PRIMARY_CONTACT') || org.organizationUsers[0];
    const primaryUserId = primaryOrgUser?.userId;

    let targetOrgStatus: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
    let targetUserStatus: 'ACTIVE' | 'INACTIVE' | 'PENDING';
    let auditAction: string;

    let activationToken: string | null = null;
    let activationExpires: Date | null = null;

    if (decision === 'APPROVE') {
      targetOrgStatus = 'APPROVED';
      targetUserStatus = 'ACTIVE';
      auditAction = 'APPROVE_ORGANIZATION';
      activationToken = crypto.randomBytes(32).toString('hex');
      activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    } else if (decision === 'REJECT') {
      targetOrgStatus = 'REJECTED';
      targetUserStatus = 'INACTIVE';
      auditAction = 'REJECT_ORGANIZATION';
    } else {
      targetOrgStatus = 'CHANGES_REQUESTED';
      targetUserStatus = 'PENDING';
      auditAction = 'REQUEST_ORGANIZATION_CHANGES';
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrg = await tx.organization.update({
        where: { id },
        data: { status: targetOrgStatus },
      });

      if (primaryUserId) {
        await tx.user.update({
          where: { id: primaryUserId },
          data: {
            status: targetUserStatus,
            activationToken: decision === 'APPROVE' ? activationToken : undefined,
            activationExpires: decision === 'APPROVE' ? activationExpires : undefined,
            activationUsed: decision === 'APPROVE' ? true : false,
          },
        });

        await tx.organizationUser.updateMany({
          where: { organizationId: id, userId: primaryUserId },
          data: { status: targetUserStatus },
        });

        // Supabase Auth status update if active
        if (this.supabaseService?.isOperational && this.supabaseService?.getClient()) {
          try {
            const client = this.supabaseService.getClient();
            await client?.auth.admin.updateUserById(primaryUserId, {
              user_metadata: { erp_status: targetUserStatus },
            });
          } catch {}
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: auditAction,
          entityType: 'ORGANIZATION',
          entityId: id,
          beforeJson: { status: org.status },
          afterJson: {
            status: targetOrgStatus,
            decision,
            reason: reason?.trim() || null,
            decidedBy: adminUserId,
            activationToken: decision === 'APPROVE' ? activationToken : null,
          },
        },
      });

      if (primaryUserId) {
        let notifMessage = `Your organization (${org.legalName}) onboarding request has been `;
        if (decision === 'APPROVE') {
          notifMessage += 'APPROVED. Your account is ACTIVE. You can now log in using your email and password.';
        } else if (decision === 'REJECT') {
          notifMessage += `REJECTED. Reason: ${reason?.trim()}`;
        } else {
          notifMessage += `returned for changes. Action required: ${reason?.trim()}`;
        }

        await tx.notification.create({
          data: {
            recipientUserId: primaryUserId,
            eventType: `ORG_${targetOrgStatus}`,
            entityType: 'ORGANIZATION',
            entityId: id,
            message: notifMessage,
          },
        });
      }

      return updatedOrg;
    });

    // Dispatch Account Approval Email Notification via centralized EmailService (asynchronously queued)
    if (decision === 'APPROVE' && primaryOrgUser?.user?.email && this.emailService) {
      await this.emailService.sendOrganizationApprovalEmail(
        primaryOrgUser.user.email,
        org.legalName,
        org.orgNumber,
      );
    }

    return {
      ...result,
      message:
        decision === 'APPROVE'
          ? `Organization '${org.legalName}' approved. Account activated & approval email sent to ${primaryOrgUser?.user?.email}.`
          : `Decision '${decision}' processed for organization '${org.legalName}'.`,
    };
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

  /**
   * DELETE /api/v1/organizations/:id — Admin deletion of organization record and associated user accounts
   */
  async deleteOrganization(id: string, adminUserId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        organizationUsers: { include: { user: true } },
      },
    });

    if (!org) {
      throw new NotFoundException(`Organization with ID '${id}' not found.`);
    }

    const userIdsToDelete = org.organizationUsers.map((ou) => ou.userId);

    await this.prisma.$transaction(async (tx) => {
      // 1. Delete documents attached to this organization
      await tx.document.deleteMany({
        where: { entityType: 'Organization', entityId: id },
      });

      // 2. Delete organization business vertical links
      await tx.organizationBusinessVertical.deleteMany({
        where: { organizationId: id },
      });

      // 3. Delete organization user links
      await tx.organizationUser.deleteMany({
        where: { organizationId: id },
      });

      // 4. Delete organization record
      await tx.organization.delete({
        where: { id },
      });

      // 5. Delete associated users (and their roles/notifications)
      for (const uid of userIdsToDelete) {
        const otherOrgUsers = await tx.organizationUser.count({ where: { userId: uid } });
        if (otherOrgUsers === 0) {
          await tx.notification.deleteMany({ where: { recipientUserId: uid } });
          await tx.userRole.deleteMany({ where: { userId: uid } });
          await tx.user.delete({ where: { id: uid } });

          // Supabase Auth user teardown
          if (this.supabaseService?.isOperational && this.supabaseService?.getClient()) {
            try {
              const client = this.supabaseService.getClient();
              await client?.auth.admin.deleteUser(uid);
            } catch {}
          }
        }
      }

      // 6. Record Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: 'DELETE_ORGANIZATION',
          entityType: 'ORGANIZATION',
          entityId: id,
          afterJson: { legalName: org.legalName, orgNumber: org.orgNumber, deletedBy: adminUserId },
        },
      });
    });

    return {
      success: true,
      message: `Organization '${org.legalName}' (${org.orgNumber}) and associated user accounts deleted successfully.`,
    };
  }
}
