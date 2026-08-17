import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { WorkshopsService, CreateWorkshopInput, UpdateWorkshopInput } from './workshops.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { WorkshopStatus } from '@prisma/client';

@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  // =========================================================================
  // PUBLIC ROUTES (No Login Required)
  // =========================================================================

  @Public()
  @Get('public')
  async getPublicWorkshops(
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('type') type: 'UPCOMING' | 'COMPLETED' | 'ALL' = 'ALL',
  ) {
    const data = await this.workshopsService.getPublicWorkshops(query, category, type);
    return { success: true, data };
  }

  @Public()
  @Get('public/:id')
  async getPublicWorkshopById(@Param('id') id: string) {
    const data = await this.workshopsService.getPublicWorkshopById(id);
    return { success: true, data };
  }

  // =========================================================================
  // ADMIN ROUTES (Requires Login + ADMIN Role)
  // =========================================================================

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminWorkshops(
    @CurrentUser() adminUser: any,
    @Query('query') query?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const result = await this.workshopsService.getAdminWorkshops(adminUser, query, status, category, page, limit);
    return { success: true, ...result };
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async getAdminWorkshopById(@CurrentUser() adminUser: any, @Param('id') id: string) {
    const data = await this.workshopsService.getAdminWorkshopById(adminUser, id);
    return { success: true, data };
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async createWorkshop(@CurrentUser() adminUser: any, @Body() body: CreateWorkshopInput) {
    const data = await this.workshopsService.createWorkshop(adminUser, body);
    return { success: true, data, message: 'Workshop created successfully.' };
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateWorkshop(
    @CurrentUser() adminUser: any,
    @Param('id') id: string,
    @Body() body: UpdateWorkshopInput,
  ) {
    const data = await this.workshopsService.updateWorkshop(adminUser, id, body);
    return { success: true, data, message: 'Workshop updated successfully.' };
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  async updateWorkshopStatus(
    @CurrentUser() adminUser: any,
    @Param('id') id: string,
    @Body('status') status: WorkshopStatus,
  ) {
    const data = await this.workshopsService.updateWorkshopStatus(adminUser, id, status);
    return { success: true, data, message: `Workshop status updated to ${status}.` };
  }
}
