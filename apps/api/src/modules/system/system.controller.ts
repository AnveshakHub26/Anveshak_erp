import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('System Governance')
@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'FND-00 System Health & Connectivity Check' })
  async checkPublicHealth() {
    return this.systemService.checkHealth();
  }

  @Public()
  @Get('admin/health')
  @ApiOperation({ summary: 'ADM-06 System Health & Connectivity Check' })
  async checkHealth() {
    return this.systemService.checkHealth();
  }

  @Public()
  @Post('admin/support')
  @ApiOperation({ summary: 'FND-11 Submit persistent contact admin & support request ticket' })
  async submitSupportRequest(
    @Body()
    body: {
      category: string;
      subject: string;
      message: string;
      contactEmail?: string;
    },
    @CurrentUser('id') userId?: string,
  ) {
    const data = await this.systemService.createSupportRequest({
      ...body,
      actorUserId: userId,
    });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'FND-08 Global Permission-Aware Search Endpoint' })
  @ApiQuery({ name: 'q', required: true, example: 'Tescom' })
  @ApiQuery({ name: 'category', required: false, example: 'all' })
  async globalSearch(
    @Query('q') query: string,
    @Query('category') category: string,
    @CurrentUser() user: any,
  ) {
    const data = await this.systemService.globalSearch(query || '', user, category || 'all');
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('admin/settings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ADM-08 Platform Settings & Global Config' })
  async getSettings() {
    const data = await this.systemService.getSettings();
    return { success: true, data };
  }
}
