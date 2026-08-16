import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { IndustryService } from './industry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Industry Portal')
@Controller('industry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndustryController {
  constructor(private readonly industryService: IndustryService) {}

  @Get('dashboard')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-01 Industry Dashboard Metrics & Summary' })
  async getDashboard(@CurrentUser() user: any) {
    const data = await this.industryService.getDashboard(user);
    return { success: true, data };
  }

  @Get('profile')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-02 Industry Profile & Contact Information' })
  async getProfile(@CurrentUser() user: any) {
    const data = await this.industryService.getProfile(user);
    return { success: true, data };
  }

  @Get('contact-info')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'Configurable Official AnveshakHub Support Contact Details' })
  async getContactInfo() {
    const data = await this.industryService.getContactInfo();
    return { success: true, data };
  }

  // ==========================================
  // PROBLEM STATEMENTS
  // ==========================================

  @Get('problem-statements')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-03 Paginated Problem Statements Queue with boundary isolation' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'bvId', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getProblemStatements(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('bvId') bvId?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.industryService.getProblemStatements(user, pageNum, limitNum, status, search, bvId);
    return { success: true, data };
  }

  @Post('problem-statements')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-05 Multi-step Problem Statement Submission' })
  async createProblemStatement(
    @CurrentUser() user: any,
    @Body()
    body: {
      title: string;
      bvId: string;
      department?: string;
      category?: string;
      priority?: string;
      currentSituation?: string;
      description: string;
      existingProcess?: string;
      currentTechnology?: string;
      businessImpact?: string;
      desiredSolution?: string;
      expectedBenefits?: string;
      successCriteria?: string;
      expectedTimeline?: string;
      budgetEstimate?: string;
      documentStorageKeys?: string[];
      isDraft?: boolean;
    },
  ) {
    const data = await this.industryService.createProblemStatement(user, body);
    return { success: true, data };
  }

  @Get('problem-statements/:id')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-04 Problem Statement Details View with boundary isolation' })
  async getProblemStatementById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.industryService.getProblemStatementById(user, id);
    return { success: true, data };
  }

  @Patch('problem-statements/:id')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'Resubmit or Update Problem Statement' })
  async updateProblemStatement(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const data = await this.industryService.updateProblemStatement(user, id, body);
    return { success: true, data };
  }

  // ==========================================
  // PROJECTS & WORKSPACE
  // ==========================================

  @Get('projects')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-06 Organization Projects List' })
  async getProjects(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.industryService.getProjects(user, pageNum, limitNum, search, status);
    return { success: true, data };
  }

  @Get('projects/:id')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-07 Organization Project Details View' })
  async getProjectById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.industryService.getProjectById(user, id);
    return { success: true, data };
  }

  // ==========================================
  // DELIVERABLES
  // ==========================================

  @Get('deliverables')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-08 Organization Deliverables Queue' })
  async getDeliverables(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.industryService.getDeliverables(user, pageNum, limitNum, status);
    return { success: true, data };
  }

  @Patch('deliverables/:id/review')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-09 Client Review Action on Deliverable (Approve / Request Changes)' })
  async reviewDeliverable(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVED' | 'CHANGES_REQUESTED'; reviewNotes?: string },
  ) {
    const data = await this.industryService.reviewDeliverable(user, id, body.decision, body.reviewNotes);
    return { success: true, data };
  }

  // ==========================================
  // MEETINGS
  // ==========================================

  @Get('meetings')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-10 Organization Meetings List' })
  async getMeetings(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.industryService.getMeetings(user, pageNum, limitNum);
    return { success: true, data };
  }

  @Post('meetings/request')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'Request a Project Meeting with AnveshakHub Team' })
  async requestMeeting(
    @CurrentUser() user: any,
    @Body() body: { projectId: string; title: string; description?: string; preferredDateTime: string },
  ) {
    const data = await this.industryService.requestMeeting(user, body);
    return { success: true, data };
  }

  // ==========================================
  // DOCUMENTS
  // ==========================================

  @Get('documents')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-11 Organization Documents Library' })
  async getDocuments(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.industryService.getDocuments(user, pageNum, limitNum, type);
    return { success: true, data };
  }

  // ==========================================
  // QUERIES & SUPPORT
  // ==========================================

  @Get('queries')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-12 Support Queries Queue' })
  async getQueries(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.industryService.getQueries(user, pageNum, limitNum, status);
    return { success: true, data };
  }

  @Post('queries')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-13 Log Support Query' })
  async createQuery(
    @CurrentUser() user: any,
    @Body()
    body: {
      subject: string;
      category: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      description: string;
      relatedProjectId?: string;
      relatedProblemId?: string;
    },
  ) {
    const data = await this.industryService.createQuery(user, body);
    return { success: true, data };
  }

  @Get('queries/:id')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-14 Get Support Query Thread' })
  async getQueryById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.industryService.getQueryById(user, id);
    return { success: true, data };
  }

  @Post('queries/:id/messages')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'Post Reply Message to Support Query' })
  async addQueryMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { message: string },
  ) {
    const data = await this.industryService.addQueryMessage(user, id, body.message);
    return { success: true, data };
  }
}
