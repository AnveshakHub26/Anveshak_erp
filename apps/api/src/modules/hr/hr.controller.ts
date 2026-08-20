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
import { HRService } from './hr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import {
  CreateEmployeeInput,
  UpdateEmployeeInput,
  RehireEmployeeInput,
} from '@anveshak/validation';

@ApiTags('Human Resources Management')
@Controller('hr')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRController {
  constructor(private readonly hrService: HRService) {}

  @Get('dashboard')
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/hr/dashboard — Realtime HR workforce metrics' })
  async getDashboard() {
    const data = await this.hrService.getDashboard();
    return { success: true, data };
  }

  @Get('employees')
  @Roles('HR', 'ADMIN', 'PM')
  @ApiOperation({ summary: 'GET /api/v1/hr/employees — Search & filter employee directory' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'employmentType', required: false })
  @ApiQuery({ name: 'employmentStatus', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'professionalRole', required: false })
  @ApiQuery({ name: 'skills', required: false })
  @ApiQuery({ name: 'technologies', required: false })
  @ApiQuery({ name: 'assignment', required: false })
  async getEmployees(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('employmentType') employmentType?: string,
    @Query('employmentStatus') employmentStatus?: string,
    @Query('department') department?: string,
    @Query('professionalRole') professionalRole?: string,
    @Query('skills') skills?: string,
    @Query('technologies') technologies?: string,
    @Query('assignment') assignment?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.hrService.getEmployees(
      user,
      pageNum,
      limitNum,
      search,
      category,
      employmentType,
      employmentStatus,
      department,
      professionalRole,
      skills,
      technologies,
      assignment,
    );
    return { success: true, data };
  }

  @Post('employees')
  @HttpCode(HttpStatus.CREATED)
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/hr/employees — Onboard single employee & provision ERP account' })
  @ApiResponse({ status: 201, description: 'Employee onboarded and account provisioned.' })
  async onboardEmployee(
    @CurrentUser() user: any,
    @Body() body: CreateEmployeeInput,
  ) {
    const data = await this.hrService.onboardEmployee(user, body);
    return { success: true, data };
  }

  @Post('employees/bulk-onboard')
  @HttpCode(HttpStatus.CREATED)
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/hr/employees/bulk-onboard — Atomic bulk onboarding (up to 50 employees)' })
  async bulkOnboard(
    @CurrentUser() user: any,
    @Body() body: { employees: CreateEmployeeInput[] },
  ) {
    const data = await this.hrService.bulkOnboard(user, body.employees);
    return { success: true, data };
  }

  @Get('employees/me')
  @Roles('HR', 'ADMIN', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/hr/employees/me — Detailed profile for logged-in employee' })
  async getSelfEmployee(@CurrentUser('id') userId: string) {
    const data = await this.hrService.getSelfEmployee(userId);
    return { success: true, data };
  }

  @Get('employees/:id')
  @Roles('HR', 'ADMIN', 'PM', 'EXPERT', 'INTERN')
  @ApiOperation({ summary: 'GET /api/v1/hr/employees/:id — Detailed employee profile & employment history' })
  async getEmployeeById(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.hrService.getEmployeeById(id);
    return { success: true, data };
  }

  @Patch('employees/:id')
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'PATCH /api/v1/hr/employees/:id — Update employee profile & log status transitions' })
  async updateEmployee(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: UpdateEmployeeInput,
  ) {
    const data = await this.hrService.updateEmployee(user, id, body);
    return { success: true, data };
  }

  @Post('employees/:id/rehire')
  @HttpCode(HttpStatus.OK)
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/hr/employees/:id/rehire — Rehire former employee preserving Employee Code' })
  async rehireEmployee(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: RehireEmployeeInput,
  ) {
    const data = await this.hrService.rehireEmployee(user, id, body);
    return { success: true, data };
  }

  @Post('employees/:id/resend-invite')
  @HttpCode(HttpStatus.OK)
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/hr/employees/:id/resend-invite — Resend account activation invitation' })
  async resendInvitation(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.hrService.resendInvitation(user, id);
    return { success: true, data };
  }

  @Post('employees/:id/exit')
  @HttpCode(HttpStatus.OK)
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/hr/employees/:id/exit — Offboard/Deactivate employee preserving record & employeeCode' })
  async exitEmployee(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { status?: 'RESIGNED' | 'TERMINATED'; exitDate?: string; remarks?: string },
  ) {
    const data = await this.hrService.exitEmployee(user, id, body);
    return { success: true, data };
  }
}
