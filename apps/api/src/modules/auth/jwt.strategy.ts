import { Injectable, UnauthorizedException, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

const cookieExtractor = (req: Request): string | null => {
  if (req && req.cookies && req.cookies.access_token) {
    return req.cookies.access_token;
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
      secretOrKeyProvider: (req, rawJwtToken, done) => {
        done(null, process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET || 'anveshak_super_secret_jwt_key_change_in_production_2026!');
      },
    });
  }

  async validate(payload: { sub?: string; id?: string; email?: string }) {
    const searchId = payload?.sub || payload?.id;
    const searchEmail = payload?.email?.toLowerCase().trim();

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
