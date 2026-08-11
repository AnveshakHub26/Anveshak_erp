import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, data: { email?: string }) {
    // Note: FND-07 user profile updates are strictly limited to permitted contact fields.
    // Roles, permissions, account status, and organization membership mutations are strictly forbidden.
    const existingUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      throw new NotFoundException(`User profile with ID ${userId} not found.`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        // Only permitted fields updated
        ...(data.email && { email: data.email.toLowerCase().trim() }),
      },
      select: {
        id: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: { include: { role: true } },
        orgUsers: { include: { organization: true } },
      },
    });

    // Write audit log for profile update
    await this.prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: 'UPDATE_USER_PROFILE',
        entityType: 'USER',
        entityId: userId,
        afterJson: { email: updatedUser.email },
      },
    });

    return updatedUser;
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          status: true,
          lastLoginAt: true,
          createdAt: true,
          userRoles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: { include: { role: true } },
        orgUsers: { include: { organization: true } },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }
}
