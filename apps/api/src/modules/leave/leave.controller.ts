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
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeaveService } from './leave.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Employee Leave Self-Service')
@Controller('leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('types')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/leave/types — List active leave types & annual allowances' })
  async getLeaveTypes() {
    const data = await this.leaveService.getLeaveTypes();
    return { success: true, data };
  }

  @Get('policy-specs')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/leave/policy-specs — Get structured Leave Policy Specifications' })
  async getPolicySpecs() {
    const data = await this.leaveService.getPolicySpecs();
    return { success: true, data };
  }

  @Get('balances/me')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/leave/balances/me — View logged-in employee leave balances' })
  @ApiQuery({ name: 'year', required: false })
  async getMyBalances(
    @CurrentUser('id') userId: string,
    @Query('year') year?: string,
  ) {
    const yearNum = year ? parseInt(year, 10) : undefined;
    const data = await this.leaveService.getEmployeeBalances(userId, yearNum);
    return { success: true, data };
  }

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'POST /api/v1/leave/requests — Submit a new leave request' })
  async submitLeaveRequest(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason: string;
      documentKey?: string;
      documentName?: string;
    },
  ) {
    const data = await this.leaveService.submitLeaveRequest(userId, body);
    return { success: true, message: 'Leave request submitted successfully', data };
  }

  @Get('requests/me')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/leave/requests/me — List logged-in employee leave applications' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getMyLeaveRequests(
    @CurrentUser('id') userId: string,
    @Query('status') status?: string,
    @Query('year') year?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.leaveService.getMyLeaveRequests(userId, {
      status,
      year: year ? parseInt(year, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Get('requests/:id')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/leave/requests/:id — View single leave request details' })
  async getLeaveRequestDetails(
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const data = await this.leaveService.getLeaveRequestDetails(user, id);
    return { success: true, data };
  }

  @Patch('requests/:id/cancel')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'PATCH /api/v1/leave/requests/:id/cancel — Cancel eligible pending leave request' })
  async cancelLeaveRequest(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    const data = await this.leaveService.cancelLeaveRequest(userId, id);
    return { success: true, message: 'Leave request cancelled successfully', data };
  }
}
