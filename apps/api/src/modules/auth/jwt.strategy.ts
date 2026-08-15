import { Injectable, UnauthorizedException, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
  }
  if (req && req.headers && req.headers.cookie) {
    const match = req.headers.cookie.match(/access_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_SECRET || 'anveshak_super_secret_jwt_key_change_in_production_2026!',
    });
  }

  async validate(payload: any) {
    let searchId: string | undefined;
    let searchEmail: string | undefined;

    if (typeof payload === 'string') {
      const decoded = jwt.decode(payload) as any;
      searchId = decoded?.sub || decoded?.id;
      searchEmail = decoded?.email?.toLowerCase().trim();
    } else if (payload && typeof payload === 'object') {
      searchId = payload.sub || payload.id;
      searchEmail = payload.email?.toLowerCase().trim();
    }

    if (!searchId && !searchEmail) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(searchId ? [{ id: searchId }] : []),
          ...(searchEmail ? [{ email: searchEmail }] : []),
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
        orgUsers: true,
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is inactive or suspended');
    }

    const roles = user.userRoles.map((ur) => ur.role.code);
    const permissionsSet = new Set<string>();

    user.userRoles.forEach((ur) => {
      ur.role.rolePermissions.forEach((rp) => {
        permissionsSet.add(rp.permission.code);
      });
    });

    return {
      id: user.id,
      email: user.email,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      roles,
      permissions: Array.from(permissionsSet),
      organizationId: user.orgUsers[0]?.organizationId || null,
    };
  }
}
