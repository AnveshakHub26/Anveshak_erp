import { Controller, Get, Post, Body, Param, Query, UseGuards, ForbiddenException, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly orgsService: OrganizationsService) {}

  @Public()
  @Post('registration')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'FND-03 Public Organization Self-Registration' })
  @ApiResponse({ status: 201, description: 'Organization registration submitted successfully.' })
  @ApiResponse({ status: 409, description: 'Organization legal name or primary contact email already exists.' })
  async register(
    @Body()
    body: {
      legalName: string;
      tradeName?: string;
      type: string;
      website?: string;
      address?: string;
      primaryContactName: string;
      designation?: string;
      email: string;
      phone: string;
      password: string;
      primaryBvId: string;
      additionalBvIds?: string[];
    },
  ) {
    const data = await this.orgsService.registerOrganization(body);
    return { success: true, data };
  }

  @Public()
  @Get('registration-status/:orgNumber')
  @ApiOperation({ summary: 'FND-06 Retrieve Organization Self-Registration Status by Reference' })
  @ApiResponse({ status: 200, description: 'Registration status retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Registration request reference not found.' })
  async getRegistrationStatus(@Param('orgNumber') orgNumber: string) {
    const data = await this.orgsService.getRegistrationStatus(orgNumber);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CRM_STAFF', 'FINANCE', 'SALES')
  @ApiOperation({ summary: 'Paginated list of canonical business organizations' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.orgsService.findAll(pageNum, limitNum, search);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMIN', 'CRM_STAFF', 'FINANCE', 'SALES', 'ORG_USER')
  @ApiOperation({ summary: 'Get canonical organization details by ID (with boundary isolation)' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    if (user.roles?.includes('ORG_USER') && !user.roles?.includes('SUPER_ADMIN') && !user.roles?.includes('ADMIN')) {
      if (user.organizationId !== id) {
        throw new ForbiddenException('Access denied: You do not have permission to view this organization record.');
      }
    }

    const data = await this.orgsService.findOne(id);
    return { success: true, data };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('SUPER_ADMIN', 'ADMIN', 'CRM_STAFF')
  @ApiOperation({ summary: 'Create a new canonical organization record' })
  async create(
    @Body()
    body: {
      legalName: string;
      tradeName?: string;
      type: string;
      website?: string;
      address?: string;
      primaryBvId: string;
      additionalBvIds?: string[];
    },
  ) {
    const data = await this.orgsService.create(body);
    return { success: true, data };
  }
}
