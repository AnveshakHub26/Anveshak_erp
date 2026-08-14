import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { EmployeeTasksController } from './employee-tasks.controller';
import { IndustryController } from './industry.controller';

@Module({
  providers: [ProjectsService],
  controllers: [ProjectsController, EmployeeTasksController, IndustryController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
