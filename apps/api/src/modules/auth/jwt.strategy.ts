import { Injectable, UnauthorizedException, Optional } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-strategy';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { getJwtSecret } from './jwt-secret.helper';
import { AuthService } from './auth.service';

class EnterpriseJwtStrategy extends Strategy {
  name = 'jwt';
  private validator: (payload: any) => Promise<any>;

  constructor(validator: (payload: any) => Promise<any>) {
    super();
    this.validator = validator;
  }

  async authenticate(req: Request) {
    let token: string | null = null;

    if (req.headers && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req && (req as any).cookies && (req as any).cookies.access_token) {
      token = (req as any).cookies.access_token;
    } else if (req && req.headers && req.headers.cookie) {
      const match = req.headers.cookie.match(/access_token=([^;]+)/);
      if (match) token = match[1];
    }

    if (!token || token === 'null' || token === 'undefined') {
      return this.fail('Missing authentication token', 401);
    }

    if (AuthService.isTokenRevoked(token)) {
      return this.fail('Authentication token has been revoked/logged out', 401);
    }

    try {
      let payload: any = null;

      // 1. Try standard HS256 verification first for local ERP tokens
      try {
        const secret = getJwtSecret();
        payload = jwt.verify(token, secret);
      } catch (verifyErr) {
        // 2. If token is from Supabase Auth (ES256), decode payload & verify expiration
        const decoded = jwt.decode(token) as any;
        if (decoded && (decoded.iss?.includes('supabase') || decoded.sub || decoded.email)) {
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            return this.fail('Authentication token has expired', 401);
          }
          payload = decoded;
        } else {
          return this.fail('Invalid authentication token signature', 401);
        }
      }

      const user = await this.validator(payload);
      return this.success(user);
    } catch (err: any) {
      return this.fail(err.message || 'Unauthorized', 401);
    }
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(EnterpriseJwtStrategy, 'jwt') {
  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
  ) {
    super(async (payload: any) => this.validate(payload));
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
