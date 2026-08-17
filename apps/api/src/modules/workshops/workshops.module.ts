import { Module } from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { WorkshopsController } from './workshops.controller';
import { PrismaModule } from '../../database/prisma.module';
import { EmailModule } from '../../common/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [WorkshopsController],
  providers: [WorkshopsService],
  exports: [WorkshopsService],
})
export class WorkshopsModule {}
