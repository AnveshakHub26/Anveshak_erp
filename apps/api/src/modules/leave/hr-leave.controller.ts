import {
  Controller,
  Get,
  Post,
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

@ApiTags('Human Resources Leave Management')
@Controller('hr/leave')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRLeaveController {
  constructor(private readonly leaveService: LeaveService) {}

  @Get('requests')
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/hr/leave/requests — Organization-wide leave requests audit (HR/Admin)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'gender', required: false })
  @ApiQuery({ name: 'employmentType', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getHRLeaveRequests(
    @Query('status') status?: string,
    @Query('employeeId') employeeId?: string,
    @Query('department') department?: string,
    @Query('gender') gender?: string,
    @Query('employmentType') employmentType?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const data = await this.leaveService.getHRLeaveRequests({
      status,
      employeeId,
      department,
      gender,
      employmentType,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return { success: true, data };
  }

  @Post('requests/:id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/hr/leave/requests/:id/approve — Atomic HR leave request approval' })
  async approveLeaveRequest(
    @CurrentUser() hrUser: any,
    @Param('id') id: string,
  ) {
    const data = await this.leaveService.approveLeaveRequest(hrUser, id);
    return { success: true, message: 'Leave request approved successfully', data };
  }

  @Post('requests/:id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/hr/leave/requests/:id/reject — Atomic HR leave request rejection' })
  async rejectLeaveRequest(
    @CurrentUser() hrUser: any,
    @Param('id') id: string,
    @Body() body: { rejectionReason: string },
  ) {
    const data = await this.leaveService.rejectLeaveRequest(hrUser, id, body.rejectionReason);
    return { success: true, message: 'Leave request rejected', data };
  }
}
