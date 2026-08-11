import { OrganizationIsolationGuard } from './organization-isolation.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('OrganizationIsolationGuard Verification', () => {
  let guard: OrganizationIsolationGuard;

  beforeEach(() => {
    guard = new OrganizationIsolationGuard();
  });

  const createMockContext = (user: any, params: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user, params }),
      }),
    } as any;
  };

  it('1. should allow ORG_USER to access their own assigned organization ID', () => {
    const ctx = createMockContext(
      { roles: ['ORG_USER'], organizationId: 'org-a-123' },
      { id: 'org-a-123' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('2. should block ORG_USER trying to access Organization B (403 Forbidden)', () => {
    const ctx = createMockContext(
      { roles: ['ORG_USER'], organizationId: 'org-a-123' },
      { id: 'org-b-456' },
    );
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('3. should allow ADMIN role to access any target organization ID', () => {
    const ctx = createMockContext(
      { roles: ['ADMIN'], organizationId: 'org-a-123' },
      { id: 'org-b-456' },
    );
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
