import { Module } from '@nestjs/common';
import { LeaveService } from './leave.service';
import { LeaveController } from './leave.controller';
import { HRLeaveController } from './hr-leave.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [LeaveService],
  controllers: [LeaveController, HRLeaveController],
  exports: [LeaveService],
})
export class LeaveModule {}
