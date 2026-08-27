import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../database/prisma.service';
import { ConflictException, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';

describe('AttendanceService Unit Tests', () => {
  let service: AttendanceService;
  let mockPrisma: any;

  const mockUser = { id: 'user-emp-1', email: 'emp@anveshak.com', organizationId: 'org-a' };
  const mockEmployee = {
    id: 'emp-101',
    employeeCode: 'EMP-2026-000001',
    userId: 'user-emp-1',
    fullName: 'Test Employee',
    department: 'Engineering',
    organizationId: 'org-a',
  };

  beforeEach(async () => {
    mockPrisma = {
      employee: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      organizationUser: {
        findFirst: jest.fn(),
      },
      attendance: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      attendanceBreak: {
        create: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('clockIn', () => {
    it('should clock in successfully when no record exists today', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue(null);
      mockPrisma.attendance.create.mockResolvedValue({
        id: 'att-1',
        employeeId: mockEmployee.id,
        status: 'CLOCKED_IN',
        clockInAt: new Date(),
        breaks: [],
      });

      const res = await service.clockIn(mockUser);
      expect(res.status).toBe('CLOCKED_IN');
      expect(mockPrisma.attendance.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CLOCK_IN' }),
        }),
      );
    });

    it('should throw ConflictException if already clocked in for today', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'CLOCKED_IN',
      });

      await expect(service.clockIn(mockUser)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if already clocked out for today', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'CLOCKED_OUT',
      });

      await expect(service.clockIn(mockUser)).rejects.toThrow(ConflictException);
    });
  });

  describe('clockOut', () => {
    it('should clock out successfully and calculate worked time', async () => {
      const clockInAt = new Date(Date.now() - 8 * 60 * 60 * 1000); // 8 hours ago
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        clockInAt,
        status: 'CLOCKED_IN',
        breaks: [{ id: 'brk-1', durationMins: 30 }],
      });
      mockPrisma.attendance.update.mockResolvedValue({
        id: 'att-1',
        status: 'CLOCKED_OUT',
        totalWorkedMinutes: 450, // 480 mins - 30 break mins
        totalBreakMinutes: 30,
      });

      const res = await service.clockOut(mockUser);
      expect(res.status).toBe('CLOCKED_OUT');
      expect(mockPrisma.attendance.update).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ action: 'CLOCK_OUT' }),
        }),
      );
    });

    it('should throw BadRequestException if on break during clock out attempt', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'ON_BREAK',
        breaks: [],
      });

      await expect(service.clockOut(mockUser)).rejects.toThrow(BadRequestException);
    });
  });

  describe('M-01 Attendance Tenant Isolation', () => {
    it('should REJECT cross-organization employeeId query with ForbiddenException', async () => {
      const hrUserFromOrgA = { id: 'hr-user-1', roles: ['HR'], organizationId: 'org-a' };
      const employeeFromOrgB = { id: 'emp-202', organizationId: 'org-b' };

      mockPrisma.employee.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'emp-202') return Promise.resolve(employeeFromOrgB);
        return Promise.resolve(null);
      });

      await expect(
        service.getAdminAttendanceHistory({ employeeId: 'emp-202' }, hrUserFromOrgA),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow querying employeeId within the same organization', async () => {
      const hrUserFromOrgA = { id: 'hr-user-1', roles: ['HR'], organizationId: 'org-a' };
      const employeeFromOrgA = { id: 'emp-101', organizationId: 'org-a' };

      mockPrisma.employee.findUnique.mockImplementation(({ where }) => {
        if (where.id === 'emp-101') return Promise.resolve(employeeFromOrgA);
        return Promise.resolve(null);
      });
      mockPrisma.attendance.findMany.mockResolvedValue([]);
      mockPrisma.attendance.count.mockResolvedValue(0);

      const res = await service.getAdminAttendanceHistory({ employeeId: 'emp-101' }, hrUserFromOrgA);
      expect(res.items).toBeDefined();
      expect(mockPrisma.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ employeeId: 'emp-101' }),
        }),
      );
    });

    it('should filter summary metrics strictly by requesting user organization', async () => {
      const hrUserFromOrgA = { id: 'hr-user-1', roles: ['HR'], organizationId: 'org-a' };

      mockPrisma.employee.count.mockResolvedValue(10);
      mockPrisma.attendance.findMany.mockResolvedValue([{ status: 'CLOCKED_IN' }]);

      await service.getAdminAttendanceSummary(hrUserFromOrgA);

      expect(mockPrisma.employee.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-a' }),
        }),
      );
    });
  });
});
