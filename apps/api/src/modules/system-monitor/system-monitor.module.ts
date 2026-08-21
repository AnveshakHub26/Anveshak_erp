import { Module } from '@nestjs/common';
import { SystemMonitorController } from './system-monitor.controller';
import { SystemMonitorService } from './system-monitor.service';
import { PrismaModule } from '../../database/prisma.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [SystemMonitorController],
  providers: [SystemMonitorService],
  exports: [SystemMonitorService],
})
export class SystemMonitorModule {}
