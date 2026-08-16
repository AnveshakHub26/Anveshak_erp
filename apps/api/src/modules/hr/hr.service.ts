import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';
import { Prisma } from '@prisma/client';
import { CreateEmployeeInput, UpdateEmployeeInput, RehireEmployeeInput } from '@anveshak/validation';
import * as crypto from 'crypto';

import { EmailService } from '../../common/email/email.service';

@Injectable()
export class HRService {
  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
    @Optional() private emailService?: EmailService,
  ) {}

  /**
   * Concurrency-safe Employee Code generator using SystemCounter table & PostgreSQL transaction locking
   */
  private async generateEmployeeCode(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const name = `EMPLOYEE_${year}`;

    const existingCounter = await tx.systemCounter.findUnique({ where: { name } });

    let assignedSeq: number;
    if (!existingCounter) {
      const latestEmployee = await tx.employee.findFirst({
        where: { employeeCode: { startsWith: `EMP-${year}-` } },
        orderBy: { employeeCode: 'desc' },
      });

      let startSeq = 1;
      if (latestEmployee && latestEmployee.employeeCode) {
        const parts = latestEmployee.employeeCode.split('-');
        if (parts.length === 3) {
          const parsed = parseInt(parts[2], 10);
          if (!isNaN(parsed)) {
            startSeq = parsed + 1;
          }
        }
      }

      try {
        await tx.systemCounter.create({
          data: { name, nextValue: startSeq + 1 },
        });
        assignedSeq = startSeq;
      } catch {
        const updated = await tx.systemCounter.update({
          where: { name },
          data: { nextValue: { increment: 1 } },
        });
        assignedSeq = updated.nextValue - 1;
      }
    } else {
      const updated = await tx.systemCounter.update({
        where: { name },
        data: { nextValue: { increment: 1 } },
      });
      assignedSeq = updated.nextValue - 1;
    }

    const seqStr = assignedSeq.toString().padStart(6, '0');
    return `EMP-${year}-${seqStr}`;
  }

  /**
   * GET /api/v1/hr/dashboard — Realtime workforce metrics
   */
  async getDashboard() {
    const [
      totalEmployees,
      experts,
      interns,
      staffExecs,
      permanent,
      temporary,
      probationary,
      active,
      onboarding,
      onLeave,
      resigned,
      terminated,
      assignedCount,
      allEmployees,
    ] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.count({ where: { category: 'EXPERT' } }),
      this.prisma.employee.count({ where: { category: 'INTERN' } }),
      this.prisma.employee.count({ where: { category: { in: ['STAFF', 'EXECUTIVE'] } } }),
      this.prisma.employee.count({ where: { employmentType: 'PERMANENT' } }),
      this.prisma.employee.count({ where: { employmentType: 'TEMPORARY' } }),
      this.prisma.employee.count({ where: { employmentType: 'PROBATIONARY' } }),
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.employee.count({ where: { status: 'ONBOARDING' } }),
      this.prisma.employee.count({ where: { status: 'ON_LEAVE' } }),
      this.prisma.employee.count({ where: { status: 'RESIGNED' } }),
      this.prisma.employee.count({ where: { status: 'TERMINATED' } }),
      this.prisma.employee.count({
        where: { projectMemberships: { some: { status: 'ACTIVE' } } },
      }),
      this.prisma.employee.findMany({
        select: { department: true },
      }),
    ]);

    const departmentMap: Record<string, number> = {};
    allEmployees.forEach((emp) => {
      const dept = emp.department || 'Unassigned';
      departmentMap[dept] = (departmentMap[dept] || 0) + 1;
    });

    const departmentSummary = Object.entries(departmentMap).map(([department, count]) => ({
      department,
      count,
    }));

    return {
      totalEmployees,
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
        active,
        onboarding,
        onLeave,
        resigned,
        terminated,
      },
      allocationBreakdown: {
        assigned: assignedCount,
        unassigned: Math.max(0, active - assignedCount),
      },
      departmentSummary,
    };
  }

  /**
   * GET /api/v1/hr/employees — Search & filter employee directory
   */
  async getEmployees(
    user: any,
    page: number = 1,
    limit: number = 20,
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
    const isHrOrAdmin = user.roles?.includes('ADMIN') || user.roles?.includes('HR');
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) where.category = category;
    if (employmentType) where.employmentType = employmentType;
    if (employmentStatus) where.status = employmentStatus;
    if (department) where.department = { contains: department, mode: 'insensitive' };
    if (professionalRole) where.professionalRole = { contains: professionalRole, mode: 'insensitive' };

    if (skills && skills.trim()) {
      where.skills = { hasSome: skills.split(',').map((s) => s.trim()) };
    }

    if (technologies && technologies.trim()) {
      where.technologies = { hasSome: technologies.split(',').map((t) => t.trim()) };
    }

    if (assignment === 'ASSIGNED') {
      where.projectMemberships = { some: { status: 'ACTIVE' } };
    } else if (assignment === 'UNASSIGNED') {
      where.projectMemberships = { none: { status: 'ACTIVE' } };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { workEmail: { contains: q, mode: 'insensitive' } },
        { professionalRole: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, status: true } },
          projectMemberships: {
            where: { status: 'ACTIVE' },
            include: { project: { select: { id: true, projectCode: true, title: true } } },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    // Protect sensitive fields if requester is NOT HR/ADMIN (e.g. PM or EXPERT)
    const items = rawItems.map((emp) => {
      if (!isHrOrAdmin) {
        const { baseSalary, personalEmail, dateOfBirth, address, ...publicProfile } = emp;
        return publicProfile;
      }
      return emp;
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 Days

    const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

    const employee = await this.prisma.$transaction(async (tx) => {
      const employeeCode = await this.generateEmployeeCode(tx);

      // 1. Create User Identity
      const user = await tx.user.create({
        data: {
          email: emailClean,
          status: 'PENDING',
          activationToken,
          activationExpires,
          activationUsed: false,
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
          status: 'ONBOARDING',
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
          newStatus: 'ONBOARDING',
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
          message: `Welcome to AnveshakHub! Your employee ID is ${newEmp.employeeCode}. Please check your email for the account activation link.`,
        },
      });

      return newEmp;
    });

    // Dispatch Onboarding Email Notification via centralized EmailService (asynchronously queued)
    if (this.emailService && employee.workEmail) {
      await this.emailService.sendAccountOnboardingEmail(
        employee.workEmail,
        employee.fullName,
        employee.category,
      );
    }

    // SECURITY: Do NOT return raw activationToken in production CRUD responses.
    return {
      id: employee.id,
      employeeCode: employee.employeeCode,
      workEmail: employee.workEmail,
      fullName: employee.fullName,
      status: employee.status,
      provisioningStatus: 'PROVISIONED_INVITATION_QUEUED',
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

    if (employee.user.status === 'ACTIVE') {
      throw new BadRequestException(`Employee '${employee.employeeCode}' account is already ACTIVE.`);
    }

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: employee.userId },
      data: {
        activationToken,
        activationExpires,
        activationUsed: false,
        status: 'PENDING',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'RESEND_EMPLOYEE_INVITATION',
        entityType: 'EMPLOYEE',
        entityId: id,
        afterJson: { employeeCode: employee.employeeCode, workEmail: employee.workEmail },
      },
    });

    return {
      success: true,
      message: `Activation invitation resent to ${employee.workEmail}.`,
      workEmail: employee.workEmail,
      employeeCode: employee.employeeCode,
    };
  }

  /**
   * GET /api/v1/hr/employees/:id — Detailed employee profile & employment history with strict RBAC self-access enforcement
   */
  async getEmployeeById(user: any, id: string) {
    const isHrOrAdmin = user.roles?.includes('ADMIN') || user.roles?.includes('HR');
    const isPm = user.roles?.includes('PM');

    let targetId = id;
    if (id === 'me') {
      const selfEmp = await this.prisma.employee.findFirst({ where: { userId: user.id } });
      if (!selfEmp) {
        throw new NotFoundException('No employee record associated with current user account.');
      }
      targetId = selfEmp.id;
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: targetId },
      include: {
        user: { select: { id: true, email: true, status: true, lastLoginAt: true } },
        organization: { select: { id: true, legalName: true, orgNumber: true } },
        history: {
          orderBy: { effectiveDate: 'desc' },
          include: { changedBy: { select: { id: true, email: true } } },
        },
        projectMemberships: {
          orderBy: { assignedAt: 'desc' },
          include: { project: { select: { id: true, projectCode: true, title: true, status: true } } },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID '${id}' not found.`);
    }

    const isSelf = user.id === employee.userId;

    // Strict Server-Side Self Access Enforcer: EXPERT or INTERN can ONLY view their own profile
    if (!isHrOrAdmin && !isPm && !isSelf) {
      throw new ForbiddenException('You are only authorized to view your own employee profile.');
    }

    // PM or Self (without HR/ADMIN role) receives sanitized profile
    if (!isHrOrAdmin) {
      const { baseSalary, personalEmail, dateOfBirth, address, ...publicProfile } = employee;
      const documents = await this.prisma.document.findMany({
        where: { entityType: 'Employee', entityId: id, visibility: 'PUBLIC' },
        orderBy: { createdAt: 'desc' },
      });
      return { ...publicProfile, documents };
    }

    const documents = await this.prisma.document.findMany({
      where: { entityType: 'Employee', entityId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...employee,
      documents,
    };
  }

  /**
   * PATCH /api/v1/hr/employees/:id — Update employee profile & log status transitions
   */
  async updateEmployee(adminUser: any, id: string, data: UpdateEmployeeInput) {
    const existing = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throw new NotFoundException(`Employee with ID '${id}' not found.`);
    }

    const updateData: any = {};

    if (data.firstName || data.lastName) {
      const fn = data.firstName?.trim() || existing.firstName;
      const ln = data.lastName?.trim() || existing.lastName;
      updateData.firstName = fn;
      updateData.lastName = ln;
      updateData.fullName = `${fn} ${ln}`;
    }

    if (data.personalEmail !== undefined) updateData.personalEmail = data.personalEmail?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.professionalRole !== undefined) updateData.professionalRole = data.professionalRole.trim();
    if (data.department !== undefined) updateData.department = data.department.trim();
    if (data.designation !== undefined) updateData.designation = data.designation.trim();
    if (data.category !== undefined) updateData.category = data.category as any;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType as any;
    if (data.status !== undefined) updateData.status = data.status as any;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.technologies !== undefined) updateData.technologies = data.technologies;
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary?.trim() || null;
    if (data.ndaStatus !== undefined) updateData.ndaStatus = data.ndaStatus as any;
    if (data.ndaSignedAt !== undefined) updateData.ndaSignedAt = data.ndaSignedAt ? new Date(data.ndaSignedAt) : null;

    const isTypeChanged = data.employmentType && data.employmentType !== existing.employmentType;
    const isStatusChanged = data.status && data.status !== existing.status;
    const isDesignationChanged = data.designation && data.designation !== existing.designation;

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.employee.update({
        where: { id },
        data: updateData,
        include: { user: true },
      });

      if (isTypeChanged || isStatusChanged || isDesignationChanged) {
        let changeType = 'UPDATE_PROFILE';
        if (isTypeChanged && existing.employmentType === 'TEMPORARY' && data.employmentType === 'PERMANENT') {
          changeType = 'CONVERT_TEMPORARY_TO_PERMANENT';
        } else if (isStatusChanged && (data.status === 'RESIGNED' || data.status === 'TERMINATED')) {
          changeType = `OFFBOARD_${data.status}`;
        }

        await tx.employmentHistory.create({
          data: {
            employeeId: id,
            changeType,
            previousType: existing.employmentType,
            newType: (data.employmentType as any) || existing.employmentType,
            previousStatus: existing.status,
            newStatus: (data.status as any) || existing.status,
            previousDesignation: existing.designation,
            newDesignation: data.designation?.trim() || existing.designation,
            remarks: data.remarks?.trim() || `Profile updated by ${adminUser.email}`,
            changedById: adminUser.id,
          },
        });
      }

      // Offboarding: Revoke ERP User access and Supabase Auth status
      if (data.status === 'RESIGNED' || data.status === 'TERMINATED') {
        await tx.user.update({
          where: { id: existing.userId },
          data: { status: 'INACTIVE' },
        });

        // Supabase Auth account teardown
        if (this.supabaseService?.isOperational && this.supabaseService?.getClient()) {
          try {
            const client = this.supabaseService.getClient();
            await client?.auth.admin.updateUserById(existing.userId, {
              user_metadata: { erp_status: 'INACTIVE' },
            });
          } catch {}
        }

        await tx.auditLog.create({
          data: {
            actorUserId: adminUser.id,
            action: 'DEACTIVATE_USER_OFFBOARD',
            entityType: 'USER',
            entityId: existing.userId,
            afterJson: { employeeCode: existing.employeeCode, status: 'INACTIVE' },
          },
        });
      }

      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'UPDATE_EMPLOYEE',
          entityType: 'EMPLOYEE',
          entityId: id,
          afterJson: { employeeCode: updated.employeeCode, changes: updateData },
        },
      });

      return updated;
    });

    return result;
  }

  /**
   * POST /api/v1/hr/employees/:id/rehire — Rehire former employee preserving Employee Code
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
      throw new BadRequestException(
        `Employee '${existing.employeeCode}' cannot be rehired because current status is '${existing.status}'. Only RESIGNED or TERMINATED employees can be rehired.`,
      );
    }

    const activationToken = crypto.randomBytes(32).toString('hex');
    const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Reactivate existing Employee record, preserving employeeCode
      const rehired = await tx.employee.update({
        where: { id },
        data: {
          status: 'ACTIVE',
          employmentType: data.employmentType as any,
          joiningDate: new Date(data.joiningDate),
          department: data.department.trim(),
          designation: data.designation.trim(),
          exitDate: null,
        },
        include: { user: true },
      });

      // 2. Reactivate ERP User Account with fresh invitation capability
      await tx.user.update({
        where: { id: existing.userId },
        data: {
          status: 'PENDING',
          activationToken,
          activationExpires,
          activationUsed: false,
        },
      });

      // Supabase Auth restoration
      if (this.supabaseService?.isOperational && this.supabaseService?.getClient()) {
        try {
          const client = this.supabaseService.getClient();
          await client?.auth.admin.updateUserById(existing.userId, {
            user_metadata: { erp_status: 'PENDING_REHIRE_ACTIVATION' },
          });
        } catch {}
      }

      // 3. Append EmploymentHistory for Rehire
      await tx.employmentHistory.create({
        data: {
          employeeId: id,
          changeType: 'REHIRED',
          previousStatus: existing.status,
          newStatus: 'ACTIVE',
          previousType: existing.employmentType,
          newType: data.employmentType as any,
          previousDesignation: existing.designation,
          newDesignation: data.designation.trim(),
          remarks: data.remarks?.trim() || `Rehired by HR (${adminUser.email}).`,
          changedById: adminUser.id,
        },
      });

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'REHIRE_EMPLOYEE',
          entityType: 'EMPLOYEE',
          entityId: id,
          afterJson: {
            employeeCode: rehired.employeeCode,
            status: 'ACTIVE',
            newJoiningDate: data.joiningDate,
          },
        },
      });

      // 5. Notification
      await tx.notification.create({
        data: {
          recipientUserId: existing.userId,
          eventType: 'EMPLOYEE_REHIRED',
          entityType: 'EMPLOYEE',
          entityId: id,
          message: `Your employment record (${rehired.employeeCode}) has been reactivated. Welcome back to AnveshakHub!`,
        },
      });

      return rehired;
    });

    return {
      id: result.id,
      employeeCode: result.employeeCode,
      workEmail: result.workEmail,
      status: result.status,
      rehireStatus: 'REHIRED_INVITATION_QUEUED',
    };
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
        const activationToken = crypto.randomBytes(32).toString('hex');
        const activationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        let systemRoleCode = 'STAFF';
        if (data.category === 'EXPERT') systemRoleCode = 'EXPERT';
        else if (data.category === 'INTERN') systemRoleCode = 'INTERN';
        else if (data.category === 'EXECUTIVE') systemRoleCode = 'ADMIN';

        const systemRole = await tx.role.findFirst({ where: { code: systemRoleCode } });

        const user = await tx.user.create({
          data: {
            email: emailClean,
            status: 'PENDING',
            activationToken,
            activationExpires,
            activationUsed: false,
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
            status: 'ONBOARDING',
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
            newStatus: 'ONBOARDING',
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
          status: 'PROVISIONED_INVITATION_QUEUED',
        });
      }

      return items;
    });

    return provisionedItems;
  }
}
