import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { PrismaModule } from './database/prisma.module';
import { SupabaseModule } from './common/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { BusinessVerticalsModule } from './modules/business-verticals/business-verticals.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { SystemModule } from './modules/system/system.module';
import { IndustryModule } from './modules/industry/industry.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { HRModule } from './modules/hr/hr.module';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware';

import { EmailModule } from './common/email/email.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['../../.env', '../.env', '.env', '.env.local'] }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute window
        limit: 120, // Max 120 requests per minute per IP for normal authenticated ERP API queries
      },
    ]),
    PrismaModule,
    SupabaseModule,
    EmailModule,
    AuthModule,
    UsersModule,
    RolesModule,
    OrganizationsModule,
    BusinessVerticalsModule,
    DocumentsModule,
    NotificationsModule,
    AuditLogsModule,
    SystemModule,
    IndustryModule,
    ProjectsModule,
    HRModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
