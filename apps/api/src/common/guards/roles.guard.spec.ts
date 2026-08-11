import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

describe('RolesGuard & RBAC Security Verification', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const createMockContext = (user: any): ExecutionContext => {
    return {
      getHandler: () => {},
      getClass: () => {},
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as any;
  };

  it('1. should allow access if handler has no role requirement', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const ctx = createMockContext({ roles: ['ORG_USER'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('2. should allow SUPER_ADMIN global access', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext({ roles: ['SUPER_ADMIN'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('3. should allow user with required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext({ roles: ['ADMIN'] });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('4. should throw ForbiddenException when user lacks required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
    const ctx = createMockContext({ roles: ['ORG_USER'] });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
