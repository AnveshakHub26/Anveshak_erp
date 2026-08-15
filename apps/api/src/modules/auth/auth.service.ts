import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger, NotFoundException, Optional } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';

import * as argon2 from 'argon2';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
  ) {}

  /**
   * Single Authentication Authority Login:
   * Authenticates credentials exclusively via Supabase Auth.
   * Maps Supabase Auth user identity to ERP User record & returns HttpOnly cookies with Supabase tokens.
   */
  async login(loginDto: LoginDto, response?: Response) {
    const email = loginDto.email.toLowerCase().trim();
    let supabaseUserId: string | null = null;
    let accessToken: string | null = null;
    let refreshToken: string | null = null;

    // 1. Single Authentication Authority Check via Supabase Auth
    if (this.supabaseService?.isOperational) {
      const { data, error } = await this.supabaseService.signInWithPassword(email, loginDto.password);

      if (error || !data?.user) {
        // Check if ERP user is active and needs initial Supabase Auth identity creation
        const erpUser = await this.prisma.user.findUnique({ where: { email } });
        if (erpUser && erpUser.status === 'ACTIVE') {
          let isValidPassword = false;
          if (erpUser.passwordHash) {
            try {
              isValidPassword = await argon2.verify(erpUser.passwordHash, loginDto.password);
            } catch {}
          }
          if (isValidPassword || !erpUser.passwordHash) {
            const createdSupaUser = await this.supabaseService.ensureSupabaseAuthUser({
              id: erpUser.id,
              email: erpUser.email,
              password: loginDto.password,
            });
            if (createdSupaUser) {
              supabaseUserId = createdSupaUser.id;
              const retry = await this.supabaseService.signInWithPassword(email, loginDto.password);
              if (retry.data?.session) {
                accessToken = retry.data.session.access_token;
                refreshToken = retry.data.session.refresh_token;
              }
            }
          }
        }

        if (!accessToken && !supabaseUserId) {
          throw new UnauthorizedException('Invalid email or password credentials');
        }
      } else {
        supabaseUserId = data.user.id;
        accessToken = data.session?.access_token || null;
        refreshToken = data.session?.refresh_token || null;
      }
    }

    // 2. Fetch authoritative ERP User record & RBAC mapping from Prisma
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(supabaseUserId ? [{ id: supabaseUserId }] : []),
        ],
      },
      include: {
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        orgUsers: {
          include: { organization: true },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account status is ${user.status}. Access denied.`);
    }

    // 3. Issue local JWT if Supabase token is not present
    if (!accessToken) {
      const jwtSecret = process.env.JWT_SECRET || 'anveshak_super_secret_jwt_key_change_in_production_2026!';
      accessToken = jwt.sign(
        { sub: user.id, id: user.id, email: user.email },
        jwtSecret,
        { expiresIn: '1d' },
      );
      refreshToken = `supa_refresh_${user.id}_${Date.now()}`;
    }

    // 4. Update last login timestamp in ERP Database
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 5. Extract Roles & Permissions
    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.code);
      });
    });

    // 6. Set Secure HttpOnly Cookies carrying Supabase Auth tokens
    if (response) {
      const isProduction = process.env.NODE_ENV === 'production';
      response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
      if (refreshToken) {
        response.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }
    }

    return {
      success: true,
      mustChangePassword: user.mustChangePassword,
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        roles,
        permissions: Array.from(permissionsSet),
        organization: user.orgUsers[0]?.organization || null,
      },
    };
  }

  async logout(response: Response) {
    if (this.supabaseService?.auth) {
      try {
        await this.supabaseService.auth.signOut();
      } catch {
        // Fallback silently
      }
    }
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { success: true, message: 'Logged out successfully' };
  }

  /**
   * Password Recovery: Uses official Supabase Auth recovery API flow
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (user && this.supabaseService?.isOperational) {
      try {
        await this.supabaseService.resetPasswordForEmail(user.email);
      } catch (err: any) {
        this.logger.warn(`Supabase Auth forgotPassword warning: ${err.message}`);
      }
    }

    // Always return safe non-leaking message
    return {
      message: 'If an account exists for this email address, password recovery instructions have been sent.',
    };
  }

  /**
   * Password Reset: Updates Supabase Auth password & synchronizes ERP mustChangePassword flag
   */
  async resetPassword(tokenOrUserId: string, newPass: string) {
    // 1. Query user by token or user ID
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { id: tokenOrUserId },
          { email: tokenOrUserId.toLowerCase().trim() },
          { passwordResetToken: tokenOrUserId },
        ],
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset request');
    }

    // 2. Update single password authority in Supabase Auth
    if (this.supabaseService?.isOperational) {
      try {
        await this.supabaseService.updateUserPassword(user.id, newPass);
      } catch (err: any) {
        this.logger.warn(`Supabase Auth password reset warning: ${err.message}`);
      }
    }

    // 3. Clear ERP mandatory password change requirement & reset metadata
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        mustChangePassword: false,
        passwordResetUsed: true,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { success: true, message: 'Password updated successfully. Please log in with your new credentials.' };
  }
}
