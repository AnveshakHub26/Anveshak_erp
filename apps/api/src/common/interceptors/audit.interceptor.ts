import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../database/prisma.service';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'password_hash',
  'newpassword',
  'confirmpassword',
  'token',
  'resettoken',
  'passwordresettoken',
  'accesstoken',
  'refreshtoken',
  'access_token',
  'refresh_token',
  'authorization',
  'cookie',
  'secret',
  'secretkey',
  'accesskey',
]);

function redactSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactSensitiveData);
  }

  const redacted: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lowerKey)) {
      redacted[key] = '[REDACTED]';
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      redacted[key] = redactSensitiveData(obj[key]);
    } else {
      redacted[key] = obj[key];
    }
  }
  return redacted;
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return next.handle();
    }

    const user = req.user;
    const actorUserId = user?.id || null;
    const ip = req.ip || req.connection?.remoteAddress || '127.0.0.1';
    const correlationId = (req.headers['x-correlation-id'] as string) || null;
    const url = req.originalUrl || req.url;

    const action = this.mapMethodToAction(method, url);
    const entityType = this.extractEntityType(url);
    const entityId = req.params?.id || 'GLOBAL';

    const beforeState = req.body ? redactSensitiveData(JSON.parse(JSON.stringify(req.body))) : null;

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          const afterState = responseData ? redactSensitiveData(JSON.parse(JSON.stringify(responseData))) : null;

          await this.prisma.auditLog.create({
            data: {
              actorUserId,
              action,
              entityType,
              entityId,
              beforeJson: beforeState,
              afterJson: afterState,
              ip,
              correlationId,
            },
          });
        } catch (err) {
          this.logger.error(`Failed to write audit log: ${err.message}`);
        }
      }),
    );
  }

  private mapMethodToAction(method: string, url: string): string {
    if (url.includes('/approve')) return 'APPROVE';
    if (url.includes('/reject')) return 'REJECT';
    if (url.includes('/login')) return 'LOGIN';
    if (url.includes('/logout')) return 'LOGOUT';
    switch (method) {
      case 'POST': return 'CREATE';
      case 'PUT':
      case 'PATCH': return 'EDIT';
      case 'DELETE': return 'DELETE';
      default: return method;
    }
  }

  private extractEntityType(url: string): string {
    const parts = url.replace('/api/v1/', '').split('/');
    return parts[0] ? parts[0].toUpperCase() : 'SYSTEM';
  }
}
