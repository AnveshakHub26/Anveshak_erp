import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../common/email/email.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

const SYSTEM_MONITOR_SETTING_KEY = 'SYSTEM_MONITOR_CONFIG';
const DEFAULT_INITIAL_PIN = '123456789';

@Injectable()
export class SystemMonitorService {
  constructor(
    private prisma: PrismaService,
    @Optional() private emailService?: EmailService,
    @Optional() private supabaseService?: SupabaseService,
  ) {}

  /**
   * Helper to fetch or initialize System Monitor config from SystemSetting table
   */
  private async getMonitorConfig() {
    let setting = await this.prisma.systemSetting.findUnique({
      where: { key: SYSTEM_MONITOR_SETTING_KEY },
    });

    if (!setting) {
      const passwordHash = await argon2.hash(DEFAULT_INITIAL_PIN, { type: argon2.argon2id });
      setting = await this.prisma.systemSetting.create({
        data: {
          key: SYSTEM_MONITOR_SETTING_KEY,
          valueJson: {
            passwordHash,
            resetToken: null,
            resetExpires: null,
          },
        },
      });
    }

    return setting;
  }

  /**
   * Verify System Monitor Security PIN/Password
   */
  async verifyPin(pin: string) {
    if (!pin || !pin.trim()) {
      throw new BadRequestException('Security PIN/Password is required.');
    }

    const config = await this.getMonitorConfig();
    const configData = config.valueJson as any;

    let isValid = false;
    try {
      isValid = await argon2.verify(configData.passwordHash, pin.trim());
    } catch {
      isValid = false;
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid System Monitor security password.');
    }

    const monitorToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    return {
      success: true,
      verified: true,
      monitorToken,
      expiresAt,
    };
  }

  /**
   * Change System Monitor Password
   */
  async changePassword(oldPin: string, newPin: string, adminUserId: string) {
    if (!newPin || newPin.trim().length < 6) {
      throw new BadRequestException('New Security PIN/Password must be at least 6 characters.');
    }

    await this.verifyPin(oldPin);

    const newHash = await argon2.hash(newPin.trim(), { type: argon2.argon2id });
    await this.prisma.systemSetting.update({
      where: { key: SYSTEM_MONITOR_SETTING_KEY },
      data: {
        valueJson: {
          passwordHash: newHash,
          resetToken: null,
          resetExpires: null,
        },
        updatedBy: adminUserId,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUserId,
        action: 'CHANGE_SYSTEM_MONITOR_PASSWORD',
        entityType: 'SYSTEM_SETTING',
        entityId: SYSTEM_MONITOR_SETTING_KEY,
        afterJson: { message: 'System Monitor Security Password updated successfully.' },
      },
    });

    return { success: true, message: 'System Monitor Security Password changed successfully.' };
  }

  /**
   * Request Forgot Password Email for System Monitor
   */
  async forgotPassword(adminEmail: string) {
    const targetEmail = (adminEmail || process.env.BOOTSTRAP_ADMIN_EMAIL || 'anveshakhub26@gmail.com').toLowerCase().trim();

    const config = await this.getMonitorConfig();
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    const configData = config.valueJson as any;
    await this.prisma.systemSetting.update({
      where: { key: SYSTEM_MONITOR_SETTING_KEY },
      data: {
        valueJson: {
          ...configData,
          resetToken,
          resetExpires,
        },
      },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/admin/system-monitor?resetToken=${resetToken}`;

    if (this.emailService) {
      try {
        await this.emailService.sendTransactionalEmail({
          to: targetEmail,
          subject: 'System Monitor Security Password Reset — AnveshakHub Enterprise',
          html: `<p>Hello Admin,</p><p>A request was made to reset the System Monitor Security Password for AnveshakHub ERP.</p><p><a href="${resetUrl}">Click here to reset your monitor password</a></p><p>Or copy this link: ${resetUrl}</p>`,
          text: `Hello Admin,\n\nTo reset your System Monitor security password: ${resetUrl}`,
          category: 'SECURITY_ALERT' as any,
        });
      } catch (err: any) {
        console.warn('Failed to send Monitor reset email via SMTP:', err.message);
      }
    }

    return {
      success: true,
      message: `If '${targetEmail}' is the authorized admin email, password recovery instructions have been sent.`,
    };
  }

  /**
   * Reset Password using recovery token
   */
  async resetPassword(token: string, newPin: string) {
    if (!token || !newPin || newPin.trim().length < 6) {
      throw new BadRequestException('Valid token and new password (min 6 chars) are required.');
    }

    const config = await this.getMonitorConfig();
    const configData = config.valueJson as any;

    if (!configData.resetToken || configData.resetToken !== token) {
      throw new UnauthorizedException('Invalid or expired password reset token.');
    }

    if (configData.resetExpires && new Date(configData.resetExpires) < new Date()) {
      throw new UnauthorizedException('Password reset token has expired.');
    }

    const newHash = await argon2.hash(newPin.trim(), { type: argon2.argon2id });
    await this.prisma.systemSetting.update({
      where: { key: SYSTEM_MONITOR_SETTING_KEY },
      data: {
        valueJson: {
          passwordHash: newHash,
          resetToken: null,
          resetExpires: null,
        },
      },
    });

    return { success: true, message: 'System Monitor Security Password reset successfully.' };
  }

  /**
   * Record User Activity Heartbeat (1 row per user)
   */
  async recordActivity(userId: string, email: string, role: string, route?: string, ip?: string) {
    if (!userId || !email) return;

    const existing = await this.prisma.userActivity.findUnique({
      where: { userId },
    });

    const now = new Date();
    if (existing && now.getTime() - new Date(existing.lastActivity).getTime() < 30000 && existing.currentRoute === route) {
      return;
    }

    await this.prisma.userActivity.upsert({
      where: { userId },
      update: {
        userEmail: email.toLowerCase(),
        userRole: role || 'STAFF',
        lastActivity: now,
        currentRoute: route || existing?.currentRoute || '/dashboard',
        ipAddress: ip || existing?.ipAddress,
      },
      create: {
        userId,
        userEmail: email.toLowerCase(),
        userRole: role || 'STAFF',
        lastActivity: now,
        loginTime: now,
        currentRoute: route || '/dashboard',
        ipAddress: ip,
      },
    });
  }

  /**
   * GET /api/v1/system-monitor/metrics — Enterprise ERP Overview Metrics
   */
  async getMetrics() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalEmployees,
      activeEmployees,
      exitedEmployees,
      totalOrganizations,
      totalProjects,
      activeProjects,
      completedProjects,
      projectsOnHold,
      totalDocuments,
      totalFolders,
      pendingLeaveRequests,
      totalLeaveRequests,
      todayAttendance,
      totalAttendanceRecords,
      totalUsers,
      activeUsersCount,
      unreadNotifications,
      totalNotifications,
      failedEmailsCount,
      totalEmailLogs,
      totalAuditLogs,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: { in: ['RESIGNED', 'TERMINATED'] } } }),
      this.prisma.organization.count(),
      this.prisma.project.count(),
      this.prisma.project.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.project.count({ where: { status: 'COMPLETED' } }),
      this.prisma.project.count({ where: { status: 'ON_HOLD' } }),
      this.prisma.document.count(),
      this.prisma.documentFolder.count(),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
      this.prisma.leaveRequest.count(),
      this.prisma.attendance.findMany({
        where: { attendanceDate: { gte: todayStart } },
        include: { breaks: true },
      }),
      this.prisma.attendance.count(),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: 'ACTIVE' } }),
      this.prisma.notification.count({ where: { readAt: null } }),
      this.prisma.notification.count(),
      this.prisma.emailLog.count({ where: { status: 'FAILED' } }),
      this.prisma.emailLog.count(),
      this.prisma.auditLog.count(),
    ]);

    const attendancePresentToday = todayAttendance.length;
    const currentlyWorking = todayAttendance.filter((a) => !a.clockOutAt).length;
    const currentlyOnBreak = todayAttendance.filter((a) => !a.clockOutAt && a.breaks.some((b) => !b.endTime)).length;
    const completedAttendance = todayAttendance.filter((a) => !!a.clockOutAt).length;

    return {
      overview: {
        totalEmployees,
        activeEmployees,
        exitedEmployees,
        totalOrganizations,
        totalProjects,
        activeProjects,
        completedProjects,
        projectsOnHold,
        totalDocuments,
        totalFolders,
        pendingLeaveRequests,
        totalLeaveRequests,
        attendancePresentToday,
        currentlyWorking,
        currentlyOnBreak,
        completedAttendance,
        totalAttendanceRecords,
        totalUsers,
        activeUsersCount,
        unreadNotifications,
        totalNotifications,
        failedEmailsCount,
        totalEmailLogs,
        totalAuditLogs,
      },
    };
  }

  /**
   * GET /api/v1/system-monitor/active-users — Users active within the last 5 minutes
   */
  async getActiveUsers() {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const activeSessions = await this.prisma.userActivity.findMany({
      where: {
        lastActivity: { gte: fiveMinutesAgo },
      },
      orderBy: { lastActivity: 'desc' },
      take: 50,
    });

    return activeSessions.map((s) => ({
      id: s.id,
      userId: s.userId,
      email: s.userEmail,
      role: s.userRole,
      lastActivity: s.lastActivity,
      loginTime: s.loginTime,
      currentRoute: s.currentRoute,
      ipAddress: s.ipAddress,
      isActiveNow: true,
    }));
  }

  /**
   * GET /api/v1/system-monitor/documents — Admin Global Document Search
   */
  async getGlobalDocuments(query: {
    search?: string;
    entityType?: string;
    category?: string;
    visibility?: string;
    scanStatus?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.DocumentWhereInput = {};

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { storageKey: { contains: q, mode: 'insensitive' } },
        { type: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { uploader: { email: { contains: q, mode: 'insensitive' } } },
      ];
    }

    if (query.entityType) where.entityType = query.entityType;
    if (query.category) where.type = query.category;
    if (query.visibility) where.visibility = query.visibility as any;
    if (query.scanStatus) where.scanStatus = query.scanStatus as any;

    const [total, data] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          uploader: { select: { id: true, email: true } },
          folder: { select: { id: true, name: true } },
          versions: {
            select: { id: true, version: true, storageKey: true, checksum: true, createdAt: true },
            orderBy: { version: 'desc' },
          },
        },
      }),
    ]);

    return {
      items: data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * GET /api/v1/system-monitor/employees — Workforce Summary
   */
  async getEmployeeMonitor(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.EmployeeWhereInput = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { workEmail: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, lastLoginAt: true, status: true },
          },
        },
      }),
    ]);

    const userIds = data.map((e) => e.userId).filter(Boolean);
    const activities = await this.prisma.userActivity.findMany({
      where: { userId: { in: userIds } },
    });
    const activityMap = new Map(activities.map((a) => [a.userId, a]));

    const items = data.map((emp) => {
      const act = activityMap.get(emp.userId);
      return {
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        workEmail: emp.workEmail,
        department: emp.department,
        designation: emp.designation,
        category: emp.category,
        status: emp.status,
        lastLogin: emp.user?.lastLoginAt || null,
        lastActivity: act?.lastActivity || null,
        currentRoute: act?.currentRoute || null,
      };
    });

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * GET /api/v1/system-monitor/organizations — Organization Summary
   */
  async getOrganizationMonitor(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.OrganizationWhereInput = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { legalName: { contains: q, mode: 'insensitive' } },
        { orgNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { projects: true, organizationUsers: true },
          },
        },
      }),
    ]);

    const items = data.map((o) => ({
      id: o.id,
      orgNumber: o.orgNumber,
      legalName: o.legalName,
      status: o.status,
      projectCount: o._count.projects,
      userCount: o._count.organizationUsers,
      createdAt: o.createdAt,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * GET /api/v1/system-monitor/projects — Project Summary
   */
  async getProjectMonitor(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.ProjectWhereInput = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { projectCode: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.project.count({ where }),
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          organization: { select: { legalName: true } },
          _count: { select: { members: true } },
        },
      }),
    ]);

    const items = data.map((p) => ({
      id: p.id,
      projectCode: p.projectCode,
      title: p.title,
      organizationName: p.organization?.legalName || 'N/A',
      status: p.status,
      teamSize: p._count.members,
      createdAt: p.createdAt,
      lastActivity: p.updatedAt,
    }));

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * GET /api/v1/system-monitor/health — System Infrastructure Health
   */
  async getSystemHealth() {
    let dbStatus = 'OPERATIONAL';
    let dbLatencyMs = 0;
    try {
      const dbStart = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - dbStart;
      if (dbLatencyMs > 1000) dbStatus = 'DEGRADED';
    } catch {
      dbStatus = 'UNAVAILABLE';
    }

    const supaUrl = process.env.SUPABASE_URL;
    const supaKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseStatus = supaUrl && supaKey ? 'OPERATIONAL' : 'NOT_CONFIGURED';

    const storageBucket = process.env.SUPABASE_STORAGE_BUCKET;
    const storageStatus = supaUrl && storageBucket ? 'OPERATIONAL' : 'NOT_CONFIGURED';

    const smtpHost = process.env.SMTP_HOST;
    const emailStatus = smtpHost ? 'OPERATIONAL' : 'NOT_CONFIGURED';

    const projectRef = supaUrl ? supaUrl.replace('https://', '').split('.')[0] : null;
    const defaultSupabaseProject = projectRef ? `https://supabase.com/dashboard/project/${projectRef}` : null;
    const defaultSupabaseDb = projectRef ? `https://supabase.com/dashboard/project/${projectRef}/editor` : null;
    const defaultSupabaseStorage = projectRef ? `https://supabase.com/dashboard/project/${projectRef}/storage/buckets` : null;

    const supaProjectUrl = process.env.SUPABASE_DASHBOARD_URL || defaultSupabaseProject;
    const supaDbUrl = process.env.SUPABASE_DATABASE_URL || defaultSupabaseDb;
    const supaStorageUrl = process.env.SUPABASE_STORAGE_URL || defaultSupabaseStorage;
    const sentryUrl = process.env.SENTRY_DASHBOARD_URL || (process.env.SENTRY_DSN ? 'https://sentry.io' : null);
    const grafanaUrl = process.env.GRAFANA_DASHBOARD_URL || process.env.GRAFANA_URL || null;

    const supaProjectStatus = supaUrl ? 'CONNECTED' : 'NOT_CONFIGURED';
    const supaDbStatus = dbStatus === 'OPERATIONAL' ? 'CONNECTED' : dbStatus;
    const supaStorageStatus = supaUrl && storageBucket ? 'CONNECTED' : 'NOT_CONFIGURED';
    const sentryStatus = sentryUrl ? 'CONFIGURED' : 'NOT_CONFIGURED';
    const grafanaStatus = grafanaUrl ? 'CONFIGURED' : 'NOT_CONFIGURED';

    return {
      status: dbStatus === 'UNAVAILABLE' ? 'DEGRADED' : 'OPERATIONAL',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      services: {
        api: { status: 'OPERATIONAL', port: process.env.PORT || 4000 },
        database: { status: dbStatus, latencyMs: dbLatencyMs },
        prisma: { status: 'OPERATIONAL', version: '5.22.0' },
        supabaseAuth: { status: supabaseStatus, endpoint: supaUrl || 'Not Configured' },
        supabaseStorage: { status: storageStatus, bucket: storageBucket || 'Not Configured' },
        email: { status: emailStatus, provider: process.env.EMAIL_PROVIDER || 'smtp', host: smtpHost || 'Not Configured' },
      },
      infrastructureLinks: {
        supabaseProject: supaProjectUrl,
        supabaseDatabase: supaDbUrl,
        supabaseStorage: supaStorageUrl,
        sentry: sentryUrl,
        grafana: grafanaUrl,
      },
      infrastructureServices: {
        supabaseProject: { label: 'Supabase Project', status: supaProjectStatus, url: supaProjectUrl },
        supabaseDatabase: { label: 'Supabase Database', status: supaDbStatus, url: supaDbUrl },
        supabaseStorage: { label: 'Supabase Storage', status: supaStorageStatus, url: supaStorageUrl },
        sentry: { label: 'Sentry Error Tracking', status: sentryStatus, url: sentryUrl },
        grafana: { label: 'Grafana Monitoring', status: grafanaStatus, url: grafanaUrl },
      },
    };
  }

  /**
   * GET /api/v1/system-monitor/failed-emails — Failed Email Logs Diagnostic Viewer
   */
  async getFailedEmailLogs(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.EmailLogWhereInput = {
      status: 'FAILED',
    };

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { category: { contains: q, mode: 'insensitive' } },
        { recipient: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { lastError: { contains: q, mode: 'insensitive' } },
        { provider: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, logs] = await Promise.all([
      this.prisma.emailLog.count({ where }),
      this.prisma.emailLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          category: true,
          recipient: true,
          subject: true,
          provider: true,
          status: true,
          attempts: true,
          maxAttempts: true,
          lastError: true,
          messageId: true,
          sentAt: true,
          createdAt: true,
          nextAttemptAt: true,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      logs,
    };
  }

  /**
   * GET /api/v1/system-monitor/audit — Audit Log Viewer
   */
  async getAuditLogs(page = 1, limit = 25, search?: string, entityType?: string, action?: string) {
    const skip = (page - 1) * limit;
    const where: Prisma.AuditLogWhereInput = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { entityType: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (entityType) where.entityType = entityType;
    if (action) where.action = action;

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: { select: { id: true, email: true } },
        },
      }),
    ]);

    return { items: data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * GET /api/v1/system-monitor/global-search — Search across Employees, Orgs, Projects, Documents
   */
  async globalSearch(q: string) {
    if (!q || !q.trim() || q.trim().length < 2) {
      return { employees: [], organizations: [], projects: [], documents: [] };
    }

    const queryStr = q.trim();

    const [employees, organizations, projects, documents] = await Promise.all([
      this.prisma.employee.findMany({
        where: {
          OR: [
            { fullName: { contains: queryStr, mode: 'insensitive' } },
            { employeeCode: { contains: queryStr, mode: 'insensitive' } },
            { workEmail: { contains: queryStr, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, employeeCode: true, fullName: true, department: true, designation: true },
      }),
      this.prisma.organization.findMany({
        where: {
          OR: [
            { legalName: { contains: queryStr, mode: 'insensitive' } },
            { orgNumber: { contains: queryStr, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, orgNumber: true, legalName: true, status: true },
      }),
      this.prisma.project.findMany({
        where: {
          OR: [
            { title: { contains: queryStr, mode: 'insensitive' } },
            { projectCode: { contains: queryStr, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, projectCode: true, title: true, status: true },
      }),
      this.prisma.document.findMany({
        where: {
          OR: [
            { storageKey: { contains: queryStr, mode: 'insensitive' } },
            { type: { contains: queryStr, mode: 'insensitive' } },
          ],
        },
        take: 5,
        select: { id: true, storageKey: true, type: true, entityType: true },
      }),
    ]);

    return { employees, organizations, projects, documents };
  }
}
