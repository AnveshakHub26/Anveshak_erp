import {
  Controller,
  Get,
  Post,
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

@ApiTags('Industry Client Portal')
@Controller('industry')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class IndustryController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get('dashboard')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/industry/dashboard — Multi-project organization overview dashboard' })
  async getDashboard(@CurrentUser() user: any) {
    const data = await this.projectsService.getIndustryDashboard(user);
    return { success: true, data };
  }

  @Get('projects')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/industry/projects — List organization projects with anonymized team headcount' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getProjects(
    @CurrentUser() user: any,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.projectsService.getIndustryProjects(user, search, status);
    return { success: true, data };
  }

  @Get('projects/:id')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/industry/projects/:id — Organization project workspace details' })
  async getProjectDetail(@CurrentUser() user: any, @Param('id') id: string) {
    const data = await this.projectsService.getIndustryProjectDetail(user, id);
    return { success: true, data };
  }

  @Post('projects/:id/meetings/request')
  @Roles('ORG_USER', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/industry/projects/:id/meetings/request — Request a meeting for client project' })
  async requestMeeting(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { title: string; description?: string; meetingUrl?: string; startDateTime: string; endDateTime: string },
  ) {
    const data = await this.projectsService.requestClientMeeting(user, id, body);
    return { success: true, data };
  }
}
