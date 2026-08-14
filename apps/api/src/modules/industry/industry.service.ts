import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class IndustryService {
  constructor(private prisma: PrismaService) {}

  private async generatePsCode(): Promise<string> {
    const count = await this.prisma.problemStatement.count();
    const nextSeq = (count + 1).toString().padStart(4, '0');
    return `PS-2026-${nextSeq}`;
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
   * Enforces Industry organization authentication, APPROVED status, and Industry classification gate
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
        throw new ForbiddenException(`Access denied: Organization status is '${org.status}'. Approved Industry status required.`);
      }

      if (org.applicantType !== 'Industry') {
        throw new ForbiddenException(`Access denied: Organization classification is '${org.applicantType}'. Industry classification required.`);
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

    const where = orgId ? { organizationId: orgId } : {};

    const [total, draft, submitted, underReview, published, recent] = await Promise.all([
      this.prisma.problemStatement.count({ where }),
      this.prisma.problemStatement.count({ where: { ...where, status: 'DRAFT' } }),
      this.prisma.problemStatement.count({ where: { ...where, status: 'SUBMITTED' } }),
      this.prisma.problemStatement.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
      this.prisma.problemStatement.count({
        where: {
          ...where,
          status: { in: ['PUBLISHED', 'ACCEPTED'] },
        },
      }),
      this.prisma.problemStatement.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { businessVertical: true },
      }),
    ]);

    return {
      metrics: {
        totalProblemStatements: total,
        draftCount: draft,
        submittedCount: submitted,
        underReviewCount: underReview,
        publishedCount: published,
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
      recentProblemStatements: recent,
    };
  }

  /**
   * IND-02 Industry Profile view
   */
  async getProfile(user: any) {
    const { user: dbUser, organization } = await this.validateIndustryOrganization(user);
    if (!organization) {
      throw new NotFoundException('Industry organization profile not found.');
    }

    const documents = await this.prisma.document.findMany({
      where: { entityType: 'Organization', entityId: organization.id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      organization,
      primaryContact: {
        id: dbUser.id,
        email: dbUser.email,
        status: dbUser.status,
      },
      documents,
    };
  }

  /**
   * IND-03 Problem Statements Queue with boundary isolation
   */
  async getProblemStatements(
    user: any,
    page = 1,
    limit = 20,
    status?: string,
    search?: string,
  ) {
    const { organization } = await this.validateIndustryOrganization(user);
    const isAdmin = user.roles?.includes('ADMIN');

    const skip = (page - 1) * limit;
    const whereAnd: any[] = [];

    // Enforce multi-tenant organization boundary isolation for non-ADMIN users
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
          { code: { contains: search.trim(), mode: 'insensitive' as const } },
          { category: { contains: search.trim(), mode: 'insensitive' as const } },
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
   * IND-05 Submit or Save Draft Problem Statement
   */
  async createProblemStatement(
    user: any,
    data: {
      title: string;
      description: string;
      bvId: string;
      category?: string;
      budgetEstimate?: string;
      expectedTimeline?: string;
      documentStorageKeys?: string[];
      isDraft?: boolean;
    },
  ) {
    const { organization } = await this.validateIndustryOrganization(user);
    if (!organization) {
      throw new ForbiddenException('Cannot submit problem statement without an approved organization context.');
    }

    // Verify Business Vertical master record existence
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
          description: data.description.trim(),
          category: data.category?.trim() || null,
          budgetEstimate: data.budgetEstimate?.trim() || null,
          expectedTimeline: data.expectedTimeline?.trim() || null,
          status,
        },
        include: {
          businessVertical: true,
          organization: { select: { id: true, legalName: true, orgNumber: true } },
        },
      });

      // Link any attached technical documents to the ProblemStatement entity
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
   * IND-04 Problem Statement Detail View with strict boundary check
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
      },
    });

    if (!ps) {
      throw new NotFoundException(`Problem Statement with ID '${id}' not found.`);
    }

    // Strict boundary enforcement: non-ADMIN user can only read problem statements belonging to their organization
    if (!isAdmin) {
      if (!organization || ps.organizationId !== organization.id) {
        throw new ForbiddenException('Access denied: You do not have permission to view this problem statement.');
      }
    }

    const documents = await this.prisma.document.findMany({
      where: { entityType: 'ProblemStatement', entityId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...ps,
      documents,
    };
  }

  /**
   * ADMIN Problem Statement Decision: APPROVE (-> APPROVED), REJECT (-> REJECTED), REQUEST_CHANGES (-> CHANGES_REQUESTED)
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
