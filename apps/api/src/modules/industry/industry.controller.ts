import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
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
  @ApiOperation({ summary: 'IND-02 Industry Profile & Verification Summary' })
  async getProfile(@CurrentUser() user: any) {
    const data = await this.industryService.getProfile(user);
    return { success: true, data };
  }

  @Get('problem-statements')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-03 Paginated Problem Statements Queue with boundary isolation' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getProblemStatements(
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

  @Post('problem-statements')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'IND-05 Submit or Save Draft Problem Statement' })
  @ApiResponse({ status: 201, description: 'Problem statement created successfully.' })
  async createProblemStatement(
    @CurrentUser() user: any,
    @Body()
    body: {
      title: string;
      description: string;
      bvId: string;
      category?: string;
      budgetEstimate?: string;
      expectedTimeline?: string;
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
}
