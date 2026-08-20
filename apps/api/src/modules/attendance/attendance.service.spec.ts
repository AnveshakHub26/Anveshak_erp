import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../database/prisma.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';

describe('AttendanceService Unit Tests', () => {
  let service: AttendanceService;
  let mockPrisma: any;

  const mockUser = { id: 'user-emp-1', email: 'emp@anveshak.com' };
  const mockEmployee = {
    id: 'emp-101',
    employeeCode: 'EMP-2026-000001',
    userId: 'user-emp-1',
    fullName: 'Test Employee',
    department: 'Engineering',
  };

  beforeEach(async () => {
    mockPrisma = {
      employee: {
        findUnique: jest.fn(),
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

  describe('breakStart & breakEnd', () => {
    it('should start break when clocked in', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'CLOCKED_IN',
      });
      mockPrisma.attendanceBreak.create.mockResolvedValue({
        id: 'brk-1',
        attendanceId: 'att-1',
        startTime: new Date(),
      });
      mockPrisma.attendance.update.mockResolvedValue({
        id: 'att-1',
        status: 'ON_BREAK',
      });

      const res = await service.breakStart(mockUser);
      expect(res.attendance.status).toBe('ON_BREAK');
      expect(mockPrisma.attendanceBreak.create).toHaveBeenCalled();
    });

    it('should throw ConflictException if already on break', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'ON_BREAK',
      });

      await expect(service.breakStart(mockUser)).rejects.toThrow(ConflictException);
    });

    it('should end active break successfully', async () => {
      const breakStart = new Date(Date.now() - 15 * 60 * 1000); // 15 mins ago
      mockPrisma.employee.findUnique.mockResolvedValue(mockEmployee);
      mockPrisma.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        status: 'ON_BREAK',
        breaks: [{ id: 'brk-1', startTime: breakStart, endTime: null }],
      });
      mockPrisma.attendanceBreak.update.mockResolvedValue({
        id: 'brk-1',
        durationMins: 15,
      });
      mockPrisma.attendanceBreak.findMany.mockResolvedValue([
        { id: 'brk-1', durationMins: 15 },
      ]);
      mockPrisma.attendance.update.mockResolvedValue({
        id: 'att-1',
        status: 'CLOCKED_IN',
        totalBreakMinutes: 15,
      });

      const res = await service.breakEnd(mockUser);
      expect(res.attendance.status).toBe('CLOCKED_IN');
      expect(mockPrisma.attendanceBreak.update).toHaveBeenCalled();
    });
  });

  describe('employee ownership', () => {
    it('should throw NotFoundException if user has no employee profile', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);
      await expect(service.clockIn({ id: 'invalid-user' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
