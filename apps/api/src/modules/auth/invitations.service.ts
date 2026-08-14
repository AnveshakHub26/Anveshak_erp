import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import * as argon2 from 'argon2';

@Injectable()
export class InvitationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
  ) {}

  async verifyToken(token: string) {
    if (!token || !token.trim()) {
      throw new BadRequestException('Activation token is required.');
    }

    const tokenClean = token.trim();
    const user = await this.prisma.user.findFirst({
      where: { activationToken: tokenClean },
      include: {
        orgUsers: {
          include: { organization: true },
        },
        employeeProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Invitation token is invalid or not found.');
    }

    if (user.activationUsed) {
      throw new BadRequestException('This activation token has already been used. Please log in directly.');
    }

    if (user.activationExpires && user.activationExpires < new Date()) {
      throw new BadRequestException('This activation token has expired. Please contact system administration.');
    }

    const org = user.orgUsers[0]?.organization;
    const isEmployee = !!user.employeeProfile;

    if (!isEmployee && (!org || org.status !== 'APPROVED')) {
      throw new BadRequestException('Organization approval is not in APPROVED state. Account activation cannot proceed.');
    }

    return {
      valid: true,
      email: user.email,
      legalName: isEmployee ? 'AnveshakHub Enterprise Workforce' : (org?.legalName || 'AnveshakHub'),
      orgNumber: isEmployee ? (user.employeeProfile?.employeeCode || 'EMPLOYEE') : (org?.orgNumber || 'SYS'),
      token: tokenClean,
    };
  }

  async activateAccount(data: {
    token: string;
    newPassword: string;
    termsConsent: boolean;
  }) {
    if (!data.termsConsent) {
      throw new BadRequestException('You must accept the terms and conditions to activate your account.');
    }

    // 1. Verify Token & Eligibility
    const verification = await this.verifyToken(data.token);

    const user = await this.prisma.user.findFirst({
      where: { activationToken: data.token.trim() },
      include: { orgUsers: true },
    });

    if (!user) {
      throw new NotFoundException('Invitation token is invalid or not found.');
    }

    // 2. Hash Password for ERP DB Integrity
    const passwordHash = await argon2.hash(data.newPassword, { type: argon2.argon2id });

    // 3. Provision / Update Supabase Auth Credential
    if (this.supabaseService?.isOperational && this.supabaseService?.getClient()) {
      try {
        const client = this.supabaseService.getClient();
        await client?.auth.admin.updateUserById(user.id, {
          password: data.newPassword,
          email_confirm: true,
          user_metadata: { erp_status: 'ACTIVE', must_change_password: false },
        });
      } catch (err: any) {
        // Fallback: Ensure auth user exists and set password
        await this.supabaseService.ensureSupabaseAuthUser({
          id: user.id,
          email: user.email,
          password: data.newPassword,
        });
      }
    }

    // 4. Atomic Database Updates
    const primaryOrgId = user.orgUsers[0]?.organizationId;

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          status: 'ACTIVE',
          passwordHash,
          activationUsed: true,
          activationToken: null,
          mustChangePassword: false,
        },
      });

      if (primaryOrgId) {
        await tx.organizationUser.updateMany({
          where: { organizationId: primaryOrgId, userId: user.id },
          data: { status: 'ACTIVE' },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'ACTIVATE_ACCOUNT',
          entityType: 'USER',
          entityId: user.id,
          afterJson: {
            email: user.email,
            organizationId: primaryOrgId,
            status: 'ACTIVE',
          },
        },
      });
    });

    return {
      success: true,
      message: 'Account activation completed successfully. You may now sign in.',
    };
  }
}
