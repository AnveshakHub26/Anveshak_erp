import { Module } from '@nestjs/common';
import { BusinessVerticalsService } from './business-verticals.service';
import { BusinessVerticalsController } from './business-verticals.controller';

@Module({
  providers: [BusinessVerticalsService],
  controllers: [BusinessVerticalsController],
  exports: [BusinessVerticalsService],
})
export class BusinessVerticalsModule {}
