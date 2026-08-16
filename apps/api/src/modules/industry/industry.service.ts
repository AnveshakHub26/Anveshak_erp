import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import { EmailService } from '../../common/email/email.service';

@Injectable()
export class IndustryService {
  constructor(
    private prisma: PrismaService,
    @Optional() private emailService?: EmailService,
  ) {}

  private async generatePsCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.problemStatement.count();
    const nextSeq = (count + 1).toString().padStart(4, '0');
    return `PS-${year}-${nextSeq}`;
  }

  private async generateQueryNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.supportQuery.count();
    const nextSeq = (count + 1).toString().padStart(6, '0');
    return `QRY-${year}-${nextSeq}`;
  }

  private async generateProjectCode(tx: Prisma.TransactionClient): Promise<string> {
    const year = new Date().getFullYear();
    const name = `PROJECT_${year}`;

    const existingCounter = await tx.systemCounter.findUnique({ where: { name } });

    let assignedSeq: number;
    if (!existingCounter) {
      const latestProject = await tx.project.findFirst({
        where: { projectCode: { startsWith: `PRJ-${year}-` } },
        orderBy: { projectCode: 'desc' },
      });

      let startSeq = 1;
      if (latestProject && latestProject.projectCode) {
        const parts = latestProject.projectCode.split('-');
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
    return `PRJ-${year}-${seqStr}`;
  }

  /**
   * Enforces Industry organization authentication and APPROVED status.
   * Works seamlessly for all approved client organization classifications (Company, Enterprise, Industry, Institution, etc.)
   */
  async validateIndustryOrganization(user: any) {
    if (!user || !user.id) {
      throw new ForbiddenException('Authentication required to access Industry portal endpoints.');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        orgUsers: {
          include: {
            organization: {
              include: {
                primaryBv: true,
                organizationBvs: { include: { businessVertical: true } },
              },
            },
          },
        },
      },
    });

    if (!dbUser) {
      throw new NotFoundException('Authenticated user profile not found.');
    }

    const isAdmin = user.roles?.includes('ADMIN');
    const primaryOrgUser = dbUser.orgUsers[0];
    const org = primaryOrgUser?.organization;

    if (!isAdmin) {
      if (!org) {
        throw new ForbiddenException('Access denied: User is not associated with an organization.');
      }

      if (org.status !== 'APPROVED') {
        throw new ForbiddenException(
          `Access denied: Organization onboarding status is '${org.status}'. Approved client status required.`,
        );
      }
    }

    return {
      user: dbUser,
      organization: org,
    };
  }

  /**
   * IND-01 Industry Portal Dashboard metrics & summary
   */
  async getDashboard(user: any) {
    const { organization } = await this.validateIndustryOrganization(user);
    const orgId = organization?.id;

    if (!orgId && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Organization scope unavailable.');
    }

    const orgWhere = orgId ? { organizationId: orgId } : {};

    const [
      activeProjectsCount,
      totalProblemStatements,
      draftCount,
      submittedCount,
      underReviewCount,
      changesRequestedCount,
      approvedCount,
      rejectedCount,
      pendingDeliverablesCount,
      upcomingMeetingsCount,
      openQueriesCount,
      recentProblemStatements,
      activeProjectsList,
      upcomingMeetingsList,
      recentDeliverablesList,
      openQueriesList,
    ] = await Promise.all([
      // 1. Active Projects Count
      this.prisma.project.count({
        where: { ...orgWhere, status: { not: 'CANCELLED' } },
      }),
      // 2. Total Problem Statements
      this.prisma.problemStatement.count({ where: orgWhere }),
      // 3. Status Breakdown
      this.prisma.problemStatement.count({ where: { ...orgWhere, status: 'DRAFT' } }),
      this.prisma.problemStatement.count({ where: { ...orgWhere, status: 'SUBMITTED' } }),
      this.prisma.problemStatement.count({ where: { ...orgWhere, status: 'UNDER_REVIEW' } }),
      this.prisma.problemStatement.count({ where: { ...orgWhere, status: 'CHANGES_REQUESTED' } }),
      this.prisma.problemStatement.count({ where: { ...orgWhere, status: 'APPROVED' } }),
      this.prisma.problemStatement.count({ where: { ...orgWhere, status: 'REJECTED' } }),
      // 4. Pending Deliverables for Organization Projects
      this.prisma.projectDeliverable.count({
        where: {
          project: orgWhere,
          isClientVisible: true,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW', 'REVISION_REQUESTED'] },
        },
      }),
      // 5. Upcoming Meetings
      this.prisma.projectMeeting.count({
        where: {
          project: orgWhere,
          isClientVisible: true,
          startDateTime: { gte: new Date() },
          status: { in: ['SCHEDULED', 'REQUESTED'] },
        },
      }),
      // 6. Open Queries
      this.prisma.supportQuery.count({
        where: {
          ...orgWhere,
          status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_FOR_CLIENT'] },
        },
      }),
      // 7. Recent Problem Statements
      this.prisma.problemStatement.findMany({
        where: orgWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { businessVertical: true, project: { select: { id: true, projectCode: true, status: true } } },
      }),
      // 8. Active Projects List
      this.prisma.project.findMany({
        where: { ...orgWhere, status: { not: 'CANCELLED' } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          businessVertical: true,
          milestones: { where: { isClientVisible: true }, orderBy: { sequence: 'asc' }, take: 1 },
        },
      }),
      // 9. Upcoming Meetings List
      this.prisma.projectMeeting.findMany({
        where: {
          project: orgWhere,
          isClientVisible: true,
          startDateTime: { gte: new Date() },
        },
        take: 5,
        orderBy: { startDateTime: 'asc' },
        include: { project: { select: { id: true, projectCode: true, title: true } } },
      }),
      // 10. Recent Deliverables List
      this.prisma.projectDeliverable.findMany({
        where: {
          project: orgWhere,
          isClientVisible: true,
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { project: { select: { id: true, projectCode: true, title: true } } },
      }),
      // 11. Open Queries List
      this.prisma.supportQuery.findMany({
        where: orgWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { relatedProject: { select: { id: true, projectCode: true, title: true } } },
      }),
    ]);

    return {
      metrics: {
        activeProjects: activeProjectsCount,
        totalProblemStatements,
        draftCount,
        submittedCount,
        underReviewCount,
        changesRequestedCount,
        approvedCount,
        rejectedCount,
        pendingReviews: changesRequestedCount + underReviewCount,
        pendingDeliverables: pendingDeliverablesCount,
        upcomingMeetings: upcomingMeetingsCount,
        openQueries: openQueriesCount,
      },
      organization: organization
        ? {
            id: organization.id,
            orgNumber: organization.orgNumber,
            legalName: organization.legalName,
            tradeName: organization.tradeName,
            type: organization.type,
            applicantType: organization.applicantType,
            primaryBv: organization.primaryBv,
            status: organization.status,
          }
        : null,
      recentProblemStatements,
      activeProjects: activeProjectsList,
      upcomingMeetings: upcomingMeetingsList,
      recentDeliverables: recentDeliverablesList,
      openQueries: openQueriesList,
    };
  }

  /**
   * IND-02 Organization Profile View
   */
  async getProfile(user: any) {
    const { user: dbUser, organization } = await this.validateIndustryOrganization(user);
    if (!organization) {
      throw new NotFoundException('Industry organization profile not found.');
    }

    const [documents, orgUsersList] = await Promise.all([
      this.prisma.document.findMany({
        where: { entityType: 'Organization', entityId: organization.id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.organizationUser.findMany({
        where: { organizationId: organization.id },
        include: { user: { select: { id: true, email: true, status: true, lastLoginAt: true } } },
      }),
    ]);

    return {
      organization,
      primaryContact: {
        id: dbUser.id,
        email: dbUser.email,
        status: dbUser.status,
      },
      representatives: orgUsersList,
      documents,
    };
  }

  /**
   * IND-03 Paginated Problem Statements Queue with boundary isolation
   */
  async getProblemStatements(
    user: any,
    page = 1,
    limit = 20,
    status?: string,
    search?: string,
    bvId?: string,
  ) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const skip = (page - 1) * limit;
    const whereAnd: any[] = [];

    if (!isAdmin) {
      if (!organization) throw new ForbiddenException('Organization context missing.');
      whereAnd.push({ organizationId: organization.id });
    }

    if (status && status.trim()) {
      whereAnd.push({ status: status.trim() as any });
    }

    if (bvId && bvId.trim()) {
      whereAnd.push({ bvId: bvId.trim() });
    }

    if (search && search.trim()) {
      whereAnd.push({
        OR: [
          { title: { contains: search.trim(), mode: 'insensitive' as const } },
          { code: { contains: search.trim(), mode: 'insensitive' as const } },
          { category: { contains: search.trim(), mode: 'insensitive' as const } },
          { department: { contains: search.trim(), mode: 'insensitive' as const } },
        ],
      });
    }

    const where = whereAnd.length > 0 ? { AND: whereAnd } : {};

    const [items, total] = await Promise.all([
      this.prisma.problemStatement.findMany({
        where,
        skip,
        take: limit,
        include: {
          businessVertical: true,
          organization: { select: { id: true, legalName: true, orgNumber: true } },
          createdBy: { select: { id: true, email: true } },
          project: { select: { id: true, projectCode: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.problemStatement.count({ where }),
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
   * IND-05 Multi-Step Submit or Save Draft Problem Statement
   */
  async createProblemStatement(
    user: any,
    data: {
      title: string;
      bvId: string;
      department?: string;
      category?: string;
      priority?: string;
      currentSituation?: string;
      description: string;
      existingProcess?: string;
      currentTechnology?: string;
      businessImpact?: string;
      desiredSolution?: string;
      expectedBenefits?: string;
      successCriteria?: string;
      expectedTimeline?: string;
      budgetEstimate?: string;
      documentStorageKeys?: string[];
      isDraft?: boolean;
    },
  ) {
    const { organization } = await this.validateIndustryOrganization(user);
    if (!organization) {
      throw new ForbiddenException('Cannot submit problem statement without an approved organization context.');
    }

    const bv = await this.prisma.businessVertical.findUnique({
      where: { id: data.bvId },
    });
    if (!bv) {
      throw new BadRequestException(`Business Vertical with ID '${data.bvId}' does not exist.`);
    }

    const code = await this.generatePsCode();
    const status = data.isDraft ? 'DRAFT' : 'SUBMITTED';

    const result = await this.prisma.$transaction(async (tx) => {
      const ps = await tx.problemStatement.create({
        data: {
          code,
          organizationId: organization.id,
          createdById: user.id,
          bvId: data.bvId,
          title: data.title.trim(),
          department: data.department?.trim() || null,
          category: data.category?.trim() || null,
          priority: data.priority?.trim() || 'MEDIUM',
          currentSituation: data.currentSituation?.trim() || null,
          description: data.description.trim(),
          existingProcess: data.existingProcess?.trim() || null,
          currentTechnology: data.currentTechnology?.trim() || null,
          businessImpact: data.businessImpact?.trim() || null,
          desiredSolution: data.desiredSolution?.trim() || null,
          expectedBenefits: data.expectedBenefits?.trim() || null,
          successCriteria: data.successCriteria?.trim() || null,
          budgetEstimate: data.budgetEstimate?.trim() || null,
          expectedTimeline: data.expectedTimeline?.trim() || null,
          status,
        },
        include: {
          businessVertical: true,
          organization: { select: { id: true, legalName: true, orgNumber: true } },
        },
      });

      if (data.documentStorageKeys && data.documentStorageKeys.length > 0) {
        for (const storageKey of data.documentStorageKeys) {
          await tx.document.create({
            data: {
              entityType: 'ProblemStatement',
              entityId: ps.id,
              type: 'TechnicalSpecification',
              storageKey,
              visibility: 'PRIVATE',
              uploadedBy: user.id,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: data.isDraft ? 'SAVE_DRAFT_PROBLEM_STATEMENT' : 'SUBMIT_PROBLEM_STATEMENT',
          entityType: 'PROBLEM_STATEMENT',
          entityId: ps.id,
          afterJson: {
            code: ps.code,
            title: ps.title,
            bvCode: bv.code,
            status,
            organizationId: organization.id,
          },
        },
      });

      if (!data.isDraft) {
        await tx.notification.create({
          data: {
            recipientUserId: user.id,
            eventType: 'PROBLEM_STATEMENT_SUBMITTED',
            entityType: 'PROBLEM_STATEMENT',
            entityId: ps.id,
            message: `Problem Statement (${ps.code}) '${ps.title}' was submitted successfully and is queued for review.`,
          },
        });
      }

      return ps;
    });

    return result;
  }

  /**
   * IND-04 Problem Statement Detail View with audit log timeline
   */
  async getProblemStatementById(user: any, id: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const ps = await this.prisma.problemStatement.findUnique({
      where: { id },
      include: {
        businessVertical: true,
        organization: { select: { id: true, legalName: true, orgNumber: true, type: true } },
        createdBy: { select: { id: true, email: true } },
        project: {
          select: {
            id: true,
            projectCode: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!ps) {
      throw new NotFoundException(`Problem Statement with ID '${id}' not found.`);
    }

    if (!isAdmin) {
      if (!organization || ps.organizationId !== organization.id) {
        throw new ForbiddenException('Access denied: You do not have permission to view this problem statement.');
      }
    }

    const [documents, auditLogs] = await Promise.all([
      this.prisma.document.findMany({
        where: { entityType: 'ProblemStatement', entityId: id },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'PROBLEM_STATEMENT', entityId: id },
        orderBy: { createdAt: 'asc' },
        include: { actor: { select: { id: true, email: true } } },
      }),
    ]);

    return {
      ...ps,
      documents,
      auditTimeline: auditLogs,
    };
  }

  /**
   * Edit / Resubmit Problem Statement
   */
  async updateProblemStatement(user: any, id: string, data: any) {
    const { organization } = await this.validateIndustryOrganization(user);
    const ps = await this.prisma.problemStatement.findUnique({ where: { id } });

    if (!ps) throw new NotFoundException(`Problem Statement with ID '${id}' not found.`);
    if (ps.organizationId !== organization?.id && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Access denied.');
    }

    if (ps.status !== 'DRAFT' && ps.status !== 'CHANGES_REQUESTED') {
      throw new BadRequestException(`Cannot update problem statement in status '${ps.status}'.`);
    }

    const targetStatus = data.isDraft ? 'DRAFT' : 'SUBMITTED';

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.problemStatement.update({
        where: { id },
        data: {
          title: data.title ? data.title.trim() : ps.title,
          department: data.department !== undefined ? data.department.trim() : ps.department,
          category: data.category !== undefined ? data.category.trim() : ps.category,
          priority: data.priority || ps.priority,
          currentSituation: data.currentSituation !== undefined ? data.currentSituation.trim() : ps.currentSituation,
          description: data.description ? data.description.trim() : ps.description,
          existingProcess: data.existingProcess !== undefined ? data.existingProcess.trim() : ps.existingProcess,
          currentTechnology: data.currentTechnology !== undefined ? data.currentTechnology.trim() : ps.currentTechnology,
          businessImpact: data.businessImpact !== undefined ? data.businessImpact.trim() : ps.businessImpact,
          desiredSolution: data.desiredSolution !== undefined ? data.desiredSolution.trim() : ps.desiredSolution,
          expectedBenefits: data.expectedBenefits !== undefined ? data.expectedBenefits.trim() : ps.expectedBenefits,
          successCriteria: data.successCriteria !== undefined ? data.successCriteria.trim() : ps.successCriteria,
          budgetEstimate: data.budgetEstimate !== undefined ? data.budgetEstimate.trim() : ps.budgetEstimate,
          expectedTimeline: data.expectedTimeline !== undefined ? data.expectedTimeline.trim() : ps.expectedTimeline,
          status: targetStatus,
        },
        include: { businessVertical: true, organization: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: data.isDraft ? 'UPDATE_DRAFT_PROBLEM_STATEMENT' : 'RESUBMIT_PROBLEM_STATEMENT',
          entityType: 'PROBLEM_STATEMENT',
          entityId: id,
          beforeJson: { status: ps.status },
          afterJson: { status: targetStatus, updatedBy: user.id },
        },
      });

      return updated;
    });
  }

  /**
   * IND-06 Organization Scoped Projects List
   */
  async getProjects(user: any, page = 1, limit = 20, search?: string, status?: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const skip = (page - 1) * limit;
    const whereAnd: any[] = [];

    if (!isAdmin) {
      if (!organization) throw new ForbiddenException('Organization context missing.');
      whereAnd.push({ organizationId: organization.id });
    }

    if (status && status.trim()) {
      whereAnd.push({ status: status.trim() as any });
    }

    if (search && search.trim()) {
      whereAnd.push({
        OR: [
          { title: { contains: search.trim(), mode: 'insensitive' as const } },
          { projectCode: { contains: search.trim(), mode: 'insensitive' as const } },
        ],
      });
    }

    const where = whereAnd.length > 0 ? { AND: whereAnd } : {};

    const [items, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          businessVertical: true,
          problemStatement: { select: { id: true, code: true, title: true } },
          milestones: {
            where: { isClientVisible: true },
            orderBy: { sequence: 'asc' },
            take: 1,
          },
          _count: {
            select: {
              deliverables: { where: { isClientVisible: true } },
              meetings: { where: { isClientVisible: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
   * IND-07 Organization Project Workspace Detail (Client Scoped)
   */
  async getProjectById(user: any, id: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        businessVertical: true,
        problemStatement: { select: { id: true, code: true, title: true } },
        organization: { select: { id: true, legalName: true, orgNumber: true } },
        milestones: {
          where: { isClientVisible: true },
          orderBy: { sequence: 'asc' },
        },
        deliverables: {
          where: { isClientVisible: true },
          orderBy: { createdAt: 'desc' },
        },
        meetings: {
          where: { isClientVisible: true },
          orderBy: { startDateTime: 'desc' },
        },
        resourceLinks: {
          where: { isClientVisible: true },
        },
      },
    });

    if (!project) throw new NotFoundException(`Project with ID '${id}' not found.`);
    if (!isAdmin && project.organizationId !== organization?.id) {
      throw new ForbiddenException('Access denied: You do not have access to this project.');
    }

    const documents = await this.prisma.document.findMany({
      where: { entityType: 'Project', entityId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...project,
      documents,
    };
  }

  /**
   * IND-08 Organization Deliverables List
   */
  async getDeliverables(user: any, page = 1, limit = 20, status?: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const skip = (page - 1) * limit;
    const whereAnd: any[] = [{ isClientVisible: true }];

    if (!isAdmin) {
      if (!organization) throw new ForbiddenException('Organization context missing.');
      whereAnd.push({ project: { organizationId: organization.id } });
    }

    if (status && status.trim()) {
      whereAnd.push({ status: status.trim() as any });
    }

    const where = { AND: whereAnd };

    const [items, total] = await Promise.all([
      this.prisma.projectDeliverable.findMany({
        where,
        skip,
        take: limit,
        include: {
          project: { select: { id: true, projectCode: true, title: true } },
          milestone: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.projectDeliverable.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * IND-09 Review Deliverable (Approve / Request Changes)
   */
  async reviewDeliverable(
    user: any,
    deliverableId: string,
    decision: 'APPROVED' | 'CHANGES_REQUESTED',
    reviewNotes?: string,
  ) {
    const { organization } = await this.validateIndustryOrganization(user);

    const deliverable = await this.prisma.projectDeliverable.findUnique({
      where: { id: deliverableId },
      include: { project: true },
    });

    if (!deliverable) throw new NotFoundException(`Deliverable '${deliverableId}' not found.`);
    if (deliverable.project.organizationId !== organization?.id && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Access denied.');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.projectDeliverable.update({
        where: { id: deliverableId },
        data: {
          status: decision === 'APPROVED' ? 'APPROVED' : 'REVISION_REQUESTED',
          reviewedById: user.id,
          reviewedAt: new Date(),
          reviewNotes: reviewNotes?.trim() || null,
        },
        include: { project: { select: { id: true, projectCode: true, title: true } } },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: `CLIENT_${decision}_DELIVERABLE`,
          entityType: 'PROJECT_DELIVERABLE',
          entityId: deliverableId,
          afterJson: { decision, reviewNotes, reviewedBy: user.id },
        },
      });

      return updated;
    });
  }

  /**
   * IND-10 Organization Meetings List
   */
  async getMeetings(user: any, page = 1, limit = 20) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const skip = (page - 1) * limit;
    const where: any = { isClientVisible: true };
    if (!isAdmin) {
      if (!organization) throw new ForbiddenException('Organization context missing.');
      where.project = { organizationId: organization.id };
    }

    const [items, total] = await Promise.all([
      this.prisma.projectMeeting.findMany({
        where,
        skip,
        take: limit,
        include: { project: { select: { id: true, projectCode: true, title: true } } },
        orderBy: { startDateTime: 'desc' },
      }),
      this.prisma.projectMeeting.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * Request Meeting
   */
  async requestMeeting(user: any, data: { projectId: string; title: string; description?: string; preferredDateTime: string }) {
    const { organization } = await this.validateIndustryOrganization(user);

    const project = await this.prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) throw new NotFoundException(`Project '${data.projectId}' not found.`);
    if (project.organizationId !== organization?.id && !user.roles?.includes('ADMIN')) {
      throw new ForbiddenException('Access denied.');
    }

    const startDateTime = new Date(data.preferredDateTime);
    const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // 1 hour default

    return this.prisma.projectMeeting.create({
      data: {
        projectId: data.projectId,
        title: data.title.trim(),
        description: data.description?.trim() || 'Meeting requested by client representative.',
        meetingUrl: 'TBD (Will be updated by AnveshakHub Coordinator)',
        meetingProvider: 'GOOGLE_MEET',
        startDateTime,
        endDateTime,
        status: 'REQUESTED',
        isClientVisible: true,
        createdById: user.id,
      },
    });
  }

  /**
   * IND-11 Organization Documents Library
   */
  async getDocuments(user: any, page = 1, limit = 20, type?: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    if (!organization) throw new ForbiddenException('Organization context missing.');

    const skip = (page - 1) * limit;

    // Fetch problem statements and projects belonging to this organization to allow fetching linked docs
    const [orgPsList, orgPrjList] = await Promise.all([
      this.prisma.problemStatement.findMany({ where: { organizationId: organization.id }, select: { id: true } }),
      this.prisma.project.findMany({ where: { organizationId: organization.id }, select: { id: true } }),
    ]);

    const psIds = orgPsList.map((p) => p.id);
    const prjIds = orgPrjList.map((p) => p.id);

    const whereOr: any[] = [
      { entityType: 'Organization', entityId: organization.id },
      { entityType: 'ProblemStatement', entityId: { in: psIds } },
      { entityType: 'Project', entityId: { in: prjIds } },
    ];

    const where: any = { OR: whereOr };
    if (type && type.trim()) {
      where.type = type.trim();
    }

    const [items, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * IND-12 Support Queries List
   */
  async getQueries(user: any, page = 1, limit = 20, status?: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const skip = (page - 1) * limit;
    const where: any = {};
    if (!isAdmin) {
      if (!organization) throw new ForbiddenException('Organization context missing.');
      where.organizationId = organization.id;
    }

    if (status && status.trim()) {
      where.status = status.trim();
    }

    const [items, total] = await Promise.all([
      this.prisma.supportQuery.findMany({
        where,
        skip,
        take: limit,
        include: {
          relatedProject: { select: { id: true, projectCode: true, title: true } },
          relatedProblem: { select: { id: true, code: true, title: true } },
          messages: { take: 1, orderBy: { createdAt: 'desc' } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.supportQuery.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * IND-13 Create Support Query
   */
  async createQuery(user: any, data: {
    subject: string;
    category: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    description: string;
    relatedProjectId?: string;
    relatedProblemId?: string;
  }) {
    const { organization } = await this.validateIndustryOrganization(user);
    if (!organization) throw new ForbiddenException('Organization context missing.');

    const queryNumber = await this.generateQueryNumber();

    const query = await this.prisma.$transaction(async (tx) => {
      const q = await tx.supportQuery.create({
        data: {
          queryNumber,
          organizationId: organization.id,
          createdById: user.id,
          subject: data.subject.trim(),
          category: data.category.trim(),
          priority: data.priority || 'MEDIUM',
          description: data.description.trim(),
          relatedProjectId: data.relatedProjectId || null,
          relatedProblemId: data.relatedProblemId || null,
          status: 'OPEN',
        },
      });

      await tx.supportQueryMessage.create({
        data: {
          queryId: q.id,
          senderId: user.id,
          senderName: user.email,
          senderRole: 'ORG_USER',
          message: data.description.trim(),
        },
      });

      return q;
    });

    if (this.emailService) {
      await this.emailService.sendTransactionalEmail({
        to: user.email,
        subject: `🎫 Support Ticket Created — ${query.queryNumber}`,
        html: `<h2>Support Query Logged (${query.queryNumber})</h2><p>Subject: <strong>${query.subject}</strong></p><p>Status: OPEN</p>`,
        category: 'SUPPORT_QUERY' as any,
      });
    }

    return query;
  }

  /**
   * IND-14 Get Support Query Detail & Conversation Thread
   */
  async getQueryById(user: any, id: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const query = await this.prisma.supportQuery.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, legalName: true, orgNumber: true } },
        relatedProject: { select: { id: true, projectCode: true, title: true } },
        relatedProblem: { select: { id: true, code: true, title: true } },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!query) throw new NotFoundException(`Query '${id}' not found.`);
    if (!isAdmin && query.organizationId !== organization?.id) {
      throw new ForbiddenException('Access denied.');
    }

    return query;
  }

  /**
   * Add Message to Support Query
   */
  async addQueryMessage(user: any, queryId: string, message: string) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const query = await this.prisma.supportQuery.findUnique({ where: { id: queryId } });
    if (!query) throw new NotFoundException(`Query '${queryId}' not found.`);
    if (!isAdmin && query.organizationId !== organization?.id) {
      throw new ForbiddenException('Access denied.');
    }

    return this.prisma.$transaction(async (tx) => {
      const msg = await tx.supportQueryMessage.create({
        data: {
          queryId,
          senderId: user.id,
          senderName: user.email,
          senderRole: isAdmin ? 'ADMIN' : 'ORG_USER',
          message: message.trim(),
        },
      });

      await tx.supportQuery.update({
        where: { id: queryId },
        data: {
          status: isAdmin ? 'WAITING_FOR_CLIENT' : 'IN_PROGRESS',
          updatedAt: new Date(),
        },
      });

      return msg;
    });
  }

  /**
   * Configurable Official Contact Information
   */
  async getContactInfo() {
    return {
      adminName: 'AnveshakHub Corporate Support Desk',
      phone: '+91 (080) 2838-2345',
      email: 'support@anveshakhub.com',
      escalationEmail: 'escalations@anveshakhub.com',
      officeHours: 'Monday - Friday (09:00 AM - 06:00 PM IST)',
      templates: [
        { key: 'GENERAL', label: '1. General Query', subject: 'General Support Request', category: 'General' },
        { key: 'PROJECT', label: '2. Project Status & Deliverables Query', subject: 'Project Status Update Request', category: 'Project' },
        { key: 'PROBLEM_STATEMENT', label: '3. Problem Statement & Scope Query', subject: 'Problem Statement Scope Discussion', category: 'Problem Statement' },
        { key: 'TECHNICAL', label: '4. Technical Assistance & System Support', subject: 'Technical Support Request', category: 'Technical' },
        { key: 'MEETING', label: '5. Meeting Schedule Request', subject: 'Meeting Coordination Request', category: 'Meeting' },
        { key: 'COMMERCIAL', label: '6. Commercial & Billing Query', subject: 'Commercial / Invoice Inquiry', category: 'Commercial' },
        { key: 'OTHER', label: '7. Other Inquiry', subject: 'Platform Assistance Request', category: 'Other' },
      ],
    };
  }

  /**
   * ADMIN Problem Statement Decision: APPROVE, REJECT, REQUEST_CHANGES
   */
  async processAdminDecision(
    id: string,
    adminUserId: string,
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES',
    reason?: string,
  ) {
    const ps = await this.prisma.problemStatement.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!ps) {
      throw new NotFoundException(`Problem Statement with ID '${id}' not found.`);
    }

    if (ps.status === 'APPROVED' || ps.status === 'REJECTED' || ps.status === 'CLOSED') {
      throw new BadRequestException(
        `Cannot process decision on Problem Statement '${ps.code}' because it is in terminal state '${ps.status}'.`,
      );
    }

    if ((decision === 'REJECT' || decision === 'REQUEST_CHANGES') && (!reason || !reason.trim())) {
      throw new BadRequestException(`A mandatory reason must be provided for ${decision === 'REJECT' ? 'Rejection' : 'Change Request'}.`);
    }

    let targetStatus: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
    let auditAction: string;

    if (decision === 'APPROVE') {
      targetStatus = 'APPROVED';
      auditAction = 'APPROVE_PROBLEM_STATEMENT';
    } else if (decision === 'REJECT') {
      targetStatus = 'REJECTED';
      auditAction = 'REJECT_PROBLEM_STATEMENT';
    } else {
      targetStatus = 'CHANGES_REQUESTED';
      auditAction = 'REQUEST_PROBLEM_STATEMENT_CHANGES';
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedPs = await tx.problemStatement.update({
        where: { id },
        data: { status: targetStatus },
        include: {
          businessVertical: true,
          organization: { select: { id: true, legalName: true, orgNumber: true } },
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: auditAction,
          entityType: 'PROBLEM_STATEMENT',
          entityId: id,
          beforeJson: { status: ps.status },
          afterJson: {
            code: ps.code,
            title: ps.title,
            status: targetStatus,
            decision,
            reason: reason?.trim() || null,
            decidedBy: adminUserId,
          },
        },
      });

      let notifMessage = `Your Problem Statement (${ps.code}) '${ps.title}' has been `;
      if (decision === 'APPROVE') notifMessage += 'APPROVED by Admin. Project instantiation is now available.';
      else if (decision === 'REJECT') notifMessage += `REJECTED. Reason: ${reason?.trim()}`;
      else notifMessage += `returned for changes. Required action: ${reason?.trim()}`;

      await tx.notification.create({
        data: {
          recipientUserId: ps.createdById,
          eventType: `PROBLEM_STATEMENT_${targetStatus}`,
          entityType: 'PROBLEM_STATEMENT',
          entityId: id,
          message: notifMessage,
        },
      });

      return updatedPs;
    });

    return result;
  }

  /**
   * Standalone ADMIN Project Creation from an APPROVED Problem Statement
   */
  async createProjectFromProblemStatement(id: string, adminUserId: string) {
    const ps = await this.prisma.problemStatement.findUnique({
      where: { id },
      include: {
        project: true,
        organization: true,
        businessVertical: true,
      },
    });

    if (!ps) {
      throw new NotFoundException(`Problem Statement with ID '${id}' not found.`);
    }

    if (ps.status !== 'APPROVED') {
      throw new BadRequestException(
        `Projects can only be created for Problem Statements in APPROVED status. Current status is '${ps.status}'.`,
      );
    }

    if (ps.project) {
      throw new ConflictException(
        `Problem Statement '${ps.code}' already has an associated Project '${ps.project.projectCode}'.`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const projectCode = await this.generateProjectCode(tx);
      const project = await tx.project.create({
        data: {
          projectCode,
          organizationId: ps.organizationId,
          problemStatementId: ps.id,
          bvId: ps.bvId,
          createdById: adminUserId,
          title: ps.title,
          description: ps.description,
          category: ps.category,
          budget: ps.budgetEstimate,
          timeline: ps.expectedTimeline,
          status: 'INITIATED',
        },
        include: {
          organization: { select: { id: true, legalName: true, orgNumber: true, type: true } },
          problemStatement: { select: { id: true, code: true, title: true } },
          businessVertical: true,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: adminUserId,
          action: 'CREATE_PROJECT',
          entityType: 'PROJECT',
          entityId: project.id,
          afterJson: {
            projectCode: project.projectCode,
            title: project.title,
            problemStatementCode: ps.code,
            organizationId: ps.organizationId,
            status: project.status,
          },
        },
      });

      await tx.notification.create({
        data: {
          recipientUserId: ps.createdById,
          eventType: 'PROJECT_CREATED',
          entityType: 'PROJECT',
          entityId: project.id,
          message: `Project (${project.projectCode}) '${project.title}' has been formally instantiated from your approved problem statement.`,
        },
      });

      return project;
    });

    return result;
  }
}
