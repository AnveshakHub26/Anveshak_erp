import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Employee Attendance Management')
@Controller('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'POST /api/v1/attendance/clock-in — Record employee clock-in timestamp' })
  async clockIn(@CurrentUser() user: any) {
    const data = await this.attendanceService.clockIn(user);
    return { success: true, message: 'Clocked in successfully', data };
  }

  @Post('clock-out')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'POST /api/v1/attendance/clock-out — Record clock-out & calculate worked hours' })
  async clockOut(@CurrentUser() user: any) {
    const data = await this.attendanceService.clockOut(user);
    return { success: true, message: 'Clocked out successfully', data };
  }

  @Post('break-start')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'POST /api/v1/attendance/break-start — Start a break session' })
  async breakStart(@CurrentUser() user: any) {
    const data = await this.attendanceService.breakStart(user);
    return { success: true, message: 'Break started', data };
  }

  @Post('break-end')
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'POST /api/v1/attendance/break-end — End active break & update break duration' })
  async breakEnd(@CurrentUser() user: any) {
    const data = await this.attendanceService.breakEnd(user);
    return { success: true, message: 'Break completed', data };
  }

  @Get('today')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/attendance/today — Get todays clock status & break records for logged-in employee' })
  async getTodayAttendance(@CurrentUser() user: any) {
    const data = await this.attendanceService.getTodayAttendance(user);
    return { success: true, data };
  }

  @Get('my-history')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL')
  @ApiOperation({ summary: 'GET /api/v1/attendance/my-history — View logged-in employees attendance history' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getMyAttendanceHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.attendanceService.getMyAttendanceHistory(
      user,
      pageNum,
      limitNum,
      startDate,
      endDate,
    );
    return { success: true, data };
  }

  @Get('admin/history')
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/attendance/admin/history — Organization-wide attendance audit (HR/Admin)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'employeeId', required: false })
  @ApiQuery({ name: 'department', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'status', required: false })
  async getAdminAttendanceHistory(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('employeeId') employeeId?: string,
    @Query('department') department?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('status') status?: string,
  ) {
    const data = await this.attendanceService.getAdminAttendanceHistory(
      {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        employeeId,
        department,
        startDate,
        endDate,
        status,
      },
      user,
    );
    return { success: true, data };
  }

  @Get('admin/summary')
  @Roles('HR', 'ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/attendance/admin/summary — Realtime organization attendance metrics (HR/Admin)' })
  async getAdminAttendanceSummary(@CurrentUser() user: any) {
    const data = await this.attendanceService.getAdminAttendanceSummary(user);
    return { success: true, data };
  }
}
