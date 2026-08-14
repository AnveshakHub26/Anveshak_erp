import { Controller, Get, Patch, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { IndustryService } from './industry.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AdminDecisionInput } from '@anveshak/validation';

@ApiTags('Admin Problem Statements Governance')
@Controller('admin/problem-statements')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminProblemStatementsController {
  constructor(private readonly industryService: IndustryService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'ADMIN: List all submitted problem statements across organizations' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getAllProblemStatements(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.industryService.getProblemStatements(user, pageNum, limitNum, status, search);
    return { success: true, data };
  }

  @Patch(':id/decision')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'ADMIN: Approve, Reject, or Request Changes on a Problem Statement' })
  async processDecision(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: AdminDecisionInput,
  ) {
    const data = await this.industryService.processAdminDecision(id, user.id, body.decision, body.reason);
    return { success: true, data };
  }

  @Post(':id/create-project')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'ADMIN: Instantiate a Project from an APPROVED Problem Statement' })
  @ApiResponse({ status: 201, description: 'Project created successfully.' })
  async createProject(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.industryService.createProjectFromProblemStatement(id, user.id);
    return { success: true, data };
  }
}
