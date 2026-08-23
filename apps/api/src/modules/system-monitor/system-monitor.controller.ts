import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SystemMonitorService } from './system-monitor.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Admin Control Center & System Monitor')
@Controller('system-monitor')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemMonitorController {
  constructor(private readonly systemMonitorService: SystemMonitorService) {}

  @Post('verify-pin')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/system-monitor/verify-pin — Verify monitor security password' })
  async verifyPin(@Body() body: { pin: string }) {
    const data = await this.systemMonitorService.verifyPin(body.pin);
    return { success: true, data };
  }

  @Post('change-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/system-monitor/change-password — Change monitor password' })
  async changePassword(
    @CurrentUser('id') adminUserId: string,
    @Body() body: { oldPin: string; newPin: string },
  ) {
    const data = await this.systemMonitorService.changePassword(body.oldPin, body.newPin, adminUserId);
    return { success: true, data };
  }

  @Post('forgot-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/system-monitor/forgot-password — Request monitor recovery email' })
  async forgotPassword(@Body() body: { email?: string }) {
    const data = await this.systemMonitorService.forgotPassword(body.email || '');
    return { success: true, data };
  }

  @Post('reset-password')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/system-monitor/reset-password — Reset monitor password using token' })
  async resetPassword(@Body() body: { token: string; newPin: string }) {
    const data = await this.systemMonitorService.resetPassword(body.token, body.newPin);
    return { success: true, data };
  }

  @Post('heartbeat')
  @Roles('ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'STAFF', 'EXECUTIVE', 'QA', 'LEGAL', 'ORG_USER')
  @ApiOperation({ summary: 'POST /api/v1/system-monitor/heartbeat — Throttled active user activity ping' })
  async heartbeat(
    @CurrentUser('id') userId: string,
    @CurrentUser('email') email: string,
    @CurrentUser('roles') roles: string[],
    @Body() body: { route?: string },
    @Req() req: any,
  ) {
    const primaryRole = roles && roles.length > 0 ? roles[0] : 'STAFF';
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;
    await this.systemMonitorService.recordActivity(userId, email, primaryRole, body.route, clientIp);
    return { success: true };
  }

  @Get('metrics')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/metrics — Enterprise ERP Overview metrics' })
  async getMetrics() {
    const data = await this.systemMonitorService.getMetrics();
    return { success: true, data };
  }

  @Get('active-users')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/active-users — Users active in last 5 mins' })
  async getActiveUsers() {
    const data = await this.systemMonitorService.getActiveUsers();
    return { success: true, data };
  }

  @Get('documents')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/documents — Global document search' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'visibility', required: false })
  @ApiQuery({ name: 'scanStatus', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getGlobalDocuments(
    @Query('search') search?: string,
    @Query('entityType') entityType?: string,
    @Query('category') category?: string,
    @Query('visibility') visibility?: string,
    @Query('scanStatus') scanStatus?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.systemMonitorService.getGlobalDocuments({
      search,
      entityType,
      category,
      visibility,
      scanStatus,
      page: pageNum,
      limit: limitNum,
    });
    return { success: true, data };
  }

  @Get('employees')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/employees — Workforce Summary' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getEmployees(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.systemMonitorService.getEmployeeMonitor(pageNum, limitNum, search);
    return { success: true, data };
  }

  @Get('organizations')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/organizations — Organization Summary' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getOrganizations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.systemMonitorService.getOrganizationMonitor(pageNum, limitNum, search);
    return { success: true, data };
  }

  @Get('projects')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/projects — Project Summary' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getProjects(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.systemMonitorService.getProjectMonitor(pageNum, limitNum, search);
    return { success: true, data };
  }

  @Get('health')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/health — Infrastructure Health' })
  async getHealth() {
    const data = await this.systemMonitorService.getSystemHealth();
    return { success: true, data };
  }

  @Get('audit')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/audit — System Security Audit Logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'action', required: false })
  async getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 25;
    const data = await this.systemMonitorService.getAuditLogs(pageNum, limitNum, search, entityType, action);
    return { success: true, data };
  }

  @Get('global-search')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/global-search — Global Search across entities' })
  @ApiQuery({ name: 'q', required: true })
  async globalSearch(@Query('q') q: string) {
    const data = await this.systemMonitorService.globalSearch(q);
    return { success: true, data };
  }

  @Get('failed-emails')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/failed-emails — Failed Email Logs Diagnostics' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getFailedEmails(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;
    const data = await this.systemMonitorService.getFailedEmailLogs(pageNum, limitNum, search);
    return { success: true, data };
  }

  @Get('recent-activity')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/recent-activity — Operations & Recent Activity Feed' })
  @ApiQuery({ name: 'limit', required: false })
  async getRecentActivity(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    const data = await this.systemMonitorService.getRecentActivity(limitNum);
    return { success: true, data };
  }

  @Get('alerts')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'GET /api/v1/system-monitor/alerts — Real System Alerts' })
  async getSystemAlerts() {
    const data = await this.systemMonitorService.getSystemAlerts();
    return { success: true, data };
  }

  @Post('clear-failed-emails')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'POST /api/v1/system-monitor/clear-failed-emails — Dismiss/Clear failed email logs' })
  async clearFailedEmails() {
    const data = await this.systemMonitorService.clearFailedEmailLogs();
    return { success: true, data };
  }
}
