import { Module } from '@nestjs/common';
import { HRService } from './hr.service';
import { HRController } from './hr.controller';

@Module({
  providers: [HRService],
  controllers: [HRController],
  exports: [HRService],
})
export class HRModule {}
