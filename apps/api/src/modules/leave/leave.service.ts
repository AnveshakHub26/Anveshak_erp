import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Prisma } from '@prisma/client';

import { EmailService } from '../../common/email/email.service';

@Injectable()
export class LeaveService {
  constructor(
    private prisma: PrismaService,
    @Optional() private notificationsService?: NotificationsService,
    @Optional() private emailService?: EmailService,
  ) {}

  /**
   * Concurrency-safe Leave Reference Code generator using SystemCounter table & PostgreSQL transaction locking
   */
  private async generateLeaveReferenceCode(tx: Prisma.TransactionClient, year: number): Promise<string> {
    const name = `LEAVE_REQUEST_${year}`;

    const counter = await tx.systemCounter.upsert({
      where: { name },
      update: { nextValue: { increment: 1 } },
      create: { name, nextValue: 1 },
    });

    const sequenceNumber = String(counter.nextValue).padStart(6, '0');
    return `LR-${year}-${sequenceNumber}`;
  }

  /**
   * Helper to get employee record by authenticated user ID
   */
  private async getEmployeeByUserId(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!employee) {
      throw new NotFoundException('Employee profile not found for authenticated user.');
    }
    if (employee.status === 'RESIGNED' || employee.status === 'TERMINATED') {
      throw new ForbiddenException('Exited or inactive employees cannot perform active leave operations.');
    }
    return employee;
  }

  /**
   * GET /api/v1/leave/types — List all active leave types
   */
  async getLeaveTypes() {
    return this.prisma.leaveType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * GET /api/v1/leave/balances/me — Get logged-in employee leave balances
   */
  async getEmployeeBalances(userId: string, year?: number) {
    const employee = await this.getEmployeeByUserId(userId);
    const targetYear = year || new Date().getFullYear();

    // Provision default balances for active leave types if none exist yet for targetYear
    const activeTypes = await this.prisma.leaveType.findMany({ where: { isActive: true } });
    const existingBalances = await this.prisma.leaveBalance.findMany({
      where: { employeeId: employee.id, year: targetYear },
    });

    const existingTypeIds = new Set(existingBalances.map((b) => b.leaveTypeId));
    const missingTypes = activeTypes.filter((t) => !existingTypeIds.has(t.id));

    if (missingTypes.length > 0) {
      await this.prisma.$transaction(
        missingTypes.map((type) =>
          this.prisma.leaveBalance.create({
            data: {
              employeeId: employee.id,
              leaveTypeId: type.id,
              year: targetYear,
              allocatedDays: type.annualAllocation,
              usedDays: 0,
              pendingDays: 0,
            },
          }),
        ),
      );
    }

    const balances = await this.prisma.leaveBalance.findMany({
      where: { employeeId: employee.id, year: targetYear },
      include: { leaveType: true },
      orderBy: { leaveType: { name: 'asc' } },
    });

    return balances.map((b) => ({
      ...b,
      availableDays: Math.max(0, b.allocatedDays - b.usedDays - b.pendingDays),
    }));
  }

  /**
   * POST /api/v1/leave/requests — Submit a new leave request
   */
  async submitLeaveRequest(
    userId: string,
    dto: {
      leaveTypeId: string;
      startDate: string;
      endDate: string;
      reason: string;
    },
  ) {
    const employee = await this.getEmployeeByUserId(userId);

    if (employee.status === 'RESIGNED' || employee.status === 'TERMINATED') {
      throw new ForbiddenException('Inactive or terminated employees cannot apply for leave.');
    }

    if (!dto.reason || !dto.reason.trim()) {
      throw new BadRequestException('Leave reason is required.');
    }

    const startDate = new Date(`${dto.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${dto.endDate}T00:00:00.000Z`);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid start or end date format.');
    }

    if (endDate < startDate) {
      throw new BadRequestException('End date cannot be earlier than start date.');
    }

    // Inclusive calendar day count
    const totalDays =
      Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      throw new BadRequestException('Total leave duration must be at least 1 day.');
    }

    const leaveType = await this.prisma.leaveType.findUnique({
      where: { id: dto.leaveTypeId },
    });

    if (!leaveType || !leaveType.isActive) {
      throw new BadRequestException('Selected leave type is invalid or inactive.');
    }

    // Overlap check
    const overlapping = await this.prisma.leaveRequest.findFirst({
      where: {
        employeeId: employee.id,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Overlapping leave request already exists (${overlapping.referenceCode}: ${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]}).`,
      );
    }

    const leaveYear = startDate.getFullYear();

    // Fetch or provision leave balance
    let balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: leaveYear,
        },
      },
    });

    if (!balance) {
      balance = await this.prisma.leaveBalance.create({
        data: {
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          year: leaveYear,
          allocatedDays: leaveType.annualAllocation,
          usedDays: 0,
          pendingDays: 0,
        },
      });
    }

    const availableDays = balance.allocatedDays - balance.usedDays - balance.pendingDays;
    if (availableDays < totalDays) {
      throw new BadRequestException(
        `Insufficient leave balance for ${leaveType.name}. Available: ${availableDays} day(s), Requested: ${totalDays} day(s).`,
      );
    }

    // Atomic Transaction: Generate code, create request, lock pendingDays, log audit
    const leaveRequest = await this.prisma.$transaction(async (tx) => {
      const referenceCode = await this.generateLeaveReferenceCode(tx, leaveYear);

      const req = await tx.leaveRequest.create({
        data: {
          referenceCode,
          employeeId: employee.id,
          leaveTypeId: leaveType.id,
          startDate,
          endDate,
          totalDays,
          reason: dto.reason.trim(),
          status: 'PENDING',
        },
        include: {
          leaveType: true,
          employee: {
            select: { id: true, employeeCode: true, fullName: true, department: true },
          },
        },
      });

      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: { pendingDays: { increment: totalDays } },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'LEAVE_SUBMITTED',
          entityType: 'LeaveRequest',
          entityId: req.id,
          afterJson: {
            referenceCode: req.referenceCode,
            totalDays: req.totalDays,
            startDate: req.startDate,
            endDate: req.endDate,
          } as any,
        },
      });

      return req;
    });

    // 1. Notify Employee (In-App)
    if (this.notificationsService && userId) {
      try {
        await this.notificationsService.create({
          recipientUserId: userId,
          eventType: 'LEAVE_SUBMITTED',
          entityType: 'LeaveRequest',
          entityId: leaveRequest.id,
          message: `Your leave request ${leaveRequest.referenceCode} has been submitted for HR review.`,
        });
      } catch {
        // Non-blocking notification
      }
    }

    // 2. Notify HR / Admins (In-App & Email)
    try {
      const hrUserRoles = await this.prisma.userRole.findMany({
        where: { role: { code: { in: ['HR', 'ADMIN'] } } },
        include: { user: { select: { id: true, email: true } } },
      });

      const uniqueHrUsers = Array.from(
        new Map(hrUserRoles.map((ur) => [ur.userId, ur.user])).values(),
      );

      for (const hrUserObj of uniqueHrUsers) {
        if (hrUserObj) {
          if (this.notificationsService) {
            await this.notificationsService.create({
              recipientUserId: hrUserObj.id,
              eventType: 'LEAVE_SUBMITTED',
              entityType: 'LeaveRequest',
              entityId: leaveRequest.id,
              message: `New leave request submitted by ${employee.fullName} (${leaveRequest.referenceCode}, ${totalDays} day(s)).`,
            });
          }

          if (this.emailService) {
            await this.emailService.sendLeaveSubmittedHREmail(
              hrUserObj.email,
              employee.fullName,
              employee.employeeCode,
              leaveRequest.referenceCode,
              leaveType.name,
              leaveType.isPaid,
              dto.startDate,
              dto.endDate,
              totalDays,
              dto.reason.trim(),
            );
          }
        }
      }
    } catch {
      // Non-blocking notification failure
    }

    return leaveRequest;
  }

  /**
   * GET /api/v1/leave/requests/me — Get logged-in employee leave requests
   */
  async getMyLeaveRequests(
    userId: string,
    query: { status?: string; year?: number; page?: number; limit?: number },
  ) {
    const employee = await this.getEmployeeByUserId(userId);
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = { employeeId: employee.id };
    if (query.status) where.status = query.status;
    if (query.year) {
      const year = Number(query.year);
      where.startDate = {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
        lte: new Date(`${year}-12-31T23:59:59.999Z`),
      };
    }

    const [items, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          leaveType: true,
          reviewedBy: { select: { id: true, email: true } },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
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
   * GET /api/v1/leave/requests/:id — Get details for single leave request
   */
  async getLeaveRequestDetails(user: any, requestId: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: {
        leaveType: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            workEmail: true,
            department: true,
            designation: true,
            userId: true,
          },
        },
        reviewedBy: { select: { id: true, email: true } },
      },
    });

    if (!request) {
      throw new NotFoundException(`Leave request with ID '${requestId}' not found.`);
    }

    const isHrOrAdmin = user.userRoles?.some((ur: any) =>
      ['HR', 'ADMIN'].includes(ur.role?.code),
    );

    if (!isHrOrAdmin && request.employee.userId !== user.id) {
      throw new ForbiddenException('You do not have access to view this leave request.');
    }

    return request;
  }

  /**
   * PATCH /api/v1/leave/requests/:id/cancel — Cancel eligible pending request by employee
   */
  async cancelLeaveRequest(userId: string, requestId: string) {
    const employee = await this.getEmployeeByUserId(userId);

    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException(`Leave request '${requestId}' not found.`);
    }

    if (request.employeeId !== employee.id) {
      throw new ForbiddenException('You can only cancel your own leave requests.');
    }

    if (request.status !== 'PENDING') {
      throw new BadRequestException(
        `Only PENDING leave requests can be cancelled. Current status: ${request.status}.`,
      );
    }

    const leaveYear = request.startDate.getFullYear();

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedReq = await tx.leaveRequest.update({
        where: { id: requestId },
        data: { status: 'CANCELLED' },
        include: { leaveType: true },
      });

      const balance = await tx.leaveBalance.findUnique({
        where: {
          employeeId_leaveTypeId_year: {
            employeeId: employee.id,
            leaveTypeId: request.leaveTypeId,
            year: leaveYear,
          },
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: Math.max(0, balance.pendingDays - request.totalDays),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          action: 'LEAVE_CANCELLED',
          entityType: 'LeaveRequest',
          entityId: requestId,
          afterJson: { referenceCode: request.referenceCode, status: 'CANCELLED' } as any,
        },
      });

      return updatedReq;
    });

    // Notify HR / Admins
    if (this.notificationsService) {
      try {
        const hrUserRoles = await this.prisma.userRole.findMany({
          where: { role: { code: { in: ['HR', 'ADMIN'] } } },
          select: { userId: true },
        });
        const uniqueHrUserIds = Array.from(new Set(hrUserRoles.map((ur) => ur.userId)));
        for (const hrId of uniqueHrUserIds) {
          await this.notificationsService.create({
            recipientUserId: hrId,
            eventType: 'LEAVE_CANCELLED',
            entityType: 'LeaveRequest',
            entityId: requestId,
            message: `Leave request ${request.referenceCode} was cancelled by ${employee.fullName}.`,
          });
        }
      } catch {
        // Non-blocking notification failure
      }
    }

    return result;
  }

  /**
   * GET /api/v1/hr/leave/requests — Organization-wide HR leave requests list
   */
  async getHRLeaveRequests(query: {
    status?: string;
    employeeId?: string;
    department?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.employeeId) where.employeeId = query.employeeId;
    if (query.department) {
      where.employee = { department: query.department };
    }

    const [items, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          leaveType: true,
          employee: {
            select: {
              id: true,
              employeeCode: true,
              fullName: true,
              department: true,
              designation: true,
            },
          },
          reviewedBy: { select: { id: true, email: true } },
        },
      }),
      this.prisma.leaveRequest.count({ where }),
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
   * POST /api/v1/hr/leave/requests/:id/approve — HR Atomic Leave Approval
   */
  async approveLeaveRequest(hrUser: any, requestId: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true, leaveType: true },
    });

    if (!request) {
      throw new NotFoundException(`Leave request '${requestId}' not found.`);
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException(
        `Leave request '${request.referenceCode}' is no longer pending (current status: ${request.status}).`,
      );
    }

    const leaveYear = request.startDate.getFullYear();

    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: leaveYear,
        },
      },
    });

    if (!balance) {
      throw new NotFoundException(
        `Leave balance record for employee '${request.employee.fullName}' year ${leaveYear} not found.`,
      );
    }

    // Atomic Approval Transaction
    const approvedRequest = await this.prisma.$transaction(async (tx) => {
      const updatedReq = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          reviewedById: hrUser.id,
          reviewedAt: new Date(),
        },
        include: {
          leaveType: true,
          employee: { select: { id: true, userId: true, fullName: true } },
        },
      });

      await tx.leaveBalance.update({
        where: { id: balance.id },
        data: {
          pendingDays: Math.max(0, balance.pendingDays - request.totalDays),
          usedDays: balance.usedDays + request.totalDays,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: hrUser.id,
          action: 'LEAVE_APPROVED',
          entityType: 'LeaveRequest',
          entityId: requestId,
          beforeJson: { status: 'PENDING' } as any,
          afterJson: {
            status: 'APPROVED',
            referenceCode: request.referenceCode,
            reviewedById: hrUser.id,
          } as any,
        },
      });

      return updatedReq;
    });

    // Notify Employee (In-App & Email)
    if (approvedRequest.employee.userId) {
      try {
        if (this.notificationsService) {
          await this.notificationsService.create({
            recipientUserId: approvedRequest.employee.userId,
            eventType: 'LEAVE_APPROVED',
            entityType: 'LeaveRequest',
            entityId: approvedRequest.id,
            message: `Your leave request ${approvedRequest.referenceCode} (${approvedRequest.totalDays} day(s)) has been APPROVED by HR.`,
          });
        }

        if (this.emailService) {
          const empUser = await this.prisma.user.findUnique({
            where: { id: approvedRequest.employee.userId },
            select: { email: true },
          });

          if (empUser?.email) {
            await this.emailService.sendLeaveApprovedEmail(
              empUser.email,
              approvedRequest.employee.fullName,
              approvedRequest.referenceCode,
              approvedRequest.leaveType.name,
              approvedRequest.startDate.toISOString().split('T')[0],
              approvedRequest.endDate.toISOString().split('T')[0],
              approvedRequest.totalDays,
              hrUser.email || 'HR Administrator',
            );
          }
        }
      } catch {
        // Non-blocking notification/email failure
      }
    }

    return approvedRequest;
  }

  /**
   * POST /api/v1/hr/leave/requests/:id/reject — HR Atomic Leave Rejection
   */
  async rejectLeaveRequest(
    hrUser: any,
    requestId: string,
    rejectionReason: string,
  ) {
    if (!rejectionReason || !rejectionReason.trim()) {
      throw new BadRequestException('Rejection reason is required.');
    }

    const request = await this.prisma.leaveRequest.findUnique({
      where: { id: requestId },
      include: { employee: true },
    });

    if (!request) {
      throw new NotFoundException(`Leave request '${requestId}' not found.`);
    }

    if (request.status !== 'PENDING') {
      throw new ConflictException(
        `Leave request '${request.referenceCode}' is no longer pending (current status: ${request.status}).`,
      );
    }

    const leaveYear = request.startDate.getFullYear();

    const balance = await this.prisma.leaveBalance.findUnique({
      where: {
        employeeId_leaveTypeId_year: {
          employeeId: request.employeeId,
          leaveTypeId: request.leaveTypeId,
          year: leaveYear,
        },
      },
    });

    // Atomic Rejection Transaction
    const rejectedRequest = await this.prisma.$transaction(async (tx) => {
      const updatedReq = await tx.leaveRequest.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          rejectionReason: rejectionReason.trim(),
          reviewedById: hrUser.id,
          reviewedAt: new Date(),
        },
        include: {
          leaveType: true,
          employee: { select: { id: true, userId: true, fullName: true } },
        },
      });

      if (balance) {
        await tx.leaveBalance.update({
          where: { id: balance.id },
          data: {
            pendingDays: Math.max(0, balance.pendingDays - request.totalDays),
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: hrUser.id,
          action: 'LEAVE_REJECTED',
          entityType: 'LeaveRequest',
          entityId: requestId,
          beforeJson: { status: 'PENDING' } as any,
          afterJson: {
            status: 'REJECTED',
            referenceCode: request.referenceCode,
            rejectionReason,
            reviewedById: hrUser.id,
          } as any,
        },
      });

      return updatedReq;
    });

    // Notify Employee (In-App & Email)
    if (rejectedRequest.employee.userId) {
      try {
        if (this.notificationsService) {
          await this.notificationsService.create({
            recipientUserId: rejectedRequest.employee.userId,
            eventType: 'LEAVE_REJECTED',
            entityType: 'LeaveRequest',
            entityId: rejectedRequest.id,
            message: `Your leave request ${rejectedRequest.referenceCode} has been REJECTED. Reason: ${rejectionReason.trim()}`,
          });
        }

        if (this.emailService) {
          const empUser = await this.prisma.user.findUnique({
            where: { id: rejectedRequest.employee.userId },
            select: { email: true },
          });

          if (empUser?.email) {
            await this.emailService.sendLeaveRejectedEmail(
              empUser.email,
              rejectedRequest.employee.fullName,
              rejectedRequest.referenceCode,
              rejectedRequest.leaveType.name,
              rejectedRequest.startDate.toISOString().split('T')[0],
              rejectedRequest.endDate.toISOString().split('T')[0],
              rejectionReason.trim(),
            );
          }
        }
      } catch {
        // Non-blocking notification/email failure
      }
    }

    return rejectedRequest;
  }
}
