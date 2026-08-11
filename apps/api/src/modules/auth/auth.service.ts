import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  async login(loginDto: LoginDto, response?: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email.toLowerCase() },
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

    const isValid = await this.verifyPassword(loginDto.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid email or password credentials');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException(`Account status is ${user.status}. Access denied.`);
    }

    // Update last login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissionsSet = new Set<string>();
    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.code);
      });
    });

    const permissions = Array.from(permissionsSet);
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    // Set secure HttpOnly cookies if response object is provided
    if (response) {
      const isProduction = process.env.NODE_ENV === 'production';
      response.cookie('access_token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
      response.cookie('refresh_token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    }

    return {
      success: true,
      mustChangePassword: user.mustChangePassword,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        mustChangePassword: user.mustChangePassword,
        roles,
        permissions,
        organization: user.orgUsers[0]?.organization || null,
      },
    };
  }

  async logout(response: Response) {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    return { success: true, message: 'Logged out successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      // Generate 32-byte cryptographically random token
      const rawResetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiration

      // Invalidate prior reset tokens & save new token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: hashedToken,
          passwordResetExpires: expiresAt,
          passwordResetUsed: false,
        },
      });

      // Token rawResetToken would be emailed to user via SES/Resend
    }

    // Always return safe non-leaking message
    return {
      message: 'If an account exists for this email address, password recovery instructions have been sent.',
    };
  }

  async resetPassword(resetToken: string, newPass: string) {
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetUsed: false,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    const newHash = await this.hashPassword(newPass);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        mustChangePassword: false,
        passwordResetUsed: true,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { success: true, message: 'Password reset successfully. Please log in with your new credentials.' };
  }
}
