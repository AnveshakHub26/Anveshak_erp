import { AuditInterceptor } from './audit.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('AuditInterceptor Redaction Verification', () => {
  let interceptor: AuditInterceptor;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-id-1' }),
      },
    };
    interceptor = new AuditInterceptor(mockPrisma);
  });

  it('should redact sensitive password and token fields before writing to audit log', (done) => {
    const mockRequest = {
      method: 'POST',
      url: '/api/v1/auth/login',
      user: { id: 'user-1' },
      body: {
        email: 'user@anveshakhub.com',
        password: 'SuperSecretPassword123!',
        token: 'raw_jwt_token_here',
      },
      headers: { 'x-correlation-id': 'corr-123' },
      ip: '127.0.0.1',
    };

    const mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as ExecutionContext;

    const mockCallHandler: CallHandler = {
      handle: () =>
        of({
          accessToken: 'jwt_token_value',
          user: { id: 'user-1', email: 'user@anveshakhub.com' },
        }),
    };

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      complete: () => {
        setImmediate(() => {
          expect(mockPrisma.auditLog.create).toHaveBeenCalled();
          const auditPayload = mockPrisma.auditLog.create.mock.calls[0][0].data;

          expect(auditPayload.beforeJson.password).toBe('[REDACTED]');
          expect(auditPayload.beforeJson.token).toBe('[REDACTED]');
          expect(auditPayload.afterJson.accessToken).toBe('[REDACTED]');
          expect(auditPayload.beforeJson.email).toBe('user@anveshakhub.com');
          done();
        });
      },
    });
  });
});
