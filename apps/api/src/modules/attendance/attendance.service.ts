import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper to get current employee from authenticated user ID
   */
  private async getEmployeeByUserId(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found for authenticated user.');
    }
    if (employee.status === 'RESIGNED' || employee.status === 'TERMINATED') {
      throw new ForbiddenException('Exited or inactive employees cannot perform active attendance operations.');
    }
    return employee;
  }

  /**
   * Helper to normalize a Date to UTC start of day (YYYY-MM-DD)
   */
  private getAttendanceDate(date = new Date()): Date {
    const isoStr = date.toISOString().split('T')[0];
    return new Date(`${isoStr}T00:00:00.000Z`);
  }

  /**
   * Clock In
   */
  async clockIn(user: any) {
    const employee = await this.getEmployeeByUserId(user.id);
    const now = new Date();
    const attendanceDate = this.getAttendanceDate(now);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId: employee.id,
          attendanceDate,
        },
      },
    });

    if (existing) {
      if (existing.status === 'CLOCKED_IN' || existing.status === 'ON_BREAK') {
        throw new ConflictException('Employee is already clocked in for today.');
      }
      if (existing.status === 'CLOCKED_OUT') {
        throw new ConflictException('Employee has already completed clock-out for today.');
      }
    }

    const attendance = await this.prisma.$transaction(async (tx) => {
      const record = await tx.attendance.create({
        data: {
          employeeId: employee.id,
          attendanceDate,
          clockInAt: now,
          status: 'CLOCKED_IN',
        },
        include: { breaks: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'CLOCK_IN',
          entityType: 'Attendance',
          entityId: record.id,
          afterJson: { clockInAt: now, attendanceDate: record.attendanceDate } as any,
        },
      });

      return record;
    });

    return attendance;
  }

  /**
   * Clock Out
   */
  async clockOut(user: any) {
    const employee = await this.getEmployeeByUserId(user.id);
    const now = new Date();
    const attendanceDate = this.getAttendanceDate(now);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId: employee.id,
          attendanceDate,
        },
      },
      include: { breaks: true },
    });

    if (!existing || existing.status === 'CLOCKED_OUT') {
      throw new BadRequestException('No active clock-in session found for today.');
    }

    if (existing.status === 'ON_BREAK') {
      throw new BadRequestException(
        'Cannot clock out while a break is active. Please end your break first.',
      );
    }

    // Calculate total break minutes
    const totalBreakMinutes = existing.breaks.reduce(
      (sum, b) => sum + (b.durationMins || 0),
      0,
    );

    // Calculate worked minutes: clockOutAt - clockInAt - totalBreakMinutes
    const totalSessionMinutes = Math.floor(
      (now.getTime() - existing.clockInAt.getTime()) / (1000 * 60),
    );
    const totalWorkedMinutes = Math.max(0, totalSessionMinutes - totalBreakMinutes);

    const updated = await this.prisma.$transaction(async (tx) => {
      const record = await tx.attendance.update({
        where: { id: existing.id },
        data: {
          clockOutAt: now,
          totalWorkedMinutes,
          totalBreakMinutes,
          status: 'CLOCKED_OUT',
        },
        include: { breaks: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'CLOCK_OUT',
          entityType: 'Attendance',
          entityId: record.id,
          afterJson: { clockOutAt: now, totalWorkedMinutes, totalBreakMinutes } as any,
        },
      });

      return record;
    });

    return updated;
  }

  /**
   * Break Start
   */
  async breakStart(user: any) {
    const employee = await this.getEmployeeByUserId(user.id);
    const now = new Date();
    const attendanceDate = this.getAttendanceDate(now);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId: employee.id,
          attendanceDate,
        },
      },
    });

    if (!existing || existing.status === 'CLOCKED_OUT') {
      throw new BadRequestException('Must be clocked in to start a break.');
    }

    if (existing.status === 'ON_BREAK') {
      throw new ConflictException('Break is already active.');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const attendanceBreak = await tx.attendanceBreak.create({
        data: {
          attendanceId: existing.id,
          startTime: now,
        },
      });

      const attendance = await tx.attendance.update({
        where: { id: existing.id },
        data: { status: 'ON_BREAK' },
        include: { breaks: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'BREAK_START',
          entityType: 'AttendanceBreak',
          entityId: attendanceBreak.id,
          afterJson: { startTime: now, attendanceId: existing.id } as any,
        },
      });

      return { attendance, activeBreak: attendanceBreak };
    });

    return result;
  }

  /**
   * Break End
   */
  async breakEnd(user: any) {
    const employee = await this.getEmployeeByUserId(user.id);
    const now = new Date();
    const attendanceDate = this.getAttendanceDate(now);

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId: employee.id,
          attendanceDate,
        },
      },
      include: { breaks: true },
    });

    if (!existing || existing.status !== 'ON_BREAK') {
      throw new BadRequestException('No active break found for today.');
    }

    const activeBreak = existing.breaks.find((b) => !b.endTime);
    if (!activeBreak) {
      throw new BadRequestException('No active break session found to complete.');
    }

    const durationMins = Math.max(
      0,
      Math.floor((now.getTime() - activeBreak.startTime.getTime()) / (1000 * 60)),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const completedBreak = await tx.attendanceBreak.update({
        where: { id: activeBreak.id },
        data: {
          endTime: now,
          durationMins,
        },
      });

      const allBreaks = await tx.attendanceBreak.findMany({
        where: { attendanceId: existing.id },
      });

      const totalBreakMinutes = allBreaks.reduce(
        (sum, b) => sum + (b.durationMins || 0),
        0,
      );

      const attendance = await tx.attendance.update({
        where: { id: existing.id },
        data: {
          status: 'CLOCKED_IN',
          totalBreakMinutes,
        },
        include: { breaks: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'BREAK_END',
          entityType: 'AttendanceBreak',
          entityId: completedBreak.id,
          afterJson: { endTime: now, durationMins, totalBreakMinutes } as any,
        },
      });

      return { attendance, completedBreak };
    });

    return result;
  }

  /**
   * Get Today's Attendance for Logged-In Employee
   */
  async getTodayAttendance(user: any) {
    const employee = await this.getEmployeeByUserId(user.id);
    const attendanceDate = this.getAttendanceDate(new Date());

    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId: employee.id,
          attendanceDate,
        },
      },
      include: {
        breaks: { orderBy: { startTime: 'asc' } },
      },
    });

    return attendance;
  }

  /**
   * Get Logged-In Employee Attendance History
   */
  async getMyAttendanceHistory(
    user: any,
    page = 1,
    limit = 20,
    startDate?: string,
    endDate?: string,
  ) {
    const employee = await this.getEmployeeByUserId(user.id);
    const skip = (page - 1) * limit;

    const where: any = { employeeId: employee.id };

    if (startDate || endDate) {
      where.attendanceDate = {};
      if (startDate) where.attendanceDate.gte = new Date(`${startDate}T00:00:00.000Z`);
      if (endDate) where.attendanceDate.lte = new Date(`${endDate}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { attendanceDate: 'desc' },
        include: { breaks: { orderBy: { startTime: 'asc' } } },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Helper: Resolve requesting user's organizationId
   */
  private async getRequestingUserOrgId(user?: any): Promise<string | null> {
    if (!user) return null;
    if (user.organizationId) return user.organizationId;

    const emp = await this.prisma.employee.findUnique({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    if (emp?.organizationId) return emp.organizationId;

    const orgUser = await this.prisma.organizationUser.findFirst({
      where: { userId: user.id },
      select: { organizationId: true },
    });
    return orgUser?.organizationId || null;
  }

  /**
   * HR / Admin Attendance History Query across Organization (M-01 Tenant Isolated)
   */
  async getAdminAttendanceHistory(
    query: {
      page?: number;
      limit?: number;
      employeeId?: string;
      department?: string;
      startDate?: string;
      endDate?: string;
      status?: string;
    },
    user?: any,
  ) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const userOrgId = await this.getRequestingUserOrgId(user);
    const where: any = {};

    // M-01 Security: If employeeId is supplied, verify target employee belongs to requesting user's organization
    if (query.employeeId) {
      const targetEmp = await this.prisma.employee.findUnique({
        where: { id: query.employeeId },
        select: { id: true, organizationId: true },
      });

      if (!targetEmp) {
        throw new NotFoundException(`Employee with ID '${query.employeeId}' not found.`);
      }

      if (userOrgId && targetEmp.organizationId !== userOrgId) {
        throw new ForbiddenException(
          'Cross-organization attendance access is strictly forbidden.',
        );
      }

      where.employeeId = query.employeeId;
    } else if (userOrgId) {
      where.employee = { organizationId: userOrgId };
    }

    if (query.status) where.status = query.status;

    if (query.department) {
      where.employee = {
        ...(where.employee || {}),
        department: query.department,
      };
    }

    if (query.startDate || query.endDate) {
      where.attendanceDate = {};
      if (query.startDate) where.attendanceDate.gte = new Date(`${query.startDate}T00:00:00.000Z`);
      if (query.endDate) where.attendanceDate.lte = new Date(`${query.endDate}T23:59:59.999Z`);
    }

    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { attendanceDate: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              department: true,
              designation: true,
              organizationId: true,
            },
          },
          breaks: { orderBy: { startTime: 'asc' } },
        },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * HR / Admin Today's Attendance Overview Metrics (M-01 Tenant Isolated)
   */
  async getAdminAttendanceSummary(user?: any) {
    const today = this.getAttendanceDate(new Date());
    const userOrgId = await this.getRequestingUserOrgId(user);

    const empWhere: any = { status: { in: ['ACTIVE', 'PROBATION', 'ONBOARDING'] } };
    const attWhere: any = { attendanceDate: today };
    const leaveWhere: any = { status: 'ON_LEAVE' };

    if (userOrgId) {
      empWhere.organizationId = userOrgId;
      attWhere.employee = { organizationId: userOrgId };
      leaveWhere.organizationId = userOrgId;
    }

    const [
      totalActiveEmployees,
      todayAttendances,
      onLeaveEmployeesCount,
    ] = await Promise.all([
      this.prisma.employee.count({ where: empWhere }),
      this.prisma.attendance.findMany({
        where: attWhere,
        select: { status: true },
      }),
      this.prisma.employee.count({ where: leaveWhere }),
    ]);

    const presentCount = todayAttendances.length;
    const workingCount = todayAttendances.filter((a) => a.status === 'CLOCKED_IN').length;
    const onBreakCount = todayAttendances.filter((a) => a.status === 'ON_BREAK').length;
    const completedCount = todayAttendances.filter((a) => a.status === 'CLOCKED_OUT').length;

    return {
      totalActiveEmployees,
      presentCount,
      workingCount,
      onBreakCount,
      completedCount,
      onLeaveCount: onLeaveEmployeesCount,
    };
  }
}
