import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, WorkshopStatus, WorkshopMode, MeetingProvider } from '@prisma/client';
import { EmailService } from '../../common/email/email.service';

export interface CreateWorkshopInput {
  title: string;
  shortDescription: string;
  description?: string;
  category: string;
  organizer?: string;
  speakerName?: string;
  speakerRole?: string;
  date: string;
  startTime: string;
  endTime: string;
  timezone?: string;
  mode?: WorkshopMode;
  meetingProvider?: MeetingProvider;
  meetingUrl?: string;
  registrationUrl?: string;
  location?: string;
  capacity?: number;
  status?: WorkshopStatus;
  isPublic?: boolean;
  registrationDeadline?: string;
  bannerUrl?: string;
}

export interface UpdateWorkshopInput extends Partial<CreateWorkshopInput> {}

@Injectable()
export class WorkshopsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private emailService?: EmailService,
  ) {}

  /**
   * Public discovery: List published upcoming & completed workshops with public fields ONLY
   */
  async getPublicWorkshops(query?: string, category?: string, type: 'UPCOMING' | 'COMPLETED' | 'ALL' = 'ALL') {
    const where: Prisma.WorkshopWhereInput = {
      isPublic: true,
      status: { in: ['PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
    };

    if (query?.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { shortDescription: { contains: query.trim(), mode: 'insensitive' } },
        { category: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    if (category?.trim() && category !== 'ALL') {
      where.category = category.trim();
    }

    const now = new Date();
    if (type === 'UPCOMING') {
      where.date = { gte: now };
      where.status = { in: ['PUBLISHED', 'ONGOING'] };
    } else if (type === 'COMPLETED') {
      where.OR = [{ date: { lt: now } }, { status: 'COMPLETED' }];
    }

    const workshops = await this.prisma.workshop.findMany({
      where,
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        category: true,
        organizer: true,
        speakerName: true,
        speakerRole: true,
        date: true,
        startTime: true,
        endTime: true,
        timezone: true,
        mode: true,
        location: true,
        status: true,
        registrationUrl: true,
        registrationDeadline: true,
        bannerUrl: true,
      },
    });

    return workshops;
  }

  /**
   * Public detail page: Get single published workshop details
   */
  async getPublicWorkshopById(id: string) {
    const workshop = await this.prisma.workshop.findFirst({
      where: {
        id,
        isPublic: true,
        status: { in: ['PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
      },
      select: {
        id: true,
        title: true,
        shortDescription: true,
        description: true,
        category: true,
        organizer: true,
        speakerName: true,
        speakerRole: true,
        date: true,
        startTime: true,
        endTime: true,
        timezone: true,
        mode: true,
        location: true,
        capacity: true,
        status: true,
        registrationUrl: true,
        registrationDeadline: true,
        bannerUrl: true,
      },
    });

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID '${id}' not found or is not publicly published.`);
    }

    return workshop;
  }

  /**
   * Admin: Search & paginate all workshops (including DRAFTs)
   */
  async getAdminWorkshops(adminUser: any, query?: string, status?: string, category?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where: Prisma.WorkshopWhereInput = {};

    if (query?.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { shortDescription: { contains: query.trim(), mode: 'insensitive' } },
        { category: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }

    if (status?.trim() && status !== 'ALL') {
      where.status = status.trim() as any;
    }

    if (category?.trim() && category !== 'ALL') {
      where.category = category.trim();
    }

    const [items, total] = await Promise.all([
      this.prisma.workshop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          createdBy: { select: { id: true, email: true } },
        },
      }),
      this.prisma.workshop.count({ where }),
    ]);

    return {
      items,
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin: Get workshop detail by ID
   */
  async getAdminWorkshopById(adminUser: any, id: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, email: true } },
      },
    });

    if (!workshop) {
      throw new NotFoundException(`Workshop with ID '${id}' not found.`);
    }

    return workshop;
  }

  /**
   * Admin: Create new workshop
   */
  async createWorkshop(adminUser: any, data: CreateWorkshopInput) {
    if (!data.title?.trim()) throw new BadRequestException('Workshop title is required.');
    if (!data.shortDescription?.trim()) throw new BadRequestException('Workshop short description is required.');
    if (!data.category?.trim()) throw new BadRequestException('Workshop category is required.');
    if (!data.date) throw new BadRequestException('Workshop date is required.');
    if (!data.startTime) throw new BadRequestException('Start time is required.');
    if (!data.endTime) throw new BadRequestException('End time is required.');

    const workshop = await this.prisma.workshop.create({
      data: {
        title: data.title.trim(),
        shortDescription: data.shortDescription.trim(),
        description: data.description?.trim() || null,
        category: data.category.trim(),
        organizer: data.organizer?.trim() || 'AnveshakHub Technical Team',
        speakerName: data.speakerName?.trim() || null,
        speakerRole: data.speakerRole?.trim() || null,
        date: new Date(data.date),
        startTime: data.startTime.trim(),
        endTime: data.endTime.trim(),
        timezone: data.timezone?.trim() || 'IST (UTC+5:30)',
        mode: data.mode || 'ONLINE',
        meetingProvider: data.meetingProvider || 'GOOGLE_MEET',
        meetingUrl: data.meetingUrl?.trim() || null,
        registrationUrl: data.registrationUrl?.trim() || null,
        location: data.location?.trim() || null,
        capacity: data.capacity ? Number(data.capacity) : null,
        status: data.status || 'DRAFT',
        isPublic: data.isPublic !== undefined ? Boolean(data.isPublic) : true,
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline) : null,
        bannerUrl: data.bannerUrl?.trim() || null,
        createdById: adminUser.id,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'CREATE_WORKSHOP',
        entityType: 'WORKSHOP',
        entityId: workshop.id,
        afterJson: workshop as any,
      },
    });

    return workshop;
  }

  /**
   * Admin: Update workshop
   */
  async updateWorkshop(adminUser: any, id: string, data: UpdateWorkshopInput) {
    const existing = await this.prisma.workshop.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Workshop with ID '${id}' not found.`);
    }

    const updateData: Prisma.WorkshopUpdateInput = {};

    if (data.title) updateData.title = data.title.trim();
    if (data.shortDescription) updateData.shortDescription = data.shortDescription.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.category) updateData.category = data.category.trim();
    if (data.organizer) updateData.organizer = data.organizer.trim();
    if (data.speakerName !== undefined) updateData.speakerName = data.speakerName?.trim() || null;
    if (data.speakerRole !== undefined) updateData.speakerRole = data.speakerRole?.trim() || null;
    if (data.date) updateData.date = new Date(data.date);
    if (data.startTime) updateData.startTime = data.startTime.trim();
    if (data.endTime) updateData.endTime = data.endTime.trim();
    if (data.timezone) updateData.timezone = data.timezone.trim();
    if (data.mode) updateData.mode = data.mode;
    if (data.meetingProvider) updateData.meetingProvider = data.meetingProvider;
    if (data.meetingUrl !== undefined) updateData.meetingUrl = data.meetingUrl?.trim() || null;
    if (data.registrationUrl !== undefined) updateData.registrationUrl = data.registrationUrl?.trim() || null;
    if (data.location !== undefined) updateData.location = data.location?.trim() || null;
    if (data.capacity !== undefined) updateData.capacity = data.capacity ? Number(data.capacity) : null;
    if (data.status) updateData.status = data.status;
    if (data.isPublic !== undefined) updateData.isPublic = Boolean(data.isPublic);
    if (data.registrationDeadline !== undefined) updateData.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
    if (data.bannerUrl !== undefined) updateData.bannerUrl = data.bannerUrl?.trim() || null;

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'UPDATE_WORKSHOP',
        entityType: 'WORKSHOP',
        entityId: id,
        beforeJson: existing as any,
        afterJson: updated as any,
      },
    });

    return updated;
  }

  /**
   * Admin: Quick status update (Publish, Cancel, Complete, Save Draft)
   */
  async updateWorkshopStatus(adminUser: any, id: string, status: WorkshopStatus) {
    const existing = await this.prisma.workshop.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Workshop with ID '${id}' not found.`);
    }

    const updated = await this.prisma.workshop.update({
      where: { id },
      data: { status },
    });

    await this.prisma.auditLog.create({
      data: {
        actorUserId: adminUser.id,
        action: 'UPDATE_WORKSHOP_STATUS',
        entityType: 'WORKSHOP',
        entityId: id,
        beforeJson: { status: existing.status },
        afterJson: { status: updated.status },
      },
    });

    // Notify active users when workshop is published
    if (status === 'PUBLISHED' && existing.status !== 'PUBLISHED') {
      const activeUsers = await this.prisma.user.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
        take: 50,
      });

      if (activeUsers.length > 0) {
        await this.prisma.notification.createMany({
          data: activeUsers.map((u) => ({
            recipientUserId: u.id,
            eventType: 'WORKSHOP_PUBLISHED',
            entityType: 'WORKSHOP',
            entityId: id,
            message: `New Technical Workshop Published: "${updated.title}" scheduled for ${new Date(updated.date).toLocaleDateString()}.`,
          })),
        });
      }
    }

    return updated;
  }
}
