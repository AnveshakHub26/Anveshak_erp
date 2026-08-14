import { Module } from '@nestjs/common';
import { IndustryService } from './industry.service';
import { IndustryController } from './industry.controller';
import { AdminProblemStatementsController } from './admin-problem-statements.controller';

@Module({
  providers: [IndustryService],
  controllers: [IndustryController, AdminProblemStatementsController],
  exports: [IndustryService],
})
export class IndustryModule {}
