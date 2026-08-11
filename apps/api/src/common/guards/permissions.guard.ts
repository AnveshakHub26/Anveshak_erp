import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.permissions) {
      throw new ForbiddenException('Access denied: User permissions not resolved');
    }

    if (user.roles?.includes('SUPER_ADMIN')) {
      return true;
    }

    const hasPermission = requiredPermissions.every((perm) => user.permissions.includes(perm));
    if (!hasPermission) {
      throw new ForbiddenException(`Access denied: Missing required permission ${requiredPermissions.join(', ')}`);
    }

    return true;
  }
}
