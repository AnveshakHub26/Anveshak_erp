import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SupabaseService } from '../../common/supabase/supabase.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() private supabaseService?: SupabaseService,
  ) {}

  async create(data: {
    recipientUserId: string;
    eventType: string;
    entityType: string;
    entityId: string;
    message: string;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        recipientUserId: data.recipientUserId,
        eventType: data.eventType,
        entityType: data.entityType,
        entityId: data.entityId,
        message: data.message,
      },
    });

    // Supabase Realtime Event Broadcast (if operational)
    if (this.supabaseService?.isOperational && this.supabaseService?.getClient()) {
      try {
        const client = this.supabaseService.getClient();
        const channel = client?.channel(`notifications:${data.recipientUserId}`);
        await channel?.send({
          type: 'broadcast',
          event: 'notification_created',
          payload: notification,
        });
      } catch {
        // Fallback silently
      }
    }

    return notification;
  }

  async findForUser(userId: string, unreadOnly = false) {
    const where: any = { recipientUserId: userId };
    if (unreadOnly) {
      where.readAt = null;
    }

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id: notificationId, recipientUserId: userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { recipientUserId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
