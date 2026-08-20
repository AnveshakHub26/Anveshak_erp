import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../database/prisma.service';

describe('NotificationsService — Phase 5D Verification', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should create an in-app notification for recipient user', async () => {
    mockPrisma.notification.create.mockResolvedValue({
      id: 'notif-1',
      recipientUserId: 'user-emp-1',
      eventType: 'LEAVE_SUBMITTED',
      entityType: 'LeaveRequest',
      entityId: 'lr-100',
      message: 'Your leave request LR-2026-000001 has been submitted.',
      readAt: null,
      createdAt: new Date(),
    });

    const notif = await service.create({
      recipientUserId: 'user-emp-1',
      eventType: 'LEAVE_SUBMITTED',
      entityType: 'LeaveRequest',
      entityId: 'lr-100',
      message: 'Your leave request LR-2026-000001 has been submitted.',
    });

    expect(notif.recipientUserId).toBe('user-emp-1');
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        recipientUserId: 'user-emp-1',
        eventType: 'LEAVE_SUBMITTED',
        entityType: 'LeaveRequest',
        entityId: 'lr-100',
        message: 'Your leave request LR-2026-000001 has been submitted.',
      },
    });
  });

  it('should list notifications scoped strictly to logged-in recipient user', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: 'notif-1', recipientUserId: 'user-emp-1', eventType: 'LEAVE_APPROVED' },
    ]);

    const items = await service.findForUser('user-emp-1', false);

    expect(items).toHaveLength(1);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { recipientUserId: 'user-emp-1' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('should filter unread notifications when unreadOnly is true', async () => {
    mockPrisma.notification.findMany.mockResolvedValue([]);

    await service.findForUser('user-emp-1', true);

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { recipientUserId: 'user-emp-1', readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('should prevent marking another user notification as read by scoping by recipientUserId', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 0 });

    await service.markAsRead('notif-belonging-to-other', 'user-emp-1');

    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { id: 'notif-belonging-to-other', recipientUserId: 'user-emp-1' },
      data: { readAt: expect.any(Date) },
    });
  });

  it('should mark all notifications as read for current user', async () => {
    mockPrisma.notification.updateMany.mockResolvedValue({ count: 5 });

    await service.markAllAsRead('user-emp-1');

    expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
      where: { recipientUserId: 'user-emp-1', readAt: null },
      data: { readAt: expect.any(Date) },
    });
  });
});
