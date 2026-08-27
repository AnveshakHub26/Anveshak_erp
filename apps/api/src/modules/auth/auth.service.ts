import { Injectable, UnauthorizedException, BadRequestException, ConflictException, Logger, NotFoundException, Optional } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import { getJwtSecret } from './jwt-secret.helper';

import * as argon2 from 'argon2';

import { EmailService } from '../../common/email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
    @Optional() private emailService?: EmailService,
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
              const retryLogin = await this.supabaseService.signInWithPassword(email, loginDto.password);
              if (retryLogin.data?.session) {
                supabaseUserId = retryLogin.data.user.id;
                accessToken = retryLogin.data.session.access_token;
                refreshToken = retryLogin.data.session.refresh_token;
              }
            }
          }
        }
      } else {
        supabaseUserId = data.user.id;
        accessToken = data.session.access_token;
        refreshToken = data.session.refresh_token;
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
      throw new UnauthorizedException('Account registration pending approval or deactivated.');
    }

    if (!accessToken && user.passwordHash) {
      const isValid = await argon2.verify(user.passwordHash, loginDto.password);
      if (!isValid) {
        throw new UnauthorizedException('Invalid email or password credentials');
      }
      accessToken = jwt.sign(
        { sub: user.id, email: user.email },
        getJwtSecret(),
        { expiresIn: '1d' },
      );
    }

    if (!accessToken) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    // Extract roles & permissions
    const roles = user.userRoles.map((ur) => (ur.role.code || ur.role.name || '').toUpperCase());
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.code || `${rp.permission.resource}:${rp.permission.action}`);
      });
    });

    if (response) {
      const isProd = process.env.NODE_ENV === 'production';
      response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
      });
      if (refreshToken) {
        response.cookie('refresh_token', refreshToken, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
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

  // H-01: Server-side Token Revocation Store for Logged-Out Tokens
  private static readonly revokedTokens = new Map<string, number>();

  public static revokeToken(token: string) {
    if (!token) return;
    const decoded = jwt.decode(token) as any;
    const exp = decoded?.exp ? decoded.exp * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    AuthService.revokedTokens.set(token, exp);

    // Periodic cleanup of expired tokens
    if (AuthService.revokedTokens.size > 1000) {
      const now = Date.now();
      for (const [t, expiry] of AuthService.revokedTokens.entries()) {
        if (expiry < now) AuthService.revokedTokens.delete(t);
      }
    }
  }

  public static isTokenRevoked(token: string): boolean {
    if (!token) return false;
    const expiry = AuthService.revokedTokens.get(token);
    if (!expiry) return false;
    if (expiry < Date.now()) {
      AuthService.revokedTokens.delete(token);
      return false;
    }
    return true;
  }

  async logout(response: Response, request?: any) {
    let tokenToRevoke: string | null = null;
    if (request) {
      if (request.headers?.authorization?.startsWith('Bearer ')) {
        tokenToRevoke = request.headers.authorization.split(' ')[1];
      } else if (request.cookies?.access_token) {
        tokenToRevoke = request.cookies.access_token;
      } else if (request.headers?.cookie) {
        const match = request.headers.cookie.match(/access_token=([^;]+)/);
        if (match) tokenToRevoke = match[1];
      }
    }

    if (tokenToRevoke) {
      AuthService.revokeToken(tokenToRevoke);
    }

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
   * Password Recovery: Generates single-use reset token and enqueues async EmailLog job
   */
  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (user) {
      if (this.supabaseService?.isOperational) {
        try {
          await this.supabaseService.resetPasswordForEmail(user.email);
        } catch (err: any) {
          this.logger.warn(`Supabase Auth forgotPassword warning: ${err.message}`);
        }
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
          passwordResetUsed: false,
        },
      });

      if (this.emailService) {
        await this.emailService.sendPasswordResetEmail(user.email, resetToken);
      }
    }

    // Always return safe non-leaking message
    return {
      message: 'If an account exists for this email address, password recovery instructions have been sent.',
    };
  }

  /**
   * Password Reset (H-02 Fix): Validates token expiration & single-use state.
   * REQUIRES a valid, unexpired, single-use passwordResetToken.
   * User IDs (UUIDs) are STRICTLY REJECTED to prevent password reset bypass vulnerabilities.
   */
  async resetPassword(token: string, newPass: string) {
    if (!token || typeof token !== 'string' || !token.trim()) {
      throw new BadRequestException('Invalid or missing password reset token.');
    }

    const cleanToken = token.trim();

    // H-02 Security: Query user STRICTLY by passwordResetToken. Never allow raw userId lookup.
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: cleanToken,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token.');
    }

    if (user.passwordResetExpires && new Date(user.passwordResetExpires) < new Date()) {
      throw new BadRequestException('Password reset token has expired. Please request a new reset link.');
    }

    if (user.passwordResetUsed) {
      throw new BadRequestException('Password reset token has already been used.');
    }

    // 2. Update single password authority in Supabase Auth
    if (this.supabaseService?.isOperational) {
      try {
        await this.supabaseService.updateUserPassword(user.id, newPass);
      } catch (err: any) {
        this.logger.warn(`Supabase Auth password reset warning: ${err.message}`);
      }
    }

    // 3. Update local Argon2 password hash & clear reset token state
    const passwordHash = await argon2.hash(newPass);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        mustChangePassword: false,
        passwordResetUsed: true,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { success: true, message: 'Password updated successfully. Please log in with your new credentials.' };
  }
}
