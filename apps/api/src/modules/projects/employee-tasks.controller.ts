import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Employee Tasks Self-Service')
@Controller('employee/tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeeTasksController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/employee/tasks — List tasks assigned to the logged-in employee' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'priority', required: false })
  async getMyTasks(
    @CurrentUser() user: any,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    const data = await this.projectsService.getEmployeeTasks(user, projectId, status, priority);
    return { success: true, data };
  }

  @Patch(':taskId/progress')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'PATCH /api/v1/employee/tasks/:taskId/progress — Update progress / hours on assigned task' })
  async updateMyTaskProgress(
    @CurrentUser() user: any,
    @Param('taskId') taskId: string,
    @Body() body: { status?: string; progressPct?: number; actualHours?: number },
  ) {
    const data = await this.projectsService.updateEmployeeTaskProgress(
      user,
      taskId,
      body.status,
      body.progressPct,
      body.actualHours,
    );
    return { success: true, data };
  }

  @Get('/../projects')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/employee/projects — List active projects assigned to logged-in employee' })
  async getMyProjects(@CurrentUser() user: any) {
    const data = await this.projectsService.getEmployeeProjects(user);
    return { success: true, data };
  }

  @Get('/../deliverables')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/employee/deliverables — List deliverables for assigned projects' })
  async getMyDeliverables(@CurrentUser() user: any) {
    const data = await this.projectsService.getEmployeeDeliverables(user);
    return { success: true, data };
  }

  @Get('/../meetings')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/employee/meetings — List scheduled meetings for logged-in employee' })
  async getMyMeetings(@CurrentUser() user: any) {
    const data = await this.projectsService.getEmployeeMeetings(user);
    return { success: true, data };
  }

  @Get('/../resources')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/employee/resources — List shared project resources & documents' })
  async getMyResources(@CurrentUser() user: any) {
    const data = await this.projectsService.getEmployeeResources(user);
    return { success: true, data };
  }
}
