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
        leaveType: mockLeaveType,
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

    it('should throw ForbiddenException if HR officer attempts to approve their own leave request', async () => {
      mockPrisma.leaveRequest.findUnique.mockResolvedValue({
        id: 'lr-self',
        referenceCode: 'LR-2026-000099',
        status: 'PENDING',
        employeeId: 'emp-hr-1',
        employee: { userId: mockHrUser.id, fullName: 'HR Admin' },
      });

      await expect(service.approveLeaveRequest(mockHrUser, 'lr-self')).rejects.toThrow(
        ForbiddenException,
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

  describe('LeavePolicyEngine Business Rules', () => {
    it('should calculate age correctly from dateOfBirth', () => {
      const { LeavePolicyEngine } = require('./leave-policy.engine');
      const age30 = LeavePolicyEngine.calculateAge('1996-05-15');
      expect(age30).toBeGreaterThanOrEqual(29);
      expect(age30).toBeLessThanOrEqual(31);

      const ageNull = LeavePolicyEngine.calculateAge(null);
      expect(ageNull).toBeNull();
    });

    it('should evaluate gender and age eligibility correctly', () => {
      const { LeavePolicyEngine } = require('./leave-policy.engine');

      const maleEmp = { gender: 'Male', dateOfBirth: '1990-01-01' };
      const femaleEmpYoung = { gender: 'Female', dateOfBirth: '1995-01-01' };
      const femaleEmpOver50 = { gender: 'Female', dateOfBirth: '1960-01-01' };
      const nonBinaryEmp = { gender: 'Others / Prefer not to say', dateOfBirth: '1992-01-01' };

      // Paternity
      expect(LeavePolicyEngine.isEligible(maleEmp, 'PATERNITY')).toBe(true);
      expect(LeavePolicyEngine.isEligible(femaleEmpYoung, 'PATERNITY')).toBe(false);
      expect(LeavePolicyEngine.isEligible(nonBinaryEmp, 'PATERNITY')).toBe(true);

      // Maternity
      expect(LeavePolicyEngine.isEligible(femaleEmpYoung, 'MATERNITY')).toBe(true);
      expect(LeavePolicyEngine.isEligible(maleEmp, 'MATERNITY')).toBe(false);
      expect(LeavePolicyEngine.isEligible(nonBinaryEmp, 'MATERNITY')).toBe(true);

      // Menstrual
      expect(LeavePolicyEngine.isEligible(femaleEmpYoung, 'MENSTRUAL')).toBe(true);
      expect(LeavePolicyEngine.isEligible(femaleEmpOver50, 'MENSTRUAL')).toBe(false);
      expect(LeavePolicyEngine.isEligible(maleEmp, 'MENSTRUAL')).toBe(false);
      expect(LeavePolicyEngine.isEligible(nonBinaryEmp, 'MENSTRUAL')).toBe(true);
    });

    it('should enforce mandatory supporting proof for Study Leave', () => {
      const { LeavePolicyEngine } = require('./leave-policy.engine');
      const emp = { gender: 'Female', dateOfBirth: '1995-01-01', fullName: 'Jane Doe' };
      const leaveType = { code: 'STUDY', name: 'Study / Training Leave' };

      expect(() =>
        LeavePolicyEngine.validateSubmission(
          emp,
          leaveType,
          {
            startDate: new Date('2026-09-01'),
            endDate: new Date('2026-09-03'),
            totalDays: 3,
            reason: 'Semester Exams',
          },
          0,
        ),
      ).toThrow(BadRequestException);

      expect(() =>
        LeavePolicyEngine.validateSubmission(
          emp,
          leaveType,
          {
            startDate: new Date('2026-09-01'),
            endDate: new Date('2026-09-03'),
            totalDays: 3,
            reason: 'Semester Exams',
            documentKey: 'leave_proof/exam.pdf',
          },
          0,
        ),
      ).not.toThrow();
    });

    it('should enforce strict 1 day per month limit for Menstrual Leave', () => {
      const { LeavePolicyEngine } = require('./leave-policy.engine');
      const emp = { gender: 'Female', dateOfBirth: '1995-01-01', fullName: 'Jane Doe' };
      const leaveType = { code: 'MENSTRUAL', name: 'Menstrual Leave' };

      // Cannot request > 1 day in single application
      expect(() =>
        LeavePolicyEngine.validateSubmission(
          emp,
          leaveType,
          {
            startDate: new Date('2026-09-01'),
            endDate: new Date('2026-09-02'),
            totalDays: 2,
            reason: 'Menstrual discomfort',
          },
          0,
        ),
      ).toThrow(BadRequestException);

      // Cannot apply if 1 day was already used in current month
      expect(() =>
        LeavePolicyEngine.validateSubmission(
          emp,
          leaveType,
          {
            startDate: new Date('2026-09-15'),
            endDate: new Date('2026-09-15'),
            totalDays: 1,
            reason: 'Menstrual discomfort',
          },
          1, // Used 1 day already
        ),
      ).toThrow(BadRequestException);

      // Allowed if 0 days used and requesting 1 day
      expect(() =>
        LeavePolicyEngine.validateSubmission(
          emp,
          leaveType,
          {
            startDate: new Date('2026-09-15'),
            endDate: new Date('2026-09-15'),
            totalDays: 1,
            reason: 'Menstrual discomfort',
          },
          0,
        ),
      ).not.toThrow();
    });
  });
});
