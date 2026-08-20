import { Test, TestingModule } from '@nestjs/testing';
import { LeaveService } from './leave.service';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('LeaveService Unit Tests', () => {
  let service: LeaveService;
  let mockPrisma: any;
  let mockNotificationsService: any;

  const mockEmployeeUser = { id: 'usr-emp-1', email: 'emp@anveshak.com' };
  const mockHrUser = { id: 'usr-hr-1', email: 'hr@anveshak.com' };

  const mockEmployee = {
    id: 'emp-1',
    userId: 'usr-emp-1',
    employeeCode: 'EMP-2026-000001',
    fullName: 'Jane Doe',
    status: 'ACTIVE',
    department: 'Engineering',
  };

  const mockLeaveType = {
    id: 'lt-sick',
    code: 'SICK',
    name: 'Sick Leave',
    annualAllocation: 12,
    isActive: true,
  };

  const mockLeaveBalance = {
    id: 'lb-1',
    employeeId: 'emp-1',
    leaveTypeId: 'lt-sick',
    year: 2026,
    allocatedDays: 12,
    usedDays: 2,
    pendingDays: 0,
  };

  beforeEach(async () => {
    mockNotificationsService = {
      create: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    mockPrisma = {
      employee: {
        findUnique: jest.fn(),
      },
      leaveType: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      leaveBalance: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      leaveRequest: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      systemCounter: {
        upsert: jest.fn().mockResolvedValue({ nextValue: 1 }),
      },
      userRole: {
        findMany: jest.fn().mockResolvedValue([{ userId: 'usr-hr-1' }]),
      },
      auditLog: {
        create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
      },
      $transaction: jest.fn(async (callback) => {
        if (typeof callback === 'function') {
          return callback(mockPrisma);
        }
        return Promise.all(callback);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<LeaveService>(LeaveService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('submitLeaveRequest', () => {
    it('should submit leave request and lock pendingDays when valid', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.leaveType.findUnique.mockResolvedValue(mockLeaveType);
      mockPrisma.leaveRequest.findFirst.mockResolvedValue(null); // No overlap
      mockPrisma.leaveBalance.findUnique.mockResolvedValue(mockLeaveBalance);
      mockPrisma.leaveRequest.create.mockResolvedValue({
        id: 'lr-1',
        referenceCode: 'LR-2026-000001',
        employeeId: 'emp-1',
        leaveTypeId: 'lt-sick',
        startDate: new Date('2026-09-01T00:00:00.000Z'),
        endDate: new Date('2026-09-03T00:00:00.000Z'),
        totalDays: 3,
        status: 'PENDING',
      });

      const res = await service.submitLeaveRequest(mockEmployeeUser.id, {
        leaveTypeId: 'lt-sick',
        startDate: '2026-09-01',
        endDate: '2026-09-03',
        reason: 'Medical checkup',
      });

      expect(res.referenceCode).toBe('LR-2026-000001');
      expect(mockPrisma.leaveBalance.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { pendingDays: { increment: 3 } },
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'LEAVE_SUBMITTED' }),
        }),
      );
      expect(mockNotificationsService.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if end date is before start date', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      await expect(
        service.submitLeaveRequest(mockEmployeeUser.id, {
          leaveTypeId: 'lt-sick',
          startDate: '2026-09-05',
          endDate: '2026-09-01',
          reason: 'Invalid dates',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if request overlaps with existing leave', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.leaveType.findUnique.mockResolvedValue(mockLeaveType);
      mockPrisma.leaveRequest.findFirst.mockResolvedValue({
        id: 'existing-lr',
        referenceCode: 'LR-2026-000005',
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-09-04'),
      });

      await expect(
        service.submitLeaveRequest(mockEmployeeUser.id, {
          leaveTypeId: 'lt-sick',
          startDate: '2026-09-02',
          endDate: '2026-09-05',
          reason: 'Overlapping request',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if available leave balance is insufficient', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.leaveType.findUnique.mockResolvedValue(mockLeaveType);
      mockPrisma.leaveRequest.findFirst.mockResolvedValue(null);
      mockPrisma.leaveBalance.findUnique.mockResolvedValue({
        ...mockLeaveBalance,
        allocatedDays: 12,
        usedDays: 10,
        pendingDays: 1, // Available = 1
      });

      await expect(
        service.submitLeaveRequest(mockEmployeeUser.id, {
          leaveTypeId: 'lt-sick',
          startDate: '2026-09-01',
          endDate: '2026-09-05', // 5 days requested
          reason: 'Long trip',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('approveLeaveRequest', () => {
    it('should approve pending leave, decrease pendingDays, increase usedDays, create audit & notify employee', async () => {
      const mockReq = {
        id: 'lr-1',
        referenceCode: 'LR-2026-000001',
        employeeId: 'emp-1',
        leaveTypeId: 'lt-sick',
        totalDays: 2,
        status: 'PENDING',
        startDate: new Date('2026-09-01'),
        employee: { ...mockEmployee, userId: 'usr-emp-1' },
      };

      mockPrisma.leaveRequest.findUnique.mockResolvedValue(mockReq);
      mockPrisma.leaveBalance.findUnique.mockResolvedValue({
        id: 'lb-1',
        pendingDays: 2,
        usedDays: 0,
      });
      mockPrisma.leaveRequest.update.mockResolvedValue({
        ...mockReq,
        status: 'APPROVED',
        employee: { userId: 'usr-emp-1', fullName: 'Jane' },
      });

      const res = await service.approveLeaveRequest(mockHrUser, 'lr-1');
      expect(res.status).toBe('APPROVED');
      expect(mockPrisma.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'lb-1' },
        data: { pendingDays: 0, usedDays: 2 },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'LEAVE_APPROVED' }),
        }),
      );
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'usr-emp-1',
          eventType: 'LEAVE_APPROVED',
        }),
      );
    });

    it('should throw ConflictException if leave request is no longer PENDING (double approval protection)', async () => {
      mockPrisma.leaveRequest.findUnique.mockResolvedValue({
        id: 'lr-1',
        referenceCode: 'LR-2026-000001',
        status: 'APPROVED',
      });

      await expect(service.approveLeaveRequest(mockHrUser, 'lr-1')).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('rejectLeaveRequest', () => {
    it('should reject pending leave, release pendingDays, store reason, create audit & notify employee', async () => {
      const mockReq = {
        id: 'lr-1',
        referenceCode: 'LR-2026-000001',
        employeeId: 'emp-1',
        leaveTypeId: 'lt-sick',
        totalDays: 2,
        status: 'PENDING',
        startDate: new Date('2026-09-01'),
        employee: { ...mockEmployee, userId: 'usr-emp-1' },
      };

      mockPrisma.leaveRequest.findUnique.mockResolvedValue(mockReq);
      mockPrisma.leaveBalance.findUnique.mockResolvedValue({
        id: 'lb-1',
        pendingDays: 2,
        usedDays: 0,
      });
      mockPrisma.leaveRequest.update.mockResolvedValue({
        ...mockReq,
        status: 'REJECTED',
        rejectionReason: 'Project critical milestone',
        employee: { userId: 'usr-emp-1', fullName: 'Jane' },
      });

      const res = await service.rejectLeaveRequest(
        mockHrUser,
        'lr-1',
        'Project critical milestone',
      );
      expect(res.status).toBe('REJECTED');
      expect(mockPrisma.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'lb-1' },
        data: { pendingDays: 0 },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'LEAVE_REJECTED' }),
        }),
      );
      expect(mockNotificationsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          recipientUserId: 'usr-emp-1',
          eventType: 'LEAVE_REJECTED',
        }),
      );
    });

    it('should throw BadRequestException if rejection reason is missing', async () => {
      await expect(
        service.rejectLeaveRequest(mockHrUser, 'lr-1', '   '),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelLeaveRequest', () => {
    it('should allow employee to cancel their own pending request and release pendingDays', async () => {
      const mockReq = {
        id: 'lr-1',
        referenceCode: 'LR-2026-000001',
        employeeId: 'emp-1',
        leaveTypeId: 'lt-sick',
        totalDays: 2,
        status: 'PENDING',
        startDate: new Date('2026-09-01'),
      };

      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.leaveRequest.findUnique.mockResolvedValue(mockReq);
      mockPrisma.leaveRequest.update.mockResolvedValue({
        ...mockReq,
        status: 'CANCELLED',
      });
      mockPrisma.leaveBalance.findUnique.mockResolvedValue({
        id: 'lb-1',
        pendingDays: 2,
      });

      const res = await service.cancelLeaveRequest(mockEmployeeUser.id, 'lr-1');
      expect(res.status).toBe('CANCELLED');
      expect(mockPrisma.leaveBalance.update).toHaveBeenCalledWith({
        where: { id: 'lb-1' },
        data: { pendingDays: 0 },
      });
    });

    it('should throw ForbiddenException if trying to cancel another employees request', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.leaveRequest.findUnique.mockResolvedValue({
        id: 'lr-2',
        employeeId: 'emp-other-user',
        status: 'PENDING',
      });

      await expect(
        service.cancelLeaveRequest(mockEmployeeUser.id, 'lr-2'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
