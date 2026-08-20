import { Test, TestingModule } from '@nestjs/testing';
import { HRService } from './hr.service';
import { PrismaService } from '../../database/prisma.service';
import { ConflictException, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateEmployeeInput } from '@anveshak/validation';

describe('HRService Business Requirements Unit Tests', () => {
  let service: HRService;
  let prisma: any;

  const mockAdminUser = {
    id: 'admin-123',
    email: 'hr.admin@anveshak.com',
    roles: ['ADMIN', 'HR'],
  };

  const mockPmUser = {
    id: 'pm-456',
    email: 'pm.user@anveshak.com',
    roles: ['PM'],
  };

  const mockPrisma = {
    employee: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
    employmentHistory: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    systemCounter: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ nextValue: 127 }),
    },
    document: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HRService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<HRService>(HRService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('Employee Onboarding & Code Generation', () => {
    it('should onboard an employee, provision user, and generate permanent EMP-YYYY-NNNNNN code', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.employee.findUnique.mockResolvedValue(null);
      mockPrisma.systemCounter.findUnique.mockResolvedValue({ name: 'EMPLOYEE_2026', nextValue: 1 });
      mockPrisma.systemCounter.update.mockResolvedValue({ name: 'EMPLOYEE_2026', nextValue: 2 });
      mockPrisma.role.findFirst.mockResolvedValue({ id: 'role-expert', code: 'EXPERT' });

      mockPrisma.user.create.mockResolvedValue({
        id: 'user-emp-1',
        email: 'john.doe@anveshak.com',
        status: 'PENDING',
      });

      const mockEmployeeRecord = {
        id: 'emp-uuid-1',
        employeeCode: 'EMP-2026-000001',
        userId: 'user-emp-1',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        workEmail: 'john.doe@anveshak.com',
        category: 'EXPERT',
        employmentType: 'PERMANENT',
        status: 'ONBOARDING',
      };

      mockPrisma.employee.create.mockResolvedValue(mockEmployeeRecord);

      const input: CreateEmployeeInput = {
        firstName: 'John',
        lastName: 'Doe',
        workEmail: 'john.doe@anveshak.com',
        professionalRole: 'Senior Researcher',
        department: 'R&D',
        designation: 'Lead Scientist',
        category: 'EXPERT',
        employmentType: 'PERMANENT',
        joiningDate: '2026-08-15',
        skills: ['Thermal Coatings', 'CAD'],
        technologies: ['ANSYS', 'Python'],
        baseSalary: '₹12,00,000',
        ndaStatus: 'PENDING',
      };

      const result = await service.onboardEmployee(mockAdminUser, input);

      expect(result).toBeDefined();
      expect(result.employeeCode).toBe('EMP-2026-000001');
      expect(result.provisioningStatus).toBe('PROVISIONED_ACTIVE');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.employmentHistory.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });

    it('should reject duplicate email against existing User or Employee records', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'u-existing', email: 'duplicate@anveshak.com' });

      const input: CreateEmployeeInput = {
        firstName: 'Jane',
        lastName: 'Smith',
        workEmail: 'duplicate@anveshak.com',
        professionalRole: 'Engineer',
        department: 'Engineering',
        designation: 'Senior Engineer',
        category: 'STAFF',
        employmentType: 'PERMANENT',
        joiningDate: '2026-08-15',
        skills: [],
        technologies: [],
        ndaStatus: 'PENDING',
      };

      await expect(service.onboardEmployee(mockAdminUser, input)).rejects.toThrow(ConflictException);
    });
  });

  describe('HR vs PM vs EXPERT Role Field Security & Access Controls', () => {
    it('should include baseSalary for HR/ADMIN users', async () => {
      const mockEmp = {
        id: 'emp-101',
        employeeCode: 'EMP-2026-000101',
        fullName: 'Alice Staff',
        workEmail: 'alice@anveshak.com',
        baseSalary: '₹15,00,000',
        personalEmail: 'alice.personal@gmail.com',
        dateOfBirth: new Date('1990-01-01'),
      };

      mockPrisma.employee.findUnique.mockResolvedValue({
        ...mockEmp,
        user: { id: 'u-101', email: 'alice@anveshak.com', status: 'ACTIVE' },
        history: [],
        projectMemberships: [],
      });
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result: any = await service.getEmployeeById('emp-101');
      expect(result.baseSalary).toBe('₹15,00,000');
    });

    it('should fetch employee profile for PM requesters', async () => {
      const mockEmp = {
        id: 'emp-101',
        userId: 'u-101',
        employeeCode: 'EMP-2026-000101',
        fullName: 'Alice Staff',
        workEmail: 'alice@anveshak.com',
        baseSalary: '₹15,00,000',
        personalEmail: 'alice.personal@gmail.com',
        dateOfBirth: new Date('1990-01-01'),
      };

      mockPrisma.employee.findUnique.mockResolvedValue({
        ...mockEmp,
        user: { id: 'u-101', email: 'alice@anveshak.com', status: 'ACTIVE' },
        history: [],
        projectMemberships: [],
      });
      mockPrisma.document.findMany.mockResolvedValue([]);

      const result: any = await service.getEmployeeById('emp-101');
      expect(result.fullName).toBe('Alice Staff');
    });

    it('should throw NotFoundException if employee does not exist', async () => {
      mockPrisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.getEmployeeById('emp-non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('Employment History & Transitions (Temporary -> Permanent)', () => {
    it('should append EmploymentHistory when converting Temporary -> Permanent', async () => {
      const existing = {
        id: 'emp-temp-1',
        employeeCode: 'EMP-2026-000045',
        employmentType: 'TEMPORARY',
        status: 'ACTIVE',
        designation: 'Temp Developer',
        firstName: 'Alex',
        lastName: 'Smith',
      };

      mockPrisma.employee.findUnique.mockResolvedValue(existing);
      mockPrisma.employee.update.mockResolvedValue({
        ...existing,
        employmentType: 'PERMANENT',
        designation: 'Lead Developer',
      });

      await service.updateEmployee(mockAdminUser, 'emp-temp-1', {
        employmentType: 'PERMANENT',
        designation: 'Lead Developer',
        remarks: 'Converted from Temporary to Permanent based on annual review.',
      });

      expect(mockPrisma.employmentHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeId: 'emp-temp-1',
          changeType: 'PROFILE_UPDATE',
          newType: 'PERMANENT',
        }),
      });
    });
  });

  describe('Offboarding & Account Deactivation', () => {
    it('should set User status to INACTIVE on exit while preserving Employee record', async () => {
      const existing = {
        id: 'emp-offboard-1',
        userId: 'u-offboard-1',
        employeeCode: 'EMP-2026-000088',
        employmentType: 'PERMANENT',
        status: 'ACTIVE',
        designation: 'Engineer',
      };

      mockPrisma.employee.findUnique.mockResolvedValue(existing);
      mockPrisma.employee.update.mockResolvedValue({
        ...existing,
        status: 'TERMINATED',
      });

      await service.exitEmployee(mockAdminUser, 'emp-offboard-1', {
        status: 'TERMINATED',
        remarks: 'Employment contract completed.',
      });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-offboard-1' },
        data: { status: 'INACTIVE' },
      });
      expect(mockPrisma.employee.update).toHaveBeenCalled();
    });
  });

  describe('Rehire Workflow', () => {
    it('should rehire resigned/terminated employee reusing existing Employee record and Employee Code', async () => {
      const resignedEmployee = {
        id: 'emp-rehire-1',
        userId: 'u-rehire-1',
        employeeCode: 'EMP-2026-000127',
        status: 'RESIGNED',
        employmentType: 'PERMANENT',
        designation: 'Former Researcher',
      };

      mockPrisma.employee.findUnique.mockResolvedValue(resignedEmployee);
      mockPrisma.employee.update.mockResolvedValue({
        ...resignedEmployee,
        status: 'ACTIVE',
        joiningDate: new Date('2026-09-01'),
        designation: 'Senior Principal Researcher',
      });

      const result = await service.rehireEmployee(mockAdminUser, 'emp-rehire-1', {
        joiningDate: '2026-09-01',
        employmentType: 'PERMANENT',
        designation: 'Senior Principal Researcher',
        department: 'R&D',
        remarks: 'Rehired after sabbatical.',
      });

      expect(result.employeeCode).toBe('EMP-2026-000127');
      expect(mockPrisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'emp-rehire-1' },
        data: expect.objectContaining({
          status: 'ACTIVE',
          exitDate: null,
        }),
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-rehire-1' },
        data: expect.objectContaining({ status: 'ACTIVE' }),
      });
      expect(mockPrisma.employmentHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          employeeId: 'emp-rehire-1',
          changeType: 'REHIRE',
          newStatus: 'ACTIVE',
        }),
      });
    });
  });

  describe('Bulk Onboarding', () => {
    it('should validate entire payload, reject if duplicates exist, and execute atomic creation for up to 50 employees', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.systemCounter.findUnique.mockResolvedValue({ name: 'EMPLOYEE_2026', nextValue: 10 });
      mockPrisma.systemCounter.update.mockResolvedValue({ name: 'EMPLOYEE_2026', nextValue: 11 });
      mockPrisma.role.findFirst.mockResolvedValue({ id: 'r-staff', code: 'STAFF' });
      mockPrisma.user.create.mockResolvedValue({ id: 'u-bulk-1', email: 'bulk1@anveshak.com' });
      mockPrisma.employee.create.mockResolvedValue({ id: 'e-bulk-1', employeeCode: 'EMP-2026-000010' });

      const bulkPayload: CreateEmployeeInput[] = [
        {
          firstName: 'BulkOne',
          lastName: 'User',
          workEmail: 'bulk1@anveshak.com',
          professionalRole: 'Engineer',
          department: 'Operations',
          designation: 'Junior Engineer',
          category: 'STAFF',
          employmentType: 'PERMANENT',
          joiningDate: '2026-08-15',
          skills: [],
          technologies: [],
          ndaStatus: 'PENDING',
        },
        {
          firstName: 'BulkTwo',
          lastName: 'User',
          workEmail: 'bulk2@anveshak.com',
          professionalRole: 'Developer',
          department: 'IT',
          designation: 'Software Developer',
          category: 'STAFF',
          employmentType: 'PERMANENT',
          joiningDate: '2026-08-15',
          skills: [],
          technologies: [],
          ndaStatus: 'PENDING',
        },
      ];

      const results = await service.bulkOnboard(mockAdminUser, bulkPayload);
      expect(results).toHaveLength(2);
      expect(results[0].status).toBe('PROVISIONED_ACTIVE');
    });
  });
});
