import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import {
  CreateProjectResourceRequirementInput,
  UpdateProjectResourceRequirementInput,
  ProjectMemberAssignInput,
  CreateProjectMilestoneInput,
  UpdateProjectMilestoneInput,
  CreateProjectTaskInput,
  UpdateProjectTaskInput,
  CreateProjectDeliverableInput,
  UpdateProjectDeliverableInput,
  CreateProjectMeetingInput,
  UpdateProjectMeetingInput,
  CreateProjectResourceLinkInput,
  UpdateProjectResourceLinkInput,
} from '@anveshak/validation';

@ApiTags('Enterprise Projects')
@Controller('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/projects — ADMIN creates new ERP project' })
  async createProject(
    @CurrentUser() user: any,
    @Body() body: any,
  ) {
    const data = await this.projectsService.createProject(user, body);
    return { success: true, data };
  }

  @Get()
  @Roles('ADMIN', 'ORG_USER', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'List all authorized Projects with multi-tenant organization boundary isolation' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.projectsService.findAll(user, pageNum, limitNum, search, status);
    return { success: true, data };
  }

  @Get(':id')
  @Roles('ADMIN', 'ORG_USER', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'Get Project details and document attachments with boundary isolation' })
  async findOne(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.projectsService.findOne(user, id);
    return { success: true, data };
  }

  // =========================================================================
  // REQUIREMENT APIs (ADMIN ONLY FOR MUTATIONS)
  // =========================================================================

  @Post(':id/requirements')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/requirements — ADMIN creates resource requirement' })
  async createRequirement(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: CreateProjectResourceRequirementInput,
  ) {
    const data = await this.projectsService.createRequirement(user, projectId, body);
    return { success: true, data };
  }

  @Get(':id/requirements')
  @Roles('ADMIN', 'HR', 'PM')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/requirements — List resource requirements with server-derived isFulfilled' })
  async getRequirements(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getRequirements(user, projectId);
    return { success: true, data };
  }

  @Patch(':id/requirements/:requirementId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'PATCH /api/v1/projects/:id/requirements/:requirementId — ADMIN updates resource requirement' })
  async updateRequirement(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('requirementId') requirementId: string,
    @Body() body: UpdateProjectResourceRequirementInput,
  ) {
    const data = await this.projectsService.updateRequirement(user, projectId, requirementId, body);
    return { success: true, data };
  }

  // =========================================================================
  // CANDIDATE MATCHING ENGINE
  // =========================================================================

  @Get(':id/candidates')
  @Roles('ADMIN', 'HR', 'PM')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/candidates — Candidate search engine with skill & capacity ranking' })
  @ApiQuery({ name: 'requirementId', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'employmentType', required: false })
  @ApiQuery({ name: 'skills', required: false })
  @ApiQuery({ name: 'technologies', required: false })
  async getCandidates(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Query('requirementId') requirementId?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('employmentType') employmentType?: string,
    @Query('skills') skills?: string,
    @Query('technologies') technologies?: string,
  ) {
    const data = await this.projectsService.getCandidates(user, projectId, {
      requirementId,
      search,
      category,
      employmentType,
      skills,
      technologies,
    });
    return { success: true, data };
  }

  // =========================================================================
  // RESOURCE ASSIGNMENT & CAPACITY GOVERNANCE (ADMIN ONLY)
  // =========================================================================

  @Post(':id/members')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/members — ADMIN assigns employee with row-level capacity lock' })
  async assignMember(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: ProjectMemberAssignInput & { requirementId?: string },
  ) {
    const data = await this.projectsService.assignMember(user, projectId, body);
    return { success: true, data };
  }

  @Patch(':id/members/:memberId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'PATCH /api/v1/projects/:id/members/:memberId — ADMIN updates member allocation' })
  async updateMemberAllocation(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @Body() body: { allocationPct?: number; projectRole?: string; startDate?: string; endDate?: string },
  ) {
    const data = await this.projectsService.updateMemberAllocation(user, projectId, memberId, body);
    return { success: true, data };
  }

  @Post(':id/members/:memberId/release')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/members/:memberId/release — ADMIN releases employee from project' })
  async releaseMember(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('memberId') memberId: string,
    @Body() body: { reason?: string },
  ) {
    const data = await this.projectsService.releaseMember(user, projectId, memberId, body?.reason);
    return { success: true, data };
  }

  // ==========================================
  // PROJECT EXECUTION ENDPOINTS
  // ==========================================

  // --- MILESTONES ---

  @Post(':id/milestones')
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/milestones — Create Project Milestone' })
  async createMilestone(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: CreateProjectMilestoneInput,
  ) {
    const data = await this.projectsService.createMilestone(user, projectId, body);
    return { success: true, data };
  }

  @Get(':id/milestones')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/milestones — List Project Milestones with server-derived progress' })
  async getMilestones(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getMilestones(user, projectId);
    return { success: true, data };
  }

  @Patch(':id/milestones/:milestoneId')
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'PATCH /api/v1/projects/:id/milestones/:milestoneId — Update Milestone' })
  async updateMilestone(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() body: UpdateProjectMilestoneInput,
  ) {
    const data = await this.projectsService.updateMilestone(user, projectId, milestoneId, body);
    return { success: true, data };
  }

  @Delete(':id/milestones/:milestoneId')
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'DELETE /api/v1/projects/:id/milestones/:milestoneId — Delete Milestone' })
  async deleteMilestone(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    const data = await this.projectsService.deleteMilestone(user, projectId, milestoneId);
    return { success: true, data };
  }

  // --- TASKS ---

  @Post(':id/tasks')
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/tasks — Create Project Task' })
  async createTask(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: CreateProjectTaskInput,
  ) {
    const data = await this.projectsService.createTask(user, projectId, body);
    return { success: true, data };
  }

  @Get(':id/tasks')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/tasks — List Project Tasks' })
  async getTasks(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getTasks(user, projectId);
    return { success: true, data };
  }

  @Get(':id/tasks/:taskId')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/tasks/:taskId — Get Task details' })
  async getTaskById(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
  ) {
    const data = await this.projectsService.getTaskById(user, projectId, taskId);
    return { success: true, data };
  }

  @Patch(':id/tasks/:taskId')
  @Roles('ADMIN', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE')
  @ApiOperation({ summary: 'PATCH /api/v1/projects/:id/tasks/:taskId — Update Task details / progress' })
  async updateTask(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('taskId') taskId: string,
    @Body() body: UpdateProjectTaskInput,
  ) {
    const data = await this.projectsService.updateTask(user, projectId, taskId, body);
    return { success: true, data };
  }

  // --- DELIVERABLES ---

  @Post(':id/deliverables')
  @Roles('ADMIN', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/deliverables — Create Project Deliverable draft' })
  async createDeliverable(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: CreateProjectDeliverableInput,
  ) {
    const data = await this.projectsService.createDeliverable(user, projectId, body);
    return { success: true, data };
  }

  @Get(':id/deliverables')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/deliverables — List Project Deliverables' })
  async getDeliverables(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getDeliverables(user, projectId);
    return { success: true, data };
  }

  @Get(':id/deliverables/:deliverableId')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/deliverables/:deliverableId — Get Deliverable details' })
  async getDeliverableById(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('deliverableId') deliverableId: string,
  ) {
    const data = await this.projectsService.getDeliverableById(user, projectId, deliverableId);
    return { success: true, data };
  }

  @Post(':id/deliverables/:deliverableId/submit')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/deliverables/:deliverableId/submit — Submit Deliverable' })
  async submitDeliverable(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('deliverableId') deliverableId: string,
  ) {
    const data = await this.projectsService.submitDeliverable(user, projectId, deliverableId);
    return { success: true, data };
  }

  @Post(':id/deliverables/:deliverableId/review')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/deliverables/:deliverableId/review — Review Deliverable' })
  async reviewDeliverable(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('deliverableId') deliverableId: string,
    @Body() body: { decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION'; reviewNotes?: string },
  ) {
    const data = await this.projectsService.reviewDeliverable(user, projectId, deliverableId, body.decision, body.reviewNotes);
    return { success: true, data };
  }

  // --- MEETINGS ENDPOINTS ---

  @Post(':id/meetings')
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/meetings — Schedule online project meeting' })
  async createMeeting(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: CreateProjectMeetingInput,
  ) {
    const data = await this.projectsService.createMeeting(user, projectId, body);
    return { success: true, data };
  }

  @Get(':id/meetings')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/meetings — List project meetings' })
  async getMeetings(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getMeetings(user, projectId);
    return { success: true, data };
  }

  @Patch(':id/meetings/:meetingId')
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'PATCH /api/v1/projects/:id/meetings/:meetingId — Update meeting details' })
  async updateMeeting(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('meetingId') meetingId: string,
    @Body() body: UpdateProjectMeetingInput,
  ) {
    const data = await this.projectsService.updateMeeting(user, projectId, meetingId, body);
    return { success: true, data };
  }

  @Post(':id/meetings/:meetingId/cancel')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/meetings/:meetingId/cancel — Cancel meeting' })
  async cancelMeeting(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('meetingId') meetingId: string,
  ) {
    const data = await this.projectsService.cancelMeeting(user, projectId, meetingId);
    return { success: true, data };
  }

  // --- RESOURCE LINKS ENDPOINTS ---

  @Post(':id/resource-links')
  @Roles('ADMIN', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE')
  @ApiOperation({ summary: 'POST /api/v1/projects/:id/resource-links — Add external resource link' })
  async createResourceLink(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: CreateProjectResourceLinkInput,
  ) {
    const data = await this.projectsService.createResourceLink(user, projectId, body);
    return { success: true, data };
  }

  @Get(':id/resource-links')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/resource-links — List external resource links' })
  async getResourceLinks(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getResourceLinks(user, projectId);
    return { success: true, data };
  }

  @Delete(':id/resource-links/:linkId')
  @Roles('ADMIN', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE')
  @ApiOperation({ summary: 'DELETE /api/v1/projects/:id/resource-links/:linkId — Delete resource link' })
  async deleteResourceLink(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Param('linkId') linkId: string,
  ) {
    const data = await this.projectsService.deleteResourceLink(user, projectId, linkId);
    return { success: true, data };
  }

  // --- PROJECT FILES ENDPOINT ---

  @Get(':id/files')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/files — List uploaded project documents & deliverables' })
  async getProjectFiles(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getProjectFiles(user, projectId);
    return { success: true, data };
  }

  // --- UNIFIED PROJECT ACTIVITY LOG ENDPOINT ---

  @Get(':id/activity')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'GET /api/v1/projects/:id/activity — List unified project collaboration audit trail' })
  async getProjectActivity(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
  ) {
    const data = await this.projectsService.getProjectActivity(user, projectId);
    return { success: true, data };
  }

  // --- PROJECT STATUS UPDATE ENDPOINT ---

  @Patch(':id/status')
  @Roles('ADMIN', 'PM')
  @ApiOperation({ summary: 'PATCH /api/v1/projects/:id/status — Update project lifecycle status' })
  async updateProjectStatus(
    @CurrentUser() user: any,
    @Param('id') projectId: string,
    @Body() body: { status: 'INITIATED' | 'RESOURCE_ASSIGNMENT' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED'; reason?: string },
  ) {
    const data = await this.projectsService.updateProjectStatus(user, projectId, body.status, body.reason);
    return { success: true, data };
  }
}
