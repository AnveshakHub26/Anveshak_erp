import { Module } from '@nestjs/common';
import { HRService } from './hr.service';
import { HRController } from './hr.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [HRService],
  controllers: [HRController],
  exports: [HRService],
})
export class HRModule {}
