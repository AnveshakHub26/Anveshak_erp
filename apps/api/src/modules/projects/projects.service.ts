import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateProjectResourceRequirementInput,
  UpdateProjectResourceRequirementInput,
  ProjectMemberAssignInput,
  CreateProjectMilestoneInput,
  UpdateProjectMilestoneInput,
  CreateProjectTaskInput,
  UpdateProjectTaskInput,
  CreateProjectDeliverableInput,
  UpdateProjectDeliverableInput,
  CreateProjectMeetingInput,
  UpdateProjectMeetingInput,
  CreateProjectResourceLinkInput,
  UpdateProjectResourceLinkInput,
} from '@anveshak/validation';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Enterprise Projects List View with server-side multi-tenant organization boundary isolation
   */
  async findAll(
    user: any,
    page: number = 1,
    limit: number = 20,
    search?: string,
    status?: string,
  ) {
    const isAdmin = user.roles?.includes('ADMIN');
    const isInternalWorkforce = user.roles?.some((r: string) => ['HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL'].includes(r));
    const skip = (page - 1) * limit;

    const where: any = {};

    // Multi-tenant boundary isolation: non-ADMIN industry users (ORG_USER) can only view projects of their own organization
    if (!isAdmin && !isInternalWorkforce) {
      const orgUser = await this.prisma.organizationUser.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { organization: true },
      });

      if (!orgUser || orgUser.organization.status !== 'APPROVED') {
        throw new ForbiddenException('Cannot access projects without an active approved organization context.');
      }

      where.organizationId = orgUser.organizationId;
    }

    if (status) {
      where.status = status;
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { projectCode: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          organization: { select: { id: true, legalName: true, orgNumber: true, type: true } },
          problemStatement: { select: { id: true, code: true, title: true } },
          businessVertical: true,
          createdBy: { select: { id: true, email: true } },
          _count: { select: { members: { where: { status: 'ACTIVE' } } } },
        },
      }),
      this.prisma.project.count({ where }),
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
   * Project Detail View with document traceability and organization isolation
   */
  async findOne(user: any, id: string) {
    const isAdmin = user.roles?.includes('ADMIN');
    const isInternalWorkforce = user.roles?.some((r: string) => ['HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL'].includes(r));

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, legalName: true, orgNumber: true, type: true, website: true, address: true } },
        problemStatement: { select: { id: true, code: true, title: true, description: true, category: true, budgetEstimate: true, expectedTimeline: true } },
        businessVertical: true,
        createdBy: { select: { id: true, email: true } },
        members: {
          orderBy: { assignedAt: 'desc' },
          include: {
            employee: {
              select: {
                id: true,
                employeeCode: true,
                fullName: true,
                professionalRole: true,
                department: true,
                designation: true,
                category: true,
                employmentType: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${id}' not found.`);
    }

    // Strict multi-tenant boundary isolation for Industry users
    if (!isAdmin && !isInternalWorkforce) {
      const orgUser = await this.prisma.organizationUser.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
      });
      if (!orgUser || project.organizationId !== orgUser.organizationId) {
        throw new ForbiddenException('Access denied: You do not have permission to view this project.');
      }
    }

    // Preserved document traceability
    const documents = await this.prisma.document.findMany({
      where: {
        OR: [
          { entityType: 'Project', entityId: project.id },
          { entityType: 'ProblemStatement', entityId: project.problemStatementId },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sanitization: ORG_USER must NEVER receive internal employee names or employee codes
    const isOrgUser = user.roles?.includes('ORG_USER') && !isAdmin && !isInternalWorkforce;
    if (isOrgUser) {
      const { members, ...safeProject } = project;
      const activeMembersCount = members.filter((m) => m.status === 'ACTIVE').length;
      return {
        ...safeProject,
        documents,
        teamHeadcount: activeMembersCount,
      };
    }

    return {
      ...project,
      documents,
    };
  }

  // =========================================================================
  // 1. PROJECT RESOURCE REQUIREMENTS APIs (ADMIN ONLY FOR MUTATIONS)
  // =========================================================================

  /**
   * POST /api/v1/projects/:id/requirements — ADMIN creates resource requirement
   */
  async createRequirement(adminUser: any, projectId: string, data: CreateProjectResourceRequirementInput) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot add resource requirements to a project in ${project.status} state.`);
    }

    const requirement = await this.prisma.projectResourceRequirement.create({
      data: {
        projectId,
        professionalRole: data.professionalRole,
        category: data.category,
        employmentType: data.employmentType,
        requiredCount: data.requiredCount || 1,
        allocationPct: data.allocationPct || 100.0,
        skills: data.skills || [],
        technologies: data.technologies || [],
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        priority: data.priority || 'HIGH',
        notes: data.notes,
        isFulfilled: false,
        createdById: adminUser.id,
      },
    });

    // Immutable AuditLog
    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'RESOURCE_REQUIREMENT_CREATED',
        entityType: 'ProjectResourceRequirement',
        entityId: requirement.id,
        afterJson: requirement as any,
      },
    });

    return requirement;
  }

  /**
   * GET /api/v1/projects/:id/requirements — List project resource requirements with server-derived isFulfilled
   */
  async getRequirements(user: any, projectId: string) {
    const isOrgUser = user.roles?.includes('ORG_USER') && !user.roles?.includes('ADMIN') && !user.roles?.some((r: string) => ['HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL'].includes(r));
    if (isOrgUser) {
      throw new ForbiddenException('Industry organization users are not authorized to view internal project resource requirements.');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: { where: { status: 'ACTIVE' }, include: { employee: true } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    const rawRequirements = await this.prisma.projectResourceRequirement.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });

    // Server-derived isFulfilled calculation: count active ProjectMembers explicitly linked to requirementId
    const items = rawRequirements.map((req) => {
      const activeRequirementMembers = project.members.filter(
        (m) => m.requirementId === req.id && m.status === 'ACTIVE',
      );

      const isFulfilled = activeRequirementMembers.length >= req.requiredCount;
      return {
        ...req,
        isFulfilled,
        fulfilledCount: activeRequirementMembers.length,
      };
    });

    return items;
  }

  /**
   * PATCH /api/v1/projects/:id/requirements/:requirementId — ADMIN updates resource requirement
   */
  async updateRequirement(adminUser: any, projectId: string, requirementId: string, data: UpdateProjectResourceRequirementInput) {
    const existing = await this.prisma.projectResourceRequirement.findFirst({
      where: { id: requirementId, projectId },
    });

    if (!existing) {
      throw new NotFoundException(`Resource requirement '${requirementId}' not found for project '${projectId}'.`);
    }

    const updated = await this.prisma.projectResourceRequirement.update({
      where: { id: requirementId },
      data: {
        professionalRole: data.professionalRole,
        category: data.category,
        employmentType: data.employmentType,
        requiredCount: data.requiredCount,
        allocationPct: data.allocationPct,
        skills: data.skills,
        technologies: data.technologies,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        priority: data.priority,
        notes: data.notes,
        isFulfilled: data.isFulfilled,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'RESOURCE_REQUIREMENT_UPDATED',
        entityType: 'ProjectResourceRequirement',
        entityId: updated.id,
        beforeJson: existing as any,
        afterJson: updated as any,
      },
    });

    return updated;
  }

  // =========================================================================
  // 2. CANDIDATE MATCHING ENGINE
  // =========================================================================

  /**
   * GET /api/v1/projects/:id/candidates — Candidate search engine with availability & match score ranking
   */
  async getCandidates(
    user: any,
    projectId: string,
    query: {
      requirementId?: string;
      search?: string;
      category?: string;
      employmentType?: string;
      skills?: string;
      technologies?: string;
    },
  ) {
    const isOrgUser = user.roles?.includes('ORG_USER') && !user.roles?.includes('ADMIN') && !user.roles?.some((r: string) => ['HR', 'PM'].includes(r));
    if (isOrgUser) {
      throw new ForbiddenException('Industry users are not authorized to access internal employee candidate profiles.');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    let reqSkills: string[] = [];
    let reqTech: string[] = [];
    let reqRole: string | null = null;
    let reqCategory: string | null = query.category || null;
    let reqEmploymentType: string | null = query.employmentType || null;

    if (query.requirementId) {
      const req = await this.prisma.projectResourceRequirement.findFirst({
        where: { id: query.requirementId, projectId },
      });
      if (req) {
        reqSkills = req.skills || [];
        reqTech = req.technologies || [];
        reqRole = req.professionalRole || null;
        reqCategory = req.category || reqCategory;
        reqEmploymentType = req.employmentType || reqEmploymentType;
      }
    }

    if (query.skills) {
      const manualSkills = query.skills.split(',').map((s) => s.trim()).filter(Boolean);
      reqSkills = Array.from(new Set([...reqSkills, ...manualSkills]));
    }
    if (query.technologies) {
      const manualTech = query.technologies.split(',').map((t) => t.trim()).filter(Boolean);
      reqTech = Array.from(new Set([...reqTech, ...manualTech]));
    }

    // Candidate Search strictly considers ONLY Employee.status === 'ACTIVE'
    const where: any = { status: 'ACTIVE' };

    if (reqCategory) where.category = reqCategory;
    if (reqEmploymentType) where.employmentType = reqEmploymentType;

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      where.OR = [
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } },
        { professionalRole: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } },
      ];
    }

    const activeEmployees = await this.prisma.employee.findMany({
      where,
      include: {
        projectMemberships: {
          where: { status: 'ACTIVE' },
          select: { allocationPct: true },
        },
      },
    });

    const isHrOrAdmin = user.roles?.includes('ADMIN') || user.roles?.includes('HR');

    const candidates = activeEmployees.map((emp) => {
      // Calculate Current Allocation & Available Capacity
      const currentAllocationPct = emp.projectMemberships.reduce((sum, pm) => sum + (pm.allocationPct || 0), 0);
      const availableCapacityPct = Math.max(0, 100.0 - currentAllocationPct);

      // Match Score Calculation
      let matchedSkillCount = 0;
      let matchedTechCount = 0;

      if (reqSkills.length > 0 && emp.skills) {
        matchedSkillCount = reqSkills.filter((rs) =>
          emp.skills.some((es) => es.toLowerCase() === rs.toLowerCase()),
        ).length;
      }

      if (reqTech.length > 0 && emp.technologies) {
        matchedTechCount = reqTech.filter((rt) =>
          emp.technologies.some((et) => et.toLowerCase() === rt.toLowerCase()),
        ).length;
      }

      const totalReqCriteria = reqSkills.length + reqTech.length;
      let matchScore = 100;
      if (totalReqCriteria > 0) {
        matchScore = Math.round(((matchedSkillCount + matchedTechCount) / totalReqCriteria) * 100);
      }

      const candidateObj = {
        id: emp.id,
        employeeCode: emp.employeeCode,
        fullName: emp.fullName,
        professionalRole: emp.professionalRole,
        department: emp.department,
        designation: emp.designation,
        category: emp.category,
        employmentType: emp.employmentType,
        skills: emp.skills,
        technologies: emp.technologies,
        currentAllocationPct,
        availableCapacityPct,
        matchScore,
      };

      if (!isHrOrAdmin) {
        // Strip sensitive internal contact details if requester is PM
        const { personalEmail, address, dateOfBirth, ...publicCandidate } = candidateObj as any;
        return publicCandidate;
      }

      return candidateObj;
    });

    // Rank Candidates by Available Capacity and Skill Match Score
    candidates.sort((a, b) => {
      if (b.matchScore !== a.matchScore) return b.matchScore - a.matchScore;
      return b.availableCapacityPct - a.availableCapacityPct;
    });

    return candidates;
  }

  // =========================================================================
  // 3. CONCURRENCY-SAFE EMPLOYEE ASSIGNMENT (ADMIN ONLY)
  // =========================================================================

  /**
   * POST /api/v1/projects/:id/members — ADMIN assigns employee to project with row-level transaction serialization
   */
  async assignMember(adminUser: any, projectId: string, data: ProjectMemberAssignInput & { requirementId?: string }) {
    const requestedAllocation = data.allocationPct || 100.0;
    if (requestedAllocation <= 0 || requestedAllocation > 100.0) {
      throw new BadRequestException('Requested allocation percentage must be greater than 0 and less than or equal to 100.');
    }

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
      throw new BadRequestException(`Cannot assign members to a project in ${project.status} state.`);
    }

    // Execute inside atomic PostgreSQL transaction with row-level locking on Employee
    return await this.prisma.$transaction(async (tx) => {
      // 1. Row-level lock on Employee row to serialize concurrent assignment requests
      const lockedEmployees: any[] = await tx.$queryRaw`SELECT * FROM employees WHERE id = ${data.employeeId} FOR UPDATE`;
      if (!lockedEmployees || lockedEmployees.length === 0) {
        throw new NotFoundException(`Employee with ID '${data.employeeId}' not found.`);
      }
      const employee = lockedEmployees[0];

      if (employee.status !== 'ACTIVE') {
        throw new BadRequestException(`Employee ${employee.employee_code} cannot be assigned because status is ${employee.status}.`);
      }

      // 2. Requirement relationship & compatibility validation
      if (data.requirementId) {
        const req = await tx.projectResourceRequirement.findUnique({
          where: { id: data.requirementId },
        });

        if (!req) {
          throw new NotFoundException(`Resource requirement '${data.requirementId}' not found.`);
        }

        if (req.projectId !== projectId) {
          throw new BadRequestException(`Resource requirement '${data.requirementId}' does not belong to project '${projectId}'.`);
        }

        const activeCount = await tx.projectMember.count({
          where: { requirementId: data.requirementId, status: 'ACTIVE' },
        });

        if (activeCount >= req.requiredCount) {
          throw new BadRequestException(`Resource requirement for '${req.professionalRole}' is already fully satisfied.`);
        }

        if (req.category && employee.category !== req.category) {
          throw new BadRequestException(`Employee category '${employee.category}' is incompatible with requirement category '${req.category}'.`);
        }

        if (req.employmentType && employee.employment_type !== req.employmentType) {
          throw new BadRequestException(`Employee employment type '${employee.employment_type}' is incompatible with requirement employment type '${req.employmentType}'.`);
        }

        if (req.professionalRole && employee.professional_role.toLowerCase() !== req.professionalRole.toLowerCase()) {
          throw new BadRequestException(`Employee professional role '${employee.professional_role}' is incompatible with requirement role '${req.professionalRole}'.`);
        }
      }

      // 3. Check existing active assignment on same project (Duplicate protection)
      const existingActiveAssignment = await tx.projectMember.findFirst({
        where: { projectId, employeeId: data.employeeId, status: 'ACTIVE' },
      });

      if (existingActiveAssignment) {
        throw new ConflictException(`Employee ${employee.employee_code} is already actively assigned to project ${project.projectCode}.`);
      }

      // 4. Re-evaluate current active allocation under row lock
      const activeMemberships = await tx.projectMember.findMany({
        where: { employeeId: data.employeeId, status: 'ACTIVE' },
      });

      const currentAllocatedPct = activeMemberships.reduce((sum, pm) => sum + (pm.allocationPct || 0), 0);
      const availableCapacityPct = Math.max(0, 100.0 - currentAllocatedPct);

      if (currentAllocatedPct + requestedAllocation > 100.0) {
        throw new BadRequestException(
          `Over-allocation error: Employee ${employee.employee_code} currently has ${currentAllocatedPct}% allocation. Maximum available allocation is ${availableCapacityPct}%.`,
        );
      }

      // 5. Create ProjectMember record
      const member = await tx.projectMember.create({
        data: {
          projectId,
          employeeId: data.employeeId,
          requirementId: data.requirementId || undefined,
          projectRole: data.projectRole,
          allocationPct: requestedAllocation,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
          status: 'ACTIVE',
          assignedById: adminUser.id,
        },
        include: {
          employee: { select: { id: true, employeeCode: true, fullName: true, userId: true } },
          project: { select: { id: true, projectCode: true, title: true } },
        },
      });

      // 6. Immutable AuditLog
      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'PROJECT_MEMBER_ASSIGNED',
          entityType: 'ProjectMember',
          entityId: member.id,
          afterJson: {
            projectId: member.projectId,
            projectCode: member.project.projectCode,
            employeeId: member.employeeId,
            employeeCode: member.employee.employeeCode,
            requirementId: member.requirementId || null,
            allocationPct: member.allocationPct,
            projectRole: member.projectRole,
            assignedById: adminUser.id,
          },
        },
      });

      // 6. Notification to Employee
      await tx.notification.create({
        data: {
          recipientUserId: member.employee.userId,
          eventType: 'PROJECT_ASSIGNED',
          entityType: 'Project',
          entityId: project.id,
          message: `You have been assigned to project ${project.projectCode} (${project.title}). Role: ${data.projectRole}, Allocation: ${requestedAllocation}%.`,
        },
      });

      return member;
    }, { maxWait: 10000, timeout: 10000 });
  }

  /**
   * PATCH /api/v1/projects/:id/members/:memberId — ADMIN updates member allocation with concurrency lock
   */
  async updateMemberAllocation(
    adminUser: any,
    projectId: string,
    memberId: string,
    data: { allocationPct?: number; projectRole?: string; startDate?: string; endDate?: string },
  ) {
    const existingMember = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: { employee: true, project: true },
    });

    if (!existingMember) {
      throw new NotFoundException(`Project member '${memberId}' not found on project '${projectId}'.`);
    }

    if (existingMember.status !== 'ACTIVE') {
      throw new BadRequestException('Cannot modify allocation for a released project member.');
    }

    return await this.prisma.$transaction(async (tx) => {
      // Row lock on Employee
      await tx.$queryRaw`SELECT * FROM employees WHERE id = ${existingMember.employeeId} FOR UPDATE`;

      const newAllocation = data.allocationPct !== undefined ? data.allocationPct : existingMember.allocationPct;
      if (newAllocation! <= 0 || newAllocation! > 100.0) {
        throw new BadRequestException('Allocation percentage must be greater than 0 and less than or equal to 100.');
      }

      // Re-evaluate current active allocation excluding target member's current allocation
      const otherActiveMemberships = await tx.projectMember.findMany({
        where: {
          employeeId: existingMember.employeeId,
          status: 'ACTIVE',
          id: { not: memberId },
        },
      });

      const otherAllocationsPct = otherActiveMemberships.reduce((sum, pm) => sum + (pm.allocationPct || 0), 0);
      const availableCapacityForMember = Math.max(0, 100.0 - otherAllocationsPct);

      if (newAllocation! > availableCapacityForMember) {
        throw new BadRequestException(
          `Over-allocation error: Employee ${existingMember.employee.employeeCode} has ${otherAllocationsPct}% allocated to other projects. Maximum available capacity is ${availableCapacityForMember}%.`,
        );
      }

      const updated = await tx.projectMember.update({
        where: { id: memberId },
        data: {
          allocationPct: newAllocation,
          projectRole: data.projectRole || existingMember.projectRole,
          startDate: data.startDate ? new Date(data.startDate) : existingMember.startDate,
          endDate: data.endDate ? new Date(data.endDate) : existingMember.endDate,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUser.id,
          action: 'PROJECT_MEMBER_ALLOCATION_UPDATED',
          entityType: 'ProjectMember',
          entityId: memberId,
          beforeJson: { allocationPct: existingMember.allocationPct, projectRole: existingMember.projectRole },
          afterJson: { allocationPct: updated.allocationPct, projectRole: updated.projectRole },
        },
      });

      await tx.notification.create({
        data: {
          recipientUserId: existingMember.employee.userId,
          eventType: 'PROJECT_ALLOCATION_CHANGED',
          entityType: 'Project',
          entityId: projectId,
          message: `Your allocation on project ${existingMember.project.projectCode} was updated to ${newAllocation}%.`,
        },
      });

      return updated;
    }, { maxWait: 10000, timeout: 10000 });
  }

  /**
   * POST /api/v1/projects/:id/members/:memberId/release — ADMIN releases employee from project
   */
  async releaseMember(adminUser: any, projectId: string, memberId: string, reason?: string) {
    const existingMember = await this.prisma.projectMember.findFirst({
      where: { id: memberId, projectId },
      include: { employee: true, project: true },
    });

    if (!existingMember) {
      throw new NotFoundException(`Project member '${memberId}' not found on project '${projectId}'.`);
    }

    if (existingMember.status === 'RELEASED') {
      throw new BadRequestException('Project member has already been released.');
    }

    const released = await this.prisma.projectMember.update({
      where: { id: memberId },
      data: {
        status: 'RELEASED',
        removedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'PROJECT_MEMBER_RELEASED',
        entityType: 'ProjectMember',
        entityId: memberId,
        beforeJson: existingMember as any,
        afterJson: { ...released, releaseReason: reason || 'Admin requested release' } as any,
      },
    });

    await this.prisma.notification.create({
      data: {
        recipientUserId: existingMember.employee.userId,
        eventType: 'PROJECT_RELEASED',
        entityType: 'Project',
        entityId: projectId,
        message: `You have been released from project ${existingMember.project.projectCode}.`,
      },
    });

    return released;
  }

  // ==========================================
  // PROJECT EXECUTION MODULE (SLICE 2)
  // ==========================================

  /**
   * Helper: Centralized server-side execution access check
   */
  async verifyProjectExecutionAccess(user: any, projectId: string, mode: 'MANAGE' | 'VIEW' = 'VIEW') {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { organization: true },
    });

    if (!project) {
      throw new NotFoundException(`Project '${projectId}' not found.`);
    }

    const isAdmin = user.roles?.includes('ADMIN');
    const isHr = user.roles?.includes('HR');

    if (mode === 'MANAGE') {
      if (isAdmin) return { project, isAdmin: true, isPm: false, employee: null };
      if (isHr) {
        throw new ForbiddenException('HR is not authorized to manage project execution.');
      }

      // Check if user has an Employee profile and is an assigned Project Manager on this project
      const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
      if (!employee) {
        throw new ForbiddenException('Project execution management requires an assigned Employee profile.');
      }

      const activePmMember = await this.prisma.projectMember.findFirst({
        where: {
          projectId,
          employeeId: employee.id,
          status: 'ACTIVE',
        },
      });

      if (!activePmMember) {
        throw new ForbiddenException(`You are not an active member of project '${project.projectCode}'.`);
      }

      const roleLower = activePmMember.projectRole.toLowerCase();
      const isPm = roleLower.includes('project manager') || roleLower.includes('pm') || roleLower.includes('lead');

      if (!isPm) {
        throw new ForbiddenException(`Only ADMIN or assigned Project Manager can manage execution on project '${project.projectCode}'.`);
      }

      return { project, isAdmin: false, isPm: true, employee };
    }

    // mode === 'VIEW'
    const isInternalWorkforce = user.roles?.some((r: string) => ['ADMIN', 'HR', 'PM', 'EXPERT', 'INTERN', 'QA', 'LEGAL'].includes(r));
    if (isAdmin || isInternalWorkforce) {
      return { project, isAdmin, isInternal: true, isOrgUser: false };
    }

    // Check Industry user (ORG_USER) tenant isolation
    const orgUser = await this.prisma.organizationUser.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
    });

    if (!orgUser || orgUser.organizationId !== project.organizationId) {
      throw new ForbiddenException('Cannot access project execution outside your authorized organization.');
    }

    return { project, isAdmin: false, isInternal: false, isOrgUser: true };
  }

  /**
   * Helper: Lock guard for COMPLETED / CANCELLED projects
   */
  private checkProjectNotLocked(project: any) {
    if (project.status === 'COMPLETED' || project.status === 'CANCELLED') {
      throw new BadRequestException(`Project execution is locked because the project is ${project.status}.`);
    }
  }

  // --- MILESTONE APIs ---

  async createMilestone(user: any, projectId: string, input: CreateProjectMilestoneInput) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    if (input.startDate && input.dueDate && new Date(input.dueDate) < new Date(input.startDate)) {
      throw new BadRequestException('Due date cannot precede start date.');
    }

    const milestone = await this.prisma.projectMilestone.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        sequence: input.sequence ?? 1,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: new Date(input.dueDate),
        isClientVisible: input.isClientVisible ?? true,
        createdById: user.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'MILESTONE_CREATED',
        entityType: 'ProjectMilestone',
        entityId: milestone.id,
        afterJson: milestone as any,
      },
    });

    return milestone;
  }

  async getMilestones(user: any, projectId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    const whereClause: any = { projectId };
    if (isOrgUser) {
      whereClause.isClientVisible = true;
    }

    const milestones = await this.prisma.projectMilestone.findMany({
      where: whereClause,
      include: {
        tasks: {
          select: { id: true, status: true, progressPct: true, isClientVisible: true },
        },
      },
      orderBy: { sequence: 'asc' },
    });

    const now = new Date();

    return milestones.map((m) => {
      const visibleTasks = isOrgUser ? m.tasks.filter((t) => t.isClientVisible) : m.tasks;
      const totalTasks = visibleTasks.length;
      const completedTasks = visibleTasks.filter((t) => t.status === 'COMPLETED').length;
      const totalProgress = visibleTasks.reduce((sum, t) => sum + t.progressPct, 0);

      const serverDerivedProgress = totalTasks > 0 ? Math.round(totalProgress / totalTasks) : m.progressPct;
      const isOverdue = m.dueDate < now && m.status !== 'COMPLETED';

      let derivedStatus = m.status;
      if (completedTasks === totalTasks && totalTasks > 0) {
        derivedStatus = 'COMPLETED';
      } else if (isOverdue) {
        derivedStatus = 'OVERDUE';
      } else if (completedTasks > 0 || totalProgress > 0) {
        derivedStatus = 'IN_PROGRESS';
      }

      const { tasks, ...milestoneData } = m;
      return {
        ...milestoneData,
        status: derivedStatus,
        progressPct: serverDerivedProgress,
        totalTasks,
        completedTasks,
        isOverdue,
      };
    });
  }

  async updateMilestone(user: any, projectId: string, milestoneId: string, input: UpdateProjectMilestoneInput) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    const existing = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId },
    });

    if (!existing) {
      throw new NotFoundException(`Milestone '${milestoneId}' not found on project '${projectId}'.`);
    }

    const updated = await this.prisma.projectMilestone.update({
      where: { id: milestoneId },
      data: {
        title: input.title,
        description: input.description,
        sequence: input.sequence,
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        completedAt: input.completedAt ? new Date(input.completedAt) : input.status === 'COMPLETED' ? new Date() : undefined,
        status: input.status,
        isClientVisible: input.isClientVisible,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'MILESTONE_UPDATED',
        entityType: 'ProjectMilestone',
        entityId: milestoneId,
        beforeJson: existing as any,
        afterJson: updated as any,
      },
    });

    return updated;
  }

  async deleteMilestone(user: any, projectId: string, milestoneId: string) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    const milestone = await this.prisma.projectMilestone.findFirst({
      where: { id: milestoneId, projectId },
      include: { tasks: true, deliverables: true },
    });

    if (!milestone) {
      throw new NotFoundException(`Milestone '${milestoneId}' not found on project '${projectId}'.`);
    }

    if (milestone.tasks.length > 0 || milestone.deliverables.length > 0) {
      throw new BadRequestException(`Cannot delete milestone '${milestone.title}' because it contains ${milestone.tasks.length} tasks and ${milestone.deliverables.length} deliverables.`);
    }

    await this.prisma.projectMilestone.delete({ where: { id: milestoneId } });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'MILESTONE_DELETED',
        entityType: 'ProjectMilestone',
        entityId: milestoneId,
        beforeJson: milestone as any,
      },
    });

    return { success: true, id: milestoneId };
  }

  // --- TASK APIs ---

  async createTask(user: any, projectId: string, input: CreateProjectTaskInput) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    if (input.milestoneId) {
      const milestone = await this.prisma.projectMilestone.findFirst({
        where: { id: input.milestoneId, projectId },
      });
      if (!milestone) {
        throw new BadRequestException(`Milestone '${input.milestoneId}' does not belong to project '${projectId}'.`);
      }
    }

    // Verify Assignee Employee exists & is an ACTIVE ProjectMember of this project
    const activeMember = await this.prisma.projectMember.findFirst({
      where: {
        projectId,
        employeeId: input.assigneeEmployeeId,
        status: 'ACTIVE',
      },
      include: { employee: true },
    });

    if (!activeMember) {
      throw new BadRequestException(`Employee '${input.assigneeEmployeeId}' is not an active ProjectMember of project '${project.projectCode}'. Assign them to the project first.`);
    }

    const task = await this.prisma.projectTask.create({
      data: {
        projectId,
        milestoneId: input.milestoneId || undefined,
        assigneeEmployeeId: input.assigneeEmployeeId,
        title: input.title,
        description: input.description,
        priority: input.priority ?? 'MEDIUM',
        status: 'TODO',
        startDate: input.startDate ? new Date(input.startDate) : undefined,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        estimatedHours: input.estimatedHours,
        isClientVisible: input.isClientVisible ?? false,
        createdById: user.id,
      },
      include: {
        assigneeEmployee: {
          select: { id: true, employeeCode: true, fullName: true, professionalRole: true, userId: true },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'TASK_CREATED',
        entityType: 'ProjectTask',
        entityId: task.id,
        afterJson: task as any,
      },
    });

    if (activeMember.employee.userId) {
      await this.prisma.notification.create({
        data: {
          recipientUserId: activeMember.employee.userId,
          eventType: 'TASK_ASSIGNED',
          entityType: 'ProjectTask',
          entityId: task.id,
          message: `You have been assigned to task '${task.title}' on project ${project.projectCode}.`,
        },
      });
    }

    return task;
  }

  async getTasks(user: any, projectId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    const whereClause: any = { projectId };
    if (isOrgUser) {
      whereClause.isClientVisible = true;
    }

    const tasks = await this.prisma.projectTask.findMany({
      where: whereClause,
      include: {
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            professionalRole: true,
            category: true,
          },
        },
        milestone: {
          select: { id: true, title: true, sequence: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    return tasks.map((t) => {
      const isOverdue = Boolean(t.dueDate && t.dueDate < now && t.status !== 'COMPLETED');

      if (isOrgUser) {
        const { assigneeEmployee, ...taskData } = t;
        return { ...taskData, isOverdue };
      }

      return { ...t, isOverdue };
    });
  }

  async getTaskById(user: any, projectId: string, taskId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    const task = await this.prisma.projectTask.findFirst({
      where: { id: taskId, projectId },
      include: {
        assigneeEmployee: {
          select: {
            id: true,
            employeeCode: true,
            fullName: true,
            professionalRole: true,
            category: true,
          },
        },
        milestone: {
          select: { id: true, title: true, sequence: true },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task '${taskId}' not found on project '${projectId}'.`);
    }

    if (isOrgUser && !task.isClientVisible) {
      throw new ForbiddenException('Task is not client-visible.');
    }

    const isOverdue = Boolean(task.dueDate && task.dueDate < new Date() && task.status !== 'COMPLETED');
    if (isOrgUser) {
      const { assigneeEmployee, ...taskData } = task;
      return { ...taskData, isOverdue };
    }

    return { ...task, isOverdue };
  }

  async updateTask(user: any, projectId: string, taskId: string, input: UpdateProjectTaskInput) {
    const { project, isAdmin, isPm } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    const existing = await this.prisma.projectTask.findFirst({
      where: { id: taskId, projectId },
      include: { assigneeEmployee: true },
    });

    if (!existing) {
      throw new NotFoundException(`Task '${taskId}' not found on project '${projectId}'.`);
    }

    const updateData: any = {};

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.milestoneId !== undefined) updateData.milestoneId = input.milestoneId || null;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.estimatedHours !== undefined) updateData.estimatedHours = input.estimatedHours;
    if (input.actualHours !== undefined) updateData.actualHours = input.actualHours;
    if (input.isClientVisible !== undefined) updateData.isClientVisible = input.isClientVisible;

    if (input.startDate !== undefined) updateData.startDate = input.startDate ? new Date(input.startDate) : null;
    if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;

    if (input.assigneeEmployeeId && input.assigneeEmployeeId !== existing.assigneeEmployeeId) {
      const activeMember = await this.prisma.projectMember.findFirst({
        where: { projectId, employeeId: input.assigneeEmployeeId, status: 'ACTIVE' },
      });

      if (!activeMember) {
        throw new BadRequestException(`Employee '${input.assigneeEmployeeId}' is not an active ProjectMember of this project.`);
      }

      updateData.assigneeEmployeeId = input.assigneeEmployeeId;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 'COMPLETED') {
        updateData.progressPct = 100;
        updateData.completedAt = new Date();
      } else if ((existing.status as string) === 'COMPLETED' && (input.status as string) !== 'COMPLETED') {
        updateData.completedAt = null;
        if (input.progressPct === undefined) {
          updateData.progressPct = input.status === 'TODO' ? 0 : 50;
        }
      }
    }

    if (input.progressPct !== undefined && updateData.status !== 'COMPLETED') {
      updateData.progressPct = Math.max(0, Math.min(100, input.progressPct));
    }

    const updated = await this.prisma.projectTask.update({
      where: { id: taskId },
      data: updateData,
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'TASK_UPDATED',
        entityType: 'ProjectTask',
        entityId: taskId,
        beforeJson: existing as any,
        afterJson: updated as any,
      },
    });

    return updated;
  }

  // --- EMPLOYEE SELF-SERVICE TASK APIs ---

  async getEmployeeTasks(user: any, projectId?: string, status?: string, priority?: string) {
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      throw new ForbiddenException('No active Employee record associated with your user account.');
    }

    const where: any = { assigneeEmployeeId: employee.id };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    const tasks = await this.prisma.projectTask.findMany({
      where,
      include: {
        project: { select: { id: true, projectCode: true, title: true, status: true } },
        milestone: { select: { id: true, title: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const now = new Date();
    return tasks.map((t) => ({
      ...t,
      isOverdue: Boolean(t.dueDate && t.dueDate < now && t.status !== 'COMPLETED'),
    }));
  }

  async updateEmployeeTaskProgress(user: any, taskId: string, status?: string, progressPct?: number, actualHours?: number) {
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      throw new ForbiddenException('No active Employee record associated with your user account.');
    }

    const task = await this.prisma.projectTask.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException(`Task '${taskId}' not found.`);
    }

    if (task.assigneeEmployeeId !== employee.id) {
      throw new ForbiddenException('You are not authorized to update progress on another employee\'s task.');
    }

    this.checkProjectNotLocked(task.project);

    const updateData: any = {};

    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.progressPct = 100;
        updateData.completedAt = new Date();
      } else if (task.status === 'COMPLETED' && status !== 'COMPLETED') {
        updateData.completedAt = null;
      }
    }

    if (progressPct !== undefined && updateData.status !== 'COMPLETED') {
      updateData.progressPct = Math.max(0, Math.min(100, progressPct));
    }

    if (actualHours !== undefined) {
      updateData.actualHours = Math.max(0, actualHours);
    }

    const updated = await this.prisma.projectTask.update({
      where: { id: taskId },
      data: updateData,
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'TASK_PROGRESS_UPDATED',
        entityType: 'ProjectTask',
        entityId: taskId,
        beforeJson: task as any,
        afterJson: updated as any,
      },
    });

    return updated;
  }

  // --- DELIVERABLE APIs ---

  async createDeliverable(user: any, projectId: string, input: CreateProjectDeliverableInput) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');
    this.checkProjectNotLocked(project);

    if (input.milestoneId) {
      const milestone = await this.prisma.projectMilestone.findFirst({
        where: { id: input.milestoneId, projectId },
      });
      if (!milestone) {
        throw new BadRequestException(`Milestone '${input.milestoneId}' does not belong to project '${projectId}'.`);
      }
    }

    const deliverable = await this.prisma.projectDeliverable.create({
      data: {
        projectId,
        milestoneId: input.milestoneId || undefined,
        title: input.title,
        description: input.description,
        status: 'DRAFT',
        isClientVisible: input.isClientVisible ?? true,
        submittedById: user.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'DELIVERABLE_CREATED',
        entityType: 'ProjectDeliverable',
        entityId: deliverable.id,
        afterJson: deliverable as any,
      },
    });

    return deliverable;
  }

  async getDeliverables(user: any, projectId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    const whereClause: any = { projectId };
    if (isOrgUser) {
      whereClause.status = 'APPROVED';
      whereClause.isClientVisible = true;
    }

    const deliverables = await this.prisma.projectDeliverable.findMany({
      where: whereClause,
      include: {
        submittedBy: { select: { id: true, email: true } },
        reviewedBy: { select: { id: true, email: true } },
        milestone: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return deliverables;
  }

  async getDeliverableById(user: any, projectId: string, deliverableId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    const deliverable = await this.prisma.projectDeliverable.findFirst({
      where: { id: deliverableId, projectId },
      include: {
        submittedBy: { select: { id: true, email: true } },
        reviewedBy: { select: { id: true, email: true } },
        milestone: { select: { id: true, title: true } },
      },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable '${deliverableId}' not found on project '${projectId}'.`);
    }

    if (isOrgUser && (deliverable.status !== 'APPROVED' || !deliverable.isClientVisible)) {
      throw new ForbiddenException('Deliverable is not accessible to client organization.');
    }

    return deliverable;
  }

  async submitDeliverable(user: any, projectId: string, deliverableId: string) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');
    this.checkProjectNotLocked(project);

    const deliverable = await this.prisma.projectDeliverable.findFirst({
      where: { id: deliverableId, projectId },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable '${deliverableId}' not found on project '${projectId}'.`);
    }

    if (deliverable.status !== 'DRAFT' && deliverable.status !== 'REVISION_REQUESTED') {
      throw new BadRequestException(`Cannot submit deliverable in '${deliverable.status}' state.`);
    }

    const updated = await this.prisma.projectDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'DELIVERABLE_SUBMITTED',
        entityType: 'ProjectDeliverable',
        entityId: deliverableId,
        beforeJson: deliverable as any,
        afterJson: updated as any,
      },
    });

    return updated;
  }

  async reviewDeliverable(
    user: any,
    projectId: string,
    deliverableId: string,
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_REVISION',
    reviewNotes?: string,
  ) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    const deliverable = await this.prisma.projectDeliverable.findFirst({
      where: { id: deliverableId, projectId },
    });

    if (!deliverable) {
      throw new NotFoundException(`Deliverable '${deliverableId}' not found on project '${projectId}'.`);
    }

    if (deliverable.status !== 'SUBMITTED' && deliverable.status !== 'UNDER_REVIEW') {
      throw new BadRequestException(`Deliverable '${deliverable.title}' cannot be reviewed while in '${deliverable.status}' status.`);
    }

    if ((decision === 'REJECT' || decision === 'REQUEST_REVISION') && (!reviewNotes || !reviewNotes.trim())) {
      throw new BadRequestException(`Review notes/comments are required when decision is ${decision}.`);
    }

    let targetStatus: any = 'APPROVED';
    let auditAction = 'DELIVERABLE_APPROVED';

    if (decision === 'REJECT') {
      targetStatus = 'REJECTED';
      auditAction = 'DELIVERABLE_REJECTED';
    } else if (decision === 'REQUEST_REVISION') {
      targetStatus = 'REVISION_REQUESTED';
      auditAction = 'DELIVERABLE_REVISION_REQUESTED';
    }

    const updated = await this.prisma.projectDeliverable.update({
      where: { id: deliverableId },
      data: {
        status: targetStatus,
        reviewedById: user.id,
        reviewedAt: new Date(),
        reviewNotes: reviewNotes || null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: auditAction,
        entityType: 'ProjectDeliverable',
        entityId: deliverableId,
        beforeJson: deliverable as any,
        afterJson: updated as any,
      },
    });

    await this.prisma.notification.create({
      data: {
        recipientUserId: deliverable.submittedById,
        eventType: auditAction,
        entityType: 'ProjectDeliverable',
        entityId: deliverableId,
        message: `Your deliverable '${deliverable.title}' was reviewed with decision: ${decision}.`,
      },
    });

    return updated;
  }

  // --- ONLINE MEETINGS APIs ---

  async createMeeting(user: any, projectId: string, input: CreateProjectMeetingInput) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    if (new Date(input.endDateTime) <= new Date(input.startDateTime)) {
      throw new BadRequestException('Meeting end date/time must be after start date/time.');
    }

    // Verify all participant employees are active ProjectMembers
    let participantEmployeeIds = input.participantEmployeeIds || [];
    if (participantEmployeeIds.length > 0) {
      const activeMembers = await this.prisma.projectMember.findMany({
        where: {
          projectId,
          employeeId: { in: participantEmployeeIds },
          status: 'ACTIVE',
        },
      });
      participantEmployeeIds = activeMembers.map((m) => m.employeeId);
    }

    const meeting = await this.prisma.projectMeeting.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        meetingUrl: input.meetingUrl,
        meetingProvider: (input.meetingProvider as any) ?? 'GOOGLE_MEET',
        startDateTime: new Date(input.startDateTime),
        endDateTime: new Date(input.endDateTime),
        status: 'SCHEDULED',
        isClientVisible: input.isClientVisible ?? false,
        createdById: user.id,
        participants: {
          create: participantEmployeeIds.map((empId) => ({ employeeId: empId })),
        },
      },
      include: {
        participants: {
          include: {
            employee: { select: { id: true, employeeCode: true, fullName: true, userId: true } },
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'MEETING_CREATED',
        entityType: 'ProjectMeeting',
        entityId: meeting.id,
        afterJson: meeting as any,
      },
    });

    // Notify participants
    for (const p of meeting.participants) {
      if (p.employee.userId) {
        await this.prisma.notification.create({
          data: {
            recipientUserId: p.employee.userId,
            eventType: 'MEETING_CREATED',
            entityType: 'ProjectMeeting',
            entityId: meeting.id,
            message: `You have been invited to meeting '${meeting.title}' for project ${project.projectCode}.`,
          },
        });
      }
    }

    return meeting;
  }

  async getMeetings(user: any, projectId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    const whereClause: any = { projectId };
    if (isOrgUser) {
      whereClause.isClientVisible = true;
    }

    const meetings = await this.prisma.projectMeeting.findMany({
      where: whereClause,
      include: {
        createdBy: { select: { id: true, email: true } },
        participants: {
          include: {
            employee: {
              select: { id: true, employeeCode: true, fullName: true, professionalRole: true },
            },
          },
        },
      },
      orderBy: { startDateTime: 'asc' },
    });

    if (isOrgUser) {
      return meetings.map((m) => {
        const { participants, createdBy, ...meetingData } = m;
        return meetingData;
      });
    }

    return meetings;
  }

  async updateMeeting(user: any, projectId: string, meetingId: string, input: UpdateProjectMeetingInput) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    const existing = await this.prisma.projectMeeting.findFirst({
      where: { id: meetingId, projectId },
    });

    if (!existing) {
      throw new NotFoundException(`Meeting '${meetingId}' not found on project '${projectId}'.`);
    }

    const updateData: any = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.meetingUrl !== undefined) updateData.meetingUrl = input.meetingUrl;
    if (input.meetingProvider !== undefined) updateData.meetingProvider = input.meetingProvider;
    if (input.startDateTime !== undefined) updateData.startDateTime = new Date(input.startDateTime);
    if (input.endDateTime !== undefined) updateData.endDateTime = new Date(input.endDateTime);
    if (input.status !== undefined) updateData.status = input.status;
    if (input.isClientVisible !== undefined) updateData.isClientVisible = input.isClientVisible;

    if (input.participantEmployeeIds !== undefined) {
      await this.prisma.projectMeetingParticipant.deleteMany({ where: { meetingId } });
      updateData.participants = {
        create: input.participantEmployeeIds.map((empId) => ({ employeeId: empId })),
      };
    }

    const updated = await this.prisma.projectMeeting.update({
      where: { id: meetingId },
      data: updateData,
      include: {
        participants: {
          include: {
            employee: { select: { id: true, employeeCode: true, fullName: true } },
          },
        },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'MEETING_UPDATED',
        entityType: 'ProjectMeeting',
        entityId: meetingId,
        beforeJson: existing as any,
        afterJson: updated as any,
      },
    });

    return updated;
  }

  async cancelMeeting(user: any, projectId: string, meetingId: string) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'MANAGE');
    this.checkProjectNotLocked(project);

    const existing = await this.prisma.projectMeeting.findFirst({
      where: { id: meetingId, projectId },
      include: { participants: { include: { employee: true } } },
    });

    if (!existing) {
      throw new NotFoundException(`Meeting '${meetingId}' not found on project '${projectId}'.`);
    }

    const updated = await this.prisma.projectMeeting.update({
      where: { id: meetingId },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'MEETING_CANCELLED',
        entityType: 'ProjectMeeting',
        entityId: meetingId,
        beforeJson: existing as any,
        afterJson: updated as any,
      },
    });

    for (const p of existing.participants) {
      if (p.employee.userId) {
        await this.prisma.notification.create({
          data: {
            recipientUserId: p.employee.userId,
            eventType: 'MEETING_CANCELLED',
            entityType: 'ProjectMeeting',
            entityId: meetingId,
            message: `Meeting '${existing.title}' for project ${project.projectCode} has been cancelled.`,
          },
        });
      }
    }

    return updated;
  }

  // --- PROJECT FILES & EXTERNAL RESOURCE LINKS APIs ---

  async createResourceLink(user: any, projectId: string, input: CreateProjectResourceLinkInput) {
    const { project } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');
    this.checkProjectNotLocked(project);

    const resourceLink = await this.prisma.projectResourceLink.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        url: input.url,
        resourceType: (input.resourceType as any) ?? 'OTHER',
        isClientVisible: input.isClientVisible ?? false,
        createdById: user.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'PROJECT_RESOURCE_ADDED',
        entityType: 'ProjectResourceLink',
        entityId: resourceLink.id,
        afterJson: resourceLink as any,
      },
    });

    return resourceLink;
  }

  async getResourceLinks(user: any, projectId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    const whereClause: any = { projectId };
    if (isOrgUser) {
      whereClause.isClientVisible = true;
    }

    const links = await this.prisma.projectResourceLink.findMany({
      where: whereClause,
      include: { createdBy: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return links;
  }

  async deleteResourceLink(user: any, projectId: string, linkId: string) {
    const { project, isAdmin } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');
    this.checkProjectNotLocked(project);

    const link = await this.prisma.projectResourceLink.findFirst({
      where: { id: linkId, projectId },
    });

    if (!link) {
      throw new NotFoundException(`Resource link '${linkId}' not found on project '${projectId}'.`);
    }

    if (!isAdmin && link.createdById !== user.id) {
      throw new ForbiddenException('Only link creator or ADMIN can delete this resource link.');
    }

    await this.prisma.projectResourceLink.delete({ where: { id: linkId } });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'PROJECT_RESOURCE_DELETED',
        entityType: 'ProjectResourceLink',
        entityId: linkId,
        beforeJson: link as any,
      },
    });

    return { success: true, id: linkId };
  }

  async getProjectFiles(user: any, projectId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    // Get documents attached to project directly OR deliverables of this project
    const deliverables = await this.prisma.projectDeliverable.findMany({
      where: { projectId },
      select: { id: true },
    });
    const deliverableIds = deliverables.map((d) => d.id);

    const docs = await this.prisma.document.findMany({
      where: {
        OR: [
          { entityType: 'Project', entityId: projectId },
          { entityType: 'ProjectDeliverable', entityId: { in: deliverableIds } },
        ],
      },
      include: {
        uploader: { select: { id: true, email: true } },
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (isOrgUser) {
      return docs.filter((d) => d.visibility === 'PUBLIC' || d.visibility === 'SHARED');
    }

    return docs;
  }

  // --- PROJECT UNIFIED ACTIVITY LOG API ---

  async getProjectActivity(user: any, projectId: string) {
    const { isOrgUser } = await this.verifyProjectExecutionAccess(user, projectId, 'VIEW');

    if (isOrgUser) {
      return []; // Sensitive internal audit logs hidden from Industry
    }

    const members = await this.prisma.projectMember.findMany({ where: { projectId }, select: { id: true } });
    const tasks = await this.prisma.projectTask.findMany({ where: { projectId }, select: { id: true } });
    const milestones = await this.prisma.projectMilestone.findMany({ where: { projectId }, select: { id: true } });
    const deliverables = await this.prisma.projectDeliverable.findMany({ where: { projectId }, select: { id: true } });
    const meetings = await this.prisma.projectMeeting.findMany({ where: { projectId }, select: { id: true } });

    const memberIds = members.map((m) => m.id);
    const taskIds = tasks.map((t) => t.id);
    const milestoneIds = milestones.map((m) => m.id);
    const deliverableIds = deliverables.map((d) => d.id);
    const meetingIds = meetings.map((m) => m.id);

    const logs = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'Project', entityId: projectId },
          { entityType: 'ProjectMember', entityId: { in: memberIds } },
          { entityType: 'ProjectTask', entityId: { in: taskIds } },
          { entityType: 'ProjectMilestone', entityId: { in: milestoneIds } },
          { entityType: 'ProjectDeliverable', entityId: { in: deliverableIds } },
          { entityType: 'ProjectMeeting', entityId: { in: meetingIds } },
          { entityType: 'ProjectResourceLink' },
        ],
      },
      include: {
        actor: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return logs;
  }

  // --- EMPLOYEE ACTIVE PROJECTS API ---

  async getEmployeeProjects(user: any) {
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      throw new ForbiddenException('No active Employee record associated with your user account.');
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { employeeId: employee.id, status: 'ACTIVE' },
      include: {
        project: {
          include: {
            organization: { select: { legalName: true } },
            milestones: { select: { id: true, title: true, status: true, dueDate: true } },
            tasks: {
              where: { assigneeEmployeeId: employee.id },
              select: { id: true, title: true, status: true, priority: true, dueDate: true },
            },
            meetings: {
              where: {
                status: 'SCHEDULED',
                participants: { some: { employeeId: employee.id } },
              },
              select: { id: true, title: true, meetingUrl: true, meetingProvider: true, startDateTime: true, endDateTime: true },
            },
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return memberships.map((m) => ({
      memberId: m.id,
      projectId: m.projectId,
      projectCode: m.project.projectCode,
      title: m.project.title,
      clientName: m.project.organization.legalName,
      status: m.project.status,
      projectRole: m.projectRole,
      allocationPct: m.allocationPct,
      assignedAt: m.assignedAt,
      activeTasksCount: m.project.tasks.filter((t) => t.status !== 'COMPLETED').length,
      myTasks: m.project.tasks,
      upcomingMeetings: m.project.meetings,
      milestonesCount: m.project.milestones.length,
    }));
  }

  async getEmployeeDeliverables(user: any) {
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      throw new ForbiddenException('No active Employee record associated with your user account.');
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { employeeId: employee.id, status: 'ACTIVE' },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const deliverables = await this.prisma.projectDeliverable.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        submittedBy: { select: { id: true, email: true } },
        reviewedBy: { select: { id: true, email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return deliverables;
  }

  async getEmployeeMeetings(user: any) {
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      throw new ForbiddenException('No active Employee record associated with your user account.');
    }

    const meetings = await this.prisma.projectMeeting.findMany({
      where: {
        participants: { some: { employeeId: employee.id } },
      },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        participants: {
          include: {
            employee: { select: { id: true, employeeCode: true, fullName: true, professionalRole: true } },
          },
        },
      },
      orderBy: { startDateTime: 'asc' },
    });

    return meetings;
  }

  async getEmployeeResources(user: any) {
    const employee = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    if (!employee) {
      throw new ForbiddenException('No active Employee record associated with your user account.');
    }

    const memberships = await this.prisma.projectMember.findMany({
      where: { employeeId: employee.id, status: 'ACTIVE' },
      select: { projectId: true },
    });
    const projectIds = memberships.map((m) => m.projectId);

    const links = await this.prisma.projectResourceLink.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        project: { select: { id: true, projectCode: true, title: true } },
        createdBy: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const deliverables = await this.prisma.projectDeliverable.findMany({
      where: { projectId: { in: projectIds } },
      select: { id: true },
    });
    const deliverableIds = deliverables.map((d) => d.id);

    const docs = await this.prisma.document.findMany({
      where: {
        OR: [
          { entityType: 'Project', entityId: { in: projectIds } },
          { entityType: 'ProjectDeliverable', entityId: { in: deliverableIds } },
        ],
      },
      include: { uploader: { select: { id: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return { links, documents: docs };
  }

  // ==========================================
  // INDUSTRY CLIENT PORTAL (SLICE 5)
  // ==========================================

  private async getAuthorizedOrgUser(user: any) {
    const orgUser = await this.prisma.organizationUser.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
      include: { organization: true },
    });
    if (!orgUser) {
      throw new ForbiddenException('User is not an active member of an Industry Organization.');
    }
    return orgUser;
  }

  async getIndustryDashboard(user: any) {
    const orgUser = await this.getAuthorizedOrgUser(user);
    const orgId = orgUser.organizationId;

    const projects = await this.prisma.project.findMany({
      where: { organizationId: orgId },
      include: {
        milestones: true,
        deliverables: true,
        meetings: true,
        members: { where: { status: 'ACTIVE' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalProjects = projects.length;
    const activeProjects = projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'INITIATED' || p.status === 'RESOURCE_ASSIGNMENT').length;
    const completedProjects = projects.filter((p) => p.status === 'COMPLETED').length;

    let totalProgressSum = 0;
    let projectsAtRiskCount = 0;
    let pendingDeliverablesCount = 0;
    let upcomingMeetingsCount = 0;

    const portfolio = projects.map((p) => {
      const milestones = p.milestones.filter((m) => m.isClientVisible);
      const progress = milestones.length > 0
        ? Math.round(milestones.reduce((acc, m) => acc + m.progressPct, 0) / milestones.length)
        : 0;
      totalProgressSum += progress;

      const nextMilestone = milestones
        .filter((m) => m.status !== 'COMPLETED')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      if (nextMilestone && new Date(nextMilestone.dueDate).getTime() < new Date().getTime()) {
        projectsAtRiskCount++;
      }

      const pendingDelivs = p.deliverables.filter((d) => d.isClientVisible && d.status === 'APPROVED').length;
      pendingDeliverablesCount += pendingDelivs;

      const upcomingMeets = p.meetings.filter((m) => m.isClientVisible && m.status === 'SCHEDULED').length;
      upcomingMeetingsCount += upcomingMeets;

      return {
        id: p.id,
        projectCode: p.projectCode,
        title: p.title,
        status: p.status,
        overallProgressPct: progress,
        teamHeadcount: p.members.length,
        milestonesCount: milestones.length,
        completedMilestonesCount: milestones.filter((m) => m.status === 'COMPLETED').length,
        nextMilestoneTitle: nextMilestone?.title || 'None',
        nextMilestoneDueDate: nextMilestone?.dueDate || null,
        timeline: p.timeline,
      };
    });

    const avgProgressPct = totalProjects > 0 ? Math.round(totalProgressSum / totalProjects) : 0;

    // Recent multi-project client-visible activity timeline
    const activityLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: { in: ['Project', 'ProjectMilestone', 'ProjectDeliverable', 'ProjectMeeting'] },
        entityId: { in: projects.map((p) => p.id) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      organizationName: orgUser.organization.legalName,
      totalProjects,
      activeProjects,
      completedProjects,
      projectsAtRiskCount,
      avgProgressPct,
      pendingDeliverablesCount,
      upcomingMeetingsCount,
      portfolio,
      recentUpdates: activityLogs,
    };
  }

  async getIndustryProjects(user: any, search?: string, status?: string) {
    const orgUser = await this.getAuthorizedOrgUser(user);
    const orgId = orgUser.organizationId;

    const where: any = { organizationId: orgId };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { projectCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const projects = await this.prisma.project.findMany({
      where,
      include: {
        milestones: { where: { isClientVisible: true } },
        deliverables: { where: { isClientVisible: true, status: 'APPROVED' } },
        meetings: { where: { isClientVisible: true, status: 'SCHEDULED' } },
        members: { where: { status: 'ACTIVE' } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return projects.map((p) => {
      const milestones = p.milestones;
      const progress = milestones.length > 0
        ? Math.round(milestones.reduce((acc, m) => acc + m.progressPct, 0) / milestones.length)
        : 0;

      const nextMilestone = milestones
        .filter((m) => m.status !== 'COMPLETED')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

      return {
        id: p.id,
        projectCode: p.projectCode,
        title: p.title,
        status: p.status,
        overallProgressPct: progress,
        teamHeadcount: p.members.length,
        createdAt: p.createdAt,
        timeline: p.timeline,
        milestonesCount: milestones.length,
        completedMilestonesCount: milestones.filter((m) => m.status === 'COMPLETED').length,
        nextMilestone: nextMilestone ? { title: nextMilestone.title, dueDate: nextMilestone.dueDate } : null,
        nextMeeting: p.meetings[0] ? { title: p.meetings[0].title, startDateTime: p.meetings[0].startDateTime, meetingUrl: p.meetings[0].meetingUrl } : null,
        pendingDeliverablesCount: p.deliverables.length,
      };
    });
  }

  async getIndustryProjectDetail(user: any, projectId: string) {
    const orgUser = await this.getAuthorizedOrgUser(user);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        organization: { select: { id: true, legalName: true } },
        milestones: { where: { isClientVisible: true }, orderBy: { sequence: 'asc' } },
        deliverables: { where: { isClientVisible: true, status: 'APPROVED' }, orderBy: { updatedAt: 'desc' } },
        meetings: { where: { isClientVisible: true }, orderBy: { startDateTime: 'asc' } },
        resourceLinks: { where: { isClientVisible: true }, orderBy: { createdAt: 'desc' } },
        members: { where: { status: 'ACTIVE' } },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.organizationId !== orgUser.organizationId) {
      throw new ForbiddenException('You are not authorized to view projects outside your organization.');
    }

    const milestones = project.milestones;
    const overallProgressPct = milestones.length > 0
      ? Math.round(milestones.reduce((acc, m) => acc + m.progressPct, 0) / milestones.length)
      : 0;

    return {
      project: {
        id: project.id,
        projectCode: project.projectCode,
        title: project.title,
        description: project.description,
        status: project.status,
        overallProgressPct,
        createdAt: project.createdAt,
        timeline: project.timeline,
        clientOrganizationName: project.organization.legalName,
        teamHeadcount: project.members.length,
      },
      milestones,
      deliverables: project.deliverables,
      meetings: project.meetings,
      resourceLinks: project.resourceLinks,
    };
  }

  async requestClientMeeting(user: any, projectId: string, input: { title: string; description?: string; meetingUrl?: string; startDateTime: string; endDateTime: string }) {
    const orgUser = await this.getAuthorizedOrgUser(user);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID '${projectId}' not found.`);
    }

    if (project.organizationId !== orgUser.organizationId) {
      throw new ForbiddenException('Cannot request meeting for projects outside your organization.');
    }

    const meeting = await this.prisma.projectMeeting.create({
      data: {
        projectId,
        title: input.title,
        description: input.description,
        meetingUrl: input.meetingUrl || 'https://meet.google.com/client-requested',
        meetingProvider: 'OTHER',
        startDateTime: new Date(input.startDateTime),
        endDateTime: new Date(input.endDateTime),
        status: 'REQUESTED',
        isClientVisible: true,
        createdById: user.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'CLIENT_MEETING_REQUESTED',
        entityType: 'ProjectMeeting',
        entityId: meeting.id,
        afterJson: { projectId, title: input.title },
      },
    });

    return meeting;
  }
}


