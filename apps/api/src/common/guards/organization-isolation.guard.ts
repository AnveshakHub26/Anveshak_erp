import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class OrganizationIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetOrgId = request.params?.organizationId || request.params?.id || request.body?.organizationId || request.query?.organizationId;

    if (!user) {
      return false;
    }

    // Global administration roles bypass organization scoping
    if (user.roles?.includes('SUPER_ADMIN') || user.roles?.includes('ADMIN') || user.roles?.includes('CRM_STAFF')) {
      return true;
    }

    // Organization Users (ORG_USER) are strictly bound to their assigned organizationId
    if (user.roles?.includes('ORG_USER')) {
      if (targetOrgId && user.organizationId !== targetOrgId) {
        throw new ForbiddenException('Access denied: Unauthorized cross-organization resource access request.');
      }
    }

    return true;
  }
}
