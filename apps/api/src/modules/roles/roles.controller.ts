import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Roles & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all system roles and assigned permissions' })
  async findAll() {
    const data = await this.rolesService.findAll();
    return { success: true, data };
  }

  @Get('permissions')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all available permission nodes' })
  async findAllPermissions() {
    const data = await this.rolesService.findAllPermissions();
    return { success: true, data };
  }
}
