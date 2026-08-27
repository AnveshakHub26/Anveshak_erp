import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Optional,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { Prisma } from '@prisma/client';
import { CreateEmployeeInput, UpdateEmployeeInput, RehireEmployeeInput } from '@anveshak/validation';
import * as crypto from 'crypto';
import * as argon2 from 'argon2';

import { EmailService } from '../../common/email/email.service';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class HRService {
  private readonly logger = new Logger(HRService.name);

  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
    @Optional() private emailService?: EmailService,
    @Optional() private notificationsService?: NotificationsService,
  ) {}

  /**
   * Concurrency-safe Employee Code generator using SystemCounter table & PostgreSQL transaction locking
   */
  private async generateEmployeeCode(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const name = `EMPLOYEE_${year}`;

    const counter = await tx.systemCounter.upsert({
      where: { name },
      update: { nextValue: { increment: 1 } },
      create: { name, nextValue: 1 },
    });

    const sequenceNumber = String(counter.nextValue).padStart(6, '0');
    return `EMP-${year}-${sequenceNumber}`;
  }

  /**
   * GET /api/v1/hr/dashboard — Realtime HR workforce metrics
   */
  async getDashboard() {
    const [
      totalEmployees,
      activeEmployees,
      onboardingEmployees,
      resignedEmployees,
      terminatedEmployees,
      experts,
      interns,
      staffExecs,
      permanent,
      temporary,
      probationary,
      assignedCount,
      totalDepts,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'ONBOARDING' } }),
      this.prisma.employee.count({ where: { status: 'RESIGNED' } }),
      this.prisma.employee.count({ where: { status: 'TERMINATED' } }),
      this.prisma.employee.count({ where: { category: 'EXPERT' } }),
      this.prisma.employee.count({ where: { category: 'INTERN' } }),
      this.prisma.employee.count({ where: { category: { in: ['STAFF', 'EXECUTIVE'] } } }),
      this.prisma.employee.count({ where: { employmentType: 'PERMANENT' } }),
      this.prisma.employee.count({ where: { employmentType: 'TEMPORARY' } }),
      this.prisma.employee.count({ where: { employmentType: 'PROBATIONARY' } }),
      this.prisma.projectMember.groupBy({ by: ['employeeId'] }).then((r) => r.length),
      this.prisma.employee.groupBy({ by: ['department'] }),
    ]);

    return {
      totalEmployees,
      activeEmployees,
      onboardingEmployees,
      totalDepartments: totalDepts.length,
      allocationBreakdown: {
        assigned: assignedCount,
        unassigned: Math.max(0, totalEmployees - assignedCount),
      },
      categoryBreakdown: {
        experts,
        interns,
        staffExecs,
      },
      typeBreakdown: {
        permanent,
        temporary,
        probationary,
      },
      statusBreakdown: {
        active: activeEmployees,
        onboarding: onboardingEmployees,
        resigned: resignedEmployees,
        terminated: terminatedEmployees,
      },
    };
  }

  /**
   * Alias for controller endpoint getEmployees
   */
  async getEmployees(
    user?: any,
    page?: number,
    limit?: number,
    search?: string,
    category?: string,
    employmentType?: string,
    employmentStatus?: string,
    department?: string,
    professionalRole?: string,
    skills?: string,
    technologies?: string,
    assignment?: string,
  ) {
    return this.searchEmployees({
      page,
      limit,
      search,
      category,
      employmentType,
      status: employmentStatus,
      department,
    });
  }

  /**
   * GET /api/v1/hr/employees — Search & Filter Employee Directory
   */
  async searchEmployees(query: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    category?: string;
    employmentType?: string;
    status?: string;
    ndaStatus?: string;
  }) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {};

    if (query.search?.trim()) {
      const q = query.search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { workEmail: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { professionalRole: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (query.department) where.department = query.department;
    if (query.category) where.category = query.category as any;
    if (query.employmentType) where.employmentType = query.employmentType as any;
    if (query.status) where.status = query.status as any;
    if (query.ndaStatus) where.ndaStatus = query.ndaStatus as any;

    const [total, data] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, email: true, status: true, lastLoginAt: true },
          },
          projectMemberships: {
            where: { status: 'ACTIVE' },
            include: {
              project: { select: { id: true, projectCode: true, title: true } },
            },
          },
        },
      }),
    ]);

    return {
      items: data,
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * GET /api/v1/hr/employees/:id — Fetch Single Employee Record
   */
  async getEmployeeById(id: string, requestingUserId?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, status: true, lastLoginAt: true, createdAt: true },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, email: true } },
          },
        },
        projectMemberships: {
          orderBy: { assignedAt: 'desc' },
          include: {
            project: { select: { id: true, projectCode: true, title: true, status: true } },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee record with ID '${id}' not found.`);
    }

    if (requestingUserId) {
      try {
        await this.prisma.auditLog.create({
          data: {
            actorUserId: requestingUserId,
            action: 'READ_SENSITIVE_EMPLOYEE_PROFILE',
            entityType: 'Employee',
            entityId: employee.id,
            afterJson: { employeeCode: employee.employeeCode, department: employee.department } as any,
          },
        });
      } catch (err: any) {
        this.logger.warn(`Failed to log audit event for READ_SENSITIVE_EMPLOYEE_PROFILE: ${err.message}`);
      }
    }

    return employee;
  }

  /**
   * GET /api/v1/hr/employees/me — Fetch Logged-In Employee Profile
   */
  async getSelfEmployee(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          select: { id: true, email: true, status: true, lastLoginAt: true, createdAt: true },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          include: {
            changedBy: { select: { id: true, email: true } },
          },
        },
        projectMemberships: {
          orderBy: { assignedAt: 'desc' },
          include: {
            project: { select: { id: true, projectCode: true, title: true, status: true } },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee profile not linked to active user account.`);
    }

    return employee;
  }

  /**
   * POST /api/v1/hr/employees — Single employee onboarding & account provisioning
   */
  async onboardEmployee(adminUser: any, data: CreateEmployeeInput) {
    const emailClean = data.workEmail.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email: emailClean } });
    if (existingUser) {
      throw new ConflictException(`User account with email '${emailClean}' already exists in ERP.`);
    }

    const existingEmp = await this.prisma.employee.findUnique({ where: { workEmail: emailClean } });
    if (existingEmp) {
      throw new ConflictException(`Employee record with work email '${emailClean}' already exists.`);
    }

    let systemRoleCode = 'STAFF';
    if (data.category === 'EXPERT') systemRoleCode = 'EXPERT';
    else if (data.category === 'INTERN') systemRoleCode = 'INTERN';
    else if (data.category === 'EXECUTIVE') systemRoleCode = 'ADMIN';

    const systemRole = await this.prisma.role.findFirst({
      where: { code: systemRoleCode },
    });

    const customPass = (data as any).password;
    const initialPassword =
      customPass && customPass.trim().length >= 8
        ? customPass.trim()
        : `Anveshak@${Math.floor(1000 + Math.random() * 9000)}`;

    const passwordHash = await argon2.hash(initialPassword, { type: argon2.argon2id });

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

    const employee = await this.prisma.$transaction(async (tx) => {
      const employeeCode = await this.generateEmployeeCode(tx);

      // 1. Create User Identity with Password Hash and ACTIVE status for instant login
      const user = await tx.user.create({
        data: {
          email: emailClean,
          passwordHash,
          status: 'ACTIVE',
          activationToken,
          activationExpires,
          activationUsed: true,
        },
      });

      // 2. Assign System Role
      if (systemRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: systemRole.id,
          },
        });
      }

      // 3. Create Employee Master Record
      const newEmp = await tx.employee.create({
        data: {
          employeeCode,
          userId: user.id,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          fullName,
          workEmail: emailClean,
          personalEmail: data.personalEmail?.trim() || null,
          phone: data.phone?.trim() || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          gender: data.gender || null,
          address: data.address?.trim() || null,
          professionalRole: data.professionalRole.trim(),
          department: data.department.trim(),
          designation: data.designation.trim(),
          category: data.category as any,
          employmentType: data.employmentType as any,
          status: 'ACTIVE',
          joiningDate: new Date(data.joiningDate),
          skills: data.skills || [],
          technologies: data.technologies || [],
          baseSalary: data.baseSalary?.trim() || null,
          ndaStatus: (data.ndaStatus as any) || 'PENDING',
        },
        include: {
          user: { select: { id: true, email: true, status: true } },
        },
      });

      // 4. Record Initial Employment History
      await tx.employmentHistory.create({
        data: {
          employeeId: newEmp.id,
          changeType: 'INITIAL_ONBOARDING',
          newType: data.employmentType as any,
          newStatus: 'ACTIVE',
          newDesignation: data.designation.trim(),
          remarks: 'Employee initially onboarded via HR Portal.',
          changedById: adminUser.id,
        },
      });

      // 5. Immutable Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'ONBOARD_EMPLOYEE',
          entityType: 'EMPLOYEE',
          entityId: newEmp.id,
          afterJson: {
            employeeCode: newEmp.employeeCode,
            fullName: newEmp.fullName,
            workEmail: newEmp.workEmail,
            category: newEmp.category,
            employmentType: newEmp.employmentType,
          },
        },
      });

      // 6. Notification
      await tx.notification.create({
        data: {
          recipientUserId: user.id,
          eventType: 'EMPLOYEE_ONBOARDED',
          entityType: 'EMPLOYEE',
          entityId: newEmp.id,
          message: `Welcome to AnveshakHub! Your employee ID is ${newEmp.employeeCode}. Your account is active. Password: ${initialPassword}`,
        },
      });

      return newEmp;
    });

    // Dispatch Onboarding Email Notification with login credentials via EmailService
    if (this.emailService && employee.workEmail) {
      await this.emailService.sendAccountOnboardingEmail(
        employee.workEmail,
        employee.fullName,
        initialPassword,
        employee.employeeCode,
        employee.category,
      );
    }

    // Sync Supabase Auth Identity immediately for instant login access
    if (this.supabaseService?.isOperational && employee.userId && employee.workEmail) {
      try {
        await this.supabaseService.ensureSupabaseAuthUser({
          id: employee.userId,
          email: employee.workEmail,
          password: initialPassword,
        });
      } catch {
        // Fallback gracefully
      }
    }

    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      workEmail: employee.workEmail,
      fullName: employee.fullName,
      status: employee.status,
      initialPassword,
      provisioningStatus: 'PROVISIONED_ACTIVE',
    };
  }

  /**
   * POST /api/v1/hr/employees/:id/resend-invite — HR Resend Activation Invitation
   */
  async resendInvitation(adminUser: any, id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID '${id}' not found.`);
    }

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const tempPassword = `Anveshak@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await argon2.hash(tempPassword, { type: argon2.argon2id });

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        passwordHash,
        activationToken,
        activationExpires,
        activationUsed: true,
        status: 'ACTIVE',
      },
    });

    if (this.emailService && employee.workEmail) {
      await this.emailService.sendAccountOnboardingEmail(
        employee.workEmail,
        employee.fullName,
        tempPassword,
        employee.employeeCode,
        employee.category,
      );
    }

    return {
      success: true,
      message: `Account credentials reset and emailed to ${employee.workEmail}.`,
      tempPassword,
    };
  }

  /**
   * PATCH /api/v1/hr/employees/:id — Update Employee Profile
   */
  async updateEmployee(adminUser: any, id: string, data: UpdateEmployeeInput) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Employee record with ID '${id}' not found.`);
    }

    const updateData: Prisma.EmployeeUpdateInput = {};

    if (data.firstName) updateData.firstName = data.firstName.trim();
    if (data.lastName) updateData.lastName = data.lastName.trim();
    if (data.firstName || data.lastName) {
      const fn = data.firstName?.trim() || existing.firstName;
      const ln = data.lastName?.trim() || existing.lastName;
      updateData.fullName = `${fn} ${ln}`;
    }

    if (data.personalEmail !== undefined) updateData.personalEmail = data.personalEmail?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.gender) updateData.gender = data.gender;
    if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
    if (data.joiningDate) updateData.joiningDate = new Date(data.joiningDate);
    if (data.professionalRole) updateData.professionalRole = data.professionalRole.trim();
    if (data.department) updateData.department = data.department.trim();
    if (data.designation) updateData.designation = data.designation.trim();
    if (data.category) updateData.category = data.category as any;
    if (data.employmentType) updateData.employmentType = data.employmentType as any;
    if (data.status) updateData.status = data.status as any;
    if (data.skills) updateData.skills = data.skills;
    if (data.technologies) updateData.technologies = data.technologies;
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary ? String(data.baseSalary).trim() : null;
    if (data.ndaStatus) updateData.ndaStatus = data.ndaStatus as any;
    if (data.ndaSignedAt) updateData.ndaSignedAt = new Date(data.ndaSignedAt);

    // Handle Work Email change if provided
    let newWorkEmail: string | null = null;
    if (data.workEmail && data.workEmail.trim().toLowerCase() !== existing.workEmail.toLowerCase()) {
      newWorkEmail = data.workEmail.trim().toLowerCase();
      const emailDup = await this.prisma.user.findUnique({ where: { email: newWorkEmail } });
      if (emailDup && emailDup.id !== existing.userId) {
        throw new ConflictException(`Work email '${newWorkEmail}' is already registered to another user.`);
      }
      updateData.workEmail = newWorkEmail;
    }

    // Handle Password update if provided
    let newPasswordHash: string | null = null;
    if ((data as any).password && (data as any).password.trim().length >= 6) {
      newPasswordHash = await argon2.hash((data as any).password.trim(), { type: argon2.argon2id });
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: updateData,
      });

      // Sync User record email / password hash if changed
      if (newWorkEmail || newPasswordHash || data.status) {
        const userUpdate: Prisma.UserUpdateInput = {};
        if (newWorkEmail) userUpdate.email = newWorkEmail;
        if (newPasswordHash) userUpdate.passwordHash = newPasswordHash;
        if (data.status === 'ACTIVE' || data.status === 'ONBOARDING' || data.status === 'PROBATION') {
          userUpdate.status = 'ACTIVE';
        } else if (data.status === 'RESIGNED' || data.status === 'TERMINATED') {
          userUpdate.status = 'INACTIVE';
        }
        await tx.user.update({
          where: { id: existing.userId },
          data: userUpdate,
        });
      }

      if (data.employmentType || data.status || data.designation) {
        await tx.employmentHistory.create({
          data: {
            employeeId: id,
            changeType: 'PROFILE_UPDATE',
            newType: (data.employmentType as any) || existing.employmentType,
            newStatus: (data.status as any) || existing.status,
            newDesignation: data.designation?.trim() || existing.designation,
            remarks: data.remarks?.trim() || 'HR updated profile master fields.',
            changedById: adminUser.id,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'UPDATE_EMPLOYEE',
          entityType: 'EMPLOYEE',
          entityId: id,
          beforeJson: existing as any,
          afterJson: emp as any,
        },
      });

      return emp;
    });

    // Sync Supabase Auth Identity if email or password changed
    if (this.supabaseService?.isOperational && existing.userId) {
      try {
        const supaPayload: any = {};
        if (newWorkEmail) supaPayload.email = newWorkEmail;
        if ((data as any).password) supaPayload.password = (data as any).password.trim();
        if (Object.keys(supaPayload).length > 0) {
          await this.supabaseService.ensureSupabaseAuthUser({
            id: existing.userId,
            email: newWorkEmail || existing.workEmail,
            password: (data as any).password ? (data as any).password.trim() : undefined,
          });
        }
      } catch {}
    }

    // Send email notification to employee if profile or password changed
    if (this.emailService) {
      try {
        const updatedFields: string[] = [];
        if ((data as any).password) updatedFields.push('Account Login Password');
        if (data.workEmail) updatedFields.push('Work Email Address');
        if (data.designation) updatedFields.push(`Designation: ${data.designation}`);
        if (data.department) updatedFields.push(`Department: ${data.department}`);
        if (data.status) updatedFields.push(`Status: ${data.status}`);
        if (data.professionalRole) updatedFields.push(`Professional Role: ${data.professionalRole}`);
        if (updatedFields.length === 0) updatedFields.push('Personal Profile Details');

        const recipient = newWorkEmail || existing.workEmail;
        const passVal = (data as any).password ? (data as any).password.trim() : undefined;

        await this.emailService.sendEmployeeProfileUpdatedEmail(
          recipient,
          existing.fullName,
          existing.employeeCode,
          updatedFields,
          passVal,
        );
      } catch (emailErr: any) {
        // Suppress email dispatch errors to prevent breaking HR profile update transaction
      }
    }

    return updated;
  }

  /**
   * POST /api/v1/hr/employees/:id/rehire — Rehire Resigned/Terminated Employee
   */
  async rehireEmployee(adminUser: any, id: string, data: RehireEmployeeInput) {
    const existing = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Employee record with ID '${id}' not found.`);
    }

    if (existing.status !== 'RESIGNED' && existing.status !== 'TERMINATED') {
      throw new BadRequestException(`Employee '${existing.employeeCode}' is currently '${existing.status}' and cannot be rehired.`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          joiningDate: new Date(data.joiningDate),
          employmentType: data.employmentType as any,
          designation: data.designation.trim(),
          department: data.department.trim(),
          exitDate: null,
        },
      });

      await tx.user.update({
        where: { id: existing.userId },
        data: { status: 'ACTIVE' },
      });

      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          changeType: 'REHIRE',
          previousType: existing.employmentType,
          newType: data.employmentType as any,
          previousStatus: existing.status,
          newStatus: 'ACTIVE',
          previousDesignation: existing.designation,
          newDesignation: data.designation.trim(),
          remarks: data.remarks?.trim() || 'Employee rehired into active service.',
          changedById: adminUser.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'REHIRE_EMPLOYEE',
          entityType: 'EMPLOYEE',
          entityId: id,
          afterJson: emp as any,
        },
      });

      return emp;
    });

    if (existing.userId) {
      try {
        if (this.notificationsService) {
          await this.notificationsService.create({
            recipientUserId: existing.userId,
            eventType: 'EMPLOYEE_ACCOUNT',
            entityType: 'Employee',
            entityId: existing.id,
            message: `Your employee account (${existing.employeeCode}) has been reactivated.`,
          });
        }

        if (this.emailService && existing.workEmail) {
          await this.emailService.sendEmployeeRehireEmail(
            existing.workEmail,
            existing.fullName,
            existing.employeeCode,
            data.designation.trim(),
            data.department.trim(),
          );
        }
      } catch {
        // Non-blocking notification failure
      }
    }

    return updated;
  }

  /**
   * POST /api/v1/hr/employees/:id/exit — Deactivate/Offboard Employee (preserves history & employeeCode)
   */
  async exitEmployee(
    adminUser: any,
    id: string,
    data: { status?: 'RESIGNED' | 'TERMINATED'; exitDate?: string; remarks?: string },
  ) {
    const existing = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Employee record with ID '${id}' not found.`);
    }

    const exitStatus = data.status || 'RESIGNED';
    const exitDate = data.exitDate ? new Date(data.exitDate) : new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const emp = await tx.employee.update({
        where: { id },
        data: {
          status: exitStatus as any,
          exitDate,
        },
      });

      // Disable user login account upon exit
      await tx.user.update({
        where: { id: existing.userId },
        data: { status: 'INACTIVE' },
      });

      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          changeType: 'EMPLOYEE_EXIT',
          previousStatus: existing.status,
          newStatus: exitStatus as any,
          previousType: existing.employmentType,
          newType: existing.employmentType,
          previousDesignation: existing.designation,
          newDesignation: existing.designation,
          remarks: data.remarks?.trim() || `Employee offboarded (${exitStatus}).`,
          effectiveDate: exitDate,
          changedById: adminUser.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'EXIT_EMPLOYEE',
          entityType: 'EMPLOYEE',
          entityId: id,
          beforeJson: { status: existing.status, exitDate: existing.exitDate } as any,
          afterJson: { status: emp.status, exitDate: emp.exitDate } as any,
        },
      });

      return emp;
    });

    if (existing.userId) {
      try {
        if (this.notificationsService) {
          await this.notificationsService.create({
            recipientUserId: existing.userId,
            eventType: 'EMPLOYEE_ACCOUNT',
            entityType: 'Employee',
            entityId: existing.id,
            message: `Your employee offboarding (${exitStatus}) effective ${exitDate.toISOString().split('T')[0]} has been registered.`,
          });
        }

        if (this.emailService && existing.workEmail) {
          await this.emailService.sendEmployeeExitEmail(
            existing.workEmail,
            existing.fullName,
            existing.employeeCode,
            exitDate.toISOString().split('T')[0],
          );
        }
      } catch {
        // Non-blocking notification failure
      }
    }

    return updated;
  }

  /**
   * POST /api/v1/hr/employees/bulk-onboard — Atomic bulk onboarding (up to 50 employees)
   */
  async bulkOnboard(adminUser: any, employeesData: CreateEmployeeInput[]) {
    if (!employeesData || employeesData.length === 0) {
      throw new BadRequestException('Bulk onboarding payload must contain at least one employee.');
    }

    if (employeesData.length > 50) {
      throw new BadRequestException('Bulk onboarding limit is 50 employees per batch.');
    }

    // Phase 1: Validate entire batch before opening DB transaction
    const emailSet = new Set<string>();
    for (let i = 0; i < employeesData.length; i++) {
      const email = employeesData[i].workEmail?.trim().toLowerCase();
      if (!email) {
        throw new BadRequestException(`Item at index ${i} is missing required workEmail.`);
      }
      if (emailSet.has(email)) {
        throw new BadRequestException(`Duplicate email '${email}' found within bulk payload.`);
      }
      emailSet.add(email);
    }

    const existingUsers = await this.prisma.user.findMany({
      where: { email: { in: Array.from(emailSet) } },
      select: { email: true },
    });

    if (existingUsers.length > 0) {
      const duplicates = existingUsers.map((u) => u.email).join(', ');
      throw new ConflictException(`The following work email(s) already exist in ERP: ${duplicates}`);
    }

    // Phase 2: Transaction for database creations
    const provisionedItems = await this.prisma.$transaction(async (tx) => {
      const items = [];

      for (const data of employeesData) {
        const emailClean = data.workEmail.trim().toLowerCase();
        const employeeCode = await this.generateEmployeeCode(tx);
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        const customPass = (data as any).password;
        const initialPassword =
          customPass && customPass.trim().length >= 8
            ? customPass.trim()
            : `Anveshak@${Math.floor(1000 + Math.random() * 9000)}`;

        const passwordHash = await argon2.hash(initialPassword, { type: argon2.argon2id });

        let systemRoleCode = 'STAFF';
        if (data.category === 'EXPERT') systemRoleCode = 'EXPERT';
        else if (data.category === 'INTERN') systemRoleCode = 'INTERN';
        else if (data.category === 'EXECUTIVE') systemRoleCode = 'ADMIN';

        const systemRole = await tx.role.findFirst({ where: { code: systemRoleCode } });

        const user = await tx.user.create({
          data: {
            email: emailClean,
            passwordHash,
            status: 'ACTIVE',
            activationUsed: true,
          },
        });

        if (systemRole) {
          await tx.userRole.create({
            data: { userId: user.id, roleId: systemRole.id },
          });
        }

        const employee = await tx.employee.create({
          data: {
            employeeCode,
            userId: user.id,
            firstName: data.firstName.trim(),
            lastName: data.lastName.trim(),
            fullName,
            workEmail: emailClean,
            personalEmail: data.personalEmail?.trim() || null,
            phone: data.phone?.trim() || null,
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
            gender: data.gender || null,
            address: data.address?.trim() || null,
            professionalRole: data.professionalRole.trim(),
            department: data.department.trim(),
            designation: data.designation.trim(),
            category: data.category as any,
            employmentType: data.employmentType as any,
            status: 'ACTIVE',
            joiningDate: new Date(data.joiningDate),
            skills: data.skills || [],
            technologies: data.technologies || [],
            baseSalary: data.baseSalary?.trim() || null,
            ndaStatus: (data.ndaStatus as any) || 'PENDING',
          },
        });

        await tx.employmentHistory.create({
          data: {
            employeeId: employee.id,
            changeType: 'BULK_ONBOARDING',
            newType: data.employmentType as any,
            newStatus: 'ACTIVE',
            newDesignation: data.designation.trim(),
            remarks: 'Bulk onboarded via HR Portal.',
            changedById: adminUser.id,
          },
        });

        await tx.auditLog.create({
          data: {
            actorUserId: adminUser.id,
            action: 'BULK_ONBOARD_EMPLOYEE',
            entityType: 'EMPLOYEE',
            entityId: employee.id,
            afterJson: { employeeCode, email: emailClean },
          },
        });

        items.push({
          workEmail: emailClean,
          employeeCode,
          userId: user.id,
          fullName,
          initialPassword,
          status: 'PROVISIONED_ACTIVE',
        });
      }

      return items;
    });

    // Send emails for bulk items
    if (this.emailService) {
      for (const item of provisionedItems) {
        await this.emailService.sendAccountOnboardingEmail(
          item.workEmail,
          item.fullName,
          item.initialPassword,
          item.employeeCode,
        );
      }
    }

    // Sync Supabase Auth Identity for all provisioned bulk employees
    if (this.supabaseService?.isOperational) {
      for (const item of provisionedItems) {
        try {
          await this.supabaseService.ensureSupabaseAuthUser({
            id: item.userId,
            email: item.workEmail,
            password: item.initialPassword,
          });
        } catch {}
      }
    }

    return provisionedItems;
  }
}
